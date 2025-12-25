const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
require("dotenv").config();

const User = require("../model/user");

// ========================= Nodemailer Transporter =========================

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10_000,
});


// ========================= GET LOGIN =========================

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    errorMessage: req.flash("error"),
    oldInput: {
      email: "",
    },
  });
};

// ========================= POST LOGIN =========================

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      path: "/login",
      errorMessage: errors.array()[0].msg,
      oldInput: { email },
    });
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          pageTitle: "Login",
          path: "/login",
          errorMessage: "Invalid email or password.",
          oldInput: { email },
        });
      }

      return bcrypt.compare(password, user.password).then((doMatch) => {
        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(() => res.redirect("/products"));
        }

        return res.status(422).render("auth/login", {
          pageTitle: "Login",
          path: "/login",
          errorMessage: "Invalid email or password.",
          oldInput: { email },
        });
      });
    })
    .catch((err) => next(new Error(err)));
};

// ========================= LOGOUT =========================

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

// ========================= GET SIGNUP =========================

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "/signup",
    errorMessage: req.flash("error"),
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
};

// ========================= POST SIGNUP =========================

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      pageTitle: "Signup",
      path: "/signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email,
        password,
        confirmPassword: req.body.confirmPassword,
      },
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then(() => {
      res.redirect("/login");

      return transporter.sendMail({
        from: `"Valren" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome to Valren! 🎉",
        html: `
          <div style="font-family: Arial; background:#f6f7f9; padding: 30px;">
            <div style="max-width: 520px; margin:auto; background:#fff; padding:25px; border-radius:10px;">
              <h2>👋 Welcome to <span style="color:#4a73fa;">Valren</span></h2>
              <p>Your account has been created successfully ✔️</p>
              <a href="${process.env.BASE_URL}/login"
                style="background:#4a73fa; color:white; padding:10px 20px; 
                       border-radius:6px; text-decoration:none;">
                Go to Dashboard
              </a>
            </div>
          </div>
        `,
      });
    })
    .catch((err) => next(new Error(err)));
};

// ========================= RESET PASSWORD PAGE =========================

exports.getResetPassword = (req, res, next) => {
  res.render("auth/reset", {
    pageTitle: "Reset Password",
    path: "/reset",
    errorMessage: req.flash("error")[0],
  });
};

// ========================= SEND RESET EMAIL =========================

exports.postResetPassword = (req, res, next) => {
  const email = req.body.email;

  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      req.flash("error", "An error occurred!");
      return res.redirect("/reset");
    }

    const token = buffer.toString("hex");

    User.findOne({ email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found!");
          return res.redirect("/reset");
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(() => {
        req.flash("error", "Password reset email sent.");
        res.redirect("/login");

        return transporter.sendMail({
          from: `"Valren" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Reset Your Password – Valren 🔒",
          html: `
            <div style="font-family: Arial; background:#f6f7f9; padding:30px;">
              <div style="max-width:520px; margin:auto; background:#fff; padding:25px; border-radius:10px;">
                <h2>Password Reset</h2>
                <p>Click the button below to reset your password:</p>

                <a href="${process.env.BASE_URL}/reset/${token}"
                  style="background:#4a73fa; color:white; padding:12px 22px; 
                         border-radius:6px; text-decoration:none;">
                  Reset Password
                </a>

                <p>This link is valid for 1 hour.</p>
              </div>
            </div>
          `,
        });
      })
      .catch((err) => next(new Error(err)));
  });
};

// ========================= NEW PASSWORD PAGE =========================

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid or expired link.");
        return res.redirect("/login");
      }

      res.render("auth/new-password", {
        pageTitle: "Update Password",
        path: "/new-password",
        errorMessage: req.flash("error"),
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => next(new Error(err)));
};

// ========================= SAVE NEW PASSWORD =========================

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch((err) => next(new Error(err)));
};

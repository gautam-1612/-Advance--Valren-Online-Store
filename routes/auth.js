const express = require("express");
const { check, body } = require("express-validator");

const authController = require("../controller/auth");
const User = require("../model/user");

const router = express.Router();

router.get("/login", authController.getLogin);
router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("Email cannot be empty.")
      .isEmail()
      .withMessage("Invalid email format.")
      .normalizeEmail(),

    body("password", "Password cannot be empty.").trim().notEmpty(),
  ],
  authController.postLogin
);

router.post("/logout", authController.postLogout);

router.get("/signup", authController.getSignup);
router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid Email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email already exists."); // throw new Error() also works same here.
          }
        });
      })
      .normalizeEmail(),

    body("password", "Password must be minimum 6 characters.")
      .trim()
      .isLength({ min: 6 })
      .isAlphanumeric(),

    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Entered passwords are not identical.");
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.get("/reset", authController.getResetPassword);
router.post("/reset", authController.postResetPassword);

router.get("/reset/:token", authController.getNewPassword);
router.post("/new-password", authController.postNewPassword);

module.exports = router;

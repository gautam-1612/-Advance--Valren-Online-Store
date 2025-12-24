const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorController = require("./controller/error");
const User = require("./model/user");

// ########################## ENV VARIABLES ##########################
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || "fallback_secret";
const PORT = process.env.PORT || 3000;

// ########################## INITIALIZE APP ##########################
const app = express();

// ########################## SESSION STORE ##########################
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

// ########################## CSRF INITIALIZATION ##########################
const csrfProtection = csrf();

// ########################## BODY PARSER + MULTER ##########################
app.use(bodyParser.urlencoded({ extended: false }));

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(multer({ storage: fileStorage, fileFilter }).single("image"));

// ########################## STATIC FILES ##########################
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

// ########################## SESSION ##########################
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// ########################## CSRF PROTECTION ##########################
app.use(csrfProtection);

// ########################## FLASH MESSAGES ##########################
app.use(flash());
app.use(csrfProtection);

// ########################## ATTACH USER TO REQUEST ##########################
app.use((req, res, next) => {
  if (!req.session.user) return next();

  User.findById(req.session.user._id)
    .then((user) => {
      if (user) req.user = user;
      next();
    })
    .catch((err) => next(err));
});

// ########################## TEMPLATE LOCAL VARIABLES ##########################
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session?.isLoggedIn || false;
  res.locals.admin = req.user?.role === "admin" || false;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// ########################## TEMPLATE ENGINE ##########################
app.set("view engine", "ejs");
app.set("views", "views");

// ########################## HELMET for additional headers, COMPRESSION to compress assets & MORGAN for logs ##########################
app.use(helmet({ contentSecurityPolicy: false, }));
app.use(compression());

// ########################## ROUTES ##########################
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// ########################## 404 PAGE ##########################
app.use(errorController.get404);

// ########################## GLOBAL ERROR HANDLER ##########################
app.use((error, req, res, next) => {
  console.log(" GLOBAL ERROR:", error.message);

  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session?.isLoggedIn || false,
  });
});

// ########################## START SERVER AFTER DB CONNECTS ##########################
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Database connection failed!");
    throw err;
  });

exports.clientAuth = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  next();
};

exports.adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.redirect("/");
  }
  next();
};

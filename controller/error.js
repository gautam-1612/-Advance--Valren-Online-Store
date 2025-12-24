exports.get404 = (req, res, next) => {
  res.status(404).render("404", {
    pageTitle: "404, Page not found",
    path: null,
  });
};

exports.get505 = (req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Some error occured",
    path: null,
  });
};

const deleteProduct = (btn) => {
  const prodId = btn.parentNode.querySelector("[name=productID]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;
  console.log("click");
  fetch("/admin/products/" + prodId, {
    method: "DELETE",
    headers: { "csrf-token": csrf },
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      if (data.message === "Success") {
        // Find the card element and remove it
        const productCard = btn.closest("article");
        productCard.remove();
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

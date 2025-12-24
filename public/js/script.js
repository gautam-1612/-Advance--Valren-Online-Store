document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileNav = document.getElementById("mobileNav");

  hamburgerBtn.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });
});

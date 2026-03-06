const navLinks = document.querySelectorAll('.nav-link');
const screens = document.querySelectorAll('.screen');

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.forEach((item) => item.classList.remove('active'));
    screens.forEach((screen) => screen.classList.remove('active'));

    link.classList.add('active');
    const target = document.getElementById(link.dataset.screen);
    if (target) target.classList.add('active');
  });
});

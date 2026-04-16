// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Optional: Add fade-in animation on scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

document.querySelectorAll('.card').forEach(card => {
    observer.observe(card);
});

// Navbar active highlight
const navLinks = document.querySelectorAll('.nav-link');
function setActiveLink() {
    let currentSection = 'hero';
    document.querySelectorAll('section').forEach(section => {
        const top = section.getBoundingClientRect().top;
        if (top <= 80) currentSection = section.id;
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + currentSection);
    });
}

window.addEventListener('scroll', setActiveLink);
window.addEventListener('resize', setActiveLink);
setActiveLink();

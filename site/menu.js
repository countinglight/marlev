document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    const toggle = nav?.querySelector('.nav-toggle');
    if (!nav || !toggle) return;

    const setOpen = (open) => {
        nav.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () => {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', (event) => {
        if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && nav.classList.contains('menu-open')) {
            setOpen(false);
            toggle.focus();
        }
    });

    window.matchMedia('(max-width: 768px)').addEventListener('change', (event) => {
        if (!event.matches) setOpen(false);
    });
});

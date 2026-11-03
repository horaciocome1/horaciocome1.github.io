document.documentElement.classList.add('js');

const themeToggle = document.querySelector('[data-theme-toggle]');
const themeColor = document.querySelector('meta[name="theme-color"]');
const themePreference = window.matchMedia('(prefers-color-scheme: light)');
const mobileLayout = window.matchMedia('(max-width: 50rem)');
const menuToggle = document.querySelector('[data-menu-toggle]');
const siteNavigation = document.querySelector('[data-navigation]');
const header = document.querySelector('.site-header');
const copyButton = document.querySelector('[data-copy-email]');
const copyStatus = document.querySelector('[data-copy-status]');
const copyrightYear = document.querySelector('[data-copyright-year]');

let savedTheme = null;
try {
	const value = window.localStorage.getItem('portfolio-theme');
	if (value === 'light' || value === 'dark') savedTheme = value;
} catch {
	// System preference still works when browser storage is unavailable.
}

const applyTheme = (theme) => {
	document.documentElement.dataset.theme = theme;
	document.documentElement.style.colorScheme = theme;
	themeToggle?.setAttribute('aria-label', `Use ${theme === 'dark' ? 'light' : 'dark'} theme`);
	themeColor?.setAttribute('content', theme === 'light' ? '#f8f6ef' : '#090c0b');
};

applyTheme(savedTheme ?? (themePreference.matches ? 'light' : 'dark'));

themeToggle?.addEventListener('click', () => {
	savedTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
	applyTheme(savedTheme);
	try {
		window.localStorage.setItem('portfolio-theme', savedTheme);
	} catch {
		// The current page can use the chosen theme without persisting it.
	}
});

themePreference.addEventListener('change', (event) => {
	if (!savedTheme) applyTheme(event.matches ? 'light' : 'dark');
});

const closeMenu = ({ restoreFocus = false } = {}) => {
	if (!siteNavigation || !menuToggle) return;
	siteNavigation.hidden = mobileLayout.matches;
	menuToggle.setAttribute('aria-expanded', 'false');
	menuToggle.setAttribute('aria-label', 'Open navigation menu');
	if (restoreFocus) menuToggle.focus();
};

menuToggle?.addEventListener('click', () => {
	if (!siteNavigation) return;
	const opening = siteNavigation.hidden;
	siteNavigation.hidden = !opening;
	menuToggle.setAttribute('aria-expanded', String(opening));
	menuToggle.setAttribute('aria-label', opening ? 'Close navigation menu' : 'Open navigation menu');
	if (opening) {
		siteNavigation.querySelector('a[href]')?.focus({ preventScroll: true });
	}
});

siteNavigation?.addEventListener('click', (event) => {
	const link = event.target.closest('a');
	if (!link || !mobileLayout.matches) return;
	closeMenu();
	const destination = new URL(link.href);
	if (destination.pathname === window.location.pathname && destination.hash) {
		const target = document.getElementById(destination.hash.slice(1));
		window.requestAnimationFrame(() => target?.focus({ preventScroll: true }));
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && mobileLayout.matches && siteNavigation && !siteNavigation.hidden) {
		closeMenu({ restoreFocus: true });
	}
});

document.addEventListener('click', (event) => {
	if (mobileLayout.matches && siteNavigation && !siteNavigation.hidden && !header?.contains(event.target)) {
		const focusInMenu = siteNavigation.contains(document.activeElement);
		closeMenu({ restoreFocus: focusInMenu });
	}
});

mobileLayout.addEventListener('change', () => {
	const focusInMenu = siteNavigation?.contains(document.activeElement);
	closeMenu({ restoreFocus: mobileLayout.matches && focusInMenu });
});
closeMenu();

if (header && 'ResizeObserver' in window) {
	new ResizeObserver(() => {
		document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
	}).observe(header);
}

// Native fragment links own navigation and history. Scrolling only updates the indicator.
const sectionLinks = Array.from(document.querySelectorAll('[data-section-link]'));
const sections = Array.from(document.querySelectorAll('[data-nav-section]'));
if (sections.length && 'IntersectionObserver' in window) {
	const visibleSections = new Set();
	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) visibleSections.add(entry.target);
			else visibleSections.delete(entry.target);
		});
		const current = sections.find((section) => visibleSections.has(section));
		if (!current) return;
		sectionLinks.forEach((link) => {
			if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
			else link.removeAttribute('aria-current');
		});
	}, { rootMargin: '-15% 0px -45% 0px' });
	sections.forEach((section) => observer.observe(section));
}

copyButton?.addEventListener('click', async () => {
	try {
		await navigator.clipboard.writeText('mail@horacioco.me');
		copyStatus.textContent = 'Email address copied.';
	} catch {
		copyStatus.textContent = 'Select and copy the address above: mail@horacioco.me';
	}
});

if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());

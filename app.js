document.documentElement.classList.add('js');

const themeToggle = document.querySelector('[data-theme-toggle]');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const copyrightYear = document.querySelector('#copyright-year');
const windowBar = document.querySelector('.window-bar');
const windowTitle = document.querySelector('.window-title');
const sessionBar = document.querySelector('.session-bar');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileMenu = document.querySelector('#mobile-menu');
const treeLinks = Array.from(document.querySelectorAll('[data-tree-link]'));
const rail = document.querySelector('[data-card-rail]');
const railCards = Array.from(document.querySelectorAll('[data-rail-card]'));
const railButtons = Array.from(document.querySelectorAll('[data-rail-direction]'));
const railProgress = document.querySelector('[data-rail-progress]');
const railCount = document.querySelector('[data-rail-count]');
const railAnnouncement = document.querySelector('[data-rail-announcement]');
const skipLink = document.querySelector('.skip-link');

const THEME_STORAGE_KEY = 'portfolio-theme';
const THEME_COLORS = {
	dark: '#050505',
	light: '#f4efe6',
};
const MOBILE_LAYOUT = window.matchMedia('(max-width: 900px)');
const CONSTRAINED_LAYOUT = window.matchMedia('(min-width: 1081px) and (min-height: 760px)');
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

if (copyrightYear) {
	copyrightYear.textContent = String(new Date().getFullYear());
}

const readStoredTheme = () => {
	try {
		const theme = window.localStorage.getItem(THEME_STORAGE_KEY);
		return theme === 'light' || theme === 'dark' ? theme : null;
	} catch {
		return null;
	}
};

const writeStoredTheme = (theme) => {
	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// The selected theme still applies when storage is unavailable.
	}
};

const getSystemTheme = () => (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

const applyTheme = (theme, { persist = true } = {}) => {
	const normalizedTheme = theme === 'light' ? 'light' : 'dark';
	const nextTheme = normalizedTheme === 'light' ? 'dark' : 'light';

	document.documentElement.dataset.theme = normalizedTheme;
	document.documentElement.style.colorScheme = normalizedTheme;
	themeToggle?.setAttribute('aria-checked', normalizedTheme === 'light' ? 'true' : 'false');
	themeToggle?.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
	themeToggle?.setAttribute('title', `Switch to ${nextTheme} mode`);
	themeColorMeta?.setAttribute('content', THEME_COLORS[normalizedTheme]);

	if (persist) {
		writeStoredTheme(normalizedTheme);
	}
};

const initialTheme = readStoredTheme() ?? document.documentElement.dataset.theme ?? getSystemTheme();
applyTheme(initialTheme, { persist: false });

themeToggle?.addEventListener('click', () => {
	applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
});

let fixedStackFrame = 0;

const updateFixedStackOffset = () => {
	window.cancelAnimationFrame(fixedStackFrame);
	fixedStackFrame = window.requestAnimationFrame(() => {
		const windowBarBottom = windowBar?.getBoundingClientRect().bottom ?? 0;
		const sessionBarTop = windowBarBottom + 10;
		const sessionBarHeight = sessionBar?.getBoundingClientRect().height ?? 0;
		const clearance = sessionBarHeight > 0 ? sessionBarTop + sessionBarHeight + 10 : windowBarBottom + 10;

		document.documentElement.style.setProperty('--session-bar-top', `${Math.ceil(sessionBarTop)}px`);
		document.documentElement.style.setProperty('--fixed-stack-clearance', `${Math.ceil(clearance)}px`);
	});
};

const closeMenu = ({ restoreFocus = false } = {}) => {
	document.body.classList.remove('has-mobile-menu-open');

	if (!menuToggle || !mobileMenu) {
		return;
	}

	mobileMenu.hidden = true;
	menuToggle.setAttribute('aria-expanded', 'false');
	menuToggle.setAttribute('aria-label', 'Open navigation menu');
	updateFixedStackOffset();

	if (restoreFocus) {
		menuToggle.focus();
	}
};

const openMenu = () => {
	if (!menuToggle || !mobileMenu) {
		return;
	}

	document.body.classList.add('has-mobile-menu-open');
	mobileMenu.hidden = false;
	menuToggle.setAttribute('aria-expanded', 'true');
	menuToggle.setAttribute('aria-label', 'Close navigation menu');
	updateFixedStackOffset();
};

menuToggle?.addEventListener('click', () => {
	if (mobileMenu?.hidden ?? true) {
		openMenu();
		return;
	}

	closeMenu();
});

document.addEventListener('click', (event) => {
	if (mobileMenu?.hidden || !windowBar || !(event.target instanceof Node)) {
		return;
	}

	if (!windowBar.contains(event.target)) {
		closeMenu();
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && mobileMenu && !mobileMenu.hidden) {
		closeMenu({ restoreFocus: true });
	}
});

if (rail && railCards.length > 0) {
	rail.setAttribute('tabindex', '0');

	let activeIndex = 0;
	let scrollFrame = 0;
	let scrollTargetIndex = null;
	let scrollTargetTimer = 0;
	let pendingNavigation = null;
	const progressButtons = [];

	const getCardTitle = (card) => card.querySelector('h1, h2')?.textContent?.trim() ?? card.dataset.cardLabel ?? '';

	const getCardIndexFromHash = () => {
		const id = window.location.hash.slice(1);
		return id ? railCards.findIndex((card) => card.id === id) : -1;
	};

	const getCardScrollTarget = (card) => {
		const cardIndex = railCards.indexOf(card);
		if (cardIndex === 0) {
			return 0;
		}

		if (cardIndex === railCards.length - 1) {
			return Math.max(rail.scrollWidth - rail.clientWidth, 0);
		}

		const centeredOffset = card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2;
		const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0);
		return Math.min(maxScrollLeft, Math.max(0, centeredOffset));
	};

	const getClosestCardIndex = () => railCards.reduce((closestIndex, card, index) => {
		const closestDistance = Math.abs(getCardScrollTarget(railCards[closestIndex]) - rail.scrollLeft);
		const currentDistance = Math.abs(getCardScrollTarget(card) - rail.scrollLeft);
		return currentDistance < closestDistance ? index : closestIndex;
	}, 0);

	const syncLocation = () => {
		const card = railCards[activeIndex];
		if (!card || !window.history?.replaceState) {
			return;
		}

		if (activeIndex === 0 && window.location.hash) {
			window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
			return;
		}

		if (activeIndex > 0 && window.location.hash !== `#${card.id}`) {
			window.history.replaceState(null, '', `#${card.id}`);
		}
	};

	const updateRailHeight = () => {
		const activeCard = railCards[activeIndex];
		if (!activeCard) {
			return;
		}

		railCards.forEach((card) => {
			card.classList.remove('is-scrollable');
			card.removeAttribute('tabindex');
			card.style.maxHeight = '';
			card.style.overflowY = '';
		});
		rail.style.height = '';

		const contentHeight = activeCard.scrollHeight;
		if (!CONSTRAINED_LAYOUT.matches) {
			rail.style.height = `${contentHeight}px`;
			return;
		}

		const shellTop = rail.closest('.card-rail-shell')?.getBoundingClientRect().top ?? 0;
		const availableHeight = Math.max(320, window.innerHeight - shellTop - 76);
		const cardHeight = Math.min(contentHeight, availableHeight);

		if (contentHeight > availableHeight) {
			activeCard.classList.add('is-scrollable');
			activeCard.setAttribute('tabindex', '0');
			activeCard.style.maxHeight = `${availableHeight}px`;
			activeCard.style.overflowY = 'auto';
		}

		rail.style.height = `${cardHeight}px`;
	};

	const setActiveLinks = (cardId) => {
		treeLinks.forEach((link) => {
			const isActive = link.getAttribute('href') === `#${cardId}`;
			link.classList.toggle('is-active', isActive);
			if (isActive) {
				link.setAttribute('aria-current', 'page');
			} else {
				link.removeAttribute('aria-current');
			}
		});
	};

	const updateControls = () => {
		railButtons.forEach((button) => {
			const isPrevious = button.dataset.railDirection === 'prev';
			button.disabled = isPrevious ? activeIndex === 0 : activeIndex === railCards.length - 1;
		});

		progressButtons.forEach((button, index) => {
			button.classList.toggle('is-active', index === activeIndex);
			if (index === activeIndex) {
				button.setAttribute('aria-current', 'step');
			} else {
				button.removeAttribute('aria-current');
			}
		});

		if (railCount) {
			railCount.textContent = `${activeIndex + 1} / ${railCards.length}`;
		}

		if (windowTitle) {
			windowTitle.textContent = `~/horacio/portfolio/${railCards[activeIndex].dataset.cardLabel ?? ''}`;
		}
	};

	const announceActiveCard = () => {
		if (!railAnnouncement) {
			return;
		}

		railAnnouncement.textContent = '';
		window.requestAnimationFrame(() => {
			railAnnouncement.textContent = `${getCardTitle(railCards[activeIndex])}, slide ${activeIndex + 1} of ${railCards.length}`;
		});
	};

	const updateActiveCard = (index, { announce = false, syncHash = true } = {}) => {
		const nextIndex = Math.max(0, Math.min(index, railCards.length - 1));
		const activeElement = document.activeElement;
		if (nextIndex !== activeIndex && activeElement && railCards[activeIndex]?.contains(activeElement)) {
			rail.focus({ preventScroll: true });
		}
		activeIndex = nextIndex;

		railCards.forEach((card, cardIndex) => {
			const isActive = cardIndex === activeIndex;
			card.classList.toggle('is-active', isActive);
			if (isActive) {
				card.removeAttribute('aria-hidden');
				card.removeAttribute('inert');
			} else {
				card.setAttribute('aria-hidden', 'true');
				card.setAttribute('inert', '');
			}
		});

		setActiveLinks(railCards[activeIndex].id);
		updateControls();
		updateRailHeight();

		if (syncHash) {
			syncLocation();
		}

		if (announce) {
			announceActiveCard();
		}
	};

	const focusCardHeading = () => {
		const heading = railCards[activeIndex]?.querySelector('h1, h2');
		window.requestAnimationFrame(() => heading?.focus());
	};

	const settleNavigation = (index) => {
		const navigation = pendingNavigation ?? {};
		pendingNavigation = null;
		scrollTargetIndex = null;
		updateActiveCard(index, {
			announce: navigation.announce ?? false,
			syncHash: navigation.syncHash ?? true,
		});

		if (navigation.focusHeading) {
			focusCardHeading();
		}
	};

	const navigateToCard = (
		index,
		{ announce = true, focusHeading = false, instant = false, syncHash = true } = {},
	) => {
		const nextIndex = Math.max(0, Math.min(index, railCards.length - 1));
		const card = railCards[nextIndex];
		if (!card) {
			return;
		}

		window.clearTimeout(scrollTargetTimer);
		scrollTargetIndex = nextIndex;
		pendingNavigation = { announce, focusHeading, syncHash };
		const targetLeft = getCardScrollTarget(card);
		const behavior = instant || REDUCED_MOTION.matches ? 'auto' : 'smooth';
		rail.scrollTo({
			left: targetLeft,
			behavior,
		});

		if (behavior === 'auto' || Math.abs(rail.scrollLeft - targetLeft) <= 2) {
			settleNavigation(nextIndex);
			return;
		}

		scrollTargetTimer = window.setTimeout(() => {
			rail.scrollTo({ left: getCardScrollTarget(card), behavior: 'auto' });
			settleNavigation(nextIndex);
		}, 700);
	};

	const syncActiveCardFromScroll = () => {
		window.cancelAnimationFrame(scrollFrame);
		scrollFrame = window.requestAnimationFrame(() => {
			if (scrollTargetIndex !== null) {
				const targetIndex = scrollTargetIndex;
				const targetDistance = Math.abs(getCardScrollTarget(railCards[targetIndex]) - rail.scrollLeft);
				if (targetDistance <= 2) {
					window.clearTimeout(scrollTargetTimer);
					settleNavigation(targetIndex);
				}
				return;
			}

			const closestIndex = getClosestCardIndex();
			if (closestIndex !== activeIndex) {
				updateActiveCard(closestIndex, { announce: true });
			}
		});
	};

	railCards.forEach((card, index) => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'rail-led';
		button.setAttribute('aria-label', `Go to ${getCardTitle(card)}, slide ${index + 1} of ${railCards.length}`);
		button.addEventListener('click', () => navigateToCard(index));
		railProgress?.appendChild(button);
		progressButtons.push(button);
	});

	railButtons.forEach((button) => {
		button.addEventListener('click', () => {
			const direction = button.dataset.railDirection === 'next' ? 1 : -1;
			navigateToCard(activeIndex + direction);
		});
	});

	railProgress?.addEventListener('keydown', (event) => {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
			return;
		}

		event.preventDefault();
		const focusedIndex = progressButtons.indexOf(event.target);
		let nextIndex = focusedIndex >= 0 ? focusedIndex : activeIndex;
		if (event.key === 'ArrowLeft') nextIndex -= 1;
		if (event.key === 'ArrowRight') nextIndex += 1;
		if (event.key === 'Home') nextIndex = 0;
		if (event.key === 'End') nextIndex = railCards.length - 1;
		nextIndex = Math.max(0, Math.min(nextIndex, railCards.length - 1));
		navigateToCard(nextIndex);
		progressButtons[nextIndex]?.focus();
	});

	rail.addEventListener('keydown', (event) => {
		if (event.target !== rail || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
			return;
		}

		event.preventDefault();
		let nextIndex = activeIndex;
		if (event.key === 'ArrowLeft') nextIndex -= 1;
		if (event.key === 'ArrowRight') nextIndex += 1;
		if (event.key === 'Home') nextIndex = 0;
		if (event.key === 'End') nextIndex = railCards.length - 1;
		navigateToCard(nextIndex);
	});

	treeLinks.forEach((link) => {
		link.addEventListener('click', (event) => {
			const cardIndex = railCards.findIndex((card) => link.getAttribute('href') === `#${card.id}`);
			if (cardIndex < 0) {
				return;
			}

			event.preventDefault();
			const isMobileMenuLink = mobileMenu?.contains(link) ?? false;
			if (isMobileMenuLink) {
				closeMenu();
			}
			navigateToCard(cardIndex, { focusHeading: isMobileMenuLink });
		});
	});

	skipLink?.addEventListener('click', (event) => {
		event.preventDefault();
		navigateToCard(0, { announce: false, focusHeading: true });
	});

	rail.addEventListener('scroll', syncActiveCardFromScroll, { passive: true });

	window.addEventListener('hashchange', () => {
		const cardIndex = getCardIndexFromHash();
		if (cardIndex >= 0 && cardIndex !== activeIndex) {
			navigateToCard(cardIndex, { announce: false, syncHash: false });
			return;
		}

		if (!window.location.hash && activeIndex !== 0) {
			navigateToCard(0, { announce: false, syncHash: false });
		}
	});

	const syncLayout = () => {
		if (!MOBILE_LAYOUT.matches) {
			closeMenu();
		}

		updateFixedStackOffset();
		updateRailHeight();
		navigateToCard(activeIndex, { announce: false, instant: true, syncHash: false });
	};

	window.addEventListener('resize', syncLayout);
	window.addEventListener('load', syncLayout);
	MOBILE_LAYOUT.addEventListener('change', syncLayout);
	CONSTRAINED_LAYOUT.addEventListener('change', syncLayout);

	const initialIndex = getCardIndexFromHash();
	updateFixedStackOffset();
	navigateToCard(initialIndex >= 0 ? initialIndex : 0, {
		announce: false,
		instant: true,
		syncHash: false,
	});
}

if (typeof ResizeObserver === 'function' && windowBar && sessionBar) {
	const fixedStackObserver = new ResizeObserver(updateFixedStackOffset);
	fixedStackObserver.observe(windowBar);
	fixedStackObserver.observe(sessionBar);
}

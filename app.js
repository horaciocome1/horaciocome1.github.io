const treeLinks = Array.from(document.querySelectorAll('[data-tree-link]'));
const experienceNodes = Array.from(document.querySelectorAll('[data-experience-since]'));
const copyrightYear = document.querySelector('#copyright-year');
const rail = document.querySelector('[data-card-rail]');
const railCards = Array.from(document.querySelectorAll('[data-rail-card]'));
const railButtons = Array.from(document.querySelectorAll('[data-rail-direction]'));
const railDots = document.querySelector('[data-rail-dots]');
const railProgress = document.querySelector('[data-rail-progress]');
const windowBar = document.querySelector('.window-bar');
const sessionBar = document.querySelector('.session-bar');
const windowTitle = document.querySelector('.window-title');
const shortcutOverlay = document.querySelector('#shortcut-overlay');
const commandPalette = document.querySelector('#command-palette');
const paletteInput = document.querySelector('#palette-input');
const paletteList = document.querySelector('#palette-list');
const toastStack = document.querySelector('#toast-stack');

const currentYear = new Date().getFullYear();

experienceNodes.forEach((node) => {
	const since = Number(node.dataset.experienceSince);
	if (!Number.isNaN(since) && since > 0) {
		node.textContent = `${currentYear - since}+ years`;
	}
});

if (copyrightYear) {
	copyrightYear.textContent = String(currentYear);
}

const isEditableTarget = (target) => {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	const editableTags = ['INPUT', 'TEXTAREA', 'SELECT'];
	return editableTags.includes(target.tagName) || target.isContentEditable;
};

const showToast = (message) => {
	if (!toastStack) {
		return;
	}

	const toast = document.createElement('div');
	toast.className = 'toast';
	toast.textContent = message;
	toastStack.appendChild(toast);

	window.requestAnimationFrame(() => {
		toast.classList.add('is-visible');
	});

	window.setTimeout(() => {
		toast.classList.remove('is-visible');
		window.setTimeout(() => toast.remove(), 220);
	}, 2200);
};

const openExternal = (url, label) => {
	showToast(`opened ${label}`);
	window.open(url, '_blank', 'noopener,noreferrer');
};

const updateFixedStackOffset = () => {
	const windowBarBottom = windowBar?.getBoundingClientRect().bottom ?? 0;
	const sessionBarBottom = sessionBar?.getBoundingClientRect().bottom ?? 0;
	const clearance = Math.max(windowBarBottom, sessionBarBottom) + 10;
	document.documentElement.style.setProperty('--fixed-stack-clearance', `${Math.ceil(clearance)}px`);
};

updateFixedStackOffset();

if (treeLinks.length > 0 && railCards.length > 0 && rail) {
	let activeIndex = 0;
	let isWheelLocked = false;
	let filteredCommands = [];
	let paletteSelectionIndex = 0;

	const dotButtons = [];
	const progressLeds = [];
	const visitedCards = new Set([0]);

	const getActiveCard = () => railCards[activeIndex] ?? null;
	const getCardLabel = (card) => card?.dataset.cardLabel ?? card?.id ?? '';

	const setActiveLink = (id) => {
		treeLinks.forEach((link) => {
			const isActive = link.getAttribute('href') === `#${id}`;
			link.classList.toggle('is-active', isActive);
			link.setAttribute('aria-current', isActive ? 'true' : 'false');
		});
	};

	const updateControls = () => {
		railButtons.forEach((button) => {
			const isPrev = button.dataset.railDirection === 'prev';
			button.disabled = isPrev ? activeIndex === 0 : activeIndex === railCards.length - 1;
		});

		dotButtons.forEach((button, index) => {
			const isActive = index === activeIndex;
			button.classList.toggle('is-active', isActive);
			button.setAttribute('aria-current', isActive ? 'true' : 'false');
		});

		progressLeds.forEach((button, index) => {
			button.classList.toggle('is-active', index === activeIndex);
			button.classList.toggle('is-visited', visitedCards.has(index) && index !== activeIndex);
			button.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
		});

		const activeCard = getActiveCard();
		const cardLabel = getCardLabel(activeCard);
		if (windowTitle) {
			windowTitle.textContent = `~/horacio/portfolio/${cardLabel}`;
		}
	};

	const scrollActiveCardBy = (delta, behavior = 'smooth') => {
		const activeCard = getActiveCard();
		if (!activeCard) {
			return;
		}

		activeCard.scrollBy({ top: delta, behavior });
	};

	const scrollActiveCardTo = (top, behavior = 'smooth') => {
		const activeCard = getActiveCard();
		if (!activeCard) {
			return;
		}

		activeCard.scrollTo({ top, behavior });
	};

	const updateRailHeight = () => {
		const activeCard = getActiveCard();
		const shell = rail.closest('.card-rail-shell');
		const shellRect = shell?.getBoundingClientRect();
		const shellBottomPadding = 18;
		const viewportBottomGap = 126;
		const availableHeight = shellRect
			? Math.max(280, window.innerHeight - shellRect.top - viewportBottomGap - shellBottomPadding)
			: window.innerHeight;

		if (!activeCard) {
			return;
		}

		railCards.forEach((card) => {
			card.style.maxHeight = '';
			card.style.overflowY = 'visible';
		});

		const contentHeight = activeCard.scrollHeight;
		const needsScroll = contentHeight > availableHeight;

		activeCard.style.maxHeight = needsScroll ? `${availableHeight}px` : '';
		activeCard.style.overflowY = needsScroll ? 'auto' : 'visible';
		rail.style.height = `${Math.min(contentHeight, availableHeight)}px`;
	};

	const closeShortcuts = () => {
		if (shortcutOverlay) {
			shortcutOverlay.hidden = true;
		}
	};

	const closePalette = () => {
		if (commandPalette) {
			commandPalette.hidden = true;
		}
	};

	const openShortcuts = () => {
		closePalette();
		if (shortcutOverlay) {
			shortcutOverlay.hidden = false;
			showToast('keyboard help ready');
		}
	};

	const renderPalette = () => {
		if (!paletteList) {
			return;
		}

		paletteList.innerHTML = '';

		if (filteredCommands.length === 0) {
			const empty = document.createElement('p');
			empty.className = 'palette-empty';
			empty.textContent = 'No matching commands.';
			paletteList.appendChild(empty);
			return;
		}

		filteredCommands.forEach((command, index) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'palette-item';
			button.textContent = command.label;
			button.classList.toggle('is-active', index === paletteSelectionIndex);
			button.setAttribute('aria-selected', index === paletteSelectionIndex ? 'true' : 'false');
			button.addEventListener('click', () => {
				command.action();
				closePalette();
			});
			paletteList.appendChild(button);
		});
	};

	const updatePaletteFilter = () => {
		const query = paletteInput?.value.trim().toLowerCase() ?? '';
		filteredCommands = commands.filter((command) => {
			const haystack = `${command.label} ${command.aliases}`.toLowerCase();
			return haystack.includes(query);
		});
		paletteSelectionIndex = 0;
		renderPalette();
	};

	const openPalette = () => {
		closeShortcuts();
		if (!commandPalette || !paletteInput) {
			return;
		}

		commandPalette.hidden = false;
		paletteInput.value = '';
		updatePaletteFilter();
		paletteInput.focus();
		showToast('command palette ready');
	};

	const getCardScrollTarget = (card) => {
		const centeredOffset = card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2;
		const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0);
		return Math.min(maxScrollLeft, Math.max(0, centeredOffset));
	};

	const updateRailCardEffects = () => {
		const maxDistance = Math.max(rail.clientWidth, 1);

		railCards.forEach((card) => {
			const distance = Math.abs(getCardScrollTarget(card) - rail.scrollLeft);
			const focus = distance <= 1 ? 1 : Math.max(0, 1 - distance / maxDistance);
			card.style.setProperty('--rail-card-focus', focus.toFixed(3));
		});
	};

	const scrollToCard = (index) => {
		const boundedIndex = Math.max(0, Math.min(index, railCards.length - 1));
		const card = railCards[boundedIndex];
		if (!card) {
			return;
		}

		activeIndex = boundedIndex;
		visitedCards.add(activeIndex);
		rail.scrollTo({
			left: getCardScrollTarget(card),
			behavior: 'smooth',
		});
		setActiveLink(card.id);
		updateControls();
		updateRailHeight();
	};

	const updateActiveCard = () => {
		const closestIndex = railCards.reduce((bestIndex, card, index) => {
			const bestDistance = Math.abs(getCardScrollTarget(railCards[bestIndex]) - rail.scrollLeft);
			const currentDistance = Math.abs(getCardScrollTarget(card) - rail.scrollLeft);
			return currentDistance < bestDistance ? index : bestIndex;
		}, 0);

		activeIndex = closestIndex;
		visitedCards.add(activeIndex);
		updateRailCardEffects();
		setActiveLink(railCards[closestIndex].id);
		updateControls();
		updateRailHeight();
	};

	const commands = [
		{ label: 'Jump to whoami', aliases: 'intro whoami 1', action: () => scrollToCard(0) },
		{ label: 'Jump to selected work', aliases: 'work projects 2', action: () => scrollToCard(1) },
		{ label: 'Jump to quick facts', aliases: 'profile facts 3', action: () => scrollToCard(2) },
		{ label: 'Jump to outcomes', aliases: 'outcomes results 4', action: () => scrollToCard(3) },
		{ label: 'Jump to work style', aliases: 'style notes 5', action: () => scrollToCard(4) },
		{ label: 'Next card', aliases: 'next forward', action: () => scrollToCard(activeIndex + 1) },
		{ label: 'Previous card', aliases: 'prev previous back', action: () => scrollToCard(activeIndex - 1) },
		{ label: 'Open email', aliases: 'email mail contact', action: () => { showToast('opening email'); window.location.href = 'mailto:mail@horacioco.me'; } },
		{ label: 'Open GitHub', aliases: 'github code repository', action: () => openExternal('https://github.com/horaciocome1', 'github') },
		{ label: 'Open LinkedIn', aliases: 'linkedin profile', action: () => openExternal('https://www.linkedin.com/in/horaciocome1', 'linkedin') },
		{ label: 'Open Medium', aliases: 'medium writing blog', action: () => openExternal('https://horaciocome1.medium.com', 'medium') },
	];

	treeLinks.forEach((link) => {
		link.addEventListener('click', (event) => {
			event.preventDefault();
			const targetId = link.getAttribute('href')?.slice(1);
			const targetIndex = railCards.findIndex((card) => card.id === targetId);
			if (targetIndex >= 0) {
				scrollToCard(targetIndex);
			}
		});
	});

	railButtons.forEach((button) => {
		button.addEventListener('click', () => {
			const direction = button.dataset.railDirection === 'next' ? 1 : -1;
			scrollToCard(activeIndex + direction);
		});
	});

	if (railDots) {
		railCards.forEach((card, index) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'rail-dot';
			button.setAttribute('aria-label', `Go to ${getCardLabel(card)}`);
			button.addEventListener('click', () => scrollToCard(index));
			railDots.appendChild(button);
			dotButtons.push(button);
		});
	}

	if (railProgress) {
		railCards.forEach((card, index) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'rail-led';
			button.setAttribute('aria-label', `Go to ${getCardLabel(card)}`);
			button.addEventListener('click', () => scrollToCard(index));
			railProgress.appendChild(button);
			progressLeds.push(button);
		});
	}

	shortcutOverlay?.addEventListener('click', (event) => {
		if (event.target === shortcutOverlay) {
			closeShortcuts();
		}
	});

	commandPalette?.addEventListener('click', (event) => {
		if (event.target === commandPalette) {
			closePalette();
		}
	});

	document.querySelectorAll('[data-overlay-close]').forEach((button) => {
		button.addEventListener('click', closeShortcuts);
	});

	document.querySelectorAll('[data-palette-close]').forEach((button) => {
		button.addEventListener('click', closePalette);
	});

	paletteInput?.addEventListener('input', updatePaletteFilter);

	rail.addEventListener('scroll', updateActiveCard, { passive: true });
	rail.addEventListener(
		'wheel',
		(event) => {
			if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || isWheelLocked) {
				return;
			}

			event.preventDefault();
			isWheelLocked = true;
			scrollToCard(activeIndex + (event.deltaX > 0 ? 1 : -1));

			window.setTimeout(() => {
				isWheelLocked = false;
			}, 360);
		},
		{ passive: false },
	);

	window.addEventListener('resize', () => {
		updateFixedStackOffset();
		updateRailHeight();
		scrollToCard(activeIndex);
		updateRailCardEffects();
	});

	window.addEventListener('keydown', (event) => {
		if (!commandPalette?.hidden) {
			if (event.key === 'Escape') {
				event.preventDefault();
				closePalette();
				return;
			}

			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				if (filteredCommands.length === 0) {
					return;
				}

				const delta = event.key === 'ArrowDown' ? 1 : -1;
				paletteSelectionIndex = (paletteSelectionIndex + delta + filteredCommands.length) % filteredCommands.length;
				renderPalette();
				return;
			}

			if (event.key === 'Enter') {
				event.preventDefault();
				filteredCommands[paletteSelectionIndex]?.action();
				closePalette();
			}
			return;
		}

		if (!shortcutOverlay?.hidden) {
			if (event.key === 'Escape' || event.key === '?') {
				event.preventDefault();
				closeShortcuts();
				return;
			}

			if (event.key.length === 1 || event.key === 'Backspace') {
				event.preventDefault();
			}
			return;
		}

		if (isEditableTarget(event.target) || event.altKey || event.metaKey) {
			return;
		}

		if (event.key === '?') {
			event.preventDefault();
			openShortcuts();
			return;
		}

		if (event.key === '/' || (event.ctrlKey && event.key.toLowerCase() === 'k')) {
			event.preventDefault();
			openPalette();
			return;
		}

		if (event.key === 'Tab') {
			event.preventDefault();
			const direction = event.ctrlKey ? -1 : 1;
			const nextIndex = (activeIndex + direction + railCards.length) % railCards.length;
			scrollToCard(nextIndex);
			return;
		}

		if (/^[1-9]$/.test(event.key)) {
			const targetIndex = Number(event.key) - 1;
			if (targetIndex < railCards.length) {
				event.preventDefault();
				scrollToCard(targetIndex);
			}
			return;
		}

		if (['h', '[', 'ArrowLeft'].includes(event.key)) {
			event.preventDefault();
			scrollToCard(activeIndex - 1);
			return;
		}

		if (['l', ']', 'ArrowRight'].includes(event.key)) {
			event.preventDefault();
			scrollToCard(activeIndex + 1);
			return;
		}

		if (event.key === 'Home') {
			event.preventDefault();
			scrollToCard(0);
			return;
		}

		if (event.key === 'End') {
			event.preventDefault();
			scrollToCard(railCards.length - 1);
			return;
		}

		if (['ArrowDown', 'j'].includes(event.key)) {
			event.preventDefault();
			const delta = Math.max(120, (getActiveCard()?.clientHeight ?? 0) * 0.35);
			scrollActiveCardBy(delta);
			return;
		}

		if (['ArrowUp', 'k'].includes(event.key)) {
			event.preventDefault();
			const delta = Math.max(120, (getActiveCard()?.clientHeight ?? 0) * 0.35);
			scrollActiveCardBy(-delta);
			return;
		}

		if (event.key === ' ' || event.key === 'Spacebar') {
			event.preventDefault();
			const delta = Math.max(220, (getActiveCard()?.clientHeight ?? 0) * 0.85);
			scrollActiveCardBy(event.shiftKey ? -delta : delta);
			return;
		}

		if (event.key === 'g') {
			event.preventDefault();
			scrollActiveCardTo(0);
			return;
		}

		if (event.key === 'G') {
			event.preventDefault();
			const activeCard = getActiveCard();
			if (activeCard) {
				scrollActiveCardTo(activeCard.scrollHeight);
			}
			return;
		}

		if (event.key === 'e') {
			event.preventDefault();
			showToast('opening email');
			window.location.href = 'mailto:mail@horacioco.me';
			return;
		}

		if (event.key === 'b') {
			event.preventDefault();
			openExternal('https://github.com/horaciocome1', 'github');
			return;
		}

		if (event.key === 'i') {
			event.preventDefault();
			openExternal('https://www.linkedin.com/in/horaciocome1', 'linkedin');
			return;
		}

		if (event.key === 'm') {
			event.preventDefault();
			openExternal('https://horaciocome1.medium.com', 'medium');
			return;
		}

		if (event.key.length === 1 || event.key === 'Backspace') {
			event.preventDefault();
		}
	});

	scrollToCard(0);
	updateRailCardEffects();
}

const treeLinks = Array.from(document.querySelectorAll('[data-tree-link]'));
const experienceNodes = Array.from(document.querySelectorAll('[data-experience-since]'));
const copyrightYear = document.querySelector('#copyright-year');
const rail = document.querySelector('[data-card-rail]');
const railCards = Array.from(document.querySelectorAll('[data-rail-card]'));
const railButtons = Array.from(document.querySelectorAll('[data-rail-direction]'));
const railDots = document.querySelector('[data-rail-dots]');

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


if (treeLinks.length > 0 && railCards.length > 0) {
	let activeIndex = 0;
	let isWheelLocked = false;
	const dotButtons = [];

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
	};

	const updateRailHeight = () => {
		const activeCard = railCards[activeIndex];
		const shell = rail?.closest('.card-rail-shell');
		const shellRect = shell?.getBoundingClientRect();
		const shellBottomPadding = 18;
		const viewportBottomGap = 126;
		const availableHeight = shellRect
			? Math.max(280, window.innerHeight - shellRect.top - viewportBottomGap - shellBottomPadding)
			: window.innerHeight;

		if (!rail || !activeCard) {
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

	const scrollToCard = (index) => {
		const boundedIndex = Math.max(0, Math.min(index, railCards.length - 1));
		const card = railCards[boundedIndex];
		if (!rail || !card) {
			return;
		}

		activeIndex = boundedIndex;
		rail.scrollTo({
			left: card.offsetLeft,
			behavior: 'smooth',
		});
		setActiveLink(card.id);
		updateControls();
		updateRailHeight();
	};

	const updateActiveCard = () => {
		if (!rail) {
			return;
		}

		const closestIndex = railCards.reduce((bestIndex, card, index) => {
			const bestDistance = Math.abs(railCards[bestIndex].offsetLeft - rail.scrollLeft);
			const currentDistance = Math.abs(card.offsetLeft - rail.scrollLeft);
			return currentDistance < bestDistance ? index : bestIndex;
		}, 0);

		activeIndex = closestIndex;
		setActiveLink(railCards[closestIndex].id);
		updateControls();
		updateRailHeight();
	};

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
			button.setAttribute('aria-label', `Go to ${card.id}`);
			button.addEventListener('click', () => scrollToCard(index));
			railDots.appendChild(button);
			dotButtons.push(button);
		});
	}

	if (rail) {
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
			updateRailHeight();
			scrollToCard(activeIndex);
		});
		scrollToCard(0);
	}
}

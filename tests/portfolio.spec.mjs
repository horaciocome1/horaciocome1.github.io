import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.goto('/');
});

test('loads the profile with one active, focusable slide', async ({ page }) => {
	await expect(page).toHaveTitle('Horácio Comé | Android Engineer');
	await expect(page.locator('h1')).toHaveText('Horácio Comé, Android Engineer');
	await expect(page.locator('#intro-title')).toHaveText('Horácio Comé');
	await expect(page.locator('[data-rail-count]')).toHaveText('1 / 5');
	await expect(page.locator('#intro')).not.toHaveAttribute('aria-hidden', 'true');
	await expect(page.locator('#work')).toHaveAttribute('aria-hidden', 'true');
	await expect(page.locator('#work')).toHaveAttribute('inert', '');
	await expect(page.locator('.work-item h3').first()).toHaveText('TrueVUE Cloud Migration');
});

test('loads first-party assets without browser errors', async ({ page }) => {
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('response', (response) => {
		if (response.url().startsWith('http://127.0.0.1:4173') && response.status() >= 400) {
			errors.push(`${response.status()} ${response.url()}`);
		}
	});

	await page.reload();
	expect(errors).toEqual([]);
});

test('preserves native keyboard focus and button activation', async ({ page }) => {
	await page.keyboard.press('Tab');
	await expect(page.locator('.skip-link')).toBeFocused();
	await expect(page.locator('[data-rail-count]')).toHaveText('1 / 5');

	const themeToggle = page.locator('[data-theme-toggle]');
	await themeToggle.focus();
	await page.keyboard.press('Space');
	await expect(themeToggle).toHaveAttribute('aria-checked', 'true');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('navigates the carousel and isolates inactive slide content', async ({ page }) => {
	await page.locator('[data-rail-direction="next"]').click();

	await expect(page.locator('[data-rail-count]')).toHaveText('2 / 5');
	await expect(page).toHaveURL(/#work$/);
	await expect(page.locator('#work')).not.toHaveAttribute('aria-hidden', 'true');
	await expect(page.locator('#intro')).toHaveAttribute('inert', '');
	await expect(page.locator('[data-rail-direction="prev"]')).toBeEnabled();
});

test('settles long carousel jumps back on the first slide', async ({ page }) => {
	await page.locator('.rail-led').nth(4).click();
	await page.waitForTimeout(750);
	await expect(page.locator('[data-rail-count]')).toHaveText('5 / 5');

	await page.locator('.rail-led').first().click();
	await page.waitForTimeout(750);

	await expect(page.locator('[data-rail-count]')).toHaveText('1 / 5');
	await expect(page.locator('#intro')).toHaveCSS('opacity', '1');
	expect(await page.locator('[data-card-rail]').evaluate((rail) => Math.round(rail.scrollLeft))).toBe(0);
});

test('returns from slide two to slide one through every navigation control', async ({ page }) => {
	const expectFirstSlide = async () => {
		await expect(page.locator('[data-rail-count]')).toHaveText('1 / 5');
		await expect(page.locator('#intro')).toHaveCSS('opacity', '1');
		expect(await page.locator('[data-card-rail]').evaluate((rail) => Math.round(rail.scrollLeft))).toBe(0);
	};

	await page.locator('[data-rail-direction="next"]').click();
	await expect(page.locator('[data-rail-count]')).toHaveText('2 / 5');
	await page.locator('[data-rail-direction="prev"]').click();
	await expectFirstSlide();

	await page.locator('[data-rail-direction="next"]').click();
	await expect(page.locator('[data-rail-count]')).toHaveText('2 / 5');
	await page.locator('.rail-led').first().click();
	await expectFirstSlide();

	await page.locator('[data-rail-direction="next"]').click();
	await expect(page.locator('[data-rail-count]')).toHaveText('2 / 5');
	await page.locator('.tree-link[href="#intro"]').click();
	await expectFirstSlide();
});

test('supports scoped arrow navigation from the slide indicators', async ({ page }) => {
	const indicators = page.locator('.rail-led');
	await indicators.nth(3).focus();
	await page.keyboard.press('ArrowRight');

	await expect(indicators.nth(4)).toBeFocused();
	await expect(indicators.nth(4)).toHaveAttribute('aria-current', 'step');
	await expect(page.locator('[data-rail-count]')).toHaveText('5 / 5');
});

test('has no detectable accessibility violations in either theme', async ({ page }) => {
	let results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);

	await page.locator('[data-theme-toggle]').click();
	results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);

	await page.setViewportSize({ width: 1366, height: 768 });
	await page.reload();
	await page.locator('[data-rail-direction="next"]').click();
	await expect(page.locator('#work')).toHaveAttribute('tabindex', '0');
	results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});

test('preserves non-carousel fragments and resets an empty carousel hash', async ({ page }) => {
	await page.goto('/#contact');
	await expect(page).toHaveURL(/#contact$/);
	await expect(page.locator('[data-rail-count]')).toHaveText('1 / 5');

	await page.goto('/#work');
	await expect(page.locator('[data-rail-count]')).toHaveText('2 / 5');
	await page.evaluate(() => {
		window.location.hash = '';
	});
	await expect(page.locator('[data-rail-count]')).toHaveText('1 / 5');
});

test('moves focus to the rail when a focused slide is swiped away', async ({ page }) => {
	await page.locator('[data-rail-direction="next"]').click();
	await page.waitForTimeout(750);
	await page.locator('#work a').first().focus();
	await page.locator('[data-card-rail]').evaluate((rail) => {
		const target = document.querySelector('#profile');
		rail.scrollTo({ left: target.offsetLeft, behavior: 'auto' });
	});

	await expect(page.locator('[data-card-rail]')).toBeFocused();
	await expect(page.locator('[data-rail-count]')).toHaveText('3 / 5');
	await expect(page.locator('[data-rail-announcement]')).toContainText('slide 3 of 5');
});

test('uses natural page height on a short viewport', async ({ page }) => {
	await page.setViewportSize({ width: 1024, height: 600 });
	await page.reload();

	const layout = await page.locator('#intro').evaluate((card) => ({
		overflowY: getComputedStyle(card).overflowY,
		pageOverflow: getComputedStyle(document.querySelector('main.page')).overflowY,
	}));

	expect(layout.overflowY).not.toBe('auto');
	expect(layout.pageOverflow).not.toBe('hidden');
});

test('keeps window chrome and footer aligned with the workspace outline', async ({ page }) => {
	await page.setViewportSize({ width: 1366, height: 768 });
	await page.reload();
	const lastTreeLink = page.locator('.tree-link').last();

	const layout = await page.evaluate(() => {
		const workspace = document.querySelector('.workspace').getBoundingClientRect();
		const windowBar = document.querySelector('.window-bar').getBoundingClientRect();
		const footer = document.querySelector('.page-footer').getBoundingClientRect();

		return {
			footerBelowWorkspace: footer.top >= workspace.bottom,
			windowBarTopGap: Math.round(windowBar.top - workspace.top),
			windowBarLeftGap: Math.round(windowBar.left - workspace.left),
		};
	});

	expect(layout.footerBelowWorkspace).toBe(true);
	expect(Math.abs(layout.windowBarTopGap - layout.windowBarLeftGap)).toBeLessThanOrEqual(1);
	expect(await lastTreeLink.evaluate((link) => {
		const rect = link.getBoundingClientRect();
		return link.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.bottom - 2));
	})).toBe(true);
});

test('prints dark-theme content with readable text', async ({ page }) => {
	await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
	await expect(page.locator('#intro-title')).toHaveCSS('color', 'rgb(17, 17, 17)');
	await expect(page.locator('.summary')).toHaveCSS('color', 'rgb(17, 17, 17)');
});

test.describe('mobile layout', () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test('keeps carousel controls visible and moves focus out of the closed menu', async ({ page }) => {
		await expect(page.locator('.rail-nav')).toBeVisible();
		await expect(page.locator('[data-rail-direction="next"]')).toBeVisible();
		const chromeScrim = await page.locator('.page').evaluate((pageElement) => {
			const style = getComputedStyle(pageElement, '::before');
			return {
				backdropFilter: style.backdropFilter,
				height: Number.parseFloat(style.height),
			};
		});
		expect(chromeScrim.backdropFilter).toContain('blur');
		expect(chromeScrim.height).toBeGreaterThan(80);
		let results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);

		await page.locator('[data-menu-toggle]').click();
		await expect(page.locator('#mobile-menu')).toBeVisible();
		await expect(page.locator('.session-bar')).toBeHidden();
		await page.locator('#mobile-menu a[href="#work"]').click();

		await expect(page.locator('#mobile-menu')).toBeHidden();
		await expect(page.locator('#work-title')).toBeFocused();
		await expect(page.locator('[data-rail-count]')).toHaveText('2 / 5');
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

		await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
		await page.locator('[data-menu-toggle]').click();
		await page.locator('#mobile-menu a[href="#intro"]').click();
		await expect(page.locator('#intro-title')).toBeFocused();
		const headingBox = await page.locator('#intro-title').boundingBox();
		expect(headingBox.y).toBeGreaterThanOrEqual(0);
		expect(headingBox.y + headingBox.height).toBeLessThanOrEqual(844);

		results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});

	test('fits the minimum supported viewport without page-level horizontal overflow', async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 568 });
		await page.reload();

		await expect(page.locator('#intro-title')).toBeVisible();
		await expect(page.locator('.rail-nav')).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	});
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('shows every portfolio section in linear order', async ({ page }) => {
		await expect(page.locator('.rail-nav')).toBeHidden();
		await expect(page.locator('[data-theme-toggle]')).toBeHidden();
		await expect(page.locator('[data-menu-toggle]')).toBeHidden();
		await expect(page.locator('[data-rail-card]')).toHaveCount(5);
		await expect(page.locator('#intro')).toBeVisible();
		await expect(page.locator('#work')).toBeVisible();
		await expect(page.locator('#style')).toBeVisible();
		await expect(page.locator('#work')).not.toHaveAttribute('inert', '');
	});
});

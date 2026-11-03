import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = ['/', '/work/truevue-android-migration/', '/work/mpesa-android/', '/resume/'];

test('shows the complete portfolio and direct work/contact actions', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle('Horácio Comé | Senior Android Engineer in Portugal');
	await expect(page.locator('h1')).toHaveText('Horácio Comé');
	for (const id of ['about', 'work', 'experience', 'skills', 'contact']) {
		await expect(page.locator(`#${id}`)).toBeVisible();
		await expect(page.locator(`#${id}`)).not.toHaveAttribute('inert');
	}
	await expect(page.getByRole('link', { name: 'View my work', exact: true })).toHaveAttribute('href', '#work');
	await expect(page.getByRole('link', { name: 'Email me', exact: true })).toHaveAttribute('href', 'mailto:mail@horacioco.me');
	await expect(page.locator('.project-card')).toHaveCount(2);
	await expect(page.locator('.proof-strip')).toContainText('2021–2023');
	await expect(page.locator('.proof-strip')).toContainText('FY25');
});

test('native navigation preserves browser Back and Forward', async ({ page }) => {
	await page.goto('/');
	await page.locator('.site-nav a[href="#work"]').click();
	await expect(page).toHaveURL(/#work$/);
	await page.locator('.site-nav a[href="#skills"]').click();
	await expect(page).toHaveURL(/#skills$/);
	await page.goBack();
	await expect(page).toHaveURL(/#work$/);
	await page.goBack();
	await expect(page).toHaveURL(/\/$/);
	await page.goForward();
	await expect(page).toHaveURL(/#work$/);
});

test('respects reduced-motion preferences for native scrolling', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'smooth');

	await page.emulateMedia({ reducedMotion: 'reduce' });
	await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');

	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'smooth');
});

test('skip link and theme toggle support native keyboard activation', async ({ page }) => {
	await page.goto('/');
	await page.keyboard.press('Tab');
	await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.locator('main')).toBeFocused();
	const toggle = page.locator('[data-theme-toggle]');
	await toggle.focus();
	await page.keyboard.press('Space');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	await page.goto('/work/truevue-android-migration/');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('uses system theme and tolerates unavailable storage', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.addInitScript(() => {
		Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage disabled'); } });
	});
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	await page.locator('[data-theme-toggle]').click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('CV download serves a real PDF alongside the accessible online version', async ({ page, request }) => {
	await page.goto('/');
	const download = page.getByRole('link', { name: 'Download CV (PDF)', exact: true });
	await expect(download).toHaveAttribute('download', '');
	const response = await request.get(await download.getAttribute('href'));
	expect(response.ok()).toBe(true);
	expect(response.headers()['content-type']).toContain('application/pdf');
	expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
	await page.goto('/resume/');
	await expect(page.getByRole('heading', { name: 'Professional experience' })).toBeVisible();
	await expect(page.locator('main')).toContainText('Jan 2024–present');
});

test('copy email provides feedback and a readable fallback', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/');
	await page.locator('[data-copy-email]').click();
	await expect(page.getByRole('status')).toHaveText('Email address copied.');
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('mail@horacioco.me');
	await page.evaluate(() => {
		navigator.clipboard.writeText = () => Promise.reject(new Error('Clipboard blocked'));
	});
	await page.locator('[data-copy-email]').click();
	await expect(page.getByRole('status')).toContainText('Select and copy');
	await expect(page.getByRole('status')).toContainText('mail@horacioco.me');
});

for (const route of pages) {
	test(`loads assets and resolves internal links on ${route}`, async ({ page, request, baseURL }) => {
		const errors = [];
		page.on('pageerror', error => errors.push(error.message));
		page.on('response', response => {
			if (response.url().startsWith(baseURL) && response.status() >= 400) errors.push(response.url());
		});
		await page.goto(route);
		await expect(page.locator('h1')).toHaveCount(1);
		const urls = await page.locator('a[href], img[src], link[rel="stylesheet"], script[src]').evaluateAll(elements => elements.map(element => element.href || element.src));
		for (const url of [...new Set(urls)]) {
			const destination = new URL(url);
			if (destination.origin !== baseURL) continue;
			const response = await request.get(destination.pathname);
			expect(response.ok(), url).toBe(true);
			if (destination.hash) {
				const content = await response.text();
				expect(content, url).toContain(`id="${destination.hash.slice(1)}"`);
			}
		}
		const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
		expect(canonical).toBe(`https://horacioco.me${route}`);
		const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
		expect(data['@graph'].some(node => node['@type'] === 'Person')).toBe(true);
		const image = new URL(await page.locator('meta[property="og:image"]').getAttribute('content'));
		expect((await request.get(image.pathname)).ok()).toBe(true);
		expect(errors).toEqual([]);
	});
}

test('prints all portfolio sections in document order without clipping', async ({ page }) => {
	await page.goto('/');
	await page.emulateMedia({ media: 'print' });
	const viewportWidth = await page.evaluate(() => innerWidth);
	const layout = await page.evaluate(() => {
		return ['about', 'work', 'experience', 'skills', 'contact'].map(id => {
			const element = document.getElementById(id);
			const rect = element.getBoundingClientRect();
			return { id, x: rect.x, y: rect.y, right: rect.right, height: rect.height, color: getComputedStyle(element).color };
		});
	});
	for (let index = 0; index < layout.length; index += 1) {
		const item = layout[index];
		expect(item.x).toBeGreaterThanOrEqual(0);
		expect(item.right).toBeLessThanOrEqual(viewportWidth);
		expect(item.height).toBeGreaterThan(0);
		expect(item.color).toBe('rgb(17, 17, 17)');
		if (index > 0) expect(item.y).toBeGreaterThan(layout[index - 1].y);
	}
	await expect(page.locator('.project-grid')).toHaveCSS('display', 'block');
	await expect(page.locator('.site-header')).toBeHidden();
	await page.emulateMedia({ media: 'print', colorScheme: 'light' });
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	await expect(page.locator('.project-card').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('enlarged text leaves contact and all content reachable by scrolling', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
	const layout = await page.evaluate(() => ({
		overflow: document.documentElement.scrollWidth > innerWidth,
		pageHeight: document.documentElement.scrollHeight,
		bodyOverflow: getComputedStyle(document.body).overflowY,
	}));
	expect(layout.overflow).toBe(false);
	expect(layout.pageHeight).toBeGreaterThan(900);
	expect(layout.bodyOverflow).not.toBe('hidden');
	await page.locator('#contact .contact-email').scrollIntoViewIfNeeded();
	const emailBox = await page.locator('#contact .contact-email').boundingBox();
	expect(emailBox.y + emailBox.height).toBeLessThanOrEqual(900);
});

test.describe('responsive layout', () => {
	for (const [width, height] of [[320,568],[390,844],[768,1024],[1024,768],[1440,900]]) {
		test(`fits ${width}px and preserves direct email access`, async ({ page }) => {
			await page.setViewportSize({ width, height });
			await page.goto('/');
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
			const email = page.getByRole('link', { name: 'Email me', exact: true });
			const box = await email.boundingBox();
			if (width === 390) expect(box.y + box.height).toBeLessThan(height);
			await page.locator('#contact').scrollIntoViewIfNeeded();
			const headerEmail = page.getByRole('link', { name: 'Email Horácio', exact: true });
			const headerBox = await headerEmail.boundingBox();
			expect(headerBox.y).toBeGreaterThanOrEqual(0);
			expect(headerBox.height).toBeGreaterThanOrEqual(44);
		});
	}
});

test.describe('mobile menu', () => {
	test.use({ viewport: { width: 390, height: 844 } });
	for (const key of ['Enter', 'Space']) {
		test(`reaches menu links with ${key} and forward Tab on every page`, async ({ page }) => {
			for (const route of pages) {
				await page.goto(route);
				const toggle = page.locator('[data-menu-toggle]');
				const links = page.locator('.site-nav a');
				await toggle.focus();
				await page.keyboard.press(key);
				await expect(toggle).toHaveAttribute('aria-expanded', 'true');
				await expect(links.first()).toBeFocused();
				const linkCount = await links.count();
				for (let index = 1; index < linkCount; index += 1) {
					await page.keyboard.press('Tab');
					await expect(links.nth(index)).toBeFocused();
				}
				await page.keyboard.press('Escape');
				await expect(page.locator('.site-nav')).toBeHidden();
				await expect(toggle).toHaveAttribute('aria-expanded', 'false');
				await expect(toggle).toBeFocused();
			}
		});
	}

	test('supports Contact, Escape, focus restoration, and native history', async ({ page }) => {
		await page.goto('/');
		const toggle = page.locator('[data-menu-toggle]');
		await toggle.click();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await page.locator('.site-nav a[href="#contact"]').focus();
		await page.keyboard.press('Escape');
		await expect(page.locator('.site-nav')).toBeHidden();
		await expect(toggle).toBeFocused();
		await toggle.click();
		await page.locator('.site-nav a[href="#contact"]').click();
		await expect(page.locator('.site-nav')).toBeHidden();
		await expect(page.locator('#contact')).toBeFocused();
		await expect(page).toHaveURL(/#contact$/);
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await page.goBack();
		await expect(page).toHaveURL(/\/$/);
	});

	test('keeps fragment headings below the sticky header', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		for (const id of ['work','experience','skills','contact','intro','profile','outcomes','style']) {
			await page.goto(`/#${id}`);
			await page.waitForTimeout(100);
			const clearance = await page.evaluate((id) => ({
				target: document.getElementById(id).getBoundingClientRect().top,
				header: document.querySelector('.site-header').getBoundingClientRect().bottom,
			}), id);
			if (id !== 'intro') expect(clearance.target, id).toBeGreaterThanOrEqual(clearance.header);
		}
	});
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
	test('shows navigation, projects, contact, and CV without enhancement', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.site-nav')).toBeVisible();
		await expect(page.locator('#work')).toBeVisible();
		await expect(page.locator('#contact')).toBeVisible();
		await expect(page.locator('[data-menu-toggle]')).toBeHidden();
		await expect(page.locator('[data-theme-toggle]')).toBeHidden();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
		await page.getByRole('link', { name: 'Read TrueVUE case study' }).click();
		await expect(page.locator('h1')).toContainText('TrueVUE');
	});
});

for (const width of [390, 1440]) {
	for (const theme of ['dark', 'light']) {
		for (const route of pages) {
			test(`accessibility: ${route} in ${theme} at ${width}px`, async ({ page }) => {
				await page.setViewportSize({ width, height: 900 });
				await page.emulateMedia({ colorScheme: theme });
				await page.goto(route);
				const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']).analyze();
				expect(results.violations).toEqual([]);
			});
		}
	}
}

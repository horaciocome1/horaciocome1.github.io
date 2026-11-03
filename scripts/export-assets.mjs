import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const browser = await chromium.launch();
try {
	const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
	for (const source of ['og-image.svg', 'assets/truevue-migration.svg', 'assets/mpesa-android.svg']) {
		await page.goto(pathToFileURL(path.join(root, source)).href);
		await page.screenshot({ path: path.join(root, source.replace('.svg', '.png')), omitBackground: false });
	}
	console.log('Exported three social preview images.');
} finally {
	await browser.close();
}

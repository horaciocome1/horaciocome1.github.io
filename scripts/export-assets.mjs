import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const browser = await chromium.launch();
try {
	const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
	for (const source of ['og-image.svg', 'assets/truevue-migration.svg', 'assets/mpesa-android.svg']) {
		await page.goto(pathToFileURL(path.join(root, source)).href);
		await page.screenshot({ path: path.join(root, source.replace('.svg', '.png')), omitBackground: false });
	}
	await page.goto(pathToFileURL(path.join(root, 'resume/index.html')).href);
	await page.emulateMedia({ media: 'print', colorScheme: 'light' });
	await page.pdf({ path: path.join(root, 'assets/horacio-come-cv.pdf'), preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
	const pdf = await readFile(path.join(root, 'assets/horacio-come-cv.pdf'));
	console.log(`Exported three social preview images and CV (${Math.round(pdf.length / 1024)} KB).`);
} finally {
	await browser.close();
}

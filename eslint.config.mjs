import js from '@eslint/js';
import globals from 'globals';

export default [
	{
		ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**'],
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'script',
			globals: {
				...globals.browser,
				...globals.es2021,
			},
		},
		rules: {
			...js.configs.recommended.rules,
		},
	},
	{
		files: ['**/*.mjs'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			...js.configs.recommended.rules,
		},
	},
];

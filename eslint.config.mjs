import js from '@eslint/js';
import globals from 'globals';

export default [
	{
		ignores: ['node_modules/**'],
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
];

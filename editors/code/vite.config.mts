import vscode from '@tomjs/vite-plugin-vscode';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		svelte(),
		vscode({
			extension: {
				sourcemap: 'inline',
				entry: 'src/index.ts',
				watchFiles: './src',
			},
			webview: {
				csp: `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https://vite.dev https://svelte.dev https: data:; style-src 'unsafe-inline' {{cspSource}}; script-src 'nonce-{{nonce}}' 'unsafe-eval';">`,
			},
		}),
		tailwindcss(),
	],
	resolve: {
		alias: {
			connections: resolve(__dirname, 'src/connections.ts'),
		},
	},
	build: {
		rollupOptions: {
			input: {
				addConnection: resolve(__dirname, 'webviews/AddConnection.html'),
			},
		},
		emptyOutDir: true,
		sourcemap: 'inline',
	},
});

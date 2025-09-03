import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	server: {
		// proxy: {
		// 	'/api/chat': 'http://localhost:3001'
		// }
	},
	optimizeDeps: {
		exclude: ['@tailwindcss/oxide', 'lightningcss']
	},
	ssr: {
		noExternal: ['@tailwindcss/oxide', 'lightningcss']
	}
});

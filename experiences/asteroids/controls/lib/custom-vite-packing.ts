import { defineConfig } from 'vite';
// import react from "@vitejs/plugin-react";

export default defineConfig({
	// plugins: [react()],
	build: {
		minify: false,
		lib: {
			entry: 'lib/NonStandardDependencies.tsx',
			name: 'NonStandardDependencies',
			fileName: 'NonStandardDependencies',
			formats: ['es'],
		},
		rollupOptions: {
			external: ['react', 'react-dom', '@footron/controls-client', '@material-ui/core', '@material-ui/icons'],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
					'@footron/controls-client': 'FootronControlsClient'
				},
			},
		},
	},
});

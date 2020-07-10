const production = !process.env.ROLLUP_WATCH

export default {
	input: 'index.js',
	output: {
		format: 'iife',
		name: 'app',
		file: 'build/bundle.js'
	},
	plugins: [
		require('rollup-plugin-svelte')({
			dev: !production,
			css: css => css.write('build/bundle.css', false)
		}),
		require('@rollup/plugin-node-resolve')({
			browser: true,
			dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/'),
			customResolveOptions: {
				moduleDirectory: ['src', 'node_modules'],
				extensions: ['.svelte', '/index.svelte', '.mjs', '.js', '.json']
			}
		}),
		require('@rollup/plugin-commonjs')(),
		require('rollup-plugin-serve')('./'),
		require('rollup-plugin-livereload')('./'),
		require('rollup-plugin-terser').terser()
	]
}

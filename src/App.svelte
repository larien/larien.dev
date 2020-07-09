<script>
	import Header from './layout/header/Header.svelte'
	import Body from './layout/body/Body.svelte'
	import Footer from './layout/footer/Footer.svelte'
</script>

<main>
	<body class="layout">
		<Header/>
		<Body/>
		<Footer/>
	</body>
</main>

<style>
	main {
		text-align: center;
	}

	.layout {
		display: flex;
		min-height: 100vh;
		flex-direction: column;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
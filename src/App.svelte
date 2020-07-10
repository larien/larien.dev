<script>
	import Header from './layout/header/Header.svelte'
	import Body from './layout/body/Body.svelte'
	import Footer from './layout/footer/Footer.svelte'

	let titleToggl = true
	let title

	toggle() // start with dark mode

	function toggle() {
		titleToggl = !titleToggl
		title = titleToggl ? "Dark mode" : "Light mode"
		window.document.body.classList.toggle('dark-mode')
	}
</script>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
<link href="https://fonts.googleapis.com/css?family=Coda" rel="stylesheet">

<i title={title} on:click={toggle} class="fa fa-moon-o"></i>

<Header/>
<Body/>
<Footer/>

<style>
	:global(body) {
		display: flex;
		min-height: 100vh;
		flex-direction: column;
		background-color: var(--bg-color);
		color: var(--text-color);
		transition: background-color 0.3s;
		text-align: center;
		font-family: 'Coda', monospace;
	}
	:global(body.dark-mode) {
		background-color: var(--bg-dark-color);
		color: var(--text-dark-color);
	}

	:root{
		--bg-color: #FFFFFF;
		--text-color: #1B2836;
		--secondary-text-color: #808F9A;
		--bg-dark-color: #1B2836;
		--text-dark-color: #FFFFFF;
		--blue: #1da1eb;
	}

	i {
		color: var(--blue);
		margin: 20px;
		padding: 20px;
		font-size: 30px;
		position: absolute;
		right: 0px;
	}
</style>
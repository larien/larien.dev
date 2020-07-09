<script>
let darkMode = false;
function toggle() {
    darkMode = !darkMode;
    console.log("dark mode alterado")
	window.document.body.classList.toggle("dark-mode")
}
</script>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">

<button on:click={toggle}>
	<slot/>
</button>
<style>
	button {
		background-color: #f76027;
		border: none;
		border-radius: 4px;
        padding: 0.5rem;
        position: absolute;
        right: 10px;
		
	}
	:global(body.dark-mode) button {
		background-color: #0084f6;
    }
</style>
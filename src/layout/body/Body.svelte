<script>
    import Flex from 'svelte-flex';

    let birth = new Date('1997/07/05')
    let current = new Date()
    let diff = current - birth
    var age = Math.floor(diff/31557600000); // divide by 1000*60*60*24*365.25
</script>

<section id="body">
            <h1>
                <p>Howdy!</p>
                <p>My name is <strong class="highlight">Lauren</strong> and I'm a <strong class="highlight">{age} year old</strong></p>
                <p>~typewriter~</p>
                <p>based in <strong class="highlight">São Paulo</strong>, <strong class="highlight">Brazil</strong></p>
            </h1>
</section>

<style>
    #body {
        display: flex;
        flex: 1;
    }

    h1 {
        margin-left: auto;
        margin-right: auto;
        margin-bottom: auto;
        margin-top: auto;
        font-size: 200%;
        font-weight: normal;
    }

    .highlight {
        color: var(--blue);
    }
</style>
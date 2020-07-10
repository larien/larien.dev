<script>
    import Typewriter from '../../components/Typewriter.svelte'

    let birth = new Date('1997/07/05')
    let current = new Date()
    let diff = current - birth
    let age = Math.floor(diff/31557600000); // divide by 1000*60*60*24*365.25
    
    let language = "pt"
    let toggleLanguage = false
    let selectable = true

    let changeLanguages = {
        "pt": "Mudar o idioma",
        "en": "Change language",
        "es": "Cambiar el idioma"
    }

    let changeLanguage = changeLanguages[language]

    function selectEn() {
        language = "en"
        changeLanguage = changeLanguages[language]
    }
    
    function selectPt() {
        language = "pt"
        changeLanguage = changeLanguages[language]
    }
    
    function selectEs() {
        language = "es"
        changeLanguage = changeLanguages[language]
    }
    
    function toggleLang() {
        toggleLanguage = !toggleLanguage
        selectable = true
    }

</script>

<section id="body">
    <h4 class="languages {language}">    
        <i on:click={toggleLang} title={changeLanguage} class="fa fa-language"></i>
        {#if toggleLanguage}
            {#if language == "pt"}
                <p on:click={selectPt} class="selected">PT</p>
            {:else}
                <p on:click={selectPt}>PT</p>
            {/if}
            {#if language == "en"}
                <p on:click={selectEn} class="selected">EN</p>
            {:else}
                <p on:click={selectEn}>EN</p>
            {/if}
            {#if language == "es"}
                <p on:click={selectEs} class="selected">ES</p>
            {:else}
                <p on:click={selectEs}>ES</p>
            {/if}
        {/if}
    </h4>
    <h1>
        <!-- {#if language == "pt"}
            <p>Olá!</p>
            <p>Meu nome é <strong class="highlight">Lauren</strong>.</p>
            <p>Tenho <strong class="highlight">{age} anos</strong> e sou uma</p>
            <p>de <strong class="highlight">São Paulo</strong>, <strong class="highlight">Brasil</strong>.</p>
        {/if}
        {#if language == "en"}
            <p>Hey!</p>
            <p>My name is <strong class="highlight">Lauren</strong></p>
            <p>and I'm a <strong class="highlight">{age} year old</strong></p> -->
            <!-- <Typewriter loop interval={70} cursor=#1da1f2>
                <p>sofware developer</p>
                <p>Computer Engineering student</p>
                <p>Gopher</p>
                <p>Korra fangirl</p>
                <p>amazon in training</p>
            </Typewriter> -->
            <!-- <p>based in <strong class="highlight">São Paulo</strong>, <strong class="highlight">Brazil</strong>.</p>
        {/if}
        {#if language == "es"}
            <p>¡Hola!</p>
            <p>Soy <strong class="highlight">Lauren</strong>.</p>
            <p>Tengo <strong class="highlight">{age} años</strong> y soy</p> -->
            <!-- <Typewriter loop interval={70} cursor=#1da1f2>
                <p>sofware developer</p>
                <p>estudiante de Ingeniería Informática</p>
                <p>Gopher</p>
                <p>Korra fangirl</p>
                <p>amazon en entrenamiento</p>
            </Typewriter> -->
            <!-- <p>de <strong class="highlight">São Paulo</strong>, <strong class="highlight">Brasil</strong>.</p>
        {/if} -->
                {#if language == "pt"}
                    <Typewriter loop interval={70} cursor=#1da1f2>
                        <p>Português</p>
                    </Typewriter>
                {/if}
                {#if language == "en"}
                    <Typewriter loop interval={70} cursor=#1da1f2>
                        <p>Inglês</p>
                    </Typewriter>
                {/if}
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

    i {
        font-size: 30px;
        color: var(--blue);
    }

    .languages {
        position: absolute;
        right: 0px;
        font-size: 20px;
        margin-right: 20px;
		padding-right: 20px;
        color: var(--secondary-text-color);
        cursor: default;
    }

    .selected {
        color: var(--blue);
    }
</style>
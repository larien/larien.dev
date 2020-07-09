<script>
    export let icon;
</script>

<div class="contact {icon}">
    {#if icon == "email"}
        <a
            title="E-mail address"
            href="mailto:lauren.ferremch@gmail.com"
            >
            <i class="fa fa-envelope"></i>
        </a>
    {:else if icon == "linkedin"}
        <a
            title="LinkedIn page"
            href="https://www.linkedin.com/in/lauren-ferreira-9836914b/"
            >
            <i class="fa fa-linkedin"></i>
        </a>
    {:else if icon == "twitter"}
        <a
            title="Twitter page"
            href="http://www.twitter.com/larienmf"
            >
            <i class="fa fa-twitter"></i>
        </a>
    {:else if icon == "github"}
        <a
            title="GitHub page"
            href="https://github.com/larien"
            >
            <i class="fa fa-github"></i>
        </a>
    {/if}
</div>

<style>
    a { color: inherit; } 
    .contact {
        border-style: 0 solid;
        border-radius: 8px;
        color: var(--secondary-text-color);
        font-size:30px;
        padding:15px;
        margin: 15px;  
    }
    .contact:hover {
        color: white;
    }
    .email:hover {
        background-color: red;
    }
    .linkedin:hover {
        background-color: #2867B2;
    }
    .github:hover{
        background-color: black;
    }
    .twitter:hover{
        background-color: #1da1f2;
    }
</style>
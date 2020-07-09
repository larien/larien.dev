<script>
    import Flex from 'svelte-flex';
    import Copyright from '../../components/Copyright.svelte'
    import ContactIcon from '../../components/ContactIcon.svelte'
    import Version from '../../components/Version.svelte'
</script>

<section id="footer">
    <Copyright />
    <Flex direction="row" align="center">
        <ContactIcon icon="github"/>
        <ContactIcon icon="twitter"/>
        <ContactIcon icon="email"/>
        <ContactIcon icon="linkedin"/>
    </Flex>
    <Version />
</section>

<style>
    #footer {
        height: 100px;
        margin-top:auto;
    }
</style>
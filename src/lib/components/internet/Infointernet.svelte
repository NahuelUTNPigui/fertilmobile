<script>
    let {
        coninternet = $bindable({})
    } = $props()
</script>
{#if coninternet.connected}
	<!-- Círculo verde -->
    <span
        class="h-3 w-3 rounded-full bg-green-500"
    >
        Conectado a internet
    </span>
	
{:else}
	<!-- Círculo rojo -->
     <span
        class="h-3 w-3 rounded-full bg-red-600 animate-pulse"
    >
        Sin conexión
    </span>
	
{/if}
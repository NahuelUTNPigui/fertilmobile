<script>
    let {
        coninternet = $bindable({})
    } = $props()
</script>
<div class="fixed top-0 left-0 right-0 z-50 bg-gray-100 dark:bg-gray-800 py-1 px-4 text-sm text-center shadow-sm">
    {#if coninternet.connected}
        <span class="text-green-600 dark:text-green-400">Conectado</span>
    {:else}
        <span class="text-red-600 dark:text-red-400">Sin conexión</span>
    {/if}
</div>

<!-- Espacio para evitar que el contenido quede oculto bajo la barra fija -->
<div class="h-8"></div>
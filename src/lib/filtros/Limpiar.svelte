<script>
    import estilos from "$lib/stores/estilos";
    let { limpiarFiltros } = $props();
</script>

<button
    onclick={limpiarFiltros}
    class={`
                    bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                    ${estilos.btnsecondary}
                    rounded-full
                    px-4 pt-2 pb-3
                `}
    aria-label="Limpiar"
>
    <span class="text-xl font-semibold">Limpiar</span>
</button>

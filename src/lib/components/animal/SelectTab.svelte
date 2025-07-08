<script>
    
    import { onMount, onDestroy } from "svelte";
    let {pestañas=$bindable([]),tab=$bindable("")} = $props()
    let abierto = $state(false)
    let container=$state({}); // referencia al div principal
    function getNombreOpcion(id){
        let p_idx = pestañas.findIndex(pes=>pes.id == id)
        if(p_idx != -1){
            return pestañas[p_idx].nombre
        }
        else{
            return ""
        }
    }
    function toggle() {
        abierto = !abierto;
    }

    function select(option) {
        tab = option;
        abierto = false;
    }
    function handleClickOutside(event) {
        if (!container.contains(event.target)) {
            abierto = false;
        }
    }
    onMount(() => {
        
        document.addEventListener("click", handleClickOutside);
    });

    onDestroy(() => {
        document.removeEventListener("click", handleClickOutside);
    });

</script>

<div class="relative w-64" bind:this={container}>
    <button
      onclick={toggle}
      class="w-full flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition"
    >
      <div class="flex items-center gap-2">
        <span class="text-xl text-gray-700 dark:text-gray-200">☰</span>
        <span class="text-gray-800 dark:text-gray-100">{getNombreOpcion(tab)}</span>
      </div>
      <svg
        class="w-4  text-gray-600 dark:text-gray-300 transform transition-transform duration-200"
        class:rotate-180={abierto}
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  
    {#if abierto}
      <div class="absolute mt-2  w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-10">
        <div class="flex flex-col">
            {#each pestañas as option}
                <button
                    onclick={() => select(option.id)}
                    class="text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition text-gray-700 dark:text-gray-200"
                >
                    {getNombreOpcion(option.id)}
                </button>
            {/each}
        </div>
        
      </div>
    {/if}
  </div>
<script>
    import { shorterWord } from "$lib/stringutil/lib";
    import Cloud from "$lib/svgs/cloud.svelte";
    import Threepoint from "$lib/svgs/threepoint.svelte";
    
    let {
        e,
        i,
        totalescolab,
        irEstablecimientoColab,
        sincronizadas = $bindable([]),
        agregarCab,
        quitarCab
    } = $props()
    let openMenu = $state(false)
    function toggleMenu(){
        openMenu = !openMenu
    }
    
    function esSincronizada(){
        
        return sincronizadas.includes(e.id)
    }
</script>
<div class="flex items-center justify-center">
    
    <div 
        class={`
                bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-2 w-full 
                max-w-5xl
        `}
    >
        <!-- Encabezado: nombre + menú -->
		<div class="flex items-start justify-between p-2">
            
            <h2 class="flex items-center gap-2 text-2xl font-bold  mb-1 text-start p-2">
                {shorterWord(e.nombre)}
                {#if esSincronizada()}
                    <!--Sincronizada-->
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="green" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                {:else}
                    <!--No sincronizada -->
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="yellow" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                {/if}
            </h2>
            
            
            <!-- Botón de tres puntos -->
			<div class="hidden relative">
                <button 
                    onclick={toggleMenu}
                    class="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                >
                    <Threepoint size="size-10"></Threepoint>
                </button>
                {#if openMenu}
                    <ul 
                        class="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 border
								border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10"
                    >
                        {#if esSincronizada()}
                            <li>
                                <button class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100
                                            dark:hover:bg-gray-600"
                                        onclick={clickQuitar}>
                                    Quitar para offline
                                </button>
                            </li>
                        {:else}
                            <li>
                                <button class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100
                                            dark:hover:bg-gray-600"
                                        onclick={clickAgregar}>
                                    Agregar para offline
                                </button>
                            </li>
                        {/if}
					</ul>
                {/if}
                
            </div>
        </div>
        
        <div class="p-2 grid grid-cols-1">
            <span class="text-xl font-semibold text-start">Direccion:</span>
            
            <span class="text-xl font-medium text-end">{e.direccion}</span>
        </div>
        <div class="p-2 grid grid-cols-3 lg:grid-cols-6">
            <span class="text-xl font-semibold text-start">Animales:</span>
            <span class="text-xl font-medium text-end">{totalescolab[i]}</span>
        </div>
        <div class="p-2">
            <button onclick={async ()=> await irEstablecimientoColab(e.id)} class={`mt-3  hover:text-gray-500 dark:hover:text-gray-600 inline-flex items-center `}>Ir establecimiento
                <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                    stroke-width="2" class="w-4 h-4 ml-2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
            </button>
        </div>
    </div>
</div>
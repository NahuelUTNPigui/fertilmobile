<script>
    import estilos from '$lib/stores/estilos';
    import {ChevronDown} from 'lucide-svelte'
    import { slide } from 'svelte/transition';
    let {opciones,etiqueta,valores=$bindable([]),filterUpdate} = $props()
    //Logica de las opciones
    let isOpen = $state(false)

    function clickOption(idopt){
        if(valores.includes(idopt)){
            valores = valores.filter(v =>v != idopt)
        }
        else{
            valores.push(idopt)

        }
        filterUpdate()
    }
    function getNombre(idopt){
        let op = opciones.filter(o=>o.id==idopt)[0]
        return op.nombre
    }
</script>
<div class="">
    <label for = "" class="label">
        <span class="label-text text-base">{etiqueta} </span>
    </label>
    <button 
        class={`
            mt-2 h-12 w-full p-2 text-left 
            flex items-center justify-between 
            border
            ${estilos.bgdark2}
            rounded-md 
            shadow-sm focus:outline-none focus:ring-2 
            focus:ring-green-500 focus:border-green-500

        `}
        onclick={()=>isOpen = !isOpen}
    >
        {#if valores.length == 0}
            <span class="block truncate">
                Todos
            </span>
        {:else}
            <div class="flex content-normal gap-2 overflow-x-hidden">
                {#each valores as v}
                    
                    <span 
                        class="
                        truncate
                        inline-flex items-center rounded-md 
                        px-2 py-1 text-base font-medium ring-1 ring-inset
                        bg-green-50 dark:bg-green-700
                        text-green-700 dark:text-green-50
                        ring-green-600/20 dark:ring-green-50/20 
                        "
                    >
                        {getNombre(v)}
                    </span>
                {/each}
            </div>

        {/if}
        
        <ChevronDown class={`w-5 h-5 ml-2 -mr-1 text-gray-400 transition-all duration-150 ${isOpen? 'transform rotate-180':''}`} />
    </button>
    {#if isOpen}

        <div 
            class={`
                ${estilos.bgdark2}
                absolute z-10 mt-0 bg-white rounded-md shadow-lg   
            `}
        >
            <ul 
                class="
                    text-base max-h-40 focus:outline-none sm:text-sm overflow-y-auto 
                    w-32
                    sm:w-40
                    md:w-72
                    lg:w-80
                    xl:w-96
                    2xl:w-96
                "
            >
                {#each opciones as v}
                    
                    <li class={`cursor-default hover:bg-green-100 hover:text-green-800 dark:hover:text-green-800  dark:text-white `}>
                        <button
                            class={`text-start w-full relative py-2 pl-3 select-none pr-9 bg-transparent`}
                            onclick={()=>clickOption(v.id)}
                        >   
                            <span
                                class={`
                                    
                                    truncate
                                    ${valores.some(item=>item==v.id)?"font-semibold":"font-normal"}
                                `}
                            >
                                {v.nombre}
                            </span>
                            {#if valores.some(item=>item == v.id)}
                                <span 
                                    class="absolute inset-y-0 right-0 flex items-center pr-4 text-green-600"
                                >
                                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </span>
                            {/if}
                            
                        </button>
                    </li>
                {/each}
            </ul>
        </div>

    {/if}
</div>
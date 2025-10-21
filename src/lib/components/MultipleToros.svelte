<script>
    import estilos from "$lib/stores/estilos";
    import { onMount } from "svelte";
    let {
        toros,
        listavalores=$bindable([]),
        valor=$bindable([]),
        cambiar=()=>{},
        quitarElemento=(id)=>{},
        agregarElemento=(id)=>{}
    } = $props()
    let cadenabuscar = $state("")
    let torosrows = $state([])
    let isOpen=$state(false)
    function inputCadena(){
        torosrows = toros
        if(cadenabuscar != ""){
            torosrows = torosrows.filter(t=>t.caravana.toLocaleLowerCase().includes(cadenabuscar.toLocaleLowerCase()))
        }
    }
    function clickOption(t){
        
        if(!dentroLista(t)){
            listavalores.push(t.id)
            agregarElemento(t.id)
            cambiar()
        }
        else{
            quitar(t.id)
        }
        
    }
    function dentroLista(t){
        if(listavalores.includes(t.id)){
            return true
        }
        else{
            return false
        }
    }
    function getNombre(id){
        let a = toros.filter(t=>t.id==id)[0]
        return a.caravana
    }
    function quitar(tid){
        listavalores = listavalores.filter(v=>v!=tid)
        quitarElemento(tid)
        cambiar()
        
    }
    onMount(()=>{
        torosrows = toros
    })
    
</script>
<div>   
    <input type="text"
        class={`
            input input-bordered w-full 
            ${estilos.bgdark2}
        `}
        
        bind:value={cadenabuscar} 
        oninput={inputCadena} 
        onclick={()=>{isOpen = !isOpen}}
    >
    {#if isOpen}
        <div 
            class={`
                absolute z-10 mt-0  rounded-md shadow-lg   
                bg-white border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-gray-100
            `}
        >
            <ul 
                class="
                    text-base max-h-40 focus:outline-none sm:text-sm overflow-y-auto 
                    w-80 lg:w-96"
            >
                {#each torosrows as t}
                    <li class={`cursor-default hover:bg-green-100 hover:text-green-800 dark:hover:text-green-800  dark:text-white `}>
                        <button
                            class={`text-start w-full relative py-2 pl-3 select-none pr-9 bg-transparent`}
                            onclick={()=>clickOption(t)}
                        >
                            <span
                                class={`
                                    
                                    truncate
                                    ${dentroLista(t)?"font-semibold":"font-normal"}
                                `}
                            >
                                {t.caravana}
                                
                            </span>
                            {#if dentroLista(t)}
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
    {#if listavalores.length != 0}
        <div class="flex-row gap-1">
            {#each listavalores as tid}
            <button class="mt-1 mx-1" onclick={()=>quitar(tid)}>
                <div class="badge badge-success badge-outline">
                    {getNombre(tid)}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </div>
            </button> 
            {/each}
        </div>
    {/if}
</div>
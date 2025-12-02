<script>
    import estilos from "$lib/stores/estilos";
    import { onMount } from "svelte";

    let {
        lista = $bindable([]),
        etiqueta,
        valor=$bindable(""),
        cadena=$bindable(""),
        onelegir=()=>{},
        onwrite=()=>{},
        validarAnimal=()=>{},
        size="w-4/5"
    } = $props()
    function filterItems(item){
        if(cadena.length>0){
            return item.nombre.toLowerCase().includes(cadena.toLowerCase())
        }
        else{
            return true
        }
    }
    let listarow = $derived(lista.filter(item=>filterItems(item)))
    let isOpen = $state(false)
    let nombre = $state("")

    if(valor != ""){
        nombre = cadena
    }
    function cambioCadena(){
        if(onwrite){
            onwrite(cadena)
        }
        
        //if(cadena.length == 0){
        //    listarow = lista
        //    valor = ""
        //}
        //else{
        //    isOpen = true
        //    listarow = lista.filter(e=>e.nombre.toLowerCase().includes(cadena.toLowerCase()))
        //    //if(listarow.length == 1){
        //    //    valor = listarow[0].id
        //    //    if(onelegir){
        //    //        onelegir(valor)
        //    //    }
        //    //    
        //    //    nombre = listarow[0].nombre
        //    //}
        //    
        //}
        if(listarow.length == 0){
            valor = ""
        }
    }
    function clickOption(id){
        valor = id
        if(onelegir){
            onelegir(valor)
        }
        
        isOpen = !isOpen
        cadena = listarow.filter(l=>l.id==id)[0].nombre
        nombre = cadena
    }
    //$effect(()=>{
    //    if(valor.length !=0){
    //        cadena = listarow.filter(l=>l.id==valor)[0].nombre
    //        nombre = cadena
    //    }
    //})
    onMount(()=>{
        if(valor.length !=0){
            cadena = listarow.filter(l=>l.id==valor)[0].nombre
            nombre = cadena
        }
    })
    
</script>

<div class="w-full">
    
    <label for = "" class="label">
        <span class="label-text text-base">{etiqueta}</span>
    </label>
    <input
        type="text"  
        class={`
            input 
            input-bordered 
            border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
            w-full
            mb-0
            ${estilos.bgdark2} 
        `}
        
        oninput={cambioCadena}
        onclick={()=>isOpen = !isOpen}
        bind:value={cadena}

    />
    {#if isOpen}
        <div class={`mt-0 absolute z-10 max-h-40 overflow-auto ${size}`}>
            {#if listarow.length == 0}
                
                <div 
                    class={`
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        w-full
                        mb-0
                        bg-white
                        ${estilos.bgdark2} 
                    `}>
                    <button
                        class={`
                            text-start 
                            py-2 pl-3 
                            select-none pr-9
                            cursor-default
                            
                            
                        `}
                        
                    >   
                        <span
                            class={`
                                
                                truncate
                                font-normal
                                hover:bg-green-100 hover:text-green-800 dark:hover:text-green-800 dark:text-white
                            `}
                        >
                            No hay coincidencias
                        </span>
                    </button>
                    
                </div>
            {:else}
                <div 
                    class={`
                    
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        w-full
                        mb-0
                        bg-white
                        ${estilos.bgdark2} 
                    `}
                >
                    {#each listarow as v}
                        <button
                            class={`
                                text-start w-full 
                                relative py-2 pl-3 
                                select-none pr-9 bg-transparent
                                hover:bg-green-100 hover:text-green-800 dark:hover:text-green-800 dark:text-white
                            `}
                            onclick={()=>clickOption(v.id)}
                        >   
                            <span
                                class={`
                                    block
                                    truncate
                                    font-normal
                                `}
                            >
                                {v.nombre}
                            </span>
                            {#if v.id == valor}
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
                    {/each}
                </div>
            
            {/if}
        </div>
    {/if}
    {#if valor.length != 0}
        <span class="text-sm mt-1 ">Elegiste a {nombre}</span>
        
    {/if}

    

</div>
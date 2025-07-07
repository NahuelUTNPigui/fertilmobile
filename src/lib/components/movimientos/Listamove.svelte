<script>
    import estilos from "$lib/stores/estilos";
    import { capitalize } from "$lib/stringutil/lib";
    let {
        //bindings
        todos = $bindable(false),
        ninguno = $bindable(false),
        algunos = $bindable(false),
        animalesrows = $bindable([]),
        selecthashmap=$bindable({}),
        //constantes
        //Acciones
        clickTodos,
        getSexoNombre,
        getEstadoColor,
        getEstadoNombre,
        clickAnimal,
        
    } = $props()
</script>
<div class="hidden w-full md:grid grid-cols-1 justify-items-center mx-1 lg:mx-10 lg:w-5/6 overflow-x-auto" >
    <table class="table table-lg w-full " >
        <thead>
            <tr>
                <th class="px-1 p-0 m-0 border-b dark:border-gray-600">
                    <button    
                        aria-label="Todos"
                        onclick={clickTodos}
                        class={`
                            
                            text-base bg-transparent rounded-lg
                            px-3 py-3 text-base
                            ${estilos.secundario}
                        `}
                    >
                        {#if todos}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        {/if}
                        {#if ninguno}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        {/if}
                        {#if algunos}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>      
                        {/if}                        
                      
                    </button>
                </th>
                <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Caravana</th>
                <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Categoria</th>
                <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Rodeo</th>
                <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Lote</th>
                <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Sexo</th>
            </tr>
        </thead>
        <tbody>
            {#each animalesrows as a}
                <tr>
                    <td class="px-1 p-0 m-0 ">
                        <button
                            aria-label="fila"
                            onclick={()=>clickAnimal(a.id)}
                            class={`
                                font-medium bg-transparent rounded-lg
                                px-3 py-3 text-base
                                ${selecthashmap[a.id]?estilos.danger:estilos.primario}
                            `}
                        >
                            {#if selecthashmap[a.id]}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>                                  
                            {:else}             
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            {/if}
                        </button>
                    </td>
                    <td class="text-base mx-1 px-0 ">{a.caravana}</td>
                    <td class="text-base mx-1 px-0 ">{capitalize(a.categoria)}</td>
                    <td class="text-base mx-1 px-0 ">{a.expand?.rodeo?.nombre||''}</td>
                    <td class="text-base mx-1 px-0 ">{a.expand?.lote?.nombre||''}</td>
                    <td class="text-base mx-1 px-0 ">{getSexoNombre(a.sexo)}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
<div class="block  md:hidden justify-items-center mx-1">
    <div class="w-full flex justify-start">
        <button    
            aria-label="Todos"
            onclick={clickTodos}
            class={`
                text-base bg-transparent rounded-lg
                p-1 text-base flex flex-row
                ${estilos.secundario}
            `}
        >
            {#if todos}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            {/if}
            {#if ninguno}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            {/if}
            {#if algunos}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>      
            {/if}
                             
            <span class="mt-1">
                Seleccionar todos 
            </span>
        </button>
        
       
    </div>
    
    {#each animalesrows as a}
    <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
        <div class="block p-4">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-medium">
                    <button
                        aria-label="fila"
                        onclick={()=>clickAnimal(a.id)}
                        class={`
                            font-medium bg-transparent rounded-lg
                            px-3 py-3 text-base
                            ${selecthashmap[a.id]?estilos.danger:estilos.primario}
                        `}
                    >
                        {#if selecthashmap[a.id]}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>                                  
                        {:else}             
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        {/if}
                    </button>
                    {a.caravana}
                </h3>
                {#if a.sexo == "H" && a.prenada != 1}
                    <div class={`badge badge-outline badge-${getEstadoColor(a.prenada)}`}>{getEstadoNombre(a.prenada)}</div>
                {/if}
            </div>
            <div class="grid grid-cols-2 gap-y-2">
                <div class="flex items-start">
                  <span class="font-semibold">{getSexoNombre(a.sexo)}</span>
                </div>
                <div class="flex items-start">
                  <span >Categoría:</span> 
                  <span class="font-semibold">
                    {capitalize(a.categoria)}
                  </span>
                  
                </div>
                <div class="flex items-start">
                  <span >Lote:</span>
                  <span class="font-semibold">
                    {
                        a.expand?
                        a.expand.lote?
                        a.expand.lote.nombre
                        :""
                        :""
                    }
                  </span> 
                </div>
                <div class="flex items-start">
                    
                  <span >Rodeo:</span> 
                  <span class="font-semibold">
                    {
                        a.expand?
                        a.expand.rodeo?
                        a.expand.rodeo.nombre
                        :""
                        :""
                    }
                  </span>
                  
                </div>
            </div>
        </div>
    </div>
    {/each}
</div>
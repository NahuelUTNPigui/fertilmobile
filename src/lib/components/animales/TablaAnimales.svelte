<script>
    import { goto }  from '$app/navigation';
    import estilos from '$lib/stores/estilos';
    let {
        animalesrows=$bindable([]),
        shorterWord,
        getEstadoColor,
        getEstadoNombre,
        getSexoNombre,
        getNombreLote,
        getNombreRodeo,
        ordenarAnimales
    } = $props();

</script>
<table class="table table-lg w-full" >
    <thead>
        <tr >
            <th 
                onclick={()=>ordenarAnimales("caravana")}
                class={`
                    cursor-pointer
                    text-base p-3 border-b dark:border-gray-600 
                    hover:cursor-pointer hover:bg-gray-200 
                    dark:hover:bg-gray-800
                `}  
            >
                Animal
            </th>
            <th 
                onclick={()=>ordenarAnimales("sexo")}
                class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"
            >
                Sexo
            </th>
            <th 
                onclick={()=>ordenarAnimales("categoria")}
                class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"  
            >
                Categoria
            </th>
            <th 
                onclick={()=>ordenarAnimales("estado")}
                class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800" 
            >
                Estado
            </th>
            <th 
                onclick={()=>ordenarAnimales("lote")}
                class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"  
            >
                Lote
            </th>
            <th 
                onclick={()=>ordenarAnimales("rodeo")}
                class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"
            >
                Rodeo
            </th>
            <!--<th class="text-base"  >Acciones</th>-->
            
        </tr>
        
    </thead>
    
    <tbody>
        {#each animalesrows as a}
        <tr class=" hover:bg-gray-200 dark:hover:bg-gray-900" onclick={()=>goto(`/animales/${a.id}`)}>
            <td class="text-base p-3 ">
                <div class="flex gap-1">
                    {`${a.caravana}`}
                    {#if !a.active}
                        <div class={`
                            bg-transparent rounded-lg
                            p-0 m-0  ${estilos.danger}
                        `}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                            </svg>
                        </div>
                    {/if}
                </div>
            </td>
            <td class="text-base p-3 "> {a.sexo}</td>
            <td class="text-base p-3 "> {a.categoria}</td>
            <td class="text-base p-3 "> 
                {getEstadoNombre(a.prenada)}
            </td>
            <td class="text-base p-3 ">
                {
                    getNombreLote(a.lote)
                    
                }
            </td>
            <td class="text-base p-3 ">
                {
                    getNombreRodeo(a.rodeo)
                }
            </td>
            
        </tr>
        {/each}
</table>
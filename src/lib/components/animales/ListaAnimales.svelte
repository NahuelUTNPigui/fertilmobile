<script>
    import { goto }  from '$app/navigation';
    let {
        animalesrows=$bindable([]),
        shorterWord,
        getEstadoColor,
        getEstadoNombre,
        getSexoNombre,
        getNombreLote,
        getNombreRodeo,
    } = $props();

</script>
{#each animalesrows as a}
    <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
        <!--<button  onclick={()=>goto(`/animales/${a.id}`)}>-->
        <button  onclick={()=>goto(`/animales/${a.id}`)}>
            <div class="block p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-medium">{shorterWord(a.caravana)}</h3>
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
                        {a.categoria}
                    </span>
                    
                    </div>
                    <div class="flex items-start">
                    <span >Lote:</span>
                    <span class="font-semibold">
                        {
                            getNombreLote(a.lote)
                        }
                    </span> 
                    </div>
                    <div class="flex items-start">
                        
                    <span >Rodeo:</span> 
                    <span class="font-semibold">
                        {
                            getNombreRodeo(a.rodeo)
                        }
                    </span>
                    
                    </div>
                </div>
            </div>
        </button>
    </div>
{/each}
<script>
    import { shorterWord } from "$lib/stringutil/lib";
    import estilos from "$lib/stores/estilos";
    
    let {
        listaanimales=$bindable([])
    } = $props()

</script>
<div class="block justify-items-center mx-1">
    {#each listaanimales as a,i}
        <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
            <div class="block p-4">
                <div class="grid grid-cols-2 gap-y-2">
                    <div class="flex items-start col-span-2">
                        <span >Caravana:</span> 
                        <span class="font-semibold">
                          {shorterWord(a.caravana)}
                        </span>
                    </div>
                    <div class="flex items-start col-span-2">
                        <span >Lote:</span> 
                        <span class="font-semibold">
                            {
                                a.expand?
                                a.expand.lote?
                                a.expand.lote.nombre:
                                "":
                                ""
                            }
                        </span>
                    </div>
                    <div class="flex items-start col-span-2">
                        <span >Rodeo:</span> 
                        <span class="font-semibold">
                            {
                                a.expand?
                                a.expand.rodeo?
                                a.expand.rodeo.nombre:
                                "":
                                ""
                            }
                        </span>
                    </div>
                </div>
            </div>
        </div>
    {/each}
</div>
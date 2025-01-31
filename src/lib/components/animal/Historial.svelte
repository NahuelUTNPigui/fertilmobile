<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import tiposanimal from '$lib/stores/tiposanimal';
    import categorias from "$lib/stores/categorias";
    import estados from "$lib/stores/estados";
    import {capitalize} from "$lib/stringutil/lib"
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let id = $state("")
    let historial = $state([])

    async function getHistorial(){
        historial = await pb.collection("historialanimales").getFullList({
            filter:`animal='${id}'`,
            sort:"-created",
            expand:"lote,rodeo"
        })

    }
    function getEstadoNombre(estado){
        let e = estados.filter(est=>est.id==estado)[0]
        return e.nombre
    }
    onMount(async ()=>{
        id = $page.params.slug
        await getHistorial()
    })
</script>

<div class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto">
    {#if historial.length == 0}
        <p class="mt-5 text-lg">No recibio modificaciones</p>
    {:else}
        <table class="table table-lg " >
            <thead>
                <tr>
                    <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                    <th class="text-base mx-1 px-1"  >Lote</th>
                    <th class="text-base mx-1 px-1"  >Rodeo</th>
                    <th class="text-base mx-1 px-1"  >Categoria</th>
                    <th class="text-base mx-1 px-1"  >Estado</th>
                    <th class="text-base mx-1 px-1"  >Peso</th>
                    <th class="text-base mx-1 px-1"  >Nacimiento</th>
                    <th class="text-base mx-1 px-1"  >Sexo</th>
                    <th class="text-base mx-1 px-1"  >Caravana</th>

                </tr>
            </thead>
            <tbody>
                {#each historial as h}
                    <tr>
                        <td class="text-base">
                            {`${new Date(h.created).toLocaleDateString()}`}
                        </td>
                        <td class="text-base">
                            {
                                h.expand?
                                    h.expand.lote?
                                        h.expand.lote.nombre:
                                    "":
                                ""
                            }
                        </td>
                        <td class="text-base">
                            {
                                h.expand?
                                    h.expand.rodeo?
                                        h.expand.rodeo.nombre:
                                    "":
                                ""
                            }
                        </td>
                        <td class="text-base">
                            {capitalize(h.categoria)}
                        </td>
                        <td class="text-base">
                            {getEstadoNombre(h.prenada)}
                        </td>
                        <td class="text-base">
                            {h.peso}
                        </td>
                        <td class="text-base">
                            {`${new Date(h.fechanacimiento).toLocaleDateString()}`}
                        </td>
                        <td class="text-base">
                            {h.sexo}
                        </td>
                        <td class="text-base">
                            {h.caravana}
                        </td>
                        
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>
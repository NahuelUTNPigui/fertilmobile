<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import estilos from "$lib/stores/estilos";
    import PocketBase from "pocketbase";
    import tiposanimal from "$lib/stores/tiposanimal";
    import categorias from "$lib/stores/categorias";
    import estados from "$lib/stores/estados";
    import { capitalize } from "$lib/stringutil/lib";
    import { getEstadoNombre } from "../estadosutils/lib";
    import { loger } from "$lib/stores/logs/logs.svelte";
    let {
        lotes = $bindable([]),
        rodeos = $bindable([]),
        historial = $bindable([]),
        coninternet=$bindable({})
        
    } = $props();
    let historialrows = $state([]);
    let ruta = import.meta.env.VITE_RUTA;
    const pb = new PocketBase(ruta);
    let id = $state("");
    async function getHistorial() {
        historial = await pb.collection("historialanimales").getFullList({
            filter: `animal='${id}'`,
            sort: "-created",
            expand: "lote,rodeo",
        });
    }
    function onChangeHistorial() {
        historialrows = historial.filter((h) => h.animal == id);
        historialrows.sort((h1, h2) =>
            new Date(h1.fecha) > new Date(h2.fecha) ? -1 : 1,
        );
    }
    function getNombreRodeo(_rodeo) {
        let r = rodeos.filter((ro) => ro.id == _rodeo)[0];
        
        if (r) {
            return r.nombre;
        } else {
            return "";
        }
    }
    function getNombreLote(_lote) {
        let l = lotes.filter((lo) => lo.id == _lote)[0];
        
        if (l) {
            return l.nombre;
        } else {
            return "";
        }
    }
    onMount(async () => {
        id = $page.params.slug;
        //onChangeHistorial();
        //await getHistorial()
    });
</script>

<div
    class="hidden w-full md:block justify-items-center mx-1 lg:w-3/4 overflow-x-auto"
>
    {#if historial.length == 0}
        <p class="mt-5 text-lg">No recibio modificaciones</p>
    {:else}
        <table class="table table-lg">
            <thead>
                <tr>
                    <th class="text-base ml-3 pl-3 mr-1 pr-1">Fecha</th>
                    <th class="text-base mx-1 px-1">Lote</th>
                    <th class="text-base mx-1 px-1">Rodeo</th>
                    <th class="text-base mx-1 px-1">Categoria</th>
                    <th class="text-base mx-1 px-1">Estado</th>
                    <th class="text-base mx-1 px-1">Peso</th>
                    <th class="text-base mx-1 px-1">Nacimiento</th>
                    <th class="text-base mx-1 px-1">Sexo</th>
                    <th class="text-base mx-1 px-1">Caravana</th>
                </tr>
            </thead>
            <tbody>
                {#each historial as h}
                    <tr>
                        <td class="text-base">
                            {`${new Date(h.created).toLocaleDateString()}`}
                        </td>
                        <td class="text-base">
                            {getNombreLote(h.lote)}
                        </td>
                        <td class="text-base">
                            {getNombreRodeo(h.rodeo)}
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
                            {`${h.fechanacimiento ? new Date(h.fechanacimiento).toLocaleDateString() : ""}`}
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
<div
    class="block w-full md:hidden justify-items-center mx-1 lg:w-3/4 overflow-x-auto"
>
    {#if historial.length == 0}
        <p class="mt-5 text-lg">No recibio modificaciones</p>
    {:else}
        {#each historial as h}
            <div
                class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
            >
                <div class="block p-4">
                    <div class="grid grid-cols-2 gap-y-2">
                        <div class="flex items-start">
                            <span>Fecha:</span>
                            <span class="font-semibold">
                                {`${new Date(h.created).toLocaleDateString()}`}
                            </span>
                        </div>
                        <div class="flex items-start">
                            <span>Lote:</span>
                            <span class="font-semibold">
                                {getNombreLote(h.lote)}
                            </span>
                        </div>
                        <div class="flex items-start">
                            <span>Rodeo:</span>
                            <span class="font-semibold">
                                {getNombreLote(h.rodeo)}
                            </span>
                        </div>
                        <div class="flex items-start">
                            <span>Categoria:</span>
                            <span class="font-semibold">
                                {capitalize(h.categoria)}
                            </span>
                        </div>
                        <div class="flex items-start">
                            <span>Estado:</span>
                            <span class="font-semibold">
                                {getEstadoNombre(h.prenada)}
                            </span>
                        </div>
                        <div class="flex items-start">
                            <span>Peso:</span>
                            <span class="font-semibold">
                                {h.peso}
                            </span>
                        </div>
                        <div class="flex items-start col-span-2">
                            <span>Nacimiento:</span>
                            <span class="font-semibold">
                                {`${h.fechanacimiento ? new Date(h.fechanacimiento).toLocaleDateString() : ""}`}
                            </span>
                        </div>
                        <div class="flex items-start">
                            <span>Sexo:</span>
                            <span class="font-semibold">
                                {h.sexo}
                            </span>
                        </div>
                        <div class="flex items-start">
                            <span>Caravana:</span>
                            <span class="font-semibold">
                                {h.caravana}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    {/if}
</div>

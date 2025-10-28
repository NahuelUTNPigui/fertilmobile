<script>
    import { shorterWord } from "$lib/stringutil/lib";
    import Evolucion from "./Evolucion.svelte";
    import estilos from "$lib/stores/estilos";

    let {
        estadisticas = $bindable([]),
        historico = $bindable([]),
        fechadesde,
        fechahasta,
        grupos,
        singrupo,
    } = $props();
    let elegir = $state("");

    let historicorows = $derived(historico.filter((h) => h.grupo == elegir));

    function getNombre(id) {
        let ops = grupos.filter((o) => o.id == id);
        if (ops.length == 0) {
            return singrupo;
        }

        return ops[0].nombre;
    }
    function getTituloFecha(texto, fecha) {
        if (fecha.length > 0) {
            return texto + " " + new Date(fecha).toLocaleDateString();
        } else {
            return "";
        }
    }
     //ver grafico
    let vergrafico = $state(false);
    let verhistorico = $state(false);
    function mostrarHistorico(p_elegir) {
        vergrafico = false
        verhistorico = true;
        elegir = p_elegir;
        const element = document.getElementById('Grafico');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
    }
    function recalcularHistorico(){
        mostrarHistorico(elegir)
    }
    function cerrarHistorico() {
        verhistorico = false;
    }
   
</script>

<h2 class="text-xl text-bold">
    Valores {getTituloFecha("desde", fechadesde) +
        " " +
        getTituloFecha("hasta", fechahasta)}
</h2>
<div
    class="hidden w-full sm:grid justify-items-center lg:w-5/6 overflow-x-auto"
>
    <table class="table table-lg w-full">
        <thead>
            <tr>
                <th
                    class={`
                            text-base p-3 border-b dark:border-gray-600 
                        `}
                >
                    <div class="flex flex-row justify-between">Nombre</div>
                </th>
                <th
                    class={`
                            text-base p-3 border-b dark:border-gray-600 
                        `}
                >
                    <div class="flex flex-row justify-between">Cantidad</div>
                </th>
                <th
                    class={`
                            text-base p-3 border-b dark:border-gray-600 
                        `}
                >
                    <div class="flex flex-row justify-between">Peso</div>
                </th>
                <th
                    class={`
                            text-base p-3 border-b dark:border-gray-600 
                        `}
                >
                    <div class="flex flex-row justify-between">
                        Peso promedio
                    </div>
                </th>
                <th
                    class={`
                            text-base p-3 border-b dark:border-gray-600 
                        `}
                >
                    <div class="flex flex-row justify-between">Accion</div>
                </th>
            </tr>
        </thead>
        <tbody>
            {#each estadisticas as e}
                <tr>
                    <td class="text-base p-3"> {e.nombre}</td>
                    <td class="text-base p-3"> {e.cantidad}</td>
                    <td class="text-base p-3"> {e.peso}</td>
                    <td class="text-base p-3">
                        {Math.floor(e.promedio * 100) / 100}</td
                    >
                    <td>
                        <button
                            onclick={() => mostrarHistorico(e.grupo)}
                            class={`
                                bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                                ${estilos.btnsecondary}
                                rounded-full
                                px-4 pt-2 pb-3
                            `}
                            aria-label="historial"
                        >
                            <span class="text-xl font-semibold">Historial</span>
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<div class="block sm:hidden justify-items-center mx-1">
    {#each estadisticas as e}
        <div class="card w-full shadow-xl p-2">
            <div class="block p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-medium">
                        {shorterWord(e.nombre)}
                    </h3>
                </div>
                <div class="grid grid-cols-2 gap-y-2">
                    <div class="flex items-start">
                        <span>Cantidad:</span>
                        <span class="font-semibold">
                            {e.cantidad}
                        </span>
                    </div>
                    <div class="flex items-start">
                        <span>Peso:</span>
                        <span class="font-semibold">
                            {e.peso}
                        </span>
                    </div>
                    <div class="col-span-2 flex items-start gap-2">
                        <span>Peso Promedio:</span>
                        <span class="font-semibold">
                            {Math.floor(e.promedio * 100) / 100}
                        </span>
                    </div>
                    <div class="col-span-2 flex items-start gap-2">
                        <button
                            onclick={() => mostrarHistorico(e.grupo)}
                            class={`
                                bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                                ${estilos.btnsecondary}
                                rounded-full
                                px-4 pt-2 pb-3
                            `}
                            aria-label="Exportar"
                        >
                            <span class="text-xl font-semibold">Historial</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/each}
</div>
<!--Historico-->
{#if verhistorico}
    <h2 class="text-xl text-bold">Historico</h2>
    <div class="my-0 py-0">
        <label for="sexo" class="label mb-0">
            <span class="label-text text-base">Grupo</span>
        </label>
        <label class="input-group">
            <select
                class={`
                select select-bordered w-full
                rounded-md
                focus:outline-none focus:ring-2 
                focus:ring-green-500 
                focus:border-green-500
                
                ${estilos.bgdark2}
            `}
                bind:value={elegir}
                onchange={recalcularHistorico}
            >
                <option value="" class="rounded">{singrupo}</option>
                {#each grupos as s}
                    <option value={s.id} class="rounded">{s.nombre}</option>
                {/each}
            </select>
        </label>
    </div>

    <div
        class="hidden w-full md:grid justify-items-center lg:w-5/6 overflow-x-auto"
    >
        <table class="table table-lg w-full">
            <thead>
                <tr>
                    <th
                        class={`
                            text-base p-3 border-b dark:border-gray-600 
                        `}
                    >
                        <div class="flex flex-row justify-between">Fecha</div>
                    </th>
                    <th
                        class={`
                            text-base p-3 border-b dark:border-gray-600 
                        `}
                    >
                        <div class="flex flex-row justify-between">Nombre</div>
                    </th>
                    <th
                        class={`
                            text-base p-3 border-b dark:border-gray-600 
                        `}
                    >
                        <div class="flex flex-row justify-between">
                            Cantidad
                        </div>
                    </th>
                    <th
                        class={`
                            text-base p-3 border-b dark:border-gray-600 
                        `}
                    >
                        <div class="flex flex-row justify-between">Peso</div>
                    </th>
                    <th
                        class={`
                            text-base p-3 border-b dark:border-gray-600 
                        `}
                    >
                        <div class="flex flex-row justify-between">
                            Peso promedio
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                {#each historicorows as h}
                    <tr>
                        <td class="text-base p-3">
                            {new Date(h.fecha).toLocaleDateString()}</td
                        >
                        <td class="text-base p-3"> {getNombre(h.grupo)}</td>
                        <td class="text-base p-3"> {h.cantidad}</td>
                        <td class="text-base p-3"> {h.peso}</td>
                        <td class="text-base p-3">
                            {Math.round(h.promedio * 100) / 100}</td
                        >
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="block md:hidden justify-items-center mx-1">
        {#each historicorows as h}
            <div class="card w-full shadow-xl p-2">
                <div class="block p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-medium">
                            {getNombre(h.grupo)}
                        </h3>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-y-2">
                    <div class="flex items-start">
                        <span>Fecha:</span>
                        <span class="font-semibold">
                            {new Date(h.fecha).toLocaleDateString()}
                        </span>
                    </div>
                    <div class="flex items-start">
                        <span>Cantidad:</span>
                        <span class="font-semibold">
                            {h.cantidad}
                        </span>
                    </div>
                    <div class="flex items-start">
                        <span>Peso:</span>
                        <span class="font-semibold">
                            {h.peso}
                        </span>
                    </div>
                    <div class="flex items-start">
                        <span>Peso promedio:</span>
                        <span class="font-semibold">
                            {Math.round(h.promedio * 100) / 100}
                        </span>
                    </div>
                </div>
            </div>
        {/each}
    </div>
    {#if vergrafico}
        <Evolucion {historicorows} {elegir} elegirnombre={getNombre(elegir)} />
    {:else}
        <div class="col-span-2 flex items-start gap-2">
            <button
                onclick={() => (vergrafico = true)}
                class={`
                                bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                                ${estilos.btnsecondary}
                                rounded-full
                                px-4 pt-2 pb-3
                            `}
                aria-label="Grafico"
                id="Grafico"
            >
                <span class="text-xl font-semibold">Gráfico</span>
            </button>
        </div>
    {/if}
{/if}

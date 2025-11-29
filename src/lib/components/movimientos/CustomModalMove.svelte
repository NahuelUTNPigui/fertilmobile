<script>
    import { slide } from "svelte/transition";
    import estilos from "$lib/stores/estilos";
    import Animalesmodal from "./Animalesmodal.svelte";
    import SelectFertil from "../SelectFertil.svelte";
    import CustomDate from "../CustomDate.svelte";
    let {
        //binds
        nuevacategoria = $bindable(""),
        nuevolote = $bindable(""),
        nuevorodeo = $bindable(""),
        tipotratamiento = $bindable(""),
        fecha = $bindable(""),
        motivo = $bindable(""),
        fechabaja = $bindable(""),
        codigo = $bindable(""),
        malcodigo = $bindable(false),
        listaanimales = $bindable([]),
        //Constantes
        categorias,
        lotes,
        rodeos,
        tipos,
        HOY,

        //function
        oninput,
        onChangeCollapse,
    } = $props();
    let seccionAbierta = $state("CATEGORIA"); // o "CATEGORIA" si quieres que empiece abierta

    function toggleSeccion(seccion) {
        seccionAbierta = seccionAbierta === seccion ? null : seccion;
        onChangeCollapse?.(seccion); // opcional: si aún necesitas notificar al padre
    }
</script>

<!-- Cambiar categoría -->
<div class="border-b border-base-200 py-2">
    <button
        class="w-full flex justify-between items-center text-xl font-medium"
        onclick={() => toggleSeccion("CATEGORIA")}
        aria-expanded={seccionAbierta === "CATEGORIA"}
    >
        <span>Cambiar categoria</span>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class={`h-5 w-5 transition-transform duration-300 ${seccionAbierta === "CATEGORIA" ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
            />
        </svg>
    </button>

    {#if seccionAbierta === "CATEGORIA"}
        <div transition:slide class="mt-2">
            <SelectFertil
                etiqueta="Seleccione una categoría"
                bind:value={nuevacategoria}
                onchange={() => oninput("CATEGORIA")}
                opciones={categorias}
            />
        </div>
    {/if}
</div>
<!-- Cambiar LOTE -->
<div class="border-b border-base-200 py-2">
    <button
        class="w-full flex justify-between items-center text-xl font-medium"
        onclick={() => toggleSeccion("LOTE")}
        aria-expanded={seccionAbierta === "LOTE"}
    >
        <span>Cambiar Lote</span>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class={`h-5 w-5 transition-transform duration-300 ${seccionAbierta === "LOTE" ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
            />
        </svg>
    </button>

    {#if seccionAbierta === "LOTE"}
        <div transition:slide class="mt-2">
            <SelectFertil
                etiqueta="Seleccione un lote"
                bind:value={nuevolote}
                onchange={() => oninput("LOTE")}
                opciones={lotes}
            />
        </div>
    {/if}
</div>
<!-- Cambiar rodeo -->
<div class="border-b border-base-200 py-2">
    <button
        class="w-full flex justify-between items-center text-xl font-medium"
        onclick={() => toggleSeccion("RODEO")}
        aria-expanded={seccionAbierta === "RODEO"}
    >
        <span>Cambiar rodeo</span>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class={`h-5 w-5 transition-transform duration-300 ${seccionAbierta === "CATEGORIA" ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
            />
        </svg>
    </button>

    {#if seccionAbierta === "RODEO"}
        <div transition:slide class="mt-2">
            <SelectFertil
                etiqueta="Seleccione un rodeo"
                bind:value={nuevorodeo}
                onchange={() => oninput("RODEO")}
                opciones={rodeos}
                z_value="z-50"
            />
        </div>
    {/if}
</div>
<!-- Dar de baja -->
<div class="border-b border-base-200 py-2">
    <button
        class="w-full flex justify-between items-center text-xl font-medium"
        onclick={() => toggleSeccion("BAJA")}
        aria-expanded={seccionAbierta === "BAJA"}
    >
        <span>Dar de baja</span>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class={`h-5 w-5 transition-transform duration-300 ${seccionAbierta === "CATEGORIA" ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
            />
        </svg>
    </button>

    {#if seccionAbierta === "BAJA"}
        <div transition:slide class="mt-2">
            <div class="grid grid-cols-1 gap-1">
                <div>
                    <label for="motivo" class="label">
                        <span class="label-text text-base">Motivo</span>
                    </label>
                    <input
                        id="motivo"
                        type="text"
                        class={`input input-bordered w-full ${estilos.bgdark2}`}
                        bind:value={motivo}
                        oninput={() => oninput("MOTIVO")}
                    />
                </div>
                <CustomDate
                    etiqueta="Fecha"
                    bind:fecha={fechabaja}
                    onchange={() => oninput("FECHABAJA")}
                />
            </div>
        </div>
    {/if}
</div>
<!-- Transferir -->
<div class="border-b border-base-200 py-2">
    <button
        class="w-full flex justify-between items-center text-xl font-medium"
        onclick={() => toggleSeccion("TRANSFERIR")}
        aria-expanded={seccionAbierta === "TRANSFERIR"}
    >
        <span>Transferir</span>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class={`h-5 w-5 transition-transform duration-300 ${seccionAbierta === "CATEGORIA" ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
            />
        </svg>
    </button>

    {#if seccionAbierta === "TRANSFERIR"}
        <div transition:slide class="mt-2">
            <div class="grid grid-cols-1 gap-1">
                <div>
                    <label for="codigo" class="label">
                        <span class="label-text text-base">RENSPA</span>
                    </label>
                    <input
                        id="codigo"
                        type="text"
                        class={`input input-bordered w-full ${estilos.bgdark2}`}
                        bind:value={codigo}
                        oninput={() => oninput("CODIGO")}
                    />
                    {#if malcodigo}
                        <div class="label">
                            <span class="label-text-alt text-red-500"
                                >No existe un establecimiento con ese RENSPA</span
                            >
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<div>
    <Animalesmodal bind:listaanimales />
</div>

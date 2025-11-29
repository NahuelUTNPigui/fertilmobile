<script>
    import AgregarAnimal from "../eventos/AgregarAnimal.svelte";
    import estilos from "$lib/stores/estilos";
    import categorias from "$lib/stores/categorias";
    import sexos from "$lib/stores/sexos";
    import InfoAnimal from "$lib/components/InfoAnimal.svelte";
    //formulario
    import SelectFertil from "../SelectFertil.svelte";
    import CustomDate from "../CustomDate.svelte";
    import PredictSelect from "../PredictSelect.svelte";
    import { onMount } from "svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";
    let {
        oninput,
        idobservacion = $bindable(""),
        agregaranimal = $bindable(false),
        caravananuevo = $bindable(""),
        categorianuevo = $bindable(""),
        sexonuevo = $bindable(""),
        pesonuevo = $bindable(0),
        fechanacimientonuevo = $bindable(""),
        animal = $bindable(""),
        animalescab = $bindable([]),
        malanimal = $bindable(false),
        categoria = $bindable(""),
        caravana = $bindable(""),
        malcaravana = $bindable(false),
        sexo = $bindable(""),
        peso = $bindable(0),
        fecha = $bindable(""),
        malfecha = $bindable(false),
        observacion = $bindable(""),
    } = $props();
    const HOY = new Date().toISOString().split("T")[0];
    let nombreanimal = $state("");
    let veranimal = $state({});
    //let listanimales = $state([]);
    let listanimales = $derived(animalescab.filter((a) => a.active).map((a) => ({ id: a.id, nombre: a.caravana })))
    function verInfoAnimal() {
        let anis = animalescab.filter((a) => a.id == animal);
        if (anis.length > 0) {
            let ani = anis[0];
            veranimal = ani;
        }
    }
    onMount(() => {
        //listanimales = animalescab
        //    .filter((a) => a.active)
        //    .map((a) => ({ id: a.id, nombre: a.caravana }));
        //loger.addTextLinea(listanimales.length)
        //loger.addTextLinea(animalescab.length)
    });
</script>

{#if idobservacion == ""}
    <AgregarAnimal
        bind:agregaranimal
        bind:caravana={caravananuevo}
        bind:categoria={categorianuevo}
        bind:sexo={sexonuevo}
        bind:peso={pesonuevo}
        bind:fechanacimiento={fechanacimientonuevo}
    />
{/if}
{#if !agregaranimal && idobservacion == ""}
    <PredictSelect
        bind:valor={animal}
        etiqueta={"Animal"}
        bind:cadena={nombreanimal}
        lista={listanimales}
        onelegir={() => {
            verInfoAnimal();
            oninput("ANIMAL");
        }}
    ></PredictSelect>
    {#if animal.length > 0}
        <InfoAnimal bind:animal={veranimal} />
    {/if}

    {#if malanimal}
        <div class="label">
            <span class="label-text-alt text-red-500"
                >Debe seleccionar el animal</span
            >
        </div>
    {/if}
    <SelectFertil
        etiqueta="Categoría"
        bind:value={categoria}
        opciones={categorias}
    />
{/if}
{#if idobservacion != ""}
    <label for="animal" class="label">
        <span class="label-text text-base">Animal</span>
    </label>
    <label for="animal" class="label">
        <span class="label-text text-base">{caravana}</span>
    </label>
    <SelectFertil
        etiqueta="Categoría"
        bind:value={categoria}
        opciones={categorias}
    />
{/if}
<CustomDate
    etiqueta="Fecha observación"
    bind:fecha
    onchange={() => oninput("FECHA")}
/>
{#if malfecha}
    <div class="label">
        <span class="label-text-alt text-red-500"
            >Debe seleccionar la fecha del tacto</span
        >
    </div>
{/if}
<div class="hidden">
    <label for="fecha" class="label">
        <span class="label-text text-base">Fecha observación</span>
    </label>
    <label class="input-group">
        <input
            id="fecha"
            type="date"
            max={HOY}
            class={`
            input input-bordered 
            w-full
            border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 
            focus:ring-green-500 
            focus:border-green-500
            ${estilos.bgdark2}
        `}
            bind:value={fecha}
            onchange={() => oninput("FECHA")}
        />
        {#if malfecha}
            <div class="label">
                <span class="label-text-alt text-red-500"
                    >Debe seleccionar la fecha del tacto</span
                >
            </div>
        {/if}
    </label>
</div>

<div class="label">
    <span class="label-text">Observacion</span>
</div>
<input
    id="observacion"
    type="text"
    class={`
        input 
        input-bordered 
        border border-gray-300 rounded-md
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
        w-full
        ${estilos.bgdark2}
    `}
    bind:value={observacion}
/>

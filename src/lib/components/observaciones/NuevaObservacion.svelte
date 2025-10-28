<script>
    import AgregarAnimal from "../eventos/AgregarAnimal.svelte";
    import estilos from "$lib/stores/estilos";
    import categorias from "$lib/stores/categorias";
    import sexos from "$lib/stores/sexos";
    import InfoAnimal from "$lib/components/InfoAnimal.svelte";
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
    let veranimal = $state({})
    function verInfoAnimal(){
        let anis = animalescab.filter(a=>a.id == animal)
        if(anis.length>0){
            let ani = anis[0]
            veranimal = ani
        }
    }
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
{#if !agregaranimal}
    <label for="animal" class="label">
        <span class="label-text text-base">Animal</span>
    </label>

    <label class="input-group">
        {#if idobservacion == ""}
            <select
                class={`
                select select-bordered w-full
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 
                focus:ring-green-500 
                focus:border-green-500
                ${estilos.bgdark2}
            `}
                bind:value={animal}
                onchange={() => {verInfoAnimal();oninput("ANIMAL")}}
                disabled={idobservacion != ""}
            >
                {#each animalescab.filter((a) => a.active) as a}
                    <option value={a.id}>{a.caravana}</option>
                {/each}
            </select>
            {#if animal.length>0}
                <InfoAnimal
                    animal={veranimal}
                />
            {/if}
        {:else}
            <select
                class={`
                select select-bordered w-full
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 
                focus:ring-green-500 
                focus:border-green-500
                ${estilos.bgdark2}
            `}
                bind:value={animal}
                onchange={() => oninput("ANIMAL")}
                disabled={idobservacion != ""}
            >
                {#each animalescab as a}
                    <option value={a.id}>{a.caravana}</option>
                {/each}
            </select>
        {/if}
        {#if malanimal}
            <div class="label">
                <span class="label-text-alt text-red-500"
                    >Debe seleccionar el animal</span
                >
            </div>
        {/if}
    </label>
    <label for="categoria" class="label">
        <span class="label-text text-base">Categoria</span>
    </label>
    <label class="input-group">
        <select
            class={`
                select select-bordered w-full
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 
                focus:ring-green-500 
                focus:border-green-500
                ${estilos.bgdark2}
            `}
            bind:value={categoria}
        >
            {#each categorias as c}
                <option value={c.id}>{c.nombre}</option>
            {/each}
        </select>
    </label>
{/if}
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

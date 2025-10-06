<script>
    import PredictSelect from '../PredictSelect.svelte';
    import AgregarAnimal from '$lib/components/eventos/AgregarAnimal.svelte';
    import estilos from '$lib/stores/estilos';
    import RadioButton from '$lib/components/RadioButton.svelte';
    import tipostacto from '$lib/stores/tipostacto';
    import estados from "$lib/stores/estados";
    import tiposanimal from '$lib/stores/tiposanimal';
    import {isEmpty} from "$lib/stringutil/lib"
    import categorias from '$lib/stores/categorias';
    const HOY = new Date().toISOString().split("T")[0]
    let {
        caravana=$bindable(""),
        peso=$bindable(""),
        sexo=$bindable(""),
        fechanacimiento=$bindable(""),
        categoria=$bindable(""),
        agregaranimal=$bindable(false),

        observacion = $bindable({}),
        animales = $bindable([]),
        listaanimales = $bindable([]),
        cargadoanimales = $bindable(false),
        guardarObservacion
    } = $props()
    let nombreanimal = $state("")
    let animalobs = $state("")
    function validarBotonObs(){
        observacion.botonhabilitadoobs = true
        if(!agregaranimal && isEmpty(observacion.animalobs)){
            observacion.botonhabilitadoobs=false
        }
        if(isEmpty(observacion.fechaobs)){
            observacion.botonhabilitadoobs=false
        }
    }
    function onSelectAnimalObs(){
        let a = animales.filter(an=>an.id==observacion.animalobs)[0]
        if(a){
            observacion.categoriaobs = a.categorias
        }
        else{
            observacion.categoriaobs = ""
        }
        
    }
    function oninputObs(inputName){
        observacion.animalobs = animalobs
        validarBotonObs()
        if(!agregaranimal && inputName == "ANIMAL"){
            if(isEmpty(observacion.animalobs)){
                observacion.malanimalobs = true
            }
            else{
                observacion.malanimalobs = false
                onSelectAnimalObs()
            }
        }   
        if(inputName == "FECHA"){
            if(isEmpty(observacion.fechaobs)){
                observacion.malfechaobs = true
            }
            else{
                observacion.malfechaobs = false
            }
        }
    }
</script>
<div class="form-control">
    <AgregarAnimal bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento/>
    {#if !agregaranimal}
        <div class="hidden">
            <label for = "animal" class="label">
                <span class="label-text text-base">Animal</span>
            </label>
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2}
                    `}
                    bind:value={observacion.animalobs}
                    onchange={()=>oninputObs("ANIMAL")}
                >   
                    {#each animales as a}
                        <option value={a.id}>{a.caravana}</option>    
                    {/each}
                </select>
                {#if observacion.malanimalobs}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar el animal</span>                    
                    </div>
                {/if}
            </label>
        </div>
        {#if cargadoanimales}
            <PredictSelect 
                bind:valor={animalobs} 
                etiqueta = {"Animal"} 
                bind:cadena={nombreanimal} 
                bind:lista = {listaanimales} 
                onelegir={()=>oninputObs("ANIMAL")}>
                
            </PredictSelect>
        {/if}
        <label for = "categoria" class="label">
            <span class="label-text text-base">Categoria</span>
        </label>
        <label class="input-group ">
            <select 
                class={`
                    select select-bordered w-full
                    border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 
                    focus:ring-green-500 
                    focus:border-green-500
                    ${estilos.bgdark2}
                `}
                bind:value={observacion.categoriaobs}
            >
                {#each categorias as c}
                    <option value={c.id}>{c.nombre}</option>    
                {/each}
            </select>
        </label>
    {/if}
   
    <label for = "fecha" class="label">
        <span class="label-text text-base">Fecha observacion</span>
    </label>
    <label class="input-group ">
        <input id ="fecha" type="date" max={HOY}  
            class={`
                input input-bordered 
                w-full
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 
                focus:ring-green-500 
                focus:border-green-500
                ${estilos.bgdark2}
            `} 
            bind:value={observacion.fechaobs}
            onchange={()=>oninputObs("FECHA")}
        />
        {#if observacion.malfechaobs}
            <div class="label">
                <span class="label-text-alt text-red-500">Debe seleccionar la fecha del tacto</span>                    
            </div>
        {/if}
    </label>
    <div class="label">
        <span class="label-text">Observacion</span>                    
    </div>
    <input 
        id ="observacionobs" 
        type="text"  
        class={`
            input 
            input-bordered 
            border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
            w-full
            ${estilos.bgdark2}
        `}
        bind:value={observacion.observacionobs}
    />
    
</div>
<div class="modal-action justify-start ">
    <form method="dialog" >
        <!-- if there is a button, it will close the modal -->
        <button class="btn btn-success text-white" disabled='{!observacion.botonhabilitadoobs}' onclick={guardarObservacion} >Guardar</button>
    </form>
</div>
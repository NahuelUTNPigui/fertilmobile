<script>
    import AgregarAnimal from '$lib/components/eventos/AgregarAnimal.svelte';
    import PredictSelect from '../PredictSelect.svelte';
    import estilos from '$lib/stores/estilos';
    import RadioButton from '$lib/components/RadioButton.svelte';
    import tipostacto from '$lib/stores/tipostacto';
    import estados from "$lib/stores/estados";
    import tiposanimal from '$lib/stores/tiposanimal';
    import {isEmpty} from "$lib/stringutil/lib"
    import categorias from '$lib/stores/categorias';
    import InfoAnimal from '../InfoAnimal.svelte';
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    const HOY = new Date().toISOString().split("T")[0]
    let {
        caravana=$bindable(""),
        peso=$bindable(""),
        sexo=$bindable(""),
        fechanacimiento=$bindable(""),
        categoria=$bindable(""),
        agregaranimal=$bindable(false),


        tratamiento = $bindable({}),
        tipotratamientos = $bindable([]),
        
        animales = $bindable([]), 
        listaanimales = $bindable([]),
        cargadoanimales = $bindable(false),
        guardarTrat

    } = $props()
    let nombreanimal = $state("")
    let animaltrat = $state("")
    let animal = $state({})
    let botonhabilitadotrat = $state(false)
    function validarBotonTrat(){

        tratamiento.botonhabilitadotrat = true
        if(!agregaranimal && isEmpty(tratamiento.animaltrat)){
            tratamiento.botonhabilitadotrat = false
        }
        
        if(isEmpty(tratamiento.tipotrat)){
            tratamiento.botonhabilitadotrat = false
        }
        if(isEmpty(tratamiento.fechatrat)){
            tratamiento.botonhabilitadotrat = false
        }
        botonhabilitadotrat = tratamiento.botonhabilitadotrat
    }
    function onSelectAnimalTrat(){
        let a = animales.filter(an=>an.id==tratamiento.animaltrat)[0]
        animal = a
        if(a){
            tratamiento.categoriatrat = a.categoria
        }
        else{
            tratamiento.categoriatrat = ""
        }
        
    }
    function oninputTrat(campo){
        tratamiento.animaltrat = animaltrat
        validarBotonTrat()
        if(!agregaranimal && campo=="ANIMAL"){
            
            if(isEmpty(tratamiento.animaltrat)){
                tratamiento.malanimaltrat = true
            }
            else{
                tratamiento.malanimaltrat = false
                onSelectAnimalTrat()
            }
        }
        else if(campo == "FECHA"){
            if(isEmpty(tratamiento.fechatrat)){
                tratamiento.malfechatrat = true
            }
            else{
                tratamiento.malfechatrat = false
            }
        }
        
        else if(campo == "TIPO"){
            if(isEmpty(tratamiento.tipotrat)){
                tratamiento.maltipotrat = true
            }
            else{
                tratamiento.maltipotrat = false
            }
        }
    }
    
</script>
<div class="form-control ">
    {#if modedebug}
        <div class="label">
            tipos-{tipotratamientos.length}
        </div>
    {/if}
    <AgregarAnimal bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento/>
    {#if !agregaranimal}
        <div class="hidden">

        
            <label for = "madre" class="label">
                <span class={estilos.labelForm}>Animal</span>
            </label>
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500

                        ${estilos.bgdark2} 
                        ${tratamiento.malanimaltrat?"input-error":""}
                    `}
                    onchange={()=>oninputTrat("ANIMAL")}
                    bind:value={tratamiento.animaltrat}
                    
                >
                    {#each animales as a}
                        <option value={a.id}>{a.caravana}</option>    
                    {/each}
                </select>
                <div class={`label ${tratamiento.malanimaltrat?"":"hidden"}`}>
                    <span class="label-text-alt text-red-400">Debe seleccionar el animal</span>
                </div>
            </label>
        </div>
        {#if cargadoanimales}
            <PredictSelect 
                bind:valor={animaltrat} 
                etiqueta = {"Animal"} 
                bind:cadena={nombreanimal} 
                lista = {listaanimales} 
                onelegir={()=>oninputTrat("ANIMAL")}
            >    
            </PredictSelect>
            {#if animaltrat.length>0}
                <InfoAnimal
                    bind:animal
                />
            {/if}
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
                bind:value={tratamiento.categoriatrat} read
                onchange={()=>oninputTrat("CATEGORIA")}
            >
                {#each categorias as c}
                    <option value={c.id}>{c.nombre}</option>    
                {/each}
            </select>
        </label>
    {/if}
    <label for = "fecha" class="label">
        <span class="label-text text-base">Fecha tratamiento</span>
    </label>
    <label class="input-group ">
        <input id ="fecha" type="date" max={HOY}  
            class={`
                input input-bordered w-full
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 
                focus:ring-green-500 
                focus:border-green-500
                ${estilos.bgdark2} 
            `}
            bind:value={tratamiento.fechatrat}
            onchange={()=>oninputTrat("FECHA")}
        />
        <div class={`label ${tratamiento.malfechatrat?"":"hidden"}`}>
            <span class="label-text-alt text-red-400">Debe seleccionar la fecha</span>
        </div>
    </label>
    
    
    <label for = "tipo" class="label">
        <span class="label-text text-base">Tipo tratamiento</span>
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
            bind:value={tratamiento.tipotrat}
            onchange={()=>oninputTrat("TIPO")}
        >
            {#each tipotratamientos as t}
                <option value={t.id}>{t.nombre}</option>    
            {/each}
        </select>
        <div class={`label ${tratamiento.maltipotrat?"":"hidden"}`}>
            <span class="label-text-alt text-red-400">Debe seleccionar un tipo</span>
        </div>
    </label>
    <label class="form-control">
        <div class="label">
            <span class={estilos.labelForm}>Observacion</span>                    
        </div>
        <input 
            id ="observaciontrat" 
            type="text"  
            class={`
                input 
                input-bordered 
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                w-full
                ${estilos.bgdark2}
            `}
            bind:value={tratamiento.observaciontrat}
        />
    </label>
</div>
<div class="modal-action justify-start ">
    <form method="dialog" >
        <button class="btn btn-success text-white" disabled='{!tratamiento.botonhabilitadotrat}' onclick={guardarTrat} >Guardar</button>
    </form>
</div>
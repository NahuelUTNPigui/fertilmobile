<script>
    import AgregarAnimal from '$lib/components/eventos/AgregarAnimal.svelte';
    import estilos from '$lib/stores/estilos';
    import RadioButton from '$lib/components/RadioButton.svelte';
    import tipostacto from '$lib/stores/tipostacto';
    import estados from "$lib/stores/estados";
    import tiposanimal from '$lib/stores/tiposanimal';
    import {isEmpty} from "$lib/stringutil/lib"
    import { loger } from "$lib/stores/logs/logs.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    let {
        caravana=$bindable(""),
        peso=$bindable(""),
        sexo=$bindable(""),
        fechanacimiento=$bindable(""),
        categoria=$bindable(""),
        agregaranimal=$bindable(false),


        tacto = $bindable({}),
        prenadatacto=$bindable(0),
        madres = $bindable([]),
        cargadoanimales = $bindable(false),
        guardarTacto

    } = $props()
    let option=$state(0)
    const HOY = new Date().toISOString().split("T")[0]
    function validarBotonTacto(){
        tacto.botonhabilitadotacto = true
        if(!agregaranimal && isEmpty(tacto.animaltacto)){
            tacto.botonhabilitadotacto=false
        }
        if(isEmpty(tacto.fechatacto)){
            tacto.botonhabilitadotacto=false
        }
    }
    function onSelectAnimalTacto(){
        let a = madres.filter(an=>an.id==tacto.animaltacto)[0]
        if(a){
            tacto.categoriatacto = a.categoria
        }
        else{
            tacto.categoriatacto = ""
        }
        
    }
    function oninputTacto(inputName){
        validarBotonTacto()
        if(!agregaranimal && inputName == "ANIMAL"){
            if(isEmpty(tacto.animaltacto)){
                tacto.malanimaltacto = true
            }
            else{
                tacto.malanimaltacto = false
                onSelectAnimalTacto()
            }
        }   
        if(inputName == "FECHA"){
            if(isEmpty(tacto.fechatacto)){
                tacto.malfechatacto = true
            }
            else{
                tacto.malfechatacto = false
            }
        }
    }
    function clickLog(){
        
        loger.addLog({
            time:Date.now(),
            text:"click desde tacto incio"
        })
        
    }
</script>
<div class="form-control">
    {#if modedebug}
        <div class="label">
            madres - {madres.length}
        </div>
        <div class="label">
            prenadatacto - {prenadatacto}
        </div>
        <button
            class="btn btn-primary"
            onclick={clickLog}
        >test log</button>
    {/if}
    <AgregarAnimal bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento/>
    {#if !agregaranimal}
        
        <label for = "animal" class="label">
            <span class={estilos.labelForm}>Animal</span>
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
                
                bind:value={tacto.animaltacto}
                onchange={()=>oninputTacto("ANIMAL")}
            >
                {#each madres as a}
                    <option value={a.id}>{a.caravana}</option>    
                {/each}
            </select>
        </label>
        
        <label for = "tipo" class="label">
            <span class={estilos.labelForm}>Categoria</span>
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
                disabled
                bind:value={tacto.categoriatacto}
            >
                {#each tiposanimal as t}
                    <option value={t.id}>{t.nombre}</option>    
                {/each}
            </select>
        </label>
    {/if}
    <div class="form-group mt-2">
        <label for = "prenada" class="label ">
            <span class={estilos.labelForm}>Estado</span>
        </label>
        <!--No funciona el prenada tacto, si lo pongo como un atributo de objecto-->
        <RadioButton bind:option={prenadatacto} deshabilitado={false}/>

    </div>
    <label for = "fecha" class="label">
        <span class={estilos.labelForm}>Fecha tacto</span>
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
            bind:value={tacto.fechatacto}
            onchange={()=>oninputTacto("FECHA")}
        />
        {#if tacto.malfechatacto}
            <div class="label">
                <span class="label-text-alt text-red-500">Debe seleccionar la fecha del tacto</span>                    
            </div>
        {/if}
    </label>
    <label for = "tipo" class="label">
        <span class={estilos.labelForm}>Tacto/Ecografia</span>
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
            bind:value={tacto.tipotacto}
        >
            {#each tipostacto as t}
                <option value={t.id}>{t.nombre}</option>    
            {/each}
        </select>
    </label>

    <label class="form-control">
        <div class="label">
            <span class={estilos.labelForm}>Observacion</span>                    
        </div>
        <input 
            id ="observaciontacto" 
            type="text"  
            class={`
                input 
                input-bordered 
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                w-full
                ${estilos.bgdark2}
            `}
            bind:value={tacto.observaciontacto}
        />
    </label>
</div>
<div class="modal-action justify-start ">
    <form method="dialog" >
      <!-- if there is a button, it will close the modal -->              
        <button class="btn btn-success text-white" disabled='{!tacto.botonhabilitadotacto}' onclick={guardarTacto} >Guardar</button>              
        
    </form>
</div>
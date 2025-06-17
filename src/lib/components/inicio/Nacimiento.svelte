<script>
    import estilos from "$lib/stores/estilos";
    import {isEmpty} from "$lib/stringutil/lib"
    import PredictSelect from '$lib/components/PredictSelect.svelte';
    import sexos from '$lib/stores/sexos';
    import AgregarAnimal from "../eventos/AgregarAnimal.svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";
    
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    const HOY = new Date().toISOString().split("T")[0]
    //ESTE REPRESENTA EL MODAL DE NACIMIENTO EN INICIO
    //El final de guardar lo hace el inicio
    // Capaz este
    let {
        caravana=$bindable(""),
        peso=$bindable(""),
        sexo=$bindable(""),
        fechanacimiento=$bindable(""),
        categoria=$bindable(""),
        agregaranimal=$bindable(false),

        nacimiento = $bindable({}),
        listamadres =  $bindable([]),
        animales =  $bindable([]),
        listapadres =  $bindable([]),
        cargadoanimales = $bindable(false),
        guardarNacimiento
    } = $props()
    function onSelectAnimalNacimiento(esmadre){
        let a = animales.filter(an=>esmadre?an.id==nacimiento.madrenac:an.id==nacimiento.padrenac)[0]
        if(esmadre){
            nacimiento.nombremadrenac = a.caravana
        }
        else{
            nacimiento.nombrepadrenac =  a.caravana
        }
        
    }
    function validarBotonNacimiento(){
        nacimiento.botonhabilitadonac = true
        if(isEmpty(nacimiento.fechanac)){
            nacimiento.botonhabilitadonac = false
        }
        if(isEmpty(nacimiento.madrenac)){
            nacimiento.botonhabilitadonac = false
        }
        
    }
    function oninputNacimiento(inputName){
        validarBotonNacimiento()
       
        if(inputName == "FECHA"){
            if(nacimiento.fechanac == ""){
                nacimiento.malfechanac = true
            } 
            else{
                nacimiento.malfechanac = false
            }
        }
        if(inputName == "MADRE"){
            if(nacimiento.nombremadrenac == ""){
                nacimiento.malmadrenac = true
            }
            else{
                nacimiento.malmadrenac = false
            }
        }
        if(inputName == "COMBOMADRE"){
            if(nacimiento.madrenac != ""){
                onSelectAnimalNacimiento(true)
                nacimiento.malmadrenac = false
            }
        }

    }
    //Nacimiento    
    let caravananac = $state("")
    let sexonac = $state("")
    let pesonac = $state("")
    let fechanac = $state("")
    let observacionnac = $state("")
    //Madre
    let etiquetamadre = "Madre"
    let madrenac = $state("")
    let nombremadrenac = $state("")
    //
    //Padre
    let padrenac = $state("")
    let nombrepadrenac = $state("")
    //Validacion
    let malmadrenac = $state(false)
    let malpadrenac = $state(false)
    let malfechanac = $state(false)
    let malcaravananac = $state(false)
    let malsexonac = $state(false)
    let botonhabilitadonac = $state(false)
</script>
{#if modedebug}
    <div class="">
        <h1>madres - {listamadres.length}</h1>
        <h1>padres - {listapadres.length}</h1>
        
    </div>
    {#if isEmpty(nacimiento.fechanac)}
        
            <span class="label-text">
                fecha vacua
            </span>
    {/if}
    {#if isEmpty(nacimiento.madrenac)}
        
            <span class="label-text">
                madre vacia
            </span>
    {/if}
    {#if !nacimiento.botonhabilitadonac}
        
            <span class="label-text">
                mal boton
            </span>
    {/if}
{/if}
<div class="form-control">
    <AgregarAnimal 
        bind:agregaranimal bind:caravana 
        bind:categoria bind:sexo bind:peso 
        bind:fechanacimiento confechanac={true}
    />
    
    <label for = "fechanacimiento" class="label">
        <span class={estilos.labelForm}>Fecha nacimiento</span>
    </label>
    <label class="input-group ">
        <input id ="fechanacimiento" type="date" max={HOY}  
            class={`
                input input-bordered w-full
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 
                focus:ring-green-500 
                focus:border-green-500
                ${estilos.bgdark2} 
            `}
            bind:value={nacimiento.fechanac}
            onchange={()=>oninputNacimiento("FECHA")}
        />
        {#if malfechanac}
            <div class="label">
                <span class="label-text-alt text-red-500">Debe seleccionar la fecha del nacimiento</span>                    
            </div>
        {/if}
    </label>
    {#if cargadoanimales}
        <PredictSelect 
            bind:valor={nacimiento.madrenac} 
            etiqueta = {"Madre"} bind:cadena={nacimiento.nombremadrenac} 
            lista = {listamadres} 
            validarAnimal={()=>oninputNacimiento("COMBOMADRE")}>
            
        </PredictSelect>
    {/if}
    {#if cargadoanimales}
        <PredictSelect 
            bind:valor={nacimiento.padrenac} 
            etiqueta = {"Padre"} 
            bind:cadena={nacimiento.nombrepadrenac} 
            lista = {listapadres} 
            validarAnimal={()=>oninputNacimiento("PADRE")}>
            
        </PredictSelect>
    {/if}
    <label class="form-control">
        <div class="label">
            <span class={estilos.labelForm}>Observacion</span>                    
        </div>
        <input 
            id ="observacionnac" 
            type="text"  
            class={`
                input 
                input-bordered 
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                w-full
                ${estilos.bgdark2}
            `}
            bind:value={nacimiento.observacionnac}
        />
    </label>

</div>
<div class="modal-action justify-start ">
    <form method="dialog" >
      <!-- if there is a button, it will close the modal -->
      <!--<button class="btn btn-success text-white" disabled={!nacimiento.botonhabilitadonac}  onclick={guardarNacimiento} >Guardar</button>-->
      <button class="btn btn-success text-white" onclick={guardarNacimiento} >Guardar</button>
      
    </form>
</div>
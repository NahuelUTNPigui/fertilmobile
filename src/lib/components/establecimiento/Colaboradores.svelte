<script>
    import estilos from "$lib/stores/estilos";
    import {isEmpty} from "$lib/stringutil/lib"
    let {colabs = $bindable(),mostrarcolab,guardarColab} = $props()
    let titulo = $state("Colaboradores")
    
    //Nuevo colaborador
    let nombre = $state("")
    let apellido = $state("")
    let telefono = $state("")
    let email = $state("")
    let contra = $state("")
    let confirmcontra = $state("")
    //Validaciones
    let malnombre = $state(false)
    let malapellido = $state(false)
    let malemail = $state(false)
    let malcontra = $state(false)
    let malconfirmcontra = $state(false)
    let botonhabilitadocolab = $state(false)
    async function guardarColaborador(){
        let data = {
            nombre,
            apellido,
            contra,
            telefono,
            email
        }
        await guardarColab(data)
    }
    function validarBotonNuevo(){
        botonhabilitadocolab = true
        if(isEmpty(nombre)){
            botonhabilitadocolab = false
            
        }
        if(isEmpty(apellido)){
            botonhabilitadocolab = false
            
        }
        if(isEmpty(email)){
            botonhabilitadocolab = false
            
        }
        if(isEmpty(contra)){
            botonhabilitadocolab = false
            
        }
        if(isEmpty(confirmcontra)){
            botonhabilitadocolab = false
            
        }
        if(contra != confirmcontra){
            
            botonhabilitadocolab = false
        }

    }
    function onInputNuevo(campo){
        validarBotonNuevo()
        if(campo == "NOMBRE"){
            if(isEmpty(nombre)){
                malnombre = true
            }
            else{
                malnombre = false
            }
        }
        if(campo == "APELLIDO"){
            if(isEmpty(apellido)){
                malapellido = true
            }
            else{
                malapellido = false
            }
        }
        if(campo == "CORREO"){
            if(isEmpty(email)){
                malemail = true
            }
            else{
                malemail = false
            }
        }
        if(campo == "CONTRA"){
            if(isEmpty(contra)){
                malcontra = true
            }
            else{
                malcontra = false
            }
        }
        if(campo == "CONFIRM"){
            if(isEmpty(confirmcontra)){
                malconfirmcontra = true
            }
            else{
                malconfirmcontra = false
            }
        }
    }
    function openNewModalColaborador(){
        modalNuevoColaborador.show()
    }
</script>
<h1 class="text-2xl font-bold text-green-700 dark:text-green-400 mb-6 text-start">{titulo}</h1>
<div class="grid grid-cols-3 lg:grid-cols-4 gap-1">
    <div>
        <button class={estilos.mediumsolidgreen}
        onclick={openNewModalColaborador}
        >
            Nuevo
        </button>
    </div>
    <div>
        <button class={estilos.mediumsolidgreen}>
            Asociar
        </button>
    </div>
</div>
<dialog id="modalNuevoColaborador" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div 
        class="
            modal-box w-11/12 max-w-xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Nueva colaborador</h3>  
        <div class="form-control">
            <label for = "nombre" class="label">
                <span class="label-text text-base">Nombre</span>
            </label>
            <label class="input-group">
                <input id ="nombre" type="text"  
                    class={`
                        input input-bordered 
                        w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2}   
                    `}
                    bind:value={nombre}
                    oninput={()=>onInputNuevo("NOMBRE")}
                />
                {#if malnombre}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe escribir el nombre del colaborador</span>                    
                    </div>
                {/if}
            </label>
            <label for = "nombre" class="label">
                <span class="label-text text-base">Apellido</span>
            </label>
            <label class="input-group">
                <input id ="nombre" type="text"  
                    class={`
                        input input-bordered 
                        w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2}   
                    `}
                    bind:value={apellido}
                    oninput={()=>onInputNuevo("APELLIDO")}
                />
                {#if malapellido}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe escribir el apellido del colaborador</span>                    
                    </div>
                {/if}
            </label>
            <label for = "nombre" class="label">
                <span class="label-text text-base">Correo</span>
            </label>
            <label class="input-group">
                <input id ="nombre" type="text"  
                    class={`
                        input input-bordered 
                        w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2}   
                    `}
                    bind:value={email}
                    oninput={()=>onInputNuevo("CORREO")}
                />
                {#if malemail}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe escribir el email del colaborador</span>                    
                    </div>
                {/if}
            </label>
            <label for = "nombre" class="label">
                <span class="label-text text-base">Teléfono</span>
            </label>
            <label class="input-group">
                <input id ="nombre" type="text"  
                    class={`
                        input input-bordered 
                        w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2}   
                    `}
                    bind:value={telefono}
                />
            </label>
            <label for = "nombre" class="label">
                <span class="label-text text-base">Contraseña</span>
            </label>
            <label class="input-group">
                <input id ="nombre" type="password"  
                    class={`
                        input input-bordered 
                        w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2}   
                    `}
                    bind:value={contra}
                    oninput={()=>onInputNuevo("CONTRA")}
                />
                {#if malcontra}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe escribir la contraseña del colaborador</span>                    
                    </div>
                {/if}
            </label>
            <label for = "nombre" class="label">
                <span class="label-text text-base">Confirmar contraseña</span>
            </label>
            <label class="input-group">
                <input id ="nombre" type="password"  
                    class={`
                        input input-bordered 
                        w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2}   
                    `}
                    bind:value={confirmcontra}
                    oninput={()=>onInputNuevo("CONFIRM")}
                />
                {#if malconfirmcontra}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Deben coincidir las contraseñas</span>                    
                    </div>
                {/if}
            </label>
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
                <!-- if there is a button, it will close the modal -->
                <button class="btn btn-success text-white" disabled='{!botonhabilitadocolab}' onclick={guardarColaborador} >Guardar</button>
            </form>
        </div>
        
    </div>
</dialog>

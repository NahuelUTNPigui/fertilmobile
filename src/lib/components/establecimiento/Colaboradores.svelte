<script>
    import { goto } from "$app/navigation";
    import estilos from "$lib/stores/estilos";
    import {isEmpty} from "$lib/stringutil/lib"
    import { randomString } from "$lib/stringutil/lib";
    import Swal from "sweetalert2";

    import { slide } from 'svelte/transition';
    import tiponoti from '$lib/stores/tiponoti';
    import {verificarNivelColab} from "$lib/permisosutil/lib"
    import PocketBase from 'pocketbase'
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { onMount } from "svelte";
    import { setColabSQL } from "$lib/stores/sqlite/dbcolaboradores";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    //offline
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let {
        colabs = $bindable([]),
        coninternet = $bindable({}),
        mostrarcolab,
        guardarColab,
        desasociar,
        asociado,
        cabid,
        db
        
    } = $props();
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
    // asociar
    let mostrarasociacion = $state(false)
    let correoasociar = $state("")
    let malcorreo = $state(false)
    let codigoasociar = $state("")

    async function asociarOnline() {
        if(correoasociar==""){
            malcorreo = true
            return
        }
        //let verificar = await verificarNivelColab(cabid)
        let verificar = true
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener más colaboradores`,"error")
            return
        }
        const resultList = await pb.collection('users').getList(1, 1, {
            filter: `codigo ~ '${correoasociar}'`,
            skipTotal:true
        });        
        if(resultList.items.length == 0){
            Swal.fire("Error colaborador","No existe un usuario con ese codigo","error")
            return
        }
    

        let pb_json = JSON.parse(localStorage.getItem('pocketbase_auth'))
        
        let origenusuarioid =  pb_json.record.id

        // El usuario encontrado
        let userid = resultList.items[0].id
        let nombre = resultList.items[0].nombre
        let apellido = resultList.items[0].apellido
        
        if(userid == origenusuarioid){
            Swal.fire("Error colaborador","No puedes asociarte al establecimiento","error")
            return
        }
        const resultcolab = await pb.collection('colaboradores').getList(1,1,{
            filter:`user = '${userid}'`,
            skipTotal:true
        })
        let existecolab = resultcolab.items.length > 0
        if(existecolab){
            let colabid = resultcolab.items[0].id
            //verificar si ya esta asociado
            const recordasoci = await pb.collection('estxcolabs').getList(1,1,{
                filter:`cab = '${cabid}' && colab = '${colabid}'`
            })
            if(recordasoci.items.length>0){
                Swal.fire("Error asociar","El usuario ya esta asociado","error")
                return
            }
            try{    
                let colabid = resultcolab.items[0].id
                //Creo la asociación
                let dataestxcolab = {
                    cab:cabid,
                    colab:colabid
                }
                let recordestxcolab = await pb.collection('estxcolabs').create(dataestxcolab);
                //Debo crear los permisos para el colaborador
                let datapermisos = {
                    estxcolab:recordestxcolab.id,
                    permisos:""
                }
                const recordpermisos = await pb.collection('permisos').create(datapermisos);
                recordestxcolab = {
                    ...recordestxcolab,
                    permisos:"",
                    expand:{
                        colab:{
                            id:userid,
                            nombre,
                            apellido
                        },
                        cab:{
                            id:cabid
                        }
                    }

                }
                colabs.push(recordestxcolab)
                await setColabSQL(db,colabs)
                Swal.fire("Éxito asociar","Se pudo asociar el usuario","success")
                //const records = await pb.collection('estxcolabs').getFullList({
                //    expand:"colab",
                //    filter:`cab='${cabid}'`,
                //    sort:"colab.apellido"
                //});
                //colabs = records

            }
            catch(err){
                console.error(err)
                Swal.fire("Error asociar","No se pudo asociar el usuario","error")
                
  
                return
            }
        }
        else{
            try{
                //Debo crear el colaborador
                let data = {
                    nombre:nombre,
                    apellido:apellido,
                    user:userid,
                    telefono:"",
                    rol:""
                }
                const record = await pb.collection('colaboradores').create(data);
                //Creo la asociación
                let dataestxcolab = {
                    cab:cabid,
                    colab:record.id
                }
                let recordestxcolab = await pb.collection('estxcolabs').create(dataestxcolab);
                //Debo crear los permisos para el colaborador
                let datapermisos = {
                    estxcolab:recordestxcolab.id,
                    permisos:""
                }
                const recordpermisos = await pb.collection('permisos').create(datapermisos);
                recordestxcolab = {
                    ...recordestxcolab,
                    permisos:"",
                    expand:{
                        colab:{
                            id:userid,
                            nombre,
                            apellido
                        },
                        cab:{
                            id:cabid
                        }
                    }

                }
                colabs.push(recordestxcolab)
                await setColabSQL(db,colabs)
                Swal.fire("Éxito asociar","Se pudo asociar el usuario","success")
                
            }   
            catch(err){
                console.error(err)
                Swal.fire("Error asociar","No se pudo asociar el usuario","error")
                return

            }
        }
        //Creo las notificaciones
        try{
            let data = {
                texto:"Se te asoció al establecimiento "+ cab.nombre,
                titulo:"Asociado a "+ cab.nombre,
                tipo:tiponoti[0].id,
                origen:origenusuarioid,
                destino:userid,
                leido:false
            }
            const record = await pb.collection('notificaciones').create(data);
        }
        catch(err){
            console.error(err)
            if(modedebug){
                loger.addTextError(JSON.stringify(err,null,2))
            }
        }

    }
    async function asociar() {
        if(coninternet.connected){
            await asociarOnline()
        }        
        else{
            Swal.fire("Error asociar","No se puede asociar sin internet","error")
        }
    }
    function openAsociar(){
        mostrarasociacion = true
    }
    function closeAsociar(){
        mostrarasociacion = false
        correoasociar = ""
        malcorreo = false
    }
    async function guardarColaborador(){
        
        let data = {
            nombre,
            apellido,
            contra,
            telefono,
            email,
            
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
    async function confirmDesasociar() {
        Swal.fire({
            title: 'Desasociar',
            text: `¿Seguro que desasociarte del establecimiento?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
        }).then(async result=>{
            if(result.value){
                await desasociar()
            }
        })
    }
    onMount(()=>{
        if(modedebug){
            loger.addTextLog(JSON.stringify(colabs.filter(c=>c.cab == cabid)))
        }
    })
</script>
<h1 class="text-2xl font-bold text-green-700 dark:text-green-400 mb-6 text-start">{titulo}</h1>
<div class="grid grid-cols-3 lg:grid-cols-4 gap-2">
    <div>
        <button class={estilos.mediumsolidgreen}
        onclick={openNewModalColaborador}
        >
            Nuevo
        </button>
    </div>
    <div>
        <button class={estilos.mediumsolidgreen} onclick={()=>!mostrarasociacion?openAsociar():closeAsociar()}>
            Asociar
        </button>
    </div>

    {#if asociado}
        <div>
            <button class={estilos.mediumsolidred}
            onclick={confirmDesasociar}
            >
                Desasociar
            </button>
        </div>
    {/if}
</div>
{#if mostrarasociacion}
    <div transition:slide>
        <label for = "correo" class="label">
            <span class="label-text text-base">Codigo usuario</span>
        </label>
        <label class="input-group">
            <input id ="correo" type="text"  
                class={`
                    input input-bordered 
                    w-full
                    border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 
                    focus:ring-green-500 
                    focus:border-green-500
                    ${estilos.bgdark2}   
                `}
                bind:value={correoasociar}
               
            />
            {#if malcorreo}
                <div class="label">
                    <span class="label-text-alt text-red-500">Debe escribir el correo de un usuario de esta aplicación</span>                    
                </div>
            {/if}
        </label>
        <button class="btn btn-success text-white mt-1" disabled='{correoasociar==""}' onclick={asociar} >Asociar</button>
    </div>
{/if}
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
            <label for = "ape" class="label">
                <span class="label-text text-base">Apellido</span>
            </label>
            <label class="input-group">
                <input id ="ape" type="text"  
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
            <label for = "email" class="label">
                <span class="label-text text-base">Correo</span>
            </label>
            <label class="input-group">
                <input id ="email" type="text"  
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
            <div class="hidden">
                <label for = "tel" class="label">
                    <span class="label-text text-base">Teléfono</span>
                </label>
                <label class="input-group">
                    <input id ="tel" type="text"  
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
            </div>
            
            <label for = "pass" class="label">
                <span class="label-text text-base">Contraseña</span>
            </label>
            <label class="input-group">
                <input id ="pass" type="password"  
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
            <label for = "confpass" class="label">
                <span class="label-text text-base">Confirmar contraseña</span>
            </label>
            <label class="input-group">
                <input id ="confpass" type="password"  
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


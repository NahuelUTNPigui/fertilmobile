<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import Swal from 'sweetalert2'
    import PocketBase from 'pocketbase'
    import { onMount } from 'svelte';
    import { goto }  from '$app/navigation';
    import { createCaber } from '$lib/stores/cab.svelte';
    import { createDarker } from "$lib/stores/dark.svelte";
    import CardBase from '$lib/components/CardBase.svelte';
    import estilos from "$lib/stores/estilos";
    //Actualizacion
    import { actualizacion,deboActualizar } from '$lib/stores/offline/actualizar';
    import { customoffliner } from '$lib/stores/offline/custom.svelte';
    import { intermitenter } from '$lib/stores/offline/intermitencia.svelte';
    import { velocidader } from '$lib/stores/offline/velocidad.svelte';
    ///ofline
    import { getInternet,getOnlyInternet } from '$lib/stores/offline';
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getUserOffline,setDefaultUserOffline,updateLocalSQLUser,editUserCommonData} from "$lib/stores/capacitor/offlineuser"
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos'; 
    import {updateLocalAnimalesSQLUser,getAnimalesSQL} from "$lib/stores/sqlite/dbanimales"
    import {getEstablecimientosSQL,getUpdateLocalEstablecimientosSQL} from "$lib/stores/sqlite/dballestablecimientos"
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from '$lib/stores/logs/coninternet.svelte';
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"  
    //offline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let getlocal = $state(false)
    let getvelocidad = $state(0)
    let getactualizacion = $state(0)
    let coninternet = $state({connected:false})
    let comandos = $state([])
    
    let ruta = import.meta.env.VITE_RUTA
    let pre = ""
    const pb = new PocketBase(ruta);
    
    let tokencolab = $state("")
    let username = $state("")
    let usermail = $state("")
    let totalanimales = $state(0)
    let totalesta = $state(0)
    let nombre = $state("")
    let nivel = $state("")
    let apellido = $state("")
    let viejacontra = $state("")
    let malviejacontra = $state("")
    let contra = $state("")
    let confcontra = $state("")
    let malcontra = $state("")
    let malconfcontra = $state("")
    let botonhabilitado = $state(false)

    let darker = createDarker()
    let modoedicion = $state(false)

    let cab = $state({
        exist:false,
        nombre:"",
        id:""
    })
    function normalizarParaURL(texto) {
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "") // Elimina símbolos
            .replace(/\s+/g, "-"); // Convierte espacios a guiones
    }
    async function editarUsuarioOffline() {
        const data = {
            username:normalizarParaURL(username),
            nombre,
            apellido
        };
        let comando = {
            tipo:"update",
            coleccion:"users",
            data:{...data},
            hora:Date.now(),
            prioridad:0,
            idprov:usuarioid,
            camposprov:"",
            show:{...data},
            motivo:"Editar usuario"
        }
        comandos.push(comando)
        try{
            await editUserCommonData(data)
            await setComandosSQL(db,comandos)
            Swal.fire("Exito modificar","Se pudo modificar el usuario con éxito","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error modificar","No se pudo modificar el usuario con éxito","error")
        }
        
        
    }
    async function editarUsuarioOnline() {
        const data = {
            username:normalizarParaURL(username),
            nombre,
            apellido
        };
        try{
            await editUserCommonData(data)
            const record = await pb.collection("users").update(usuarioid, data);
            const colabs = await pb.collection("colaboradores").getList(1,1,{
                filter:`user = '${usuarioid}'`,
                skipTotal:false
            })
            if(colabs.items.length > 0){
                await pb.collection("colaboradores").update(colabs.items[0].id,{nombre,apellido})
            }   
            Swal.fire("Exito modificar","Se pudo modificar el usuario con éxito","success")
            
        }
        catch(err){
            console.error(err)
            Swal.fire("Error modificar","No se pudo modificar el usuario con éxito","error")
        }
    }
    async function editarUsuario(){
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        let isOnline = await getOnlyInternet()
        intermitenter.addIntermitente(isOnline)
        if(coninternet.connected){
            await editarUsuarioOnline()
        }   
        else{
            await editarUsuarioOffline()
        }
    }
    function cerrarModal(){
        contra = ""
        confcontra = ""
        viejacontra = ""
        modalCambioContra.close()
    }
    function openCambioContra(){
        contra = ""
        confcontra = ""
        viejacontra = ""
        modalCambioContra.showModal()
    }
    function validarBoton(){
        botonhabilitado = true
        if(contra == "" || contra.length < 10){
            botonhabilitado = false
        }
        if(viejacontra == ""){
            botonhabilitado = false
        }
        if(contra != confcontra){
            botonhabilitado = false
        }
        
    }
    function onchange(campo){
        validarBoton()
        if(campo == "CONTRA"){
            if(contra == "" || contra.length < 10){
                malcontra = true
            }
            else{
                malcontra = false
            }
        }
        if(campo == "CONF"){
            if(contra != confcontra){
                malconfcontra = true
            }
            else{
                malconfcontra = false
            }
        }
        if(campo == "ANTERIOR"){
            if(viejacontra == ""){
                malviejacontra = true
            }
            else{
                malviejacontra = false
            }
        }
    }
    async function cambiarContraOffline() {
        const data = {
            password: contra,
            passwordConfirm: confcontra,
            oldPassword: viejacontra
        };
        Swal.fire("Error cambio de contraseña","No se pudo cambiar la contraseña sin internet","error")
    }
    async function cambiarContraOnline() {
        const data = {
            password: contra,
            passwordConfirm: confcontra,
            oldPassword: viejacontra
        };

        try{
            const record = await pb.collection('users').update(usuarioid, data);
            Swal.fire("Exito cambio de contraseña","Se pudo cambiar la contraseña","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error cambio de contraseña","No se pudo cambiar la contraseña","error")

        }
    }
    async function cambiarContra(){
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        let isOnline = await getOnlyInternet()
        intermitenter.addIntermitente(isOnline)
        if(coninternet.connected){
            await cambiarContraOnline()
        }   
        else{
            await cambiarContraOffline()
        }     
        
    }
    async function eliminarCuentaOffline() {
        Swal.fire("Error eliminar","No se puede eliminar la cuenta sin internet","error")
    }
    async function eliminarCuentaOnline() {
        Swal.fire("Cuenta Eliminada!", "", "success");
        let data = {active:false}
        const record = await pb.collection('users').update(usuarioid, data);
        pb.authStore.clear();
        goto(pre+"/")
    }
    async function eliminarCuenta() {
        let html= `
            Estas apunto de eliminar la cuenta y sus datos,
            <br>
            Solo se mantendra los datos de animales transferidos a otro establecimiento.
            <br>
            Ante la duda comunicarse con aplicacionfertil@gmail.com
        `;
        Swal.fire({
            title: "¿Seguro que deseas eliminar la cuenta?",
            html,
            showDenyButton: true,
            showCancelButton: false,
            confirmButtonText: "Confirmación",
            denyButtonText: `Cancelar`
            }).then(async (result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
                coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
                let isOnline = await getOnlyInternet()
                intermitenter.addIntermitente(isOnline)
                if(coninternet.connected){
                    await eliminarCuentaOnline()
                }
                else{
                    await eliminarCuentaOffline()
                }
            } 
        });
        
        
    }
    async function getLocalSQL() {
        let pb_json = JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.record.id
        usermail = pb_json.record.email
        username = pb_json.record.username
        nombre = pb_json.record.nombre
        apellido = pb_json.record.apellido
        nivel = pb_json.record.nivel
        tokencolab = pb_json.record.codigo
        let resanimales = await getAnimalesSQL(db)
        let resestablecimientos = await getEstablecimientosSQL(db)
        totalanimales = resanimales.lista.filter(a=>a.active).length
        totalesta = resestablecimientos.lista.length
    }
    async function updateLocalSQL() {
        await updateLocalSQLUser(pb)
        
        let pb_json = JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.record.id
        usermail = pb_json.record.email
        username = pb_json.record.username
        nombre = pb_json.record.nombre
        apellido = pb_json.record.apellido
        nivel = pb_json.record.nivel
        tokencolab = pb_json.record.codigo
        let resanimales = await updateLocalAnimalesSQLUser(db,pb,usuarioid)
        let resestablecimientos = await getUpdateLocalEstablecimientosSQL(db,pb,usuarioid)
        totalanimales = resanimales.filter(a=>a.active).length
        totalesta = resestablecimientos.length
    }
    async function actualizarComandos() {
        try{
            await flushComandosSQL(db,pb)
            comandos = []
        }
        catch(err){
            if(modedebug){
                loger.addTextError(JSON.stringify(err),null,2)
                loger.addTextError("Error en flush comandos config")
            }
        }
        
    }
    async function oldUpdate() {
        if(lastinter.internet == 0){
                await updateLocalSQL()
            }
            else{
                let ahora = Date.now()
                let antes = lastinter.ultimo
                const cincoMinEnMs = 300000;
                if((ahora - antes) >= cincoMinEnMs){
                    await updateLocalSQL()
                }
                else{
                    await getLocalSQL()            
                }
            }
    }
    async function getDataSQL() {
        db = await openDB()
        //Reviso el internet
        let lastinter = await getInternetSQL(db)
        let rescom = await getComandosSQL(db)
        let ahora = Date.now()
        let antes = lastinter.ultimo
        comandos = rescom.lista
        if (coninternet.connected){
            await actualizarComandos()
            await updateLocalSQL()
            
        }
        else{
            await getLocalSQL()
        }
    }
    async function initPage() {
        coninternet = await Network.getStatus();
        useroff = await getUserOffline()
        usuarioid = useroff.id
    }
    async function onMountOriginal() {
        let caber = createCaber()
        let pb_json = JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.record.id
        usermail = pb_json.record.email
        username = pb_json.record.username
        nombre = pb_json.record.nombre
        apellido = pb_json.record.apellido
        nivel = pb_json.record.nivel
        let light = !darker.dark
        tokencolab = pb_json.record.codigo
        cab = caber.cab
        const resans = await pb.collection('Animalesxuser').getList(1,1,{filter:`user='${usuarioid}' && active = true`})
        const rescab = await pb.collection('cabs').getList(1, 1, {
            filter: `user = '${usuarioid}' && active = true`,
        });
        totalanimales = resans.totalItems
        totalesta = rescab.totalItems
    }
    onMount(async ()=>{
        await initPage()
        await getDataSQL()
    })
</script>
<Navbarr>
    <CardBase titulo="Datos usuario" cardsize="max-w-5xl">
        <div class="space-y-6">
            <div>
                <label for="nombre" 
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    Nombre de usuario:
                </label>
                {#if !modoedicion}
                    <label for="nombre" 
                        class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                    >
                        {username}
                    </label>
                {:else}
                    <input 
                        type="text" 
                        id="usernombre"
                        
                        bind:value={username} 
                        required 
                        class={`
                            w-full px-3 py-2 border rounded-md shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                            transition duration-150 ease-in-out
                            border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        `}
                    />
                {/if}
                <label for="nombre" 
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    Nombre:
                </label>
                {#if !modoedicion}
                    <label for="nombre" 
                        class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                    >
                        {nombre}
                    </label>
                {:else}
                <input 
                        type="text" 
                        id="nombre"
                        
                        bind:value={nombre} 
                        required 
                        class={`
                            w-full px-3 py-2 border rounded-md shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                            transition duration-150 ease-in-out
                            border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        `}
                    />
                {/if}
                <label for="nombre" 
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    Apellido:
                </label>
                {#if !modoedicion}
                    <label for="nombre" 
                        class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                    >
                        {apellido}
                    </label>
                {:else}
                <input 
                        type="text" 
                        id="apellido"
                        
                        bind:value={apellido} 
                        required 
                        class={`
                            w-full px-3 py-2 border rounded-md shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                            transition duration-150 ease-in-out
                            border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        `}
                    />
                {/if}
                <label for="mail" 
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    Correo:
                </label>
                <label for="mail" 
                    class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    {usermail}
                </label>
            </div>
        </div>
        <div class="mt-8 flex justify-start mb-3">
            {#if  !modoedicion}
                <button
                    onclick={()=>modoedicion=true}
                    class=" 
                        btn px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md 
                        text-white font-bold font-lg focus:outline-none 
                        focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                    "
                >
                    Editar usuario
                </button>    
            {:else}
                <button 
                    onclick={()=>modoedicion=false}
                    class="
                        btn btn-error 
                        text-white 
                        font-bold font-lg
                    "
                >

                    Cancelar
                </button>   
                <button

                    onclick={async ()=>{modoedicion=false;await editarUsuario()}}
                    class="btn px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-bold font-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                    Guardar
                </button>    
            {/if}
        </div>
        
        <h2 class="text-xl font-semibold">Contraseña y autenticación</h2>
        
        <div class="mt-2 flex justify-start">
            <button
                    onclick={openCambioContra}
                    class=" 
                        btn px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md 
                        text-white font-bold font-lg focus:outline-none 
                        focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                    "
                >
                    Cambiar Contra
            </button> 
            
        </div>
        <h2 class="mt-3 text-xl font-semibold">Colaboracion</h2>
        <label for="codigo " 
            class={`mt-2 block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
        >
            Codigo de colaboracion:
        </label>
        <label for="codigo" 
            class={`mt-2 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
        >
            {tokencolab}
        </label>
        <h2 class="mt-3 text-xl font-semibold">Plan </h2>
        <label for="codigo " 
            class={`mt-2 block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
        >
            Nivel:
        </label>
        <label for="codigo" 
            class={`mt-2 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
        >
            {nivel}
        </label>
        <label for="animales " 
            class={`mt-2 block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
        >
            Animales en la cuenta:
        </label>
        <label for="animales" 
            class={`mt-2 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
        >
            {totalanimales}
        </label>
        <label for="esta " 
            class={`mt-2 block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
        >
            Establecimientos en la cuenta:
        </label>
        <label for="esta" 
            class={`mt-2 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
        >
            {totalesta}
        </label>
        <div class="mt-2 flex justify-start">
            <button
                    onclick={()=>goto("/user/nivel")}
                    class=" 
                        btn px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md 
                        text-white font-bold font-lg focus:outline-none 
                        focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                    "
                >
                    Cambiar plan
            </button> 
            
        </div>
        <h2 class="text-xl font-semibold">Eliminar cuenta</h2>
        <button 
            onclick={eliminarCuenta}
            class="
                btn btn-error 
                text-white 
                font-bold font-lg
            "
        >

            Eliminar
        </button>

    </CardBase>
    
</Navbarr>
<dialog id="modalCambioContra" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        <h3 class="text-lg font-bold">Cambio contraseña</h3>  
        <div class="form-control">
            <label for = "anterior" class="label">
                <span class={estilos.labelForm}>Contraseña anterior</span>
            </label>
            <input 
                id ="anterior" 
                type="text"  
                class={`
                    input 
                    input-bordered 
                    border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                    w-full
                    ${estilos.bgdark2}
                `}
                bind:value={viejacontra}
                oninput={()=>onchange("ANTERIOR")}
                
            />
            {#if malviejacontra}
                <div class="label">
                    <span class="label-text-alt text-red-500">Debe escribir la contraseña anterior </span>                    
                </div>
            {/if}
            <label for = "contra" class="label">
                <span class={estilos.labelForm}>Nueva contraseña</span>
            </label>
            <input 
                id ="contra" 
                type="text"  
                class={`
                    input 
                    input-bordered 
                    border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                    w-full
                    ${estilos.bgdark2}
                `}
                bind:value={contra}
                oninput={()=>onchange("CONTRA")}
            />
            {#if malcontra}
                <div class="label">
                    <span class="label-text-alt text-red-500">Debe escribir alguna contraseña y debe tener al menos 10 caracteres</span>                    
                </div>
            {/if}
            <label for = "confirmcontra" class="label">
                <span class={estilos.labelForm}>Confirmar contraseña</span>
            </label>
            <input 
                id ="confirmcontra" 
                type="text"  
                class={`
                    input 
                    input-bordered 
                    border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                    w-full
                    ${estilos.bgdark2}
                `}
                bind:value={confcontra}
                oninput={()=>onchange("CONF")}
            />
            {#if malconfcontra}
                <div class="label">
                    <span class="label-text-alt text-red-500">Las contraseñas deben coincidir</span>                    
                </div>
            {/if}
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
                <!-- if there is a button, it will close the modal -->
                <button class="btn btn-success text-white" disabled='{!botonhabilitado}' onclick={cambiarContra} >Guardar</button>
                <button class="btn btn-neutral " onclick={cerrarModal}>Cerrar</button>
            </form>
        </div>
    </div>  
</dialog>
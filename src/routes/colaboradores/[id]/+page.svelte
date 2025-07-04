<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import PocketBase from 'pocketbase'
    import Navbarr from '$lib/components/Navbarr.svelte';
    import permisos from '$lib/stores/permisos';
    import estilos from '$lib/stores/estilos';
    import Swal from 'sweetalert2';
    import { goto } from '$app/navigation';
    import { createCaber } from '$lib/stores/cab.svelte';
    //offline
    import {openDB} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabDataByID} from "$lib/stores/cabsdata"
    import {setEstablecimientoSQL,getEsblecimientoSQL,updateLocalEstablecimientoSQL} from '$lib/stores/sqlite/dbestablecimiento';
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import {getColabSQL,setColabSQL,updateLocalColabSQL,getColabSQLByID,deleteColabSQL,setPermisoColabSQL} from '$lib/stores/sqlite/dbcolaboradores';
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import { offliner } from '$lib/stores/logs/coninternet.svelte';
    import { loger } from '$lib/stores/logs/logs.svelte';
    import { ACTUALIZACION } from '$lib/stores/constantes';
    import { addNewAnimalSQL } from '$lib/stores/sqlite/dbanimales';
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    let cab = $state({
        exist:false,
        nombre:"",
        id:""
    })
    let caber = createCaber()
    //offline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({connected:false})
    let establecimiento = $state({})
    let getlocal = $state(false)
    let ultimo_colabs = $state({})
    let comandos = $state([])

    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let id=$state("")
    let idpermiso = $state("")
    
    let nombre = $state("")
    let apellido = $state("")
    let userpermisos = $state([false,false,false,false,false,false])
    async function getPermisos(){
        const record = await pb.collection('permisos').getFirstListItem(`estxcolab='${id}'`, {
            expand: 'estxcolab,estxcolab.colab',
        });
        idpermiso = record.id
        let per = record.permisos.length == 0?[]:record.permisos.split(",")
        if(per.length!=0){
            for(let i = 0;i<per.length;i++){
                let idx = parseInt(per[i], 10)
                userpermisos[idx] = true
            }
        }
        
        nombre = record.expand.estxcolab.expand.colab.nombre
        apellido = record.expand.estxcolab.expand.colab.apellido
    }
    function removeLastChar(inputString) {
        // If the string is not empty, return the string excluding the last character
        if (inputString.length > 0) {
            return inputString.slice(0, -1);
        }
        // If the string is empty, return an empty string
        return "";
    }
    async function guardarPermisoOffline(){
       Swal.fire("Error no hay internet","No puedes guardar los permisos sin internet","error")
    }
    async function guardarPermisosOnline() {
        let per = ""
        for(let i= 0;i<userpermisos.length;i++){
            if(userpermisos[i]){
                per += ""+i+","
            }
        }
        let data = {
            permisos:removeLastChar(per)
        }
        try{
            await pb.collection('permisos').update(idpermiso, data);
            await setPermisoColabSQL(db,id,data.permisos)
            Swal.fire("Éxitos permisos","Permisos guardados con éxito","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error permisos","No se pudieron guardar los permisos con éxito","error")
        }
    }
    async function guardarPermiso(){
        if(coninternet.connected){
            await guardarPermisosOnline()
        }
        else{
            await guardarPermisoOffline()
        }
        
    }
    async function desasociarOffline() {
        Swal.fire("Error no hay internet","No puedes desasociar al colaborador sin internet","error")
    }
    async function desasociarOnline(){
        Swal.fire({
            title: 'Desasociar colaborador',
            text: '¿Seguro que deseas desasociar el colaborador?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
        }).then(async result=>{
            if(result.value){
                try{
                    
                    await pb.collection("permisos").delete(idpermiso)
                    await pb.collection("estxcolabs").delete(id)
                    await deleteColabSQL(db,id)
                    goto("/establecimiento")
                }
                catch(err){
                    console.error(err)
                } 
            }
        })
    }
    async function desasociar() {    
        if(coninternet.connected){
            await desasociarOnline()
        }
        else{
            await desasociarOffline()
        }
    }
    function volver(){
        goto("/establecimiento")
    }
    async function originalMount(){
        await getPermisos()
    }
    async function initPage(){
        if(modedebug){
            coninternet = {connected:false} // await Network.getStatus();
            if(!offliner.offline){
                coninternet = await Network.getStatus();
            }
        }
        else{
            coninternet = await Network.getStatus();
        }
        //Esto no va andar, sera siempre userer y caber
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        cab = caber.cab
        usuarioid = useroff.id
    }
    
    async function getLocalSQL() {
        let rescolab = await getColabSQLByID(db,id)
        if(modedebug){
            loger.addTextLog(JSON.stringify(rescolab,null,2))
        }
        nombre = rescolab.expand.colab.nombre
        apellido = rescolab.expand.colab.apellido
        idpermiso = rescolab.permiso
        let per = rescolab.permisos.length == 0?[]:rescolab.permisos.split(",")
        if(per.length!=0){
            for(let i = 0;i<per.length;i++){
                let idx = parseInt(per[i], 10)
                userpermisos[idx] = true
            }
        }
    }
    async function updateComandos() {
        await flushComandosSQL(db,pb)
        comandos =[]
    }
    async function getDataSQL() {
        db = await openDB()
        //Reviso el internet
        let lastinter = await getInternetSQL(db)
        //No hace falta updatear al colaborador porque lo hice
        //en la pantalla de colaboradores
        await getLocalSQL()
        if (coninternet.connected){
            await updateComandos()
            if(lastinter.internet == 0){
                await setInternetSQL(db,1,0)
            }
        }
        else{
            
            await setInternetSQL(db,0,Date.now())
        }
    }
    onMount(async ()=>{
        id = $page.params.id
        await initPage()
        await getDataSQL()
        

    })
</script>
<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-3">
            <div>
                <span>
                    {coninternet.connected?"COn internet":"sin internet"}
                </span>
            </div>
            <div>
                <span>
                    get local{getlocal}
                </span>
            </div>
        </div>
    {/if}
    <div class="mx-9 mt-1">
        <div>
            <button aria-label="volver" class={`btn ${estilos.btnsecondary}`} onclick={volver}>
                Volver         
            </button>
        </div>
    </div>
    <dir class="mb-1">
        <h1 class="text-2xl font-bold">{apellido},{nombre}</h1>
    </dir>
    <dir class="mb-1">
        <h1 class="text-lg font-semibold">Permisos</h1>
    </dir>
    <div class="grid grid-cols-1 px-9">
        <div class="">
            <div class="form-control w-11/12   lg:w-1/2">
                <label class="label cursor-pointer">
                  <span class="label-text text-base">Administar los datos del establecimiento y sus colaboradores</span>
                  <input type="checkbox" class="toggle toggle-md toggle-success" bind:checked={userpermisos[0]} />
                </label>
            </div>
        </div>
        <div class="">
            <div class="form-control w-11/12 lg:w-1/2">
                <label class="label cursor-pointer">
                  <span class="label-text text-base">Crear grupos de animales como lotes y rodeos</span>
                  <input type="checkbox" class="toggle toggle-md toggle-success" bind:checked={userpermisos[1]} />
                  
                </label>
            </div>
        </div>
        <div class="">
            <div class="form-control w-11/12 lg:w-1/2">
                <label class="label cursor-pointer " >
                  <span class="label-text text-base">Importar archivos para cargas masivas</span>
                  <input type="checkbox" class="toggle toggle-md toggle-success" bind:checked={userpermisos[2]} />
                </label>
            </div>
        </div>
        <div class="">
            <div class="form-control w-11/12 lg:w-1/2">
                <label class="label cursor-pointer">
                  <span class="label-text text-base">Realizar movimientos de múltiples animales</span>
                  <input type="checkbox" class="toggle toggle-md toggle-success" bind:checked={userpermisos[3]} />
                </label>
            </div>
        </div>
        <div class="">
            <div class="form-control w-11/12 lg:w-1/2">
                <label class="label cursor-pointer">
                  <span class="label-text text-base">Registrar los diferentes eventos del establecimiento</span>
                  <input type="checkbox" class="toggle toggle-md toggle-success" bind:checked={userpermisos[4]} />
                </label>
            </div>
        </div>
        <div class="">
            <div class="form-control w-11/12 lg:w-1/2">
                <label class="label cursor-pointer">
                  <span class="label-text text-base">Administrar la información básica de los animales</span>
                  <input type="checkbox" class="toggle toggle-md toggle-success" bind:checked={userpermisos[5]} />
                </label>
            </div>
        </div>
        <div class="grid grid-cols-2">
            <dir class="w-11/12 lg:w-1/2 flex justify-start">
                <button class={estilos.mediumsolidgreen} onclick={guardarPermiso}>Guardar permisos</button>
            </dir>
            <dir class="w-11/12 lg:w-1/2 flex justify-start">
                <button class={estilos.mediumsolidred} onclick={desasociar}>Desasociar</button>
            </dir>
        </div>
        
    </div>

    
</Navbarr>

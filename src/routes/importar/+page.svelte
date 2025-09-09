<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import CardImportar from '$lib/components/importar/CardImportar.svelte';

    import ImportarServicios from '$lib/components/importar/ImportarServicios.svelte';   
    import ImportarAnimal from '$lib/components/importar/ImportarAnimal.svelte';
    import ImportarLotes from '$lib/components/importar/ImportarLotes.svelte';
    import ImportarNacimiento from '$lib/components/importar/ImportarNacimiento.svelte';
    import ImportarObservaciones from '$lib/components/importar/ImportarObservaciones.svelte';
    import ImportarPesajes from '$lib/components/importar/ImportarPesajes.svelte';
    import ImportarRodeos from '$lib/components/importar/ImportarRodeos.svelte';
    import ImportarTactos from '$lib/components/importar/ImportarTactos.svelte';
    import ImportarInseminaciones from '$lib/components/importar/ImportarInseminaciones.svelte';
    import PocketBase from 'pocketbase';
    import { onMount } from "svelte";
    import { createCaber } from "$lib/stores/cab.svelte";
    //permisos
    import{verificarNivel,getPermisosList} from "$lib/permisosutil/lib"
    import { updatePermisos} from "$lib/stores/capacitor/offlinecab"
    //Internet
    import { actualizacion,deboActualizar } from '$lib/stores/offline/actualizar';
    import { customoffliner } from '$lib/stores/offline/custom.svelte';
    import { intermitenter } from '$lib/stores/offline/intermitencia.svelte';
    import { velocidader } from '$lib/stores/offline/velocidad.svelte';
    //offline
    import Barrainternet from '$lib/components/internet/Barrainternet.svelte';
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import {getTotalSQL,setTotalSQL,setUltimoTotalSQL} from "$lib/stores/sqlite/dbtotal"
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import { getInternet,getOnlyInternet } from "$lib/stores/offline";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import {
        getRodeosSQL,
        getLotesSQL,
        updateLocalRodeosSQL,
        getUpdateLocalRodeosLotesSQLUser,
        getLotesRodeosSQL,
        updateLocalLotesSQLUser,
        updateLocalRodeosSQLUser        
    } from "$lib/stores/sqlite/dbeventos"
    import {
        getUltimoAnimalesSQL,
        getAnimalesSQL,
        setAnimalesSQL,    
        updateLocalAnimalesSQL,
        updateLocalAnimalesSQLUser,
        getAnimalesCabSQL
    } from "$lib/stores/sqlite/dbanimales"
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from '$lib/stores/logs/coninternet.svelte';
    import Info from '$lib/components/toast/Info.svelte';
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"  

    //OFLINE
    let infotoast = $state(false)
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({connected:false})
    let ultimo_animal = $state({})
    let comandos = $state([])
    let getvelocidad = $state(0)
    let getactualizacion = $state(0)
    let getpermisos = $state("")

    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let caber = createCaber()
    let cab = caber.cab
    let animales = $state([])
    let animalesusuario = $state(0)
    let cargado = $state(false)
    
    let showtoast = $state(false)

    //Necesito eficintizar la llamada a los lote y rodeos
    let lotes = $state([])
    let rodeos = $state([])
    function  aparecerToast(){
        showtoast = true
        setTimeout(() => {
            showtoast = false;
        }, 2000); // 2 segundos
    }
    async function onmountoriginal() {
        let pb_json = await JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.record.id
        const records = await pb.collection('animales').getFullList({
            filter: `active = true && delete = false && cab = '${cab.id}'`
        })
        animales = records
        let animals = await pb.collection('Animalesxuser').getList(1,1,{filter:`user='${usuarioid}'`})
        animalesusuario = animals.totalItems
        cargado = true
    }
    async function getLocalSQL() {
        //Get animales te trae todos los aniamles del usuario
        let resanimales = await getAnimalesSQL(db,pb,caboff.id)
        let reslotes = await getLotesSQL(db,pb,caboff.id)
        let resrodeos = await getRodeosSQL(db,pb,caboff.id)
        animales = resanimales.lista
        animalesusuario = animales.total
        lotes = reslotes.lista
        rodeos = resrodeos.lista
        cargado = true
    }
    async function updateLocalSQL() {
        caboff = await updatePermisos(pb,usuarioid)
        getpermisos = caboff.permisos
        await setUltimoAnimalesSQL(db)
        await setUltimoRodeosLotesSQL(db)
        animales = await  updateLocalAnimalesSQLUser(db,pb,usuarioid)
        lotes = await  updateLocalLotesSQLUser(db,pb,usuarioid)
        rodeos = await  updateLocalRodeosSQLUser(db,pb,usuarioid)
        
        animalesusuario = animales.totalItems
        cargado = true

    }
    //Porque traer todos los datos y no solo cuando lo necesito?
    
    async function getDataSQL() {
        db = await openDB()
        //Reviso el internet
        let lastinter = await getInternetSQL(db)
        ultimo_animal = await getUltimoAnimalesSQL(db)
        let rescom = await getComandosSQL(db)
        comandos = rescom.lista
        let ahora = Date.now()
        let antes = ultimo_animal.ultimo
        await getLocalSQL()
        if (coninternet.connected){
            
            try{
                await flushComandosSQL(db,pb)
                comandos = []
                
            }
            catch(err){
                if(modedebug){
                    loger.addTextError(JSON.stringify(err),null,2)
                    loger.addTextError("Error en flush comandos")
                }
            }
            let velocidad = await velocidader.medirVelocidadInternet()
            let confiabilidad = intermitenter.calculateIntermitente()
            let mustUpdate = await deboActualizar(
                velocidad,
                confiabilidad,
                coninternet,
                false, //solo en el internet
                ahora,
                antes
            );
            if(modedebug){
                getactualizacion = await actualizacion(velocidad,confiabilidad,coninternet.connectionType)
            }
            if(mustUpdate){
               setTimeout(async () => {
                    try {
                        await updateLocalSQL(db);
                        // Notificar cambios solo si hay diferencias
                        infotoast = true;
                        setTimeout(() => {
                            infotoast = false;
                            if (modedebug) {
                                loger.addTextLog("BUEN SYNC");
                            }
                        }, 2000); // 2 segundos
                    } catch (err) {
                        if (modedebug) {
                            loger.addTextError("ERROR FALLO SYNC");
                        }

                        console.warn("Fallo en sincronización background", err);
                        // No afecta al usuario
                    }
                }, 0);
            }
        }
    }
    async function initPage() {
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        
        intermitenter.addIntermitente(coninternet.connected)
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        getpermisos = caboff.permisos
        usuarioid = useroff.id
    }
    onMount(async ()=>{
        await initPage()
        await getDataSQL()
    })

</script>
{#if modedebug}
<Barrainternet bind:coninternet/>
{/if}
<Navbarr>

    {#if cargado}
        <!--Animales-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar animales">
            <ImportarAnimal 
                {db} {coninternet} {useroff} 
                bind:caboff {usuarioid} {animales} 
                {animalesusuario} {lotes} {rodeos}
                {aparecerToast}
            />
        </CardImportar>
        <!--Tactos-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar tactos">
            <ImportarTactos 
                {db} {coninternet} {useroff} 
                bind:caboff {usuarioid} {animales}
                {aparecerToast}
            />
        </CardImportar>
        <!--Nacimientos-->
        <div class="">
            <CardImportar  cardsize="max-w-2xl" titulo="Importar nacimientos">
                <ImportarNacimiento 
                    {db} {coninternet} {useroff} 
                    bind:caboff {usuarioid} 
                    {animales} {animalesusuario} 
                    {lotes} {rodeos}
                    {aparecerToast}
                />
            </CardImportar>
        </div>
        
        <!-- RODEOS-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar rodeos">
            <ImportarRodeos
                {db} {coninternet} {useroff} 
                bind:caboff {usuarioid} {rodeos}
                {aparecerToast}
            />
        </CardImportar>
        <!--LOTE -->
        <CardImportar cardsize="max-w-2xl" titulo="Importar lotes">
            <ImportarLotes 
                {db} {coninternet} {useroff} 
                bind:caboff {usuarioid} {lotes} 
                {aparecerToast}
            />
        </CardImportar>
        <!--Observaciones-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar observaciones">
            <ImportarObservaciones 
                {db} {coninternet} {useroff} 
                bind:caboff {usuarioid} {animales}
                {aparecerToast}
            />
        </CardImportar>
        <!--Servicios-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar servicios">
            <ImportarServicios 
                {db} {coninternet} {useroff} 
                bind:caboff {usuarioid} {animales}
                {aparecerToast}
            />
        </CardImportar>
        <!--Inseminaciones-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar inseminaciones">
            <ImportarInseminaciones 
                {db} {coninternet} {useroff} 
                bind:caboff {usuarioid} {animales}
                {aparecerToast}
            />
        </CardImportar>
        <!--Pesajes-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar pesajes">
            <ImportarPesajes 
                {db} {coninternet} {useroff} 
                bind:caboff {usuarioid} {animales}
                {aparecerToast}
            />
        </CardImportar>
    {:else}
        <CardImportar cardsize="max-w-2xl" titulo="Cargando">
            <span class="loading loading-spinner loading-xl"></span>
        </CardImportar>
    {/if}
    {#if showtoast}
        <div class="toast toast-center">
            <div class="alert alert-success text-white">
                
                <span>Las plantillas se guardan en: <strong>/Documents/Documents</strong>.</span>
            </div>
        </div>
    {/if}
</Navbarr>
{#if infotoast}
    <Info/>
{/if}
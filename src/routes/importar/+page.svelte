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
    //offline
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import {getTotalSQL,setTotalSQL,setUltimoTotalSQL} from "$lib/stores/sqlite/dbtotal"
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
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
        getAnimalesSQL,
        setAnimalesSQL,    
        updateLocalAnimalesSQL,
        updateLocalAnimalesSQLUser,
        getAnimalesCabSQL
    } from "$lib/stores/sqlite/dbanimales"
    import { loger } from "$lib/stores/logs/logs.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"  

    //OFLINE
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({connected:false})
    let comandos = $state([])

    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let caber = createCaber()
    let cab = caber.cab
    let animales = $state([])
    let animalesusuario = $state(0)
    let cargado = $state(false)
    
    //Necesito eficintizar la llamada a los lote y rodeos
    let lotes = $state([])
    let rodeos = $state([])
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
        let rescom = await getComandosSQL(db)
        comandos = rescom.lista
        
        if (coninternet.connected){
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
            await setInternetSQL(db,1,Date.now())
        }
        else{
            await getLocalSQL()
            await setInternetSQL(db,0,Date.now())
        }
    }
    async function initPage() {
        coninternet = await Network.getStatus();
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
    }
    onMount(async ()=>{
        await initPage()
        await getDataSQL()
    })

</script>
<Navbarr>
    {#if cargado}
        <!--Animales-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar animales">
            <ImportarAnimal 
                {db} {coninternet} {useroff} 
                {caboff} {usuarioid} {animales} 
                {animalesusuario} {lotes} {rodeos}
            />
        </CardImportar>
        <!--Tactos-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar tactos">
            <ImportarTactos 
                {db} {coninternet} {useroff} 
                {caboff} {usuarioid} {animales}
            />
        </CardImportar>
        <!--Nacimientos-->
        <div class="hidden">
            <CardImportar  cardsize="max-w-2xl" titulo="Importar nacimientos">
                <ImportarNacimiento 
                    {db} {coninternet} {useroff} 
                    {caboff} {usuarioid} 
                    {animales} {animalesusuario} 
                    {lotes} {rodeos}
                />
            </CardImportar>
        </div>
        
        <!-- RODEOS-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar rodeos">
            <ImportarRodeos
                {db} {coninternet} {useroff} 
                {caboff} {usuarioid} {rodeos}
            />
        </CardImportar>
        <!--LOTE -->
        <CardImportar cardsize="max-w-2xl" titulo="Importar lotes">
            <ImportarLotes 
                {db} {coninternet} {useroff} 
                {caboff} {usuarioid} {lotes} 
            />
        </CardImportar>
        <!--Observaciones-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar observaciones">
            <ImportarObservaciones 
                {db} {coninternet} {useroff} 
                {caboff} {usuarioid} {animales}
            />
        </CardImportar>
        <!--Servicios-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar servicios">
            <ImportarServicios 
                {db} {coninternet} {useroff} 
                {caboff} {usuarioid} {animales}
            />
        </CardImportar>
        <!--Inseminaciones-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar inseminaciones">
            <ImportarInseminaciones 
                {db} {coninternet} {useroff} 
                {caboff} {usuarioid} {animales}
            />
        </CardImportar>
        <!--Pesajes-->
        <CardImportar cardsize="max-w-2xl" titulo="Importar pesajes">
            <ImportarPesajes 
                {db} {coninternet} {useroff} 
                {caboff} {usuarioid} {animales}
            />
        </CardImportar>
    {:else}
        <CardImportar cardsize="max-w-2xl" titulo="Cargando">
            <span class="loading loading-spinner loading-xl"></span>
        </CardImportar>
    {/if}
    
</Navbarr>
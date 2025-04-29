<script>
    import { browser } from "$app/environment"
    import Navbarr from "$lib/components/Navbarr.svelte";
    import PocketBase from 'pocketbase'
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import estilos from "$lib/stores/estilos";
    import Swal from 'sweetalert2'
    import CardBase from "$lib/components/CardBase.svelte";
    import CardAnimal from "$lib/components/animal/CardAnimal.svelte";
    import DatosBasicos from "$lib/components/animal/DatosBasicos.svelte";
    import Pariciones from "$lib/components/animal/Pariciones.svelte";
    import Tactos from "$lib/components/animal/Tactos.svelte";
    import Historial from "$lib/components/animal/Historial.svelte";
    import {guardarHistorial,guardarHistorialOffline} from "$lib/historial/lib"
    import Acciones from "$lib/components/animal/Acciones.svelte";
    import { createCaber } from "$lib/stores/cab.svelte";
    import Inseminaciones from "$lib/components/animal/Inseminaciones.svelte";
    import Tratamientos from "$lib/components/animal/Tratamientos.svelte";
    import Observaciones from "$lib/components/animal/Observaciones.svelte";
    import Pesajes from "$lib/components/animal/Pesajes.svelte";
    import HistoriaClinica from "$lib/components/animal/HistoriaClinica.svelte";
    import tiponoti from "$lib/stores/tiponoti";
    import Servicios from "$lib/components/animal/Servicios.svelte";    
    //offline
    import {getAnimalesDB, openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import {
        getAnimalSQLByID,
        deleteAnimalSQL,
        updateAnimalSQL
        
    } from "$lib/stores/sqlite/dbanimales"
    import {
        updateLocalTactosSQL,
        updateLocalNacimientosSQL,

        getNacimientosSQL

    } from "$lib/stores/sqlite/dbeventos"
    import {getTotalSQL,setTotalSQL,setUltimoTotalSQL} from "$lib/stores/sqlite/dbtotal"
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';

    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state(false)
    let comandos = $state([])
    let ruta = import.meta.env.VITE_RUTA
    //let pre 
    const pb = new PocketBase(ruta);
    let caber = createCaber()
    let cab = caber.cab
    let cargado = $state(false)
    // Datos
    let slug = $state("")
    let caravana = $state("")
    let active = $state(true)
    let fechanacimiento = $state("")
    let sexo = $state("")
    let nacimiento = $state("")
    let rodeo = $state("")
    let lote = $state("")
    let peso = $state(0)
    let categoria = $state("")
    let pariciones = $state([])
    let fechafall = $state("")
    let motivobaja = $state("")
    let nacimientoobj = $state({})
    let tactos = $state([])
    let prenada = $state(0)
    
    let modohistoria = $state(false)
   
    
    async function  getPariciones(id){
        const recordpariciones =  await pb.collection('nacimientos').getFullList({
            filter:`madre='${id}' || padre='${id}'`,
            sort: '-created',
        });
        pariciones = recordpariciones
    }
    async function getTactos(id){
        const recordtactos = await pb.collection('tactos').getFullList({
            filter:`animal='${id}'`,
            sort: '-created',
        });

        tactos = recordtactos
    }
    async function darBajaOffline(fechafallecimiento,motivo){
        const data = {
            id:slug,
            active: false,
            lote:"",
            rodeo:"",
            fechafallecimiento: fechafallecimiento +  " 03:00:00",
            motivobaja:motivo
        };
        let comando = {
            tipo:"update",
            coleccion:"animales",
            data:{...data},
            hora:Date.now(),
            prioridad:0,
            idprov:slug,
            camposprov:""
        }
        comandos.push(comando)
        let esnuevo = slug.split("_").length > 0
        if(!esnuevo){
            let c = await guardarHistorialOffline(db,slug,useroff.id)
            comandos.push(c)
        }
        await setComandosSQL(db,comandos)
        await updateAnimalSQL(db,slug,data)
        Swal.fire("Éxito eliminar","Se pudo eliminar al animal","success")
        

        goto("/animales") 
    }
    async function darBajaOnline(fechafallecimiento,motivo){
        try{
            const data = {
                active: false,
                lote:"",
                rodeo:"",
                fechafallecimiento: fechafallecimiento +  " 03:00:00",
                motivobaja:motivo

            };
            await guardarHistorial(pb,slug)
            const record = await pb.collection('animales').update(slug, data);  
            Swal.fire("Éxito dar de baja","Se pudo dar de baja al animal","success")
            goto("/animales")  
        }
        catch(err){
            Swal.fire("Error dar de baja","No se pudo dar de baja al animal","error")
        }
    }
    async function darBaja(fechafallecimiento,motivo){
        if(coninternet.connected){
            darBajaOnline(fechafallecimiento,motivo)
        }
        else{
            darBajaOffline(fechafallecimiento,motivo)
        }
        
        
    }
    async function eliminarOffline() {
        const data = {
            id:slug,
            delete: true,
            active:false,
            lote:"",
            rodeo:""
        };
        let comando = {
            tipo:"update",
            coleccion:"animales",
            data:{...data},
            hora:Date.now(),
            prioridad:0,
            idprov:slug,
            camposprov:""
        }
        comandos.push(comando)
        await setComandosSQL(db,comandos)
        await updateAnimalSQL(db,slug,data)
        Swal.fire("Éxito eliminar","Se pudo eliminar al animal","success")
        goto("/animales") 
    }
    async function eliminarOnline() {
        try{
            const data = {
                delete: true,
                active:false,
                lote:"",
                rodeo:""
            };

            const record = await pb.collection('animales').update(slug, data);  
            Swal.fire("Éxito eliminar","Se pudo eliminar al animal","success")
            goto("/animales")  
        }
        catch(err){
            Swal.fire("Error eliminar","No se eliminar al animal","error")
            
        }
    }
    async function eliminar(){
        if(coninternet.connected){
            await eliminarOnline()
        }
        else{
            await eliminarOffline()
        }
    }
    function transferirOffline(codigo) {
        Swal.fire("Error transferencia","No se pueden hacer transferencias sin internet","error")
    }
    async function transferirOnline(codigo) {
        const resultcab = await pb.collection('cabs').getList(1, 1, {
            filter: `active = true && renspa = '${codigo}'`,
            
        });
        try{
            
            let data = {
                cab:resultcab.items[0].id,
                lote:"",
                rodeo:""
            }
            
            const record = await pb.collection('animales').update(slug, data);

            let pb_json = JSON.parse(localStorage.getItem('pocketbase_auth'))
        
            let origenusuarioid =  pb_json.record.id
            let datatrans = {
                texto:"Se transfirió a "+codigo,
                titulo:"Transferencia de 1 animal",
                tipo:tiponoti[1].id,
                origen:origenusuarioid,
                destino:resultcab.items[0].user,
                leido:false
            }
            await pb.collection('notificaciones').create(datatrans);
            
            goto("/animales")
            Swal.fire("Éxito transferencia","Se pudo transferir al animal","success")
        }catch(err){
            console.error(err)
            Swal.fire("Error transferencia","No se pudo transferir al animal","error")
        }
    }
    async function transferir(codigo){
        if(coninternet.connected){
            await transferirOnline(codigo)
        }
        else{
            transferirOffline(codigo)
        }
        
        
    }

    async function onMountOriginal() {
        slug = $page.params.slug
        if(slug != ""){
            try{
                const recorda = await pb.collection('animales').getOne(slug, {
                    expand:"nacimiento"
                });
                caravana = recorda.caravana
                active = recorda.active
                fechanacimiento = recorda.fechanacimiento.split(" ")[0]
                
                nacimiento = ""
                nacimientoobj = {}
                if(recorda.nacimiento != ""){
                    nacimiento =recorda.nacimiento
                    nacimientoobj = recorda.expand.nacimiento
                }
                peso = recorda.peso
                sexo = recorda.sexo
                rodeo = recorda.rodeo
                lote = recorda.lote
                categoria = recorda.categoria
                prenada = recorda.prenada==1?0:recorda.prenada
                if(recorda.fechafallecimiento != ""){
                    fechafall = recorda.fechafallecimiento.split(" ")[0]
                    motivobaja = recorda.motivobaja
                }
                cargado = true
                
            }
            catch(err){
                

                Swal.fire('Error animal', 'No existe el animal', 'error');
            }

        }
    }
    async function initPage(){
        coninternet = await Network.getStatus();
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
    }
    async function getLocalSQL() {
        
        let tactostodos = await getTactosSQL(db)
        let nacimientostodos = await getNacimientosSQL(db)
        pariciones = nacimientostodos.lista.filter(n=>n.madre == slug ||  n.padre == slug)
        tactos = tactostodos.lista.filter(t=>t.animal == slug)

    }
    async function updateLocalSQL() {
        let tactostodos = await updateLocalTactosSQL(db,pb,caboff.id)
        let nacimientostodos = await updateLocalNacimientosSQL(db,pb,caboff.id)
        pariciones = nacimientostodos.filter(n=>n.madre == slug ||  n.padre == slug)

        tactos = tactostodos.filter(t=>t.animal == slug)

    }
    async function getDataSQL() {
        db = await openDB()
        let rescom = await getComandosSQL(db)
        comandos = rescom.lista
        let data = await getAnimalSQLByID(db,slug)
        caravana = data.caravana
        active = data.active
        fechanacimiento = data.fechanacimiento.split(" ")[0]
        nacimiento = ""
        nacimientoobj = {}
        if(data.nacimiento != ""){
            nacimiento =data.nacimiento
            nacimientoobj = data.expand.nacimiento
        }
        peso = data.peso
        sexo = data.sexo
        rodeo = data.rodeo
        lote = data.lote
        categoria = data.categoria
        prenada = data.prenada==1?0:data.prenada
        if(data.fechafallecimiento != ""){
            fechafall = data.fechafallecimiento.split(" ")[0]
            motivobaja = data.motivobaja
        }
        let lastinter = await getInternetSQL(db)
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
        cargado = true
    }
    onMount(async ()=>{
        slug = $page.params.slug
        await initPage()
        if(slug!=""){
            
            await getDataSQL()
            
        }
        
    })
</script>
<Navbarr>
    <CardAnimal cardsize="max-w-7xl" titulo="Datos básicos">
        <DatosBasicos {peso} {prenada} {categoria} {lote} {rodeo} sexo={sexo} caravana={caravana} connacimiento={nacimiento != ""} nacimiento={nacimientoobj} fechanacimiento = {fechanacimiento} bind:modohistoria={modohistoria}/>
    </CardAnimal>
    {#if !modohistoria}
        <CardAnimal cardsize="max-w-7xl" titulo="Pesajes">
            <Pesajes pesoanterior={peso} bind:peso={peso} {caravana}></Pesajes>
        </CardAnimal>
        {#if cargado}
            <CardAnimal cardsize="max-w-7xl" titulo="Tratamientos">
                <Tratamientos cabid={cab.id} {categoria} ></Tratamientos>
            </CardAnimal>
            <CardAnimal cardsize="max-w-7xl" titulo="Observaciones">
                <Observaciones cabid={cab.id} {categoria}/>
            </CardAnimal>
        {/if}
        
        {#if sexo=="H"}
            {#if cargado}
                <CardAnimal cardsize="max-w-7xl" titulo="Pariciones">
                    <Pariciones cabid={cab.id} sexoanimal = {sexo} bind:prenada={prenada}/>
                </CardAnimal>
                
                <CardAnimal cardsize="max-w-7xl" titulo="Tactos">
                    
                    <Tactos cabid={cab.id}  bind:prenadaori={prenada} {categoria}/>
                    
                </CardAnimal>
                <CardAnimal cardsize="max-w-7xl" titulo="Inseminaciones">
                    <Inseminaciones cabid={cab.id} {categoria} bind:prenadaori={prenada}/>
                </CardAnimal>

                <!--<CardAnimal cardsize="max-w-7xl" titulo="Servicios">
                    <Servicios cabid={cab.id} {categoria} bind:prenadaori={prenada}/>
                </CardAnimal>
                -->
            {/if}
        {/if}
        <CardAnimal cardsize="max-w-7xl" titulo="Historial">
            <Historial  />
        </CardAnimal>
    {:else}
        <CardAnimal cardsize="max-w-7xl" titulo="Historia clínica">
            <HistoriaClinica  />
        </CardAnimal>
    {/if}
    <CardAnimal cardsize="max-w-7xl" titulo="Acciones">
        <Acciones 
            caravana = {caravana}
            fechafallecimiento  = {fechafall}
            motivo = {motivobaja}
            bajar={async (fechafallecimiento,motivo)=>await darBaja(fechafallecimiento,motivo)}
            eliminar={eliminar}
            transferir={(codigo)=>transferir(codigo)}
        />
    </CardAnimal>
</Navbarr>
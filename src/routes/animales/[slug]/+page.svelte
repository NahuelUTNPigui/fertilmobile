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
    import SelectTab from "$lib/components/animal/SelectTab.svelte";
    //probar internet
    import { actualizacion,deboActualizar } from '$lib/stores/offline/actualizar';
    import { customoffliner } from '$lib/stores/offline/custom.svelte';
    import { intermitenter } from '$lib/stores/offline/intermitencia.svelte';
    import { velocidader } from '$lib/stores/offline/velocidad.svelte';
    
    //offline
    import Barrainternet from '$lib/components/internet/Barrainternet.svelte';
    import { getInternet,getOnlyInternet } from '$lib/stores/offline';
    import { openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import {
        getAnimalSQLByID,
        deleteAnimalSQL,
        editarAnimalSQL,
        getHistorialAnimalesSQL,
        getAnimalesSQL,
        updateLocalHistorialAnimalesSQLUser
    } from "$lib/stores/sqlite/dbanimales"
    import {        
        updateLocalNacimientosSQLUser,
        
        updateLocalTactosSQLUser,
        updateLocalTiposTratSQLUser,
        updateLocalTratsSQL,
        updateLocalObservaciones,
        updateLocalObservacionesSQLUser,
        updateLocalServiciosSQL,
        updateLocalServiciosSQLUser,
        
        updateLocalPesajesSQLUser,
        updateLocalInseminacionesSQL,
        updateLocalInseminacionesSQLUser,
        getTactosSQL,
        getNacimientosSQL,
        getTiposTratSQL,
        getTratsSQL,
        getObservacionesSQL,
        getPesajesSQL,
        getServiciosSQL,
        getInseminacionesSQL,
        updateLocalTratsSQLUser,
        getLotesRodeosSQL,
        getUpdateLocalRodeosLotesSQLUser



    } from "$lib/stores/sqlite/dbeventos"
    import {getTotalSQL,setTotalSQL,setUltimoTotalSQL} from "$lib/stores/sqlite/dbtotal"
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    import { loger } from "$lib/stores/logs/logs.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    
    //offline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({connected:false})
    let comandos = $state([])
    let getlocal = $state(false)
    //variables
    let getvelocidad = $state(0)
    let ruta = import.meta.env.VITE_RUTA
    let pre = ""
    const pb = new PocketBase(ruta);
    let caber = createCaber()
    let cab = caber.cab
    let cargado = $state(false)
    let pestañas = $state([])
    let tab=$state("")
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
    let rp = $state("")
    let categoria = $state("")
    
    let fechafall = $state("")
    let motivobaja = $state("")
    let nacimientoobj = $state({})

    let prenada = $state(0)
    let modohistoria = $state(false)
    //EVENTOS
    let tactos = $state([])
    let observaciones = $state([])
    let tratamientos = $state([])
    let pesajes = $state([])
    let servicios = $state([])
    let inseminaciones = $state([])
    let pariciones = $state([])
    let tipostrat = $state([])
    let historial = $state([])
    //EVENTOS ANIMAL
    let tactosanimal = $state([])
    let observacionesanimal = $state([])
    let tratamientosanimal = $state([])
    let pesajesanimal = $state([])
    let serviciosanimal = $state([])
    let inseminacionesanimal = $state([])
    let paricionesanimal = $state([])
    let tipostratcab = $state([])
    //animales para mostrar 
    let animales = $state([])
    let animalescab = $state([])
    //Lotes y rodeos
    let lotes = $state([])
    let rodeos = $state([])
    
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
        let esnuevo = slug.split("_").length > 1
        if(!esnuevo){
            let c = await guardarHistorialOffline(db,slug,useroff.id)
            comandos.push(c)
        }
        await setComandosSQL(db,comandos)
        await editarAnimalSQL(db,slug,data)
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
            await editarAnimalSQL(db,slug,data)
            Swal.fire("Éxito dar de baja","Se pudo dar de baja al animal","success")
            goto("/animales")  
        }
        catch(err){
            Swal.fire("Error dar de baja","No se pudo dar de baja al animal","error")
        }
    }
    //Esta funcion sirve para desactivar la vaca pero no eliminarla
    //Capaz no se le pueden realizar acciones
    async function darBaja(fechafallecimiento,motivo){
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        let isOnline = await getOnlyInternet()
        intermitenter.addIntermitente(isOnline)
        if(coninternet.connected){
            await darBajaOnline(fechafallecimiento,motivo)
        }
        else{
            await darBajaOffline(fechafallecimiento,motivo)
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
        await editarAnimalSQL(db,slug,data)
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
            await editarAnimalSQL(db,slug,data)
            Swal.fire("Éxito eliminar","Se pudo eliminar al animal","success")
            goto("/animales")  
        }
        catch(err){
            Swal.fire("Error eliminar","No se eliminar al animal","error")
            
        }
    }
    async function eliminar(){
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        let isOnline = await getOnlyInternet()
        intermitenter.addIntermitente(isOnline)
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
            await editarAnimalSQL(db,slug,data)
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
            try{
                await pb.collection('notificaciones').create(datatrans);
            }
            catch(err){
                if (modedebug){
                    loger.addTextError("Error en enviar la notificacion")
                }  
            }
            
            
            goto("/animales")
            Swal.fire("Éxito transferencia","Se pudo transferir al animal","success")
        }catch(err){
            console.error(err)
            Swal.fire("Error transferencia","No se pudo transferir al animal","error")
        }
    }
    async function transferir(codigo){
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        let isOnline = await getOnlyInternet()
        intermitenter.addIntermitente(isOnline)
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
        if(modedebug){
            coninternet = {connected:false} // await Network.getStatus();
            if(!offliner.offline){
                coninternet = await Network.getStatus();
            }
        }
        else{
            coninternet = await Network.getStatus();
        }
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
    }
    async function getLocalSQL() {
        let resanimales = await getAnimalesSQL(db)
        let tactostodos = await getTactosSQL(db)
        let nacimientostodos = await getNacimientosSQL(db)
        let pesajestodos = await getPesajesSQL(db)
        let tratstodos = await getTratsSQL(db)
        let servistodos = await getServiciosSQL(db)
        let inseminacionestodos = await getInseminacionesSQL(db)
        let observacionestodos = await getObservacionesSQL(db)
        let tipostratodos = await getTiposTratSQL(db)
        let historialtodos = await getHistorialAnimalesSQL(db)
        let lotesrodeos = await getLotesRodeosSQL(db,caboff.id)
        animales = resanimales.lista
        pesajes = pesajestodos.lista
        tratamientos = tratstodos.lista
        observaciones = observacionestodos.lista
        servicios = servistodos.lista
        inseminaciones = inseminacionestodos.lista
        tipostrat = tipostratodos.lista
        pariciones = nacimientostodos.lista
        tactos = tactostodos.lista
        historial = historialtodos.lista
        lotes = lotesrodeos.lotes
        rodeos = lotesrodeos.rodeos
        //propios del animal
        //pesajesanimal = pesajestodos.lista.filter(p=>p.animal == slug)
        //tratamientosanimal = tratstodos.lista.filter(t=>t.animal == slug)
        //observacionesanimal = observacionestodos.lista.filter(o=>o.animal == slug)
        //serviciosanimal = servistodos.lista.filter(s=>s.madre  == slug)
        //inseminacionesanimal = inseminacionestodos.lista.filter(i=>i.animal == slug)
        //tipostratcab = tipostratodos.lista.filter(tt=>(tt.cab == caboff.id || tt.generico) && tt.active)
        //paricionesanimal = nacimientostodos.lista.filter(n=>n.madre == slug ||  n.padre == slug)
        //tactosanimal = tactostodos.lista.filter(t=>t.animal == slug)
        //animalescab = animales.filter(a=>a.cab == caboff.id && a.active)

    }
    // Me hace ruido nunca se usa
    async function updateLocalSQL() {
        let resanimales = await getAnimalesSQL(db)
        animales = resanimales.lista
        let tactostodos = await updateLocalTactosSQLUser(db,pb,usuarioid)
        let nacimientostodos = await updateLocalNacimientosSQLUser(db,pb,usuarioid)
        let pesajestodos = await updateLocalPesajesSQLUser(db,pb,usuarioid)
        let tratstodos = await updateLocalTratsSQLUser(db,pb,usuarioid)
        let servistodos = await updateLocalServiciosSQLUser(db,pb,usuarioid)
        let inseminacionestodos = await updateLocalInseminacionesSQLUser(db,pb,usuarioid)
        let observacionestodos = await updateLocalObservacionesSQLUser(db,pb,usuarioid)
        let tipostratodos = await updateLocalTiposTratSQLUser(db,pb,usuarioid)
        let historialtodos = await updateLocalHistorialAnimalesSQLUser(db,pb,usuarioid) 
        let lotesrodeos = await getUpdateLocalRodeosLotesSQLUser(db,pb,usuarioid,caboff.id)
        pesajes = pesajestodos.filter(p=>p.animal == slug)
        tratamientos = tratstodos.filter(t=>t.animal == slug)
        observaciones = observacionestodos.filter(o=>o.animal == slug)
        servicios = servistodos.filter(s=>s.madre  == slug)
        inseminaciones = inseminacionestodos.filter(i=>i.animal == slug)
        tipostrat = tipostratodos.filter(tt=>(tt.cab == caboff.id || tt.generico) && tt.active)
        pariciones = nacimientostodos.filter(n=>n.madre == slug ||  n.padre == slug)
        tactos = tactostodos.filter(t=>t.animal == slug)
        historial = historialtodos.filter(h=>h.animal == slug)
        lotes = lotesrodeos.lotes
        rodeos = lotesrodeos.rodeos

    }
    async function getDataSQLOriginal() {
        let lastinter = await getInternetSQL(db)
        if (coninternet.connected){
            if(lastinter.internet == 0){
                await setInternetSQL(db,1,Date.now())
                await updateLocalSQL()
            }
            else{
                let ahora = Date.now()
                let antes = lastinter.ultimo
                const cincoMinEnMs = 300000;
                if((ahora - antes) >= cincoMinEnMs){
                    await setInternetSQL(db,1,Date.now())
                    await updateLocalSQL()
                }
                else{
                    await getLocalSQL()            
                }
            }
            
        }
        else{
            await getLocalSQL()
            await setInternetSQL(db,0,Date.now())
        }
        cargado = true
    }
    async function getDataSQL() {
        db = await openDB()
        let rescom = await getComandosSQL(db)
        comandos = rescom.lista
        let data = await getAnimalSQLByID(db,slug)
        caravana = data.caravana
        active = data.active
        fechanacimiento = data.fechanacimiento.split(" ")[0]
        
        peso = data.peso
        sexo = data.sexo
        rodeo = data.rodeo
        lote = data.lote
        rp  = data.rp
        categoria = data.categoria
        prenada = data.prenada==1?0:data.prenada
        if(data.fechafallecimiento != ""){
            fechafall = data.fechafallecimiento.split(" ")[0]
            motivobaja = data.motivobaja
        }
        await getLocalSQL()
        nacimiento = ""
        nacimientoobj = {}
        if(data.nacimiento != ""){
            nacimiento = data.nacimiento
            let n_idx = pariciones.findIndex(n=>n.id==nacimiento)
            if(n_idx != -1){
                nacimientoobj = pariciones[n_idx]
                //if(modedebug){
                //    loger.addTextLog(JSON.stringify(nacimientoobj,null,2))
                //}
            }
            
        }
        cargado = true
    }
    //Necesito una funcion que traiga toda la informacion del animal
    //Para mi es siempre get
    onMount(async ()=>{
        slug = $page.params.slug
        await initPage()
        if(slug!=""){
            await getDataSQL()
            tab = "datos"
            if(sexo.toLowerCase()=="h"){
                pestañas = [
                    {id:"datos",nombre:"Datos básicos"},
                    {id:"pesajes",nombre:"Pesajes"},
                    {id:"tratamientos",nombre:"Tratamientos"},
                    {id:"observaciones",nombre:"Observaciones"},
                    {id:"pariciones",nombre:"Pariciones"},
                    {id:"tactos",nombre:"Tactos"},
                    {id:"servicios",nombre:"Servicios"},
                    {id:"clinica",nombre:"Historia clínica"},
                    {id:"historial",nombre:"Historial"}
                ]
            }
            else{
                pestañas = [
                    {id:"datos",nombre:"Datos básicos"},
                    {id:"pesajes",nombre:"Pesajes"},
                    {id:"tratamientos",nombre:"Tratamientos"},
                    {id:"observaciones",nombre:"Observaciones"},
                    {id:"clinica",nombre:"Historia clínica"},
                    {id:"historial",nombre:"Historial"}
                ]
            }
        }
        
    })
</script>
<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-3">
            
            <span>
                con internet: {coninternet.connected}
            </span>
        </div>
    {/if}
    <div class="flex justify-center mt-1">
        <div class="w-full max-w-7xl px-4">
          <!-- Combo alineado al borde izquierdo de la card -->
          <SelectTab bind:pestañas bind:tab />
        </div>
    </div>
    {#if cargado}
        {#if tab == "datos"}
            <!--Datos animal-->
            <CardAnimal cardsize="max-w-7xl" titulo="Datos básicos">
                <DatosBasicos {rp} {peso} {prenada} 
                    {categoria} {lote} {rodeo} sexo={sexo} caravana={caravana} 
                    {lotes} {rodeos}
                     {useroff} {caboff}
                    {db} animales = {animales}
                    bind:coninternet
                    bind:comandos
                    connacimiento={nacimiento != ""} nacimiento={nacimientoobj} 
                    fechanacimiento = {fechanacimiento} bind:modohistoria={modohistoria}
                />
            </CardAnimal>
            <Acciones 
                    caravana = {caravana}
                    bind:fechafallecimiento  = {fechafall}
                    bind:motivo = {motivobaja}
                    bajar={async (fechafallecimiento,motivo)=>await darBaja(fechafallecimiento,motivo)}
                    {eliminar}
                    transferir={async (codigo)=>await transferir(codigo)}
                />
        {:else if tab =="pesajes"}
            <!--Pesajes-->
            <CardAnimal cardsize="max-w-7xl" titulo="Pesajes">
                <Pesajes {db} bind:comandos bind:pesajes  bind:coninternet pesoanterior={peso} bind:peso={peso} {caravana}></Pesajes>
            </CardAnimal>
        {:else if tab =="tratamientos"}
            <!--Tipos y tratamientos-->
            <CardAnimal cardsize="max-w-7xl" titulo="Tratamientos">
                <Tratamientos {db} bind:coninternet  bind:caravana bind:comandos bind:tratamientos {tipostrat}  cabid={cab.id} {categoria} ></Tratamientos>
            </CardAnimal>
        {:else if tab =="observaciones"}
            <!--Observaciones-->
            <CardAnimal cardsize="max-w-7xl" titulo="Observaciones">
                <Observaciones {db} bind:coninternet bind:caravana bind:comandos bind:observaciones cabid={cab.id} {categoria}/>
            </CardAnimal>
        {:else if tab =="pariciones"}
            <!--Animales nacimientos-->
            <CardAnimal cardsize="max-w-7xl" titulo="Pariciones">
                <Pariciones  
                    {db} {useroff} bind:coninternet 
                    bind:caravanamadre = {caravana} 
                    bind:animales bind:comandos 
                    bind:pariciones cabid={cab.id} 
                    {usuarioid}
                    sexoanimal = {sexo} bind:prenada={prenada}
                />
            </CardAnimal>
        {:else if tab =="tactos"}
            <!--Tactos-->
            <CardAnimal cardsize="max-w-7xl" titulo="Tactos">
                <Tactos {db} bind:coninternet bind:caravana bind:comandos bind:tactos cabid={cab.id}  bind:prenadaori={prenada} {categoria}/>
            </CardAnimal>
        {:else if tab =="servicios"}
            <!--Animales servicios-->
            <CardAnimal cardsize="max-w-7xl" titulo="Servicios">
                <Servicios {db} bind:coninternet bind:caravana bind:comandos bind:servicios bind:inseminaciones bind:animales cabid={cab.id} {categoria}/>
                <!--<Servicios {db} {coninternet} bind:caravana bind:comandos  cabid={cab.id} {categoria}/>-->
            </CardAnimal>
        {:else if tab =="clinica"}
            <!--Pesajes, tactos, servicios, tratamientos, observaciones,pariciones-->
            <CardAnimal cardsize="max-w-7xl" titulo="Historia clínica">
                <!--<HistoriaClinica {db}{coninternet}  bind:comandos bind:pesajes bind:tratamientos bind:observaciones bind:servicios bind:inseminaciones  />-->
                <HistoriaClinica   
                    bind:pesajes
                    bind:tratamientos
                    bind:observaciones
                    bind:pariciones
                    bind:tactos
                    bind:servicios
                    bind:inseminaciones
                    bind:historial
                />
            </CardAnimal>
        {:else if tab=="historial"}
            <!--Historial del animal-->
            <CardAnimal cardsize="max-w-7xl" titulo="Historial">
                <!--<Historial {db} {coninternet} bind:historial />-->
                <Historial  bind:historial/>
            </CardAnimal>
        {/if}
        
    {:else}
        <div class="flex items-center justify-center">
            <span class="loading loading-spinner text-success"></span>
        </div>
    {/if}
    
    
</Navbarr>
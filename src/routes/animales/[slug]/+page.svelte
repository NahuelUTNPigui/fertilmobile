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
    //offline
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
        updateLocalHistorialAnimalesSQLUser,
        updateLocalAnimalesSQLUser,
        getAnimalesSQL

    } from "$lib/stores/sqlite/dbanimales"
    import {        
        updateLocalNacimientosSQLUser,
        updateLocalTactosSQL,
        updateLocalTactosSQLUser,
        updateLocalTipoTratsSQL,
        updateLocalTiposTratSQLUser,
        updateLocalTratsSQL,
        updateLocalObservaciones,
        updateLocalObservacionesSQLUser,
        updateLocalServiciosSQL,
        updateLocalServiciosSQLUser,
        updateLocalPesajesSQL,
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

        updateLocalTratsSQLUser

    } from "$lib/stores/sqlite/dbeventos"
    import {getTotalSQL,setTotalSQL,setUltimoTotalSQL} from "$lib/stores/sqlite/dbtotal"
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    //offline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({})
    let comandos = $state([])
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
    //animales para mostrar 
    let animales = $state([])
    
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
        animales = resanimales.lista
        pesajes = pesajestodos.lista.filter(p=>p.animal == slug)
        tratamientos = tratstodos.lista.filter(t=>t.animal == slug)
        observaciones = observacionestodos.lista.filter(o=>o.animal == slug)
        servicios = servistodos.lista.filter(s=>s.madre  == slug)
        inseminaciones = inseminacionestodos.lista.filter(i=>i.animal == slug)
        tipostrat = tipostratodos.lista.filter(tt=>(tt.cab == caboff.id || tt.generico) && tt.active)
        pariciones = nacimientostodos.lista.filter(n=>n.madre == slug ||  n.padre == slug)
        tactos = tactostodos.lista.filter(t=>t.animal == slug)
        historial = historialtodos.lista.filter(h=>h.animal == slug)

    }
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
        let tipostratodos = await updateLocalTipoTratsSQL(db,pb,caboff.id)
        let historialtodos = await updateLocalHistorialAnimalesSQL(db,pb,caboff.id) 
        pesajes = pesajestodos.filter(p=>p.animal == slug)
        tratamientos = tratstodos.filter(t=>t.animal == slug)
        observaciones = observacionestodos.filter(o=>o.animal == slug)
        servicios = servistodos.filter(s=>s.madre  == slug)
        inseminaciones = inseminacionestodos.filter(i=>i.animal == slug)
        tipostrat = tipostratodos.filter(tt=>(tt.cab == caboff.id || tt.generico) && tt.active)
        pariciones = nacimientostodos.filter(n=>n.madre == slug ||  n.padre == slug)
        tactos = tactostodos.filter(t=>t.animal == slug)
        historial = historialtodos.filter(h=>h.animal == slug)

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
            nacimiento = data.nacimiento
            nacimientoobj = data.expand.nacimiento
        }
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
                    connacimiento={nacimiento != ""} nacimiento={nacimientoobj} 
                    fechanacimiento = {fechanacimiento} bind:modohistoria={modohistoria}
                />
            </CardAnimal>
            <Acciones 
                    caravana = {caravana}
                    bind:fechafallecimiento  = {fechafall}
                    bind:motivo = {motivobaja}
                    bajar={async (fechafallecimiento,motivo)=>await darBaja(fechafallecimiento,motivo)}
                    eliminar={eliminar}
                    transferir={async (codigo)=>await transferir(codigo)}
                />
        {:else if tab =="pesajes"}
            <!--Pesajes-->
            <CardAnimal cardsize="max-w-7xl" titulo="Pesajes">
                <Pesajes {db} bind:comandos bind:pesajes  {coninternet} pesoanterior={peso} bind:peso={peso} {caravana}></Pesajes>
            </CardAnimal>
        {:else if tab =="tratamientos"}
            <!--Tipos y tratamientos-->
            <CardAnimal cardsize="max-w-7xl" titulo="Tratamientos">
                <Tratamientos {db} {coninternet}  bind:caravana bind:comandos bind:tratamientos {tipostrat}  cabid={cab.id} {categoria} ></Tratamientos>
            </CardAnimal>
        {:else if tab =="observaciones"}
            <!--Observaciones-->
            <CardAnimal cardsize="max-w-7xl" titulo="Observaciones">
                <Observaciones {db} {coninternet} bind:caravana bind:comandos bind:observaciones cabid={cab.id} {categoria}/>
            </CardAnimal>
        {:else if tab =="pariciones"}
            <!--Animales nacimientos-->
            <CardAnimal cardsize="max-w-7xl" titulo="Pariciones">
                <Pariciones  {db} {useroff} {coninternet} bind:caravanamadre = {caravana} bind:animales bind:comandos bind:pariciones cabid={cab.id} sexoanimal = {sexo} bind:prenada={prenada}/>
            </CardAnimal>
        {:else if tab =="tactos"}
            <!--Tactos-->
            <CardAnimal cardsize="max-w-7xl" titulo="Tactos">
                <Tactos {db} {coninternet} bind:caravana bind:comandos bind:tactos cabid={cab.id}  bind:prenadaori={prenada} {categoria}/>
            </CardAnimal>
        {:else if tab =="servicios"}
            <!--Animales servicios-->
            <CardAnimal cardsize="max-w-7xl" titulo="Servicios">
                <Servicios {db} {coninternet} bind:caravana bind:comandos bind:servicios bind:inseminaciones bind:animales cabid={cab.id} {categoria}/>
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
        
    {/if}
    
    
</Navbarr>
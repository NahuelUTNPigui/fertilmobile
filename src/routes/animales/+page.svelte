<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Exportar from '$lib/components/Exportar.svelte';
    import PocketBase from 'pocketbase'
    import { slide } from 'svelte/transition';
    import Swal from 'sweetalert2';
    import { onMount } from 'svelte';
    import sexos from '$lib/stores/sexos';
    import estilos from '$lib/stores/estilos';
    import estados from '$lib/stores/estados';
    import categorias from '$lib/stores/categorias';
    import { goto }  from '$app/navigation';
    import { createCaber } from '$lib/stores/cab.svelte';
    import { createUserer } from '$lib/stores/user.svelte';
    import {createPer} from "$lib/stores/permisos.svelte"
    import { getPermisosList } from '$lib/permisosutil/lib';
    import RadioButton from '$lib/components/RadioButton.svelte';
    import { getEstadoNombre,getEstadoColor } from '$lib/components/estadosutils/lib';
    import MultiSelect from '$lib/components/MultiSelect.svelte';
    import cuentas from '$lib/stores/cuentas';
    import { getSexoNombre,capitalize,shorterWord } from '$lib/stringutil/lib';
    import{verificarNivel} from "$lib/permisosutil/lib"
    //probar internet
    import { actualizacion,deboActualizar } from '$lib/stores/offline/actualizar';
    import { customoffliner } from '$lib/stores/offline/custom.svelte';
    import { intermitenter } from '$lib/stores/offline/intermitencia.svelte';
    import { velocidader } from '$lib/stores/offline/velocidad.svelte';
    ///ofline
    import Barrainternet from '$lib/components/internet/Barrainternet.svelte';
    import { getInternet,getOnlyInternet } from '$lib/stores/offline';
    import { ACTUALIZACION } from '$lib/stores/constantes';
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import {
        getAnimalesSQL,
        setAnimalesSQL,
        addNewAnimalSQL,
        updateLocalAnimalesSQLUser,
        updateLocalHistorialAnimalesSQLUser,
        getAnimalesCabSQL,
        getUltimoAnimalesSQL,
        setUltimoAnimalesSQL
    } from "$lib/stores/sqlite/dbanimales"

    import {
        getLotesSQL,
        getRodeosSQL,
        updateLocalRodeosSQL,
        getUpdateLocalRodeosLotesSQLUser,
        setUltimoRodeosLotesSQL,
        getLotesRodeosSQL,
        addNewPesajeSQL
    } from "$lib/stores/sqlite/dbeventos"
    import {generarIDAleatorio} from "$lib/stringutil/lib"
    import {getTotalAnimales} from "$lib/stores/totaldata"
    //Banco pero esta dificil ahora que traiga los animales actuales
    import {getTotalSQL,setTotalSQL,setUltimoTotalSQL} from "$lib/stores/sqlite/dbtotal"
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import ListaAnimales from '$lib/components/animales/ListaAnimales.svelte';
    import TablaAnimales from '$lib/components/animales/TablaAnimales.svelte';
    import NuevoAnimal from '$lib/components/animales/NuevoAnimal.svelte';
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from '$lib/stores/logs/coninternet.svelte';
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    //OFLINE
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({connected:false})
    let ultimo_animal = $state({})
    let comandos = $state([])
    let getlocal = $state(false)
    let getvelocidad = $state(0)
    let ruta = import.meta.env.VITE_RUTA
    //pre
    let pre = ""
    
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    let caber = createCaber()
    let userer = createUserer()
    let per = createPer()
    let cab = caber.cab
    let userpermisos = getPermisosList(per.per.permisos)
    let filtros = false


    //Datos para mostrar
    let animales = $state([])
    let animalescab = $state([])
    let animalesrows = $state([])
    let rodeos = $state([])
    let lotes = $state([])
    let activos = [{id:"todos",nombre:"Todos"},{id:"activos",nombre:"Solo activos"},{id:"inactivos",nombre:"Solo inactivos"}]
    let madres = $state([])
    let padres = $state([])
    let buscar = $state("")
    let rodeobuscar = $state("")
    let rodeoseleccion = $state([])
    let loteseleccion = $state([])
    let categoriaseleccion = $state([])
    let sexobuscar = $state("")
    let lotebuscar = $state("")
    let estadobuscar = $state("")
    let categoriabuscar = $state("")
    let activosbuscar = $state("activos")
    let totalAnimalesEncontrados = $state(0)
    

    //Datos animal
    let animal = $state(null)
    let idanimal = $state("")
    let caravana = $state("")
    let rp = $state("")
    let prenada = $state(0)
    let fechanacimiento = $state("")
    let nacimiento = $state("")
    let sexo = $state("H")
    let conparicion = $state(false)
    let peso = $state("")
    let rodeo = $state("")
    let lote = $state("")
    let categoria = $state("")
    //Datos paricion
    let madre = $state("")
    let padre = $state("")
    let nombremadre = $state("")
    let nombrepadre = $state("")
    let observacion = $state("")
    //Validaciones
    let malcaravana = $state(false)
    let malfechanacimiento = $state(false)
    let malpeso = $state(false)
    let botonhabilitado=$state(false)
    function cambiarFiltros(){
        filtros != filtros
    }
    function ordenarNombre(lista){
        if(lista.length==0){
            return []
        }
        lista.sort((r1,r2)=>r1.nombre.toLocaleLowerCase()>r2.nombre.toLocaleLowerCase()?1:-1)
    }
    function isEmpty(str){
        return (!str || str.length === 0 );
    }
    async function getRodeos(){
        const records = await pb.collection('rodeos').getFullList({
            filter:`active = true && cab = '${cab.id}'`,
            sort: 'nombre',
        });
        rodeos = records
        ordenarNombre(rodeos)
    }
    async function getLotes(){
        const records = await pb.collection('lotes').getFullList({
            filter:`active = true && cab = '${cab.id}'`,
            sort: 'nombre',
        });
        lotes = records
        ordenarNombre(lotes)
    }
    async function getAnimales(){
        //Estaria joya que el animal venga con todos los chiches
        
        const recordsa = await pb.collection("animales").getFullList({
            filter:`delete=false && cab='${cab.id}'`,
            expand:"nacimiento,lote,rodeo"
        })
        
        animales = recordsa
        animales.sort((a1,a2)=>a1.caravana>a2.caravana?1:-1)
        animalesrows = animales
        madres = animales.filter(a=>a.sexo=="H")
        padres = animales.filter(a=>a.sexo=="M")
        
        
    }
    
    function onChangeAnimales() { 
        animalescab = animales.filter(a=>a.cab == caboff.id && a.active)
        
        madres = animalescab.filter(a=>a.sexo == "H" && a.active)
        padres = animalescab.filter(a=>a.sexo == "M" && a.active)
        
    }
    function openNewModal(){
        if(true || userpermisos[5]){
            idanimal=""
            botonhabilitado = false
            caravana = ""
            conparicion = false
            peso = ""
            sexo = "H"
            fechanacimiento = ""
            nombremadre = ""
            nombrepadre = ""
            padre = ""
            madre = ""
            animal = null
            observacion = ""
            rp = ""
            nuevoModal.showModal()
        }
        else{
            Swal.fire("Sin permisos","No tienes permisos para administrar animales","error")
        }
        
    }
    function getDetail(id){
        
        idanimal = id
        animal = animales.filter(a=>a.id==idanimal)[0]
        caravana = animal.caravana
        fechanacimiento = animal.fechanacimiento.split(" ")[0]
        sexo = animal.sexo
        if (sexo == "H"){
            prenada = animal.prenada
        }
        conparicion = animal.nacimiento != ""
        peso = animal.peso
        botonhabilitado = true
        nacimiento = animal.nacimiento
        lote = animal.lote
        rodeo = animal.rodeo
        rp = animal.rp
        nuevoModal.showModal()
    }
    async function guardarOffline() {
        let idprov = "nuevo_animal_"+generarIDAleatorio() 
        let idnac = "nuevo_nac"+generarIDAleatorio() 
        let idpes = "nuevo_pesaje"+generarIDAleatorio()
        let recordparicion = {id:idnac}
        if (conparicion){
            let dataparicion = {
                madre,
                padre,
                fecha:fechanacimiento + " 03:00:00",
                nombremadre,
                nombrepadre,
                observacion,
                cab:caboff.id,
                id:idnac
            }
            let comandonac = {
                tipo:"add",
                coleccion:"nacimientos",
                data:{...dataparicion},
                hora:Date.now(),
                prioridad:2,
                idprov:idnac,
                camposprov:""
            }
            //Debo guardar el nacimiento, cuando guardo el id del nacimiento si quiero hacerle referencia
            await addNewNacimientoSQL(db,dataparicion)
            comandos.push(comandonac)
        }
        let esnuevolote = lote.split("_").length > 1
        let esnuevorodeo = rodeo.split("_").length > 1
        let esnuevonac = conparicion
        let camposprov = ""
        let vacio = true
        if(esnuevonac){
            vacio = false
            camposprov = "nacimientos"
        }
        if(esnuevolote){
            
            if(vacio){
                camposprov = "lote"
            }
            else{
                camposprov += ",lote"
            }
            vacio = false
        }
        if(esnuevorodeo){
            
            if(vacio){
                camposprov = "rodeo"
            }
            else{
                camposprov += ",rodeo"
            }
            
        }
        let data = {
            caravana,
            active:true,
            delete:false,
            prenada,
            fechanacimiento:fechanacimiento +" 03:00:00",
            sexo,
            peso,
            lote,
            rodeo,
            categoria,
            cab:cab.id,
            rp,
            id:idprov
        }
        if(conparicion){
            data.nacimiento = recordparicion.id
        }
        let comandoani = {
            tipo:"add",
            coleccion:"animales",
            data:{...data},
            hora:Date.now(),
            prioridad:3,
            idprov,    
            camposprov
        }
        comandos.push(comandoani)
        await setAnimalesSQL(db,animales);
        if(fechanacimiento){
            let datapesaje = {
                animal:idprov,
                fecha:fechanacimiento +" 03:00:00",
                pesoanterior:0,
                pesonuevo:peso,
                id:idpes
            }
            let comandope = {
                tipo:"add",
                coleccion:"pesajes",
                data:{...datapesaje},
                hora:Date.now(),
                prioridad:5,
                idprov,    
                camposprov:"animal"
            }
            comandos.push(comandope)
            await addNewPesajeSQL(db,datapesaje);
        }
        await setComandosSQL(db,comandos)
        animales.push(data)
        animales.sort((a1,a2)=>a1.caravana>a2.caravana?1:-1)
        madres = animales.filter(a=>a.sexo=="H")
        padres = animales.filter(a=>a.sexo=="M")
        filterUpdate()
        caravana = ""
        nacimiento = ""
        fechanacimiento = ""
        sexo = "H"
        Swal.fire("Éxito guardar","Se pudo guardar el animal con exito","success")
    }
    async function guardarOnline() {
        try{
            let recordparicion = null
            if(conparicion){
                let dataparicion = {
                    madre,
                    padre,
                    fecha:fechanacimiento + " 03:00:00",
                    nombremadre,
                    nombrepadre,
                    observacion,
                    
                    cab:caboff.id
                }
                recordparicion = await pb.collection('nacimientos').create(dataparicion);
                

            }
            let data = {
                caravana,
                active:true,
                delete:false,
                prenada,
                fechanacimiento:fechanacimiento +" 03:00:00",
                sexo,
                peso,
                lote,
                rodeo,
                categoria,
                cab:caboff.id,
                rp
            }
            if(conparicion){
                data.nacimiento = recordparicion.id
            }
            let recorda = await pb.collection('animales').create(data);
            if(conparicion){
                recorda.expand = {
                    nacimiento : recordparicion
                }
            }
            if(fechanacimiento){
                let datapesaje = {
                    animal:recorda.id,
                    fecha:fechanacimiento +" 03:00:00",
                    pesoanterior:0,
                    pesonuevo:peso
                }
                await pb.collection('pesaje').create(datapesaje)
            }
            

            
            animales.push(recorda)
            await setAnimalesSQL(db,animales)
            animales.sort((a1,a2)=>a1.caravana>a2.caravana?1:-1)
            madres = animales.filter(a=>a.sexo=="H")
            padres = animales.filter(a=>a.sexo=="M")
            filterUpdate()
            caravana = ""
            nacimiento = ""
            fechanacimiento = ""
            sexo = "H"
            Swal.fire("Éxito guardar","Se pudo guardar el animal con exito","success")

        }
        catch(e){
            console.error(e)
            Swal.fire("Error guardar","Hubo un error para guardar el animal","error")
        }
    }
    function getNombreLote(idlote){
        let ls = lotes.filter(l=>l.id==idlote)
        if(ls.length>0){
            return ls[0].nombre
        }
        else{
            return ""
        }
    }
    function getNombreRodeo(idrodeo){
        let rs = rodeos.filter(r=>r.id==idrodeo)
        if(rs.length>0){
            return rs[0].nombre
        }
        else{
            return ""
        }
    }
    //Si los lotes sigue sin guardarse
    async function guardar() {
        let isOnline = await getOnlyInternet()
        intermitenter.addIntermitente(isOnline)
        coninternet = await getInternet(modedebug,offliner.offline)
        //let totalanimals = await getTotalSQL(db)
        let verificar = true
        
        //if(useroff.nivel != -1 && totalanimals >= useroff.nivel){
        //    verificar =  false
        //}
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de ${useroff.nivel} animales`,"error")
            return {id:-1}
        }
        
        if(coninternet.connected){
            await guardarOnline()
            onChangeAnimales()
            filterUpdate()
        }
        else{
            await guardarOffline()
            onChangeAnimales()
            filterUpdate()
        }
    
    }
    function filterUpdate(){
        animalesrows = animalescab
        totalAnimalesEncontrados = animalesrows.length
        if(buscar != ""){
            animalesrows = animalesrows.filter(a=>a.caravana.toLocaleLowerCase().includes(buscar.toLocaleLowerCase()))
            totalAnimalesEncontrados = animalesrows.length
        }
        if(sexobuscar != ""){
            animalesrows = animalesrows.filter(a=>a.sexo == sexobuscar)
            totalAnimalesEncontrados = animalesrows.length
        }
        
        if(rodeoseleccion.length != 0){
            if(rodeoseleccion.length == 1 && rodeoseleccion[0] == "-1"){
                animalesrows = animalesrows.filter(a=>!a.rodeo)
                totalAnimalesEncontrados = animalesrows.length
            }
            else{
                animalesrows = animalesrows.filter(a=>rodeoseleccion.includes(a.rodeo))
                totalAnimalesEncontrados = animalesrows.length
            }
            
        }
        if(loteseleccion.length != 0){
            if(loteseleccion.length == 1 && loteseleccion[0] == "-1"){
                animalesrows = animalesrows.filter(a=>!a.lote)
                totalAnimalesEncontrados = animalesrows.length
            }
            else{
                animalesrows = animalesrows.filter(a=>loteseleccion.includes(a.lote))
                totalAnimalesEncontrados = animalesrows.length
            }
            
        }
        if(estadobuscar != ""){
            animalesrows = animalesrows.filter(a=>a.prenada == estadobuscar)
            totalAnimalesEncontrados = animalesrows.length
        }
        if(categoriaseleccion.length != 0){
            if(categoriaseleccion.length == 1 && categoriaseleccion[0] == "-1"){
                animalesrows = animalesrows.filter(a=>!a.categoria)
                totalAnimalesEncontrados = animalesrows.length
            }
            else{
                animalesrows = animalesrows.filter(a=>categoriaseleccion.includes(a.categoria))
                totalAnimalesEncontrados = animalesrows.length
            }
            
        }
        if(activosbuscar == "activos"){
            animalesrows = animalesrows.filter(a=>a.active == true)
            totalAnimalesEncontrados = animalesrows.length
        }
        if(activosbuscar == "inactivos"){
            animalesrows = animalesrows.filter(a=>a.active == false)
            totalAnimalesEncontrados = animalesrows.length
        }
    }
    function onSelectPadre(sex){
        if(sex=="H"){
            let m = madres.filter(a=>a.id == madre)[0]
            nombremadre = m.caravana
        }
        else{
            let p = padres.filter(a=>a.id == padre)[0]
            nombrepadre = p.caravana
            
        }

    }
    function oninput(inputName){
        validarBoton()
        if(inputName=="NOMBRE"){
            if(isEmpty(caravana)){
                malcaravana = true
            }
            else{
                malcaravana = false
            }
        }
    }
    function validarBoton(){
        botonhabilitado = true
        if(isEmpty(caravana)){
            botonhabilitado = false
        }
    }
    async function onMountOriginal(){
        let pb_json =  JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.record.id
        await getAnimales()
        await getRodeos()
        await getLotes()
        filterUpdate()
    }
    // y siquiero get y luego update
    async function updateLocalSQL() {

        await setUltimoAnimalesSQL(db)
        await updateLocalHistorialAnimalesSQLUser(db,pb,usuarioid)
        let resanimales = await updateLocalAnimalesSQLUser(db,pb,usuarioid)
        animales = resanimales
        animalescab = animales.filter(a=>a.cab == caboff.id)
        await setUltimoRodeosLotesSQL(db)
        let lotesrodeos = await getUpdateLocalRodeosLotesSQLUser(db,pb,usuarioid,caboff.id) 
        lotes = lotesrodeos.lotes
        rodeos = lotesrodeos.rodeos
        
        filterUpdate()
    }
    async function getLocalSQL() {
        getlocal = true
        let resanimales = await getAnimalesSQL(db)
        let lotesrodeos = await getLotesRodeosSQL(db,caboff.id)
        lotes = lotesrodeos.lotes
        rodeos = lotesrodeos.rodeos
        
        animales = resanimales.lista
        animalescab = animales.filter(a=>a.cab == caboff.id)
        
        filterUpdate()
    }
    async function initPage() {
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        
        intermitenter.addIntermitente(coninternet.connected)
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
    }
    async function oldGetUpdate() {
        if(lastinter.internet == 0){
            //Para que cuando vaya al inicio se actualice si o si
            await setInternetSQL(db,1,0)
            await updateLocalSQL()
        }
        else{
            let ahora = Date.now()
            let antes = ultimo_animal.ultimo
            const cincoMinEnMs = ACTUALIZACION;
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
        ultimo_animal = await getUltimoAnimalesSQL(db)
        let rescom = await getComandosSQL(db)
        comandos = rescom.lista
        let ahora = Date.now()
        let antes = ultimo_animal.ultimo
        if (coninternet.connected){
            
            try{
                await flushComandosSQL(db,pb)
                comandos = []
            }
            catch(err){
                if(modedebug){
                    loger.addTextError(JSON.stringify(err),null,2)
                    loger.addTextError("Error en flush comandos animales")
                }
            }
            let velocidad = await velocidader.medirVelocidadInternet()
            let confiabilidad = intermitenter.calculateIntermitente()
            let mustUpdate = await deboActualizar(
                velocidad,
                confiabilidad,
                coninternet,
                fromColab, //solo en el internet
                ahora,
                antes
            );
            if(modedebug){
                getactualizacion = await actualizacion(velocidad,confiabilidad,coninternet.connectionType)
            }
            
            if(mustUpdate){
               await updateLocalSQL(db) 
            }
            else{
                await getLocalSQL(db)
            }
            
        }
        else{
            await getLocalSQL()
            ///await setInternetSQL(db,0,Date.now())
        }
    }
    onMount(async()=>{
        await initPage()
        await getDataSQL()
    })
    function cerrarModal(){
        idanimal=""
        botonhabilitado = false
        caravana = ""
        conparicion = false
        peso = ""
        sexo = "H"
        fechanacimiento = ""
        nombremadre = ""
        nombrepadre = ""
        padre = ""
        madre = ""
        animal = null
        rp = ""
        observacion = ""
        lote = ""
        rodeo = ""
        nuevoModal.close()
        
    }
    function prepararData(item){
        return {
            CARAVANA:item.caravana,
            RP:item.pr,RP:item.pr,
            NACIMIENTO:item.fechanacimiento?new Date(item.fechanacimiento).toLocaleDateString():"",
            PADRE:item.expand?
                item.expand.nacimiento?
                    item.expand.nacimiento.nombrepadre:
                "":
                "",
            MADRE:item.expand?
                item.expand.nacimiento?
                item.expand.nacimiento.nombremadre:
                "":
                "",
            SEXO:item.sexo=="M"?"Macho":"Hembra",
            PESO:item.peso,
            RODEO:
                item.expand?
                item.expand.rodeo?
                item.expand.rodeo.nombre:
                "":
                "",
            LOTE:item.expand?
                item.expand.lote?
                item.expand.lote.nombre:
                "":
                "",
            CATEGORIA:capitalize(item.categoria),
            ESTADO:item.sexo=="M"?"-":getEstadoNombre(item.prenada),
            FALLECIMIENTO:item.fechafallecimiento?new Date(item.fechafallecimiento).toLocaleDateString():""

        }
    }
    //Para el collapse de los filtros
    let isOpenFilter = $state(false)
    function clickFilter(){
        isOpenFilter = !isOpenFilter
    }
    //Para el collapse de los ordenar
    let isOpenOrdenar = $state(false)
    function clickOrdenar(){
        isOpenOrdenar = !isOpenOrdenar
    }
    //Para los ordenar
    let ascendente = $state(true)
    let forma = $state("caravana")
    let selectforma = $state("caravana")
    //Ordenar animales
    function ordenarAnimalesDescendente(p_forma){
        let escalar = 1
        if(!ascendente){
            escalar = -1
        }
        forma = p_forma
        if(forma=="caravana"){
            
            animalesrows.sort((a1,a2)=>escalar * a1.caravana.localeCompare(a2.caravana))
        }
        else if(forma=="sexo"){
            
            animalesrows.sort((a1,a2)=>escalar * a1.sexo.localeCompare(a2.sexo))
        }
        else if(forma=="categoria"){
            animalesrows.sort((a1,a2)=>escalar * a1.categoria.localeCompare(a2.categoria))
        }
        else if(forma=="estado"){
            animalesrows.sort((a1,a2)=> a1.prenada > a2.prenada?escalar:-1*escalar)
        }
        else if(forma=="lote"){
            animalesrows.sort((a1,a2)=>{
                let l1 = a1.expand?a1.expand.lote?a1.expand.lote.nombre:"":""
                let l2 = a2.expand?a2.expand.lote?a2.expand.lote.nombre:"":""
                return escalar * l1.localeCompare(l2)
            })
        }
        else if(forma=="rodeo"){
            animalesrows.sort((a1,a2)=>{
                let r1 = a1.expand?a1.expand.rodeo?a1.expand.rodeo.nombre:"":""
                let r2 = a2.expand?a2.expand.rodeo?a2.expand.rodeo.nombre:"":""
                return escalar * r1.localeCompare(r2)
            })
        }
    }
    function ordenarAnimales(p_forma){
        if(p_forma == forma){
            ascendente = !ascendente
        }
        else{
            ascendente = false
        }
        let escalar = 1
        if(!ascendente){
            escalar = -1
        }
        forma = p_forma
        if(forma=="caravana"){
            
            animalesrows.sort((a1,a2)=>escalar * a1.caravana.localeCompare(a2.caravana))
        }
        else if(forma=="sexo"){
            
            animalesrows.sort((a1,a2)=>escalar * a1.sexo.localeCompare(a2.sexo))
        }
        else if(forma=="categoria"){
            animalesrows.sort((a1,a2)=>escalar * a1.categoria.localeCompare(a2.categoria))
        }
        else if(forma=="estado"){
            animalesrows.sort((a1,a2)=> a1.prenada > a2.prenada?escalar:-1*escalar)
        }
        else if(forma=="lote"){
            animalesrows.sort((a1,a2)=>{
                let l1 = a1.expand?a1.expand.lote?a1.expand.lote.nombre:"":""
                let l2 = a2.expand?a2.expand.lote?a2.expand.lote.nombre:"":""
                return escalar * l1.localeCompare(l2)
            })
        }
        else if(forma=="rodeo"){
            animalesrows.sort((a1,a2)=>{
                let r1 = a1.expand?a1.expand.rodeo?a1.expand.rodeo.nombre:"":""
                let r2 = a2.expand?a2.expand.rodeo?a2.expand.rodeo.nombre:"":""
                return escalar * r1.localeCompare(r2)
            })
        }
    }
</script>
{#if modedebug}
<Barrainternet bind:coninternet/>
{/if}
<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-2">
            <div class="label">
                animales - {animales.length}
            </div>
            <div class="label">
                animalescab - {animalescab.length}
            </div>
            <div class="label">
                animalesrows - {animalesrows.length}
            </div>
            <div class="label">
                madres - {madres.length}
            </div>
            <div class="label">
                padres - {padres.length}
            </div>
            <div class="label">
                lotes - {lotes.length}
            </div>
            <div class="label">
                rodeos - {rodeos.length}
            </div>
            <div class="label">
                Hora actual: {Date.now()}
            </div>
            <div class="label">
                <span>
                    last internet: {ultimo_animal.ultimo}
                </span>
            </div>
            <div class="label">
                Distancia: {Date.now() - ultimo_animal.ultimo}
            </div>
            <div class="label">
                Distancia min: {(Date.now() - ultimo_animal.ultimo) / 60000}
            </div>
            <div class="label">
                <span>
                    con internet: {coninternet.connected}
                </span>
            </div>
            <div class="label">
                <span>
                    get local: {getlocal}
                </span>
            </div>
            
        </div>
    {/if}
    <div class="grid grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div class="">
            <h1 class="text-2xl">Animales</h1>  
        </div>
        <div class="flex col-span-2 gap-1 justify-end">
            <div>
                <button class={` btn btn-primary rounded-lg ${estilos.btntext} px-2 mx-1`} data-theme="forest" onclick={()=>openNewModal()}>
                    <span  class="text-lg m-1 text-white">Nuevo</span>
                </button>
            </div>
            <div>
                <Exportar
                titulo = {"Animales"}
                filtros = {[]}
                confiltros = {false}
                data = {animalesrows}
                {prepararData}
            />
            </div>
            
        </div>
        
    </div>
    
    
    <div class="grid grid-cols-1 m-1 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10" >
        <div class="w-11/12 lg:w-1/2">
            <label 
                class={`
                    input 
                    input-bordered 
                    flex items-center 
                    gap-2
                    ${estilos.bgdark2}
                `}
            >
                <input type="text" 
                    class={`
                        grow
                    `} 
                    placeholder="Buscar..." 
                    bind:value={buscar} 
                    oninput={filterUpdate}
                />
            </label>
        </div>
    </div>
    <!--Filtros-->
    <div class="w-11/12 m-1 mb-2 lg:mx-10 rounded-lg bg-transparent">
        <button 
            aria-label="Filtrar" 
            class="w-full"
            onclick={clickFilter}
        >
            <div class="flex justify-between items-center px-1">
                <h1 class="font-semibold text-lg py-2">Filtros</h1>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class={`size-6 transition-all duration-300 ${isOpenFilter? 'transform rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            
        </button>
        <div>
            <span class = "text-lg my-1">Total de animales encontrados: {totalAnimalesEncontrados}</span>
        </div>
        {#if isOpenFilter}
                <div transition:slide>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-10 w-full" >
                        <div class="mt-0">
                            <MultiSelect
                            opciones={[{id:"-1",nombre:"Sin rodeo"}].concat(rodeos)}
                                bind:valores={rodeoseleccion}
                                etiqueta="Rodeos"
                                filterUpdate = {filterUpdate}
                            />
                        </div>
                        <div class="my-0 py-0">
                            <label for = "sexo" class="label mb-0">
                                <span class="label-text text-base">Sexo</span>
                            </label>
                            <label class="input-group ">
                                <select 
                                    class={`
                                        select select-bordered w-full
                                        rounded-md
                                        focus:outline-none focus:ring-2 
                                        focus:ring-green-500 
                                        focus:border-green-500
                                        
                                        ${estilos.bgdark2}
                                    `}
                                    bind:value={sexobuscar}
                                    onchange={filterUpdate}
                                >
                                        <option value="" class="rounded">Todos</option>
                                        {#each sexos as s}
                                            <option value={s.id} class="rounded">{s.nombre}</option>
                                        {/each}
                                  </select>
                            </label>
                        </div>
                        <div class="mt-0">
                            <MultiSelect
                                opciones={[{id:"-1",nombre:"Sin lote"}].concat(lotes)}
                                bind:valores={loteseleccion}
                                etiqueta="Lotes"
                                filterUpdate = {filterUpdate}
                            />
                        </div>
                        <div class="mt-1">
                            <MultiSelect
                                opciones={[{id:"-1",nombre:"Sin categoria"}].concat(categorias)}
                                bind:valores={categoriaseleccion}
                                etiqueta="Categorias"
                                margintop="mt-0"
                                filterUpdate = {filterUpdate}
                            />
                        </div>
                        <div>
                            <label for = "estado" class="label">
                                <span class="label-text text-base">Estado</span>
                            </label>
                            <label class="input-group ">
                                <select 
                                    class={`
                                        select select-bordered w-full
                                        rounded-md
                                        focus:outline-none focus:ring-2 
                                        focus:ring-green-500 
                                        focus:border-green-500
                                        ${estilos.bgdark2}
                                    `}
                                    bind:value={estadobuscar}
                                    onchange={filterUpdate}
                                >
                                        <option value="">Todos</option>
                                        {#each estados as s}
                                            <option value={s.id}>{s.nombre}</option>
                                        {/each}
                                  </select>
                            </label>
                        </div>
                        <div>
                            <label for = "activo" class="label">
                                <span class="label-text text-base">Activos</span>
                            </label>
                            <label class="input-group ">
                                <select 
                                    class={`
                                        select select-bordered w-full
                                        rounded-md
                                        focus:outline-none 
                                        focus:ring-2 
                                        focus:ring-green-500 focus:border-green-500
                                        ${estilos.bgdark2}
                                    `} 
                                    bind:value={activosbuscar}
                                    onchange={filterUpdate}
                                >
                                    {#each activos as a}
                                        <option value={a.id}>{a.nombre}</option>    
                                    {/each}
                                  </select>
                            </label>
                        </div>
                    </div>
                </div>
            {/if}
    </div>
    <!--Ordenar-->
    <div class="block  md:hidden w-11/12 m-1 mb-2 lg:mx-10 rounded-lg bg-transparent">
        <button 
            aria-label="Ordenar" 
            class="w-full"
            onclick={clickOrdenar}
        >
            <div class="flex justify-between items-center px-1">
                <h1 class="font-semibold text-lg py-2">Ordenar</h1>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class={`size-6 transition-all duration-300 ${isOpenOrdenar? 'transform rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            
        </button>
        {#if isOpenOrdenar}
            <div transition:slide>
                <div class="my-0 py-0">
                    <label class="input-group ">
                        <select 
                            class={`
                                select select-bordered w-full
                                rounded-md
                                focus:outline-none focus:ring-2 
                                focus:ring-green-500 
                                focus:border-green-500
                                
                                ${estilos.bgdark2}
                            `}
                            bind:value={selectforma}
                            onchange={()=>ordenarAnimales(selectforma)}
                            
                        >
                            <option value="caravana" class="rounded">Caravana</option>
                            <option value="sexo" class="rounded">Sexo</option>
                            <option value="categoria" class="rounded">Categoria</option>
                            <option value="lote" class="rounded">Lote</option>
                            <option value="rodeo" class="rounded">Rodeo</option>
                            <option value="estado" class="rounded">Estado</option>
                        </select>
                    </label>
                </div>
                <div class="my-1">
                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text">Ascendente</span>
                            <input type="checkbox" class="toggle" bind:checked={ascendente} onclick={()=>ordenarAnimales(selectforma)}/>
                        </label>
                      </div>
                </div>
            </div>
        {/if}
    </div>
    <div class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
        <TablaAnimales
            bind:animalesrows
            {shorterWord}
            {getEstadoColor}
            {getEstadoNombre}
            {getSexoNombre}
            {ordenarAnimales}
            {getNombreLote}
            {getNombreRodeo}
        >

        </TablaAnimales>
    </div>
    
    <div class="block  md:hidden justify-items-center mx-1">
        <ListaAnimales
            bind:animalesrows
            {shorterWord}
            {getEstadoColor}
            {getEstadoNombre}
            {getSexoNombre}
            {getNombreLote}
            {getNombreRodeo}
        ></ListaAnimales>
    </div>
    
    
</Navbarr>
<dialog id="nuevoModal" 
        class="
            modal modal-top mt-10 ml-5 
            lg:items-start 
            rounded-xl 
            lg:modal-middle
        ">
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
            {#if idanimal == ""}
                <h3 class="text-lg font-bold">Nuevo Animal</h3>  
            {:else}
                <h3 class="text-lg font-bold">Ver Animal</h3>  
            {/if}
            <div class="form-control">
                <NuevoAnimal
                    {lotes} {rodeos}
                    {oninput} {onSelectPadre}
                    bind:madres bind:padres bind:caravana
                    bind:malcaravana bind:rp bind:sexo
                    bind:peso bind:prenada bind:categoria
                    bind:rodeo bind:lote bind:fechanacimiento
                    bind:idanimal bind:conparicion bind:nombremadre
                    bind:madre bind:nombrepadre bind:padre
                    bind:observacion bind:nacimiento bind:animal
                >
                </NuevoAnimal>
            </div>
            
            <div class="modal-action justify-end ">
                <form method="dialog" >
                    <!-- if there is a button, it will close the modal -->
                     <button class="btn btn-error text-white" onclick={cerrarModal}>Cancelar</button>    
                    {#if idanimal==""}
                        <button class="btn btn-success text-white" disabled='{!botonhabilitado}' onclick={guardar} >Guardar</button>
                    {/if}
                    

                </form>
            </div>
        </div>
</dialog>
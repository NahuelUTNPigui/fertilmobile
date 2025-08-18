<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Exportar from '$lib/components/Exportar.svelte';
    import PocketBase from 'pocketbase'
    import { slide } from 'svelte/transition';
    import permisos from '$lib/stores/permisos';
    import sexos from '$lib/stores/sexos';
    import Swal from 'sweetalert2';
    import { onMount } from 'svelte';
    import { createCaber } from '$lib/stores/cab.svelte';
    import { createUserer } from '$lib/stores/user.svelte';
    import categorias from '$lib/stores/categorias';
    import estilos from '$lib/stores/estilos';
    import { goto } from "$app/navigation";
    import { shorterWord } from "$lib/stringutil/lib";  
    //Permisos
    import{getPermisosList,getPermisosMessage} from "$lib/permisosutil/lib"
    //Actualizacion
    import { actualizacion,deboActualizar } from '$lib/stores/offline/actualizar';
    import { customoffliner } from '$lib/stores/offline/custom.svelte';
    import { intermitenter } from '$lib/stores/offline/intermitencia.svelte';
    import { velocidader } from '$lib/stores/offline/velocidad.svelte';
    //Offline
    import Barrainternet from '$lib/components/internet/Barrainternet.svelte';
    import { getInternet,getOnlyInternet } from '$lib/stores/offline';
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline,updatePermisos} from "$lib/stores/capacitor/offlinecab"
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'

    import {
        getTratsSQL,
        setTratsSQL,
        setUltimoTratsSQL,
        addNewTrataSQL,
        updateLocalTratsSQLUser,
        getTiposTratSQL,
        setTiposTratSQL,
        addNewTipoTratSQL,
        setUltimoTiposTratSQL,
        updateLocalTiposTratSQLUser,        
        getUltimoTratsSQL

    } from '$lib/stores/sqlite/dbeventos';
    import {
        addNewAnimalSQL, 
        getAnimalesSQL,
        updateLocalAnimalesSQL ,
        getUpdateLocalAnimalesSQLUser,
        getAnimalesCabSQL,
        setUltimoAnimalesSQL,
        getUltimoAnimalesSQL


    } from '$lib/stores/sqlite/dbanimales';
    import {generarIDAleatorio} from "$lib/stringutil/lib"
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from '$lib/stores/logs/coninternet.svelte';
    import { ACTUALIZACION } from '$lib/stores/constantes';
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    //Offline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({connected:false})
    let getlocal = $state(false)
    let getvelocidad = $state(0)
    let getactualizacion = $state(0)
    let getpermisos = $state("")
    let cargado = $state(false)
    let ultimo_tratamientos = $state({})
    let comandos = $state([])


    let caber = createCaber()
    let cab = caber.cab
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);    
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    //Datos filtrar
    let animales = $state([])
    let tipotratamientos = $state([])
    let tipotratamientoscab = $state([])
    let tratamientos = $state([])
    let tratamientoscab = $state([])
    let tratamientosrow = $state([])
    let caravana = $state("")
    let malcaravana = $state(false)
    let sexo = $state("")
    let peso = $state(0)


    let buscar = $state("")
    let fechadesde = $state("")
    let fechahasta = $state("")
    let buscarcategoria = $state("")
    let buscartipo = $state("")
    let isOpenFilter = $state(false)

    //Datos tipo tratamiento
    let nombretipotratamiento = $state("")
    let idtipotratamiento = $state("")
    let addtipo = $state(false)
    //Datos tratamiento
    let idtratamiento = $state("")
    let animal = $state("")
    let categoria = $state("")
    let fecha = $state("")
    let tipo = $state("")
    let observacion = $state("")
    let totalTratamientosEncontrados = $state(0)
    //Para el edit
    let caravaedit = $state("")
    //Validaciones
    let malanimal = $state(false)
    let malcategoria = $state(false)
    let malfecha = $state(false)
    let maltipo = $state(false)
    let botonhabilitado=$state(false)
    let botonhabilitadoAnimal=$state(false)
    //Validaciones tipo
    let botontipo = $state(false)
    //Para el collapse de los filtros
    function clickFilter(){
            isOpenFilter = !isOpenFilter
    }
    function isEmpty(str){
        return (!str || str.length === 0 );
    }
    function validarBoton(){
        botonhabilitado = true
        if(isEmpty(animal)){
            botonhabilitado = false
        }
        if(isEmpty(categoria)){
            botonhabilitado = false
        }
        if(isEmpty(tipo)){
            botonhabilitado = false
        }
        if(isEmpty(fecha)){
            botonhabilitado = false
        }
    }

    function validarBotonAnimal(){
        botonhabilitadoAnimal = true
        if(isEmpty(caravana)){
            botonhabilitadoAnimal=false
        }
    }

    function validarBotonTipo(){
        botontipo = true
        if(isEmpty(nombretipotratamiento)){
            botontipo = false
        }
    }

    function cambioAnimal(){
        if(animal == "agregar"){
            openNewAnimal()
        } else {
            let a = animales.filter(an=>an.id==animal)[0]
            categoria = a.categoria
            

        }
    }

    function oninput(campo){
        validarBoton()
        validarBotonAnimal()
        if(campo=="ANIMAL"){
            
            if(isEmpty(animal)){
                malanimal = true
            }
            else{
                malanimal = false
                cambioAnimal()
            }
        }
        else if(campo == "FECHA"){
            if(isEmpty(fecha)){
                malfecha = true
            }
            else{
                malfecha = false
            }
        }
        else if(campo == "CATEGORIA"){
            if(isEmpty(categoria)){
                malcategoria = true
            }
            else{
                malcategoria = false
            }
        }
        else if(campo == "TIPO"){
            if(isEmpty(tipo)){
                maltipo = true
            }
            else{
                maltipo = false
            }
        }
        if (campo == "NOMBRE"){
            if(isEmpty(caravana)){
                malcaravana = true
            }
            else{
                malcaravana = false
            }
        }
    }
    
    async function getAnimales(){
        const recordsa = await pb.collection("animales").getFullList({
            filter:`active=true && cab='${cab.id}' && delete=false`
        })
        animales = recordsa
    }
    async function getTratamientos(){
        const records = await pb.collection('tratamientos').getFullList({
            filter : `cab='${cab.id}' && active = true`,
            expand:"animal,tipo",
            sort: '-created',
        });
        tratamientos = records
        tratamientosrow = records
    }       
    async function getTiposTratamientos(){
        const records = await pb.collection('tipotratamientos').getFullList({
            filter : `(cab='${cab.id}' || generico = true) && active = true`,
            sort: '-created',
        });
        tipotratamientos = records
        tipotratamientos.sort((tp1,tp2)=>tp1.nombre>tp2.nombre?1:-1)
    }
    function actualizarDatos(){
        onChangeTratamientos()
        filterUpdate()
    }
    function onChangeTipos(){
        tipotratamientos.sort((tt1,tt2)=>tt1.nombre.toLocaleLowerCase()<tt2.nombre.toLocaleLowerCase()?-1:1)
        tipotratamientoscab = tipotratamientos.filter(tp=>(tp.cab == caboff.id || tp.generico == true) && tp.active)
    }
    function onChangeTratamientos(){
        tratamientoscab = tratamientos.filter(t=>t.cab == cab.id && t.active == true)   
    }
    async function editarOffline() {
        try{
            let data = {
                //animal,
                categoria,
                tipo,
                observacion,
                fecha:fecha +" 03:00:00",
                id:idtratamiento
            }
            let tidx = tratamientos.findIndex(t=>t.id==idtratamiento)
            let tt_idx = tipotratamientos.findIndex(tipo=>tipo.id == tipo)
            if(tidx != -1){
                tratamientos[tidx].categoria = data.categoria
                tratamientos[tidx].tipo = data.tipo
                tratamientos[tidx].observacion = data.observacion
                tratamientos[tidx].fecha = data.fecha
                //Muy confuso pero basicamente si existe el tipo, fijarse si es nuevo, sino es falso tanto como viejo como inexistente
                let ntipo = tipo?tipo.split("_").length > 1:false
                
                let comando={
                    tipo:"update",
                    coleccion:"tratamientos",
                    data:{...data},
                    hora:Date.now(),
                    prioridad:2,
                    idprov:idtratamiento,
                    camposprov:ntipo?"tipo":""
                }
                comandos.push(comando)
                await setComandosSQL(db,comandos)

                if(tt_idx != -1){
                    tratamientos[t_idx].expand.tipo.id = tipo
                    tratamientos[t_idx].expand.tipo.nombre = tipotratamientos[tt_idx].nombre
                }
                await setTratsSQL(db,tratamientos)
                actualizarDatos()
                Swal.fire("Éxito editar","Se pudo editar el tratamiento con exito","success")
            }
            

            
        }
        catch(err){
            console.error(err)
            Swal.fire("Error editar","Hubo un error para editar el tratamiento","error")
        }
    }
    async function editarOnline() {
        caboff = await updatePermisos(pb,usuarioid)
        getpermisos = caboff.permisos
        let listapermisos = getPermisosList(caboff.permisos)
        if(!listapermisos[4]){
            Swal.fire("Error permisos",getPermisosMessage(4),"error")
            return 
        }
        try{
            let data = {
                //animal,
                categoria,
                tipo,
                observacion,
                fecha:fecha +" 03:00:00"
            }
            let t_idx = tratamientos.findIndex(t=>t.id==idtratamiento)  
            await pb.collection("tratamientos").update(idtratamiento,data)
            tratamientos[t_idx]={
                ...tratamientos[t_idx],
                ...data,
            }
            let tt_idx = tipotratamientos.findIndex(tipo=>tipo.id == tipo)
            if(tt_idx != -1){
                tratamientos[t_idx].expand.tipo.id = tipo
                tratamientos[t_idx].expand.tipo.nombre = tipotratamientos[tt_idx].nombre
            }
            await setTratsSQL(db,tratamientos)
            actualizarDatos()
            Swal.fire("Éxito editar","Se pudo editar el tratamiento con exito","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error editar","Hubo un error para editar el tratamiento","error")
        }
    }
    async function editar(){
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        let isOnline = await getOnlyInternet()
        intermitenter.addIntermitente(isOnline)
        if(coninternet.connected){
            await editarOnline()
        }   
        else{
            await editarOffline()
        }
    }
    function eliminarOffline(id) {
        Swal.fire({
            title: 'Eliminar tratamiento',
            text: '¿Seguro que deseas eliminar el tratamiento?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
        }).then(async result=>{
            if(result.value){
                
                let data = {active:false}
                try{
                    
                    tratamientos = tratamientos.filter(t=>t.id != id)
                    await setTratsSQL(db,tratamientos)
                    actualizarDatos()
                    let comando = {
                        tipo:"update",
                        coleccion:"tratamientos",
                        data:{...data},
                        hora:Date.now(),
                        prioridad:2,
                        idprov:id,
                        camposprov:""
                    }
                    comandos.push(comando)
                    await setComandosSQL(db,comandos)
                    
                    Swal.fire("Éxito eliminar","Se pudo eliminar el tratamiento con exito","success")
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error eliminar","Hubo un error para eliminar el tratamiento","error")
                }


            }
        })
    }
    function eliminarOnline(id) {
        Swal.fire({
            title: 'Eliminar tratamiento',
            text: '¿Seguro que deseas eliminar el tratamiento?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
        }).then(async result=>{
            if(result.value){
                
                let data = {active:false}
                try{
                    await pb.collection("tratamientos").update(id,data)
                    tratamientos = tratamientos.filter(t=>t.id != id)
                    await setTratsSQL(db,tratamientos)
                    actualizarDatos()
                    Swal.fire("Éxito eliminar","Se pudo eliminar el tratamiento con exito","success")
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error eliminar","Hubo un error para eliminar el tratamiento","error")
                }


            }
        })
    }
    async function eliminar(id){
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        let isOnline = await getOnlyInternet()
        intermitenter.addIntermitente(isOnline)
        if(coninternet.connected){
            caboff = await updatePermisos(pb,usuarioid)
            getpermisos = caboff.permisos
            let listapermisos = getPermisosList(caboff.permisos)
            if(!listapermisos[4]){
                Swal.fire("Error permisos",getPermisosMessage(4),"error")
                return 
            }
            eliminarOnline(id)
        }
        else{
            eliminarOffline(id)
        }
    }
    function openTiposModal(){
        tiposmodal.showModal()
    }
    function openEditTipoModal(id){
        idtipotratamiento = id
        let tipotratamiento = tipotratamientos.filter(tp => tp.id == id)[0]
        nombretipotratamiento = tipotratamiento.nombre
        addtipo = true

    }
    function cerrarTipoModal(){
        idtipotratamiento = ""
        nombretipotratamiento = ""
        addtipo = false
    }
    function nuevoTipo(){
        idtipotratamiento = ""
        nombretipotratamiento = ""
        addtipo = true
    }
    async function guardarTipoOnline() {
        caboff = await updatePermisos(pb,usuarioid)
        getpermisos = caboff.permisos
        let listapermisos = getPermisosList(caboff.permisos)
        if(!listapermisos[4]){
            Swal.fire("Error permisos",getPermisosMessage(4),"error")
            return 
        }
        if(idtipotratamiento == ""){
            try{
                let data = {
                    nombre:nombretipotratamiento,
                    active : true,
                    cab:caboff.id

                }
                const  record = await pb.collection("tipotratamientos").create(data)
                
                tipotratamientos.push(record)
                tipotratamientos.sort((tp1,tp2)=>tp1.nombre>tp2.nombre?1:-1)
                onChangeTipos()
                await setTiposTratSQL(db,tipotratamientos)
                
                cerrarTipoModal()
            }
            catch(err){
                console.error(err)
                
            }
        }
        else{
            await editarTipoOnline()
        }
    }
    async function guardarTipoOffline() {
        let idprov = "nuevo_tipo_"+generarIDAleatorio()
        if(idtipotratamiento == ""){
            let data = {
                nombre:nombretipotratamiento,
                active : true,
                cab:caboff.id
            }
            data.id = idprov
            tipotratamientos.push(data)
            onChangeTipos()
            let comando = {
                tipo:"add",
                coleccion:"tipotratamientos",
                data:{...data},
                hora:Date.now(),
                prioridad:1,
                idprov,
                camposprov:""
            }
            comandos.push(comando)
            await setComandosSQL(db,comandos)
            await setTiposTratSQL(db,tipotratamientos)
            cerrarTipoModal()
        }
        else{
            let data = {
                nombre:nombretipotratamiento,

            }
            let comando = {
                tipo:"update",
                coleccion:"tipotratamientos",
                data:{...data},
                hora:Date.now(),
                prioridad:1,
                idprov:idtipotratamiento,
                camposprov:""
            }
            comandos.push(comando)
            await setComandosSQL(db,comandos)
            
            let tt_idx = tipotratamientos.findIndex(tp=>tp.id==idtipotratamiento)   
            tipotratamientos[tt_idx] = {
                ...tipotratamientos[tt_idx],
                ...data
            }
            
            tipotratamientos.sort((tp1,tp2)=>tp1.nombre>tp2.nombre?1:-11)
            onChangeTipos()
            await setTiposTratSQL(db,tipotratamientos)
            cerrarTipoModal()
        }
    }
    async function guardarTipo(){
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        let isOnline = await getOnlyInternet()
        intermitenter.addIntermitente(isOnline)
        if(coninternet.connected){
            caboff = await updatePermisos(pb,usuarioid)
            getpermisos = caboff.permisos
            let listapermisos = getPermisosList(caboff.permisos)
            if(!listapermisos[4]){
                Swal.fire("Error permisos",getPermisosMessage(4),"error")
                return 
            }
            await guardarTipoOnline()
        }
        else{
            await guardarTipoOffline()
        }
    }

    async function editarTipoOnline(){
        caboff = await updatePermisos(pb,usuarioid)
        getpermisos = caboff.permisos
        let listapermisos = getPermisosList(caboff.permisos)
        if(!listapermisos[4]){
            Swal.fire("Error permisos",getPermisosMessage(4),"error")
            return 
        }
        try{
            let data = {
                nombre:nombretipotratamiento,
            }
            await pb.collection("tipotratamientos").update(idtipotratamiento,data)
            
            let tt_idx = tipotratamientos.findIndex(tp=>tp.id==idtipotratamiento)   
            tipotratamientos[tt_idx] = {
                ...tipotratamientos[tt_idx],
                ...data
            }
            
            tipotratamientos.sort((tp1,tp2)=>tp1.nombre>tp2.nombre?1:-11)
            onChangeTipos()
            await setTiposTratSQL(db,tipotratamientos)            
            cerrarTipoModal()
        }
        catch(err){
            console.error(err)
            
        }
    }

    async function eliminarTipoOnline(id) {
        idtipotratamiento = id
        try{
            let data = {
                active:false
            }
            await pb.collection("tipotratamientos").update(idtipotratamiento,data)
            tipotratamientos = tipotratamientos.filter(tp => tp.id != idtipotratamiento)
            onChangeTipos()
            await setTiposTratSQL(db,tipotratamientos)
        }
        catch(err){
            console.error(err)
        }
    }
    async function eliminarTipoOffline(id) {
        idtipotratamiento = id
        
        tipotratamientos = tipotratamientos.filter(tp => tp.id != idtipotratamiento)
        tipotratamientos.sort((tp1,tp2)=>tp1.nombre>tp2.nombre?1:-11)
        onChangeTipos()
        
        let comando = {
            tipo:"update",
            coleccion:"tipotratamientos",
            data:{active:false},
            hora:Date.now(),
            prioridad:1,
            idprov:idtipotratamiento,
            camposprov:""
        }
        comandos.push(comando)
        await setComandosSQL(db,comandos)
        await setTiposTratSQL(db,tipotratamientos)
    }
    async function eliminarTipo(id){
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        let isOnline = await getOnlyInternet()
        intermitenter.addIntermitente(isOnline)
        if(coninternet.connected){
            caboff = await updatePermisos(pb,usuarioid)
            getpermisos = caboff.permisos
            let listapermisos = getPermisosList(caboff.permisos)
            if(!listapermisos[4]){
                Swal.fire("Error permisos",getPermisosMessage(4),"error")
                return 
            }
            await eliminarTipoOnline(id)
        }
        else{
            await eliminarTipoOffline(id)
        }
        
    }
    function cerrarModal(){
        idtratamiento = ""
        fecha = ""
        animal = ""
        tipo = ""
        categoria = ""
        
    }
    
    function openNewModal(){
        idtratamiento = ""
        fecha = ""
        animal = ""
        tipo = ""
        categoria = ""
        nuevoModal.showModal()
    }

    function openNewAnimal(){
        if(permisos[4]){
            caravana = ""
            sexo = ""
            peso = 0
            botonhabilitadoAnimal = false
            nuevoModal.showModal()
        } else{
            Swal.fire("Sin permisos","No tienes permisos para crear eventos","error")
        }
    }

    function openEditModal(id){
        idtratamiento = id

        let tratamiento = tratamientos.filter(t=>t.id==id)[0]
        
        fecha = tratamiento.fecha.split(" ")[0]
        animal = tratamiento.animal
        caravaedit = tratamiento.expand.animal.caravana

        tipo = tratamiento.tipo
        categoria = tratamiento.expand.animal.categoria
        observacion = tratamiento.observacion
        
        nuevoModal.showModal()

    }
    function filterUpdate(){
        tratamientosrow = tratamientoscab
        totalTratamientosEncontrados = tratamientosrow.length
        if(buscar != ""){
            tratamientosrow = tratamientosrow.filter(t=>t.expand.animal.caravana.toLocaleLowerCase().includes(buscar.toLocaleLowerCase()))
            totalTratamientosEncontrados = tratamientosrow.length
        }
        if(fechadesde != ""){
            tratamientosrow = tratamientosrow.filter(t=>t.fecha>=fechadesde)
            totalTratamientosEncontrados = tratamientosrow.length
        }
        if(fechahasta != ""){
            tratamientosrow = tratamientosrow.filter(t=>t.fecha<=fechahasta)
            totalTratamientosEncontrados = tratamientosrow.length
        }
        if(buscarcategoria != ""){
            tratamientosrow = tratamientosrow.filter(t=>t.categoria == buscarcategoria)
            totalTratamientosEncontrados = tratamientosrow.length
        }
        if(buscartipo != ""){
            tratamientosrow = tratamientosrow.filter(t=>t.tipo==buscartipo)
            totalTratamientosEncontrados = tratamientosrow.length
        }
        tratamientosrow.sort((a,b)=>new Date(b.fecha) - new Date(a.fecha))
    }
    async function onmountoriginal(params) {
        await getTratamientos()
        await getTiposTratamientos()
        await getAnimales()
        filterUpdate()
    }
    //Esto se podria poner en otro archivo
    //PUede ser hasta un store
    //ENcima pocket base taambien guardar la info del usuario
    async function initPage() {
        coninternet = await getInternet(modedebug,offliner.offline,customoffliner.customoffline)
        let isOnline = await getOnlyInternet()
        intermitenter.addIntermitente(isOnline)
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
    }
    //Este metodo deberia tomar los datos de la nube y pisar lo que tengo sqlite
    // Se supone que los comandos ya fueron flush

    async function updateLocalSQL() {
        await setUltimoTratsSQL(db)
        await setUltimoAnimalesSQL(db   )
        tratamientos = await updateLocalTratsSQLUser(db,pb,usuarioid)
        onChangeTratamientos()
        animales = await getUpdateLocalAnimalesSQLUser(db,pb,usuarioid,caboff.id)
        tipotratamientos = await updateLocalTiposTratSQLUser(db,pb,usuarioid)
        onChangeTratamientos()
        onChangeTipos()
        filterUpdate()
        caboff = await updatePermisos(pb,usuarioid)
        getpermisos = caboff.permisos
        
        cargado = true
    }
    async function getLocalSQL() {
        let restratamientos = await getTratsSQL(db)
        tratamientos = restratamientos.lista
        
        animales = await getAnimalesCabSQL(db,caboff.id)
        
        let restipos = await getTiposTratSQL(db)
        tipotratamientos = restipos.lista
        onChangeTratamientos()
        onChangeTipos()
        filterUpdate()
        cargado = true

    }
    async function updateComandos() {
        try{
            await flushComandosSQL(db,pb)
            comandos = []
        }
        catch(err){
            if(modedebug){
                loger.addTextError(JSON.stringify(err),null,2)
                loger.addTextError("Error en flush comandos tratamientos")
            }
        }
    }
    async function oldUpdate() {
        if(lastinter.internet == 0){
            await setInternetSQL(db,1,0)
            await updateLocalSQL()
        }
        else{
            
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
        let rescom = await getComandosSQL(db)
        ultimo_tratamientos = await getUltimoTratsSQL(db)
        comandos = rescom.lista
        let ahora = Date.now()
        let antes = ultimo_tratamientos.ultimo
        if (coninternet.connected){
            await updateComandos()
            let velocidad = await velocidader.medirVelocidadInternet()
            if(modedebug){
                getvelocidad = velocidad
            }
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
                await updateLocalSQL() 
            }
            else{
                await getLocalSQL()
            }
            
        }
        else{
            await getLocalSQL()
        }
    }
    onMount(async()=>{
        await initPage()
        await getDataSQL()   
    })
    //Tengo que buscar otra manera todavia no funciona
    function prepararData(item){
        return {
            CARAVANA:item.expand.animal.caravana,
            TRATAMIENTO:item.expand.tipo.nombre,
            FECHA:new Date(item.fecha).toLocaleDateString(),
            CATEGORIA:item.categoria
            
        }
    }
    function setArbitrarioInternet(conectado){
        coninternet.connected  = conectado
    }
</script>
{#if modedebug}
<Barrainternet bind:coninternet/>
{/if}
<Navbarr>
    {#if modedebug}
        <button onclick={updateLocalSQL} class="btn">Forzar update</button>
        <button onclick={()=>setArbitrarioInternet(coninternet.connected?false:true)} class="btn hidden">Cambiar conexion {coninternet.connected?"COn internet":"sin internet"}</button>
        <div class="grid grid-cols-3">
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
    
    <div class="grid grid-cols-3 lg:grid-cols-4 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Tratamientos</h1>
        </div>
        <div class="flex col-span-3 gap-1 justify-start lg:justify-end">
            <div>
                <button class={`btn btn-primary rounded-lg ${estilos.btntext}`} data-theme="forest" onclick={()=>goto("/tratamientos/movimiento")}>
                    <span  class="text-xl">Nuevo</span>
                </button>
            </div>
            <div>
                <button class={`btn btn-primary rounded-lg ${estilos.btntext}`} data-theme="forest" onclick={()=>openTiposModal()}>
                    <span  class="text-xl">Tipos</span>
                </button>
            </div>
            <div class="hidden">
                <Exportar
                    titulo ={"Tratamientos"}
                    filtros = {[]}
                    confiltros = {false}
                    data = {tratamientosrow}
                    {prepararData}
                />
            </div>
        </div>
        
    </div>
    <div class="grid grid-cols-1 m-1 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10 w-11/12" >
        <div class="w-full lg:w-1/2">
            <label 
                class={`
                    input 
                    input-bordered 
                    flex 
                    items-center gap-2
                    ${estilos.bgdark2}
                `}
            >
                <input type="text" class="grow" placeholder="Buscar..." bind:value={buscar} oninput={filterUpdate} />
            </label>
        </div>
    </div>
    <div class="w-11/12 m-1 mb-2 lg:mx-10 rounded-lg bg-transparent">
        <button 
            aria-label="Filtrar" 
            class="w-full"
            onclick={clickFilter}
        >
            <div class="flex justify-between items-center px-2">
                <h1 class="font-bold text-lg py-2">Filtros</h1>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class={`h-5 w-5 transition-all duration-300 ${isOpenFilter? 'transform rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </button>
        <div>
            <span class = "text-lg mx-1">Total de tratamientos encontrados: {totalTratamientosEncontrados}</span>
        </div>
        {#if isOpenFilter}
            <div transition:slide>
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-1" >
                    <div class="">
                        <label class="block tracking-wide  mb-2" for="grid-first-name">
                          Fecha desde
                        </label>
                        <input id ="fechadesde" type="date"  
                            class={`
                            w-full md:w-1/2
                                input input-bordered
                                ${estilos.bgdark2}
                            `} 
                            bind:value={fechadesde} onchange={filterUpdate}
                        />
                    </div>
                    <div class="">
                        <label class="block tracking-wide  mb-2" for="grid-first-name">
                          Fecha Hasta
                        </label>
                        <input id ="fechadesde" type="date"  
                            class={`
                            w-full md:w-1/2
                                input input-bordered
                                ${estilos.bgdark2}
                            `} 
                            bind:value={fechahasta} onchange={filterUpdate}
                        />
                    </div>
                    <div>
                        <label for = "categoria" class="tracking-wide label">
                            <span class="label-text text-base">Categoria</span>
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
                                bind:value={buscarcategoria}
                                onchange={filterUpdate}
                            >
                                    <option value="">Todos</option>
                                    {#each categorias as s}
                                        <option value={s.id}>{s.nombre}</option>
                                    {/each}
                              </select>
                        </label>
                    </div>
                    <div>
                        <label for = "tipo" class="tracking-wide label">
                            <span class="label-text text-base">Tipo</span>
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
                                bind:value={buscartipo}
                                onchange={filterUpdate}
                            >
                                    <option value="">Todos</option>
                                    {#each tipotratamientos as t}
                                        <option value={t.id}>{t.nombre}</option>
                                    {/each}
                              </select>
                        </label>
                    </div>
                </div>
            </div>
        {/if}
    </div>
    {#if cargado}
    <div>
    <div class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
        <table class="table table-lg w-full" >
            <thead>
                <tr>
                    <th class="text-base ml-3 pl-3 mr-1 pr-1 border-b dark:border-gray-600">Fecha</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Animal</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Categoria</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Tipo</th>
                    <!--<th class="text-base mx-1 px-1">Acciones</th>-->
                </tr>
            </thead>
            <tbody>
                {#each tratamientosrow as t}
                    <tr onclick={()=>openEditModal(t.id)} class=" hover:bg-gray-200 dark:hover:bg-gray-900">
                        <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10 ">{new Date(t.fecha).toLocaleDateString()}</td>
                        <td class="text-base mx-1 px-1 ">
                            {`${t.expand.animal.caravana}`}
                        </td>
                        <td class="text-base mx-1 px-1 ">
                            {`${t.expand.animal.categoria}`}
                        </td>
                        <td class="text-base mx-1 px-1 ">
                            {`${t.expand.tipo.nombre}`}
                        </td>
                       
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="block w-full md:hidden justify-items-center mx-1">
        {#each tratamientosrow as t}
        <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
            <button onclick={()=>openEditModal(t.id)}>
                <div class="block p-4">
                    <div class="grid grid-cols-2 gap-y-2">
                        <div class="flex items-start">
                            <span >Fecha:</span> 
                            <span class="mx-1 font-semibold">
                                {new Date(t.fecha).toLocaleDateString()}
                            </span>
                            
                        </div>
                        <div class="flex items-start">
                            <span >Caravana:</span> 
                            <span class="mx-1 font-semibold">
                                {`${shorterWord(t.expand.animal.caravana)}`}
                            </span>
                            
                        </div>
                        <div class="flex items-start">
                            <span >Tipo:</span> 
                            <span class="mx-1 font-semibold">
                                {`${t.expand.tipo.nombre}`}
                            </span>
                        </div>
                        <div class="col-span-2 flex items-start">
                            <span >{`${t.observacion}`}</span> 
                            
                        </div>
                    </div>
                </div>
            </button>
        </div>
        {/each}
    </div>
    </div>
    {:else}
        <div class="flex items-center justify-center">
            <span class="loading loading-spinner text-success"></span>
        </div>
    {/if}
    
    
</Navbarr>
<dialog id="nuevoModal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div class="
            modal-box w-11/12 max-w-3xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Ver tratamiento</h3>  
        <div class="form-control">
            
            <label for = "madre" class="label">
                <span class="label-text text-base">Animal</span>
            </label>
            {#if idtratamiento == ""}
                <label class="input-group ">
                    <select 
                        class={`
                            select select-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500

                            ${estilos.bgdark2} 
                            ${malanimal?"input-error":""}
                        `}
                        onchange={()=>oninput("ANIMAL")}
                        bind:value={animal}
                    >
                        <option value="agregar">Agregar</option>
                        {#each animales as a}
                            <option value={a.id}>{a.caravana}</option>    
                        {/each}
                    </select>
                    <div class={`label ${malanimal?"":"hidden"}`}>
                        <span class="label-text-alt text-red-400">Debe seleccionar el animal</span>
                    </div>
                </label>
            {:else}
                <label for = "madre" class="label">
                    <span class="label-text text-base">{caravaedit}</span>
                </label>
            {/if}
            {#if animal == "agregar"}
                <form method="dialog">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
                </form>
                <label for = "nombre" class="label">
                    <span class="label-text text-base">Caravana</span>
                </label>
                <label class="input-group">
                    <input 
                        id ="nombre" 
                        type="text"  
                        class={`
                            input 
                            input-bordered 
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                            w-full
                            ${estilos.bgdark2} 
                            ${malcaravana?"input-error":""}
                        `}
                        bind:value={caravana}
                        oninput={()=>oninput("NOMBRE")}
                    />
                    <div class={`label ${malcaravana?"":"hidden"}`}>
                        <span class="label-text-alt text-red-400">Error debe escribir la caravana del animal</span>
                    </div>
                </label>
                <label for = "sexo" class="label">
                    <span class="label-text text-base">Sexo</span>
                </label>
                <label class="input-group ">
                    <select 
                        class={`
                            select select-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `} bind:value={sexo}>
                        {#each sexos as s}
                            <option value={s.id}>{s.nombre}</option>    
                        {/each}
                      </select>
                </label>
                <label for = "peso" class="label">
                    <span class="label-text text-base">Peso (KG)</span>
                </label>
                <label class="input-group">
                    <input id ="peso" type="number"  
                        class={`
                            input input-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `}
                        bind:value={peso}
                    />
                </label>
            {/if}
            <label for = "fecha" class="label">
                <span class="label-text text-base">Fecha</span>
            </label>
            <label class="input-group ">
                <input id ="fecha" type="date" max={HOY}  
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={fecha}
                    onchange={()=>oninput("FECHA")}
                />
                <div class={`label ${malfecha?"":"hidden"}`}>
                    <span class="label-text-alt text-red-400">Debe seleccionar la fecha</span>
                </div>
            </label>
            <label for = "categoria" class="label">
                <span class="label-text text-base">Categoria</span>
            </label>
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={categoria} read
                    onchange={()=>oninput("CATEGORIA")}
                >
                    {#each categorias as c}
                        <option value={c.id}>{c.nombre}</option>    
                    {/each}
                </select>
                <div class={`label ${malcategoria?"":"hidden"}`}>
                    <span class="label-text-alt text-red-400">Debe seleccionar la categoria</span>
                </div>
            </label>
            
            <label for = "tipo" class="label">
                <span class="label-text text-base">Tipo tratamiento</span>
            </label>
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={tipo}
                    onchange={()=>oninput("TIPO")}
                >
                    {#each tipotratamientoscab as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                </select>
                <div class={`label ${maltipo?"":"hidden"}`}>
                    <span class="label-text-alt text-red-400">Debe seleccionar un tipo</span>
                </div>
            </label>
            <label class="form-control">
                <div class="label">
                    <span class="label-text">Observacion</span>                    
                </div>
                <input 
                    id ="observacion" 
                    type="text"  
                    class={`
                        input 
                        input-bordered 
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        w-full
                        ${estilos.bgdark2}
                    `}
                    bind:value={observacion}
                />
            </label>

        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
              <!-- if there is a button, it will close the modal -->
            
            
            
                <button class="btn btn-success text-white" onclick={editar} >Editar</button>
                <button class="btn btn-error text-white" onclick={async ()=>await eliminar(idtratamiento)}>Eliminar</button>
            
              <button class="btn btn-neutral " onclick={cerrarModal}>Cerrar</button>
              
            </form>
        </div>
    </div>

</dialog>
<dialog id="tiposmodal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div class="
            modal-box max-w-xl w-11/12
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-xl font-bold">Tipo tratamientos</h3>  
        <div class="grid grid-cols-1 m-0 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10" >
            <div class="w-11/12">
                <button class={`w-full btn flex btn-primary ${estilos.btntext}`} data-theme="forest" onclick={()=>nuevoTipo()}>
                    <span  class="text-xl">Nuevo tipo</span>
                </button>
                    {#if addtipo}
                        <div class="grid grid-cols-3 gap-1">
                            <div class="col-span-2">
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
                                        bind:value={nombretipotratamiento}
                                        oninput={validarBotonTipo}
                                    />
                                </label>
                            </div>
                            
                            <div class="flex flex-row gap-1 mt-10">
                                
                                <button
                                    aria-label="guardar"
                                    class={`
                                        ${estilos.basico} ${estilos.chico} ${estilos.primario}
                                    `}
                                    onclick={guardarTipo}
                                    disabled='{!botontipo}'
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy" viewBox="0 0 16 16">
                                        <path d="M11 2H9v3h2z"/>
                                        <path d="M1.5 0h11.586a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13A1.5 1.5 0 0 1 1.5 0M1 1.5v13a.5.5 0 0 0 .5.5H2v-4.5A1.5 1.5 0 0 1 3.5 9h9a1.5 1.5 0 0 1 1.5 1.5V15h.5a.5.5 0 0 0 .5-.5V2.914a.5.5 0 0 0-.146-.353l-1.415-1.415A.5.5 0 0 0 13.086 1H13v4.5A1.5 1.5 0 0 1 11.5 7h-7A1.5 1.5 0 0 1 3 5.5V1H1.5a.5.5 0 0 0-.5.5m3 4a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V1H4zM3 15h10v-4.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5z"/>
                                    </svg>
                                </button>
                                <button 
                                    aria-label="cerrar"
                                    class={`
                                        ${estilos.basico} ${estilos.chico} ${estilos.danger}
                                    `}
                                    onclick={cerrarTipoModal}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    {/if}
                
                    <table class="table table-lg w-full" >
                        <thead>
                            <tr>
                                <th class="text-base"  >Nombre</th>
                                <th class="text-base"  >Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each tipotratamientoscab as tp}
                                <tr>
                                    <td class="text-base">
                                        {tp.nombre}
                                    </td>
                                    <td class={`flex gap-2 ${tp.generico?"hidden":""}`}>
                                        <div class="tooltip" data-tip="Editar">
                                            <button aria-label="Editar" onclick={()=>openEditTipoModal(tp.id)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                                    <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div class="tooltip" data-tip="Eliminar">
                                            <button aria-label="Eliminar" onclick={()=>eliminarTipo(tp.id)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>                              
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            {/each}            
                        </tbody>
                    </table>
                
            </div>
        </div>  
        
        <div class="modal-action justify-start ">
            <button class="btn btn-error text-white" onclick={()=>tiposmodal.close()}>Cerrar</button>
        </div>
    </div>

</dialog>
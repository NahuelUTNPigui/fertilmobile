<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Swal from 'sweetalert2'
    import PocketBase from 'pocketbase'
    import { createRoler } from '$lib/stores/defaultrol.svelte';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { createCaber } from "$lib/stores/cab.svelte";
    import CardBase from '$lib/components/CardBase.svelte';
    import categorias from '$lib/stores/categorias';
    import sexos from '$lib/stores/sexos';
    import tipostacto from '$lib/stores/tipostacto';
    import tiposanimal from '$lib/stores/tiposanimal';
    import {guardarHistorial} from "$lib/historial/lib"
    import RadioButton from '$lib/components/RadioButton.svelte';
    import {isEmpty} from "$lib/stringutil/lib"
    import PredictSelect from '$lib/components/PredictSelect.svelte';
    import estilos from '$lib/stores/estilos';
    import estados from "$lib/stores/estados";
    import StatCard from "$lib/components/StatCard.svelte";
    import AgregarAnimal from '$lib/components/eventos/AgregarAnimal.svelte';
    import cuentas from '$lib/stores/cuentas';
    import MultipleToros from '$lib/components/MultipleToros.svelte';
    import{verificarNivel} from "$lib/permisosutil/lib"
    import {addDays} from "$lib/stringutil/lib"
    import Estable from "$lib/svgs/estable.svelte"
    import Tacto from '$lib/svgs/tacto.svelte';
    import Nacimiento from '$lib/svgs/nacimiento.svelte';
    import Servicio from '$lib/svgs/servicio.svelte';
    import Tratamiento from '$lib/svgs/tratamiento.svelte';
    import Observacion from '$lib/svgs/observacion.svelte';
    //Formularios
    import InicioNacimiento from "$lib/components/inicio/Nacimiento.svelte"
    import InicioTacto from "$lib/components/inicio/Tacto.svelte"
    import InicioTratamiento from "$lib/components/inicio/Tratamiento.svelte"
    import InicioServicio from "$lib/components/inicio/Servicio.svelte"
    import InicioObservacion from "$lib/components/inicio/Observacion.svelte"
    //Offline
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    
    import {getCabData,getCabDataByID} from "$lib/stores/cabsdata"
    import {
        addNewTactoSQL,
        getEventosSQL, 
        setEventosSQL, 
        setUltimoEventosSQL,
        addNewNacimientoSQL,
        addNewTrataSQL,
        addNewObservacionSQL,
        addnewInseminacionSQL,
        addNewServicioSQL,
        updateLocalEventosSQLUser
    } from '$lib/stores/sqlite/dbeventos';
    import { 
        setAnimalesSQL,
        getAnimalesSQL, 
        setUltimoAnimalesSQL,
        setHistorialAnimalesSQL,
        updateLocalAnimalesSQLUser,
        updateLocalHistorialAnimalesSQLUser 
    } from '$lib/stores/sqlite/dbanimales';
    //import {updateLocalEstablecimientoSQL} from '$lib/stores/sqlite/dbestablecimiento';
    import {updateLocalEstablecimientosSQL} from '$lib/stores/sqlite/dballestablecimientos';
    import {updateLocalColabSQL} from '$lib/stores/sqlite/dbcolaboradores'; 
    import {generarIDAleatorio} from "$lib/stringutil/lib"
    import {getTotalAnimales} from "$lib/stores/totaldata"
    import {getTotalSQL,setTotalSQL,setUltimoTotalSQL} from "$lib/stores/sqlite/dbtotal"
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';

    let ruta = import.meta.env.VITE_RUTA
    let pre = ""
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    //offline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({})
    let comandos = $state([])
    /*
    let cab = $state({
        exist:false,
        nombre:"",
        id:""
    })
    */
    let totaleventos = $state({
        animales:0,
        tactos:0,
        nacimientos:0,
        rodeos:0,
        lotes:0,
        tratamientos:0,
        inseminaciones:0,
        observaciones:0,
        pesajes:0,
        servicios:0
    })
    let cargados = $state(false)
    let caber = createCaber()
    let animales = $state([])
    let animalescab = $state([])
    let listaanimales = $state([])
    let madres = $state([])
    let padres = $state([])
    let listamadres = $state([])
    let listapadres = $state([])
    
    let tipotratamientos = $state([])
    let cargadoanimales = $state(false)
    //Datos cabaña
    let classbutton = "w-full flex items-center justify-center space-x-4 bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
    //Tacto
    let tacto = $state({})
    let prenadatacto = $state(0)
    //Nacimiento    
    let nacimiento = $state({})
    //Tratamiento
    let tratamiento  = $state({})
    //Servicio
    let servicio = $state({})
    let inseminacion = $state({})
    let esServicio = $state(true)
    //Observacion
    let observacion =  $state({})
    //Nuevo animal
    let agregaranimal = $state(false)
    let caravana = $state("")
    let peso = $state("")
    let sexo = $state("")
    let fechanacimiento = $state("")
    let categoria = $state("")
    
    function initNacimiento(){
        nacimiento = {
            //Nacimiento    
            caravananac : "",
            sexonac : "",
            pesonac : "",
            fechanac : "",
            observacionnac : "",
            //Madre
            etiquetamadre : "Madre",
            madrenac : "",
            nombremadrenac : "",
            
            //Padre
            padrenac : "",
            nombrepadrenac : "",
            //Validacion
            malmadrenac : false,
            malpadrenac : false,
            malfechanac : false,
            malcaravananac : false,
            malsexonac : false,
            botonhabilitadonac : false
        }
    }
    function initTacto(){
        tacto = {
            fechatacto : "",
            observaciontacto : "",
            animaltacto : "",
            cadenatacto : "",
            //Tipo animal
            categoriatacto:"",
            prenadatacto:0,
            //tipo tacto
            tipotacto : "",
            //Validaciones
            malfechatacto: "",
            malanimaltacto: "",
            botonhabilitadotacto:false
        }
        prenadatacto = 0
    }
    function initTratamiento(){
        tratamiento = {
            animaltrat : "",
            cadenatrat : "",
            categoriatrat : "",
            fechatrat : "",
            tipotrat : "",
            observaciontrat:"",
            //Validaciones
            malanimaltrat :false,
            malcategoriatrat :false,
            malfechatrat :false,
            maltipotrat :false,
            botonhabilitadotrat:false
        }
    }
    function initObservacion(){
        observacion = {
            animalobs :"",
            cadenaobs :"",
            categoriaobs :"",
            fechaobs :"",
            observacionobs :"",
            //Validaciones
            malanimalobs :false,
            malfechaobs :false,
            botonhabilitadoobs :false
        }
    }
    function initServicio(){
        servicio = {
            idanimalser : "",
            categoriaser : "",
            padreser : "",
            padreserlista : [],
            fechapartoser : "",
            fechadesdeserv : "",
            fechahastaserv : "",
            madreser : "",
            observacionser : "",
            //validacion
            malanimalser : false,
            malfechadesdeser : false,
            malpadreser : false,
            botonhabilitadoser : false
        };
        inseminacion = {
            padreins :"",
            pajuelains :"",
            idanimalins :"",
            cadenains :"",
            categoriains :"",
            fechainseminacion :"",
            fechapartoins :"",
            observacion:"",
            //Validaciones
            malanimalins :false,
            malpadreins :false,
            malfechainseminacion :false,
            malfechapartoins :false,
            botonhabilitadoins :false
        };
    }
    
    async function getTiposTratamientos(){
        const records = await pb.collection('tipotratamientos').getFullList({
            filter : `(cab='${cab.id}' || generico = true) && active = true`,
            sort: '-created',
        });
        tipotratamientos = records
        tipotratamientos.sort((tp1,tp2)=>tp1.nombre>tp2.nombre?1:-1)
    }
    function openNewModalTacto(){ 
        agregaranimal = false
        caravana = ""
        sexo = ""
        peso = ""
        fechanacimiento = ""
        initTacto()
        nuevoModalTacto.showModal()
    }
    function openNewModalNacimiento(){
        agregaranimal = false
        caravana = ""
        sexo = ""
        peso = ""
        fechanacimiento = ""
        initNacimiento()
        nuevoModalNacimiento.showModal()

    }
    function  openNewModalTratamiento(){
        agregaranimal = false
        caravana = ""
        sexo = ""
        peso = ""
        fechanacimiento = ""
        initTratamiento()
        nuevoModalTratamiento.showModal()
    }
    function openNewModalServicio(){
        agregaranimal = false
        caravana = ""
        sexo = ""
        peso = ""
        fechanacimiento = ""
        initServicio()
        nuevoModalServicio.showModal()
    }
    function openNewModalObservacion(){
        agregaranimal = false
        caravana = ""
        sexo = ""
        peso = ""
        fechanacimiento = ""
        initObservacion()
        nuevoModalObservacion.showModal()
    }
    //Debo agregar la verificacion de cantidad de animales de cabaña
    //Debo crearle el pesaje cuando le guardo el animl
    async function guardarAnimal(esTacto,esInseminacion) {
        //Los nombres de la funciones horribles
        let totalanimals = await getTotalSQL(db)
        let verificar = true
        
        if(useroff.nivel != -1 && totalanimals >= useroff.nivel){
            verificar =  false
        }
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de ${useroff.nivel} animales`,"error")
            return {id:-1}
        }

        let data = {
            caravana,
            active:true,
            categoria,
            delete:false,
            sexo,
            peso,
            cab:caboff.id
        }
        if(fechanacimiento){
            data.fechanacimiento=fechanacimiento +" 03:00:00"
        }
        //Verificar si las fechas coinciden
        //if(esTacto){
        //    data.prenada = prenadatacto
        //}
        //if(esInseminacion){
        //    data.prenada = 3
        //}
        let idprov = "nuevo_animal_"+generarIDAleatorio() 
        let isOnline = await Network.getStatus();
        if(coninternet.connected){
            let recorda = await pb.collection('animales').create(data); 
            return recorda   
        }
        else{
            data.id = idprov
            let comando = {
                tipo:"add",
                coleccion:"animales",
                data:{...data},
                hora:Date.now(),
                prioridad:3,
                idprov,
                //No tiene poque no lotes y rodeos
                camposprov:""
            }
            
            comandos.push(comando)
            await setComandosSQL(db,comandos)
            
            return data
        }
        

    }
    async function guardarTacto(){
        let idprov = "nuevo_tacto_"+generarIDAleatorio()
        if(agregaranimal){
            if(caravana == ""){
                Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
                return
            }
            
            let a = await guardarAnimal(true,false)
            if(a.id == -1){
                return
            }
            animales.push(a)
            totaleventos.animales += 1
            onChangeAnimales()
            await setAnimalesSQL(db,animales)
            let data = {
                fecha:fechatacto +" 03:00:00" ,
                observacion:observaciontacto,
                animal:a.id,
                categoria:categoriatacto,
                prenada:prenadatacto,
                tipo:tipotacto,
                nombreveterinario:"",
                cab:caboff.id,
                active:true
            }
            if(coninternet.connected){
                try{
                    //que pasa si el animal no existe
                    const record = await pb.collection('tactos').create(data);
                    //await loadAnimales()
                    await addNewTactoSQL(db,record)
                    Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error guardar","No se pudo guardar el tacto","error")
                }
            }
            else{
                data.id = idprov
                let comando = {
                    tipo:"add",
                    coleccion:"tactos",
                    data:{...data},
                    hora:Date.now(),
                    prioridad:5,
                    idprov,    
                    camposprov:"animal"
                }
                comandos.push(comando)
                await setComandosSQL(db,comandos)
                await addNewTactoSQL(db,data)
                
                Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
            }
        }
        else{
            let data = {
                fecha:fechatacto +" 03:00:00" ,
                observacion:observaciontacto,
                animal:animaltacto,
                categoria:categoriatacto,
                prenada:prenadatacto,
                tipo:tipotacto,
                nombreveterinario:"",
                cab:caboff.id,
                active:true
            }
            if(coninternet.connected){
                const record = await pb.collection('tactos').create(data);
                await pb.collection('animales').update(animaltacto,{
                    prenada:prenadatacto
                })
                //verificacion de las fechas
                await guardarHistorial(pb,animaltacto)
                totaleventos.tactos += 1
                Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
            }
            else{
                try{
                    let nuevoanimal = animaltacto.split("_")[0]=="nuevo"
                    data.id = idprov
                    let comando = {
                        tipo:"add",
                        coleccion:"tactos",
                        data:{...data},
                        hora:Date.now(),
                        prioridad:5,
                        idprov,
                        camposprov:nuevoanimal?"animal":""
                    }
                    comandos.push(comando)
                    if(!nuevoanimal){
                        //Esto hace falta probar con las fechas
                        let comandohisto = {
                            tipo:"historial",
                            data:{id:animaltacto},
                            hora:Date.now(),
                            prioridad:5,
                        }
                        comandos.push(comandohisto)
                    }
                    
                    
                    await setComandosSQL(db,comandos)
                    await addNewTactoSQL(db,data)
                    totaleventos.tactos += 1
                    Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error guardar","No se pudo guardar el tacto","error")
                }
                


            }
        }
    }
    async function guardarNacimiento() {
        let idprov = "nuevo_nac_"+generarIDAleatorio() 
        //Los nombres de la funciones horribles
        //debo verificar si voy a guardar el animal
        let totalanimals = await getTotalSQL(db)
        let verificar = true
        
        if(useroff.nivel != -1 && totalanimals >= useroff.nivel){
            verificar =  false
        }
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de ${useroff.nivel} animales`,"error")
            return {id:-1}
        }
        //que pasa si la madre y el padre son nuevos
        let dataparicion = {
            madre:madrenac,
            padre:padrenac,
            fecha:fechanac + " 03:00:00",
            nombremadre:nombremadrenac,
            nombrepadre:nombrepadrenac,
            observacion:observacionnac,
            cab:caboff.id
        }
        if(coninternet.connected){
            //debo agregar el lote y rodeo de la madre
            const recordparicion = await pb.collection('nacimientos').create(dataparicion);
            if(agregaranimal){
                let data = {
                    caravana:caravananac,
                    active:true,
                    delete:false,
                    fechanacimiento:fechanac +" 03:00:00",
                    sexo:sexonac,
                    cab:caboff.id,
                    peso:pesonac,
                    nacimiento:recordparicion.id
                }
                let recorda = await pb.collection('animales').create(data); 
                totaleventos.animales += 1
                animales.push(recorda)
            }
            
            
            
            
            totaleventos.nacimientos += 1
            Swal.fire("Éxito guardar","Se pudo guardar la paricion con exito","success")
            nuevoModalNacimiento.close()
        }
        else{
            let  dataanimal = {}
            if(agregaranimal){
                let idanimal = "nuevo_animal_"+generarIDAleatorio() 
                dataparicion.id= idprov
                dataanimal = {
                    caravana:caravananac,
                    active:true,
                    delete:false,
                    fechanacimiento:fechanac +" 03:00:00",
                    sexo:sexonac,
                    cab:caboff.id,
                    peso:pesonac,
                    nacimiento:idprov
                }
                animales.push(dataanimal)
                onChangeAnimales()
                //Debo guardar el animal
                await setAnimalesSQL(animales)
                
                totaleventos.animales += 1
            }
            
            totaleventos.nacimientos += 1
            //Debo guardar el nacimiento
            await addNewNacimientoSQL(db,dataparicion)
            
            
            let esnuevopadre = padrenac.split("_").length>0
            let esnuevomadre = madrenac.split("_").length>0
            //Comandos
            let comandonac = {
                tipo:"add",
                coleccion:"nacimientos",
                data:{...dataparicion},
                hora:Date.now(),
                prioridad:2,
                idprov,    
                camposprov:""
            }
            comandos.push(comandonac)
            if(agregaranimal){
                let comandoani = {
                    tipo:"add",
                    coleccion:"animales",
                    data:{...dataanimal},
                    hora:Date.now(),
                    prioridad:3,
                    idprov,    
                    camposprov:"nacimiento"
                }
                comandos.push(comandoani)
            }
            
            await setComandosSQL(db,comandos)
        }
    }
    async function guardarTrat() {
        let idprov = "nuevo_trat_"+generarIDAleatorio() 
        if(agregaranimal){
            if(caravana == ""){
                Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
                return
            }
            
            let a = await guardarAnimal(true,false)
            if(a.id == -1){
                return
            }
            await updateAnimales(a)
           
            let data = {
                animal:a.id,
                categoria:a.categoria,
                tipo:tipotrat,
                fecha:fechatrat +" 03:00:00",
                active : true,
                cab:cab.id
            }
            //si tengo internet lo hgao derecho
            if(coninternet.connected){
                const  record = await pb.collection("tratamientos").create(data)
                Swal.fire("Éxito guardar","Se pudo guardar el tratamiento con exito","success")
                totaleventos.tratamientos += 1
            }
            //Sino tengo que crear un comando
            else{
                data.id = idprov
                let comando = {
                    tipo:"add",
                    coleccion:"tratamiento",
                    data:{...data},
                    hora:Date.now(),
                    prioridad:5,
                    idprov,    
                    camposprov:"animal"
                }
                comandos.push(comando)
                await setComandosSQL(db,comandos)
                await addNewTrataSQL(db,data)
                totaleventos.tratamientos += 1
                Swal.fire("Éxito guardar","Se pudo guardar el tratamiento","success")
            }
            
        }
        //Animal existente
        else{
            let data = {
                animal:animaltrat,
                categoria:categoriatrat,
                tipo:tipotrat,
                fecha:fechatrat +" 03:00:00",
                active : true,
                cab:caboff.id
            }
            if(coninternet.connected){
                try{
                    const  record = await pb.collection("tratamientos").create(data)
                    totaleventos.tratamientos += 1
                    Swal.fire("Éxito guardar","Se pudo guardar el tratamiento con exito","success")
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error guardar","No se pudo guardar el tratamiento con exito","error")

                }

            }
            else{
                try{
                    let nuevoanimal = animaltrat.split("_")[0]=="nuevo"
                    data.id = idprov
                    let comando = {
                        tipo:"add",
                        coleccion:"tratamientos",
                        data:{...data},
                        hora:Date.now(),
                        prioridad:5,
                        idprov,
                        camposprov:nuevoanimal?"animal":""
                    }
                    comandos.push(comando)
                    await setComandosSQL(db,comandos)
                    //Add new trata
                    await addNewTrataSQL(db,data)
                    totaleventos.tratamientos += 1
                    Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error guardar","No se pudo guardar el tratamiento con exito","error")
                }
                
            }
            
        }
    }
    async function updateAnimales(a) {
        animales.push(a)
        onChangeAnimales()
        totaleventos.animales += 1
        
        await setAnimalesSQL(db,animales)
    }
    async function guardarInseminacion() {
        let idprov = "nuevo_ins_"+generarIDAleatorio()
        if(agregaranimal){
            if(caravana == ""){
                Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
                return
            }
            let a = await guardarAnimal(true,false)
            if(a.id == -1){
                return
            }
            await updateAnimales(a)
            
            let data = {
                cab:caboff.id,
                animal: a.id,
                fechaparto: fechapartoins +' 03:00:00',
                fechainseminacion: fechainseminacion + ' 03:00:00',
                active:true,
                padre:padreins,//Si es nuevo padre
                pajuela:pajuelains,
                categoria:a.categoria,
            }
            if(coninternet.connected){
                try{
                    const record = await pb.collection('inseminacion').create(data);
                    Swal.fire("Éxito guardar","Se pudo guardar la inseminación con exito","success")
                    totaleventos.inseminaciones += 1
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error guardar","Hubo un error para guardar la inseminación","error")
                }
            }
            else{
                try{
                    
                    data.id = idprov
                    let comando = {
                        tipo:"add",
                        coleccion:"inseminaciones",
                        data:{...data},
                        hora:Date.now(),
                        prioridad:5,
                        idprov,
                        camposprov:"animal"
                    }
                    comandos.push(comando)
                    await setComandosSQL(db,comandos)
                    await addnewInseminacionSQL(db,data)
                    Swal.fire("Éxito guardar","Se pudo guardar la inseminación con exito","success")
                    totaleventos.inseminaciones += 1
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error guardar","Hubo un error para guardar la inseminación","error")
                }
            }

            
        }
        else{
            let data = {
                cab:cab.id,
                animal: idanimalins,
                fechaparto: fechapartoins +' 03:00:00',
                fechainseminacion: fechainseminacion + ' 03:00:00',
                active:true,
                padre:padreins,
                pajuela:pajuelains,
                categoria:categoriains,
            }
            if(coninternet.connected){
                const record = await pb.collection('inseminacion').create(data);
                //await pb.collection('animales').update(idanimalins,{
                //    prenada:3
                //})

                //await guardarHistorial(pb,idanimalins)
                totaleventos.inseminaciones += 1
                Swal.fire("Éxito guardar","Se pudo guardar la inseminación con exito","success")
            }
            else{
                let nuevoanimal = idanimalins.split("_")[0]=="nuevo"
                data.id = idprov
                let comando = {
                    tipo:"add",
                    coleccion:"tratamiento",
                    data:{...data},
                    hora:Date.now(),
                    prioridad:5,
                    idprov,    
                    camposprov:"animal"
                }
                comandos.push(comando)
                await setComandosSQL(db,comandos)
                await addnewInseminacionSQL(db,data)
                Swal.fire("Éxito guardar","Se pudo guardar la inseminación con exito","success")
                totaleventos.inseminaciones += 1
            }

        }
    }
    async function guardarServicio(){
        let idprov = "nuevo_serv_"+generarIDAleatorio() 
        if(agregaranimal){
            if(caravana == ""){
                Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
                return
            }
            let a = await guardarAnimal(false,true)
            if(a.id == -1){
                    return
            }
            await updateAnimales(db,a)
            
            let dataser = {
                fechadesde : fechadesdeserv + " 03:00:00",
                fechaparto: fechapartoser + " 03:00:00",
                observacion: observacionser,
                madre:a.id,
                padres:padreserlista.join(),
                active:true,
                cab:caboff.id,
            }
            if(fechahastaserv != ""){
                dataser.fechahasta = fechahastaserv + " 03:00:00"
            }
            if(coninternet.connected){
                await pb.collection("servicios").create(dataser)
                totaleventos.servicios += 1
                Swal.fire("Éxito guardar","Se pudo guardar el servicio con éxito","success")
            }
            else{
                dataser.id = idprov
                let comando = {
                    tipo:"add",
                    coleccion:"servicios",
                    data:{...dataser},
                    hora:Date.now(),
                    prioridad:5,
                    idprov,
                    camposprov:"animal"
                }
                comandos.push(comando)
                await setComandosSQL(db,comandos)
                await addNewServicioSQL(db,data)
                Swal.fire("Éxito guardar","Se pudo guardar el servicio con exito","success")
                totaleventos.servicios += 1
            }
        }
        //Animal seleccionado
        else{
            let dataser = {
                fechadesde : fechadesdeserv + " 03:00:00",
                fechaparto: fechapartoser + " 03:00:00",
                observacion: observacionser,
                madre:idanimalser,
                padres:padreserlista.join(),
                active:true,
                cab:caboff.id,
            }
            if(fechahastaserv != ""){
                dataser.fechahasta = fechahastaserv + " 03:00:00"
            }
            if(coninternet.connected){
                await pb.collection("servicios").create(dataser)
                Swal.fire("Éxito guardar","Se pudo guardar el servicio con éxito","success")
                totaleventos.servicios += 1
            }
            else{
                let nuevoanimal = idanimalser.split("_")[0]=="nuevo"
                dataser.id = idprov
                let comando = {
                    tipo:"add",
                    coleccion:"servicios",
                    data:{...dataser},
                    hora:Date.now(),
                    prioridad:5,
                    idprov,
                    camposprov:nuevoanimal?"animal":""
                }
                comandos.push(comando)
                await setComandosSQL(db,comandos)
                await addNewServicioSQL(db,data)
                Swal.fire("Éxito guardar","Se pudo guardar el servicio con éxito","success")
                totaleventos.servicios += 1
            }
        }
    }
    async function guardarObservacion() {
        let idprov = "nuevo_obs_"+generarIDAleatorio() 
        if(agregaranimal){
            if(caravana == ""){
                Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
                return
            }
            let a = await guardarAnimal(false,true)
            if(a.id == -1){
                    return
            }
            await updateAnimales(db,a)
            
            let data = {
                animal:a.id,
                categoria:a.categoria,
                fecha:fechaobs +" 03:00:00",
                cab:caboff.id,
                observacion:observacionobs,
                active:true
            }
            if(coninternet.connected){
                const record = await pb.collection('observaciones').create(data);
                Swal.fire("Éxito guardar","Se pudo guardar la observación","success")
                totaleventos.observaciones += 1
            }
            else{
                data.id = idprov
                let comando = {
                    tipo:"add",
                    coleccion:"observaciones",
                    data:{...data},
                    hora:Date.now(),
                    prioridad:5,
                    idprov,
                    camposprov:"animal"
                }
                
                comandos.push(comando)
                await setComandosSQL(db,comandos)
                await addNewObservacionSQL(db,data)
                Swal.fire("Éxito guardar","Se pudo guardar la observación con exito","success")
                totaleventos.observaciones += 1
            }
        }
        //Animal seleccionado
        else{
            let data = {
                animal:animalobs,
                fecha:fechaobs +" 03:00:00",
                categoria:categoriaobs,
                cab:caboff.id,
                observacion:observacionobs,
                active:true
            }
            if(coninternet.connected){
                
                const record = await pb.collection('observaciones').create(data);
                Swal.fire("Éxito guardar","Se pudo guardar la observación","success")
                totaleventos.observaciones += 1
            }
            else{
                let nuevoanimal = animalobs.split("_")[0]=="nuevo"
                data.id = idprov
                let comando = {
                    tipo:"add",
                    coleccion:"observaciones",
                    data:{...data},
                    hora:Date.now(),
                    prioridad:5,
                    idprov,
                    camposprov:nuevoanimal?"animal":""
                }
                comandos.push(comando)
                await setComandosSQL(db,comandos)
                await addNewObservacionSQL(db,data)
                Swal.fire("Éxito guardar","Se pudo guardar la observación con éxito","success")
                totaleventos.observaciones += 1
            }
        }
    }
    async function getTotales() {
        let recordtactos = await pb.collection('tactos').getList(1,1,{
            filter:`active=True && cab='${cab.id}'`
        })
        let recordnacimientos = await pb.collection('nacimientos').getList(1,1,{
            filter:`cab='${cab.id}'`
        })
        let recordtratamientos = await pb.collection('tratamientos').getList(1,1,{
            filter:`active=True && cab='${cab.id}'`
        })
        let recordinseminaciones = await pb.collection('inseminacion').getList(1,1,{
            filter:`active=True && cab='${cab.id}'`
        })
        let recordobservaciones = await pb.collection('observaciones').getList(1,1,{
            filter:`active=True && cab='${cab.id}'`
        })
        let recordpesajes = await pb.collection('pesaje').getList(1,1,{
            expand:"animal",
            filter:`animal.cab='${cab.id}'`
        })
        let recordservicios = await pb.collection('servicios').getList(1,1,{
            filter:`cab='${cab.id}'`
        })
        const recordslotes = await pb.collection('lotes').getList(1,1,{
            filter:`active=True && cab='${cab.id}'`,
        });
        
        const recordsrodeos = await pb.collection('rodeos').getList(1,1,{
            filter:`active=True && cab='${cab.id}'`,
            
        });
        totaleventos.tactos = recordtactos.totalItems
        totaleventos.inseminaciones = recordinseminaciones.totalItems
        totaleventos.nacimientos = recordnacimientos.totalItems
        totaleventos.tratamientos = recordtratamientos.totalItems
        totaleventos.observaciones = recordobservaciones.totalItems
        totaleventos.pesajes = recordpesajes.totalItems
        totaleventos.servicios = recordservicios.totalItems
        totaleventos.lotes = recordslotes.totalItems
        totaleventos.rodeos = recordsrodeos.totalItems
    }
    function setArbitrarioInternet(conectado){
        coninternet.connected  = conectado
    }
    async function reinicarDB() {
        await resetTables(db)
        await setDefaultCabOffline()
        await setDefaultUserOffline()

    }
    async function originalMount(){
        cab = caber.cab
        let pb_json = JSON.parse(localStorage.getItem('pocketbase_auth'))
        
        usuarioid = pb_json.record.id
        if(cab.exist){
            await getAnimales()
            await getTiposTratamientos()
            await getTotales()
            cargados = true
        }
    }
    async function updateLocalSQL(db) {
        //Debo traer los datos de la cabaña
        await updateLocalEstablecimientosSQL(db,pb,usuarioid,caboff.id)
        let datauser = await updateLocalEventosSQLUser(db,pb,usuarioid)
    
        let animalesuser = await updateLocalAnimalesSQLUser(db,pb,usuarioid)  
        onChangeAnimales()
        await updateLocalHistorialAnimalesSQLUser(db,pb,usuarioid)
        
        //await updateLocalColabSQL(db,pb,caboff.id)
        
        let datatotal = await getTotalAnimales(pb)
        animales = animalesuser
        totaleventos.tactos = datauser.tactos.filter(t=>t.cab == caboff.id).length
        totaleventos.inseminaciones = datauser.inseminaciones.filter(t=>t.cab == caboff.id).length
        totaleventos.nacimientos = datauser.nacimientos.filter(t=>t.cab == caboff.id).length
        totaleventos.tratamientos = datauser.trats.filter(t=>t.cab == caboff.id).length
        totaleventos.observaciones = datauser.observaciones.filter(t=>t.cab == caboff.id).length
        totaleventos.pesajes = datauser.pesajes.filter(t=>t.expand.animal.cab == caboff.id).length
        totaleventos.servicios = datauser.servicios.filter(t=>t.cab == caboff.id).length
        totaleventos.lotes = datauser.lotes.filter(t=>t.cab == caboff.id).length
        totaleventos.rodeos = datauser.rodeos.filter(t=>t.cab == caboff.id).length
        totaleventos.animales = animales.filter(a=>a.cab == caboff.id &&  a.active).length
        await setUltimoAnimalesSQL(db)
        await setUltimoEventosSQL(db)
        await setTotalSQL(db,datatotal)
        await setUltimoTotalSQL(db)
    }
    async function getDataSQL(db) {
        let data = await getEventosSQL(db)
        let dataanimales = await getAnimalesSQL(db)
        animales = dataanimales.lista 
        onChangeAnimales()
        //En este caso si va la lista porque es data que viene de SQL
        totaleventos.tactos = data.tactos.lista.filter(t=>t.cab == caboff.id).length
        totaleventos.inseminaciones = data.inseminaciones.lista.filter(t=>t.cab == caboff.id).length
        totaleventos.nacimientos = data.nacimientos.lista.filter(t=>t.cab == caboff.id).length
        totaleventos.tratamientos = data.trats.lista.filter(t=>t.cab == caboff.id).length
        totaleventos.observaciones = data.observaciones.lista.filter(t=>t.cab == caboff.id).length
        totaleventos.pesajes = data.pesajes.lista.filter(t=>t.expand.animal.cab == caboff.id).length
        totaleventos.servicios = data.servicios.lista.filter(t=>t.cab == caboff.id).length
        totaleventos.lotes = data.lotes.lista.filter(t=>t.cab == caboff.id).length
        totaleventos.rodeos = data.rodeos.lista.filter(t=>t.cab == caboff.id).length
        totaleventos.animales = animales.filter(a=>a.cab == caboff.id &&  a.active).length
    }
    function onChangeAnimales() { 
        animalescab = animales.filter(a=>a.cab == caboff.id && a.active)
        listaanimales = animalescab.map(a=>{return {id:a.id,caravana:a.caravana}})
        madres = animalescab.filter(a=>a.sexo == "H" && a.active)
        padres = animalescab.filter(a=>a.sexo == "F" && a.active)
        listamadres = madres.map(a=>{return {id:a.id,caravana:a.caravana}})
        listapadres = padres.map(a=>{return {id:a.id,caravana:a.caravana}})
    }
    async function initPage() {
        //coninternet = {connected:false} // await Network.getStatus();
        coninternet = await Network.getStatus();
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
    }
    
    onMount(async ()=>{
        await initPage()
        if(caboff.exist){
            initNacimiento()
            initTacto()
            initTratamiento()
            initObservacion()
            initServicio()
            db = await openDB()
            //Reviso el internet
            let lastinter = await getInternetSQL(db)
            let rescom = await getComandosSQL(db)
            comandos = rescom.lista
            if (coninternet.connected){
                await flushComandosSQL(db,pb)
                comandos = []
                if(lastinter.internet == 0){   
                    await updateLocalSQL(db)
                }
                else{
                    //Logica con internet previo
                    let ahora = Date.now()
                    let antes = lastinter.ultimo
                    const cincoMinEnMs = 300000;
                    if((ahora - antes) >= cincoMinEnMs){
                        //await flushComandosSQL(db)
                        comandos = []
                        await updateLocalSQL(db)
                    }
                    else{
                        await getDataSQL(db)
                    }
                }
                await setInternetSQL(db,1,Date.now())
            }
            else{
                await getDataSQL(db)
                await setInternetSQL(db,0,Date.now())
            }
           
            cargadoanimales = true
        }
    })
 
</script>
<Navbarr>
    <button onclick={reinicarDB} class="btn">Reiniciar bd</button>
    <button onclick={()=>setArbitrarioInternet(coninternet.connected?false:true)} class="btn hidden">Cambiar conexion {coninternet.connected?"COn internet":"sin internet"}</button>

    {#if caboff.exist}
        
        <CardBase titulo="Bienvenido a Creciente Fértil" cardsize="max-w-5xl">
            <!--Esto puede ser un componente aparte-->
            <div class="mx-1 my-2 lg:mx-10 grid grid-cols-2  lg:grid-cols-3 gap-1">
                <StatCard urlto={"/animales"}  titsize={"text-md"} titulo="Animales" valor={totaleventos.animales}/>
                <StatCard urlto={"/lotes"}  titsize={"text-md"} titulo="Lotes" valor={totaleventos.lotes}/>
                <StatCard urlto={"/rodeos"}  titsize={"text-md"} titulo="Rodeos" valor={totaleventos.rodeos}/>
                <StatCard urlto={"/servicios"}  titsize={"text-md"} titulo="Inseminaciones" valor={totaleventos.inseminaciones}/>
                <StatCard urlto={"/servicios"}  titsize={"text-md"} titulo="Servicios" valor={totaleventos.servicios}/>
                <StatCard urlto={"/nacimientos"}  titsize={"text-md"} titulo="Nacimientos" valor={totaleventos.nacimientos}/>
                <StatCard urlto={"/tratamientos"}  titsize={"text-md"} titulo="Tratamientos" valor={totaleventos.tratamientos}/>
                <StatCard urlto={"/observaciones"}  titsize={"text-md"} titulo="Observaciones" valor={totaleventos.observaciones}/>
                <StatCard urlto={"/pesajes"}  titsize={"text-md"} titulo="Pesajes" valor={totaleventos.pesajes}/>
                <StatCard urlto={"/tactos/cab"} titsize={"text-md"} titulo="Tactos" valor={totaleventos.tactos}/>
            </div>
            <!--Esto puede ser un componente aparte-->
            <h2 class="text-xl font-bold text-green-700 dark:text-green-400 mb-6 text-start">Opciones</h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <a class={classbutton}
                        href={pre+"/establecimiento"}
                    >
                        <Estable></Estable>
                        Ir a establecimiento
                    </a>
                </div>
                <div>
                    <button class={classbutton}
                    onclick={openNewModalTacto}
                    >
                        
                        <Tacto></Tacto>
                        Nuevo tacto
                    </button> 
                </div>
                <div>
                    <button class={classbutton}
                    onclick={openNewModalNacimiento}
                    >
                        <Nacimiento></Nacimiento>
                        Nuevo nacimiento
                    </button> 
                </div>
                <div>
                    <button class={classbutton}
                        onclick={openNewModalTratamiento}
                    >
                        <Tratamiento></Tratamiento>
                        
                        Nuevo tratamiento
                    </button> 
                </div>
                <div>
                    <button class={classbutton}
                    onclick={openNewModalServicio}>
                        <Servicio></Servicio>
                        Nuevo servicio
                    </button> 
                </div>
                <div>
                    <button class={classbutton}
                    onclick={openNewModalObservacion}
                    >
                        <Observacion></Observacion>
                        Nueva observacion
                    </button> 
                </div>
            </div>
        </CardBase>
    {:else}
        <!--Componente apartes-->
        <CardBase titulo="Bienvenido a Creciente Fértil" cardsize="max-w-5xl">
            <div class="grid grid-cols-1 gap-6">
                <a class={classbutton}
                    href="/establecimiento"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mx-1">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                    </svg>
                    Crear establecimiento
                </a>
            </div>
        </CardBase>
    {/if}
</Navbarr>
<dialog id="nuevoModalTacto" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        <h3 class="text-lg font-bold">Nuevo tacto</h3>
        <InicioTacto bind:caravana bind:peso bind:sexo bind:fechanacimiento bind:categoria bind:agregaranimal bind:tacto bind:prenadatacto bind:madres bind:cargadoanimales {guardarTacto}></InicioTacto>
        
    </div>
</dialog>
<dialog id="nuevoModalNacimiento" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div class="
            modal-box w-11/12 max-w-xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Nuevo nacimiento</h3>  
        
        <InicioNacimiento 
        bind:listamadres bind:listapadres
        bind:animales={animalescab}
        bind:nacimiento = {nacimiento} 
        bind:cargadoanimales={cargadoanimales}  
        {guardarNacimiento} />
    </div>
</dialog>
<dialog id="nuevoModalTratamiento" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div class="
            modal-box w-11/12 max-w-3xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        
        <h3 class="text-lg font-bold">Nuevo tratamiento</h3>  
        <InicioTratamiento 
            bind:tipotratamientos = {tipotratamientos}  
            bind:animales={animalescab}
            bind:tratamiento = {tratamiento} 
            bind:cargadoanimales={cargadoanimales}  
            {guardarTrat}></InicioTratamiento>

        
    </div>

</dialog>
<dialog id="nuevoModalObservacion" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        <h3 class="text-lg font-bold">Nueva observación</h3>  
        <InicioObservacion
            bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento
            bind:animales={animalescab}
            bind:cargadoanimales
            bind:observacion
            {guardarObservacion}
        >
        </InicioObservacion>
    </div>
</dialog>
<dialog id="nuevoModalServicio" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        <h3 class="text-lg font-bold">{esServicio?"Nuevo servicio":"Nueva inseminación"}</h3>  
        <InicioServicio
            bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento
            bind:esServicio
            bind:madres
            bind:padres
            bind:animales={animalescab}
            bind:servicio
            bind:inseminacion
            bind:cargadoanimales
            bind:listapadres
            {guardarInseminacion}
            {guardarServicio}
        ></InicioServicio>
    </div>
</dialog>
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
    import { ACTUALIZACION } from '$lib/stores/constantes';
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import {getInternetSQL, setInternetSQL,setUltimosSQL} from '$lib/stores/sqlite/dbinternet'
    
    import {getCabData,getCabDataByID} from "$lib/stores/cabsdata"
    import {
        addNewTactoSQL,
        getEventosSQL, 
        setUltimoEventosSQL,
        addNewNacimientoSQL,
        addNewTrataSQL,
        addNewObservacionSQL,
        addnewInseminacionSQL,
        addNewServicioSQL,
        updateLocalEventosSQLUser,

        getTratsSQL

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
    import { loger } from '$lib/stores/logs/logs.svelte';
    import { offliner } from '$lib/stores/logs/coninternet.svelte';
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"

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
    let lastinter = $state({})
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
    let cab = $state({})
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
        //let totalanimals = animales.filter(a=>a.active).length
        let verificar = true
        
        //if(useroff.nivel != -1 && totalanimals >= useroff.nivel){
        //    verificar =  false
        //}
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
            //await setComandosSQL(db,comandos)
            totaleventos.animales += 1
            return data
        }
        

    }
    async function guardarTactoAnimal(idprov){
        if(caravana == ""){
            Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
            return
        }
            
        let a = await guardarAnimal(true,false)
        if(a.id == -1){
            return
        }
        animales.push(a)
        onChangeAnimales()
        await setAnimalesSQL(db,animales)
        let data = {
            fecha:tacto.fechatacto +" 03:00:00" ,
            observacion:tacto.observaciontacto,
            animal:a.id,
            categoria:tacto.categoriatacto,
            prenada:prenadatacto,
            tipo:tacto.tipotacto,
            nombreveterinario:"",
            cab:caboff.id,
            active:true
        }
        if(coninternet.connected){
            try{
                //que pasa si el animal no existe
                let record = await pb.collection('tactos').create(data);
                record = {
                    ...record,
                    expand:{
                      animal:{caravana:a.caravana},
                      cab:{nombre:caboff.nombre}
                    }
                }
                
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
            data = {
                    ...data,
                    expand:{
                      animal:{caravana:a.caravana},
                      cab:{nombre:caboff.nombre}
                    }
                }
            await addNewTactoSQL(db,data)
            
            Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
        }
    }
    async function guardarTacto(){
        let idprov = "nuevo_tacto_"+generarIDAleatorio()
        if(agregaranimal){
            await guardarTactoAnimal(idprov)
        }
        else{
            
            let data = {
                fecha:tacto.fechatacto +" 03:00:00" ,
                observacion:tacto.observaciontacto,
                animal:tacto.animaltacto,
                categoria:tacto.categoriatacto,
                prenada:prenadatacto,
                tipo:tacto.tipotacto,
                nombreveterinario:"",
                cab:caboff.id,
                active:true
            }
            if(coninternet.connected){
                try{
                    let record = await pb.collection('tactos').create(data);
                    //await pb.collection('animales').update(animaltacto,{
                    //    prenada:prenadatacto
                    //})
                    ////verificacion de las fechas
                    //await guardarHistorial(pb,animaltacto)
                    let a = animales.filter(an=>an.id==tacto.animaltacto)[0]
                    record = {
                        ...record,
                        expand:{
                            animal:{caravana:a.caravana},
                            cab:{nombre:caboff.nombre}
                        }
                    }
                    totaleventos.tactos += 1
                    await addNewTactoSQL(db,record)
                    Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error guardar","No se pudo guardar el tacto","error")
                }
                
            }
            else{

                try{
                    let nuevoanimal = tacto.animaltacto.split("_")[0]=="nuevo"
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
                    //if(!nuevoanimal){
                    //    //Esto hace falta probar con las fechas
                    //    let comandohisto = {
                    //        tipo:"historial",
                    //        data:{id:animaltacto},
                    //        hora:Date.now(),
                    //        prioridad:5,
                    //    }
                    //    comandos.push(comandohisto)
                    //}
                    
                    let a = animales.filter(an=>an.id==tacto.animaltacto)[0]
                    await setComandosSQL(db,comandos)
                    data = {
                        ...data,
                        expand:{
                            animal:{caravana:a.caravana,id:a.id},
                            cab:{nombre:caboff.nombre,id:caboff.id}

                        }
                    }
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
    async function guardarNacimientoOnline(dataparicion){
        //debo agregar el lote y rodeo de la madre
        try{
            let recordparicion = await pb.collection('nacimientos').create(dataparicion);
            recordparicion = {
                ...recordparicion,
                caravana:"",
                animalid:"",
                expand:{
                    madre:{
                        caravana:dataparicion.nombremadre
                    },
                    padre:{
                        caravana:dataparicion.nombrepadre
                    },
                    cab:{
                        nombre:caboff.nombre
                    }
                }
            }
            
            if(agregaranimal){
                let data = {
                    caravana:caravana,
                    active:true,
                    delete:false,
                    fechanacimiento:nacimiento.fechanac +" 03:00:00",
                    sexo:sexo,
                    cab:caboff.id,
                    peso:peso,
                    nacimiento:recordparicion.id
                }
                let recorda = await pb.collection('animales').create(data); 
                recordparicion.caravana = caravana
                recordparicion.animalid=recorda.id
                totaleventos.animales += 1
                animales.push(recorda)
                onChangeAnimales()  
                await setAnimalesSQL(db,animales)
            }
            await addNewNacimientoSQL(db,recordparicion)
            totaleventos.nacimientos += 1
            Swal.fire("Éxito guardar","Se pudo guardar la parición con exito","success")
            nuevoModalNacimiento.close()
        }
        catch(err){
            console.error(err)
            loger.addError({
                time: Date.now(),
                text:JSON.stringify(err,null,2)
            })
            Swal.fire("Error guardar","No se pudo guardar la parición","error")
            return
        }
    }
    async function guardarNacimientoOffline(dataparicion,idprov) {
        dataparicion.id = idprov
        let  dataanimal = {
            id:"",
            caravana:""
        }
        if(agregaranimal){
            
            let idanimal = "nuevo_animal_"+generarIDAleatorio() 
            dataanimal = {
                caravana:caravana,
                active:true,
                delete:false,
                fechanacimiento:fechanacimiento +" 03:00:00",
                sexo:sexo,
                cab:caboff.id,
                peso:peso,
                nacimiento:idprov,
                id:idanimal
            }
            
            animales.push(dataanimal)
            onChangeAnimales()
            //Debo guardar el animal
            
            await setAnimalesSQL(db,animales)
            totaleventos.animales += 1

        }
        
        let esnuevopadre = dataparicion.padre.split("_").length > 1
        let esnuevomadre = dataparicion.madre.split("_").length > 1
        let camposprov = `${esnuevomadre && esnuevopadre?"madre,padre":esnuevomadre?"madre":esnuevopadre?"padre":""}`
        //Comandos
        let comandonac = {
            tipo:"add",
            coleccion:"nacimientos",
            data:{...dataparicion},
            hora:Date.now(),
            prioridad:2,
            idprov,    
            camposprov
        }
        
        comandos.push(comandonac)
        let datanacimiento={
            ...dataparicion,
            caravana:dataanimal.caravana,
            animalid:dataanimal.id,
            expand:{
                madre:{
                    caravana:dataparicion.nombremadre
                },
                padre:{
                    caravana:dataparicion.nombrepadre
                },
                cab:{
                    nombre:caboff.nombre
                }
            }
        }
        totaleventos.nacimientos += 1
        //Debo guardar el nacimiento
        
        await addNewNacimientoSQL(db,datanacimiento)
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
        Swal.fire("Éxito guardar","Se pudo guardar la paricion con exito","success")
        await setComandosSQL(db,comandos)
    }
    async function guardarNacimiento() {
        let idprov = "nuevo_nac_"+generarIDAleatorio() 
        //Los nombres de la funciones horribles
        //debo verificar si voy a guardar el animal
        //let totalanimals = await getTotalSQL(db)
        let verificar = true
        
        //if(useroff.nivel != -1 && totalanimals >= useroff.nivel){
        //    verificar =  false
        //}
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de ${useroff.nivel} animales`,"error")
            return {id:-1}
        }
        //que pasa si la madre y el padre son nuevos
        let dataparicion = {
            madre:nacimiento.madrenac,
            padre:nacimiento.padrenac,
            fecha:nacimiento.fechanac + " 03:00:00",
            nombremadre:nacimiento.nombremadrenac,
            nombrepadre:nacimiento.nombrepadrenac,
            observacion:nacimiento.observacionnac,
            cab:caboff.id
        }
        if(modedebug){
            loger.addLog({
                time: Date.now(),
                text:JSON.stringify(dataparicion,null,2)
            })
        }
        if(coninternet.connected){
            await guardarNacimientoOnline(dataparicion)
        }
        else{
            await guardarNacimientoOffline(dataparicion,idprov)
        }
        initNacimiento()
    }
    async function guardarTratAnimal(idprov) {
        if(caravana == ""){
            Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
            return
        }
            
        let a = await guardarAnimal(false,false)
        if(a.id == -1){
            return
        }
        animales.push(a)

        onChangeAnimales()
        await setAnimalesSQL(db,animales)
        
           
        let data = {
            animal:a.id,
            categoria:a.categoria,
            tipo:tratamiento.tipotrat,
            fecha:tratamiento.fechatrat +" 03:00:00",
            active : true,
            observacion:tratamiento.observaciontrat,
            cab:caboff.id
        }
        let tts= tipotratamientos.filter(t=>t.id == tratamiento.tipotrat)
        //si tengo internet lo hgao derecho
        
        if(coninternet.connected){
            let record = await pb.collection("tratamientos").create(data)
            record = {
                ...record,
                expand:{
                    animal:{caravana:a.caravana},
                    tipo:{nombre:tts[0].nombre},
                    cab:{nombre:caboff.nombre}
                }
            }
            Swal.fire("Éxito guardar","Se pudo guardar el tratamiento con exito","success")
            totaleventos.tratamientos += 1
        }
        //Sino tengo que crear un comando
        else{
            data.id = idprov
            let esnuevoanimal = a.id.split("_").length > 1
            let comando = {
                tipo:"add",
                coleccion:"tratamiento",
                data:{...data},
                hora:Date.now(),
                prioridad:5,
                idprov,    
                camposprov:esnuevoanimal?"animal":""
            }
            comandos.push(comando)
            await setComandosSQL(db,comandos)
            data={
                ...data,
                expand:{
                    animal:{caravana:a.caravana},
                    tipo:{nombre:tts[0].nombre},
                    cab:{nombre:caboff.nombre}
                }
            }
            await addNewTrataSQL(db,data)
            totaleventos.tratamientos += 1
            Swal.fire("Éxito guardar","Se pudo guardar el tratamiento","success")
        }
    }
    async function guardarTrat() {
        let idprov = "nuevo_trat_"+generarIDAleatorio() 
        if(agregaranimal){
            
            await guardarTratAnimal(idprov)
        }
        //Animal existente
        else{
            let tts= tipotratamientos.filter(t=>t.id == tratamiento.tipotrat)
            let data = {
                animal:tratamiento.animaltrat,
                categoria:tratamiento.categoriatrat,
                tipo:tratamiento.tipotrat,
                fecha:tratamiento.fechatrat +" 03:00:00",
                active : true,
                cab:caboff.id,
                observacion:tratamiento.observaciontrat,
            }
            if(coninternet.connected){
                try{
                    let a = animales.filter(an=>an.id==tratamiento.animaltrat)[0]
                    let record = await pb.collection("tratamientos").create(data)
                    record = {
                        ...record,
                        expand:{
                            tipo:{nombre:tts[0].nombre},
                            animal:{caravana:a.caravana},
                            cab:{nombre:caboff.nombre}
                        }
                    }
                    await addNewTrataSQL(db,record)
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
                    let nuevoanimal = tratamiento.animaltrat.split("_")[0]=="nuevo"
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
                    let a = animales.filter(an=>an.id==tratamiento.animaltrat)[0]
                    comandos.push(comando)
                    await setComandosSQL(db,comandos)
                    //Add new trata
                    data = {
                        ...data,
                        expand:{
                            tipo:{nombre:tts[0].nombre},
                            animal:{caravana:a.caravana},
                            cab:{nombre:caboff.nombre}
                        }
                    }
                    totaleventos.tratamientos += 1
                    
                    await addNewTrataSQL(db,data)
                    
                    Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error guardar","No se pudo guardar el tratamiento con exito","error")
                }
            }
        }
    }
    async function guardarInseminacionAnimal(idprov) {
        if(caravana == ""){
            Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
            return
        }
        let a = await guardarAnimal(true,false)
        if(a.id == -1){
            return
        }
        animales.push(a)
        onChangeAnimales()
        await setAnimalesSQL(db,animales)
        //await updateAnimales(a)
        
        let data = {
            cab:caboff.id,
            animal: a.id,
            fechaparto: inseminacion.fechapartoins +' 03:00:00',
            fechainseminacion: inseminacion.fechainseminacion + ' 03:00:00',
            active:true,
            padre:inseminacion.padreins,//Si es nuevo padre
            pajuela:inseminacion.pajuelains,
            categoria:a.categoria,
        }
        if(coninternet.connected){
            try{
                let record = await pb.collection('inseminacion').create(data);
                    record = {
                        ...record,
                        expand:{
                          animal:{caravana:a.caravana},
                          cab:{nombre:caboff.nombre}
                        }
                    }
                    await addnewInseminacionSQL(db,record)
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
                let animalins = animales.filter(an=>an.id==a.id)[0]
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
                data={
                    ...data,
                    expand:{
                      animal:{caravana:a.caravana},
                      cab:{nombre:caboff.nombre}
                    }
                }
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
    async function guardarInseminacion() {
        let idprov = "nuevo_ins_"+generarIDAleatorio()
        if(agregaranimal){
            await guardarInseminacionAnimal(idprov)
        }
        else{
            let data = {
                cab:caboff.id,
                animal: inseminacion.idanimalins,
                fechaparto: inseminacion.fechapartoins +' 03:00:00',
                fechainseminacion: inseminacion.fechainseminacion + ' 03:00:00',
                active:true,
                padre:inseminacion.padreins,
                pajuela:inseminacion.pajuelains,
                categoria:inseminacion.categoriains,
                observacion:inseminacion.observacion
            }
            if(coninternet.connected){
                try{
                    let animalins = animales.filter(an=>an.id==inseminacion.idanimalins)[0]
                    let record = await pb.collection('inseminacion').create(data);
                    totaleventos.inseminaciones += 1
                    record = {
                        ...record,
                        expand:{
                          animal:{caravana:animalins.caravana},
                          cab:{nombre:caboff.nombre}

                        }
                    }
                    await addnewInseminacionSQL(db,record)
                    Swal.fire("Éxito guardar","Se pudo guardar la inseminación con exito","success")
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error guardar","Hubo un error para guardar la inseminación","error")
                }
                

                //await pb.collection('animales').update(idanimalins,{
                //    prenada:3
                //})

                //await guardarHistorial(pb,idanimalins)
                
            }
            else{
                let animalins = animales.filter(an=>an.id==inseminacion.idanimalins)[0]
                let nuevoanimal = inseminacion.idanimalins.split("_")[0]=="nuevo"
                data.id = idprov
                let comando = {
                    tipo:"add",
                    coleccion:"tratamiento",
                    data:{...data},
                    hora:Date.now(),
                    prioridad:5,
                    idprov,    
                    camposprov:`${nuevoanimal?"animal":""}`
                }
                comandos.push(comando)
                await setComandosSQL(db,comandos)
                data = {
                    ...data,
                    expand:{
                      animal:{caravana:animalins.caravana},
                      cab:{nombre:caboff.nombre}
                    }
                }
                    
                await addnewInseminacionSQL(db,data)
                Swal.fire("Éxito guardar","Se pudo guardar la inseminación con exito","success")
                totaleventos.inseminaciones += 1
            }
        }
    }
    async function guardarServicioAnimal(idprov) {
        if(caravana == ""){
                Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
                return
            }
            let a = await guardarAnimal(false,true)
            if(a.id == -1){
                    return
            }
            animales.push(a)
            onChangeAnimales()
            await setAnimalesSQL(db,animales)
            
            let dataser = {
                fechadesde : servicio.fechadesdeserv + " 03:00:00",
                fechaparto: servicio.fechapartoser + " 03:00:00",
                observacion: servicio.observacionser,
                madre:a.id,
                padres:servicio.padreserlista.join(),
                active:true,
                cab:caboff.id,
            }
            if(servicio.fechahastaserv != ""){
                dataser.fechahasta = servicio.fechahastaserv + " 03:00:00"
            }
            if(coninternet.connected){
                let record = await pb.collection("servicios").create(dataser)
                record = {
                    ...record,
                    madre:{caravana:a.caravana},
                    cab:{nombre:caboff.nombre}
                }
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
                dataser = {
                    ...dataser,
                    madre:{caravana:a.caravana},
                    cab:{nombre:caboff.nombre}
                    
                }
                await addNewServicioSQL(db,dataser)
                Swal.fire("Éxito guardar","Se pudo guardar el servicio con exito","success")
                totaleventos.servicios += 1
            }
    }
    async function guardarServicio(){
        let idprov = "nuevo_serv_"+generarIDAleatorio() 
        if(agregaranimal){
            await guardarServicioAnimal(idprov)
        }
        //Animal seleccionado
        else{
            let dataser = {
                fechadesde : servicio.fechadesdeserv + " 03:00:00",
                fechaparto: servicio.fechapartoser + " 03:00:00",
                observacion: servicio.observacionser,
                madre:servicio.idanimalser,
                padres:servicio.padreserlista.join(),
                active:true,
                cab:caboff.id,
            }
            if(servicio.fechahastaserv != ""){
                dataser.fechahasta = servicio.fechahastaserv + " 03:00:00"
            }
            if(coninternet.connected){
                try{
                    let madre = animales.filter(an=>an.id==servicio.idanimalser)[0] 
                    let record = await pb.collection("servicios").create(dataser)
                    record= {
                        ...record,
                        expand:{
                            madre:{caravana:madre.caravana},
                            cab:{nombre:caboff.nombre}
                        }
                    }
                    await addNewServicioSQL(db,record)
                    Swal.fire("Éxito guardar","Se pudo guardar el servicio con éxito","success")
                    totaleventos.servicios += 1
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error guardar","No se pudo guardar el servicio con éxito","error")
                }
                
            }
            else{
                let nuevoanimal = servicio.idanimalser.split("_")[0]=="nuevo"
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
                dataser = {
                    ...dataser,
                    expand:{
                        madre:{caravana:animales.filter(an=>an.id==dataser.madre)[0].caravana},
                        cab:{nombre:caboff.nombre}
                    }
                }
                await addNewServicioSQL(db,dataser)
                Swal.fire("Éxito guardar","Se pudo guardar el servicio con éxito","success")
                totaleventos.servicios += 1
            }
        }
    }
    async function guardarObservacionAnimal(idprov) {
        if(caravana == ""){
            Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
            return
        }
        let a = await guardarAnimal(false,true)
        if(a.id == -1){
            return
        }
        animales.push(a)
        onChangeAnimales()
        await setAnimalesSQL(db,animales)
            
            
        let data = {
            animal:a.id,
            categoria:a.categoria,
            fecha:observacion.fechaobs +" 03:00:00",
            cab:caboff.id,
            observacion:observacion.observacionobs,
            active:true
        }
        if(coninternet.connected){
           try{
               let record = await pb.collection('observaciones').create(data);
               record = {
                   ...record,
                   expand:{
                        animal:{caravana:a.caravana},
                        cab:{nombre:caboff.nombre}
                   }
               }
               await addNewObservacionSQL(db,record)
               Swal.fire("Éxito guardar","Se pudo guardar la observación","success")
               totaleventos.observaciones += 1
            }
            catch(err){
               console.error(err)
               Swal.fire("Error guardar","No se pudo guardar la observación","error")
            }
               
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
            data = {
                ...data,
                expand:{
                  animal:{caravana:a.caravana},
                  cab:{nombre:caboff.nombre}
                }
            }
            await addNewObservacionSQL(db,data)
            Swal.fire("Éxito guardar","Se pudo guardar la observación con exito","success")
            totaleventos.observaciones += 1
        }
    }
    async function guardarObservacion() {
        let idprov = "nuevo_obs_"+generarIDAleatorio() 
        if(agregaranimal){
            await guardarObservacionAnimal(idprov)
        }
        //Animal seleccionado
        else{
            let data = {
                animal:observacion.animalobs,
                fecha:observacion.fechaobs +" 03:00:00",
                categoria:observacion.categoriaobs,
                cab:caboff.id,
                observacion:observacion.observacionobs,
                active:true
            }
            if(coninternet.connected){
                try{
                    let a = animales.filter(an=>an.id==observacion.animalobs)[0]
                    let record = await pb.collection('observaciones').create(data);
                    record = {
                        ...record,
                        expand:{
                            animal:{caravana:a.caravana},
                        }
                    }
                    await addNewObservacionSQL(db,record)
                    Swal.fire("Éxito guardar","Se pudo guardar la observación","success")
                    totaleventos.observaciones += 1
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Error guardar","No se pudo guardar la observación","error")
                }
                
            }
            else{
                let a = animales.filter(an=>an.id==observacion.animalobs)[0]
                let nuevoanimal = observacion.animalobs.split("_")[0]=="nuevo"
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
                data = {
                        ...data,
                        expand:{
                            animal:{caravana:a.caravana},
                        }
                    }
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
        if(modedebug){
            offliner.setOffline(!conectado)
        }
        
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
        let animalesuser = await updateLocalAnimalesSQLUser(db,pb,usuarioid)  
        
        await updateLocalHistorialAnimalesSQLUser(db,pb,usuarioid)
        //Debo traer los datos de la cabaña
        await updateLocalEstablecimientosSQL(db,pb,usuarioid,caboff.id)
        let datauser = await updateLocalEventosSQLUser(db,pb,usuarioid)
    
        
        
        //await updateLocalColabSQL(db,pb,caboff.id)
        
        let datatotal = await getTotalAnimales(pb)
        animales = animalesuser
        onChangeAnimales()
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
        
        tipotratamientos = datauser.tipostrat.filter(t=>(t.cab == caboff.id && t.active)||t.generico)  
        //await setUltimoAnimalesSQL(db)
        //await setUltimoEventosSQL(db)
        //await setTotalSQL(db,datatotal)
        //await setUltimoTotalSQL(db)
        await setUltimosSQL(db)
    }
    async function getLocalSQL(db) {
        let dataanimales = await getAnimalesSQL(db)
        let data = await getEventosSQL(db)
        
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
        
        tipotratamientos = data.tipostrat.lista.filter(t=>(t.cab == caboff.id && t.active)||t.generico)  
        totaleventos.animales = animales.filter(a=>a.cab == caboff.id &&  a.active).length
    }
    function onChangeAnimales() { 
        animalescab = animales.filter(a=>a.cab == caboff.id && a.active)
        listaanimales = animalescab.map(a=>{return {id:a.id,nombre:a.caravana}})
        madres = animalescab.filter(a=>a.sexo == "H" && a.active)
        padres = animalescab.filter(a=>a.sexo == "M" && a.active)
        listamadres = madres.map(a=>{return {id:a.id,nombre:a.caravana}})
        listapadres = padres.map(a=>{return {id:a.id,nombre:a.caravana}})
        cargadoanimales = true
    }
    async function initPage() {
        //
        //coninternet = await Network.getStatus();
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
        cab = caber.cab
    }
    async function getDataSQL() {
        db = await openDB()
        //Reviso el internet
        lastinter = await getInternetSQL(db)
        
        let rescom = await getComandosSQL(db)
        comandos = rescom.lista
        
        if (coninternet.connected){

                //await flushComandosSQL(db,pb)
                comandos = []
                if(cab.cambio || lastinter.internet == 0){   
                    
                    await updateLocalSQL(db)
                    await setInternetSQL(db,1,Date.now())
                }
                else{
                    //Logica con internet previo
                    let ahora = Date.now()
                    let antes = lastinter.ultimo
                    const cincoMinEnMs = ACTUALIZACION;
                    
                    if((ahora - antes) >= cincoMinEnMs){
                        //await flushComandosSQL(db)
                        comandos = []
                        await updateLocalSQL(db)
                        await setInternetSQL(db,1,ahora)
                    }
                    else{
                        
                        await getLocalSQL(db)
                    }
                }
                
        }
        else{
            await getLocalSQL(db)
            await setInternetSQL(db,0,Date.now())
        }
           

    }
    onMount(async ()=>{
        await initPage()
        
        if(caboff.exist){
            initNacimiento()
            initTacto()
            initTratamiento()
            initObservacion()
            initServicio()

            await getDataSQL()
            
        }
    })
 
</script>
<Navbarr>
    {#if modedebug}
        <button onclick={reinicarDB} class="btn">Reiniciar bd</button>
        <button onclick={()=>setArbitrarioInternet(coninternet.connected?false:true)} class="btn">Cambiar conexion {coninternet.connected?"COn internet":"sin internet"}</button>
        <div class="">
            <span>
                Animales user: {animales.length}
            </span>
            
            <span>
                Animales cab: {animalescab.length}
            </span>
            <br>
            <span>
                madres: {madres.length}
            </span>
            <span>
                padres: {padres.length}
            </span> 
            <br>
            <span>
                Hora actual: {Date.now()}
            </span>
            <span>
                last internet: {lastinter.ultimo}
            </span>
            <br>
            <span>
                Distancia: {Date.now() - lastinter.ultimo}
            </span>
            <span>
                Distancia min: {(Date.now() - lastinter.ultimo) / 60000}
            </span>
        </div>
    {/if}
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
        <InicioTacto 
            bind:caravana 
            bind:peso 
            bind:sexo 
            bind:fechanacimiento bind:categoria 
            bind:agregaranimal bind:tacto 
            bind:prenadatacto bind:madres bind:cargadoanimales 
            {guardarTacto}>
        </InicioTacto>
        
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
        <h3 class="text-lg font-bold">Nueva parición</h3>  
        
        <InicioNacimiento 
            bind:caravana bind:peso bind:sexo 
            bind:fechanacimiento bind:categoria 
            bind:agregaranimal 
            bind:listamadres bind:listapadres
            bind:animales={animalescab}
            bind:nacimiento = {nacimiento} 
            bind:cargadoanimales={cargadoanimales}  
            {guardarNacimiento} 
        />
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
            bind:caravana bind:peso bind:sexo 
            bind:fechanacimiento bind:categoria 
            bind:agregaranimal 
            bind:tipotratamientos = {tipotratamientos}  
            bind:animales={animalescab}
            bind:tratamiento = {tratamiento} 
            bind:cargadoanimales={cargadoanimales}  
            {guardarTrat}>
        </InicioTratamiento>

        
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
            bind:agregaranimal bind:caravana bind:categoria 
            bind:sexo bind:peso bind:fechanacimiento
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
            bind:agregaranimal bind:caravana bind:categoria 
            bind:sexo bind:peso bind:fechanacimiento
            bind:esServicio
            bind:madres bind:padres
            bind:animales={animalescab}
            bind:servicio bind:inseminacion
            bind:cargadoanimales bind:listapadres
            {guardarInseminacion}
            {guardarServicio}
        ></InicioServicio>
    </div>
</dialog>
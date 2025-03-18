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
    

    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    let usuarioid = $state("")
    let cab = $state({
        exist:false,
        nombre:"",
        id:""
    })
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
    let madres = $state([])
    let padres = $state([])
    let listaanimales = $state([])
    let listamadres = $state([])
    let listapadres = $state([])
    let tipotratamientos = $state([])
    let cargadoanimales = $state(false)
    //Datos cabaña
    let classbutton = "w-full flex items-center justify-center space-x-4 bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
    //Tacto
    let fechatacto = $state("")
    let observaciontacto = $state("")
    let animaltacto = $state("")
    let cadenatacto = $state("")
    //Tipo animal
    let categoriatacto = $state("")
    let prenadatacto = $state(0)
    //tipo tacto
    let tipotacto = $state("")
    //Validaciones
    let malfechatacto = $state("")
    let malanimaltacto = $state("")
    let malvet = $state("")
    let botonhabilitadotacto=$state(false)
    //Nacimiento    
    let caravananac = $state("")
    let sexonac = $state("")
    let pesonac = $state("")
    let fechanac = $state("")
    let observacionnac = $state("")
    //Madre
    let etiquetamadre = "Madre"
    let madrenac = $state("")
    let nombremadrenac = $state("")
    //
    //Padre
    let padrenac = $state("")
    let nombrepadrenac = $state("")
    //Validacion
    let malmadrenac = $state(false)
    let malpadrenac = $state(false)
    let malfechanac = $state(false)
    let malcaravananac = $state(false)
    let malsexonac = $state(false)
    let botonhabilitadonac = $state(false)
    //Tratamiento
    let animaltrat = $state("")
    let cadenatrat = $state("")
    let categoriatrat = $state("")
    let fechatrat = $state("")
    let tipotrat = $state("")
    //Validaciones
    let malanimaltrat = $state(false)
    let malcategoriatrat = $state(false)
    let malfechatrat = $state(false)
    let maltipotrat = $state(false)
    let botonhabilitadotrat=$state(false)
    //Servicio
    let idanimalser = $state("")
    let categoriaser = $state("")
    let esServicio = $state(true)
    let padreser = $state("")
    let padreserlista = $state([])
    let fechapartoser = $state("")
    let fechadesdeserv = $state("")
    let fechahastaserv = $state("")
    let madreser = $state("")
    let observacionser = $state("")
    //validacion
    let malanimalser = $state(false)
    let malfechadesdeser = $state(false)
    let malpadreser = $state(false)
    let botonhabilitadoser = $state(false)
    //Inseminacion
    let padreins = $state("")
    let pajuelains = $state("")
    let idanimalins = $state("")
    let cadenains = $state("")
    let categoriains = $state("")
    let fechainseminacion = $state("")
    let fechapartoins = $state("")
    //Validaciones
    let malanimalins = $state(false) 
    let malpadreins = $state(false)
    let malfechainseminacion = $state(false)
    let malfechapartoins = $state(false)
    let botonhabilitadoins = $state(false)
    //Observacion
    let animalobs = $state("")
    let cadenaobs = $state("")
    let categoriaobs = $state("")
    let fechaobs = $state("")
    let observacionobs = $state("")
    //Validaciones
    let malanimalobs = $state(false)
    let malfechaobs = $state(false)
    let botonhabilitadoobs = $state(false)
    //Nuevo animal
    let agregaranimal = $state(false)
    let caravana = $state("")
    let peso = $state("")
    let sexo = $state("")
    let fechanacimiento = $state("")
    let categoria = $state("")

    async function getAnimales(){
        //Estaria joya que el animal venga con todos los chiches
        const recordsa = await pb.collection("animales").getFullList({
            filter:`active=true && cab='${cab.id}' && delete = false`,
            expand:"nacimiento"
        })
        animales = recordsa
        animales.sort((a1,a2)=>a1.caravana>a2.caravana?1:-1)
        totaleventos.animales = animales.length
        
        
        cargadoanimales = true
        madres = animales.filter(a=>a.sexo=="H"||a.sexo=="F")
        listamadres = madres.map(item=>{
            return {id:item.id,nombre:item.caravana}
        })
        padres = animales.filter(a=>a.sexo=="M")
        listapadres = padres.map(item=>{
            return {id:item.id,nombre:item.caravana}
        })
        listaanimales = animales.map(item=>{
            return {id:item.id,nombre:item.caravana}
        })
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
        fechatacto = ""
        observaciontacto =  ""
        animaltacto = ""
        cadenatacto = ""
        categoriatacto = ""
        prenadatacto = 0
        tipotacto = ""
        botonhabilitadotacto = false
        malfechatacto = false
        malanimaltacto = false
        nuevoModalTacto.showModal()
    }
    function openNewModalNacimiento(){
        agregaranimal = false
        caravana = ""
        sexo = ""
        peso = ""
        fechanacimiento = ""
        caravananac = ""
        sexonac = ""
        padrenac = ""
        madrenac = ""
        pesonac = ""
        nombremadrenac = ""
        nombrepadrenac = ""
        fechanac = ""
        observacionnac = ""
        malpadrenac = false
        malmadrenac = false
        malfechanac = false
        malcaravananac = false
        malsexonac = false
        nuevoModalNacimiento.showModal()

    }
    function  openNewModalTratamiento(){
        agregaranimal = false
        caravana = ""
        sexo = ""
        peso = ""
        fechanacimiento = ""
        fechatrat = ""
        animaltrat = ""
        cadenatrat = ""
        tipotrat = ""
        categoriatrat = ""
        nuevoModalTratamiento.showModal()
    }
    function openNewModalServicio(){
        agregaranimal = false
        caravana = ""
        sexo = ""
        peso = ""
        fechanacimiento = ""
        //Servicio
        esServicio = true
        padreser = ""
        padreserlista = []
        fechapartoser = ""
        fechadesdeserv = ""
        fechahastaserv = ""
        madreser = ""
        observacionser = ""
        malfechadesdeser = false
        malpadreser = false
        botonhabilitadoser = false
        
        nuevoModalServicio.showModal()
    }
    function openNewModalInseminacion(){
        agregaranimal = false
        caravana = ""
        sexo = ""
        peso = ""
        fechanacimiento = ""
        botonhabilitadoins = false
        malanimalins = false
        malpadreins = false
        malfechainseminacion = false
        malfechapartoins = false
        fechapartoins = ""
        fechainseminacion = ""
        padreins = ""
        idanimalins = ""
        cadenains = ""
        categoriains = ""
        pajuelains = ""
        nuevoModalInseminacion.showModal()
    }
    function openNewModalObservacion(){
        agregaranimal = false
        caravana = ""
        sexo = ""
        peso = ""
        fechanacimiento = ""
        observacionobs = ""
        categoriaobs = ""
        fechaobs = ""
        cadenaobs = ""
        botonhabilitadoobs = false
        malanimalobs = false
        malfechaobs = false
        nuevoModalObservacion.showModal()
    }
    async function guardarAnimal(esTacto,esInseminacion) {
        let user = await pb.collection("users").getOne(usuarioid)
        
        let nivel  = cuentas.filter(c=>c.nivel == user.nivel)[0]
        
        let animals = await pb.collection('Animalesxuser').getList(1,1,{filter:`user='${usuarioid}'`})
        let verificar = true
        if(nivel.animales != -1 && animals.totalItems > nivel.animales){
            verificar =  false
        }
        
        let data = {
            caravana,
            active:true,
            categoria,
            delete:false,
            fechanacimiento:fechanacimiento +" 03:00:00",
            sexo,
            peso,
            cab:cab.id
        }
        if(esTacto){
            data.prenada = prenadatacto
        }
        if(esInseminacion){
            data.prenada = 3
        }
        let recorda = await pb.collection('animales').create(data); 
        return recorda
        
        
    }
    async function guardarTacto(){
        if(agregaranimal){
            if(caravana == ""){
                Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
                return
            }
            try{
                
                let a = await guardarAnimal(true,false)
                let data = {
                    fecha:fechatacto +" 03:00:00" ,
                    observacion:observaciontacto,
                    animal:a.id,
                    categoria:categoriatacto,
                    prenada:prenadatacto,
                    tipo:tipotacto,
                    nombreveterinario:"",
                    cab:cab.id,
                    active:true
                }
                const record = await pb.collection('tactos').create(data);
                await getAnimales()
                Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
            }
            catch(err){
                console.error(err)
                Swal.fire("Error guardar","No se pudo guardar el tacto","error")
            }
        }
        else{
            try{
            
                let data = {
                fecha:fechatacto +" 03:00:00" ,
                observacion:observaciontacto,
                animal:animaltacto,
                categoria:categoriatacto,
                prenada:prenadatacto,
                tipo:tipotacto,
                nombreveterinario:"",
                cab:cab.id,
                active:true
                }
                const record = await pb.collection('tactos').create(data);
                await pb.collection('animales').update(animaltacto,{
                    prenada:prenadatacto
                })
                await guardarHistorial(pb,animaltacto)
                Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
            }
            catch(err){
                console.error(err)
                Swal.fire("Error guardar","No se pudo guardar el tacto","error")
            }
        }
        
    }
    async function guardarNacimiento(){
        try{
            let dataparicion = {
                madre:madrenac,
                padre:padrenac,
                fecha:fechanac + " 03:00:00",
                nombremadre:nombremadrenac,
                nombrepadre:nombrepadrenac,
                observacion:observacionnac,
                cab:cab.id
            }
            const recordparicion = await pb.collection('nacimientos').create(dataparicion);
            let data = {
                caravana:caravananac,
                active:true,
                delete:false,
                fechanacimiento:fechanac +" 03:00:00",
                sexo:sexonac,
                cab:cab.id,
                peso:pesonac,
                nacimiento:recordparicion.id
            }
            
            let recorda = await pb.collection('animales').create(data); 
            Swal.fire("Éxito guardar","Se pudo guardar la paricion con exito","success")
            nuevoModalNacimiento.close()
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","Hubo un error al guardar el animal","error")
            nuevoModalNacimiento.close()
        }
    }
    async function guardarTrat(){
        if(agregaranimal){
            if(caravana == ""){
                Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
                return
            }
            try{
                
                let a = await guardarAnimal(false,false)
                let data = {
                    animal:a.id,
                    categoria:a.categoria,
                    tipo:tipotrat,
                    fecha:fechatrat +" 03:00:00",
                    active : true,
                    cab:cab.id
                }
                const  record = await pb.collection("tratamientos").create(data)
                await getAnimales()
                Swal.fire("Éxito guardar","Se pudo guardar el tratamiento con exito","success")
            }
            catch(err){
                console.error(err)
                Swal.fire("Error guardar","Hubo un error para guardar el tratamiento","error")
            }
        }
        else{
            try{
                let data = {
                    animal:animaltrat,
                    categoria:categoriatrat,
                    tipo:tipotrat,
                    fecha:fechatrat +" 03:00:00",
                    active : true,
                    cab:cab.id
                }
                const  record = await pb.collection("tratamientos").create(data)
                Swal.fire("Éxito guardar","Se pudo guardar el tratamiento con exito","success")
            }
            catch(err){
                console.error(err)
                Swal.fire("Error guardar","Hubo un error para guardar el tratamiento","error")
            }
        }
        
    }
    async function guardarInseminacion(){
        if(agregaranimal){
            if(caravana == ""){
                Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
                return
            }
            let a = await guardarAnimal(false,true)
            let data = {
                cab:cab.id,
                animal: a.id,
                fechaparto: fechapartoins +' 03:00:00',
                fechainseminacion: fechainseminacion + ' 03:00:00',
                active:true,
                padre:padreins,
                pajuela:pajuelains,
                categoria:a.categoria,
            }
            try{
                const record = await pb.collection('inseminacion').create(data);
                await getAnimales()
                Swal.fire("Éxito guardar","Se pudo guardar la inseminación con exito","success")
            }
            catch(err){
                console.error(err)
                Swal.fire("Error guardar","Hubo un error para guardar la inseminación","error")
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
            try{
                const record = await pb.collection('inseminacion').create(data);
                await pb.collection('animales').update(idanimalins,{
                    prenada:3
                })
                await guardarHistorial(pb,idanimalins)
                Swal.fire("Éxito guardar","Se pudo guardar la inseminación con exito","success")
            }
            catch(err){
                console.error(err)
                Swal.fire("Error guardar","Hubo un error para guardar la inseminación","error")
            }
        }
        
    }
    async function guardarServicio() {
        if(agregaranimal){
            if(caravana == ""){
                Swal.fire("Error guardar","No se pudo guardar el tacto porque el animal no tiene caravana","error")
                return
            }
            let a = await guardarAnimal(false,true)
            let dataser = {
                fechadesde : fechadesdeserv + " 03:00:00",
                fechaparto: fechapartoser + " 03:00:00",
                observacion: observacionser,
                madre:a.id,
                padres:padreserlista.join(),
                active:true,
                cab:cab.id
            }
            if(fechahastaserv != ""){
                dataser.fechahasta = fechahastaserv + " 03:00:00"
            }
            try{
                await pb.collection("servicios").create(dataser)
                
                await getAnimales()
                Swal.fire("Éxito guardar","Se pudo guardar el servicio con éxito","success")
            }
            catch(err){
                console.error(err)
                Swal.fire("Error guardar","Hubo un error para guardar el servicio","error")

            }
        }
        else{
            let dataser = {
                fechadesde : fechadesdeserv + " 03:00:00",
                fechaparto: fechapartoser + " 03:00:00",
                observacion: observacionser,
                madre:idanimalser,
                padres:padreserlista.join(),
                active:true,
                cab:cab.id
            }
            if(fechahastaserv != ""){
                dataser.fechahasta = fechahastaserv + " 03:00:00"
            }
            try{
                await pb.collection("servicios").create(dataser)
                
                await pb.collection('animales').update(idanimalser,{
                    prenada:3
                })
                await guardarHistorial(pb,idanimalser)
                Swal.fire("Éxito guardar","Se pudo guardar el servicio con éxito","success")
            }
            catch(err){
                console.error(err)
                Swal.fire("Error guardar","Hubo un error para guardar el servicio","error")

            }
            
        }
    }
    async function guardarObs(){
        if(agregaranimal){
            try{
                let a = await guardarAnimal(false,false)
                let data = {
                    animal:a.id,
                    categoria:a.categoria,
                    fecha:fechaobs +" 03:00:00",
                    cab:cab.id,
                    observacion:observacionobs,
                    active:true
                }
                const record = await pb.collection('observaciones').create(data);
                await getAnimales()
                Swal.fire("Éxito guardar","Se pudo guardar la observación","success")
            }
            catch(err){
                console.error(err)
                Swal.fire("Error guardar","No se pudo guardar la observación","error")
            }
        }
        else{
            try{
                let data = {
                    animal:animalobs,
                    fecha:fechaobs +" 03:00:00",
                    categoria:categoriaobs,
                    cab:cab.id,
                    observacion:observacionobs,
                    active:true
                }
                const record = await pb.collection('observaciones').create(data);
                Swal.fire("Éxito guardar","Se pudo guardar la observación","success")
            }
            catch(err){
                console.error(err)
                Swal.fire("Error guardar","No se pudo guardar la observación","error")
            }
        }
        
    }
    function validarBotonNacimiento(){
        botonhabilitadonac = true
        if(isEmpty(caravananac)){
            
            botonhabilitadonac=false
        }
        if(isEmpty(sexonac)){
            
            botonhabilitadonac = false
        }
        if(isEmpty(fechanac)){
            
            botonhabilitadonac = false
        }
        if(isEmpty(nombremadrenac)){
            
            botonhabilitadonac = false
        }
        if(isEmpty(nombrepadrenac)){
            
            botonhabilitadonac = false
        }


    }
    function validarBotonTacto(){
        botonhabilitadotacto = true
        if(!agregaranimal && isEmpty(animaltacto)){
            botonhabilitadotacto=false
        }
        if(isEmpty(fechatacto)){
            botonhabilitadotacto=false
        }
    }
    function validarBotonTrat(){
        botonhabilitadotrat = true
        if(!agregaranimal && isEmpty(animaltrat)){
            botonhabilitadotrat = false
        }
        
        if(isEmpty(tipotrat)){
            botonhabilitadotrat = false
        }
        if(isEmpty(fechatrat)){
            botonhabilitadotrat = false
        }
    }
    function validarBotonIns(){
        botonhabilitadoins = true
        if(!agregaranimal && isEmpty(idanimalins)){
            botonhabilitadoins = false
        }
        if(isEmpty(pajuelains)){
            botonhabilitadoins = false
        }
        if(isEmpty(fechainseminacion)){
            botonhabilitadoins = false
        }
    
    }
    function validarBotonSer(){
        botonhabilitadoser = true
        if(fechadesdeserv==""){
            botonhabilitadoser = false
        }
        if(idanimalser==""){
            botonhabilitadoser = false
        }
    }
    function validarBotonObs(){
        botonhabilitadoobs = true
        if(!agregaranimal && isEmpty(animalobs)){
            botonhabilitadoobs=false
        }
        if(isEmpty(fechaobs)){
            botonhabilitadoobs=false
        }
    }
    function addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    function onSelectAnimalTacto(){
        let a = animales.filter(an=>an.id==animaltacto)[0]
        if(a){
            categoriatacto = a.categoria
        }
        else{
            categoriatacto = ""
        }
        
    }
    function onSelectAnimalTrat(){
        let a = animales.filter(an=>an.id==animaltrat)[0]
        if(a){
            categoriatrat = a.categoria
        }
        else{
            categoriatrat = ""
        }
        
    }
    function onSelectAnimalIns(){
        let a = madres.filter(an=>an.id==idanimalins)[0]
        if(a){
            categoriains = a.categoria
        }
        else{
            categoriains = ""
        }
        
    }
    function onSelectAnimalSer(){
        let a = madres.filter(an=>an.id==idanimalser)[0]
        if(a){
            categoriaser = a.categoria
        }
        else{
            categoriaser = ""
        }
        
    }
    function onSelectPadreIns(){
        let p = padres.filter(item=>item.id == padreins)[0]
        pajuelains = p.caravana
    }
    function onSelectAnimalNacimiento(esmadre){

        let a = animales.filter(an=>esmadre?an.id==madrenac:an.id==padrenac)[0]
        if(esmadre){
            nombremadrenac = a.caravana
        }
        else{
            nombrepadrenac =  a.caravana
        }
         
    }
    function onSelectAnimalObs(){
        let a = animales.filter(an=>an.id==animalobs)[0]
        if(a){
            categoriaobs = a.categorias
        }
        else{
            categoriaobs = ""
        }
        
    }
    function oninputTacto(inputName){
        validarBotonTacto()
        if(!agregaranimal && inputName == "ANIMAL"){
            if(isEmpty(animaltacto)){
                malanimaltacto = true
            }
            else{
                malanimaltacto = false
                onSelectAnimalTacto()
            }
        }   
        if(inputName == "FECHA"){
            if(isEmpty(fechatacto)){
                malfechatacto = true
            }
            else{
                malfechatacto = false
            }
        }
    }
    function oninputNacimiento(inputName){
        if(inputName == "CARAVANA"){
            if(caravananac == ""){
                malcaravananac = true
            }
            else{
                malcaravananac = false
            }
        }
        if(inputName == "SEXO"){
            if(sexonac == ""){
                malsexonac = true
            }
            else{
                malsexonac = false
            }
        }
        if(inputName == "FECHA"){
            if(fechanac == ""){
                malfechanac = true
            } 
            else{
                malfechanac = false
            }
        }
        if(inputName == "MADRE"){
            if(nombremadrenac == ""){
                malmadrenac = true
            }
            else{
                malmadrenac = false
            }
        }
        if(inputName == "COMBOMADRE"){
            if(madrenac != ""){
                onSelectAnimalNacimiento(true)
                malmadrenac = false
            }
        }
        if(inputName == "PADRE"){
            if(nombrepadrenac == ""){
                malpadrenac = true
            }
            else{
                malpadrenac = false
            }
        }
        if(inputName == "COMBOPADRE"){
            if(padrenac != ""){
                onSelectAnimalNacimiento(false)
                malpadrenac = false
            }
        }
        validarBotonNacimiento()

    }
    function oninputTrat(campo){
        validarBotonTrat()
        if(!agregaranimal && campo=="ANIMAL"){
            
            if(isEmpty(animaltrat)){
                malanimaltrat = true
            }
            else{
                malanimaltrat = false
                onSelectAnimalTrat()
            }
        }
        else if(campo == "FECHA"){
            if(isEmpty(fechatrat)){
                malfechatrat = true
            }
            else{
                malfechatrat = false
            }
        }
        
        else if(campo == "TIPO"){
            if(isEmpty(tipotrat)){
                maltipotrat = true
            }
            else{
                maltipotrat = false
            }
        }
    }
    function oninputIns(campo){
        validarBotonIns()
        if(!agregaranimal && campo == "ANIMAL"){
            if(isEmpty(idanimalins)){
                malanimalins = true
            }
            else{
                onSelectAnimalIns()
                malanimalins = false
            }
        }
        if(campo == "PADRE"){
            if(isEmpty(padreins)){
                malpadreins = true
            }
            else{
                onSelectPadreIns()
                malpadreins = false
            }
        }
        if(campo == "FECHAPARTO"){
            if(isEmpty(fechapartoins)){
                malfechapartoins = true
            }
            else{
                malfechapartoins = false
            }
        }
        if(campo == "FECHAINSEMINACION"){
            if(isEmpty(fechainseminacion)){
                malfechainseminacion = true
            }
            else{
                malfechainseminacion = false
                fechapartoins = addDays(fechainseminacion, 280).toISOString().split("T")[0]
            }
        }
    }
    function oninputSer(campo){
        validarBotonSer()
        if(campo == "ANIMAL"){
            if(idanimalser==""){
                malanimalser = true
            }
            else{
                malanimalser = false
                onSelectAnimalSer()
            }
        }
        if(campo == "DESDE"){
            if(fechadesdeserv == ""){
                malfechadesdeser = true
            }
            else{
                malfechadesdeser = false
                fechapartoser = addDays(fechadesdeserv, 280).toISOString().split("T")[0]
            }
        }
    }
    function oninputObs(inputName){
        validarBotonObs()
        if(!agregaranimal && inputName == "ANIMAL"){
            if(isEmpty(animalobs)){
                malanimalobs = true
            }
            else{
                malanimalobs = false
                onSelectAnimalObs()
            }
        }   
        if(inputName == "FECHA"){
            if(isEmpty(fechaobs)){
                malfechaobs = true
            }
            else{
                malfechaobs = false
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
    onMount(async ()=>{
        cab = caber.cab
        let pb_json = JSON.parse(localStorage.getItem('pocketbase_auth'))
        
        usuarioid = pb_json.record.id
        if(cab.exist){
            await getAnimales()
            await getTiposTratamientos()
            await getTotales()
            cargados = true
        }
    })
 
</script>
<Navbarr>
    
    {#if cab.exist}
    
        <CardBase titulo="Bienvenido a fertil" cardsize="max-w-5xl">
            <div class="mx-1 my-2 lg:mx-10 grid grid-cols-2  lg:grid-cols-3 gap-1">
                <StatCard titsize={"text-md"} titulo="Animales" valor={totaleventos.animales}/>
                <StatCard titsize={"text-md"} titulo="Lotes" valor={totaleventos.lotes}/>
                <StatCard titsize={"text-md"} titulo="Rodeos" valor={totaleventos.rodeos}/>
                <StatCard titsize={"text-md"} titulo="Inseminaciones" valor={totaleventos.inseminaciones}/>
                <StatCard titsize={"text-md"} titulo="Servicios" valor={totaleventos.servicios}/>
                <StatCard titsize={"text-md"} titulo="Nacimientos" valor={totaleventos.nacimientos}/>
                <StatCard titsize={"text-md"} titulo="Tratamientos" valor={totaleventos.tratamientos}/>
                <StatCard titsize={"text-md"} titulo="Observaciones" valor={totaleventos.observaciones}/>
                <StatCard titsize={"text-md"} titulo="Pesajes" valor={totaleventos.pesajes}/>
                <StatCard titsize={"text-md"} titulo="Tactos" valor={totaleventos.tactos}/>
            </div>
            <h2 class="text-xl font-bold text-green-700 dark:text-green-400 mb-6 text-start">Opciones</h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <a class={classbutton}
                        href="/establecimiento"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 10000 10000" class="size-10 fill-current mx-2" >
                            <g id="Capa_x0020_1">
                            <metadata id="CorelCorpID_0Corel-Layer"/>
                            <g id="_2649302176">
                            <path class="fil0" d="M2658.99 7373.37c-9.87,9.63 -1.02,15.68 -24.71,19.59 -38.41,6.34 -3.74,8.66 -37.59,-11.04 19.18,-51.4 41.02,-68.72 62.3,-8.55zm-1693.3 -71.94l3.6 -38.22c-62.7,0 -34.3,-24.63 -62.51,12.18l-118.82 -3.6c-8.65,21.78 -14.9,167.26 -19.28,223.98l1726.43 0c69.3,0 113.47,-10.42 170.46,11.09 31.14,11.75 4.89,23.39 52.57,1.15 27.22,-45.77 32.04,-20.24 31.04,-92.67 56.93,24.45 16.6,20.38 108.87,-59.81 33.24,-28.88 68.57,-72.52 103.63,-114.39 38.71,-29.96 39.39,-32.89 71.82,-72.97l228.64 -247.68c19.53,-50.93 16.7,-32.52 55.46,-62.94 26.7,-20.96 39.84,-36.31 59.24,-61.3 37.23,-47.94 80.32,-75.01 105.05,-132.8l208.34 -208.08c38.24,-38.83 63.92,-77.14 105.22,-122.49l327.7 -360.02c24.49,-31.57 28.11,-27.15 52.13,-53.24 18.63,-20.25 31.65,-38.69 49.62,-60.96 38.43,-47.63 64.15,-72.29 103.58,-113.22 13.16,-31.22 -1.44,-4.15 13.49,-24.33 7.92,-10.69 10.69,-10.78 20.66,-24.05 28.99,-38.59 -3.35,-22.37 35.51,-36.99 0,-18.43 -3.05,-12.43 14.12,-11.01l11.34 -10.57 9.89 -12.28 10.11 -12.02 9.65 -12.57 10.1 -11.99 11.96 -9.7c26.31,-45.88 59.73,-83.97 94.55,-114.77 54.55,-21.3 75.33,-89.73 120.75,-123.64 15.2,-22.63 68.93,-92.43 87.56,-108.17l4.85 46.91c-0.22,13.91 5.82,47.96 6.26,50.44 4.41,25.17 -1.5,8.17 -8.78,23.06l-37.03 289.08c-12.42,47.19 -22.32,43.17 -30.54,90.36 52.95,13.12 34.3,50.04 35.24,171.8l11.52 135.97c-2.34,42.16 16.04,16.41 -12.13,34.96 -38.81,25.94 -69.57,18.19 -118.15,19.33 -43.84,1.02 -85.34,0.77 -129.18,0.35 -232.32,-2.27 -165.67,161.86 -178.54,193.75l-24.46 -58.94c-30.78,10.15 -33.69,11.85 -58.32,36.56l-41.45 61.16 501.8 -11.01c42.48,2.19 53.88,0.3 61.32,20.93l-12.03 160.96c0,59.57 -6.22,113.03 9.88,164.43 -47.8,46.41 -219.5,28.26 -288.11,29.92 -83.45,2.01 -174.56,-22.42 -222.81,11.96 -22.41,15.98 -7.84,-1.97 -21.95,25.29 -1.84,-2.97 -3.76,-11.76 -4.68,-9.6 -0.89,2.1 -3.48,-7.17 -4.74,-9.19 -53.69,-85.72 -173.17,-10.97 -293.18,-38.09 -9.78,23.13 5.35,6.95 -20.29,14.82 -27.68,8.49 -16.47,4.46 -42.61,3.59l0.43 -7.98 -200.19 215.44c-10.72,12.38 -8.8,9.1 -16.67,20.88 119.06,0 430.11,21.82 519.23,-8.01l297.76 -4.17c33.34,25.87 237.37,35.3 287.93,13.29l22.35 2.94 -12.42 66.72 0 247.41c2.2,58.23 0.51,115.77 10.31,171.42l-28.73 24.69c-2.01,1.51 -5.67,3.68 -8.46,5.61 36.99,19.26 23.84,9.22 33.5,71.02l2.63 9.97c-3.2,35.36 -16.6,109.26 1.43,133.51l23.06 0c7.61,-184.09 5.86,-365.53 5.93,-550.8l-0.64 -403.84c2.84,-81.41 16.32,-27.45 20.48,-112.25l59.61 24.28 36.89 -50.03c12.35,-6.57 9.48,-1.86 20.3,-11.15l9.37 -131.78c-34.81,-7.69 -30.69,3.1 -47.17,-24.78 -39,15.69 -48.86,-0.16 -41.02,38.3 -13.42,-19.11 -38.54,-22.27 -61.48,-26.29 -31.35,-5.49 -13.48,-12.99 -6.28,-0.14 -0.91,-59.28 3.53,-22.6 10.22,-65.38l1.35 -47.96c-1.9,-47.14 -1.64,-91.94 -1.64,-139.45l-2.33 86.58c18.56,-28.21 13.44,-18.19 19.09,-83.39 -4.98,30.18 -0.81,45.9 14.04,70.06l12.14 -89.79c15.27,-4.75 -23.1,-28.83 19.19,27.97 10.16,-42.46 11.18,-45 51.94,-45.14l19.68 -117.35c-28.58,-1.49 -69.5,-19.62 -86.41,-49.04 51.24,-75.73 52.52,-35.54 101.61,-24.41l0 -1248.55c-44.87,-12.89 -133.13,-42.13 -174.99,4.56 -30.66,34.19 -22.81,183.78 -33.47,240.24l-432.93 0 75.02 6.12c-26.23,44.37 -26.47,30.05 -51,52.59 8.21,23.98 18.45,-20.51 6.22,36.07 -18.91,87.49 5.18,15.33 -32.91,51.2 -14.48,-51.74 -0.16,-72.36 -21.05,-88.5 -0.03,6.79 0.39,37.7 -0.48,40.76 -14.18,49.76 4.66,14.55 -26.82,48.58 -2.87,-56.27 10.4,-80.01 -17.6,-91.18 -6.59,-23.35 -3.36,-28.95 -41.55,-23.55 -22.04,3.12 -29.17,15.51 -42.6,29.05 -2.79,-2.7 -6.39,-5.98 -8.39,-8.08l-13.59 -13.91c-28.98,-34.17 14.73,38.85 -7.8,-14.73 -29.18,68.2 9.28,3.83 -39.66,36.72 -24.94,-48.97 -5.46,-26.98 -51.71,-24.07 -25.28,1.59 -53.28,-16.16 -67.77,-37.07l-349.58 0 71.27 9.48c26.49,-0.39 53.02,-2.96 80.07,-5.55 58.35,-5.57 119.49,-5 178.64,-0.21 -2.42,3.79 -5.27,7.64 -7.91,10.66l-15.54 18.4c-16.54,15.13 4.4,2.11 -23.61,15.2 -11.69,5.46 -34.47,8.99 -42,9.83l-122.58 -1.27c-43.46,-16.13 -68.76,-20.09 -130.46,16.9 16.98,35.04 12.73,12.58 31.21,31.33 34.42,34.95 5.07,33.76 42.14,78.66 22.44,27.19 38.77,36.27 70.26,36.95 73.23,34.88 633.53,-0.06 804.09,-0.06 -12.77,21.49 -50.22,55.33 -71.93,82.68l-146.47 162.12c-25.04,23.55 -54.4,50.49 -69.53,85.68l-1072.91 1.03c-92.17,-2.29 -43.84,-42.9 -108.37,-61.36 -49.08,12.54 -20.97,6.2 -62.69,4.36 -46.26,-2.04 -28.35,6.69 -58.1,10.54 -21.93,2.83 -104.18,0.14 -142.44,3.47 18.12,9.26 13.15,14.8 19.91,29.72 10.79,21.75 -49.28,12.8 -73.78,12.57 -36.6,-0.35 -73.16,-0.33 -109.76,-0.33 -67.45,0 -144.12,-10.78 -208.47,7.12l-30.49 7.43c-18.22,-31.77 -17.3,-40.97 -48.94,-64.48l-180.2 6.87 -8.4 2.06c-30.29,33.49 -35.12,40.71 -88.72,41.79l-377.85 -0.79c-192.81,0 -290.52,12.24 -480.86,12.24 16.13,36.97 22.29,39.65 49.04,67.6 20.27,21.18 34.5,31.57 55.56,54.23 30.89,33.24 76.22,97.9 118.29,109.23 65.64,17.69 328.46,-0.29 416.8,0.23 173.22,1.01 446.23,-13.16 615.48,-0.7 35.01,2.58 63.66,5.25 99.25,4.13 15.91,-0.49 34.85,-2.81 50.06,-2.45l57.24 12.53 382.95 0c26.13,-25.1 254.56,-15.55 294.01,-4.17 146.65,23.97 555.61,-31.07 655.19,16.36l-119.18 122.41c-45.64,41.23 -3.01,29.42 -73.52,80.7 -1.89,1.37 -4.6,2.85 -6.43,4.3 -25.29,20.12 -24.25,32.2 -39.35,49.41l-23.56 19.9c-40.23,32.11 -40.91,50.58 -65.56,66.06l-121.53 -131.68c-27.11,-31.28 -96.73,-108.68 -126.64,-121.78l-277.96 5.01c18.32,18.38 33.46,29.16 51.97,49.55l166.42 186.66 -37.93 0 -41.09 22.84c-9.95,2.05 -47.3,0.7 -59.89,0.5 -82.99,-1.32 -148,-17.46 -189.35,25.97 -30.97,32.54 -36.26,53.68 -78.75,44.78 -20.08,-62.17 23.66,-30.46 -18.11,-62.38 -12.21,-9.33 -68.19,-28.97 -99.65,20.68 -1.07,1.69 -2.68,5.04 -3.61,6.76 -0.89,1.64 -2.23,5.16 -3,6.77l-9.69 21.66c-0.64,0.84 -2.63,3.06 -3.38,3.84l-15.3 11.22c-33.29,21.86 1.59,8.46 -38.65,21.92 15.87,-70.76 26.75,-19.46 38.74,-108.26 -101.22,1.38 -116.3,12.24 -218.36,5.28 -6.53,-0.45 -36.88,-1.08 -49.34,5.25 -44.37,22.55 -17.88,18.22 -34.49,36.76l-91.1 107.83c-10.94,-16.25 -26.36,-19.99 -42.9,-24.54 57.83,-7.64 66.44,-61.36 72.59,-134.58 -131.61,18.32 -177.81,-18.44 -255.38,12.06 -79.14,31.12 7.75,-12.05 -131.13,-9.33l-274.35 -9.05c26.25,99.18 100.38,89.98 141.45,162.74 25.91,37.95 48.37,50.4 78.29,88.32 183.99,0 1383.29,-25.58 1453.73,12.18l-22.84 32.22c-94.01,83.05 -28.43,12.4 -133.37,142.44 -30.23,37.47 -50.45,49.11 -79.74,85.28 -37.45,46.23 -34.48,70.01 -100.74,71.62 -101.28,2.48 -206.72,-1.05 -308.57,-1.02 -73.26,0.02 -250.3,-18.05 -274.23,0 -8.76,60.81 7.53,51.23 -10.87,101.78 -14.41,-25.04 -5.29,-1.64 -7.34,-35.89l-0.27 -51.98c-42.09,-17.55 -109.16,-7.77 -159.14,-3.57 20.78,50.02 107.24,134.01 142.01,164.1 1.74,1.51 4.23,3.41 5.95,4.95 1.7,1.52 4.08,3.59 5.74,5.15l73.84 48.67 323.58 -0.59c19.05,29.41 8.1,12.23 0,36.6 -32.65,21.35 -87.84,93.95 -116.72,125.42l-131.46 131.68c-67.37,-55.63 -217.49,-236.55 -258.1,-268.79 -73.41,-48.97 -121.84,-119 -156.41,-149.78l-150.86 -143.86c-21.5,-20.3 -28.17,-31.94 -47.64,-51.41l-103.07 -105.91c-60.58,-75.97 -479.55,-514.76 -510.82,-520.9 -0.11,-0.02 -20.07,5.03 -23.6,6.82 -42.91,21.73 -21.94,-23.42 -84.32,-93.72 -42.78,-48.22 31.21,-16.96 -66.28,-126.05l-344.32 -346.4c-20.62,-25.82 -46.34,-57.68 -74.56,-69.52 15.65,41.67 28.93,47.54 49.56,81.01 -50.56,-41.71 -35.44,-4.26 -72.26,-65.22 -42.67,-70.63 -34.07,52.79 -49.11,-26.62 -6.11,-32.24 -6.08,-65.78 -12.1,-90.3 -0.8,-31.19 8.09,10.7 -2.11,-36.72l1608.19 -5.81c141.89,-11.56 340.61,-12.6 496.35,-13.02 62.67,16.15 313.46,11.89 382.77,2.47 82.3,-11.18 242.99,-8.12 361.81,-8.12l19.15 -31.87c0.31,-2.23 0.43,-3.24 0.71,-4.85 -36.69,-11.26 -38.68,26.18 -70.89,-22.82 -23.38,-35.56 -22.86,-96.82 -15.59,-115.87l-12.23 -28.05c-2.73,6.2 -7.49,20.85 -8.13,22.28 -8.11,18.29 -7.62,15.75 -12.82,25.73l-23.17 -64.87c6.8,-3.91 14.98,-7.08 22.26,-11.33 23.44,-13.69 2.34,1.73 17.73,-13.15l-2393.54 0c5.29,7.55 11.13,20.89 15.77,24.48 -53.65,100.15 -33.2,83.17 -8.25,199.1 -27.15,-14.19 -46.35,-17.2 -72.38,-70.61 -1.53,3.84 -7.03,17.92 -13.05,25.84 -20.03,26.35 9.67,-1.67 -22.2,21.12 -20.34,-40.49 -28.44,-34.61 -42.98,-84.96l-11.94 -68.43c-2.21,-43.72 0.16,-6.69 0.88,-9.88 -6.5,3.52 -46.95,2.55 -83.69,-13.5l85.85 -23.16 -458.86 -5.08 -50.51 3.35c-1.51,-91.96 -9.85,-115.66 -5.13,-212.52l-30.75 -30.55c-42.84,-21.65 -212.69,-36.34 -213.31,56.15l2.22 482.81c-1.58,65.09 -10.75,92.14 -10.39,170.8l0.13 2152.56c1.51,-3.64 3.16,-13.04 3.75,-11.37 0.59,1.68 2.73,-8.08 3.47,-11.45l9.48 -97.76c1.17,-44.52 2.43,-89.65 2.87,-134.61 0.65,-66.2 -8.5,-220.87 0.24,-270.43 26.97,39.13 5.77,30.49 39.81,38.03 14.7,3.26 41.56,-5.27 69.44,-4.71l9.01 -20.25c27.12,-58.96 16.5,-42.8 36.63,-34.42l25.17 15.24c5.78,2.31 20.95,13.75 43.93,0.01 10.47,-62.89 2.65,-153.85 1.77,-225.31l9.2 -232.5 3.85 -1198.23 1.75 -111.65 39.04 49.09c24.43,22.52 35.37,42.5 62.15,68.27 30.41,29.26 42.69,51.45 75.23,73.24 4.68,-11.47 30.18,20.16 2.91,-26.29 92.7,53.29 2.25,9.75 42.86,51.89l50.07 -0.18c-0.74,31.43 -10.1,33.71 -29.47,57.01 65.13,44.31 62.41,75.15 49.39,204.53 68.12,0 147.03,-15.55 182.01,24.41 8.41,13.41 58.35,62.63 75.14,78.78 30.59,29.43 53.62,53.64 82.44,81.95 58.44,57.41 109.99,103.7 167.13,169.76 -40.67,23.53 -426.52,17.09 -502.03,12.24 -4.59,46.7 1.48,97.57 2.19,129.48 0.45,20.25 -4.39,67.23 -5.58,115.32l200.23 0c-17.93,-46.73 -4.88,-8 -16.64,-55.35 53.8,-1.51 55.63,2.7 68.72,55.35 87.4,0 240.86,23.41 315.6,-12.18 62.06,0 170.18,-21.75 216.76,26.25l36.58 59.37c47.12,58.68 133.47,131.99 190.38,187.3 64.21,62.42 49.54,36.14 52.64,81.98l-344.7 0c-3.54,13.45 -16.82,48.33 -20.02,53.39 -20.21,31.93 -14.64,19.7 -50.37,32.23l18.05 -85.62c-44.13,0 -57.96,6.36 -89.39,-12.24l96.59 -113.47c39.12,-46.46 70.98,-61.42 101.95,-119.41 -370.94,-29.9 -294.51,22.84 -343.11,80.19 -25.9,30.56 -57.7,28.14 -73.87,79.19l-26.85 9.84c-0.75,0.33 -3.1,1.51 -4.57,2.46 -34.68,103.87 -105.06,80.61 -227.1,75.02 -47.18,28.82 -60.63,6.46 -111.61,11.11 0.06,32.36 2.49,87.18 2.39,111.71 -0.08,19.45 -5.17,67.89 -4.32,108.16l699.79 0.06c-33.3,-27.65 -28.23,-10.16 -32.6,-61.91 69.88,6.51 61.33,16.96 82.1,74.09 93.82,0 527.16,-17.57 579.31,7.93l118.7 122.92c20.05,20.78 23.89,20.47 44.06,43.6 36.25,41.56 141.22,143.48 161.34,180.51 -66.18,0 -132.37,-0.09 -198.55,0.01 -73.99,0.11 -125.97,-12.25 -185.01,-12.25 -9.4,40.43 -11.09,44.17 -44.44,52.2l-3.71 -52.2 -970.93 0 -5.56 19.02c12.12,34.08 3.46,0.94 7.32,40.56 0.21,2.11 -0.01,6.19 0.15,8.1l-10.23 31.99c-2.29,2.93 -28.44,-9.54 -37.77,-10.42l25.48 28.58c1.67,1.85 4.87,5.03 7.08,7.84 -17.41,13.1 -9.33,15.77 -13.95,26.15 -0.73,1.65 -1.51,5.43 -2.37,7.08 -19.3,36.72 17.17,-0.79 -16.86,20.27 -16.55,-9.13 -20.49,12.33 -19.44,-42.65 -17.98,8.18 -49.1,-1.72 -72.03,-11.55 24.16,-19.51 43.08,-21.42 59.08,7.08 3.01,-26.53 1.71,-38.81 39.12,-62.97 -25.16,-16.62 -6.42,7.01 -17.31,-30.86zm1792.2 85.57l19.86 -36.94c12.21,-13.31 9.52,-10.38 25.05,-13.35l0 47.79 -44.91 2.5zm-697.86 -539.95c29.44,-49.5 44.61,-40.47 67.24,-0.88 -23.12,40.7 -34.69,57.15 -67.24,0.88zm94.11 -30.43c33.51,-2.16 35.8,1.27 42.02,40.13 -40.84,7.64 -39.01,8.43 -42.02,-40.13zm2020.89 5.95c2.68,-7.93 -3.01,-41.05 28.32,-38.4 27.13,2.3 18.21,11.74 23.37,44.23 -15.86,6.01 -13.72,19.42 -51.69,-5.83zm-3090.95 -54.76c31.26,20.37 17.19,3.29 29.85,41.7 -28.75,12.93 -38.06,8.4 -59.11,-3.05 26.77,-20.5 19.74,-29.31 29.26,-38.65zm1043.73 -10.43c18.2,23.66 12.79,4.05 30.6,39.87l-59.29 16.21 28.69 -56.08zm1582.16 -547.27c30.7,15.62 36.48,12.51 26.02,61.36 -20.97,7.36 -30.78,18.79 -46.13,-11.94 0.81,0.03 2.11,-0.13 2.32,0.87 0.29,1.44 35.46,6.27 28.14,-29.99 -0.51,-2.51 -8.65,-16.8 -10.35,-20.3zm-2243.92 -174.85c0.6,1.32 28.61,5.93 -3.36,59.08 -14.96,-7.63 -34.42,7.1 -28.67,-42.48 4.86,-41.93 19.38,-20.35 32.03,-16.6zm-178.37 16.19c23.61,-25.65 -31.38,-26.06 26.15,-18.99 25.47,3.12 13.94,5.69 27.98,18.99 -9.41,15.47 11.32,27.27 -27.71,25.11 -36.52,-2.02 -18.13,-11.31 -26.42,-25.11zm2865.02 -219.48c-15.07,53.86 8.65,38.79 -43.16,47.9 15.42,-51.06 1.52,-28.27 43.16,-47.9zm-87.66 -48.2c22.74,7.91 33.78,11.81 46.77,35.12 -8.2,13.36 -27.59,39.27 -45.12,30.68 -16.68,-8.18 -4.34,-38.78 -1.65,-65.8zm-1916.82 -139.5c7.79,-27.08 -7.42,-18.37 29.32,-34.74 -6.63,47.79 19.34,20.89 -29.32,34.74zm-1136.94 -51.8l25.85 36.97 -46.51 8.18c18.72,-36.21 14.49,-12.14 20.66,-45.15zm-64.89 -10.81c-10.14,42.46 8.16,24.7 -38.93,29.08 0.08,-0.28 -3.18,-57.53 38.93,-29.08zm3433.49 7.92c-19.41,68.67 -67.52,68.28 -117.7,45.4 15.32,-37.83 5.8,-20.06 15.13,-25.09l31.42 -38.89 36.07 13.94c34.28,4.52 29.42,-14.8 35.08,4.64zm-4026.64 -207.88c-43.84,-7.44 0.08,2.87 -31.53,-30.14 -34.75,-36.29 -40.49,0.47 -61.96,-55.57 21.52,-19.27 72.26,-19.12 82.87,-15.08 26.75,10.19 60.93,109.34 10.62,100.79zm4423.17 -348.72l-10.42 -12.68c11.92,4.58 43.31,16.19 53.46,28.62 37.33,45.7 -0.68,63.9 -0.93,64.34 -57.58,20.59 -27.61,-42.32 -42.11,-80.28zm79.11 -10.11c-56.52,-32.21 -7.23,16.7 -29.12,-24.12 -26.61,-49.63 15.03,-24.99 2.3,-35.8l-15.88 -13.11c13.33,-66.06 9.42,-51.98 35,-68.72 7.14,13.53 8.35,6.32 11.92,31.59 1.91,13.49 -0.43,23.35 -0.99,36.88 -1,24.58 -2.27,49.77 -3.23,73.28z"/>
                            <path class="fil0" d="M4262.12 7025.23c42.1,99.75 166.3,180.76 178.69,237.98 -109.37,0 -722.67,8.5 -833.87,-2.54 -44.83,10.17 -21.02,-16.11 -35.35,33.98l-10.75 -31.41 -258.47 5.06c-29.47,70 -51.68,56.76 -91.38,106 -29.34,36.4 -47.91,72.93 -89.94,110.28l27.4 23.43 1404.55 12.24 212.1 -8.84 2.63 9.97 -2.63 -9.97c-9.66,-61.8 3.49,-51.76 -33.5,-71.02 2.79,-1.93 6.45,-4.1 8.46,-5.61l28.73 -24.69c-9.8,-55.65 -8.11,-113.19 -10.31,-171.42 -4.74,6.91 5.88,28.65 -46.51,-27.38l-171.89 -181.63c-85.94,-16.02 -189.72,-10.3 -277.96,-4.43z"/>
                            <path class="fil0" d="M2425.62 6933.22c27.85,-22.65 84.54,-15.69 117.66,-10.96 152.88,21.84 308.71,-15.41 388.62,22.65 8.1,-24.37 19.05,-7.19 0,-36.6l-323.58 0.59 -73.84 -48.67c-1.66,-1.56 -4.04,-3.63 -5.74,-5.15 -1.72,-1.54 -4.21,-3.44 -5.95,-4.95 -34.77,-30.09 -121.23,-114.08 -142.01,-164.1 49.98,-4.2 117.05,-13.98 159.14,3.57l0.27 51.98c2.05,34.25 -7.07,10.85 7.34,35.89 18.4,-50.55 2.11,-40.97 10.87,-101.78 -38.84,-24.54 -100.44,-4.91 -181.97,-11.48 -69.64,-5.6 -153.26,-11.1 -218.8,11.42 -10.26,-49.32 18.29,12.17 -12.74,-33l-10.42 -11.51c-1.58,-1.65 -4.19,-3.45 -5.84,-5.02l-268.85 -293.13 164.38 0c-29.92,-37.92 -52.38,-50.37 -78.29,-88.32 -93.12,-92.68 -96.04,-23.88 -185.37,-66.2 -16.07,-54.72 14.07,-67.92 -63.93,-73.18l3.18 -31.49c-9.49,-14.8 -21.47,-16.34 -32.24,-22.33l2.96 -36.72c-54.13,12.22 -28.85,15.97 -68.8,48.96l-160.15 -157.51c-27.71,-27.46 -52.47,-53.78 -81.26,-83.57l-76.25 -89.41c213.84,0 393.17,12.24 605.55,12.24 7.09,14.25 10.51,-13.81 0,36.66l104.85 2.85c-0.39,0.64 -2.23,3.62 -2.76,4.47l-25.47 41.13c2.57,-1.28 6.3,-7.13 7.47,-4.49 1.14,2.59 5.74,-3.47 7.28,-4.51l37.68 -27.2c19.58,29.82 9.22,21.29 38.29,39.52l51.05 -6.04c24.18,-14.76 20.09,-17.54 42.7,-41.78 4.35,-4.67 44.15,-42.15 44.98,-42.66 39,-23.52 434.65,-10.19 496.1,-10.19l-57.24 -12.53c-15.21,-0.36 -34.15,1.96 -50.06,2.45 -35.59,1.12 -64.24,-1.55 -99.25,-4.13 -169.25,-12.46 -442.26,1.71 -615.48,0.7 -88.34,-0.52 -351.16,17.46 -416.8,-0.23 -42.07,-11.33 -87.4,-75.99 -118.29,-109.23 -21.06,-22.66 -35.29,-33.05 -55.56,-54.23 -26.75,-27.95 -32.91,-30.63 -49.04,-67.6 -67.24,0 -140.5,-9.71 -203.86,12.18 -6.32,-42.16 -7.75,-41.32 -30.88,-59.54l-30.12 -24.12c-1.52,-1.77 -3.36,-4.63 -4.8,-6.49l-29.14 -37.34c-84.3,-80.47 -30.87,-58.25 -151.38,-141.73 6.02,24.52 5.99,58.06 12.1,90.3 15.04,79.41 6.44,-44.01 49.11,26.62 36.82,60.96 21.7,23.51 72.26,65.22 -20.63,-33.47 -33.91,-39.34 -49.56,-81.01 28.22,11.84 53.94,43.7 74.56,69.52l344.32 346.4c97.49,109.09 23.5,77.83 66.28,126.05 62.38,70.3 41.41,115.45 84.32,93.72 3.53,-1.79 23.49,-6.84 23.6,-6.82 31.27,6.14 450.24,444.93 510.82,520.9l103.07 105.91c19.47,19.47 26.14,31.11 47.64,51.41l150.86 143.86c34.57,30.78 83,100.81 156.41,149.78zm-470.01 -1098.5l9.32 -1.77 -9.32 1.77z"/>
                            <path class="fil0" d="M4792.22 7654.89l164.18 0c0.62,-585.15 -9.31,-1136.17 -9.31,-1725.78 -49.09,-11.13 -50.37,-51.32 -101.61,24.41 16.91,29.42 57.83,47.55 86.41,49.04l-19.68 117.35c-40.76,0.14 -41.78,2.68 -51.94,45.14 -42.29,-56.8 -3.92,-32.72 -19.19,-27.97l-12.14 89.79c-14.85,-24.16 -19.02,-39.88 -14.04,-70.06 -5.65,65.2 -0.53,55.18 -19.09,83.39l2.33 -86.58c0,47.51 -0.26,92.31 1.64,139.45l-1.35 47.96c-6.69,42.78 -11.13,6.1 -10.22,65.38 -7.2,-12.85 -25.07,-5.35 6.28,0.14 22.94,4.02 48.06,7.18 61.48,26.29 -7.84,-38.46 2.02,-22.61 41.02,-38.3 16.48,27.88 12.36,17.09 47.17,24.78l-9.37 131.78c-10.82,9.29 -7.95,4.58 -20.3,11.15l-36.89 50.03 -59.61 -24.28c-4.16,84.8 -17.64,30.84 -20.48,112.25l0.64 403.84c-0.07,185.27 1.68,366.71 -5.93,550.8z"/>
                            <path class="fil0" d="M550.89 7495.77l217.79 0c4.38,-56.72 10.63,-202.2 19.28,-223.98l118.82 3.6c-15.32,-23.9 3.47,-24.42 -79.42,-24.42l117.17 -137.75c64.16,-61.84 31.04,-9.25 128.21,-134.98 52.45,-67.85 63.44,-45.51 201.34,-45.51l179.41 1.77c70.32,-7.44 30.95,7.23 48.91,-26.19l-29.69 0 -699.79 -0.06c-0.85,-40.27 4.24,-88.71 4.32,-108.16 0.1,-24.53 -2.33,-79.35 -2.39,-111.71 50.98,-4.65 64.43,17.71 111.61,-11.11 -68.82,-2.33 -138.7,10.68 -208.66,9.9 -60.68,-0.67 -86.03,-9.92 -124.26,98.68l33.19 16.89c12.8,3.27 16.08,-0.62 20.7,-3.24l-65.25 12.98c33.27,91.8 -16.87,-10.1 -9.07,108.01l274.25 15.93 -69.39 81.99c0,28.2 7.13,24.42 -9.93,24.42l-9.93 12.24 -9.93 12.24 -11.82 11.37 -12.32 9.09 -11.56 9.93 -10.47 10.49c-25.68,45.98 -51.08,44.67 -64.3,107.48 67.17,36.01 35.27,12.63 94.87,-18.87 -59.99,70.24 -36.97,52.37 -140.94,81.94 0.44,31.96 1.49,50.04 6.25,60.93l18.41 34.63c0.49,-2.02 1.98,5.72 2.88,8.62 47.47,-46.46 14,-14.57 19.86,-30.04 21.18,16.52 12.16,13.58 38.18,24.13 -39.35,29.84 -4.02,16.78 -31.71,28.75 -10.31,4.46 -25.19,6.81 -43.63,-2.06l-10.99 92.07z"/>
                            <path class="fil0" d="M231.73 7542.88c0,118.19 -22.92,112.83 119.07,112.12 113.48,-0.57 139.23,36.56 126.34,-110.27 12.42,-170.2 6.39,-360.17 0.99,-503.22l12.19 -231.18c0.7,-85.61 -1.07,-171.73 -3.82,-256.98l-9.2 232.5c0.88,71.46 8.7,162.42 -1.77,225.31 -22.98,13.74 -38.15,2.3 -43.93,-0.01l-25.17 -15.24c-20.13,-8.38 -9.51,-24.54 -36.63,34.42l-9.01 20.25c-27.88,-0.56 -54.74,7.97 -69.44,4.71 -34.04,-7.54 -12.84,1.1 -39.81,-38.03 -8.74,49.56 0.41,204.23 -0.24,270.43 -0.44,44.96 -1.7,90.09 -2.87,134.61l-9.48 97.76c-0.74,3.37 -2.88,13.13 -3.47,11.45 -0.59,-1.67 -2.24,7.73 -3.75,11.37z"/>
                            <path class="fil0" d="M662.01 7108.19l10.47 -10.49 11.56 -9.93 12.32 -9.09 11.82 -11.37 9.93 -12.24 9.93 -12.24c17.06,0 9.93,3.78 9.93,-24.42 -27.71,0 -22.56,-6.8 -9.93,24.42 -26.41,-16.24 -23.1,-20.32 -9.93,12.24 -26.4,-16.24 -23.09,-20.32 -9.93,12.24 -25.33,-15.58 -22.98,-21.56 -11.82,11.37 -22.17,-14 -20.52,-20.84 -12.32,9.09 -19.71,-10.36 -17.14,-15.59 -11.56,9.93 -17.95,-7.56 -15.17,-12.03 -10.47,10.49l-50.53 47.97c-1.53,1.68 -3.64,4.19 -5.24,5.78 -1.61,1.6 -3.96,3.77 -5.65,5.27l-80.97 71.52c0,-67.82 3.97,-98.82 8.48,-148.67 5.13,-56.75 -1.6,-111.03 5.01,-169.57 -7.8,-118.11 42.34,-16.21 9.07,-108.01l65.25 -12.98c-4.62,2.62 -7.9,6.51 -20.7,3.24l-33.19 -16.89c38.23,-108.6 63.58,-99.35 124.26,-98.68 69.96,0.78 139.84,-12.23 208.66,-9.9 122.04,5.59 192.42,28.85 227.1,-75.02 -2.38,2.13 -5.79,1.87 -6.94,6.71 -12.25,51.64 28.52,-26.23 -29.46,32.71l-547.61 21.78 0 -330.48 30.33 0c-24.25,-50.7 -17.34,-61.48 -16.34,-112.89 0.38,-19.21 -7.32,-61.78 -4.76,-119.53l250.19 -12.38c75.51,4.85 461.36,11.29 502.03,-12.24l-771.38 0c1.01,-56.08 10.4,-95.46 9.98,-171.3 -0.33,-59.38 7.19,-148.17 2.33,-171.43l2.4 -249.09 -23.7 -7.95c-1.05,-17.98 -1.44,-46.81 -3.98,-63.79l-16.3 -57.25 -3.85 1198.23c2.75,85.25 4.52,171.37 3.82,256.98l-12.19 231.18c5.4,143.05 11.43,333.02 -0.99,503.22 29.66,-7.51 55.28,-15.27 73.75,-48.96l10.99 -92.07c18.44,8.87 33.32,6.52 43.63,2.06 27.69,-11.97 -7.64,1.09 31.71,-28.75 -26.02,-10.55 -17,-7.61 -38.18,-24.13 -5.86,15.47 27.61,-16.42 -19.86,30.04 -0.9,-2.9 -2.39,-10.64 -2.88,-8.62l-18.41 -34.63c-4.76,-10.89 -5.81,-28.97 -6.25,-60.93 103.97,-29.57 80.95,-11.7 140.94,-81.94 -59.6,31.5 -27.7,54.88 -94.87,18.87 13.22,-62.81 38.62,-61.5 64.3,-107.48z"/>
                            <path class="fil0" d="M3924.61 6320.79c51.28,24.42 659.42,23.51 734.6,6.34l101.37 10.93c-7.44,-20.63 -18.84,-18.74 -61.32,-20.93l-501.8 11.01 41.45 -61.16c24.63,-24.71 27.54,-26.41 58.32,-36.56l24.46 58.94c12.87,-31.89 -53.78,-196.02 178.54,-193.75 43.84,0.42 85.34,0.67 129.18,-0.35 48.58,-1.14 79.34,6.61 118.15,-19.33l-656.92 0 -17.58 11.54c-67.6,38.43 -53.58,26.51 -120.19,108.58 1.81,1.72 5.63,-0.22 6.47,2.76 0.79,2.84 5.16,2.09 6.24,2.24 1,0.14 4.76,1.15 5.95,1.24l24.11 -3.96c-23.33,31.87 -29.78,21.68 -64.8,44.14 -29.98,19.23 -38.32,38.35 -59.63,61.92 11.34,9.41 4.45,6.67 24.56,12.95 10.2,3.19 21.41,2.84 28.84,3.45z"/>
                            <path class="fil0" d="M1889.56 5782.1c-23.84,-1.8 5.21,-23.03 -37.27,15.13 -11.94,10.73 -18.23,23.79 -32.23,36.74l138.94 -2.78c-35.67,70.34 -47.91,90.3 -118.07,118.45l-50.65 -69.62c-24.34,0.75 -75.2,61.72 -97.79,88.41 -24.2,28.61 -21.16,30.4 -22.02,46.3l-2.96 36.72c10.77,5.99 22.75,7.53 32.24,22.33l-3.18 31.49c78,5.26 47.86,18.46 63.93,73.18 89.33,42.32 92.25,-26.48 185.37,66.2 -41.07,-72.76 -115.2,-63.56 -141.45,-162.74l274.35 9.05c138.88,-2.72 51.99,40.45 131.13,9.33 77.57,-30.5 123.77,6.26 255.38,-12.06 -6.15,73.22 -14.76,126.94 -72.59,134.58 16.54,4.55 31.96,8.29 42.9,24.54l91.1 -107.83c16.61,-18.54 -9.88,-14.21 34.49,-36.76 12.46,-6.33 42.81,-5.7 49.34,-5.25 102.06,6.96 117.14,-3.9 218.36,-5.28 -11.99,88.8 -22.87,37.5 -38.74,108.26 40.24,-13.46 5.36,-0.06 38.65,-21.92l15.3 -11.22c0.75,-0.78 2.74,-3 3.38,-3.84l9.69 -21.66c0.77,-1.61 2.11,-5.13 3,-6.77 0.93,-1.72 2.54,-5.07 3.61,-6.76 31.46,-49.65 87.44,-30.01 99.65,-20.68 41.77,31.92 -1.97,0.21 18.11,62.38 42.49,8.9 47.78,-12.24 78.75,-44.78 41.35,-43.43 106.36,-27.29 189.35,-25.97 12.59,0.2 49.94,1.55 59.89,-0.5l41.09 -22.84 -1411.42 0 -29.78 0c8.82,-16.25 9.52,-13.54 17.62,-27.05 16.6,-27.7 8.38,-5.32 20.76,-40.97l18.45 -1.14 10.63 -8.98 2.03 -11.66 -2.03 11.66 -10.63 8.98 -18.45 1.14 -35.66 15.56 -49.06 -69.95c22.14,-36.24 5.16,-12.49 32.06,-33.3 44.39,-34.33 2.66,16.47 17.73,-16.63l6.4 -20.6c17.26,-37.15 13.63,-14.72 36.35,-48.27l9.32 -1.77 91.97 0.92c-29.07,-18.23 -18.71,-9.7 -38.29,-39.52l-37.68 27.2c-1.54,1.04 -6.14,7.1 -7.28,4.51 -1.17,-2.64 -4.9,3.21 -7.47,4.49l25.47 -41.13c0.53,-0.85 2.37,-3.83 2.76,-4.47l-104.85 -2.85z"/>
                            <path class="fil0" d="M3726.06 6437.62c15.48,36.81 22.91,40.16 47.07,70.19 6.95,8.64 18.67,24.72 24.78,30.71 29.56,29.01 5.74,13.31 27.42,16.91 50.55,22.56 20.98,5.22 49.22,59.39 15.3,29.33 27.88,36.76 48.41,58.92 -28.71,0.62 -40.45,-0.38 -62.9,18.41 26.14,0.87 14.93,4.9 42.61,-3.59 25.64,-7.87 10.51,8.31 20.29,-14.82 120.01,27.12 239.49,-47.63 293.18,38.09 1.26,2.02 3.85,11.29 4.74,9.19 0.92,-2.16 2.84,6.63 4.68,9.6 14.11,-27.26 -0.46,-9.31 21.95,-25.29 48.25,-34.38 139.36,-9.95 222.81,-11.96 68.61,-1.66 240.31,16.49 288.11,-29.92 -55.89,21.04 -422.6,22.99 -506.35,12.38 -52.86,-6.7 -169.99,-154.3 -215.65,-211.47 -11.39,-14.26 -18.49,-24.27 -30.73,-36.04l-41.39 -27.38 -16.34 -7.72c-36.07,-22.48 -66.6,10.05 -105.68,21.52 14.64,40.24 68.21,98.17 4.5,52.74 -59.37,-42.33 -35.55,-42.81 -120.73,-29.86z"/>
                            <path class="fil0" d="M3333.21 6920.49l310.42 0c7.87,-11.78 5.95,-8.5 16.67,-20.88l200.19 -215.44 -75.38 -7.79 -247.66 11.32 -17.28 32.43c-41.61,79.24 -21.56,-16.12 -32.31,77.96 30.38,28.54 52.59,24.11 90.84,24.42 -14.51,-20.35 -38.34,-13.33 -70.39,-12.53l-86.23 13.95c-68.32,30.24 -60.36,42.54 -98.17,66.31 8.73,27.73 -4.18,20.56 9.3,30.25z"/>
                            <path class="fil0" d="M2807.49 7508.01l340.96 0 -27.4 -23.43c42.03,-37.35 60.6,-73.88 89.94,-110.28 39.7,-49.24 61.91,-36 91.38,-106l-303.6 9.29c-38.02,77 14.71,10.35 -60.86,55.94 -36.37,21.94 -29.8,27.7 -0.42,43.29 -25.86,7.28 -32.77,11.36 -45.92,31.98l-5.35 12.85c-30.13,70.01 -40.5,9.26 -78.73,86.36z"/>
                            <path class="fil0" d="M4748.55 5414.21l0 74.19 -178.69 0c-7.63,-15.8 -8.37,0.91 0,-23.24 -34.82,30.8 -68.24,68.89 -94.55,114.77l-11.96 9.7 -10.1 11.99 -9.65 12.57 -10.11 12.02 -9.89 12.28 -11.34 10.57c-17.17,-1.42 -14.12,-7.42 -14.12,11.01l14.12 -11.01 11.34 -10.57c13.84,0.96 10.45,4.94 9.89,-12.28l10.11 -12.02 9.65 -12.57 10.1 -11.99 11.96 -9.7 28.39 -7.5c3.79,23.22 9.12,16.51 -12.9,37.45 -11.08,10.54 -26.95,13 -40.52,25.63 -37.18,34.6 -6.79,48.36 -58.39,74.8l39.12 22.89 281.92 0c8.22,-47.19 18.12,-43.17 30.54,-90.36l37.03 -289.08c7.28,-14.89 13.19,2.11 8.78,-23.06 -0.44,-2.48 -6.48,-36.53 -6.26,-50.44 -7.35,9.32 -6.66,42.03 -8.64,61.03 -0.52,4.93 -6.66,46.63 -7.58,49.33 -11.28,33.06 9.94,3.41 -18.25,23.59z"/>
                            <path class="fil0" d="M668.52 5434.07c21.6,25.31 23.69,22.49 39.72,54.33l-173.91 -4.29 -2.4 249.09c156.54,0 277.62,12.24 434.36,12.24 -34.98,-39.96 -113.89,-24.41 -182.01,-24.41 13.02,-129.38 15.74,-160.22 -49.39,-204.53 19.37,-23.3 28.73,-25.58 29.47,-57.01l-50.07 0.18c-40.61,-42.14 49.84,1.4 -42.86,-51.89 27.27,46.45 1.77,14.82 -2.91,26.29z"/>
                            <path class="fil0" d="M559.88 6332.97l225.7 0c1.19,-48.09 6.03,-95.07 5.58,-115.32 -0.71,-31.91 -6.78,-82.78 -2.19,-129.48l-250.19 12.38c-2.56,57.75 5.14,100.32 4.76,119.53 -1,51.41 -7.91,62.19 16.34,112.89z"/>
                            <path class="fil0" d="M2677.22 5277.02l6.86 16.78 7.95 11c62.63,53.74 73.43,97.55 145.45,159.12 -6.76,-14.92 -1.79,-20.46 -19.91,-29.72 38.26,-3.33 120.51,-0.64 142.44,-3.47 29.75,-3.85 11.84,-12.58 58.1,-10.54 41.72,1.84 13.61,8.18 62.69,-4.36 -19.81,-38.17 -133.99,-168.12 -158.83,-177.77 -32.06,11.88 -27.9,4.38 -52.98,7.17 -1.24,0.13 -4.18,-0.05 -5.24,0.2l-7.67 3.46c-1.32,0.86 -6.31,10.45 -8.49,13.52 -1.98,-2.66 28.08,-29.82 -37.72,-10.57l-37.48 17.34c-33.65,8.1 -66.71,-7.45 -95.17,7.84z"/>
                            <path class="fil0" d="M2921.97 5238.06c-1.66,-2.59 -4.67,-9.25 -5.56,-7.17l-34.15 -55.08c-155.74,0.42 -354.46,1.46 -496.35,13.02 -11.24,26.3 -10.29,26.4 -19.86,54.71 50.69,-1.07 103.42,3.03 139.96,3.6 66.06,1.03 41.65,-27.96 103.02,20.94 19.69,-8.95 12.35,-9.38 32.98,-7.3l35.21 16.24c-4.27,19.38 -8.06,14.99 6.86,16.78l7.95 11 -7.95 -11 -6.86 -16.78c28.46,-15.29 61.52,0.26 95.17,-7.84l37.48 -17.34c65.8,-19.25 35.74,7.91 37.72,10.57 2.18,-3.07 7.17,-12.66 8.49,-13.52l7.67 -3.46c1.06,-0.25 4,-0.07 5.24,-0.2 25.08,-2.79 20.92,4.71 52.98,-7.17z"/>
                            <path class="fil0" d="M2316.37 5304.74l-9.93 12.24 -10.48 12.24 -12.03 9.75 -12.85 9.91 -11.94 9.66 -11.08 10.27c-22.51,48.94 7.16,22.91 -36.7,41.14l-10.72 10.66 -14.8 9.15 0 3.34 180.2 -6.87c31.64,23.51 30.72,32.71 48.94,64.48l30.49 -7.43c21.73,-55.08 48.67,-60.32 70.19,-105.04 0,-27.18 -6.64,-22.83 11.38,-22.83l13 -8.49 10.79 -11.95 8.59 -11.85 12.48 -10.48 7.95 -11.97 7.56 -16.34 2.45 2.28c-24.35,9.82 -25.22,13.4 -45.12,26.74 -50.26,-19.98 -63.22,-25.91 -124.54,-15.58l-103.83 6.97z"/>
                            <path class="fil0" d="M1820.06 5833.97c-26.7,31.34 0.44,-5.86 -13.19,15.91 -14.24,22.74 -0.89,-1.95 -16.59,30.14l50.65 69.62c70.16,-28.15 82.4,-48.11 118.07,-118.45l-138.94 2.78zm127.73 173.94l18.45 -1.14 10.63 -8.98 2.03 -11.66c45.2,-61.29 98.49,-92.21 129.05,-158.3l-51.05 6.04 -91.97 -0.92 -9.32 1.77c-22.72,33.55 -19.09,11.12 -36.35,48.27l-6.4 20.6c-15.07,33.1 26.66,-17.7 -17.73,16.63 -26.9,20.81 -9.92,-2.94 -32.06,33.3l49.06 69.95 35.66 -15.56z"/>
                            <path class="fil0" d="M2718.14 7508.01l89.35 0c38.23,-77.1 48.6,-16.35 78.73,-86.36l5.35 -12.85c13.15,-20.62 20.06,-24.7 45.92,-31.98 -29.38,-15.59 -35.95,-21.35 0.42,-43.29 75.57,-45.59 22.84,21.06 60.86,-55.94l303.6 -9.29 258.47 -5.06 10.75 31.41c14.33,-50.09 -9.48,-23.81 35.35,-33.98 -84.31,-52.28 -517.11,29.73 -645.26,-19.53 -35.06,41.87 -70.39,85.51 -103.63,114.39 -92.27,80.19 -51.94,84.26 -108.87,59.81 1,72.43 -3.82,46.9 -31.04,92.67z"/>
                            <path class="fil0" d="M3560.22 4994.75c-7.27,19.05 -7.79,80.31 15.59,115.87 32.21,49 34.2,11.56 70.89,22.82 -0.28,1.61 -0.4,2.62 -0.71,4.85l-19.15 31.87c16.18,0 57.04,3.18 70.88,1.77 70.73,-7.17 30.35,7.02 48.2,-26.19 -31.49,-0.68 -47.82,-9.76 -70.26,-36.95 -37.07,-44.9 -7.72,-43.71 -42.14,-78.66 -18.48,-18.75 -14.23,3.71 -31.21,-31.33 61.7,-36.99 87,-33.03 130.46,-16.9l122.58 1.27c7.53,-0.84 30.31,-4.37 42,-9.83 28.01,-13.09 7.07,-0.07 23.61,-15.2l15.54 -18.4c2.64,-3.02 5.49,-6.87 7.91,-10.66 -59.15,-4.79 -120.29,-5.36 -178.64,0.21 -27.05,2.59 -53.58,5.16 -80.07,5.55l-71.27 -9.48 -40.57 0 36.25 24.48c-26.61,54.96 -12.07,39.22 -49.89,44.91z"/>
                            <path class="fil0" d="M4262.12 7025.23c88.24,-5.87 192.02,-11.59 277.96,4.43 -13.37,-21.28 -29.93,-31.32 -47.64,-50.39 -3.35,-3.6 -18.27,-21.29 -19.94,-24.4 -17.08,-31.79 -11.37,-4.72 -11.88,-46.56l-297.76 4.17c11.36,29.8 70.48,99.17 99.26,112.75z"/>
                            <path class="fil0" d="M3690.23 6455.37c29.06,-18.89 12.42,-17.65 35.83,-17.75 85.18,-12.95 61.36,-12.47 120.73,29.86 63.71,45.43 10.14,-12.5 -4.5,-52.74 39.08,-11.47 69.61,-44 105.68,-21.52l16.34 7.72c0,-27.79 3.94,-21.73 -16.34,-7.72 -7.27,-57.11 3.73,3.84 -7.43,-30.78l-15.93 -41.65c-7.43,-0.61 -18.64,-0.26 -28.84,-3.45 -20.11,-6.28 -13.22,-3.54 -24.56,-12.95 21.31,-23.57 29.65,-42.69 59.63,-61.92 35.02,-22.46 41.47,-12.27 64.8,-44.14l-24.11 3.96c-1.19,-0.09 -4.95,-1.1 -5.95,-1.24 -1.08,-0.15 -5.45,0.6 -6.24,-2.24 -0.84,-2.98 -4.66,-1.04 -6.47,-2.76 66.61,-82.07 52.59,-70.15 120.19,-108.58l17.58 -11.54 -46.91 0c19.93,-35.21 58.11,-62.69 79.42,-103.07l-327.7 360.02c-41.3,45.35 -66.98,83.66 -105.22,122.49z"/>
                            <path class="fil0" d="M1144.98 6589.95c16.17,-51.05 47.97,-48.63 73.87,-79.19 48.6,-57.35 -27.83,-110.09 343.11,-80.19 30.97,-24.92 7.13,-14.27 44.87,-24.16l-36.58 -59.37c-46.58,-48 -154.7,-26.25 -216.76,-26.25 -17.5,53.02 -33.32,62.31 -77.12,102.19l-42.1 45.01c-1.37,1.87 -3.15,4.77 -4.52,6.67 -45.18,62.75 -46.36,40.08 -67.26,63.54 -39.46,44.28 -20.02,3.65 -17.51,51.75z"/>
                            <path class="fil0" d="M1150.32 4925.36l-151.99 0 -85.85 23.16c36.74,16.05 77.19,17.02 83.69,13.5 -0.72,3.19 -3.09,-33.84 -0.88,9.88l11.94 68.43c14.54,50.35 22.64,44.47 42.98,84.96 31.87,-22.79 2.17,5.23 22.2,-21.12 6.02,-7.92 11.52,-22 13.05,-25.84 26.03,53.41 45.23,56.42 72.38,70.61 -24.95,-115.93 -45.4,-98.95 8.25,-199.1 -4.64,-3.59 -10.48,-16.93 -15.77,-24.48z"/>
                            <path class="fil0" d="M3481.89 6663.45c-24.73,57.79 -67.82,84.86 -105.05,132.8 -19.4,24.99 -32.54,40.34 -59.24,61.3 -38.76,30.42 -35.93,12.01 -55.46,62.94l71.07 0c-13.48,-9.69 -0.57,-2.52 -9.3,-30.25 37.81,-23.77 29.85,-36.07 98.17,-66.31l86.23 -13.95c32.05,-0.8 55.88,-7.82 70.39,12.53 -38.25,-0.31 -60.46,4.12 -90.84,-24.42 10.75,-94.08 -9.3,1.28 32.31,-77.96l17.28 -32.43 247.66 -11.32 75.38 7.79 -0.43 7.98c22.45,-18.79 34.19,-17.79 62.9,-18.41 -20.53,-22.16 -33.11,-29.59 -48.41,-58.92 -28.24,-54.17 1.33,-36.83 -49.22,-59.39 1.82,2.82 4.72,3.22 5.68,8.26 0.94,4.96 4.25,6.24 5.53,8.16l19.48 29.95c1.33,2.1 3.02,4.92 4.31,6.97 15.36,24.45 22.5,32.59 34.49,54.68l-412.93 0z"/>
                            <path class="fil0" d="M4305.7 4925.36l-341.69 0c14.49,20.91 42.49,38.66 67.77,37.07 46.25,-2.91 26.77,-24.9 51.71,24.07 48.94,-32.89 10.48,31.48 39.66,-36.72 22.53,53.58 -21.18,-19.44 7.8,14.73l13.59 13.91c2,2.1 5.6,5.38 8.39,8.08 13.43,-13.54 20.56,-25.93 42.6,-29.05 38.19,-5.4 34.96,0.2 41.55,23.55 28,11.17 14.73,34.91 17.6,91.18 31.48,-34.03 12.64,1.18 26.82,-48.58 0.87,-3.06 0.45,-33.97 0.48,-40.76 20.89,16.14 6.57,36.76 21.05,88.5 38.09,-35.87 14,36.29 32.91,-51.2 12.23,-56.58 1.99,-12.09 -6.22,-36.07 24.53,-22.54 24.77,-8.22 51,-52.59l-75.02 -6.12z"/>
                            <path class="fil0" d="M3130.44 5775.37c15.28,38.26 14.8,29.8 39.71,64.35l277.96 -5.01c-10.39,-27.44 -2.7,-17 -27,-28.06 9.59,-8.73 5.56,18.34 -6.81,-7.96 -11.64,-24.74 -6.55,3.29 -10.95,-34.02 -50.38,0.23 -83.4,-13.85 -142.15,-5.82 -31.15,4.27 -96.98,16.55 -130.76,16.52z"/>
                            <path class="fil0" d="M2316.37 5304.74l-9.93 12.24c-26.2,-16.11 -23.01,-20.58 -10.48,12.24 -23.92,-15.14 -22.55,-22.21 -12.03,9.75 -21.46,-12.13 -19.04,-18.34 -12.85,9.91 -18.2,-9.42 -15.13,-14.11 -11.94,9.66 -16.01,-6.26 -12.61,-10.15 -11.08,10.27 -38.48,6.26 -30.32,2.12 -36.7,41.14 -18.55,-9.53 -15.23,-13.46 -10.72,10.66 -16.9,-7.19 -12.65,-11.65 -14.8,9.15l-8.4 5.4 8.4 -2.06 0 -3.34 14.8 -9.15 10.72 -10.66c43.86,-18.23 14.19,7.8 36.7,-41.14l11.08 -10.27 11.94 -9.66 12.85 -9.91 12.03 -9.75 10.48 -12.24 9.93 -12.24 103.83 -6.97c61.32,-10.33 74.28,-4.4 124.54,15.58 19.9,-13.34 20.77,-16.92 45.12,-26.74l-2.45 -2.28 -7.56 16.34 -7.95 11.97 -12.48 10.48 -8.59 11.85 -10.79 11.95 -13 8.49c-18.02,0 -11.38,-4.35 -11.38,22.83 26.02,0 21.57,7.09 11.38,-22.83 21.55,12.9 20.11,20.35 13,-8.49 19.55,9.14 15.9,13.05 10.79,-11.95 19.07,9.07 15.26,11.86 8.59,-11.85 19.04,7.77 16.22,13.26 12.48,-10.48 17.36,6.09 13.88,9.15 7.95,-11.97 21.44,6.1 16.16,8.92 7.56,-16.34 24.75,-1.24 18.16,8.21 21.62,-16.25 -61.37,-48.9 -36.96,-19.91 -103.02,-20.94 -36.54,-0.57 -89.27,-4.67 -139.96,-3.6 -74.61,2.28 -49.68,61.09 -49.68,61.2z"/>
                            <path class="fil0" d="M3130.44 5775.37c33.78,0.03 99.61,-12.25 130.76,-16.52 58.75,-8.03 91.77,6.05 142.15,5.82 4.4,37.31 -0.69,9.28 10.95,34.02 12.37,26.3 16.4,-0.77 6.81,7.96 -3.97,-24.06 5.3,2.81 -5.74,-21.55 -0.33,-0.72 -9.73,-16.5 -12.02,-20.43 -36.82,-18.66 -16.43,2.08 -34.66,-35.64 -39.45,-11.38 -267.88,-20.93 -294.01,4.17 6.78,7.45 16.51,22.42 23.08,28.18 19.21,16.85 7.64,14.18 32.68,13.99z"/>
                            <path class="fil0" d="M539.47 4920.28c-19.3,-37.77 -9.92,-132.28 -9.92,-190.76 -24.29,-20.05 -44.09,-38.12 -76.47,-48.96l30.75 30.55c-4.72,96.86 3.62,120.56 5.13,212.52l50.51 -3.35z"/>
                            <path class="fil0" d="M4475.31 5579.93l-11.96 9.7 -10.1 11.99 -9.65 12.57 -10.11 12.02c0.56,17.22 3.95,13.24 -9.89,12.28l-11.34 10.57 -14.12 11.01c-38.86,14.62 -6.52,-1.6 -35.51,36.99 -9.97,13.27 -12.74,13.36 -20.66,24.05 -14.93,20.18 -0.33,-6.89 -13.49,24.33 17.21,0 36.98,1.38 53.71,0.9 7.03,-0.2 21.44,-0.57 27.89,-2.18 19.9,-4.96 10.19,-2.62 20.93,-10.96l-39.12 -22.89c51.6,-26.44 21.21,-40.2 58.39,-74.8 13.57,-12.63 29.44,-15.09 40.52,-25.63 22.02,-20.94 16.69,-14.23 12.9,-37.45l-28.39 7.5z"/>
                            <path class="fil0" d="M1017.42 7282.23c-17.39,19.97 -6.48,-25.93 -19.6,35.17l-32.13 -15.97c10.89,37.87 -7.85,14.24 17.31,30.86 -37.41,24.16 -36.11,36.44 -39.12,62.97 -16,-28.5 -34.92,-26.59 -59.08,-7.08 22.93,9.83 54.05,19.73 72.03,11.55 -1.05,54.98 2.89,33.52 19.44,42.65 34.03,-21.06 -2.44,16.45 16.86,-20.27 0.86,-1.65 1.64,-5.43 2.37,-7.08 4.62,-10.38 -3.46,-13.05 13.95,-26.15 -2.21,-2.81 -5.41,-5.99 -7.08,-7.84l-25.48 -28.58c9.33,0.88 35.48,13.35 37.77,10.42l10.23 -31.99c-0.16,-1.91 0.06,-5.99 -0.15,-8.1 -3.86,-39.62 4.8,-6.48 -7.32,-40.56z"/>
                            <path class="fil0" d="M259.75 5295.99c21.47,56.04 27.21,19.28 61.96,55.57 31.61,33.01 -12.31,22.7 31.53,30.14 50.31,8.55 16.13,-90.6 -10.62,-100.79 -10.61,-4.04 -61.35,-4.19 -82.87,15.08z"/>
                            <path class="fil0" d="M490.35 5355.12l16.3 57.25c2.54,16.98 2.93,45.81 3.98,63.79l23.7 7.95 -3.19 -191.55 -39.04 -49.09 -1.75 111.65z"/>
                            <path class="fil0" d="M4379.88 5589.58c-5.66,-19.44 -0.8,-0.12 -35.08,-4.64l-36.07 -13.94 -31.42 38.89c-9.33,5.03 0.19,-12.74 -15.13,25.09 50.18,22.88 98.29,23.27 117.7,-45.4z"/>
                            <path class="fil0" d="M3560.22 4994.75c37.82,-5.69 23.28,10.05 49.89,-44.91l-36.25 -24.48 -30 0c-15.39,14.88 5.71,-0.54 -17.73,13.15 -7.28,4.25 -15.46,7.42 -22.26,11.33l23.17 64.87c5.2,-9.98 4.71,-7.44 12.82,-25.73 0.64,-1.43 5.4,-16.08 8.13,-22.28l12.23 28.05z"/>
                            <path class="fil0" d="M4812.82 4949.84l15.88 13.11c12.73,10.81 -28.91,-13.83 -2.3,35.8 21.89,40.82 -27.4,-8.09 29.12,24.12 0.96,-23.51 2.23,-48.7 3.23,-73.28 0.56,-13.53 2.9,-23.39 0.99,-36.88 -3.57,-25.27 -4.78,-18.06 -11.92,-31.59 -25.58,16.74 -21.67,2.66 -35,68.72z"/>
                            <path class="fil0" d="M4690.61 5341.52l57.44 -61.86 0.5 134.55c28.19,-20.18 6.97,9.47 18.25,-23.59 0.92,-2.7 7.06,-44.4 7.58,-49.33 1.98,-19 1.29,-51.71 8.64,-61.03l-4.85 -46.91c-18.63,15.74 -72.36,85.54 -87.56,108.17z"/>
                            <path class="fil0" d="M4818.52 5113.26c0.25,-0.44 38.26,-18.64 0.93,-64.34 -10.15,-12.43 -41.54,-24.04 -53.46,-28.62l10.42 12.68c14.5,37.96 -15.47,100.87 42.11,80.28z"/>
                            <path class="fil0" d="M4769.16 7654.89c-18.03,-24.25 -4.63,-98.15 -1.43,-133.51l-2.63 -9.97 -212.1 8.84 155.84 0c16.43,30.25 28.54,32.57 37.95,63.44 3.04,9.96 3.51,23.4 7.86,40.07 8.93,34.26 -0.6,15.92 14.51,31.13z"/>
                            <path class="fil0" d="M1505.15 6675.69l-52.34 0 -18.05 85.62c35.73,-12.53 30.16,-0.3 50.37,-32.23 3.2,-5.06 16.48,-39.94 20.02,-53.39z"/>
                            <path class="fil0" d="M1472.71 6908.31l29.69 0 19.81 12.18c-20.77,-57.13 -12.22,-67.58 -82.1,-74.09 4.37,51.75 -0.7,34.26 32.6,61.91z"/>
                            <path class="fil0" d="M2060.03 6847.05c32.55,56.27 44.12,39.82 67.24,-0.88 -22.63,-39.59 -37.8,-48.62 -67.24,0.88z"/>
                            <path class="fil0" d="M985.81 6332.97l52.08 0c-13.09,-52.65 -14.92,-56.86 -68.72,-55.35 11.76,47.35 -1.29,8.62 16.64,55.35z"/>
                            <path class="fil0" d="M2596.69 7381.92c33.85,19.7 -0.82,17.38 37.59,11.04 23.69,-3.91 14.84,-9.96 24.71,-19.59 -21.28,-60.17 -43.12,-42.85 -62.3,8.55z"/>
                            <path class="fil0" d="M4065.04 5783.77c-2.69,27.02 -15.03,57.62 1.65,65.8 17.53,8.59 36.92,-17.32 45.12,-30.68 -12.99,-23.31 -24.03,-27.21 -46.77,-35.12z"/>
                            <path class="fil0" d="M1462.69 6094.34c31.97,-53.15 3.96,-57.76 3.36,-59.08 -12.65,-3.75 -27.17,-25.33 -32.03,16.6 -5.75,49.58 13.71,34.85 28.67,42.48z"/>
                            <path class="fil0" d="M4175.03 6822.57c37.97,25.25 35.83,11.84 51.69,5.83 -5.16,-32.49 3.76,-41.93 -23.37,-44.23 -31.33,-2.65 -25.64,30.47 -28.32,38.4z"/>
                            <path class="fil0" d="M4748.55 6499.02l12.03 -160.96 -101.37 -10.93c21.08,24.36 -28.95,13.06 38.95,19.45 10.79,1.02 37.43,-1.37 50.39,-1.37l0 153.81z"/>
                            <path class="fil0" d="M965.69 7301.43l32.13 15.97c13.12,-61.1 2.21,-15.2 19.6,-35.17l5.56 -19.02 -53.69 0 -3.6 38.22z"/>
                            <path class="fil0" d="M1287.68 6051.45c8.29,13.8 -10.1,23.09 26.42,25.11 39.03,2.16 18.3,-9.64 27.71,-25.11 -14.04,-13.3 -2.51,-15.87 -27.98,-18.99 -57.53,-7.07 -2.54,-6.66 -26.15,18.99z"/>
                            <path class="fil0" d="M2042.06 7263.21l-48.15 0 3.71 52.2c33.35,-8.03 35.04,-11.77 44.44,-52.2z"/>
                            <path class="fil0" d="M1054.82 6806.46c21.05,11.45 30.36,15.98 59.11,3.05 -12.66,-38.41 1.41,-21.33 -29.85,-41.7 -9.52,9.34 -2.49,18.15 -29.26,38.65z"/>
                            <path class="fil0" d="M3709.97 6210.11c1.7,3.5 9.84,17.79 10.35,20.3 7.32,36.26 -27.85,31.43 -28.14,29.99 -0.21,-1 -1.51,-0.84 -2.32,-0.87 15.35,30.73 25.16,19.3 46.13,11.94 10.46,-48.85 4.68,-45.74 -26.02,-61.36z"/>
                            <path class="fil0" d="M2158.41 6797.25c-17.81,-35.82 -12.4,-16.21 -30.6,-39.87l-28.69 56.08 59.29 -16.21z"/>
                            <path class="fil0" d="M2196.16 6856.75c-6.22,-38.86 -8.51,-42.29 -42.02,-40.13 3.01,48.56 1.18,47.77 42.02,40.13z"/>
                            <path class="fil0" d="M2802.8 7384.5l0 -47.79c-15.53,2.97 -12.84,0.04 -25.05,13.35l-19.86 36.94 44.91 -2.5z"/>
                            <path class="fil0" d="M4109.54 5879.87c51.81,-9.11 28.09,5.96 43.16,-47.9 -41.64,19.63 -27.74,-3.16 -43.16,47.9z"/>
                            <path class="fil0" d="M946.39 5581.66c-42.11,-28.45 -38.85,28.8 -38.93,29.08 47.09,-4.38 28.79,13.38 38.93,-29.08z"/>
                            <path class="fil0" d="M4748.55 6921.6c0,6.43 -0.71,37.52 0.73,45.94 5.06,29.56 -0.84,10.05 9.2,23.72l12.42 -66.72 -22.35 -2.94z"/>
                            <path class="fil0" d="M1011.28 5592.47c-6.17,33.01 -1.94,8.94 -20.66,45.15l46.51 -8.18 -25.85 -36.97z"/>
                            <path class="fil0" d="M2148.22 5644.27c48.66,-13.85 22.69,13.05 29.32,-34.74 -36.74,16.37 -21.53,7.66 -29.32,34.74z"/>
                            </g>
                            <g id="_2649077848">
                            <path class="fil0" d="M7331.79 7399.83c9.78,9.73 0.91,15.69 24.5,19.84 38.26,6.73 3.68,8.7 37.56,-10.66 -18.78,-51.58 -40.44,-69.13 -62.06,-9.18zm1688.78 -54.63l-3.33 -38.26c62.51,0.65 34.36,-24.28 62.25,12.82l118.48 -2.38c8.48,21.86 13.74,167.4 17.73,224.17l-1721.33 -17.65c-69.1,-0.71 -113.07,-11.58 -170.04,9.35 -31.12,11.43 -5.03,23.34 -52.42,0.61 -26.83,-46.05 -31.8,-20.56 -30.32,-92.98 -56.93,23.87 -16.7,20.21 -108.16,-60.92 -32.94,-29.23 -67.87,-73.22 -102.55,-115.45 -38.39,-30.35 -39.05,-33.29 -71.12,-73.7l-226.3 -250.01c-19.13,-51.12 -16.43,-32.68 -54.88,-63.51 -26.48,-21.23 -39.48,-36.71 -58.65,-61.9 -36.8,-48.32 -79.58,-75.83 -103.85,-133.87l-206.33 -210.2c-37.87,-39.22 -63.21,-77.79 -104.09,-123.56l-324.32 -363.36c-24.21,-31.82 -27.85,-27.43 -51.61,-53.77 -18.45,-20.44 -31.3,-39.01 -49.07,-61.46 -38,-48.02 -63.48,-72.95 -102.52,-114.27 -12.91,-31.36 1.46,-4.14 -13.29,-24.48 -7.82,-10.77 -10.58,-10.89 -20.43,-24.26 -28.65,-38.88 3.49,-22.33 -35.16,-37.35 0.12,-18.43 3.13,-12.39 -14,-11.15l-11.24 -10.68 -9.77 -12.39 -10.01 -12.12 -9.54 -12.67 -9.99 -12.09 -11.86 -9.82c-25.92,-46.15 -58.99,-84.58 -93.5,-115.73 -54.24,-21.86 -74.51,-90.5 -119.56,-124.87 -15.01,-22.79 -68.1,-93.13 -86.58,-109.06l-5.15 46.86c0.13,13.91 -6.12,47.89 -6.58,50.37 -4.56,25.12 1.44,8.19 8.61,23.15l34.98 289.45c12.07,47.32 21.96,43.39 29.84,90.67 -52.89,12.57 -34.53,49.68 -36.29,171.42l-12.4 135.86c2.05,42.18 -16.1,16.24 11.87,35.07 38.51,26.35 69.24,18.91 117.67,20.54 43.71,1.47 85.08,1.65 128.79,1.67 231.65,0.11 164.09,163.56 176.72,195.58l24.78 -58.7c30.62,10.47 33.51,12.2 57.91,37.17l40.91 61.57 -500.25 -16.14c-42.36,1.76 -53.71,-0.25 -61.27,20.31l10.91 161.07c-0.4,59.57 5.45,113.09 -10.95,164.33 47.35,46.9 218.66,30.5 287.05,32.86 83.2,2.86 174.2,-20.64 222.08,14.24 22.23,16.2 7.83,-1.89 21.72,25.51 1.84,-2.95 3.82,-11.72 4.72,-9.55 0.88,2.1 3.52,-7.13 4.8,-9.15 54.1,-85.16 172.73,-9.19 292.56,-35.09 9.6,23.23 -5.38,6.9 20.13,15.03 27.55,8.78 16.4,4.63 42.46,4.03l-0.37 -7.98 198.15 217.47c10.6,12.5 8.72,9.19 16.48,21.05 -118.7,-1.21 -428.98,17.42 -517.63,-13.32l-296.86 -7.2c-33.42,25.52 -236.91,32.86 -287.17,10.34l-22.3 2.72 11.93 66.84 -1.65 247.4c-2.59,58.2 -1.29,115.76 -11.43,171.31l28.47 24.98c2,1.53 5.63,3.73 8.4,5.7 -37,18.88 -23.83,8.97 -33.88,70.67l-2.68 9.94c2.95,35.4 15.81,109.43 -2.32,133.5l-23 -0.24c-6.35,-184.17 -3.39,-365.58 -2.22,-550.84l3.35 -403.82c-2.29,-81.44 -16.09,-27.62 -19.67,-112.46l-59.6 23.67 -36.45 -50.41c-12.26,-6.69 -9.43,-1.95 -20.15,-11.35l-8.46 -131.87c34.75,-7.34 30.57,3.41 47.19,-24.3 38.78,16.09 48.72,0.34 40.64,38.72 13.51,-18.97 38.57,-21.87 61.47,-25.66 31.31,-5.17 13.53,-12.85 6.27,-0.08 1.31,-59.27 -3.37,-22.63 -9.75,-65.48l-1.02 -47.98c2.2,-47.11 2.25,-91.92 2.57,-139.42l1.74 86.6c-18.32,-28.4 -13.28,-18.33 -18.47,-83.58 4.75,30.23 0.49,45.91 -14.48,69.91l-11.5 -89.91c-15.19,-4.91 23.23,-28.59 -19.32,27.77 -9.84,-42.56 -10.85,-45.11 -51.48,-45.67l-18.84 -117.55c28.5,-1.19 69.43,-18.9 86.48,-48.14 -50.57,-76.26 -52.12,-36.09 -101.14,-25.46l8.36 -1248.5c44.83,-12.43 133.03,-40.77 174.45,6.34 30.34,34.51 21.51,184.01 31.77,240.58l431.65 4.42 -74.84 5.36c25.85,44.63 26.18,30.31 50.49,53.11 -8.35,23.89 -18.26,-20.7 -6.44,36 18.26,87.68 -5.27,15.28 32.47,51.54 14.78,-51.59 0.64,-72.36 21.58,-88.28 -0.02,6.79 -0.64,37.69 0.21,40.75 13.8,49.92 -4.75,14.51 26.4,48.86 3.25,-56.24 -9.82,-80.11 18.17,-91 6.73,-23.28 3.54,-28.92 41.58,-23.12 21.96,3.34 28.98,15.8 42.28,29.48 2.8,-2.67 6.41,-5.91 8.42,-7.99l13.64 -13.77c29.13,-33.88 -14.95,38.7 7.88,-14.65 28.64,68.49 -9.28,3.73 39.3,37.12 25.19,-48.71 5.62,-26.92 51.72,-23.54 25.19,1.85 53.22,-15.61 67.81,-36.37l348.55 3.57 -71.12 8.75c-26.41,-0.66 -52.85,-3.5 -79.8,-6.37 -58.13,-6.16 -119.1,-6.22 -178.11,-2.03 2.39,3.81 5.2,7.69 7.81,10.73l15.38 18.57c16.38,15.3 -4.4,2.06 23.43,15.43 11.62,5.59 34.32,9.35 41.81,10.26l122.23 -0.01c43.44,-15.69 68.69,-19.39 129.97,18.23 -17.17,34.87 -12.79,12.45 -31.33,31.01 -34.55,34.6 -5.29,33.71 -42.55,78.23 -22.56,26.95 -38.9,35.87 -70.3,36.23 -73.25,34.13 -631.65,-6.54 -801.71,-8.28 12.58,21.62 49.7,55.84 71.16,83.41l144.95 163.62c24.81,23.8 53.9,51.04 68.76,86.38l1069.73 11.99c91.91,-1.34 43.99,-42.44 108.45,-60.24 48.86,13.04 20.88,6.41 62.48,5 46.14,-1.57 28.22,6.98 57.86,11.13 21.84,3.05 103.88,1.2 142,4.92 -18.13,9.08 -13.21,14.67 -20.06,29.52 -10.9,21.64 49.05,13.3 73.49,13.32 36.49,0.03 72.94,0.43 109.43,0.8 67.25,0.69 143.77,-9.31 207.81,9.24l30.35 7.75c18.38,-31.58 17.52,-40.79 49.23,-63.98l179.61 8.71 8.37 2.14c29.98,33.81 34.74,41.07 88.17,42.71l376.75 3.07c192.24,1.97 289.58,15.21 479.35,17.15 -16.32,36.8 -22.49,39.42 -49.35,67.1 -20.35,20.97 -34.61,31.22 -55.75,53.66 -31.02,32.92 -76.65,97.12 -118.68,108.02 -65.57,17.01 -327.49,-3.65 -415.57,-4.04 -172.71,-0.75 -444.82,-17.72 -613.65,-6.99 -34.93,2.22 -63.51,4.6 -98.99,3.12 -15.86,-0.66 -34.73,-3.16 -49.9,-2.96l-57.15 11.95 -381.81 -3.92c-25.89,-25.37 -253.71,-18.15 -293.12,-7.18 -146.38,22.47 -553.76,-36.74 -653.36,9.66l118 123.63c45.23,41.7 2.8,29.45 72.76,81.45 1.88,1.39 4.57,2.9 6.39,4.37 25.07,20.37 23.96,32.44 38.89,49.81l23.37 20.14c39.89,32.52 40.44,50.99 64.92,66.72l122.05 -130.43c27.24,-31.01 97.18,-107.69 127.09,-120.48l277.1 7.85c-18.39,18.19 -33.55,28.82 -52.15,49.02l-167.18 184.94 37.82 0.39 40.81 23.27c9.91,2.15 47.16,1.18 59.71,1.11 82.76,-0.48 147.68,-15.95 188.62,27.91 30.66,32.85 35.79,54.04 78.22,45.57 20.44,-61.96 -23.39,-30.7 18.47,-62.19 12.24,-9.21 68.18,-28.27 99.22,21.7 1.06,1.7 2.63,5.07 3.55,6.8 0.88,1.64 2.19,5.18 2.96,6.79l9.51 21.77c0.63,0.84 2.59,3.08 3.34,3.87l15.18 11.38c33.04,22.2 -1.64,8.44 38.39,22.31 -15.35,-70.92 -26.54,-19.73 -37.9,-108.65 100.91,2.41 115.87,13.43 217.68,7.51 6.52,-0.38 36.78,-0.71 49.16,5.75 44.08,23 17.7,18.41 34.14,37.11l90.1 108.76c11.02,-16.13 26.42,-19.71 42.95,-24.1 -57.61,-8.23 -65.84,-62.04 -71.47,-135.32 131.09,19.67 177.4,-16.62 254.54,14.68 78.69,31.92 -7.64,-12.13 130.8,-7.99l273.6 -6.25c-26.83,98.91 -100.69,88.95 -142.12,161.28 -26.09,37.69 -48.57,49.91 -78.65,87.52 -183.45,-1.88 -1379.03,-39.71 -1449.52,-2.68l22.56 32.46c93.17,84 28.26,12.69 132.02,143.8 29.89,37.77 49.97,49.62 78.93,86.08 37.03,46.62 33.91,70.36 99.97,72.66 100.96,3.51 206.11,1.06 307.66,2.13 73.04,0.77 249.69,-15.49 273.42,2.8 8.33,60.9 -7.85,51.15 10.16,101.89 14.53,-24.89 5.28,-1.58 7.55,-35.81l0.62 -51.98c42.08,-17.12 108.89,-6.66 158.7,-1.94 -21.06,49.8 -107.82,132.9 -142.7,162.64 -1.74,1.49 -4.24,3.37 -5.96,4.89 -1.7,1.5 -4.09,3.54 -5.76,5.09l-73.95 47.91 -322.61 -3.89c-19.2,29.21 -8.17,12.15 -0.25,36.6 32.41,21.67 86.94,94.84 115.54,126.61l130.18 133.02c67.55,-54.94 218.44,-234.33 259.14,-266.15 73.53,-48.22 122.28,-117.75 156.96,-148.18l151.37 -142.31c21.57,-20.08 28.3,-31.65 47.85,-50.92l103.47 -104.85c60.91,-75.35 481.58,-509.84 512.81,-515.67 0.1,-0.02 19.97,5.24 23.48,7.07 42.64,22.17 22.03,-23.19 84.7,-92.86 42.97,-47.78 -31.01,-17.27 66.92,-125.37l345.63 -342.87c20.73,-25.6 46.59,-57.2 74.81,-68.75 -15.89,41.51 -29.16,47.25 -49.95,80.5 50.68,-41.2 35.35,-3.9 72.48,-64.48 43.02,-70.19 33.61,53.14 49.14,-26.11 6.3,-32.18 6.5,-65.72 12.67,-90.18 1.01,-31.19 -8.14,10.61 2.34,-36.7l-1603.39 -22.25c-141.4,-13.01 -339.52,-16.07 -494.8,-18.08 -62.59,15.51 -312.61,8.68 -381.66,-1.45 -81.98,-12.02 -242.21,-10.6 -360.68,-11.81l-18.88 -32.07c-0.3,-2.23 -0.41,-3.25 -0.68,-4.86 36.66,-10.88 38.39,26.57 70.83,-22.09 23.56,-35.32 23.45,-96.58 16.33,-115.71l12.37 -27.92c2.69,6.22 7.34,20.92 7.96,22.36 7.97,18.37 7.5,15.82 12.61,25.86l23.54 -64.63c-6.75,-3.98 -14.89,-7.23 -22.11,-11.55 -23.28,-13.93 -2.35,1.69 -17.6,-13.34l2386.47 24.46c-5.32,7.5 -11.23,20.78 -15.88,24.32 52.82,100.69 32.54,83.51 6.89,199.18 27.17,-13.92 46.32,-16.73 72.63,-69.87 1.5,3.85 6.9,17.99 12.85,25.97 19.79,26.56 -9.63,-1.77 21.99,21.35 20.55,-40.28 28.58,-34.32 43.42,-84.51l12.37 -68.31c2.49,-43.7 -0.12,-6.7 -0.82,-9.89 6.46,3.58 46.8,3.03 83.54,-12.64l-85.45 -24.04 457.54 -0.39 50.34 3.86c2.13,-91.93 10.6,-115.56 6.54,-212.46l30.87 -30.23c42.85,-21.22 212.3,-34.17 212.3,58.33l-5.45 482.77c1.14,65.1 10.1,92.25 9.21,170.9l-14.56 2152.49c-1.48,-3.66 -3.06,-13.08 -3.66,-11.41 -0.6,1.66 -2.66,-8.12 -3.38,-11.49l-8.8 -97.85c-0.87,-44.54 -1.81,-89.67 -1.95,-134.64 -0.21,-66.21 9.95,-220.77 1.57,-270.43 -27.15,38.86 -5.96,30.44 -39.95,37.63 -14.68,3.11 -41.4,-5.7 -69.2,-5.42l-8.85 -20.35c-26.65,-59.23 -16.17,-42.96 -36.3,-34.79l-25.19 14.99c-5.78,2.25 -20.98,13.53 -43.8,-0.44 -10.02,-63 -1.61,-153.87 -0.25,-225.32l-7.62 -232.59 4.19 -1198.22 -0.99 -111.67 -39.26 48.69c-24.51,22.27 -35.54,42.14 -62.42,67.64 -30.52,28.94 -42.91,51 -75.5,72.46 -4.59,-11.52 -30.23,19.85 -2.73,-26.32 -92.78,52.34 -2.31,9.73 -43.07,51.45l-49.93 -0.69c0.53,31.44 9.85,33.81 29,57.31 -65.23,43.64 -62.72,74.51 -50.61,204.01 -67.92,-0.69 -146.49,-17.04 -181.64,22.56 -8.47,13.32 -58.6,62.03 -75.44,78 -30.7,29.12 -53.82,53.1 -82.75,81.11 -58.65,56.81 -110.36,102.58 -167.78,168.04 40.4,23.96 425.16,21.45 500.47,17.38 4.27,46.74 -2.13,97.54 -3.05,129.45 -0.59,20.25 3.92,67.27 4.79,115.37l-199.64 -2.05c18.19,-46.54 4.92,-7.94 16.96,-55.18 -53.63,-2.05 -55.48,2.14 -68.88,54.65 -87.15,-0.89 -240.31,20.95 -314.59,-15.4 -61.88,-0.64 -169.53,-23.49 -216.3,24.03l-36.87 58.99c-47.37,58.2 -133.95,130.62 -191.07,185.36 -64.44,61.76 -49.64,35.63 -53.03,81.43l343.68 3.53c3.44,13.48 16.44,48.5 19.6,53.59 19.94,32.14 14.46,19.85 50.01,32.74l-17.43 -85.8c44,0.45 57.75,6.95 89.21,-11.33l-95.54 -114.45c-38.7,-46.86 -70.36,-62.14 -100.85,-120.45 370.04,-26.11 293.49,25.85 341.56,83.7 25.62,30.82 57.34,28.73 73.12,79.94l26.7 10.11c0.75,0.34 3.08,1.54 4.54,2.51 33.88,104.23 104.21,81.68 225.93,77.34 46.85,29.3 60.41,7.08 111.21,12.25 -0.28,32.36 -3.07,87.15 -3.13,111.68 -0.06,19.46 4.69,67.95 3.58,108.2l-697.72 -7.09c33.38,-27.31 28.21,-9.87 32.91,-61.58 -69.72,5.8 -61.26,16.34 -82.35,73.26 -93.55,-0.96 -525.49,-22.96 -577.65,2.01l-119.18 121.7c-20.13,20.57 -23.95,20.22 -44.22,43.14 -36.42,41.19 -141.77,142.03 -162.07,178.86 65.99,0.68 131.98,1.26 197.96,2.04 73.77,0.86 125.68,-10.96 184.54,-10.36 9.11,40.52 10.77,44.28 43.96,52.66l4.05 -52.17 968.06 9.93 5.42 19.07c-12.31,33.96 -3.45,0.91 -7.57,40.49 -0.22,2.1 -0.03,6.19 -0.21,8.09l9.99 32.1c2.27,2.95 28.42,-9.26 37.73,-10.03l-25.59 28.31c-1.69,1.83 -4.89,4.98 -7.11,7.77 17.26,13.28 9.19,15.86 13.73,26.29 0.71,1.65 1.46,5.45 2.32,7.1 18.99,36.92 -17.12,-0.96 16.67,20.44 16.56,-8.95 20.34,12.54 19.67,-42.44 17.87,8.36 48.96,-1.23 71.89,-10.81 -23.96,-19.76 -42.81,-21.87 -58.95,6.47 -2.83,-26.57 -1.44,-38.83 -38.59,-63.36 25.2,-16.37 6.35,7.06 17.47,-30.69zm-1787.48 67.25l-19.56 -37.15c-12.08,-13.43 -9.42,-10.47 -24.88,-13.59l-0.32 47.78 44.76 2.96zm699.42 -532.8c-29.02,-49.8 -44.21,-40.92 -67.04,-1.57 22.79,40.94 34.21,57.5 67.04,1.57zm-93.63 -31.39c-33.39,-2.5 -35.7,0.9 -42.16,39.7 40.67,8.05 38.83,8.82 42.16,-39.7zm-2014.96 -14.71c-2.62,-7.95 3.27,-41.01 -27.98,-38.68 -27.07,2.02 -18.23,11.55 -23.6,43.98 15.78,6.18 13.55,19.57 51.58,-5.3zm3082.19 -23.16c-31.31,20.05 -17.17,3.11 -30.05,41.39 28.58,13.22 37.9,8.78 58.96,-2.45 -26.55,-20.76 -19.48,-29.5 -28.91,-38.94zm-1040.58 -21.1c-18.3,23.47 -12.78,3.92 -30.78,39.56l59.01 16.81 -28.23 -56.37zm-1573.82 -563.42c-30.71,15.31 -36.45,12.14 -26.35,61.09 20.85,7.57 30.56,19.1 46.07,-11.47 -0.8,0.03 -2.11,-0.15 -2.32,0.84 -0.3,1.44 -35.39,5.91 -27.85,-30.26 0.52,-2.52 8.74,-16.72 10.45,-20.2zm2238.47 -151.91c-0.61,1.31 -28.57,5.64 2.95,59.11 14.96,-7.48 34.27,7.45 28.87,-42.18 -4.57,-41.98 -19.18,-20.55 -31.82,-16.93zm177.73 18.01c-23.37,-25.89 31.47,-25.74 -25.94,-19.26 -25.42,2.87 -13.94,5.55 -28.03,18.71 9.28,15.56 -11.47,27.15 27.46,25.39 36.42,-1.64 18.15,-11.12 26.51,-24.84zm-2855.09 -248.75c14.66,54.01 -8.88,38.7 42.72,48.33 -15.03,-51.21 -1.33,-28.28 -42.72,-48.33zm87.73 -47.31c-22.73,7.69 -33.76,11.47 -46.87,34.64 8.09,13.45 27.24,39.55 44.78,31.14 16.69,-8 4.59,-38.73 2.09,-65.78zm1912.1 -119.9c-7.59,-27.16 7.51,-18.29 -29.01,-35.04 6.29,47.86 -19.42,20.69 29.01,35.04zm1133.93 -40.18l-26.03 36.7 46.32 8.66c-18.42,-36.4 -14.37,-12.29 -20.29,-45.36zm64.76 -10.14c9.83,42.55 -8.3,24.62 38.63,29.48 -0.09,-0.29 3.55,-57.5 -38.63,-29.48zm-3423.4 -27.17c18.89,68.86 66.86,68.96 117.05,46.59 -15.03,-37.98 -5.65,-20.11 -14.92,-25.24l-31.06 -39.21 -36.06 13.57c-34.21,4.18 -29.24,-15.1 -35.01,4.29zm4016.14 -166.72c43.76,-7 -0.1,2.86 31.64,-29.82 34.89,-35.94 40.36,0.88 62.15,-54.94 -21.33,-19.49 -71.92,-19.85 -82.52,-15.92 -26.75,9.91 -61.49,108.71 -11.27,100.68zm-4407.77 -393.92l10.48 -12.57c-11.92,4.46 -43.29,15.74 -53.5,28.07 -37.52,45.32 0.25,63.91 0.5,64.34 57.27,21.19 27.81,-42.03 42.52,-79.84zm-78.8 -10.92c56.56,-31.63 7.09,16.78 29.19,-23.82 26.86,-49.36 -14.82,-25.15 -2.06,-35.82l15.93 -12.95c-12.86,-66.19 -9.05,-52.08 -34.44,-69.08 -7.2,13.46 -8.37,6.24 -12.1,31.47 -1.99,13.47 0.28,23.35 0.74,36.89 0.84,24.59 1.94,49.79 2.74,73.31z"/>
                            <path class="fil0" d="M5735.72 7035.32c-42.63,99.32 -167.01,179.05 -179.75,236.14 109.05,1.12 720.48,15.89 831.43,5.99 44.63,10.62 21.07,-15.9 35.02,34.34l10.92 -31.3 257.67 7.7c28.92,70.3 51.15,57.28 90.4,106.93 29.01,36.69 47.28,73.41 88.94,111.19l-27.48 23.16 -1400.49 -2.12 -211.41 -11.01 -2.68 9.94 2.68 -9.94c10.05,-61.7 -3.12,-51.79 33.88,-70.67 -2.77,-1.97 -6.4,-4.17 -8.4,-5.7l-28.47 -24.98c10.14,-55.55 8.84,-113.11 11.43,-171.31 4.67,6.96 -6.06,28.58 46.55,-26.91l172.6 -179.86c85.79,-15.14 189.23,-8.37 277.16,-1.59z"/>
                            <path class="fil0" d="M7567.42 6962.08c-27.61,-22.94 -84.18,-16.56 -117.23,-12.16 -152.58,20.28 -307.7,-18.56 -387.63,18.68 -7.92,-24.45 -18.95,-7.39 0.25,-36.6l322.61 3.89 73.95 -47.91c1.67,-1.55 4.06,-3.59 5.76,-5.09 1.72,-1.52 4.22,-3.4 5.96,-4.89 34.88,-29.74 121.64,-112.84 142.7,-162.64 -49.81,-4.72 -116.62,-15.18 -158.7,1.94l-0.62 51.98c-2.27,34.23 6.98,10.92 -7.55,35.81 -18.01,-50.74 -1.83,-40.99 -10.16,-101.89 38.89,-24.14 100.18,-3.89 181.51,-9.61 69.47,-4.89 152.88,-9.54 218.07,13.65 10.56,-49.22 -18.31,11.98 12.93,-32.87l10.46 -11.41c1.59,-1.63 4.2,-3.4 5.86,-4.96l270.03 -290.37 -163.9 -1.68c30.08,-37.61 52.56,-49.83 78.65,-87.52 93.47,-91.72 95.92,-22.89 185.26,-64.3 16.4,-54.55 -13.57,-68.06 64.24,-72.52l-2.96 -31.52c9.56,-14.71 21.51,-16.12 32.29,-22l-2.7 -36.75c53.88,12.78 28.66,16.27 68.27,49.66l160.73 -155.86c27.81,-27.18 52.67,-53.25 81.58,-82.75l76.63 -88.62c-213.22,-2.18 -392.1,8.23 -603.85,6.05 -7.17,14.17 -10.39,-13.92 -0.24,36.66l-104.57 1.78c0.39,0.64 2.2,3.64 2.73,4.49l25.12 41.4c-2.56,-1.31 -6.24,-7.2 -7.42,-4.57 -1.16,2.58 -5.7,-3.53 -7.23,-4.59l-37.38 -27.59c-19.73,29.63 -9.34,21.21 -38.45,39.14l-50.86 -6.57c-24.01,-15 -19.91,-17.74 -42.29,-42.21 -4.31,-4.71 -43.73,-42.6 -44.56,-43.11 -38.73,-23.93 -433.3,-14.64 -494.57,-15.26l57.15 -11.95c15.17,-0.2 34.04,2.3 49.9,2.96 35.48,1.48 64.06,-0.9 98.99,-3.12 168.83,-10.73 440.94,6.24 613.65,6.99 88.08,0.39 350,21.05 415.57,4.04 42.03,-10.9 87.66,-75.1 118.68,-108.02 21.14,-22.44 35.4,-32.69 55.75,-53.66 26.86,-27.68 33.03,-30.3 49.35,-67.1 67.04,0.69 140.15,-8.27 203.18,14.27 6.59,-42.1 8,-41.24 31.19,-59.23l30.19 -23.81c1.53,-1.75 3.38,-4.6 4.83,-6.44l29.31 -37.04c84.58,-79.6 31.16,-57.93 151.88,-140.18 -6.17,24.46 -6.37,58 -12.67,90.18 -15.53,79.25 -6.12,-44.08 -49.14,26.11 -37.13,60.58 -21.8,23.28 -72.48,64.48 20.79,-33.25 34.06,-38.99 49.95,-80.5 -28.22,11.55 -54.08,43.15 -74.81,68.75l-345.63 342.87c-97.93,108.1 -23.95,77.59 -66.92,125.37 -62.67,69.67 -42.06,115.03 -84.7,92.86 -3.51,-1.83 -23.38,-7.09 -23.48,-7.07 -31.23,5.83 -451.9,440.32 -512.81,515.67l-103.47 104.85c-19.55,19.27 -26.28,30.84 -47.85,50.92l-151.37 142.31c-34.68,30.43 -83.43,99.96 -156.96,148.18zm475.99 -1093.66l-9.29 -1.86 9.29 1.86z"/>
                            <path class="fil0" d="M5202.97 7659.54l-163.69 -1.68c3.3,-585.14 16.89,-1136.03 20.85,-1725.63 49.02,-10.63 50.57,-50.8 101.14,25.46 -17.05,29.24 -57.98,46.95 -86.48,48.14l18.84 117.55c40.63,0.56 41.64,3.11 51.48,45.67 42.55,-56.36 4.13,-32.68 19.32,-27.77l11.5 89.91c14.97,-24 19.23,-39.68 14.48,-69.91 5.19,65.25 0.15,55.18 18.47,83.58l-1.74 -86.6c-0.32,47.5 -0.37,92.31 -2.57,139.42l1.02 47.98c6.38,42.85 11.06,6.21 9.75,65.48 7.26,-12.77 25.04,-5.09 -6.27,0.08 -22.9,3.79 -47.96,6.69 -61.47,25.66 8.08,-38.38 -1.86,-22.63 -40.64,-38.72 -16.62,27.71 -12.44,16.96 -47.19,24.3l8.46 131.87c10.72,9.4 7.89,4.66 20.15,11.35l36.45 50.41 59.6 -23.67c3.58,84.84 17.38,31.02 19.67,112.46l-3.35 403.82c-1.17,185.26 -4.13,366.67 2.22,550.84z"/>
                            <path class="fil0" d="M9432.84 7543.77l-217.14 -2.22c-3.99,-56.77 -9.25,-202.31 -17.73,-224.17l-118.48 2.38c15.42,-23.74 -3.3,-24.45 79.34,-23.6l-115.89 -138.95c-63.57,-62.49 -30.89,-9.56 -126.94,-136.28 -51.83,-68.39 -62.95,-46.17 -200.43,-47.57l-178.89 -0.06c-70.07,-8.16 -30.91,6.91 -48.6,-26.69l29.61 0.3 697.72 7.09c1.11,-40.25 -3.64,-88.74 -3.58,-108.2 0.06,-24.53 2.85,-79.32 3.13,-111.68 -50.8,-5.17 -64.36,17.05 -111.21,-12.25 68.64,-1.63 138.22,12.1 207.98,12.04 60.51,-0.06 85.84,-9.04 123.23,99.94l-33.21 16.55c-12.78,3.14 -16.03,-0.79 -20.61,-3.45l64.96 13.64c-33.78,91.46 16.9,-9.92 8.33,108.1l-273.54 13.13 68.63 82.7c-0.19,28.19 -7.27,24.34 9.73,24.52l9.82 12.34 9.81 12.34 11.72 11.49 12.23 9.22 11.45 10.04 10.37 10.6c25.3,46.24 50.63,45.19 63.39,108.14 -67.21,35.32 -35.26,12.26 -94.46,-19.85 59.33,70.86 36.5,52.75 139.98,83.39 -0.67,31.95 -1.84,50.01 -6.65,60.86l-18.59 34.44c-0.47,-2.03 -2.01,5.7 -2.93,8.59 -47.01,-46.95 -13.86,-14.72 -19.59,-30.25 -21.24,16.3 -12.22,13.46 -38.24,23.74 39.03,30.24 3.9,16.82 31.42,29.08 10.25,4.56 25.08,7.07 43.52,-1.62l10.34 92.18z"/>
                            <path class="fil0" d="M9750.74 7594.15c-0.79,118.18 22.1,113.05 -119.47,110.89 -113.14,-1.73 -139.06,35.14 -125.23,-111.55 -11.23,-170.33 -3.95,-360.22 2.39,-503.22l-10.61 -231.29c-0.11,-85.62 2.22,-171.72 5.54,-256.94l7.62 232.59c-1.36,71.45 -9.77,162.32 0.25,225.32 22.82,13.97 38.02,2.69 43.8,0.44l25.19 -14.99c20.13,-8.17 9.65,-24.44 36.3,34.79l8.85 20.35c27.8,-0.28 54.52,8.53 69.2,5.42 33.99,-7.19 12.8,1.23 39.95,-37.63 8.38,49.66 -1.78,204.22 -1.57,270.43 0.14,44.97 1.08,90.1 1.95,134.64l8.8 97.85c0.72,3.37 2.78,13.15 3.38,11.49 0.6,-1.67 2.18,7.75 3.66,11.41z"/>
                            <path class="fil0" d="M9324.65 7155.07l-10.37 -10.6 -11.45 -10.04 -12.23 -9.22 -11.72 -11.49 -9.81 -12.34 -9.82 -12.34c-17,-0.18 -9.92,3.67 -9.73,-24.52 27.62,0.28 22.54,-6.58 9.73,24.52 26.44,-15.97 23.17,-20.08 9.82,12.34 26.44,-15.97 23.16,-20.08 9.81,12.34 25.37,-15.32 23.06,-21.32 11.72,11.49 22.19,-13.77 20.59,-20.63 12.23,9.22 19.71,-10.17 17.18,-15.42 11.45,10.04 17.95,-7.38 15.21,-11.88 10.37,10.6l50.06 48.48c1.51,1.7 3.6,4.23 5.18,5.83 1.6,1.62 3.92,3.82 5.61,5.33l80.24 72.35c0.46,-67.82 -3.29,-98.85 -7.45,-148.75 -4.74,-56.8 2.34,-111.01 -3.86,-169.62 8.57,-118.02 -42.11,-16.64 -8.33,-108.1l-64.96 -13.64c4.58,2.66 7.83,6.59 20.61,3.45l33.21 -16.55c-37.39,-108.98 -62.72,-100 -123.23,-99.94 -69.76,0.06 -139.34,-13.67 -207.98,-12.04 -121.72,4.34 -192.05,26.89 -225.93,-77.34 2.36,2.15 5.77,1.93 6.88,6.78 11.87,51.76 -28.26,-26.52 29.15,33.02l545.85 27.37 2.22 -330.47 -30.24 -0.31c24.52,-50.45 17.69,-61.3 17.04,-112.72 -0.25,-19.22 7.71,-61.7 5.55,-119.47l-249.37 -14.94c-75.31,4.07 -460.07,6.58 -500.47,-17.38l769.11 7.89c-0.64,-56.08 -9.74,-95.56 -8.81,-171.4 0.73,-59.37 -6.17,-148.23 -1.17,-171.44l-0.72 -249.11 23.68 -7.7c1.17,-17.98 1.75,-46.8 4.4,-63.75l16.63 -57.08 -4.19 1198.22c-3.32,85.22 -5.65,171.32 -5.54,256.94l10.61 231.29c-6.34,143 -13.62,332.89 -2.39,503.22 -29.51,-7.82 -55.01,-15.84 -73.2,-49.72l-10.34 -92.18c-18.44,8.69 -33.27,6.18 -43.52,1.62 -27.52,-12.26 7.61,1.16 -31.42,-29.08 26.02,-10.28 17,-7.44 38.24,-23.74 5.73,15.53 -27.42,-16.7 19.59,30.25 0.92,-2.89 2.46,-10.62 2.93,-8.59l18.59 -34.44c4.81,-10.85 5.98,-28.91 6.65,-60.86 -103.48,-30.64 -80.65,-12.53 -139.98,-83.39 59.2,32.11 27.25,55.17 94.46,19.85 -12.76,-62.95 -38.09,-61.9 -63.39,-108.14z"/>
                            <path class="fil0" d="M6076.97 6334.35c-51.3,23.9 -657.64,16.77 -732.48,-1.17l-101.14 9.9c7.56,-20.56 18.91,-18.55 61.27,-20.31l500.25 16.14 -40.91 -61.57c-24.4,-24.97 -27.29,-26.7 -57.91,-37.17l-24.78 58.7c-12.63,-32.02 54.93,-195.47 -176.72,-195.58 -43.71,-0.02 -85.08,-0.2 -128.79,-1.67 -48.43,-1.63 -79.16,5.81 -117.67,-20.54l654.97 6.72 17.45 11.72c67.15,39.12 53.25,27.06 119.11,109.81 -1.81,1.7 -5.61,-0.28 -6.46,2.69 -0.82,2.83 -5.17,2.03 -6.25,2.18 -0.99,0.13 -4.75,1.09 -5.94,1.17l-24.01 -4.2c23.05,32.11 29.55,21.98 64.32,44.8 29.76,19.54 37.95,38.75 59.04,62.53 -11.37,9.29 -4.49,6.62 -24.58,12.7 -10.19,3.08 -21.37,2.62 -28.77,3.15z"/>
                            <path class="fil0" d="M8109.62 5816.48c23.78,-1.56 -5.04,-23.09 37.05,15.51 11.83,10.85 18.02,23.97 31.89,37.07l-138.51 -4.21c35.09,70.71 47.16,90.79 116.92,119.66l50.97 -69.1c24.26,1 74.57,62.49 96.91,89.41 23.94,28.85 20.9,30.61 21.65,46.52l2.7 36.75c-10.78,5.88 -22.73,7.29 -32.29,22l2.96 31.52c-77.81,4.46 -47.84,17.97 -64.24,72.52 -89.34,41.41 -91.79,-27.42 -185.26,64.3 41.43,-72.33 115.29,-62.37 142.12,-161.28l-273.6 6.25c-138.44,-4.14 -52.11,39.91 -130.8,7.99 -77.14,-31.3 -123.45,4.99 -254.54,-14.68 5.63,73.28 13.86,127.09 71.47,135.32 -16.53,4.39 -31.93,7.97 -42.95,24.1l-90.1 -108.76c-16.44,-18.7 9.94,-14.11 -34.14,-37.11 -12.38,-6.46 -42.64,-6.13 -49.16,-5.75 -101.81,5.92 -116.77,-5.1 -217.68,-7.51 11.36,88.92 22.55,37.73 37.9,108.65 -40.03,-13.87 -5.35,-0.11 -38.39,-22.31l-15.18 -11.38c-0.75,-0.79 -2.71,-3.03 -3.34,-3.87l-9.51 -21.77c-0.77,-1.61 -2.08,-5.15 -2.96,-6.79 -0.92,-1.73 -2.49,-5.1 -3.55,-6.8 -31.04,-49.97 -86.98,-30.91 -99.22,-21.7 -41.86,31.49 1.97,0.23 -18.47,62.19 -42.43,8.47 -47.56,-12.72 -78.22,-45.57 -40.94,-43.86 -105.86,-28.39 -188.62,-27.91 -12.55,0.07 -49.8,1.04 -59.71,-1.11l-40.81 -23.27 1407.25 14.43 29.69 0.3c-8.68,-16.33 -9.4,-13.63 -17.38,-27.23 -16.37,-27.87 -8.32,-5.4 -20.43,-41.17l-18.39 -1.33 -10.53 -9.09 -1.95 -11.68 1.95 11.68 10.53 9.09 18.39 1.33 35.45 15.92 49.39 -69.44c-21.84,-36.47 -5.07,-12.55 -31.75,-33.63 -44.02,-34.78 -2.75,16.44 -17.56,-16.82l-6.24 -20.66c-16.97,-37.32 -13.5,-14.85 -35.92,-48.64l-9.29 -1.86 -91.7 -0.02c29.11,-17.93 18.72,-9.51 38.45,-39.14l37.38 27.59c1.53,1.06 6.07,7.17 7.23,4.59 1.18,-2.63 4.86,3.26 7.42,4.57l-25.12 -41.4c-0.53,-0.85 -2.34,-3.85 -2.73,-4.49l104.57 -1.78z"/>
                            <path class="fil0" d="M6274.14 6453.21c-15.68,36.65 -23.11,39.93 -47.4,69.7 -6.99,8.58 -18.78,24.53 -24.91,30.46 -29.67,28.71 -5.82,13.25 -27.46,16.63 -50.54,22.05 -20.94,5 -49.47,58.88 -15.44,29.18 -28.03,36.48 -48.66,58.42 28.63,0.92 40.34,0.04 62.59,19.06 -26.06,0.6 -14.91,4.75 -42.46,-4.03 -25.51,-8.13 -10.53,8.2 -20.13,-15.03 -119.83,25.9 -238.46,-50.07 -292.56,35.09 -1.28,2.02 -3.92,11.25 -4.8,9.15 -0.9,-2.17 -2.88,6.6 -4.72,9.55 -13.89,-27.4 0.51,-9.31 -21.72,-25.51 -47.88,-34.88 -138.88,-11.38 -222.08,-14.24 -68.39,-2.36 -239.7,14.04 -287.05,-32.86 55.58,21.61 421.2,27.31 504.77,17.55 52.75,-6.16 170.53,-152.55 216.43,-209.26 11.45,-14.14 18.6,-24.08 30.88,-35.73l41.45 -26.95 16.35 -7.55c36.11,-22.11 66.33,10.73 105.22,22.6 -14.87,40.09 -68.67,97.47 -4.84,52.69 59.48,-41.72 35.73,-42.45 120.57,-28.62z"/>
                            <path class="fil0" d="M6662.6 6940.08l-309.51 -3.18c-7.76,-11.86 -5.88,-8.55 -16.48,-21.05l-198.15 -217.47 75.21 -7.03 246.85 13.86 17.01 32.6c40.96,79.66 21.61,-15.9 31.69,78.29 -30.48,28.23 -52.59,23.57 -90.73,23.49 14.61,-20.21 38.31,-12.94 70.27,-11.81l85.88 14.83c67.91,30.94 59.89,43.15 97.43,67.31 -8.89,27.64 4.03,20.6 -9.47,30.16z"/>
                            <path class="fil0" d="M7182.82 7532.95l-339.95 -3.48 27.48 -23.16c-41.66,-37.78 -59.93,-74.5 -88.94,-111.19 -39.25,-49.65 -61.48,-36.63 -90.4,-106.93l302.65 12.39c37.39,77.39 -14.74,10.2 60.3,56.56 36.12,22.31 29.53,28.01 0.13,43.3 25.73,7.54 32.6,11.69 45.57,32.44l5.24 12.9c29.57,70.33 40.33,9.68 77.92,87.17z"/>
                            <path class="fil0" d="M5261.53 5419.38l-0.49 74.19 178.16 1.83c7.71,-15.73 8.34,0.99 0.15,-23.24 34.51,31.15 67.58,69.58 93.5,115.73l11.86 9.82 9.99 12.09 9.54 12.67 10.01 12.12 9.77 12.39 11.24 10.68c17.13,-1.24 14.12,-7.28 14,11.15l-14 -11.15 -11.24 -10.68c-13.81,0.81 -10.45,4.82 -9.77,-12.39l-10.01 -12.12 -9.54 -12.67 -9.99 -12.09 -11.86 -9.82 -28.25 -7.79c-3.94,23.18 -9.2,16.41 12.61,37.57 10.98,10.66 26.79,13.28 40.23,26.05 36.84,34.98 6.45,48.43 57.71,75.4l-39.15 22.49 -281.09 -2.88c-7.88,-47.28 -17.77,-43.35 -29.84,-90.67l-34.98 -289.45c-7.17,-14.96 -13.17,1.97 -8.61,-23.15 0.46,-2.48 6.71,-36.46 6.58,-50.37 7.26,9.39 6.36,42.09 8.21,61.11 0.48,4.93 6.33,46.7 7.23,49.41 11.02,33.17 -9.94,3.3 18.03,23.77z"/>
                            <path class="fil0" d="M9329.38 5480.94c-21.71,25.09 -23.77,22.25 -39.96,53.93l173.42 -2.52 0.72 249.11c-156.08,-1.6 -276.88,9.4 -433.16,7.8 35.15,-39.6 113.72,-23.25 181.64,-22.56 -12.11,-129.5 -14.62,-160.37 50.61,-204.01 -19.15,-23.5 -28.47,-25.87 -29,-57.31l49.93 0.69c40.76,-41.72 -49.71,0.89 43.07,-51.45 -27.5,46.17 -1.86,14.8 2.73,26.32z"/>
                            <path class="fil0" d="M9431.68 6380.92l-225.04 -2.31c-0.87,-48.1 -5.38,-95.12 -4.79,-115.37 0.92,-31.91 7.32,-82.71 3.05,-129.45l249.37 14.94c2.16,57.77 -5.8,100.25 -5.55,119.47 0.65,51.42 7.48,62.27 -17.04,112.72z"/>
                            <path class="fil0" d="M7327.66 5303.36l-6.95 16.72 -7.99 10.92c-62.81,53.09 -73.88,96.79 -146.1,157.62 6.85,-14.85 1.93,-20.44 20.06,-29.52 -38.12,-3.72 -120.16,-1.87 -142,-4.92 -29.64,-4.15 -11.72,-12.7 -57.86,-11.13 -41.6,1.41 -13.62,8.04 -62.48,-5 20.02,-37.97 134.73,-166.75 159.56,-176.14 31.89,12.2 27.79,4.66 52.77,7.7 1.24,0.15 4.17,0 5.23,0.26l7.62 3.53c1.31,0.88 6.23,10.53 8.37,13.62 2,-2.64 -27.79,-30.12 37.69,-10.19l37.25 17.72c33.49,8.45 66.57,-6.76 94.83,8.81z"/>
                            <path class="fil0" d="M7083.9 5261.91c1.67,-2.58 4.72,-9.21 5.59,-7.12l34.42 -54.72c155.28,2.01 353.4,5.07 494.8,18.08 11.02,26.42 10.08,26.51 19.43,54.92 -50.53,-1.59 -103.13,1.97 -139.57,2.16 -65.87,0.36 -41.34,-28.38 -102.86,19.9 -19.57,-9.16 -12.25,-9.51 -32.83,-7.64l-35.22 15.87c4.13,19.43 7.94,15.07 -6.95,16.72l-7.99 10.92 7.99 -10.92 6.95 -16.72c-28.26,-15.57 -61.34,-0.36 -94.83,-8.81l-37.25 -17.72c-65.48,-19.93 -35.69,7.55 -37.69,10.19 -2.14,-3.09 -7.06,-12.74 -8.37,-13.62l-7.62 -3.53c-1.06,-0.26 -3.99,-0.11 -5.23,-0.26 -24.98,-3.04 -20.88,4.5 -52.77,-7.7z"/>
                            <path class="fil0" d="M7687.26 5334.78l9.82 12.33 10.37 12.35 11.93 9.87 12.74 10.05 11.84 9.77 10.99 10.39c22.11,49.17 -7.29,22.83 36.31,41.51l10.62 10.77 14.69 9.3 -0.03 3.34 -179.61 -8.71c-31.71,23.19 -30.85,32.4 -49.23,63.98l-30.35 -7.75c-21.3,-55.29 -48.12,-60.81 -69.28,-105.74 0.19,-27.18 6.77,-22.76 -11.2,-22.95l-12.9 -8.62 -10.68 -12.06 -8.48 -11.94 -12.37 -10.61 -7.85 -12.05 -7.43 -16.41 -2.45 2.25c24.2,10.06 25.05,13.66 44.8,27.2 50.25,-19.46 63.21,-25.26 124.28,-14.31l103.47 8.04z"/>
                            <path class="fil0" d="M8178.56 5869.06c26.41,31.61 -0.4,-5.87 13.04,16.04 14.05,22.89 0.91,-1.94 16.34,30.31l-50.97 69.1c-69.76,-28.87 -81.83,-48.95 -116.92,-119.66l138.51 4.21zm-128.52 172.63l-18.39 -1.33 -10.53 -9.09 -1.95 -11.68c-44.65,-61.75 -97.58,-93.21 -127.61,-159.62l50.86 6.57 91.7 0.02 9.29 1.86c22.42,33.79 18.95,11.32 35.92,48.64l6.24 20.66c14.81,33.26 -26.46,-17.96 17.56,16.82 26.68,21.08 9.91,-2.84 31.75,33.63l-49.39 69.44 -35.45 -15.92z"/>
                            <path class="fil0" d="M7271.91 7533.86l-89.09 -0.91c-37.59,-77.49 -48.35,-16.84 -77.92,-87.17l-5.24 -12.9c-12.97,-20.75 -19.84,-24.9 -45.57,-32.44 29.4,-15.29 35.99,-20.99 -0.13,-43.3 -75.04,-46.36 -22.91,20.83 -60.3,-56.56l-302.65 -12.39 -257.67 -7.7 -10.92 31.3c-13.95,-50.24 9.61,-23.72 -35.02,-34.34 84.41,-51.42 515.38,35 643.48,-12.94 34.68,42.23 69.61,86.22 102.55,115.45 91.46,81.13 51.23,84.79 108.16,60.92 -1.48,72.42 3.49,46.93 30.32,92.98z"/>
                            <path class="fil0" d="M6449.17 5012.08c7.12,19.13 7.23,80.39 -16.33,115.71 -32.44,48.66 -34.17,11.21 -70.83,22.09 0.27,1.61 0.38,2.63 0.68,4.86l18.88 32.07c-16.14,-0.17 -56.89,2.59 -70.69,1.04 -70.47,-7.89 -30.3,6.71 -47.88,-26.68 31.4,-0.36 47.74,-9.28 70.3,-36.23 37.26,-44.52 8,-43.63 42.55,-78.23 18.54,-18.56 14.16,3.86 31.33,-31.01 -61.28,-37.62 -86.53,-33.92 -129.97,-18.23l-122.23 0.01c-7.49,-0.91 -30.19,-4.67 -41.81,-10.26 -27.83,-13.37 -7.05,-0.13 -23.43,-15.43l-15.38 -18.57c-2.61,-3.04 -5.42,-6.92 -7.81,-10.73 59.01,-4.19 119.98,-4.13 178.11,2.03 26.95,2.87 53.39,5.71 79.8,6.37l71.12 -8.75 40.45 0.41 -36.31 24.11c26.17,55.23 11.78,39.34 49.45,45.42z"/>
                            <path class="fil0" d="M5735.72 7035.32c-87.93,-6.78 -191.37,-13.55 -277.16,1.59 13.47,-21.15 30.05,-31.01 47.84,-49.9 3.36,-3.58 18.36,-21.11 20.04,-24.21 17.24,-31.61 11.37,-4.6 12.16,-46.42l296.86 7.2c-11.53,29.69 -70.95,98.45 -99.74,111.74z"/>
                            <path class="fil0" d="M6309.75 6471.32c-28.85,-19.18 -12.27,-17.77 -35.61,-18.11 -84.84,-13.83 -61.09,-13.1 -120.57,28.62 -63.83,44.78 -10.03,-12.6 4.84,-52.69 -38.89,-11.87 -69.11,-44.71 -105.22,-22.6l-16.35 7.55c0.19,-27.78 -3.78,-21.77 16.35,-7.55 7.62,-57.04 -3.75,3.8 7.61,-30.71l16.17 -41.48c7.4,-0.53 18.58,-0.07 28.77,-3.15 20.09,-6.08 13.21,-3.41 24.58,-12.7 -21.09,-23.78 -29.28,-42.99 -59.04,-62.53 -34.77,-22.82 -41.27,-12.69 -64.32,-44.8l24.01 4.2c1.19,-0.08 4.95,-1.04 5.94,-1.17 1.08,-0.15 5.43,0.65 6.25,-2.18 0.85,-2.97 4.65,-0.99 6.46,-2.69 -65.86,-82.75 -51.96,-70.69 -119.11,-109.81l-17.45 -11.72 46.78 0.48c-19.64,-35.41 -57.52,-63.28 -78.5,-103.88l324.32 363.36c40.88,45.77 66.22,84.34 104.09,123.56z"/>
                            <path class="fil0" d="M8846.58 6631.91c-15.78,-51.21 -47.5,-49.12 -73.12,-79.94 -48.07,-57.85 28.48,-109.81 -341.56,-83.7 -30.71,-25.23 -7.01,-14.33 -44.58,-24.62l36.87 -58.99c46.77,-47.52 154.42,-24.67 216.3,-24.03 17.09,53.2 32.81,62.64 76.21,102.97l41.67 45.44c1.35,1.89 3.11,4.8 4.46,6.71 44.63,63.22 45.96,40.56 66.64,64.24 39.05,44.68 19.94,3.85 17.11,51.92z"/>
                            <path class="fil0" d="M8852.41 4967.32l151.54 1.56 85.45 24.04c-36.74,15.67 -77.08,16.22 -83.54,12.64 0.7,3.19 3.31,-33.81 0.82,9.89l-12.37 68.31c-14.84,50.19 -22.87,44.23 -43.42,84.51 -31.62,-23.12 -2.2,5.21 -21.99,-21.35 -5.95,-7.98 -11.35,-22.12 -12.85,-25.97 -26.31,53.14 -45.46,55.95 -72.63,69.87 25.65,-115.67 45.93,-98.49 -6.89,-199.18 4.65,-3.54 10.56,-16.82 15.88,-24.32z"/>
                            <path class="fil0" d="M6516.08 6681.52c24.27,58.04 67.05,85.55 103.85,133.87 19.17,25.19 32.17,40.67 58.65,61.9 38.45,30.83 35.75,12.39 54.88,63.51l-70.86 -0.72c13.5,-9.56 0.58,-2.52 9.47,-30.16 -37.54,-24.16 -29.52,-36.37 -97.43,-67.31l-85.88 -14.83c-31.96,-1.13 -55.66,-8.4 -70.27,11.81 38.14,0.08 60.25,4.74 90.73,-23.49 -10.08,-94.19 9.27,1.37 -31.69,-78.29l-17.01 -32.6 -246.85 -13.86 -75.21 7.03 0.37 7.98c-22.25,-19.02 -33.96,-18.14 -62.59,-19.06 20.63,-21.94 33.22,-29.24 48.66,-58.42 28.53,-53.88 -1.07,-36.83 49.47,-58.88 -1.83,2.8 -4.72,3.17 -5.71,8.2 -0.97,4.95 -4.28,6.19 -5.57,8.11l-19.62 29.74c-1.34,2.08 -3.04,4.89 -4.35,6.93 -15.48,24.29 -22.65,32.36 -34.76,54.32l411.72 4.22z"/>
                            <path class="fil0" d="M5706.36 4935.07l340.67 3.5c-14.59,20.76 -42.62,38.22 -67.81,36.37 -46.1,-3.38 -26.53,-25.17 -51.72,23.54 -48.58,-33.39 -10.66,31.37 -39.3,-37.12 -22.83,53.35 21.25,-19.23 -7.88,14.65l-13.64 13.77c-2.01,2.08 -5.62,5.32 -8.42,7.99 -13.3,-13.68 -20.32,-26.14 -42.28,-29.48 -38.04,-5.8 -34.85,-0.16 -41.58,23.12 -27.99,10.89 -14.92,34.76 -18.17,91 -31.15,-34.35 -12.6,1.06 -26.4,-48.86 -0.85,-3.06 -0.23,-33.96 -0.21,-40.75 -20.94,15.92 -6.8,36.69 -21.58,88.28 -37.74,-36.26 -14.21,36.14 -32.47,-51.54 -11.82,-56.7 -1.91,-12.11 6.44,-36 -24.31,-22.8 -24.64,-8.48 -50.49,-53.11l74.84 -5.36z"/>
                            <path class="fil0" d="M6872.44 5797.07c-15.48,38.1 -14.95,29.65 -40.02,63.94l-277.1 -7.85c10.53,-27.33 2.8,-16.97 27.1,-27.79 -9.5,-8.82 -5.67,18.29 6.85,-7.89 11.77,-24.62 6.5,3.36 11.14,-33.91 50.23,0.75 83.25,-12.99 141.77,-4.35 31.03,4.57 96.58,17.53 130.26,17.85z"/>
                            <path class="fil0" d="M7687.26 5334.78l9.82 12.33c26.23,-15.84 23.08,-20.34 10.37,12.35 23.95,-14.89 22.63,-21.98 11.93,9.87 21.48,-11.9 19.11,-18.14 12.74,10.05 18.22,-9.24 15.18,-13.96 11.84,9.77 16.01,-6.09 12.65,-10.01 10.99,10.39 38.32,6.65 30.21,2.43 36.31,41.51 18.56,-9.34 15.27,-13.3 10.62,10.77 16.9,-7.02 12.69,-11.52 14.69,9.3l8.34 5.48 -8.37 -2.14 0.03 -3.34 -14.69 -9.3 -10.62 -10.77c-43.6,-18.68 -14.2,7.66 -36.31,-41.51l-10.99 -10.39 -11.84 -9.77 -12.74 -10.05 -11.93 -9.87 -10.37 -12.35 -9.82 -12.33 -103.47 -8.04c-61.07,-10.95 -74.03,-5.15 -124.28,14.31 -19.75,-13.54 -20.6,-17.14 -44.8,-27.2l2.45 -2.25 7.43 16.41 7.85 12.05 12.37 10.61 8.48 11.94 10.68 12.06 12.9 8.62c17.97,0.19 11.39,-4.23 11.2,22.95 -25.94,-0.27 -21.55,6.86 -11.2,-22.95 -21.56,12.67 -20.18,20.14 -12.9,-8.62 -19.55,8.94 -15.94,12.89 -10.68,-12.06 -19.07,8.87 -15.29,11.7 -8.48,-11.94 -19.04,7.57 -16.26,13.09 -12.37,-10.61 -17.36,5.91 -13.91,9.01 -7.85,-12.05 -21.41,5.88 -16.17,8.75 -7.43,-16.41 -24.67,-1.5 -18.16,8.01 -21.45,-16.47 61.52,-48.28 36.99,-19.54 102.86,-19.9 36.44,-0.19 89.04,-3.75 139.57,-2.16 74.38,3.04 49.13,61.59 49.12,61.71z"/>
                            <path class="fil0" d="M6872.44 5797.07c-33.68,-0.32 -99.23,-13.28 -130.26,-17.85 -58.52,-8.64 -91.54,5.1 -141.77,4.35 -4.64,37.27 0.63,9.29 -11.14,33.91 -12.52,26.18 -16.35,-0.93 -6.85,7.89 4.12,-24.01 -5.3,2.76 5.87,-21.48 0.33,-0.72 9.81,-16.4 12.12,-20.32 36.83,-18.27 16.37,2.25 34.8,-35.28 39.41,-10.97 267.23,-18.19 293.12,7.18 -6.82,7.38 -16.62,22.25 -23.2,27.94 -19.27,16.65 -7.72,14.1 -32.69,13.66z"/>
                            <path class="fil0" d="M9461.49 4968.49c19.49,-37.58 10.78,-132.18 11.17,-190.65 24.35,-19.81 44.21,-37.67 76.58,-48.18l-30.87 30.23c4.06,96.9 -4.41,120.53 -6.54,212.46l-50.34 -3.86z"/>
                            <path class="fil0" d="M5532.85 5587.89l11.86 9.82 9.99 12.09 9.54 12.67 10.01 12.12c-0.68,17.21 -4.04,13.2 9.77,12.39l11.24 10.68 14 11.15c38.65,15.02 6.51,-1.53 35.16,37.35 9.85,13.37 12.61,13.49 20.43,24.26 14.75,20.34 0.38,-6.88 13.29,24.48 -17.16,-0.18 -36.88,0.99 -53.56,0.35 -7.01,-0.28 -21.37,-0.8 -27.79,-2.47 -19.8,-5.17 -10.14,-2.73 -20.79,-11.17l39.15 -22.49c-51.26,-26.97 -20.87,-40.42 -57.71,-75.4 -13.44,-12.77 -29.25,-15.39 -40.23,-26.05 -21.81,-21.16 -16.55,-14.39 -12.61,-37.57l28.25 7.79z"/>
                            <path class="fil0" d="M8969.12 7325.47c17.21,20.14 6.64,-25.87 19.31,35.37l32.14 -15.64c-11.12,37.75 7.73,14.32 -17.47,30.69 37.15,24.53 35.76,36.79 38.59,63.36 16.14,-28.34 34.99,-26.23 58.95,-6.47 -22.93,9.58 -54.02,19.17 -71.89,10.81 0.67,54.98 -3.11,33.49 -19.67,42.44 -33.79,-21.4 2.32,16.48 -16.67,-20.44 -0.86,-1.65 -1.61,-5.45 -2.32,-7.1 -4.54,-10.43 3.53,-13.01 -13.73,-26.29 2.22,-2.79 5.42,-5.94 7.11,-7.77l25.59 -28.31c-9.31,0.77 -35.46,12.98 -37.73,10.03l-9.99 -32.1c0.18,-1.9 -0.01,-5.99 0.21,-8.09 4.12,-39.58 -4.74,-6.53 7.57,-40.49z"/>
                            <path class="fil0" d="M9737.87 5347.04c-21.79,55.82 -27.26,19 -62.15,54.94 -31.74,32.68 12.12,22.82 -31.64,29.82 -50.22,8.03 -15.48,-90.77 11.27,-100.68 10.6,-3.93 61.19,-3.57 82.52,15.92z"/>
                            <path class="fil0" d="M9507.55 5403.82l-16.63 57.08c-2.65,16.95 -3.23,45.77 -4.4,63.75l-23.68 7.7 4.46 -191.51 39.26 -48.69 0.99 111.67z"/>
                            <path class="fil0" d="M5627.94 5598.52c5.77,-19.39 0.8,-0.11 35.01,-4.29l36.06 -13.57 31.06 39.21c9.27,5.13 -0.11,-12.74 14.92,25.24 -50.19,22.37 -98.16,22.27 -117.05,-46.59z"/>
                            <path class="fil0" d="M6449.17 5012.08c-37.67,-6.08 -23.28,9.81 -49.45,-45.42l36.31 -24.11 29.91 0.31c15.25,15.03 -5.68,-0.59 17.6,13.34 7.22,4.32 15.36,7.57 22.11,11.55l-23.54 64.63c-5.11,-10.04 -4.64,-7.49 -12.61,-25.86 -0.62,-1.44 -5.27,-16.14 -7.96,-22.36l-12.37 27.92z"/>
                            <path class="fil0" d="M5200.57 4954.37l-15.93 12.95c-12.76,10.67 28.92,-13.54 2.06,35.82 -22.1,40.6 27.37,-7.81 -29.19,23.82 -0.8,-23.52 -1.9,-48.72 -2.74,-73.31 -0.46,-13.54 -2.73,-23.42 -0.74,-36.89 3.73,-25.23 4.9,-18.01 12.1,-31.47 25.39,17 21.58,2.89 34.44,69.08z"/>
                            <path class="fil0" d="M5319.79 5347.29l-56.86 -62.44 -1.4 134.53c-27.97,-20.47 -7.01,9.4 -18.03,-23.77 -0.9,-2.71 -6.75,-44.48 -7.23,-49.41 -1.85,-19.02 -0.95,-51.72 -8.21,-61.11l5.15 -46.86c18.48,15.93 71.57,86.27 86.58,109.06z"/>
                            <path class="fil0" d="M5193.79 5117.72c-0.25,-0.43 -38.02,-19.02 -0.5,-64.34 10.21,-12.33 41.58,-23.61 53.5,-28.07l-10.48 12.57c-14.71,37.81 14.75,101.03 -42.52,79.84z"/>
                            <path class="fil0" d="M5225.97 7659.78c18.13,-24.07 5.27,-98.1 2.32,-133.5l2.68 -9.94 211.41 11.01 -155.37 -1.59c-16.59,30.08 -28.68,32.27 -38.27,63.04 -3.09,9.94 -3.65,23.37 -8.1,39.99 -9.14,34.17 0.49,15.93 -14.67,30.99z"/>
                            <path class="fil0" d="M8486.9 6713.97l52.18 0.53 17.43 85.8c-35.55,-12.89 -30.07,-0.6 -50.01,-32.74 -3.16,-5.09 -16.16,-40.11 -19.6,-53.59z"/>
                            <path class="fil0" d="M8517.69 6946.91l-29.61 -0.3 -19.83 11.98c21.09,-56.92 12.63,-67.46 82.35,-73.26 -4.7,51.71 0.47,34.27 -32.91,61.58z"/>
                            <path class="fil0" d="M7932.51 6879.65c-32.83,55.93 -44.25,39.37 -67.04,-1.57 22.83,-39.35 38.02,-48.23 67.04,1.57z"/>
                            <path class="fil0" d="M9007 6376.56l-51.92 -0.53c13.4,-52.51 15.25,-56.7 68.88,-54.65 -12.04,47.24 1.23,8.64 -16.96,55.18z"/>
                            <path class="fil0" d="M7393.85 7409.01c-33.88,19.36 0.7,17.39 -37.56,10.66 -23.59,-4.15 -14.72,-10.11 -24.5,-19.84 21.62,-59.95 43.28,-42.4 62.06,9.18z"/>
                            <path class="fil0" d="M5940.55 5795.91c2.5,27.05 14.6,57.78 -2.09,65.78 -17.54,8.41 -36.69,-17.69 -44.78,-31.14 13.11,-23.17 24.14,-26.95 46.87,-34.64z"/>
                            <path class="fil0" d="M8533.13 6133.07c-31.52,-53.47 -3.56,-57.8 -2.95,-59.11 12.64,-3.62 27.25,-25.05 31.82,16.93 5.4,49.63 -13.91,34.7 -28.87,42.18z"/>
                            <path class="fil0" d="M5823.92 6833.55c-38.03,24.87 -35.8,11.48 -51.58,5.3 5.37,-32.43 -3.47,-41.96 23.6,-43.98 31.25,-2.33 25.36,30.73 27.98,38.68z"/>
                            <path class="fil0" d="M5254.26 6504.15l-10.91 -161.07 101.14 -9.9c-21.18,24.14 28.78,13.36 -38.97,19.06 -10.76,0.91 -37.3,-1.76 -50.23,-1.89l-1.03 153.8z"/>
                            <path class="fil0" d="M9020.57 7345.2l-32.14 15.64c-12.67,-61.24 -2.1,-15.23 -19.31,-35.37l-5.42 -19.07 53.54 0.54 3.33 38.26z"/>
                            <path class="fil0" d="M8707.91 6091.97c-8.36,13.72 9.91,23.2 -26.51,24.84 -38.93,1.76 -18.18,-9.83 -27.46,-25.39 14.09,-13.16 2.61,-15.84 28.03,-18.71 57.41,-6.48 2.57,-6.63 25.94,19.26z"/>
                            <path class="fil0" d="M7947.63 7295.98l48.01 0.49 -4.05 52.17c-33.19,-8.38 -34.85,-12.14 -43.96,-52.66z"/>
                            <path class="fil0" d="M8935.02 6849.33c-21.06,11.23 -30.38,15.67 -58.96,2.45 12.88,-38.28 -1.26,-21.34 30.05,-41.39 9.43,9.44 2.36,18.18 28.91,38.94z"/>
                            <path class="fil0" d="M6291.71 6225.87c-1.71,3.48 -9.93,17.68 -10.45,20.2 -7.54,36.17 27.55,31.7 27.85,30.26 0.21,-0.99 1.52,-0.81 2.32,-0.84 -15.51,30.57 -25.22,19.04 -46.07,11.47 -10.1,-48.95 -4.36,-45.78 26.35,-61.09z"/>
                            <path class="fil0" d="M7834.75 6828.85c18,-35.64 12.48,-16.09 30.78,-39.56l28.23 56.37 -59.01 -16.81z"/>
                            <path class="fil0" d="M7796.72 6887.96c6.46,-38.8 8.77,-42.2 42.16,-39.7 -3.33,48.52 -1.49,47.75 -42.16,39.7z"/>
                            <path class="fil0" d="M7188.33 7409.49l0.32 -47.78c15.46,3.12 12.8,0.16 24.88,13.59l19.56 37.15 -44.76 -2.96z"/>
                            <path class="fil0" d="M5895.54 5891.55c-51.6,-9.63 -28.06,5.68 -42.72,-48.33 41.39,20.05 27.69,-2.88 42.72,48.33z"/>
                            <path class="fil0" d="M9051.34 5625.69c42.18,-28.02 38.54,29.19 38.63,29.48 -46.93,-4.86 -28.8,13.07 -38.63,-29.48z"/>
                            <path class="fil0" d="M5251.43 6926.72c-0.04,6.43 0.46,37.52 -1.04,45.93 -5.24,29.51 0.78,10.06 -9.33,23.63l-11.93 -66.84 22.3 -2.72z"/>
                            <path class="fil0" d="M8986.58 5635.83c5.92,33.07 1.87,8.96 20.29,45.36l-46.32 -8.66 26.03 -36.7z"/>
                            <path class="fil0" d="M7852.65 5676.01c-48.43,-14.35 -22.72,12.82 -29.01,-35.04 36.52,16.75 21.42,7.88 29.01,35.04z"/>
                            </g>
                            <g id="_2649070224">
                            <path class="fil0" d="M4340.32 2517.07c-27.92,-19.99 -82.05,-130.35 -279.14,-176.52 -44.15,-10.33 -664.89,-17.24 -736.6,-17.89 -14.02,29.99 -27,127.38 -27.38,174.04 -1.76,213.49 88.61,366.76 236.17,485.42 151.51,121.81 394.44,157.57 594.18,159.38l1.57 -190.62c-97.2,-0.88 -170.58,-6.23 -258.04,-25.46 -203.69,-44.8 -374.55,-153.73 -392.41,-405.28 164.33,1.49 328.76,3.62 493.07,4.46 73.06,0.37 128.83,18.74 182.37,65.71 24.4,21.41 41.58,39.34 58.4,69.38 40.65,72.66 32.37,101.11 31.69,183.3l181.66 1.65c1.79,-217.09 -15.33,-99.89 94.03,-251.23 39.92,-55.25 69.03,-98.52 90.3,-167.31 8.87,-28.68 3.05,-27.09 52.98,-53.31 38.59,-20.27 146.68,-63.88 192.72,-63.46l295.83 2.68c29.86,0.28 111.58,42.44 133.49,56.73 75.43,49.22 37.89,-2.92 82.33,114.89 17.85,47.3 79.2,137.69 114.72,178.68 56.48,65.18 45.41,8.87 43.9,192.32l186.84 1.7c0.67,-81.03 -14.15,-67.3 6.74,-124.66 39.05,-107.22 133.51,-189.97 239.8,-189.01l519.01 4.71c-0.61,74.5 -33.93,157.42 -63.89,201 -39.15,56.95 -78.02,90.36 -138.22,127.14 -113.21,69.15 -288.42,92.25 -455.34,90.73l-1.57 190.62c301.42,2.74 611.85,-70.07 758.33,-322.15 69.79,-120.1 101.21,-276.57 74.38,-423.27 -4.28,-23.42 -1.25,-58.58 -21.56,-58.76l-638.38 -5.8c-133.76,-1.21 -251.36,57.46 -339.93,148.03 -11.4,11.67 -26.35,32.41 -35.33,39.19 -4.15,-6.62 -9.66,-16.29 -14.55,-22.79 -60.68,-80.56 -83.04,-102.07 -82.14,-212.29 -26.8,-19.19 -48.28,-36.92 -77.15,-55.42l-84.55 -53.2c-35.54,-20.66 -152.34,-73.97 -200.12,-74.4l-301.03 -2.74c-94.01,-0.85 -271.84,81.1 -334.26,121.12l-65.76 45.17c-17.67,16.65 -10.15,17.74 -12.2,47.41 -1.15,16.74 -5.83,34.39 -10.96,48.73 -12.7,35.48 -69.22,124.29 -94,141.38z"/>
                            <path class="fil0" d="M4441.26 4124.75c-0.15,18.45 -10.93,70.2 -16.24,81.55l133.21 89.41c51.54,33.43 212.3,98.91 270.09,99.44l321.79 2.92c39.67,0.36 162.04,-57.12 191.68,-75.56l162.77 -106.41c-4.45,-62.66 -29.7,-52.49 1.79,-151.92 29.17,-92.06 99.96,-222.88 148.96,-307.98 43.21,-75.05 35.5,-30.19 35.9,-148.47 0.12,-38.2 5.49,-54.33 6.14,-86.84 1.23,-61.39 1.02,-123.91 1.31,-185.4l8.7 -321.58c2.89,-39.07 14.53,-26.78 -166.71,-28.43 -23.65,-0.21 -16.05,38.5 -16.13,65.2l-8.55 419.4c-0.11,36.67 -5.5,49.39 -6.14,81.36 -3.2,160.47 -4.97,73.58 -90.13,249.9 -40.36,83.58 -105.57,218.36 -106.41,320.43 -36.16,19.66 -142.86,85.85 -187.56,85.44l-275.08 -2.5c-50.12,-0.45 -188.93,-60.22 -217.45,-83.52 -16.59,-13.56 -13.56,-43.75 -23.01,-84.27 -12.91,-55.41 -28.58,-107.06 -49.26,-154.4 -10.79,-24.72 -19.17,-46.64 -30.51,-71.13l-70.81 -137.56c-15.68,-27.63 -25.23,-32.86 -24.6,-77.24 2.68,-187.74 -11.79,-432.17 -10.23,-621.24l-181.65 -1.65 6.25 328.35c5.3,43.31 0.49,120.59 -0.08,167.48 -0.44,36.11 5.06,47 4.82,81.43 -1.12,161.79 -15.32,104.14 43.2,209.25 43.87,78.8 144.63,280.89 143.94,364.54z"/>
                            </g>
                            </g>
                        </svg>
                        Ir a establecimiento
                    </a>
                </div>
                <div>
                    <button class={classbutton}
                    onclick={openNewModalTacto}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 10000 10000" class="size-10 fill-current mx-2" >
                            <path d="M8049.22 7326.35c-60.43,-0.38 -92.26,107.34 -12.09,137.08 149.75,55.48 503.44,50.19 669.17,12.89 41.88,-9.45 75.97,-17.95 114.41,-27.74 38.89,-9.94 70.6,-24.26 109.19,-33.03 -0.76,127.56 -29.71,238.53 -149.67,296.01 -168.98,81 -596.37,77.41 -767.02,0.76 -167.17,-75.06 -157.95,-230.33 -157,-387.14 1.1,-181.8 52.54,-236.86 146.76,-341.14 41.39,-45.77 64.93,-94.41 91.12,-152.66 71.81,-159.53 8.32,-500.56 43.62,-707.3 50.34,-295.03 454.41,-309.24 519.5,-15.76 40.18,181.12 -19.46,509.79 26.15,683.27 60.74,231.08 240.42,247.9 239.02,481.25l-194.95 56.01c-92.52,22.22 -242.72,41.08 -334.45,42.14l-230.1 -23.43c-37.34,-6.88 -78.27,-21.01 -113.65,-21.2zm286.38 -1567.68c-24.87,11.75 -64.21,17.61 -95.09,30.39 -455.28,188.64 -85.64,792.12 -346.85,1109.67 -72.91,88.63 -170.23,174.2 -171.33,358.49 -1.25,205.27 -34.58,428.56 186.86,557.86 209.05,122.04 750.62,126.01 962.35,5.78 222.96,-126.61 192.3,-350.33 193.55,-555.56 1.1,-182.1 -94.07,-269.63 -167.02,-360.53 -99.25,-123.7 -98.08,-214.38 -96.79,-429.96 1.51,-248.81 41.88,-482.72 -158.97,-635.42 -189.05,-143.7 -173.07,28.04 -171.55,-222.58 0.98,-164.18 88.93,-300.06 215.32,-356.22 175.11,-77.78 360.72,-16.67 459.25,131.83 144.68,218 -7.29,642.03 87.95,847.45 42.94,92.6 150.54,196.5 281.58,197.29l92.33 0.53 -6.8 1132.96c-1.06,174.96 -402.71,-23.89 -403.69,140.22 -0.26,40.59 26.12,67.31 66.71,67.54l285.36 1.74c92.3,0.57 185.16,-91.2 185.73,-183.53l7.48 -1242.03c0.68,-116.11 -269.44,30.46 -373.53,-156.51 -105.26,-189.05 85.98,-670.76 -134.06,-918.66 -128.92,-145.21 -225.03,-188.11 -433.17,-189.36 -66.33,-0.38 -168.95,37.46 -211.92,64.1 -131.91,81.83 -202.77,178.55 -242.16,329.09 -19.84,75.82 -11,185.61 -11.53,275.42z"/>
                            <path d="M5723.41 4719.07l-17.16 2853.33c-0.57,92.33 91.2,185.2 183.53,185.76l1628.08 9.79c40.59,0.23 67.28,-26.15 67.54,-66.75 0.49,-83.87 -85.8,-67.69 -167.47,-68.15l-1409.88 -8.47c-85.3,-0.45 -167.89,8.69 -167.36,-76.54l16.86 -2802.99c0.23,-41.5 34.51,-75.33 75.97,-75.1l3608.64 21.73c105.11,0.6 74.49,172.76 73.59,327.72l-6.09 1007.06c-0.64,75.59 -10.13,142.6 66.29,143.09 40.59,0.23 67.28,-26.15 67.54,-66.75l8.16 -1359.54c0.57,-92.3 -91.2,-185.16 -183.5,-185.73l-3658.98 -22c-92.33,-0.57 -185.2,91.2 -185.76,183.5z"/>
                            <path d="M8318.63 8578.44c316.73,1.89 531.4,-25.89 814.98,-146.12 118.22,-50.15 54.05,-142.38 -7.56,-142.75l-160.86 56.69c-400.41,129.98 -751.34,130.17 -1149.74,-4.76 -85.23,-28.88 -223.67,-117.09 -237.39,0.94 -8.16,70.38 78.8,88.25 152.54,116.22 175.52,66.56 377.05,118.49 588.02,119.77z"/>
                            <path d="M7717.68 8029.31c-0.45,79.64 32.35,75.25 104.84,104.96 48.38,19.84 97.47,37.46 149.44,52.57 309.2,89.99 678.2,74.61 976.37,-43.39 84.32,-33.34 111.61,-27.29 112.1,-106.05 0.15,-27.74 -38.74,-59 -66.78,-59.15 -11.15,-0.08 -112.33,43.12 -133.49,50.61 -44.67,15.8 -93.28,28.12 -143.93,40.14 -51.29,12.21 -96.42,19.35 -155.87,27.97 -425.61,61.57 -737.24,-131.87 -787.54,-121.36 -23.28,4.88 -54.99,30.65 -55.14,53.71z"/>
                            <path d="M5987.82 5408.83c-0.23,40.59 26.15,67.31 66.75,67.58l268.54 1.59c90.07,0.57 90.9,-133.72 0.79,-134.25l-268.54 -1.63c-40.59,-0.26 -67.28,26.12 -67.54,66.71z"/>
                            <path d="M5982.98 6214.48c-0.26,40.59 26.12,67.31 66.71,67.54l268.57 1.63c90.07,0.57 90.86,-133.72 0.79,-134.29l-268.54 -1.59c-40.59,-0.26 -67.31,26.12 -67.54,66.71z"/>
                            <path d="M5980.57 6617.31c-0.26,40.59 26.12,67.31 66.71,67.54l268.57 1.63c90.07,0.57 90.86,-133.72 0.79,-134.29l-268.54 -1.59c-40.59,-0.26 -67.31,26.12 -67.54,66.71z"/>
                            <path d="M5978.15 7020.13c-0.26,40.59 26.12,67.31 66.71,67.54l268.57 1.63c90.07,0.53 90.86,-133.72 0.79,-134.25l-268.57 -1.63c-40.59,-0.26 -67.28,26.12 -67.5,66.71z"/>
                            <path d="M5990.24 5006.01c-0.23,40.59 26.15,67.31 66.75,67.54l268.54 1.63c90.07,0.57 90.9,-133.72 0.83,-134.29l-268.57 -1.59c-40.59,-0.26 -67.28,26.12 -67.54,66.71z"/>
                            <path d="M5985.4 5811.66c-0.23,40.59 26.12,67.31 66.71,67.54l268.57 1.63c90.07,0.53 90.9,-133.72 0.79,-134.29l-268.54 -1.59c-40.59,-0.26 -67.31,26.12 -67.54,66.71z"/>
                            <path d="M8282.95 6144.41c-1.17,193.25 233.99,164.49 234.86,18.18 0.98,-165.24 -234.11,-144.68 -234.86,-18.18z"/>
                            <path d="M3108 2478.48c-75.78,-52.35 -221.59,-339.71 -757.95,-462.81 -120.15,-27.55 -1811.69,-55.63 -2007.13,-58.51 -38.66,77.59 -75.55,330.22 -77.33,451.35 -8.13,554.19 235.73,953.54 636.02,1263.99 410.99,318.73 1072.48,415.52 1616.81,423.5l7.26 -494.82c-264.91,-3.89 -464.81,-18.97 -702.84,-70.34 -554.38,-119.62 -1018.32,-405.21 -1063.07,-1058.54 447.8,6.58 895.9,14.82 1343.67,19.69 199.07,2.15 350.78,50.76 495.95,173.56 66.18,55.98 112.71,102.8 158.06,181.04 109.68,189.32 86.67,263.06 83.53,476.41l495.01 7.26c8.28,-563.57 -40.18,-259.58 260.18,-650.65 109.64,-142.79 189.7,-254.67 248.69,-432.87 24.64,-74.31 8.77,-70.3 145.25,-137.54 105.45,-51.97 400.71,-163.43 526.15,-161.58l806.18 11.83c81.37,1.21 303.42,111.99 362.91,149.44 204.81,129 103.3,-6.95 222.58,299.6 47.89,123.1 213.7,358.72 309.85,465.72 152.92,170.16 123.59,23.77 116.64,500l509.14 7.48c3.1,-210.37 -37.53,-174.96 20.33,-323.53 108.1,-277.68 366.77,-490.96 656.43,-486.73l1414.34 20.75c-2.83,193.36 -94.9,408.08 -177.26,520.75 -107.57,147.18 -214.04,233.31 -378.67,327.76 -309.58,177.68 -787.43,234.75 -1242.3,228.1l-7.26 494.82c821.41,12.02 1668.52,-171.86 2071.65,-823.87 192.08,-310.64 280.14,-716.3 209.31,-1097.58 -11.3,-60.89 -2.49,-152.09 -57.83,-152.92l-1739.65 -25.51c-364.5,-5.33 -685.91,145.06 -928.67,378.71 -31.26,30.12 -72.34,83.72 -96.91,101.18 -11.23,-17.27 -26.08,-42.44 -39.31,-59.41 -164.11,-210.14 -224.69,-266.34 -220.5,-552.46 -72.76,-50.27 -131,-96.64 -209.42,-145.13l-229.57 -139.47c-96.53,-54.24 -414.01,-194.53 -544.22,-196.46l-820.31 -12.02c-256.18,-3.74 -742.08,206.06 -912.84,308.94l-179.91 116.18c-48.42,42.94 -27.97,45.88 -33.98,122.87 -3.4,43.43 -16.44,89.16 -30.65,126.31 -35.15,91.92 -190.56,321.53 -258.37,365.48z"/>
                            <path d="M3357.98 6653.63c-0.68,47.92 -30.88,182.06 -45.54,211.47l361.63 234.29c139.96,87.61 577.02,260.22 734.52,262.53l876.89 12.89c98.31,1.44 383.7,-120.15 495.61,-177.83l23.96 -672.99c-20.03,-11.04 -35.6,-25.97 -46.34,-43.09 -14.51,62.17 -23.4,122.65 -24.23,179.3 -98.84,50.46 -390.65,220.54 -512.47,218.72l-749.6 -11c-136.59,-1.97 -513.94,-159.42 -591.31,-220.39 -44.98,-35.45 -36.28,-113.8 -61.38,-219.14 -34.32,-144.04 -76.23,-278.36 -131.83,-401.61 -29.03,-64.37 -51.52,-121.4 -82.02,-185.16l-190.87 -358.26c-42.29,-71.96 -68.22,-85.72 -65.8,-200.92 10.2,-487.33 -25.4,-1122.07 -18.18,-1612.88l-495.05 -7.26 11.94 852.48c13.72,112.52 -0.57,313.06 -2.83,434.8 -1.78,93.69 13.04,122.08 11.83,211.47 -5.56,419.98 -43.35,270.09 114.48,543.91 118.3,205.27 389.75,731.53 386.57,948.67zm3436.02 -1727.4l0.42 -33.56 -6.84 -0.64c3.82,11.15 5.33,22.68 6.43,34.2zm6.43 -383.93l25.32 -751.6c8.47,-101.41 39.99,-69.32 -453.89,-76.54 -64.48,-0.94 -44.37,99.67 -44.98,168.98l-17.84 649.63 491.38 9.52z"/>
                        </svg>
                        
                        Nuevo tacto
                    </button> 
                </div>
                <div>
                    <button class={classbutton}
                    onclick={openNewModalNacimiento}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 10000 10000" class="size-10 fill-current mx-2" >
                            <g id="Capa_x0020_1">
                            <metadata id="CorelCorpID_0Corel-Layer"/>
                            <g id="_2175713200">
                            <path class="fil0" d="M3178.61 3004c-79.38,-53.01 -233.33,-345.71 -793.79,-468.16 -125.56,-27.43 -1890.79,-45.74 -2094.71,-47.46 -39.87,79.53 -76.79,337.83 -77.88,461.6 -5,566.24 251.98,972.74 671.63,1287.46 430.84,323.1 1121.69,417.92 1689.7,422.73l4.47 -505.57c-276.43,-2.34 -485.11,-16.54 -733.81,-67.55 -579.24,-118.82 -1065.13,-407.72 -1115.92,-1074.91 467.3,3.96 934.91,9.61 1402.18,11.83 207.75,0.99 366.35,49.72 518.6,174.3 69.4,56.78 118.26,104.32 166.07,184 115.62,192.71 92.06,268.18 90.14,486.18l516.58 4.37c5.08,-575.79 -43.58,-264.95 267.39,-666.34 113.54,-146.54 196.33,-261.31 256.81,-443.75 25.21,-76.08 8.68,-71.87 150.66,-141.4 109.73,-53.76 417.11,-169.42 548.04,-168.31l841.28 7.12c84.92,0.72 317.3,112.55 379.6,150.45 214.53,130.54 107.74,-7.76 234.14,304.71 50.75,125.47 225.22,365.19 326.23,473.91 160.63,172.88 129.14,23.55 124.84,510.11l531.34 4.49c1.9,-214.9 -40.26,-178.48 19.16,-330.64 111.05,-284.35 379.66,-503.85 681.93,-501.29l1475.94 12.5c-1.74,197.58 -96.49,417.51 -181.69,533.1 -111.34,151.04 -221.87,239.67 -393.07,337.2 -321.92,183.4 -820.19,244.68 -1294.88,240.66l-4.47 505.57c857.18,7.26 1739.97,-185.83 2156.53,-854.43 198.46,-318.53 287.8,-733.54 211.51,-1122.64 -12.18,-62.12 -3.55,-155.37 -61.32,-155.86l-1815.4 -15.37c-380.38,-3.22 -714.81,152.4 -966.66,392.63 -32.43,30.93 -74.95,85.96 -100.49,103.94 -11.79,-17.56 -27.46,-43.22 -41.37,-60.45 -172.55,-213.68 -236.15,-270.73 -233.57,-563.05 -76.23,-50.91 -137.3,-97.94 -219.41,-147l-240.44 -141.1c-101.06,-54.81 -433.21,-196.19 -569.09,-197.34l-856.05 -7.24c-267.35,-2.27 -773.04,215.08 -950.55,321.23l-187.01 119.8c-50.26,44.16 -28.88,47.05 -34.69,125.74 -3.28,44.4 -16.6,91.21 -31.19,129.24 -36.1,94.11 -196.83,329.66 -267.31,374.99z"/>
                            <path class="fil0" d="M3465.68 7268.02c-0.43,48.95 -31.1,186.19 -46.19,216.3l378.81 237.15c146.57,88.66 603.71,262.34 768.09,263.73l915.08 7.75c112.81,0.95 460.79,-151.51 545.08,-200.39l243.93 -148.73c-4.5,-12.71 -7.22,-26.98 -7.62,-42.87l0 -122.53c-22.38,-7.93 -43.21,-23.08 -59.59,-46.84l-95.44 -259.67c-26.63,-19.99 -35.27,-10.72 -64.66,-40.85 -33.28,-10.9 -58.08,-30.46 -73.51,-54.28 -14.76,63.63 -23.64,125.46 -24.15,183.34 -102.84,52.15 -406.27,227.69 -533.38,226.61l-782.24 -6.62c-142.55,-1.2 -537.29,-159.72 -618.38,-221.53 -47.18,-35.97 -38.57,-116.05 -65.43,-223.51 -36.73,-146.96 -81.3,-283.95 -140.09,-409.5 -30.69,-65.57 -54.53,-123.72 -86.76,-188.67l-201.39 -364.84c-44.58,-73.29 -71.73,-87.16 -69.93,-204.86 7.6,-497.96 -33.53,-1146.24 -29.1,-1647.71l-516.58 -4.37 17.79 870.86c15.05,114.88 1.39,319.85 -0.24,444.22 -1.24,95.76 14.39,124.66 13.71,215.98 -3.18,429.1 -43.57,276.21 122.84,554.98 124.75,209 411.31,745 409.35,966.85zm3574.5 -1785.95l0.22 -34.27 -7.16 -0.63c4.08,11.39 5.71,23.13 6.94,34.9zm1.09 -278.98l24.89 -881.32c8.22,-103.64 41.31,-71.04 -474.09,-75.4 -67.27,-0.57 -45.65,102.11 -45.86,172.91l-16.44 751.81c13.54,-8.05 28.91,-13.63 45.64,-16.14 32.35,-4.85 326.98,31.06 465.86,48.14z"/>
                            </g>
                            <g id="_1463232024">
                            <path class="fil0" d="M5863.11 5483.22c-41.24,-27.53 -121.2,-179.57 -412.32,-243.18 -65.22,-14.24 -982.13,-23.75 -1088.05,-24.65 -20.71,41.32 -39.89,175.48 -40.45,239.78 -2.6,294.11 130.88,505.26 348.86,668.74 223.79,167.82 582.64,217.07 877.68,219.57l2.32 -262.6c-143.58,-1.22 -251.98,-8.59 -381.16,-35.09 -300.88,-61.72 -553.26,-211.78 -579.64,-558.34 242.72,2.06 485.62,4.99 728.33,6.15 107.91,0.51 190.29,25.82 269.38,90.53 36.05,29.5 61.42,54.19 86.25,95.57 60.06,100.1 47.83,139.31 46.83,252.54l268.32 2.27c2.64,-299.08 -22.63,-137.62 138.89,-346.11 58.98,-76.12 101.98,-135.74 133.4,-230.5 13.09,-39.52 4.51,-37.33 78.26,-73.45 56.99,-27.92 216.65,-88 284.66,-87.42l436.99 3.7c44.11,0.37 164.81,58.46 197.17,78.15 111.43,67.8 55.97,-4.04 121.62,158.27 26.36,65.17 116.99,189.69 169.45,246.16 83.44,89.8 67.08,12.23 64.85,264.96l275.99 2.34c0.99,-111.63 -20.91,-92.71 9.96,-171.74 57.68,-147.71 197.2,-261.72 354.21,-260.39l766.64 6.49c-0.9,102.63 -50.11,216.87 -94.37,276.91 -57.83,78.46 -115.24,124.49 -204.17,175.15 -167.22,95.27 -426.03,127.1 -672.6,125.01l-2.32 262.61c445.24,3.77 903.79,-96.53 1120.16,-443.82 103.09,-165.46 149.49,-381.02 109.86,-583.13 -6.32,-32.27 -1.84,-80.7 -31.85,-80.96l-942.97 -7.98c-197.58,-1.67 -371.29,79.16 -502.11,203.94 -16.84,16.07 -38.93,44.65 -52.19,53.99 -6.13,-9.12 -14.27,-22.45 -21.49,-31.4 -89.63,-110.99 -122.67,-140.62 -121.33,-292.47 -39.59,-26.44 -71.31,-50.87 -113.96,-76.35l-124.89 -73.29c-52.5,-28.47 -225.03,-101.91 -295.61,-102.5l-444.65 -3.77c-138.87,-1.17 -401.54,111.72 -493.75,166.86l-97.13 62.23c-26.11,22.94 -15,24.44 -18.02,65.31 -1.71,23.06 -8.62,47.38 -16.2,67.13 -18.76,48.88 -102.24,171.24 -138.85,194.78z"/>
                            <path class="fil0" d="M6012.22 7698.08c-0.22,25.42 -16.16,96.71 -23.99,112.35l196.76 123.18c76.13,46.05 313.59,136.26 398.97,136.99l475.32 4.02c58.6,0.5 239.34,-78.69 283.13,-104.09l240.43 -146.6c-6.56,-86.33 -43.87,-72.31 2.66,-209.3 43.07,-126.82 147.64,-307.04 220.01,-424.28 63.84,-103.41 52.46,-41.6 53.03,-204.55 0.19,-52.62 8.12,-74.85 9.09,-119.63 1.81,-84.58 1.49,-170.71 1.92,-255.44l12.86 -443.02c4.27,-53.83 21.46,-36.9 -246.25,-39.17 -34.95,-0.29 -23.72,53.05 -23.83,89.82l-12.64 577.8c-0.15,50.51 -8.12,68.04 -9.06,112.08 -4.73,221.08 -7.34,101.37 -133.13,344.29 -59.62,115.14 -155.94,300.83 -157.19,441.44 -53.42,27.1 -211.02,118.28 -277.05,117.72l-406.32 -3.44c-74.04,-0.63 -279.08,-82.97 -321.2,-115.08 -24.51,-18.68 -20.04,-60.27 -33.99,-116.09 -19.08,-76.34 -42.23,-147.49 -72.76,-212.71 -15.94,-34.06 -28.33,-64.26 -45.07,-98l-104.61 -189.51c-23.15,-38.06 -37.25,-45.27 -36.32,-106.4 3.95,-258.66 -17.42,-595.39 -15.12,-855.87l-268.32 -2.27 9.24 452.35c7.82,59.67 0.72,166.14 -0.12,230.74 -0.65,49.74 7.47,64.75 7.12,112.18 -1.66,222.89 -22.64,143.47 63.8,288.28 64.8,108.55 213.65,386.97 212.63,502.21z"/>
                            </g>
                            </g>
                        </svg>
                        Nuevo nacimiento
                    </button> 
                </div>
                <div>
                    <button class={classbutton}
                    onclick={openNewModalTratamiento}>
                        <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 10000 10000" class="size-10 fill-current mx-2" >
                            <g id="Capa_x0020_1">
                            <metadata id="CorelCorpID_0Corel-Layer"/>
                            <g id="_717768488">
                            <path class="fil0" d="M7690.95 7653.16c58.07,0 321.52,120.51 392.49,150.31l282.55 118.13c57.22,24.4 72.6,29.42 72.6,76.96 0,141.18 -213.24,14.19 -291.69,-18.72l-423.56 -177.47c-35.45,-14.13 -77.05,-24.24 -87.05,-63.41 -9.35,-36.63 24.18,-85.8 54.66,-85.8zm235.21 -57.57c-85.36,-19.47 -120.01,-74.02 -235.21,-74.02 -92.41,0 -184.81,90.46 -184.81,180.93 0,130.75 44.85,171.2 169.17,220.91 43.64,17.44 80.07,34.04 123.66,51.65 28.28,11.43 95.48,45.59 127.19,48.17 -17.5,23.4 -68.04,41.13 -109.2,41.13l-1411.27 0c-96.33,0 -189.64,-69.25 -230.5,-127.98 -92.34,-132.76 -71.91,-322.94 -71.91,-505.28l1890.08 0 -67.2 164.49zm268.81 115.13c-46.88,-24.28 -103.57,-41.12 -151.2,-65.79 43.26,-80.04 142.01,-340.25 184.8,-419.42 27.54,14.26 111.84,50.5 142.81,57.57 -3.1,36.49 -108.09,262.94 -130.8,316.03 -15.42,36.03 -37.32,76.78 -45.61,111.61zm-386.41 -847.07c0,-28.25 -1.31,-44.14 18.83,-63.8 5.52,-5.4 43.35,-26.67 48.37,-26.67 33.97,0 406.86,163.02 493.18,199.77 25.95,11.05 46.06,17.24 72,28.2l417.44 175.24c40.28,17.23 109.43,35.16 109.43,90.23 0,36.73 -31.94,107.82 -114.57,79.9 -125.07,-42.27 -616.64,-258.37 -765.14,-320.67 -102.18,-42.87 -279.54,-90.67 -279.54,-162.2zm-1176.06 -1430.98l932.45 0c51.33,0 100.34,77.71 161.7,137.75 52.47,51.34 98.76,96.68 151.21,148.03 129.51,126.79 224.71,186.05 224.71,405.04l-1352.46 0c-70.26,0 -84.97,131.58 16.8,131.58l1335.66 0c0,236.37 26.82,261.16 -58.8,435.88 -40.13,-9.16 -162.11,-79.08 -262.46,-18.45 -104.32,63.02 21.39,51.34 -275.17,51.34l-1075.31 -0.06c-233.54,-1.24 -151.08,131.65 -83.94,131.65l1327.26 0c0,84.35 25.79,99.77 58.8,148.03l-1327.46 -0.21c-62.41,-0.43 -125.81,8.85 -125.81,66 0,82.18 86.27,65.81 168.01,65.79l1560.67 1.77c39.59,6.4 52.5,27.73 94.21,31.13 -3.85,45.35 -38.59,90.17 -50.4,139.81 -18.84,-4.3 -19.31,-8.23 -42,-8.23l-1906.89 0 0 -1044.45 403.22 0c118.99,0 103.97,-131.58 16.8,-131.58l-420.02 0c0.64,-28.2 10.99,-104.36 18.26,-130.16 26.56,-94.31 48.65,-107.57 96.92,-160.06 1.63,-1.77 6.17,-7.03 7.76,-8.85l7.68 -8.93c1.11,-1.31 2.67,-3.21 3.79,-4.51l15.31 -17.91c39.38,-44.18 351.16,-360.4 379.5,-360.4zm789.64 -567.46l126.01 0 0 444.1 -126.01 0 0 -444.1zm-252.01 0l126 0 0 444.1 -126 0 0 -444.1zm-252.02 0l117.61 0 0 444.1 -117.61 0 0 -444.1zm-260.41 419.43l0 -419.43 126.01 0 0 444.1 -100.81 0c-19.35,0 -25.2,-5.72 -25.2,-24.67zm1075.25 24.67l-50.4 0 0 -444.1c144.67,0 109.2,-40.25 109.2,402.98 0,26.59 -30.49,41.12 -58.8,41.12zm-1318.86 -41.12c0,-94.2 -10.28,-316.27 8.4,-394.75 55.95,-12.76 42.09,-8.23 109.21,-8.23l0 444.1c-35.13,0 -117.61,8.87 -117.61,-41.12zm2864.54 90.46c-35.64,-18.46 -76.55,-34.4 -116.41,-50.51 -28.3,-11.44 -95.5,-45.59 -127.21,-48.18 3.16,-37.1 46.11,-139.8 84.01,-139.8 21.42,0 72.42,24.64 92.17,33.12 23.22,9.98 66.08,24.34 87.71,37.6 62.99,38.62 -7.2,112.82 -20.27,167.77zm-75.61 -353.63c-23.29,-1.89 -138.29,-53.86 -222.41,53.65 -36.23,46.31 -44.71,93.96 -71.6,143.73 -85.82,-44.46 -188.21,-36.75 -241.16,59.96 -53.92,98.5 -330.41,754.65 -410.24,938.89l-20.63 37.38c0,-110.97 2.65,-205.66 -24.02,-289.01 -68.72,-214.75 -239.56,-291.51 -355.25,-433.49 -24.67,-30.27 -56.05,-56.7 -74.35,-83.46 79.85,-18.21 142.8,-75.28 142.8,-156.26l0 -378.3c0,-99.77 -89.34,-164.48 -193.21,-164.48l-1260.05 0c-114.49,0 -193.22,77.07 -193.22,189.15l0 328.96c0,92.86 67.5,174.11 151.21,180.93 -104.52,152.81 -453.62,332.38 -453.62,633.25l0 1685.93c0,119.41 65.75,240.76 127.94,302.39 72.69,72.03 177.6,141.7 292.08,141.7l1402.87 0c76.73,0 153.15,-27.95 211.88,-63.97 26.42,-16.2 34.87,-28.48 56.93,-42.94 99.42,22.67 188.22,106.91 319.22,106.91 169.28,0 267.9,-250.99 93.92,-363.35l-169.53 -72.52c43.26,-80.04 142.02,-340.25 184.81,-419.43 119.49,27.26 249.54,139.81 411.62,139.81 148.99,0 264.85,-221.88 128.14,-355.72 -37.18,-36.4 -89.68,-47.65 -136.54,-71.93 12.55,-52.74 324.66,-746.64 372.56,-861.05 27.49,-65.67 3.58,-101.16 -70.15,-101.16 -43.45,0 -97.61,155.14 -121.2,210.3l-201.61 460.55c-18.04,42.16 -32.15,72.45 -50.41,115.13 -13.34,31.21 -44.17,87.74 -46.8,118.67 -65.68,-1.44 -526.18,-224.96 -621.63,-246.73l75.61 -180.92c33.94,2.76 88.7,30.82 122.4,44.64 22.89,9.38 102.06,45.82 121.21,45.82 36.22,0 125.99,-77.65 3.12,-134.64 -62.47,-28.99 -130.72,-49.56 -187.93,-79.19 26.73,-54.54 47.24,-120.23 75.6,-172.7 103.63,23.63 302.42,176.78 302.42,16.45 0,-43.92 -74.85,-64.63 -111.53,-79.96 -45.45,-19 -100.38,-39.07 -140.48,-59.85l75.6 -172.7c35.58,8.11 77.2,29.55 114.01,44.64 53.87,22.09 87.16,45.82 138,45.82 21.56,0 50.4,-22.84 50.4,-65.79 0,-54.83 -59.99,-67.2 -105.6,-85.78 -45.89,-18.7 -90.67,-43.24 -138.01,-54.03 4.27,-50.25 63.2,-133.86 67.21,-180.93 80.79,18.42 297.14,169.54 308.41,31.74 4.92,-60.1 -83.86,-80.68 -153.61,-109.28 -31.74,-13.02 -63.82,-30.25 -96,-37.6l117.6 -263.17c62.98,14.37 432.41,178.6 532.87,218.49 80.85,32.11 89,12.59 -6.51,222.8 -15.06,33.13 -72.73,153.95 -72.73,183.74 0,57.19 66,81.97 107.32,47.74 16.99,-14.07 169.89,-355.7 169.89,-401.37 0,-52.64 -5.12,-74.91 -39.48,-109.39 -34.29,-34.43 -44.98,-33.57 -86.53,-55.09 5.97,-70.16 50.41,-62.45 50.41,-189.15 0,-79.74 -67.15,-140.92 -134.41,-156.26 40.03,-74.06 73.61,-168.14 108.96,-246.95 45.46,-101.3 327.86,-723.53 327.86,-781.05 0,-21.1 -23.33,-49.35 -67.2,-49.35 -57.97,0 -65.4,56.31 -84.25,98.46 -74.73,167.21 -344.78,813.64 -402.98,921.32z"/>
                            <path class="fil0" d="M6279.68 6510.01c0,39.79 26.58,65.8 67.21,65.8l1528.87 0c66.95,0 66.95,-123.36 0,-123.36l-1545.67 0c-23.74,0 -50.41,34.3 -50.41,57.56z"/>
                            </g>
                            <g id="_707816072">
                            <path class="fil0" d="M3180.98 2864.89c-78.63,-52.5 -231.12,-342.41 -786.29,-463.7 -124.37,-27.16 -1872.92,-45.29 -2074.92,-47 -39.49,78.77 -76.06,334.61 -77.14,457.2 -4.95,560.83 249.6,963.46 665.28,1275.17 426.78,320.01 1111.09,413.93 1673.74,418.69l4.43 -500.74c-273.82,-2.32 -480.53,-16.38 -726.88,-66.9 -573.77,-117.69 -1055.06,-403.84 -1105.38,-1064.65 462.89,3.92 926.08,9.51 1388.94,11.71 205.79,0.98 362.89,49.25 513.7,172.64 68.74,56.24 117.14,103.32 164.49,182.23 114.53,190.88 91.2,265.63 89.3,481.55l511.69 4.33c5.04,-570.3 -43.16,-262.42 264.87,-659.98 112.46,-145.14 194.47,-258.82 254.38,-439.51 24.98,-75.36 8.6,-71.19 149.24,-140.06 108.69,-53.24 413.17,-167.8 542.86,-166.71l833.33 7.06c84.12,0.71 314.3,111.47 376.02,149.02 212.5,129.29 106.72,-7.69 231.92,301.8 50.27,124.27 223.1,361.7 323.16,469.39 159.1,171.22 127.91,23.31 123.66,505.23l526.32 4.46c1.88,-212.86 -39.89,-176.78 18.98,-327.49 109.99,-281.64 376.07,-499.04 675.48,-496.51l1462 12.38c-1.73,195.7 -95.58,413.53 -179.98,528.01 -110.28,149.61 -219.77,237.39 -389.35,333.99 -318.88,181.65 -812.44,242.34 -1282.65,238.36l-4.42 500.75c849.07,7.19 1723.53,-184.06 2136.15,-846.28 196.58,-315.5 285.08,-726.54 209.51,-1111.93 -12.06,-61.53 -3.51,-153.88 -60.74,-154.37l-1798.25 -15.22c-376.79,-3.19 -708.06,150.94 -957.53,388.88 -32.12,30.63 -74.23,85.14 -99.53,102.95 -11.69,-17.4 -27.21,-42.81 -40.99,-59.88 -170.92,-211.63 -233.92,-268.14 -231.36,-557.67 -75.51,-50.42 -136,-97.01 -217.34,-145.6l-238.16 -139.75c-100.11,-54.28 -429.12,-194.31 -563.72,-195.45l-847.96 -7.18c-264.82,-2.25 -765.74,213.03 -941.57,318.17l-185.24 118.65c-49.79,43.74 -28.61,46.6 -34.37,124.55 -3.24,43.97 -16.44,90.33 -30.89,128 -35.76,93.21 -194.97,326.51 -264.79,371.41z"/>
                            <g>
                                <path class="fil0" d="M3465.34 7088.22c-0.42,48.48 -30.81,184.41 -45.75,214.23l375.23 234.89c145.18,87.81 598.01,259.83 760.83,261.21l906.44 7.68c111.74,0.94 456.43,-150.06 539.93,-198.48l94.63 -57.69 -25.35 -564.45c-18.33,-10.45 -28.26,-7.86 -52.82,-33.03 -32.96,-10.8 -57.53,-30.18 -72.82,-53.77 -14.62,63.02 -23.41,124.27 -23.92,181.59 -101.87,51.66 -402.42,225.52 -528.34,224.45l-774.85 -6.56c-141.2,-1.19 -532.21,-158.19 -612.54,-219.41 -46.73,-35.63 -38.2,-114.94 -64.81,-221.38 -36.38,-145.55 -80.53,-281.24 -138.76,-405.59 -30.4,-64.95 -54.01,-122.54 -85.94,-186.87l-199.49 -361.36c-44.16,-72.59 -71.05,-86.33 -69.27,-202.9 7.53,-493.21 -33.21,-1135.3 -28.83,-1631.99l-511.7 -4.33 17.63 862.55c14.9,113.79 1.37,316.8 -0.24,439.98 -1.23,94.85 14.25,123.47 13.58,213.92 -3.15,425 -43.16,273.57 121.68,549.69 123.57,206.99 407.42,737.88 405.48,957.62zm3540.74 -1768.91l0.21 -33.94 -7.09 -0.63c4.04,11.28 5.66,22.91 6.88,34.57zm1.08 -276.32l-12.28 -1.51 12.28 1.51zm8.4 -297.5l16.25 -575.41c8.14,-102.65 40.92,-70.36 -469.61,-74.68 -66.64,-0.56 -45.22,101.14 -45.43,171.26l-10.68 488.48 509.47 -9.65z"/>
                            </g>
                            </g>
                            </g>
                        </svg> 
                        Nuevo tratamiento
                    </button> 
                </div>
                <div>
                    <button class={classbutton}
                    onclick={openNewModalInseminacion}>
                        <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 10000 10000" class="size-10 fill-current mx-2" >
                            <g id="Capa_x0020_1">
                            <metadata id="CorelCorpID_0Corel-Layer"/>
                            <g id="_2617814656">
                            <path class="fil0" d="M6387.33 7718.04c-90.56,0 -166.36,-71.86 -166.36,-140.1l0 -52.54c0,-113.14 249.22,-245.92 402.78,-210.14 8.44,101.44 -5.11,151.12 -55.33,251.13 -20.47,40.78 -39.18,68.78 -67.84,98.52l-18.39 16.64c-9.14,6.83 -16.1,10.73 -27.4,16.38 -17.74,8.89 -44.97,20.11 -67.46,20.11zm315.22 -35.02c60.7,-114.7 172,-377.91 31.64,-495.71 -159.67,-134 -396.82,0.43 -521.98,66.66 -17.49,-75.09 -105.07,-185.37 -105.07,-437.8 0,-136.31 37.19,-278.21 81.67,-373.65 41.16,-88.29 118.33,-207.95 187.22,-276.85 22.18,-22.17 37.4,-29.02 61.65,-52.19 20.09,-19.19 41.97,-35.32 63.41,-50.41 137.93,-96.97 336.74,-166.29 525.44,-166.29 554.48,0 1016.39,493.54 909.61,1093.49 -89.8,504.56 -590.86,847.32 -1132.12,722.61 -42,-9.67 -64.17,-21.18 -101.47,-29.86zm-770.53 -866.85c0,130.33 34.58,285.91 72.59,382.72 47.27,120.36 23.01,62.29 73.56,155.05 33.75,61.93 -32.32,32.81 -32.32,215.24 0,60.99 22.67,108.96 43.78,148.86 -35.64,53.23 -72.4,72.57 -106.26,173.94 -51,152.74 37.29,395.24 -249.03,591.55 -57.54,39.45 -128.52,63.12 -207.4,72.79 -51.32,6.29 -77.04,5.08 -125.34,14.75 -38.93,7.8 -79.96,19.1 -110.05,30.06 -95.92,34.97 -291.83,163.64 -313.94,246.44 57.61,-38.58 134.33,-162.3 339.52,-212.11 88.77,-21.54 146.99,-19.04 255.99,-24.2 229.64,-10.87 466.37,-229.82 504.26,-476.43 15.98,-104.01 24.92,-226.47 126.08,-294.21 57.03,15.23 161.25,99.27 332.91,8.94 92.97,-48.92 10.63,-24.96 216.82,27.99 253.35,65.05 531.45,39.21 760.88,-74.75 535.9,-266.16 775.39,-916.82 497.42,-1472.51l-78.02 -132.12c-123.41,-170.35 -254.2,-288.34 -453.93,-377.9 -363.78,-163.1 -748.53,-118.62 -1076.53,100.94 -286.8,191.97 -470.99,549.96 -470.99,894.96zm-963.17 2031.4c-2.86,0.56 -26.4,27.31 -0.98,18.65 15.87,-5.4 16.36,-21.63 0.98,-18.65zm-17.51 26.27c-0.87,0.87 2.61,1.37 2.61,2.6l0 0.01c-0.17,-0.17 -1.74,-3.48 -2.61,-2.61zm-8.75 8.75c-9.31,9.31 13.89,33.22 4.55,9.76 -0.08,-0.2 10.11,-24.42 -4.55,-9.76z"/>
                            <path class="fil0" d="M7928.4 5844.24c-36.16,-155.21 82.37,-415.72 243.01,-407.25 97.65,5.15 181.4,94.17 145.82,218.07 -14.54,50.65 -53.09,83.54 -93.68,107.83 -67,40.11 -129.79,69.5 -207.72,81.92 -50.2,7.99 -34.04,-0.57 -87.43,-0.57zm1190.83 -1103.26l2.6 -2.61c-0.17,0.17 -3.48,1.74 -2.6,2.61zm-805.57 560.39c-281.12,-148.75 -569.14,148.61 -569.14,516.61 0,139.64 110.19,201.39 245.18,201.39 125.04,0 253.28,-63.67 331,-115.55 292.71,-195.44 137.33,-444.8 137.51,-476.98 2.06,-371.86 379.49,-273.11 594.91,-559.32 22.33,-29.66 62.7,-85.54 66.11,-126.54 -64.33,74 -45.04,89.5 -168,173.5 -75.85,51.81 -141.73,76.07 -244.26,97.22 -162.73,33.57 -354.69,123.93 -393.31,289.67z"/>
                            <path class="fil0" d="M5861.97 5143.76c128.76,0 264.44,244.91 227.66,402.78 -139.77,32.56 -486.05,-100.08 -379.45,-318.15 23.24,-47.51 84.08,-84.63 151.79,-84.63zm-437.8 -52.54c112.25,0 77.02,19.1 100.87,82.62 28.32,75.42 -69.55,128.71 42.7,316.68 80.55,134.88 466.02,342.88 642.67,176.79 138.59,-130.3 21.95,-400.29 -59.44,-523.59 -45.13,-68.37 -113.98,-132.02 -193.26,-156.99 -77.31,-24.34 -136.87,-22.18 -214.49,3.25 -43.27,14.16 -60,27.68 -91.39,48.71 -42.42,-28.41 -69.55,-70.06 -157.62,-70.06 -118.27,0 -282.19,171.85 -449.51,-32.06 -50.14,-61.12 -64.02,-100.53 -95.74,-166.93 -1.18,-2.43 -4.57,-9.54 -5.73,-11.79l-9.4 -16.87c2.74,122.89 111.98,330.83 295.02,362.1 63.54,10.85 115.95,-11.86 195.32,-11.86z"/>
                            <path class="fil0" d="M8156.06 7831.86c140.65,0 376.51,102.45 376.51,218.91 0,181.96 -148.88,232.91 -256.06,159.74 -113.91,-77.76 -197.88,-378.65 -120.45,-378.65zm-201.39 26.28c0,163.57 41.68,270.65 124.14,392.47 30.97,45.76 67.6,83.49 113.69,113.96 94.21,62.28 210.1,67.88 316.62,21.75 45.8,-19.83 114.64,-136.15 265.7,166.46 43.3,86.74 63.16,131.75 132.12,209.37 39.2,44.13 142.22,132.43 203.53,146.72 -25.79,-35.2 -143.35,-75.54 -241.56,-318.83 -39.16,-97.01 -50.42,-215.14 -119.83,-300.47 -22.78,-28.02 -47.49,-42.31 -67.66,-72.43 25.04,-107.48 60.07,-208.16 -33.59,-334.16 -36.51,-49.1 -66.31,-74.19 -118.63,-109.03 -82.93,-55.23 -218.08,-117.21 -346.88,-117.21 -119.5,0 -227.65,84.97 -227.65,201.4zm1155.8 1059.48l2.61 -2.61c-0.18,0.17 -3.48,1.74 -2.61,2.61z"/>
                            <path class="fil0" d="M7446.82 6649.8c0,94.7 -71.67,166.37 -166.37,166.37 -147.33,0 -216.45,-182.16 -116.12,-282.49 100.33,-100.34 282.49,-31.22 282.49,116.12zm-166.37 341.48c237.18,0 443.73,-267.8 282.15,-527.32 -29.42,-47.23 -83.16,-93.42 -135.97,-117.95 -128.93,-59.92 -273.07,-36.4 -380.16,61.04 -38.68,35.2 -78.89,104.06 -92.24,161.72 -54.45,235.28 132.19,422.51 326.22,422.51z"/>
                            </g>
                            <g id="_2394626736">
                            <path class="fil0" d="M3190.2 3016.79c-78.87,-53.79 -231.84,-350.84 -788.72,-475.1 -124.76,-27.83 -1878.72,-46.41 -2081.35,-48.17 -39.61,80.72 -76.29,342.85 -77.38,468.46 -4.97,574.63 250.38,987.17 667.34,1306.55 428.1,327.89 1114.54,424.12 1678.93,429l4.43 -513.07c-274.66,-2.38 -482.01,-16.78 -729.12,-68.55 -575.55,-120.58 -1058.33,-413.77 -1108.8,-1090.85 464.31,4.02 928.94,9.75 1393.23,12.01 206.43,0.99 364.02,50.45 515.29,176.88 68.96,57.62 117.51,105.87 165.01,186.72 114.88,195.57 91.48,272.16 89.57,493.39l513.28 4.44c5.05,-584.33 -43.3,-268.88 265.69,-676.22 112.81,-148.71 195.07,-265.19 255.17,-450.33 25.05,-77.21 8.62,-72.94 149.7,-143.5 109.03,-54.56 414.44,-171.94 544.54,-170.81l835.91 7.23c84.38,0.73 315.28,114.21 377.19,152.68 213.15,132.47 107.05,-7.87 232.64,309.23 50.42,127.33 223.78,370.61 324.15,480.94 159.6,175.44 128.31,23.89 124.04,517.67l527.95 4.56c1.89,-218.09 -40,-181.12 19.04,-335.54 110.34,-288.57 377.24,-511.32 677.58,-508.73l1466.52 12.69c-1.73,200.51 -95.87,423.7 -180.53,541 -110.62,153.29 -220.45,243.23 -390.56,342.21 -319.87,186.12 -814.96,248.3 -1286.62,244.23l-4.44 513.06c851.71,7.37 1728.87,-188.59 2142.78,-867.1 197.18,-323.26 285.96,-744.42 210.15,-1139.29 -12.09,-63.04 -3.52,-157.67 -60.93,-158.17l-1803.82 -15.6c-377.95,-3.27 -710.25,154.66 -960.49,398.45 -32.22,31.39 -74.47,87.24 -99.84,105.49 -11.72,-17.83 -27.29,-43.86 -41.11,-61.35 -171.45,-216.85 -234.65,-274.74 -232.08,-571.41 -75.75,-51.66 -136.42,-99.39 -218.01,-149.17l-238.91 -143.2c-100.42,-55.61 -430.44,-199.09 -565.46,-200.26l-850.59 -7.35c-265.64,-2.3 -768.11,218.27 -944.49,325.99l-185.81 121.58c-49.94,44.82 -28.7,47.75 -34.47,127.61 -3.26,45.05 -16.49,92.56 -30.99,131.16 -35.87,95.5 -195.58,334.54 -265.61,380.54z"/>
                            <path class="fil0" d="M3475.44 7344.06c-0.42,49.67 -30.9,188.95 -45.89,219.5l376.39 240.67c145.63,89.97 599.87,266.23 763.19,267.64l675.6 5.85 -89.37 -513.89 -523.14 -4.53c-141.64,-1.22 -533.85,-162.09 -614.43,-224.81 -46.87,-36.51 -38.33,-117.77 -65.01,-226.83 -36.5,-149.13 -80.78,-288.16 -139.19,-415.57 -30.5,-66.55 -54.19,-125.56 -86.21,-191.47l-200.11 -370.25c-44.29,-74.38 -71.27,-88.45 -69.48,-207.9 7.55,-505.34 -33.32,-1163.24 -28.92,-1672.15l-513.29 -4.44 17.68 883.78c14.96,116.59 1.38,324.59 -0.23,450.81 -1.24,97.18 14.29,126.51 13.62,219.18 -3.16,435.46 -43.3,280.31 122.05,563.22 123.96,212.09 408.69,756.04 406.74,981.19zm3554.97 -2174.46l22.55 -815.5c8.16,-105.17 41.04,-72.08 -471.07,-76.51 -66.84,-0.58 -45.36,103.63 -45.57,175.47l-15.34 716.54 509.43 0z"/>
                            </g>
                            </g>
                        </svg>
                        Nueva inseminación
                    </button> 
                </div>
                <div>
                    <button class={classbutton}
                    onclick={openNewModalServicio}>
                        <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 10000 10000" class="size-10 fill-current mx-2" >
                            <g id="Capa_x0020_1">
                            <metadata id="CorelCorpID_0Corel-Layer"/>
                            <g id="_2617814656">
                            <path class="fil0" d="M6387.33 7718.04c-90.56,0 -166.36,-71.86 -166.36,-140.1l0 -52.54c0,-113.14 249.22,-245.92 402.78,-210.14 8.44,101.44 -5.11,151.12 -55.33,251.13 -20.47,40.78 -39.18,68.78 -67.84,98.52l-18.39 16.64c-9.14,6.83 -16.1,10.73 -27.4,16.38 -17.74,8.89 -44.97,20.11 -67.46,20.11zm315.22 -35.02c60.7,-114.7 172,-377.91 31.64,-495.71 -159.67,-134 -396.82,0.43 -521.98,66.66 -17.49,-75.09 -105.07,-185.37 -105.07,-437.8 0,-136.31 37.19,-278.21 81.67,-373.65 41.16,-88.29 118.33,-207.95 187.22,-276.85 22.18,-22.17 37.4,-29.02 61.65,-52.19 20.09,-19.19 41.97,-35.32 63.41,-50.41 137.93,-96.97 336.74,-166.29 525.44,-166.29 554.48,0 1016.39,493.54 909.61,1093.49 -89.8,504.56 -590.86,847.32 -1132.12,722.61 -42,-9.67 -64.17,-21.18 -101.47,-29.86zm-770.53 -866.85c0,130.33 34.58,285.91 72.59,382.72 47.27,120.36 23.01,62.29 73.56,155.05 33.75,61.93 -32.32,32.81 -32.32,215.24 0,60.99 22.67,108.96 43.78,148.86 -35.64,53.23 -72.4,72.57 -106.26,173.94 -51,152.74 37.29,395.24 -249.03,591.55 -57.54,39.45 -128.52,63.12 -207.4,72.79 -51.32,6.29 -77.04,5.08 -125.34,14.75 -38.93,7.8 -79.96,19.1 -110.05,30.06 -95.92,34.97 -291.83,163.64 -313.94,246.44 57.61,-38.58 134.33,-162.3 339.52,-212.11 88.77,-21.54 146.99,-19.04 255.99,-24.2 229.64,-10.87 466.37,-229.82 504.26,-476.43 15.98,-104.01 24.92,-226.47 126.08,-294.21 57.03,15.23 161.25,99.27 332.91,8.94 92.97,-48.92 10.63,-24.96 216.82,27.99 253.35,65.05 531.45,39.21 760.88,-74.75 535.9,-266.16 775.39,-916.82 497.42,-1472.51l-78.02 -132.12c-123.41,-170.35 -254.2,-288.34 -453.93,-377.9 -363.78,-163.1 -748.53,-118.62 -1076.53,100.94 -286.8,191.97 -470.99,549.96 -470.99,894.96zm-963.17 2031.4c-2.86,0.56 -26.4,27.31 -0.98,18.65 15.87,-5.4 16.36,-21.63 0.98,-18.65zm-17.51 26.27c-0.87,0.87 2.61,1.37 2.61,2.6l0 0.01c-0.17,-0.17 -1.74,-3.48 -2.61,-2.61zm-8.75 8.75c-9.31,9.31 13.89,33.22 4.55,9.76 -0.08,-0.2 10.11,-24.42 -4.55,-9.76z"/>
                            <path class="fil0" d="M7928.4 5844.24c-36.16,-155.21 82.37,-415.72 243.01,-407.25 97.65,5.15 181.4,94.17 145.82,218.07 -14.54,50.65 -53.09,83.54 -93.68,107.83 -67,40.11 -129.79,69.5 -207.72,81.92 -50.2,7.99 -34.04,-0.57 -87.43,-0.57zm1190.83 -1103.26l2.6 -2.61c-0.17,0.17 -3.48,1.74 -2.6,2.61zm-805.57 560.39c-281.12,-148.75 -569.14,148.61 -569.14,516.61 0,139.64 110.19,201.39 245.18,201.39 125.04,0 253.28,-63.67 331,-115.55 292.71,-195.44 137.33,-444.8 137.51,-476.98 2.06,-371.86 379.49,-273.11 594.91,-559.32 22.33,-29.66 62.7,-85.54 66.11,-126.54 -64.33,74 -45.04,89.5 -168,173.5 -75.85,51.81 -141.73,76.07 -244.26,97.22 -162.73,33.57 -354.69,123.93 -393.31,289.67z"/>
                            <path class="fil0" d="M5861.97 5143.76c128.76,0 264.44,244.91 227.66,402.78 -139.77,32.56 -486.05,-100.08 -379.45,-318.15 23.24,-47.51 84.08,-84.63 151.79,-84.63zm-437.8 -52.54c112.25,0 77.02,19.1 100.87,82.62 28.32,75.42 -69.55,128.71 42.7,316.68 80.55,134.88 466.02,342.88 642.67,176.79 138.59,-130.3 21.95,-400.29 -59.44,-523.59 -45.13,-68.37 -113.98,-132.02 -193.26,-156.99 -77.31,-24.34 -136.87,-22.18 -214.49,3.25 -43.27,14.16 -60,27.68 -91.39,48.71 -42.42,-28.41 -69.55,-70.06 -157.62,-70.06 -118.27,0 -282.19,171.85 -449.51,-32.06 -50.14,-61.12 -64.02,-100.53 -95.74,-166.93 -1.18,-2.43 -4.57,-9.54 -5.73,-11.79l-9.4 -16.87c2.74,122.89 111.98,330.83 295.02,362.1 63.54,10.85 115.95,-11.86 195.32,-11.86z"/>
                            <path class="fil0" d="M8156.06 7831.86c140.65,0 376.51,102.45 376.51,218.91 0,181.96 -148.88,232.91 -256.06,159.74 -113.91,-77.76 -197.88,-378.65 -120.45,-378.65zm-201.39 26.28c0,163.57 41.68,270.65 124.14,392.47 30.97,45.76 67.6,83.49 113.69,113.96 94.21,62.28 210.1,67.88 316.62,21.75 45.8,-19.83 114.64,-136.15 265.7,166.46 43.3,86.74 63.16,131.75 132.12,209.37 39.2,44.13 142.22,132.43 203.53,146.72 -25.79,-35.2 -143.35,-75.54 -241.56,-318.83 -39.16,-97.01 -50.42,-215.14 -119.83,-300.47 -22.78,-28.02 -47.49,-42.31 -67.66,-72.43 25.04,-107.48 60.07,-208.16 -33.59,-334.16 -36.51,-49.1 -66.31,-74.19 -118.63,-109.03 -82.93,-55.23 -218.08,-117.21 -346.88,-117.21 -119.5,0 -227.65,84.97 -227.65,201.4zm1155.8 1059.48l2.61 -2.61c-0.18,0.17 -3.48,1.74 -2.61,2.61z"/>
                            <path class="fil0" d="M7446.82 6649.8c0,94.7 -71.67,166.37 -166.37,166.37 -147.33,0 -216.45,-182.16 -116.12,-282.49 100.33,-100.34 282.49,-31.22 282.49,116.12zm-166.37 341.48c237.18,0 443.73,-267.8 282.15,-527.32 -29.42,-47.23 -83.16,-93.42 -135.97,-117.95 -128.93,-59.92 -273.07,-36.4 -380.16,61.04 -38.68,35.2 -78.89,104.06 -92.24,161.72 -54.45,235.28 132.19,422.51 326.22,422.51z"/>
                            </g>
                            <g id="_2394626736">
                            <path class="fil0" d="M3190.2 3016.79c-78.87,-53.79 -231.84,-350.84 -788.72,-475.1 -124.76,-27.83 -1878.72,-46.41 -2081.35,-48.17 -39.61,80.72 -76.29,342.85 -77.38,468.46 -4.97,574.63 250.38,987.17 667.34,1306.55 428.1,327.89 1114.54,424.12 1678.93,429l4.43 -513.07c-274.66,-2.38 -482.01,-16.78 -729.12,-68.55 -575.55,-120.58 -1058.33,-413.77 -1108.8,-1090.85 464.31,4.02 928.94,9.75 1393.23,12.01 206.43,0.99 364.02,50.45 515.29,176.88 68.96,57.62 117.51,105.87 165.01,186.72 114.88,195.57 91.48,272.16 89.57,493.39l513.28 4.44c5.05,-584.33 -43.3,-268.88 265.69,-676.22 112.81,-148.71 195.07,-265.19 255.17,-450.33 25.05,-77.21 8.62,-72.94 149.7,-143.5 109.03,-54.56 414.44,-171.94 544.54,-170.81l835.91 7.23c84.38,0.73 315.28,114.21 377.19,152.68 213.15,132.47 107.05,-7.87 232.64,309.23 50.42,127.33 223.78,370.61 324.15,480.94 159.6,175.44 128.31,23.89 124.04,517.67l527.95 4.56c1.89,-218.09 -40,-181.12 19.04,-335.54 110.34,-288.57 377.24,-511.32 677.58,-508.73l1466.52 12.69c-1.73,200.51 -95.87,423.7 -180.53,541 -110.62,153.29 -220.45,243.23 -390.56,342.21 -319.87,186.12 -814.96,248.3 -1286.62,244.23l-4.44 513.06c851.71,7.37 1728.87,-188.59 2142.78,-867.1 197.18,-323.26 285.96,-744.42 210.15,-1139.29 -12.09,-63.04 -3.52,-157.67 -60.93,-158.17l-1803.82 -15.6c-377.95,-3.27 -710.25,154.66 -960.49,398.45 -32.22,31.39 -74.47,87.24 -99.84,105.49 -11.72,-17.83 -27.29,-43.86 -41.11,-61.35 -171.45,-216.85 -234.65,-274.74 -232.08,-571.41 -75.75,-51.66 -136.42,-99.39 -218.01,-149.17l-238.91 -143.2c-100.42,-55.61 -430.44,-199.09 -565.46,-200.26l-850.59 -7.35c-265.64,-2.3 -768.11,218.27 -944.49,325.99l-185.81 121.58c-49.94,44.82 -28.7,47.75 -34.47,127.61 -3.26,45.05 -16.49,92.56 -30.99,131.16 -35.87,95.5 -195.58,334.54 -265.61,380.54z"/>
                            <path class="fil0" d="M3475.44 7344.06c-0.42,49.67 -30.9,188.95 -45.89,219.5l376.39 240.67c145.63,89.97 599.87,266.23 763.19,267.64l675.6 5.85 -89.37 -513.89 -523.14 -4.53c-141.64,-1.22 -533.85,-162.09 -614.43,-224.81 -46.87,-36.51 -38.33,-117.77 -65.01,-226.83 -36.5,-149.13 -80.78,-288.16 -139.19,-415.57 -30.5,-66.55 -54.19,-125.56 -86.21,-191.47l-200.11 -370.25c-44.29,-74.38 -71.27,-88.45 -69.48,-207.9 7.55,-505.34 -33.32,-1163.24 -28.92,-1672.15l-513.29 -4.44 17.68 883.78c14.96,116.59 1.38,324.59 -0.23,450.81 -1.24,97.18 14.29,126.51 13.62,219.18 -3.16,435.46 -43.3,280.31 122.05,563.22 123.96,212.09 408.69,756.04 406.74,981.19zm3554.97 -2174.46l22.55 -815.5c8.16,-105.17 41.04,-72.08 -471.07,-76.51 -66.84,-0.58 -45.36,103.63 -45.57,175.47l-15.34 716.54 509.43 0z"/>
                            </g>
                            </g>
                      </svg>
                        Nuevo servicio
                    </button> 
                </div>
                <div>
                    <button class={classbutton}
                    onclick={openNewModalObservacion}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 10000 10000" class="size-10 fill-current mx-2" >
                            <g id="Capa_x0020_1">
                            <metadata id="CorelCorpID_0Corel-Layer"/>
                            <g id="_725615824">
                            <path class="fil0" d="M6139.37 6604.85c-80.29,-818.32 1171.21,-918.73 1251.79,-135.12 84.68,822.89 -1176.28,905.68 -1251.79,135.12zm521.23 -1046.45c-347.68,19.64 -635.34,128.97 -901.78,345.18 -142.97,116.03 -568.65,521.4 -483.64,707.65 85.01,186.25 424.72,524.36 600.47,644.78 292.77,200.63 651.04,280.55 996.09,259.2 344.34,-21.27 638.3,-132.31 902.4,-346.71 143.16,-116.22 568.41,-521.45 483.92,-707.93 -82.62,-182.41 -427.53,-527.45 -600.61,-644.55 -298.59,-202.01 -634.86,-278.05 -996.85,-257.62z"/>
                            <path class="fil0" d="M6707.35 6174.89c-487.89,67.86 -386.56,796.96 120.98,724.84 473.67,-67.3 394.48,-796.59 -120.98,-724.84z"/>
                            <path class="fil0" d="M5506.27 5314.87c67.6,0 249.64,11.47 302.12,-11.14 81.57,-35.13 102.42,-136.09 40.02,-199.98 -16.31,-16.69 -65.78,-28.48 -129.14,-35.41l-300.54 0c-63.55,6.89 -113.49,18.63 -130.57,35.18 -17.08,16.55 -29.2,65.04 -36.31,126.76l0 290.95c7.16,61.39 19.32,109.38 36.55,125.18 64.4,59.13 166.25,41.47 204.51,-34.9 27.38,-54.68 13.36,-227.53 13.36,-296.64z"/>
                            <path class="fil0" d="M8026.74 7757.25c-67.6,0 -249.64,-11.46 -302.12,11.14 -81.58,35.14 -102.42,136.1 -40.02,199.98 16.45,16.83 64.35,28.57 125.75,35.42l299.83 0c65.88,-6.99 117.78,-18.82 134.67,-35.18 16.89,-16.37 29.1,-66.62 36.3,-130.5l0 -290.54c-7.11,-59.45 -19.17,-105.91 -36.54,-121.86 -64.31,-58.99 -166.35,-41.33 -204.51,34.9 -27.39,54.69 -13.36,227.53 -13.36,296.64z"/>
                            <path class="fil0" d="M5506.27 7757.25c0,-65.5 11.83,-241.9 -11.5,-292.75 -36.35,-79.24 -140.78,-98.98 -206.37,-38.79 -17.42,16 -29.49,62.59 -36.55,122.27l0 290.13c7.21,63.84 19.42,114.13 36.31,130.5 16.98,16.41 67.6,28.24 132.05,35.18l299.4 0c62.35,-6.94 111.25,-18.73 128.51,-35.65 62.26,-61.06 42.22,-161.28 -35.73,-197.94 -56.43,-26.54 -234.8,-12.95 -306.12,-12.95z"/>
                            <path class="fil0" d="M8026.74 5314.87c0,65.51 -11.83,241.91 11.5,292.76 35.87,78.22 141.68,100.27 206.13,38.51 17.46,-16.69 29.63,-64.12 36.78,-124.54l0 -290.12c-7.15,-62.46 -19.37,-111.5 -36.3,-127.96 -16.84,-16.27 -69.27,-28.15 -135.87,-35.18l-299.87 0c-60.68,6.84 -107.96,18.49 -124.51,35.36 -60.3,61.63 -42.75,161.2 36.01,198.23 52.72,24.78 237.86,12.94 306.13,12.94z"/>
                            </g>
                            <g id="_721994584">
                            <path class="fil0" d="M3191.54 3056.24c-78.82,-52.08 -231.67,-339.71 -788.14,-460.04 -124.66,-26.95 -1877.33,-44.94 -2079.8,-46.64 -39.59,78.16 -76.24,331.98 -77.33,453.61 -4.96,556.41 250.19,955.87 666.85,1265.13 427.78,317.49 1113.71,410.67 1677.68,415.4l4.43 -496.8c-274.45,-2.3 -481.66,-16.25 -728.58,-66.38 -575.12,-116.76 -1057.55,-400.66 -1107.98,-1056.27 463.97,3.89 928.26,9.44 1392.2,11.63 206.27,0.96 363.75,48.85 514.91,171.27 68.91,55.8 117.42,102.51 164.88,180.8 114.8,189.37 91.42,263.54 89.5,477.75l512.91 4.3c5.05,-565.8 -43.27,-260.35 265.49,-654.78 112.72,-144 194.93,-256.78 254.98,-436.06 25.03,-74.76 8.62,-70.62 149.59,-138.95 108.94,-52.82 414.13,-166.48 544.13,-165.39l835.3 7c84.31,0.7 315.03,110.59 376.9,147.84 212.99,128.27 106.97,-7.62 232.47,299.43 50.38,123.29 223.62,358.86 323.91,465.69 159.48,169.88 128.22,23.13 123.95,501.26l527.56 4.42c1.88,-211.18 -39.98,-175.39 19.02,-324.91 110.26,-279.42 376.96,-495.11 677.08,-492.6l1465.43 12.28c-1.73,194.16 -95.8,410.27 -180.4,523.86 -110.54,148.42 -220.28,235.51 -390.26,331.36 -319.64,180.21 -814.36,240.43 -1285.67,236.48l-4.43 496.8c851.07,7.13 1727.58,-182.61 2141.18,-839.61 197.04,-313.01 285.74,-720.82 209.99,-1103.18 -12.08,-61.04 -3.52,-152.67 -60.88,-153.15l-1802.48 -15.1c-377.67,-3.17 -709.72,149.75 -959.78,385.81 -32.19,30.4 -74.41,84.48 -99.77,102.15 -11.71,-17.26 -27.27,-42.47 -41.08,-59.41 -171.32,-209.97 -234.47,-266.03 -231.91,-553.29 -75.68,-50.02 -136.31,-96.24 -217.84,-144.45l-238.73 -138.65c-100.35,-53.85 -430.12,-192.78 -565.04,-193.91l-849.96 -7.13c-265.44,-2.22 -767.54,211.36 -943.79,315.67l-185.67 117.72c-49.9,43.4 -28.68,46.23 -34.45,123.57 -3.25,43.62 -16.47,89.62 -30.96,126.99 -35.85,92.48 -195.43,323.94 -265.41,368.48z"/>
                            <path class="fil0" d="M3476.56 7246.33c-0.42,48.09 -30.87,182.96 -45.86,212.55l376.12 233.04c145.52,87.11 599.42,257.78 762.62,259.15l795.19 6.67c-44.57,-19 -77.06,-58.23 -97.39,-104.86l-21.11 -101.84c0,-68.59 -10.9,-45.19 -11.45,-88.77 -0.61,-48.34 -11.45,-42.04 -11.45,-110.97 0,-47.22 13.8,-74.09 31.49,-91.33l-622.23 -5.22c-141.54,-1.18 -533.46,-156.95 -613.98,-217.69 -46.84,-35.35 -38.3,-114.03 -64.97,-219.64 -36.46,-144.4 -80.71,-279.02 -139.08,-402.39 -30.48,-64.44 -54.14,-121.58 -86.15,-185.4l-199.96 -358.51c-44.26,-72.02 -71.21,-85.65 -69.43,-201.31 7.55,-489.32 -33.29,-1126.36 -28.89,-1619.14l-512.91 -4.3 17.67 855.76c14.94,112.9 1.38,314.31 -0.23,436.52 -1.24,94.1 14.28,122.5 13.6,212.23 -3.16,421.66 -43.26,271.43 121.97,545.37 123.87,205.36 408.38,732.07 406.43,950.08zm3558.57 -2324.38l16.3 -570.79c8.15,-101.83 41.01,-69.8 -470.72,-74.09 -66.8,-0.56 -45.33,100.35 -45.54,169.92l-10.33 467.74 510.29 7.22z"/>
                            </g>
                            </g>
                        </svg>
                        Nueva observacion
                    </button> 
                </div>
            </div>
        </CardBase>
    {:else}
        <CardBase titulo="Inicio">
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
        <div class="form-control">
            <AgregarAnimal bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento/>
            {#if !agregaranimal}
                
                <label for = "animal" class="label">
                    <span class={estilos.labelForm}>Animal</span>
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
                        
                        bind:value={animaltacto}
                        onchange={()=>oninputTacto("ANIMAL")}
                    >
                        {#each madres as a}
                            <option value={a.id}>{a.caravana}</option>    
                        {/each}
                    </select>
                </label>
                
                <label for = "tipo" class="label">
                    <span class={estilos.labelForm}>Categoria</span>
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
                        disabled
                        bind:value={categoriatacto}
                    >
                        {#each tiposanimal as t}
                            <option value={t.id}>{t.nombre}</option>    
                        {/each}
                    </select>
                </label>
            {/if}
            <div class="form-group mt-2">
                <label for = "prenada" class="label ">
                    <span class={estilos.labelForm}>Estado</span>
                </label>
                <RadioButton bind:option={prenadatacto} deshabilitado={false}/>
                
                <label class="input-group hidden">
                    <select 
                        class={`
                            select select-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `} bind:value={prenadatacto}>
                        {#each estados as e}
                            <option value={e.id}>{e.nombre}</option>    
                        {/each}
                    </select>
                </label>
            </div>
            <label for = "fecha" class="label">
                <span class={estilos.labelForm}>Fecha tacto</span>
            </label>
            <label class="input-group ">
                <input id ="fecha" type="date" max={HOY}  
                    class={`
                        input input-bordered 
                        w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2}
                    `} 
                    bind:value={fechatacto}
                    onchange={()=>oninputTacto("FECHA")}
                />
                {#if malfechatacto}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar la fecha del tacto</span>                    
                    </div>
                {/if}
            </label>
            <label for = "tipo" class="label">
                <span class={estilos.labelForm}>Tacto/Ecografia</span>
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
                    bind:value={tipotacto}
                >
                    {#each tipostacto as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                  </select>
            </label>
            <div class="hidden">
            <label for = "vete" class="label">
                <span class="label-text text-base">Veterinario</span>
            </label>
            <label class="input-group">
                <input 
                    id ="vete" 
                    type="text"  
                    class={`
                        hidden
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2}
                    `}
                />
            </label>
            </div>
            <label class="form-control">
                <div class="label">
                    <span class={estilos.labelForm}>Observacion</span>                    
                </div>
                <input 
                    id ="observaciontacto" 
                    type="text"  
                    class={`
                        input 
                        input-bordered 
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        w-full
                        ${estilos.bgdark2}
                    `}
                    bind:value={observaciontacto}
                />
            </label>
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
              <!-- if there is a button, it will close the modal -->              
                <button class="btn btn-success text-white" disabled='{!botonhabilitadotacto}' onclick={guardarTacto} >Guardar</button>              
                
            </form>
        </div>
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
        
        <div class="form-control">
            <label for = "nombre" class="label">
                <span class={estilos.labelForm}>Caravana</span>
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
                    bind:value={caravananac}
                    oninput={()=>oninputNacimiento("CARAVANA")}
                />
                {#if malcaravananac}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe escribir la caravana del animal por nacer</span>                    
                    </div>
                {/if}
            </label>
            
            <label for = "sexo" class="label">
                <span class={estilos.labelForm}>Sexo</span>
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
                    bind:value={sexonac}
                    onchange={()=>oninputNacimiento("SEXO")}
                    
                >
                    {#each sexos as s}
                        <option value={s.id}>{s.nombre}</option>    
                    {/each}
                </select>
                {#if malsexonac}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar el sexo del animal</span>                    
                    </div>
                {/if}
            </label>

            <label for = "peso" class="label">
                <span class={estilos.labelForm}>Peso (KG)</span>
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
                    bind:value={pesonac}
                />
            </label>
            <label for = "fechanacimiento" class="label">
                <span class={estilos.labelForm}>Fecha nacimiento</span>
            </label>
            <label class="input-group ">
                <input id ="fechanacimiento" type="date" max={HOY}  
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={fechanac}
                    onchange={()=>oninputNacimiento("FECHA")}
                />
                {#if malfechanac}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar la fecha del nacimiento</span>                    
                    </div>
                {/if}
            </label>
            <div class="hidden">
            <label for = "nombremadre" class="label">
                <span class="label-text text-base ">Caravana madre</span>
            </label>
            <label class="input-group">
                <input 
                    id ="nombremadre" 
                    type="text"  
                    class={`
                        input 
                        input-bordered 
                        border border-gray-300 rounded-md
                        focus:outline-none 
                        focus:ring-2 focus:ring-green-500 
                        focus:border-green-500
                        w-full 
                        ${estilos.bgdark2} 
                    `}
                    bind:value={nombremadrenac}
                    oninput={()=>oninputNacimiento("MADRE")}
                    
                />
                {#if malmadrenac}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe escribir el nombre de la madre</span>                    
                    </div>
                {/if}
            </label>
            <label for = "madre" class="label">
                <span class="label-text text-base">Madre</span>
            </label>
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={madrenac}
                    onchange={()=>oninputNacimiento("COMBOMADRE")}
                >
                    {#each madres as m}
                        <option value={m.id}>{m.caravana}</option>    
                    {/each}
                  </select>
            </label>
            </div>
            {#if cargadoanimales}
                <PredictSelect bind:valor={madrenac} etiqueta = {"Madre"} bind:cadena={nombremadrenac} lista = {listamadres}>
                    
                </PredictSelect>
            {/if}
            <div class="hidden">
            <label for = "nombrepadre2" class="label">
                <span class="label-text text-base font-semibold">Caravana padre</span>
            </label>
            <label class="input-group">
                <input 
                    id ="nombrepadrenac" 
                    type="text"  
                    class={`
                        input 
                        input-bordered 
                        border border-gray-300 rounded-md
                        focus:outline-none 
                        focus:ring-2 focus:ring-green-500 
                        focus:border-green-500
                        w-full 
                        ${estilos.bgdark2} 
                    `}
                    bind:value={nombrepadrenac}
                    oninput={()=>oninputNacimiento("PADRE")}
                />
                {#if malpadrenac}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe escribir el nombre del padre</span>                    
                    </div>
                {/if}
            </label>
            <label for = "padre" class="label">
                <span class="label-text text-base font-semibold">Padre</span>
            </label>
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={padrenac}
                    onchange={()=>oninputNacimiento("COMBOPADRE")}
                >
                    {#each padres as p}
                        <option value={p.id}>{p.caravana}</option>    
                    {/each}
                  </select>
            </label>
            </div>
            {#if cargadoanimales}
                <PredictSelect bind:valor={padrenac} etiqueta = {"Padre"} bind:cadena={nombrepadrenac} lista = {listapadres}>
                    
                </PredictSelect>
            {/if}
            <label class="form-control">
                <div class="label">
                    <span class={estilos.labelForm}>Observacion</span>                    
                </div>
                <input 
                    id ="observacionnac" 
                    type="text"  
                    class={`
                        input 
                        input-bordered 
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        w-full
                        ${estilos.bgdark2}
                    `}
                    bind:value={observacionnac}
                />
            </label>

        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
              <!-- if there is a button, it will close the modal -->
              <button class="btn btn-success text-white" disabled='{!botonhabilitadonac}' onclick={guardarNacimiento} >Guardar</button>
            </form>
        </div>
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
        
        <div class="form-control">
            <AgregarAnimal bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento/>
            {#if !agregaranimal}
                <label for = "madre" class="label">
                    <span class={estilos.labelForm}>Animal</span>
                </label>
                <label class="input-group ">
                    <select 
                        class={`
                            select select-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500

                            ${estilos.bgdark2} 
                            ${malanimaltrat?"input-error":""}
                        `}
                        onchange={()=>oninputTrat("ANIMAL")}
                        bind:value={animaltrat}
                        
                    >
                        {#each animales as a}
                            <option value={a.id}>{a.caravana}</option>    
                        {/each}
                    </select>
                    <div class={`label ${malanimaltrat?"":"hidden"}`}>
                        <span class="label-text-alt text-red-400">Debe seleccionar el animal</span>
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
                        bind:value={categoriatrat} read
                        onchange={()=>oninputTrat("CATEGORIA")}
                    >
                        {#each categorias as c}
                            <option value={c.id}>{c.nombre}</option>    
                        {/each}
                    </select>
                </label>
            {/if}
            <label for = "fecha" class="label">
                <span class="label-text text-base">Fecha tratamiento</span>
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
                    bind:value={fechatrat}
                    onchange={()=>oninputTrat("FECHA")}
                />
                <div class={`label ${malfechatrat?"":"hidden"}`}>
                    <span class="label-text-alt text-red-400">Debe seleccionar la fecha</span>
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
                    bind:value={tipotrat}
                    onchange={()=>oninputTrat("TIPO")}
                >
                    {#each tipotratamientos as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                </select>
                <div class={`label ${maltipotrat?"":"hidden"}`}>
                    <span class="label-text-alt text-red-400">Debe seleccionar un tipo</span>
                </div>
            </label>
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
                <button class="btn btn-success text-white" disabled='{!botonhabilitadotrat}' onclick={guardarTrat} >Guardar</button>
            </form>
        </div>
    </div>

</dialog>
<dialog id="nuevoModalInseminacion" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div class="
            modal-box w-11/12 max-w-xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Nueva inseminación</h3>  
        
        <div class="form-control">
            <AgregarAnimal bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento/>
            {#if !agregaranimal}
                <label for = "nombre" class="label">
                    <span class="label-text text-base">Caravana</span>
                </label>
                <label class="input-group ">
                    <select 
                        class={`
                            select select-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2} 
                        `}
                        bind:value={idanimalins}
                        onchange={()=>oninputIns("ANIMAL")}
                    >
                        {#each madres as m}
                            <option value={m.id}>{m.caravana}</option>    
                        {/each}
                    </select>
                    {#if malanimalins}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe seleccionar el animal</span>                    
                        </div>
                    {/if}

                </label>
                <label for = "tipo" class="label">
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
                        disabled
                        bind:value={categoriains}
                    >
                        {#each tiposanimal as t}
                            <option value={t.id}>{t.nombre}</option>    
                        {/each}
                    </select>
                </label>
            {/if}
            {#if cargadoanimales}
                <PredictSelect bind:valor={padreins} etiqueta = {"Padre"} bind:cadena={pajuelains} lista = {listapadres}/>
            {/if}
            <label for = "fechainseminacion" class="label">
                <span class="label-text text-base">Fecha de inseminacion</span>
            </label>
            <label class="input-group ">
                <input id ="fechainseminacion" type="date" 
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={fechainseminacion}
                    onchange={()=>oninputIns("FECHAINSEMINACION")}
                />
                {#if malfechainseminacion}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar la fecha de inseminacion</span>                    
                    </div>
                {/if}
            </label>
            <label for = "fechaparto" class="label">
                <span class="label-text text-base">Fecha estimada de parto</span>
            </label>
            <label class="input-group ">
                <input disabled id="fechaparto" type="date" 
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={fechapartoins}
                    onchange={()=>oninputIns("FECHAPARTO")}
                />
                {#if malfechapartoins}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar la fecha aproximada de parto</span>                    
                    </div>
                {/if}
            </label>
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
                <button class="btn btn-success text-white" disabled='{!botonhabilitadoins}' onclick={guardarInseminacion} >Guardar</button>
                
                
            </form>
        </div>
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
        
        <div class="form-control">
            <AgregarAnimal bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento/>
            {#if !agregaranimal}
                <label for = "animal" class="label">
                    <span class="label-text text-base">Animal</span>
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
                        bind:value={animalobs}
                        onchange={()=>oninputObs("ANIMAL")}
                    >   
                        {#each animales as a}
                            <option value={a.id}>{a.caravana}</option>    
                        {/each}
                    </select>
                    {#if malanimalobs}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe seleccionar el animal</span>                    
                        </div>
                    {/if}
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
                        bind:value={categoriaobs}
                    >
                        {#each categorias as c}
                            <option value={c.id}>{c.nombre}</option>    
                        {/each}
                    </select>
                </label>
            {/if}
           
            <label for = "fecha" class="label">
                <span class="label-text text-base">Fecha observacion</span>
            </label>
            <label class="input-group ">
                <input id ="fecha" type="date" max={HOY}  
                    class={`
                        input input-bordered 
                        w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2}
                    `} 
                    bind:value={fechaobs}
                    onchange={()=>oninputObs("FECHA")}
                />
                {#if malfechaobs}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar la fecha del tacto</span>                    
                    </div>
                {/if}
            </label>
            <div class="label">
                <span class="label-text">Observacion</span>                    
            </div>
            <input 
                id ="observacionobs" 
                type="text"  
                class={`
                    input 
                    input-bordered 
                    border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                    w-full
                    ${estilos.bgdark2}
                `}
                bind:value={observacionobs}
            />
            
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
                <!-- if there is a button, it will close the modal -->
                <button class="btn btn-success text-white" disabled='{!botonhabilitadoobs}' onclick={guardarObs} >Guardar</button>
            </form>
        </div>
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
        <h3 class="text-lg font-bold">Nuevo servicio</h3>  
        
        <div class="form-control">
            <AgregarAnimal bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento/>
            {#if !agregaranimal}
                <label for = "animal" class="label">
                    <span class="label-text text-base">Animal</span>
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
                        bind:value={idanimalser}
                        onchange={()=>oninputSer("ANIMAL")}
                    >   
                        {#each madres as a}
                            <option value={a.id}>{a.caravana}</option>    
                        {/each}
                    </select>
                    {#if malanimalser}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe seleccionar el animal</span>                    
                        </div>
                    {/if}
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
                        bind:value={categoriaser}
                    >
                        {#each categorias as c}
                            <option value={c.id}>{c.nombre}</option>    
                        {/each}
                    </select>
                </label>
            {/if}
            <div >
                <label for = "toros" class="label">
                    <span class="label-text text-base">Toros</span>
                </label>
                <label class="input-group ">
                    {#if cargadoanimales}
                        <MultipleToros toros={padres} bind:valor={padreser} bind:listavalores={padreserlista} />
                    {/if}
                </label>
            </div>
            <div>
                <label for = "fechadesde" class="label">
                    <span class="label-text text-base">Fecha desde</span>
                </label>
                <label class="input-group ">
                    <input id ="fechadesde" type="date"   
                        class={`
                            input input-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2} 
                        `}
                        bind:value={fechadesdeserv}
                        onchange={()=>oninputSer("DESDE")}
                    />
                    {#if malfechadesdeser}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe seleccionar la fecha inicial del servicio</span>                    
                        </div>
                    {/if}
                </label>
            </div>
            <div>
                <label for = "fechahasta" class="label">
                    <span class="label-text text-base">Fecha hasta</span>
                </label>
                <label class="input-group ">
                    <input id ="fechahasta" type="date"   
                        class={`
                            input input-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2} 
                        `}
                        bind:value={fechahastaserv}
                    />
                </label>
            </div>
            <div>
                <label for = "fechaparto" class="label">
                    <span class="label-text text-base">Fecha parto</span>
                </label>
                <label class="input-group ">
                    <input id ="fechaparto" type="date"   
                        class={`
                            input input-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2} 
                        `}
                        bind:value={fechapartoser}
                        
                    />
                    
                </label>

            </div>
            
            <div >
                <label for = "observacion" class="label">
                    <span class="label-text text-base">Observación</span>
                </label>
                <input 
                    id ="obs" 
                    type="text"  
                    class={`
                        input 
                        input-bordered 
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        w-full
                        ${estilos.bgdark2}
                    `}
                    bind:value={observacionser}
                    
                />
            </div>
            <div class="modal-action justify-start ">
                <form method="dialog" >
                    <!-- if there is a button, it will close the modal -->
                    <button class="btn btn-success text-white" disabled='{!botonhabilitadoser}' onclick={guardarServicio} >Guardar</button>
                </form>
            </div>
            
        </div>
    </div>
</dialog>



<script>
    import { Network } from '@capacitor/network';
    import Navbarr from '$lib/components/Navbarr2.svelte';
    import Swal from 'sweetalert2'
    import PocketBase from 'pocketbase'
    import { createRoler } from '$lib/stores/defaultrol.svelte';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import {createCaber} from '$lib/stores/capacitor/capcab.svelte' 
    import {managerCab} from '$lib/stores/capacitor/offlinecab' 
    import {managerAnimales} from "$lib/stores/capacitor/offlineanimales.svelte"
    import {managerGrupos} from "$lib/stores/capacitor/offlinegrupos.svelte"
    import {createUser} from '$lib/stores/capacitor/capuser.svelte'
    import CardBase from '$lib/components/CardBase.svelte';
    import categorias from '$lib/stores/categorias';
    import sexos from '$lib/stores/sexos';
    import tipostacto from '$lib/stores/tipostacto';
    import tiposanimal from '$lib/stores/tiposanimal';
    import {guardarHistorial} from "$lib/historial/lib"
    import {isEmpty} from "$lib/stringutil/lib"
    import estilos from '$lib/stores/estilos';
    import estados from "$lib/stores/estados";
    
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    let usuarioid = $state("")
    let cab = $state({
        exist:false,
        nombre:"",
        id:""
    })
    let caber = createCaber()
    let gruper = managerGrupos()
    let animaler = managerAnimales()
    let userer  = createUser()
    let modoedicion = false
    let animales = $state([])
    let madres = $state([])
    let padres = $state([])
    let tipotratamientos = $state([])
    //Datos cabaña
    let classbutton = "w-full flex items-center justify-center space-x-4 bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
    //Tacto
    let fechatacto = $state("")
    let observaciontacto = $state("")
    let animaltacto = $state("")
    //Tipo animal
    let categoriatacto = $state("vaca")
    let prenadatacto = $state(0)
    //tipo tacto
    let tipotacto = $state("tacto")
    //Validaciones
    let malfechatacto = $state("")
    let malanimaltacto = $state("")
    let malvet = $state("")
    let botonhabilitadotacto=$state(false)
    //Nacimiento    
    let caravananac = $state("")
    let sexonac = $state("")
    let padrenac = $state("")
    let madrenac = $state("")
    let pesonac = $state("")
    let nombremadrenac = $state("")
    let nombrepadrenac = $state("")
    let fechanac = $state("")
    let observacionnac = $state("")
    //Validacion
    let malmadrenac = $state(false)
    let malpadrenac = $state(false)
    let malfechanac = $state(false)
    let malcaravananac = $state(false)
    let malsexonac = $state(false)
    let botonhabilitadonac = $state(false)
    //Tratamiento
    let animaltrat = $state("")
    let categoriatrat = $state("")
    let fechatrat = $state("")
    let tipotrat = $state("")
    //Validaciones
    let malanimaltrat = $state(false)
    let malcategoriatrat = $state(false)
    let malfechatrat = $state(false)
    let maltipotrat = $state(false)
    let botonhabilitadotrat=$state(false)
    //Inseminacion
    let padreins = $state("")
    let pajuelains = $state("")
    let idanimalins = $state("")
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
    let categoriaobs = $state("")
    let fechaobs = $state("")
    let observacionobs = $state("")
    //Validacioones
    let malanimalobs = $state(false)
    let malfechaobs = $state(false)
    let botonhabilitadoobs = $state(false)
    async function getAnimales(){
        //Estaria joya que el animal venga con todos los chiches
        const recordsa = await pb.collection("animales").getFullList({
            filter:`active=true && cab='${cab.id}'`,
            expand:"nacimiento"
        })
        animales = recordsa
        animales.sort((a1,a2)=>a1.caravana>a2.caravana?1:-1)
        madres = animales.filter(a=>a.sexo=="H"||"F")
        padres = animales.filter(a=>a.sexo=="M")
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
        fechatacto = ""
        observaciontacto =  ""
        animaltacto = ""
        categoriatacto = "vaca"
        prenadatacto = 0
        tipotacto = "tacto"
        botonhabilitadotacto = false
        malfechatacto = false
        malanimaltacto = false
        nuevoModalTacto.showModal()
    }
    function openNewModalNacimiento(){
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
        
        fechatrat = ""
        animaltrat = ""
        tipotrat = ""
        categoriatrat = ""
        nuevoModalTratamiento.showModal()
    }
    function openNewModalInseminacion(){
        botonhabilitadoins = false
        malanimalins = false
        malpadreins = false
        malfechainseminacion = false
        malfechapartoins = false
        fechapartoins = ""
        fechainseminacion = ""
        padreins = ""
        idanimalins = ""
        categoriains = ""
        pajuelains = ""
        nuevoModalInseminacion.showModal()
    }
    function openNewModalObservacion(){
        
        observacionobs = ""
        categoriaobs = ""
        fechaobs = ""
        botonhabilitadoobs = false
        malanimalobs = false
        malfechaobs = false
        nuevoModalObservacion.showModal()
    }
    async function guardarTacto(){
        try{
            let data = {
               fecha:fechatacto +" 03:00:00" ,
               observacion:observaciontacto,
               animal:animaltacto,
               categoria:categoriatacto,
               prenada:prenadatacto,
               tipo:tipostacto,
               nombreveterinario:"",
               cab:cab.id,
               active:true
            }
            const record = await pb.collection('tactos').create(data);
            await pb.collection('animales').update(animal,{
                prenada
            })
            await guardarHistorial(pb,animal)
            Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","No se pudo guardar el tacto","error")
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
    async function guardarInseminacion(){
        let caravana = madres.filter(a=>a.id==idanimalins)[0].caravana
        let data = {
            cab:cab.id,
            animal: idanimalins,
            fechaparto: fechapartoins +' 03:00:00',
            fechainseminacion: fechainseminacion + ' 03:00:00',
            active:true,
            padre:padreins,
            pajuela:pajuelains,
            categoria:categoriains
        }
        try{
            const record = await pb.collection('inseminacion').create(data);
            Swal.fire("Éxito guardar","Se pudo guardar la inseminación con exito","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","Hubo un error para guardar la inseminación","error")
        }
    }
    async function guardarObs(){
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
        if(isEmpty(animaltacto)){
            botonhabilitadotacto=false
        }
        if(isEmpty(fechatacto)){
            botonhabilitadotacto=false
        }
    }
    function validarBotonTrat(){
        botonhabilitadotrat = true
        if(isEmpty(animaltrat)){
            botonhabilitadotrat = false
        }
        if(isEmpty(categoriatrat)){
            botonhabilitadotrat = false
        }
        if(isEmpty(tipotrat)){
            botonhabilitadotrat = false
        }
        if(isEmpty(fecha)){
            botonhabilitadotrat = false
        }
    }
    function validarBotonIns(){
        botonhabilitadoins = true
        if(isEmpty(idanimalins)){
            botonhabilitadoins = false
        }
        if(isEmpty(pajuelains)){
            botonhabilitadoins = false
        }
        if(isEmpty(fechainseminacion)){
            botonhabilitadoins = false
        }
    
    }
    function validarBotonObs(){
        botonhabilitadoobs = true
        if(isEmpty(animalobs)){
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
        categoriatacto = a.categoria
    }
    function onSelectAnimalTrat(){
        let a = animales.filter(an=>an.id==animaltrat)[0]
        categoriatrat = a.categoria
    }
    function onSelectAnimalIns(){
        let a = madres.filter(an=>an.id==idanimalins)[0]
        categoriains = a.categoria
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
        categoriaobs = a.categoria
    }
    function oninputTacto(inputName){
        validarBotonTacto()
        if(inputName == "ANIMAL"){
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
        if(campo=="ANIMAL"){
            
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
        else if(campo == "CATEGORIA"){
            if(isEmpty(categoriatrat)){
                malcategoriatrat = true
            }
            else{
                malcategoria = false
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
        if(campo == "ANIMAL"){
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
    function oninputObs(inputName){
        validarBotonObs()
        if(inputName == "ANIMAL"){
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
    onMount(async ()=>{
        
        await caber.init()
        await userer.init()
        cab = caber.cab
        usuarioid = userer.user.id
        if(cab.exist){
            //await getAnimales()
            //await getTiposTratamientos()
            let manager = managerCab()
            await manager.initOnline()
            await animaler.initOnline()
            await gruper.initOnline()
        }
        
        
    })
 
</script>
<Navbarr>
    {#if cab.exist}
        <CardBase titulo="Bievenido a fertil" cardsize="max-w-5xl">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <a class={classbutton}
                        href="/establecimiento"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mx-2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                        </svg>
                        Ir a establecimiento
                    </a>
                </div>
                <div class="hidden">
                    <button class={classbutton}
                    onclick={openNewModalTacto}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mx-2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        
                        Nuevo tacto
                    </button> 
                </div>
                <div class="hidden">
                    <button class={classbutton}
                    onclick={openNewModalNacimiento}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mx-2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                          </svg> 
                        Nuevo nacimiento
                    </button> 
                </div>
                <div class="hidden">
                    <button class={classbutton}
                    onclick={openNewModalTratamiento}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mx-2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                          </svg> 
                        Nuevo tratamiento
                    </button> 
                </div>
                <div class="hidden">
                    <button class={classbutton}
                    onclick={openNewModalInseminacion}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mx-2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                          </svg>
                        Nueva inseminación
                    </button> 
                </div>
                <div class="hidden">
                    <button class={classbutton}
                    onclick={openNewModalObservacion}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mx-2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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
                    bind:value={animaltacto}
                    onchange={()=>oninputTacto("ANIMAL")}
                >
                    {#each madres as a}
                        <option value={a.id}>{a.caravana}</option>    
                    {/each}
                  </select>
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
                    bind:value={categoriatacto}
                >
                    {#each tiposanimal as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                  </select>
            </label>
            <div class="form-group">
                <label for = "prenada" class="label">
                    <span class="label-text text-base">Preñada</span>
                </label>
                <label class="input-group ">
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
                <span class="label-text text-base">Fecha </span>
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
                <span class="label-text text-base">Tacto/Ecografia</span>
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
                    <span class="label-text">Observacion</span>                    
                </div>
                <input 
                    id ="observaciontac" 
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
                <span class="label-text text-base">Caravana</span>
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
                <span class="label-text text-base">Sexo</span>
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
                    bind:value={pesonac}
                />
            </label>
            <label for = "fechanacimiento" class="label">
                <span class="label-text text-base">Fecha nacimiento</span>
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
            <label for = "nombremadre" class="label">
                <span class="label-text text-base">Caravana madre</span>
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
            <label for = "nombrepadrenac" class="label">
                <span class="label-text text-base">Caravana padre</span>
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
                <span class="label-text text-base">Padre</span>
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
            <label class="form-control">
                <div class="label">
                    <span class="label-text">Observacion</span>                    
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
            <label for = "madre" class="label">
                <span class="label-text text-base">Animal</span>
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
                    bind:value={fechatrat}
                    onchange={()=>oninputTrat("FECHA")}
                />
                <div class={`label ${malfechatrat?"":"hidden"}`}>
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
                    bind:value={categoriatrat} read
                    onchange={()=>oninputTrat("CATEGORIA")}
                >
                    {#each categorias as c}
                        <option value={c.id}>{c.nombre}</option>    
                    {/each}
                </select>
                <div class={`label ${malcategoriatrat?"":"hidden"}`}>
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
                    bind:value={categoriains}
                >
                    {#each tiposanimal as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                  </select>
            </label>
            <label for = "nombrepadreins" class="label">
                <span class="label-text text-base">Pajuela</span>
            </label>
            <label class="input-group">
                <input 
                    id ="nombrepadreins" 
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
                    bind:value={pajuelains}
                    oninput={()=>oninputIns("PADRE")}
                />
                {#if malpadreins}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe escribir el nombre del padre</span>                    
                    </div>
                {/if}
            </label>
            <label for = "padre" class="label">
                <span class="label-text text-base">Padre</span>
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
                    bind:value={padreins}
                    onchange={()=>oninputIns("PADRE")}
                >
                    {#each padres as p}
                        <option value={p.id}>{p.caravana}</option>    
                    {/each}
                  </select>
            </label>
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
            <label for = "fecha" class="label">
                <span class="label-text text-base">Fecha </span>
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


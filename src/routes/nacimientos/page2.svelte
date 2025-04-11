<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Exportar from '$lib/components/Exportar.svelte';
    import PocketBase from 'pocketbase'
    import { slide } from 'svelte/transition';
    import Swal from 'sweetalert2';
    import { onMount } from 'svelte';
    import sexos from '$lib/stores/sexos';
    import estilos from '$lib/stores/estilos';
    import { createCaber } from '$lib/stores/cab.svelte';
    import {guardarHistorial} from "$lib/historial/lib"
    import PredictSelect from '$lib/components/PredictSelect.svelte';
    import cuentas from '$lib/stores/cuentas';
    //offline
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import {setAnimalesSQL,getAnimalesSQL,setUltimoAnimalesSQL} from "$lib/stores/sqlite/dbanimales"
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import {getTotalSQL,setTotalSQL,setUltimoTotalSQL} from "$lib/stores/sqlite/dbtotal"
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    //offline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state(false)
    let comandos = $state([])
    //online

    let caber = createCaber()
    let cab = caber.cab
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);    
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    //Datos filtrar
    let nacimientos = $state([])
    let nacimientosrow = $state([])
    let buscar = $state("")
    let fechadesde = $state("")
    let fechahasta = $state("")
    let isOpenFilter = $state(false)
    let buscarmadre = $state("")
    let buscarpadre = $state("")
    let cargadoanimales = $state(false)
    //Datos nacimiento
    let nacimiento = $state(null)
    let idnacimiento = $state("")
    let caravana = $state("")
    let sexo = $state("")
    let padre = $state("")
    let madre = $state("")
    let peso = $state("")
    let nombremadre = $state("")
    let nombrepadre = $state("")
    let cadenamadre = $state("")
    let cadenapadre = $state("")
    let fecha = $state("")
    let madres = $state([])
    let padres = $state([])
    let listamadres = $state([])
    let listapadres = $state([])
    let idanimal = $state("")
    let observacion = $state("")
    let totalNacimientosEncontrados = $state(0)
    //Validacion
    let malmadre = $state(false)
    let malpadre = $state(false)
    let malfecha = $state(false)
    let malcaravana = $state(false)
    let malsexo = $state(false)
    let botonhabilitado=$state(false)
    function clickFilter(){
        isOpenFilter = !isOpenFilter
    }
    function isEmpty(str){
        return (!str || str.length === 0 );
    }
    async function getAnimales(){
        const recordsa = await pb.collection("animales").getFullList({
            filter:`active=true && cab='${cab.id}' && delete = false`,
            expand:"nacimiento"
        })
        madres = recordsa.filter(a=>a.sexo == "H" || a.sexo == "F")
        padres = recordsa.filter(a=>a.sexo == "M")
        cargadoanimales = true
        listamadres = madres.map(item=>{
            return {
                id:item.id,nombre:item.caravana
            }
        })
        listapadres = padres.map(item=>{
            return {
                id:item.id,nombre:item.caravana
            }
        })
    }
    async function getNacimientos(){
        const recordsn = await pb.collection("nacimientosall").getFullList({
            filter:`cab='${cab.id}'`,
            sort:"-fecha",
            expand:"madre,padre"
        })
        nacimientos = recordsn
        nacimientosrow = nacimientos
    }
    async function guardar2() {
        let idprov = "nuevo_nac_"+generarIDAleatorio() 
        let idani = "nuevo_animal_"+generarIDAleatorio() 
        let totalanimals = await getTotalSQL(db)
        let verificar = true
        //No funciona correctamente porque prueva el usuario cuando deberia probar el usuario
        //Dueño de la cabaña
        if(useroff.nivel != -1 && totalanimals >= useroff.nivel){
            verificar =  false
        }
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de ${useroff.nivel} animales`,"error")
            return {id:-1}
        }
        let ms = madres.filter(ma=>ma.id==madre)
        let m = {
            id:"",
            nombremadre:"",
            rodeo:"",
            lote:""
        }
        if(ms.length > 0){
            m.id = ms[0].id
            m.nombremadre = ms[0].caravana
            m.lote = ms[0].lote
            m.rodeo = ms[0].rodeo
        }
        let tipomadre = m.categoria
        let dataparicion = {
            madre:m.id,
            padre,
            fecha:fecha + " 03:00:00",
            nombremadre:m.nombremadre,
            nombrepadre,
            observacion,
            cab:caboff.id
        }

        let data = {
            caravana,
            active:true,
            delete:false,
            fechanacimiento:fecha +" 03:00:00",
            sexo,
            cab:cab.id,
            peso,
            lote:m.lote,
            rodeo:m.rodeo,
            nacimiento:recordparicion.id
        }
    }
    async function guardar(){
        let user = await pb.collection("users").getOne(usuarioid)
        
        let nivel  = cuentas.filter(c=>c.nivel == user.nivel)[0]
        
        
        let animals = await pb.collection('Animalesxuser').getList(1,1,{filter:`user='${usuarioid}'`})
        
        let verificar = true
        if(nivel.animales != -1 && animals.totalItems >= nivel.animales){
            verificar =  false
        }
        
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de ${nivel.animales} animales`,"error")
            return
        }
        try{
            
            let ms = madres.filter(ma=>ma.id==madre)
            let m = {
                id:"",
                nombremadre:"",
                rodeo:"",
                lote:""
            }
            if(ms.length > 0){
                m.id = ms[0].id
                m.nombremadre = ms[0].caravana
                m.lote = ms[0].lote
                m.rodeo = ms[0].rodeo
            }
            let tipomadre = m.categoria
            let dataparicion = {
                madre:m.id,
                padre,
                fecha:fecha + " 03:00:00",
                nombremadre:m.nombremadre,
                nombrepadre,
                observacion,
                cab:cab.id
            }
            const recordparicion = await pb.collection('nacimientos').create(dataparicion);
            let data = {
                caravana,
                active:true,
                delete:false,
                fechanacimiento:fecha +" 03:00:00",
                sexo,
                cab:cab.id,
                peso,
                lote:m.lote,
                rodeo:m.rodeo,
                nacimiento:recordparicion.id
            }
            let recorda = await pb.collection('animales').create(data); 
            if(m.id != ""){
                let datamadre = {
                    prenada:0
                }
                if(m.categoria == "vaquillona"){
                    datamadre.categoria = "vaca"
                    let datamadre = {
                        categoria:"vaca"
                    }
                }
                await guardarHistorial(pb,madre)
                await pb.collection('animales').update(madre,datamadre)
            }
            
            Swal.fire("Éxito guardar","Se pudo guardar el nacimiento con exito","success")
            
            await getNacimientos()
            filterUpdate()

            
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","Hubo un error para guardar el nacimiento","error")
        }
    }
    async function editar(){
        let ms = madres.filter(ma=>ma.id==madre)
        let m = {
            id:"",
            nombremadre:"",
            rodeo:"",
            lote:""
        }
        if(ms.length > 0){
            m.id = ms[0].id
            m.nombremadre = ms[0].caravana
            m.lote = ms[0].lote
            m.rodeo = ms[0].rodeo
        }
        let datanimal={
            fechanacimiento:fecha+" 03:00:00"
        }
        let dataparicion = {
            madre:m.id,
            padre,
            fecha:fecha + " 03:00:00",
            nombremadre:m.nombremadre,
            nombrepadre,
            observacion,    
        }
        try{
            const recorda = await pb.collection('animales').update(idanimal, datanimal);
            const record = await pb.collection('nacimientos').update(idnacimiento, dataparicion);
            Swal.fire("Éxito editar","Se pudo editar el nacimiento con exito","success")
            
            await getNacimientos()
            filterUpdate()
            idnacimiento = ""
            caravana = ""
            sexo = ""
            padre = ""
            madre = ""
            nombremadre = ""
            nombrepadre = ""
            fecha = ""
            observacion = ""
            peso=""
            idanimal = ""
            

        }catch(err){
            console.error(err)
            Swal.fire("Error editar","Hubo un error para editar el nacimiento","error")
        }
    }
    function filterUpdate(){
        nacimientosrow = nacimientos
        totalNacimientosEncontrados = nacimientosrow.length
        if(buscar != ""){
            nacimientosrow = nacimientosrow.filter(n=>n.caravana.toLocaleLowerCase().includes(buscar.toLocaleLowerCase()))
            totalNacimientosEncontrados = nacimientosrow.length
        }
        if(fechadesde != ""){
            nacimientosrow = nacimientosrow.filter(t=>t.fecha>=fechadesde)
            totalNacimientosEncontrados = nacimientosrow.length
        }
        if(fechahasta != ""){
            nacimientosrow = nacimientosrow.filter(t=>t.fecha<=fechahasta)
            totalNacimientosEncontrados = nacimientosrow.length
        }
        if(buscarmadre != ""){
            nacimientosrow = nacimientosrow.filter(t=>t.nombremadre.toLocaleLowerCase().includes(buscarmadre.toLocaleLowerCase()))
            totalNacimientosEncontrados = nacimientosrow.length
        }
        if(buscarpadre != ""){
            nacimientosrow = nacimientosrow.filter(t=>t.nombrepadre.toLocaleLowerCase().includes(buscarpadre.toLocaleLowerCase()))
            totalNacimientosEncontrados = nacimientosrow.length
        }
        
    }
    function openNewModal(){
        idnacimiento = ""
        caravana = ""
        sexo = ""
        padre = ""
        madre = ""
        nombremadre = ""
        nombrepadre = ""
        fecha = ""
        observacion = ""
        peso=""
        idanimal = ""
        botonhabilitado = false
        malcaravana = false
        malfecha  = false
        malmadre = false
        malpadre = false

        nuevoModal.showModal()
    }
    function cerrar(){
        nuevoModal.close()
    }
    function openEditModal(id){
        botonhabilitado = true
        malcaravana = false
        malfecha = false
        malmadre = false
        malpadre = false
        idnacimiento = id
        
        nacimiento = nacimientos.filter(n=>n.id == id)[0]
        if(nacimiento.padre){
            padre = nacimiento.padre
            nombrepadre = nacimiento.nombrepadre
        }
        else{
            padre = ""
        }
        if(nacimiento.madre ){
            madre = nacimiento.madre
            nombremadre = nacimiento.nombremadre
        }
        else{
            madre = ""
        }
        fecha = nacimiento.fecha.split(" ")[0]
        nombremadre = nacimiento.nombremadre
        nombrepadre = nacimiento.nombrepadre
        observacion = nacimiento.observacion
        caravana = nacimiento.caravana
        idanimal = nacimiento.animalid
        nuevoModal.showModal()

    }
    function eliminar(id){
        Swal.fire({
            title: 'Eliminar nacimiento',
            text: '¿Seguro que deseas eliminar el nacimiento?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
        }).then(async result => {
            if(result.value){
                idnacimiento = id
                
                try{
                    await pb.collection('nacimientos').delete(idnacimiento);
                    nacimientos = nacimientos.filter(n=>n.id!=idnacimiento)
                    filterUpdate()
                    const recorda = await pb.collection('animales').getFirstListItem(`nacimiento='${idnacimiento}'`, {});
                    const recordupdate = await pb.collection('animales').update(recorda.id, {nacimiento:""});

                    Swal.fire('Nacimiento eliminado!', 'Se eliminó el nacimiento correctamente.', 'success');
                }
                catch(e){
                    Swal.fire('Acción cancelada', 'No se pudo eliminar al nacimiento', 'error');
                }
                idnacimiento = ""
                nacimiento = null
                
            }
        })
    }
    async function onmountoriginal(params) {
        let pb_json = await JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.record.id
        await getNacimientos()
        filterUpdate()
        await getAnimales()
    }
    //Falta desarrollo
    onMount(async ()=>{
        coninternet = await Network.getStatus();
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
        db = await openDB()
        //Reviso el internet
        let lastinter = await getInternetSQL(db)
        let rescom = await getComandosSQL(db)
        comandos = rescom.lista
        if (coninternet.connected){
            if(lastinter.internet == 0){
            }
            else{

            }
            await setInternetSQL(db,1,Date.now())
        }
        else{
            await setInternetSQL(db,0,Date.now())
        }
    })
    function onwriteMadre(){
        
    }
    function onwritePadre(){
        onchange("PADRE")
    }
    function onelegirMadre(){
        onchange("MADRE")
    }
    function onelegirPadre(){
        onchange("PADRE")
    }
    function cerrarModal(){
        idnacimiento = ""
        caravana = ""
        sexo = ""
        padre = ""
        madre = ""
        nombremadre = ""
        nombrepadre = ""
        fecha = ""
        observacion = ""
        peso  = ""
        nuevoModal.close()
    }
    function getNombreMadre(){
        let m = madres.filter(item=>item.id == madre)[0]
        nombremadre = m.caravana
        onchange("MADRE")
    }
    function getNombrePadre(){
        let p = padres.filter(item=>item.id == padre)[0]
        nombrepadre = p.caravana
        onchange("PADRE")
    }
    function validarBoton(){
        botonhabilitado = true
        if(isEmpty(fecha)){
            botonhabilitado = false
            
        }
        //if(isEmpty(nombremadre)){
        //    botonhabilitado = false
        //    
        //}
        //if(isEmpty(nombrepadre)){
        //    botonhabilitado = false
        //    
        //}
        //if(idnacimiento == "" && isEmpty(sexo)){
        //    botonhabilitado = false
        //    
        //}
        if(isEmpty(caravana)){
            botonhabilitado = false
            
        }
    }
    function onchange(nombreCampo){
        validarBoton()
        if(nombreCampo=="FECHA"){
            if(isEmpty(fecha)){
                malfecha = true
            }
            else{
                malfecha = false
            }
        }
        if(nombreCampo=="CARAVANA"){
            if(isEmpty(caravana)){
                malcaravana = true
            }
            else{
                malcaravana = false
            }
        }
        //if(nombreCampo=="MADRE"){
        //    if(isEmpty(nombremadre)){
        //        malmadre = true
        //    }
        //    else{
        //        malmadre = false
        //    }
        //}
        //if(nombreCampo=="PADRE"){
        //    if(isEmpty(nombrepadre)){
        //        malpadre=true
        //    }
        //    else{
        //        malpadre = true
        //    }
        //}
        //if(nombreCampo=="SEXO"){
        //    if(isEmpty(sexo)){
        //        malsexo = true
        //    }
        //    else{
        //        malsexo = false
        //    }
        //}
    }
    function prepararData(item){
        return {
            CARAVANA:item.caravana,
            FECHA:new Date(item.fecha).toLocaleDateString(),
            MADRE:item.nombremadre,
            PADRE:item.nombrepadre,
            OBSERVACION:item.observacion
        }
    }
</script>
<Navbarr>
    <div class="grid grid-cols-2 lg:grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Nacimientos</h1>  
        </div>
        <div class="flex col-span-2 gap-1 justify-start">
            <div >
                <button class={`btn flex btn-primary rounded-lg ${estilos.btntext}`} data-theme="forest" onclick={()=>openNewModal()}>
                    <span  class="text-xl">Nuevo</span>
                </button>
            </div>
            <div>
                <Exportar
                    titulo ={"Nacimientos"}
                    filtros = {[]}
                    confiltros = {false}
                    data = {nacimientosrow}
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
            <div class="flex justify-between items-center px-1">
                <h1 class="font-semibold text-lg py-2">Filtros</h1>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class={`h-5 w-5 transition-all duration-300 ${isOpenFilter? 'transform rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div> 
        </button>
        <div>
            <span class = "text-lg mx-1">Total de nacimientos encontrados: {totalNacimientosEncontrados}</span>
        </div>
        {#if isOpenFilter}
            <div transition:slide>
                <div class="grid grid-cols-1 lg:grid-cols-2 mb-2 lg:mb-3 gap-1" >
                    <div class="">
                        <label class="block tracking-wide  mb-2" for="grid-first-name">
                          Fecha desde
                        </label>
                        <input id ="fechadesde" type="date"  
                            class={`
                                input input-bordered
                                ${estilos.bgdark2}
                            `} 
                            bind:value={fechadesde} onchange={filterUpdate}
                        />
                    </div>
                    <div class="">
                        <label class="block tracking-wide mb-2" for="grid-first-name">
                          Fecha Hasta
                        </label>
                        <input id ="fechadesde" type="date"  
                            class={`
                                input input-bordered
                                ${estilos.bgdark2}
                            `} 
                            bind:value={fechahasta} onchange={filterUpdate}
                        />
                    </div>
                    <div>
                        <label for = "nombremadre" class="label">
                            <span class="label-text text-base">Madre</span>
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
                                bind:value={buscarmadre}
                                oninput={filterUpdate}
                            />
                        </label>
                    </div>
                    <div>
                        <label for = "nombrepadre" class="label">
                            <span class="label-text text-base">Padre</span>
                        </label>
                        <label class="input-group">
                            <input 
                                id ="nombrepadre" 
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
                                bind:value={buscarpadre}
                                oninput={filterUpdate}
                            />
                        </label>
                    </div>
                </div>
            </div>
        {/if}
    </div> 
    <div class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
        <table class="table table-lg w-full" >
            <thead>
                <tr>
                    <th class="text-base ml-3 pl-3 mr-1 pr-1 border-b dark:border-gray-600">Fecha</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Caravana</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Madre</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Padre</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Observacion</th>
                    
                </tr>
            </thead>
            <tbody>
                {#each nacimientosrow as n}
                    <tr onclick={()=>openEditModal(n.id)} class="hover:bg-gray-200 dark:hover:bg-gray-900">
                        <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10 ">{new Date(n.fecha).toLocaleDateString()}</td>
                        <td class="text-base mx-1 px-1 ">
                            {`${n.caravana}`}
                        </td>
                        <td class="text-base mx-1 px-1 ">
                            {`${n.nombremadre}`}
                        </td>
                        <td class="text-base mx-1 px-1 ">
                            {`${n.nombrepadre}`}
                        </td>
                        <td class="text-base mx-1 px-1 ">
                            {`${n.observacion}`}
                        </td>
                        
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="block w-full md:hidden justify-items-center mx-1">
        {#each nacimientosrow as n}
        <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
            <button onclick={()=>openEditModal(n.id)}>
                <div class="block p-4">
                    <div class="grid grid-cols-2 gap-y-2">
                        <div class="flex items-start">
                            <span >Fecha:</span> 
                            <span class="mx-1 font-semibold">
                                {new Date(n.fecha).toLocaleDateString()}
                            </span>
                            
                        </div>
                        <div class="flex items-start">
                            <span >Caravana:</span> 
                            <span class="mx-1 font-semibold">
                                {`${n.caravana}`}
                            </span>
                            
                        </div>
                        <div class="flex items-start">
                            <span >Madre:</span> 
                            <span class="mx-1 font-semibold">
                                {`${n.nombremadre}`}
                            </span>
                            
                        </div>
                        <div class="flex items-start">
                            <span >Padre:</span> 
                            <span class="mx-1 font-semibold">
                                {`${n.nombrepadre}`}
                            </span>
                            
                        </div>
                        <div class="col-span-2 flex items-start">
                            <span >{`${n.observacion}`}</span> 
                            
                        </div>
                    </div>
                    
                </div>
            </button>
        </div>
        {/each}
    </div>
</Navbarr>
<dialog id="nuevoModal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div class="
            modal-box w-11/12 max-w-xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        {#if idnacimiento == ""}
            <h3 class="text-lg font-bold">Nuevo nacimiento</h3>  
        {:else}
            <h3 class="text-lg font-bold">Ver nacimiento</h3>  
        {/if}
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
                    disabled={idnacimiento!=""}
                  
                    bind:value={caravana}
                    oninput={()=>onchange("CARAVANA")}
                />
                {#if malcaravana}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe escribir la caravana del animal por nacer</span>                    
                    </div>
                {/if}
            </label>
            
            {#if idnacimiento == ""}
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
                        bind:value={sexo}
                        onchange={()=>onchange("SEXO")}
                    >
                        {#each sexos as s}
                            <option value={s.id}>{s.nombre}</option>    
                        {/each}
                    </select>
                    {#if malsexo}
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
                        bind:value={peso}
                    />
                </label>
            {/if}
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
                    bind:value={fecha}
                    onchange={()=>onchange("FECHA")}
                />
                {#if malfecha}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar la fecha del nacimiento</span>                    
                    </div>
                {/if}
            </label>
            <div class="hidden">
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
                    bind:value={nombremadre}
                    oninput={()=>onchange("MADRE")}
                    
                />
                {#if malmadre}
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
                    bind:value={madre}
                    onchange={getNombreMadre}
                >
                    {#each madres as m}
                        <option value={m.id}>{m.caravana}</option>    
                    {/each}
                  </select>
            </label>
            <label for = "nombrepadre" class="label">
                <span class="label-text text-base">Caravana padre</span>
            </label>
            
            </div>
            {#if cargadoanimales}
                <PredictSelect bind:valor={madre} etiqueta = {"Madre"} bind:cadena={nombremadre} lista = {listamadres} onelegir={onelegirMadre} onwrite={onwriteMadre}/>
                <PredictSelect bind:valor={padre} etiqueta = {"Padre"} bind:cadena={nombrepadre} lista = {listapadres} onelegir={onelegirPadre} onwrite={onwritePadre}/>
            {/if}
            
            
            
            
            <div class="hidden">
                <label class="input-group">
                    <input 
                        id ="nombrepadre" 
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
                        bind:value={nombrepadre}
                        oninput={()=>onchange("PADRE")}
                    />
                    {#if malmadre}
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
                    bind:value={padre}
                    onchange={getNombrePadre}
                >
                    {#each padres as p}
                        <option value={p.id}>{p.caravana}</option>    
                    {/each}
                  </select>
            </label>
            </div>
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
              {#if idnacimiento == ""}
                <button class="btn btn-success text-white" disabled='{!botonhabilitado}' onclick={guardar} >Guardar</button>
                {:else}
                <button class="btn btn-success text-white" disabled='{!botonhabilitado}' onclick={editar} >Editar</button>
                <button class="btn btn-error text-white" onclick={()=>eliminar(idnacimiento)}>Eliminar</button>
              {/if}
              <button class="btn btn-neutral " onclick={cerrar}>Cerrar</button>
              
            </form>
        </div>
    </div>
</dialog>
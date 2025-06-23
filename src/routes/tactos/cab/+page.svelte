<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import Exportar from "$lib/components/Exportar.svelte";
    import PocketBase from 'pocketbase'
    import { slide } from 'svelte/transition';
    import Swal from 'sweetalert2';
    import { onMount } from 'svelte';
    import sexos from '$lib/stores/sexos';
    import tipostacto from '$lib/stores/tipostacto';
    
    import estilos from '$lib/stores/estilos';
    import estados from "$lib/stores/estados";
    import categorias from '$lib/stores/categorias';
    import { createCaber } from "$lib/stores/cab.svelte";
    import {guardarHistorial} from "$lib/historial/lib"
    import RadioButton from "$lib/components/RadioButton.svelte";
    import { createPer } from "$lib/stores/permisos.svelte";
    import { getPermisosList } from "$lib/permisosutil/lib";
    import permisos from "$lib/stores/permisos";
    import { goto } from "$app/navigation";
    import MultiSelect from "$lib/components/MultiSelect.svelte";
    import { getEstadoNombre,getEstadoColor } from "$lib/components/estadosutils/lib";
    //offline
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import {setAnimalesSQL,getAnimalesSQL,setUltimoAnimalesSQL, updateLocalAnimalesSQL, updateLocalAnimalesSQLUser} from "$lib/stores/sqlite/dbanimales"
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import {getTotalSQL,setTotalSQL,setUltimoTotalSQL} from "$lib/stores/sqlite/dbtotal"
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import {
        updateLocalTactosSQLUser,
        updateLocalTactosSQL,
        setTactosSQL,
        getTactosSQL,
        setUltimoTactosSQL,
        getUltimoTactosSQL
    } from '$lib/stores/sqlite/dbeventos';
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    
    //offline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({})
    let ultimo_tacto = $state({})
    let comandos = $state([])
    let getlocal = $state(false)
    let caber = createCaber()
    let cab = caber.cab
    let per = createPer()
    let userpermisos = getPermisosList(per.per.permisos)
    let ruta = import.meta.env.VITE_RUTA

    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);    
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    let tactos = $state([])
    let tactoscab = $state([])
    let animales = $state([])
    let tactosrow = $state([])
    let isOpenFilter = $state(false)
    let caravana = $state("")
    let malcaravana = $state(false)
    let sexo = $state("")
    let peso = $state(0)
    //Filtros
    let buscar = $state("")
    let fechadesde = $state("")
    let fechahasta = $state("")
    let buscarcategoria = $state("")
    let buscarestado = $state("")
    let buscartipo = $state("")
    //Datos tacto
    let tacto = $state(null)
    let idtacto = $state("")
    let fecha = $state("")
    let observacion = $state("")
    let animal = $state("")
    let totalTactosEncontrados = $state(0)
    //Tipo animal
    let categoria = $state("vaca")
    let prenada = $state(0)
    //tipo tacto
    let tipo = $state("tacto")
    let nombreveterinario = $state("")
    //Validaciones
    let malfecha = $state("")
    let malanimal = $state("")
    let malvet = $state("")
    let botonhabilitado=$state(false)
    let botonhabilitadoAnimal=$state(false)
    
    //Funciones
    function clickFilter(){
        isOpenFilter = !isOpenFilter
    }
    async function getTactos(){
        const recordst = await pb.collection('tactos').getFullList({
            filter:`cab='${cab.id}' && active=true`,
            sort: '-fecha',
            expand:"animal"
        });
        tactos = recordst
        tactosrow = tactos
        
    }
    function isEmpty(str){
        return (!str || str.length === 0 );
    }
    async function getAnimales(){
        //Estaria joya que el animal venga con todos los chiches
        const recordsa = await pb.collection("animales").getFullList({
            filter:`active=true && cab='${cab.id}' && sexo='H'`,
            expand:"nacimiento"
        })
        animales = recordsa
        animales.sort((a1,a2)=>a1.caravana>a2.caravana?1:-1)
    }
    function openNewModal(){
        if(permisos[4]){
            tacto = null
            idtacto = ""   
            fecha = ""
            observacion =  ""
            animal = ""
            categoria = "vaca"
            prenada = 0
            tipo = "tacto"
            nombreveterinario = ""
            botonhabilitado = false
            malfecha = false
            malanimal = false
            nuevoModal.showModal()
        }
        else{
            Swal.fire("Sin permisos","No tienes permisos para crear eventos","error")
        }
    }


    function openModalEdit(id){
        if(permisos[4]){
            botonhabilitado = true
            malanimal = false
            malfecha = false
            idtacto = id
            
            tacto = tactos.filter(t=>t.id==idtacto)[0]
            fecha = tacto.fecha.split(" ")[0]
            caravana = tacto.expand.animal.caravana
            observacion = tacto.observacion
            animal = tacto.animal
            categoria = tacto.categoria
            prenada = tacto.prenada
            tipo = tacto.tipo
            
            nuevoModal.showModal()
        }
        else{
            Swal.fire("Sin permisos","No tienes permisos para crear eventos","error")
        }
    }
    function eliminarOnline() {
        Swal.fire({
            title: 'Eliminar tacto',
            text: '¿Seguro que deseas eliminar el tacto?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
        }).then(async result => {
            if(result.value){
                let data = {
                    active:false
                }
                try{
                    await pb.collection('tactos').update(idtacto,data);
                    tactos = tactos.filter(t=>t.id!=idtacto)
                    await setTactosSQL(db,tactos)
                    onChangeTactos()
                    //deberia modificar la base de datos
                    filterUpdate()
                    Swal.fire('Tacto eliminado!', 'Se eliminó el tacto correctamente.', 'success');
                    nuevoModal.close()
                }
                catch(e){
                    Swal.fire('Acción cancelada', 'No se pudo eliminar el tacto', 'error');
                    nuevoModal.close()
                }
                idtacto = ""
                tacto = null
                
            }
        })
    }
    function eliminarOffline() {
        Swal.fire({
            title: 'Eliminar tacto',
            text: '¿Seguro que deseas eliminar el tacto?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
        }).then(async result => {
            if(result.value){
                let data = {
                    active:false
                }
                try{

                    let nanimal = animal.split("_").length > 1
                    let comando = {
                        tipo:"update",
                        coleccion:"tactos",
                        data:{...data},
                        hora:Date.now(),
                        prioridad:2,
                        idprov:idtacto,
                        camposprov:nanimal?"animal":""
                    }
                    comandos.push(comando)
                    await setComandosSQL(db,comandos)
                    tactos = tactos.filter(t=>t.id!=idtacto)
                    await setTactosSQL(db,tactos)
                    onChangeTactos()
                    filterUpdate()
                    Swal.fire('Tacto eliminado!', 'Se eliminó el tacto correctamente.', 'success');
                    nuevoModal.close()
                }
                catch(e){
                    Swal.fire('Acción cancelada', 'No se pudo eliminar el tacto', 'error');
                    nuevoModal.close()
                }
                idtacto = ""
                tacto = null
            }
        })
    }
    function eliminar(){
        if(coninternet.connected){
            eliminarOnline()
        }
        else{
            eliminarOffline()
        }
    }
    function cerrar(){
        tacto = null
        idtacto = ""   
        fecha = ""
        observacion =  ""
        animal = ""
        categoria = "vaca"
        prenada = false
        tipo = "tacto"
        nombreveterinario = ""
        nuevoModal.close()
    }
    function filterUpdate(){
        
        tactosrow = tactoscab
        totalTactosEncontrados = tactosrow.length
        if(buscar!=""){
            tactosrow = tactosrow.filter(t=>t.expand.animal.caravana.toLocaleLowerCase().includes(buscar.toLocaleLowerCase()))
            totalTactosEncontrados = tactosrow.length
        }
        if(fechadesde!=""){
            tactosrow = tactosrow.filter(t=>t.fecha>=fechadesde)
            totalTactosEncontrados = tactosrow.length
        }
        if(fechahasta!=""){
            tactosrow = tactosrow.filter(t=>t.fecha<=fechahasta)
            totalTactosEncontrados = tactosrow.length
        }
        if(buscarcategoria!=""){
            tactosrow = tactosrow.filter(t=>t.categoria == buscarcategoria)
            totalTactosEncontrados = tactosrow.length
        }
        if(buscartipo !=""){
            tactosrow = tactosrow.filter(t=>t.tipo == buscartipo)
            totalTactosEncontrados = tactosrow.length
        }
        if(buscarestado !=""){
            tactosrow = tactosrow.filter(t=>t.prenada == buscarestado)
            totalTactosEncontrados = tactosrow.length
        }
        tactosrow.sort((t1,t2)=>{
            return new Date(t1.fecha)>new Date(t2.fecha)?-1:1
        })
    }
    async function onmountoriginal() {
        let pb_json = await JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.record.id
        await getTactos()
        filterUpdate()
        await getAnimales()
    }
    async function initPage() {
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
    async function updateLocalSQL() {
        await setUltimoTactosSQL(db)
        await setUltimoAnimalesSQL(db)
        
        animales = await updateLocalAnimalesSQLUser(db,pb,usuarioid)
        animales = animales.filter(a=>a.active && a.cab == caboff.id)
        tactos = await updateLocalTactosSQLUser(db,pb,usuarioid)
        
        onChangeTactos()
        filterUpdate()
    }
    async function getLocalSQL() {
        getlocal = true
        let resanimales = await getAnimalesSQL(db)
        let restactos = await getTactosSQL(db)
        
        animales = resanimales.lista.filter(a=>a.cab == caboff.id)
        tactos = restactos.lista
        
        onChangeTactos()
        
        if(modedebug){
            if(offliner.offline){
                let nuevo_tactos = tactoscab.filter(t=>t.id.split("_")[0].includes("nue")) 
                if(nuevo_tactos.length>0){
                    for(let i = 0;i<1;i++){
                        loger.addLog({
                            time: Date.now(),
                            text:JSON.stringify(nuevo_tactos[i],null,2)  
                        })
                        loger.addLog({
                            time: Date.now(),
                            text:JSON.stringify(tactos[i],null,2)  
                        })
                    }
                }
                
            }
            
        }
        filterUpdate()
        
    }
    async function getDataSQL() {
        db = await openDB()
        //Reviso el internet
        let lastinter = await getInternetSQL(db)
        let rescom = await getComandosSQL(db)
        ultimo_tacto = await getUltimoTactosSQL(db)
        comandos = rescom.lista
        if (coninternet.connected){
            if(lastinter.internet == 0){
                await setInternetSQL(db,1,0)
                await updateLocalSQL()
            }
            else{
                let ahora = Date.now()
                let antes = ultimo_tacto.ultimo
                const cincoMinEnMs = ACTUALIZACION;
                if((ahora - antes) >= cincoMinEnMs){
                    
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
    }
    onMount(async ()=>{
        await initPage()
        await getDataSQL()
    })
    function onSelectAnimal(){
        let a = animales.filter(an=>an.id==animal)[0]
        categoria = a.categoria
    }
    function selectOption(opcion){
        prenada = opcion
    }
    function onChangeTactos(){
        tactoscab = tactos.filter(t=>t.cab == caboff.id && t.active)
    }
    async function editarOffline() {   
        try{
            let data = {
               fecha:fecha +" 03:00:00" ,
               observacion,
               animal,
               categoria,
               prenada,
               tipo,
               id:idtacto
            }
            let nanimal = animal.split("_").length > 1
            let comando = {
                tipo:"update",
                coleccion:"tactos",
                data:{...data},
                hora:Date.now(),
                prioridad:2,
                idprov:idtacto,
                camposprov:nanimal?"animal":""
            }
            comandos.push(comando)
            await setComandosSQL(db,comandos)
            let idx = tactos.findIndex(t=>t.id==idtacto)
            loger.addTextLog("idx: " +idx)
            let a = animales.filter(an=>an.id == animal)[0]
            tactos[idx] ={
                ...tactos[idx],
                ...data
            }
            tactos.sort((t1,t2)=>new Date(t1.fecha)>new Date(t2.fecha)?-1:1)
            
            await setTactosSQL(db,tactos)
            onChangeTactos()
            filterUpdate()
            Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","No se pudo guardar el tacto","error")
        }
    }
    async function editarOnline() {
        try{
            let data = {
               fecha:fecha +" 03:00:00" ,
               observacion,
               animal,
               categoria,
               prenada,
               tipo
            }
            await pb.collection('tactos').update(idtacto,data);
            
            //await pb.collection('animales').update(animal,{
            //    prenada
            //})
            let idx = tactos.findIndex(t=>t.id==idtacto)
            let a = animales.filter(an=>an.id == animal)[0]
            tactos[idx] = {
                ...tactos[idx],
                ...data
            }
            tactos.sort((t1,t2)=>new Date(t1.fecha)>new Date(t2.fecha)?-1:1)
            
            await setTactosSQL(db,tactos)
            onChangeTactos()
            filterUpdate()
            Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","No se pudo guardar el tacto","error")
        }
    }
    async function editarTacto(){
        if(coninternet.connected){
            await editarOnline()
        }
        else{
            await editarOffline()
        }
        
    }
    function validarBoton(){
        botonhabilitado = true
        if(isEmpty(animal)){
            botonhabilitado=false
        }
        if(isEmpty(fecha)){
            botonhabilitado=false
        }
    }


    function oninput(inputName){
        validarBoton()

        if(inputName == "FECHA"){
            if(isEmpty(fecha)){
                malfecha = true
            }
            else{
                malfecha = false
            }
        }

    }
    function capitalizeFirstLetter(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    
    }
    function prepararData(item){
        return {
            ANIMAL:item.expand.animal.caravana,
            FECHA:new Date(item.fecha).toISOString().split("T")[0],
            OBSERVACION:item.observacion,
            CATEGORIA:capitalizeFirstLetter(item.categoria),
            TIPO:item=="eco"?"Ecografía":"Tacto",
            ESTADO:item.prenada==2?"Preñada":item.prenada==1?"Dudosa":"Vacia"
        }
    }
</script>
<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-3">
            <div>
                <span>
                    {coninternet.connected?"COn internet":"sin internet"}
                </span>
            </div>
            <div>
                <span>
                    internet {ultimo_tacto.ultimo}
                </span>
            </div>
            <div>
                <span>
                    get local{getlocal}
                </span>
            </div>
        </div>
    {/if}
    <div class="grid grid-cols-1 lg:grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Tactos</h1>
        </div>
        <div class="flex col-span-2 gap-1 justify-start lg:justify-end">
            <div>
                <button 
                    class={` btn btn-primary rounded-lg ${estilos.btntext}`} 
                    data-theme="forest" 
                    onclick={()=>goto("/tactos/cab/movimiento")}
                >
                    <span  class="text-xl">Nuevo</span>
                </button>
            </div>
            <div class="">
                <Exportar
                    titulo ={"Tactos"}
                    filtros = {[]}
                    confiltros = {false}
                    data = {tactosrow}
                    {prepararData}
                />
            </div>
        </div>
    </div>
    <div class="grid grid-cols-1 m-1 mb-2 mt-1 mx-1 lg:mx-10 w-11/12" >
        <div class="w-full lg:w-1/2">
            <label 
                class={`
                    input input-bordered flex items-center gap-2
                    ${estilos.bgdark2}
                `}
            >
                <input type="text" 
                    class="grow" placeholder="Buscar..." bind:value={buscar} oninput={filterUpdate} 
                />
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
                    class={`size-6 transition-all duration-300 ${isOpenFilter? 'transform rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </button>
        <div>
            <span class = "text-lg mx-1">Total de tactos encontrados: {totalTactosEncontrados}</span>
        </div>
        {#if isOpenFilter}
            <div transition:slide>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-1 w-full" >
                    <div class="">
                        <label class="block tracking-wide mb-2" for="grid-first-name">
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
                                    {#each categorias.filter(cat=>cat.sexo=="H") as s}
                                        <option value={s.id}>{s.nombre}</option>
                                    {/each}
                              </select>
                        </label>  
                    </div>
                    <div>
                        <label for = "tipotacto" class="tracking-wide label">
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
                                    {#each tipostacto as s}
                                        <option value={s.id}>{s.nombre}</option>
                                    {/each}
                              </select>
                        </label>
                    </div>
                    <div>
                        <label for = "estado" class=" tracking-wide label">
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
                                bind:value={buscarestado}
                                onchange={filterUpdate}
                            >
                                    <option value="">Todos</option>
                                    {#each estados as s}
                                        <option value={s.id}>{s.nombre}</option>
                                    {/each}
                              </select>
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
                    <th class="text-base border-b dark:border-gray-600"  >Fecha</th>
                    <th class="text-base border-b dark:border-gray-600"  >Animal</th>
                    <th class="text-base border-b dark:border-gray-600"  >Categoria</th>
                    <th class="text-base border-b dark:border-gray-600"  >Estado</th>
                    <th class="text-base border-b dark:border-gray-600"  >Tipo</th>
                    <th class="text-base border-b dark:border-gray-600"  >Observacion</th>
                    
                </tr>
            </thead>
            <tbody>
                {#each tactosrow as t}
                    <tr onclick={()=>openModalEdit(t.id) } class=" hover:bg-gray-200 dark:hover:bg-gray-900">
                        <td class="text-base">
                            {`${new Date(t.fecha).toLocaleDateString()}`}
                        </td>
                        <td class="text-base ">
                            {`${t.expand.animal.caravana}`}
                        </td>
                        <td class="text-base ">
                            
                            {`${capitalizeFirstLetter(t.categoria)}`}
                            
                        </td>
                        <td class="text-base p-3 "> {
                            getEstadoNombre(t.prenada)
                        }</td>
                        <td class="text-base ">
                            {`${t.tipo=="eco"?"Ecografía":"Tacto"}`}
                        </td>
                        <td class="text-base ">
                            {`${t.observacion}`}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
  
    <div class="block w-full md:hidden justify-items-center mx-1">
        {#each tactosrow as t}
        <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
            <button onclick={()=>openModalEdit(t.id) }>
                <div class="block p-4">
                    <div class="flex justify-between items-start mb-2 ">
                        <h3 class="font-medium">{`${new Date(t.fecha).toLocaleDateString()}`}</h3>
                        {#if t.prenada != 1}

                            <div class={`badge badge-outline badge-${getEstadoColor(t.prenada)}`}>{getEstadoNombre(t.prenada)}</div>
                        {/if}
                        
                    </div>
                    <div class="grid grid-cols-2 gap-y-2">
                        <div class="flex items-start">
                            <span >Caravana:</span> 
                            <span class="mx-1 font-semibold">
                              {t.expand.animal.caravana}
                            </span>
                            
                        </div>
                        <div class="flex items-start">
                            <span >Tipo:</span> 
                            <span class="mx-2 font-semibold">
                                {`${t.tipo=="eco"?"Ecografía":"Tacto"}`}
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
    
</Navbarr>
<dialog id="nuevoModal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        <h3 class="text-lg font-bold">Editar tacto</h3>  
        <div class="form-control">
            <label for = "animal" class="label">
                <span class="label-text text-base">Animal</span>
            </label>
            <label for = "animal" class="label">
                <span class="label-text text-base">{caravana}</span>
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
                    bind:value={categoria}
                >
                    {#each categorias.filter(c=>c.sexo == "H") as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                  </select>
            </label>
            <div class="form-group">
                <label for = "prenada" class="label">
                    <span class="label-text text-base">Estado</span>
                </label>

                <RadioButton class="m-1 my-3" bind:option={prenada} deshabilitado={false}/>
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
                    bind:value={fecha}
                />
                {#if malfecha}
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
                    bind:value={tipo}
                >
                    {#each tipostacto as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                  </select>
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
              
              <button class="btn btn-success text-white" disabled='{!botonhabilitado}' onclick={editarTacto} >Editar</button>
                <button class="btn btn-error text-white" onclick={eliminar}>Eliminar</button>
              <button class="btn btn-neutral " onclick={cerrar}>Cerrar</button>
              
            </form>
        </div>
    </div>
</dialog>
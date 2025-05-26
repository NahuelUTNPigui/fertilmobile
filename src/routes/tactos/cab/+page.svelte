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
        getTactosSQL
    } from '$lib/stores/sqlite/dbeventos';
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    
    //offline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({})
    let comandos = $state([])
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

    function openModalEdit(id){
        if(permisos[4]){
            botonhabilitado = true
            malanimal = false
            malfecha = false
            idtacto = id
            tacto = tactos.filter(t=>t.id==idtacto)[0]
            fecha = tacto.fecha.split(" ")[0]
            observacion = tacto.observacion
            animal = tacto.animal
            categoria = tacto.categoria
            prenada = tacto.prenada
            tipo = tacto.tipo
            nombreveterinario = tacto.nombreveterinario
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
                idtacto = id
                let data = {
                    active:false
                }
                try{
                    let recordaedit = await pb.collection('tactos').update(idtacto,data);
                    tactos = tactos.filter(t=>t.id!=idtacto)
                    //deberia modificar la base de datos
                    filterUpdate()
                    Swal.fire('Tacto eliminado!', 'Se eliminó el tacto correctamente.', 'success');
                }
                catch(e){
                    Swal.fire('Acción cancelada', 'No se pudo eliminar el tacto', 'error');
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
                idtacto = id
                let data = {
                    active:false
                }
                try{
                    let recordaedit = await pb.collection('tactos').update(idtacto,data);
                    tactos = tactos.filter(t=>t.id!=idtacto)
                    filterUpdate()
                    Swal.fire('Tacto eliminado!', 'Se eliminó el tacto correctamente.', 'success');
                }
                catch(e){
                    Swal.fire('Acción cancelada', 'No se pudo eliminar el tacto', 'error');
                }
                idtacto = ""
                tacto = null
            }
        })
    }
    function eliminar(id){
        if(coninternet.connected){
            eliminarOnline(id)
        }
        else{
            eliminarOffline(id)
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
        
        tactosrow = tactos
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
        coninternet = await Network.getStatus();
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
    }
    async function updateLocalSQL() {
        tactos = await updateLocalTactosSQLUser(db,pb,usuarioid)
        tactos = tactos.filter(t=>t.cab == caboff.id)
        animales = await updateLocalAnimalesSQLUser(db,pb,usuarioid)
        animales = animales.filter(a=>a.active && a.cab == caboff.id)
        filterUpdate()
    }
    async function getLocalSQL() {
        let resanimales = await getAnimalesSQL(db)
        let restactos = await getTactosSQL(db)
        animales = resanimales.lista.filter(a=>a.active && a.cab == caboff.id)

        tactos = restactos.lista.filter(t=>t.cab ==  caboff.id)
        filterUpdate()
    }
    async function getDataSQL() {
        db = await openDB()
        //Reviso el internet
        let lastinter = await getInternetSQL(db)
        let rescom = await getComandosSQL(db)
        comandos = rescom.lista
        if (coninternet.connected){
            if(lastinter.internet == 0){
                await updateLocalSQL()
            }
            else{
                let ahora = Date.now()
                let antes = lastinter.ultimo
                const cincoMinEnMs = 300000;
                if((ahora - antes) >= cincoMinEnMs){
                    await updateLocalSQL()
                }
                else{
                    await getLocalSQL()            
                }
            }
            await setInternetSQL(db,1,Date.now())
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
        if(animal == "agregar"){
            openNewAnimal()
        } else {
            let a = animales.filter(an=>an.id==animal)[0]
            categoria = a.categoria
        }
    }
    function selectOption(opcion){
        prenada = opcion
    }

    async function guardarAnimal(){
        try{
            let data = {
                caravana,
                active:true,
                delete:false,
                sexo,
                peso,
                cab:cab.id
            }
            let recorda = await pb.collection('animales').create(data)
            Swal.fire("Éxito guardar","Se pudo guardar el animal con exito","success")
            caravana = ""
            sexo = "H"
        }
        catch(e){
            console.error(e)
            Swal.fire("Error guardar","Hubo un error para guardar el animal","error")
        }
        await getAnimales()
    }

    async function guardar(){
        try{
            let data = {
               fecha:fecha +" 03:00:00" ,
               observacion,
               animal,
               categoria,
               prenada,
               tipo,
               nombreveterinario,
               cab:cab.id,
               active:true
            }
            const record = await pb.collection('tactos').create(data);
            await pb.collection('animales').update(animal,{
                prenada
            })
            await guardarHistorial(pb,animal)
            await getTactos()
            filterUpdate()
            Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","No se pudo guardar el tacto","error")
        }
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
               nombreveterinario,
               id:idtacto
            }
            let nanimal = animal.split("_").length>0
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
            let a = animales.filter(an=>an.id == animal)[0]
            tactos[idx] = data
            tactos[idx].expand = {animal:a}
            tactos.sort((t1,t2)=>new Date(t1.fecha)>new Date(t2.fecha)?-1:1)
            await setTactosSQL(db,tactos)
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
               tipo,
               nombreveterinario
            }
            const record = await pb.collection('tactos').update(idtacto,data);
            
            await pb.collection('animales').update(animal,{
                prenada
            })
            let idx = tactos.findIndex(t=>t.id==idtacto)
            let a = animales.filter(an=>an.id == animal)[0]
            tactos[idx] = record
            tactos[idx].expand = {animal:a}
            tactos.sort((t1,t2)=>new Date(t1.fecha)>new Date(t2.fecha)?-1:1)
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
            await editarOffline
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

    function validarBotonAnimal(){
        botonhabilitadoAnimal = true
        if(isEmpty(caravana)){
            botonhabilitadoAnimal=false
        }
    }

    function oninput(inputName){
        validarBoton()
        validarBotonAnimal()
        if(inputName == "ANIMAL"){
            if(isEmpty(animal)){
                malanimal = true
            }
            else{
                malanimal = false
                onSelectAnimal()
            }
        }

        if(inputName == "FECHA"){
            if(isEmpty(fecha)){
                malfecha = true
            }
            else{
                malfecha = false
            }
        }

        if(inputName=="NOMBRE"){
            if(isEmpty(caravana)){
                malcaravana = true
            }
            else{
                malcaravana = false
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
            <div class="hidden">
                <button
                    onclick={()=>goto("/tactos/cab/movimiento")}
                    class={`
                        bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                        ${estilos.btnsecondary}
                        rounded-full
                        px-4 pt-2 pb-3
                    `} 
                    aria-label="Exportar"
                >
                    <span  class="text-xl font-semibold ">Múltiples</span>
                    
                </button>
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
                            {`${capitalizeFirstLetter(t.expand.animal.categoria)}`}
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
                    <div class="flex justify-between items-start mb-2">
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
        {#if idtacto == ""}
            <h3 class="text-lg font-bold">Nuevo tacto</h3>  
        {:else}
            <h3 class="text-lg font-bold">Editar tacto</h3>  
        {/if}
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
                    bind:value={animal}
                    onchange={()=>oninput("ANIMAL")}
                >
                    <option value="agregar">Agregar</option>    
                    {#each animales as a}
                        <option value={a.id}>{a.caravana}</option>    
                    {/each}
                </select>
            </label>
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
                <div class="modal-action justify-start ">
                    <form method="dialog" >
                        <button class="btn btn-success text-white" disabled='{!botonhabilitadoAnimal}' onclick={guardarAnimal} >Guardar Animal</button>
                    </form>
                </div>
            {/if}
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
                    onchange={()=>oninput("FECHA")}
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
            <div class="hidden">
            <label for = "vete" class="label">
                <span class="label-text text-base">Veterinario</span>
            </label>
            <label class="input-group">
                <input 
                    id ="vete" 
                    type="text"  
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2}
                    `}
                    bind:value={nombreveterinario}
                />
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
              {#if idtacto==""}
                <button class="btn btn-success text-white" disabled='{!botonhabilitado}' onclick={guardar} >Guardar</button>
              {:else}
                <button class="btn btn-success text-white" disabled='{!botonhabilitado}' onclick={editarTacto} >Editar</button>
                <button class="btn btn-error text-white" onclick={()=>eliminar(idtacto)}>Eliminar</button>
              {/if}
              <button class="btn btn-neutral " onclick={cerrar}>Cerrar</button>
              
            </form>
        </div>
    </div>
</dialog>
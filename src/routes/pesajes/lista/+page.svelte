<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Exportar from '$lib/components/Exportar.svelte';
    import PocketBase from 'pocketbase'
    import { slide } from 'svelte/transition';
    import Swal from 'sweetalert2';
    import { onMount } from 'svelte';
    import { createCaber } from '$lib/stores/cab.svelte';
    import {isEmpty} from "$lib/stringutil/lib"
    import estilos from '$lib/stores/estilos';
    import {shorterWord} from "$lib/stringutil/lib"
    import * as XLSX from "xlsx"
    //offline
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import {
        getPesajesSQL,
        updateLocalPesajesSQL,
        updateLocalPesajesSQLUser,
        setPesajesSQL
    } from "$lib/stores/sqlite/dbeventos"
    
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    
    //ofline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({})
    let comandos = $state([])

    let caber = createCaber()
    let cab = caber.cab
    let ruta = import.meta.env.VITE_RUTA
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    //let pre = import.meta.env.VITE_PRE
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);    
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let isOpenFilter = $state(false)
    //Datos filtrar
    let buscarcaravana = $state("")
    let fechadesde = $state("")
    let fechahasta = $state("")
    let pesajes = $state([])
    let pesajescab = $state([])
    let pesajesrows = $state([])
    let filas = $state([])
    let columnas = $state([])
    let tablapesaje = $state({})
    let pesajesprocesados = $state([])
    //pesaje
    let idpesaje = $state("")
    let caravana = $state("")
    let fecha = $state("")
    let pesoanterior = $state("")
    let pesonuevo = $state("")
    let ultimos = $state(5)
    function clickFilter(){
        isOpenFilter = !isOpenFilter
    }
    async function getPesajes(){
        const records = await pb.collection('pesaje').getFullList({
            sort: '-fecha',
            expand:"animal,animal.cab",
            filter:`animal.cab = '${cab.id}'`
        });
        pesajes = records
        
    }
    function filterUpdate(){
        filas = []
        columnas = []
        tablapesaje = {}
        pesajesrows = pesajescab
        if(!isEmpty(buscarcaravana)){
            pesajesrows = pesajesrows.filter(p=>p.expand.animal.caravana.toLocaleLowerCase().includes(buscarcaravana.toLocaleLowerCase()))
        }
        if(!isEmpty(fechadesde)){
            pesajesrows = pesajesrows.filter(p=>p.fecha>=fechadesde)
        }
        if(!isEmpty(fechahasta)){
            pesajesrows = pesajesrows.filter(p=>p.fecha<=fechahasta)
        }
        //procesarPesajes()
        procesarUltimosPesajes()
    }
    async function editarPesajeOffline() {
        let data = {
            fecha:new Date(fecha).toISOString().split("T")[0]+" 03:00:00",
            pesonuevo
        }
        try{
            let idx_pesaje = pesajes.findIndex(p=>pesajes)
            pesajes[idx_pesaje].fecha = data.fecha
            pesajes[idx_pesaje].pesonuevo = data.pesonuevo
            onchangePesajes()
            await setPesajesSQL(db,pesajes)
            let comando = {
                tipo:"update",
                coleccion:"pesaje",
                data,
                hora:Date.now(),
                prioridad:2,
                idprov:idpesaje,
                camposprov:""
            }
            Swal.fire("Éxito editar pesaje","Se pudo editar el pesaje","success")
        }  
        catch(err){
            console.error(err)
            Swal.fire("Error editar pesaje","No se pudo editar el pesaje","error")
        }
    }
    async function editarPesajeOnline() {
        try{
            let data = {
                fecha:new Date(fecha).toISOString().split("T")[0]+" 03:00:00",
                pesonuevo
            }
            let idx_pesaje = pesajes.findIndex(p=>p.id==idpesaje)

            await pb.collection("pesaje").update(idpesaje,data)
            pesajes[idx_pesaje].fecha = data.fecha
            pesajes[idx_pesaje].pesonuevo = data.pesonuevo
            onchangePesajes()
            await setPesajesSQL(db,pesajes)
            filterUpdate()
            Swal.fire("Éxito editar pesaje","Se pudo editar el pesaje","success")
        }   
        catch(err){
            console.error(err)
            Swal.fire("Error editar pesaje","No se pudo editar el pesaje","error")
        }
        detallePesaje.close()
    }
    async function editarPesaje() {
        if(coninternet.connected){
            await editarPesajeOnline()
        }
        else{
            await editarPesajeOffline()
        }

    }
    function eliminarOffline(){
        Swal.fire({
            title: 'Eliminar pesajes',
            text: '¿Seguro que deseas eliminar el pesaje?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
        }).then(async result => {
            if(result.value){
                try{
                    pesajes = pesajes.filter(p=>p.id != idpesaje)
                    await setPesajesSQL(db,pesajes)
                    let comando = {
                        tipo:"delete",
                        coleccion:"pesaje",
                        data:{},
                        hora:Date.now(),
                        prioridad:2,
                        idprov:idpesaje,
                        camposprov:""
                    }
                    comandos.push(comando)
                    await setComandosSQL(db,comandos)
                    onChangePesajes()
                    filterUpdate()
                    detallePesaje.close()
                }
                catch(err){
                    console.error(err)
                    detallePesaje.close()
                }
            }
        })
    }
    function eliminarOnline() {
        Swal.fire({
            title: 'Eliminar pesajes',
            text: '¿Seguro que deseas eliminar el pesaje?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
        }).then(async result => {
            if(result.value){
                try{
                    pesajes = pesajes.filter(p=>p.id != idpesaje)
                    await setPesajesSQL(db,pesajes)
                    await pb.collection("pesaje").delete(idpesaje)
                    onChangePesajes()
                    filterUpdate()
                    detallePesaje.close()
                }
                catch(err){
                    console.error(err)
                    detallePesaje.close()
                }
            }
            
        })
    }
    async function eliminar(){
        if(coninternet.connected){
            await eliminarOnline()
        }
        else{
            await eliminarOffline()
        }
        
    }
    function openDetalle(id){
        idpesaje = id
        let pesaje = pesajes.filter(p=>p.id==idpesaje)[0]
        caravana = pesaje.expand.animal.caravana
        fecha = pesaje.fecha.split(" ")[0]
        pesoanterior = pesaje.pesoanterior
        pesonuevo = pesaje.pesonuevo

        detallePesaje.showModal()
    }
    function prepararData(item){
        return {
            ANIMAL:item.expand.animal.caravana,
            FECHA:new Date(item.fecha).toISOString().split("T")[0],
            PESO_ANTERIO:item.pesoanterior,
            PESO_NUEVO:item.pesonuevo
        }
    }
    function exportarPesaje(){
        
        let lista = pesajesrows
        let csvdata = lista.map(f=>{

            let filaexcel = {
                ANIMAL:f.expand.animal.caravana,
                FECHA:new Date(f.fecha).toLocaleDateString(),
                PESO_ANTERIO:f.pesoanterior,
                PESO_NUEVO:f.pesonuevo
            }
            
            return filaexcel
        })
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([])
        ws['A1']={t:'s',v:"Pesajes",s:{}}
        const range = XLSX.utils.decode_range('A1:K1');
        ws['!merges'] = [{ s: { r: range.s.r, c: range.s.c }, e: { r: range.e.r, c: range.e.c } }];
        XLSX.utils.sheet_add_json(ws, csvdata, { origin: 'A2' });
        XLSX.utils.book_append_sheet(wb, ws, "Pesajes");
        let confiltros = false
        let filtros = []
        if(confiltros){
            const wsFilter = XLSX.utils.aoa_to_sheet(filtros)
            XLSX.utils.book_append_sheet(wb, wsFilter, 'Filtros aplicados');
        }
        XLSX.writeFile(wb, `${"Pesajes".replace(/\//g, "-")}.xlsx`, { cellStyles: true });

    }
    function procesarUltimosPesajes(){
        pesajesprocesados = []
        //tabla[animal] = { animal,pesajes:[{fecha,peso}]}
        let tablapesajes = {}
        for(let i = 0;i<pesajesrows.length;i++){
            let p = pesajesrows[i]
            let caravana = p.expand.animal.caravana
            let fecha = p.fecha
            let peso = p.pesonuevo
            let id = p.id
            if(tablapesajes[caravana]){
                if(tablapesajes[caravana].pesajes.length < ultimos){
                    tablapesajes[caravana].pesajes.push({fecha,peso,id})
                }
            }
            else{
                tablapesajes[caravana] = {
                    animal:caravana,
                    pesajes:[{fecha,peso,id}]
                }
            }
        }
        
        for (const [key, value] of Object.entries(tablapesajes)) {
            pesajesprocesados.push(value)
        }
        

    }
    function procesarPesajes(){
        let setanimales = new Set()
        let setfechas = new Set()
        tablapesaje = {}
        for(let i = 0;i<pesajesrows.length;i++){
            let p = pesajesrows[i]
            let caravana = p.expand.animal.caravana
            let fecha = p.fecha
            if(tablapesaje[fecha]){
                //Puede ocurrir que tenga 2 pesajes en el mismo dia?
                //En teoria si pero debe ser unerror, guardo el último
                if(tablapesaje[fecha][caravana]){
                    tablapesaje[fecha][caravana] = {
                        pesonuevo:p.pesonuevo,
                        pesoanterior:p.pesoanterior,
                        id:p.id
                    }
                }
                else{
                    tablapesaje[fecha][caravana] = {
                        pesonuevo:p.pesonuevo,
                        pesoanterior:p.pesoanterior,
                        id:p.id
                    }
                }
            }
            else{
                tablapesaje[fecha]={}
                tablapesaje[fecha][caravana] = {
                    pesonuevo:p.pesonuevo,
                    pesoanterior:p.pesoanterior,
                    id:p.id
                }
            }
            //Así recorro los animales
            setanimales.add(caravana)
            //Así recorro las fecha
            setfechas.add(fecha)
        }
        filas = Array.from(setanimales)
        columnas = Array.from(setfechas)
        columnas.sort((a,b)=>new Date(a)<new Date(b)?-1:1)
        
    }
    async function onMountOriginal(){
        await getPesajes()
        filterUpdate()
    }
    function onChangePesajes(){
        
        pesajescab  = pesajes.filter(p=>p.expand.animal.cab == caboff.id) 
    }
    async function updateLocalSQL(){
        
        pesajes = await updateLocalPesajesSQLUser(db,pb,usuarioid)
        onChangePesajes()
        filterUpdate()
    }
    async function getLocalSQL() {
        
        let respesajes = await getPesajesSQL(db)
        pesajes = respesajes.lista
        onChangePesajes()
        filterUpdate()
    }
    async function initPage() {
        coninternet = await Network.getStatus();
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
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
</script>
<Navbarr>
    {#if modedebug}
    <div class="label">
            pesajes - {pesajes.length}
        </div>
        <div class="label">
            pesajescab - {pesajescab.length}
        </div>
        <div class="label">
            pesajesrows - {pesajesrows.length}
        </div>
    {/if}
    <div class="grid grid-cols-1  lg:grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl col-span-2 lg:col-span-1">Historia pesajes - Últimos {ultimos}</h1>  
        </div>
        <div class="flex col-span-2 gap-1 justify-end">
            
            <div class="flex flex-row gap-2 ">
                <div>
                    <a class={`
                        btn 
                        bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                        ${estilos.btnsecondary}`} 
                        href={"/pesajes/historial"}
    
                    >
                        <span  class="text-xl font-semibold ">Historial</span>
                    </a>
                </div>
                <button
                    onclick={exportarPesaje}
                    class={`
                        bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                        ${estilos.btnsecondary}
                        rounded-full
                        p-2
                    `} 
                    aria-label="Exportar"
                >
                    <span  class="text-xl font-semibold ">Exportar</span>
                    
                </button>
            </div>
            <div>
                <a class={`
                    btn 
                    bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                    ${estilos.btnsecondary}`} 
                    href={"/pesajes"}

                >
                    <span  class="text-xl font-semibold ">Volver</span>
                </a>
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
                <input type="text" class="grow" placeholder="Buscar..." bind:value={buscarcaravana} oninput={filterUpdate} />
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
        {#if isOpenFilter}
            <div transition:slide>
                <div class="grid grid-cols-1 lg:grid-cols-3 mb-2 lg:mb-3 gap-1" >
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
                </div>
            </div>
        {/if}
    </div>
    
    <div class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
        <table class="table table-lg w-full" >
            <thead>
                <tr>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Animal</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">5</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">4</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">3</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">2</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">1</th>
                </tr>
                
            </thead>
            <tbody>
                {#each pesajesprocesados as f}
                    <tr>
                        <td class="text-base mx-1 px-1">
                            {shorterWord(f.animal)}
                        </td>
                        {#each Array(5) as _,idx}
                            {#if f.pesajes.length < ultimos - idx}
                                <td>
                                    {"-"}
                                </td>
                            {:else}
                                <td onclick={()=>openDetalle(f.pesajes[ultimos - idx - 1].id)} class="cursor-pointer text-base mx-1 px-1 hover:bg-gray-200 dark:hover:bg-gray-900">
                                    {new Date(f.pesajes[ultimos - idx - 1].fecha).toLocaleDateString()} , {f.pesajes[ultimos - idx - 1].peso}
                                </td>
                            {/if}
                                
                        {/each}
                        
                        
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="w-full md:hidden justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
        <table class="table table-lg w-full" >
            <thead>
                <tr>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Animal</th>
                    
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">3</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">2</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">1</th>
                </tr>
                
            </thead>
            <tbody>
                {#each pesajesprocesados as f}
                    <tr>
                        <td class="text-base mx-1 px-1">
                            {shorterWord(f.animal)}
                        </td>
                        {#each Array(3) as _,idx}
                            {#if f.pesajes.length < ultimos - (idx+2)}
                                <td>
                                    {"-"}
                                </td>
                            {:else}
                                <td onclick={()=>openDetalle(f.pesajes[ultimos - (idx+2) - 1].id)} class="cursor-pointer text-base mx-1 px-1 hover:bg-gray-200 dark:hover:bg-gray-900">
                                    {new Date(f.pesajes[ultimos - (idx+2) - 1].fecha).toLocaleDateString()} , {f.pesajes[ultimos - (idx+2) - 1].peso}
                                </td>
                            {/if}
                                
                        {/each}
                        
                        
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    
</Navbarr>
<dialog id="detallePesaje" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div class="
        modal-box w-11/12 max-w-xl
        bg-gradient-to-br from-white to-gray-100 
        dark:from-gray-900 dark:to-gray-800 
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Ver pesaje</h3>  
        <div class="form-control">
            <div class="grid grid-cols-2 gap-1 lg:gap-6 mx-1 mb-2">
                <div class="mb-1 lg:mb-0">
                    <label for = "caravana" class="label">
                        <span class="label-text text-base">Caravana</span>
                    </label>
                    <label for="caravana" 
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                    >
                        {caravana}
                    </label>
                </div>
                <div class="mb-1 lg:mb-0">
                    <label for = "caravana" class="label">
                        <span class="label-text text-base">Fecha</span>
                    </label>
                    <label class="input-group ">
                        <input id ="fecha" type="date"   
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
                    </label>
                </div>
                <div class="mb-1 lg:mb-0">
                    <label for = "pesoanterior" class="label">
                        <span class="label-text text-base">Peso anterior(KG)</span>
                    </label>
                    <label for="pesoanterior" 
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                    >
                        {pesoanterior}
                    </label>
                </div>
                <div class="mb-1 lg:mb-0">
                    <label for = "pesonuevo" class="label">
                        <span class="label-text text-base">Peso nuevo(KG)</span>
                    </label>
                    <input 
                        id ="pesonuevo" 
                        type="number"  
                        
                        class={`
                            input 
                            input-bordered 
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                            w-full
                            ${estilos.bgdark2}
                        `}
                        bind:value={pesonuevo}
                    />
                </div>
            </div>
        </div>
        <div class="modal-action justify-start ">
            <button class="btn btn-success text-white"  onclick={editarPesaje} >Editar</button>
                <button class="btn btn-error text-white" onclick={eliminar}>Eliminar</button>
                <button class={`
                    btn 
                    bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                    ${estilos.btnsecondary}`} 
                    onclick={()=>detallePesaje.close()}

                >Cerrar</button>
            
        </div>
    </div>
</dialog>
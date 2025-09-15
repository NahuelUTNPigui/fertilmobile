<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import {isEmpty} from "$lib/stringutil/lib"
    import Chart from 'chart.js/auto';
    import {
        editarAnimalSQL
    } from "$lib/stores/sqlite/dbanimales"
    import {
        addNewPesajeSQL,
        setPesajesSQL
    } from "$lib/stores/sqlite/dbeventos"
    import {guardarHistorial} from "$lib/historial/lib"

    //permisos
    import{verificarNivel,getPermisosList, getPermisosMessage} from "$lib/permisosutil/lib"
    import Swal from "sweetalert2";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import {  setComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { getInternet,getOnlyInternet } from "$lib/stores/offline";
    //offline
    import { updatePermisos} from "$lib/stores/capacitor/offlinecab"
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    let ruta = import.meta.env.VITE_RUTA
    const HOY = new Date().toISOString().split("T")[0]
    const pb = new PocketBase(ruta);
    let {
        db,
        pesoanterior,caravana=$bindable("")
        ,peso=$bindable(""),
        coninternet = $bindable({}),
        pesajes=$bindable([]),
        comandos=$bindable([]),
        caboff=$bindable({}),
        
        usuarioid
    } = $props()
    let pesajesrows = $state([])
    let id = $state("")
    //Pesajes
    let fecha = $state("")
    let pesonuevo = $state("")
    let xs = $state([])
    let ys = $state([])

    //detalle
    let fechaedit = $state("")
    let pesonuevoedit = $state("")
    let pesoanterioredit = $state("")
    let idpesaje = $state("")
    //Validaciones
    let malfecha = $state(false)
    let malpeso = $state(false)
    let botonhabilitado = $state(false)

    //chart js
    let ctx;
	let canvas;
    let chart
    async function guardarPesajeOnline() {
        caboff = await updatePermisos(pb,usuarioid)
        let listapermisos = getPermisosList(caboff.permisos)
        if(!listapermisos[4]){
            Swal.fire("Error permisos",getPermisosMessage(4),"error")
            return 
        }
        let data ={
            fecha:fecha+" 03:00:00",
            animal:id,
            pesoanterior,
            pesonuevo
        }
        let dataupdate={
            peso:pesonuevo
        }
        try{
            
            await guardarHistorial(pb,id)
            let recordopesaje = await pb.collection("pesaje").create(data)
            recordopesaje = {
                ...recordopesaje,
                expand:{
                    animal:{
                        id,
                        caravana
                    }
                }
            }
            await addNewPesajeSQL(db,recordopesaje)
            await pb.collection("animales").update(id,dataupdate)
            pesajes.push(recordopesaje)
            pesajesrows = pesajes.filter(p=>p.id == id)
            peso = pesonuevo
            Swal.fire("Éxito guardar","Se logró guardar el pesaje","success")        
            nuevoPesaje.close()
        }
        catch(err){
            if(modedebug){
                loger.addTextError(JSON.stringify(err,null,2))
            }
            console.error(err)
            Swal.fire("Error guardar","No se logró guardar el pesaje","error")        
            nuevoPesaje.close()
        }

    }
    async function guardarPesajeOffline() {
        let idprov = "nuevo_pesaje_"+generarIDAleatorio()
        let data ={
            fecha:fecha+" 03:00:00",
            animal:id,
            pesoanterior,
            pesonuevo,
            id:idprov
        }
        let dataupdate={
            peso:pesonuevo
        }
        try{
            await editarAnimalSQL(db,id,dataupdate)
            await addNewPesajeSQL(db,data)
        
            let nanimal = id.split("_").length > 1 
            let comando = {
                tipo:"add",
                coleccion:"pesaje",
                data:{...data},
                hora:Date.now(),
                prioridad:2,
                idprov,
                camposprov:nanimal?"animal":"",
                show:{...data},
                motivo:"Guardar pesaje"
            }
        
            comandos.push(comando) 
            data.expand = {animal:{
                    caravana
                }}
            if(!nanimal){
                let comandoani = {
                    tipo:"update",
                    coleccion:"animales",
                    data:{...dataupdate},
                    hora:Date.now(),
                    prioridad:2,
                    idprov:id,
                    camposprov:"",
                    show:{caravana},
                    motivo:"Crear pesaje"
                }
        
                comandos.push(comandoani)
                
        
            }

            await setComandosSQL(db,comandos)
            pesajes.push(data)
            pesajesrows = pesajes.filter(p=>p.animal==id)
            peso = pesonuevo
            
            Swal.fire("Éxito guardar","Se logró guardar el pesaje","success")        
            nuevoPesaje.close()
        }
        catch(err){
            if(modedebug){
                loger.addTextError(JSON.stringify(err,null,2))

            }
            console.error(err)
            Swal.fire("Error guardar","No se logró guardar el pesaje","error")        
            nuevoPesaje.close()
        }
        
    }
    async function guardarPesaje(){
        coninternet = await getInternet(modedebug,offliner.offline)
        if(coninternet.connected){
            await guardarPesajeOnline()
        }
        else{
            await guardarPesajeOffline()
        }
    }
    async function editarPesajeOnline() {
        try{
            let data = {
                fecha:new Date(fechaedit).toISOString().split("T")[0]+" 03:00:00",
                pesonuevo:pesonuevoedit
            }
            let idx_pesaje = pesajes.findIndex(p=>p.id==idpesaje)

            await pb.collection("pesaje").update(idpesaje,data)
            pesajes[idx_pesaje].fecha = data.fecha
            pesajes[idx_pesaje].pesonuevo = data.pesonuevo
            await setPesajesSQL(db,pesajes)
            pesajesrows = pesajes.filter(p=>p.animal == id)
            Swal.fire("Éxito editar pesaje","Se pudo editar el pesaje","success")
        }   
        catch(err){

            console.error(err)
            Swal.fire("Error editar pesaje","No se pudo editar el pesaje","error")
        }
        detallePesaje.close()
    }
    async function editarPesajeOffline() {
        let data = {
            fecha:new Date(fechaedit).toISOString().split("T")[0]+" 03:00:00",
            pesonuevo:pesonuevoedit
        }
        try{
            let idx_pesaje = pesajes.findIndex(p=>p.id == idpesaje)
            pesajes[idx_pesaje].fecha = data.fecha
            pesajes[idx_pesaje].pesonuevo = data.pesonuevo
            pesajesrows = pesajes.filter(p=>p.animal == id)
            await setPesajesSQL(db,pesajes)
            let comando = {
                tipo:"update",
                coleccion:"pesaje",
                data,
                hora:Date.now(),
                prioridad:2,
                idprov:idpesaje,
                camposprov:"",
                show:{...data},
                motivo:"Editar pesajes"
            }
            comandos.push(comando)
            await setComandosSQL(db,comandos)
            Swal.fire("Éxito editar pesaje","Se pudo editar el pesaje","success")
        }  
        catch(err){
            console.error(err)
            Swal.fire("Error editar pesaje","No se pudo editar el pesaje","error")
        }
    }
    async function editarPesaje() {
        if(coninternet.connected){
            await editarPesajeOnline()
        }
        else{
            await editarPesajeOffline()
        }
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
                    pesajesrows = pesajes.filter(p=>p.animal == id)
                    await pb.collection("pesaje").delete(idpesaje)
                    detallePesaje.close()
                }
                catch(err){
                    console.error(err)
                    detallePesaje.close()
                }
            }
            
        })
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
                    let p_idx = pesajes.findIndex(p=>p.id == idpesaje)
                    let pes = {...pesajes[p_idx]}
                    pesajes = pesajes.filter(p=>p.id != idpesaje)

                    await setPesajesSQL(db,pesajes)
                    let comando = {
                        tipo:"delete",
                        coleccion:"pesaje",
                        data:{...pes},
                        hora:Date.now(),
                        prioridad:2,
                        idprov:idpesaje,
                        camposprov:"",
                        show:{...pes},
                        show:"Eliminar pesaje"
                    }
                    comandos.push(comando)
                    await setComandosSQL(db,comandos)
                    pesajesrows = pesajes.filter(p=>p.animal == id) 
                    detallePesaje.close()
                }
                catch(err){
                    console.error(err)
                    detallePesaje.close()
                }
            }
        })
    }
    async function eliminarPesaje() {
        if(coninternet.connected){
            await eliminarOnline()
        }
        else{
            await eliminarOffline()
        }
    }
    function createChart(){
        ctx = canvas.getContext('2d');
        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: xs.map(x=>new Date(x).toLocaleDateString()),
                datasets: [
                {
                    label: "Evolucion pesos",
                    backgroundColor: "rgb(255, 99, 132)",
                    borderColor: "rgb(255, 99, 132)",
                    data: ys.map(r=>r)
                }
                ]
            },
            
        });
    }
    function procesarPesajes(){
        if(pesajesrows.length != 0){
            xs = []
            ys = []
            xs.push(pesajesrows[0].expand.animal.created)
            ys.push(pesajesrows[0].pesoanterior)
            
            for(let i = 0;i < pesajesrows.length;i++){
                xs.push(pesajesrows[i].fecha)
                ys.push(pesajesrows[i].pesonuevo)
                
            }
            let list = [];
            for (let j = 0; j < xs.length; j++) 
                list.push({'x': xs[j], 'y': ys[j]});

            //2) sort:
            list.sort(function(a, b) {
                return new Date(a.x) < new Date(b.x) ? -1 : 1;
                //Sort could be modified to, for example, sort on the age 
                // if the name is the same. See Bonus section below
            });

            //3) separate them back out:
            for (var k = 0; k < list.length; k++) {
                xs[k] = list[k].x;
                ys[k] = list[k].y;
            }
                        
            createChart()
        }
    }
    async function getPesajes(){
        pesajes = await pb.collection("pesaje").getFullList({
            filter:`animal='${id}'`,
            sort:"-fecha",
            expand:"animal"
        })
        
        
        
    }
    function openNewModal(){
        malfecha = false
        malpeso = false
        botonhabilitado = false
        pesonuevo = ""
        fecha = ""
        nuevoPesaje.showModal()
    }
    function openDetalle(id){
        idpesaje = id
        let pesaje = pesajes.filter(p=>p.id==idpesaje)[0]
        
        fechaedit = pesaje.fecha.split(" ")[0]
        pesoanterioredit = pesaje.pesoanterior
        pesonuevoedit = pesaje.pesonuevo

        detallePesaje.showModal()
    }
    async function eliminar(){
        try{
            
            await pb.collection("pesaje").delete(idpesaje)
            await getPesajes()
            filterUpdate()
            detallePesaje.close()
            Swal.fire("Éxito eliminar","Se pudo eliminar el pesaje","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error eliminar","No se pudo eliminar el pesaje","error")
            detallePesaje.close()
        }
    }
    onMount(async ()=>{
        id = $page.params.slug
        pesajesrows = pesajes.filter(p=>p.animal == id)
        procesarPesajes()
        //await getPesajes()
    })
    function validarBoton(){
        botonhabilitado = true
        if(isEmpty(pesonuevo)){
            botonhabilitado = false
        }
        if(isEmpty(fecha)){
            botonhabilitado = false
        }
        
    }
    function onchange(campo){
        validarBoton()
        if(campo == "FECHA"){
            if(isEmpty(fecha)){
                malfecha = true
            }
            else{
                malfecha = false
            }
        }
        if(campo == "PESO"){
            if(isEmpty(pesonuevo)){
                malpeso = true
            }
            else{
                malpeso = false
            }
        }
    }
</script>
<div class="w-full flex justify-items-start gap-2">
    <div>
        <button
            aria-label="Nuevo"
            onclick={openNewModal}
            class={`
                ${estilos.sinbordes} ${estilos.chico} ${estilos.primario}
            `}
        >
            Nuevo
        </button>
    </div>
    {#if pesajes.length != 0}
    <div>
        <button
            aria-label="Evolucion"
            onclick={()=>chartpesaje.showModal()}
            class={`
                ${estilos.sinbordes} ${estilos.chico} ${estilos.primario}
            `}
        >
            Evolucion
        </button>
    </div>
    {/if}
</div>
<div class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto">
    {#if pesajes.length == 0}
        <p class="mt-5 text-lg ">No hay pesajes</p>
    {:else}
        <div class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
            <table class="table table-lg" >
                <thead>
                    <tr>
                        <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                        <th class="text-base mx-1 px-1">Peso anterior</th>
                        <th class="text-base mx-1 px-1">Peso nuevo</th>
                    </tr>
                </thead>
                <tbody>
                    {#each pesajesrows as p}
                    <tr onclick={()=>openDetalle(p.id)} class="hover:bg-gray-200 dark:hover:bg-gray-900">
                            <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(p.fecha).toLocaleDateString()}</td>
                            <td class="text-base mx-1 px-1">
                                {`${p.pesoanterior}`}
                            </td>
                            <td class="text-base mx-1 px-1">
                                {`${p.pesonuevo}`}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="block w-full md:hidden justify-items-center mx-1">
            {#each pesajesrows as p}
            <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
                <button onclick={()=>openDetalle(p.id)}>
                    <div class="block p-4">
                        <div class="grid grid-cols-2 gap-y-2">
                            <div class="flex items-start">
                                <span >Fecha:</span> 
                                <span class="mx-1 font-semibold">
                                    {new Date(p.fecha).toLocaleDateString()}
                                </span>
                            </div>
                            <div class="flex items-start">
                                <span >Caravana:</span> 
                                <span class="mx-1 font-semibold">
                                    {`${p.expand.animal.caravana}`}
                                </span>
                            </div>
                            <div class="flex items-start">
                                <span >Peso anterior:</span> 
                                <span class="mx-1 font-semibold">
                                    {`${p.pesoanterior}`}
                                </span>
                            </div>
                            <div class="flex items-start">
                                <span >Peso nuevo:</span> 
                                <span class="mx-1 font-semibold">
                                    {`${p.pesonuevo}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </button>
            </div>
            {/each}
        </div>
    {/if}
</div>
<dialog id="nuevoPesaje" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div 
        class="
            modal-box w-11/12 max-w-10xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Nuevo pesaje - {caravana}</h3>  
        <div class="form-control">
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
                    onchange={()=>onchange("FECHA")}
                />
                {#if malfecha}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar la fecha del pesaje</span>                    
                    </div>
                {/if}
            </label>
            <div class="label">
                <span class="label-text">Peso anterior</span>                    
            </div>
            <input 
                id ="pesoanterior" 
                type="number"  
                disabled
                class={`
                    disabled
                    input 
                    input-bordered 
                    border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                    w-full
                    ${estilos.bgdark2}
                `}
                bind:value={pesoanterior}
                
            />
            <div class="label">
                <span class="label-text">Peso nuevo</span>                    
            </div>
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
                oninput={()=>onchange("PESO")}
            />
            {#if malpeso}
                <div class="label">
                    <span class="label-text-alt text-red-500">Debe escribir el peso</span>                    
                </div>
            {/if}
        </div>
        <div class="modal-action justify-start ">
            <button class="btn btn-success text-white" disabled='{!botonhabilitado}' onclick={guardarPesaje} >Guardar</button>
            <button class="btn btn-error text-white" onclick={()=>nuevoPesaje.close()}>Cancelar</button>
        </div>
    </div>

</dialog>
<dialog id="chartpesaje" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl ">
    <div 
        class="
            modal-box  max-w-5xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form> 
        <h3 class="text-lg font-bold">Evolucion pesaje</h3>  
        <div class="chart-container justify-items-center">
            <canvas class="" bind:this={canvas} >
            </canvas>
        </div>
        
        <div class="modal-action justify-start ">
            <button class="btn btn-error text-white" onclick={()=>chartpesaje.close()}>Cerrar</button>
        </div>
    </div>
</dialog>
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
                    <label for = "fechaedit" class="label">
                        <span class="label-text text-base">Fecha</span>
                    </label>
                    <label for="fechaedit" 
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                    >
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
                            bind:value={fechaedit}
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
                        {pesoanterioredit}
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
                        bind:value={pesonuevoedit}
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
<style>
.chart-container {
    width: 800px;
    height:400px;
 }
</style>


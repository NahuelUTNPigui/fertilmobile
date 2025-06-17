<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import sexos from "$lib/stores/sexos";
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import Swal from "sweetalert2";
    import PredictSelect from "../PredictSelect.svelte";
    import cuentas from '$lib/stores/cuentas';
    import AgregarAnimal from "../eventos/AgregarAnimal.svelte";
    import{verificarNivel} from "$lib/permisosutil/lib"
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import {  setComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import {addNewNacimientoSQL} from '$lib/stores/sqlite/dbeventos';
    import {getAnimalesSQL} from '$lib/stores/sqlite/dbanimales';
    let {
        useroff,
        coninternet,
        comandos=$bindable([]),
        db,
        usuarioid,
        animales=$bindable([]),
        pariciones=$bindable([]),
        caravanamadre=$bindable(""),
        cabid,sexoanimal,prenada=$bindable(0)
    } = $props()
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);    
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    //let usuarioid = $state("")
    let buscar = $state("")
    let fechadesde = $state("")
    let fechahasta = $state("")
    //id del animal
    let id = $state("")
    let cargado = $state(false)
    let paricionesrows = $state([])
    let padres = $state([])
    let madres = $state([])
    let listapadres = $state([])
    //Datos nacimiento
    let agregaranimal  = $state(false)
    let nacimiento = $state(null)
    let idnacimiento = $state("")
    let caravana = $state("")
    let categoria = $state("")
    let sexo = $state("")
    let padre = $state("")
    let madre = $state("")
    let peso = $state("")
    let nombremadre = $state("")
    let nombrepadre = $state("")
    let fecha = $state("")
    let idanimal = $state("")
    let observacion = $state("")
    //Validar 
    let malcaravana = $state(false)
    let malfecha = $state(false)
    let malpadre = $state(false)
    let botonhabilitado = $state(false)
    
    function onelegir(){}
    function onwrite(){}
    async function getAnimales(){
        const animalestodos = await getAnimalesSQL(db)
        let animales = animalestodos.lista.filter(a=>a.cab == cabid && a.delete == false)
        madres = animales.filter(a=>a.sexo == "H" || a.sexo == "F")
        padres = animales.filter(a=>a.sexo == "M")
        listapadres = padres.map(p=>({id:p.id,nombre:p.caravana}))
        cargado = true
    }

    async function getPariciones(){
        const recordsn = await pb.collection("nacimientosall").getFullList({
            filter:`(padre~'${id}' || madre ~ '${id}') && cab='${cabid}' `,
            sort:"-fecha"
        })
        pariciones = recordsn
    }
    //Eliminar
    async function eliminarParicionOffline() {
        
    }
    async function eliminarParicionOnline() {
        
    }
    async function eliminarParicion() {
        
    }
    //EDitar
    async function editarParicionOffline() {
        
    }
    async function editarParicionOnline() {
        
    }
    async function editarParicion() {
        
    }
    //Guardar
    async function guardarParicionOnline() {
        if(agregaranimal){
            //let verificar = await verificarNivel(cab.id)
            let verificar = true
            if(!verificar){
                Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener más animales`,"error")
                return
            }
        }
        try{
            let dataparicion = {
                madre,
                padre,
                fecha:fecha + " 03:00:00",
                nombremadre,
                nombrepadre,
                observacion,
                cab:cabid
            }
            let recordparicion = await pb.collection('nacimientos').create(dataparicion);
            recordparicion.caravana = ""
            recordparicion.animalid = ""
            recordparicion.expand ={
                madre:{id:"",caravana:""},
                padre:{id:"",caravana:""}
            }
            if(agregaranimal){
                let data = {
                    caravana,
                    active:true,
                    delete:false,
                    fechanacimiento:fecha +" 03:00:00",
                    sexo,
                    cab:cabid,
                    peso,
                    nacimiento:recordparicion.id
                }

                let recorda = await pb.collection('animales').create(data); 
                recordparicion.caravana = caravana
                recordparicion.animalid = recorda.id
            }
            else{

            }
            let m_idx = animales.findIndex(a=>a.id == dataparicion.madre)
            if(m_idx != -1){
                recordparicion.expand.madre.id=animales[m_idx].id
                recordparicion.expand.madre.caravana=animales[m_idx].caravana
            }
            let p_idx = animales.findIndex(a=>a.id == dataparicion.padre)
            if(p_idx != -1){
                recordparicion.expand.padre.id=animales[p_idx].id
                recordparicion.expand.padre.caravana=animales[p_idx].caravana
            }
            pariciones.push(recordparicion)
            onChangePariciones()
            await addNewNacimientoSQL(db,recordparicion)
            Swal.fire("Éxito guardar","Se pudo guardar la paricion con exito","success")
            //Ver el tema de las fechas
            //prenada = 0
            
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","No se pudo guardar la paricion con exito","success")
        }
    }
    async function guardarParicionOfline() {
        let idprov = "nuevo_nac_"+generarIDAleatorio() 
        if(agregaranimal){
            let totalanimals = await getTotalSQL(db)
            let verificar = true
            
            //if(useroff.nivel != -1 && totalanimals >= useroff.nivel){
            //    verificar =  false
            //}
            if(!verificar){
                Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de ${useroff.nivel} animales`,"error")
                return {id:-1}
            } 
        }
        //que pasa si la madre y el padre son nuevos
        let dataparicion = {
            madre,
            padre,
            fecha:fecha + " 03:00:00",
            nombremadre,
            nombrepadre,
            observacion,
            cab:cabid,
            id:idprov
        }
        if(agregaranimal){
            dataparicion.caravana = caravana
        }
        else{
            dataparicion.caravana = ""
        }
        
        
        let comando = {
            tipo:"add",
            coleccion:"nacimientos",
            data:{...dataparicion},
            hora:Date.now(),
            prioridad:2,
            idprov,    
            camposprov:""
        }
        
        comandos.push(comando)
        dataparicion.animalid=""
        if(agregaranimal){
            let idanimal = "nuevo_animal_"+generarIDAleatorio()
            let data = {
                id:idanimal,
                caravana,
                active:true,
                delete:false,
                fechanacimiento:fecha +" 03:00:00",
                sexo,
                cab:cabid,
                peso,
                nacimiento:idprov
            }
            let comandoani = {
                    tipo:"add",
                    coleccion:"animales",
                    data:{...dataanimal},
                    hora:Date.now(),
                    prioridad:3,
                    idprov,    
                    camposprov:"nacimiento"
            }
            dataparicion.animalid=idanimal
            comandos.push(comandoani)
        }
        dataparicion.expand={
            madre:{
                id:"",
                caravana:""
            },
            padre:{
                id:"",
                caravana:""
            }
        }
        let m_idx = animales.findIndex(a=>a.id == dataparicion.madre)
        if(m_idx != -1){
            dataparicion.expand.madre.id=animales[m_idx].id
            dataparicion.expand.madre.caravana=animales[m_idx].caravana
        }
        let p_idx = animales.findIndex(a=>a.id == dataparicion.padre)
        if(p_idx != -1){
            dataparicion.expand.padre.id=animales[p_idx].id
            dataparicion.expand.padre.caravana=animales[p_idx].caravana
        }
        pariciones.push(dataparicion)
        onChangePariciones()
        await addNewNacimientoSQL(db,dataparicion)
        await setComandosSQL(db,comandos)
        Swal.fire("Éxito guardar","Se pudo guardar la paricion con exito","success")

    }
    async function guardarParicion(){
        if(coninternet.connected){
            await guardarParicionOnline()
        }
        else{
            await guardarParicionOfline()
        }
        nuevaParicion.close()
    }
    function onChangePariciones(){
        paricionesrows = pariciones.filter(p=>p.madre == id)
    }
    function onChange(campo){

    }
    onMount(async ()=>{
        
        id = $page.params.slug
        onChangePariciones()
        if(sexoanimal == "F" || sexoanimal == "H"){
            let m = animales.filter(item=>item.id == id)[0]
            nombremadre = m.caravana
            madre = id
        }
        padres = animales.filter(a=>a.active && a.cab == cabid && a.sexo == "M")
        listapadres = padres.map(item=>{
            return {
                id:item.id,nombre:item.caravana
            }
        })
        cargado = true
    })
    
    function getNombreMadre(){
        let m = madres.filter(item=>item.id == madre)[0]
        nombremadre = m.caravana
    }
    function getNombrePadre(){
        let p = padres.filter(item=>item.id == padre)[0]
        nombrepadre = p.caravana
    }
    function openNewModal(p_id){
        idnacimiento = p_id
        caravana = ""
        sexo = ""
        fecha = ""
        observacion = ""
        peso=""
        if(idnacimiento==""){
            padre = ""
            nombrepadre = ""
        }
        else{
            let i_par = pariciones.findIndex(p=>p.id==p_id)
            padre = pariciones[i_par].padre
            nombrepadre =pariciones[i_par].nombrepadre
            fecha = new Date(pariciones[i_par].fecha).toISOString().split("T")[0]
            observacion = pariciones[i_par].observacion
            caravana = pariciones[i_par].caravana
        }
        
        
        nuevaParicion.showModal()
    }
</script>
<div class="w-full flex justify-items-start gap-2">
    
    <div>
        <button
            aria-label="Nuevo"
            onclick={()=>openNewModal("")}
            class={`
                ${estilos.basico} ${estilos.chico} ${estilos.primario}
            `}
        >
            Nuevo
        </button>
    </div>
</div>
<div class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto">
    {#if paricionesrows.length == 0}
        <p class="mt-5 text-lg">No hay pariciones</p>
    {:else}
        <div class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
        
            <table class="table table-lg " >
                <thead>
                    <tr>
                        <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                        <th class="text-base mx-1 px-1">Caravana</th>
                        <th class="text-base mx-1 px-1">Padre</th>
                        <th class="text-base mx-1 px-1">Observacion</th>
                        
                        
                    </tr>
                </thead>
                <tbody>
                    {#each pariciones as n}
                        <tr onclick={()=>openNewModal(n.id)} class="hover:bg-gray-200 dark:hover:bg-gray-900">
                            <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(n.fecha).toLocaleDateString()}</td>
                            <td class="text-base mx-1 px-1">
                                {`${n.caravana}`}
                            </td>
                            <td class="text-base mx-1 px-1">
                                {`${n.nombrepadre}`}
                            </td>
                            <td class="text-base mx-1 px-1">
                                {`${n.observacion}`}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="block w-full md:hidden justify-items-center mx-1">
            {#each paricionesrows as n}
            <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
                <button onclick={()=>openNewModal(n.id)}>
                    <div class="block p-4">
                        <div class="grid grid-cols-2 gap-y-2">
                            <div class="flex items-start">
                                <span >Fecha:</span> 
                                <span class="mx-1 font-semibold">
                                    {new Date(n.fecha).toLocaleDateString()}
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
    {/if}
    
</div>

<dialog id="nuevaParicion" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        {#if idnacimiento == ""}
            <h3 class="text-lg font-bold">Nuevo nacimiento</h3>  
        {:else}
            <h3 class="text-lg font-bold">Ver nacimiento</h3>  
        {/if}
        
        <div class="form-control">
            {#if idnacimiento == ""}
                <AgregarAnimal 
                    bind:agregaranimal bind:caravana 
                    bind:categoria bind:sexo 
                    bind:peso bind:fechanacimiento = {fecha} 
                    confechanac={true}
                />
            {:else}
                {#if idanimal != ""}
                    <label for = "caravana" class="label">
                        <span class="label-text text-base">Caravana</span>
                    </label>
                    <label class="input-group">
                        <input id ="caravana" type="text"  
                            class={`input input-bordered w-full ${estilos.bgdark2}`}
                            value={caravana}
                        />
                        
                    </label>
                {/if}
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
            {#if sexoanimal == "M"}
                <label for = "nombremadre" class="label">
                    <span class="label-text text-base">Nombre madre</span>
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
                    />
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
            {:else}
                {#if  idnacimiento==""}
                    {#if cargado}
                        <PredictSelect bind:valor={padre} etiqueta = {"Padre"} bind:cadena={nombrepadre} lista = {listapadres} {onelegir} {onwrite}/>
                    {/if}
                {:else}
                    <label for = "padre" class="label">
                        <span class="label-text text-base">Padre</span>
                    </label>
                    <label for = "padre" class="label">
                        <span class="label-text text-base">{nombrepadre}</span>
                    </label>
                {/if}
                

                
            {/if}
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
            
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
                <!-- if there is a button, it will close the modal -->              
                {#if idnacimiento == ""} 
                    <button class="btn btn-success text-white" onclick={guardarParicion} >Guardar</button>
                {/if}
                <button class="btn btn-error text-white" >Cerrar</button>
            </form>
        </div>
    </div>

</dialog>


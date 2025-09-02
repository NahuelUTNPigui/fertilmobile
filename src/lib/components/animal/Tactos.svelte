<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import tipostacto from '$lib/stores/tipostacto';
    import tiposanimal from '$lib/stores/tiposanimal';
    import categorias from "$lib/stores/categorias";
    import estados from "$lib/stores/estados";
    import {guardarHistorial} from "$lib/historial/lib"
    import RadioButton from "../RadioButton.svelte";
    import { getEstadoNombre,getEstadoColor } from "$lib/components/estadosutils/lib";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import Swal from "sweetalert2";
    import {  setComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import {
        addNewTactoSQL,
        setTactosSQL
    } from "$lib/stores/sqlite/dbeventos"
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { getInternet } from '$lib/stores/offline';
    //Permisos
    import{verificarNivel,getPermisosList, getPermisosMessage} from "$lib/permisosutil/lib"
    import { updatePermisos} from "$lib/stores/capacitor/offlinecab"
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    //VEr el historial de los animales
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    const today = new Date();
    
    let id = $state("")
    let tactosrows = $state([])
    let {
        coninternet = $bindable({}),
        comandos=$bindable([]),
        tactos=$bindable([]),
        db,
        caravana=$bindable(""),
        cabid,prenadaori=$bindable(0),categoria,
        caboff=$bindable({}),
        usuarioid

    } = $props()


    //Datos tacto
    let idtacto = $state("")
    let fecha = $state("")
    let observacion = $state("")
    let categoriatacto = $state("")
    //Tipo animal
    let prenada = $state(0)
    //tipo tacto
    let tipo = $state("tacto")
    function openNewModal(id){
        idtacto = id
        if(idtacto == ""){
            fecha = ""
            observacion =  ""
            
            tipo = "tacto"
        }
        else{
            let i_tacto = tactos.findIndex(t=>t.id == id)
            fecha = new Date(tactos[i_tacto].fecha).toISOString().split("T")[0]
            observacion = tactos[i_tacto].observacion
            categoriatacto = tactos[i_tacto].categoria
            //Tipo animal
            prenada = tactos[i_tacto].prenada
            //tipo tacto
            tipo = tactos[i_tacto].tipo
        }
        
        nuevoTactoAnimal.showModal()
    }
    //Eliminar
    async function eliminarOffline() {
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
                    
                    Swal.fire('Tacto eliminado!', 'Se eliminó el tacto correctamente.', 'success');
                }
                catch(e){
                    Swal.fire('Acción cancelada', 'No se pudo eliminar el tacto', 'error');
                }
                idtacto = ""
            }
        })
    }
    async function eliminarOnline() {
        caboff = await updatePermisos(pb,usuarioid)
        let listapermisos = getPermisosList(caboff.permisos)
        if(!listapermisos[4]){
            Swal.fire("Error permisos","No tienes permisos para los eventos","error")
            return 
        }
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
                    await pb.collection('tactos').update(idtacto,data);
                    tactos = tactos.filter(t=>t.id!=idtacto)
                    await setTactosSQL(db,tactos)
                    onChangeTactos()
                    //deberia modificar la base de datos
                    
                    Swal.fire('Tacto eliminado!', 'Se eliminó el tacto correctamente.', 'success');
                }
                catch(e){
                    Swal.fire('Acción cancelada', 'No se pudo eliminar el tacto', 'error');
                }
                idtacto = ""
            }
        })
    }
    async function eliminar() {
        if(coninternet.connected){
            await eliminarOnline()
        }
        else{
            await eliminarOffline()
        }
        nuevoTactoAnimal.close()
    }
    //EDitar
    async function editarTactoOffline() {
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
            let a = animales.filter(an=>an.id == animal)[0]
            tactos[idx] ={
                ...tactos[idx],
                ...data
            } 
            tactos[idx].expand = {animal:a}
            tactos.sort((t1,t2)=>new Date(t1.fecha)>new Date(t2.fecha)?-1:1)
            onChangeTactos()
            await setTactosSQL(db,tactos)
            
            
            Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","No se pudo guardar el tacto","error")
        }
    }
    async function editarTactoOnline() {
        caboff = await updatePermisos(pb,usuarioid)
        let listapermisos = getPermisosList(caboff.permisos)
        if(!listapermisos[4]){
            Swal.fire("Error permisos","No tienes permisos para los eventos","error")
            return 
        }
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
            tactos[idx].expand = {animal:a}
            tactos.sort((t1,t2)=>new Date(t1.fecha)>new Date(t2.fecha)?-1:1)
            onChangeTactos()
            await setTactosSQL(db,tactos)
            filterUpdate()
            Swal.fire("Éxito guardar","Se pudo guardar el tacto","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","No se pudo guardar el tacto","error")
        }
    }
    async function editarTacto() {
        if(coninternet.connected){
            await editarTactoOnline()
        }
        else{
            await editarTactoOffline()
        }
        nuevoTactoAnimal.close()
    }
    //Guardar
    async function guardarTactoOffline(){
        let idprov = " nuevo_tacto_" + generarIDAleatorio()
        let data = {
           fecha:fecha +" 03:00:00" ,
           observacion,
           animal:id,
           categoria,
           prenada,
           tipo,
           cab:cabid,
           active:true,
           id:idprov
        }
        let nanimal = id.split("_").length>1
        
        let comando = {
            tipo:"add",
            coleccion:"tactos",
            data:{...data},
            hora:Date.now(),
            prioridad:3,
            idprov,
            camposprov:`${nanimal?"animal":""}`
        }
        comandos.push(comando)
        await setComandosSQL(db,comandos)
        data = {
            ...data,
            expand:{
                animal: {
                    id,
                    caravana
                }
            }
        }
        tactos.push(data)
        onChangeTactos()
        await addNewTactoSQL(db,data)
        nuevoTactoAnimal.close()
        //prenadaori = prenada
        Swal.fire("Éxito guardar",`Se pudo guardar el tacto`,"success")
        
    }
    async function guardarTactoOnline(){
        caboff = await updatePermisos(pb,usuarioid)
        let listapermisos = getPermisosList(caboff.permisos)
        if(!listapermisos[4]){
            Swal.fire("Error permisos",getPermisosMessage(4),"error")
            return 
        }
        try{
            let data = {
               fecha:fecha +" 03:00:00" ,
               observacion,
               animal:id,
               categoria,
               prenada,
               tipo,
               cab:cabid,
               active:true
            }
            let record = await pb.collection('tactos').create(data);
            record = {
                ...record,
                expand:{
                    animal:{
                        id,caravana
                    }
                }
            }
            tactos.push(record)
            onChangeTactos()
            await addNewTactoSQL(db,record)

            //await guardarHistorial(pb,id)
            //prenadaori = prenada
            //await pb.collection('animales').update(id,{
            //    prenada
            //})
            nuevoTactoAnimal.close()
            Swal.fire("Éxito guardar",`Se pudo guardar el tacto`,"success")
        }
        catch(err){
            console.error(err)
            nuevoTactoAnimal.close()
            Swal.fire("Error guardar",`No se pudo guardar el tacto`,"success")
        }
        
    }
    async function guardarTacto(){
        coninternet = await getInternet(modedebug,offliner.offline)
        if(coninternet.connected){
            await guardarTactoOnline()
        }
        else{
            await guardarTactoOffline()
        }
    }
    function getTipoNombre(tipo){
        let tp = tipostacto.filter(t=>t.id==tipo)[0]
        if(tp){
            return tp.nombre
        }
        else{
            return ""
        }
        
    }
    function getCategoriaNombre(cat){
        let tp = tiposanimal.filter(c=>c.id==cat)[0]
        if(tp){
            return tp.nombre
        }
        else{
            return ""
        }
        
    }
    async function getTactos(){
        const recordst = await pb.collection('tactos').getFullList({
            filter:`animal='${id}' && active = true`,
            sort: '-created'
        });
        tactos = recordst
        
    }
    function onChangeTactos(){
        tactosrows = tactos.filter(t=>t.animal == id)
    }
    onMount(async ()=>{
        id = $page.params.slug
        prenada = prenadaori
        
        onChangeTactos()
        
        //await getTactos()
    })

</script>
<div class="w-full flex justify-items-start gap-2">
    
    <div>
        <button
            aria-label="Nuevo"
            onclick={()=>openNewModal("")}
            class={`
                ${estilos.sinbordes} ${estilos.chico} ${estilos.primario}
            `}
        >
            Nuevo
        </button>
    </div>
</div>
<div class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto">
    {#if tactosrows.length == 0}
        <p class="mt-5 text-lg">No tiene tactos</p>
    {:else}
    <div class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
        <table class="table table-lg " >
            <thead>
                <tr>
                    <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                    <th class="text-base mx-1 px-1"  >Observacion</th>
                    <th class="text-base mx-1 px-1"  >Categoria</th>
                    <th class="text-base mx-1 px-1"  >Preñada</th>
                    <th class="text-base mx-1 px-1"  >Tipo</th>
                </tr>
            </thead>
            <tbody>
                {#each tactosrows as t}
                    <tr onclick={()=>openNewModal(t.id) } class=" hover:bg-gray-200 dark:hover:bg-gray-900">
                        <td class="text-base">
                            {`${new Date(t.fecha).toLocaleDateString()}`}
                        </td>
                        <td class="text-base mx-1 px-1">
                            {`${t.observacion}`}
                        </td>
                        <td class="text-base mx-1 px-1">
                            {`${getCategoriaNombre(t.categoria)}`}
                        </td>
                        <td class="text-base mx-1 px-1">
                            {   
                                t.prenada==0?"Vacia":
                                t.prenada==1?"Dudosa":
                                "Preñada"
                            }
                        </td>
                        <td class="text-base mx-1 px-1">
                            {`${getTipoNombre(t.tipo)}`}
                        </td>
                    </tr>
                    
                {/each}
            </tbody>
        </table>
    </div>
    <div class="block w-full md:hidden justify-items-center mx-1">
        {#each tactosrows as t}
            <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
                <button onclick={()=>openNewModal(t.id) }>
                    <div class="block p-4">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-medium">{`${new Date(t.fecha).toLocaleDateString()}`}</h3>
                            {#if t.prenada != 1}
    
                                <div class={`badge badge-outline badge-${getEstadoColor(t.prenada)}`}>{getEstadoNombre(t.prenada)}</div>
                            {/if}
                            
                        </div>
                        <div class="grid grid-cols-2 gap-y-2">
                            
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
    
    {/if}
</div>

<dialog id="nuevoTactoAnimal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div 
        class="
            modal-box w-11/12 max-w-5xl
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
            <h3 class="text-lg font-bold">Ver tacto</h3>  
        {/if}
        <div class="form-control">
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
                    {#each tiposanimal as t}
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
            <label for="obs" class="label">
                <span class="label-text">Observacion</span>                    
            </label>
            <label for="input-group">
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
            {#if idtacto == ""}
                <button class="btn btn-success text-white" onclick={guardarTacto} >Guardar</button>
            {/if}
            <button class="btn btn-error text-white" onclick={()=>nuevoTactoAnimal.close()}>Cerrar</button>
        </div>
    </div>
</dialog>


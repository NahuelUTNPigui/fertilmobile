<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import estilos from "$lib/stores/estilos";
    import Exportar from '$lib/components/Exportar.svelte';
    import PocketBase from 'pocketbase'
    import tiposanimal from '$lib/stores/tiposanimal';
    import categorias from "$lib/stores/categorias";
    import estados from "$lib/stores/estados";
    import {capitalize} from "$lib/stringutil/lib"
    import { getEstadoNombre } from "../estadosutils/lib";
    let{
        historial=$bindable([]),
        tratamientos=$bindable([]),
        tactos=$bindable([]),
        servicios=$bindable([]),
        inseminaciones=$bindable([]),
        pesajes=$bindable([]),
        observaciones=$bindable([]),
        pariciones=$bindable([]),
        caravana=$bindable(""),
    } = $props()
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let id = $state("")
    //let historial = $state([])
    //let inseminaciones = $state([])
    //let tactos = $state([])
    //let tratamientos = $state([])
    //let observaciones = $state([])
    //let pariciones = $state([])
    //let pesajes = $state([])
    //let servicios = $state([])
    let historialeventos = $state([])

    async function getHistorial(){
        historial = await pb.collection("historialanimales").getFullList({
            filter:`animal='${id}'`,
            sort:"-created",
        })
    }
    async function getServicios() {
        inseminaciones = await pb.collection("servicios").getFullList({
            filter:`madre='${id}'`,
            sort:"-fechadesde"
        })
    }
    async function getInseminaciones() {
        inseminaciones = await pb.collection("inseminacion").getFullList({
            filter:`animal='${id}'`,
            sort:"-fechainseminacion"
        })
    }
    async function getObservaciones() {
        observaciones = await pb.collection("observaciones").getFullList({
            filter:`animal='${id}'`,
            sort:"-created"
        })
    }
    async function getPesajes() {
        pesajes = await pb.collection("pesaje").getFullList({
            filter:`animal='${id}'`,
            sort:"-fecha"
        })
    }
    async function getTratamientos() {
        tratamientos = await pb.collection("tratamientos").getFullList({
            filter:`animal='${id}'`,
            sort:"-fecha",
            expand:"tipo"
        })
    }
    async function getTactos() {
        tactos = await pb.collection("tactos").getFullList({
            filter:`animal='${id}'`,
            sort:"-fecha"
        })
    }
    async function getPariciones() {
        pariciones = await pb.collection("nacimientos").getFullList({
            filter:`madre='${id}'`,
            sort:"-fecha"
        })
    }

    function getHistorialEventos(inseminaciones, pariciones, tactos, tratamientos, observaciones, pesajes) {

        if (inseminaciones.length != 0) {
            historialeventos = historialeventos.concat(inseminaciones.map(i=>{
                return{
                    fecha:i.fechainseminacion,
                    nombre:"Inseminación",
                    info: i.observacion,
                    caravana: historial[0].caravana
                }
            }))
            //historialeventos.push(inseminaciones)
        }
        if (servicios.length != 0) {
            historialeventos = historialeventos.concat(servicios.map(i=>{
                return{
                    fecha:i.fecha,
                    nombre:"Servicio",
                    info: i.observacion,
                    caravana: historial[0].caravana
                }
            }))
            //historialeventos.push(inseminaciones)
        }
        if (pariciones.length != 0) {
            historialeventos = historialeventos.concat(pariciones.map(i=>{
                return{
                    fecha:i.fecha,
                    nombre:"Parición",
                    info: i.observacion,
                    caravana: historial[0].caravana
                }
            }))
            //historialeventos.push(pariciones)
        }
        if (tactos.length != 0) {
            historialeventos = historialeventos.concat(tactos.map(i=>{
                return{
                    fecha:i.fecha,
                    nombre:"Tacto",
                    info: getEstadoNombre(i.prenada),
                    caravana: historial[0].caravana
                }
            }))
        }
        if (tratamientos.length != 0) {
            historialeventos = historialeventos.concat(tratamientos.map(i=>{
                return{
                    fecha:i.fecha,
                    nombre:"Tratamiento",
                    info: i.expand.tipo.nombre,
                    caravana: historial[0].caravana
                }
            }))
        }
        if (observaciones.length != 0) {
            historialeventos = historialeventos.concat(observaciones.map(i=>{
                return{
                    fecha:i.fecha,
                    nombre:"Observación",
                    info: i.observacion,
                    caravana: historial[0].caravana
                }
            }))
        }
        if (pesajes.length != 0) {
            historialeventos = historialeventos.concat(pesajes.map(i=>{
                return{
                    fecha:i.fecha,
                    nombre:"Pesaje",
                    info: i.pesonuevo,
                    caravana: historial[0].caravana
                }
            }))
        }
        historialeventos.sort((h1,h2)=>new Date(h1.fecha)< new Date(h2.fecha)?1:-1)
    }

    function prepararData(item){
        return {
            FECHA: item.fecha?new Date(item.fecha).toLocaleDateString():"",
            CARAVANA: item.caravana,
            EVENTO: item.nombre,
            INFO: item.info
        }
    }
    onMount(async ()=>{
        id = $page.params.slug
        //await getHistorial()
        //await getInseminaciones()
        //await getTactos()
        //await getTratamientos()
        //await getObservaciones()
        //await getPesajes()
        //await getPariciones()
        //await getServicios()
        getHistorialEventos(inseminaciones, pariciones, tactos, tratamientos, observaciones, pesajes)
    })
</script>

<div class="hidden w-full md:block justify-items-center mx-1 lg:w-3/4 overflow-x-auto">
    {#if historialeventos.length == 0}
        <p class="mt-5 text-lg">No se encontraron eventos asociados</p>
    {:else}
        <table class="table table-lg " >
            <thead>
                <tr>
                    <th class="text-base mx-1 px-1"  >Fecha</th>
                    <th class="text-base mx-1 px-1"  >Evento</th>
                    <th class="text-base mx-1 px-1"  >Informacion</th>
                </tr>
            </thead>
            <tbody>
                {#each historialeventos as h}
                    <tr>
                        <td class="text-base">
                            {new Date(h.fecha).toLocaleDateString()}
                        </td>
                        <td class="text-base">
                            {h.nombre}
                        </td>
                        <td class="text-base">
                            {h.info}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
    <div>
        <Exportar
        titulo = {"Historia clinica"}
        filtros = {[]}
        confiltros = {false}
        data = {historialeventos}
        {prepararData}
    />
    </div>
</div>
<div class="block  md:hidden justify-items-center mx-1">
    {#if historialeventos.length == 0}
        <p class="mt-5 text-lg">No se encontraron eventos asociados</p>
    {:else}
        {#each historialeventos as h}
        <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
            <div class="block p-4">
                <div class="grid grid-cols-2 gap-y-2">
                    <div class="flex items-start">
                        <span >Fecha:</span> 
                        <span class="font-semibold">
                            {new Date(h.fecha).toLocaleDateString()}
                        </span>
                        
                    </div>
                    <div class="flex items-start">
                        <span >Evento:</span> 
                        <span class="font-semibold">
                            {h.nombre}
                        </span>
                        
                    </div>
                    <div class="flex items-start">
                        <span >Información:</span> 
                        <span class="font-semibold">
                            {h.info}
                        </span>
                        
                    </div>
                </div>
            </div>
        </div>
        {/each}
    {/if}
</div>
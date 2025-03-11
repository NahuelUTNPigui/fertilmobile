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
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let id = $state("")
    let historial = $state([])
    let inseminaciones = $state([])
    let tactos = $state([])
    let tratamientos = $state([])
    let observaciones = $state([])
    let pariciones = $state([])
    let pesajes = $state([])
    let historialeventos = $state([])

    async function getHistorial(){
        historial = await pb.collection("historialanimales").getFullList({
            filter:`animal='${id}'`,
            sort:"-created",
        })
    }
    async function getInseminaciones() {
        inseminaciones = await pb.collection("inseminacion").getFullList({
            filter:`animal='${id}'`,
            sort:"-created"
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
            sort:"-created"
        })
    }
    async function getTratamientos() {
        tratamientos = await pb.collection("tratamientos").getFullList({
            filter:`animal='${id}'`,
            sort:"-created"
        })
    }
    async function getTactos() {
        tactos = await pb.collection("tactos").getFullList({
            filter:`animal='${id}'`,
            sort:"-created"
        })
    }
    async function getPariciones() {
        pariciones = await pb.collection("nacimientos").getFullList({
            filter:`madre='${id}'`,
            sort:"-created"
        })
    }

    function getHistorialEventos(inseminaciones, pariciones, tactos, tratamientos, observaciones, pesajes) {

        if (inseminaciones.length != 0) {
            historialeventos = historialeventos.concat(inseminaciones.map(i=>{
                return{
                    fecha:i.fechainseminacion,
                    nombre:"Inseminación",
                    info: "",
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
                    info: "",
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
                    info: i.tipo.nombre,
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
        /*
        for (let i = 0; i < historialeventos.length; i++) {
            if (inseminaciones.includes(historialeventos[i])) {
                historialeventos[i].nombre = "Inseminación"
            }
            if (pariciones.includes(historialeventos[i])) {
                historialeventos[i].nombre = "Parición"
            }
            if (tactos.includes(historialeventos[i])) {
                historialeventos[i].nombre = "Tacto"
            }
            if (tratamientos.includes(historialeventos[i])) {
                historialeventos[i].nombre = "Tratamiento"
            }
            if (pesajes.includes(historialeventos[i])) {
                historialeventos[i].nombre = "Pesaje"
            }
            if (observaciones.includes(historialeventos[i])) {
                historialeventos[i].nombre = "Observación"
            }
        }
            */
        historialeventos.sort((h1,h2)=>new Date(h1.fecha)< new Date(h2.fecha)?1:-1)
    }

    function getEstadoNombre(estado){
        let e = estados.filter(est=>est.id==estado)[0]
        return e.nombre
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
        await getHistorial()
        await getInseminaciones()
        await getTactos()
        await getTratamientos()
        await getObservaciones()
        await getPesajes()
        await getPariciones()
        getHistorialEventos(inseminaciones, pariciones, tactos, tratamientos, observaciones, pesajes)
    })
</script>

<div class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto">
    {#if historialeventos.length == 0}
        <p class="mt-5 text-lg">No se encontraron eventos asociados</p>
    {:else}
        <table class="table table-lg " >
            <thead>
                <tr>
                    <th class="text-base mx-1 px-1"  >Fecha</th>
                    <th class="text-base mx-1 px-1"  >Caravana</th>
                    <th class="text-base mx-1 px-1"  >Evento</th>
                    <th class="text-base mx-1 px-1"  >Info</th>
                </tr>
            </thead>
            <tbody>
                {#each historialeventos as h}
                    <tr>
                        <td class="text-base">
                            {new Date(h.fecha).toLocaleDateString()}
                        </td>
                        <td class="text-base">
                            {h.caravana}
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
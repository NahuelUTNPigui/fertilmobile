<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import Exportar from "$lib/components/Exportar.svelte";
    import PocketBase from "pocketbase";
    import { slide } from "svelte/transition";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import { createCaber } from "$lib/stores/cab.svelte";
    import { createUserer } from "$lib/stores/user.svelte";
    import estilos from "$lib/stores/estilos";
    import { shorterWord } from "$lib/stringutil/lib";
    import * as XLSX from "xlsx";
    import { isEmpty } from "$lib/stringutil/lib";
    import { goto } from "$app/navigation";
    //FILTROS
    import { createStorageProxy } from "$lib/filtros/filtros";
    import Limpiar from "$lib/filtros/Limpiar.svelte";
    //Permisos
    import { getPermisosList, getPermisosMessage } from "$lib/permisosutil/lib";
    //Actualizacion
    import {
        actualizacion,
        deboActualizar,
    } from "$lib/stores/offline/actualizar";
    import { customoffliner } from "$lib/stores/offline/custom.svelte";
    import { intermitenter } from "$lib/stores/offline/intermitencia.svelte";
    import { velocidader } from "$lib/stores/offline/velocidad.svelte";
    //ofline
    import Barrainternet from "$lib/components/internet/Barrainternet.svelte";
    import { getInternet, getOnlyInternet } from "$lib/stores/offline";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import { openDB, resetTables } from "$lib/stores/sqlite/main";
    import { Network } from "@capacitor/network";
    import {
        getUserOffline,
        setDefaultUserOffline,
    } from "$lib/stores/capacitor/offlineuser";
    import {
        getCabOffline,
        setDefaultCabOffline,
        updatePermisos,
    } from "$lib/stores/capacitor/offlinecab";
    import {
        getInternetSQL,
        setInternetSQL,
    } from "$lib/stores/sqlite/dbinternet";
    import {
        getComandosSQL,
        setComandosSQL,
        flushComandosSQL,
    } from "$lib/stores/sqlite/dbcomandos";
    import { getPesajesSQL, setPesajesSQL } from "$lib/stores/sqlite/dbeventos";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    //ofline

    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({ connected: false });
    let ultimo_pesajes = $state({});
    let comandos = $state([]);
    let getlocal = $state(false);
    let getvelocidad = $state(0);
    let getactualizacion = $state(0);
    let getpermisos = $state("");
    let cargado = $state(false);
    let caber = createCaber();
    let cab = caber.cab;
    let ruta = import.meta.env.VITE_RUTA;
    let pre = "";
    const pb = new PocketBase(ruta);

    //Editar
    let caravana = $state("");
    let pesonuevo = $state(0);
    let pesoanterior = $state(0);
    let fecha = $state("");
    let idpesaje = $state("");
    //Datos filtrar
    let buscarcaravana = $state("");
    let fechadesde = $state("");
    let fechahasta = $state("");
    let pesajes = $state([]);
    let pesajescab = $state([]);
    let pesajesrows = $state([]);
    let defaultfiltro = {
        buscarcaravana: "",
        fechadesde: "",
        fechahasta: "",
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("historialpesajes", defaultfiltro);
    //open filter
    let isOpenFilter = $state(false);
    function clickFilter() {
        isOpenFilter = !isOpenFilter;
    }
    async function getPesajes() {
        const records = await pb.collection("pesaje").getFullList({
            sort: "-fecha",
            expand: "animal,animal.cab",
            filter: `animal.cab = '${cab.id}'`,
        });
        pesajes = records;
    }
    function setFilters() {
        buscarcaravana = proxyfiltros.buscarcaravana;
        fechadesde = proxyfiltros.fechadesde;
        fechahasta = proxyfiltros.fechahasta;
    }

    function setProxyFilter() {
        proxyfiltros.buscarcaravana = buscarcaravana;
        proxyfiltros.fechadesde = fechadesde;
        proxyfiltros.fechahasta = fechahasta;
    }

    function limpiarFiltros() {
        proxyfiltros = { ...defaultfiltro };

        setFilters();
        filterUpdate();
    }

    function filterUpdate() {
        setProxyFilter();
        proxy.save(proxyfiltros);
        pesajesrows = pesajescab;
        if (!isEmpty(buscarcaravana)) {
            pesajesrows = pesajesrows.filter((p) =>
                p.expand.animal.caravana
                    .toLocaleLowerCase()
                    .includes(buscarcaravana.toLocaleLowerCase()),
            );
        }
        if (!isEmpty(fechadesde)) {
            pesajesrows = pesajesrows.filter((p) => p.fecha >= fechadesde);
        }
        if (!isEmpty(fechahasta)) {
            pesajesrows = pesajesrows.filter((p) => p.fecha <= fechahasta);
        }
    }
    function actualizarDatos() {
        onChangePesajes();
        filterUpdate();
    }
    function onChangePesajes() {
        pesajescab = pesajes.filter((p) => p.expand.animal.cab == caboff.id);
        pesajescab.sort((p1, p2) =>
            new Date(p1.fecha) > new Date(p2.fecha) ? -1 : 1,
        );
    }
    async function editarPesajeOffline() {
        let data = {
            fecha: new Date(fecha).toISOString().split("T")[0] + " 03:00:00",
            pesonuevo,
        };
        try {
            let idx_pesaje = pesajes.findIndex((p) => pesajes);
            pesajes[idx_pesaje].fecha = data.fecha;
            pesajes[idx_pesaje].pesonuevo = data.pesonuevo;
            let nanimal = pesajes[idx_pesaje].animal.split("_").length > 1;
            await setPesajesSQL(db, pesajes);
            let comando = {
                tipo: "update",
                coleccion: "pesaje",
                data,
                hora: Date.now(),
                prioridad: 2,
                idprov: idpesaje,
                camposprov: nanimal ? "animal" : "",
                show:{...data},
                motivo:"Editar pesaje"
            };
            comandos.push(comando)
            Swal.fire(
                "Éxito editar pesaje",
                "Se pudo editar el pesaje",
                "success",
            );
            actualizarDatos();
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error editar pesaje",
                "No se pudo editar el pesaje",
                "error",
            );
            actualizarDatos();
        }
        detallePesaje.close();
    }
    async function editarPesajeOnline() {
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[4]) {
            Swal.fire("Error permisos", getPermisosMessage(4), "error");
            return;
        }
        try {
            let data = {
                fecha:
                    new Date(fecha).toISOString().split("T")[0] + " 03:00:00",
                pesonuevo,
            };
            let idx_pesaje = pesajes.findIndex((p) => p.id == idpesaje);

            await pb.collection("pesaje").update(idpesaje, data);
            pesajes[idx_pesaje].fecha = data.fecha;
            pesajes[idx_pesaje].pesonuevo = data.pesonuevo;

            await setPesajesSQL(db, pesajes);

            Swal.fire(
                "Éxito editar pesaje",
                "Se pudo editar el pesaje",
                "success",
            );
            actualizarDatos();
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error editar pesaje",
                "No se pudo editar el pesaje",
                "error",
            );
            actualizarDatos();
        }

        detallePesaje.close();
    }
    async function editarPesaje() {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        let isOnline = await getOnlyInternet();
        intermitenter.addIntermitente(isOnline);
        if (coninternet.connected) {
            await editarPesajeOnline();
        } else {
            await editarPesajeOffline();
        }
    }
    async function eliminarOffline() {
        detallePesaje.close();
        Swal.fire({
            title: "Eliminar pesajes",
            text: "¿Seguro que deseas eliminar el pesaje?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si",
            cancelButtonText: "No",
        }).then(async (result) => {
            if (result.value) {
                try {
                    let p_idx = pesajes.findIndex((p) => p.id == idpesaje);
                    let pes = { ...pesajes[p_idx] };
                    pesajes = pesajes.filter((p) => p.id != idpesaje);

                    await setPesajesSQL(db, pesajes);
                    let comando = {
                        tipo: "delete",
                        coleccion: "pesaje",
                        data: { ...pes },
                        hora: Date.now(),
                        prioridad: 2,
                        idprov: idpesaje,
                        camposprov: "",
                        show:{...pes},
                        motivo:"Eliminar pesaje"
                    };
                    comandos.push(comando);
                    await setComandosSQL(db, comandos);
                    Swal.fire(
                        "Éxito eliminar pesaje",
                        "Se pudo eliminar el pesaje",
                        "success",
                    );
                    actualizarDatos();
                } catch (err) {
                    console.error(err);
                    Swal.fire(
                        "Error eliminar pesaje",
                        "No se pudo eliminar el pesaje",
                        "error",
                    );
                    actualizarDatos();
                }
            }
        });
    }
    async function eliminarOnline() {
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[4]) {
            Swal.fire("Error permisos", getPermisosMessage(4), "error");
            return;
        }
        detallePesaje.close();
        Swal.fire({
            title: "Eliminar pesajes",
            text: "¿Seguro que deseas eliminar el pesaje?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si",
            cancelButtonText: "No",
        }).then(async (result) => {
            if (result.value) {
                try {
                    pesajes = pesajes.filter((p) => p.id != idpesaje);
                    await setPesajesSQL(db, pesajes);
                    await pb.collection("pesaje").delete(idpesaje);
                    actualizarDatos();
                    Swal.fire(
                        "Éxito eliminar pesaje",
                        "Se pudo eliminar el pesaje",
                        "success",
                    );
                } catch (err) {
                    console.error(err);
                    Swal.fire(
                        "Error eliminar pesaje",
                        "No se pudo eliminar el pesaje",
                        "error",
                    );
                    actualizarDatos();
                }
            }
        });
    }
    async function eliminar() {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        let isOnline = await getOnlyInternet();
        intermitenter.addIntermitente(isOnline);
        if (coninternet.connected) {
            await eliminarOnline();
        } else {
            await eliminarOffline();
        }
    }
    function openDetalle(id) {
        idpesaje = id;
        let pesaje = pesajes.filter((p) => p.id == idpesaje)[0];
        caravana = pesaje.expand.animal.caravana;
        fecha = pesaje.fecha.split(" ")[0];
        pesoanterior = pesaje.pesoanterior;
        pesonuevo = pesaje.pesonuevo;

        detallePesaje.showModal();
    }
    async function getLocalSQL() {
        getlocal = true;
        let respesajes = await getPesajesSQL(db);
        pesajes = respesajes.lista;
        actualizarDatos();
        cargado = true;
    }
    async function initPage() {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        let isOnline = await getOnlyInternet();
        intermitenter.addIntermitente(isOnline);
        useroff = await getUserOffline();
        caboff = await getCabOffline();
        usuarioid = useroff.id;
    }
    async function updateComandos() {
        try {
            await flushComandosSQL(db, pb);
            comandos = [];
        } catch (err) {
            if (modedebug) {
                loger.addTextError(JSON.stringify(err), null, 2);
                loger.addTextError("Error en flush comandos pesajes");
            }
        }
    }
    async function getDataSQL() {
        proxyfiltros = proxy.load();
        setFilters();
        db = await openDB();
        //Reviso el internet
        let lastinter = await getInternetSQL(db);
        let rescom = await getComandosSQL(db);
        comandos = rescom.lista;
        await getLocalSQL();
    }
    onMount(async () => {
        await initPage();
        await getDataSQL();
    });
</script>

{#if modedebug}
    <Barrainternet bind:coninternet />
{/if}
<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-3">
            <div class="label">
                pesajes - {pesajes.length}
            </div>
            <div class="label">
                pesajescab - {pesajescab.length}
            </div>
            <div class="label">
                pesajesrows - {pesajesrows.length}
            </div>
            <span>
                con internet: {coninternet.connected}
            </span>
            <span>
                get local: {getlocal}
            </span>
        </div>
    {/if}
    <div class="grid grid-cols-1 lg:grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <button onclick={() => goto("/pesajes")}>
                <h2 class="flex text-2xl mx-1 font-bold mb-2 text-left mt-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="size-5 mt-1"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15.75 19.5 8.25 12l7.5-7.5"
                        />
                    </svg>
                    Pesajes
                </h2>
            </button>
        </div>
    </div>
    <div
        class="grid grid-cols-1 lg:grid-cols-2 m-1 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10 w-11/12"
    >
        <div class="w-11/12">
            <label
                class={`
                    input 
                    input-bordered 
                    flex 
                    items-center gap-2
                    ${estilos.bgdark2}
                `}
            >
                <input
                    type="text"
                    class="grow"
                    placeholder="Buscar..."
                    bind:value={buscarcaravana}
                    oninput={filterUpdate}
                />
            </label>
        </div>
        <div class="w-11/12">
            <Limpiar {limpiarFiltros} />
        </div>
    </div>
    <div class="w-11/12 m-1 mb-2 lg:mx-10 rounded-lg bg-transparent">
        <button aria-label="Filtrar" class="w-full" onclick={clickFilter}>
            <div class="flex justify-between items-center px-1">
                <h1 class="font-semibold text-lg py-2">Filtros</h1>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class={`h-5 w-5 transition-all duration-300 ${isOpenFilter ? "transform rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>
        </button>
        <div>
            <span class="text-lg my-1"
                >Total de pesajes encontrados: {pesajesrows.length}</span
            >
        </div>
        {#if isOpenFilter}
            <div transition:slide>
                <div class="grid grid-cols-1 lg:grid-cols-3 mb-2 lg:mb-3 gap-1">
                    <div class="">
                        <label
                            class="block tracking-wide mb-2"
                            for="grid-first-name"
                        >
                            Fecha desde
                        </label>
                        <input
                            id="fechadesde"
                            type="date"
                            class={`
                                input input-bordered
                                ${estilos.bgdark2}
                            `}
                            bind:value={fechadesde}
                            onchange={filterUpdate}
                        />
                    </div>
                    <div class="">
                        <label
                            class="block tracking-wide mb-2"
                            for="grid-first-name"
                        >
                            Fecha Hasta
                        </label>
                        <input
                            id="fechadesde"
                            type="date"
                            class={`
                                input input-bordered
                                ${estilos.bgdark2}
                            `}
                            bind:value={fechahasta}
                            onchange={filterUpdate}
                        />
                    </div>
                </div>
            </div>
        {/if}
    </div>
    {#if cargado}
        <!--Tabla de pesajes sin ordenar-->
        <div
            class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto"
        >
            <table class="table table-lg w-full">
                <thead>
                    <tr>
                        <th
                            class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"
                        >
                            Fecha
                        </th>
                        <th
                            class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"
                        >
                            Animal
                        </th>
                        <th
                            class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"
                        >
                            Pesaje
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {#each pesajesrows as p}
                        <tr
                            onclick={() => openDetalle(p.id)}
                            class="hover:bg-gray-200 dark:hover:bg-gray-900"
                        >
                            <td
                                class="text-base p-3 border-b dark:border-gray-600"
                            >
                                {new Date(p.fecha).toLocaleDateString()}
                            </td>
                            <td
                                class="text-base p-3 border-b dark:border-gray-600"
                            >
                                {shorterWord(p.expand.animal.caravana)}
                            </td>
                            <td
                                class="text-base p-3 border-b dark:border-gray-600"
                            >
                                {p.pesonuevo}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <!--Lista de pesajes sin ordenar-->
        <div class="block w-full md:hidden justify-items-center mx-1">
            {#each pesajesrows as p}
                <div
                    class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                >
                    <button onclick={() => openDetalle(p.id)}>
                        <div class="block p-4">
                            <div class="grid grid-cols-2 gap-y-2">
                                <div class="flex items-start">
                                    <span>Fecha:</span>
                                    <span class="mx-1 font-semibold">
                                        {new Date(p.fecha).toLocaleDateString()}
                                    </span>
                                </div>
                                <div class="flex items-start">
                                    <span>Caravana:</span>
                                    <span class="mx-1 font-semibold">
                                        {`${p.expand.animal.caravana}`}
                                    </span>
                                </div>
                                <div class="hidden flex items-start">
                                    <span>Peso anterior:</span>
                                    <span class="mx-1 font-semibold">
                                        {`${p.pesoanterior}`}
                                    </span>
                                </div>
                                <div class="flex items-start">
                                    <span>Pesaje:</span>
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
    {:else}
        <div class="flex items-center justify-center">
            <span class="loading loading-spinner text-success"></span>
        </div>
    {/if}
</Navbarr>
<dialog
    id="detallePesaje"
    class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle"
>
    <div
        class="
        modal-box w-11/12 max-w-xl
        bg-gradient-to-br from-white to-gray-100
        dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button
                class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl"
                >✕</button
            >
        </form>
        <h3 class="text-lg font-bold">Ver pesaje</h3>
        <div class="form-control">
            <div class="grid grid-cols-2 gap-1 lg:gap-6 mx-1 mb-2">
                <div class="mb-1 lg:mb-0">
                    <label for="caravana" class="label">
                        <span class="label-text text-base">Caravana</span>
                    </label>
                    <label
                        for="caravana"
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                    >
                        {caravana}
                    </label>
                </div>
                <div class="mb-1 lg:mb-0">
                    <label for="caravana" class="label">
                        <span class="label-text text-base">Fecha</span>
                    </label>
                    <label class="input-group">
                        <input
                            id="fecha"
                            type="date"
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
                    <label for="pesoanterior" class="label">
                        <span class="label-text text-base"
                            >Peso anterior(KG)</span
                        >
                    </label>
                    <label
                        for="pesoanterior"
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                    >
                        {pesoanterior}
                    </label>
                </div>
                <div class="mb-1 lg:mb-0">
                    <label for="pesonuevo" class="label">
                        <span class="label-text text-base">Peso nuevo(KG)</span>
                    </label>
                    <input
                        id="pesonuevo"
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
        <div class="modal-action justify-start">
            <button class="btn btn-success text-white" onclick={editarPesaje}
                >Editar</button
            >
            <button class="btn btn-error text-white" onclick={eliminar}
                >Eliminar</button
            >
            <button
                class={`
                    btn 
                    bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                    ${estilos.btnsecondary}`}
                onclick={() => detallePesaje.close()}>Cerrar</button
            >
        </div>
    </div>
</dialog>

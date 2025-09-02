<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import Exportar from "$lib/components/Exportar.svelte";
    import PocketBase from "pocketbase";
    import { slide } from "svelte/transition";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import { createCaber } from "$lib/stores/cab.svelte";
    import { isEmpty } from "$lib/stringutil/lib";
    import estilos from "$lib/stores/estilos";
    import { shorterWord } from "$lib/stringutil/lib";
    import * as XLSX from "xlsx";
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
    //offline
    import Barrainternet from "$lib/components/internet/Barrainternet.svelte";
    import { getInternet, getOnlyInternet } from "$lib/stores/offline";
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
        getPesajesSQL,
        updateLocalPesajesSQLUser,
        setPesajesSQL,
    } from "$lib/stores/sqlite/dbeventos";

    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";

    import {
        getComandosSQL,
        setComandosSQL,
        flushComandosSQL,
    } from "$lib/stores/sqlite/dbcomandos";

    //ofline
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({ connected: false });
    let ultimo_pesajes = $state({});
    let comandos = $state([]);
    let getlocal = $state(true);
    let getvelocidad = $state(0);
    let getactualizacion = $state(0);
    let getpermisos = $state("");
    let cargado = $state(false);
    let caber = createCaber();
    let cab = caber.cab;
    let ruta = import.meta.env.VITE_RUTA;
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    //let pre = import.meta.env.VITE_PRE
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let isOpenFilter = $state(false);
    //Datos filtrar
    let buscarcaravana = $state("");
    let fechadesde = $state("");
    let fechahasta = $state("");
    let pesajes = $state([]);
    let pesajescab = $state([]);
    let pesajesrows = $state([]);
    let filas = $state([]);
    let columnas = $state([]);
    let tablapesaje = $state({});
    let pesajesprocesados = $state([]);
    let defaultfiltro = {
        buscarcaravana: "",
        fechadesde: "",
        fechahasta: "",
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("listapesajes", defaultfiltro);
    //pesaje
    let idpesaje = $state("");
    let caravana = $state("");
    let fecha = $state("");
    let pesoanterior = $state("");
    let pesonuevo = $state("");
    let ultimos = $state(5);
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
        filas = [];
        columnas = [];
        tablapesaje = {};
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

        procesarUltimosPesajes();
    }
    function actualizarDatos() {
        onChangePesajes();
        filterUpdate();
    }
    async function editarPesajeOffline() {
        let data = {
            fecha: new Date(fecha).toISOString().split("T")[0] + " 03:00:00",
            pesonuevo,
        };
        try {
            let idx_pesaje = pesajes.findIndex((p) => p.id == idpesaje);
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
            };
            comandos.push(comando);
            await setComandosSQL(db, comandos);
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
        onChangePesajes();
        filterUpdate();
    }
    function eliminarOffline() {
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
    function eliminarOnline() {
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
    function prepararData(item) {
        return {
            ANIMAL: item.expand.animal.caravana,
            FECHA: new Date(item.fecha).toISOString().split("T")[0],
            PESO_ANTERIO: item.pesoanterior,
            PESO_NUEVO: item.pesonuevo,
        };
    }
    function exportarPesaje() {
        let lista = pesajesrows;
        let csvdata = lista.map((f) => {
            let filaexcel = {
                ANIMAL: f.expand.animal.caravana,
                FECHA: new Date(f.fecha).toLocaleDateString(),
                PESO_NUEVO: f.pesonuevo,
            };

            return filaexcel;
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([]);
        ws["A1"] = { t: "s", v: "Pesajes", s: {} };
        const range = XLSX.utils.decode_range("A1:K1");
        ws["!merges"] = [
            {
                s: { r: range.s.r, c: range.s.c },
                e: { r: range.e.r, c: range.e.c },
            },
        ];
        XLSX.utils.sheet_add_json(ws, csvdata, { origin: "A2" });
        XLSX.utils.book_append_sheet(wb, ws, "Pesajes");
        let confiltros = false;
        let filtros = [];
        if (confiltros) {
            const wsFilter = XLSX.utils.aoa_to_sheet(filtros);
            XLSX.utils.book_append_sheet(wb, wsFilter, "Filtros aplicados");
        }
        XLSX.writeFile(wb, `${"Pesajes".replace(/\//g, "-")}.xlsx`, {
            cellStyles: true,
        });
    }
    function procesarUltimosPesajes() {
        pesajesprocesados = [];
        //tabla[animal] = { animal,pesajes:[{fecha,peso}]}
        let tablapesajes = {};

        for (let i = 0; i < pesajesrows.length; i++) {
            let p = pesajesrows[i];
            try {
                let caravana = p.expand.animal.caravana;
                let fecha = p.fecha;
                let peso = p.pesonuevo;
                let id = p.id;
                if (tablapesajes[caravana]) {
                    if (tablapesajes[caravana].pesajes.length < ultimos) {
                        tablapesajes[caravana].pesajes.push({
                            fecha,
                            peso,
                            id,
                        });
                    }
                } else {
                    tablapesajes[caravana] = {
                        animal: caravana,
                        pesajes: [{ fecha, peso, id }],
                    };
                }
            } catch (err) {
                if (modedebug) {
                    loger.addTextError("error fecha");
                    loger.addTextError(JSON.stringify(p, null, 2));
                }
            }
        }

        for (const [key, value] of Object.entries(tablapesajes)) {
            pesajesprocesados.push(value);
        }
    }
    function procesarPesajes() {
        let setanimales = new Set();
        let setfechas = new Set();
        tablapesaje = {};
        for (let i = 0; i < pesajesrows.length; i++) {
            let p = pesajesrows[i];
            let caravana = p.expand.animal.caravana;
            let fecha = p.fecha;
            if (tablapesaje[fecha]) {
                //Puede ocurrir que tenga 2 pesajes en el mismo dia?
                //En teoria si pero debe ser unerror, guardo el último
                if (tablapesaje[fecha][caravana]) {
                    tablapesaje[fecha][caravana] = {
                        pesonuevo: p.pesonuevo,
                        pesoanterior: p.pesoanterior,
                        id: p.id,
                    };
                } else {
                    tablapesaje[fecha][caravana] = {
                        pesonuevo: p.pesonuevo,
                        pesoanterior: p.pesoanterior,
                        id: p.id,
                    };
                }
            } else {
                tablapesaje[fecha] = {};
                tablapesaje[fecha][caravana] = {
                    pesonuevo: p.pesonuevo,
                    pesoanterior: p.pesoanterior,
                    id: p.id,
                };
            }
            //Así recorro los animales
            setanimales.add(caravana);
            //Así recorro las fecha
            setfechas.add(fecha);
        }
        filas = Array.from(setanimales);
        columnas = Array.from(setfechas);
        columnas.sort((a, b) => (new Date(a) < new Date(b) ? -1 : 1));
    }
    async function onMountOriginal() {
        await getPesajes();
        filterUpdate();
    }
    function onChangePesajes() {
        pesajescab = pesajes.filter((p) => p.expand.animal.cab == caboff.id);
        pesajescab.sort((p1, p2) =>
            new Date(p1.fecha) > new Date(p2.fecha) ? -1 : 1,
        );
    }
    async function updateLocalSQL() {
        pesajes = await updateLocalPesajesSQLUser(db, pb, usuarioid);
        onChangePesajes();
        filterUpdate();
        cargado = true;
    }
    async function getLocalSQL() {
        proxyfiltros = proxy.load();
        setFilters();
        let respesajes = await getPesajesSQL(db);
        pesajes = respesajes.lista;
        onChangePesajes();
        filterUpdate();
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
    async function oldData() {
        if (lastinter.internet == 0) {
            await setInternetSQL(db, 1, Date.now());
            await updateLocalSQL();
        } else {
            let ahora = Date.now();
            let antes = lastinter.ultimo;
            const cincoMinEnMs = 300000;
            if (ahora - antes >= cincoMinEnMs) {
                await updateLocalSQL();
            } else {
                await getLocalSQL();
            }
        }
    }
    async function updateComandos() {
        try {
            await flushComandosSQL(db, pb);
            comandos = [];
        } catch (err) {
            if (modedebug) {
                loger.addTextError(JSON.stringify(err), null, 2);
                loger.addTextError("Error en flush comandos pesajes lista");
            }
        }
    }
    async function updateGetLocalSQL() {
        //Reviso el internet
        let lastinter = await getInternetSQL(db);
        let rescom = await getComandosSQL(db);
        ultimo_pesajes = await getUltimoPesajeSQL(db);
        comandos = rescom.lista;
        let ahora = Date.now();
        let antes = ultimo_pesajes.ultimo;
        if (coninternet.connected) {
            await updateComandos();

            let velocidad = await velocidader.medirVelocidadInternet();
            if (modedebug) {
                getvelocidad = velocidad;
            }
            let confiabilidad = intermitenter.calculateIntermitente();
            let mustUpdate = await deboActualizar(
                velocidad,
                confiabilidad,
                coninternet,
                false, //solo en el internet
                ahora,
                antes,
            );
            if (modedebug) {
                getactualizacion = await actualizacion(
                    velocidad,
                    confiabilidad,
                    coninternet.connectionType,
                );
            }

            if (mustUpdate) {
                await updateLocalSQL();
            } else {
                await getLocalSQL();
            }
        } else {
            await getLocalSQL();
        }
    }
    async function getDataSQL() {
        db = await openDB();
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
                <h2
                    class="hidden md:flex text-2xl mx-1 font-bold mb-2 text-left mt-2"
                >
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
                    Historia pesajes - Últimos {ultimos}
                </h2>
                <h2
                    class="md:hidden flex text-2xl mx-1 font-bold mb-2 text-left mt-2"
                >
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
                    Historia pesajes - Últimos {ultimos - 2}
                </h2>
            </button>
        </div>
        <div class="flex col-span-2 gap-1 justify-start lg:justify-end my-1">
            <div class="flex flex-row gap-2">
                <div>
                    <a
                        class={`
                        btn 
                        bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                        ${estilos.btnsecondary}`}
                        href={"/pesajes/historial"}
                    >
                        <span class="text-xl font-semibold">Historial</span>
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
                    <span class="text-xl font-semibold">Exportar</span>
                </button>
            </div>
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
        <div>
            <div
                class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto"
            >
                <table class="table table-lg w-full">
                    <thead>
                        <tr>
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >Animal</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >5</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >4</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >3</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >2</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >1</th
                            >
                        </tr>
                    </thead>
                    <tbody>
                        {#each pesajesprocesados as f}
                            <tr>
                                <td class="text-base mx-1 px-1">
                                    {shorterWord(f.animal)}
                                </td>
                                {#each Array(5) as _, idx}
                                    {#if f.pesajes.length < ultimos - idx}
                                        <td>
                                            {"-"}
                                        </td>
                                    {:else}
                                        <td
                                            onclick={() =>
                                                openDetalle(
                                                    f.pesajes[ultimos - idx - 1]
                                                        .id,
                                                )}
                                            class="cursor-pointer text-base mx-1 px-1 hover:bg-gray-200 dark:hover:bg-gray-900"
                                        >
                                            {new Date(
                                                f.pesajes[
                                                    ultimos - idx - 1
                                                ].fecha,
                                            ).toLocaleDateString()} , {f
                                                .pesajes[ultimos - idx - 1]
                                                .peso}
                                        </td>
                                    {/if}
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <div
                class="w-full md:hidden justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto"
            >
                <table class="table table-lg w-full">
                    <thead>
                        <tr>
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >Animal</th
                            >

                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >3</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >2</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >1</th
                            >
                        </tr>
                    </thead>
                    <tbody>
                        {#each pesajesprocesados as f}
                            <tr>
                                <td class="text-base mx-1 px-1">
                                    {shorterWord(f.animal)}
                                </td>
                                {#each Array(3) as _, idx}
                                    {#if f.pesajes.length < ultimos - (idx + 2)}
                                        <td>
                                            {"-"}
                                        </td>
                                    {:else}
                                        <td
                                            onclick={() =>
                                                openDetalle(
                                                    f.pesajes[
                                                        ultimos - (idx + 2) - 1
                                                    ].id,
                                                )}
                                            class="cursor-pointer text-base mx-1 px-1 hover:bg-gray-200 dark:hover:bg-gray-900"
                                        >
                                            {new Date(
                                                f.pesajes[
                                                    ultimos - (idx + 2) - 1
                                                ].fecha,
                                            ).toLocaleDateString()} , {f
                                                .pesajes[
                                                ultimos - (idx + 2) - 1
                                            ].peso}
                                        </td>
                                    {/if}
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
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

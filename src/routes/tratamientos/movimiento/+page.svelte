<script>
    import { goto } from "$app/navigation";
    import Navbarr from "$lib/components/Navbarr.svelte";
    import PocketBase from "pocketbase";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    import estilos from "$lib/stores/estilos";
    import estados from "$lib/stores/estados";
    import { createCaber } from "$lib/stores/cab.svelte";
    import categorias from "$lib/stores/categorias";
    import sexos from "$lib/stores/sexos";
    import { capitalize } from "$lib/stringutil/lib";
    import { guardarHistorial } from "$lib/historial/lib";
    import MultiSelect from "$lib/components/MultiSelect.svelte";
    import { getSexoNombre } from "$lib/stringutil/lib";
    import { shorterWord } from "$lib/stringutil/lib";
    //formulario
    import CustomDate from "$lib/components/CustomDate.svelte";
    import SelectFertil from "$lib/components/SelectFertil.svelte";
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
    //OFfline
    import Barrainternet from "$lib/components/internet/Barrainternet.svelte";
    import { getInternet, getOnlyInternet } from "$lib/stores/offline";
    import { openDB, resetTables } from "$lib/stores/sqlite/main";
    import { getUserOffline } from "$lib/stores/capacitor/offlineuser";
    import {
        getCabOffline,
        updatePermisos,
    } from "$lib/stores/capacitor/offlinecab";
    import { Network } from "@capacitor/network";
    import {
        getInternetSQL,
        setInternetSQL,
    } from "$lib/stores/sqlite/dbinternet";
    import {
        getLotesSQL,
        getRodeosSQL,
        getLotesRodeosSQL,
        updateLocalRodeosSQL,
        getUpdateLocalRodeosLotesSQLUser,
        getTiposTratSQL,
        updateLocalTratsSQL,
        updateLocalTratsSQLUser,
        getTratsSQL,
        addSomeNewTrataSQL,
    } from "$lib/stores/sqlite/dbeventos";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import {
        setAnimalesSQL,
        getAnimalesSQL,
        setUltimoAnimalesSQL,
        updateLocalAnimalesSQL,
        getUltimoAnimalesSQL,
        getUpdateLocalAnimalesSQLUser,
    } from "$lib/stores/sqlite/dbanimales";
    import {
        getComandosSQL,
        setComandosSQL,
        flushComandosSQL,
    } from "$lib/stores/sqlite/dbcomandos";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import InfoAnimal from "$lib/components/InfoAnimal.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    //offline
    let infotoast = $state(false);
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let ultimo_animal = $state({});
    let getlocal = $state(false);
    let getvelocidad = $state(0);
    let getactualizacion = $state(0);
    let getpermisos = $state("");
    let cargado = $state(false);
    let coninternet = $state({ connected: false });
    let comandos = $state([]);

    let ruta = import.meta.env.VITE_RUTA;
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let caber = createCaber();
    let cab = caber.cab;
    //boton
    let textoboton = $state("Tratamientos");
    //Datos animales
    let animales = $state([]);
    let animalesrows = $state([]);
    //Filtros

    let buscar = $state("");
    let lote = $state("");
    let rodeo = $state("");
    let loteseleccion = $state([]);
    let rodeoseleccion = $state([]);
    let categoriaseleccion = $state([]);
    let categoria = $state("");
    let sexo = $state("H");
    let raza = $state("");
    let color = $state("");

    let defaultfiltro = {
        buscar: "",
        lote: "",
        rodeo: "",
        raza: "",
        color: "",
        categoria: "",
        sexo: "H",
        rodeoseleccion: [],
        loteseleccion: [],
        categoriaseleccion: [],
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("tratamientosanimales", defaultfiltro);

    let lotes = $state([]);
    let rodeos = $state([]);
    let isOpenFilter = $state(false);
    let tipotratamientos = $state([]);

    //Seleccionados
    let selectanimales = $state([]);
    let selecthashmap = $state({});
    let todos = $state(false);
    let algunos = $state(false);
    let ninguno = $state(true);

    //movimiento
    let fecha = $state("");
    let tipotratamientoselect = $state("");
    let observaciongeneral = $state("");

    //validacion
    let malfecha = $state(false);
    let maltipo = $state(false);
    let botonhabilitado = $state(false);

    function clickFilter() {
        isOpenFilter = !isOpenFilter;
    }
    function limpiar() {
        selectanimales = [];
        let lista = [];
        for (const [key, value] of Object.entries(selecthashmap)) {
            lista.push(key);
        }
        for (let i = 0; i < lista.length; i++) {
            selecthashmap[lista[i]] = null;
        }
        algunos = false;
        todos = false;
        ninguno = true;
    }
    function setFilters() {
        buscar = proxyfiltros.buscar;
        raza = proxyfiltros.raza;
        color = proxyfiltros.color;
        lote = proxyfiltros.lote;
        rodeo = proxyfiltros.rodeo;
        categoria = proxyfiltros.categoria;
        sexo = proxyfiltros.sexo;
        rodeoseleccion = proxyfiltros.rodeoseleccion;
        loteseleccion = proxyfiltros.loteseleccion;
        categoriaseleccion = proxyfiltros.categoriaseleccion;
    }

    function setProxyFilter() {
        proxyfiltros.buscar = buscar;
        proxyfiltros.raza = raza;
        proxyfiltros.color = color;
        proxyfiltros.lote = lote;
        proxyfiltros.rodeo = rodeo;
        proxyfiltros.categoria = categoria;
        proxyfiltros.sexo = sexo;
        proxyfiltros.rodeoseleccion = rodeoseleccion;
        proxyfiltros.loteseleccion = loteseleccion;
        proxyfiltros.categoriaseleccion = categoriaseleccion;
    }

    function limpiarFiltros() {
        proxyfiltros = { ...defaultfiltro };

        setFilters();
        filterUpdate();
    }
    function filterUpdate() {
        setProxyFilter();
        proxy.save(proxyfiltros);
        animalesrows = animales;
        if (buscar != "") {
            animalesrows = animalesrows.filter((a) =>
                a.caravana
                    .toLocaleLowerCase()
                    .includes(buscar.toLocaleLowerCase()),
            );
        }
        if (sexo != "") {
            animalesrows = animalesrows.filter((a) => a.sexo == sexo);
        }
        if (raza != "") {
            animalesrows = animalesrows.filter((a) =>
                a.raza.toLocaleLowerCase().includes(raza.toLocaleLowerCase()),
            );
        }
        if (color != "") {
            animalesrows = animalesrows.filter((a) =>
                a.color.toLocaleLowerCase().includes(color.toLocaleLowerCase()),
            );
        }
        if (rodeoseleccion.length != 0) {
            if (rodeoseleccion.length == 1 && rodeoseleccion[0] == "-1") {
                animalesrows = animalesrows.filter((a) => !a.rodeo);
            } else {
                animalesrows = animalesrows.filter((a) =>
                    rodeoseleccion.includes(a.rodeo),
                );
            }
        }
        if (loteseleccion.length != 0) {
            if (loteseleccion.length == 1 && loteseleccion[0] == "-1") {
                animalesrows = animalesrows.filter((a) => !a.lote);
            } else {
                animalesrows = animalesrows.filter((a) =>
                    loteseleccion.includes(a.lote),
                );
            }
        }
        if (categoriaseleccion.length != 0) {
            if (
                categoriaseleccion.length == 1 &&
                categoriaseleccion[0] == "-1"
            ) {
                animalesrows = animalesrows.filter((a) => !a.categoria);
            } else {
                animalesrows = animalesrows.filter((a) =>
                    categoriaseleccion.includes(a.categoria),
                );
            }
        }
    }
    function ordenarNombre(lista) {
        lista.sort((r1, r2) =>
            r1.nombre.toLocaleLowerCase() > r2.nombre.toLocaleLowerCase()
                ? 1
                : -1,
        );
    }

    function clickAnimal(id) {
        if (selecthashmap[id]) {
            if (todos) {
                todos = false;
                algunos = true;
            }
            selecthashmap[id] = null;
        } else {
            if (ninguno) {
                algunos = true;
                ninguno = false;
            }
            let a = animales.filter((an) => an.id == id)[0];
            selecthashmap[id] = {
                ...a,
            };
        }
    }
    function clickTodos() {
        if (todos) {
            todos = false;
            ninguno = true;
            algunos = false;
            selecthashmap = {};
        } else if (ninguno) {
            ninguno = false;
            todos = true;
            for (let i = 0; i < animalesrows.length; i++) {
                let a = animalesrows[i];
                selecthashmap[animalesrows[i].id] = {
                    ...a,
                };
            }
        } else if (algunos) {
            selecthashmap = {};
            algunos = false;
            todos = false;
            ninguno = true;
        }
    }
    function inputObsGeneral() {
        for (let i = 0; i < selectanimales.length; i++) {
            selectanimales[i].observacionnuevo = observaciongeneral;
        }
    }
    
    
    function openNewModal() {
        if (ninguno) {
            Swal.fire(
                "Error tratamiento",
                "No hay animales seleccionados",
                "error",
            );
            return;
        }
        selectanimales = [];
        for (const [key, value] of Object.entries(selecthashmap)) {
            if (value != null) {
                selectanimales.push({
                    ...value,
                    tipotratamiento: "",
                    observacionnuevo: "",
                });
            }
        }
        tratamientoMasivo.showModal();
    }
    async function guardarTratamientoBulkOnline() {
        if (fecha == "" || tipotratamientoselect == "") {
            Swal.fire(
                "Error tratamientos",
                "Debe seleccionar una fecha",
                "error",
            );
            return;
        }
        let errores = false;
        let bulkdata = [];
        let errorestrata = [];
        for (let i = 0; i < selectanimales.length; i++) {
            let tratamientoanimal = selectanimales[i];
            let datatratamiento = {
                fecha: fecha + " 03:00:00",
                observacion: tratamientoanimal.observacionnuevo,
                categoria: tratamientoanimal.categoria,
                animal: tratamientoanimal.id,
                tipo: tipotratamientoselect,
                active: true,
                cab: caboff.id,
            };
            bulkdata.push(datatratamiento);
        }
        try {
            const batch = pb.createBatch();
            for (let i = 0; i < bulkdata.length; i++) {
                let t = bulkdata[i];
                batch.collection("tratamientos").create(t);
            }

            const result = await batch.send();

            //Como es por batch nunca voy a tener el id
            await updateLocalTratsSQLUser(db, pb, usuarioid);

            Swal.fire(
                "Éxito tratamientos",
                "Se lograron registrar todos los tratamientos",
                "success",
            );
        } catch (err) {
            Swal.fire(
                "Error tratamientos",
                "Hubo algun error en algun tratamiento",
                "error",
            );
        }

        fecha = "";
        malfecha = false;
        maltipo = false;
        tipotratamientoselect = "";
        botonhabilitado = false;
        selecthashmap = {};
        selectanimales = [];
    }
    async function guardarTratamientoOnline() {
        if (fecha == "" || tipotratamientoselect == "") {
            Swal.fire(
                "Error tratamientos",
                "Debe seleccionar una fecha",
                "error",
            );
            return;
        }
        let errores = false;
        let bulkdata = [];
        let errorestrata = [];
        for (let i = 0; i < selectanimales.length; i++) {
            let tratamientoanimal = selectanimales[i];
            let datatratamiento = {
                fecha: fecha + " 03:00:00",
                observacion: tratamientoanimal.observacionnuevo,
                categoria: tratamientoanimal.categoria,
                animal: tratamientoanimal.id,
                tipo: tipotratamientoselect,
                active: true,
                cab: caboff.id,
            };
            try {
                let record = await pb
                    .collection("tratamientos")
                    .create(datatratamiento);
                record = {
                    ...record,
                    expand: {
                        animal: getDatoAnimal(tratamientoanimal.id),
                        tipo: {
                            id: tipotratamientoselect,
                            nombre: getTipoNombre(tipotratamientoselect),
                        },
                    },
                };
                await addSomeNewTrataSQL(db, [record]);
            } catch (err) {
                errorestrata.push(tratamientoanimal.id);
                console.error(err);
                errores = true;
            }
        }

        fecha = "";
        malfecha = false;
        maltipo = false;
        tipotratamientoselect = "";
        botonhabilitado = false;
        for (let i = 0; i < selectanimales.length; i++) {
            let ts = selectanimales[i];
            let i_error = errorestrata.findIndex((pid) => pid == ts.id);
            if (i_error == -1) {
                delete selecthashmap[ts.id];
            }
        }
        selectanimales = [];
        Swal.fire(
            "Éxito tratamientos",
            "Se logró registrar los tratamientos ",
            "success",
        );
    }
    function getDatoAnimal(idanimal) {
        let a = animales.filter((an) => an.id == idanimal)[0];
        return {
            id: a.id,
            caravana: a.caravana,
            categoria: a.categoria,
        };
    }
    function getTipoNombre(idtipo) {
        let t = tipotratamientos.filter((ti) => ti.id == idtipo)[0];
        return t.nombre;
    }
    async function guardarTratamientoOffline() {
        if (fecha == "" || tipotratamientoselect == "") {
            Swal.fire(
                "Error tratamientos",
                "Debe seleccionar una fecha",
                "error",
            );
            return;
        }
        try {
            let errores = false;
            let trats = [];
            for (let i = 0; i < selectanimales.length; i++) {
                let tratamientoanimal = selectanimales[i];
                let idprov = "nuevo_trat_" + generarIDAleatorio();
                let nuevoanimal = tratamientoanimal.id.split("_")[0] == "nuevo";
                let nuevotipo = tipotratamientoselect.split("_")[0] == "nuevo";
                let dataanimal = getDatoAnimal(tratamientoanimal.id);
                let nombretipo = getTipoNombre(tipotratamientoselect);
                //El expand falta
                let datatratamiento = {
                    fecha: fecha + " 03:00:00",
                    observacion: tratamientoanimal.observacionnuevo,
                    categoria: tratamientoanimal.categoria,
                    animal: tratamientoanimal.id,
                    tipo: tipotratamientoselect,
                    active: true,
                    cab: caboff.id,
                    id: idprov,
                    expand: {
                        animal: {
                            categoria: dataanimal.categoria,
                            caravana: dataanimal.caravana,
                        },
                        tipo: {
                            nombre: nombretipo,
                        },
                    },
                };
                let camposprov = "";
                if (nuevoanimal) {
                    camposprov = "animal";
                    if (nuevotipo) {
                        camposprov += ",tipo";
                    }
                }
                if (nuevotipo) {
                    camposprov = "tipo";
                }
                let comando = {
                    tipo: "add",
                    coleccion: "tratamientos",
                    data: { ...datatratamiento },
                    hora: Date.now(),
                    prioridad: 5,
                    idprov,
                    camposprov,
                    show: { ...datatratamiento },
                    motivo: "Nuevo tratamiento",
                };
                trats.push(datatratamiento);
                comandos.push(comando);
            }

            await addSomeNewTrataSQL(db, trats);
            await setComandosSQL(db, comandos);
            Swal.fire(
                "Éxito tratamientos",
                "Se lograron registrar todos los tratamientos",
                "success",
            );
        } catch (err) {
            Swal.fire(
                "Error tratamientos",
                "Hubo algun error en algun tratamiento",
                "error",
            );
        }

        fecha = "";
        malfecha = false;
        maltipo = false;
        tipotratamientoselect = "";
        botonhabilitado = false;
        selecthashmap = {};
        selectanimales = [];
    }
    async function guardarTratamiento() {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        let isOnline = await getOnlyInternet();
        intermitenter.addIntermitente(isOnline);
        if (coninternet.connected) {
            caboff = await updatePermisos(pb, usuarioid);
            getpermisos = caboff.permisos;
            let listapermisos = getPermisosList(caboff.permisos);
            if (!listapermisos[4]) {
                Swal.fire("Error permisos", getPermisosMessage(4), "error");
                return;
            }
            await guardarTratamientoOnline();
            if (Object.keys(selecthashmap).length > 0) {
                todos = false;
                algunos = true;
                ninguno = false;
            } else {
                todos = false;
                algunos = false;
                ninguno = true;
            }
        } else {
            await guardarTratamientoOffline();
            if (Object.keys(selecthashmap).length > 0) {
                todos = false;
                algunos = true;
                ninguno = false;
            } else {
                todos = false;
                algunos = false;
                ninguno = true;
            }
        }
    }
    
    async function initPage() {
        //coninternet = {connected:false} // await Network.getStatus();
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
    async function getLocalSQL() {
        getlocal = true;
        let resanimales = await getAnimalesSQL(db);
        let reslotes = await getLotesSQL(db);
        let resrodeos = await getRodeosSQL(db);
        let lotesrodeos = await getLotesRodeosSQL(db, caboff.id);
        let restipos = await getTiposTratSQL(db);
        tipotratamientos = restipos.lista.filter(
            (tt) => tt.generico || tt.cab == caboff.id,
        );
        animales = resanimales.lista.filter(
            (a) => a.active && a.cab == caboff.id,
        );

        lotes = lotesrodeos.lotes;
        rodeos = lotesrodeos.rodeos;

        filterUpdate();
        cargado = true;
    }

    async function getDataSQL() {
        proxyfiltros = proxy.load();
        setFilters();
        db = await openDB();
        //Reviso el internet
        let lastinter = await getInternetSQL(db);
        ultimo_animal = await getUltimoAnimalesSQL(db);
        let rescom = await getComandosSQL(db);
        comandos = rescom.lista;
        await getLocalSQL();
    }
    onMount(async () => {
        await initPage();
        await getDataSQL();
    });
    function setArbitrarioInternet(conectado) {
        coninternet.connected = conectado;
    }
</script>

{#if modedebug}
    <Barrainternet bind:coninternet />
{/if}
<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-3">
            <div class="label">
                <span>
                    last internet: {ultimo_animal.ultimo}
                </span>
            </div>
            <div class="label">
                <span>
                    con internet: {coninternet.connected}
                </span>
            </div>
            <div class="label">
                <span>
                    get local: {getlocal}
                </span>
            </div>
        </div>
    {/if}
    <div class="grid grid-cols-2 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <button
                class="bg-transparent border-none flex"
                aria-label="volver"
                onclick={() => goto("/tratamientos")}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6 mt-1"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                </svg>
                <h1 class="text-2xl">Tratamientos</h1>
            </button>
        </div>
        <div class="flex gap-1 justify-end">
            <button
                class={`btn btn-primary rounded-lg ${estilos.btntext}`}
                data-theme="forest"
                onclick={() => openNewModal()}
            >
                <span class="text-xl">{capitalize("nuevo")}</span>
            </button>
            <button
                onclick={() => goto("/tratamientos")}
                class={`
                    hidden
                    bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                    ${estilos.btnsecondary}
                    rounded-full
                    px-4 pt-2 pb-3
                `}
                aria-label="Exportar"
            >
                <span class="text-xl font-semibold">Volver</span>
            </button>
        </div>
    </div>
    <div
        class="grid grid-cols-1 lg:grid-cols-2 m-1 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10"
    >
        <div class="w-11/12">
            <label
                class={`input input-bordered flex items-center gap-2 ${estilos.bgdark2}`}
            >
                <input
                    type="text"
                    class="grow"
                    placeholder="Buscar..."
                    bind:value={buscar}
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
                <h2 class="font-semibold text-xl py-2">Filtros</h2>
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
        <div class="flex justify-between items-center px-1">
            <h3 class=" text-md py-2">
                Animales seleccionados: {Object.keys(selecthashmap).length}
            </h3>
        </div>
        {#if isOpenFilter}
            <div
                transition:slide
                class="grid grid-cols-1 lg:grid-cols-4 m-1 gap-2 w-11/12"
            >
                <SelectFertil
                    etiqueta="Sexo"
                    bind:value={sexo}
                    opciones={[{ id: "", nombre: "Todos" }].concat(sexos)}
                    onchange={filterUpdate}
                />
                <div class="hidden">
                    <label for="sexo" class="label">
                        <span class="label-text text-base">Sexo</span>
                    </label>
                    <label class="input-group">
                        <select
                            class={`
                            select select-bordered w-full
                            rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2}
                        `}
                            bind:value={sexo}
                            onchange={filterUpdate}
                        >
                            <option value="">Todos</option>
                            {#each sexos as s}
                                <option value={s.id}>{s.nombre}</option>
                            {/each}
                        </select>
                    </label>
                </div>
                <div class="mt-0">
                    <MultiSelect
                        opciones={[{ id: "-1", nombre: "Sin rodeo" }].concat(
                            rodeos,
                        )}
                        bind:valores={rodeoseleccion}
                        etiqueta="Rodeos"
                        {filterUpdate}
                    />
                </div>
                <div class="mt-0">
                    <MultiSelect
                        opciones={[{ id: "-1", nombre: "Sin lote" }].concat(
                            lotes,
                        )}
                        bind:valores={loteseleccion}
                        etiqueta="Lotes"
                        {filterUpdate}
                    />
                </div>
                <div class="">
                    <MultiSelect
                        opciones={[
                            { id: "-1", nombre: "Sin categoria" },
                        ].concat(categorias)}
                        bind:valores={categoriaseleccion}
                        etiqueta="Categorias"
                        {filterUpdate}
                    />
                </div>
                <div class="my-0 py-0">
                    <label for="raza" class="label mb-0">
                        <span class="label-text text-base">Raza</span>
                    </label>
                    <label class="input-group">
                        <input
                            type="text"
                            class={`
                                        input input-bordered w-full
                                        rounded-md
                                        focus:outline-none focus:ring-2 
                                        focus:ring-green-500 
                                        focus:border-green-500
                                        
                                        ${estilos.bgdark2}
                                    `}
                            bind:value={raza}
                            oninput={filterUpdate}
                        />
                    </label>
                </div>
                <div class="my-0 py-0">
                    <label for="color" class="label mb-0">
                        <span class="label-text text-base">Color</span>
                    </label>
                    <label class="input-group">
                        <input
                            type="text"
                            class={`
                                        input input-bordered w-full
                                        rounded-md
                                        focus:outline-none focus:ring-2 
                                        focus:ring-green-500 
                                        focus:border-green-500
                                        
                                        ${estilos.bgdark2}
                                    `}
                            bind:value={color}
                            oninput={filterUpdate}
                        />
                    </label>
                </div>
            </div>
        {/if}
    </div>
    {#if cargado}
        <div>
            <div
                class="hidden w-full md:grid grid-cols-1 justify-items-center mx-1 lg:mx-10 lg:w-11/12 overflow-x-auto"
            >
                <table class="table table-lg w-full">
                    <thead>
                        <tr>
                            <th class="px-1 py-0 m-0">
                                <button
                                    aria-label="Todos"
                                    onclick={clickTodos}
                                    class={`
                                text-base bg-transparent rounded-lg
                                px-3 py-3 text-base
                                ${estilos.secundario}
                            `}
                                >
                                    {#if todos}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke-width="1.5"
                                            stroke="green"
                                            class="size-6"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                            />
                                        </svg>
                                    {/if}
                                    {#if ninguno}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke-width="1.5"
                                            stroke="currentColor"
                                            class="size-6"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                            />
                                        </svg>
                                    {/if}
                                    {#if algunos}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke-width="1.5"
                                            stroke="red"
                                            class="size-6"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                            />
                                        </svg>
                                    {/if}
                                </button>
                            </th>
                            <th class="text-base mx-1 px-1">Caravana</th>
                            <th class="text-base mx-1 px-1">Categoria</th>
                            <th class="text-base mx-1 px-1">Peso</th>
                            <th class="text-base mx-1 px-1">Rodeo</th>
                            <th class="text-base mx-1 px-1">Lote</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each animalesrows as a}
                            <tr>
                                <td class="px-1 py-0 m-0">
                                    <button
                                        aria-label="fila"
                                        onclick={() => clickAnimal(a.id)}
                                        class={`
                                    font-medium bg-transparent rounded-lg
                                    px-3 py-3 text-base
                                    ${selecthashmap[a.id] ? estilos.danger : estilos.primario}
                                `}
                                    >
                                        {#if selecthashmap[a.id]}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke-width="1.5"
                                                stroke="red"
                                                class="size-6"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                        {:else}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke-width="1.5"
                                                stroke="green"
                                                class="size-6"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                        {/if}
                                    </button>
                                </td>
                                <td class="text-base mx-1 px-0">{a.caravana}</td
                                >
                                <td class="text-base mx-1 px-0"
                                    >{a.categoria}</td
                                >
                                <td class="text-base mx-1 px-0">{a.peso}</td>
                                <td class="text-base mx-1 px-0"
                                    >{a.expand?.rodeo?.nombre || ""}</td
                                >
                                <td class="text-base mx-1 px-0"
                                    >{a.expand?.lote?.nombre || ""}</td
                                >
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <div class="block md:hidden justify-items-center mx-1">
                <div class="w-full flex justify-start">
                    <button
                        aria-label="Todos"
                        onclick={clickTodos}
                        class={`
                    text-base bg-transparent rounded-lg
                    p-1 text-base flex flex-row
                    ${estilos.secundario}
                `}
                    >
                        {#if todos}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="green"
                                class="size-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                            </svg>
                        {/if}
                        {#if ninguno}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="size-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                            </svg>
                        {/if}
                        {#if algunos}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="red"
                                class="size-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                            </svg>
                        {/if}

                        <span class="mt-1"> Seleccionar todos </span>
                    </button>
                </div>

                {#each animalesrows as a}
                    <div
                        class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                    >
                        <div class="block p-4">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-medium">
                                    <button
                                        aria-label="fila"
                                        onclick={() => clickAnimal(a.id)}
                                        class={`
                                font-medium bg-transparent rounded-lg
                                px-3 py-3 text-base
                                ${selecthashmap[a.id] ? estilos.danger : estilos.primario}
                            `}
                                    >
                                        {#if selecthashmap[a.id]}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke-width="1.5"
                                                stroke="red"
                                                class="size-6"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                        {:else}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke-width="1.5"
                                                stroke="green"
                                                class="size-6"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                        {/if}
                                    </button>
                                    {a.caravana}
                                </h3>
                            </div>
                            <div class="grid grid-cols-2 gap-y-2">
                                <div class="flex items-start">
                                    <span class="font-semibold"
                                        >{getSexoNombre(a.sexo)}</span
                                    >
                                </div>
                                <div class="flex items-start">
                                    <span>Categoría:</span>
                                    <span class="font-semibold">
                                        {a.categoria}
                                    </span>
                                </div>
                                <div class="flex items-start">
                                    <span>Lote:</span>
                                    <span class="font-semibold">
                                        {a.expand
                                            ? a.expand.lote
                                                ? a.expand.lote.nombre
                                                : ""
                                            : ""}
                                    </span>
                                </div>
                                <div class="flex items-start">
                                    <span>Rodeo:</span>
                                    <span class="font-semibold">
                                        {a.expand
                                            ? a.expand.rodeo
                                                ? a.expand.rodeo.nombre
                                                : ""
                                            : ""}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {:else}
        <div class="flex items-center justify-center">
            <span class="loading loading-spinner text-success"></span>
        </div>
    {/if}
</Navbarr>
<dialog id="tratamientoMasivo" class="modal modal-middle rounded-xl">
    <div
        class="
            modal-box w-11/12 max-w-6xl
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
        <h3 class="text-lg font-bold">Tratamientos</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-1">
            <CustomDate
                etiqueta="Fecha"
                bind:fecha
                onchange={() => {
                    if (fecha == "") {
                        malfecha = true;
                        botonhabilitado = false;
                    } else {
                        malfecha = false;
                        if (!maltipo && tipotratamientoselect != "") {
                            botonhabilitado = true;
                        }
                    }
                }}
            />
            {#if malfecha}
                <div class="label">
                    <span class="label-text-alt text-red-500"
                        >Debe seleccionar la fecha del tratamiento</span
                    >
                </div>
            {/if}
            <div class="hidden">
                <label for="fechatrata" class="label">
                    <span class="label-text text-base">Fecha </span>
                </label>
                <label class="input-group">
                    <input
                        id="fechtrata"
                        type="date"
                        max={HOY}
                        class={`
                            input input-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2} 
                        `}
                        bind:value={fecha}
                        onchange={() => {
                            if (fecha == "") {
                                malfecha = true;
                                botonhabilitado = false;
                            } else {
                                malfecha = false;
                                if (!maltipo && tipotratamientoselect != "") {
                                    botonhabilitado = true;
                                }
                            }
                        }}
                    />
                    {#if malfecha}
                        <div class="label">
                            <span class="label-text-alt text-red-500"
                                >Debe seleccionar la fecha del tratamiento</span
                            >
                        </div>
                    {/if}
                </label>
            </div>
            <SelectFertil
                etiqueta="Tipo tratamiento"
                bind:value={tipotratamientoselect}
                onchange={() => {
                    if (tipotratamientoselect == "") {
                        maltipo = true;

                        botonhabilitado = false;
                    } else {
                        maltipo = false;
                        if (!malfecha && fecha != "") {
                            botonhabilitado = true;
                        }
                    }
                }}
                opciones = {tipotratamientos}
            />
            <div class="hidden">
                <label for="tipo" class="label">
                    <span class="label-text text-base">Tipo tratamiento</span>
                </label>
                <label class="input-group">
                    <select
                        class={`
                            select select-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2} 
                        `}
                        bind:value={tipotratamientoselect}
                        onchange={() => {
                            if (tipotratamientoselect == "") {
                                maltipo = true;

                                botonhabilitado = false;
                            } else {
                                maltipo = false;
                                if (!malfecha && fecha != "") {
                                    botonhabilitado = true;
                                }
                            }
                        }}
                    >
                        {#each tipotratamientos as t}
                            <option value={t.id}>{t.nombre}</option>
                        {/each}
                    </select>
                    <div class={`label ${maltipo ? "" : "hidden"}`}>
                        <span class="label-text-alt text-red-400"
                            >Debe seleccionar un tipo</span
                        >
                    </div>
                </label>
            </div>
            <div>
                <label for="obs" class="label">
                    <span class="label-text text-base">Observación </span>
                </label>
                <input
                    id="obs"
                    type="text"
                    class={`
                        input 
                        input-bordered 
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        w-full
                        ${estilos.bgdark2}
                    `}
                    bind:value={observaciongeneral}
                    oninput={inputObsGeneral}
                />
            </div>
        </div>
        <div class="block justify-items-center mx-1">
            {#each selectanimales as a, i}
                <div
                    class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                >
                    <div class="block p-4">
                        <div class="grid grid-cols-2 gap-y-2">
                            <div class="flex items-start col-span-2">
                                <span>Caravana:</span>
                                <span class="font-semibold">
                                    {shorterWord(a.caravana)}
                                </span>
                            </div>
                            <div class="flex items-start col-span-2">
                                <InfoAnimal animal={a} />
                            </div>
                            <div class="flex items-start col-span-2">
                                <input
                                    bind:value={
                                        selectanimales[i].observacionnuevo
                                    }
                                    placeholder="Observación"
                                    class={`
                                    h-12 border border-gray-300
                                    px-2 
                                    w-full
                                    rounded-md
                                    focus:outline-none focus:ring-2 
                                    focus:ring-green-500 
                                    focus:border-green-500
                                    ${estilos.bgdark2}
                                `}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
        <div class="modal-action justify-start">
            <form method="dialog">
                <button
                    class="btn btn-success text-white"
                    disabled={!botonhabilitado}
                    onclick={guardarTratamiento}>Crear tratamientos</button
                >
                <button class="btn btn-error text-white">Cancelar</button>
            </form>
        </div>
    </div>
</dialog>

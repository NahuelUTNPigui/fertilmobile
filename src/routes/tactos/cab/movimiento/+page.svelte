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
    import tipostacto from "$lib/stores/tipostacto";
    import {
        getEstadoNombre,
        getEstadoColor,
    } from "$lib/components/estadosutils/lib";
    import { getSexoNombre } from "$lib/stringutil/lib";
    import RadioButton from "$lib/components/RadioButton.svelte";
    import MultiSelect from "$lib/components/MultiSelect.svelte";
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
    //offline
    import Barrainternet from "$lib/components/internet/Barrainternet.svelte";
    import { getInternet, getOnlyInternet } from "$lib/stores/offline";
    import { openDB, resetTables } from "$lib/stores/sqlite/main";
    import { Network } from "@capacitor/network";
    import {
        getInternetSQL,
        setInternetSQL,
    } from "$lib/stores/sqlite/dbinternet";
    import {
        getComandosSQL,
        setComandosSQL,
        flushComandosSQL,
    } from "$lib/stores/sqlite/dbcomandos";
    import {
        getTotalSQL,
        setTotalSQL,
        setUltimoTotalSQL,
    } from "$lib/stores/sqlite/dbtotal";
    import {
        getUserOffline,
        setDefaultUserOffline,
    } from "$lib/stores/capacitor/offlineuser";
    import {
        getCabOffline,
        setDefaultCabOffline,
        updatePermisos,
    } from "$lib/stores/capacitor/offlinecab";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import {
        updateLocalTactosSQLUser,
        setTactosSQL,
        getTactosSQL,
        getRodeosSQL,
        getLotesSQL,
        getUpdateLocalRodeosLotesSQLUser,
        getLotesRodeosSQL,
        updateLocalRodeosSQL,
    } from "$lib/stores/sqlite/dbeventos";
    import {
        getAnimalesSQL,
        setAnimalesSQL,
        updateLocalAnimalesSQL,
        updateLocalAnimalesSQLUser,
        getUpdateLocalAnimalesSQLUser,
        getAnimalesCabSQL,
    } from "$lib/stores/sqlite/dbanimales";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import InfoAnimal from "$lib/components/InfoAnimal.svelte";

    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    //OFLINE
    let infotoast = $state(false);
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({ connected: false });
    let comandos = $state([]);
    let getlocal = $state(true);
    let getvelocidad = $state(0);
    let getactualizacion = $state(0);
    let getpermisos = $state("");
    let tactos = $state([]);
    let cargado = $state(false);
    let ruta = import.meta.env.VITE_RUTA;

    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let caber = createCaber();
    let cab = caber.cab;

    //Datos animales
    let animales = $state([]);
    let animalescab = $state([]);
    let animalesrows = $state([]);
    //Filtros
    let buscar = $state("");
    let lote = $state("");
    let rodeo = $state("");
    let categoria = $state("");
    let sexo = $state("H");
    let rodeoseleccion = $state([]);
    let loteseleccion = $state([]);
    let categoriaseleccion = $state([]);

    let defaultfiltro = {
        buscar: "",
        lote: "",
        rodeo: "",
        categoria: "",
        sexo: "H",
        rodeoseleccion: [],
        loteseleccion: [],
        categoriaseleccion: [],
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("tactosanimales", defaultfiltro);

    let lotes = $state([]);
    let rodeos = $state([]);
    let isOpenFilter = $state(false);

    //Seleccionados
    let selectanimales = $state([]);
    let selecthashmap = $state({});
    let todos = $state(false);
    let algunos = $state(false);
    let ninguno = $state(true);

    //movimiento
    let tipotactoselect = $state("");
    let fecha = $state("");
    let observaciongeneral = $state("");
    //validacion
    let malfecha = $state(false);
    let botonhabilitado = $state(false);

    function clickFilter() {
        isOpenFilter = !isOpenFilter;
    }
    function onchangeTipoTacto() {
        for (let i = 0; i < selectanimales.length; i++) {
            selectanimales[i].tipotacto = tipotactoselect;
        }
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
        animalesrows = animalescab;
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
            delete selecthashmap[id];
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
    async function getLotes() {
        const records = await pb.collection("lotes").getFullList({
            filter: `active = true && cab ~ '${cab.id}'`,
            sort: "nombre",
        });
        lotes = records;
        ordenarNombre(lotes);
    }
    async function getRodeos() {
        const records = await pb.collection("rodeos").getFullList({
            filter: `active = true && cab ~ '${cab.id}'`,
            sort: "nombre",
        });
        rodeos = records;
        //ordenarNombre(rodeos)
    }
    async function getAnimales() {
        const recordsa = await pb.collection("Animalestacto").getFullList({
            filter: `active=true && cab='${cab.id}' && sexo = 'H'`,
            expand: "rodeo,lote",
        });

        animales = recordsa;
        animales.sort((a1, a2) => (a1.caravana > a2.caravana ? 1 : -1));
        animalesrows = animales;
    }
    function openNewModal() {
        tipotactoselect = "tacto";
        if (ninguno) {
            Swal.fire("Error tacto", "No hay animales seleccionados", "error");
            return;
        }
        selectanimales = [];
        for (const [key, value] of Object.entries(selecthashmap)) {
            if (value != null) {
                selectanimales.push({
                    ...value,
                    estadonuevo: 0,
                    tipotacto: "tacto",
                    observacion: "",
                });
            }
        }
        tactoMasivo.showModal();
    }

    async function crearBulkTactos() {
        if (fecha == "") {
            Swal.fire("Error tactos", "Debe seleccionar una fecha", "error");
            return;
        }

        let bulktactos = [];
        let bulkcambios = [];
        let bulkhistoriales = [];
        for (let i = 0; i < selectanimales.length; i++) {
            let tactoanimal = selectanimales[i];

            let ft = tactoanimal.fechatacto;
            let fi = tactoanimal.fechains;
            let fs = tactoanimal.fechaser;
            let maximafecha = null;
            const valor1 = ft || "";
            const valor2 = fi || "";
            const valor3 = fs || "";

            // Comparar los strings
            if (valor1 >= valor2 && valor1 >= valor3) {
                maximafecha = ft;
            } else if (valor2 >= valor1 && valor2 >= valor3) {
                maximafecha = fi;
            } else {
                maximafecha = fs;
            }

            if (maximafecha == null || fecha > maximafecha) {
                let dataupdate = {
                    prenada: tactoanimal.estadonuevo,
                    id: tactoanimal.id,
                };
                bulkcambios.push(dataupdate);
                let datahistorial = {
                    animal: tactoanimal.id,
                    caravana: tactoanimal.caravana,
                    user: tactoanimal.user,
                    active: true,
                    delete: false,
                    fechanacimiento: tactoanimal.fechanacimiento,
                    sexo: tactoanimal.sexo,
                    peso: tactoanimal.peso,
                    lote: tactoanimal.lote,
                    rodeo: tactoanimal.rodeo,
                    categoria: tactoanimal.categoria,
                    prenada: tactoanimal.prenada,
                };
                bulkhistoriales.push(datahistorial);
            }

            let datatacto = {
                fecha: fecha + " 03:00:00",
                observacion: tactoanimal.observacion,
                animal: tactoanimal.id,
                categoria: tactoanimal.categoria,
                prenada: tactoanimal.estadonuevo,
                tipo: tactoanimal.tipotacto,
                nombreveterinario: "",
                cab: cab.id,
                active: true,
            };
            bulktactos.push(datatacto);
        }

        try {
            const batch = pb.createBatch();
            for (let i = 0; i < bulktactos.length; i++) {
                let bt = bulktactos[i];
                batch.collection("tactos").create(bt);
            }
            for (let i = 0; i < bulkcambios.length; i++) {
                let bc = bulkcambios[i];
                batch
                    .collection("animales")
                    .update(bc.id, { prenada: bc.prenada });
            }
            for (let i = 0; i < bulkhistoriales.length; i++) {
                let bh = bulkhistoriales[i];
                batch.collection("historialanimales").create(bh);
            }

            const result = await batch.send();
        } catch (err) {
            console.error(err);
        }

        await getAnimales();
        filterUpdate();
        fecha = "";
        botonhabilitado = false;
        malfecha = false;
        selecthashmap = {};
        selectanimales = [];
    }
    function actualizarDatos() {
        animales.sort((a1, a2) =>
            a1.caravana.toLocaleLowerCase() > a2.caravana.toLocaleLowerCase()
                ? 1
                : -1,
        );
        onChangeAnimales();
        filterUpdate();
    }
    function onChangeAnimales() {
        animalescab = animales.filter((a) => a.cab == caboff.id && a.active);
    }
    async function crearTactosOffline() {
        if (fecha == "") {
            Swal.fire("Error tactos", "Debe seleccionar una fecha", "error");
            return;
        }

        let errores = false;
        let tactoerrores = [];
        //inicio movimiento
        for (let i = 0; i < selectanimales.length; i++) {
            let tactoanimal = selectanimales[i];
            let idprov = "nuevo_tacto_" + generarIDAleatorio();
            try {
                let dataupdate = {
                    prenada: tactoanimal.estadonuevo,
                };
                let datatacto = {
                    fecha: fecha + " 03:00:00",
                    observacion: tactoanimal.observacion,
                    animal: tactoanimal.id,
                    categoria: tactoanimal.categoria,
                    prenada: tactoanimal.estadonuevo,
                    tipo: tactoanimal.tipotacto,
                    nombreveterinario: "",
                    cab: caboff.id,
                    active: true,
                    id: idprov,
                };
                let aidx = animales.findIndex((an) => an.id == tactoanimal.id);
                if (aidx != -1) {
                    animales[aidx] = {
                        ...animales[aidx],
                        ...dataupdate,
                    };
                    datatacto.expand = animales[aidx];
                }
                let nanimal =
                    aidx != -1
                        ? animales[aidx].id.split("_").length > 1
                        : false;
                let comando = {
                    tipo: "add",
                    coleccion: "tactos",
                    data: { ...datatacto },
                    hora: Date.now(),
                    prioridad: 3,
                    idprov,
                    camposprov: `${nanimal ? "animal" : ""}`,
                    show: { ...datatacto },
                    motivo: "Nuevo tacto",
                };
                comandos.push(comando);
                let comandoani = {
                    tipo: "update",
                    coleccion: "animales",
                    data: { ...dataupdate },
                    hora: Date.now(),
                    prioridad: 3,
                    idprov: animales[aidx].id,
                    camposprov: ``,
                    show: { ...animales[aidx] },
                    motivo: "Editar animal",
                };
                comandos.push(comandoani);
                datatacto = {
                    ...datatacto,
                    expand: {
                        animal: {
                            id: tactoanimal.id,
                            caravana: tactoanimal.caravana,
                        },
                    },
                };
                tactos.push(datatacto);
            } catch (err) {
                tactoerrores.push(tactoanimal.id);
                console.error(err);
                errores = true;
            }
        }
        //fin movimiento
        if (errores) {
            Swal.fire(
                "Error tactos",
                "Hubo algun error en algun tacto",
                "error",
            );
        } else {
            Swal.fire(
                "Éxito tactos",
                "Se lograron registrar todos los tactos",
                "success",
            );
        }
        await setAnimalesSQL(db, animales);
        await setTactosSQL(db, tactos);
        await setComandosSQL(db, comandos);
        actualizarDatos();
        fecha = "";
        botonhabilitado = false;
        malfecha = false;
        for (let i = 0; i < selectanimales.length; i++) {
            let tactoanimal = selectanimales[i];
            let i_error = tactoerrores.findIndex(
                (pid) => pid == tactoanimal.id,
            );
            if (i_error == -1) {
                delete selecthashmap[tactoanimal.id];
            }
        }
        selectanimales = [];
    }
    async function crearTactosOnline() {
        if (fecha == "") {
            Swal.fire("Error tactos", "Debe seleccionar una fecha", "error");
            return;
        }
        let errores = false;
        let tactoerrores = [];

        for (let i = 0; i < selectanimales.length; i++) {
            let tactoanimal = selectanimales[i];
            try {
                //ver el tema de las fechas
                let dataupdate = {
                    prenada: tactoanimal.estadonuevo,
                };
                let datatacto = {
                    fecha: fecha + " 03:00:00",
                    observacion: tactoanimal.observacion,
                    animal: tactoanimal.id,
                    categoria: tactoanimal.categoria,
                    prenada: tactoanimal.estadonuevo,
                    tipo: tactoanimal.tipotacto,
                    nombreveterinario: "",
                    cab: caboff.id,
                    active: true,
                };

                await guardarHistorial(pb, selectanimales[i].id);
                let r = await pb
                    .collection("animales")
                    .update(selectanimales[i].id, dataupdate);
                //debo guardar el record en el sqlite
                let record = await pb.collection("tactos").create(datatacto);
                let aidx = animales.findIndex((an) => an.id == tactoanimal.id);
                if (aidx != -1) {
                    animales[aidx] = {
                        ...animales[aidx],
                        ...dataupdate,
                    };
                }
                record = {
                    ...record,
                    expand: {
                        animal: {
                            id: tactoanimal.id,
                            caravana: tactoanimal.caravana,
                        },
                    },
                };
                tactos.push(record);
            } catch (err) {
                tactoerrores.push(tactoanimal.id);
                console.error(err);
                errores = true;
                if (modedebug) {
                    loger.addTextError(
                        "Hubo un error en animal: " + tactoanimal.caravana,
                    );
                }
            }
        }
        await setTactosSQL(db, tactos);

        if (errores) {
            Swal.fire(
                "Error tactos",
                "Hubo algun error en algun tacto",
                "error",
            );
        } else {
            Swal.fire(
                "Éxito tactos",
                "Se lograron registrar todos los tactos",
                "success",
            );
        }

        //Prefiero guardarlos en animales
        //animales = await updateLocalAnimalesSQL(db,pb,caboff.id)
        await setAnimalesSQL(db, animales);
        actualizarDatos();

        fecha = "";
        botonhabilitado = false;
        malfecha = false;
        for (let i = 0; i < selectanimales.length; i++) {
            let tactoanimal = selectanimales[i];
            let i_error = tactoerrores.findIndex(
                (pid) => pid == tactoanimal.id,
            );
            if (i_error == -1) {
                delete selecthashmap[tactoanimal.id];
            }
        }
        selectanimales = [];
    }
    async function crearTactos() {
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
            await crearTactosOnline();
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
            await crearTactosOffline();
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
    function inputObsGeneral() {
        for (let i = 0; i < selectanimales.length; i++) {
            selectanimales[i].observacion = observaciongeneral;
        }
    }

    async function onMountOriginal() {
        await getAnimales();
        await getRodeos();
        await getLotes();
    }

    async function getLocalSQL() {
        getlocal = true;
        let restactos = await getTactosSQL(db);
        tactos = restactos.lista;
        let resanimales = await getAnimalesSQL(db);
        animales = resanimales.lista;
        let lotesrodeos = await getLotesRodeosSQL(db, caboff.id);
        lotes = lotesrodeos.lotes;
        rodeos = lotesrodeos.rodeos;

        actualizarDatos();
        cargado = true;
    }
    async function updateLocalSQL() {
        tactos = await updateLocalTactosSQLUser(db, pb, usuarioid);
        animales = await getUpdateLocalAnimalesSQLUser(
            db,
            pb,
            usuarioid,
            caboff.id,
        );
        let lotesrodeos = await getUpdateLocalRodeosLotesSQLUser(
            db,
            pb,
            usuarioid,
            caboff.id,
        );
        lotes = lotesrodeos.lotes;
        rodeos = lotesrodeos.rodeos;

        animales.sort((a1, a2) => (a1.caravana > a2.caravana ? 1 : -1));
        filterUpdate();
        cargado = true;
    }
    async function oldUpdate() {
        if (lastinter.internet == 0) {
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
        await setInternetSQL(db, 1, Date.now());
    }
    async function getUpdateSQL() {
        //Reviso el internet
        let lastinter = await getInternetSQL(db);
        let rescom = await getComandosSQL(db);
        comandos = rescom.lista;
        let ahora = Date.now();
        let antes = lastinter.ultimo;
        if (coninternet.connected) {
        } else {
            await getLocalSQL();
        }
    }
    async function getDataSQL() {
        proxyfiltros = proxy.load();
        setFilters();
        db = await openDB();
        await getLocalSQL();
        let rescom = await getComandosSQL(db);
        comandos = rescom.lista;
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
            <div>
                <span>
                    {coninternet.connected ? "COn internet" : "sin internet"}
                </span>
            </div>
            <div>
                <span>
                    get local{getlocal}
                </span>
            </div>
        </div>
    {/if}
    <div class="grid grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <button
                class="bg-transparent border-none flex"
                aria-label="volver"
                onclick={() => goto("/tactos/cab")}
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
                <h1 class="text-2xl">Tactos</h1>
            </button>
        </div>
        <div class="flex col-span-2 gap-1 justify-end">
            <button
                class={`btn btn-primary rounded-lg ${estilos.btntext}`}
                data-theme="forest"
                onclick={() => openNewModal()}
            >
                <span class="text-xl">{capitalize("nuevo")}</span>
            </button>
            <button
                onclick={() => goto("/tactos/cab")}
                class={`
                    hidden
                    bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                    ${estilos.btnsecondary}
                    rounded-full
                    px-4 pt-2 pb-3
                `}
                aria-label="volver"
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
                            <th class="px-1 py-0 m-0">
                                <button
                                    aria-label="Todos"
                                    onclick={clickTodos}
                                    class={`
                                text-base bg-transparent rounded-lg
                                p-1 text-base
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
                            <th class="text-base mx-1 px-1">Estado</th>
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
                                <td class="text-base mx-1 px-1"
                                    >{shorterWord(a.caravana)}</td
                                >
                                <td class="text-base mx-1 px-1"
                                    >{getEstadoNombre(a.prenada)}</td
                                >
                                <td class="text-base mx-1 px-1"
                                    >{a.categoria}</td
                                >
                                <td class="text-base mx-1 px-1">{a.peso}</td>
                                <td class="text-base mx-1 px-1"
                                    >{a.expand?.rodeo?.nombre || ""}</td
                                >
                                <td class="text-base mx-1 px-1"
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
                                    {shorterWord(a.caravana)}
                                </h3>
                                {#if a.sexo == "H" && a.prenada != 1}
                                    <div
                                        class={`badge badge-outline badge-${getEstadoColor(a.prenada)}`}
                                    >
                                        {getEstadoNombre(a.prenada)}
                                    </div>
                                {/if}
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
<dialog id="tactoMasivo" class="modal modal-middle rounded-xl">
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
        <h3 class="text-lg font-bold">Tactos múltiples</h3>
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
                        botonhabilitado = true;
                    }
                }}
            />
            {#if malfecha}
                <div class="label">
                    <span class="label-text-alt text-red-500"
                        >Debe seleccionar la fecha del tacto</span
                    >
                </div>
            {/if}
            <div class="hidden">
                <label for="fechatacto" class="label">
                    <span class="label-text text-base">Fecha </span>
                </label>
                <label class="input-group">
                    <input
                        id="fechatacto"
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
                                botonhabilitado = true;
                            }
                        }}
                    />
                    {#if malfecha}
                        <div class="label">
                            <span class="label-text-alt text-red-500"
                                >Debe seleccionar la fecha del tacto</span
                            >
                        </div>
                    {/if}
                </label>
            </div>
            <SelectFertil
                etiqueta = "Tipo"
                bind:value={tipotactoselect}
                onchange={onchangeTipoTacto}
                opciones={tipostacto}
            />
            <div class="hidden">
                <label for="tipotacto" class="tracking-wide label">
                    <span class="label-text text-base">Tipo</span>
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
                        bind:value={tipotactoselect}
                        onchange={onchangeTipoTacto}
                    >
                        {#each tipostacto as s}
                            <option value={s.id}>{s.nombre}</option>
                        {/each}
                    </select>
                </label>
            </div>
            <div>
                <label for="obs" class="label">
                    <span class="label-text text-base">Observación </span>
                </label>
                <input
                    id="observacion"
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
                                <span>Estado actual:</span>
                                <span class="font-semibold">
                                    {getEstadoNombre(a.prenada)}
                                </span>
                            </div>
                            <div class="flex items-start col-span-2">
                                <RadioButton
                                    class="m-1 my-3"
                                    bind:option={selectanimales[i].estadonuevo}
                                    deshabilitado={false}
                                />
                            </div>
                            <div class="flex items-start col-span-2">
                                <input
                                    bind:value={selectanimales[i].observacion}
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
                    onclick={crearTactos}>Crear Tactos</button
                >
                <button class="btn btn-error text-white">Cancelar</button>
            </form>
        </div>
    </div>
</dialog>

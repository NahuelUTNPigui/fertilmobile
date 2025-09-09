<script>
    //Hay un error en alguna propiedad de los componentes
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
    import { isEmpty, addDays } from "$lib/stringutil/lib";
    import {
        getEstadoNombre,
        getEstadoColor,
    } from "$lib/components/estadosutils/lib";
    import { getSexoNombre } from "$lib/stringutil/lib";
    import MultipleToros from "$lib/components/MultipleToros.svelte";
    import PredictSelect from "$lib/components/PredictSelect.svelte";
    import MultiSelect from "$lib/components/MultiSelect.svelte";
    import { shorterWord } from "$lib/stringutil/lib";
    //FILTROS
    import { createStorageProxy } from "$lib/filtros/filtros";
    import Limpiar from "$lib/filtros/Limpiar.svelte";
    //Actualizacion
    import {
        actualizacion,
        deboActualizar,
    } from "$lib/stores/offline/actualizar";
    import { customoffliner } from "$lib/stores/offline/custom.svelte";
    import { intermitenter } from "$lib/stores/offline/intermitencia.svelte";
    import { velocidader } from "$lib/stores/offline/velocidad.svelte";
    //permisos
    import { verificarNivel, getPermisosList } from "$lib/permisosutil/lib";
    import { updatePermisos } from "$lib/stores/capacitor/offlinecab";
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
    } from "$lib/stores/capacitor/offlinecab";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import {
        updateLocalServiciosSQLUser,
        updateLocalInseminacionesSQLUser,
        setServiciosSQL,
        getServiciosSQL,
        getInseminacionesSQL,
        setInseminacionesSQL,
        getLotesSQL,
        getRodeosSQL,
        getLotesRodeosSQL,
        updateLocalLotesSQLUser,
        updateLocalRodeosSQLUser,
        getUpdateLocalRodeosLotesSQLUser,
        setUltimoRodeosLotesSQL,
    } from "$lib/stores/sqlite/dbeventos";
    import {
        addNewAnimalSQL,
        getAnimalesSQL,
        setAnimalesSQL,
        updateLocalAnimalesSQL,
        updateLocalAnimalesSQLUser,
        updateLocalHistorialAnimalesSQLUser,
        getUltimoAnimalesSQL,
        setUltimoAnimalesSQL,
    } from "$lib/stores/sqlite/dbanimales";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";
    

    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    //OFLINE
    let infotoast = $state(false);
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({ connected: false });
    let ultimo_animal = $state({});
    let getlocal = $state(false);
    let getvelocidad = $state(0);
    let getactualizacion = $state(0);
    let getpermisos = $state("");
    let comandos = $state([]);
    let ruta = import.meta.env.VITE_RUTA;

    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let esinseminacion = $state(false);
    let esservicio = $state(false);
    let caber = createCaber();
    let cab = caber.cab;
    let cargado = $state(false);
    //Datos animales
    let animales = $state([]);
    let animalescab = $state([]);
    let animalesrows = $state([]);
    let madres = $state([]);
    let padres = $state([]);
    let listapadres = $state([]);
    let cargadoanimales = $state(false);
    //Filtros
    let buscar = $state("");
    let lote = $state("");
    let rodeo = $state("");
    let categoria = $state("");
    let sexo = $state("H");
    let estado = $state("");
    let rodeoseleccion = $state([]);
    let loteseleccion = $state([]);
    let categoriaseleccion = $state([]);

    let defaultfiltro = {
        buscar: "",
        lote: "",
        rodeo: "",
        categoria: "",
        sexo: "",
        estado: "",
        rodeoseleccion: [],
        loteseleccion: [],
        categoriaseleccion: [],
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("serviciosanimales", defaultfiltro);

    let lotes = $state([]);
    let rodeos = $state([]);
    let isOpenFilter = $state(false);

    //Seleccionados
    let selectanimales = $state([]);
    let selecthashmap = $state({});
    let todos = $state(false);
    let algunos = $state(false);
    let ninguno = $state(true);
    //General
    let observaciongeneral = $state("");
    //Datos servicios
    let padreslist = $state([]);
    let padresserv = $state("");
    let pajuelasserv = $state("");
    //Seria la fecha del parto
    let fechaparto = $state("");
    let fechadesdeserv = $state("");
    let fechahastaserv = $state("");
    let madre = $state("");
    let observacion = $state("");
    //validacion
    let malfechadese = $state(false);
    let malpadre = $state(false);
    let botonhabilitado = $state(false);
    //Datos inseminacion
    let fechainseminacion = $state("");
    let pajuela = $state("");
    let padre = $state("");
    let cadenapadre = $state("");
    //validacion
    let malfecha = $state(false);

    //Servicios
    let servicios = $state([]);
    //Insminaciones
    let inseminaciones = $state([]);
    $effect(() => {
        if (padre == "") {
            for (let i = 0; i < selectanimales.length; i++) {
                selectanimales[i].padre = "";
            }
        }
    });
    function clickFilter() {
        isOpenFilter = !isOpenFilter;
    }
    function limpiar() {
        //Cuando filtro debo reiniciar la seleccion?
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
        estado = proxyfiltros.estado;
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
        proxyfiltros.estado = estado;
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
        animalesrows = madres;
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
        if (estado != "") {
            animalesrows = animalesrows.filter((a) => a.prenada == estado);
        }
    }
    function ordenarNombre(lista) {
        lista.sort((r1, r2) =>
            r1.nombre.toLocaleLowerCase() > r2.nombre.toLocaleLowerCase()
                ? 1
                : -1,
        );
    }
    function inputObsGeneral() {
        for (let i = 0; i < selectanimales.length; i++) {
            selectanimales[i].observacion = observaciongeneral;
        }
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
            let a = animalesrows.filter((an) => an.id == id)[0];

            selecthashmap[id] = {
                ...a,
                observacion: "",
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
                    observacion: "",
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
            filter: `active=true && cab='${cab.id}'`,
            expand: "rodeo,lote,cab",
        });

        animales = recordsa;
        animales.sort((a1, a2) => (a1.caravana > a2.caravana ? 1 : -1));
        madres = animales.filter((a) => a.sexo == "H");
        padres = animales.filter((a) => a.sexo == "M");
        cargadoanimales = true;
        listapadres = padres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });
        animalesrows = madres;
    }
    function openNewModal() {
        esservicio = true;
        if (ninguno) {
            Swal.fire(
                "Error servicio",
                "No hay animales seleccionados",
                "error",
            );
            esservicio = false;
            return;
        }

        selectanimales = [];
        for (const [key, value] of Object.entries(selecthashmap)) {
            selectanimales.push({
                ...value,
            });
        }
        servicioMasivo.showModal();
    }
    function openNewModalInseminacion() {
        esinseminacion = true;
        if (ninguno) {
            Swal.fire(
                "Error inseminación",
                "No hay animales seleccionados",
                "error",
            );
            esinseminacion = false;
            return;
        }
        selectanimales = [];
        for (const [key, value] of Object.entries(selecthashmap)) {
            if (value != null) {
                selectanimales.push({
                    ...value,
                    padre: "",
                    pajuela: "",
                    observacion: "",
                });
            }
        }
        pajuela = "";
        fechainseminacion = "";
        inseminacionMasiva.showModal();
    }

    function seleccionarPadre() {
        validarBoton();
        if (padreslist.length == 0) {
            malpadre = true;
        } else {
            malpadre = false;
        }
    }
    function input(campo) {
        validarBoton();
        if (esservicio) {
            if (campo == "DESDE") {
                if (fechadesdeserv == "") {
                    malfechadese = true;
                } else {
                    malfechadese = false;
                    fechaparto = addDays(fechadesdeserv, 280)
                        .toISOString()
                        .split("T")[0];
                }
            }
        }
        if (esinseminacion) {
            if (campo == "FECHA") {
                if (isEmpty(fechainseminacion)) {
                    malfecha = true;
                } else {
                    malfecha = false;
                    fechaparto = addDays(fechainseminacion, 280)
                        .toISOString()
                        .split("T")[0];
                }
            }
            if (campo == "PAJUELA") {
                if (isEmpty(pajuela)) {
                    malpadre = true;
                } else {
                    malfecha = false;
                    for (let i = 0; i < selectanimales.length; i++) {
                        selectanimales[i].pajuela = pajuela;
                    }
                }
            }
        }
    }
    function onInput(campo) {
        input(campo);
    }
    async function guardarBulk() {
        if (esservicio) {
            if (listapadres.length == 0) {
                Swal.fire("Sin padres", "No hay padres seleccionados", "error");
            }
            let bulksers = [];
            let bulkcambios = [];
            for (let i = 0; i < selectanimales.length; i++) {
                let servicio = selectanimales[i];
                let dataser = {
                    fechadesde: fechadesdeserv + " 03:00:00",
                    fechaparto: fechaparto + " 03:00:00",
                    observacion: servicio.observacion,
                    madre: servicio.id,
                    padres: padreslist.join(),
                    active: true,
                    cab: cab.id,
                };
                if (fechahastaserv != "") {
                    dataser.fechahasta = fechahastaserv + " 03:00:00";
                }
                bulksers.push(dataser);
                let ft = servicio.fechatacto;
                let fi = servicio.fechains;
                let fs = servicio.fechaser;
                let maximafecha = null;
                const valor1 = ft || "";
                const valor2 = fi || "";
                const valor3 = fs || "";
                if (valor1 >= valor2 && valor1 >= valor3) {
                    maximafecha = ft;
                } else if (valor2 >= valor1 && valor2 >= valor3) {
                    maximafecha = fi;
                } else {
                    maximafecha = fs;
                }
                if (maximafecha == null || fechadesdeserv > maximafecha) {
                    let dataupdate = {
                        prenada: 3,
                        id: servicio.id,
                    };
                    bulkcambios.push(dataupdate);
                    let datahistorial = {
                        animal: servicio.id,
                        caravana: servicio.caravana,
                        user: servicio.user,
                        active: true,
                        delete: false,
                        fechanacimiento: servicio.fechanacimiento,
                        sexo: servicio.sexo,
                        peso: servicio.peso,
                        lote: servicio.lote,
                        rodeo: servicio.rodeo,
                        categoria: servicio.categoria,
                        prenada: servicio.prenada,
                    };
                    bulkhistoriales.push(datahistorial);
                }
            }
            try {
                const batch = pb.createBatch();
                for (let i = 0; i < bulksers.length; i++) {
                    let bs = bulksers[i];
                    batch.collection("servicios").create(bs);
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
            selectanimales = [];
            selecthashmap = {};
            fechadesdeserv = "";
            fechahastaserv = "";
            padreslist = [];
            padresserv = "";
            esservicio = false;
            servicioMasivo.close();
        }
        if (esinseminacion) {
            if (fechainseminacion == "") {
                Swal.fire(
                    "Error inseminaciones",
                    "Debe seleccionar una fecha",
                    "error",
                );
                esinseminacion = false;
                return;
            }
            let bulkins = [];
            let bulkcambios = [];
            let bulkhistoriales = [];
            for (let i = 0; i < selectanimales.length; i++) {
                let inseminacion = selectanimales[i];
                let data = {
                    cab: cab.id,
                    animal: inseminacion.id,
                    fechaparto: fechaparto + " 03:00:00",
                    fechainseminacion: fechainseminacion + " 03:00:00",
                    active: true,
                    padre: inseminacion.padre,
                    pajuela: inseminacion.pajuela,
                    categoria: inseminacion.categoria,
                    observacion: inseminacion.observacion,
                };
                bulkins.push(data);
                let ft = servicio.fechatacto;
                let fi = servicio.fechains;
                let fs = servicio.fechaser;
                let maximafecha = null;
                const valor1 = ft || "";
                const valor2 = fi || "";
                const valor3 = fs || "";
                if (valor1 >= valor2 && valor1 >= valor3) {
                    maximafecha = ft;
                } else if (valor2 >= valor1 && valor2 >= valor3) {
                    maximafecha = fi;
                } else {
                    maximafecha = fs;
                }
                if (maximafecha == null || fechainseminacion > maximafecha) {
                    let dataupdate = {
                        prenada: 3,
                        id: tactoanimal.id,
                    };
                    bulkcambios.push(dataupdate);
                    let datahistorial = {
                        animal: inseminacion.id,
                        caravana: inseminacion.caravana,
                        user: inseminacion.user,
                        active: true,
                        delete: false,
                        fechanacimiento: inseminacion.fechanacimiento,
                        sexo: inseminacion.sexo,
                        peso: inseminacion.peso,
                        lote: inseminacion.lote,
                        rodeo: inseminacion.rodeo,
                        categoria: inseminacion.categoria,
                        prenada: inseminacion.prenada,
                    };
                    bulkhistoriales.push(datahistorial);
                }
            }
            try {
                const batch = pb.createBatch();
                for (let i = 0; i < bulkins.length; i++) {
                    let bi = bulkins[i];
                    batch.collection("inseminaciones").create(bi);
                }
                for (let i = 0; i < bulkhistoriales.length; i++) {
                    let bh = bulkhistoriales[i];
                    batch.collection("historialanimales").create(bh);
                }
                for (let i = 0; i < bulkcambios.length; i++) {
                    let bc = bulkcambios[i];
                    batch
                        .collection("animales")
                        .update(bc.id, { prenada: bc.prenada });
                }

                const result = await batch.send();
            } catch (err) {
                console.error(err);
            }
            await getAnimales();
            fechainseminacion = "";
            fechaparto = "";
            pajuela = "";
            padre = "";
            botonhabilitado = false;
            malfecha = false;
            malpadre = false;
            selecthashmap = {};
            selectanimales = [];
            esinseminacion = false;
        }
    }
    async function guardarServicioOnline() {
        let errores = false;
        let serverrores = [];
        for (let i = 0; i < selectanimales.length; i++) {
            let servicio = selectanimales[i];
            try {
                let dataser = {
                    fechadesde: fechadesdeserv + " 03:00:00",
                    fechaparto: fechaparto + " 03:00:00",
                    observacion: servicio.observacion,
                    madre: servicio.id,
                    padres: padreslist.join(),
                    active: true,
                    cab: caboff.id,
                };

                if (fechahastaserv != "") {
                    dataser.fechahasta = fechahastaserv + " 03:00:00";
                }
                let record = await pb.collection("servicios").create(dataser);
                record = {
                    ...record,
                    expand: {
                        madre: {
                            id: servicio.id,
                            caravana: servicio.caravana,
                        },
                    },
                };
                servicios.push(record);

                //aca debo guardar el servicio
                //await guardarHistorial(pb,servicio.id)
                //await pb.collection("animales").update(servicio.id,{prenada:3})
                //animales = await updateLocalAnimalesSQL(db,pb,caboff.id)
            } catch (err) {
                serverrores.push(servicio.id);
                console.error(err);
                errores = true;
            }
        }
        await setServiciosSQL(db, servicios);
        if (errores) {
            Swal.fire(
                "Error servicios",
                "Hubo algun error en algun servico",
                "error",
            );
        } else {
            Swal.fire(
                "Éxito servicios",
                "Se lograron registrar todos los servicios",
                "success",
            );
        }
        for (let i = 0; i < selectanimales.length; i++) {
            let servicio = selectanimales[i];
            let i_error = serverrores.findIndex((pid) => pid == servicio.id);
            if (i_error == -1) {
                delete selecthashmap[servicio.id];
            }
        }
    }
    async function guardarServicioOffline() {
        let errores = false;
        //let resservicios = await getServiciosSQL(db)
        //let servicios = resservicios.lista
        let serverrores = [];
        for (let i = 0; i < selectanimales.length; i++) {
            let idprov = "nuevo_servicio_" + generarIDAleatorio();
            let servicio = selectanimales[i];
            try {
                //si necesito expand la madre y los padres
                let dataser = {
                    fechadesde: fechadesdeserv + " 03:00:00",
                    fechaparto: fechaparto + " 03:00:00",
                    observacion: servicio.observacion,
                    madre: servicio.id,
                    padres: padreslist.join(),
                    active: true,
                    cab: caboff.id,
                    id: idprov,
                };

                if (fechahastaserv != "") {
                    dataser.fechahasta = fechahastaserv + " 03:00:00";
                }
                let nmadre = dataser.madre.split("_").length > 1;
                let npadres = dataser.padres.split("_").length > 1;
                let comando = {
                    tipo: "add",
                    coleccion: "servicios",
                    data: { ...dataser },
                    hora: Date.now(),
                    prioridad: 3,
                    idprov,
                    camposprov: `${nmadre && npadres ? "madre,padres" : nmadre ? "madre" : npadres ? "padres" : ""}`,
                };
                comandos.push(comando);
                dataser = {
                    ...dataser,
                    expand: {
                        madre: {
                            caravana: servicio.caravana,
                            id: servicio.id,
                        },
                    },
                };
                servicios.push(dataser);
            } catch (err) {
                serverrores.push(servicio.id);
                console.error(err);
                errores = true;
            }
        }
        if (errores) {
            Swal.fire(
                "Error servicios",
                "Hubo algun error en algun servico",
                "error",
            );
        } else {
            Swal.fire(
                "Éxito servicios",
                "Se lograron registrar todos los servicios",
                "success",
            );
        }
        for (let i = 0; i < selectanimales.length; i++) {
            let servicio = selectanimales[i];
            let i_error = serverrores.findIndex((pid) => pid == servicio.id);
            if (i_error == -1) {
                delete selecthashmap[servicio.id];
            }
        }
        await setServiciosSQL(db, servicios);
        await setComandosSQL(db, comandos);
    }
    async function guardarInseminacionOnline() {
        let errores = false;
        let erroresins = [];
        for (let i = 0; i < selectanimales.length; i++) {
            let inseminacion = selectanimales[i];
            let data = {
                cab: caboff.id,
                animal: inseminacion.id,
                fechaparto: fechaparto + " 03:00:00",
                fechainseminacion: fechainseminacion + " 03:00:00",
                active: true,
                padre: inseminacion.padre,
                pajuela: inseminacion.pajuela,
                categoria: inseminacion.categoria,
                observacion: inseminacion.observacion,
            };
            try {
                let record = await pb.collection("inseminacion").create(data);
                record = {
                    ...record,
                    expand: {
                        animal: {
                            id: inseminacion.id,
                            caravana: inseminacion.caravana,
                        },
                    },
                };
                inseminaciones.push(record);
                //await guardarHistorial(pb,inseminacion.id)
                //await pb.collection('animales').update(inseminacion.id, {prenada:3});
                //animales = await updateLocalAnimalesSQL(db,pb,caboff.id)
            } catch (err) {
                erroresins.push(inseminacion.id);
                console.error(err);
            }
        }
        if (errores) {
            Swal.fire(
                "Error inseminaciones",
                "Hubo algun error en alguna inseminación",
                "error",
            );
        } else {
            Swal.fire(
                "Éxito inseminaciones",
                "Se lograron registrar todas las inseminaciones",
                "success",
            );
        }

        for (let i = 0; i < selectanimales.length; i++) {
            let inseminacion = selectanimales[i];
            let i_error = erroresins.findIndex((pid) => pid == inseminacion.id);
            if (i_error == -1) {
                delete selecthashmap[inseminacion.id];
            }
        }
        await setInseminacionesSQL(db, inseminaciones);
    }
    async function guardarInseminacionOffline() {
        let resinseminaciones = await getInseminacionesSQL(db);
        let inseminaciones = resinseminaciones.lista;
        let errores = false;
        let erroresins = [];
        for (let i = 0; i < selectanimales.length; i++) {
            let idprov = "nuevo_ins_" + generarIDAleatorio();
            let inseminacion = selectanimales[i];
            //Agregar los expand
            let data = {
                cab: caboff.id,
                animal: inseminacion.id,
                fechaparto: fechaparto + " 03:00:00",
                fechainseminacion: fechainseminacion + " 03:00:00",
                active: true,
                padre: inseminacion.padre,
                pajuela: inseminacion.pajuela,
                categoria: inseminacion.categoria,
                observacion: inseminacion.observacion,
                id: idprov,
            };
            try {
                let nmadre = data.animal.split("_").length > 1;
                let npadre = data.padre.split("_").length > 1;
                let comando = {
                    tipo: "add",
                    coleccion: "inseminacion",
                    data: { ...data },
                    hora: Date.now(),
                    prioridad: 3,
                    idprov,
                    camposprov: `${nmadre && npadre ? "animal,padre" : nmadre ? "animal" : npadre ? "padre" : ""}`,
                };
                comandos.push(comando);
                data = {
                    ...data,
                    expand: {
                        animal: {
                            id: inseminacion.id,
                            caravana: inseminacion.caravana,
                        },
                    },
                };
                inseminaciones.push(data);
            } catch (err) {
                erroresins.push(inseminacion.id);
                console.error(err);
            }
        }
        if (errores) {
            Swal.fire(
                "Error inseminaciones",
                "Hubo algun error en alguna inseminación",
                "error",
            );
        } else {
            Swal.fire(
                "Éxito inseminaciones",
                "Se lograron registrar todas las inseminaciones",
                "success",
            );
        }
        for (let i = 0; i < selectanimales.length; i++) {
            let inseminacion = selectanimales[i];
            let i_error = erroresins.findIndex((pid) => pid == inseminacion.id);
            if (i_error == -1) {
                delete selecthashmap[inseminacion.id];
            }
        }
        await setInseminacionesSQL(db, inseminaciones);
        await setComandosSQL(db, comandos);
    }
    async function guardarOnline() {
        caboff = await updatePermisos(pb, usuarioid);
        let listapermisos = getPermisosList(caboff.permisos);
        getpermisos = caboff.permisos;
        if (!listapermisos[4]) {
            Swal.fire(
                "Error permisos",
                "No tienes permisos para los eventos",
                "error",
            );
            return;
        }
        if (esservicio) {
            if (listapadres.length == 0) {
                Swal.fire("Sin padres", "No hay padres seleccionados", "error");
            }
            await guardarServicioOnline();
            selectanimales = [];
            fechadesdeserv = "";
            fechahastaserv = "";
            padreslist = [];
            padresserv = "";
            esservicio = false;
            observaciongeneral = "";
            servicioMasivo.close();
        }
        if (esinseminacion) {
            if (fechainseminacion == "") {
                Swal.fire(
                    "Error inseminaciones",
                    "Debe seleccionar una fecha",
                    "error",
                );
                esinseminacion = false;
                return;
            }
            await guardarInseminacionOnline();
            fechainseminacion = "";
            fechaparto = "";
            pajuela = "";
            padre = "";
            observaciongeneral = "";

            botonhabilitado = false;
            malfecha = false;
            malpadre = false;
            selectanimales = [];
            esinseminacion = false;
        }
    }
    async function guardarOffline() {
        if (esservicio) {
            if (listapadres.length == 0) {
                Swal.fire("Sin padres", "No hay padres seleccionados", "error");
            }
            await guardarServicioOffline();
            selectanimales = [];
            fechadesdeserv = "";
            fechahastaserv = "";
            padreslist = [];
            padresserv = "";
            esservicio = false;
            servicioMasivo.close();
        }
        if (esinseminacion) {
            if (fechainseminacion == "") {
                Swal.fire(
                    "Error inseminaciones",
                    "Debe seleccionar una fecha",
                    "error",
                );
                esinseminacion = false;
                return;
            }
            await guardarInseminacionOffline();
            fechainseminacion = "";
            fechaparto = "";
            pajuela = "";
            padre = "";
            botonhabilitado = false;
            malfecha = false;
            malpadre = false;
            selectanimales = [];
            esinseminacion = false;
        }
    }
    async function guardar() {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        let isOnline = await getOnlyInternet();
        intermitenter.addIntermitente(isOnline);
        if (coninternet.connected) {
            await guardarOnline();
            if(Object.keys(selecthashmap).length>0){
                todos =false
                algunos = true
                ninguno = false
            }
            else{
                todos =false
                algunos = false
                ninguno = true
            }
        } else {
            await guardarOffline();
            if(Object.keys(selecthashmap).length>0){
                todos =false
                algunos = true
                ninguno = false
            }
            else{
                todos =false
                algunos = false
                ninguno = true
            }
        }
    }
    function validarBoton() {
        botonhabilitado = true;
        if (esservicio) {
            if (fechadesdeserv == "") {
                botonhabilitado = false;
            }
        }
        if (esinseminacion) {
        }
    }
    function onelegir(id) {
        let p = padres.filter((pa) => pa.id == id)[0];
        for (let i = 0; i < selectanimales.length; i++) {
            selectanimales[i].pajuela = p.caravana;
            selectanimales[i].padre = id;
        }
        pajuela = p.caravana;
        onInput("PAJUELA");
    }
    function onwrite() {
        for (let i = 0; i < selectanimales.length; i++) {
            selectanimales[i].pajuela = pajuela;
        }
        onInput("PAJUELA");
    }
    async function onMountOriginal() {
        await getAnimales();
        await getRodeos();
        await getLotes();
        cargado = true;
    }
    async function getServiciosInseminacionesSQL() {
        let resservicios = await getServiciosSQL(db);
        let resinseminaciones = await getInseminacionesSQL(db);
        servicios = resservicios.lista;
        inseminaciones = resinseminaciones.lista;
    }
    async function updateLocalSQL() {
        await setUltimoAnimalesSQL(db);
        await setUltimoRodeosLotesSQL(db);
        await getServiciosInseminacionesSQL();
        let lotesrodeos = await getUpdateLocalRodeosLotesSQLUser(
            db,
            pb,
            usuarioid,
            caboff.id,
        );

        lotes = lotesrodeos.lotes;
        rodeos = lotesrodeos.rodeos;
        animales = await updateLocalAnimalesSQLUser(db, pb, usuarioid);
        animales = animales.filter((a) => a.active && a.cab == caboff.id);
        animales.sort((a1, a2) => (a1.caravana > a2.caravana ? 1 : -1));
        madres = animales.filter((a) => a.sexo == "H");
        padres = animales.filter((a) => a.sexo == "M");
        cargadoanimales = true;
        listapadres = padres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });
        filterUpdate();
    }

    async function getLocalSQL() {
        getlocal = true;
        //let reslotes = await getLotesSQL(db)
        //let resrodeos = await getRodeosSQL(db)
        await getServiciosInseminacionesSQL();
        let lotesrodeos = await getLotesRodeosSQL(db,caboff.id);
        let resanimales = await getAnimalesSQL(db);
        lotes = lotesrodeos.lotes;
        rodeos = lotesrodeos.rodeos;
        
        animales = resanimales.lista.filter(
            (a) => a.active && a.cab == caboff.id,
        );
        animales.sort((a1, a2) => (a1.caravana > a2.caravana ? 1 : -1));
        madres = animales.filter((a) => a.sexo == "H");
        padres = animales.filter((a) => a.sexo == "M");
        cargadoanimales = true;
        listapadres = padres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });

        filterUpdate();
    }
    async function oldDataUpdate() {
        if (coninternet.connected) {
            if (lastinter.internet == 0) {
                await setInternetSQL(db, 1, Date.now());
                await updateLocalSQL();
            } else {
                const cincoMinEnMs = 300000;
                if (ahora - antes >= cincoMinEnMs) {
                    await updateLocalSQL();
                } else {
                    await getLocalSQL();
                }
            }

            cargado = true;
        } else {
            await getLocalSQL();
            cargado = true;
        }
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
        let ahora = Date.now();
        let antes = ultimo_animal.ultimo;
        //A priorir el update se hizo antes
        await getLocalSQL();
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
                <span>
                    last internet: {ultimo_animal.ultimo}
                </span>
            </div>
            <div class="label">
                Distancia: {Date.now() - ultimo_animal.ultimo}
            </div>
            <div class="label">
                Distancia min: {(Date.now() - ultimo_animal.ultimo) / 60000}
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
    <div class="grid grid-cols-1 lg:grid-cols-2 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <button
                class="bg-transparent border-none flex"
                aria-label="volver"
                onclick={() => goto("/servicios")}
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
                <h1 class="text-2xl">Servicios</h1>
            </button>
        </div>

        <div class="flex gap-1 justify-start lg:justify-end">
            <button
                class={`btn btn-primary rounded-lg ${estilos.btntext}`}
                data-theme="forest"
                onclick={() => openNewModal()}
            >
                <span class="text-xl">{capitalize("Servicios")}</span>
            </button>
            <button
                class={`btn btn-primary rounded-lg ${estilos.btntext}`}
                data-theme="forest"
                onclick={() => openNewModalInseminacion()}
            >
                <span class="text-xl">{capitalize("Inseminaciones")}</span>
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
                <button class="btn btn-neutral mt-3" onclick={limpiar}>
                    Limpiar
                </button>
            </div>
        {/if}
    </div>
    {#if cargado}
        <div>
            <div
                class="hidden w-full md:grid justify-items-center mx-1 lg:w-3/4 overflow-x-auto"
            >
                <table class="table table-lg w-full">
                    <thead>
                        <tr>
                            <th class="">
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
                            <th class="text-base">Caravana</th>
                            <th class="text-base">Estado</th>
                            <th class="text-base">Categoria</th>
                            <th class="text-base">Peso</th>
                            <th class="text-base">Rodeo</th>
                            <th class="text-base">Lote</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each animalesrows as a}
                            <tr>
                                <td class="">
                                    <button
                                        aria-label="fila"
                                        onclick={() => clickAnimal(a.id)}
                                        class={`
                                font-medium bg-transparent rounded-lg
                                p-1 text-base
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
                                <td class="text-base">{a.caravana}</td>
                                <td class="text-base"
                                    >{getEstadoNombre(a.prenada)}</td
                                >
                                <td class="text-base">{a.categoria}</td>
                                <td class="text-base">{a.peso}</td>
                                <td class="text-base"
                                    >{a.expand?.rodeo?.nombre || ""}</td
                                >
                                <td class="text-base"
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
{#if infotoast}
    <div class="toast toast-top toast-center">
        <div class="alert alert-info">
            <span>Datos actualizados</span>
        </div>
    </div>
{/if}
<dialog id="servicioMasivo" class="modal modal-middle rounded-xl">
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
        <h3 class="text-lg font-bold">Servicios</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-1">
            <div>
                <label for="fechadesde" class="label">
                    <span class="label-text text-base">Fecha desde</span>
                </label>
                <label class="input-group">
                    <input
                        id="fechadesde"
                        type="date"
                        class={`
                            input input-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2} 
                        `}
                        bind:value={fechadesdeserv}
                        oninput={() => input("DESDE")}
                    />
                    {#if malfechadese}
                        <div class="label">
                            <span class="label-text-alt text-red-500"
                                >Debe seleccionar la fecha inicial del servicio</span
                            >
                        </div>
                    {/if}
                </label>
            </div>
            <div>
                <label for="fechahasta" class="label">
                    <span class="label-text text-base">Fecha hasta</span>
                </label>
                <label class="input-group">
                    <input
                        id="fechahasta"
                        type="date"
                        class={`
                            input input-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2} 
                        `}
                        bind:value={fechahastaserv}
                    />
                </label>
            </div>
            <div>
                <label for="fechaparto" class="label">
                    <span class="label-text text-base">Fecha parto</span>
                </label>
                <label class="input-group">
                    <input
                        id="fechaparto"
                        type="date"
                        class={`
                            input input-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2} 
                        `}
                        bind:value={fechaparto}
                    />
                </label>
            </div>
            <div class="lg:col-span-2">
                <label for="toros" class="label">
                    <span class="label-text text-base">Toros</span>
                </label>
                <label class="input-group">
                    {#if cargadoanimales}
                        <MultipleToros
                            toros={padres}
                            bind:valor={padresserv}
                            bind:listavalores={padreslist}
                        />
                        {#if malpadre}
                            <div class="label">
                                <span class="label-text-alt text-red-500"
                                    >Debe seleccionar al menos un padre</span
                                >
                            </div>
                        {/if}
                    {/if}
                </label>
            </div>
            <div class="lg:col-span-2">
                <label for="observacion" class="label">
                    <span class="label-text text-base">Observación</span>
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
            <div class="block justify-items-center mx-1">
                {#each selectanimales as a, i}
                    <div
                        class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                    >
                        <div class="block p-4">
                            <div class="grid grid-cols-2 gap-y-2">
                                <div class="flex items-start col-span-2">
                                    <span>Caravana:</span>
                                    <span class="mx-1 font-semibold">
                                        {a.caravana}
                                    </span>
                                </div>
                                <div class="flex items-start col-span-2">
                                    <input
                                        bind:value={
                                            selectanimales[i].observacion
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
        </div>
        <div class="modal-action justify-start">
            <form method="dialog">
                <button
                    class="btn btn-success text-white"
                    disabled={!botonhabilitado}
                    onclick={guardar}>Guardar</button
                >
                <button
                    class="btn btn-error text-white"
                    onclick={() => {
                        esservicio = false;
                    }}>Cancelar</button
                >
            </form>
        </div>
    </div>
</dialog>
<dialog id="inseminacionMasiva" class="modal modal-middle rounded-xl">
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
        <h3 class="text-xl font-bold">Inseminaciones múltiples</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-1">
            <div>
                <label for="fechains" class="label">
                    <span class="label-text text-base">Fecha inseminación</span>
                </label>
                <label class="input-group">
                    <input
                        id="fechainseminacion"
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
                        bind:value={fechainseminacion}
                        onchange={() => onInput("FECHA")}
                    />
                    {#if malfecha}
                        <div class="label">
                            <span class="label-text-alt text-red-500"
                                >Debe seleccionar la fecha de inseminacion</span
                            >
                        </div>
                    {/if}
                </label>
            </div>
            <div>
                <label for="fechaparto" class="label">
                    <span class="label-text text-base">Fecha parto</span>
                </label>
                <label class="input-group">
                    <input
                        id="fechains"
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
                        disabled
                        bind:value={fechaparto}
                    />
                </label>
            </div>
            {#if cargadoanimales}
                <PredictSelect
                    {onwrite}
                    {onelegir}
                    bind:valor={padre}
                    etiqueta={"Padre"}
                    bind:cadena={pajuela}
                    lista={listapadres}
                    size="w-1/2"
                />
            {/if}
            <div class="">
                <label for="obs" class="label">
                    <span class="label-text text-base">Observacion </span>
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
        <div class="hidden w-full grid grid-cols-1 justify-items-start">
            <div class="flex overflow-x-auto">
                <table class="table table-lg w-full w-11/12">
                    <thead>
                        <tr>
                            <th class="text-base px-1">Caravana</th>
                            <th class="text-base px-1">Pajuela</th>
                            <th class="text-base px-1">Padre</th>
                            <th class="text-base px-1">Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each selectanimales as a, i}
                            <tr>
                                <td class="text-base px-1">{a.caravana}</td>
                                <td class="px-1">
                                    <input
                                        bind:value={selectanimales[i].pajuela}
                                        class={`
                                            h-12 w-32 border border-gray-300 
                                            px-1
                                            rounded-md
                                            focus:outline-none focus:ring-2 
                                            focus:ring-green-500 
                                            focus:border-green-500
                                            ${estilos.bgdark2}
                                        `}
                                    />
                                </td>
                                <td class="px-1">
                                    <label class="input-group">
                                        <select
                                            class={`
                                                select select-bordered 
                                                rounded-md
                                                px-1
                                                w-32
                                                focus:outline-none focus:ring-2 
                                                focus:ring-green-500 
                                                focus:border-green-500
                                                ${estilos.bgdark2}
                                            `}
                                            bind:value={selectanimales[i].padre}
                                            onchange={() =>
                                                getNombrePadreTabla(i)}
                                        >
                                            {#each padres as p}
                                                <option value={p.id}
                                                    >{p.caravana}</option
                                                >
                                            {/each}
                                        </select>
                                    </label>
                                </td>
                                <td class="px-1">
                                    <input
                                        bind:value={
                                            selectanimales[i].observacion
                                        }
                                        class={`
                                            h-12 w-32 border border-gray-300 
                                            
                                            px-1
                                            rounded-md
                                            focus:outline-none focus:ring-2 
                                            focus:ring-green-500 
                                            focus:border-green-500
                                            ${estilos.bgdark2}
                                        `}
                                    />
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
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
                                    {a.caravana}
                                </span>
                            </div>
                            <div class="flex items-start col-span-2">
                                {#if cargadoanimales}
                                    <PredictSelect
                                        {onwrite}
                                        {onelegir}
                                        bind:valor={selectanimales[i].padre}
                                        etiqueta={"Padre"}
                                        bind:cadena={selectanimales[i].pajuela}
                                        lista={listapadres}
                                    />
                                {/if}
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
                    onclick={guardar}>Guardar</button
                >
                <button
                    class="btn btn-error text-white"
                    onclick={() => {
                        esinseminacion = false;
                    }}>Cancelar</button
                >
            </form>
        </div>
    </div>
</dialog>

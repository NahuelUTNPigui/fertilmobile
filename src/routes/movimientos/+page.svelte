<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import PocketBase from "pocketbase";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    import estilos from "$lib/stores/estilos";
    import { createCaber } from "$lib/stores/cab.svelte";
    import categorias from "$lib/stores/categorias";
    import sexos from "$lib/stores/sexos";
    import {
        guardarHistorial,
        guardarHistorialOffline,
    } from "$lib/historial/lib";
    import { createPer } from "$lib/stores/permisos.svelte";

    import motivos from "$lib/stores/motivos";
    import MultiSelect from "$lib/components/MultiSelect.svelte";
    import tiponoti from "$lib/stores/tiponoti";
    import {
        getEstadoNombre,
        getEstadoColor,
    } from "$lib/components/estadosutils/lib";
    import { getSexoNombre } from "$lib/stringutil/lib";
    //FILTROS
    import { createStorageProxy } from "$lib/filtros/filtros";
    import Limpiar from "$lib/filtros/Limpiar.svelte";
    //Permisos
    import { getPermisosMessage, getPermisosList } from "$lib/permisosutil/lib";
    //ACtualizacion
    import {
        actualizacion,
        deboActualizar,
    } from "$lib/stores/offline/actualizar";
    import { customoffliner } from "$lib/stores/offline/custom.svelte";
    import { intermitenter } from "$lib/stores/offline/intermitencia.svelte";
    import { velocidader } from "$lib/stores/offline/velocidad.svelte";
    //offline
    import { openDB, resetTables } from "$lib/stores/sqlite/main";
    import { Network } from "@capacitor/network";
    import { getInternet, getOnlyInternet } from "$lib/stores/offline";
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
        getLotesSQL,
        getRodeosSQL,
        setLotesSQL,
        updateLocalRodeosSQL,
        getUpdateLocalRodeosLotesSQLUser,
        getLotesRodeosSQL,
        getTratsSQL,
        setTratsSQL,
        setUltimoRodeosLotesSQL,
    } from "$lib/stores/sqlite/dbeventos";
    import {
        addNewAnimalSQL,
        getAnimalesSQL,
        setAnimalesSQL,
        updateLocalAnimalesSQL,
        getUpdateLocalAnimalesSQLUser,
        updateLocalAnimalesSQLUser,
        getUltimoAnimalesSQL,
        setUltimoAnimalesSQL,
    } from "$lib/stores/sqlite/dbanimales";
    import Modalmove from "$lib/components/movimientos/Modalmove.svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    import Listamove from "$lib/components/movimientos/Listamove.svelte";
    import Info from "$lib/components/toast/Info.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";

    //offline
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
    let cargado = $state(false);
    let comandos = $state([]);

    let ruta = import.meta.env.VITE_RUTA;
    let pre = "";
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    let caber = createCaber();
    let cab = caber.cab;
    let per = createPer();
    let userpermisos = getPermisosList(per.per.permisos);
    //movimientos
    let listaanimales = $state([]);
    //boton
    let textoboton = $state("Mover");
    //Datos animales
    let animales = $state([]);
    let animalescab = $state([]);
    let animalesrows = $state([]);
    //Filtros

    let buscar = $state("");
    let lote = $state("");
    let rodeo = $state("");
    let loteseleccion = $state([]);
    let rodeoseleccion = $state([]);
    let categoriaseleccion = $state([]);
    let sexo = $state("");
    let categoria = $state("");
    let defaultfiltro = {
        buscar: "",
        lote: "",
        rodeo: "",
        loteseleccion: [],
        rodeoseleccion: [],
        categoriaseleccion: [],
        sexo: "",
        categoria: "",
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("listamovimiento", defaultfiltro);

    let lotes = $state([]);
    let rodeos = $state([]);
    let tipos = $state([]);
    let isOpenFilter = $state(false);
    //Seleccionados
    let selectanimales = $state([]);
    let selecthashmap = $state({});
    let todos = $state(false);
    let algunos = $state(false);
    let ninguno = $state(true);
    //movimiento
    let nuevacategoria = $state("");
    let nuevolote = $state("");
    let nuevorodeo = $state("");
    let tipotratamiento = $state("");
    let fecha = $state("");
    let fechabaja = $state("");
    let motivo = $state("");
    let codigo = $state("");
    //validar
    let malcategoria = $state("");
    let mallote = $state("");
    let malrodeo = $state("");
    let maltipo = $state("");
    let malfecha = $state("");
    let malfechabaja = $state("");
    let malmotivo = $state("");
    let malcodigo = $state("");
    let habilitarboton = $state(false);

    //Seleecionar
    let selectcategoria = $state(true);
    let selectlote = $state(false);
    let selectrodeo = $state(false);
    let selecttratamiento = $state(false);
    let selectbaja = $state(false);
    let selecttransfer = $state(false);

    function clickFilter() {
        isOpenFilter = !isOpenFilter;
    }
    function limpiar() {
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
        loteseleccion = proxyfiltros.loteseleccion;
        rodeoseleccion = proxyfiltros.rodeoseleccion;
        categoriaseleccion = proxyfiltros.categoriaseleccion;
        sexo = proxyfiltros.sexo;
        categoria = proxyfiltros.categoria;
    }

    function setProxyFilter() {
        proxyfiltros.buscar = buscar;
        proxyfiltros.lote = lote;
        proxyfiltros.rodeo = rodeo;
        proxyfiltros.loteseleccion = loteseleccion;
        proxyfiltros.rodeoseleccion = rodeoseleccion;
        proxyfiltros.categoriaseleccion = categoriaseleccion;
        proxyfiltros.sexo = sexo;
        proxyfiltros.categoria = categoria;
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
        if (categoria != "") {
            animalesrows = animalesrows.filter((a) => a.categoria == categoria);
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
    function openNewModal() {
        listaanimales = [];
        for (const [key, value] of Object.entries(selecthashmap)) {
            if (value != null) {
                listaanimales.push(value);
            }
        }
        if (listaanimales.length == 0) {
            Swal.fire(
                "Error movimiento",
                "No hay animales seleccionados",
                "error",
            );
            nuevorodeo = "";
            nuevolote = "";
            nuevacategoria = "";
        } else {
            nuevoModal.showModal();
        }
    }
    async function moverAnimalOffline(a, data,caravana) {
        let nlote = data.lote ? data.lote.split("_").length > 1 : false;
        let nrodeo = data.rodeo ? data.rodeo.split("_").length > 1 : false;

        let comando = {
            tipo: "update",
            coleccion: "animales",
            data: { ...data },
            hora: Date.now(),
            prioridad: 3,
            idprov: a.id,
            camposprov: `${nlote ? "lote" : nrodeo ? "rodeo" : ""}`,
            show:{...data,caravana},
            motivo:"Editar animals"
        };
        comandos.push(comando);

        let esnuevolote = a.lote.split("_").length > 1;
        let esnuevorodeo = a.rodeo.split("_").length > 1;
        let camposprov = "";
        let vacio = true;

        if (esnuevolote) {
            if (vacio) {
                camposprov = "lote";
            } else {
                camposprov += ",lote";
            }
            vacio = false;
        }

        if (esnuevorodeo) {
            if (vacio) {
                camposprov = "rodeo";
            } else {
                camposprov += ",rodeo";
            }
        }

        let histo = {
            animal: a.id,
            caravana: a.caravana,
            user: usuarioid,
            active: true,
            delete: false,
            fechanacimiento: a.fechanacimiento,
            sexo: a.sexo,
            peso: a.peso,
            lote: a.lote,
            rodeo: a.rodeo,
            categoria: a.categoria,
            prenada: a.prenada,
            rp: a.rp,
            raza: a.raza,
            color: a.color,
        };

        let comandohis = {
            tipo: "add",
            coleccion: "historialanimales",
            data: { ...histo },
            hora: Date.now(),
            prioridad: 0,
            idprov: "nuevo_histo_" + generarIDAleatorio(),
            camposprov,
            show:{...histo},
            motivo:"Nuevo historal"
        };

        comandos.push(comandohis);
    }
    async function moverOffline() {
        if (ninguno) {
            Swal.fire(
                "Error movimiento",
                "No hay animales seleccionados",
                "error",
            );
            nuevorodeo = "";
            nuevolote = "";
            nuevacategoria = "";
            return;
        }
        let errores = false;
        let conerrores = [];
        let data = { caravana: "" };
        let nombrelote = "";
        let nombrerodeo = "";
        if (selectcategoria) {
            data.categoria = nuevacategoria;
        }
        if (selectlote) {
            data.lote = nuevolote;
            nombrelote = lotes.filter((l) => l.id == nuevolote)[0].nombre;
        }
        if (selectrodeo) {
            data.rodeo = nuevorodeo;
            nombrerodeo = rodeos.filter((r) => r.id == nuevorodeo)[0].nombre;
        }
        if (selectbaja) {
            data.active = false;
            data.motivobaja = motivo;
            data.fechafallecimiento = fechabaja + " 03:00:00";
        }
        if (selecttransfer) {
            Swal.fire(
                "Error movimiento",
                "Sin internet no se pueden hacer movimientos",
                "error",
            );
            return;
        }
        //inicio movimiento
        for (let i = 0; i < listaanimales.length; i++) {
            let a = listaanimales[i];
            let a_idx = animales.findIndex((an) => an.id == a.id);
            data.caravana = animales[a_idx].caravana;
            animales[a_idx] = {
                ...animales[a_idx],
                ...data,
            };
            if (selectlote) {
                if (animales[a_idx].expand) {
                    animales[a_idx].expand.lote = {
                        id: nuevolote,
                        nombre: nombrelote,
                    };
                } else {
                    animales[a_idx].expand = {};
                    animales[a_idx].expand.lote = {
                        id: nuevolote,
                        nombre: nombrelote,
                    };
                }
            }
            if (selectrodeo) {
                if (animales[a_idx].expand) {
                    animales[a_idx].expand.rodeo = {
                        id: nuevorodeo,
                        nombre: nombrerodeo,
                    };
                } else {
                    animales[a_idx].expand = {};
                    animales[a_idx].expand.rodeo = {
                        id: nuevorodeo,
                        nombre: nombrerodeo,
                    };
                }
            }
            try {
                await moverAnimalOffline(a, data,animales[a_idx].caravana);
            } catch (err) {
                conerrores.push(a.id);
                errores = true;
                if (modedebug) {
                    loger.addTextError(a.caravana);
                }
            }
        }
        await setAnimalesSQL(db, animales);
        await setComandosSQL(db, comandos);

        //fin del metodo
        algunos = false;
        todos = false;
        ninguno = true;
        selectcategoria = true;
        selectlote = false;
        selectrodeo = false;
        selecttratamiento = false;
        selectbaja = false;
        selecttransfer;
        nuevacategoria = "";
        nuevolote = "";
        nuevorodeo = "";
        fecha = "";
        tipotratamiento = "";
        fechabaja = "";
        motivo = "";
        codigo = "";
        habilitarboton = false;
        for (let i = 0; i < listaanimales.length; i++) {
            let error_idx = conerrores.findIndex(
                (pid) => pid == listaanimales[i].id,
            );
            if (error_idx == -1) {
                delete selecthashmap[listaanimales[i].id];
            }
        }

        onChangeAnimales();
        filterUpdate();
    }
    async function moverOnlineBulk() {
        if (ninguno) {
            Swal.fire(
                "Error movimiento",
                "No hay animales seleccionados",
                "error",
            );
            nuevorodeo = "";
            nuevolote = "";
            nuevacategoria = "";
            return;
        }
        let lista = [];
        for (const [key, value] of Object.entries(selecthashmap)) {
            if (value != null) {
                lista.push(value);
            }
        }
        if (lista.length == 0) {
            Swal.fire(
                "Error movimiento",
                "No hay animales seleccionados",
                "error",
            );
            nuevorodeo = "";
            nuevolote = "";
            nuevacategoria = "";
            return;
        }

        let conerrores = [];
        let data = {};
        let nombrelote = "";
        let nombrerodeo = "";
        if (selectcategoria) {
            data.categoria = nuevacategoria;
        }
        if (selectlote) {
            data.lote = nuevolote;
            nombrelote = lotes.filter((l) => l.id == nuevolote)[0];
        }
        if (selectrodeo) {
            data.rodeo = nuevorodeo;
            nombrerodeo = rodeos.filter((r) => r.id == nuevorodeo)[0];
        }
        if (selectbaja) {
            data.active = false;
            data.motivobaja = motivo;
            data.fechafallecimiento = fechabaja + " 03:00:00";
        }
        if (selecttransfer) {
            const resultList = await pb.collection("cabs").getList(1, 1, {
                filter: `active = true && renspa = '${codigo}'`,
            });
            if (resultList.items.length == 0) {
                malcodigo = true;
                return;
            }
            data.cab = resultList.items[0].id;
            try {
                let pb_json = JSON.parse(
                    localStorage.getItem("pocketbase_auth"),
                );

                let origenusuarioid = pb_json.record.id;
                let datanoti = {
                    texto: `Se transfirieron ${lista.length} animales`,
                    titulo: `Transferencia de ${lista.length} animales`,
                    tipo: tiponoti[1].id,
                    origen: origenusuarioid,
                    destino: resultList.items[0].user,
                    leido: false,
                };
                const record = await pb
                    .collection("notificaciones")
                    .create(datanoti);
            } catch (err) {
                console.error(err);
            }
        }
        let bulkcambios = [];
        let bulkhistoriales = [];
        let bulktratamientos = [];
        for (let i = 0; i < lista.length; i++) {
            let a = lista[i];
            if (!selecttratamiento) {
                let datacambio = {
                    ...data,
                };
                bulkcambios.push(datacambio);
                let datahistorial = {
                    animal: a.id,
                    caravana: a.caravana,
                    user: a.expand.cab.user,
                    active: true,
                    delete: false,
                    fechanacimiento: a.fechanacimiento,
                    sexo: a.sexo,
                    peso: a.peso,
                    lote: a.lote,
                    rodeo: a.rodeo,
                    categoria: a.categoria,
                    prenada: a.prenada,
                };
                bulkhistoriales.push(datahistorial);
                //await guardarHistorial(pb,lista[i].id)
                //await pb.collection('animales').update(lista[i].id, data);
            } else {
                let datatratamiento = {
                    ...data,
                    animal: a.id,
                    categoria: a.categoria,
                };
                bulktratamientos.push(datatratamiento);
            }
        }
        try {
            const batch = pb.createBatch();
            for (let i = 0; i < lista.length; i++) {
                if (!selecttratamiento) {
                    batch
                        .collection("animales")
                        .update(lista[i].id, bulkcambios[i]);
                    batch
                        .collection("historialanimales")
                        .create(bulkhistoriales[i]);
                } else {
                    batch
                        .collection("tratamientos")
                        .create(bulktratamientos[i]);
                }
            }
            const result = await batch.send();
            Swal.fire("Éxito movimiento", "Movimiento exitoso", "success");
        } catch (err) {
            Swal.fire(
                "Error movimiento",
                "No se logró hacer el movimiento",
                "error",
            );
        }
        for (let i = 0; i < lista.length; i++) {
            delete selecthashmap[lista[i].id];
        }

        algunos = false;
        todos = false;
        ninguno = true;
        selectcategoria = true;
        selectlote = false;
        selectrodeo = false;
        selecttratamiento = false;
        selectbaja = false;
        selecttransfer;
        nuevacategoria = "";
        nuevolote = "";
        nuevorodeo = "";
        fecha = "";
        tipotratamiento = "";
        fechabaja = "";
        motivo = "";
        codigo = "";
        habilitarboton = false;

        //COrregir este getanimales
        onChangeAnimales();
        filterUpdate();
    }
    async function moverAnimalOnline(a, data) {
        //await pb.collection("animales").update(a.id,datacambio)
        await guardarHistorial(pb, a.id);
        await pb.collection("animales").update(a.id, data);

        //Aca viene la parte del historial pero seria esta la logia
    }
    async function moverOnline() {
        if (ninguno) {
            Swal.fire(
                "Error movimiento",
                "No hay animales seleccionados",
                "error",
            );
            nuevorodeo = "";
            nuevolote = "";
            nuevacategoria = "";
            return;
        }
        let data = {};
        let nombrelote = "";
        let nombrerodeo = "";
        if (selectcategoria) {
            data.categoria = nuevacategoria;
        }
        if (selectlote) {
            data.lote = nuevolote;
            nombrelote = lotes.filter((l) => l.id == nuevolote)[0].nombre;
        }
        if (selectrodeo) {
            data.rodeo = nuevorodeo;
            nombrerodeo = rodeos.filter((r) => r.id == nuevorodeo)[0].nombre;
        }
        if (selectbaja) {
            data.active = false;
            data.motivobaja = motivo;
            data.fechafallecimiento = fechabaja + " 03:00:00";
        }
        if (selecttransfer) {
            const resultList = await pb.collection("cabs").getList(1, 1, {
                filter: `active = true && renspa = '${codigo}'`,
            });
            if (resultList.items.length == 0) {
                malcodigo = true;
                if (modedebug) {
                    loger.addTextError(
                        "error cabana: " + resultList.items.length,
                    );
                }
                return;
            }
            data.cab = resultList.items[0].id;

            data.lote = "";
            data.rodeo = "";

            try {
                let pb_json = JSON.parse(
                    localStorage.getItem("pocketbase_auth"),
                );

                let origenusuarioid = pb_json.record.id;
                let datanoti = {
                    texto: `Se transfirieron ${listaanimales.length} animales`,
                    titulo: `Transferencia de ${listaanimales.length} animales`,
                    tipo: tiponoti[1].id,
                    origen: origenusuarioid,
                    destino: resultList.items[0].user,
                    leido: false,
                };
                const record = await pb
                    .collection("notificaciones")
                    .create(datanoti);
            } catch (err) {
                console.error(err);
                if (modedebug) {
                    loger.addTextError(
                        "Error en enviar notificación de transferencia",
                    );
                }
            }
        }
        let errores = false;
        let conerrores = [];
        //Seria idea el bulk aca
        for (let i = 0; i < listaanimales.length; i++) {
            let a = listaanimales[i];
            let a_idx = animales.findIndex((an) => an.id == a.id);
            animales[a_idx] = {
                ...animales[a_idx],
                ...data,
            };
            if (selectlote) {
                if (animales[a_idx].expand) {
                    animales[a_idx].expand.lote = {
                        id: nuevolote,
                        nombre: nombrelote,
                    };
                } else {
                    animales[a_idx].expand = {};
                    animales[a_idx].expand.lote = {
                        id: nuevolote,
                        nombre: nombrelote,
                    };
                }
            }
            if (selectrodeo) {
                if (animales[a_idx].expand) {
                    animales[a_idx].expand.rodeo = {
                        id: nuevorodeo,
                        nombre: nombrerodeo,
                    };
                } else {
                    animales[a_idx].expand = {};
                    animales[a_idx].expand.rodeo = {
                        id: nuevorodeo,
                        nombre: nombrerodeo,
                    };
                }
            }
            if (selecttransfer) {
                animales.splice(a_idx, 1);
            }
            try {
                await moverAnimalOnline(a, data);
            } catch (err) {
                conerrores.push(a.id);
                errores = true;
                if (modedebug) {
                    loger.addTextError(a.caravana);
                }
            }
        }
        for (let i = 0; i < listaanimales.length; i++) {
            let error_idx = conerrores.findIndex(
                (pid) => pid == listaanimales[i].id,
            );
            if (error_idx == -1) {
                delete selecthashmap[listaanimales[i].id];
            }
        }

        algunos = false;
        todos = false;
        ninguno = true;
        selectcategoria = true;
        selectlote = false;
        selectrodeo = false;
        selecttratamiento = false;
        selectbaja = false;
        selecttransfer;
        nuevacategoria = "";
        nuevolote = "";
        nuevorodeo = "";
        fecha = "";
        tipotratamiento = "";
        fechabaja = "";
        motivo = "";
        codigo = "";
        habilitarboton = false;

        onChangeAnimales();
        filterUpdate();
        if (conerrores.length > 0) {
            Swal.fire("Error movimiento", "Hubo animales con errores", "error");
        } else {
            Swal.fire(
                "Éxito movimiento",
                "Se lograron mover todos los animales",
                "success",
            );
        }
    }
    async function mover() {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        let isOnline = await getOnlyInternet();
        intermitenter.addIntermitente(isOnline);
        if (coninternet.connected) {
            let listapermisos = getPermisosList(caboff.permisos);
            if (!listapermisos[3]) {
                Swal.fire("Error permisos", getPermisosMessage(3), "error");
                return;
            }
            await moverOnline();
        } else {
            await moverOffline();
        }
    }
    function onChangeCollapse(seccion) {
        nuevacategoria = "";
        nuevolote = "";
        nuevorodeo = "";
        fecha = "";
        tipotratamiento = "";
        fechabaja = "";
        motivo = "";
        codigo = "";
        habilitarboton = false;
        if (seccion == "CATEGORIA") {
            selectcategoria = true;
            selectlote = false;
            selectrodeo = false;
            selecttratamiento = false;
            selectbaja = false;
            selecttransfer = false;
            textoboton = "Mover de categoria";
        }
        if (seccion == "RODEO") {
            selectcategoria = false;
            selectlote = false;
            selectrodeo = true;
            selecttratamiento = false;
            selectbaja = false;
            selecttransfer = false;
            textoboton = "Mover de rodeo";
        }
        if (seccion == "LOTE") {
            selectcategoria = false;
            selectlote = true;
            selectrodeo = false;
            selecttratamiento = false;
            selectbaja = false;
            selecttransfer = false;
            textoboton = "Mover de lote";
        }
        if (seccion == "TRATAMIENTO") {
            selectcategoria = false;
            selectlote = false;
            selectrodeo = false;
            selecttratamiento = true;
            selectbaja = false;
            selecttransfer = false;
            textoboton = "Crear tratamientos";
        }
        if (seccion == "BAJA") {
            selectcategoria = false;
            selectlote = false;
            selectrodeo = false;
            selecttratamiento = false;
            selectbaja = true;
            selecttransfer = false;
            textoboton = "Dar baja";
        }
        if (seccion == "TRANSFER") {
            selectcategoria = false;
            selectlote = false;
            selectrodeo = false;
            selecttratamiento = false;
            selectbaja = false;
            selecttransfer = true;
        }
    }
    function validarBoton() {
        habilitarboton = true;
        if (selectcategoria) {
            if (nuevacategoria == "") {
                habilitarboton = false;
            }
        }
        if (selectlote) {
            if (nuevolote == "") {
                habilitarboton = false;
            }
        }
        if (selectrodeo) {
            if (nuevorodeo == "") {
                habilitarboton = false;
            }
        }
        if (selecttratamiento) {
            if (fecha == "" || tipotratamiento == "") {
                habilitarboton = false;
            }
        }
        if (selectbaja) {
            if (fechabaja == "" || motivo == "") {
                habilitarboton = false;
            }
        }
        if (selecttransfer) {
            if (codigo == "") {
                habilitarboton = false;
            }
        }
    }
    function oninput(campo) {
        validarBoton();
        if (selectcategoria && campo == "CATEGORIA") {
            if (nuevacategoria == "") {
                malcategoria = true;
            } else {
                malcategoria = false;
            }
        }
        if (selectlote && campo == "LOTE") {
            if (nuevolote == "") {
                mallote = true;
            } else {
                mallote = false;
            }
        }
        if (selectrodeo && campo == "RODEO") {
            if (nuevorodeo == "") {
                malrodeo = true;
            } else {
                malrodeo = false;
            }
        }
        if (selecttratamiento) {
            if (campo == "FECHA") {
                if (fecha == "") {
                    malfecha = true;
                } else {
                    malfecha = false;
                }
            }

            if (campo == "TIPO") {
                if (tipotratamiento == "") {
                    maltipo = true;
                } else {
                    maltipo = false;
                }
            }
        }
        if (selectbaja) {
            if (campo == "FECHABAJA") {
                if (fechabaja == "") {
                    malfechabaja = true;
                } else {
                    malfechabaja = false;
                }
            }
            if (campo == "MOTIVO") {
                if (motivo == "") {
                    malmotivo = true;
                } else {
                    malmotivo = false;
                }
            }
        }
    }
    function onChangeAnimales() {
        animales.sort((a1, a2) => (a1.caravana > a2.caravana ? 1 : -1));
        animalescab = animales.filter((a) => a.active && a.cab == caboff.id);
    }
    async function updateLocalSQL() {
        caboff = await updatePermisos(pb, usuarioid);
        await setUltimoRodeosLotesSQL(db);
        await setUltimoAnimalesSQL(db);
        animales = await updateLocalAnimalesSQLUser(db, pb, usuarioid);

        let lotesrodeos = await getUpdateLocalRodeosLotesSQLUser(
            db,
            pb,
            usuarioid,
            caboff.id,
        );
        lotes = lotesrodeos.lotes;
        rodeos = lotesrodeos.rodeos;
        onChangeAnimales();
        filterUpdate();
        cargado = true;
    }
    async function getLocalSQL() {
        let resanimales = await getAnimalesSQL(db);
        let lotesrodeos = await getLotesRodeosSQL(db, caboff.id);
        animales = resanimales.lista;

        lotes = lotesrodeos.lotes;
        rodeos = lotesrodeos.rodeos;
        onChangeAnimales();

        filterUpdate();
        cargado = true;
    }
    async function updateComandos() {
        try {
            await flushComandosSQL(db, pb);
            comandos = [];
        } catch (err) {
            if (modedebug) {
                loger.addTextError(JSON.stringify(err), null, 2);
                loger.addTextError("Error en flush comandos movimiento");
            }
        }
    }
    async function oldUpdate() {
        if (lastinter.internet == 0) {
            await setInternetSQL(db, 1, 0);
            await updateLocalSQL();
        } else {
            let ahora = Date.now();
            let antes = ultimo_animal.ultimo;
            const cincoMinEnMs = 300000;
            if (ahora - antes >= cincoMinEnMs) {
                await updateLocalSQL();
            } else {
                await getLocalSQL();
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
        ultimo_animal = await getUltimoAnimalesSQL(db);
        comandos = rescom.lista;
        let ahora = Date.now();
        let antes = ultimo_animal.ultimo;
        await getLocalSQL();
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
                setTimeout(async () => {
                    try {
                        await updateLocalSQL();
                        // Notificar cambios solo si hay diferencias
                        infotoast = true;
                        setTimeout(() => {
                            infotoast = false;
                            if (modedebug) {
                                loger.addTextLog("BUEN SYNC");
                            }
                        }, 2000); // 2 segundos
                    } catch (err) {
                        if (modedebug) {
                            loger.addTextError("ERROR FALLO SYNC");
                        }

                        console.warn("Fallo en sincronización background", err);
                        // No afecta al usuario
                    }
                }, 0);
            }
        }
    }
    async function initPage() {
        if (modedebug) {
            coninternet = { connected: false }; // await Network.getStatus();
            if (!offliner.offline) {
                coninternet = await Network.getStatus();
            }
        } else {
            coninternet = await Network.getStatus();
        }
        useroff = await getUserOffline();
        caboff = await getCabOffline();
        usuarioid = useroff.id;
    }
    onMount(async () => {
        await initPage();
        await getDataSQL();
    });
</script>

<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-3">
            <div class="label">
                animales - {animales.length}
            </div>
            <div class="label">
                animalescab - {animalescab.length}
            </div>
            <div class="label">
                animalesrows - {animalesrows.length}
            </div>
            <div>
                <span>
                    {coninternet.connected ? "COn internet" : "sin internet"}
                </span>
            </div>
            <div>
                <span>
                    internet {ultimo_animal.ultimo}
                </span>
            </div>
            <div>
                <span>
                    get local {getlocal}
                </span>
            </div>
        </div>
    {/if}
    <div class="grid grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Movimientos</h1>
        </div>
        <div class="flex col-span-2 gap-1 justify-end">
            <button
                class={`btn btn-primary rounded-lg ${estilos.btntext}`}
                data-theme="forest"
                onclick={() => openNewModal()}
            >
                <span class="text-xl">Nuevo</span>
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
                <div>
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
                <div class="mt-2">
                    <MultiSelect
                        opciones={[{ id: "-1", nombre: "Sin rodeo" }].concat(
                            rodeos,
                        )}
                        bind:valores={rodeoseleccion}
                        etiqueta="Rodeos"
                        {filterUpdate}
                    />
                </div>

                <div class="mt-2">
                    <MultiSelect
                        opciones={[{ id: "-1", nombre: "Sin lote" }].concat(
                            lotes,
                        )}
                        bind:valores={loteseleccion}
                        etiqueta="Lotes"
                        {filterUpdate}
                    />
                </div>
                <div class="mt-2">
                    <MultiSelect
                        opciones={[
                            { id: "-1", nombre: "Sin categoria" },
                        ].concat(categorias)}
                        bind:valores={categoriaseleccion}
                        etiqueta="Categorias"
                        {filterUpdate}
                    />
                </div>
                <div class="hidden">
                    <label for="categorias" class="label">
                        <span class="label-text text-base">Categorias</span>
                    </label>
                    <label class="input-group">
                        <select
                            class={`
                                select select-bordered w-full
                                rounded-md
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-green-500 focus:border-green-500
                                ${estilos.bgdark2}
                            `}
                            bind:value={categoria}
                            onchange={filterUpdate}
                        >
                            <option value="">Todos</option>
                            {#each categorias as r}
                                <option value={r.id}>{r.nombre}</option>
                            {/each}
                        </select>
                    </label>
                </div>
                <button class="btn btn-neutral mt-2" onclick={limpiar}>
                    Limpiar
                </button>
            </div>
        {/if}
    </div>
    {#if cargado}
        <div>
            <Listamove
                bind:todos
                bind:ninguno
                bind:algunos
                bind:animalesrows
                bind:selecthashmap
                {clickTodos}
                {getSexoNombre}
                {getEstadoNombre}
                {getEstadoColor}
                {clickAnimal}
            />
        </div>
    {:else}
        <div class="flex items-center justify-center">
            <span class="loading loading-spinner text-success"></span>
        </div>
    {/if}
</Navbarr>
{#if infotoast}
    <Info/>
{/if}
<dialog
    id="nuevoModal"
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
        <h3 class="text-lg font-bold">Movimiento</h3>
        <div class="form-control gap-1">
            <Modalmove
                bind:nuevacategoria
                bind:nuevolote
                bind:nuevorodeo
                bind:tipotratamiento
                bind:fecha
                bind:motivo
                bind:fechabaja
                bind:codigo
                bind:malcodigo
                bind:listaanimales
                {categorias}
                {lotes}
                {rodeos}
                {tipos}
                {HOY}
                {oninput}
                {onChangeCollapse}
            />
        </div>
        <div class="modal-action justify-start">
            <form method="dialog">
                <button
                    class="btn btn-success text-white"
                    disabled={!habilitarboton}
                    onclick={mover}>{textoboton}</button
                >
                <button class="btn btn-error text-white">Cancelar</button>
            </form>
        </div>
    </div>
</dialog>

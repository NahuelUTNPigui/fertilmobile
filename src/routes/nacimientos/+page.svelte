<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import Exportar from "$lib/components/Exportar.svelte";
    import PocketBase from "pocketbase";
    import { slide } from "svelte/transition";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import sexos from "$lib/stores/sexos";
    import estilos from "$lib/stores/estilos";
    import { createCaber } from "$lib/stores/cab.svelte";
    import { guardarHistorial } from "$lib/historial/lib";
    import PredictSelect from "$lib/components/PredictSelect.svelte";
    import {
        verificarNivel,
        verificarNivelOffline,
    } from "$lib/permisosutil/lib";
    import AgregarAnimal from "$lib/components/eventos/AgregarAnimal.svelte";
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
    import {
        getNacimientosSQL,
        getUltimoNacimientosSQL,
        setNacimientosSQL,
        addNewNacimientoSQL,
        updateLocalNacimientosSQLUser,
        getUpdateLocalRodeosLotesSQLUser,
        setUltimoNacimientosSQL,
        setUltimoRodeosLotesSQL,
        getLotesRodeosSQL,
    } from "$lib/stores/sqlite/dbeventos";
    import {
        setAnimalesSQL,
        getAnimalesSQL,
        updateLocalAnimalesSQL,
        updateLocalAnimalesSQLUser,
        setUltimoAnimalesSQL,
        addNewAnimalSQL,
    } from "$lib/stores/sqlite/dbanimales";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import Info from "$lib/components/toast/Info.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    //offline
    let infotoast = $state(false);
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({ connected: false });
    let ultimo_nacimiento = $state({});
    let comandos = $state([]);
    let getlocal = $state(false);
    let getvelocidad = $state(0);
    let getpermisos = $state("");
    let getactualizacion = $state(0);
    let caber = createCaber();
    let cab = caber.cab;
    let ruta = import.meta.env.VITE_RUTA;
    let pre = "";
    let cargado = $state(false);
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    //Datos filtrar
    let nacimientos = $state([]);
    let nacimientoscab = $state([]);
    let nacimientosrow = $state([]);
    let buscar = $state("");
    let fechadesde = $state("");
    let fechahasta = $state("");
    let buscarmadre = $state("");
    let buscarpadre = $state("");
    let cargadoanimales = $state(false);
    let isOpenFilter = $state(false);

    let defaultfiltro = {
        buscar: "",
        fechadesde: "",
        fechahasta: "",
        buscarmadre: "",
        buscarpadre: "",
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("listanacimientos", defaultfiltro);

    //Datos nacimiento
    let agregaranimal = $state(false);
    let nacimiento = $state(null);
    let idnacimiento = $state("");
    let caravana = $state("");
    let sexo = $state("");
    let padre = $state("");
    let madre = $state("");
    let peso = $state("");
    let categoria = $state("");
    let nombremadre = $state("");
    let nombrepadre = $state("");
    let cadenamadre = $state("");
    let cadenapadre = $state("");
    let fecha = $state("");
    let animales = $state([]);
    let animalescab = $state([]);
    let madres = $state([]);
    let padres = $state([]);
    let listamadres = $state([]);
    let listapadres = $state([]);
    let idanimal = $state("");
    let observacion = $state("");
    let totalNacimientosEncontrados = $state(0);
    //Validacion
    let malmadre = $state(false);
    let malpadre = $state(false);
    let malfecha = $state(false);
    let malcaravana = $state(false);
    let malsexo = $state(false);
    let botonhabilitado = $state(false);
    //Datos para la parte offline
    let lotes = $state([]);
    let rodeos = $state([]);
    function clickFilter() {
        isOpenFilter = !isOpenFilter;
    }
    function isEmpty(str) {
        return !str || str.length === 0;
    }
    async function getAnimales() {
        const recordsa = await pb.collection("animales").getFullList({
            filter: `active=true && cab='${cab.id}' && delete = false`,
            expand: "nacimiento",
        });
        animales = recordsa;
        madres = recordsa.filter((a) => a.sexo == "H" || a.sexo == "F");
        padres = recordsa.filter((a) => a.sexo == "M");
        cargadoanimales = true;
        listamadres = madres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });
        listapadres = padres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });
    }
    async function getNacimientos() {
        const recordsn = await pb.collection("nacimientosall").getFullList({
            filter: `cab='${cab.id}'`,
            sort: "-fecha",
            expand: "madre,padre",
        });
        nacimientos = recordsn;
        nacimientosrow = nacimientos;
    }
    async function guardarOffline() {
        if (agregaranimal) {
            let verificar = true;
            //let verificar = await verificarNivelOffline(animales.length,1)
            if (!verificar) {
                Swal.fire(
                    "Error guardar",
                    `No tienes el nivel de la cuenta para tener más animales`,
                    "error",
                );
                return;
            }
        }
        let idprov = "nuevo_nac_" + generarIDAleatorio();
        let idanimal = "nuevo_animal_" + generarIDAleatorio();

        try {
            let ms = madres.filter((ma) => ma.id == madre);

            let m = {
                id: "",
                nombremadre: "",
                rodeo: "",
                lote: "",
            };
            let lote = { id: "", nombre: "" };
            let rodeo = { id: "", nombre: "" };
            if (ms.length > 0) {
                m.id = ms[0].id;
                m.nombremadre = ms[0].caravana;
                m.lote = ms[0].lote;
                m.rodeo = ms[0].rodeo;
                let reslote = lotes.filter((l) => l.nombre == m.lote);
                let resrodeo = rodeos.filter((r) => r.nombre == m.rodeo);
                lote = reslote.length > 0 ? reslote[0] : lote;
                rodeo = resrodeo.length > 0 ? resrodeo[0] : rodeo;
            }
            let tipomadre = m.categoria;
            let esnuevopadre = padre.split("_").length > 1;
            let esnuevomadre = m.id.split("_").length > 1;
            let dataparicion = {
                madre: m.id,
                padre,
                fecha: fecha + " 03:00:00",
                nombremadre: m.nombremadre,
                nombrepadre,
                observacion,
                cab: caboff.id,
                id: idprov,
            };
            let futuroanimal = {
                id: "",
                caravana: "",
            };
            let comando = {
                tipo: "add",
                coleccion: "nacimientos",
                data: { ...dataparicion },
                hora: Date.now(),
                prioridad: 0,
                idprov,
                camposprov: `${esnuevomadre && esnuevopadre ? "madre,padre" : esnuevomadre ? "madre" : esnuevopadre ? "padre" : ""}`,
            };
            //Agrego el nacimiento
            comandos.push(comando);

            if (agregaranimal) {
                let dataanimal = {
                    caravana,
                    active: true,
                    delete: false,
                    fechanacimiento: fecha + " 03:00:00",
                    sexo,
                    cab: caboff.id,
                    peso,
                    lote: m.lote,
                    rodeo: m.rodeo,
                    nacimiento: idprov,
                    id: idanimal,
                };
                futuroanimal.id = dataanimal.id;
                futuroanimal.caravana = dataanimal.caravana;
                let nlote = m.lote.split("_").length > 1;
                let nrodeo = m.rodeo.split("_").length > 1;
                let comandoani = {
                    tipo: "add",
                    coleccion: "animales",
                    data: { ...dataanimal },
                    hora: Date.now(),
                    prioridad: 3,
                    idprov,
                    camposprov: `nacimiento${nlote & nrodeo ? ",lote,rodeo" : nlote ? ",lote" : nrodeo ? ",rodeo" : ""}`,
                };

                //Agrego el aniaml
                comandos.push(comandoani);
                dataanimal = {
                    ...dataanimal,
                    expand: {
                        lote: {
                            id: lote.id,
                            nombre: lote.nombre,
                        },
                        rodeo: {
                            id: rodeo.id,
                            nombre: rodeo.nombre,
                        },
                    },
                };
                animales.push(dataanimal);
                onChangeAnimal();
                filterUpdate();
                await setAnimalesSQL(db, animales);
            }
            await setComandosSQL(db, comandos);
            dataparicion = {
                ...dataparicion,
                caravana: futuroanimal.caravana,
                animalid: futuroanimal.id,
                expand: {
                    madre: {
                        caravana: dataparicion.nombremadre,
                    },
                    padre: {
                        caravana: dataparicion.nombrepadre,
                    },
                    cab: {
                        nombre: caboff.nombre,
                    },
                },
            };
            nacimientos.push(dataparicion);
            onChangeNacimiento();
            filterUpdate();
            await setNacimientosSQL(db, nacimientos);
            Swal.fire(
                "Éxito guardar",
                "Se pudo guardar el nacimiento con exito",
                "success",
            );
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error guardar",
                "Hubo un error para guardar el nacimiento",
                "error",
            );
        }
    }
    async function guardarOnline() {
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[4]) {
            Swal.fire("Error permisos", getPermisosMessage(4), "error");
            return;
        }
        if (agregaranimal) {
            if (!listapermisos[5]) {
                Swal.fire("Error permisos", getPermisosMessage(5), "error");
                return;
            }
            //let verificar = await verificarNivel(caboff.id)
            let verificar = true;
            if (!verificar) {
                Swal.fire(
                    "Error guardar",
                    `No tienes el nivel de la cuenta para tener más animales`,
                    "error",
                );
                return;
            }
        }
        try {
            let ms = madres.filter((ma) => ma.id == madre);
            let m = {
                id: "",
                nombremadre: "",
                rodeo: "",
                lote: "",
            };
            let lote = { id: "", nombre: "" };
            let rodeo = { id: "", nombre: "" };
            if (ms.length > 0) {
                m.id = ms[0].id;
                m.nombremadre = ms[0].caravana;
                m.lote = ms[0].lote;
                m.rodeo = ms[0].rodeo;
                let reslote = lotes.filter((l) => l.nombre == m.lote);
                let resrodeo = rodeos.filter((r) => r.nombre == m.rodeo);
                lote = reslote.length > 0 ? reslote[0] : lote;
                rodeo = resrodeo.length > 0 ? resrodeo[0] : rodeo;
            }
            let tipomadre = m.categoria;
            //Hace falta el expand
            let dataparicion = {
                madre: m.id,
                padre,
                fecha: fecha + " 03:00:00",
                nombremadre: m.nombremadre,
                nombrepadre,
                observacion,
                cab: caboff.id,
            };
            let recordparicion = await pb
                .collection("nacimientos")
                .create(dataparicion);
            let futuroanimal = {
                id: "",
                caravana: "",
            };
            if (agregaranimal) {
                let dataanimal = {
                    caravana,
                    active: true,
                    delete: false,
                    fechanacimiento: fecha + " 03:00:00",
                    sexo,
                    cab: cab.id,
                    peso,
                    lote: m.lote,
                    rodeo: m.rodeo,
                    nacimiento: recordparicion.id,
                };

                let recorda = await pb
                    .collection("animales")
                    .create(dataanimal);
                recorda = {
                    ...recorda,
                    expand: {
                        lote: {
                            id: lote.id,
                            nombre: lote.nombre,
                        },
                        rodeo: {
                            id: rodeo.id,
                            nombre: rodeo.nombre,
                        },
                    },
                };
                futuroanimal.id = recorda.id;
                futuroanimal.caravana = recorda.caravana;
                animales.push(recorda);
                onChangeAnimal();
                filterUpdate();
                await setAnimalesSQL(db, animales);
            }
            recordparicion = {
                ...recordparicion,
                caravana: futuroanimal.caravana,
                animalid: futuroanimal.id,
                expand: {
                    madre: {
                        caravana: dataparicion.nombremadre,
                    },
                    padre: {
                        caravana: dataparicion.nombrepadre,
                    },
                    cab: {
                        nombre: caboff.nombre,
                    },
                },
            };
            nacimientos.push(recordparicion);
            onChangeNacimiento();
            filterUpdate();
            await setNacimientosSQL(db, nacimientos);
            Swal.fire(
                "Éxito guardar",
                "Se pudo guardar el nacimiento con exito",
                "success",
            );
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error guardar",
                "Hubo un error para guardar el nacimiento",
                "error",
            );
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
        } else {
            await guardarOffline();
        }
    }
    async function editarOnline() {
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[4]) {
            Swal.fire("Error permisos", getPermisosMessage(4), "error");
            return;
        }
        let ms = madres.filter((ma) => ma.id == madre);
        let m = {
            id: "",
            nombremadre: "",
            rodeo: "",
            lote: "",
        };
        if (ms.length > 0) {
            m.id = ms[0].id;
            m.nombremadre = ms[0].caravana;
            m.lote = ms[0].lote;
            m.rodeo = ms[0].rodeo;
        }
        let datanimal = {
            fechanacimiento: fecha + " 03:00:00",
        };
        let dataparicion = {
            madre: m.id,
            padre,
            fecha: fecha + " 03:00:00",
            nombremadre: m.nombremadre,
            nombrepadre,
            observacion,
        };
        try {
            if (idanimal != "") {
                let a_idx = animales.findIndex((a) => a.id == idanimal);
                if (a_idx != -1) {
                    animales[a_idx] = {
                        ...animales[a_idx],
                        ...datanimal,
                    };
                    onChangeAnimal();
                    await setAnimalesSQL(db, animales);
                    await pb.collection("animales").update(idanimal, datanimal);
                } else {
                    if (modedebug) {
                        loger.addError({
                            time: Date.now(),
                            text: "no existe el nacimiento",
                        });
                    }
                }
            }

            await pb
                .collection("nacimientos")
                .update(idnacimiento, dataparicion);
            let n_idx = nacimientos.findIndex((n) => n.id == idnacimiento);
            if (n_idx != -1) {
                nacimientos[n_idx] = {
                    ...nacimientos[n_idx],
                    ...dataparicion,
                    expand: {
                        madre: {
                            caravana: dataparicion.nombremadre,
                        },
                        padre: {
                            caravana: dataparicion.nombrepadre,
                        },
                        cab: {
                            nombre: caboff.nombre,
                        },
                    },
                };
                await setNacimientosSQL(db, nacimientos);
            }
            Swal.fire(
                "Éxito editar",
                "Se pudo editar el nacimiento con exito",
                "success",
            );

            idnacimiento = "";
            caravana = "";
            sexo = "";
            padre = "";
            madre = "";
            nombremadre = "";
            nombrepadre = "";
            fecha = "";
            observacion = "";
            peso = "";
            idanimal = "";
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error editar",
                "Hubo un error para editar el nacimiento",
                "error",
            );
        }
    }
    async function editarOffline() {
        let ms = madres.filter((ma) => ma.id == madre);
        let m = {
            id: "",
            nombremadre: "",
            rodeo: "",
            lote: "",
        };
        if (ms.length > 0) {
            m.id = ms[0].id;
            m.nombremadre = ms[0].caravana;
            m.lote = ms[0].lote;
            m.rodeo = ms[0].rodeo;
        }
        let datanimal = {
            fechanacimiento: fecha + " 03:00:00",
        };

        let dataparicion = {
            madre: m.id,
            padre,
            fecha: fecha + " 03:00:00",
            nombremadre: m.nombremadre,
            nombrepadre,
            observacion,
        };
        try {
            let esnuevopadre = padre.split("_").length > 1;
            let esnuevomadre = m.id.split("_").length > 1;
            let nidx = nacimientos.findIndex((n) => n.id == idnacimiento);
            if (nidx != -1) {
                let comandonac = {
                    tipo: "update",
                    coleccion: "nacimientos",
                    data: { ...dataparicion },
                    hora: Date.now(),
                    prioridad: 0,
                    idprov: idnacimiento,
                    camposprov: `${esnuevomadre && esnuevopadre ? "madre,padre" : esnuevomadre ? "madre" : esnuevopadre ? "padre" : ""}`,
                };
                comandos.push(comandonac);
                nacimientos[nidx].madre = dataparicion.madre;
                nacimientos[nidx].padre = dataparicion.padre;
                nacimientos[nidx].fecha = dataparicion.fecha;
                nacimientos[nidx].nombremadre = dataparicion.nombremadre;
                nacimientos[nidx].nombrepadre = dataparicion.nombrepadre;
                nacimientos[nidx].observacion = dataparicion.observacion;

                await setComandosSQL(db, comandos);
                nacimientos[nidx].expand = {
                    madre: {
                        caravana: dataparicion.nombremadre,
                    },
                    padre: {
                        caravana: dataparicion.nombrepadre,
                    },
                    cab: {
                        nombre: caboff.nombre,
                    },
                };

                await setNacimientosSQL(db, nacimientos);
            }
            let aidx = animales.findIndex((a) => a.id == idanimal);
            if (aidx != -1) {
                let esnuevonacimiento = idnacimiento.split("_").length > 1;
                let comandoani = {
                    tipo: "update",
                    coleccion: "animales",
                    data: { ...datanimal },
                    hora: Date.now(),
                    prioridad: 0,
                    idprov: idanimal,
                    camposprov: `${esnuevonacimiento ? "nacimiento" : ""}`,
                };
                comandos.push(comandoani);
                await setComandosSQL(db, comandos);
                animales[aidx].fechanacimiento = datanimal.fechanacimiento;
                madres = animales.filter(
                    (a) =>
                        a.cab == caboff.id && (a.sexo == "H" || a.sexo == "F"),
                );
                padres = animales.filter(
                    (a) => a.cab == caboff.id && a.sexo == "M",
                );
                cargadoanimales = true;
                listamadres = madres.map((item) => {
                    return {
                        id: item.id,
                        nombre: item.caravana,
                    };
                });
                listapadres = padres.map((item) => {
                    return {
                        id: item.id,
                        nombre: item.caravana,
                    };
                });
                await setAnimalesSQL(db, animales);
            }

            Swal.fire(
                "Éxito editar",
                "Se pudo editar el nacimiento con exito",
                "success",
            );

            idnacimiento = "";
            caravana = "";
            sexo = "";
            padre = "";
            madre = "";
            nombremadre = "";
            nombrepadre = "";
            fecha = "";
            observacion = "";
            peso = "";
            idanimal = "";
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error editar",
                "Hubo un error para editar el nacimiento",
                "error",
            );
        }
    }
    //que podemos editar
    async function editar() {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        let isOnline = await getOnlyInternet();
        intermitenter.addIntermitente(isOnline);
        if (coninternet.connected) {
            await editarOnline();
        } else {
            await editarOffline();
        }
        onChangeNacimiento();
        filterUpdate();
    }
    function setFilters() {
        buscar = proxyfiltros.buscar;
        fechadesde = proxyfiltros.fechadesde;
        fechahasta = proxyfiltros.fechahasta;
        buscarmadre = proxyfiltros.buscarmadre;
        buscarpadre = proxyfiltros.buscarpadre;
    }

    function setProxyFilter() {
        proxyfiltros.buscar = buscar;
        proxyfiltros.fechadesde = fechadesde;
        proxyfiltros.fechahasta = fechahasta;
        proxyfiltros.buscarmadre = buscarmadre;
        proxyfiltros.buscarpadre = buscarpadre;
    }

    function limpiarFiltros() {
        proxyfiltros = { ...defaultfiltro };

        setFilters();
        filterUpdate();
    }
    function filterUpdate() {
        setProxyFilter();
        proxy.save(proxyfiltros);
        nacimientoscab.sort((n1, n2) =>
            new Date(n1.fecha) > new Date(n2.fecha) ? -1 : 1,
        );
        nacimientosrow = nacimientoscab;
        totalNacimientosEncontrados = nacimientosrow.length;
        if (buscar != "") {
            nacimientosrow = nacimientosrow.filter((n) =>
                n.caravana
                    .toLocaleLowerCase()
                    .includes(buscar.toLocaleLowerCase()),
            );
            totalNacimientosEncontrados = nacimientosrow.length;
        }
        if (fechadesde != "") {
            nacimientosrow = nacimientosrow.filter(
                (t) => t.fecha >= fechadesde,
            );
            totalNacimientosEncontrados = nacimientosrow.length;
        }
        if (fechahasta != "") {
            nacimientosrow = nacimientosrow.filter(
                (t) => t.fecha <= fechahasta,
            );
            totalNacimientosEncontrados = nacimientosrow.length;
        }
        if (buscarmadre != "") {
            nacimientosrow = nacimientosrow.filter((t) =>
                t.nombremadre
                    .toLocaleLowerCase()
                    .includes(buscarmadre.toLocaleLowerCase()),
            );
            totalNacimientosEncontrados = nacimientosrow.length;
        }
        if (buscarpadre != "") {
            nacimientosrow = nacimientosrow.filter((t) =>
            t.nombrepadre.length==0?
            false:    
            t.nombrepadre
                    .toLocaleLowerCase()
                    .includes(buscarpadre.toLocaleLowerCase()),
            );
            totalNacimientosEncontrados = nacimientosrow.length;
        }
    }
    function openNewModal() {
        idnacimiento = "";
        caravana = "";
        sexo = "";
        padre = "";
        madre = "";
        nombremadre = "";
        nombrepadre = "";
        fecha = "";
        observacion = "";
        peso = "";
        idanimal = "";
        botonhabilitado = false;
        malcaravana = false;
        malfecha = false;
        malmadre = false;
        malpadre = false;

        nuevoModal.showModal();
    }
    function cerrar() {
        nuevoModal.close();
    }
    function openEditModal(id) {
        botonhabilitado = true;
        malcaravana = false;
        malfecha = false;
        malmadre = false;
        malpadre = false;
        idnacimiento = id;

        nacimiento = nacimientos.filter((n) => n.id == id)[0];
        if (nacimiento.padre) {
            padre = nacimiento.padre;
            nombrepadre = nacimiento.nombrepadre;
        } else {
            padre = "";
        }
        if (nacimiento.madre) {
            madre = nacimiento.madre;
            nombremadre = nacimiento.nombremadre;
        } else {
            madre = "";
        }
        fecha = nacimiento.fecha.split(" ")[0];
        nombremadre = nacimiento.nombremadre;
        nombrepadre = nacimiento.nombrepadre;
        observacion = nacimiento.observacion;
        caravana = nacimiento.caravana;
        idanimal = nacimiento.animalid;
        nuevoModal.showModal();
    }
    function eliminarOnline() {
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[4]) {
            Swal.fire("Error permisos", getPermisosMessage(4), "error");
            return;
        }
        Swal.fire({
            title: "Eliminar nacimiento",
            text: "¿Seguro que deseas eliminar el nacimiento?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si",
            cancelButtonText: "No",
        }).then(async (result) => {
            if (result.value) {
                try {
                    await pb.collection("nacimientos").delete(idnacimiento);
                    nacimientos = nacimientos.filter(
                        (n) => n.id != idnacimiento,
                    );
                    await setNacimientosSQL(db, nacimientos);
                    if (idanimal != "") {
                        let a_idx = animales.findIndex((a) => a.id == idanimal);
                        if (a_idx != -1) {
                            animales[a_idx].nacimiento = "";
                            await setAnimalesSQL(db, animales);
                        } else {
                            if (modedebug) {
                                loger.addError({
                                    time: Date.now(),
                                    text: "No hay animal en eliminar",
                                });
                            }
                        }
                    }
                    onChangeNacimiento();
                    filterUpdate();
                    Swal.fire(
                        "Nacimiento eliminado!",
                        "Se eliminó el nacimiento correctamente.",
                        "success",
                    );
                } catch (e) {
                    Swal.fire(
                        "Acción cancelada",
                        "No se pudo eliminar al nacimiento",
                        "error",
                    );
                }
                idnacimiento = "";
                nacimiento = null;
            }
        });
    }
    function eliminarOffline() {
        Swal.fire({
            title: "Eliminar nacimiento",
            text: "¿Seguro que deseas eliminar el nacimiento?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si",
            cancelButtonText: "No",
        }).then(async (result) => {
            if (result.value) {
                try {
                    let n_idx = nacimientos.findIndex(
                        (n) => n.id == idnacimiento,
                    );
                    let n = { ...nacimientos[n_idx] };
                    let comando = {
                        tipo: "delete",
                        coleccion: "nacimientos",
                        data: { ...n },
                        hora: Date.now(),
                        prioridad: 0,
                        idprov: idnacimiento,
                        camposprov: "",
                    };

                    comandos.push(comando);
                    nacimientos = nacimientos.filter(
                        (n) => n.id != idnacimiento,
                    );
                    await setNacimientosSQL(db, nacimientos);
                    onChangeNacimiento();
                    filterUpdate();
                    if (idanimal != "") {
                        let a_idx = animales.findIndex((a) => a.id == idanimal);
                        if (a_idx != -1) {
                            animales[a_idx].nacimiento = "";
                            let dataanimal = animales[a_idx];
                            let esnuevonacimiento =
                                idnacimiento.split("_").length > 1;
                            let comandoani = {
                                tipo: "update",
                                coleccion: "animales",
                                data: { ...dataanimal },
                                hora: Date.now(),
                                prioridad: 0,
                                idprov: idanimal,
                                camposprov: `${esnuevonacimiento ? "nacimiento" : ""}`,
                            };
                            comandos.push(comandoani);
                            await setAnimalesSQL(db, animales);
                        } else {
                            if (modedebug) {
                                loger.addError({
                                    time: Date.now(),
                                    text: "No hay animal en eliminar",
                                });
                            }
                        }
                    }
                    await setComandosSQL(db, comandos);
                    Swal.fire(
                        "Nacimiento eliminado!",
                        "Se eliminó el nacimiento correctamente.",
                        "success",
                    );
                } catch (e) {
                    Swal.fire(
                        "Acción cancelada",
                        "No se pudo eliminar al nacimiento",
                        "error",
                    );
                }
                idnacimiento = "";
                nacimiento = null;
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
            eliminarOnline();
        } else {
            eliminarOffline();
        }
    }
    async function onMountOriginal() {
        let pb_json = await JSON.parse(localStorage.getItem("pocketbase_auth"));
        usuarioid = pb_json.record.id;
        await getNacimientos();
        filterUpdate();
        await getAnimales();
    }

    async function getLocalSQL() {
        let resanimales = await getAnimalesSQL(db);
        let resnacimientos = await getNacimientosSQL(db);
        let lotesrodeos = await getLotesRodeosSQL(db, caboff.id);
        lotes = lotesrodeos.lotes;
        rodeos = lotesrodeos.rodeos;
        animales = resanimales.lista;
        animalescab = resanimales.lista.filter((a) => a.cab == caboff.id);
        nacimientos = resnacimientos.lista;
        nacimientoscab = resnacimientos.lista.filter((a) => a.cab == caboff.id);
        madres = animalescab.filter((a) => a.sexo == "H" || a.sexo == "F");
        padres = animalescab.filter((a) => a.sexo == "M");
        cargadoanimales = true;
        listamadres = madres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });
        listapadres = padres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });
        filterUpdate();
        cargado = true;
    }
    async function updateLocalSQL() {
        await setUltimoNacimientosSQL(db);
        await setUltimoAnimalesSQL(db);
        await setUltimoRodeosLotesSQL(db);
        let lotesrodeos = await getUpdateLocalRodeosLotesSQLUser(
            db,
            pb,
            usuarioid,
            caboff.id,
        );
        lotes = lotesrodeos.lotes;
        rodeos = lotesrodeos.rodeos;
        animales = await updateLocalAnimalesSQLUser(db, pb, usuarioid);
        animalescab = animales.filter((a) => a.cab == caboff.id);
        nacimientos = await updateLocalNacimientosSQLUser(db, pb, usuarioid);
        nacimientoscab = nacimientos.filter((a) => a.cab == caboff.id);

        madres = animalescab.filter((a) => a.sexo == "H" || a.sexo == "F");
        padres = animalescab.filter((a) => a.sexo == "M");
        listamadres = madres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });
        listapadres = padres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });
        cargadoanimales = true;
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
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
    function onChangeNacimiento() {
        nacimientoscab = nacimientos.filter((n) => n.cab == caboff.id);
    }
    function onChangeAnimal() {
        animalescab = animales.filter((a) => a.cab == caboff.id);
    }
    async function updateComandos() {
        try {
            await flushComandosSQL(db, pb);
            comandos = [];
        } catch (err) {
            if (modedebug) {
                loger.addTextError(JSON.stringify(err), null, 2);
                loger.addTextError("Error en flush comandos nacimientos");
            }
        }
    }
    async function oldUpdate() {
        if (lastinter.internet == 0) {
            await setInternetSQL(db, 1, 0);
            await updateLocalSQL();
        } else {
            const cincoMinEnMs = ACTUALIZACION;
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
        ultimo_nacimiento = await getUltimoNacimientosSQL(db);
        comandos = rescom.lista;
        let ahora = Date.now();
        let antes = ultimo_nacimiento.ultimo;
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
    onMount(async () => {
        await initPage();
        await getDataSQL();
    });
    function onwriteMadre() {}
    function onwritePadre() {
        onchange("PADRE");
    }
    function onelegirMadre() {
        onchange("MADRE");
    }
    function onelegirPadre() {
        onchange("PADRE");
    }
    function cerrarModal() {
        idnacimiento = "";
        caravana = "";
        sexo = "";
        padre = "";
        madre = "";
        nombremadre = "";
        nombrepadre = "";
        fecha = "";
        observacion = "";
        peso = "";
        nuevoModal.close();
    }
    function getNombreMadre() {
        let m = madres.filter((item) => item.id == madre)[0];
        nombremadre = m.caravana;
        onchange("MADRE");
    }
    function getNombrePadre() {
        let p = padres.filter((item) => item.id == padre)[0];
        nombrepadre = p.caravana;
        onchange("PADRE");
    }
    function validarBoton() {
        botonhabilitado = true;
        if (isEmpty(fecha)) {
            botonhabilitado = false;
        }
        if (isEmpty(madre)) {
            botonhabilitado = false;
        }
    }
    function onchange(nombreCampo) {
        validarBoton();
        if (nombreCampo == "FECHA") {
            if (isEmpty(fecha)) {
                malfecha = true;
            } else {
                malfecha = false;
            }
        }
        if (nombreCampo == "MADRE") {
            if (isEmpty(madre)) {
                malmadre = true;
            } else {
                malmadre = false;
            }
        }
    }
    function prepararData(item) {
        return {
            CARAVANA: item.caravana,
            FECHA: new Date(item.fecha).toLocaleDateString(),
            MADRE: item.nombremadre,
            PADRE: item.nombrepadre,
            OBSERVACION: item.observacion,
        };
    }
</script>

{#if modedebug}
    <Barrainternet bind:coninternet />
{/if}
<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-3">
            <span>
                ultimo_nacimiento: {ultimo_nacimiento.ultimo}
            </span>
            <span>
                con internet: {coninternet.connected}
            </span>
            <span>
                get local: {getlocal}
            </span>
        </div>
    {/if}
    <div class="grid grid-cols-2 lg:grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Nacimientos</h1>
        </div>
        <div class="flex col-span-2 gap-1 justify-start">
            <div>
                <button
                    class={`btn flex btn-primary rounded-lg ${estilos.btntext}`}
                    data-theme="forest"
                    onclick={() => openNewModal()}
                >
                    <span class="text-xl">Nuevo</span>
                </button>
            </div>
            <div>
                <Exportar
                    titulo={"Nacimientos"}
                    filtros={[]}
                    confiltros={false}
                    data={nacimientosrow}
                    sheetname={"Nacimientos"}
                    establecimiento={cab.nombre}
                    {prepararData}
                />
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
                    bind:value={buscar}
                    oninput={filterUpdate}
                />
            </label>
        </div>
        <div class="w-11/12">
            <Limpiar
                {limpiarFiltros}
            />
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
            <span class="text-lg mx-1"
                >Total de nacimientos encontrados: {totalNacimientosEncontrados}</span
            >
        </div>
        {#if isOpenFilter}
            <div transition:slide>
                <div class="grid grid-cols-1 lg:grid-cols-2 mb-2 lg:mb-3 gap-1">
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
                            w-full md:w-1/2
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
                            w-full md:w-1/2
                                input input-bordered
                                ${estilos.bgdark2}
                            `}
                            bind:value={fechahasta}
                            onchange={filterUpdate}
                        />
                    </div>
                    <div>
                        <label for="nombremadre" class="label">
                            <span class="label-text text-base">Madre</span>
                        </label>
                        <label class="input-group md:w-1/2 md:flex">
                            <input
                                id="nombremadre"
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
                                bind:value={buscarmadre}
                                oninput={filterUpdate}
                            />
                        </label>
                    </div>
                    <div>
                        <label for="nombrepadre" class="label">
                            <span class="label-text text-base">Padre</span>
                        </label>
                        <label class="input-group md:w-1/2 md:flex">
                            <input
                                id="nombrepadre"
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
                                bind:value={buscarpadre}
                                oninput={filterUpdate}
                            />
                        </label>
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
                                class="text-base ml-3 pl-3 mr-1 pr-1 border-b dark:border-gray-600"
                                >Fecha</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >Caravana</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >Madre</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >Padre</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >Observacion</th
                            >
                        </tr>
                    </thead>
                    <tbody>
                        {#each nacimientosrow as n}
                            <tr
                                onclick={() => openEditModal(n.id)}
                                class="hover:bg-gray-200 dark:hover:bg-gray-900"
                            >
                                <td
                                    class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10"
                                    >{new Date(
                                        n.fecha,
                                    ).toLocaleDateString()}</td
                                >
                                <td class="text-base mx-1 px-1">
                                    {`${n.caravana}`}
                                </td>
                                <td class="text-base mx-1 px-1">
                                    {`${n.nombremadre}`}
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
                {#each nacimientosrow as n}
                    <div
                        class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                    >
                        <button onclick={() => openEditModal(n.id)}>
                            <div class="block p-4">
                                <div class="grid grid-cols-2 gap-y-2">
                                    <div class="flex items-start">
                                        <span>Fecha:</span>
                                        <span class="mx-1 font-semibold">
                                            {new Date(
                                                n.fecha,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div class="flex items-start">
                                        <span>Caravana:</span>
                                        <span class="mx-1 font-semibold">
                                            {`${n.caravana}`}
                                        </span>
                                    </div>
                                    <div class="flex items-start">
                                        <span>Madre:</span>
                                        <span class="mx-1 font-semibold">
                                            {`${n.nombremadre}`}
                                        </span>
                                    </div>
                                    <div class="flex items-start">
                                        <span>Padre:</span>
                                        <span class="mx-1 font-semibold">
                                            {`${n.nombrepadre}`}
                                        </span>
                                    </div>
                                    <div class="col-span-2 flex items-start">
                                        <span>{`${n.observacion}`}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
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
        {#if idnacimiento == ""}
            <h3 class="text-lg font-bold">Nuevo nacimiento</h3>
        {:else}
            <h3 class="text-lg font-bold">Ver nacimiento</h3>
        {/if}
        <div class="form-control">
            {#if idnacimiento == ""}
                <AgregarAnimal
                    bind:agregaranimal
                    bind:caravana
                    bind:categoria
                    bind:sexo
                    bind:peso
                    bind:fechanacimiento={fecha}
                    confechanac={true}
                />
            {:else if idanimal != ""}
                <label for="caravana" class="label">
                    <span class="label-text text-base">Caravana</span>
                </label>
                <label class="input-group">
                    <input
                        id="caravana"
                        type="text"
                        class={`input input-bordered w-full ${estilos.bgdark2}`}
                        value={caravana}
                    />
                </label>
            {/if}
            <label for="fechanacimiento" class="label">
                <span class={estilos.labelForm}>Fecha nacimiento</span>
            </label>
            <label class="input-group">
                <input
                    id="fechanacimiento"
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
                    onchange={() => onchange("FECHA")}
                />
                {#if malfecha}
                    <div class="label">
                        <span class="label-text-alt text-red-500"
                            >Debe seleccionar la fecha del nacimiento</span
                        >
                    </div>
                {/if}
            </label>
            {#if cargadoanimales}
                <PredictSelect
                    bind:valor={madre}
                    etiqueta={"Madre"}
                    bind:cadena={nombremadre}
                    lista={listamadres}
                    onelegir={onelegirMadre}
                    onwrite={onwriteMadre}
                />
                <PredictSelect
                    bind:valor={padre}
                    etiqueta={"Padre"}
                    bind:cadena={nombrepadre}
                    lista={listapadres}
                    onelegir={onelegirPadre}
                    onwrite={onwritePadre}
                />
            {/if}

            <label class="form-control">
                <div class="label">
                    <span class="label-text">Observacion</span>
                </div>
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
                    bind:value={observacion}
                />
            </label>
        </div>
        <div class="modal-action justify-start">
            <form method="dialog">
                <!-- if there is a button, it will close the modal -->
                {#if idnacimiento == ""}
                    <button
                        class="btn btn-success text-white"
                        disabled={!botonhabilitado}
                        onclick={guardar}>Guardar</button
                    >
                {:else}
                    <button
                        class="btn btn-success text-white"
                        disabled={!botonhabilitado}
                        onclick={editar}>Editar</button
                    >
                    <button class="btn btn-error text-white" onclick={eliminar}
                        >Eliminar</button
                    >
                {/if}
                <button class="btn btn-neutral" onclick={cerrar}>Cerrar</button>
            </form>
        </div>
    </div>
</dialog>

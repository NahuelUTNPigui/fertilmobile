<script>
    import { goto } from "$app/navigation";
    import Navbarr from "$lib/components/Navbarr.svelte";
    import Exportar from "$lib/components/Exportar.svelte";
    import PocketBase from "pocketbase";
    import { slide } from "svelte/transition";
    import Swal from "sweetalert2";
    import sexos from "$lib/stores/sexos";
    import { onMount } from "svelte";
    import { createCaber } from "$lib/stores/cab.svelte";
    import { createUserer } from "$lib/stores/user.svelte";
    import tiposanimal from "$lib/stores/tiposanimal";
    import permisos from "$lib/stores/permisos";
    import estilos from "$lib/stores/estilos";
    import { guardarHistorial } from "$lib/historial/lib";
    import {
        isEmpty,
        getWholeWordButLastLetter,
        addDays,
    } from "$lib/stringutil/lib";
    import MultipleToros from "$lib/components/MultipleToros.svelte";
    import PredictSelect from "$lib/components/PredictSelect.svelte";
    import { shorterWord } from "$lib/stringutil/lib";
    //FILTROS
    import { createStorageProxy } from "$lib/filtros/filtros";
    import Limpiar from "$lib/filtros/Limpiar.svelte";
    //actualizacion
    import {
        actualizacion,
        deboActualizar,
    } from "$lib/stores/offline/actualizar";
    import { customoffliner } from "$lib/stores/offline/custom.svelte";
    import { intermitenter } from "$lib/stores/offline/intermitencia.svelte";
    import { velocidader } from "$lib/stores/offline/velocidad.svelte";
    //Offline
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
    } from "$lib/stores/capacitor/offlinecab";
    import {
        getInternetSQL,
        setInternetSQL,
    } from "$lib/stores/sqlite/dbinternet";
    //permisos
    import { verificarNivel, getPermisosList } from "$lib/permisosutil/lib";
    import { updatePermisos } from "$lib/stores/capacitor/offlinecab";
    import {
        getServiciosSQL,
        getInseminacionesSQL,
        updateLocalInseminacionesSQL,
        updateLocalInseminacionesSQLUser,
        updateLocalServiciosSQL,
        updateLocalServiciosSQLUser,
        setServiciosSQL,
        setInseminacionesSQL,
        getUltimoServiciosSQL,
        setUltimoServiciosSQL,
    } from "$lib/stores/sqlite/dbeventos";
    import {
        addNewAnimalSQL,
        getAnimalesSQL,
        updateLocalAnimalesSQL,
        updateLocalAnimalesSQLUser,
        updateLocalHistorialAnimalesSQLUser,
        setUltimoAnimalesSQL,
    } from "$lib/stores/sqlite/dbanimales";
    import {
        getComandosSQL,
        setComandosSQL,
        flushComandosSQL,
    } from "$lib/stores/sqlite/dbcomandos";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    import Info from "$lib/components/toast/Info.svelte";
    import Nube from "$lib/components/toast/Nube.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    let ruta = import.meta.env.VITE_RUTA;
    let pre = "";

    //offline
    let infotoast = $state(false);
    let nubetoast = $state(false);
    
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({ connected: false });
    let ultimo_servicio = $state({});
    let comandos = $state([]);
    let getlocal = $state(false);
    let getvelocidad = $state(0);
    let getactualizacion = $state(0);
    let getpermisos = $state("");
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let caber = createCaber();
    let userer = createUserer();
    let cab = caber.cab;
    let caravana = $state("");
    let cargado = $state(false);
    let esservicio = $state(false);
    let esinseminacion = $state(false);

    let opcionservicio = [
        { id: 0, nombre: "Todos" },
        { id: 1, nombre: "Solo servicios" },
        { id: 2, nombre: "Solo inseminaciones" },
    ];
    // Datos para mostrar
    let inseminaciones = $state([]);
    let inseminacionescab = $state([]);
    let totalInseminacionesEncontradas = $state(0);
    //Datos inseminaciones
    let idins = $state("");
    let listapadres = $state([]);
    // La inseminacion es a un animal hembra que luego sera un nacimiento
    let padre = $state("");
    let pajuela = $state("");
    //Seria la fecha del parto
    //Datos de la inseminacion
    let categoria = $state("");
    let fechainseminacion = $state("");
    // Datos para mostrar
    let servicios = $state([]);
    let servicioscab = $state([]);
    let serviciosrow = $state([]);

    let isOpenFilter = $state(false);
    let totalServicios = $state(0);
    //Validaciones
    let malanimal = $state(false);
    let malpadre = $state(false);
    let malfechainseminacion = $state(false);
    let malfechaparto = $state(false);
    //SERVICIO
    //Datos servicios
    let idserv = $state("");
    let padreslist = $state([]);
    let padresserv = $state("");
    let pajuelasserv = $state("");
    //Seria la fecha del parto
    let fechaparto = $state("");
    let fechadesdeserv = $state("");
    let fechahastaserv = $state("");
    let madre = $state("");
    let observacion = $state("");
    //Filtro de serv
    let buscar = $state("");
    let fechaservhastafiltro = $state("");
    let fechaservdesdefiltro = $state("");
    let fechapartodesde = $state("");
    let fechapartohasta = $state("");
    let buscarpadre = $state("");
    let filtroservicio = $state(0);
    let defaultfiltro = {
        buscar: "",
        fechaservhastafiltro: "",
        fechaservdesdefiltro: "",
        fechapartodesde: "",
        fechapartohasta: "",
        buscarpadre: "",
        filtroservicio: 0,
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("listaservicios", defaultfiltro);

    let madres = $state([]);
    let padres = $state([]);
    let idanimal = $state("");
    //Validaciones
    let botonhabilitado = $state(true);

    function clickFilter() {
        isOpenFilter = !isOpenFilter;
    }
    function limpiarPadres(serpadres){
        let padresnotransferidos = []
        for(let i = 0;i<serpadres.length;i++){
            let valor = serpadres[i]
            let lista_padres =  padres.filter((p) => p.id == valor).map(p=>p.id)
            if(lista_padres.length>0){
                padresnotransferidos = padresnotransferidos.concat(lista_padres)
            }
            
        }
        return padresnotransferidos
    }
    function openEditModal(id) {
        esservicio = true;
        idserv = id;
        let ser = servicios.filter((s) => s.id == id)[0];
        if (ser) {
            madre = ser.madre;
            fechadesdeserv = ser.fechadesde.split(" ")[0];
            fechahastaserv = ser.fechahasta.split(" ")[0];
            fechaparto = ser.fechaparto.split(" ")[0];
            observacion = ser.observacion;
            padreslist = limpiarPadres(ser.padres.split(","));
            nuevoModal.showModal();
        }
    }
    function openEditModalIns(id) {
        esinseminacion = true;
        idserv = id;

        let ser = serviciosrow.filter((s) => s.id == id)[0];

        if (ser) {
            idanimal = ser.animal;
            fechainseminacion = ser.fechainseminacion.split(" ")[0];
            padre = ser.padre;
            pajuela = ser.pajuela;
            fechaparto = ser.fechaparto.split(" ")[0];
            observacion = ser.observacion;
            categoria = ser.categoria;
            nuevoModalIns.showModal();
        }
    }
    async function editarOnline() {
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
            try {
                let dataser = {
                    fechadesde: fechadesdeserv + " 03:00:00",
                    fechahasta: fechahastaserv + " 03:00:00",
                    fechaparto: fechaparto + " 03:00:00",
                    observacion,
                    padres: padreslist.join(),
                };
                if (fechahastaserv != "") {
                    dataser.fechahasta = fechahastaserv + " 03:00:00";
                }
                let s_idx = servicios.findIndex((s) => s.id == idserv);
                servicios[s_idx].fechadesde = dataser.fechadesde;
                servicios[s_idx].fechahasta = dataser.fechahasta;
                servicios[s_idx].fechaparto = dataser.fechaparto;
                servicios[s_idx].observacion = dataser.observacion;
                servicios[s_idx].padres = dataser.padres;
                await pb.collection("servicios").update(idserv, dataser);
                await setServiciosSQL(db, servicios);
                esservicio = false;
                Swal.fire(
                    "Éxito editar",
                    "Se pudo editar el servicio con exito",
                    "success",
                );
            } catch (err) {
                esservicio = false;
                Swal.fire(
                    "Error editar",
                    "No se pudo editar el servicio con exito",
                    "success",
                );
                console.error(err);
            }
        }
        if (esinseminacion) {
            try {
                let data = {
                    fechaparto: fechaparto + " 03:00:00",
                    fechainseminacion: fechainseminacion + " 03:00:00",
                    padre,
                    pajuela,
                    observacion,
                    categoria,
                };
                let idx = inseminaciones.findIndex((ins) => ins.id == idserv);

                inseminaciones[idx].fechaparto = data.fechaparto;
                inseminaciones[idx].fechainseminacion = data.fechainseminacion;
                inseminaciones[idx].padre = data.padre;
                inseminaciones[idx].pajuela = data.pajuela;
                inseminaciones[idx].observacion = data.observacion;
                inseminaciones[idx].categoria = data.categoria;

                await pb.collection("inseminacion").update(idserv, data);
                await setInseminacionesSQL(db, inseminaciones);

                Swal.fire(
                    "Éxito editar",
                    "Se pudo editar la inseminación con exito",
                    "success",
                );
                esinseminacion = false;
            } catch (err) {
                console.error(err);
                esinseminacion = false;
                Swal.fire(
                    "Error editar",
                    "Hubo un error para editar la inseminación",
                    "error",
                );
            }
        }
    }
    async function editarOffline() {
        if (esservicio) {
            try {
                let dataser = {
                    fechadesde: fechadesdeserv + " 03:00:00",
                    fechahasta: fechahastaserv + " 03:00:00",
                    fechaparto: fechaparto + " 03:00:00",
                    observacion: observacion,
                    madre: madre,
                    padres: padreslist.join(),
                };
                let sidx = servicios.findIndex((s) => s.id == idserv);
                if (sidx != -1) {
                    servicios[sidx].fechadesde = dataser.fechadesde;
                    servicios[sidx].fechahasta = dataser.fechahasta;
                    servicios[sidx].fechaparto = dataser.fechaparto;
                    servicios[sidx].observacion = dataser.observacion;
                    servicios[sidx].madre = dataser.madre;
                    servicios[sidx].padres = dataser.padres;
                    if (fechahastaserv != "") {
                        dataser.fechahasta = fechahastaserv + " 03:00:00";
                        servicios[sidx].fechahasta = dataser.fechahasta;
                    }
                    await setServiciosSQL(db, servicios);
                    let nuevamadre = dataser.madre.split("_").length > 1;
                    let nuevopadre = dataser.padres.split("_").length > 1;
                   
                    let comando = {
                        tipo: "update",
                        coleccion: "servicios",
                        data: { ...dataser },
                        hora: Date.now(),
                        prioridad: 0,
                        idprov: idserv,
                        camposprov: `${nuevamadre && nuevopadre ? "madre,padres" : nuevamadre ? "madre" : nuevopadre ? "padres" : ""}`,
                        show:{...dataser},
                        motivo:"Editar servicio"
                    };
                    comandos.push(comando);
                    await setComandosSQL(db, comandos);
                    Swal.fire(
                        "Éxito editar",
                        "Se pudo editar el servicio con exito",
                        "success",
                    );
                }

                esservicio = false;
            } catch (err) {
                esservicio = false;
                Swal.fire(
                    "Error editar",
                    "No se pudo editar el servicio con exito",
                    "success",
                );
                console.error(err);
            }
        }
        if (esinseminacion) {
            try {
                let data = {
                    fechaparto: fechaparto + " 03:00:00",
                    fechainseminacion: fechainseminacion + " 03:00:00",
                    padre,
                    pajuela,
                    observacion,
                    categoria,
                };
                let idx = inseminaciones.findIndex((ins) => ins.id == idserv);
                if (idx != -1) {
                    inseminaciones[idx].fechaparto = data.fechaparto;
                    inseminaciones[idx].fechainseminacion = data.fechainseminacion;
                    inseminaciones[idx].padre = data.padre;
                    inseminaciones[idx].pajuela = data.pajuela;
                    inseminaciones[idx].observacion = data.observacion;
                    inseminaciones[idx].categoria = data.categoria;
                    await setInseminacionesSQL(db, inseminaciones);
                    
                    let nuevamadre = inseminaciones[idx].animal.split("_").length > 1;
                    
                    let nuevopadre = data.padre.split("_").length > 1;
                    
                    let comando = {
                        tipo: "update",
                        coleccion: "inseminacion",
                        data: { ...data },
                        hora: Date.now(),
                        prioridad: 0,
                        idprov: idserv,
                        camposprov: `${nuevamadre && nuevopadre ? "madre,padre" : nuevamadre ? "madre" : nuevopadre ? "padre" : ""}`,
                        show:{...data},
                        motivo:"Editar inseminación"

                    };
                    comandos.push(comando);
                    await setComandosSQL(db, comandos);
                }

                Swal.fire(
                    "Éxito editar",
                    "Se pudo editar la inseminación con exito",
                    "success",
                );
                esinseminacion = false;
            } catch (err) {
                console.error(err);
                esinseminacion = false;
                Swal.fire(
                    "Error editar",
                    "Hubo un error para editar la inseminación",
                    "error",
                );
            }
        }
    }
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
        onChangeInseminaciones();
        onChangeServicios();
        filterUpdate();
    }
    //Aca va el offline
    async function eliminarOffline(id, esInseminacion) {
        if (!esInseminacion) {
            try {
                let eliminarservicio = servicios.filter((s) => s.id == id)[0];
                
                servicios = servicios.filter((s) => s.id != id);
                await setServiciosSQL(db, servicios);
                let comando = {
                    tipo: "update",
                    coleccion: "servicios",
                    data: { active: false },
                    hora: Date.now(),
                    prioridad: 0,
                    idprov: id,
                    camposprov: "",
                    show:{...eliminarservicio},
                    motivo:"Eliminar servicio"
                    
                };
                comandos.push(comando);
                await setComandosSQL(db, comandos);
                Swal.fire(
                    "Éxito eliminar",
                    "Se eliminó con éxito el servicio",
                    "success",
                );
            } catch (err) {
                console.error(err);
            }
        } else {
            try {
                let eliminarinseminacion = inseminaciones.filter((s) => s.id == id)[0]
                
                inseminaciones = inseminaciones.filter((s) => s.id != id);
                await setInseminacionesSQL(db, inseminaciones);
                let comando = {
                    tipo: "update",
                    coleccion: "inseminacion",
                    data: { active: false },
                    hora: Date.now(),
                    prioridad: 0,
                    idprov: id,
                    camposprov: "",
                    show:{...eliminarinseminacion},
                    motivo:"Eliminar inseminación"
                };
                comandos.push(comando);
                await setComandosSQL(db, comandos);
                Swal.fire(
                    "Éxito eliminar",
                    "Se eliminó con éxito la inseminación",
                    "success",
                );
            } catch (err) {
                console.error(err);
            }
        }
    }
    async function eliminarOnline(id, esInseminacion) {
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
        if (!esInseminacion) {
            try {
                await pb.collection("servicios").update(id, { active: false });
                servicios = servicios.filter((s) => s.id != id);
                await setServiciosSQL(db,servicios)
                Swal.fire(
                    "Éxito eliminar",
                    "Se eliminó con éxito el servicio",
                    "success",
                );
            } catch (err) {
                console.error(err);
            }
        } else {
            try {
                await pb
                    .collection("inseminacion")
                    .update(id, { active: false });
                inseminaciones = inseminaciones.filter((s) => s.id != id);
                await setInseminacionesSQL(db,inseminaciones)
                Swal.fire(
                    "Éxito eliminar",
                    "Se eliminó con éxito la inseminación",
                    "success",
                );
            } catch (err) {
                console.error(err);
            }
        }
    }
    async function eliminar(id, esInseminacion) {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        let isOnline = await getOnlyInternet();
        intermitenter.addIntermitente(isOnline);
        if (coninternet.connected) {
            await eliminarOnline(id, esInseminacion);
        } else {
            await eliminarOffline(id, esInseminacion);
        }
        onChangeInseminaciones();
        onChangeServicios();
        filterUpdate();
    }
    function cerrarModal() {
        madre = "";
        fechadesdeserv = "";
        fechahastaserv = "";
        fechaparto = "";
        observacion = "";
        padreslist = [];
        nuevoModal.close();
    }
    async function getInseminaciones() {
        // you can also fetch all records at once via getFullList
        const records = await pb.collection("inseminacion").getFullList({
            sort: "-fechainseminacion ",
            filter: `cab = '${cab.id}' && active = true`,
            expand: "animal",
        });
        inseminaciones = records;
        //inseminacionesrow = inseminaciones
    }
    async function getServicios() {
        const records = await pb.collection("servicios").getFullList({
            sort: "-fechadesde ",
            filter: `cab = '${cab.id}' && active = true`,
            expand: "madre",
        });
        servicios = records;
        serviciosrow = servicios;
    }
    async function getAnimales() {
        const recordsa = await pb.collection("animales").getFullList({
            filter: `active=true && cab='${cab.id}' && delete=False`,
        });
        madres = recordsa.filter((a) => a.sexo == "H" || a.sexo == "F");
        padres = recordsa.filter((a) => a.sexo == "M");
        listapadres = padres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });
        cargado = true;
    }
    function onChangeInseminaciones() {
        inseminacionescab = inseminaciones.filter((s) => s.cab == caboff.id);
    }
    function onChangeServicios() {
        servicioscab = servicios.filter((s) => s.cab == caboff.id);
    }
    function validarBoton() {}
    function oninput(campo) {}
    function onelegir(id) {}
    function onwrite() {}

    function setFilters() {
        buscar = proxyfiltros.buscar;
        fechaservhastafiltro = proxyfiltros.fechaservhastafiltro;
        fechaservdesdefiltro = proxyfiltros.fechaservdesdefiltro;
        fechapartodesde = proxyfiltros.fechapartodesde;
        fechapartohasta = proxyfiltros.fechapartohasta;
        buscarpadre = proxyfiltros.buscarpadre;
        filtroservicio = proxyfiltros.filtroservicio;
    }

    function setProxyFilter() {
        proxyfiltros.buscar = buscar;
        proxyfiltros.fechaservhastafiltro = fechaservhastafiltro;
        proxyfiltros.fechaservdesdefiltro = fechaservdesdefiltro;
        proxyfiltros.fechapartodesde = fechapartodesde;
        proxyfiltros.fechapartohasta = fechapartohasta;
        proxyfiltros.buscarpadre = buscarpadre;
        proxyfiltros.filtroservicio = filtroservicio;
    }

    function limpiarFiltros() {
        proxyfiltros = { ...defaultfiltro };

        setFilters();
        filterUpdate();
    }

    function filterUpdate() {
        setProxyFilter();
        proxy.save(proxyfiltros);
        serviciosrow = [];

        if (filtroservicio == 0) {
            serviciosrow = servicioscab;
            serviciosrow = serviciosrow.concat(inseminacionescab);
        } else if (filtroservicio == 1) {
            serviciosrow = servicioscab;
        } else {
            serviciosrow = inseminacionescab;
        }
        if (fechaservdesdefiltro != "") {
            serviciosrow = serviciosrow.filter((s) => {
                let f = s.fechadesde
                    ? s.fechadesde
                    : s.fechainseminacion
                      ? s.fechainseminacion
                      : "";
                return f >= fechaservdesdefiltro;
            });
        }
        if (fechaservhastafiltro != "") {
            serviciosrow = serviciosrow.filter((s) => {
                let f = s.fechadesde
                    ? s.fechadesde
                    : s.fechainseminacion
                      ? s.fechainseminacion
                      : "";
                return f <= fechaservhastafiltro;
            });
        }
        if (fechapartodesde != "") {
            serviciosrow = serviciosrow.filter((s) => {
                let f = s.fechaparto;
                return f >= fechapartodesde;
            });
        }
        if (fechapartohasta != "") {
            serviciosrow = serviciosrow.filter((s) => {
                let f = s.fechaparto;
                return f <= fechapartohasta;
            });
        }
        if (buscarpadre != "") {
            serviciosrow = serviciosrow.filter((s) => {
                let s_padres = s.fechadesde
                    ? getNombrePadres(s.padres).split(",")
                    : [s.pajuela];
                return incluidoPadre(buscarpadre, s_padres);
            });
        }
        if (buscar != "") {
            serviciosrow = serviciosrow.filter((s) => {
                return s.fechadesde
                    ? s.expand.madre.caravana
                          .toLocaleLowerCase()
                          .includes(buscar.toLocaleLowerCase())
                    : s.expand.animal.caravana
                          .toLocaleLowerCase()
                          .includes(buscar.toLocaleLowerCase());
            });
        }

        ordenarServicios(forma);
        totalServicios = serviciosrow.length;
    }
    function prepararData(item) {
        return {
            FECHA: item.fechadesde
                ? new Date(item.fechadesde).toLocaleDateString()
                : item.fechainseminacion
                  ? new Date(item.fechainseminacion).toLocaleDateString()
                  : "",
            FECHA_HASTA: item.fechahasta
                ? new Date(item.fechahasta).toLocaleDateString()
                : "",
            MADRE: item.fechadesde
                ? item.expand.madre.caravana
                : item.expand.animal.caravana,
            PADRES: item.fechadesde
                ? getNombrePadres(item.padres)
                : item.pajuela,
            FECHA_PARTO: item.fechaparto
                ? new Date(item.fechaparto).toLocaleDateString()
                : "",
            OBSERVACION: item.observacion,
            TIPO: item.fechadesde ? "Servicio" : "Artificial",
        };
    }
    function getNombrePadre(valor){
        let lista_padre = padres.filter((p) => p.id == valor)
        if(lista_padre.length>0){
            return lista_padre[0].caravana
        }
        else{
            return "Transferido"
        }
        

    }
    function getNombrePadres(p_padres) {
        let ids = p_padres.split(",");

        let nombres = ids.reduce(
            (acc, valor) =>
                getNombrePadre(valor) + " , " + acc,
            "",
        );

        return getWholeWordButLastLetter(nombres);
    }

    async function onMountOriginal() {
        await getAnimales();
        await getServicios();
        await getInseminaciones();
        filterUpdate();
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
    async function updateLocalSQL() {
        
        let animales = await updateLocalAnimalesSQLUser(db, pb, usuarioid);
        await setUltimoAnimalesSQL(db);
        await setUltimoServiciosSQL(db);
        animales = animales.filter((a) => a.active && a.cab == caboff.id);
        madres = animales.filter((a) => a.sexo == "H" || a.sexo == "F");
        padres = animales.filter((a) => a.sexo == "M");
        listapadres = padres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });

        servicios = await updateLocalServiciosSQLUser(db, pb, usuarioid);

        inseminaciones = await updateLocalInseminacionesSQLUser(
            db,
            pb,
            usuarioid,
        );

        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
        onChangeServicios();
        onChangeInseminaciones();
        filterUpdate();
        cargado = true;
    }
    async function getLocalSQL() {
        getlocal = true;
        let resanimales = await getAnimalesSQL(db);
        let animales = resanimales.lista;
        animales = animales.filter((a) => a.active && a.cab == caboff.id);
        madres = animales.filter((a) => a.sexo == "H" || a.sexo == "F");
        padres = animales.filter((a) => a.sexo == "M");
        listapadres = padres.map((item) => {
            return {
                id: item.id,
                nombre: item.caravana,
            };
        });

        let resservicios = await getServiciosSQL(db);

        servicios = resservicios.lista;

        
        let resinseminaciones = await getInseminacionesSQL(db);
        inseminaciones = resinseminaciones.lista;

        onChangeServicios();

        onChangeInseminaciones();
        filterUpdate();
        cargado = true;
    }
    async function actualizarComandos() {
        try {
            await flushComandosSQL(db, pb);
            comandos = [];
        } catch (err) {
            if (modedebug) {
                loger.addTextError(JSON.stringify(err), null, 2);
                loger.addTextError("Error en flush comandos servicios");
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
        ultimo_servicio = await getUltimoServiciosSQL(db);
        comandos = rescom.lista;
        let ahora = Date.now();
        let antes = ultimo_servicio.ultimo;
        await getLocalSQL();
        if (coninternet.connected) {
            await actualizarComandos();
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
                nubetoast=true
                setTimeout(async () => {
                    try {
                        await updateLocalSQL();
                        // Notificar cambios solo si hay diferencias
                        nubetoast=false
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
    //Para los ordenar
    let ascendente = $state(false);
    let forma = $state("fecha");
    let selectforma = $state("fecha");

    //Ordenar servicios
    function ordenarServiciosDescendente(p_forma) {
        let escalar = 1;
        if (!ascendente) {
            escalar = -1;
        }
        forma = p_forma;
        if (forma == "fecha") {
            serviciosrow.sort((a1, a2) => {
                let f1 = a1.fechadesde
                    ? a1.fechadesde
                    : a1.fechainseminacion
                      ? a1.fechainseminacion
                      : "";
                let f2 = a2.fechadesde
                    ? a2.fechadesde
                    : a2.fechainseminacion
                      ? a2.fechainseminacion
                      : "";
                let salida = new Date(f1) < new Date(f2) ? -1 : 1;
                return escalar * salida;
            });
        } else if (forma == "fechaparto") {
            serviciosrow.sort((a1, a2) => {
                let f1 = a1.fechaparto;
                let f2 = a2.fechaparto;
                let salida = new Date(f1) < new Date(f2) ? -1 : 1;
                return escalar * salida;
            });
        } else if (forma == "madre") {
            serviciosrow.sort((a1, a2) => {
                let m1 = a1.fechadesde
                    ? a1.expand.madre.caravana
                    : a1.expand.animal.caravana;
                let m2 = a2.fechadesde
                    ? a2.expand.madre.caravana
                    : a2.expand.animal.caravana;
                return escalar * m1.localeCompare(m2);
            });
        } else if (forma == "tipo") {
            serviciosrow.sort((a1, a2) => {
                let t1 = a1.fechadesde ? 1 : 0;
                let t2 = a2.fechadesde ? 1 : 0;
                return escalar * (t1 < t2 ? -1 : 1);
            });
        }
    }
    function ordenarServicios(p_forma) {
        //if(p_forma == forma){
        //    ascendente = !ascendente
        //
        //}
        //else{
        //    ascendente = false
        //}
        ordenarServiciosDescendente(p_forma);
    }
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
                    internet {ultimo_servicio.ultimo}
                </span>
            </div>
            <div>
                <span>
                    get local{getlocal}
                </span>
            </div>
            <div class="">
                <button class="btn" onclick={() => ordenarServicios("fecha")}
                    >Ordenar por fecha</button
                >
            </div>
        </div>
    {/if}
    <div class="grid grid-cols-1 lg:grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Servicios</h1>
        </div>
        <div class="flex col-span-2 gap-1 justify-start lg:justify-end">
            <div>
                <button
                    class={`btn btn-primary rounded-lg ${estilos.btntext}`}
                    data-theme="forest"
                    onclick={() => goto("/servicios/movimiento")}
                >
                    <span class="text-lg">Nuevos</span>
                </button>
            </div>
            <div>
                <Exportar
                    titulo={"Servicios"}
                    filtros={[]}
                    confiltros={false}
                    data={serviciosrow}
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
                >Total de servicios encontrados: {totalServicios}</span
            >
        </div>
        {#if isOpenFilter}
            <div transition:slide>
                <div class="grid grid-cols-2 lg:grid-cols-4">
                    <div class="">
                        <label
                            class="block tracking-wide text-base font-medium mb-2"
                            for="grid-first-name"
                        >
                            Servicio desde
                        </label>
                        <input
                            id="fechainseminaciondesde"
                            type="date"
                            class={`
                            w-full md:w-1/2
                                input input-bordered
                                ${estilos.bgdark2}
                            `}
                            bind:value={fechaservdesdefiltro}
                            onchange={filterUpdate}
                        />
                    </div>
                    <div class="">
                        <label
                            class="block tracking-wide text-base font-medium mb-2"
                            for="grid-first-name"
                        >
                            Servicio hasta
                        </label>
                        <input
                            id="fechainseminacionhasta"
                            type="date"
                            class={`
                            w-full md:w-1/2
                                input input-bordered
                                ${estilos.bgdark2}
                            `}
                            bind:value={fechaservhastafiltro}
                            onchange={filterUpdate}
                        />
                    </div>
                    <div class="">
                        <label
                            class="block tracking-wide text-base font-medium mb-2"
                            for="grid-first-name"
                        >
                            Parto desde
                        </label>
                        <input
                            id="fechainseminaciondesde"
                            type="date"
                            class={`
                            w-full md:w-1/2
                                input input-bordered
                                ${estilos.bgdark2}
                            `}
                            bind:value={fechapartodesde}
                            onchange={filterUpdate}
                        />
                    </div>
                    <div class="">
                        <label
                            class="block tracking-wide text-base font-medium mb-2"
                            for="grid-first-name"
                        >
                            Parto hasta
                        </label>
                        <input
                            id="fechainseminacionhasta"
                            type="date"
                            class={`
                            w-full md:w-1/2
                                input input-bordered
                                ${estilos.bgdark2}
                            `}
                            onchange={filterUpdate}
                            bind:value={fechapartohasta}
                        />
                    </div>
                    <div class="">
                        <label for="tiposer" class="tracking-wide label">
                            <span class="label-text text-base"
                                >Tipo servicio</span
                            >
                        </label>
                        <label class="input-group">
                            <select
                                class={`
                                    select select-bordered
                                    rounded-md
                                    focus:outline-none focus:ring-2 
                                    focus:ring-green-500 
                                    focus:border-green-500
                                    ${estilos.bgdark2}
                                `}
                                bind:value={filtroservicio}
                                onchange={filterUpdate}
                            >
                                {#each opcionservicio as s}
                                    <option value={s.id}>{s.nombre}</option>
                                {/each}
                            </select>
                        </label>
                    </div>
                    <div class="">
                        <label for="nombrepadre" class="label">
                            <span class="label-text text-base">Pajuela</span>
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
                                >Fecha Hasta</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >Fecha Parto</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >Madre</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >Padres</th
                            >
                            <th
                                class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >Tipo</th
                            >
                        </tr>
                    </thead>
                    <tbody>
                        {#each serviciosrow as s}
                            <tr
                                class="hover:bg-gray-200 dark:hover:bg-gray-900"
                                onclick={() =>
                                    s.fechadesde
                                        ? openEditModal(s.id)
                                        : openEditModalIns(s.id)}
                            >
                                <td
                                    class="text-base ml-3 pl-3 mr-1 pr-1 border-b dark:border-gray-600"
                                >
                                    {s.fechadesde
                                        ? new Date(
                                              s.fechadesde,
                                          ).toLocaleDateString()
                                        : s.fechainseminacion
                                          ? new Date(
                                                s.fechainseminacion,
                                            ).toLocaleDateString()
                                          : ""}
                                </td>
                                <td
                                    class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                    >{s.fechahasta
                                        ? new Date(
                                              s.fechahasta,
                                          ).toLocaleDateString()
                                        : ""}</td
                                >
                                <td
                                    class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                    >{s.fechaparto
                                        ? new Date(
                                              s.fechaparto,
                                          ).toLocaleDateString()
                                        : ""}</td
                                >
                                
                                <td
                                    class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >
                                    {s.fechadesde
                                        ? shorterWord(s.expand.madre.caravana?s.expand.madre.caravana:"")
                                        : shorterWord(s.expand.animal.caravana?s.expand.animal.caravana:"")}
                                </td>
                                
                                <td
                                    class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >
                                    {s.fechadesde
                                        ? getNombrePadres(s.padres)
                                        : s.pajuela}
                                </td>
                                <td
                                    class="text-base mx-1 px-1 border-b dark:border-gray-600"
                                >
                                    {s.fechadesde ? "Natural" : "Artificial"}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <div class="block w-full md:hidden justify-items-center mx-1">
                {#each serviciosrow as s}
                    
                    <div
                        class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                    >
                        <button
                            onclick={() =>
                                s.fechadesde
                                    ? openEditModal(s.id)
                                    : openEditModalIns(s.id)}
                        >
                            <div class="block p-4">
                                <div class="grid grid-cols-2 gap-y-2">
                                    <div class="flex items-start">
                                        <span>Tipo:</span>
                                        <span class="mx-1 font-semibold">
                                            {s.fechadesde
                                                ? "Natural"
                                                : "Artificial"}
                                        </span>
                                    </div>
                                    <div class="flex items-start">
                                        <span>Fecha parto:</span>
                                        <span class="mx-1 font-semibold">
                                            {s.fechaparto
                                                ? new Date(
                                                      s.fechaparto,
                                                  ).toLocaleDateString()
                                                : ""}
                                        </span>
                                    </div>
                                    <div
                                        class={`flex items-start ${s.fechadesde ? "" : "col-span-2"}`}
                                    >
                                        <span
                                            >Fecha {s.fechadesde
                                                ? "desde"
                                                : "de inseminación"}:</span
                                        >
                                        <span class="mx-1 font-semibold">
                                            {s.fechadesde
                                                ? new Date(
                                                      s.fechadesde,
                                                  ).toLocaleDateString()
                                                : s.fechainseminacion
                                                  ? new Date(
                                                        s.fechainseminacion,
                                                    ).toLocaleDateString()
                                                  : ""}
                                        </span>
                                    </div>
                                    {#if s.fechadesde && s.fechahasta.length > 0}
                                        <div class="flex items-start">
                                            <span>Fecha hasta:</span>
                                            <span class="mx-1 font-semibold">
                                                {s.fechahasta.length > 0
                                                    ? new Date(
                                                          s.fechahasta,
                                                      ).toLocaleDateString()
                                                    : ""}
                                            </span>
                                        </div>
                                    {/if}

                                    <div class="flex items-start">
                                        <span>Madre:</span>
                                        
                                        <span class="mx-1 font-semibold">
                                            {s.fechadesde
                                                ? shorterWord(
                                                      s.expand.madre.caravana
                                                          ? s.expand.madre
                                                                .caravana
                                                          : "",
                                                  )
                                                : shorterWord(
                                                      s.expand.animal.caravana
                                                          ? s.expand.animal
                                                                .caravana
                                                          : "",
                                                  )}
                                        </span>
                                    </div>
                                    
                                    <div class="flex items-start">
                                        <span>Padres:</span>
                                        <span class="mx-1 font-semibold">
                                            {s.fechadesde
                                                ? getNombrePadres(s.padres)
                                                : s.pajuela}
                                        </span>
                                    </div>
                                    <div class="col-span-2 flex items-start">
                                        <span>{`${s.observacion}`}</span>
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
    <Info />
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
        <h3 class="text-lg font-bold">Ver servicio</h3>
        <div class="form-control">
            <label for="nombre" class="label">
                <span class="label-text text-base">Madre</span>
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
                    bind:value={madre}
                    disabled
                >
                    {#each madres as a}
                        <option value={a.id}>{a.caravana}</option>
                    {/each}
                </select>
            </label>
            <label for="nombre" class="label">
                <span class="label-text text-base">Fecha desde</span>
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
                    bind:value={fechadesdeserv}
                />
            </label>
            <label for="nombre" class="label">
                <span class="label-text text-base">Fecha hasta</span>
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
                    bind:value={fechahastaserv}
                />
            </label>
            <label for="nombre" class="label">
                <span class="label-text text-base">Fecha parto</span>
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
                    bind:value={fechaparto}
                />
            </label>
            <label for="nombre" class="label">
                <span class="label-text text-base">Padres</span>
            </label>
            <label class="input-group">
                {#if cargado}
                    <MultipleToros
                        toros={padres}
                        bind:valor={padresserv}
                        bind:listavalores={padreslist}
                    />
                {/if}
            </label>

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
                <button
                    class="btn btn-success text-white"
                    disabled={!botonhabilitado}
                    onclick={editar}>Editar</button
                >
                <button
                    class="btn btn-error text-white"
                    onclick={() => eliminar(idserv, false)}>Eliminar</button
                >
                <button class="btn btn-neutral" onclick={cerrarModal}
                    >Cerrar</button
                >
            </form>
        </div>
    </div>
</dialog>
<dialog
    id="nuevoModalIns"
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
        <h3 class="text-lg font-bold">Ver inseminación</h3>
        <div class="form-control">
            <label for="nombre" class="label">
                <span class="label-text text-base">Madre</span>
            </label>
            <label class="input-group">
                <select
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={idanimal}
                    onchange={() => oninput("ANIMAL")}
                    disabled
                >
                    {#each madres as m}
                        <option value={m.id}>{m.caravana}</option>
                    {/each}
                </select>
                {#if malanimal}
                    <div class="label">
                        <span class="label-text-alt text-red-500"
                            >Debe seleccionar el animal</span
                        >
                    </div>
                {/if}
            </label>

            <label for="tipo" class="label">
                <span class="label-text text-base">Categoria</span>
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
                    disabled
                    bind:value={categoria}
                >
                    {#each tiposanimal as t}
                        <option value={t.id}>{t.nombre}</option>
                    {/each}
                </select>
            </label>
            {#if cargado}
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
            <label for="fechainseminacion" class="label">
                <span class="label-text text-base">Fecha de inseminacion</span>
            </label>
            <label class="input-group">
                <input
                    id="fechainseminacion"
                    type="date"
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={fechainseminacion}
                    onchange={() => oninput("FECHAINSEMINACION")}
                />
                {#if malfechainseminacion}
                    <div class="label">
                        <span class="label-text-alt text-red-500"
                            >Debe seleccionar la fecha de inseminacion</span
                        >
                    </div>
                {/if}
            </label>
            <label for="fechaparto" class="label">
                <span class="label-text text-base">Fecha estimada de parto</span
                >
            </label>
            <label class="input-group">
                <input
                    disabled
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
                    onchange={() => oninput("FECHAPARTO")}
                />
                {#if malfechaparto}
                    <div class="label">
                        <span class="label-text-alt text-red-500"
                            >Debe seleccionar la fecha aproximada de parto</span
                        >
                    </div>
                {/if}
            </label>
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
                <button
                    class="btn btn-success text-white"
                    disabled={!botonhabilitado}
                    onclick={editar}>Editar</button
                >
                <button
                    class="btn btn-error text-white"
                    onclick={() => eliminar(idserv, true)}>Eliminar</button
                >
                <button class="btn btn-neutral" onclick={cerrarModal}
                    >Cerrar</button
                >
            </form>
        </div>
    </div>
</dialog>

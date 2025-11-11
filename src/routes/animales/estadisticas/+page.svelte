<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import Exportar from "$lib/components/Exportar.svelte";
    import PocketBase from "pocketbase";
    import { slide } from "svelte/transition";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import sexos from "$lib/stores/sexos";
    import estilos from "$lib/stores/estilos";
    import estados from "$lib/stores/estados";
    import categorias from "$lib/stores/categorias";
    import { goto } from "$app/navigation";
    import { createCaber } from "$lib/stores/cab.svelte";
    import { createUserer } from "$lib/stores/user.svelte";
    import { createPer } from "$lib/stores/permisos.svelte";
    import Info from "$lib/components/toast/Info.svelte";
    import Nube from "$lib/components/toast/Nube.svelte";
    //filtros
    import { createStorageProxy } from "$lib/filtros/filtros";
    import Limpiar from "$lib/filtros/Limpiar.svelte";
    import RadioButton from "$lib/components/RadioButton.svelte";
    import {
        getEstadoNombre,
        getEstadoColor,
    } from "$lib/components/estadosutils/lib";
    import MultiSelect from "$lib/components/MultiSelect.svelte";
    import cuentas from "$lib/stores/cuentas";
    import {
        getSexoNombre,
        capitalize,
        shorterWord,
    } from "$lib/stringutil/lib";
    //permisos
    import {
        verificarNivel,
        getPermisosList,
        getPermisosMessage,
    } from "$lib/permisosutil/lib";

    //probar internet
    import {
        actualizacion,
        deboActualizar,
    } from "$lib/stores/offline/actualizar";
    import { customoffliner } from "$lib/stores/offline/custom.svelte";
    import { intermitenter } from "$lib/stores/offline/intermitencia.svelte";
    import { velocidader } from "$lib/stores/offline/velocidad.svelte";
    ///ofline
    import Barrainternet from "$lib/components/internet/Barrainternet.svelte";
    import { getInternet, getOnlyInternet } from "$lib/stores/offline";
    import { ACTUALIZACION } from "$lib/stores/constantes";
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
        getAnimalesSQL,
        setAnimalesSQL,
        addNewAnimalSQL,
        updateLocalAnimalesSQLUser,
        updateLocalHistorialAnimalesSQLUser,
        updateLocalAnimalesSQLUserUltimo,
        updateLocalHistorialAnimalesSQLUserUltimo,
        getAnimalesCabSQL,
        getUltimoAnimalesSQL,
        setUltimoAnimalesSQL,
        setUltimoCeroAnimalesSQL,
        setUltimoCeroHistorialAnimalesSQL,
        getUltimoHistorialSQL,
        getHistorialAnimalesSQL,
    } from "$lib/stores/sqlite/dbanimales";

    import {
        getLotesSQL,
        getRodeosSQL,
        updateLocalRodeosSQL,
        getUpdateLocalRodeosLotesSQLUser,
        setUltimoRodeosLotesSQL,
        getLotesRodeosSQL,
        addNewPesajeSQL,
        addNewNacimientoSQL,
        setUltimoCeroEventosSQL,
        getUltimoLotesSQL,
        getUltimoRodeosSQL,
        getUpdateLocalRodeosLotesSQLUserUltimo,
    } from "$lib/stores/sqlite/dbeventos";
    import {
        setUltimoCeroEstablecimientosSQL,
        updateLocalEstablecimientosSQL,
    } from "$lib/stores/sqlite/dballestablecimientos";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import { getTotalAnimales } from "$lib/stores/totaldata";
    //Banco pero esta dificil ahora que traiga los animales actuales
    import {
        getTotalSQL,
        setTotalSQL,
        setUltimoTotalSQL,
    } from "$lib/stores/sqlite/dbtotal";
    import {
        getComandosSQL,
        setComandosSQL,
        flushComandosSQL,
    } from "$lib/stores/sqlite/dbcomandos";
    import ListaAnimales from "$lib/components/animales/ListaAnimales.svelte";
    import TablaAnimales from "$lib/components/animales/TablaAnimales.svelte";
    import NuevoAnimal from "$lib/components/animales/NuevoAnimal.svelte";
    import Estadisticas from "$lib/components/animales/Estadisticas.svelte";
    import Historico from "$lib/components/animales/Historico.svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    

    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    //OFLINE
    let tieneUltimo = $state(false);
    let infotoast = $state(false);
    let nubetoast = $state(false);
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({ connected: false });
    let ultimo_animal = $state({});
    let comandos = $state([]);
    let getlocal = $state(false);
    let getvelocidad = $state(0);
    let getactualizacion = $state(0);
    let getpermisos = $state("");
    let cargado = $state(false);
    let ruta = import.meta.env.VITE_RUTA;

    //pre
    let pre = "";

    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    let caber = createCaber();
    let userer = createUserer();
    let per = createPer();
    let cab = caber.cab;
    //let userpermisos = getPermisosList(per.per.permisos)
    let userpermisos = $state([]);
    let filtros = false;

    //Datos para mostrar
    let animales = $state([]);
    let animalescab = $state([]);
    let animalesrows = $state([]);
    let rodeos = $state([]);
    let lotes = $state([]);
    let activos = [
        { id: "todos", nombre: "Todos" },
        { id: "activos", nombre: "Solo activos" },
        { id: "inactivos", nombre: "Solo inactivos" },
    ];

    let madres = $state([]);
    let padres = $state([]);
    let buscar = $state("");
    let rodeobuscar = $state("");
    let rodeoseleccion = $state([]);
    let loteseleccion = $state([]);
    let categoriaseleccion = $state([]);
    let sexobuscar = $state("");
    let lotebuscar = $state("");
    let estadobuscar = $state("");
    let categoriabuscar = $state("");
    let activosbuscar = $state("activos");
    let fechadesde = $state("");
    let fechahasta = $state("");
    let totalAnimalesEncontrados = $state(0);

    //0 lote 1 rodeo 2 categoria
    let tabs = $state(0);
    // todas
    let cantidad = $state(0);
    let pesototal = $state(0);
    let pesopromedio = $state(0);
    let historico = $state([]);
    //rodeos
    let rodeosestadisticas = $state([]);
    let rodeohistorico = $state([]);
    //categorias
    let categoriasestadisticas = $state([]);
    let categoriahistorico = $state([]);
    //lotes
    let lotesestadisticas = $state([]);
    let lotehistorico = $state([]);
function getNombre(id, lista) {
        let ops = lista.filter((o) => o.id == id);
        if (ops.length == 0) {
            return "";
        }

        return ops[0].nombre;
    }
    let defaultfiltro = {
        buscar: "",
        rodeobuscar: "",
        rodeoseleccion: [],
        loteseleccion: [],
        categoriaseleccion: [],
        sexobuscar: "",
        lotebuscar: "",
        estadobuscar: "",
        categoriabuscar: "",
        activosbuscar: "activos",
        fechadesde: "",
        fechahasta: "",
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("listaestadisticasanimales", defaultfiltro);
    //lista historiales
    let historial = $state([]);

    //filas es el resultado de combinar animales e historiales
    let filas = $state([]);
    //son las filas filtrads
    let historiarows = $state([]);
    //son las filas procesadas que se ven en la tabla

    function cambiarFiltros() {
        filtros != filtros;
    }
    function ordenarNombre(lista) {
        if (lista.length == 0) {
            return [];
        }

        lista.sort((r1, r2) =>
            r1.nombre.toLocaleLowerCase() > r2.nombre.toLocaleLowerCase()
                ? 1
                : -1,
        );
    }
    function isEmpty(str) {
        return !str || str.length === 0;
    }

    function getNombreLote(idlote) {
        let ls = lotes.filter((l) => l.id == idlote);
        if (ls.length > 0) {
            return ls[0].nombre;
        } else {
            return "";
        }
    }
    function getNombreRodeo(idrodeo) {
        let rs = rodeos.filter((r) => r.id == idrodeo);
        if (rs.length > 0) {
            return rs[0].nombre;
        } else {
            return "";
        }
    }

    function setFilters() {
        buscar = proxyfiltros.buscar;
        rodeobuscar = proxyfiltros.rodeobuscar;
        rodeoseleccion = proxyfiltros.rodeoseleccion;
        loteseleccion = proxyfiltros.loteseleccion;
        categoriaseleccion = proxyfiltros.categoriaseleccion;
        sexobuscar = proxyfiltros.sexobuscar;
        lotebuscar = proxyfiltros.lotebuscar;
        estadobuscar = proxyfiltros.estadobuscar;
        categoriabuscar = proxyfiltros.categoriabuscar;
        activosbuscar = proxyfiltros.activosbuscar;
        fechadesde = proxyfiltros.fechadesde;
        fechahasta = proxyfiltros.fechahasta;
    }

    function setProxyFilter() {
        proxyfiltros.buscar = buscar;
        proxyfiltros.rodeobuscar = rodeobuscar;
        proxyfiltros.rodeoseleccion = rodeoseleccion;
        proxyfiltros.loteseleccion = loteseleccion;
        proxyfiltros.categoriaseleccion = categoriaseleccion;
        proxyfiltros.sexobuscar = sexobuscar;
        proxyfiltros.lotebuscar = lotebuscar;
        proxyfiltros.estadobuscar = estadobuscar;
        proxyfiltros.categoriabuscar = categoriabuscar;
        proxyfiltros.activosbuscar = activosbuscar;
        proxyfiltros.fechadesde = fechadesde;
        proxyfiltros.fechahasta = fechahasta;
    }
    function filtrarPorParecido(variableestado, variable) {
        if (variable.length == 0) {
            return true;
        }
        return variableestado
            .toLocaleLowerCase()
            .includes(variable.toLocaleLowerCase());
    }
    function filtrarPorIgualdad(variableestado, variable) {
        if (variable.length == 0) {
            return true;
        }
        return variableestado == variable;
    }
    function filtrarPorFechaEstado(estado, fechadesde, fechahasta) {
        let estado_inicio = new Date(estado.fecha_inicio);
        let estado_fin = new Date(estado.fecha_fin);
        let desde = new Date(fechadesde);
        let hasta = new Date(fechahasta);
        let no_valido = estado_fin < desde || estado_inicio > hasta;
        return !no_valido;
    }
    function filtrarPorColeccion(variableestadoestado, coleccion) {
        if (coleccion.length == 0) {
            return true;
        } else if (coleccion[0] == "-1") {
            return !variableestadoestado;
        } else {
            return coleccion.includes(variableestadoestado);
        }
    }
    function validarEstado(estado) {
        //fecha
        if (!filtrarPorFechaEstado(estado, fechadesde, fechahasta)) {
            return false;
        }

        if (!filtrarPorParecido(estado.caravana, buscar)) {
            return false;
        }
        if (!filtrarPorIgualdad(estado.sexo, sexobuscar)) {
            return false;
        }

        if (!filtrarPorColeccion(estado.rodeo, rodeoseleccion)) {
            return false;
        }
        if (!filtrarPorColeccion(estado.lote, loteseleccion)) {
            return false;
        }

        if (estadobuscar != -1) {
            return estado.prenada == estadobuscar && estado.sexo == "H";
        }

        if (!filtrarPorColeccion(estado.categoria, categoriaseleccion)) {
            return false;
        }

        if (activosbuscar == "activos" && !estado.active) {
            return false;
        }
        if (activosbuscar == "inactivos" && estado.active) {
            return false;
        }
        return true;
    }
    function limpiarFiltros() {
        proxyfiltros = { ...defaultfiltro };

        setFilters();
        filterUpdate();
    }
    function filterUpdate() {
        setProxyFilter();
        proxy.save(proxyfiltros);
        historiarows = [];
        for (let i = 0; i < filas.length; i++) {
            let ha = filas[i];

            let id = ha.id;
            let listaestados = [];
            let animalhistoria = {
                id,
                estados: [],
            };
            for (let j = 0; j < ha.estados.length; j++) {
                let estado = ha.estados[j];

                if (validarEstado(estado)) {
                    listaestados.push(estado);
                }
            }
            if (listaestados.length > 0) {
                animalhistoria.estados = listaestados.map((x) => x);
                historiarows.push(animalhistoria);
            }
        }

        procesarFilas();
    }
    function procesarContador(contador, singrupo) {
        return (
            Object.entries(contador)
                //.sort((a,b)=>a.nombre.toLocaleLowerCase>b.nombretoLocaleLowerCase?-1:1)
                .map((fila) => {
                    let vacio = fila[1].nombre.length == 0;
                    let nombre =
                        fila[1].nombre.length == 0 ? singrupo : fila[1].nombre;

                    return {
                        ...fila[1],
                        vacio,
                        nombre,
                        grupo: fila[1].clave,
                        promedio: fila[1].peso / fila[1].cantidad,
                    };
                })
                .sort((a, b) =>
                    a.vacio
                        ? -1
                        : b.vacio
                          ? 1
                          : a.nombre.toLocaleLowerCase() >
                              b.nombre.toLocaleLowerCase()
                            ? 1
                            : -1,
                )
        );
    }
    function acumularContador(contador, clave, peso, lista) {
        if (!contador[clave]) {
            contador[clave] = {
                clave,
                nombre: getNombre(clave, lista),
                cantidad: 0,
                peso: 0,
            };
        }
        contador[clave].cantidad += 1;
        contador[clave].peso += peso;
    }
    function calcularMovimientos(estados) {
        let movimientos_lotes = [];
        let movimientos_rodeos = [];
        let movimientos_categorias = [];
        let primer_estado = estados[0];
        if (estados.length == 1) {
            let estado_inicio = estados[0];
            let movimiento_lote = {
                grupo: estado_inicio.lote,
                fecha: estado_inicio.created,
                lote: estado_inicio.lote,
                cantidad: 1,
                peso: estado_inicio.peso,
            };
            movimientos_lotes.push(movimiento_lote);
            let movimiento_rodeo = {
                grupo: estado_inicio.rodeo,
                fecha: estado_inicio.created,
                rodeo: estado_inicio.rodeo,
                cantidad: 1,
                peso: estado_inicio.peso,
            };
            movimientos_rodeos.push(movimiento_rodeo);
            let movimiento_categoria = {
                grupo: estado_inicio.categoria,
                fecha: estado_inicio.created,
                categoria: estado_inicio.categoria,
                cantidad: 1,
                peso: estado_inicio.peso,
            };
            movimientos_categorias.push(movimiento_categoria);
        } else {
            let estado_inicio = estados[0];
            let movimiento_lote = {
                grupo: estado_inicio.lote,
                fecha: estado_inicio.created,
                lote: estado_inicio.lote,
                cantidad: 1,
                peso: estado_inicio.peso,
            };
            movimientos_lotes.push(movimiento_lote);
            let movimiento_rodeo = {
                grupo: estado_inicio.rodeo,
                fecha: estado_inicio.created,
                rodeo: estado_inicio.rodeo,
                cantidad: 1,
                peso: estado_inicio.peso,
            };
            movimientos_rodeos.push(movimiento_rodeo);
            let movimiento_categoria = {
                grupo: estado_inicio.categoria,
                fecha: estado_inicio.created,
                categoria: estado_inicio.categoria,
                cantidad: 1,
                peso: estado_inicio.peso,
            };
            movimientos_categorias.push(movimiento_categoria);
            for (let i = 1; i < estados.length; i++) {
                let estado = estados[i];
                if (estado.lote != estado_inicio.lote) {
                    let movimiento_lote = {
                        grupo: estado.lote,
                        fecha: estado.created,
                        lote: estado.lote,
                        cantidad: 1,
                        peso: estado.peso,
                    };
                    let resta_movimiento_lote = {
                        grupo: estado_inicio.lote,
                        fecha: estado.created,
                        lote: estado_inicio.lote,
                        cantidad: -1,
                        peso: -estado_inicio.peso,
                    };
                    movimientos_lotes.push(movimiento_lote);
                    movimientos_lotes.push(resta_movimiento_lote);
                }
                if (estado.rodeo != estado_inicio.rodeo) {
                    let movimiento_rodeo = {
                        grupo: estado.rodeo,
                        fecha: estado.created,
                        rodeo: estado.rodeo,
                        cantidad: 1,
                        peso: estado.peso,
                    };
                    let resta_movimiento_rodeo = {
                        grupo: estado_inicio.rodeo,
                        fecha: estado.created,
                        rodeo: estado_inicio.rodeo,
                        cantidad: -1,
                        peso: -estado_inicio.peso,
                    };
                    movimientos_rodeos.push(movimiento_rodeo);
                    movimientos_rodeos.push(resta_movimiento_rodeo);
                }
                if (estado.categoria != estado_inicio.categoria) {
                    let movimiento_categoria = {
                        grupo: estado.categoria,
                        fecha: estado.created,
                        categoria: estado.categoria,
                        cantidad: 1,
                        peso: estado.peso,
                    };
                    let resta_movimiento_categoria = {
                        grupo: estado_inicio.categoria,
                        fecha: estado.created,
                        categoria: estado_inicio.categoria,
                        cantidad: -1,
                        peso: -estado_inicio.peso,
                    };
                    movimientos_categorias.push(movimiento_categoria);
                    movimientos_categorias.push(resta_movimiento_categoria);
                }
                estado_inicio = estado;
            }
        }
        return {
            movimientos_categorias,
            movimientos_lotes,
            movimientos_rodeos,
        };
    }
    function calcularStockHistorial(movimientos) {
        let historicomap = {};
        let historico = [];

        for (let i = 0; i < movimientos.length; i++) {
            let movimiento = movimientos[i];
            let fecha = movimiento.fecha.split(" ")[0];
            if (!historicomap[movimiento.grupo]) {
                historicomap[movimiento.grupo] = {
                    grupo: movimiento.grupo,
                    nombre: "",
                    historial: {},
                };
            }
            if (!historicomap[movimiento.grupo].historial[fecha]) {
                historicomap[movimiento.grupo].historial[fecha] = {
                    cantidad: 0,
                    peso: 0,
                    promedio: 0,
                };
            }
            historicomap[movimiento.grupo].historial[fecha].cantidad +=
                movimiento.cantidad;
            historicomap[movimiento.grupo].historial[fecha].peso +=
                movimiento.peso;
        }
        let grupos_cantidad = {};
        for (const [grupo, fila] of Object.entries(historicomap)) {
            grupos_cantidad[grupo] = { cantidad: 0, peso: 0 };
            for (const [fecha, historial] of Object.entries(fila.historial)) {
                let item = {
                    fecha,
                    grupo,
                    cantidad: historial.cantidad,
                    peso: historial.peso,
                };
                historico.push(item);
            }
        }

        historico.sort((a, b) =>
            new Date(a.fecha) > new Date(b.fecha) ? 1 : -1,
        );
        for (let i = 0; i < historico.length; i++) {
            let h = historico[i];
            let grupo = h.grupo;
            let cantidad = grupos_cantidad[grupo].cantidad + h.cantidad;
            let peso = grupos_cantidad[grupo].peso + h.peso;
            grupos_cantidad[grupo].cantidad = cantidad;
            grupos_cantidad[grupo].peso = peso;
            historico[i].cantidad = cantidad;
            historico[i].peso = peso;
            historico[i].promedio = peso / cantidad;
        }
        return historico;
    }
    function procesarFilas() {
        animalesrows = [];
        pesototal = 0;
        pesopromedio = 0;

        //listas
        lotesestadisticas = [];
        rodeosestadisticas = [];
        categoriasestadisticas = [];
        //contadores
        let contadorlotes = {};
        let contadorrodeos = {};
        let contadorcategorias = {};
        //movimientos
        let todos_movimientos_lote = [];
        let todos_movimientos_rodeo = [];
        let todos_movimientos_categoria = [];

        for (let i = 0; i < historiarows.length; i++) {
            let h = historiarows[i];
            let primer_estado = h.estados[0];
            let ultimo_estado = h.estados[h.estados.length - 1];
            let fila = { ...ultimo_estado };
            let peso = ultimo_estado.peso ? ultimo_estado.peso : 0;
            let movimientos = calcularMovimientos(h.estados);
            //lote
            acumularContador(contadorlotes, ultimo_estado.lote, peso, lotes);
            //rodeos
            acumularContador(contadorrodeos, ultimo_estado.rodeo, peso, rodeos);
            //Categoria
            acumularContador(
                contadorcategorias,
                ultimo_estado.categoria,
                peso,
                categorias,
            );
            pesototal += peso;
            animalesrows.push(fila);

            todos_movimientos_lote = todos_movimientos_lote.concat(
                movimientos.movimientos_lotes,
            );
            todos_movimientos_rodeo = todos_movimientos_rodeo.concat(
                movimientos.movimientos_rodeos,
            );
            todos_movimientos_categoria = todos_movimientos_categoria.concat(
                movimientos.movimientos_categorias,
            );
        }

        lotesestadisticas = procesarContador(contadorlotes, "Sin lote");
        rodeosestadisticas = procesarContador(contadorrodeos, "Sin rodeo");
        categoriasestadisticas = procesarContador(
            contadorcategorias,
            "Sin categoría",
        );

        //historico
        lotehistorico = calcularStockHistorial(todos_movimientos_lote);
        rodeohistorico = calcularStockHistorial(todos_movimientos_rodeo);
        categoriahistorico = calcularStockHistorial(
            todos_movimientos_categoria,
        );

        totalAnimalesEncontrados = animalesrows.length;
        cantidad = animalesrows.length;
        pesopromedio = pesototal / cantidad;
        pesopromedio = Math.round(pesopromedio * 100) / 100;
    }
    function procesarHistorial() {
        for (let i = 0; i < animalescab.length; i++) {
            let a = animalescab[i];
            let animalhistoria = {
                id: a.id,
                estados: [],
            };
            let fecha_inicio = a.created;
            let fecha_fin = "";
            let hs_animal = historial.filter((h) => h.animal == a.id);
            for (let j = 0; j < hs_animal.length; j++) {
                let h = hs_animal;
                fecha_fin = h.created;
                let estado = {
                    fecha_inicio,
                    fecha_fin,
                    ...h,
                };
                animalhistoria.estados.push(estado);
                fecha_inicio = fecha_fin;
            }
            fecha_fin = new Date().toUTCString().split("T")[0] + " 00:00:00";
            let estado = {
                fecha_inicio,
                fecha_fin,
                ...a,
            };
            animalhistoria.estados.push(estado);
            filas.push(animalhistoria);
        }
    }
    async function getLocalSQL() {
        getlocal = true;
        let resanimales = await getAnimalesSQL(db);
        let reshistorial = await getHistorialAnimalesSQL(db);
        let lotesrodeos = await getLotesRodeosSQL(db, caboff.id);
        lotes = lotesrodeos.lotes.sort((tt1, tt2) =>
            tt1.nombre.toLocaleLowerCase() < tt2.nombre.toLocaleLowerCase()
                ? -1
                : 1,
        );
        rodeos = lotesrodeos.rodeos.sort((tt1, tt2) =>
            tt1.nombre.toLocaleLowerCase() < tt2.nombre.toLocaleLowerCase()
                ? -1
                : 1,
        );

        animales = resanimales.lista;
        animalescab = animales.filter((a) => a.cab == caboff.id);
        
        const idsAnimales = new Set(animalescab.map(a => a.id));

        
        //const historialFiltrado = reshistorial.lista.filter(h => idsAnimales.has(h.animal));
        historial = reshistorial.lista.filter(h => idsAnimales.has(h.animal));
        
        procesarHistorial();
        filterUpdate();
        cargado = true;
    }
    async function initPage() {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        let isOnline = await Network.getStatus();
        intermitenter.addIntermitente(isOnline.connected);
        useroff = await getUserOffline();
        caboff = await getCabOffline();
        getpermisos = caboff.permisos;
        usuarioid = useroff.id;
    }
    
    async function getDataSQL() {
        proxyfiltros = proxy.load();

        setFilters();
        db = await openDB();
        //Reviso el internet
        let lastinter = await getInternetSQL(db);
        ultimo_animal = await getUltimoAnimalesSQL(db);
        
        let ahora = Date.now();
        let antes = ultimo_animal.ultimo;

        await getLocalSQL();
    }
    onMount(async () => {
        await initPage();
        await getDataSQL();
    });
    //Para el collapse de los filtros
    let isOpenFilter = $state(false);
    function clickFilter() {
        isOpenFilter = !isOpenFilter;
    }
    //Para el collapse de los ordenar
    let isOpenOrdenar = $state(false);
    function clickOrdenar() {
        isOpenOrdenar = !isOpenOrdenar;
    }
    //Para los ordenar
    let ascendente = $state(true);
    let forma = $state("caravana");
    let selectforma = $state("caravana");
    //Ordenar animales
    function ordenarAnimalesDescendente(p_forma) {
        let escalar = 1;
        if (!ascendente) {
            escalar = -1;
        }
        forma = p_forma;
        if (forma == "caravana") {
            animalesrows.sort(
                (a1, a2) => escalar * a1.caravana.localeCompare(a2.caravana),
            );
        } else if (forma == "sexo") {
            animalesrows.sort(
                (a1, a2) => escalar * a1.sexo.localeCompare(a2.sexo),
            );
        } else if (forma == "categoria") {
            animalesrows.sort(
                (a1, a2) => escalar * a1.categoria.localeCompare(a2.categoria),
            );
        } else if (forma == "estado") {
            animalesrows.sort((a1, a2) =>
                a1.prenada > a2.prenada ? escalar : -1 * escalar,
            );
        } else if (forma == "lote") {
            animalesrows.sort((a1, a2) => {
                let l1 = a1.expand
                    ? a1.expand.lote
                        ? a1.expand.lote.nombre
                        : ""
                    : "";
                let l2 = a2.expand
                    ? a2.expand.lote
                        ? a2.expand.lote.nombre
                        : ""
                    : "";
                return escalar * l1.localeCompare(l2);
            });
        } else if (forma == "rodeo") {
            animalesrows.sort((a1, a2) => {
                let r1 = a1.expand
                    ? a1.expand.rodeo
                        ? a1.expand.rodeo.nombre
                        : ""
                    : "";
                let r2 = a2.expand
                    ? a2.expand.rodeo
                        ? a2.expand.rodeo.nombre
                        : ""
                    : "";
                return escalar * r1.localeCompare(r2);
            });
        }
    }
    function ordenarAnimales(p_forma) {
        if (p_forma == forma) {
            ascendente = !ascendente;
        } else {
            ascendente = false;
        }
        let escalar = 1;
        if (!ascendente) {
            escalar = -1;
        }
        forma = p_forma;
        if (forma == "caravana") {
            animalesrows.sort(
                (a1, a2) => escalar * a1.caravana.localeCompare(a2.caravana),
            );
        } else if (forma == "sexo") {
            animalesrows.sort(
                (a1, a2) => escalar * a1.sexo.localeCompare(a2.sexo),
            );
        } else if (forma == "categoria") {
            animalesrows.sort(
                (a1, a2) => escalar * a1.categoria.localeCompare(a2.categoria),
            );
        } else if (forma == "estado") {
            animalesrows.sort((a1, a2) =>
                a1.prenada > a2.prenada ? escalar : -1 * escalar,
            );
        } else if (forma == "lote") {
            animalesrows.sort((a1, a2) => {
                let l1 = a1.expand
                    ? a1.expand.lote
                        ? a1.expand.lote.nombre
                        : ""
                    : "";
                let l2 = a2.expand
                    ? a2.expand.lote
                        ? a2.expand.lote.nombre
                        : ""
                    : "";
                return escalar * l1.localeCompare(l2);
            });
        } else if (forma == "rodeo") {
            animalesrows.sort((a1, a2) => {
                let r1 = a1.expand
                    ? a1.expand.rodeo
                        ? a1.expand.rodeo.nombre
                        : ""
                    : "";
                let r2 = a2.expand
                    ? a2.expand.rodeo
                        ? a2.expand.rodeo.nombre
                        : ""
                    : "";
                return escalar * r1.localeCompare(r2);
            });
        }
    }
</script>

{#if modedebug}
    <Barrainternet bind:coninternet />
{/if}
<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-2">
            <div class="label">
                animales - {animales.length}
            </div>
            <div class="label">
                animalescab - {animalescab.length}
            </div>
            <div class="label">
                animalesrows - {animalesrows.length}
            </div>
            <div class="label">
                madres - {madres.length}
            </div>
            <div class="label">
                padres - {padres.length}
            </div>
            <div class="label">
                lotes - {lotes.length}
            </div>
            <div class="label">
                rodeos - {rodeos.length}
            </div>
            <div class="label">
                Hora actual: {Date.now()}
            </div>
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
            <div class="label">
                <span>
                    permisos: {JSON.stringify(getpermisos)}
                </span>
            </div>
        </div>
    {/if}
    <div class="grid grid-cols-1 lg:grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div class="">
            <h1 class="text-2xl">Estadísticas</h1>
        </div>
        <div class="flex col-span-2 gap-1 justify-start lg:justify-end">
            <div>
                <button
                    class={`
                        bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                        ${estilos.btnsecondary}
                        rounded-full
                        px-4 pt-2 pb-3
                    `}
                    onclick={() => goto("/animales")}
                >
                    <span class="text-lg font-semibold">Volver</span>
                </button>
            </div>
        </div>
    </div>

    <div
        class="grid grid-cols-1 lg:grid-cols-2 m-1 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10"
    >
        <div class="w-11/12">
            <label
                class={`
                    input 
                    input-bordered 
                    flex items-center 
                    gap-2
                    ${estilos.bgdark2}
                `}
            >
                <input
                    type="text"
                    class={`
                        grow
                    `}
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
    <!--Filtros-->
    <div class="w-11/12 m-1 mb-2 lg:mx-10 rounded-lg bg-transparent">
        <button aria-label="Filtrar" class="w-full" onclick={clickFilter}>
            <div class="flex justify-between items-center px-1">
                <h1 class="font-semibold text-lg py-2">Filtros</h1>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class={`size-6 transition-all duration-300 ${isOpenFilter ? "transform rotate-180" : ""}`}
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
        <div class="hidden">
            <span class="text-lg my-1"
                >Total de animales encontrados: {totalAnimalesEncontrados}</span
            >
        </div>
        {#if isOpenFilter}
            <div transition:slide>
                <div
                    class="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-10 w-full my-1"
                >
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
                    <div class="mt-0">
                        <MultiSelect
                            opciones={[
                                { id: "-1", nombre: "Sin rodeo" },
                            ].concat(rodeos)}
                            bind:valores={rodeoseleccion}
                            etiqueta="Rodeos"
                            {filterUpdate}
                        />
                    </div>
                    <div class="my-0 py-0">
                        <label for="sexo" class="label mb-0">
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
                                bind:value={sexobuscar}
                                onchange={filterUpdate}
                            >
                                <option value="" class="rounded">Todos</option>
                                {#each sexos as s}
                                    <option value={s.id} class="rounded"
                                        >{s.nombre}</option
                                    >
                                {/each}
                            </select>
                        </label>
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
                    <div class="mt-1">
                        <MultiSelect
                            opciones={[
                                { id: "-1", nombre: "Sin categoria" },
                            ].concat(categorias)}
                            bind:valores={categoriaseleccion}
                            etiqueta="Categorias"
                            margintop="mt-0"
                            {filterUpdate}
                        />
                    </div>
                    <div>
                        <label for="estado" class="label">
                            <span class="label-text text-base">Estado</span>
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
                                bind:value={estadobuscar}
                                onchange={filterUpdate}
                            >
                                <option value="">Todos</option>
                                {#each estados as s}
                                    <option value={s.id}>{s.nombre}</option>
                                {/each}
                            </select>
                        </label>
                    </div>
                    <div>
                        <label for="activo" class="label">
                            <span class="label-text text-base">Activos</span>
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
                                bind:value={activosbuscar}
                                onchange={filterUpdate}
                            >
                                {#each activos as a}
                                    <option value={a.id}>{a.nombre}</option>
                                {/each}
                            </select>
                        </label>
                    </div>
                </div>
            </div>
        {/if}
    </div>
    <!--Ordenar-->
    <div
        class="block md:hidden w-11/12 m-1 mb-2 lg:mx-10 rounded-lg bg-transparent"
    >
        <button aria-label="Ordenar" class="w-full" onclick={clickOrdenar}>
            <div class="flex justify-between items-center px-1">
                <h1 class="font-semibold text-lg py-2">Ordenar</h1>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class={`size-6 transition-all duration-300 ${isOpenOrdenar ? "transform rotate-180" : ""}`}
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
        {#if isOpenOrdenar}
            <div transition:slide>
                <div class="my-0 py-0">
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
                            bind:value={selectforma}
                            onchange={() => ordenarAnimales(selectforma)}
                        >
                            <option value="caravana" class="rounded"
                                >Caravana</option
                            >
                            <option value="sexo" class="rounded">Sexo</option>
                            <option value="categoria" class="rounded"
                                >Categoria</option
                            >
                            <option value="lote" class="rounded">Lote</option>
                            <option value="rodeo" class="rounded">Rodeo</option>
                            <option value="estado" class="rounded"
                                >Estado</option
                            >
                        </select>
                    </label>
                </div>
                <div class="my-1">
                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text">Ascendente</span>
                            <input
                                type="checkbox"
                                class="toggle"
                                bind:checked={ascendente}
                                onclick={() => ordenarAnimales(selectforma)}
                            />
                        </label>
                    </div>
                </div>
            </div>
        {/if}
    </div>
    {#if cargado}
        <div
            class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-11/12 m-1 mb-2 lg:mx-10"
        >
            <Estadisticas titulo={"Cantidad"} bind:valor={cantidad} />
            <Estadisticas titulo={"Peso total"} bind:valor={pesototal} />
            <Estadisticas titulo={"Peso promedio"} bind:valor={pesopromedio} />
        </div>
        <div
            class={`
                p-2 rounded-md
                tabs tabs-bordered 
                dark:bg-gray-800  bg-white
                m-1 mb-2 lg:mx-10
            `}
        >
            <input
                type="radio"
                name="lote_tabs"
                class="tab"
                aria-label="Lotes"
                checked
            />
            <div
                class={`
                tab-content rounded-md p-2 space-y-4
                dark:bg-gray-900 bg-white
                
            `}
            >
                <Historico
                    bind:estadisticas={lotesestadisticas}
                    bind:historico={lotehistorico}
                    {fechadesde}
                    {fechahasta}
                    grupos={lotes}
                    singrupo="Sin lote"
                />
            </div>
            <input
                type="radio"
                name="lote_tabs"
                class="tab"
                aria-label="Rodeos"
            />
            <div
                class={`
                tab-content rounded-md p-2 space-y-4
                dark:bg-gray-900 bg-white
                
            `}
            >
                <Historico
                    bind:estadisticas={rodeosestadisticas}
                    bind:historico={rodeohistorico}
                    {fechadesde}
                    {fechahasta}
                    grupos={rodeos}
                    singrupo="Sin rodeo"
                />
            </div>
            <input
                type="radio"
                name="lote_tabs"
                class="tab"
                aria-label="Categorías"
            />
            <div
                class={`
                tab-content rounded-md p-2 space-y-4
                dark:bg-gray-900 bg-white
                
            `}
            >
                <Historico
                    bind:estadisticas={categoriasestadisticas}
                    bind:historico={categoriahistorico}
                    {fechadesde}
                    {fechahasta}
                    grupos={categorias}
                    singrupo="Sin categoría"
                />
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
{#if nubetoast}
    <Nube />
{/if}

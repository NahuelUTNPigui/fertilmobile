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
    import { capitalize } from "$lib/stringutil/lib";
    import { guardarHistorial } from "$lib/historial/lib";
    import MultiSelect from "$lib/components/MultiSelect.svelte";
    import {
        getEstadoNombre,
        getEstadoColor,
    } from "$lib/components/estadosutils/lib";
    import { getSexoNombre } from "$lib/stringutil/lib";
    import { shorterWord } from "$lib/stringutil/lib";
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
        getComandosSQL,
        setComandosSQL,
        flushComandosSQL,
    } from "$lib/stores/sqlite/dbcomandos";
    import {
        getLotesSQL,
        updateLocalLotesSQLUser,
        getRodeosSQL,
        updateLocalRodeosSQL,
        updateLocalRodeosSQLUser,
        getPesajesSQL,
        setPesajesSQL,
        updateLocalPesajesSQLUser,
        setUltimoPesajesSQL,
        getUltimoPesajeSQL,
        setUltimoRodeosLotesSQL,
    } from "$lib/stores/sqlite/dbeventos";
    import {
        getAnimalesSQL,
        updateLocalAnimalesSQL,
        setAnimalesSQL,
        updateLocalAnimalesSQLUser,
        setUltimoAnimalesSQL,
    } from "$lib/stores/sqlite/dbanimales";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import Info from "$lib/components/toast/Info.svelte";
    import Nube from "$lib/components/toast/Nube.svelte";
    //offline
    let infotoast = $state(false);
    let nubetoast = $state(false)
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
    let ruta = import.meta.env.VITE_RUTA;
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    //let pre = import.meta.env.VITE_PRE
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let caber = createCaber();
    let cab = caber.cab;

    //boton
    let textoboton = $state("Mover");
    //Datos animales
    let animales = $state([]);
    let animalescab = $state([]);
    let animalesrows = $state([]);
    //Los pesajes
    let pesajes = $state([]);
    //Filtros

    let buscar = $state("");
    let loteseleccion = $state([]);
    let rodeoseleccion = $state([]);
    let categoriaseleccion = $state([]);
    let categoria = $state("");
    let sexo = $state("");
    let lote = $state("");
    let rodeo = $state("");

    let defaultfiltro = {
        buscar: "",
        loteseleccion: [],
        rodeoseleccion: [],
        categoriaseleccion: [],
        categoria: "",
        sexo: "",
        lote: "",
        rodeo: "",
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("pesajesanimales", defaultfiltro);

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
    let fecha = $state("");
    let nuevospesos = $state({});

    //Seleecionar
    let selectcategoria = $state(true);
    let selectlote = $state(false);
    let selectrodeo = $state(false);
    let selecttratamiento = $state(false);

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
        loteseleccion = proxyfiltros.loteseleccion;
        rodeoseleccion = proxyfiltros.rodeoseleccion;
        categoriaseleccion = proxyfiltros.categoriaseleccion;
        categoria = proxyfiltros.categoria;
        sexo = proxyfiltros.sexo;
        lote = proxyfiltros.lote;
        rodeo = proxyfiltros.rodeo;
    }

    function setProxyFilter() {
        proxyfiltros.buscar = buscar;
        proxyfiltros.loteseleccion = loteseleccion;
        proxyfiltros.rodeoseleccion = rodeoseleccion;
        proxyfiltros.categoriaseleccion = categoriaseleccion;
        proxyfiltros.categoria = categoria;
        proxyfiltros.sexo = sexo;
        proxyfiltros.lote = lote;
        proxyfiltros.rodeo = rodeo;
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
        if (categoria != "") {
            animalesrows = animalesrows.filter((a) => a.categoria == categoria);
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
        const recordsa = await pb.collection("animales").getFullList({
            filter: `active=true && delete=false && cab='${cab.id}'`,
            expand: "rodeo,lote",
        });

        animales = recordsa;
        animales.sort((a1, a2) => (a1.caravana > a2.caravana ? 1 : -1));
        animalesrows = animales;
    }
    function openNewModal() {
        if (ninguno) {
            Swal.fire("Error pesaje", "No hay animales seleccionados", "error");
            return;
        }
        selectanimales = [];
        for (const [key, value] of Object.entries(selecthashmap)) {
            if (value != null) {
                selectanimales.push({ ...value, pesonuevo: value.peso });
            }
        }
        if (selectanimales.length == 0) {
            Swal.fire("Error pesaje", "No hay animales seleccionados", "error");
            return;
        }
        nuevoModal.showModal();
    }
    async function crearPesajeOnline() {
        let errores = false;
        let pesajeserror = [];
        for (let i = 0; i < selectanimales.length; i++) {
            let ps = selectanimales[i];
            try {
                let dataupdate = {
                    peso: ps.pesonuevo,
                };
                let data = {
                    pesonuevo: ps.pesonuevo,
                    pesoanterior: ps.peso,
                    fecha: fecha + " 03:00:00",
                    animal: ps.id,
                };
                await guardarHistorial(pb, selectanimales[i].id);
                await pb
                    .collection("animales")
                    .update(selectanimales[i].id, dataupdate);
                animales = animales.map((a) => {
                    if (a.id == ps.id) {
                        return { ...a, peso: ps.pesonuevo };
                    }
                    return a;
                });
                let p = await pb.collection("pesaje").create(data);
                p = {
                    ...p,
                    expand: {
                        animal: {
                            id: ps.id,
                            caravana: ps.caravana,
                            cab: caboff.id,
                        },
                    },
                };

                pesajes.push(p);

            } catch (err) {
                pesajeserror.push(ps.id);
                console.error(err);
                errores = true;
            }
        }
        if (errores) {
            Swal.fire(
                "Error pesaje",
                "Hubo algun error en algun pesaje",
                "error",
            );
        } else {
            Swal.fire(
                "Éxito pesaje",
                "Se lograron registar todos los pesajes",
                "success",
            );
        }

        for (let i = 0; i < selectanimales.length; i++) {
            let ps = selectanimales[i];
            let i_error = pesajeserror.findIndex((pid) => pid == ps.id);
            if (i_error == -1) {
                delete selecthashmap[ps.id];
            }
        }

        await setPesajesSQL(db, pesajes);
        await setAnimalesSQL(db, animales);

        filterUpdate();
        selectanimales = [];
    }
    async function crearPesajeOffline() {
        //let respesajes = await getPesajesSQL(db)
        //let pesajes = respesajes.lista
        let errores = false;
        let pesajeserror = [];
        for (let i = 0; i < selectanimales.length; i++) {
            let ps = selectanimales[i];
            try {
                let idprov = "nuevo_pesaje_" + generarIDAleatorio();
                let dataupdate = {
                    peso: ps.pesonuevo,
                };
                let data = {
                    pesonuevo: ps.pesonuevo,
                    pesoanterior: ps.peso,
                    fecha: fecha + " 03:00:00",
                    id: idprov,
                    animal: ps.id,
                };
                pesajes.push({
                    ...data,
                    expand: {
                        animal: {
                            caravana: ps.caravana,
                            id: ps.id,
                            cab: caboff.id,
                        },
                    },
                });
                let aidx = animales.findIndex((a) => a.id == ps.id);

                if (aidx != -1) {
                    animales[aidx].peso = ps.pesonuevo;
                }
                let idanimal = ps.id;
                let nanimal = idanimal.split("_").length > 1;
                let comandopesaje = {
                    tipo: "add",
                    coleccion: "pesaje",
                    data: { ...data },
                    hora: Date.now(),
                    prioridad: 2,
                    idprov,
                    camposprov: nanimal ? "animal" : "",
                    show:{...data,caravana:animales[aidx].caravana},
                    motivo:"Nuevo pesaje"
                };
                let comandoani = {
                    tipo: "update",
                    coleccion: "animal",
                    data: { ...dataupdate },
                    hora: Date.now(),
                    prioridad: 2,
                    idprov: idanimal,
                    camposprov: "",
                    show:{...dataupdate},
                    motivo:"Nuevo pesaje"
                };
                comandos.push(comandopesaje);
                comandos.push(comandoani);
            } catch (err) {
                pesajeserror.push(ps.id);
                console.error(err);
                errores = true;
            }
        }
        await setComandosSQL(db, comandos);
        await setPesajesSQL(db, pesajes);
        await setAnimalesSQL(db, animales);
        if (errores) {
            Swal.fire(
                "Error pesaje",
                "Hubo algun error en algun pesaje",
                "error",
            );
        } else {
            Swal.fire(
                "Éxito pesaje",
                "Se lograron registar todos los pesajes",
                "success",
            );
        }

        for (let i = 0; i < selectanimales.length; i++) {
            let ps = selectanimales[i];
            let i_error = pesajeserror.findIndex((pid) => pid == ps.id);
            if (i_error == -1) {
                delete selecthashmap[ps.id];
            }
        }
        selectanimales = [];

        filterUpdate();

        selectanimales = [];
    }
    async function crearPesaje() {
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
            await crearPesajeOnline();
        } else {
            await crearPesajeOffline();
        }
    }
    async function onMountOriginal() {
        await getAnimales();
        await getRodeos();
        await getLotes();
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
    async function getLocalSQL() {
        getlocal = true;
        let resanimales = await getAnimalesSQL(db);
        let reslotes = await getLotesSQL(db);
        let resrodeos = await getRodeosSQL(db);
        let respesajes = await getPesajesSQL(db);
        animales = resanimales.lista;
        pesajes = respesajes.lista;
        animalescab = animales.filter((a) => a.active && a.cab == caboff.id);
        lotes = reslotes.lista.filter((a) => a.active && a.cab == caboff.id);
        rodeos = resrodeos.lista.filter((a) => a.active && a.cab == caboff.id);
        filterUpdate();
        cargado = true;
    }
    async function updateLocalSQL() {

        await setUltimoRodeosLotesSQL(db);
        await setUltimoAnimalesSQL(db);
        await setUltimoPesajesSQL(db);
        pesajes = await updateLocalPesajesSQLUser(db, pb, usuarioid);
        animales = await updateLocalAnimalesSQLUser(db, pb, usuarioid);
        animalescab = animales.filter((a) => a.active && a.cab == caboff.id);
        lotes = await updateLocalLotesSQLUser(db, pb, usuarioid);
        lotes = lotes.filter((a) => a.active && a.cab == caboff.id);
        rodeos = await updateLocalRodeosSQLUser(db, pb, usuarioid);
        rodeos = rodeos.filter((a) => a.active && a.cab == caboff.id);
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
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
                loger.addTextError("Error en flush comandos pesajes");
            }
        }
    }
    async function oldUpdate(params) {
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
        //let lastinter = await getInternetSQL(db)
        let rescom = await getComandosSQL(db);
        ultimo_pesajes = await getUltimoPesajeSQL(db);
        let ahora = Date.now();
        let antes = ultimo_pesajes.ultimo;
        comandos = rescom.lista;
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
                nubetoast = true
                setTimeout(async () => {
                    try {
                        await updateLocalSQL();
                        // Notificar cambios solo si hay diferencias
                        nubetoast = false
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
</script>

{#if modedebug}
    <Barrainternet bind:coninternet />
{/if}
<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-3">
            <span>
                ultimo_pesajes: {ultimo_pesajes.ultimo}
            </span>
            <span>
                con internet: {coninternet.connected}
            </span>
            <span>
                get local: {getlocal}
            </span>
        </div>
    {/if}
    <div class="grid grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Pesajes</h1>
        </div>
        <div class="flex col-span-2 gap-1 justify-end">
            <button
                class={`btn btn-primary rounded-lg ${estilos.btntext}`}
                data-theme="forest"
                onclick={() => openNewModal()}
            >
                <span class="text-xl">{capitalize("nuevo")}</span>
            </button>
            <a
                class={`btn btn-primary rounded-lg ${estilos.btntext}`}
                data-theme="forest"
                href={"/pesajes/lista"}
            >
                <span class="text-xl">Ultimos</span>
            </a>
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
        <div>
            <span class="text-lg my-1"
                >Total de animales seleccionados: {Object.keys(selecthashmap)
                    .length}</span
            >
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
                <button class="btn btn-neutral" onclick={limpiar}>
                    Limpiar
                </button>
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
                            <th class="px-1 p-0 m-0">
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
                                            stroke="currentColor"
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
                                            stroke="currentColor"
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
                                <td class="px-1 p-0 m-0">
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
                                                stroke="currentColor"
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
                                                stroke="currentColor"
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
                                stroke="currentColor"
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
                                stroke="currentColor"
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
                                                stroke="currentColor"
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
                                                stroke="currentColor"
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
                                    <span>Peso:</span>
                                    <span class="font-semibold">
                                        {a.peso}
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
    <Info/>
{/if}
{#if nubetoast}
    <Nube/>
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
        <label for="fechapesaje" class="label">
            <span class="label-text text-base">Fecha </span>
        </label>
        <label class="input-group">
            <input
                id="fechapesaje"
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
            />
        </label>
        <div
            class="hidden w-full grid grid-cols-1 justify-items-center overflow-x-auto"
        >
            <table class="table table-lg w-full">
                <thead>
                    <tr>
                        <th class="text-base p-0">Caravana</th>
                        <th class="text-base p-0">Peso anterior</th>
                        <th class="text-base">Peso nuevo</th>
                    </tr>
                </thead>
                <tbody>
                    {#each selectanimales as a, i}
                        <tr>
                            <td class="text-base p-0">{a.caravana}</td>
                            <td class="text-base p-0">{a.peso}</td>
                            <td class="">
                                <label class="input-group">
                                    <input
                                        bind:value={selectanimales[i].pesonuevo}
                                        class={`
                                        input input-bordered w-full
                                        border border-gray-300 rounded-md
                                        focus:outline-none focus:ring-2 
                                        focus:ring-green-500 focus:border-green-500
                                        ${estilos.bgdark2}
                                    `}
                                    />
                                </label>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
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
                                <span>Peso:</span>
                                <span class="font-semibold">
                                    {a.peso}
                                </span>
                            </div>
                            <div class="flex items-start col-span-2">
                                <label class="input-group">
                                    <input
                                        bind:value={selectanimales[i].pesonuevo}
                                        class={`
                                    input input-bordered w-full
                                    border border-gray-300 rounded-md
                                    focus:outline-none focus:ring-2 
                                    focus:ring-green-500 focus:border-green-500
                                    ${estilos.bgdark2}
                                `}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
        <div class="modal-action justify-start">
            <form method="dialog">
                <button class="btn btn-success text-white" onclick={crearPesaje}
                    >Crear pesaje</button
                >
                <button class="btn btn-error text-white">Cancelar</button>
            </form>
        </div>
    </div>
</dialog>

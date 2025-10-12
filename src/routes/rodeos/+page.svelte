<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import PocketBase from "pocketbase";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import estilos from "$lib/stores/estilos";
    import { createCaber } from "$lib/stores/cab.svelte";
    //Permisos
    import { getPermisosList, getPermisosMessage } from "$lib/permisosutil/lib";
    //actaualizacion
    import {
        actualizacion,
        deboActualizar,
    } from "$lib/stores/offline/actualizar";
    import { customoffliner } from "$lib/stores/offline/custom.svelte";
    import { intermitenter } from "$lib/stores/offline/intermitencia.svelte";
    import { velocidader } from "$lib/stores/offline/velocidad.svelte";
    //FILTROS
    import { createStorageProxy } from "$lib/filtros/filtros";
    import Limpiar from "$lib/filtros/Limpiar.svelte";
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
    import {
        getRodeosSQL,
        updateLocalRodeosSQL,
        updateLocalRodeosSQLUser,
        addNewRodeoSQL,
        updateRodeoSQL,
        deleteRodeoSQL,
        setRodeosSQL,
        setUltimoRodeosLotesSQL,
        getUltimoRodeosSQL,
        setUltimoCeroEventosSQL,
        getUpdateLocalRodeosLotesSQLUser,

        getUpdateLocalRodeosLotesSQLUserUltimo

    } from "$lib/stores/sqlite/dbeventos";
    import { setUltimoCeroEstablecimientosSQL } from "$lib/stores/sqlite/dballestablecimientos";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    import { getAnimalesCabSQL,setUltimoCeroAnimalesSQL,setUltimoCeroHistorialAnimalesSQL } from "$lib/stores/sqlite/dbanimales";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import Info from "$lib/components/toast/Info.svelte";
    import Nube from "$lib/components/toast/Nube.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    //offline
    let tieneUltimo = $state(false)
    let infotoast = $state(false);
    let nubetoast = $state(false)
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({ connected: false });
    let ultimo_rodeo = $state({});
    let getlocal = $state(false);
    let comandos = $state([]);
    let getvelocidad = $state(0);
    let getactualizacion = $state(0);
    let getpermisos = $state("");
    let cargado = $state(false);
    //offline
    let ruta = import.meta.env.VITE_RUTA;
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    let caber = createCaber();
    let cab = caber.cab;

    //Datos para mostrar
    let rodeos = $state([]);
    let rodeoscab = $state([]);
    let rodeosrows = $state([]);
    let buscar = $state("");
    let mostrarVacios = $state(true);
    let animales = $state([]);
    let defaultfiltro = {
        buscar: "",
        mostrarVacios: true,
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("listarodeos", defaultfiltro);
    //filtros animales
    let defaultfiltroanimales = {
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
    };
    let proxyfiltrosanimales = $state({
        ...defaultfiltroanimales,
    });
    let proxyanimales = createStorageProxy("listaanimales", defaultfiltro);
    //Guardar
    let idrodeo = $state("");
    let nombre = $state("");
    //validacciones
    let malnombre = $state(false);
    let botonhabilitado = $state(false);

    function ordenar(lista) {
        lista.sort((r1, r2) =>
            r1.nombre.toLocaleLowerCase() > r2.nombre.toLocaleLowerCase()
                ? 1
                : -1,
        );
    }
    async function getRodeos() {
        const records = await pb.collection("rodeos").getFullList({
            filter: `active=true && cab='${cab.id}'`,
            sort: "nombre",
        });
        rodeos = records;
        ordenar(rodeos);
        rodeosrows = rodeos;
        for (let i = 0; i < rodeos.length; i++) {
            let total = await getAnimalesTotal(rodeos[i].id);
            rodeos[i].total = total;
        }
    }
    function openNewModal() {
        idrodeo = "";
        nombre = "";
        nuevoModal.showModal();
    }
    async function guardarOffline() {
        let idprov = "nuevo_rodeo_" + generarIDAleatorio();
        try {
            let data = {
                nombre,
                active: true,
                cab: caboff.id,
                id: idprov,
            };
            let comando = {
                tipo: "add",
                coleccion: "rodeos",
                data: { ...data },
                hora: Date.now(),
                prioridad: 0,
                idprov,
                camposprov: "",
                show:{...data},
                motivo:"Nuevo rodeo"
            };
            comandos.push(comando);

            data.total = 0;
            await setComandosSQL(db, comandos);
            rodeos.push(data);
            await setRodeosSQL(db, rodeos);

            nombre = "";
            Swal.fire("Éxito guardar", "Se pudo guardar el rodeo", "success");
        } catch (err) {
            console.error(err);
            nombre = "";
            if (modedebug) {
                loger.addTextError("Error en guardar rodeo online");
            }
            Swal.fire("Error guardar", "No se pudo guardar el rodeo", "error");
        }
    }
    async function guardarOnline() {
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[1]) {
            Swal.fire("Error permisos", getPermisosMessage(1), "error");
            nombre = "";
            return;
        }
        try {
            let data = {
                nombre,
                active: true,
                cab: cab.id,
            };
            let record = await pb.collection("rodeos").create(data);
            record.total = 0;
            rodeos.push(record);
            await setRodeosSQL(db, rodeos);

            filterUpdate();
            Swal.fire("Éxito guardar", "Se pudo guardar el rodeo", "success");
            nombre = "";
        } catch (err) {
            console.error(err);
            nombre = "";
            if (modedebug) {
                loger.addTextError("Error en guardar rodeo offline");
            }
            Swal.fire("Error guardar", "No se pudo guardar el rodeo", "error");
        }
    }
    function changeRodeo() {
        rodeoscab = rodeos
            .filter((r) => r.cab == caboff.id && r.active)
            .map((r) => ({ ...r, total: 0 }));

        for (let i = 0; i < rodeoscab.length; i++) {
            rodeoscab[i].total = animales.filter(
                (a) => a.rodeo == rodeoscab[i].id,
            ).length;
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
        ordenar(rodeos);
        changeRodeo();
        filterUpdate();
    }
    function openEditModal(id) {
        idrodeo = id;
        let rodeo = rodeos.filter((r) => r.id == idrodeo)[0];
        nombre = rodeo.nombre;

        nuevoModal.showModal();
    }
    async function editarOffline(id) {
        try {
            let data = {
                nombre,
            };
            let comando = {
                tipo: "update",
                coleccion: "rodeos",
                data: { ...data },
                hora: Date.now(),
                prioridad: 0,
                idprov: id,
                camposprov: "",
                show:{...data},
                motivo:"Editar rodeo"
            };
            comandos.push(comando);
            await setComandosSQL(db, comandos);

            let idx = rodeos.findIndex((r) => r.id == idrodeo);

            rodeos[idx] = {
                ...rodeos[idx],
                ...data,
            };

            await setRodeosSQL(db, rodeos);

            Swal.fire("Éxito editar", "Se pudo editar el rodeo", "success");
        } catch (err) {
            console.error(err);
            Swal.fire("Error editar", "No se pudo editar el rodeo", "error");
        }
        idrodeo = "";
        nombre = "";
    }
    async function editarOnline(id) {
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[1]) {
            Swal.fire("Error permisos", getPermisosMessage(1), "error");
            nombre = "";
            return;
        }
        try {
            let data = {
                nombre,
            };
            await pb.collection("rodeos").update(idrodeo, data);
            let idx = rodeos.findIndex((r) => r.id == idrodeo);
            rodeos[idx] = {
                ...rodeos[idx],
                ...data,
            };
            await setRodeosSQL(db, rodeos);

            Swal.fire("Éxito editar", "Se pudo editar el rodeo", "success");
        } catch (err) {
            console.error(err);
            Swal.fire("Error editar", "No se pudo editar el rodeo", "error");
        }
        idrodeo = "";
        nombre = "";
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
            await editarOnline(idrodeo);
        } else {
            await editarOffline(idrodeo);
        }

        ordenar(rodeos);
        changeRodeo();
        filterUpdate();
    }
    function eliminarOnline(id) {
        getpermisos = caboff.permisos;
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[1]) {
            Swal.fire("Error permisos", getPermisosMessage(1), "error");

            return;
        }
        Swal.fire({
            title: "Eliminar rodeo",
            text: "¿Seguro que deseas eliminar el rodeo?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si",
            cancelButtonText: "No",
        }).then(async (result) => {
            if (result.value) {
                try {
                    let data = {
                        active: false,
                    };
                    await pb.collection("rodeos").update(idrodeo, data);
                    rodeos = rodeos.filter((r) => r.id != idrodeo);
                    await setRodeosSQL(db, rodeos);
                    //ver como hago para actualizar la lista
                    Swal.fire(
                        "Rodeo eliminado!",
                        "Se eliminó el rodeo correctamente.",
                        "success",
                    );
                    ordenar(rodeos);
                    changeRodeo();
                    filterUpdate();
                } catch (e) {
                    Swal.fire(
                        "Acción cancelada",
                        "No se pudo eliminar el rodeo",
                        "error",
                    );
                }
                idrodeo = "";
                nombre = "";
            }
        });
    }
    function eliminarOffline(id) {
        Swal.fire({
            title: "Eliminar rodeo",
            text: "¿Seguro que deseas eliminar el rodeo?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si",
            cancelButtonText: "No",
        }).then(async (result) => {
            if (result.value) {
                try {
                    let data = {
                        active: false,
                    };
                    let eliminarrodeo = rodeos.filter((r) => r.id == idrodeo)[0]
                    let comando = {
                        tipo: "update",
                        coleccion: "rodeos",
                        data: { ...data },
                        hora: Date.now(),
                        prioridad: 0,
                        idprov: idrodeo,
                        camposprov: "",
                        show:{...eliminarrodeo},
                        motivo:"Eliminar rodeo"
                    };
                    comandos.push(comando);
                    await setComandosSQL(db, comandos);
                    rodeos = rodeos.filter((r) => r.id != idrodeo);
                    await setRodeosSQL(db, rodeos);
                    ordenar(rodeos);
                    changeRodeo();
                    filterUpdate();
                    Swal.fire(
                        "Rodeo eliminado!",
                        "Se eliminó el rodeo correctamente.",
                        "success",
                    );
                } catch (e) {
                    Swal.fire(
                        "Acción cancelada",
                        "No se pudo eliminar el rodeo",
                        "error",
                    );
                }
                idrodeo = "";
                nombre = "";
            }
        });
    }
    async function eliminar(id) {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        let isOnline = await getOnlyInternet();
        intermitenter.addIntermitente(isOnline);
        if (coninternet.connected) {
            eliminarOnline(id);
        } else {
            eliminarOffline(id);
        }
    }
    function setFilters() {
        buscar = proxyfiltros.buscar;
        
    }

    function setProxyFilter() {
        proxyfiltros.buscar = buscar;
        
    }

    function limpiarFiltros() {
        proxyfiltros = { ...defaultfiltro };

        setFilters();
        filterUpdate();
    }
    function filterUpdate() {
        setProxyFilter();
        proxy.save(proxyfiltros);
        rodeosrows = rodeoscab.filter(r=>r.active);
        if (buscar != "") {
            rodeosrows = rodeosrows.filter((r) =>
                r.nombre
                    .toLocaleLowerCase()
                    .includes(buscar.toLocaleLowerCase()),
            );
        }
    }
    function cerrarModal() {
        idrodeo = "";
        nombre = "";
        nuevoModal.close();
    }
    async function getAnimalesTotal(id) {
        const results = await pb.collection("animales").getList(1, 10, {
            filter: `active = true && delete = false && rodeo='${id}'`,
        });
        return results.totalItems;
    }
    async function onMountOriginal() {
        await getRodeos();
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
    async function updateLocalSQL() {
        animales = await getAnimalesCabSQL(db, caboff.id);
        
        let lotesrodeos = await getUpdateLocalRodeosLotesSQLUserUltimo(db,pb,usuarioid,caboff.id,ultimo_rodeo.ultimo)
        //lotes = await updateLocalLotesSQLUser(db, pb, usuarioid);
        //let rodeos  = await updateLocalRodeosSQLUser(db, pb, usuarioid);
        //await setUltimoRodeosLotesSQL(db);
        rodeos = lotesrodeos.rodeos
        ordenar(rodeos);
        changeRodeo();
        filterUpdate();
        cargado = true;
    }
    async function getLocalSQL() {
        getlocal = true;
        animales = await getAnimalesCabSQL(db, caboff.id);
        let resrodeos = await getRodeosSQL(db);
        rodeos = resrodeos.lista;
        ordenar(rodeos);
        changeRodeo();
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
                loger.addTextError("Error en flush comandos rodeos");
            }
        }
    }
    async function oldUpdate() {
        if (lastinter.internet == 0) {
            await setInternetSQL(db, 1, 0);
            await updateLocalSQL();
        } else {
            let ahora = Date.now();
            let antes = ultimo_rodeo.ultimo;
            const cincoMinEnMs = 300000;
            if (ahora - antes >= cincoMinEnMs) {
                await updateLocalSQL();
            } else {
                await getLocalSQL();
            }
        }
    }
    async function ultimoLocalStorage(){
        const hasUltimo = localStorage.getItem("ultimo") === "si";
        if(!hasUltimo){
            await setUltimoCeroAnimalesSQL(db)
            await setUltimoCeroEventosSQL(db)
            await setUltimoCeroEstablecimientosSQL(db)
            await setUltimoCeroHistorialAnimalesSQL(db)
            localStorage.setItem("ultimo","si")
        }
        tieneUltimo = hasUltimo
    }
    function goToAnimales(){
        proxyanimales.load()
        proxyfiltrosanimales.rodeoseleccion = [`${idrodeo}`]
        proxyanimales.save(proxyfiltrosanimales)
        goto("/animales")
    }
    async function getDataSQL() {
        proxyfiltros = proxy.load();
        setFilters();
        db = await openDB();
        await ultimoLocalStorage()
        //Reviso el internet
        let lastinter = await getInternetSQL(db);
        let rescom = await getComandosSQL(db);
        ultimo_rodeo = await getUltimoRodeosSQL(db);
        comandos = rescom.lista;
        let ahora = Date.now();
        let antes = ultimo_rodeo.ultimo;
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
    function isEmpty(str) {
        return !str || str.length === 0;
    }
    function validarBoton() {
        botonhabilitado = true;
        if (isEmpty(nombre)) {
            botonhabilitado = false;
        }
    }
    function oninput() {
        validarBoton();

        if (isEmpty(nombre)) {
            malnombre = true;
        } else {
            malnombre = false;
        }
    }
</script>

{#if modedebug}
    <Barrainternet bind:coninternet />
{/if}
<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-3">
            <div class="label">
                rodeos - {rodeos.length}
            </div>
            <div class="label">
                rodeoscab - {rodeoscab.length}
            </div>
            <div class="label">
                rodeosrows - {rodeosrows.length}
            </div>
            <div>
                <span>
                    {coninternet.connected ? "COn internet" : "sin internet"}
                </span>
            </div>
            <div>
                <span>
                    internet {ultimo_rodeo.ultimo}
                </span>
            </div>
            <div>
                <span>
                    get local{getlocal}
                </span>
            </div>
            <div>
                <span>Tiene ultimo {tieneUltimo}</span>
            </div>
        </div>
    {/if}
    <div class="grid grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Rodeo</h1>
        </div>
        <div class="flex col-span-2 gap-1 justify-end">
            <button
                class={` btn btn-primary rounded-lg ${estilos.btntext} px-2 mx-1`}
                data-theme="forest"
                onclick={() => openNewModal()}
            >
                <span class="text-xl">Nuevo</span>
            </button>
        </div>
    </div>
    <div
        class="grid grid-cols-3 lg:grid-cols-4 m-1 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10"
    >
        <div class="col-span-2">
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
        <div>
            <div class="form-control">
                <label class="label cursor-pointer flex justify-start gap-2">
                    <span class="label-text text-lg">Vacios</span>
                    <input
                        type="checkbox"
                        class="checkbox"
                        bind:checked={mostrarVacios}
                        
                    />
                </label>
            </div>
        </div>
    </div>
    <div class="flex w-11/12 justify-start lg:w-1/2">
        <Limpiar {limpiarFiltros} />
    </div>
    {#if cargado}
        <div
            class="w-full grid grid-cols-1 justify-items-center mx-1 lg:mx-10 lg:w-3/4"
        >
            <table class="table table-lg w-full">
                <thead>
                    <tr>
                        <th
                            class="text-base ml-3 pl-3 mr-1 pr-1 border-b dark:border-gray-600"
                            >Nombre</th
                        >
                        <th
                            class="text-base mx-1 px-1 border-b dark:border-gray-600"
                            >Total</th
                        >
                    </tr>
                </thead>
                <tbody>
                    {#each rodeosrows as r}
                        {#if r.total != 0 || mostrarVacios}
                            <tr
                                onclick={() => openEditModal(r.id)}
                                class=" hover:bg-gray-200 dark:hover:bg-gray-900"
                            >
                                <td
                                    class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10"
                                    >{r.nombre}</td
                                >
                                <td class="text-base mx-1 px-1">{r.total}</td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
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
        {#if idrodeo == ""}
            <h3 class="text-lg font-bold">Nuevo rodeo</h3>
        {:else}
            <h3 class="text-lg font-bold">Ver rodeo</h3>
        {/if}
        <div class="form-control">
            <label for="nombre" class="label">
                <span class="label-text text-base">Nombre</span>
            </label>
            <label class="input-group">
                <input
                    id="nombre"
                    type="text"
                    class={`
                        input input-bordered 
                        w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={nombre}
                    {oninput}
                />
                {#if malnombre}
                    <div class="label">
                        <span class="label-text-alt text-red-500"
                            >Debe escribir el nombre del rodeo</span
                        >
                    </div>
                {/if}
            </label>
        </div>
        <div class="modal-action justify-start">
            <form method="dialog">
                <!-- if there is a button, it will close the modal -->
                {#if idrodeo == ""}
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
                    <button
                        class="btn btn-error text-white"
                        onclick={async () => await eliminar(idrodeo)}
                        >Eliminar</button
                    >
                {/if}
                <button class="btn btn-info text-white" onclick={goToAnimales}
                    >Ver animales</button
                >
                <button class="btn btn-neutral" onclick={cerrarModal}
                    >Cerrar</button
                >
            </form>
        </div>
    </div>
</dialog>

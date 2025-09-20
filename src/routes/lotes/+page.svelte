<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import PocketBase from "pocketbase";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import estilos from "$lib/stores/estilos";
    import { createCaber } from "$lib/stores/cab.svelte";
    import { createPer } from "$lib/stores/permisos.svelte";
    //Permisos
    import { getPermisosList, getPermisosMessage } from "$lib/permisosutil/lib";
    //actualizacion
    import {
        actualizacion,
        deboActualizar,
    } from "$lib/stores/offline/actualizar";
    import { customoffliner } from "$lib/stores/offline/custom.svelte";
    import { intermitenter } from "$lib/stores/offline/intermitencia.svelte";
    import { velocidader } from "$lib/stores/offline/velocidad.svelte";
    //filtros
    import { createStorageProxy } from "$lib/filtros/filtros";
    import Limpiar from "$lib/filtros/Limpiar.svelte";
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
        getLotesSQL,
        updateLocalLotesSQLUser,
        addnewLoteSQL,
        updateLoteSQL,
        deleteLoteSQL,
        setLotesSQL,
        setUltimoRodeosLotesSQL,
        getUltimoRodeosSQL,
        getUpdateLocalRodeosSQLUserCab,

        getUpdateLocalRodeosLotesSQLUser

    } from "$lib/stores/sqlite/dbeventos";
    import { getAnimalesCabSQL } from "$lib/stores/sqlite/dbanimales";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    import Info from "$lib/components/toast/Info.svelte";
import Nube from "$lib/components/toast/Nube.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";

    //offline
    let infotoast = $state(false);
    let nubetoast = $state(false)
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({ connected: false });
    let ultimo_rodeo = $state({});
    let comandos = $state([]);
    let animales = $state([]);
    let getlocal = $state(false);
    let cargado = $state(false);
    let getvelocidad = $state(0);
    let getactualizacion = $state(0);
    let getpermisos = $state("");
    let ruta = import.meta.env.VITE_RUTA;
    //pre
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    let caber = createCaber();
    let cab = caber.cab;
    let per = createPer();
    let userpermisos = getPermisosList(per.per.permisos);

    //Datos para mostrar
    let lotescab = $state([]);
    let lotes = $state([]);
    let lotesrows = $state([]);
    let buscar = $state("");
    let mostrarVacios = $state(true);
    let defaultfiltro = {
        buscar: "",
        mostrarVacios: true,
    };
    let proxyfiltros = $state({
        ...defaultfiltro,
    });
    let proxy = createStorageProxy("listalotes", defaultfiltro);
    //Guardar
    let idlote = $state("");
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
    async function getLotes() {
        const records = await pb.collection("lotes").getFullList({
            filter: `active=True && cab='${cab.id}'`,
            sort: "nombre",
        });
        lotes = records;
        ordenar(lotes);
        lotesrows = lotes;
        for (let i = 0; i < lotes.length; i++) {
            let total = await getAnimalesTotal(lotes[i].id);
            lotes[i].total = total;
        }
    }
    function openNewModal() {
        idlote = "";
            nombre = "";
            nuevoModal.showModal();
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
                cab: caboff.id,
            };
            let record = await pb.collection("lotes").create(data);

            record.total = 0;
            lotes.push(record);
            await setLotesSQL(db, lotes);
            Swal.fire("Éxito guardar", "Se pudo guardar el lote", "success");
        } catch (err) {
            if (modedebug) {
                loger.addTextError("Error en guardar lote online");
            }
            Swal.fire("Error guardar", "No se pudo guardar el lote", "error");
        }
    }
    async function guardarOffline() {
        try {
            let idprov = "nuevo_lote_" + generarIDAleatorio();
            let data = {
                nombre,
                active: true,
                cab: caboff.id,
                id: idprov,
            };
            let comando = {
                tipo: "add",
                coleccion: "lotes",
                data: { ...data },
                hora: Date.now(),
                prioridad: 0,
                idprov,
                camposprov: "",
                show:{...data},
                motivo:"Nuevo lote"
            };
            comandos.push(comando);

            data.total = 0;
            await setComandosSQL(db, comandos);
            lotes.push(data);
            await setLotesSQL(db, lotes);
            Swal.fire("Éxito guardar", "Se pudo guardar el lote", "success");
        } catch (err) {
            if (modedebug) {
                loger.addTextError("Error en guardar lote offline");
            }
            Swal.fire("Error guardar", "No se pudo guardar el lote", "error");
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
        onChangeLote();
        filterUpdate();
        ordenar(lotes);
    }
    function contarAnimales() {
        for (let i = 0; i < lotescab.length; i++) {
            let total = animales.filter(
                (an) => an.lote == lotescab[i].id,
            ).length;
            lotescab[i].total = total;
        }
    }
    function onChangeLote() {
        lotescab = lotes
            .filter((lo) => lo.cab == caboff.id)
            .map((lo) => {
                return {
                    ...lo,
                    total: 0,
                };
            });
        contarAnimales();
    }
    function openEditModal(id) {
        idlote = id;
        let lote = lotes.filter((r) => r.id == idlote)[0];
        nombre = lote.nombre;

        nuevoModal.showModal();
    }
    async function editarOnline(idlote) {
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
            await pb.collection("lotes").update(idlote, data);

            let idx = lotes.findIndex((r) => r.id == idlote);

            let total = lotes[idx].total;
            lotes[idx] = {
                ...lotes[idx],
                ...data,
            };

            await setLotesSQL(db, lotes);

            Swal.fire("Éxito editar", "Se pudo editar el lote", "success");
        } catch (err) {
            console.error(err);
            Swal.fire("Error editar", "No se pudo editar el lote", "error");
        }
        idlote = "";
        nombre = "";
    }
    async function editarOffline(id) {
        let data = {
            id,
            nombre,
        };
        let comando = {
            tipo: "update",
            coleccion: "lotes",
            data: { ...data },
            hora: Date.now(),
            prioridad: 0,
            idprov: id,
            camposprov: "",
            show:{...data},
            motivo:"Editar lote"
        };
        //Creo que esto es lo correcot
        let idx = lotes.findIndex((r) => r.id == id);
        lotes[idx].nombre = data.nombre;
        comandos.push(comando);
        await setLotesSQL(db, lotes);

        await setComandosSQL(db, comandos);
    }
    async function editar(idlote) {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        let isOnline = await getOnlyInternet();
        intermitenter.addIntermitente(isOnline);
        if (coninternet.connected) {
            await editarOnline(idlote);
        } else {
            await editarOffline(idlote);
        }
        onChangeLote();
        filterUpdate();
        ordenar(lotes);
    }
    function eliminarOffline(id) {
        Swal.fire({
            title: "Eliminar lote",
            text: "¿Seguro que deseas eliminar el lote?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si",
            cancelButtonText: "No",
        }).then(async (result) => {
            if (result.value) {
                idlote = id;
                let eliminarlote  = lotes.filter((r) => r.id == idlote)[0];
                try {
                    let data = {
                        id:idlote,
                        active: false,
                    };
                    let comando = {
                        tipo: "update",
                        coleccion: "lotes",
                        data: { ...data },
                        hora: Date.now(),
                        prioridad: 0,
                        idprov: idlote,
                        camposprov: "",
                        show:{...data,nombre:eliminarlote.nombre},
                        motivo:"Eliminar lote"
                    };

                    lotes = lotes.filter((r) => r.id != idlote);

                    comandos.push(comando);
                    await setComandosSQL(db, comandos);
                    ordenar(lotes);
                    await setLotesSQL(db, lotes);
                    onChangeLote();
                    
                    filterUpdate();
                    Swal.fire(
                        "Lote eliminado!",
                        "Se eliminó el lote correctamente.",
                        "success",
                    );
                } catch (e) {
                    Swal.fire(
                        "Acción cancelada",
                        "No se pudo eliminar el lote",
                        "error",
                    );
                }
                idlote = "";
                nombre = "";
            }
        });
    }
    function eliminarOnline(id) {
        getpermisos = caboff.permisos;
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[1]) {
            Swal.fire("Error permisos", getPermisosMessage(1), "error");

            return;
        }
        Swal.fire({
            title: "Eliminar lote",
            text: "¿Seguro que deseas eliminar el lote?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si",
            cancelButtonText: "No",
        }).then(async (result) => {
            if (result.value) {
                idlote = id;
                try {
                    let data = {
                        active: false,
                    };
                    const record = await pb
                        .collection("lotes")
                        .update(idlote, data);
                        
                    lotes = lotes.filter((r) => r.id != idlote);
                    ordenar(lotes);
                    await setLotesSQL(db, lotes);
                    onChangeLote();
                    
                    filterUpdate();
                    //ver como hago para actualizar la lista
                    Swal.fire(
                        "Lote eliminado!",
                        "Se eliminó el lote correctamente.",
                        "success",
                    );
                } catch (e) {
                    Swal.fire(
                        "Acción cancelada",
                        "No se pudo eliminar el lote",
                        "error",
                    );
                }
                idlote = "";
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
        onChangeLote();
        ordenar(lotes);
        filterUpdate();
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

        lotesrows = lotescab.filter(l=>l.active);
        if (buscar != "") {
            lotesrows = lotesrows.filter((r) =>
                r.nombre
                    .toLocaleLowerCase()
                    .includes(buscar.toLocaleLowerCase()),
            );
        }
    }
    function cerrarModal() {
        idlote = "";
        nombre = "";
        nuevoModal.close();
    }
    async function getAnimalesTotal(id) {
        const results = await pb.collection("animales").getList(1, 10, {
            filter: `active = true && delete = false && lote='${id}'`,
        });
        return results.totalItems;
    }
    async function onMountOriginal() {
        await getLotes();
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
    async function getAnimales() {
        animales = await getAnimalesCabSQL(db, caboff.id);
    }
    async function getLocalSQL() {
        getlocal = true;
        await getAnimales();
        let reslotes = await getLotesSQL(db);
        lotes = reslotes.lista;
        onChangeLote();
        filterUpdate();
        cargado = true;
    }
    async function updateLocalSQL() {

        await setUltimoRodeosLotesSQL(db);
        await getAnimales();
        let lotesrodeos = await getUpdateLocalRodeosLotesSQLUser(db,pb,usuarioid,caboff.id)
        //lotes = await updateLocalLotesSQLUser(db, pb, usuarioid);
        //let rodeos  = await updateLocalRodeosSQLUser(db, pb, usuarioid);
        lotes = lotesrodeos.lotes
        onChangeLote();
        filterUpdate();
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
        cargado = true;
    }
    async function updateComandos() {
        try {
            await flushComandosSQL(db, pb);
            comandos = [];
        } catch (err) {
            if (modedebug) {
                loger.addTextError(JSON.stringify(err), null, 2);
                loger.addTextError("Error en flush comandos lotes");
            }
        }
    }
    async function oldDataUpdate() {
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
    async function getDataSQL() {
        proxyfiltros = proxy.load();
        setFilters();
        db = await openDB();
        //Reviso el internet
        let lastinter = await getInternetSQL(db);
        let rescom = await getComandosSQL(db);
        //Uso rodeo como guia
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
                        nubetoast = false;
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
                lotes - {lotes.length}
            </div>
            <div class="label">
                lotescab - {lotescab.length}
            </div>
            <div class="label">
                lotesrows - {lotesrows.length}
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
                    get local {getlocal}
                </span>
            </div>
            <div>
                <span>
                    mostrarVacios{mostrarVacios}
                </span>
            </div>
        </div>
    {/if}
    <div class="grid grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Lote</h1>
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
                    {#each lotesrows as r}
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
        {#if idlote == ""}
            <h3 class="text-lg font-bold">Nuevo Lote</h3>
        {:else}
            <h3 class="text-lg font-bold">Ver Lote</h3>
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
                            >Debe escribir el nombre del lote</span
                        >
                    </div>
                {/if}
            </label>
        </div>
        <div class="modal-action justify-start">
            <form method="dialog">
                <!-- if there is a button, it will close the modal -->
                {#if idlote == ""}
                    <button
                        class="btn btn-success text-white"
                        disabled={!botonhabilitado}
                        onclick={guardar}>Guardar</button
                    >
                {:else}
                    <button
                        class="btn btn-success text-white"
                        disabled={!botonhabilitado}
                        onclick={() => editar(idlote)}>Editar</button
                    >
                    <button
                        class="btn btn-error text-white"
                        onclick={async () => await eliminar(idlote)}
                        >Eliminar</button
                    >
                {/if}
                <button class="btn btn-neutral" onclick={cerrarModal}
                    >Cerrar</button
                >
            </form>
        </div>
    </div>
</dialog>

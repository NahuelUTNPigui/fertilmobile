<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import PocketBase from "pocketbase";
    import Swal from "sweetalert2";

    import { onMount } from "svelte";
    import estilos from "$lib/stores/estilos";
    import { createCaber } from "$lib/stores/cab.svelte";
    import { goto } from "$app/navigation";

    import { createPer } from "$lib/stores/permisos.svelte";
    import { usuario } from "$lib/stores/usuario";
    import { shorterWord } from "$lib/stringutil/lib";
    import Asoc from "$lib/components/establecimientos/Asoc.svelte";
    //FILTROS
    import { createStorageProxy } from "$lib/filtros/filtros";
    import Limpiar from "$lib/filtros/Limpiar.svelte";
    //Permisos
    import {
        getPermisosCabUser,
        getPermisosEstXColab,
    } from "$lib/permisosutil/lib";
    //Actualizacion
    import {
        actualizacion,
        deboActualizar,
    } from "$lib/stores/offline/actualizar";
    import { customoffliner } from "$lib/stores/offline/custom.svelte";
    import { intermitenter } from "$lib/stores/offline/intermitencia.svelte";
    import { velocidader } from "$lib/stores/offline/velocidad.svelte";
    //offline
    import { getInternet, getOnlyInternet } from "$lib/stores/offline";
    import Barrainternet from "$lib/components/internet/Barrainternet.svelte";
    import { openDB, resetTables } from "$lib/stores/sqlite/main";
    import { Network } from "@capacitor/network";
    import {
        getInternetSQL,
        setInternetSQL,
    } from "$lib/stores/sqlite/dbinternet";
    import { getUserOffline } from "$lib/stores/capacitor/offlineuser";
    import {
        setCabOffline,
        getCabOffline,
    } from "$lib/stores/capacitor/offlinecab";
    import { getCabData } from "$lib/stores/cabsdata";
    import { updateLocalEventosSQL } from "$lib/stores/sqlite/dbeventos";
    import {
        addNewAnimalSQL,
        updateLocalAnimalesSQL,
    } from "$lib/stores/sqlite/dbanimales";
    import {
        getUltimoEstablecimientosSQL,
        updateLocalEstablecimientosSQL,
        setUltimoEstablecimientosSQL,
        getEstablecimientosSQL,
        getUpdateLocalEstablecimientosSQL,
        setEstablecimientosSQL,
    } from "$lib/stores/sqlite/dballestablecimientos";
    import { getAnimalesSQL } from "$lib/stores/sqlite/dbanimales";
    import {
        setEstablecimientosAsociadosSQL,
        getEstablecimientosAsociadosSQL,
        addNewEstablecimientoAsosciadoSQL,
        deleteEstablecimientosAsociadosSQL,
    } from "$lib/stores/sqlite/dbasociados";
    import {
        getComandosSQL,
        setComandosSQL,
        flushComandosSQL,
    } from "$lib/stores/sqlite/dbcomandos";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { ACTUALIZACION } from "$lib/stores/constantes";

    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    //OFLINE
    let infotoast = $state(false);
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({ connected: false });
    let ultimo_establecimiento = $state({});
    let comandos = $state([]);
    let getlocal = $state(false);
    let getvelocidad = $state(0);
    let getactualizacion = $state(0);
    let cargado = $state(false);
    // logica para los asociados
    let sincronizadas = $state([]);
    let ruta = import.meta.env.VITE_RUTA;

    //pre
    const pb = new PocketBase(ruta);
    let establecimientos = $state([]);
    let establecimientoscolab = $state([]);
    let totales = $state([]);
    let totalescolab = $state([]);
    let caber = createCaber();
    let cab = $state({});
    //Guardar establecimiento
    async function irEstablecimientoColab(id) {
        let per = createPer();
        let est = establecimientoscolab.filter((e) => e.id == id)[0];

        caber.setCab(est.expand.cab.nombre, est.expand.cab.id);
        //Ver los permisos
        let permisos = await getPermisosCabUser(
            pb,
            usuarioid,
            est.expand.cab.id,
        );
        per.setPer(permisos.permisos, usuarioid);
        await setCabOffline(
            est.expand.cab.id,
            est.expand.cab.nombre,
            true,
            permisos.permisos,
            true,
        );

        //await updateLocalAnimalesSQL(db,pb,est.expand.cab.id)
        //await updateLocalEventosSQL(db,pb,est.expand.cab.id)

        localStorage.setItem("fromColab", "si");
        goto("/");
    }
    async function irEstablecimiento(id) {
        let per = createPer();
        let est = establecimientos.filter((e) => e.id == id)[0];
        caber.setCab(est.nombre, est.id);
        await setCabOffline(est.id, est.nombre, true, "0,1,2,3,4,5", false);
        //await setInternetSQL(db,0,Date.now())
        //await updateLocalAnimalesSQL(db,pb,est.id)

        //await updateLocalEventosSQL(db,pb,est.id)
        per.setPer("0,1,2,3,4,5", usuarioid);
        goto("/");
    }
    function crearEstablecimiento() {
        goto("nuevo");
    }
    async function getTotalAnimales(cabid) {
        const record = await pb.collection("animales").getList(1, 2, {
            filter: `active=True && delete=false && cab='${cabid}'`,
        });
        return record.totalItems;
    }
    function getTotalAnimalesSQL(cabid, animales) {
        let total = animales.filter((a) => a.cab == cabid && a.active);
        return total.length;
    }
    async function eliminar(id) {
        coninternet = await getOnlyInternet();
        intermitenter.addIntermitente(coninternet.connected);

        if (coninternet.connected) {
            Swal.fire({
                title: "Eliminar establecimiento",
                text: "¿Seguro que deseas eliminar el establecimiento?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Si",
                cancelButtonText: "No",
            }).then(async (result) => {
                if (result.value) {
                    let data = { active: false };
                    try {
                        await pb.collection("cabs").update(id, data);
                        Swal.fire(
                            "Éxito",
                            "Se pudo eliminar el establecimiento",
                            "success",
                        );
                    } catch (err) {
                        Swal.fire(
                            "Error eliminar",
                            "No se pudo eliminar el establecimiento",
                            "error",
                        );
                    }
                    await updateLocalSQL();
                }
            });
        } else {
            Swal.fire(
                "Error eliminar",
                "Sin internet no se puden borrar los establecimientos",
                "error",
            );
        }
    }
    async function getEstablecimientosColab() {
        const restxcolab = await pb.collection("estxcolabs").getFullList({
            filter: `colab.user = '${usuarioid}' && cab.active = true`,
            expand: "colab,cab",
        });
    }
    async function onMountOriginal() {
        let pb_json = JSON.parse(localStorage.getItem("pocketbase_auth"));
        usuarioid = pb_json.record.id;
        cab = caber.cab;
        const records = await pb.collection("cabs").getFullList({
            filter: `active = True && user = '${usuarioid}'`,
        });
        const restxcolab = await pb.collection("estxcolabs").getFullList({
            filter: `colab.user = '${usuarioid}' && cab.active = true`,
            expand: "colab,cab",
        });
        establecimientoscolab = restxcolab;

        establecimientos = records;

        for (let i = 0; i < establecimientos.length; i++) {
            totales.push(await getTotalAnimales(establecimientos[i].id));
        }
        for (let i = 0; i < establecimientoscolab.length; i++) {
            totalescolab.push(
                await getTotalAnimales(establecimientoscolab[i].expand.cab.id),
            );
        }
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
        cab = caber.cab;
    }
    async function getLocalSQL() {
        getlocal = true;
        //Aca se van a guardar todos los estableciemientos
        //colaborador o no
        let resestablecimientos = await getEstablecimientosSQL(db);

        establecimientos = resestablecimientos.lista.filter((e) => {
            //Reviso que los establecimientos no sea colaborador
            //Osea que el user es igual a u id
            return e.user == usuarioid;
            //return !sincronizadas.includes(s => s == e.id)
        });
        
        if (coninternet.connected) {
            await getOnlineColabs();
        } else {
            establecimientoscolab = resestablecimientos.lista.filter((e) => {
                //Reviso que los establecimientos si sean colaborador
                return e.user != usuarioid;
                //return sincronizadas.includes(s => s == e.id)
            });
        }

        let resanimales = await getAnimalesSQL(db);
        let animales = resanimales.lista;
        for (let i = 0; i < establecimientos.length; i++) {
            totales.push(getTotalAnimalesSQL(establecimientos[i].id, animales));
        }
        if (coninternet.connected) {
            for (let i = 0; i < establecimientoscolab.length; i++) {
                totalescolab.push(
                    await getTotalAnimales(
                        establecimientoscolab[i].expand.cab.id,
                    ),
                );
            }
        } else {
            for (let i = 0; i < establecimientoscolab.length; i++) {
                totalescolab.push(
                    getTotalAnimalesSQL(establecimientoscolab[i].id, animales),
                );
            }
        }

        cargado = true;
    }
    async function getOnlineColabs() {
        const restxcolab = await pb.collection("estxcolabs").getFullList({
            filter: `colab.user = '${usuarioid}' && cab.active = true`,
            expand: "colab,cab",
        });
        establecimientoscolab = restxcolab;
    }
    async function updateLocalSQL() {
        await setUltimoEstablecimientosSQL(db);
        let resestablecimientos = await getUpdateLocalEstablecimientosSQL(
            db,
            pb,
            usuarioid,
        );
        establecimientos = resestablecimientos.filter(
            (e) => e.user == usuarioid,
        );

        await getOnlineColabs();

        for (let i = 0; i < establecimientos.length; i++) {
            totales.push(await getTotalAnimales(establecimientos[i].id));
        }
        for (let i = 0; i < establecimientoscolab.length; i++) {
            totalescolab.push(
                await getTotalAnimales(establecimientoscolab[i].expand.cab.id),
            );
        }
        cargado = true;
    }
    async function actualizarComandos() {
        try {
            await flushComandosSQL(db, pb);
            comandos = [];
        } catch (err) {
            if (modedebug) {
                loger.addTextError(JSON.stringify(err), null, 2);
                loger.addTextError("Error en flush comandos establecimientos");
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
    //En este caso hace falta usar el internet directo
    //Para buscar los establecimientos a quien soy colaborador
    async function getDataSQL() {
        //Reviso el internet
        db = await openDB();
        //Reviso el internet
        let lastinter = await getInternetSQL(db);
        ultimo_establecimiento = await getUltimoEstablecimientosSQL(db);
        let rescom = await getComandosSQL(db);
        comandos = rescom.lista;
        let ressincronizadas = await getEstablecimientosAsociadosSQL(db);
        sincronizadas = ressincronizadas.lista;
        let ahora = Date.now();
        let antes = ultimo_establecimiento.ultimo;
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
    async function agregarCab(idCab) {
        sincronizadas = await addNewEstablecimientoAsosciadoSQL(db, idCab);
    }
    async function quitarCab(idCab) {
        sincronizadas = await deleteEstablecimientosAsociadosSQL(db, idCab);
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
                    get local: {getlocal}
                </span>
            </div>
            <div>
                <span>
                    establecimientos {establecimientos.length}
                </span>
            </div>
            <div>
                <span>
                    establecimientoscolab {establecimientoscolab.length}
                </span>
            </div>
        </div>
    {/if}
    {#if cargado}
        <div class="flex justify-center mt-1">
            <div class="w-full max-w-7xl px-4">
                <div class="grid grid-cols-3 mx-1 lg:mx-10 mt-2">
                    <div>
                        <h1
                            class="text-2xl font-bold text-green-700 dark:text-green-400 mb-6"
                        >
                            Tus establecimientos
                        </h1>
                    </div>
                    <div class="flex col-span-2 justify-end mt-2 lg:mt-0">
                        <button
                            class={`btn btn-primary rounded-lg ${estilos.btntext}`}
                            data-theme="forest"
                            onclick={crearEstablecimiento}
                        >
                            <span class="text-xl">Nuevo</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-1 gap-2 my-2">
            {#each establecimientos as e, i}
                <div class="flex items-center justify-center p-1">
                    <div
                        class={`
                                bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-2 w-full 
                                max-w-5xl
                        `}
                    >
                        <h2
                            class="flex items-center text-2xl font-bold mb-1 text-start p-2"
                        >
                            {shorterWord(e.nombre)}
                            <!--Sincronizada-->
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
                        </h2>
                        <div class="p-2 grid grid-cols-3 lg:grid-cols-6">
                            <span class="text-xl font-semibold text-start"
                                >Direccion:</span
                            >

                            <span class="text-xl font-medium text-end"
                                >{e.direccion}</span
                            >
                        </div>
                        <div class="p-2 grid grid-cols-3 lg:grid-cols-6">
                            <span class="text-xl font-semibold text-start"
                                >Animales:</span
                            >

                            <span class="text-xl font-medium text-end"
                                >{totales[i]}</span
                            >
                        </div>
                        <div class="p-2">
                            <button
                                onclick={async () =>
                                    await irEstablecimiento(e.id)}
                                class={`mt-3  hover:text-gray-500 dark:hover:text-gray-600 inline-flex items-center `}
                                >Ir establecimiento
                                <svg
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    class="w-4 h-4 ml-2"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        </div>
                        {#if e.id != cab.id}
                            <button
                                aria-label="Eliminar"
                                onclick={() => eliminar(e.id)}
                                class={`
                                    flex 
                                    items-center p-2
                                    rounded-full 
                                    focus:ring-offset-2 transition-colors duration-300 focus:outline-none focus:ring-2
                                    bg-red-600 text-white hover:bg-red-700  focus:ring-red-500 
                                    
                                    
                                `}
                            >
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
                                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                    />
                                </svg>
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
        {#if establecimientoscolab.length != 0}
            <div class="flex justify-center mt-1">
                <div class="w-full max-w-7xl px-4">
                    <div class="grid grid-cols-3 mx-1 lg:mx-10 mt-2">
                        <div>
                            <h1
                                class="text-2xl font-bold text-green-700 dark:text-green-400 mb-6"
                            >
                                Establecimientos asociados
                            </h1>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
        <div class="grid grid-cols-1 gap-2 mb-2">
            {#if establecimientoscolab.length != 0}
                {#each establecimientoscolab as e, i}
                    <Asoc
                        {e}
                        {i}
                        {irEstablecimientoColab}
                        {totalescolab}
                        {agregarCab}
                        {quitarCab}
                        bind:sincronizadas
                    ></Asoc>
                {/each}
            {/if}
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

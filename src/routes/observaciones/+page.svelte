<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import Exportar from "$lib/components/Exportar.svelte";
    import PocketBase from "pocketbase";
    import { slide } from "svelte/transition";
    import sexos from "$lib/stores/sexos";
    import permisos from "$lib/stores/permisos";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import { createCaber } from "$lib/stores/cab.svelte";
    import { createUserer } from "$lib/stores/user.svelte";
    import categorias from "$lib/stores/categorias";
    import estilos from "$lib/stores/estilos";
    import AgregarAnimal from "$lib/components/eventos/AgregarAnimal.svelte";
    import cuentas from "$lib/stores/cuentas";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    //offline
    import { openDB } from "$lib/stores/sqlite/main";
    import { Network } from "@capacitor/network";
    import {
        getInternetSQL,
        setInternetSQL,
    } from "$lib/stores/sqlite/dbinternet";
    import {
        setAnimalesSQL,
        getAnimalesSQL,
        setUltimoAnimalesSQL,
        updateLocalAnimalesSQLUser,
    } from "$lib/stores/sqlite/dbanimales";
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
    import {
        updateLocalObservaciones,
        setObservacionesSQL,
        addNewObservacionSQL,
        getObservacionesSQL,
        updateLocalObservacionesSQLUser,
        setUltimoObservacionesSQL,
        getUltimoObservacionesSQL
    } from "$lib/stores/sqlite/dbeventos";
    import NuevaObservacion from "$lib/components/observaciones/NuevaObservacion.svelte";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import Animal from "$lib/svgs/animal.svelte";
    import Barrainternet from '$lib/components/internet/Barrainternet.svelte';
    import { getInternet } from '$lib/stores/offline';
    
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    //offline
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({connected:false});
    let ultimo_observaciones = $state({});
    let getlocal = $state(false)
    let comandos = $state([]);
    //online

    let caber = createCaber();
    let cab = caber.cab;
    let ruta = import.meta.env.VITE_RUTA;

    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0];
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    let animales = $state([]);
    let animalescab = $state([]);
    let observaciones = $state([]);
    let observacionescab = $state([]);
    let observacionesrow = $state([]);
    let caravana = $state("");
    let malcaravana = $state(false);
    let sexo = $state("");
    let peso = $state(0);

    //Datos observaciones
    let idobservacion = $state("");
    let animal = $state("");
    let categoria = $state("");
    let fecha = $state("");
    let observacion = $state("");
    let totalObservacionesEncontradas = $state(0);
    //Validacioones
    let malanimal = $state(false);
    let malfecha = $state(false);
    let botonhabilitado = $state(false);
    let botonhabilitadoAnimal = $state(false);
    //Filtros
    let buscar = $state("");
    let buscarcategoria = $state("");
    let fechadesde = $state("");
    let fechahasta = $state("");
    let isOpenFilter = $state(false);
    //Datos animal
    let caravananuevo = $state("");
    let categorianuevo = $state("");
    let sexonuevo = $state("");
    let fechanacimientonuevo = $state("");
    let pesonuevo = $state("");
    let agregaranimal = $state(false);
    //Funciones
    //Para el collapse de los filtros
    function clickFilter() {
        isOpenFilter = !isOpenFilter;
    }
    function isEmpty(str) {
        return !str || str.length === 0;
    }
    async function getAnimales() {
        //Estaria joya que el animal venga con todos los chiches
        const recordsa = await pb.collection("animales").getFullList({
            filter: `active=true && cab='${cab.id}' && (sexo='H' || sexo ='M')`,
            expand: "nacimiento",
        });
        animales = recordsa;
        animales.sort((a1, a2) => (a1.caravana > a2.caravana ? 1 : -1));
    }
    async function getObservaciones() {
        const records = await pb.collection("observaciones").getFullList({
            filter: `active=true && cab='${cab.id}'`,
            expand: "animal",
            sort: "-fecha",
        });
        observaciones = records;
        observacionesrow = observaciones;
    }
    function openNewModal() {
        idobservacion = "";
        observacion = "";
        categoria = "";
        fecha = "";
        botonhabilitado = false;
        malanimal = false;
        malfecha = false;
        nuevoModal.showModal();
    }

    function openNewAnimal() {
        if (permisos[4]) {
            caravana = "";
            sexo = "";
            peso = 0;
            botonhabilitadoAnimal = false;
            nuevoModal.showModal();
        } else {
            Swal.fire(
                "Sin permisos",
                "No tienes permisos para crear eventos",
                "error",
            );
        }
    }

    function openModalEditar(id) {
        botonhabilitado = true;
        malanimal = false;
        malfecha = false;
        idobservacion = id;
        let obs = observaciones.filter((o) => o.id == idobservacion)[0];
        observacion = obs.observacion;
        categoria = obs.categoria;
        fecha = obs.fecha.split(" ")[0];
        animal = obs.animal;
        nuevoModal.showModal();
    }
    function eliminarOffline(id) {
        Swal.fire({
            title: "Eliminar observación",
            text: "¿Seguro que deseas eliminar la observacion?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si",
            cancelButtonText: "No",
        }).then(async (result) => {
            if (result.value) {
                idobservacion = id;
                let data = {
                    active: false,
                };
                try {
                    let comando = {
                        tipo: "update",
                        coleccion: "observaciones",
                        data: { ...data },
                        hora: Date.now(),
                        prioridad: 0,
                        idprov: id,
                        camposprov: "",
                    };
                    comandos.push(comando);
                    await setComandosSQL(db, comandos);
                    observaciones = observaciones.filter(
                        (o) => o.id != idobservacion,
                    );
                    changeObservacion();
                    await setObservacionesSQL(db, observaciones);
                    filterUpdate();
                    Swal.fire(
                        "Observación eliminada!",
                        "Se eliminó la observación correctamente.",
                        "success",
                    );
                } catch (err) {
                    Swal.fire(
                        "Acción cancelada",
                        "No se pudo eliminar la observacion",
                        "error",
                    );
                    console.error(err);
                }
                idobservacion = "";
                observacion = "";
                categoria = "";
                fecha = "";
            }
        });
    }
    function eliminarOnline(id) {
        Swal.fire({
            title: "Eliminar observación",
            text: "¿Seguro que deseas eliminar la observacion?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si",
            cancelButtonText: "No",
        }).then(async (result) => {
            if (result.value) {
                idobservacion = id;
                let data = {
                    active: false,
                };
                try {
                    const recordedit = await pb
                        .collection("observaciones")
                        .update(idobservacion, data);
                    observaciones = observaciones.filter(
                        (o) => o.id != idobservacion,
                    );
                    changeObservacion();
                    filterUpdate();
                    Swal.fire(
                        "Observación eliminada!",
                        "Se eliminó la observación correctamente.",
                        "success",
                    );
                } catch (err) {
                    Swal.fire(
                        "Acción cancelada",
                        "No se pudo eliminar la observacion",
                        "error",
                    );
                    console.error(err);
                }
                idobservacion = "";
                observacion = "";
                categoria = "";
                fecha = "";
            }
        });
    }
    async function eliminar(id) {
        coninternet = await getInternet(modedebug,offliner.offline)
        if (coninternet.connected) {
            eliminarOnline(id);
        } else {
            eliminarOffline(id);
        }
    }
    function cerrar() {
        idobservacion = "";
        fecha = "";
        observacion = "";
        categoria = "";
        animal = "";
        caravananuevo = "";
        categorianuevo = "";
        sexonuevo = "";
        fechanacimientonuevo = "";
        pesonuevo = "";
        agregaranimal = false;
        nuevoModal.close();
    }
    function filterUpdate() {
        observacionesrow = observacionescab;
        totalObservacionesEncontradas = observacionesrow.length;
        if (buscar != "") {
            observacionesrow = observacionesrow.filter((o) =>
                o.expand.animal.caravana
                    .toLocaleLowerCase()
                    .includes(buscar.toLocaleLowerCase()),
            );
            totalObservacionesEncontradas = observacionesrow.length;
        }
        if (fechadesde != "") {
            observacionesrow = observacionesrow.filter(
                (o) => o.fecha >= fechadesde,
            );
            totalObservacionesEncontradas = observacionesrow.length;
        }
        if (fechahasta != "") {
            observacionesrow = observacionesrow.filter(
                (o) => o.fecha <= fechahasta,
            );
            totalObservacionesEncontradas = observacionesrow.length;
        }
        if (buscarcategoria != "") {
            observacionesrow = observacionesrow.filter(
                (o) => o.categoria == buscarcategoria,
            );
            totalObservacionesEncontradas = observacionesrow.length;
        }
    }

    async function guardarAnimal2() {
        //Los nombres de la funciones horribles
        let totalanimals = await getTotalSQL(db);
        let verificar = true;
        //No funciona correctamente porque prueva el usuario cuando deberia probar el usuario
        //Dueño de la cabaña
        if (useroff.nivel != -1 && totalanimals >= useroff.nivel) {
            verificar = false;
        }
        if (!verificar) {
            Swal.fire(
                "Error guardar",
                `No tienes el nivel de la cuenta para tener mas de ${useroff.nivel} animales`,
                "error",
            );
            return { id: -1 };
        }
        let data = {
            caravana: caravananuevo,
            active: true,
            categoria: categorianuevo,
            delete: false,
            fechanacimiento: fechanacimientonuevo + " 03:00:00",
            sexo: sexonuevo,
            peso: pesonuevo,
            cab: caboff.id,
        };
        let idprov = "nuevo_animal_" + generarIDAleatorio();
        if (coninternet.connected) {
            let recorda = await pb.collection("animales").create(data);
            return recorda;
        } else {
            data.id = idprov;
            let comando = {
                tipo: "add",
                coleccion: "animales",
                data: { ...data },
                hora: Date.now(),
                prioridad: 3,
                idprov,
                //No tiene poque no lotes y rodeos
                camposprov: "",
            };
            comandos.push(comando);
            await setComandosSQL(db, comandos);
            return data;
        }
    }
    async function guardar2() {
        coninternet = await getInternet(modedebug,offliner.offline)

        let idprov = "nuevo_obs_" + generarIDAleatorio();
        if (agregaranimal) {
            let a = await guardarAnimal2();
            if (a.id == -1) {
                return;
            }
            animales.push(a);
            changeAnimales();
            await setAnimalesSQL(db, animales);
            let data = {
                animal: a.id,
                categoria: a.categoria,
                fecha: fecha + " 03:00:00",
                cab: caboff.id,
                observacion: observacion,
                active: true,
            };
            if (coninternet.connected) {
                let record = await pb.collection("observaciones").create(data);
                record.expand = { animal: a, cab: { id: caboff.id } };
                observaciones.push(record);
                changeObservacion();
                await setObservacionesSQL(db, observaciones);
                filterUpdate();
                Swal.fire(
                    "Éxito guardar",
                    "Se pudo guardar la observación con éxito",
                    "success",
                );
            } else {
                data.id = idprov;
                let comando = {
                    tipo: "add",
                    coleccion: "observaciones",
                    data: { ...data },
                    hora: Date.now(),
                    prioridad: 3,
                    idprov,
                    camposprov: "animal",
                };
                comandos.push(comando);
                await setComandosSQL(db, comandos);
                data.expand = { animal: a, cab: { id: caboff.id } };
                observaciones.push(data);
                changeObservacion();
                await setObservacionesSQL(db, observaciones);
                Swal.fire(
                    "Éxito guardar",
                    "Se pudo guardar la observación con éxito",
                    "success",
                );
            }
        }
        //Animal seleccionaod
        else {
            let data = {
                animal,
                fecha: fecha + " 03:00:00",
                categoria: categoria,
                cab: caboff.id,
                observacion: observacion,
                active: true,
            };
            if (coninternet.connected) {
                let record = await pb.collection("observaciones").create(data);
                record.expand = {
                    animal: animales.filter((an) => an.id == animal)[0],
                    cab: { id: caboff.id },
                };
                observaciones.push(record);
                changeObservacion();
                filterUpdate();
                await setObservacionesSQL(db, observaciones);
                Swal.fire(
                    "Éxito guardar",
                    "Se pudo guardar la observación con éxito",
                    "success",
                );
            } else {
                let nuevoanimal = animal.split("_")[0] == "nuevo";
                data.id = idprov;
                let comando = {
                    tipo: "add",
                    coleccion: "observaciones",
                    data: { ...data },
                    hora: Date.now(),
                    prioridad: 3,
                    idprov,
                    camposprov: nuevoanimal ? "animal" : "",
                };
                comandos.push(comando);
                await setComandosSQL(db, comandos);
                observaciones.push(record);
                changeObservacion();
                filterUpdate();
                Swal.fire(
                    "Éxito guardar",
                    "Se pudo guardar la observación con éxito",
                    "success",
                );
                filterUpdate();
            }
        }
    }
    async function editarOffline() {
        try {
            let data = {
                animal,
                fecha: fecha + " 03:00:00",
                categoria,
                observacion,
                id: idobservacion,
            };

            let comando = {
                tipo: "update",
                coleccion: "observaciones",
                data: { ...data },
                hora: Date.now(),
                prioridad: 0,
                idprov: id,
                camposprov: animal.split("_").length > 1 ? "animal" : "",
            };
            comandos.push(comando);
            await setComandosSQL(db, comandos);
            let a = animales.filter((an) => an.id == animal)[0];
            let idx = observaciones.findIndex((o) => o.id == idobservacion);
            observaciones[idx] = data;
            observaciones[idx].expand = { animal: a };
            observaciones.sort((o1, o2) =>
                new Date(o1.fecha) > new Date(o2.fecha) ? -1 : 1,
            );
            await setObservacionesSQL(db, observaciones);
            filterUpdate();
            Swal.fire(
                "Éxito editar",
                "Se pudo editar la observación",
                "success",
            );
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error editar",
                "No se pudo editar la observación",
                "error",
            );
        }
    }
    async function editarOnline() {
        try {
            let data = {
                animal,
                fecha: fecha + " 03:00:00",
                categoria,
                observacion,
            };
            const record = await pb
                .collection("observaciones")
                .update(idobservacion, data);
            let a = animales.filter((an) => an.id == animal)[0];
            let idx = observaciones.findIndex((o) => o.id == idobservacion);
            observaciones[idx] = record;
            observaciones[idx].expand = { animal: a };
            observaciones.sort((o1, o2) =>
                new Date(o1.fecha) > new Date(o2.fecha) ? -1 : 1,
            );
            filterUpdate();
            Swal.fire(
                "Éxito editar",
                "Se pudo editar la observación",
                "success",
            );
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error editar",
                "No se pudo editar la observación",
                "error",
            );
        }
    }
    async function editar() {
        coninternet = await getInternet(modedebug,offliner.offline)
        if (coninternet.connected) {
            await editarOnline();
        } else {
            await editarOffline();
        }
    }
    function validarBoton() {
        botonhabilitado = true;
        if (!agregaranimal && isEmpty(animal)) {
            botonhabilitado = false;
        }
        if (isEmpty(fecha)) {
            botonhabilitado = false;
        }
    }

    function validarBotonAnimal() {
        botonhabilitadoAnimal = true;
        if (!agregaranimal && isEmpty(caravana)) {
            botonhabilitadoAnimal = false;
        }
    }

    function onSelectAnimal() {
        if (animal == "agregar") {
            openNewAnimal();
        } else {
            let a = animales.filter((an) => an.id == animal)[0];
            categoria = a.categoria;
        }
    }
    function oninput(inputName) {
        validarBoton();
        //validarBotonAnimal()
        if (!agregaranimal && inputName == "ANIMAL") {
            if (isEmpty(animal)) {
                malanimal = true;
            } else {
                malanimal = false;
                onSelectAnimal();
            }
        }
        if (inputName == "FECHA") {
            if (isEmpty(fecha)) {
                malfecha = true;
            } else {
                malfecha = false;
            }
        }
    }
    function prepararData(item) {
        return {
            CARAVANA: item.expand.animal.caravana,
            FECHA: new Date(item.fecha).toLocaleDateString(),
            OBSERVACION: item.observacion,
        };
    }

    async function originalMount() {
        let pb_json = await JSON.parse(localStorage.getItem("pocketbase_auth"));
        usuarioid = pb_json.record.id;
        await getObservaciones();
        filterUpdate();
        await getAnimales();
    }
    async function initPage() {
        if(modedebug){
            coninternet = {connected:false} // await Network.getStatus();
            if(!offliner.offline){
                coninternet = await Network.getStatus();
            }
        }
        else{
            coninternet = await Network.getStatus();
        }
        useroff = await getUserOffline();
        caboff = await getCabOffline();
        usuarioid = useroff.id;
    }
    function changeObservacion() {
        observacionescab = observaciones.filter((o) => o.cab == caboff.id);
    }
    function changeAnimales() {
        animalescab = animales.filter((a) => a.cab == caboff.id);
    }
    async function updateLocalSQL() {
        await setUltimoObservacionesSQL(db)
        await setUltimoAnimalesSQL(db)
        observaciones = await updateLocalObservacionesSQLUser(
            db,
            pb,
            usuarioid,
        );

        animales = await updateLocalAnimalesSQLUser(db, pb, usuarioid);
        changeAnimales();
        changeObservacion();
        filterUpdate();
    }
    async function getLocalSQL() {
        let resobservaciones = await getObservacionesSQL(db);
        let resanimales = await getAnimalesSQL(db);
        observaciones = resobservaciones.lista;
        animales = resanimales.lista;
        changeObservacion();
        changeAnimales();
        filterUpdate();
    }
    async function updateComandos() {
        await flushComandosSQL(db,pb)
        comandos = []
    }
    async function getDataSQL() {
        db = await openDB();
        //Reviso el internet
        let lastinter = await getInternetSQL(db);
        let rescom = await getComandosSQL(db);
        let ultimo_observaciones = await getUltimoObservacionesSQL(db)
        comandos = rescom.lista;
        
        if (coninternet.connected) {
            await updateComandos()
            if (lastinter.internet == 0) {
                if(modedebug){
                    loger.addLog({
                        time:Date.now(),
                        text:"updatelocalsql"
                    })
                }
                await setInternetSQL(db, 1, 0);
                await updateLocalSQL();
            } else {
                let ahora = Date.now();
                let antes = ultimo_observaciones.ultimo;
                const cincoMinEnMs = ACTUALIZACION;
                if (ahora - antes >= cincoMinEnMs) {
                    
                    await updateLocalSQL();
                    
                } else {
                    await getLocalSQL();
                }
            }
            
        } else {
            if(modedebug){
                loger.addLog({
                    time:Date.now(),
                    text:"getdatasql"
                })
            }
            
            await getLocalSQL();
            await setInternetSQL(db, 0, Date.now());
        }
    }
    onMount(async () => {
        await initPage();
        await getDataSQL();
    });
</script>
<Barrainternet bind:coninternet/>
<Navbarr>
    {#if modedebug}
        <div class="grid grid-cols-3">
            <div>
                <span>
                    {coninternet.connected?"COn internet":"sin internet"}
                </span>
            </div>
            <div>
                <span>
                    internet {ultimo_observaciones.ultimo}
                </span>
            </div>
            <div>
                <span>
                    get local{getlocal}
                </span>
            </div>
        </div>
    {/if}
    <div class="grid grid-cols-2 lg:grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Observaciones</h1>
        </div>
        <div class="flex col-span-2 gap-1 justify-start lg:justify-end">
            <div>
                <button
                    class={` btn btn-primary rounded-lg ${estilos.btntext} px-2 mx-1`}
                    data-theme="forest"
                    onclick={() => openNewModal()}
                >
                    <span class="text-lg m-1">Nuevo</span>
                </button>
            </div>
            <div>
                <Exportar
                    titulo={"Observaciones"}
                    filtros={[]}
                    confiltros={false}
                    data={observacionesrow}
                    {prepararData}
                />
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 m-1 mb-2 mt-1 mx-1 lg:mx-10 w-11/12">
        <div class="w-full lg:w-1/2">
            <label
                class={`
                        input input-bordered flex items-center gap-2
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
    </div>
    <div class="w-11/12 m-1 mb-2 lg:mx-10 rounded-lg bg-transparent">
        <button aria-label="Filtrar" class="w-full" onclick={clickFilter}>
            <div class="flex justify-between items-center px-2">
                <h1 class="font-bold text-lg py-2">Filtros</h1>
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
                >Total de observaciones encontradas: {totalObservacionesEncontradas}</span
            >
        </div>
        {#if isOpenFilter}
            <div transition:slide>
                <div class="grid grid-cols-1 lg:grid-cols-4">
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
                        <label for="categoria" class="tracking-wide label">
                            <span class="label-text text-base">Categoria</span>
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
                                bind:value={buscarcategoria}
                                onchange={filterUpdate}
                            >
                                <option value="">Todos</option>
                                {#each categorias as s}
                                    <option value={s.id}>{s.nombre}</option>
                                {/each}
                            </select>
                        </label>
                    </div>
                </div>
            </div>
        {/if}
    </div>
    <div
        class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto"
    >
        <table class="table table-lg w-full">
            <thead>
                <tr>
                    <th class="text-base border-b dark:border-gray-600"
                        >Fecha</th
                    >
                    <th class="text-base border-b dark:border-gray-600"
                        >Animal</th
                    >
                    <th class="text-base border-b dark:border-gray-600"
                        >Categoria</th
                    >
                    <th class="text-base border-b dark:border-gray-600"
                        >Observacion</th
                    >
                </tr>
            </thead>
            <tbody>
                {#each observacionesrow as o}
                    <tr
                        onclick={() => openModalEditar(o.id)}
                        class=" hover:bg-gray-200 dark:hover:bg-gray-900"
                    >
                        <td class="text-base">
                            {`${new Date(o.fecha).toLocaleDateString()}`}
                        </td>
                        <td class="text-base">
                            {`${o.expand.animal.caravana}`}
                        </td>
                        <td class="text-base">
                            {`${o.categoria}`}
                        </td>
                        <td class="text-base">
                            {`${o.observacion}`}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="block w-full md:hidden justify-items-center mx-1">
        {#each observacionesrow as o}
            <div
                class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
            >
                <button onclick={() => openModalEditar(o.id)}>
                    <div class="block p-4">
                        <div class="grid grid-cols-2 gap-y-2">
                            <div class="flex items-start">
                                <span>Fecha:</span>
                                <span class="mx-1 font-semibold">
                                    {new Date(o.fecha).toLocaleDateString()}
                                </span>
                            </div>
                            <div class="flex items-start">
                                <span>Caravana:</span>
                                <span class="mx-1 font-semibold">
                                    {`${o.expand.animal.caravana}`}
                                </span>
                            </div>
                            <div class="col-span-2 flex items-start">
                                <span>{`${o.observacion}`}</span>
                            </div>
                        </div>
                    </div>
                </button>
            </div>
        {/each}
    </div>
</Navbarr>
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
        {#if idobservacion == ""}
            <h3 class="text-lg font-bold">Nueva observación</h3>
        {:else}
            <h3 class="text-lg font-bold">Editar observación</h3>
        {/if}
        <div class="form-control">
            <NuevaObservacion
                {oninput}
                bind:agregaranimal bind:caravananuevo bind:categorianuevo
                bind:sexonuevo bind:pesonuevo bind:fechanacimientonuevo
                bind:animal bind:animalescab bind:malanimal
                bind:categoria bind:caravana bind:idobservacion
                bind:malcaravana bind:sexo bind:peso
                bind:fecha bind:malfecha bind:observacion

            ></NuevaObservacion>
        </div>
        <div class="modal-action justify-start">
            <form method="dialog">
                <!-- if there is a button, it will close the modal -->
                {#if idobservacion == ""}
                    <button
                        class="btn btn-success text-white"
                        disabled={!botonhabilitado}
                        onclick={guardar2}>Guardar</button
                    >
                {:else}
                    <button
                        class="btn btn-success text-white"
                        disabled={!botonhabilitado}
                        onclick={editar}>Editar</button
                    >
                    <button
                        class="btn btn-error text-white"
                        onclick={async () =>  await eliminar(idobservacion)}>Eliminar</button
                    >
                {/if}
                <button class="btn btn-neutral" onclick={cerrar}>Cerrar</button>
            </form>
        </div>
    </div>
</dialog>

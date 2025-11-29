<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import estilos from "$lib/stores/estilos";
    import PocketBase from "pocketbase";
    import tiposanimal from "$lib/stores/tiposanimal";
    import { guardarHistorial } from "$lib/historial/lib";
    import PredictSelect from "../PredictSelect.svelte";
    import { getWholeWordButLastLetter, addDays } from "$lib/stringutil/lib";
    import MultipleToros from "../MultipleToros.svelte";
    import { shorterWord } from "$lib/stringutil/lib";
    import Swal from "sweetalert2";
    import {
        concatComandosSQL,
        setComandosSQL,
    } from "$lib/stores/sqlite/dbcomandos";
    import { getAnimalesSQL } from "$lib/stores/sqlite/dbanimales";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import {
        addnewInseminacionSQL,
        addNewServicioSQL,
    } from "$lib/stores/sqlite/dbeventos";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { getInternet } from "$lib/stores/offline";
    //formulario
    import CustomDate from "../CustomDate.svelte";
    import SelectFertil from "../SelectFertil.svelte";
    //permisos
    import {
        verificarNivel,
        getPermisosList,
        getPermisosMessage,
    } from "$lib/permisosutil/lib";
    import { updatePermisos } from "$lib/stores/capacitor/offlinecab";
    import ImportarAnimal from "../importar/ImportarAnimal.svelte";
    import { customoffliner } from "$lib/stores/offline/custom.svelte";
    import { loger } from "$lib/stores/logs/logs.svelte";
    let ruta = import.meta.env.VITE_RUTA;
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    const pb = new PocketBase(ruta);
    let {
        comandos = $bindable([]),
        servicios = $bindable([]),
        inseminaciones = $bindable([]),
        animales = $bindable([]),
        coninternet = $bindable({}),
        db,
        caravana = $bindable(""),

        cabid,
        categoria,
        usuarioid,
        caboff = $bindable({}),
    } = $props();
    let id = $state("");

    let options = [
        { id: true, nombre: "Servicio" },
        { id: false, nombre: "Inseminación" },
    ];

    function select(id) {
        esServicio = id;
    }

    //let servicios = $state([])
    //let inseminaciones = $state([])
    let filas = $state([]);
    let padres = $state([]);

    //Datos compartidos
    let esServicio = $state(true);
    let cargado = $state(false);
    let categoriafila = $state("");
    let fechaparto = $state("");
    let listapadres = $state([]);
    //datos servicio
    let idserv = $state("");
    let padreslist = $state([]);
    let padresserv = $state("");
    let pajuelasserv = $state("");
    let fechadesde = $state("");
    let fechahasta = $state("");
    let observacion = $state("");
    //Datos de la inseminacion
    let idins = $state("");
    let categoriains = $state("");
    let fechainseminacion = $state("");
    let padre = $state("");
    let pajuela = $state("");
    //Para ver todo
    let serviciosrows = $state([]);
    function openNewModal(id, p_esServicio) {
        esServicio = p_esServicio;
        if (id == "") {
            categoriafila = "";
            fechaparto = "";
            padreslist = [];
            padresserv = "";
            pajuelasserv = "";
            fechadesde = "";
            fechahasta = "";
            observacion = "";
            categoriains = "";
            fechainseminacion = "";
            padre = "";
            pajuela = "";
            idins = id;
            idserv = id;
        } else {
            if (esServicio) {
                let ser = serviciosrows.filter((s) => s.id == id)[0];
                idserv = id;
                fechadesde = ser.fechadesde.split(" ")[0];
                fechahasta = ser.fechahasta.split(" ")[0];
                fechaparto = ser.fechaparto.split(" ")[0];
                observacion = ser.observacion;
                padreslist = ser.padres.split(",");
            } else {
                idins = id;
                let ser = serviciosrows.filter((s) => s.id == id)[0];
                fechainseminacion = ser.fechainseminacion.split(" ")[0];
                padre = ser.padre;
                pajuela = ser.pajuela;
                fechaparto = ser.fechaparto.split(" ")[0];
                observacion = ser.observacion;
                categoriains = ser.categoria;
            }
        }

        nuevoServicioModal.showModal();
    }

    function getCategoriaNombre(cat) {
        let tp = tiposanimal.filter((c) => c.id == cat)[0];
        if (tp) {
            return tp.nombre;
        } else {
            return "";
        }
    }
    //ELiminar
    async function eliminarInseminacionOffline() {}
    async function eliminarInseminacionOnline() {}
    async function eliminarInseminacion() {}
    async function eliminarServicioOffline() {}
    async function eliminarServicioOnline() {}
    async function eliminarServicio() {}
    //EDitar
    async function editarInseminacionOffline() {}
    async function editarInseminacionOnline() {}
    async function editarInseminacion() {}
    async function editarServicioOffline() {}
    async function editarServicioOnline() {}
    async function editarServicio() {}
    //Guardar
    async function guardarInseminacionOffline() {
        let idprov = "nuevo_ins_" + generarIDAleatorio();
        let data = {
            cab: cabid,
            animal: id,
            fechaparto: fechaparto + " 03:00:00",
            fechainseminacion: fechainseminacion + " 03:00:00",
            active: true,
            padre: padre,
            pajuela: pajuela,
            categoria: categoria,
            observacion: observacion,
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
                show: { ...data },
                motivo: "Guardar inseminación",
            };
            comandos.push(comando);
            data = {
                ...data,
                expand: {
                    animal: {
                        id,
                        caravana,
                    },
                },
            };
            inseminaciones.push(data);
            onChangeServicios();
            await addnewInseminacionSQL(db, data);

            await setComandosSQL(db, comandos);
            Swal.fire(
                "Éxito inseminación",
                "Se logró guardar la inseminación",
                "success",
            );
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error inseminación",
                "Hubo un error al guardar la inseminación",
                "error",
            );
        }
        nuevoServicioModal.close();
    }
    async function guardarInseminacionOnline() {
        caboff = await updatePermisos(pb, usuarioid);
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[4]) {
            Swal.fire("Error permisos", getPermisosMessage(4), "error");
            return;
        }
        let data = {
            cab: cabid,
            animal: id,
            fechaparto: fechaparto + " 03:00:00",
            fechainseminacion: fechainseminacion + " 03:00:00",
            active: true,
            padre: padre,
            pajuela: pajuela,
            categoria: categoria,
            observacion: observacion,
        };
        try {
            let record = await pb.collection("inseminacion").create(data);
            record = {
                ...record,
                expand: {
                    animal: {
                        id,
                        caravana,
                    },
                },
            };
            inseminaciones.push(record);
            onChangeServicios();
            await addnewInseminacionSQL(db, record);
            Swal.fire(
                "Éxito inseminación",
                "Se logró guardar la inseminación",
                "success",
            );
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error inseminación",
                "Hubo un error al guardar la inseminación",
                "error",
            );
        }
        nuevoServicioModal.close();
    }
    async function guardarInseminacion() {
        if (coninternet.connected) {
            await guardarInseminacionOnline();
        } else {
            await guardarInseminacionOffline();
        }
    }
    async function guardarServicioOnline() {
        caboff = await updatePermisos(pb, usuarioid);
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[4]) {
            Swal.fire("Error permisos", getPermisosMessage(4), "error");
            return;
        }
        let data = {
            fechadesde: fechadesde + " 03:00:00",
            fechaparto: fechaparto + " 03:00:00",
            observacion: observacion,
            madre: id,
            padres: padreslist.join(),
            active: true,
            cab: cabid,
        };
        if (fechahasta != "") {
            data.fechahasta = fechahasta + " 03:00:00";
        }
        try {
            let record = await pb.collection("servicios").create(data);
            record = {
                ...record,
                expand: {
                    madre: {
                        id,
                        caravana,
                    },
                },
            };
            servicios.push(record);
            await addNewServicioSQL(db, record);
            onChangeServicios();
            //Mis dudas con las fechas
            //prenadaori = 3
            //guardarHistorial(pb,id)
            //await pb.collection('animales').update(id,{prenada:3})

            Swal.fire(
                "Éxito servicio",
                "Se logró guardar el servicio",
                "success",
            );
        } catch (err) {
            Swal.fire(
                "Error servicio",
                "Hubo un error al guardar el servicio",
                "error",
            );
        }
        nuevoServicioModal.close();
    }
    async function guardarServicioOffline() {
        let idprov = "nuevo_servicio_" + generarIDAleatorio();
        let data = {
            fechadesde: fechadesde + " 03:00:00",
            fechaparto: fechaparto + " 03:00:00",
            observacion: observacion,
            madre: id,
            padres: padreslist.join(),
            active: true,
            cab: cabid,
            id: idprov,
        };
        if (fechahasta != "") {
            data.fechahasta = fechahasta + " 03:00:00";
        }
        try {
            let nmadre = data.madre.split("_").length > 1;
            let npadres = data.padres.split("_").length > 1;
            let comando = {
                tipo: "add",
                coleccion: "servicios",
                data: { ...data },
                hora: Date.now(),
                prioridad: 3,
                idprov,
                camposprov: `${nmadre && npadres ? "madre,padres" : nmadre ? "madre" : npadres ? "padres" : ""}`,
                show: { ...data },
                motivo: "Nuevo servicio",
            };

            comandos.push(comando);
            data = {
                ...data,
                expand: {
                    madre: {
                        id,
                        caravana,
                    },
                },
            };

            servicios.push(data);
            await addNewServicioSQL(db, data);
            await setComandosSQL(db, comandos);
            onChangeServicios();
            Swal.fire(
                "Éxito servicio",
                "Se logró guardar el servicio",
                "success",
            );
        } catch (er) {
            console.error(er);
            Swal.fire(
                "Error servicio",
                "Hubo un error al guardar el servicio",
                "error",
            );
        }
        nuevoServicioModal.close();
    }
    async function guardarServicio() {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        if (esServicio) {
            if (coninternet.connected) {
                await guardarServicioOnline();
            } else {
                await guardarServicioOffline();
            }
        } else {
            await guardarInseminacion();
        }
        onChangeServicios();
        serviciosrows.sort((a1, a2) => {
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
            return f1.localeCompare(f2);
        });
    }

    function getNombrePadres(p_padres) {
        let ids = p_padres.split(",");

        let nombres = ids.reduce(
            (acc, valor) =>
                shorterWord(animales.filter((p) => p.id == valor)[0].caravana) +
                " , " +
                acc,
            "",
        );

        return getWholeWordButLastLetter(nombres);
    }
    function oninputSer(campo) {
        if (fechadesde.length > 0) {
            try {
                fechaparto = addDays(fechadesde, 280)
                    .toISOString()
                    .split("T")[0];
            } catch (err) {
                fechaparto = "";
            }
        } else {
            fechaparto = "";
        }
    }
    function oninputIns(campo) {
        if (fechainseminacion.length > 0) {
            try {
                fechaparto = addDays(fechainseminacion, 280)
                    .toISOString()
                    .split("T")[0];
            } catch (err) {
                fechaparto = "";
            }
        } else {
            fechaparto = "";
        }
    }
    function onChangeServicios() {
        serviciosrows = servicios.filter((s) => s.active && s.madre == id);

        serviciosrows = serviciosrows.concat(
            inseminaciones.filter((i) => i.active && i.animal == id),
        );
        serviciosrows.sort((a1, a2) => {
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
            return f1.localeCompare(f2);
        });
    }
    onMount(() => {
        id = $page.params.slug;
        onChangeServicios();
        padres = animales.filter(
            (a) => a.active && a.cab == cabid && a.sexo == "M",
        );
        padres.sort((a1,a2)=>a1.caravana.toLocaleLowerCase()<a2.caravana.toLocaleLowerCase()?-1:1)
        listapadres = padres.map((p) => ({ id: p.id, nombre: p.caravana }));
        
        cargado = true;
    });
</script>

<div class="w-full flex justify-items-start gap-2">
    <div>
        <button
            aria-label="Nuevo"
            onclick={() => openNewModal("", false)}
            class={`
                ${estilos.sinbordes} ${estilos.chico} ${estilos.primario}
            `}
        >
            Nuevo
        </button>
    </div>
</div>
<div class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto">
    {#if serviciosrows.length == 0}
        <p class="mt-5 text-lg">No tiene servicios</p>
    {:else}
        <div
            class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto"
        >
            <table class="table table-lg">
                <thead>
                    <tr>
                        <th class="text-base ml-3 pl-3 mr-1 pr-1">Fecha</th>
                        <th class="text-base ml-3 pl-3 mr-1 pr-1"
                            >Fecha hasta</th
                        >
                        <th class="text-base ml-3 pl-3 mr-1 pr-1"
                            >Fecha parto</th
                        >
                        <th class="text-base mx-1 px-1">Padres</th>
                        <th class="text-base mx-1 px-1">Tipo</th>
                    </tr>
                </thead>
                <tbody>
                    {#each serviciosrows as s}
                        <tr
                            class="hover:bg-gray-200 dark:hover:bg-gray-900"
                            onclick={() =>
                                s.fechadesde
                                    ? openNewModal(s.id, true)
                                    : openNewModal(s.id, false)}
                        >
                            <td
                                class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10 border-b dark:border-gray-600"
                                >{new Date(
                                    s.fechadesde,
                                ).toLocaleDateString()}</td
                            >
                            <td
                                class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10 border-b dark:border-gray-600"
                                >{s.fechahasta
                                    ? new Date(
                                          s.fechadesde,
                                      ).toLocaleDateString()
                                    : ""}</td
                            >
                            <td
                                class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10 border-b dark:border-gray-600"
                                >{new Date(
                                    s.fechaparto,
                                ).toLocaleDateString()}</td
                            >
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
            {#each serviciosrows as s}
                <div
                    class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                >
                    <button
                        onclick={() =>
                            s.fechadesde
                                ? openNewModal(s.id, true)
                                : openNewModal(s.id, false)}
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
                                    <span>
                                        Fecha {s.fechadesde
                                            ? "desde"
                                            : "de inseminación"}:
                                    </span>
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
                                {#if s.fechadesde}
                                    <div class="flex items-start">
                                        <span>Fecha hasta:</span>
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
                                {/if}
                                <div class="col-span-2 flex items-start">
                                    <span>
                                        {s.fechadesde ? "Padres" : "Padre"}
                                    </span>
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
    {/if}
</div>
<dialog
    id="nuevoServicioModal"
    class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle"
>
    <div
        class="
            modal-box w-11/12 max-w-5xl
            bg-gradient-to-br from-white to-gray-100
            dark:from-gray-900 dark:to-gray-800
            h-[80vh]
        "
    >
        <form method="dialog">
            <button
                class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl"
                >✕</button
            >
        </form>
        {#if idins == "" && idserv == ""}
            <h3 class="text-lg font-bold">
                {esServicio ? "Nuevo servicio" : "Nueva inseminación"}
            </h3>
        {:else}
            <h3 class="text-lg font-bold">
                {esServicio ? "Ver servicio" : "Ver inseminación"}
            </h3>
        {/if}

        <div class="form-control">
            <div
                class="bg-transparent grid grid-cols-2 lg:grid-cols-3 lg:grid-cols-4"
            >
                {#each options as op}
                    <button
                        id={op.id}
                        onclick={() => select(op.id)}
                        class={`
                            flex-1 m-1 py-2 px-2 rounded-lg font-medium text-sm transition-all duration-200 ease-in-out
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                            ${
                                esServicio == op.id
                                    ? "bg-green-600 text-white shadow-lg transform scale-105"
                                    : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-gray-700 dark:text-green-300 dark:hover:bg-gray-600"
                            }
                        `}
                    >
                        {op.nombre}
                    </button>
                {/each}
            </div>
            {#if esServicio}
                <div>
                    <label for="toros" class="label">
                        <span class="label-text text-base">Toros</span>
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
                </div>
                <CustomDate
                    etiqueta={"Fecha desde"}
                    bind:fecha={fechadesde}
                    onchange={() => oninputSer("DESDE")}
                />

                <CustomDate etiqueta={"Fecha hasta"} bind:fecha={fechahasta} />

                <div class="">
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

                <div>
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
                        bind:value={observacion}
                    />
                </div>
            {:else}
                {#if cargado}
                    <PredictSelect
                        bind:valor={padre}
                        etiqueta={"Padre"}
                        bind:cadena={pajuela}
                        lista={listapadres}
                    />
                {/if}
                <CustomDate
                    etiqueta={"Fecha de inseminación"}
                    bind:fecha={fechainseminacion}
                    onchange={() => oninputIns("FECHAINSEMINACION")}
                />

                <div class="">
                    <label for="fechaparto" class="label">
                        <span class="label-text text-base"
                            >Fecha estimada de parto</span
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
                        />
                    </label>
                </div>

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
                    bind:value={observacion}
                />
            {/if}
        </div>
        <div class="modal-action justify-start">
            {#if idserv == "" && idins == ""}
                <button
                    class="btn btn-success text-white"
                    onclick={guardarServicio}>Guardar</button
                >
            {/if}
            <button
                class="btn btn-error text-white"
                onclick={() => nuevoServicioModal.close()}>Cancelar</button
            >
        </div>
    </div>
</dialog>

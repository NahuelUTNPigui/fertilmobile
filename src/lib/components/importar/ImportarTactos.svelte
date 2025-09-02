<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from "xlsx";
    import { Filesystem, Directory } from "@capacitor/filesystem";
    import { createCaber } from "$lib/stores/cab.svelte";
    import PocketBase from "pocketbase";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import { guardarHistorial } from "$lib/historial/lib";
    import { goto } from "$app/navigation";
    import categorias from "$lib/stores/categorias";
    import { getTactosSQL, setTactosSQL } from "$lib/stores/sqlite/dbeventos";
    import { esMismoDia } from "$lib/stringutil/lib";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { getPermisosList, getPermisosMessage } from "$lib/permisosutil/lib";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";

    let {
        db,
        coninternet,
        useroff,
        caboff = $bindable({}),
        usuarioid,
        animales,
        //acciones
        aparecerToast,
    } = $props();
    let ruta = import.meta.env.VITE_RUTA;
    let caber = createCaber();
    let cab = caber.cab;
    let tactos = $state([]);

    //Los templates en el cellphobe
    //Con internet te de este excel sin internet te de uno comun
    function exportarTemplate2() {
        goto(`${ruta}/Modelo tactos.xlsx`);
    }
    const pb = new PocketBase(ruta);
    let filename = $state("");
    let wkbk = $state(null);
    let loading = $state(false);
    let vertactos = $state([]);

    async function exportarTemplateOffline() {
        let csvData = [
            {
                fecha: "MM/DD/AAAA",
                caravana: "AAA",
                prenada: "preñada/vacia/servicio",
                tipo: "eco/tacto",
                observacion: "",
                categoria: "",
            },
        ].map((item) => ({
            FECHA: item.fecha,
            CARAVANA: item.caravana,
            PREÑADA: item.prenada,
            TIPO_TACTO: item.tipo,
            OBSERVACION: item.observacion,
            CATEGORIA: item.categoria,
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, "Tactos");

        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo Tactos.xlsx",
                directory: Directory.Documents,
            });
        } catch (e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo Tactos.xlsx",
            directory: Directory.Documents,
        });
    }
    async function exportarTemplateOnline() {
        let csvData = [
            {
                fecha: "MM/DD/AAAA",
                caravana: "AAA",
                prenada: "preñada/vacia/servicio",
                tipo: "eco/tacto",
                observacion: "",
                categoria: "",
            },
        ].map((item) => ({
            FECHA: item.fecha,
            CARAVANA: item.caravana,
            PREÑADA: item.prenada,
            TIPO_TACTO: item.tipo,
            OBSERVACION: item.observacion,
            CATEGORIA: item.categoria,
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, "Tactos");

        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo Tactos.xlsx",
                directory: Directory.Documents,
            });
        } catch (e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo Tactos.xlsx",
            directory: Directory.Documents,
        });
    }
    async function exportarTemplate() {
        aparecerToast();
        if (coninternet.connected) {
            await exportarTemplateOnline();
        } else {
            await exportarTemplateOffline();
        }
    }
    function importarArchivo(event) {
        let file = event.target.files[0];

        filename = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            const workbook = XLSX.read(e.target.result, { type: "binary" });
            wkbk = workbook;
        };
        reader.readAsBinaryString(file);
    }
    async function procesarArchivoOnline(tactosimportar) {
        let errores = false;
        for (let i = 0; i < tactosimportar.length; i++) {
            let ta = tactosimportar[i];
            let lista_categoria = categorias.filter(
                (c) => c.id.toLowerCase() == ta.categoria.toLowerCase(),
            );

            let ans = animales.filter(
                (a) => a.caravana == ta.caravana && a.cab == caboff.id,
            );

            let categoria = ans.categoria;
            if (lista_categoria.length != 0) {
                categoria = lista_categoria[0].id;
            }
            if (ans.length == 0) {
                if (modedebug) {
                    loger.addError({
                        time: Date.now(),
                        text: "mal animal: " + ta.caravana,
                    });
                }
            }
            //que pasa si hay mas de un animal con esa caravana?
            let an = ans[0];
            let sinsexo = an.sexo == undefined

            if (sinsexo || an.sexo == "M") {
                if (modedebug) {
                    loger.addError({
                        time: Date.now(),
                        text: "mal sexo: " + an.sexo,
                    });
                }
                continue;
            }
            if (ta.fecha == "") {
                if (modedebug) {
                    loger.addError({
                        time: Date.now(),
                        text:
                            "mal fecha: " +
                            new Date(ta.fecha).toLocaleDateString(),
                    });
                }
                continue;
            }
            let esFechaValida = new Date(ta.fecha).getTime() > 0;
            if (!esFechaValida) {
                continue;
            }
            let fecha =
                new Date(ta.fecha).toISOString().split("T")[0] + " 03:00:00";
            let dataadd = {
                fecha: fecha,
                active: true,
                observacion: ta.observacion,
                animal: an.id,
                categoria: categoria,
                prenada: ta.prenada,
                tipo: ta.tipo,
                cab: caboff.id,
            };
            let datamod = {
                observacion: ta.observacion,
                prenada: ta.prenada,
                tipo: ta.tipo,
            };
            //Si hay algun animal con esa caravana, se va a modificar
            let t_idx = tactos.findIndex((t) => {
                let mismotacto = t.animal == an.id;

                mismotacto = mismotacto && esMismoDia(fecha, t.fecha);
                mismotacto = mismotacto && t.active;
                return mismotacto;
            });
            //Si no existe lo guardo
            if (t_idx == -1) {
                try {
                    let recordtacto = await pb
                        .collection("tactos")
                        .create(dataadd);
                    recordtacto = {
                        ...recordtacto,
                        expand: {
                            animal: {
                                id: recordtacto.animal,
                                caravana: an.caravana,
                                categoria: an.categoria,
                            },
                            cab: {
                                user: { id: usuarioid },
                            },
                        },
                    };
                    tactos.push(recordtacto);
                } catch (err) {
                    if (modedebug) {
                        loger.addError({
                            time: Date.now(),
                            text: JSON.stringify(err, null, 2),
                        });
                    }
                    console.error(err);
                    errores = true;
                }
            } else {
                try {
                    //let test = {
                    //    ...tactos[t_idx],
                    //    ...datamod
                    //}
                    await pb
                        .collection("tactos")
                        .update(tactos[t_idx].id, datamod);
                    tactos[t_idx] = {
                        ...tactos[t_idx],
                        ...datamod,
                    };
                } catch (err) {
                    if (modedebug) {
                        loger.addError({
                            time: Date.now(),
                            text: JSON.stringify(err, null, 2),
                        });
                    }
                    console.error(err);
                    errores = true;
                }
            }
        }
        return errores;
    }
    async function mostrarTactos() {
        await getDataSQL();
        let ans = animales.filter((a) => a.caravana == "AAA");
    }
    async function procesarArchivoOffline(tactosimportar) {
        let errores = false;
        let comandos = [];
        for (let i = 0; i < tactosimportar.length; i++) {
            let ta = tactosimportar[i];
            let categoria = categorias.filter(
                (c) => c.id == an.categoria || c.nombre == an.categoria,
            )[0];
            let ans = animales.filter((a) => a.caravana == ta.caravana);
            if (ans.length == 0) {
                continue;
            }
            let an = ans[0];
            if (an.sexo == "M") {
                continue;
            }
            let dataadd = {
                fecha: "",
                active: true,
                observacion: ta.observacion,
                animal: an.id,
                categoria: an.categoria,
                prenada: ta.prenada,
                tipo: ta.tipo,
                cab: cab.id,
            };

            let datamod = {
                observacion: ta.observacion,
                prenada: ta.prenada,
                tipo: ta.tipo,
            };
            try {
                //Agregar Tacto si no existe
                let fecha = ta.fecha.toISOString().split("T")[0] + " 03:00:00";
                dataadd.fecha = fecha;
            } catch (err) {
                console.error(err);
                errores = true;
                continue;
            }

            try {
                const record = await pb
                    .collection("tactos")
                    .getFirstListItem(
                        `fecha="${fecha}" && animal="${an.id}"`,
                        {},
                    );
                await pb.collection("tactos").update(record.id, datamod);
                //Pensar lo de los estados y el historial
                await guardarHistorial(pb, an.id);
                await pb
                    .collection("animales")
                    .update(an.id, { prenada: ta.prenada });
            } catch (err) {
                await pb.collection("tactos").create(dataadd);
                await guardarHistorial(pb, an.id);
                await pb
                    .collection("animales")
                    .update(an.id, { prenada: ta.prenada });
            }
        }
        let dataprocesar = {
            errores,
            comandos,
        };
        return dataprocesar;
    }
    async function procesarArchivo() {
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[2]) {
            Swal.fire("Error permisos", getPermisosMessage(2), "error");
            loading = false;
            filename = "";
            wkbk = null;
            return;
        }
        if (filename == "") {
            Swal.fire("Error", "Seleccione un archivo", "error");
        }

        let sheettactos = wkbk.Sheets.Tactos;
        if (!sheettactos) {
            Swal.fire("Error", "Debe subir un archivo válido", "error");
        }
        await getDataSQL();
        let tactosprocesar = [];
        let tactoshashmap = {};
        loading = true;

        for (const [key, value] of Object.entries(sheettactos)) {
            const firstLetter = key.charAt(0); // Get the first character
            const tail = key.slice(1);
            if (key == "!ref" || key == "!margins" || tail == "1") {
                continue;
            }
            if (tactoshashmap[tail]) {
                if (firstLetter == "A") {
                    tactoshashmap[tail].fecha = value.w ? value.w : "";
                }
                if (firstLetter == "B") {
                    tactoshashmap[tail].caravana = value.v;
                }
                if (firstLetter == "C") {
                    let estado = value.v.toLocaleLowerCase();
                    if (estado == "preñada") {
                        tactoshashmap[tail].prenada = 2;
                    } else if (estado == "dudosa") {
                        tactoshashmap[tail].prenada = 1;
                    } else if (estado == "servicio") {
                        tactoshashmap[tail].prenada = 3;
                    } else {
                        tactoshashmap[tail].prenada = 0;
                    }
                }
                if (firstLetter == "D") {
                    tactoshashmap[tail].tipo = value.v.toLowerCase();
                }
                if (firstLetter == "E") {
                    tactoshashmap[tail].observacion = value.v;
                }
                if (firstLetter == "F") {
                    tactoshashmap[tail].categoria = value.v;
                }
            } else {
                tactoshashmap[tail] = {
                    fecha: "",
                    observacion: "",
                    caravana: "",
                    categoria: "",
                    prenada: "",
                    tipo: "",
                    nombreveterinario: "",
                };
                if (firstLetter == "A") {
                    tactoshashmap[tail].fecha = value.w ? value.w : "";
                }

                if (firstLetter == "B") {
                    tactoshashmap[tail].caravana = value.v;
                }

                if (firstLetter == "C") {
                    let estado = value.v.toLocaleLowerCase();
                    if (estado == "preñada") {
                        tactoshashmap[tail].prenada = 2;
                    } else if (estado == "dudosa") {
                        tactoshashmap[tail].prenada = 1;
                    } else if (estado == "servicio") {
                        tactoshashmap[tail].prenada = 3;
                    } else {
                        tactoshashmap[tail].prenada = 0;
                    }
                }
                if (firstLetter == "D") {
                    tactoshashmap[tail].tipo = value.v.toLowerCase();
                }
                if (firstLetter == "E") {
                    tactoshashmap[tail].observacion = value.v;
                }
                if (firstLetter == "F") {
                    tactoshashmap[tail].categoria = value.v;
                }
            }
        }

        for (const [key, value] of Object.entries(tactoshashmap)) {
            if (value.caravana != "" && value.fecha != "" && value.tipo != "") {
                tactosprocesar.push(value);
            }
        }
        vertactos = tactosprocesar.map((t) => t);

        let errores = false;

        if (coninternet.connected) {
            if (!listapermisos[4]) {
                Swal.fire("Error permisos", getPermisosMessage(4), "error");
                filename = "";
                wkbk = null;
                loading = false;
                return;
            }

            errores = await procesarArchivoOnline(tactosprocesar);
            await setTactosSQL(db, tactos);
        } else {
            Swal.fire(
                "Atención",
                "No tienes conexión a internet, no esta habilitado todavia",
                "warning",
            );
            //let dataprocesar = await procesarArchivoOffline(tactosprocesar)
            //errores = dataprocesar.errores
            //let comandos = dataprocesar.comandos
            //await setTactosSQL(db,tactos)
        }
        if (errores) {
            Swal.fire("Error importar", "Hubo algún tacto con error", "error");
        } else {
            Swal.fire(
                "Éxito importar",
                "Se lograron importar los datos",
                "success",
            );
        }
        filename = "";
        wkbk = null;
        loading = false;
    }
    async function getLocalSQL() {
        let restactos = await getTactosSQL(db);
        tactos = restactos.lista;
    }
    async function getDataSQL() {
        await getLocalSQL();
    }
</script>

<div class="space-y-4 grid grid-cols-1 flex justify-center">
    {#if modedebug}
        <button class="btn btn-primary" onclick={mostrarTactos}
            >Mostrar Tactos</button
        >
    {/if}
    {#if modedebug && vertactos.length > 0}
        <ul>
            {#each vertactos as vt}
                <li>
                    {JSON.stringify(vt, null, 2)}
                </li>
            {/each}
        </ul>
    {/if}
    <button
        class={`
            w-full text-center
            ${estilos.basico} ${estilos.grande} ${estilos.secundario}
        `}
        onclick={exportarTemplate}
    >
        Descargar Plantilla
    </button>
    <div
        class={`
        w-full
        
    `}
    >
        <input
            type="file"
            accept=".xlsx, .xls"
            class="sr-only"
            id="tactos-upload"
            onchange={(e) => importarArchivo(e)}
        />
        <label
            for="tactos-upload"
            class={`
                w-full flex items-center justify-center px-4 py-4 
                border border-green-300 dark:border-green-600 rounded-md shadow-sm text-lg
                font-medium text-green-700 dark:text-green-300 bg-transparent hover:bg-green-50 
                dark:hover:bg-gray-500 cursor-pointer
              `}
        >
            {#if loading}
                <span class="loading loading-spinner loading-xl"></span>
            {:else}
                {filename ? filename : "Seleccionar archivo"}
            {/if}
        </label>
    </div>
    <div class="flex justify-start">
        <button class="btn btn-success text-white" onclick={procesarArchivo}
            >Procesar</button
        >
    </div>
</div>

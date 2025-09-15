<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from "xlsx";
    import { Filesystem, Directory } from "@capacitor/filesystem";
    import { createCaber } from "$lib/stores/cab.svelte";
    import PocketBase from "pocketbase";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import { createPer } from "$lib/stores/permisos.svelte";
    import { getPermisosList } from "$lib/permisosutil/lib";
    //offline
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import { concatComandosSQL } from "$lib/stores/sqlite/dbcomandos";
    import {
        updateLocalLotesSQL,
        setLotesSQL,
    } from "$lib/stores/sqlite/dbeventos";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { getPermisosMessage } from "$lib/permisosutil/lib";

    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    let {
        db,
        coninternet,
        useroff,
        caboff = $bindable({}),
        usuarioid,
        lotes,
        //acciones
        aparecerToast,
    } = $props();
    let ruta = import.meta.env.VITE_RUTA;
    let caber = createCaber();
    let cab = caber.cab;
    let per = createPer();
    let userpermisos = getPermisosList(per.per.permisos);
    let verlotes = $state([]);
    const pb = new PocketBase(ruta);
    let filename = $state("");
    let wkbk = $state(null);
    let loading = $state(false);
    async function exportarTemplateOffline() {
        let csvData = [
            {
                nombre: "",
            },
        ].map((item) => ({
            NOMBRE_LOTE: item.nombre,
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, "Lotes");

        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo lotes.xlsx",
                directory: Directory.Documents,
            });
        } catch (e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo lotes.xlsx",
            directory: Directory.Documents,
        });
    }
    async function exportarTemplateOnline() {
        let csvData = [
            {
                nombre: "",
            },
        ].map((item) => ({
            NOMBRE_LOTE: item.nombre,
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, "Lotes");

        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo lotes.xlsx",
                directory: Directory.Documents,
            });
        } catch (e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo lotes.xlsx",
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
    async function procesarOnline(lotesprocesar) {
        let errores = false;

        for (let i = 0; i < lotesprocesar.length; i++) {
            let lo = lotesprocesar[i];

            let dataadd = {
                nombre: lo.nombre,
                active: true,
                delete: false,
                cab: caboff.id,
            };

            let datamod = {
                nombre: lo.nombre,
            };
            let lidx = lotes.findIndex((l) => l.nombre == lo.nombre);
            try {

                if (lidx == -1) {
                    if (modedebug) {
                        //loger.addTextLog(JSON.stringify(dataadd, null, 2));
                    }
                    let record = await pb.collection("lotes").create(dataadd);
                    record = {
                        ...record,
                        expand: {
                            cab: {
                                id: caboff.id,
                                nombre: caboff.nombre,
                                user: usuarioid,
                            },
                        },
                    };
                    lotes.push(record);
                }
            } catch (err) {
                if (modedebug) {
                    loger.addTextError(
                        "Error en algun lote: " + dataadd.nombre,
                    );
                }
                errores = true;
            }
        }
        return errores;
    }
    async function procesarOffline() {
        for (let i = 0; i < lotesprocesar.length; i++) {
            let lo = lotesprocesar[i];

            let dataadd = {
                nombre: lo.nombre,
                active: true,
                delete: false,
                cab: caboff.id,
            };

            let datamod = {
                nombre: lo.nombre,
                id: idprov,
            };
            let lidx = lotes.findIndex((l) => l.nombre == lo.nombre);
            if (lidx == -1) {
                let idprov = "nuevo_lote_" + generarIDAleatorio();
                let data = {
                    ...dataadd,
                    id: idprov,
                };
                lotes.push(data);
                let comando = {
                    tipo: "add",
                    coleccion: "lotes",
                    data: { ...data },
                    hora: Date.now(),
                    prioridad: 0,
                    idprov,
                    camposprov: ``,
                    show:{...data},
                    motivo:"Guardar lote"
                };
                comandos.push(comando);
            } else {
                let data = {
                    ...datamod,
                    id: lotes[lidx].id,
                };
                lotes[lidx] = {
                    ...lotes[lidx],
                    ...data,
                };
                let comando = {
                    tipo: "update",
                    coleccion: "lotes",
                    data: { ...data },
                    hora: Date.now(),
                    prioridad: 0,
                    idprov,
                    camposprov: ``,
                    show:{...data},
                    motivo:"Editar lote"
                };
                comandos.push(comando);
            }
        }
        return comandos;
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
            return;
        }

        let sheetlotes = wkbk.Sheets.Lotes;

        if (!sheetlotes) {
            Swal.fire("Error", "Debe subir un archivo válido", "error");
            return;
        }

        let lotesprocesar = [];
        let loteshashmap = {};
        loading = true;
        let errores = false;
        for (const [key, value] of Object.entries(sheetlotes)) {
            const firstLetter = key.charAt(0); // Get the first character
            const tail = key.slice(1);
            if (key == "!ref" || key == "!margins" || tail == "1") {
                continue;
            }
            if (loteshashmap[tail]) {
                if (firstLetter == "A") {
                    loteshashmap[tail].nombre = value.v;
                }
            } else {
                loteshashmap[tail] = {
                    nombre: "",
                };
                if (firstLetter == "A") {
                    loteshashmap[tail].nombre = value.v;
                }
            }
        }
        for (const [key, value] of Object.entries(loteshashmap)) {
            lotesprocesar.push(value);
        }
        verlotes = lotesprocesar.map((l) => l);
        if (coninternet.connected) {
            if (!listapermisos[4]) {
                Swal.fire("Error permisos", getPermisosMessage(4), "error");
                return;
            }

            errores = await procesarOnline(lotesprocesar);
            await setLotesSQL(db, lotes);
        } else {
            Swal.fire(
                "Atención",
                "No tienes conexión a internet, no esta habilitado todavia",
                "warning",
            );
            //let comandos = await procesarOffline()
            //await concatComandosSQL(db,comandos)
            //await setLotesSQL(db,lotes)
        }

        filename = "";
        loading = false;
        wkbk = null;
        if (!errores) {
            Swal.fire(
                "Éxito importar",
                "Se lograron importar los datos",
                "success",
            );
        } else {
            Swal.fire(
                "Error importar",
                "No se lograron importar todos los datos",
                "error",
            );
        }
    }
</script>

<div class="space-y-4 grid grid-cols-1 flex justify-center">
    {#if modedebug && verlotes.length > 0}
        <ul>
            {#each verlotes as vl}
                <li>{JSON.stringify(vl, null, 2)}</li>
            {/each}
        </ul>
    {/if}
    <button
        class={`
            w-full
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
            id="lotes-upload"
            onchange={(e) => importarArchivo(e)}
        />
        <label
            for="lotes-upload"
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

<script>
    //LAburar nacimientos
    //Necesita dividirse en varios archivos
    import estilos from "$lib/stores/estilos";
    import * as XLSX from "xlsx";
    import { Filesystem, Directory } from "@capacitor/filesystem";
    import { createCaber } from "$lib/stores/cab.svelte";
    import PocketBase from "pocketbase";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";
    import cuentas from "$lib/stores/cuentas";
    import categorias from "$lib/stores/categorias";
    import {
        verificarNivelCantidad,
        verificarNivelOffline,
    } from "$lib/permisosutil/lib";
    //offline
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import { concatComandosSQL } from "$lib/stores/sqlite/dbcomandos";
    import {
        setAnimalesSQL,
        editarAnimalSQL,
        updateLocalAnimalesSQL,
    } from "$lib/stores/sqlite/dbanimales";
    import {
        getNacimientosSQL,
        updateLocalNacimientosSQLUser,
        setNacimientosSQL,
    } from "$lib/stores/sqlite/dbeventos";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { getPermisosMessage, getPermisosList } from "$lib/permisosutil/lib";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    let {
        db,
        coninternet,
        useroff,
        caboff = $bindable({}),
        usuarioid,
        animales,
        animalesusuario,
        rodeos,
        lotes,
        //acciones
        aparecerToast,
    } = $props();
    let ruta = import.meta.env.VITE_RUTA;
    let caber = createCaber();
    let cab = caber.cab;
    let loading = $state(false);

    const pb = new PocketBase(ruta);
    let filename = $state("");
    let wkbk = $state(null);
    let nacimientos = $state([]);
    let vernacimientos = $state([]);
    let padres = $state([]);
    let madres = $state([]);

    async function exportarTemplate() {
        aparecerToast();
        let csvData = [
            {
                caravana: "AAA",
                peso: "0",
                sexo: "H/M",
                rodeo: "",
                lote: "",
                fechanacimiento: "MM/DD/AAAA",
                nombremadre: "",
                nombrepadre: "",
                observaciones: "",
                categoria: "",
            },
        ].map((item) => ({
            CARAVANA: item.caravana,
            PESO: item.peso,
            SEXO: item.sexo,
            RODEO: item.rodeo,
            LOTE: item.lote,
            FECHANACIMIENTO: item.fechanacimiento,
            CARAVANA_MADRE: item.nombremadre,
            CARAVANA_PADRE: item.nombrepadre,
            OBSERVACIONES: item.observaciones,
            CATEGORIA: item.categoria,
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        ws["K1"] = {
            t: "s",
            v: "Caravana vacia si no quiere un nuevo animal",
            s: {},
        };
        XLSX.utils.book_append_sheet(wb, ws, "Nacimientos");
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo nacimientos.xlsx",
                directory: Directory.Documents,
            });
        } catch (e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo nacimientos.xlsx",
            directory: Directory.Documents,
        });
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
    function buscarNacimiento(nac) {
        let idx_nacimiento = nacimientos.findIndex((n) => {
            if (n.cab != caboff.id) {
                return false;
            }
            if (!sonFechasIguales(n.fecha, nac.fecha)) {
                return false;
            }
            if (n.madre != nac.madre) {
                return false;
            }
            return true;
        });
        return idx_nacimiento;
    }
    function crearDataNacimiento(an, madre) {
        let rescategoria = categorias.filter(
            (c) => c.id == an.categoria || c.nombre == an.categoria,
        );
        let categoria = rescategoria.length > 0 ? rescategoria[0] : "";
        let padre = animales.filter((p) => p.caravana == an.nombrepadre);

        let m = madre[0];
        let lote = { id: "", nombre: "" };
        let rodeo = { id: "", nombre: "" };
        let reslote = lotes.filter((l) => l.nombre == m.lote);
        let resrodeo = rodeos.filter((r) => r.nombre == m.rodeo);
        lote = reslote.length > 0 ? reslote[0] : lote;
        rodeo = resrodeo.length > 0 ? resrodeo[0] : rodeo;

        let datanacimiento = {
            fecha: an.fechanacimiento
                ? an.fechanacimiento.toISOString().split("T")[0] + " 03:00:00"
                : "",
            nombremadre: madre.length > 0 ? madre[0].caravana : an.nombremadre,
            nombrepadre: padre.length > 0 ? padre[0].caravana : an.nombrepadre,
            madre: madre[0].id,
            observacion: an.observaciones,
            cab: caboff.id,
        };
        if (padre.length > 0) {
            datanacimiento.padre = padre[0].id;
        }
        return datanacimiento;
    }
    function crearDataAnimal(an, datanacimiento, lote, rodeo, record) {
        let dataanimal = {
            caravana: an.caravana,
            active: true,
            delete: false,
            fechanacimiento: datanacimiento.fecha,
            sexo: an.sexo,
            cab: caboff.id,
            peso: an.peso,
            lote: lote.id,
            rodeo: rodeo.id,
            nacimiento: record.id,
        };
        return dataanimal;
    }
    function crearRecord(record, datanacimiento, futuroanimal) {
        
        let nuevorecord = {
            ...record,
            caravana: futuroanimal.caravana,
            animalid: futuroanimal.id,
            expand: {
                madre: {
                    caravana: datanacimiento.nombremadre,
                },
                padre: {
                    caravana: datanacimiento.nombrepadre,
                },
                cab: {
                    nombre: caboff.nombre,
                },
            },
        };
        return nuevorecord;
    }
    async function procesarOnline(nacimientosprocesar, nuevoanimales) {
        //let verificar = await verificarNivelCantidad(caboff.id,nuevoanimales)
        let verificar = true;
        let errores = false;
        if (!verificar) {
            Swal.fire(
                "Error guardar",
                `No tienes el nivel de la cuenta para tener mas de  animales`,
                "error",
            );
            loading = false;
            return;
        }
        for (let i = 0; i < nacimientosprocesar.length; i++) {
            let an = nacimientosprocesar[i];
            try {
                let madre = animales.filter(
                    (m) => m.caravana == an.nombremadre,
                );
                if (madre.length < 1) {
                    continue;
                }
                let datanacimiento = crearDataNacimiento(an, madre);
                let idx_nacimiento = buscarNacimiento(datanacimiento);
                let id_nacimiento = "";

                if (idx_nacimiento == -1) {
                    loger.addTextLog("nuevo");
                    let futuroanimal = {
                        id: "",
                        caravana: "",
                    };
                    let record = await pb
                        .collection("nacimientos")
                        .create(datanacimiento);
                    if (an.caravana != "") {
                        let dataanimal = crearDataAnimal(
                            an,
                            datanacimiento,
                            lote,
                            rodeo,
                            record,
                        );
                        let recorda = await pb
                            .collection("animales")
                            .create(dataanimal);
                        futuroanimal.id = recorda.id;
                        futuroanimal.caravana = recorda.caravana;
                        recorda = {
                            ...recorda,
                            expand: {
                                lote: {
                                    id: lote.id,
                                    nombre: lote.nombre,
                                },
                                rodeo: {
                                    id: rodeo.id,
                                    nombre: rodeo.nombre,
                                },
                            },
                        };
                        animales.push(recorda);
                        await setAnimalesSQL(db, animales);
                    }
                    record = crearRecord(record, datanacimiento, futuroanimal);
                    
                    id_nacimiento = record.id;
                    loger.addTextLog(nacimientos.length);
                    nacimientos.push(record);
                    loger.addTextLog(nacimientos.length);
                } else {
                    id_nacimiento = nacimientos[idx_nacimiento].id;
                    await pb
                        .collection("nacimientos")
                        .update(id_nacimiento, datanacimiento);
                    nacimientos[idx_nacimiento] = {
                        ...nacimientos[idx_nacimiento],
                        ...datanacimiento,
                    };
                }
            } catch (err) {
                if (modedebug) {
                    loger.addTextError(an.nombremadre);
                }
                errores = true;
            }
        }
        loger.addTextLog(nacimientos.length);
        await setNacimientosSQL(db, nacimientos);

        return errores;
    }
    async function procesarOffline(nuevoanimales) {
        let verificar = await verificarNivelOffline(
            animalesusuario,
            nuevoanimales,
        );
        if (!verificar) {
            Swal.fire(
                "Error guardar",
                `No tienes el nivel de la cuenta para tener mas de  animales`,
                "error",
            );
            loading = false;
            return;
        }
        for (let i = 0; i < nacimientosprocesar.length; i++) {
            let an = nacimientosprocesar[i];
            let conlote = false;
            let reslote = lotes.filter((l) => l.nombre == an.lote);
            let resrodeo = rodeos.filter((r) => r.nombre == an.rodeo);
            lote = reslote.length > 0 ? reslote[0] : null;
            rodeo = resrodeo.length > 0 ? resrodeo[0] : null;
            let categoria = categorias.filter(
                (c) => c.id == an.categoria || c.nombre == an.categoria,
            )[0];
            let padre = animales.filter((p) => p.caravana == an.nombrepadre);
            let madre = animales.filter((m) => m.caravana == an.nombremadre);
            let datanacimiento = {
                fecha: an.fechanacimiento
                    ? an.fechanacimiento.toISOString().split("T")[0] +
                      " 03:00:00"
                    : "",
                nombremadre:
                    madre.length > 0 ? madre[0].caravana : an.nombremadre,
                nombrepadre:
                    padre.length > 0 ? padre[0].caravana : an.nombrepadre,
                observacion: an.observaciones,
                cab: caboff.id,
            };
            if (padre) {
                datanacimiento.padre = padre.id;
            }
            if (madre) {
                datanacimiento.madre = madre.id;
            }
        }
    }
    function sonFechasIguales(fecha1, fecha2) {
        const f1 = new Date(fecha1);
        const f2 = new Date(fecha2);

        return (
            f1.getFullYear() === f2.getFullYear() &&
            f1.getMonth() === f2.getMonth() &&
            f1.getDate() === f2.getDate()
        );
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
            loading = false;
        }

        let sheetnacimientos = wkbk.Sheets.Nacimientos;
        if (!sheetnacimientos) {
            Swal.fire("Error", "Debe subir un archivo válido", "error");
            loading = false;
        }
        await getDataSQL();
        let nacimientosprocesar = [];
        let animaleshashmap = {};
        loading = true;
        for (const [key, value] of Object.entries(sheetnacimientos)) {
            const firstLetter = key.charAt(0); // Get the first character
            const tail = key.slice(1);
            if (key == "!ref" || key == "!margins" || tail == "1") {
                continue;
            }
            if (animaleshashmap[tail]) {
                if (firstLetter == "A") {
                    animaleshashmap[tail].caravana = value.v;
                }
                if (firstLetter == "B") {
                    animaleshashmap[tail].peso = value.v;
                }
                if (firstLetter == "C") {
                    animaleshashmap[tail].sexo = value.v;
                }
                if (firstLetter == "D") {
                    animaleshashmap[tail].rodeo = value.v;
                }
                if (firstLetter == "E") {
                    animaleshashmap[tail].lote = value.v;
                }
                if (firstLetter == "F") {
                    animaleshashmap[tail].fechanacimiento = value.w
                        ? new Date(value.w)
                        : "";
                }
                if (firstLetter == "G") {
                    animaleshashmap[tail].nombremadre = value.v;
                }
                if (firstLetter == "H") {
                    animaleshashmap[tail].nombrepadre = value.v;
                }
                if (firstLetter == "I") {
                    animaleshashmap[tail].observaciones = value.v;
                }
                if (firstLetter == "J") {
                    animaleshashmap[tail].categoria = value.v;
                }
            } else {
                animaleshashmap[tail] = {
                    caravana: "",
                    peso: "",
                    sexo: "",
                    rodeo: "",
                    lote: "",
                    fechanacimiento: "",
                    nombremadre: "",
                    nombrepadre: "",
                    observaciones: "",
                    categoria: "",
                };
                if (firstLetter == "A") {
                    animaleshashmap[tail].caravana = value.v;
                }
                if (firstLetter == "B") {
                    animaleshashmap[tail].peso = value.v;
                }
                if (firstLetter == "C") {
                    animaleshashmap[tail].sexo = value.v;
                }
                if (firstLetter == "D") {
                    animaleshashmap[tail].rodeo = value.v;
                }
                if (firstLetter == "E") {
                    animaleshashmap[tail].lote = value.v;
                }
                if (firstLetter == "F") {
                    animaleshashmap[tail].fechanacimiento = value.w
                        ? new Date(value.w)
                        : "";
                }
                if (firstLetter == "G") {
                    animaleshashmap[tail].nombremadre = value.v;
                }
                if (firstLetter == "H") {
                    animaleshashmap[tail].nombrepadre = value.v;
                }
                if (firstLetter == "I") {
                    animaleshashmap[tail].observaciones = value.v;
                }
                if (firstLetter == "J") {
                    animaleshashmap[tail].categoria = value.v;
                }
            }
        }
        let nuevoanimales = 0;
        let errornuevoanimales = false;
        let errores = false;
        for (const [key, value] of Object.entries(animaleshashmap)) {
            nacimientosprocesar.push(value);
            if (value.caravana != "") {
                let conocido =
                    animales.filter((a) => a.caravana == value.caravana)
                        .length == 0;
                if (!conocido) {
                    nuevoanimales += 1;
                }
            }
        }
        vernacimientos = nacimientosprocesar.map((n) => n);
        if (coninternet.connected) {
            if (!listapermisos[4]) {
                Swal.fire("Error permisos", getPermisosMessage(4), "error");
                filename = "";
                loading = false;
                wkbk = null;
                return;
            }

            errores = await procesarOnline(nacimientosprocesar, nuevoanimales);
        } else {
            Swal.fire(
                "Atención",
                "No tienes conexión a internet, no esta habilitado todavia",
                "warning",
            );
            //await procesarOffline(nuevoanimales)
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
    async function getLocalSQL() {
        let resnacimiento = await getNacimientosSQL(db);
        nacimientos = resnacimiento.lista;
    }
    async function getDataSQL() {
        //Creo que se podia hacer una comprobacion
        //de actualizacion de datos por tiempo
        await getLocalSQL();
    }
</script>

<div class="space-y-4 grid grid-cols-1 flex justify-center">
    {#if modedebug && vernacimientos.length > 0}
        <ul>
            {#each vernacimientos as vl}
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
            id="nacimiento-upload"
            onchange={(e) => importarArchivo(e)}
        />
        <label
            for="nacimiento-upload"
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

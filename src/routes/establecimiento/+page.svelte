<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import Swal from "sweetalert2";
    import PocketBase from "pocketbase";
    import { createRoler } from "$lib/stores/defaultrol.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { createCaber } from "$lib/stores/cab.svelte";
    import { createPer } from "$lib/stores/permisos.svelte";
    import CardBase from "$lib/components/CardBase.svelte";
    import Colaboradores from "$lib/components/establecimiento/Colaboradores.svelte";
    import ListaColabs from "$lib/components/establecimiento/ListaColabs.svelte";
    import { usuario } from "$lib/stores/usuario";
    import {
        codigoSinRepetir,
        codigoSinRepetirEstablecimiento,
    } from "$lib/pbutils/lib";
    import provincias from "$lib/stores/geo/provincias";
    import localidades from "$lib/stores/geo/localidades";
    import estilos from "$lib/stores/estilos";
    import { randomString } from "$lib/stringutil/lib";
    import CardNuevo from "$lib/components/establecimiento/CardNuevo.svelte";
    import CardExistente from "$lib/components/establecimiento/CardExistente.svelte";
    //permisos
    import {
        verificarNivel,
        getPermisosList,
        getPermisosMessage,
    } from "$lib/permisosutil/lib";
    import { updatePermisos } from "$lib/stores/capacitor/offlinecab";
    //probar internet
    import {
        actualizacion,
        deboActualizar,
    } from "$lib/stores/offline/actualizar";
    import { customoffliner } from "$lib/stores/offline/custom.svelte";
    import { intermitenter } from "$lib/stores/offline/intermitencia.svelte";
    import { velocidader } from "$lib/stores/offline/velocidad.svelte";
    //offline
    import { getInternet } from "$lib/stores/offline";
    import Barrainternet from "$lib/components/internet/Barrainternet.svelte";
    import { openDB } from "$lib/stores/sqlite/main";
    import { Network } from "@capacitor/network";
    import { getUserOffline } from "$lib/stores/capacitor/offlineuser";
    import { getCabDataByID } from "$lib/stores/cabsdata";
    import {
        setEstablecimientoSQL,
        getEsblecimientoSQL,
        updateLocalEstablecimientoSQL,
    } from "$lib/stores/sqlite/dbestablecimiento";

    import {
        getUltimoEstablecimientosSQL,
        updateLocalEstablecimientosSQL,
        setUltimoEstablecimientosSQL,
        getEstablecimientosSQL,
        getUpdateLocalEstablecimientosSQL,
        setEstablecimientosSQL,
    } from "$lib/stores/sqlite/dballestablecimientos";

    import {
        getCabOffline,
        setCabNombreOffline,
        setCabOffline,
        setDefaultCabOffline,
    } from "$lib/stores/capacitor/offlinecab";
    import {
        getColabSQL,
        setColabSQL,
        updateLocalColabSQLUser,
    } from "$lib/stores/sqlite/dbcolaboradores";
    import {
        getComandosSQL,
        setComandosSQL,
        flushComandosSQL,
    } from "$lib/stores/sqlite/dbcomandos";
    import {
        getInternetSQL,
        setInternetSQL,
    } from "$lib/stores/sqlite/dbinternet";
    import permisos from "$lib/stores/permisos";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { offliner } from "$lib/stores/logs/coninternet.svelte";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si";
    //offline
    let infotoast = $state(false);
    let db = $state(null);
    let usuarioid = $state("");
    let useroff = $state({});
    let caboff = $state({});
    let coninternet = $state({ connected: false });
    let establecimiento = $state({});
    let comandos = $state([]);
    let ultimo_establecimiento = $state({});
    let getlocal = $state(false);
    let getpermisos = $state("");
    let cargado = $state(false);
    let getvelocidad = $state(0);
    let ruta = import.meta.env.VITE_RUTA;
    let pre = "";
    const pb = new PocketBase(ruta);
    const regexRenspa = /^\d{2}\.\d{3}\.\d\.\d{5}\.\d{2}$/;

    let cab = $state({
        exist: false,
        nombre: "",
        id: "",
    });
    let caber = createCaber();
    let per = createPer();
    let colabs = $state([]);
    let modoedicion = $state(false);
    let establecimientos = $state([]);

    //Datos cabaña
    let datosviejos = $state({});
    let nombre = $state("");
    let direccion = $state("");
    let contacto = $state("");
    let codigo = $state("");
    let renspa = $state("");
    let provincia = $state("");
    let localidad = $state("");
    let localidadesProv = $state([]);
    let telefono = $state("");
    let mail = $state("");
    let titular = $state("");
    let renspaValido = $state(true);
    //Desasociar
    let asociado = $state(false);
    let idestxcolab = $state("");

    async function getCabaña() {
        try {
            const record = await pb
                .collection("cabs")
                .getFirstListItem(`id='${cab.id}' && active=true`, {});
            nombre = record.nombre;
            direccion = record.direccion;
            contacto = record.contacto;
            codigo = record.codigo;
            contacto = record.contacto;
            renspa = record.renspa;
            localidad = record.localidad;
            provincia = record.provincia;
            telefono = record.telefono;
            mail = record.mail;
            localidadesProv = localidades.filter(
                (lo) => lo.idProv == provincia,
            );
            caber.setCab(record.nombre, record.id);
        } catch (err) {
            caber.setDefault();
            nombre = "";
            direccion = "";
            contacto = "";
            codigo = "";
            contacto = "";
            renspa = "";
            localidad = "";
            provincia = "";
            telefono = "";
            mail = "";
            goto(pre + "/");
        }
    }
    async function getColabs() {
        const records = await pb.collection("estxcolabspermisos").getFullList({
            expand: "colab",
            filter: `cab='${cab.id}'`,
            sort: "colab.apellido",
        });
        colabs = records;
    }
    async function guardarColabOffline() {
        Swal.fire(
            "Error guardar",
            "No se puede crear un colaborador sin internet",
            "error",
        );
    }
    async function guardarColabOnline(data) {
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[0]) {
            Swal.fire("Error permisos", getPermisosMessage(0), "error");

            return;
        }
        let codigo = await codigoSinRepetir(pb);
        try {
            let nombredata = data.nombre
                .trim()
                .split(" ")
                .filter((w) => w !== "")
                .join(".");
            let apellidodata = data.apellido
                .trim()
                .split(" ")
                .filter((w) => w !== "")
                .join(".");
            let randomnumber = randomString(5, "n");
            let userdata = {
                username: nombredata + "." + apellidodata + randomnumber,
                email: data.email,
                password: data.contra,
                passwordConfirm: data.contra,
                name: data.email,
                codigo: codigo,
                nombre: data.nombre.trim(),
                apellido: data.apellido.trim(),
                active: true,
            };

            const recorduser = await pb.collection("users").create(userdata);
            let colabdata = {
                nombre: data.nombre,
                apellido: data.apellido,
                telefono: data.telefono,
                user: recorduser.id,
            };

            const recordcolab = await pb
                .collection("colaboradores")
                .create(colabdata);
            let estxcolabdata = {
                colab: recordcolab.id,
                cab: cab.id,
            };

            const recordexc = await pb
                .collection("estxcolabs")
                .create(estxcolabdata);
            let permisosdata = {
                estxcolab: recordexc.id,
                permisos: "",
            };

            await pb.collection("permisos").create(permisosdata);
            let colabsql = {
                id: recordexc.id,
                colab: recordcolab.id,
                cab: cab.id,
                permisos: "",
                expand: {
                    colab: {
                        id: recordcolab.id,
                        nombre: data.nombre,
                        apellido: data.apellido,
                        telefono: data.telefono,
                        user: recorduser.id,
                    },
                },
            };

            colabs.push(colabsql);
            await setColabSQL(db, colabs);
            Swal.fire(
                "Éxito guardar",
                "Éxito guardar nuevo colaborador",
                "success",
            );
        } catch (err) {
            Swal.fire(
                "Error guardar",
                "Error guardar nuevo colaborador",
                "error",
            );
            console.error(err);
        }
    }
    async function guardarColab(data) {
        if (coninternet.connected) {
            await guardarColabOnline(data);
        } else {
            await guardarColabOffline();
        }
    }
    async function guardarCabañaOffline() {
        Swal.fire(
            "Error guardar",
            "No se puede crear un establecimiento sin internet",
            "error",
        );
    }
    async function guardarCabañaOnline() {
        //caboff = await updatePermisos(pb,usuarioid)
        //getpermisos = caboff.permisos
        //let listapermisos = getPermisosList(caboff.permisos)
        //if(!listapermisos[0]){
        //    Swal.fire("Error permisos",getPermisosMessage(0),"error")
        //    return
        //}
        let codigo = await codigoSinRepetirEstablecimiento(pb);
        const data = {
            nombre,
            direccion,
            user: usuarioid,
            active: true,
            contacto,
            renspa,
            localidad,
            provincia,
            telefono,
            mail,
            codigo,
        };

        try {
            const record = await pb.collection("cabs").create(data);

            await setEstablecimientoSQL(db, record);
            datosviejos = { ...record };
            await setCabOffline(record.id, record.nombre, true, "0,1,2,3,4,5");
            establecimientos = await getUpdateLocalEstablecimientosSQL(
                db,
                pb,
                usuarioid,
            );
            caber.setCab(nombre, record.id);
            per.setPer("0,1,2,3,4,5", usuarioid);
            goto("/");
            Swal.fire(
                "Exito guadar",
                "Se pudo guardar la cabaña con éxito",
                "success",
            );
        } catch (err) {
            console.error(err);
            if (modedebug) {
                loger.addError({
                    time: Date.now(),
                    text: JSON.stringify(err, null, 2),
                });
            }
            Swal.fire("Error guardar", "No se pudo guardar la cabaña", "error");
        }
        renspaValido = true;
    }
    async function guardarCabaña() {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        if (coninternet.connected) {
            await guardarCabañaOnline();
        } else {
            await guardarCabañaOffline();
        }
    }
    async function editarCabañaOffline() {
        const data = {
            nombre,
            direccion,
            contacto,
            contacto,
            renspa,
            localidad,
            provincia,
            telefono,
            mail,
        };
        try {
            await setCabNombreOffline(nombre);
            let e_idx = establecimientos.findIndex((es) => es.id == caboff.id);
            if (e_idx != -1) {
                establecimientos[e_idx] = {
                    ...establecimientos[e_idx],
                    ...data,
                };
                await setEstablecimientosSQL(db, establecimientos);
            }
            datosviejos = {
                ...datosviejos,
                ...data,
            };
            let establecimiento = { ...datosviejos };
            await setEstablecimientoSQL(db, establecimiento);
            let comandodata = {
                tipo: "update",
                coleccion: "cabs",
                data: { ...data },
                hora: Date.now(),
                prioridad: 2,
                idprov: caboff.id,
                camposprov: "",
            };
            comandos.push(comandodata);
            await setComandosSQL(db, comandos);
            Swal.fire(
                "Exito modificar",
                "Se pudo modificar la cabaña con éxito",
                "success",
            );
            caber.setCab(nombre, caboff.id);
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error modificar",
                "No se pudo modificar la cabaña",
                "error",
            );
        }
        renspaValido = true;
    }
    async function editarCabañaOnline() {
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[0]) {
            Swal.fire("Error permisos", getPermisosMessage(0), "error");
            reestablercerCabaña();
            return;
        }
        const data = {
            nombre,
            direccion,
            contacto,
            contacto,
            renspa,
            localidad,
            provincia,
            telefono,
            mail,
        };
        try {
            await pb.collection("cabs").update(cab.id, data);

            await setCabNombreOffline(nombre);
            let e_idx = establecimientos.findIndex((es) => es.id == caboff.id);
            if (e_idx != -1) {
                establecimientos[e_idx] = {
                    ...establecimientos[e_idx],
                    ...data,
                };
                await setEstablecimientosSQL(db, establecimientos);
            }
            datosviejos = {
                ...datosviejos,
                ...data,
            };
            let establecimiento = { ...datosviejos };
            await setEstablecimientoSQL(db, establecimiento);
            let coff = await getCabOffline();

            Swal.fire(
                "Exito modificar",
                "Se pudo modificar la cabaña con éxito",
                "success",
            );
            caber.setCab(nombre, caboff.id);
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error modificar",
                "No se pudo modificar la cabaña con éxito",
                "error",
            );
        }
        renspaValido = true;
    }
    async function editarCabaña() {
        if (coninternet.connected) {
            await editarCabañaOnline();
        } else {
            await editarCabañaOffline();
        }
    }
    async function desasociarOnline(idestxcolab) {
        caboff = await updatePermisos(pb, usuarioid);
        getpermisos = caboff.permisos;
        let listapermisos = getPermisosList(caboff.permisos);
        if (!listapermisos[0]) {
            Swal.fire("Error permisos", getPermisosMessage(0), "error");
            return;
        }
        try {
            await pb.collection("estxcolabs").delete(idestxcolab);
            colabs = colabs.filter((colab) => colab.id != idestxcolab);
            await setColabSQL(db, colabs);
        } catch (err) {
            console.error(err);
            Swal.fire(
                "Error desasociar",
                "No se pudo desasociar el colaborador",
                "error",
            );
        }

        //Me hace ruido todo esto porque tengo que laburar con la lista de establecimientos
        try {
            //Aca va a su cabaña, hay un cambio de cabaña, por eso se fija si existe alguna cabaña
            const record = await pb
                .collection("cabs")
                .getFirstListItem(`user='${usuarioid}' && active=true`, {});
            caber.setCab(record.nombre, record.id);
            per.setPer("0,1,2,3,4,5", usuarioid);
        } catch (err) {
            try {
                //Revisa si sos colaborador
                const recordcab = await pb
                    .collection("estxcolabs")
                    .getFirstListItem(`colab.user='${usuarioid}'`, {
                        expand: "colab,cab,colab.user",
                    });
                const recordper = await pb
                    .collection("permisos")
                    .getFirstListItem(`estxcolab='${recordcab.id}'`);
                per.setPer(recordper.permisos, usuarioid);
                caber.setCab(
                    recordcab.expand.cab.nombre,
                    recordcab.expand.cab.id,
                );
            } catch (err) {
                caber.setDefault();
                per.setDefault();
            }
        }
        goto("/");
    }
    async function desasociarOffline() {
        Swal.fire(
            "Error desasociar",
            "No se puede desasociar sin internet",
            "error",
        );
    }
    //Esta funcion es la autodesaciacion del colaborador
    async function desasociar(idestxcolab) {
        if (coninternet.connected) {
            await desasociarOnline();
        } else {
            await desasociarOffline();
        }
    }
    function mostrarcolab(data) {
        console.log("padre: " + data);
    }
    function getNombreProvincia(id) {
        let p = provincias.filter((pro) => pro.id == id)[0];
        if (p) {
            return p.nombre;
        } else {
            return "";
        }
    }
    function getNombreLocalidad(id) {
        let l = localidades.filter((lo) => lo.nombre == id)[0];
        if (l) {
            return l.nombre;
        } else {
            return "";
        }
    }
    function getLocalidades(idProv) {
        localidad = "";
        localidadesProv = localidades.filter((lo) => lo.idProv == idProv);
    }
    function escribirRenspa() {
        if (!renspaValido) {
            renspaValido = regexRenspa.test(renspa);
        }
    }
    async function originalMount() {
        cab = caber.cab;

        let pb_json = await JSON.parse(localStorage.getItem("pocketbase_auth"));
        usuarioid = pb_json.record.id;
        if (cab.exist) {
            await getCabaña();
            await getColabs();
            const recordcolab = await pb
                .collection("colaboradores")
                .getList(1, 1, {
                    filter: `user = '${usuarioid}'`,
                });
            if (recordcolab.items.length > 0) {
                const recordestxcolab = await pb
                    .collection("estxcolabs")
                    .getList(1, 1, {
                        filter: `colab = '${recordcolab.items[0].id}' && cab = '${cab.id}'`,
                    });
                if (recordestxcolab.items.length > 0) {
                    asociado = true;
                    idestxcolab = recordestxcolab.items[0].id;
                } else {
                    asociado = false;
                }
            } else {
                asociado = false;
            }
        }
    }
    function reestablercerCabaña() {
        nombre = datosviejos.nombre;
        direccion = datosviejos.direccion;
        contacto = datosviejos.contacto;
        codigo = datosviejos.codigo;
        renspa = datosviejos.renspa;
        localidad = datosviejos.localidad;
        provincia = datosviejos.provincia;
        telefono = datosviejos.telefono;
        mail = datosviejos.mail;
    }
    async function initPage() {
        coninternet = await getInternet(
            modedebug,
            offliner.offline,
            customoffliner.customoffline,
        );
        intermitenter.addIntermitente(coninternet.connected);
        useroff = await getUserOffline();
        caboff = await getCabOffline();
        db = await openDB();
        cab = caber.cab;
        usuarioid = useroff.id;
    }
    async function getLocalSQL() {
        getlocal = true;
        let rescolabs = await getColabSQL(db);
        let resestablecimientos = await getEstablecimientosSQL(db);
        establecimientos = resestablecimientos.lista;
        colabs = rescolabs.lista.filter((colab) => colab.cab == caboff.id);
        let res = await getEsblecimientoSQL(db);
        datosviejos = { ...res };

        establecimiento = res;
        nombre = res.nombre;
        direccion = res.direccion;
        contacto = res.contacto;
        codigo = res.codigo;
        renspa = res.renspa;
        localidad = res.localidad;
        provincia = res.provincia;
        telefono = res.telefono;
        mail = res.mail;
        localidadesProv = localidades.filter((lo) => lo.idProv == provincia);
        cargado = true;
    }
    async function updateLocalSQL() {
        await setUltimoEstablecimientosSQL(db);
        establecimientos = await updateLocalEstablecimientosSQL(
            db,
            pb,
            usuarioid,
            caboff.id,
        );
        //let res = await getEsblecimientoSQL(db)
        establecimiento = establecimientos.filter(
            (est) => est.id == caboff.id,
        )[0];
        datosviejos = { ...establecimiento };
        nombre = establecimiento.nombre;
        direccion = establecimiento.direccion;
        contacto = establecimiento.contacto;
        codigo = establecimiento.codigo;
        renspa = establecimiento.renspa;
        localidad = establecimiento.localidad;
        provincia = establecimiento.provincia;
        telefono = establecimiento.telefono;
        mail = establecimiento.mail;
        localidadesProv = localidades.filter((lo) => lo.idProv == provincia);
        let allcolabs = await updateLocalColabSQLUser(db, pb, usuarioid);
        colabs = allcolabs.filter((colab) => colab.cab == caboff.id);
        cargado = true;
    }
    async function oldGetUpdate() {
        let lastinter = await getInternetSQL(db);
        if (lastinter.internet == 0) {
            await setInternetSQL(db, 1, 0);
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
        //Reviso el internet
        ultimo_establecimiento = await getUltimoEstablecimientosSQL(db);
        let rescom = await getComandosSQL(db);
        comandos = rescom.lista;
        let ahora = Date.now();
        let antes = ultimo_establecimiento.ultimo;
        await getLocalSQL();
        if (coninternet.connected) {
            let velocidad = await velocidader.medirVelocidadInternet();
            try {
                await flushComandosSQL(db, pb);
                comandos = [];
            } catch (err) {
                if (modedebug) {
                    loger.addTextError(JSON.stringify(err), null, 2);
                    loger.addTextError("Error en flush comandos");
                }
            }

            let confiabilidad = intermitenter.calculateIntermitente();
            let mustUpdate = await deboActualizar(
                velocidad,
                confiabilidad,
                coninternet,
                false,
                ahora,
                antes,
            );
            if (mustUpdate) {
                setTimeout(async () => {
                    try {
                        await updateLocalSQL(db);
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
    onMount(async () => {
        await initPage();
        if (cab.exist) {
            await getDataSQL();
        } else {
            nombre = "";
            direccion = "";
            contacto = "";
            codigo = "";
            contacto = "";
            renspa = "";
            localidad = "";
            provincia = "";
            telefono = "";
            mail = "";
            datosviejos = {
                nombre,
                direccion,
                contacto,
                renspa,
                localidad,
                provincia,
                telefono,
                mail,
            };
        }
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
                    internet {ultimo_establecimiento.ultimo}
                </span>
            </div>
            <div>
                <span>
                    get local{getlocal}
                </span>
            </div>
        </div>
    {/if}
    {#if cab.exist}
        {#if cargado}
            <CardExistente
                bind:nombre
                bind:renspa
                bind:direccion
                bind:contacto
                bind:telefono
                bind:mail
                bind:codigo
                bind:modoedicion
                bind:provincia
                bind:localidad
                bind:colabs
                bind:localidadesProv
                bind:coninternet
                bind:db
                bind:caboff
                {provincias}
                {guardarColab}
                {mostrarcolab}
                {asociado}
                {desasociar}
                cabid={caboff.id}
                {cab}
                {getNombreProvincia}
                {getNombreLocalidad}
                {getLocalidades}
                {reestablercerCabaña}
                {editarCabaña}
                {usuarioid}
            />
        {:else}
            <div class="flex items-center justify-center">
                <span class="loading loading-spinner text-success"></span>
            </div>
        {/if}
    {:else}
        <CardNuevo bind:nombre bind:direccion bind:contacto {guardarCabaña}
        ></CardNuevo>
    {/if}
</Navbarr>
{#if infotoast}
    <div class="toast toast-top toast-center">
        <div class="alert alert-info">
            <span>Datos actualizados</span>
        </div>
    </div>
{/if}

<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import estilos from "$lib/stores/estilos";
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import { createCaber } from "$lib/stores/cab.svelte";
    import Swal from "sweetalert2";
    import CardAnimal from "$lib/components/animal/CardAnimal.svelte";
    import { createStorageProxy } from "$lib/filtros/filtros";
    import { navegarAPadre, irAElemento } from "$lib/geneologia/lib";
    import RadioButton from "$lib/components/RadioButton.svelte";
    import estados from "$lib/stores/estados";
    import sexos from "$lib/stores/sexos";
    import categorias from "$lib/stores/categorias";
    import { openDB,resetTables} from '$lib/stores/sqlite/main'
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { ACTUALIZACION } from "$lib/stores/constantes";
    import {
        getAnimalSQLByID,
        getHistorialAnimalesSQL,
        getAnimalesSQL,
    } from "$lib/stores/sqlite/dbanimales"
    import {
        getTactosSQL,
        getNacimientosSQL,
        getTiposTratSQL,
        getTratsSQL,
        getObservacionesSQL,
        getPesajesSQL,
        getServiciosSQL,
        getInseminacionesSQL,
        updateLocalTratsSQLUser,
        getLotesRodeosSQL,
        getUpdateLocalRodeosLotesSQLUser
    } from "$lib/stores/sqlite/dbeventos"
    import { shorterWord, capitalize,getWholeWordButLastLetter } from "$lib/stringutil/lib";
    import {
        getEstadoNombre,
        getEstadoColor,
    } from "$lib/components/estadosutils/lib";
    import tipostacto from "$lib/stores/tipostacto";

    const genealogiaStorage = createStorageProxy("genealogia_arbol", {
        progenitores: [],
        posicionActual: -1,
    });

    let ultimos_valores = $state(5)


    let animales = $state([])

    let tactos = $state([]);
    let servicios = $state([]);
    let inseminaciones = $state([]);
    let pesajes = $state([]);
    let pariciones = $state([]);
    let observaciones = $state([]);
    let tratamientos = $state([]);

    let idanimal = $state("");
    let caravana = $state("Padre");
    let nombrelote = $state("");
    let nombrerodeo = $state("");
    let raza = $state("");
    let color = $state("");
    let prenada = $state(0);

    let connacimiento = $state(false);
    let nacimiento = $state({});

    let nombremadre = $state("");
    let nombrepadre = $state("");

    let rp = $state("");
    let sexo = $state("");
    let peso = $state("");
    let categoria = $state("");
    let madre = $state({});
    let padre = $state({});

    let progenitores = $state(["Padre 1"]);

    let esdev = import.meta.env.VITE_DEV == "si";
    let ruta = import.meta.env.VITE_RUTA;
    let pre = import.meta.env.VITE_PRE;
    
    let caber = createCaber();
    let cab = caber.cab;
    let cargado = $state(false);
    let caboff = $state({})
    let useroff = $state({})
    let usuarioid = $state("")
    let db = $state(null)
    function getTipoNombre(_tipo){
        let c_idx = tipostacto.findIndex(c=>c.id==_tipo)
        if (c_idx ==-1){
            return ""
        }
        else {
            return tipostacto[c_idx].nombre
        }
    }
    function getCategoriaNombre(_cate){
        let c_idx = categorias.findIndex(c=>c.id==_cate)
        if (c_idx ==-1){
            return ""
        }
        else {
            return categorias[c_idx].nombre
        }
    }
    
    function getNombrePadres(p_padres) {
        let ids = p_padres.split(",");

        let nombres = ids.reduce(
            (acc, valor) => shorterWord(caravanaPadre(valor)) + " , " + acc,
            "",
        );

        return getWholeWordButLastLetter(nombres);
    }
    function getSexo(sex) {
        let obj = sexos.filter((s) => s.id == sex)[0];
        if (obj) {
            return obj.nombre;
        } else {
            return "";
        }
    }
    async function volver() {
        let geneologia = genealogiaStorage.load();
        let indice = geneologia.posicionActual;

        if (indice == 1) {
            let animal = irAElemento(0);
            goto("/animales/" + animal.id);
        } else {
            let animal = irAElemento(indice - 1);
            cargarProgenitores();
            if (animal.id) {
                idanimal = animal.id;
                await cargarPadre();
            }
        }
    }
    async function getTratamientos() {
        const records = await pb.collection("tratamientos")
        .getList(1, ultimos_valores, {
            sort: "-fecha ",
            filter: `animal = '${idanimal}' && active=true`,
            expand: "tipo",
        });
        tratamientos = records.items;
    }
    async function getObservaciones() {
        const records = await pb.collection("observaciones")
        .getList(1, ultimos_valores, {
            sort: "-fecha",
            filter: `animal = '${idanimal}' && active=true`,
        });
        observaciones = records.items;
    }
    async function getPesajes() {
        const records = await pb.collection("pesaje")
        .getList(1, ultimos_valores, {
            filter: `animal='${idanimal}'`,
            sort: "-fecha",
        });
        pesajes = records.items;
    }
    async function getServicios() {
        const records = await pb.collection("servicios")
        .getList(1, ultimos_valores, {
            sort: "-fechadesde ",
            filter: `active = true && madre = '${idanimal}'`,
            expand: "madre",
        });
        servicios = records.items;
    }
    async function getInseminaciones() {
        const records = await pb.collection("inseminacion")
        .getList(1, ultimos_valores, {
            sort: "-fechainseminacion ",
            filter: `animal = '${idanimal}' && active=true`,
        });
        inseminaciones = records.items;
        servicios = servicios.concat(inseminaciones);
    }
    async function getPariciones(id) {
        const recordpariciones = await pb
            .collection("nacimientos")
            .getList(1, ultimos_valores, {
                filter: `madre='${idanimal}' || padre='${idanimal}'`,
                sort: "-created",
            });
        pariciones = recordpariciones.items;
    }
    async function getTactos(id) {
        const recordtactos = await pb.collection("tactos")
        .getList(1, ultimos_valores, {
            filter: `animal='${idanimal}'`,
            sort: "-created",
        });

        tactos = recordtactos.items;
    }
    async function cargarEventos() {
        await getLocalSQL()
    }
    function cargarNacimiento(animal) {
        nacimiento = animal.expand.nacimiento;

        padre = { id: nacimiento.padre, caravana: nacimiento.nombrepadre };
        madre = { id: nacimiento.madre, caravana: nacimiento.nombremadre };
    }
    function cargarProgenitores() {
        let geneologia = genealogiaStorage.load();
        progenitores = geneologia.progenitores.map((a) => a.caravana);
    }
    async function cargarPadre() {
        let geneologia = genealogiaStorage.load();

        let data = geneologia.progenitores[geneologia.posicionActual];
        let animal = data.animal;

        caravana = animal.caravana;
        nombrelote = animal.expand?.lote?.nombre || "";
        nombrerodeo = animal.expand?.lote?.nombre || "";
        rp = animal.rp || "";
        prenada = animal.prenada;
        sexo = animal.sexo;
        peso = animal.peso;
        categoria = animal.categoria;
        if (animal.nacimiento != "") {
            connacimiento = true;
            cargarNacimiento(animal);
        } else {
            connacimiento = false;
        }
        await cargarEventos();
    }
    async function irPadre(indice) {
        if (indice == 0) {
            let animal = irAElemento(0);
            goto("/animales/" + animal.id);
        }
        let animal = irAElemento(indice);
        if (animal) {
            idanimal = animal.id;
            cargarProgenitores();
            await cargarPadre();
        }
    }
    async function nuevaEntrada(_id) {
        let recordxiste = animales.filter(p=>p.id==_id)
        if (recordxiste.length > 0) {
            let animal = recordxiste[0];

            navegarAPadre(animal.id, animal.caravana, animal);
            cargarProgenitores();
            await cargarPadre();
        } else {
            Swal.fire(
                "Error padre",
                "No existe el animal en esta cabaña",
                "error",
            );
        }
    }
    async function initPage(){
        db = await openDB()
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
    }
    async function getLocalSQL(){
        let resanimales = await getAnimalesSQL(db)
        let tactostodos = await getTactosSQL(db)
        let nacimientostodos = await getNacimientosSQL(db)
        let pesajestodos = await getPesajesSQL(db)
        let tratstodos = await getTratsSQL(db)
        let servistodos = await getServiciosSQL(db)
        let inseminacionestodos = await getInseminacionesSQL(db)
        let observacionestodos = await getObservacionesSQL(db)
        let tipostratodos = await getTiposTratSQL(db)
        let historialtodos = await getHistorialAnimalesSQL(db)
        let lotesrodeos = await getLotesRodeosSQL(db,caboff.id)
        animales = resanimales.lista
        pesajes = pesajestodos.lista.filter(p=>p.animal == idanimal)
        tratamientos = tratstodos.lista.filter(t=>t.animal == idanimal)
        observaciones = observacionestodos.lista.filter(o=>o.animal == idanimal)
        servicios = servistodos.lista.filter(s=>s.madre  == idanimal)
        inseminaciones = inseminacionestodos.lista.filter(i=>i.animal == idanimal)
        //tipostrat = tipostratodos.lista.filter(tt=>(tt.cab == caboff.id || tt.generico) && tt.active)
        //nacimientoscab = nacimientostodos.lista
        pariciones = nacimientostodos.lista.filter(n=>n.madre == idanimal ||  n.padre == idanimal)
        tactos = tactostodos.lista.filter(t=>t.animal == idanimal)
        //historial = historialtodos.lista.filter(h=>h.animal == idanimal)
        //lotes = lotesrodeos.lotes.sort((tt1,tt2)=>tt1.nombre.toLocaleLowerCase()<tt2.nombre.toLocaleLowerCase()?-1:1)
        //rodeos = lotesrodeos.rodeos.sort((tt1,tt2)=>tt1.nombre.toLocaleLowerCase()<tt2.nombre.toLocaleLowerCase()?-1:1)
    }
    onMount(async () => {   
        await initPage()
        let geneologia = genealogiaStorage.load();
        if (geneologia.posicionActual != -1) {
            cargarProgenitores();
            let animal = irAElemento(geneologia.posicionActual);
            if (animal) {
                idanimal = animal.id;
                await cargarPadre();
            }
        } else {
            Swal.fire(
                "Error geneologia",
                "No tienes una geneologia guardada",
                "error",
            );
        }
    });
</script>

<Navbarr>
    <div class="lg:flex lg:items-center lg:justify-center">
        <div class="p-2 breadcrumbs max-w-md text-lg">
            <ul>
                {#each progenitores as p, i}
                    <li>
                        <button onclick={() => irPadre(i)}>
                            {p}
                        </button>
                    </li>
                {/each}
            </ul>
        </div>
    </div>
    <CardAnimal cardsize="max-w-7xl" titulo={caravana}>
        <div>
            <button
                class={`
                        bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                        ${estilos.btnsecondary}
                        rounded-full
                        px-4 pt-2 pb-3
                    `}
                onclick={volver}
            >
                <span class="text-lg font-semibold">Volver</span>
            </button>
        </div>
        <div class="grid grid-cols-2 gap-1 lg:gap-6 mx-1 mb-2">
            <div class="mb-1 lg:mb-0 col-span-2 lg:col-span-1">
                <label for="rp" class="label">
                    <span class="label-text text-base">RP</span>
                </label>
                <label
                    for="rp"
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                >
                    {shorterWord(rp)}
                </label>
            </div>
            <div class="mb-1 lg:mb-0">
                <label for="peso" class="label">
                    <span class="label-text text-base">Peso(KG)</span>
                </label>
                <label
                    for="nombre"
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                >
                    {peso}
                </label>
            </div>
            <div class="mb-1 lg:mb-0">
                <label for="sexo" class="label">
                    <span class="label-text text-base">Sexo</span>
                </label>
                <label
                    for="sexo"
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                >
                    {getSexo(sexo)}
                </label>
            </div>
            <div class="mb-1 lg:mb-0">
                <label for="rodeo" class="label">
                    <span class="label-text text-base">Rodeo</span>
                </label>
                <label
                    for="rodeo"
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                >
                    {nombrerodeo}
                </label>
            </div>
            <div class="mb-1 lg:mb-0">
                <label for="lote" class="label">
                    <span class="label-text text-base">Lote</span>
                </label>
                <label
                    for="lote"
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                >
                    {nombrelote}
                </label>
            </div>
            <div class="mb-1 lg:mb-0">
                <label for="categoria" class="label">
                    <span class="label-text text-base">Categoria</span>
                </label>
                <label
                    for="categoria"
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                >
                    {capitalize(categoria)}
                </label>
            </div>
            <div class="mb-1 lg:mb-0 col-span-2 lg:col-span-1">
                <label for="raza" class="label">
                    <span class="label-text text-base">Raza</span>
                </label>
                <label
                    for="raza"
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                >
                    {shorterWord(raza)}
                </label>
            </div>
            <div class="mb-1 lg:mb-0 col-span-2 lg:col-span-1">
                <label for="peso" class="label">
                    <span class="label-text text-base">Color</span>
                </label>
                <label
                    for="color"
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
                >
                    {shorterWord(color)}
                </label>
            </div>
            {#if sexo == "H"}
                <div class="mb-1 lg:mb-0 col-span-2 lg:w-1/2">
                    <label for="prenada" class="label">
                        <span class="label-text text-base">Estado</span>
                    </label>
                    <RadioButton bind:option={prenada} deshabilitado={true} />
                </div>
            {/if}
        </div>
        {#if connacimiento}
            <div class="grid grid-cols-2 lg:grid-cols-2">
                <h3 class="text-2xl font-bold mt-2 mb-1 text-left">
                    Nacimiento
                </h3>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-1 gap-1 lg:gap-6 mb-2">
                <div>
                    <label for="fechanacimiento" class="label">
                        <span class="label-text text-base">Fecha</span>
                    </label>
                    <label
                        for="fechanacimiento"
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-2`}
                    >
                        {new Date(nacimiento.fecha).toLocaleDateString()}
                    </label>
                </div>
            </div>
            <div
                class="grid grid-cols-1 lg:grid-cols-2 gap-1 lg:gap-6 mx-1 mb-2"
            >
                <div>
                    <label for="nombremadre" class="label">
                        <span class="label-text text-base"
                            >Madre: {madre.caravana}
                        </span>
                    </label>

                    {#if madre.id != ""}
                        <div class="flex justify-start mx-0 px-0">
                            <button
                                class={`${estilos.basico} ${estilos.chico} ${estilos.primario}`}
                                onclick={async () =>
                                    await nuevaEntrada(madre.id)}
                                >Ver animal</button
                            >
                        </div>
                    {/if}
                </div>

                <div>
                    <label for="nombrepadre" class="label">
                        <span class="label-text text-base"
                            >Padre: {padre.caravana}</span
                        >
                    </label>

                    {#if padre.id != ""}
                        <div class="flex justify-start mx-0 px-0">
                            <button
                                class={`${estilos.basico} ${estilos.chico} ${estilos.primario}`}
                                onclick={async () =>
                                    await nuevaEntrada(padre.id)}
                                >Ver animal</button
                            >
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div>
                <div
                    class="grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-10 m-1 mb-2 lg:mt-2"
                >
                    <h3 class="text-xl mx-1 font-bold mb-1 text-left">
                        No tiene un nacimiento registrado
                    </h3>
                </div>
            </div>
        {/if}
    </CardAnimal>
    <CardAnimal cardsize="max-w-7xl" titulo="Últimos Tactos">
        <div
            class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto"
        >
            {#if tactos.length == 0}
                <p class="mt-5 text-lg">No tiene tactos</p>
            {:else}
                <div
                    class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto"
                >
                    <table class="table table-lg">
                        <thead>
                            <tr>
                                <th class="text-base ml-3 pl-3 mr-1 pr-1"
                                    >Fecha</th
                                >
                                <th class="text-base mx-1 px-1">Observacion</th>
                                <th class="text-base mx-1 px-1">Categoria</th>
                                <th class="text-base mx-1 px-1">Preñada</th>
                                <th class="text-base mx-1 px-1">Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each tactos as t}
                                <tr>
                                    <td class="text-base">
                                        {`${new Date(t.fecha).toLocaleDateString()}`}
                                    </td>
                                    <td class="text-base mx-1 px-1">
                                        {`${t.observacion}`}
                                    </td>
                                    <td class="text-base mx-1 px-1">
                                        {`${getCategoriaNombre(t.categoria)}`}
                                    </td>
                                    <td class="text-base mx-1 px-1">
                                        {t.prenada == 0
                                            ? "Vacia"
                                            : t.prenada == 1
                                              ? "Dudosa"
                                              : "Preñada"}
                                    </td>
                                    <td class="text-base mx-1 px-1">
                                        {`${getTipoNombre(t.tipo)}`}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                <div class="block w-full md:hidden justify-items-center mx-1">
                    {#each tactos as t}
                        <div
                            class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                        >
                            <button>
                                <div class="block p-4">
                                    <div
                                        class="flex justify-between items-start mb-2"
                                    >
                                        <h3 class="font-medium">
                                            {`${new Date(t.fecha).toLocaleDateString()}`}
                                        </h3>
                                        {#if t.prenada != 1}
                                            <div
                                                class={`badge badge-outline badge-${getEstadoColor(t.prenada)}`}
                                            >
                                                {getEstadoNombre(t.prenada)}
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="grid grid-cols-2 gap-y-2">
                                        <div class="flex items-start">
                                            <span>Tipo:</span>
                                            <span class="mx-2 font-semibold">
                                                {`${t.tipo == "eco" ? "Ecografía" : "Tacto"}`}
                                            </span>
                                        </div>
                                        <div
                                            class="col-span-2 flex items-start"
                                        >
                                            <span>{`${t.observacion}`}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </CardAnimal>

    <CardAnimal cardsize="max-w-7xl" titulo="Últimos Pesajes">
        <div
            class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto"
        >
            {#if pesajes.length == 0}
                <p class="mt-5 text-lg">No hay pesajes</p>
            {:else}
                <div
                    class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto"
                >
                    <table class="table table-lg">
                        <thead>
                            <tr>
                                <th class="text-base ml-3 pl-3 mr-1 pr-1"
                                    >Fecha</th
                                >
                                <th class="text-base mx-1 px-1"
                                    >Peso anterior</th
                                >
                                <th class="text-base mx-1 px-1">Peso nuevo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each pesajes as p}
                                <tr>
                                    <td
                                        class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10"
                                        >{new Date(
                                            p.fecha,
                                        ).toLocaleDateString()}</td
                                    >
                                    <td class="text-base mx-1 px-1">
                                        {`${p.pesoanterior}`}
                                    </td>
                                    <td class="text-base mx-1 px-1">
                                        {`${p.pesonuevo}`}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                <div class="block w-full md:hidden justify-items-center mx-1">
                    {#each pesajes as p}
                        <div
                            class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                        >
                            <button>
                                <div class="block p-4">
                                    <div class="grid grid-cols-2 gap-y-2">
                                        <div class="flex items-start">
                                            <span>Fecha:</span>
                                            <span class="mx-1 font-semibold">
                                                {new Date(
                                                    p.fecha,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        
                                        <div class="flex items-start">
                                            <span>Peso anterior:</span>
                                            <span class="mx-1 font-semibold">
                                                {`${p.pesoanterior}`}
                                            </span>
                                        </div>
                                        <div class="flex items-start">
                                            <span>Peso nuevo:</span>
                                            <span class="mx-1 font-semibold">
                                                {`${p.pesonuevo}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </CardAnimal>
    <CardAnimal cardsize="max-w-7xl" titulo="Últimos Servicios">
        <div
            class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto"
        >
            {#if servicios.length == 0}
                <p class="mt-5 text-lg">No tiene inseminaciones y servicios</p>
            {:else}
                <div
                    class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto"
                >
                    <table class="table table-lg">
                        <thead>
                            <tr>
                                <th class="text-base ml-3 pl-3 mr-1 pr-1"
                                    >Fecha</th
                                >
                                <th class="text-base ml-3 pl-3 mr-1 pr-1"
                                    >Fecha hasta</th
                                >
                                <th class="text-base ml-3 pl-3 mr-1 pr-1"
                                    >Fecha parto</th
                                >
                                
                                <th class="text-base mx-1 px-1">Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each servicios as s}
                                <tr>
                                    <td
                                        class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10 border-b dark:border-gray-600"
                                        >{s.fechadesde
                                            ? new Date(
                                                  s.fechadesde,
                                              ).toLocaleDateString()
                                            : s.fechainseminacion
                                              ? new Date(
                                                    s.fechainseminacion,
                                                ).toLocaleDateString()
                                              : ""}
                                    </td>
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
                                            ? "Natural"
                                            : "Artificial"}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                <div class="block w-full md:hidden justify-items-center mx-1">
                    {#each servicios as s}
                        <div
                            class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                        >
                            <button>
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
                                                <span
                                                    class="mx-1 font-semibold"
                                                >
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
                                        
                                        <div
                                            class="col-span-2 flex items-start"
                                        >
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
    </CardAnimal>
    <div class="hidden">
        <CardAnimal cardsize="max-w-7xl" titulo="Últimos Inseminaciones">
            {inseminaciones.length}
        </CardAnimal>
    </div>

    <CardAnimal cardsize="max-w-7xl" titulo="Últimos Pariciones">
        <div
            class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto"
        >
            {#if pariciones.length == 0}
                <p class="mt-5 text-lg">No hay pariciones</p>
            {:else}
                <div
                    class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto"
                >
                    <table class="table table-lg">
                        <thead>
                            <tr>
                                <th class="text-base ml-3 pl-3 mr-1 pr-1"
                                    >Fecha</th
                                >
                                <th class="text-base mx-1 px-1">Madre</th>
                                <th class="text-base mx-1 px-1">Padre</th>
                                <th class="text-base mx-1 px-1">Observacion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each pariciones as n}
                                <tr>
                                    <td
                                        class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10"
                                        >{new Date(
                                            n.fecha,
                                        ).toLocaleDateString()}</td
                                    >
                                    <td class="text-base mx-1 px-1">
                                        {`${n.nombremadre}`}
                                    </td>
                                    <td class="text-base mx-1 px-1">
                                        {`${n.nombrepadre}`}
                                    </td>
                                    <td class="text-base mx-1 px-1">
                                        {`${n.observacion}`}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                <div class="block w-full md:hidden justify-items-center mx-1">
                    {#each pariciones as n}
                        <div
                            class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                        >
                            <button>
                                <div class="block p-4">
                                    <div class="grid grid-cols-2 gap-y-2">
                                        <div class="flex items-start">
                                            <span>Fecha:</span>
                                            <span class="mx-1 font-semibold">
                                                {new Date(
                                                    n.fecha,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div class="flex items-start">
                                            <span>Madre:</span>
                                            <span class="mx-1 font-semibold">
                                                {`${n.nombremadre}`}
                                            </span>
                                        </div>
                                        <div class="flex items-start">
                                            <span>Padre:</span>
                                            <span class="mx-1 font-semibold">
                                                {`${n.nombrepadre}`}
                                            </span>
                                        </div>
                                        <div
                                            class="col-span-2 flex items-start"
                                        >
                                            <span>{`${n.observacion}`}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </CardAnimal>
    <CardAnimal cardsize="max-w-7xl" titulo="Últimos Tratamientos">
        
        <div class="w-full flex justify-items-center lg:w-3/4 overflow-x-auto">
            {#if tratamientos.length == 0}
                <p class="mt-5 text-lg">No hay tratamientos</p>
            {:else}
                <div
                    class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto"
                >
                    <table class="table table-lg">
                        <thead>
                            <tr>
                                <th class="text-base ml-3 pl-3 mr-1 pr-1"
                                    >Fecha</th
                                >
                                <th class="text-base mx-1 px-1">Tratamiento</th>
                                <th class="text-base mx-1 px-1">Categoria</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each tratamientos as t}
                                <tr>
                                    <td
                                        class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10"
                                        >{new Date(
                                            t.fecha,
                                        ).toLocaleDateString()}</td
                                    >
                                    <td class="text-base mx-1 px-1">
                                        {t.expand.tipo.nombre}
                                    </td>
                                    <td class="text-base mx-1 px-1"
                                        >{t.categoria}</td
                                    >
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                <div class="block w-full md:hidden justify-items-center mx-1">
                    {#each tratamientos as t}
                        <div
                            class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                        >
                            <button>
                                <div class="block p-4">
                                    <div class="grid grid-cols-2 gap-y-2">
                                        <div class="flex items-start">
                                            <span>Fecha:</span>
                                            <span class="mx-1 font-semibold">
                                                {new Date(
                                                    t.fecha,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div class="flex items-start">
                                            <span>Tipo:</span>
                                            <span class="mx-1 font-semibold">
                                                {`${t.expand.tipo.nombre}`}
                                            </span>
                                        </div>
                                        <div
                                            class="col-span-2 flex items-start"
                                        >
                                            <span>{`${t.observacion}`}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </CardAnimal>
    <CardAnimal cardsize="max-w-7xl" titulo="Últimos Observaciones">
        <div
            class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto"
        >
            {#if observaciones.length == 0}
                <p class="mt-5 text-lg">No hay observaciones</p>
            {:else}
                <div
                    class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto"
                >
                    <table class="table table-lg">
                        <thead>
                            <tr>
                                <th class="text-base ml-3 pl-3 mr-1 pr-1"
                                    >Fecha</th
                                >
                                <th class="text-base mx-1 px-1">Observacion</th>
                                <th class="text-base mx-1 px-1">Categoria</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each observaciones as o}
                                <tr>
                                    <td
                                        class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10"
                                        >{new Date(
                                            o.fecha,
                                        ).toLocaleDateString()}</td
                                    >
                                    <td class="text-base mx-1 px-1">
                                        {`${o.observacion}`}
                                    </td>
                                    <td class="text-base mx-1 px-1">
                                        {`${capitalize(o.categoria)}`}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                <div class="block w-full md:hidden justify-items-center mx-1">
                    {#each observaciones as o}
                        <div
                            class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900"
                        >
                            <button>
                                <div class="block p-4">
                                    <div class="grid grid-cols-2 gap-y-2">
                                        <div class="flex items-start">
                                            <span>Fecha:</span>
                                            <span class="mx-1 font-semibold">
                                                {new Date(
                                                    o.fecha,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div class="flex items-start">
                                            <span>Categoria:</span>
                                            <span class="mx-1 font-semibold">
                                                {`${capitalize(o.categoria)}`}
                                            </span>
                                        </div>
                                        <div
                                            class="col-span-2 flex items-start"
                                        >
                                            <span>{`${o.observacion}`}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </CardAnimal>
</Navbarr>

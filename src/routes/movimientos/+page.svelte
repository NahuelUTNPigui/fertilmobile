<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
    import estilos from '$lib/stores/estilos';
    import { createCaber } from '$lib/stores/cab.svelte';
    import categorias from "$lib/stores/categorias";
    import sexos from "$lib/stores/sexos";
    import {guardarHistorial} from "$lib/historial/lib"
    import {createPer} from "$lib/stores/permisos.svelte"
    import { getPermisosList } from '$lib/permisosutil/lib';
    import motivos from '$lib/stores/motivos';
    import MultiSelect from "$lib/components/MultiSelect.svelte";
    import tiponoti from "$lib/stores/tiponoti";
    import { getEstadoNombre,getEstadoColor } from "$lib/components/estadosutils/lib";
    import { getSexoNombre } from '$lib/stringutil/lib';
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    let caber = createCaber()
    let cab = caber.cab
    let per = createPer()
    let userpermisos = getPermisosList(per.per.permisos)

    //boton
    let textoboton = $state("Mover")
    //Datos animales
    let animales = $state([])
    let animalesrows = $state([])
    //Filtros
    let buscar = $state("")
    let lote = $state("")
    let loteseleccion = $state([])
    let rodeo = $state("")
    let rodeoseleccion = $state([])
    let categoriaseleccion = $state([])
    let categoria = $state("")
    let sexo = $state("")

    let lotes = $state([])
    let rodeos = $state([])
    let tipos = $state([])
    let isOpenFilter = $state(false)
    //Seleccionados
    let selectanimales = $state([])
    let selecthashmap = $state({})
    let todos = $state(false)
    let algunos = $state(false)
    let ninguno = $state(true)
    //movimiento
    let nuevacategoria = $state("")
    let nuevolote = $state("")
    let nuevorodeo = $state("")
    let tipotratamiento = $state("")
    let fecha = $state("")
    let fechabaja = $state("")
    let motivo = $state("")
    let codigo = $state("")
    //validar
    let malcategoria = $state("")
    let mallote = $state("")
    let malrodeo = $state("")
    let maltipo = $state("")
    let malfecha = $state("")
    let malfechabaja = $state("")
    let malmotivo = $state("")
    let malcodigo = $state("")
    let habilitarboton = $state(false)

    //Seleecionar
    let selectcategoria = $state(true)
    let selectlote = $state(false)
    let selectrodeo = $state(false)
    let selecttratamiento = $state(false)
    let selectbaja = $state(false)
    let selecttransfer = $state(false)

    function clickFilter(){
        isOpenFilter = !isOpenFilter
    }
    function limpiar(){
        let lista = []
        for (const [key, value ] of Object.entries(selecthashmap)) {
            lista.push(key)
        }
        for(let i = 0;i<lista.length;i++){
            selecthashmap[lista[i]] = null
        }
        algunos = false
        todos = false
        ninguno = true
    }
    function filterUpdate(){
        
        animalesrows = animales
        if(buscar != ""){
            animalesrows = animalesrows.filter(a=>a.caravana.toLocaleLowerCase().includes(buscar.toLocaleLowerCase()))
        }
        if(sexo != ""){
            animalesrows = animalesrows.filter(a=>a.sexo == sexo)
        }
        if(categoria != ""){
            animalesrows = animalesrows.filter(a=>a.categoria == categoria)
        }
        if(rodeoseleccion.length != 0){
            if(rodeoseleccion.length == 1 && rodeoseleccion[0] == "-1"){
                animalesrows = animalesrows.filter(a=>!a.rodeo)
            }
            else{
                animalesrows = animalesrows.filter(a=>rodeoseleccion.includes(a.rodeo))
            }
            
        }
        if(loteseleccion.length != 0){
            if(loteseleccion.length == 1 && loteseleccion[0] == "-1"){
                animalesrows = animalesrows.filter(a=>!a.lote)
            }
            else{
                animalesrows = animalesrows.filter(a=>loteseleccion.includes(a.lote))
            }
            
        }
        if(categoriaseleccion.length != 0){
            if(categoriaseleccion.length == 1 && categoriaseleccion[0] == "-1"){
                animalesrows = animalesrows.filter(a=>!a.categoria)
            }
            else{
                animalesrows = animalesrows.filter(a=>categoriaseleccion.includes(a.categoria))
            }
            
        }

    }
    
    function ordenarNombre(lista){
        lista.sort((r1,r2)=>r1.nombre.toLocaleLowerCase()>r2.nombre.toLocaleLowerCase()?1:-1)
    }
    function clickAnimal(id){
        if(selecthashmap[id]){
            if(todos){
                todos = false
                algunos = true
            }
            delete selecthashmap[id] 
        }
        else{
            if(ninguno){
                algunos = true
                ninguno =  false
            }
            let a = animales.filter(an=>an.id==id)[0]
            selecthashmap[id] = {
                ...a
            }
        }
    }
    function clickTodos(){
        if(todos){
            todos = false
            ninguno = true
            algunos = false
            selecthashmap = {}
        }
        else if(ninguno){
            ninguno = false
            todos = true
            for(let i = 0;i<animalesrows.length;i++){
                let a = animalesrows[i]
                selecthashmap[animalesrows[i].id] = {
                    ...a
                }
            }
        }
        else if (algunos){
            selecthashmap = {}
            algunos = false
            todos = false
            ninguno = true
        }
        
    }
    async function getLotes(){
        const records = await pb.collection('lotes').getFullList({
            filter:`active = true && cab ~ '${cab.id}'`,
            sort: 'nombre',
        });
        lotes = records
        ordenarNombre(lotes)
    }
    async function getRodeos(){
        const records = await pb.collection('rodeos').getFullList({
            filter:`active = true && cab ~ '${cab.id}'`,
            sort: 'nombre',
        });
        rodeos = records
        //ordenarNombre(rodeos)
    }
    async function getTipos(){
        const records = await pb.collection('tipotratamientos').getFullList({
            filter : `(cab='${cab.id}' || generico = true) && active = true`,
            sort: '-created',
        });
        tipos = records
        tipos.sort((tp1,tp2)=>tp1.nombre>tp2.nombre?1:-1)
    }
    async function getAnimales(){
        const recordsa = await pb.collection("animales").getFullList({
            filter:`active=true && delete=false && cab='${cab.id}'`,
            expand:"rodeo,lote,cab"
        })
        
        animales = recordsa
        animales.sort((a1,a2)=>a1.caravana>a2.caravana?1:-1)
        animalesrows = animales
    }
    function openNewModal(){
        if(userpermisos[3]){
            nuevoModal.showModal()   
        }
        else{
            Swal.fire("Error movimiento","No tienes permisos para hacer movimientos","error")
        }
        
    }
    async function mover(){
        if(ninguno){
            Swal.fire("Error movimiento","No hay animales seleccionados","error")
            nuevorodeo = ""
            nuevolote = ""
            nuevacategoria = ""
            return
        }
        let lista = []
        for (const [key, value ] of Object.entries(selecthashmap)) {
            if(value != null){
                lista.push(value)
            }
        }
        if(lista.length==0){
            Swal.fire("Error movimiento","No hay animales seleccionados","error")
            nuevorodeo = ""
            nuevolote = ""
            nuevacategoria = ""
            return
        }

        
        let data = {}
        let nombrelote = ""
        let nombrerodeo = ""
        if(selectcategoria){
            data.categoria = nuevacategoria
            
        }
        if(selectlote){
            data.lote = nuevolote
            nombrelote = lotes.filter(l =>l.id==nuevolote)[0]
        }
        if(selectrodeo){
            data.rodeo = nuevorodeo
            nombrerodeo = rodeos.filter(r =>r.id==nuevorodeo)[0]
        }
        if(selecttratamiento){
            data.fecha = fecha + " 03:00:00"
            data.tipo = tipotratamiento
            data.active = true
            data.cab = cab.id
        }
        if(selectbaja){
            data.active = false
            data.motivobaja = motivo
            data.fechafallecimiento = fechabaja + " 03:00:00" 
        }
        if(selecttransfer){
            const resultList = await pb.collection('cabs').getList(1, 1, {
                filter: `active = true && codigo = '${codigo}'`,
            });
            if(resultList.items.length == 0){
                malcodigo = true
                return
            }
            data.cab = resultList.items[0].id
            try{
                let pb_json = JSON.parse(localStorage.getItem('pocketbase_auth'))
        
                let origenusuarioid =  pb_json.record.id
                let datanoti = {
                    texto:`Se transfirieron ${lista.length} animales`,
                    titulo:`Transferencia de ${lista.length} animales`,
                    tipo:tiponoti[1].id,
                    origen:origenusuarioid,
                    destino:resultList.items[0].user,
                    leido:false
                }
                const record = await pb.collection('notificaciones').create(datanoti);
            }
            catch(err){
                console.error(err)
            }
        }
        let bulkcambios = []
        let bulkhistoriales = []
        let bulktratamientos = []
        for(let i = 0;i<lista.length;i++){
            let a = lista[i]
            if(!selecttratamiento){
                let datacambio={
                    ...data
                }
                bulkcambios.push(datacambio)
                let datahistorial = {
                    animal:a.id,
                    caravana:a.caravana,
                    user:a.expand.cab.user,
                    active:true,
                    delete:false,
                    fechanacimiento:a.fechanacimiento,
                    sexo:a.sexo,
                    peso:a.peso,
                    lote:a.lote,
                    rodeo:a.rodeo,
                    categoria:a.categoria,
                    prenada:a.prenada
                }
                bulkhistoriales.push(datahistorial)
                //await guardarHistorial(pb,lista[i].id)
                //await pb.collection('animales').update(lista[i].id, data);
            }
            else{
                let a = lista[i]
                let datatratamiento = {
                    ...data,
                    animal:a.id,
                    categoria:a.categoria
                }
                bulktratamientos.push(datatratamiento)
            }
        }
        try{
            const batch = pb.createBatch();
            for(let i = 0;i<lista.length;i++){
                if(!selecttratamiento){
                    batch.collection('animales').update(lista[i].id,bulkcambios[i]);
                    batch.collection('historialanimales').create(bulkhistoriales[i]);
                }
                else{
                    batch.collection('tratamientos').create(bulktratamientos[i]);
                }
            }
            const result = await batch.send();
            Swal.fire("Éxito movimiento","Movimiento exitoso","success")
        }
        catch(err){
            Swal.fire("Error movimiento","No se logró hacer el movimiento","error")
        }
        for(let i = 0;i<lista.length;i++){
            delete selecthashmap[lista[i].id] 
        }
            
        algunos = false
        todos = false
        ninguno = true
        selectcategoria = true
        selectlote = false
        selectrodeo = false
        selecttratamiento = false
        selectbaja = false
        selecttransfer
        nuevacategoria = ""
        nuevolote = ""
        nuevorodeo = ""
        fecha = ""
        tipotratamiento = ""
        fechabaja = ""
        motivo = ""
        codigo = ""
        habilitarboton = false
        
        await getAnimales()
        filterUpdate()

    }
    function onChangeCollapse(seccion){
        nuevacategoria = ""
        nuevolote = ""
        nuevorodeo = ""
        fecha = ""
        tipotratamiento = ""
        fechabaja = ""
        motivo = ""
        codigo = ""
        habilitarboton = false
        if(seccion == "CATEGORIA"){
            selectcategoria= true
            selectlote= false
            selectrodeo= false
            selecttratamiento = false
            selectbaja = false
            selecttransfer = false
            textoboton = "Mover de categoria"
            
        }
        if(seccion == "RODEO"){
            selectcategoria= false
            selectlote= false
            selectrodeo= true
            selecttratamiento = false
            selectbaja = false
            selecttransfer = false
            textoboton = "Mover de rodeo"
            
        }
        if(seccion == "LOTE"){
            selectcategoria= false
            selectlote= true
            selectrodeo= false
            selecttratamiento = false
            selectbaja = false
            selecttransfer = false
            textoboton = "Mover de lote"
            
        }
        if(seccion == "TRATAMIENTO"){
            selectcategoria= false
            selectlote= false
            selectrodeo= false
            selecttratamiento = true
            selectbaja = false
            selecttransfer = false
            textoboton = "Crear tratamientos"
            
        }
        if(seccion == "BAJA"){
            selectcategoria= false
            selectlote= false
            selectrodeo= false
            selecttratamiento = false
            selectbaja = true
            selecttransfer = false
            textoboton = "Dar baja"
        }
        if(seccion == "TRANSFER"){
            selectcategoria= false
            selectlote= false
            selectrodeo= false
            selecttratamiento = false
            selectbaja = false
            selecttransfer = true
        }

    }
    function validarBoton(){
        habilitarboton = true
        if(selectcategoria){
            if(nuevacategoria == ""){
                habilitarboton = false
                
            }
        }
        if(selectlote){
            if(nuevolote == ""){
                habilitarboton = false
                
            }
        }
        if(selectrodeo){
            if(nuevorodeo == ""){
                habilitarboton = false
                
            }
        }
        if(selecttratamiento){
            if(fecha == "" || tipotratamiento == ""){
                habilitarboton = false
                
            }
        }
        if(selectbaja){
            if(fechabaja == "" || motivo == ""){
                habilitarboton = false
            }
            
        }
        if(selecttransfer){
            if(codigo == ""){
                habilitarboton = false
            }
        }
    }
    function oninput(campo){
        validarBoton()
        if(selectcategoria && campo == "CATEGORIA"){
            if(nuevacategoria == ""){
                malcategoria = true
            }
            else{
                malcategoria = false
            }
        }
        if(selectlote && campo == "LOTE"){
            if(nuevolote == ""){
                mallote = true
            }
            else{
                mallote = false
            }
        }
        if(selectrodeo && campo == "RODEO"){
            if(nuevorodeo == ""){
                malrodeo = true
            }
            else{
                malrodeo = false
            }
        }
        if(selecttratamiento){
            if(campo == "FECHA"){
                if(fecha == "" ){
                    malfecha = true
                }
                else{
                    malfecha = false
                }
            }

            if(campo == "TIPO"){
                if( tipotratamiento == ""){
                    maltipo = true
                }
                else{
                    maltipo = false
                }
            }
        }
        if(selectbaja){
            if(campo == "FECHABAJA"){
                if(fechabaja == ""){
                    malfechabaja = true
                }
                else{
                    malfechabaja = false
                }
            }
            if(campo == "MOTIVO"){
                if(motivo == ""){
                    malmotivo = true
                }
                else{
                    malmotivo = false
                }
            }
        }
    }
    
    onMount(async ()=>{
        await getAnimales()
        await getRodeos()
        await getLotes()
        await getTipos()
    })

</script>
<Navbarr>
    <div class="grid grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Movimientos</h1>
        </div>
        <div class="flex col-span-2 gap-1 justify-end">
            <button class={`btn btn-primary rounded-lg ${estilos.btntext}`} data-theme="forest" onclick={()=>openNewModal()}>
                <span  class="text-xl">Nuevo</span>
            </button>
        </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2  m-1 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10" >
        <div class="w-11/12">
            <label class={`input input-bordered flex items-center gap-2 ${estilos.bgdark2}`}>
                <input type="text" class="grow" placeholder="Buscar..." bind:value={buscar} oninput={filterUpdate} />
            </label>
        </div>
    </div>
    <div class="w-11/12 m-1 mb-2 lg:mx-10 rounded-lg bg-transparent">
        <button 
            aria-label="Filtrar" 
            class="w-full"
            onclick={clickFilter}
        >
            <div class="flex justify-between items-center px-1">
                <h2 class="font-semibold text-xl py-2">Filtros</h2>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class={`h-5 w-5 transition-all duration-300 ${isOpenFilter? 'transform rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div> 
        </button>
        <div class="flex justify-between items-center px-1">
            <h3 class=" text-md py-2">Animales seleccionados: {Object.keys(selecthashmap).length}</h3>
        </div>
        
        {#if isOpenFilter}
            <div transition:slide class="grid grid-cols-1 lg:grid-cols-4  m-1 gap-2 w-11/12" >
                <div>
                    <label for = "sexo" class="label">
                        <span class="label-text text-base">Sexo</span>
                    </label>
                    <label class="input-group ">
                        <select 
                            class={`
                                select select-bordered w-full
                                rounded-md
                                focus:outline-none focus:ring-2 
                                focus:ring-green-500 
                                focus:border-green-500
                                ${estilos.bgdark2}
                            `}
                            bind:value={sexo}
                            onchange={filterUpdate}
                        >
                                <option value="">Todos</option>
                                {#each sexos as s}
                                    <option value={s.id}>{s.nombre}</option>
                                {/each}
                        </select>
                    </label>
                </div>
                <div class="mt-2">
                    <MultiSelect
                        opciones={[{id:"-1",nombre:"Sin rodeo"}].concat(rodeos)}
                        bind:valores={rodeoseleccion}
                        etiqueta="Rodeos"
                        filterUpdate = {filterUpdate}
                    />
                </div>
                
                <div class="mt-2">
                    <MultiSelect
                    opciones={[{id:"-1",nombre:"Sin lote"}].concat(lotes)}
                        bind:valores={loteseleccion}
                        etiqueta="Lotes"
                        filterUpdate = {filterUpdate}
                    />
                </div>
                <div class="mt-2">
                    <MultiSelect
                        opciones={[{id:"-1",nombre:"Sin categoria"}].concat(categorias)}
                        bind:valores={categoriaseleccion}
                        etiqueta="Categorias"
                        filterUpdate = {filterUpdate}
                    />
                </div>
                <div class="hidden">
                    <label for = "categorias" class="label">
                        <span class="label-text text-base">Categorias</span>
                    </label>
                    <label class="input-group ">
                        <select 
                            class={`
                                select select-bordered w-full
                                rounded-md
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-green-500 focus:border-green-500
                                ${estilos.bgdark2}
                            `} 
                            bind:value={categoria}
                            onchange={filterUpdate}
                        >
                                <option value="">Todos</option>
                                {#each categorias as r}
                                    <option value={r.id}>{r.nombre}</option>    
                                {/each}
                        </select>
                    </label>
                </div>
                <button
                        class="btn btn-neutral mt-2"
                        onclick={limpiar}
                >
                    Limpiar
                </button>
                
            
            </div>
        {/if}
    </div>
    <div class="hidden w-full md:grid grid-cols-1 justify-items-center mx-1 lg:mx-10 lg:w-5/6 overflow-x-auto" >
        <table class="table table-lg w-full " >
            <thead>
                <tr>
                    <th class="px-1 p-0 m-0 border-b dark:border-gray-600">
                        <button    
                            aria-label="Todos"
                            onclick={clickTodos}
                            class={`
                                
                                text-base bg-transparent rounded-lg
                                px-3 py-3 text-base
                                ${estilos.secundario}
                            `}
                        >
                            {#if todos}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            {/if}
                            {#if ninguno}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            {/if}
                            {#if algunos}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>      
                            {/if}                        
                          
                        </button>
                    </th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Caravana</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Categoria</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Rodeo</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Lote</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Sexo</th>
                </tr>
            </thead>
            <tbody>
                {#each animalesrows as a}
                    <tr>
                        <td class="px-1 p-0 m-0 ">
                            <button
                                aria-label="fila"
                                onclick={()=>clickAnimal(a.id)}
                                class={`
                                    font-medium bg-transparent rounded-lg
                                    px-3 py-3 text-base
                                    ${selecthashmap[a.id]?estilos.danger:estilos.primario}
                                `}
                            >
                                {#if selecthashmap[a.id]}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>                                  
                                {:else}             
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                {/if}
                            </button>
                        </td>
                        <td class="text-base mx-1 px-0 ">{a.caravana}</td>
                        <td class="text-base mx-1 px-0 ">{a.categoria}</td>
                        <td class="text-base mx-1 px-0 ">{a.expand?.rodeo?.nombre||''}</td>
                        <td class="text-base mx-1 px-0 ">{a.expand?.lote?.nombre||''}</td>
                        <td class="text-base mx-1 px-0 ">{a.sexo}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="block  md:hidden justify-items-center mx-1">
        <div class="w-full flex justify-start">
            <button    
                aria-label="Todos"
                onclick={clickTodos}
                class={`
                    text-base bg-transparent rounded-lg
                    p-1 text-base flex flex-row
                    ${estilos.secundario}
                `}
            >
                {#if todos}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                {/if}
                {#if ninguno}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                {/if}
                {#if algunos}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>      
                {/if}
                                 
                <span class="mt-1">
                    Seleccionar todos 
                </span>
            </button>
            
           
        </div>
        
        {#each animalesrows as a}
        <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
            <div class="block p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-medium">
                        <button
                            aria-label="fila"
                            onclick={()=>clickAnimal(a.id)}
                            class={`
                                font-medium bg-transparent rounded-lg
                                px-3 py-3 text-base
                                ${selecthashmap[a.id]?estilos.danger:estilos.primario}
                            `}
                        >
                            {#if selecthashmap[a.id]}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>                                  
                            {:else}             
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            {/if}
                        </button>
                        {a.caravana}
                    </h3>
                    {#if a.sexo == "H" && a.prenada != 1}
                        <div class={`badge badge-outline badge-${getEstadoColor(a.prenada)}`}>{getEstadoNombre(a.prenada)}</div>
                    {/if}
                </div>
                <div class="grid grid-cols-2 gap-y-2">
                    <div class="flex items-start">
                      <span class="font-semibold">{getSexoNombre(a.sexo)}</span>
                    </div>
                    <div class="flex items-start">
                      <span >Categoría:</span> 
                      <span class="font-semibold">
                        {a.categoria}
                      </span>
                      
                    </div>
                    <div class="flex items-start">
                      <span >Lote:</span>
                      <span class="font-semibold">
                        {
                            a.expand?
                            a.expand.lote?
                            a.expand.lote.nombre
                            :""
                            :""

                        }
                      </span> 
                    </div>
                    <div class="flex items-start">
                        
                      <span >Rodeo:</span> 
                      <span class="font-semibold">
                        {
                            a.expand?
                            a.expand.rodeo?
                            a.expand.rodeo.nombre
                            :""
                            :""

                        }
                      </span>
                      
                    </div>
                </div>
            </div>
        </div>
        {/each}
    </div>
    
</Navbarr>
<dialog id="nuevoModal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div 
        class="
            modal-box w-11/12 max-w-xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
            "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Movimiento</h3>
        <div class="form-control gap-1">
            <div class="collapse">
                
                <input type="radio" name="my-accordion-1" checked="checked" onchange={()=>onChangeCollapse("CATEGORIA")}/>
                <div class="collapse-title text-xl font-medium">Cambiar categoria</div>
                <div class="collapse-content">
                    <label for = "rodeos" class="label">
                        <span class="label-text text-base">Seleccione nueva categoria</span>
                    </label>
                    <label class="input-group ">
                        <select 
                            class={`
                                select select-bordered w-full
                                rounded-md
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-green-500 focus:border-green-500
                                ${estilos.bgdark2}
                            `} 
                            bind:value={nuevacategoria}
                            onchange={()=>{oninput("CATEGORIA")}}

                        >    
                            {#each categorias as r}
                                <option value={r.id}>{r.nombre}</option>    
                            {/each}
                          </select>
                    </label>
                </div>
            </div>
            <div class="collapse">
                <input type="radio" name="my-accordion-1" onchange={()=>onChangeCollapse("LOTE")} />
                <div class="collapse-title text-xl font-medium">Cambiar lote</div>
                <div class="collapse-content">
                    <label for = "rodeos" class="label">
                        <span class="label-text text-base">Seleccione nuevo lote</span>
                    </label>
                    <label class="input-group ">
                        <select 
                            class={`
                                select select-bordered w-full
                                rounded-md
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-green-500 focus:border-green-500
                                ${estilos.bgdark2}
                            `} 
                            bind:value={nuevolote}
                            onchange={()=>oninput("LOTE")}
                        >
                            {#each lotes as r}
                                <option value={r.id}>{r.nombre}</option>    
                            {/each}
                        </select>
                    </label>
                </div>
            </div>
            <div class="collapse">
                <input type="radio" name="my-accordion-1" onchange={()=>onChangeCollapse("RODEO")}/>
                <div class="collapse-title text-xl font-medium">Cambiar rodeo</div>
                <div class="collapse-content">
                    <label for = "rodeos" class="label">
                        <span class="label-text text-base">Rodeos</span>
                    </label>
                    <label class="input-group ">
                        <select 
                            class={`
                                select select-bordered w-full
                                rounded-md
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-green-500 focus:border-green-500
                                ${estilos.bgdark2}
                            `} 
                            bind:value={nuevorodeo}
                            onchange={()=>oninput("RODEO")}
                        >
                                
                                {#each rodeos as r}
                                    <option value={r.id}>{r.nombre}</option>    
                                {/each}
                          </select>
                    </label>
                </div>
            </div>
            <div class="collapse hidden">
                <input type="radio" name="my-accordion-1" onchange={()=>onChangeCollapse("TRATAMIENTO")}/>
                <div class="collapse-title text-xl font-medium">Agregar tratamientos</div>
                <div class="collapse-content">
                    <div class="grid grid-cols-2 gap-1">
                        <div>
                            <label for = "tipo" class="label">
                                <span class="label-text text-base">Tipo tratamiento</span>
                            </label>
                            <label class="input-group ">
                                <select 
                                    class={`
                                        select select-bordered w-full
                                        border border-gray-300 rounded-md
                                        focus:outline-none focus:ring-2 
                                        focus:ring-green-500 
                                        focus:border-green-500
                                        ${estilos.bgdark2} 
                                    `}
                                    bind:value={tipotratamiento}
                                    onchange={()=>oninput("TIPO")}
                                >
                                    {#each tipos as t}
                                        <option value={t.id}>{t.nombre}</option>    
                                    {/each}
                                </select>
                                
                            </label>
                        </div>
                        <div>
                            <label for = "fecha" class="label">
                                <span class="label-text text-base">Fecha</span>
                            </label>
                            <label class="input-group ">
                                <input id ="fecha" type="date" max={HOY}  
                                    class={`
                                        input input-bordered w-full
                                        border border-gray-300 rounded-md
                                        focus:outline-none focus:ring-2 
                                        focus:ring-green-500 
                                        focus:border-green-500
                                        ${estilos.bgdark2} 
                                    `}
                                    bind:value={fecha}
                                    onchange={()=>oninput("FECHA")}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="collapse">
                <input type="radio" name="my-accordion-1" onchange={()=>onChangeCollapse("BAJA")}/>
                <div class="collapse-title text-xl font-medium">Dar de baja</div>
                <div class="collapse-content">
                    <div class="grid grid-cols-2 gap-1">
                        <div>
                            <label for = "fecha" class="label">
                                <span class="label-text text-base">Motivo</span>
                            </label>
                            <input id ="caravana" type="text"  
                                class={`input input-bordered w-full ${estilos.bgdark2}`}
                                bind:value={motivo}
                                oninput={()=>oninput("MOTIVO")}
                            />
                        </div>
                        <div>
                            <label for = "fecha" class="label">
                                <span class="label-text text-base">Fecha</span>
                            </label>
                            <label class="input-group ">
                                <input id ="fecha" type="date" max={HOY}  
                                    class={`
                                        input input-bordered w-full
                                        border border-gray-300 rounded-md
                                        focus:outline-none focus:ring-2 
                                        focus:ring-green-500 
                                        focus:border-green-500
                                        ${estilos.bgdark2} 
                                    `}
                                    bind:value={fechabaja}
                                    onchange={()=>oninput("FECHABAJA")}
                                />
                            </label>
                        </div>
                    </div>
                    
                </div>  
            </div>
            <div class="collapse">
                <input type="radio" name="my-accordion-1" onchange={()=>onChangeCollapse("TRANSFER")}/>
                <div class="collapse-title text-xl font-medium">Transferir</div>
                <div class="collapse-content">
                    <div class="grid grid-cols-1 gap-1">
                        <div>
                            <label for = "codigo" class="label">
                                <span class="label-text text-base">Código</span>
                            </label>
                            <input id ="codigo" type="text"  
                                class={`input input-bordered w-full ${estilos.bgdark2}`}
                                bind:value={codigo}
                                oninput={()=>oninput("CODIGO")}
                            />
                            {#if malcodigo}
                                <div class="label">
                                    <span class="label-text-alt text-red-500">No existe un establecimiento con ese codigo</span>                    
                                </div>
                            {/if}
                        </div>
                    </div>
                    
                </div>  
            </div>
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
                <button class="btn btn-success text-white" disabled='{!habilitarboton}' onclick={mover} >{textoboton}</button>
                <button class="btn btn-error text-white" >Cancelar</button>
            </form>
        </div>
    </div>

</dialog>

<script>
    //En esta pagina solo se van a crear y ver animales
    //Se pueden crear nuevos animales con un nacimientos
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Exportar from '$lib/components/Exportar.svelte';
    import PocketBase from 'pocketbase'
    import { slide } from 'svelte/transition';
    import Swal from 'sweetalert2';
    import { onMount } from 'svelte';
    import sexos from '$lib/stores/sexos';
    import estilos from '$lib/stores/estilos';
    import estados from '$lib/stores/estados';
    import categorias from '$lib/stores/categorias';
    import { goto }  from '$app/navigation';
    import { createCaber } from '$lib/stores/cab.svelte';
    import { createUserer } from '$lib/stores/user.svelte';
    import {createPer} from "$lib/stores/permisos.svelte"
    import { getPermisosList } from '$lib/permisosutil/lib';
    import RadioButton from '$lib/components/RadioButton.svelte';
    import { getEstadoNombre,getEstadoColor } from '$lib/components/estadosutils/lib';
    import MultiSelect from '$lib/components/MultiSelect.svelte';
    import cuentas from '$lib/stores/cuentas';
    import { getSexoNombre,capitalize } from '$lib/stringutil/lib';

    let ruta = import.meta.env.VITE_RUTA
    //pre
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    let caber = createCaber()
    let userer = createUserer()
    let per = createPer()
    let cab = caber.cab
    let userpermisos = getPermisosList(per.per.permisos)
    let usuarioid = $state("")
    let filtros = false


    //Datos para mostrar
    let animales = $state([])
    let animalesrows = $state([])
    let rodeos = $state([])
    let lotes = $state([])
    let activos = [{id:"todos",nombre:"Todos"},{id:"activos",nombre:"Solo activos"},{id:"inactivos",nombre:"Solo inactivos"}]
    let madres = $state([])
    let padres = $state([])
    let buscar = $state("")
    let rodeobuscar = $state("")
    let rodeoseleccion = $state([])
    let loteseleccion = $state([])
    let categoriaseleccion = $state([])
    let sexobuscar = $state("")
    let lotebuscar = $state("")
    let estadobuscar = $state("")
    let categoriabuscar = $state("")
    let activosbuscar = $state("activos")
    let totalAnimalesEncontrados = $state(0)
    

    //Datos animal
    let animal = $state(null)
    let idanimal = $state("")
    let caravana = $state("")
    let rp = $state("")
    let prenada = $state(0)
    let fechanacimiento = $state("")
    let nacimiento = $state("")
    let sexo = $state("H")
    let conparicion = $state(false)
    let peso = $state("")
    let rodeo = $state("")
    let lote = $state("")
    let categoria = $state("")
    //Datos paricion
    let madre = $state("")
    let padre = $state("")
    let nombremadre = $state("")
    let nombrepadre = $state("")
    let observacion = $state("")
    //Validaciones
    let malcaravana = $state(false)
    let malfechanacimiento = $state(false)
    let malpeso = $state(false)
    let botonhabilitado=$state(false)
    function cambiarFiltros(){
        filtros != filtros
    }
    function ordenarNombre(lista){
        if(lista.length==0){
            return []
        }
        lista.sort((r1,r2)=>r1.nombre.toLocaleLowerCase()>r2.nombre.toLocaleLowerCase()?1:-1)
    }
    function isEmpty(str){
        return (!str || str.length === 0 );
    }
    async function verificarNivel() {
        let user = await pb.collection("users").getOne(usuarioid)
        
        let nivel  = cuentas.filter(c=>c.nivel == user.nivel)[0]
        
        let animals = await pb.collection('Animalesxuser').getList(1,1,{filter:`user='${usuarioid}'`})
        
        if(animals.totalItems >= nivel.animales){
            return false
        }
        else{
            return true
        }

    }
    async function getRodeos(){
        const records = await pb.collection('rodeos').getFullList({
            filter:`active = true && cab = '${cab.id}'`,
            sort: 'nombre',
        });
        rodeos = records
        ordenarNombre(rodeos)
    }
    async function getLotes(){
        const records = await pb.collection('lotes').getFullList({
            filter:`active = true && cab = '${cab.id}'`,
            sort: 'nombre',
        });
        lotes = records
        ordenarNombre(lotes)
    }
    async function getAnimales(){
        //Estaria joya que el animal venga con todos los chiches
        
        const recordsa = await pb.collection("animales").getFullList({
            filter:`delete=false && cab='${cab.id}'`,
            expand:"nacimiento,lote,rodeo"
        })
        
        animales = recordsa
        animales.sort((a1,a2)=>a1.caravana>a2.caravana?1:-1)
        animalesrows = animales
        madres = animales.filter(a=>a.sexo=="H")
        padres = animales.filter(a=>a.sexo=="M")
        
        
    }
    
    
    function openNewModal(){
        if(userpermisos[5]){
            idanimal=""
            botonhabilitado = false
            caravana = ""
            conparicion = false
            peso = ""
            sexo = "H"
            fechanacimiento = ""
            nombremadre = ""
            nombrepadre = ""
            padre = ""
            madre = ""
            animal = null
            observacion = ""
            rp = ""
            nuevoModal.showModal()
        }
        else{
            Swal.fire("Sin permisos","No tienes permisos para administrar animales","error")
        }
        
    }
    
    function getDetail(id){
        
        idanimal = id
        animal = animales.filter(a=>a.id==idanimal)[0]
        caravana = animal.caravana
        fechanacimiento = animal.fechanacimiento.split(" ")[0]
        sexo = animal.sexo
        if (sexo == "H"){
            prenada = animal.prenada
        }
        conparicion = animal.nacimiento != ""
        peso = animal.peso
        botonhabilitado = true
        nacimiento = animal.nacimiento
        lote = animal.lote
        rodeo = animal.rodeo
        rp = animal.rp
        nuevoModal.showModal()
    }
    //Se puede guardar un animal con su nacimiento
    async function guardar(){
        let user = await pb.collection("users").getOne(usuarioid)
        
        let nivel  = cuentas.filter(c=>c.nivel == user.nivel)[0]
        
        let animals = await pb.collection('Animalesxuser').getList(1,1,{filter:`user='${usuarioid}'`})
        let verificar = true
        if(nivel.animales != -1 && animals.totalItems > nivel.animales){
            verificar =  false
        }
        
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de ${nivel.animales} animales`,"error")
            return
        }
        
        try{
            let recordparicion = null
            if(conparicion){
                let dataparicion = {
                    madre,
                    padre,
                    fecha:fechanacimiento + " 03:00:00",
                    nombremadre,
                    nombrepadre,
                    observacion,
                    
                    cab:cab.id
                }
                recordparicion = await pb.collection('nacimientos').create(dataparicion);
                

            }
            let data = {
                caravana,
                active:true,
                delete:false,
                prenada,
                fechanacimiento:fechanacimiento +" 03:00:00",
                sexo,
                peso,
                lote,
                rodeo,
                categoria,
                cab:cab.id,
                rp
            }
            if(conparicion){
                data.nacimiento = recordparicion.id
            }
            let recorda = await pb.collection('animales').create(data); 
            if(conparicion){
                recorda.expand = {
                    nacimiento : recordparicion
                }
            }
            let datapesaje = {
                animal:recorda.id,
                fecha:fechanacimiento +" 03:00:00",
                pesoanterior:0,
                pesonuevo:peso
            }
            await pb.collection('pesaje').create(datapesaje)
            animales.push(recorda)
            animales.sort((a1,a2)=>a1.caravana>a2.caravana?1:-1)

            madres = animales.filter(a=>a.sexo=="H")
            padres = animales.filter(a=>a.sexo=="M")
            filterUpdate()
            Swal.fire("Éxito guardar","Se pudo guardar el animal con exito","success")
            caravana = ""
            nacimiento = ""
            fechanacimiento = ""
            sexo = "H"

        }
        catch(e){
            console.error(e)
            Swal.fire("Error guardar","Hubo un error para guardar el animal","error")
        }
        
    }
    
    function filterUpdate(){
        animalesrows = animales
        totalAnimalesEncontrados = animalesrows.length
        if(buscar != ""){
            animalesrows = animalesrows.filter(a=>a.caravana.toLocaleLowerCase().includes(buscar.toLocaleLowerCase()))
            totalAnimalesEncontrados = animalesrows.length
        }
        if(sexobuscar != ""){
            animalesrows = animalesrows.filter(a=>a.sexo == sexobuscar)
            totalAnimalesEncontrados = animalesrows.length
        }
        
        if(rodeoseleccion.length != 0){
            if(rodeoseleccion.length == 1 && rodeoseleccion[0] == "-1"){
                animalesrows = animalesrows.filter(a=>!a.rodeo)
                totalAnimalesEncontrados = animalesrows.length
            }
            else{
                animalesrows = animalesrows.filter(a=>rodeoseleccion.includes(a.rodeo))
                totalAnimalesEncontrados = animalesrows.length
            }
            
        }
        if(loteseleccion.length != 0){
            if(loteseleccion.length == 1 && loteseleccion[0] == "-1"){
                animalesrows = animalesrows.filter(a=>!a.lote)
                totalAnimalesEncontrados = animalesrows.length
            }
            else{
                animalesrows = animalesrows.filter(a=>loteseleccion.includes(a.lote))
                totalAnimalesEncontrados = animalesrows.length
            }
            
        }
        if(estadobuscar != ""){
            animalesrows = animalesrows.filter(a=>a.prenada == estadobuscar)
            totalAnimalesEncontrados = animalesrows.length
        }
        if(categoriaseleccion.length != 0){
            if(categoriaseleccion.length == 1 && categoriaseleccion[0] == "-1"){
                animalesrows = animalesrows.filter(a=>!a.categoria)
                totalAnimalesEncontrados = animalesrows.length
            }
            else{
                animalesrows = animalesrows.filter(a=>categoriaseleccion.includes(a.categoria))
                totalAnimalesEncontrados = animalesrows.length
            }
            
        }
        if(activosbuscar == "activos"){
            animalesrows = animalesrows.filter(a=>a.active == true)
            totalAnimalesEncontrados = animalesrows.length
        }
        if(activosbuscar == "inactivos"){
            animalesrows = animalesrows.filter(a=>a.active == false)
            totalAnimalesEncontrados = animalesrows.length
        }
    }


    function onSelectPadre(sex){
        if(sex=="H"){
            let m = madres.filter(a=>a.id == madre)[0]
            nombremadre = m.caravana
        }
        else{
            let p = padres.filter(a=>a.id == padre)[0]
            nombrepadre = p.caravana
            
        }

    }
    function oninput(inputName){
        validarBoton()
        if(inputName=="NOMBRE"){
            if(isEmpty(caravana)){
                malcaravana = true
            }
            else{
                malcaravana = false
            }
        }
    }

    function validarBoton(){
        botonhabilitado = true
        if(isEmpty(caravana)){
            botonhabilitado = false
        }
        
    }
    onMount(async()=>{
        let pb_json =  JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.record.id
        await getAnimales()
        await getRodeos()
        await getLotes()
        filterUpdate()
    })
    function cerrarModal(){
        idanimal=""
        botonhabilitado = false
        caravana = ""
        conparicion = false
        peso = ""
        sexo = "H"
        fechanacimiento = ""
        nombremadre = ""
        nombrepadre = ""
        padre = ""
        madre = ""
        animal = null
        rp = ""
        observacion = ""
        lote = ""
        rodeo = ""
        nuevoModal.close()
        
    }
    function prepararData(item){
        return {
            CARAVANA:item.caravana,
            RP:item.pr,RP:item.pr,
            NACIMIENTO:item.fechanacimiento?new Date(item.fechanacimiento).toLocaleDateString():"",
            PADRE:item.expand?
                item.expand.nacimiento?
                    item.expand.nacimiento.nombrepadre:
                "":
                "",
            MADRE:item.expand?
                item.expand.nacimiento?
                item.expand.nacimiento.nombremadre:
                "":
                "",
            SEXO:item.sexo=="M"?"Macho":"Hembra",
            PESO:item.peso,
            RODEO:
                item.expand?
                item.expand.rodeo?
                item.expand.rodeo.nombre:
                "":
                "",
            LOTE:item.expand?
                item.expand.lote?
                item.expand.lote.nombre:
                "":
                "",
            CATEGORIA:capitalize(item.categoria),
            ESTADO:getEstadoNombre(item.prenada),
            FALLECIMIENTO:item.fechafallecimiento?new Date(item.fechafallecimiento).toLocaleDateString():""

        }
    }
    //Para el collapse de los filtros
    let isOpenFilter = $state(false)
    function clickFilter(){
        isOpenFilter = !isOpenFilter
    }
    //Para el collapse de los ordenar
    let isOpenOrdenar = $state(false)
    function clickOrdenar(){
        isOpenOrdenar = !isOpenOrdenar
    }
    //Para los ordenar
    let ascendente = $state(true)
    let forma = $state("caravana")
    let selectforma = $state("caravana")
    //Ordenar animales
    function ordenarAnimalesDescendente(p_forma){
        console.log(ascendente)
        let escalar = 1
        if(!ascendente){
            escalar = -1
        }
        forma = p_forma
        if(forma=="caravana"){
            
            animalesrows.sort((a1,a2)=>escalar * a1.caravana.localeCompare(a2.caravana))
        }
        else if(forma=="sexo"){
            
            animalesrows.sort((a1,a2)=>escalar * a1.sexo.localeCompare(a2.sexo))
        }
        else if(forma=="categoria"){
            animalesrows.sort((a1,a2)=>escalar * a1.categoria.localeCompare(a2.categoria))
        }
        else if(forma=="estado"){
            animalesrows.sort((a1,a2)=> a1.prenada > a2.prenada?escalar:-1*escalar)
        }
        else if(forma=="lote"){
            animalesrows.sort((a1,a2)=>{
                let l1 = a1.expand?a1.expand.lote?a1.expand.lote.nombre:"":""
                let l2 = a2.expand?a2.expand.lote?a2.expand.lote.nombre:"":""
                return escalar * l1.localeCompare(l2)
            })
        }
        else if(forma=="rodeo"){
            animalesrows.sort((a1,a2)=>{
                let r1 = a1.expand?a1.expand.rodeo?a1.expand.rodeo.nombre:"":""
                let r2 = a2.expand?a2.expand.rodeo?a2.expand.rodeo.nombre:"":""
                return escalar * r1.localeCompare(r2)
            })
        }
    }
    function ordenarAnimales(p_forma){
        
        if(p_forma == forma){
            ascendente = !ascendente
        }
        else{
            ascendente = false
        }
        let escalar = 1
        if(!ascendente){
            escalar = -1
        }
        forma = p_forma
        if(forma=="caravana"){
            
            animalesrows.sort((a1,a2)=>escalar * a1.caravana.localeCompare(a2.caravana))
        }
        else if(forma=="sexo"){
            
            animalesrows.sort((a1,a2)=>escalar * a1.sexo.localeCompare(a2.sexo))
        }
        else if(forma=="categoria"){
            animalesrows.sort((a1,a2)=>escalar * a1.categoria.localeCompare(a2.categoria))
        }
        else if(forma=="estado"){
            animalesrows.sort((a1,a2)=> a1.prenada > a2.prenada?escalar:-1*escalar)
        }
        else if(forma=="lote"){
            animalesrows.sort((a1,a2)=>{
                let l1 = a1.expand?a1.expand.lote?a1.expand.lote.nombre:"":""
                let l2 = a2.expand?a2.expand.lote?a2.expand.lote.nombre:"":""
                return escalar * l1.localeCompare(l2)
            })
        }
        else if(forma=="rodeo"){
            animalesrows.sort((a1,a2)=>{
                let r1 = a1.expand?a1.expand.rodeo?a1.expand.rodeo.nombre:"":""
                let r2 = a2.expand?a2.expand.rodeo?a2.expand.rodeo.nombre:"":""
                return escalar * r1.localeCompare(r2)
            })
        }
    }
</script>
<Navbarr>
    
    <div class="grid grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div class="">
            <h1 class="text-2xl">Animales</h1>  
        </div>
        <div class="flex col-span-2 gap-1 justify-end">
            <div>
                <button class={` btn btn-primary rounded-lg ${estilos.btntext} px-2 mx-1`} data-theme="forest" onclick={()=>openNewModal()}>
                    <span  class="text-lg m-1 text-white">Nuevo</span>
                </button>
            </div>
            <div>
                <Exportar
                titulo = {"Animales"}
                filtros = {[]}
                confiltros = {false}
                data = {animalesrows}
                {prepararData}
            />
            </div>
            
        </div>
        
    </div>
    
    
    <div class="grid grid-cols-1 m-1 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10" >
        <div class="w-11/12 lg:w-1/2">
            <label 
                class={`
                    input 
                    input-bordered 
                    flex items-center 
                    gap-2
                    ${estilos.bgdark2}
                `}
            >
                <input type="text" 
                    class={`
                        grow
                    `} 
                    placeholder="Buscar..." 
                    bind:value={buscar} 
                    oninput={filterUpdate}
                />
            </label>
        </div>
    </div>
    <!--Filtros-->
    <div class="w-11/12 m-1 mb-2 lg:mx-10 rounded-lg bg-transparent">
        <button 
            aria-label="Filtrar" 
            class="w-full"
            onclick={clickFilter}
        >
            <div class="flex justify-between items-center px-1">
                <h1 class="font-semibold text-lg py-2">Filtros</h1>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class={`size-6 transition-all duration-300 ${isOpenFilter? 'transform rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            
        </button>
        <div>
            <span class = "text-lg mx-1">Total de animales encontrados: {totalAnimalesEncontrados}</span>
        </div>
        {#if isOpenFilter}
                <div transition:slide>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-10 w-full" >
                        <div class="mt-0">
                            <MultiSelect
                            opciones={[{id:"-1",nombre:"Sin rodeo"}].concat(rodeos)}
                                bind:valores={rodeoseleccion}
                                etiqueta="Rodeos"
                                filterUpdate = {filterUpdate}
                            />
                        </div>
                        <div class="my-0 py-0">
                            <label for = "sexo" class="label mb-0">
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
                                    bind:value={sexobuscar}
                                    onchange={filterUpdate}
                                >
                                        <option value="" class="rounded">Todos</option>
                                        {#each sexos as s}
                                            <option value={s.id} class="rounded">{s.nombre}</option>
                                        {/each}
                                  </select>
                            </label>
                        </div>
                        <div class="mt-0">
                            <MultiSelect
                                opciones={[{id:"-1",nombre:"Sin lote"}].concat(lotes)}
                                bind:valores={loteseleccion}
                                etiqueta="Lotes"
                                filterUpdate = {filterUpdate}
                            />
                        </div>
                        <div class="">
                            <MultiSelect
                                opciones={[{id:"-1",nombre:"Sin categoria"}].concat(categorias)}
                                bind:valores={categoriaseleccion}
                                etiqueta="Categorias"
                                margintop="mt-0"
                                filterUpdate = {filterUpdate}
                            />
                        </div>
                        <div>
                            <label for = "estado" class="label">
                                <span class="label-text text-base">Estado</span>
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
                                    bind:value={estadobuscar}
                                    onchange={filterUpdate}
                                >
                                        <option value="">Todos</option>
                                        {#each estados as s}
                                            <option value={s.id}>{s.nombre}</option>
                                        {/each}
                                  </select>
                            </label>
                        </div>
                        <div>
                            <label for = "activo" class="label">
                                <span class="label-text text-base">Activos</span>
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
                                    bind:value={activosbuscar}
                                    onchange={filterUpdate}
                                >
                                    {#each activos as a}
                                        <option value={a.id}>{a.nombre}</option>    
                                    {/each}
                                  </select>
                            </label>
                        </div>
                    </div>
                </div>
            {/if}
    </div>
    <!--Ordenar-->
    <div class="block  md:hidden w-11/12 m-1 mb-2 lg:mx-10 rounded-lg bg-transparent">
        <button 
            aria-label="Ordenar" 
            class="w-full"
            onclick={clickOrdenar}
        >
            <div class="flex justify-between items-center px-1">
                <h1 class="font-semibold text-lg py-2">Ordenar</h1>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class={`size-6 transition-all duration-300 ${isOpenOrdenar? 'transform rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            
        </button>
        {#if isOpenOrdenar}
            <div transition:slide>
                <div class="my-0 py-0">
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
                            bind:value={selectforma}
                            onchange={()=>ordenarAnimales(selectforma)}
                            
                        >
                            <option value="caravana" class="rounded">Caravana</option>
                            <option value="sexo" class="rounded">Sexo</option>
                            <option value="categoria" class="rounded">Categoria</option>
                            <option value="lote" class="rounded">Lote</option>
                            <option value="rodeo" class="rounded">Rodeo</option>
                            <option value="estado" class="rounded">Estado</option>
                        </select>
                    </label>
                </div>
                <div class="my-1">
                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text">Ascendente</span>
                            <input type="checkbox" class="toggle" bind:checked={ascendente} onclick={()=>ordenarAnimales(selectforma)}/>
                        </label>
                      </div>
                </div>
            </div>
        {/if}
    </div>
    <div class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
        <table class="table table-lg w-full" >
            <thead>
                <tr >
                    <th 
                        onclick={()=>ordenarAnimales("caravana")}
                        class={`
                            text-base p-3 border-b dark:border-gray-600 
                            hover:cursor-pointer hover:bg-gray-200 
                            dark:hover:bg-gray-800
                        `}  >
                        Animal
                    </th>
                    <th 
                        onclick={()=>ordenarAnimales("sexo")}
                        class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"  >
                        Sexo
                    </th>
                    <th 
                        onclick={()=>ordenarAnimales("categoria")}
                        class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"  >
                        Categoria
                    </th>
                    <th 
                        onclick={()=>ordenarAnimales("estado")}
                        class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"  >
                        Estado
                    </th>
                    <th 
                        onclick={()=>ordenarAnimales("lote")}
                        class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"  >
                        Lote
                    </th>
                    <th 
                        onclick={()=>ordenarAnimales("rodeo")}
                        class="text-base p-3 border-b dark:border-gray-600 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"  >
                        Rodeo
                    </th>
                    <!--<th class="text-base"  >Acciones</th>-->
                    
                </tr>
                
            </thead>
            
            <tbody>
                {#each animalesrows as a}
                <tr class=" hover:bg-gray-200 dark:hover:bg-gray-900" onclick={()=>goto(`/animales/${a.id}`)}>
                    <td class="text-base p-3 ">
                        <div class="flex gap-1">
                            {`${a.caravana}`}
                            {#if !a.active}
                                <div class={`
                                    bg-transparent rounded-lg
                                    p-0 m-0  ${estilos.danger}
                                `}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                                    </svg>
                                </div>
                            {/if}
                        </div>
                    </td>
                    <td class="text-base p-3 "> {a.sexo}</td>
                    <td class="text-base p-3 "> {a.categoria}</td>
                    <td class="text-base p-3 "> 
                        {getEstadoNombre(a.prenada)}
                    </td>
                    <td class="text-base p-3 ">
                        {
                            a.expand?
                            a.expand.lote?
                            a.expand.lote.nombre
                            :""
                            :""

                        }
                    </td>
                    <td class="text-base p-3 ">
                        {
                            a.expand?
                            a.expand.rodeo?
                            a.expand.rodeo.nombre
                            :""
                            :""
                        }
                    </td>
                    

                </tr>
                {/each}
        </table>
    </div>
    <div class="block  md:hidden justify-items-center mx-1">
        {#each animalesrows as a}
        <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
            <button  onclick={()=>goto(`/animales/${a.id}`)}>
                <div class="block p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-medium">{a.caravana}</h3>
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
            </button>
        </div>
            
        {/each}
        
    </div>
    
    
</Navbarr>
<dialog id="nuevoModal" 
        class="
            modal modal-top mt-10 ml-5 
            lg:items-start 
            rounded-xl 
            lg:modal-middle
        ">
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
            {#if idanimal == ""}
                <h3 class="text-lg font-bold">Nuevo Animal</h3>  
            {:else}
                <h3 class="text-lg font-bold">Ver Animal</h3>  
            {/if}
            <div class="form-control">
                <label for = "nombre" class="label">
                    <span class="label-text text-base">Caravana</span>
                </label>
                <label class="input-group">
                    <input 
                        id ="nombre" 
                        type="text"  
                        class={`
                            input 
                            input-bordered 
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                            w-full
                            ${estilos.bgdark2} 
                            ${malcaravana?"input-error":""}
                        `}
                        bind:value={caravana}
                        oninput={()=>oninput("NOMBRE")}
                    />
                    <div class={`label ${malcaravana?"":"hidden"}`}>
                        <span class="label-text-alt text-red-400">Error debe escribir la caravana del animal</span>
                    </div>
                </label>
                <label for = "rp" class="label">
                    <span class="label-text text-base">RP:</span>
                </label>
                <label class="input-group">
                    <input 
                        id ="rp" 
                        type="text"  
                        class={`
                            input 
                            input-bordered 
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                            w-full
                            ${estilos.bgdark2} 
                            
                        `}
                        bind:value={rp}
                        
                    />
                </label>
                <label for = "sexo" class="label">
                    <span class="label-text text-base">Sexo</span>
                </label>
                <label class="input-group ">
                    <select 
                        class={`
                            select select-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `} bind:value={sexo}>
                        {#each sexos as s}
                            <option value={s.id}>{s.nombre}</option>    
                        {/each}
                      </select>
                </label>
                <label for = "peso" class="label">
                    <span class="label-text text-base">Peso (KG)</span>
                </label>
                <label class="input-group">
                    <input id ="peso" type="number"  
                        class={`
                            input input-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `}
                        bind:value={peso}
                    />
                </label>
                {#if sexo == "H"}
                    <div class="m-1 mt-3">
                        <RadioButton bind:option={prenada} deshabilitado={false}/>
                    </div>
                    
                    <label for = "estado" class="hidden label">
                        <span class="label-text text-base">Estado</span>
                    </label>
                    <label class="input-group hidden">
                        <select 
                            class={`
                                select select-bordered w-full
                                border border-gray-300 rounded-md
                                focus:outline-none focus:ring-2 
                                focus:ring-green-500 focus:border-green-500
                                ${estilos.bgdark2}
                            `} bind:value={prenada}>
                            {#each estados as e}
                                <option value={e.id}>{e.nombre}</option>    
                            {/each}
                        </select>
                    </label>
                {/if}
                <label for = "categoria" class="label">
                    <span class="label-text text-base">Categoria</span>
                </label>
                <label class="input-group">
                    <select 
                        class={`
                            select select-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `} bind:value={categoria}>
                        {#each categorias as r}
                            <option value={r.id}>{r.nombre}</option>    
                        {/each}
                    </select>
                </label>
                <label for = "rodeo" class="label">
                    <span class="label-text text-base">Rodeo</span>
                </label>
                <label class="input-group">
                    <select 
                        class={`
                            select select-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `} bind:value={rodeo}>
                        {#each rodeos as r}
                            <option value={r.id}>{r.nombre}</option>    
                        {/each}
                    </select>
                </label>
                <label for = "lote" class="label">
                    <span class="label-text text-base">Lote</span>
                </label>
                <label class="input-group">
                    <select 
                        class={`
                            select select-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `} bind:value={lote}>
                        {#each lotes as r}
                            <option value={r.id}>{r.nombre}</option>    
                        {/each}
                    </select>
                </label>
                <label for = "fechanacimiento" class="label">
                    <span class="label-text text-base">Fecha nacimiento</span>
                </label>
                <label class="input-group ">
                    <input id ="fechanacimiento" type="date" max={HOY}  
                        class={`
                            input input-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `} 
                        bind:value={fechanacimiento}
                    />
                </label>
                <div class="form-group mt-3">
                    
                    <span class="label-text text-base">Con nacimiento</span>  
                    <br>
                    <input type="checkbox"  disabled={idanimal!=""} class="toggle"bind:checked={conparicion} />
                </div>
                {#if idanimal=="" && conparicion}
                    <label for = "nombremadre" class="label">
                        <span class="label-text text-base">Caravana madre</span>
                    </label>
                    <label class="input-group">
                        <input 
                            id ="nombremadre" 
                            type="text"  
                            class={`
                                input 
                                input-bordered 
                                border border-gray-300 rounded-md
                                focus:outline-none focus:ring-2 
                                focus:ring-green-500 focus:border-green-500
                                w-full 
                                ${estilos.bgdark2}
                            `}
                            bind:value={nombremadre}
                        />
                    </label>
                    <label for = "madre" class="label">
                        <span class="label-text text-base">Madre</span>
                    </label>
                    <label class="input-group ">
                        <select 
                            class={`
                                select select-bordered w-full
                                border border-gray-300 rounded-md
                                focus:outline-none focus:ring-2 
                                focus:ring-green-500 focus:border-green-500
                                ${estilos.bgdark2}
                            `}

                            bind:value={madre}
                            onchange={()=>onSelectPadre("F")}
                        >
                            {#each madres as m}
                                <option value={m.id}>{m.caravana}</option>    
                            {/each}
                          </select>
                    </label>
                    <label for = "nombrepadre" class="label">
                        <span class="label-text text-base">Caravana padre</span>
                    </label>
                    <label class="input-group">
                        <input 
                            id ="nombrepadre" 
                            type="text"  
                            class={`
                                input 
                                input-bordered 
                                border border-gray-300 rounded-md
                                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                                w-full
                                ${estilos.bgdark2}
                            `}
                            bind:value={nombrepadre}
                        />
                    </label>
                    <label for = "madre" class="label">
                        <span class="label-text text-base">Padre</span>
                    </label>
                    <label class="input-group ">
                        <select 
                            class={`
                                select select-bordered w-full
                                border border-gray-300 rounded-md
                                focus:outline-none focus:ring-2 
                                focus:ring-green-500 focus:border-green-500
                                ${estilos.bgdark2}
                            `}

                            bind:value={padre}
                            onchange={()=>onSelectPadre("M")}
                        >
                            {#each padres as p}
                                <option value={p.id}>{p.caravana}</option>    
                            {/each}
                          </select>
                    </label>
                    
                    <label class="form-control">
                        <div class="label">
                            <span class="label-text">Observacion</span>                    
                        </div>
                        <input 
                            id ="observacion" 
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
                        
                    </label>
                    

                {/if}
                {#if idanimal!="" && nacimiento != ""}
                    {#each [animal.expand.nacimiento] as n}
                        <table class="table table-lg w-full">
                            <thead>
                                <tr>
                                    <th class="text-base">Fecha</th>
                                    <th class="text-base">Madre - Padre</th>
                                    
                                </tr>
                            </thead>
                            <tbody>
                                    <tr>
                                        <td class="text-base">{new Date(n.fecha).toLocaleDateString()}</td>
                                        <td class="text-base">{n.nombremadre} , {n.nombrepadre}</td>
                                    </tr>    
                            </tbody>
                        </table>
                        <label class="form-control">
                            <div class="label">
                                <span class="label-text">Observacion</span>                    
                            </div>
                            <input 
                                id ="observacion" 
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
                            
                        </label>
                    {/each}
                {/if}
            </div>
            <div class="modal-action justify-end ">
                <form method="dialog" >
                    <!-- if there is a button, it will close the modal -->
                    {#if idanimal==""}
                        <button class="btn btn-error text-white" onclick={cerrarModal}>Cancelar</button>    
                        <button class="btn btn-success text-white" disabled='{!botonhabilitado}' onclick={guardar} >Guardar</button>
                        
                    {:else}
                        <button class="btn btn-error text-white" onclick={cerrarModal}>Cerrar</button>
                    {/if}
                    

                </form>
            </div>
        </div>
</dialog>
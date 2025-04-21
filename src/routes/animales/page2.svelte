<script>

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
    import {createCaber} from "$lib/stores/capacitor/capcab.svelte"
    import {managerAnimales} from "$lib/stores/capacitor/offlineanimales.svelte"
    import {managerGrupos} from "$lib/stores/capacitor/offlinegrupos.svelte"
    import {createPer} from "$lib/stores/permisos.svelte"
    import { getPermisosList } from '$lib/permisosutil/lib';
    import RadioButton from '$lib/components/RadioButton.svelte';
    let ruta = import.meta.env.VITE_RUTA

    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    let caber = createCaber()
    let gruper = managerGrupos()
    let animaler = managerAnimales()


    //Datos para mostrar
    let animales = $state([])
    let animalesrows = $state([])
    let rodeos = $state([])
    let lotes = $state([])
    let fallecidos = [{id:"vivos",nombre:"Solo vivos"},{id:"todos",nombre:"Todos"}]
    let madres = $state([])
    let padres = $state([])
    let buscar = $state("")
    let rodeobuscar = $state("")
    let sexobuscar = $state("")
    let lotebuscar = $state("")
    let estadobuscar = $state("")
    let categoriabuscar = $state("")
    let fallecidobuscar = $state("vivos")
    let totalAnimalesEncontrados = $state(0)
    

    //Datos animal
    let animal = $state(null)
    let idanimal = $state("")
    let caravana = $state("")
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
    async function getRodeos(){
        
        rodeos = gruper.rodeos
        
        ordenarNombre(rodeos)
    }
    async function getLotes(){
        
        lotes = gruper.lotes
        
        ordenarNombre(lotes)
    }
    async function getAnimales(){
        animales = animaler.animales       
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
            sexo = "F"
            fechanacimiento = ""
            nombremadre = ""
            nombrepadre = ""
            padre = ""
            madre = ""
            animal = null
            observacion = ""
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
        nuevoModal.showModal()
    }
    //Se puede guardar un animal con su nacimiento
    async function guardar(){
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
                cab:cab.id
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
            animales.push(recorda)
            animales.sort((a1,a2)=>a1.caravana>a2.caravana?1:-1)
            madres = animales.filter(a=>a.sexo=="F")
            padres = animales.filter(a=>a.sexo=="M")
            filterUpdate()
            Swal.fire("Éxito guardar","Se pudo guardar el animal con existo","success")
            caravana = ""
            nacimiento = ""
            fechanacimiento = ""
            sexo = "F"

        }
        catch(e){
            console.error(e)
            Swal.fire("Error guardar","Hubo un error para guardar el animal","error")
        }
        
    }
    
    function filterUpdate(){
        animalesrows = animales
        if(buscar != ""){
            animalesrows = animalesrows.filter(a=>a.caravana.toLocaleLowerCase().includes(buscar.toLocaleLowerCase()))
            totalAnimalesEncontrados = animalesrows.length
        }
        if(sexobuscar != ""){
            animalesrows = animalesrows.filter(a=>a.sexo == sexobuscar)
            totalAnimalesEncontrados = animalesrows.length
        }
        if(rodeobuscar != ""){
            animalesrows = animalesrows.filter(a=>a.rodeo == rodeobuscar)
            totalAnimalesEncontrados = animalesrows.length
        }
        if(lotebuscar != ""){
            animalesrows = animalesrows.filter(a=>a.lote == lotebuscar)
            totalAnimalesEncontrados = animalesrows.length
        }
        if(estadobuscar != ""){
            animalesrows = animalesrows.filter(a=>a.prenada == estadobuscar)
            totalAnimalesEncontrados = animalesrows.length
        }
        if(categoriabuscar !=""){
            animalesrows = animalesrows.filter(a=>a.categoria == categoriabuscar)
            totalAnimalesEncontrados = animalesrows.length
        }
        if(fallecidobuscar == "vivos"){
            animalesrows = animalesrows.filter(a=>a.active == true)
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
        //let pb_json =  JSON.parse(localStorage.getItem('pocketbase_auth'))
        //usuarioid = pb_json.model.id
        await animaler.init()
        await gruper.init()
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

        observacion = ""
        lote = ""
        rodeo = ""
        nuevoModal.close()
        
    }
    function prepararData(item){
        return {
            CARAVANA:item.caravana,
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
                item.expand.rodeo?
                item.expand.rodeo.nombre:
                "":
                "",
            CATEGORIA:item.categoria,
            ESTADO:item.prenada == 2?"Preñada":item.prenada==1?"Dudosa":"Vacía",
            FALLECIMIENTO:item.fechafallecimiento?new Date(item.fechafallecimiento).toLocaleDateString():""

        }
    }
    //Para el collapse de los filtros
    let isOpenFilter = $state(false)
    function clickFilter(){
        isOpenFilter = !isOpenFilter
    }
</script>
<Navbarr>
    
    <div class="grid grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div class="">
            <h1 class="text-2xl">Animales</h1>  
        </div>
        <div class="hidden flex col-span-2 gap-1 justify-end">
            <div>
                <button class={` btn btn-primary rounded-lg ${estilos.btntext} px-2 mx-1`} data-theme="forest" onclick={()=>openNewModal()}>
                    <span  class="text-lg m-1">Nuevo</span>
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
        {#if isOpenFilter}
                <div transition:slide>
                    <div class="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-10 w-full" >
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
                        <div>
                            <label for = "rodeos" class="label">
                                <span class="label-text text-base">Rodeo</span>
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
                                    bind:value={rodeobuscar}
                                    onchange={filterUpdate}
                                >
                                        <option value="">Todos</option>
                                        {#each rodeos as r}
                                            <option value={r.id}>{r.nombre}</option>    
                                        {/each}
                                  </select>
                            </label>
                        </div>
                        <div>
                            <label for = "lote" class="label">
                                <span class="label-text text-base">Lote</span>
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
                                    bind:value={lotebuscar}
                                    onchange={filterUpdate}
                                >
                                        <option value="">Todos</option>
                                        {#each lotes as s}
                                            <option value={s.id}>{s.nombre}</option>
                                        {/each}
                                  </select>
                            </label>
                        </div>
                        <div>
                            <label for = "categoria" class="label">
                                <span class="label-text text-base">Categoria</span>
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
                                    bind:value={categoriabuscar}
                                    onchange={filterUpdate}
                                >
                                        <option value="">Todos</option>
                                        {#each categorias as s}
                                            <option value={s.id}>{s.nombre}</option>
                                        {/each}
                                  </select>
                            </label>
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
                            <label for = "rodeos" class="label">
                                <span class="label-text text-base">Fallecidos</span>
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
                                    bind:value={fallecidobuscar}
                                    onchange={filterUpdate}
                                >
                                    {#each fallecidos as r}
                                        <option value={r.id}>{r.nombre}</option>    
                                    {/each}
                                  </select>
                            </label>
                        </div>
                    </div>
                </div>
            {/if}
    </div>
   <!-- <div class="grid grid-cols-2 lg:grid-cols-3 m-1 gap-2 lg:gap-10 mb-2 lg:mx-10 w-11/12 lg:w-full" >
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
        <div>
            <label for = "rodeos" class="label">
                <span class="label-text text-base">Rodeo</span>
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
                    bind:value={rodeobuscar}
                    onchange={filterUpdate}
                >
                        <option value="">Todos</option>
                        {#each rodeos as r}
                            <option value={r.id}>{r.nombre}</option>    
                        {/each}
                  </select>
            </label>
        </div>
        <div>
            <label for = "lote" class="label">
                <span class="label-text text-base">Lote</span>
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
                    bind:value={lotebuscar}
                    onchange={filterUpdate}
                >
                        <option value="">Todos</option>
                        {#each lotes as s}
                            <option value={s.id}>{s.nombre}</option>
                        {/each}
                  </select>
            </label>
        </div>
        <div>
            <label for = "categoria" class="label">
                <span class="label-text text-base">Categoria</span>
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
                    bind:value={categoriabuscar}
                    onchange={filterUpdate}
                >
                        <option value="">Todos</option>
                        {#each categorias as s}
                            <option value={s.id}>{s.nombre}</option>
                        {/each}
                  </select>
            </label>
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
            <label for = "rodeos" class="label">
                <span class="label-text text-base">Fallecidos</span>
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
                    bind:value={fallecidobuscar}
                    onchange={filterUpdate}
                >
                    {#each fallecidos as r}
                        <option value={r.id}>{r.nombre}</option>    
                    {/each}
                  </select>
            </label>
        </div>
    </div>

    <div class="grid grid-cols-1 gap-1 lg:grid-cols-3 mb-2 mt-1 mx-1 lg:mx-10 w-11/12" >
        <div >
            <button class={`w-full btn btn-primary rounded-full flex ${estilos.btntext}`} data-theme="forest" onclick={()=>openNewModal()}>
                <span  class="text-xl">Nuevo animal</span>
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
    </div>-->
    <div class="w-full grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
        <table class="table table-lg w-full" >
            <thead>
                <tr >
                    <th class="text-base p-3"  >Animal</th>
                    <th class="text-base p-3"  >Sexo</th>
                    <th class="text-base p-3"  >Categoria</th>
                    <th class="text-base p-3"  >Estado</th>
                    <th class="text-base p-3"  >Lote</th>
                    <th class="text-base p-3"  >Rodeo</th>
                    <!--<th class="text-base"  >Acciones</th>-->
                    
                </tr>
                
            </thead>
            
            <tbody>
                {#each animalesrows as a}
                <tr class=" hover:bg-gray-200 dark:hover:bg-gray-900">
                    <td class="text-base p-3 border-b">
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
                    <td class="text-base p-3 border-b"> {a.sexo}</td>
                    <td class="text-base p-3 border-b"> {a.categoria}</td>
                    <td class="text-base p-3 border-b"> {
                        a.prenada==2?
                        "Preñada":
                        a.prenada==1?
                        "Dudosa":
                        "Vacia"
                    }</td>
                    <td class="text-base p-3 border-b">
                        {
                            a.expand?
                            a.expand.lote?
                            a.expand.lote.nombre
                            :""
                            :""

                        }
                    </td>
                    <td class="text-base p-3 border-b">
                        {
                            a.expand?
                            a.expand.rodeo?
                            a.expand.rodeo.nombre
                            :""
                            :""
                        }
                    </td>
                    <!--<td class="flex gap-2">
                        
                        
                        <div class="tooltip" data-tip="Ver">
                            <button aria-label="Ver"  onclick={()=>getDetail(a.id)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-8">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                  </svg>
                            </button>
                        </div>
                        <div class="tooltip" data-tip="Historia">
                            <button aria-label="Historia"  onclick={()=>goto(`/animales/${a.id}`)}>
                            
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-8">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                </svg>
                            </button>
                        </div>
                        
                          
                    </td>
                    -->

                </tr>
                {/each}
        </table>
    </div>
    <div>
        <h3>Total de animales encontrados: {totalAnimalesEncontrados}</h3>
    </div>
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
                <label for = "rodeo" class="label">
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
                            <!--
                            <textarea style="line-height: 1.3;" 
                                class={`
                                    textarea textarea-bordered h-24
                                    border border-gray-300 rounded-md
                                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                                `} 
                                bind:value={n.observacion} placeholder=""
                            ></textarea>
                            -->
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
    
</Navbarr>
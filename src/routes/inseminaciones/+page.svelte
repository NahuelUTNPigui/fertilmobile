<script>
    import { goto } from '$app/navigation';   
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Exportar from '$lib/components/Exportar.svelte';
    import PocketBase from 'pocketbase'
    import { slide } from 'svelte/transition';
    import Swal from 'sweetalert2';
    import sexos from '$lib/stores/sexos';
    import { onMount } from 'svelte';
    import { createCaber } from '$lib/stores/cab.svelte';
    import { createUserer } from '$lib/stores/user.svelte';
    import tiposanimal from '$lib/stores/tiposanimal';
    import permisos from "$lib/stores/permisos";
    import estilos from '$lib/stores/estilos';
    import { guardarHistorial } from '$lib/historial/lib';
    let ruta = import.meta.env.VITE_RUTA

    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);    
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let caber = createCaber()
    let userer = createUserer()
    let cab = caber.cab
    let usuarioid = userer.userid
    let caravana = $state("")
    let malcaravana = $state(false)
    let sexo = $state("")
    let peso = $state(0)
    // Datos para mostrar
    let inseminaciones = $state([])
    let inseminacionesrow = $state([])
    let buscar = $state("")
    let isOpenFilter = $state(false)
    let totalInseminacionesEncontradas = $state(0)
    //Datos inseminaciones
    let idins = $state("")
    // La inseminacion es a un animal hembra que luego sera un nacimiento
    let padre = $state("")
    let pajuela = $state("")

    //Seria la fecha del parto
    let fechaparto = $state("")
    let madres = $state([])
    let padres = $state([])
    let idanimal = $state("")
    //Datos de la inseminacion
    let categoria = $state("")
    let fechainseminacion = $state("")
    //Filtro de inseminaciones
    let fechainseminacionhasta = $state("")
    let fechainseminaciondesde = $state("")
    let fechapartodesde = $state("")
    let fechapartohasta = $state("")
    let buscarpadre = $state("")
    //Validaciones
    let malanimal = $state(false) 
    let malpadre = $state(false)
    let malfechainseminacion = $state(false)
    let malfechaparto = $state(false)
    let botonhabilitado = $state(false)
    let botonhabilitadoAnimal = $state(false)
    function clickFilter(){
        isOpenFilter = !isOpenFilter
    }
    function isEmpty(str){
        return (!str || str.length === 0 );
    }
    function getNombrePadre(){
        let p = padres.filter(item=>item.id == padre)[0]
        pajuela = p.caravana
        oninput("PADRE")
    }
    function openNewModal(){
        botonhabilitado = false
        malanimal = false
        malpadre = false
        malfechainseminacion = false
        malfechaparto = false
        fechaparto = ""
        fechainseminacion = ""
        padre = ""
        idins = ""
        idanimal = ""
        categoria = ""
        pajuela = ""
        nuevoModal.showModal()
    }

    function openNewAnimal(){
        if(permisos[4]){
            caravana = ""
            sexo = ""
            peso = 0
            botonhabilitadoAnimal = false
            nuevoModal.showModal()
        } else{
            Swal.fire("Sin permisos","No tienes permisos para crear eventos","error")
        }
    }

    function cerrarModal(){
        fechaparto = ""
        padre = ""
        idins = ""
        idanimal = ""
        categoria = ""
        pajuela = ""
        nuevoModal.close()
        
    }
    function openEditModal(id){
        botonhabilitado = true
        malanimal = false
        malpadre = false
        malfechainseminacion = false
        malfechaparto = false
        idins = id
        let inseminacion = inseminaciones.filter(i => i.id == id)[0]
        fechaparto = inseminacion.fechaparto.split(" ")[0]
        padre = inseminacion.padre
        pajuela = inseminacion.pajuela
        categoria = inseminacion.categoria
        fechainseminacion = inseminacion.fechainseminacion.split(" ")[0]
        idanimal = inseminacion.animal
        nuevoModal.showModal()
    }
    async function getAnimales(){
        const recordsa = await pb.collection("animales").getFullList({
            filter:`active=true && cab='${cab.id}'`
        })
        madres = recordsa.filter(a=>a.sexo == "H" || a.sexo == "F")
        padres = recordsa.filter(a=>a.sexo == "M")
    }

    async function getInseminaciones(){
        // you can also fetch all records at once via getFullList
        const records = await pb.collection('inseminacion').getFullList({
            sort: '-fechainseminacion ',
            filter :`cab = '${cab.id}' && active = true`,
            expand:"animal"
        });
        inseminaciones = records
        inseminacionesrow = inseminaciones
    }

    async function guardarAnimal(){
        try{
            let data = {
                caravana,
                active:true,
                delete:false,
                sexo,
                peso,
                cab:cab.id
            }
            let recorda = await pb.collection('animales').create(data)
            Swal.fire("Éxito guardar","Se pudo guardar el animal con exito","success")
            caravana = ""
            sexo = "H"
        }
        catch(e){
            console.error(e)
            Swal.fire("Error guardar","Hubo un error para guardar el animal","error")
        }
        await getAnimales()
    }

    async function guardar(){
        try{
            let m = madres.filter(a=>a.id==idanimal)[0]
            let caravana = m.caravana
            let data = {
                cab:cab.id,
                animal: idanimal,
                fechaparto: fechaparto +' 03:00:00',
                fechainseminacion: fechainseminacion + ' 03:00:00',
                active:true,
                padre,
                pajuela,
                categoria
            }
            
            const record = await pb.collection('inseminacion').create(data);
            await guardarHistorial(pb,madre.id)
            await pb.collection('animales').update(m.id,{prenada:3})
            let item = record
            item.expand ={animal:{caravana}}
            
            inseminaciones.push(item)
            inseminaciones.sort((i1,i2)=>new Date(i1.fechaparto)>new Date(i2.fechaparto)?-1:1)
            
            filterUpdate()

            Swal.fire("Éxito guardar","Se pudo guardar la inseminación con exito","success")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","Hubo un error para guardar la inseminación","error")
        }
    }

    function onSelectAnimal(){
        if (idanimal == "agregar"){
            openNewAnimal()
        } else {
            let a = madres.filter(an=>an.id==idanimal)[0]
            categoria = a.categoria
        }
    }

    async function editar(){
        try {
            let data = {
                fechaparto: fechaparto +' 03:00:00',
                fechainseminacion: fechainseminacion + ' 03:00:00',
                padre,
                pajuela,
                categoria
            }
            const record = await pb.collection('inseminacion').update(idins, data);
            let idx = inseminaciones.findIndex(i=>i.id==idins)
            let a = madres.filter(an=>an.id==idanimal)[0]
            
            inseminaciones[idx]=record
            inseminaciones[idx].expand={animal:a}
            inseminaciones.sort((i1,i2)=>new Date(i1.fechaparto)>new Date(i2.fechaparto)?-1:1)
            
            filterUpdate()
            Swal.fire("Éxito editar","Se pudo editar la inseminación con exito","success")
        }catch(err){
            console.error(err)
            Swal.fire("Error editar","Hubo un error para editar la inseminación","error")
        }
    }
    
    async function eliminar(id){
        Swal.fire({
            title: 'Eliminar inseminación',
            text: '¿Seguro que deseas eliminar la inseminación?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
        }).then(async result=>{
            idins = id
            if(result.value){
                try{
                    let data = {active:false}
                    const record = await pb.collection('inseminacion').update(idins, data);
                    let ins = inseminaciones.filter(i=>i.id == idins)[0]
                    let an = madres.filter(m=>m.id == ins.animal)[0]
                    if(an.prenada == 3){
                        await pb.collection("animales").update(an.id,{prenada:0})
                    }
                    await getInseminaciones()
                    filterUpdate()
                    Swal.fire("Éxito eliminar","Se pudo eliminar la inseminación con exito","success")
                }
                catch(err){
                    console.error(err)
                    Swal.fire("Éxito editar","Se pudo eliminar la inseminación con exito","success")
                }
            }
        })
        
    }
    function filterUpdate(){
        
        inseminacionesrow = inseminaciones
        totalInseminacionesEncontradas = inseminacionesrow.length
        if(buscar !=""){
            inseminacionesrow = inseminacionesrow.filter(i => i.expand.animal.caravana.toLocaleLowerCase().includes(buscar.toLocaleLowerCase()))
            totalInseminacionesEncontradas = inseminacionesrow.length
        }
        if(fechainseminacionhasta!=""){
            inseminacionesrow = inseminacionesrow.filter(i => i.fechainseminacion <= fechainseminacionhasta)
            totalInseminacionesEncontradas = inseminacionesrow.length
        }
        if(fechainseminaciondesde!=""){
            inseminacionesrow = inseminacionesrow.filter(i => i.fechainseminacion >= fechainseminaciondesde)
            totalInseminacionesEncontradas = inseminacionesrow.length
        }
        if(fechainseminacionhasta!=""){
            inseminacionesrow = inseminacionesrow.filter(i => i.fechaparto <= fechapartodesde)
            totalInseminacionesEncontradas = inseminacionesrow.length
        }
        if(fechainseminaciondesde!=""){
            inseminacionesrow = inseminacionesrow.filter(i => i.fechaparto >= fechapartohasta)
            totalInseminacionesEncontradas = inseminacionesrow.length
        }
        if(buscarpadre!=""){
            
            inseminacionesrow = inseminacionesrow.filter(i =>i.pajuela.toLocaleLowerCase().includes(buscarpadre.toLocaleLowerCase()))
            totalInseminacionesEncontradas = inseminacionesrow.length
        }

    }
    onMount(async ()=>{
        await getAnimales()
        await getInseminaciones()
        filterUpdate()
    })

    function validarBoton(){
        botonhabilitado = true
        if(isEmpty(idanimal)){
            botonhabilitado = false
        }
        if(isEmpty(pajuela)){
            botonhabilitado = false
        }
        if(isEmpty(fechainseminacion)){
            botonhabilitado = false
        }
    }

    function validarBotonAnimal(){
        botonhabilitadoAnimal = true
        if(isEmpty(caravana)){
            botonhabilitadoAnimal = false
        }    
    }

    function addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    function oninput(campo){
        validarBoton()
        validarBotonAnimal()
        if(campo == "ANIMAL"){
            if(isEmpty(idanimal)){
                malanimal = true
            }
            else{
                onSelectAnimal()
                malanimal = false
            }
        }

        if(campo == "NOMBRE"){
            if(isEmpty(caravana)){
                malcaravana = true
            }
            else{
                malcaravana = false
            }
        }

        if(campo == "PADRE"){
            if(isEmpty(pajuela)){
                malpadre = true
            }
            else{
                malpadre = false
            }
        }
        if(campo == "FECHAPARTO"){
            if(isEmpty(fechaparto)){
                malfechaparto = true
            }
            else{
                malfechaparto = false
            }
        }
        if(campo == "FECHAINSEMINACION"){
            if(isEmpty(fechainseminacion)){
                malfechainseminacion = true
            }
            else{
                malfechainseminacion = false
                fechaparto = addDays(fechainseminacion, 280).toISOString().split("T")[0]
            }
        }
    }
    function prepararData(item){
        return {
            ANIMAL:item.expand.animal.caravana,
            PAJUELA:item.pajuela,
            FECHAPARTO:new Date(item.fechaparto).toLocaleDateString(),
            FECHAINSEMINACION: new Date(item.fechainseminacion).toLocaleDateString()
        }
    }

    
</script>
<Navbarr>
    <div class="grid grid-cols-1 lg:grid-cols-3 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <h1 class="text-2xl">Inseminaciones</h1>
        </div>
        <div class="flex col-span-2 gap-1 justify-start lg:justify-end">
            <div>
                <button class={`btn btn-primary rounded-lg ${estilos.btntext}`} data-theme="forest" onclick={()=>goto("/inseminaciones/movimiento")}>
                    <span  class="text-lg">Nuevas</span>
                </button>
            </div>
            <div>
                <Exportar
                    titulo={"Inseminaciones"}
                    filtros={[]}
                    confiltros={false}
                    data = {inseminacionesrow}
                    {prepararData}
                />
            </div>
            <div class="hidden">
                <button
                    onclick={()=>goto("/inseminaciones/movimiento")}
                    class={`
                        bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                        ${estilos.btnsecondary}
                        rounded-full
                        px-4 pt-2 pb-3
                    `} 
                    aria-label="Exportar"
                >
                    <span  class="text-xl font-semibold ">Múltiples</span>
                    
                </button>
            </div>
            
        </div>
    </div>
    <div class="grid grid-cols-1 m-1 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10 w-11/12" >
        <div class="w-full lg:w-1/2">
            <label 
                class={`
                    input 
                    input-bordered 
                    flex 
                    items-center gap-2
                    ${estilos.bgdark2}
                `}
            >
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
                <h1 class="font-semibold text-lg py-2">Filtros</h1>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class={`h-5 w-5 transition-all duration-300 ${isOpenFilter? 'transform rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>  
        </button>
        <div>
            <span class = "text-lg mx-1">Total de inseminaciones encontradas: {totalInseminacionesEncontradas}</span>
        </div>
        {#if isOpenFilter}
            <div transition:slide>
                <div class="grid grid-cols-2 lg:grid-cols-4" >
                    <div class="">
                        <label class="block tracking-wide text-base font-medium mb-2" for="grid-first-name">
                          Inseminacion desde
                        </label>
                        <input id ="fechainseminaciondesde" type="date"  
                            class={`
                                input input-bordered
                                ${estilos.bgdark2}
                            `} 
                            bind:value={fechainseminaciondesde} onchange={filterUpdate}
                        />
                    </div>
                    <div class="">
                        <label class="block tracking-wide text-base font-medium mb-2" for="grid-first-name">
                            Inseminacion hasta
                        </label>
                        <input id ="fechainseminacionhasta" type="date"  
                              class={`
                                  input input-bordered
                                  ${estilos.bgdark2}
                              `} 
                              bind:value={fechainseminacionhasta} onchange={filterUpdate}
                        />
                    </div>
                    <div class="">
                        <label class="block tracking-wide text-base font-medium mb-2" for="grid-first-name">
                          Parto desde
                        </label>
                        <input id ="fechainseminaciondesde" type="date"  
                            class={`
                                input input-bordered
                                ${estilos.bgdark2}
                            `} 
                            bind:value={fechapartodesde} onchange={filterUpdate}
                        />
                    </div>
                    <div class="">
                        <label class="block tracking-wide text-base font-medium mb-2" for="grid-first-name">
                            Parto hasta
                        </label>
                        <input id ="fechainseminacionhasta" type="date"  
                              class={`
                                  input input-bordered
                                  ${estilos.bgdark2}
                              `} 
                              bind:value={fechapartohasta} onchange={filterUpdate}
                        />
                    </div>
                    <div>
                        <label for = "nombrepadre" class="label">
                            <span class="label-text text-base">Pajuela</span>
                        </label>
                        <label class="input-group">
                            <input 
                                id ="nombrepadre" 
                                type="text"  
                                class={`
                                    input 
                                    input-bordered 
                                    border border-gray-300 rounded-md
                                    focus:outline-none 
                                    focus:ring-2 focus:ring-green-500 
                                    focus:border-green-500
                                    w-full 
                                    ${estilos.bgdark2} 
                                `}
                                bind:value={buscarpadre}
                                oninput={filterUpdate}
                            />
                        </label>
                    </div>
                    
                </div>
            </div>
        {/if}
    </div>
    <div class="w-full grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
        <table class="table table-lg w-full" >
            <thead>
                <tr>
                    <th class="text-base ml-3 pl-3 mr-1 pr-1 border-b dark:border-gray-600">Fecha inseminacion</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Fecha Parto</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Caravana</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Categoria</th>
                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Pajuela</th>
                </tr>
            </thead>
            <tbody>
                {#each inseminacionesrow as i}
                <tr class="hover:bg-gray-200 dark:hover:bg-gray-900" onclick={()=>openEditModal(i.id)}>
                    <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(i.fechainseminacion).toLocaleDateString()}</td>
                    <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(i.fechaparto).toLocaleDateString()}</td>
                    <td class="text-base mx-1 px-1 ">
                        {`${i.expand.animal.caravana}`}
                    </td>
                    <td class="text-base mx-1 px-1 ">
                        {`${i.categoria}`}
                    </td>
                    <td class="text-base mx-1 px-1 ">
                        {`${i.pajuela}`}
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
    
</Navbarr>
<dialog id="nuevoModal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div class="
            modal-box w-11/12 max-w-xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        {#if idins == ""}
            <h3 class="text-lg font-bold">Nueva inseminación</h3>  
        {:else}
            <h3 class="text-lg font-bold">Ver inseminación</h3>  
        {/if}
        <div class="form-control">
            <label for = "nombre" class="label">
                <span class="label-text text-base">Caravana</span>
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
                    bind:value={idanimal}
                    onchange={()=>oninput("ANIMAL")}
                >
                    <option value="agregar">Agregar</option>
                    {#each madres as m}
                        <option value={m.id}>{m.caravana}</option>    
                    {/each}
                </select>
                {#if malanimal}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar el animal</span>                    
                    </div>
                {/if}
            </label>
            {#if idanimal == "agregar"}
                <form method="dialog">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
                </form>
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
                <div class="modal-action justify-start ">
                    <form method="dialog" >
                        <button class="btn btn-success text-white" disabled='{!botonhabilitadoAnimal}' onclick={guardarAnimal} >Guardar Animal</button>
                    </form>
                </div>
            {/if}
            <label for = "tipo" class="label">
                <span class="label-text text-base">Categoria</span>
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
                    bind:value={categoria}
                >
                    {#each tiposanimal as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                  </select>
            </label>
            <label for = "nombrepadre" class="label">
                <span class="label-text text-base">Pajuela</span>
            </label>
            <label class="input-group">
                <input 
                    id ="nombrepadre" 
                    type="text"  
                    class={`
                        input 
                        input-bordered 
                        border border-gray-300 rounded-md
                        focus:outline-none 
                        focus:ring-2 focus:ring-green-500 
                        focus:border-green-500
                        w-full 
                        ${estilos.bgdark2} 
                    `}
                    bind:value={pajuela}
                    oninput={()=>oninput("PADRE")}
                />
                {#if malpadre}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe escribir el nombre del padre</span>                    
                    </div>
                {/if}
            </label>
            <label for = "padre" class="label">
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
                    onchange={getNombrePadre}
                >
                    {#each padres as p}
                        <option value={p.id}>{p.caravana}</option>    
                    {/each}
                  </select>
            </label>
            <label for = "fechainseminacion" class="label">
                <span class="label-text text-base">Fecha de inseminacion</span>
            </label>
            <label class="input-group ">
                <input id ="fechainseminacion" type="date" 
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={fechainseminacion}
                    onchange={()=>oninput("FECHAINSEMINACION")}
                />
                {#if malfechainseminacion}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar la fecha de inseminacion</span>                    
                    </div>
                {/if}
            </label>
            <label for = "fechaparto" class="label">
                <span class="label-text text-base">Fecha estimada de parto</span>
            </label>
            <label class="input-group ">
                <input disabled id="fechaparto" type="date" 
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={fechaparto}
                    onchange={()=>oninput("FECHAPARTO")}
                />
                {#if malfechaparto}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar la fecha aproximada de parto</span>                    
                    </div>
                {/if}
            </label>
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
                <!-- if there is a button, it will close the modal -->
                {#if idins == ""}
                    <button class="btn btn-success text-white" disabled='{!botonhabilitado}' onclick={guardar} >Guardar</button>
                {:else}
                    <button class="btn btn-success text-white" disabled='{!botonhabilitado}' onclick={editar} >Editar</button>
                    <button class="btn btn-error text-white" onclick={()=>eliminar(idins)}>Eliminar</button>
                {/if}
                <button class="btn btn-neutral " onclick={cerrarModal}>Cerrar</button>
            </form>
        </div>
    </div>
</dialog>
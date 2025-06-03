<script>
    import {addDays} from "$lib/stringutil/lib"
    import AgregarAnimal from '$lib/components/eventos/AgregarAnimal.svelte';
    import estilos from '$lib/stores/estilos';
    import RadioButton from '$lib/components/RadioButton.svelte';
    import tipostacto from '$lib/stores/tipostacto';
    import estados from "$lib/stores/estados";
    import tiposanimal from '$lib/stores/tiposanimal';
    import {isEmpty} from "$lib/stringutil/lib"
    import PredictSelect from '$lib/components/PredictSelect.svelte';
    import MultipleToros from '$lib/components/MultipleToros.svelte';
    import categorias from '$lib/stores/categorias';
    
    let {
        caravana=$bindable(""),
        peso=$bindable(""),
        sexo=$bindable(""),
        fechanacimiento=$bindable(""),
        categoria=$bindable(""),
        agregaranimal=$bindable(false),


        servicio = $bindable({}),
        inseminacion = $bindable({}),
        esServicio = $bindable(true) ,
        padres =  $bindable([]),
        listapadres  = $bindable([]),
        madres =  $bindable([]),
        animales,
        cargadoanimales = $bindable(false),
        guardarServicio,
        guardarInseminacion

    } = $props()

    let options = [
        {id:true,nombre:"Servicio"},
        {id:false,nombre:"Inseminación"}
    ]

    function select(id){  
        esServicio = id
    }
    const HOY = new Date().toISOString().split("T")[0]

    
    function validarBotonIns(){
        inseminacion.botonhabilitadoins = true
        if(!agregaranimal && isEmpty(inseminacion.idanimalins)){
            inseminacion.botonhabilitadoins = false
        }
        if(isEmpty(inseminacion.pajuelains)){
            inseminacion.botonhabilitadoins = false
        }
        if(isEmpty(inseminacion.fechainseminacion)){
            inseminacion.botonhabilitadoins = false
        }
    
    }
    function validarBotonSer(){
        servicio.botonhabilitadoser = true
        if(servicio.fechadesdeserv==""){
            servicio.botonhabilitadoser = false
        }
        if(servicio.idanimalser==""){
            servicio.botonhabilitadoser = false
        }
    }

    function onSelectAnimalIns(){
        let a = madres.filter(an=>an.id==inseminacion.idanimalins)[0]
        if(a){
            inseminacion.categoriains = a.categoria
        }
        else{
            inseminacion.categoriains = ""
        }
        
    }
    function onSelectAnimalSer(){
        let a = madres.filter(an=>an.id==servicio.idanimalser)[0]
        if(a){
            servicio.categoriaser = a.categoria
        }
        else{
            servicio.categoriaser = ""
        }
        
    }
    function onSelectPadreIns(){
        let p = padres.filter(item=>item.id == inseminacion.padreins)[0]
        inseminacion.pajuelains = p.caravana
    }

    function oninputIns(campo){
        validarBotonIns()
        if(!agregaranimal && campo == "ANIMAL"){
            if(isEmpty(inseminacion.idanimalins)){
                inseminacion.malanimalins = true
            }
            else{
                onSelectAnimalIns()
                inseminacion.malanimalins = false
            }
        }
        if(campo == "PADRE"){
            if(isEmpty(inseminacion.padreins)){
                inseminacion.malpadreins = true
            }
            else{
                onSelectPadreIns()
                inseminacion.malpadreins = false
            }
        }
        if(campo == "FECHAPARTO"){
            if(isEmpty(inseminacion.fechapartoins)){
                inseminacion.malfechapartoins = true
            }
            else{
                inseminacion.malfechapartoins = false
            }
        }
        if(campo == "FECHAINSEMINACION"){
            if(isEmpty(inseminacion.fechainseminacion)){
                inseminacion.malfechainseminacion = true
            }
            else{
                inseminacion.malfechainseminacion = false
                inseminacion.fechapartoins = addDays(inseminacion.fechainseminacion, 280).toISOString().split("T")[0]
            }
        }
    }
    function oninputSer(campo){
        validarBotonSer()
        if(campo == "ANIMAL"){
            if(servicio.idanimalser==""){
                servicio.malanimalser = true
            }
            else{
                servicio.malanimalser = false
                onSelectAnimalSer()
            }
        }
        if(campo == "DESDE"){
            if(servicio.fechadesdeserv == ""){
                servicio.malfechadesdeser = true
            }
            else{
                servicio.malfechadesdeser = false
                servicio.fechapartoser = addDays(servicio.fechadesdeserv, 280).toISOString().split("T")[0]
            }
        }
    }
</script>
<div class="bg-transparent grid grid-cols-2 lg:grid-cols-3 lg:grid-cols-4 ">
    {#each options as op}
        <button id={op.id} onclick={()=>select(op.id)}
            class={`
                flex-1 m-1 py-2 px-2 rounded-lg font-medium text-sm transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                ${esServicio==op.id?
                    "bg-green-600 text-white shadow-lg transform scale-105":
                    "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-gray-700 dark:text-green-300 dark:hover:bg-gray-600"
                }
            `}>
                {op.nombre}
        </button>
        
    {/each}
</div>
{#if esServicio}
    <div class="form-control">
        <AgregarAnimal bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento/>
        {#if !agregaranimal}
            <label for = "animal" class="label">
                <span class="label-text text-base">Animal</span>
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
                    bind:value={servicio.idanimalser}
                    onchange={()=>oninputSer("ANIMAL")}
                >   
                    {#each madres as a}
                        <option value={a.id}>{a.caravana}</option>    
                    {/each}
                </select>
                {#if servicio.malanimalser}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar el animal</span>                    
                    </div>
                {/if}
            </label>
            <label for = "categoria" class="label">
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
                    bind:value={servicio.categoriaser}
                >
                    {#each categorias as c}
                        <option value={c.id}>{c.nombre}</option>    
                    {/each}
                </select>
            </label>
        {/if}
        <div >
            <label for = "toros" class="label">
                <span class="label-text text-base">Toros</span>
            </label>
            <label class="input-group ">
                {#if cargadoanimales}
                    <MultipleToros toros={padres} bind:valor={servicio.padreser} bind:listavalores={servicio.padreserlista} />
                {/if}
            </label>
        </div>
        <div>
            <label for = "fechadesde" class="label">
                <span class="label-text text-base">Fecha desde</span>
            </label>
            <label class="input-group ">
                <input id ="fechadesde" type="date"   
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={servicio.fechadesdeserv}
                    onchange={()=>oninputSer("DESDE")}
                />
                {#if servicio.malfechadesdeser}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar la fecha inicial del servicio</span>                    
                    </div>
                {/if}
            </label>
        </div>
        <div>
            <label for = "fechahasta" class="label">
                <span class="label-text text-base">Fecha hasta</span>
            </label>
            <label class="input-group ">
                <input id ="fechahasta" type="date"   
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={servicio.fechahastaserv}
                />
            </label>
        </div>
        <div>
            <label for = "fechaparto" class="label">
                <span class="label-text text-base">Fecha parto</span>
            </label>
            <label class="input-group ">
                <input id ="fechaparto" type="date"   
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={servicio.fechapartoser}
                    
                />
                
            </label>

        </div>
        
        <div >
            <label for = "observacion" class="label">
                <span class="label-text text-base">Observación</span>
            </label>
            <input 
                id ="obs" 
                type="text"  
                class={`
                    input 
                    input-bordered 
                    border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                    w-full
                    ${estilos.bgdark2}
                `}
                bind:value={servicio.observacionser}
                
            />
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
                <!-- if there is a button, it will close the modal -->
                <button class="btn btn-success text-white" disabled='{!servicio.botonhabilitadoser}' onclick={guardarServicio} >Guardar</button>
            </form>
        </div>
        
    </div>
{:else}
    <div class="form-control">
        <AgregarAnimal bind:agregaranimal bind:caravana bind:categoria bind:sexo bind:peso bind:fechanacimiento/>
        {#if !agregaranimal}
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
                    bind:value={inseminacion.idanimalins}
                    onchange={()=>oninputIns("ANIMAL")}
                >
                    {#each madres as m}
                        <option value={m.id}>{m.caravana}</option>    
                    {/each}
                </select>
                {#if inseminacion.malanimalins}
                    <div class="label">
                        <span class="label-text-alt text-red-500">Debe seleccionar el animal</span>                    
                    </div>
                {/if}

            </label>
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
                    disabled
                    bind:value={inseminacion.categoriains}
                >
                    {#each tiposanimal as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                </select>
            </label>
        {/if}
        {#if cargadoanimales}
            <PredictSelect bind:valor={inseminacion.padreins} etiqueta = {"Padre"} bind:cadena={inseminacion.pajuelains} lista = {listapadres}/>
        {/if}
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
                bind:value={inseminacion.fechainseminacion}
                onchange={()=>oninputIns("FECHAINSEMINACION")}
            />
            {#if inseminacion.malfechainseminacion}
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
                bind:value={inseminacion.fechapartoins}
                onchange={()=>oninputIns("FECHAPARTO")}
            />
            {#if inseminacion.malfechapartoins}
                <div class="label">
                    <span class="label-text-alt text-red-500">Debe seleccionar la fecha aproximada de parto</span>                    
                </div>
            {/if}
        </label>
        <label for = "observacion" class="label">
            <span class="label-text text-base">Observación</span>
        </label>
        <input 
            id ="obs" 
            type="text"  
            class={`
                input 
                input-bordered 
                border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                w-full
                ${estilos.bgdark2}
            `}
            bind:value={inseminacion.observacion}
            
        />
    </div>
    <div class="modal-action justify-start ">
        <form method="dialog" >
            <!--<button class="btn btn-success text-white" disabled='{!inseminacion.botonhabilitadoins}' onclick={guardarInseminacion} >Guardar</button>-->
            <button class="btn btn-success text-white"  onclick={guardarInseminacion} >Guardar</button>
            
        </form>
    </div>
{/if}
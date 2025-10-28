<script>
    import estilos from "$lib/stores/estilos";
    import Animalesmodal from "./Animalesmodal.svelte";
    
    let {
        //binds
        nuevacategoria = $bindable(""),
        nuevolote = $bindable(""),
        nuevorodeo = $bindable(""),
        tipotratamiento = $bindable(""),
        fecha = $bindable(""),
        motivo = $bindable(""),
        fechabaja = $bindable(""),
        codigo = $bindable(""),
        malcodigo = $bindable(false),
        listaanimales = $bindable([]),
        //Constantes
        categorias,
        lotes,
        rodeos,
        tipos,
        HOY,

        //function
        oninput,
        onChangeCollapse
    }=$props()
</script>
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
                    <span class="label-text text-base">RENSPA</span>
                </label>
                <input id ="codigo" type="text"  
                    class={`input input-bordered w-full ${estilos.bgdark2}`}
                    bind:value={codigo}
                    oninput={()=>oninput("CODIGO")}
                />
                {#if malcodigo}
                    <div class="label">
                        <span class="label-text-alt text-red-500">No existe un establecimiento con ese RENSPA</span>                    
                    </div>
                {/if}
            </div>
        </div>
    </div>  

</div>

<div >
    <Animalesmodal
        bind:listaanimales
    />
</div>

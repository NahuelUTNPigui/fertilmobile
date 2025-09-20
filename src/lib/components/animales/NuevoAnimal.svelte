<script>
    import estilos from "$lib/stores/estilos";
    import sexos from "$lib/stores/sexos";
    import estados from "$lib/stores/estados";
    import categorias from "$lib/stores/categorias";
    import RadioButton from "../RadioButton.svelte";
    import PredictSelect from '$lib/components/PredictSelect.svelte';
    import {isEmpty} from "$lib/stringutil/lib"
    import { loger } from "$lib/stores/logs/logs.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    const HOY = new Date().toISOString().split("T")[0]    
    let {
        lotes,
        rodeos,
        oninput,
        onSelectPadre,
        cabid,
        madres = $bindable([]),
        padres= $bindable([]),
        caravana = $bindable(""),
        malcaravana= $bindable(false),
        rp= $bindable(""),
        sexo= $bindable(""),
        peso= $bindable(""),
        prenada=$bindable(0),
        categoria= $bindable(""),
        rodeo= $bindable(""),
        lote= $bindable(""),
        fechanacimiento= $bindable(""),
        idanimal = $bindable(""),
        conparicion = $bindable(false),
        nombremadre = $bindable(""),
        madre = $bindable(""),
        nombrepadre = $bindable(""),
        padre = $bindable(""),
        observacion = $bindable(""),
        nacimiento = $bindable(""),
        animal = $bindable(null)
    } = $props()
     
</script>
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
            {#each rodeos.filter(r=>r.active && r.cab == cabid) as r}
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
            {#each lotes.filter(l=>l.active && l.cab == cabid) as r}
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
        <div class="hidden">
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
        </div>
        <PredictSelect 
            bind:valor={madre} 
            etiqueta = {"Madre"} 
            bind:cadena={nombremadre} 
            lista = {madres} 
            
        >    
        </PredictSelect>
        <div class="hidden">
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
        </div>
        <PredictSelect 
            bind:valor={padre} 
            etiqueta = {"Padre"} 
            bind:cadena={nombrepadre} 
            lista = {padres} 
            
        >
        </PredictSelect>
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

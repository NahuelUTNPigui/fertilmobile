<script>
    import estilos from "$lib/stores/estilos";
    import sexos from "$lib/stores/sexos";
    import categorias from "$lib/stores/categorias";
    let {
        caravana=$bindable(""),
        peso=$bindable(""),
        sexo=$bindable(""),
        fechanacimiento=$bindable(""),
        categoria=$bindable(""),
        agregaranimal=$bindable(false),
        confechanac =  $bindable(false)
    } = $props()
    let malcaravana = $state(false)
    function onChangeAgregar(){
        
        if(caravana == ""){
            malcaravana = true
        }
        else{
            malcaravana = false
        }
    }
</script>
{#if agregaranimal}
    <dir class="flex justify-start mx-0 px-0">
        <button 
            class={`${estilos.basico} ${estilos.chico} ${estilos.danger}`} 
            onclick={()=>agregaranimal = false}
        >Cancelar</button>
    </dir>
    
    <div class="grid grid-cols-1 gap-1">
        <div class="mb-1 lg:mb-0">
            <label for = "caravana" class="label">
                <span class="label-text text-base">Caravana</span>
            </label>
            <label class="input-group">
                <input id ="caravana" type="text"  
                    class={`input input-bordered w-full ${estilos.bgdark2}`}
                    bind:value={caravana}
                    oninput={onChangeAgregar}
                />
                
            </label>
            {#if malcaravana}
                <div class="label">
                    <span class="label-text-alt text-red-500">Debe escribir la caravana</span>                    
                </div>

            {/if}
        </div>
        <div class="mb-1 lg:mb-0">
            <label for = "categoria" class="label">
                <span class="label-text text-base">Categoria</span>
            </label>
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2}
                    `} bind:value={categoria}>
                    {#each categorias as l}
                        <option value={l.id}>{l.nombre}</option>    
                    {/each}
                </select>
            </label>
        </div>
        <div class="mb-1 lg:mb-0">
            <label for = "peso" class="label">
                <span class="label-text text-base">Peso(KG)</span>
            </label>
            <label class="input-group">
                <input id ="peso" type="number"  
                    class={`input input-bordered w-full ${estilos.bgdark2}`}
                    bind:value={peso}
                    
                />
                
            </label>
        </div>
        <div class="mb-1 lg:mb-0">
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
        </div>
        {#if !confechanac}
            <div class="mb-1 lg:mb-0">
                <label for = "fechanacimiento" class="label">
                    <span class="label-text text-base">Fecha nacimiento</span>
                </label>
                <input id ="fechanacimiento" type="date" 
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={fechanacimiento}
                />
            </div>
        {/if}
    </div>
{:else}
    <dir class="flex justify-start mx-0 px-0">
        <button 
        class={`${estilos.basico} ${estilos.chico} ${estilos.primario}`} 
            onclick={()=>agregaranimal = true}
        >Nuevo animal</button>
    </dir>
    
{/if}
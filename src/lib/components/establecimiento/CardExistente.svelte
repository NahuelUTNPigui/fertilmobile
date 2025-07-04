<script>
    import CardBase from "../CardBase.svelte";
    import Colaboradores from "./Colaboradores.svelte";
    import ListaColabs from "./ListaColabs.svelte";
    import estilos from "$lib/stores/estilos";

    let {
        nombre = $bindable(""),
        renspa = $bindable(""),
        direccion = $bindable(""),
        contacto = $bindable(""),
        telefono = $bindable(""),
        mail = $bindable(""),
        codigo = $bindable(""),
        modoedicion = $bindable(false),
        provincia = $bindable(""),
        localidad = $bindable(""),
        colabs = $bindable([]),
        localidadesProv  = $bindable([]),
        coninternet=$bindable({}),
        db=$bindable(null),
        provincias ,
        mostrarcolab,
        guardarColab,
        asociado,
        desasociar,
        cabid,
        cab,
        getNombreProvincia,
        getNombreLocalidad,
        getLocalidades,
        reestablercerCabaña,
        editarCabaña
    } = $props()

</script>
<CardBase titulo={`Bienvenido a ${nombre}`} cardsize="max-w-5xl">
    <div class="space-y-6">
        <div>
            <label for="RENSPA" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
            >
                RENSPA:
            </label>
            {#if !modoedicion}
                <label for="renspa" 
                    class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    {renspa}
                </label>
            {:else}
                <label class="form-control">
                    <input 
                        type="text" 
                        id="renspa"
                        bind:value={renspa}
                        
                        required 
                        class={`
                            w-full px-3 py-2 border rounded-md shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                            transition duration-150 ease-in-out
                            border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        `}
                    />
                    <div class="label">
                        <span class="label-text-alt">Formato: 00.000.0.00000.00</span>
                        
                    </div>
                </label>
                
            {/if}
        </div>
        <div>
            <label for="nombre" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
            >
                Nombre:
            </label>
            {#if !modoedicion}
                <label for="nombre" 
                    class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    {nombre}
                </label>
            {:else}
                <input 
                    type="text" 
                    id="nombre"
                    bind:value={nombre} 
                    required 
                    class={`
                        w-full px-3 py-2 border rounded-md shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        transition duration-150 ease-in-out
                        border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    `}
                />
            {/if}
        </div>
        <div>
            <label for="Provincia" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
            >
                Provincia:
            </label>
            {#if !modoedicion}
                <label for="Provincia" 
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    {getNombreProvincia(provincia)}
                </label>
            {:else}
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
                        bind:value={provincia}
                        onchange={()=>getLocalidades(provincia)}
                    >
                            <option value="" class="rounded"></option>
                            {#each provincias as p}
                                <option value={p.id} class="rounded">{p.nombre}</option>
                            {/each}
                    </select>
                </label>
            {/if}
        </div>
        <div>
            <label for="Localidad" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
            >
                Localidad:
            </label>
            {#if !modoedicion}
                <label for="Provincia" 
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    {getNombreLocalidad(localidad)}
                </label>
            {:else}
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
                        bind:value={localidad}
                        
                    >
                            <option value="" class="rounded"></option>
                            {#each localidadesProv as l}
                                <option value={l.nombre} class="rounded">{l.nombre}</option>
                            {/each}
                    </select>
                </label>
            {/if}
        </div>
        <div>
            <label for="direccion" 
                class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
                Dirección
            </label>
            {#if !modoedicion}
                <label for="direccion" 
                    class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    {direccion}
                </label>
            {:else}
                <input 
                    type="text" 
                    id="direccion"
                    disabled={!modoedicion}
                    bind:value={direccion} 
                    required 
                    class={`
                        w-full px-3 py-2 border rounded-md shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        transition duration-150 ease-in-out
                        ${
                        modoedicion
                            ? 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }
                    `}
                />
            {/if}
        </div>
        <div>
            <label for="contacto" 
                class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
                Contacto
            </label>
            {#if !modoedicion}
                <label for="contacto" 
                    class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    {contacto}
                </label>
            {:else}
                <input 
                    type="text" 
                    id="contacto"
                    disabled={!modoedicion}
                    bind:value={contacto} 
                    required 
                    class={`
                        w-full px-3 py-2 border rounded-md shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        transition duration-150 ease-in-out
                        ${
                        modoedicion
                            ? 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }
                    `}
                />
            {/if}
            
        </div>
        <div>
            <label for="Teléfono" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
            >
                Teléfono:
            </label>
            {#if !modoedicion}
                <label for="Teléfono" 
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    {telefono}
                </label>
            {:else}
                <input 
                    type="text" 
                    id="telefono"
                    
                    bind:value={telefono} 
                    required 
                    class={`
                        w-full px-3 py-2 border rounded-md shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        transition duration-150 ease-in-out
                        ${
                        modoedicion
                            ? 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }
                    `}
                />
            {/if}
        </div>
        <div>
            <label for="Correo" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
            >
                Correo:
            </label>
            {#if !modoedicion}
                <label for="Correo" 
                    class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    {mail}
                </label>
            {:else}
                <input 
                    type="text" 
                    id="mail"
                    
                    bind:value={mail} 
                    required 
                    class={`
                        w-full px-3 py-2 border rounded-md shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        transition duration-150 ease-in-out
                        ${
                        modoedicion
                            ? 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }
                    `}
                />
            {/if}
        </div>
        <div>
            <label for="codigo" 
                class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
                Codigo de transferencia
            </label>
            <label for="codigo" 
                    class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                >
                    {codigo}
                </label>
        </div>
    </div>
    <div class="mt-8 flex justify-end">
        {#if  !modoedicion}
            <button
                onclick={()=>modoedicion=true}
                class=" 
                    btn px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md 
                    text-white font-bold font-lg focus:outline-none 
                    focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                "
            >
                Editar establecimiento
            </button>    
        {:else}
            <button 
                onclick={()=>{reestablercerCabaña();modoedicion=false;}}
                class="
                    btn btn-error 
                    text-white 
                    font-bold font-lg
                "
            >
                Cancelar
            </button>   
            <button
                onclick={
                    async ()=>{
                        modoedicion=false;
                        await editarCabaña();
                    }
                }
                class="btn px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-bold font-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
                Guardar
            </button>    
        {/if}
        
    </div>
    <Colaboradores bind:colabs bind:coninternet {mostrarcolab} {guardarColab} {desasociar} {asociado} cabid={cabid} {cab} />
    <ListaColabs bind:colabs={colabs} {cabid} bind:db/>
</CardBase>

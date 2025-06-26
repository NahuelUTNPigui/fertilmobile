<script>
    import CardBase from '$lib/components/CardBase.svelte';
    let {
        nombre = $bindable(""),
        direccion = $bindable(""),
        contacto = $bindable(""),
        guardarCabaña
    } = $props()
</script>
<CardBase titulo="Registra tu establecimiento">
    <div class="space-y-4">
        
        <div>
            <label for="nombre" 
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
                Nombre
            </label>
            <input 
                type="nombre" 
                id="nombre"
                
                bind:value={nombre} 
                required 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
        </div>
        <div>
            <label for="direccion" 
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
                Dirección
            </label>
            <input 
                type="direccion" 
                id="direccion"
                
                bind:value={direccion} 
                required 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
        </div>
        <div>
            <label for="contacto" 
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
                Contacto
            </label>
            <input 
                type="contacto" 
                id="contacto"
                
                bind:value={contacto} 
                required 
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
        </div>
    </div>
    <div class="mt-8 flex justify-end">
        <button
            onclick={guardarCabaña}
            class="
                btn px-6 py-2 
                bg-green-600 hover:bg-green-700 
                rounded-md text-white font-bold text-lg 
                focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-green-500
            "
        >
          Guardar 
        </button>
    </div>
</CardBase>
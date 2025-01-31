<script>
    
    let {nombre,direccion,contacto,id,transferir} = $props()
    
</script>
<div 
  class="
    w-full overflow-hidden transition-all duration-300 
    hover:bg-gray-800 border-b 
    border-gray-200
    dark:border-gray-700 
    last:border-b-0
  ">
  <div 
    class="
      p-4 bg-white dark:bg-gray-900 flex items-center 
      justify-between">
    <div>
      <h2 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{nombre}</h2>
      <div class="flex justify-start  text-sm text-gray-600 dark:text-gray-400 gap-3">
        <p>Direccion: {direccion}</p>
        <p>Contacto: +{contacto}</p>
      </div>
    </div>
    <button
      onclick={()=>transferir(id)}
      class="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
    >
      Transferir
    </button>
  </div>
</div>
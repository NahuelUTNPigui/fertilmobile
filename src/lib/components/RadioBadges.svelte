<script>
    let {valor = $bindable(0),opciones} = $props()
    function select(id){
        valor = id
    }
</script>
<div class="overflow-x-auto pb-2">
    <div class="flex space-x-2 min-w-max">
        {#each opciones as op}
            <button
                onclick={()=>select(op.id)}
                class={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ease-in-out ${
                    valor === op.id
                      ? "bg-green-500 text-white dark:bg-green-600 dark:text-gray-100"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
            >
                {op.nombre}
            </button>
        {/each}
    </div>
</div>
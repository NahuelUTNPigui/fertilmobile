<script>
    import { loger } from "$lib/stores/logs/logs.svelte";
    
     
    //1 todos,2 logs,3 errores
    let show=$state(1)
    let options = [
        {id:1,nombre:"Todos"},
        {id:2,nombre:"Logs"},
        {id:3,nombre:"Errores"},
        {id:4,nombre:"Lineas"}

    ]
    function select(id){   
        show = id
    }
    function limpiarLoges(){
        loger.cleanLog()
    }
    function limpiarErrores(){
        loger.cleanErrores()
    }
    function limpiarLineas(){
        loger.cleanErrores()
    }
</script>
<div class="dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 h-full max-h-3/4">
    <h1 class="text-xl">Logs - {loger.loges.length}</h1>
    <h1 class="text-xl">Errores - {loger.errores.length}</h1>
    <h1 class="text-xl">LIneas - {loger.lineas.length}</h1>
    
    <div class="bg-transparent grid grid-cols-2 ">
        {#each options as op}
            
            <button id={op.id} onclick={()=>select(op.id)} 
                class={`
                    flex-1 m-1 py-2 px-2 rounded-lg font-medium text-sm transition-all duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                    ${show==op.id?
                        "bg-green-600 text-white shadow-lg transform scale-105":
                        "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-gray-700 dark:text-green-300 dark:hover:bg-gray-600"
                    }
                `}>
                    {op.nombre}
            </button>
            
        {/each}
    </div>
    <div class="bg-transparent grid grid-cols-2 lg:grid-cols-4 max">
        <button onclick={limpiarLoges} 
            class={`
                flex-1 m-1 py-2 px-2 rounded-lg font-medium text-lg transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500

            `}>
                Limpiar loges
        </button>
        <button onclick={limpiarErrores} 
            class={`
                flex-1 m-1 py-2 px-2 rounded-lg font-medium text-sm transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500

            `}>
                Limpiar Errores
        </button>
        <button onclick={limpiarLineas} 
            class={`
                flex-1 m-1 py-2 px-2 rounded-lg font-medium text-sm transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500

            `}>
                Limpiar linea
        </button>
    </div>
    {#if show==1}
        {#each loger.loges as lo}
            <div class="text-lime-500">
                {lo.time}-
                {lo.text}
            </div>
            <br>
        {/each}
        {#each loger.errores as lo}
            <div class="text-red-500">
                {lo.time}-
                {lo.text}
            </div>
            <br>
        {/each}
        
    {:else if show==2}
        {#each loger.loges as lo}
            <div class="text-lime-500">
                {lo.time}-
                {lo.text}
            </div>
            <br>
        {/each}
    {:else if show==4}
        {#each loger.lineas as lo}
            <div >
                {lo.time}-
                {lo.text}
            </div>
            <br>
        {/each}
    {:else}
        {#each loger.errores as lo}
            <div class="text-red-500">
                {lo.time}-
                {lo.text}
            </div>
            <br>
        {/each}
    {/if}
</div>
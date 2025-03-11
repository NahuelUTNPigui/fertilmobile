<script>
    let {option =$bindable(0),deshabilitado} = $props()
    
    let options = [
        {id:0,nombre:"Vacia"},
        {id:1,nombre:"Dudosa"},
        {id:2,nombre:"Preñada"},
        {id:3,nombre:"En servicio"}
    ]
    function select(id){
        option = id
    }
    
</script>
<div class="bg-transparent grid grid-cols-2 lg:grid-cols-4 ">
    {#each options as op}
        
        <button id={op.id} onclick={()=>select(op.id)} 
            disabled={deshabilitado}
            class={`
                flex-1 m-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                ${option==op.id?
                    "bg-green-600 text-white shadow-lg transform scale-105":
                    "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-gray-700 dark:text-green-300 dark:hover:bg-gray-600"
                }
            `}>
                {op.nombre}
        </button>
        
    {/each}
</div>
<style>
    .btn{
        background-color: #efefef;
    }
    .btn.sel{
        background-color: #04AA6D; 
    }
</style>
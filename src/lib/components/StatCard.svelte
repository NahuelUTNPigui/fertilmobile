<script>
    import { goto } from "$app/navigation";
    //let pre = import.meta.env.VITE_PRE
    let {titulo,valor,titsize="text-xl",urlto=""} = $props()
</script>
<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 transition-colors duration-200">
    <button onclick={()=>goto(urlto)} class="text-left">
        <h3 class={`${titsize} font-semibold text-gray-700 dark:text-gray-300 mb-2`}>{titulo}</h3>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">{valor}</p>
    </button>
</div>
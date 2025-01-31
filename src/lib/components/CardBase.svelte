<script>
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    export let titulo = ""
    export let cardsize = "max-w-5xl"
</script>
<div 
    class="
        min-h-screen dark:bg-gradient-to-br 
        dark:from-gray-900 dark:to-gray-800 
        p-4
    "
>
    <div class="flex items-center justify-center">
        <div 
            class={`
                bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full
                ${cardsize}
            `}
            
        >
            <h1 class="text-2xl font-bold text-green-700 dark:text-green-400 mb-6 text-start">{titulo}</h1>
            <slot/>
        </div>
    </div>
</div>
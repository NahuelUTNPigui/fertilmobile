<script>
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    export let titulo = ""
    export let cardsize = "max-w-5xl"
</script>
<div class="bg-transparent p-2">
    <div class="flex items-center justify-center">
        <div 
            class={`
                bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-2 w-full 
                ${cardsize}
            `}
        >
            <h1 class="text-2xl font-bold text-green-700 dark:text-green-400 mb-3 text-start">{titulo}</h1>
            <slot/>
        </div>
    </div>
</div>
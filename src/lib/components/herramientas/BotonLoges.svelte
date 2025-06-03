<script>
    import Loges from "./Loges.svelte";

    
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    let verLog = $state(false)
</script>
{#if modedebug}
    <!-- Floating Chat Button -->
    <button 
        class="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
        onclick={()=>verLog = !verLog}
    >
        Ver logs
    </button>
    {#if verLog}
        <div class="fixed bottom-20 right-6 w-80 max-h-96 bg-white border border-gray-300 rounded-lg shadow-lg overflow-y-auto z-40">
            <Loges></Loges>
        </div>
        
    {/if}
{/if}
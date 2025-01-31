<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Swal from 'sweetalert2'
    import PocketBase from 'pocketbase'
    import { createRoler } from '$lib/stores/defaultrol.svelte';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    let ruta = import.meta.env.VITE_RUTA
    onMount(()=>{
        let roler = createRoler()
        if(roler.rol.length == 0){
            goto("/rol")
        }
    })
</script>
<Navbarr>
    <div class="grid justify-items-center mx-1 lg:mx-5">
        <div class="card bg-base-100 shadow-xl w-full">
            <div class="card-body">
                <h2 class="card-title text-xl">Inicio</h2>
                <div class="grid grid-cols-2">
                    <div >
                        <h2 class="text-lg font-normal italic text-gray-800 dark:text-white">Cab</h2>
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
</Navbarr>


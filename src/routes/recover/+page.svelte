<script>
    import Swal from 'sweetalert2'
    import { goto } from '$app/navigation';
    import Oscuro from "$lib/components/OscuroLogin.svelte";
    import PocketBase from 'pocketbase'
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    let ruta = import.meta.env.VITE_RUTA
    let usuariomail=''
    function isEmpty(str) {
        return (!str || str.length === 0 );
    }
    function volver(){
        goto("/login")
    }
    async function reset(){
        if(isEmpty(usuariomail)){
            Swal.fire('Error recuperar', 'Email vacio', 'error');
            return
        }
        const pb = new PocketBase(ruta);
        try{
            await pb.collection('users').requestPasswordReset(usuariomail);
            Swal.fire("Correo enviado","Se envió un correo con las instrucciones","success")

        }
        catch(err){
            console.error(err)
            Swal.fire("Correo denegado","No se pudo enviar el correo con las instrucciones","error")
        }
    }
    function keyEvent(e){
        if(e.code=="Enter"){
            if(usuariomail !=""!=""){
                reset()
            }
        }
    }
</script>
<svelte:window on:keydown={keyEvent}></svelte:window>
<div class="min-h-screen bg-gradient-to-br from-green-400 to-green-700  dark:from-gray-900 dark:to-gray-800 p-4">
    <div class="flex justify-end m-10">
        <Oscuro></Oscuro>
    </div>
    <div class="flex items-center justify-center">
        <div 
            class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full"
            in:fly="{{ y: 50, duration: 200, easing: quintOut }}"
            out:fade
        >
        
            <h1 class="text-3xl font-bold text-green-700 dark:text-green-400 mb-6 text-center">Bienvenido a Fertil</h1>
            <div class="space-y-6">
                <div>
                    <label for="username" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Email
                    </label>
                    <input 
                        type="username" 
                        id="username" 
                        bind:value={usuariomail} 
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                </div>
                
                <div>
                    <button 
                        class="w-full bg-green-600 text-white rounded-md py-2 px-4 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition" 
                        onclick={reset}
                    >
                        Enviar mail de recuperación
                    </button>
                    <button 
                        class="hidden mt-2 w-full bg-green-600 text-white rounded-md py-2 px-4 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition" 
                        onclick={()=>goto("/recover/token")}
                    >
                        Escribir token
                    </button>
                </div>
                
            </div>
            <!--<div class="mt-6 text-center">
                <a href="#" 
                    class="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition"
                >
                    ¿Olvidaste la contraseña?
                </a>
            </div>
            -->
            <div class="mt-8 border-t border-gray-200 pt-6 text-center">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Quiere ir a la pagina principal?
                    <a 
                        href="/login" 
                        class="font-medium text-green-600 dark:text-green-400  hover:text-green-800 dark:hover:text-green-300 transition"
                    >
                        Volver
                    </a>
                </p>
            </div>

        </div>
    </div>
</div>
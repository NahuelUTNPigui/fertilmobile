<script>
    //Le falta la parte de offline
    import { page } from '$app/stores';
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import Swal from "sweetalert2";
    import motivos from '$lib/stores/motivos';
    import { onMount } from "svelte";
    import tiponoti from '$lib/stores/tiponoti';
    import { Network } from '@capacitor/network';
    let {
        caravana,
        bajar,
        eliminar,
        transferir,
        fechafallecimiento=$bindable(""),
        motivo = $bindable("fallecimiento")
    } = $props()
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let coninternet = $state({connected:false})
    let nombredel = $state("")
    let nombretrans = $state("")
    let buscar = $state("")
    let codigo = $state("")
    let malcodigo = $state(false)
    
    let id = $state("")
    
    function darBaja(){
        if(fechafallecimiento!=""){
            Swal.fire({
                title: 'Dar de baja',
                text: '¿Seguro que deseas dar de baja al animal?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Si',
                cancelButtonText: 'No'
            }).then(result=>{
                if(result.value){
                    bajar(fechafallecimiento,motivo)
                }
            })
        }
        
    }
    function del(){
        if(nombredel == caravana){
            Swal.fire({
                title: 'Eliminar animal',
                text: '¿Seguro que deseas eliminar al animal, los datos relacionados se podrían perder?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Si',
                cancelButtonText: 'No'
            }).then(result=>{
                if(result.value){
                    eliminar()
                }
            })
            
        }
        
    }
    function openModal(){
        if(nombretrans == caravana){
            codigo= ""
            transferModal.showModal()
            
        }
        
    }
    async function transfer(){
        const resultList = await pb.collection('cabs').getList(1, 1, {
            filter: `active = true && renspa = '${codigo}'`,
        });
        if(resultList.items.length == 0){
            malcodigo = true
            transferModal.close()
            return
        }
        if(resultList.totalItems > 1){
            Swal.fire("Error transferencia","Hay varios establecimientos con ese RENSPA","error")
            transferModal.close()
            return
        }
        transferModal.close()
        
        Swal.fire({
            title: 'Transferir animal',
            text: `¿Seguro que deseas transferir el animal ${caravana} a ${codigo}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No'
        }).then(result=>{
            if(result.value){
                transferir(codigo)
                
            }
        })
            
        
        
    }
    onMount(async ()=>{

        id = $page.params.slug

    })
</script>
<div class="p-2">
    <div class="w-full  overflow-hidden">
        <div class="p-3 space-y-6">
            <div class="grid grid-cols-1">
                <div>
                    <h3 class="text-xl mx-1 font-bold mb-2 text-left mt-2">
                        Dar de baja
                    </h3>
                </div>
                <div class="grid grid-cols-4">
                    <div class="mt-2 col-span-1">
                        <br>
                        <button 
                            aria-label="dar baja"
                            onclick={darBaja}
                            disabled = {fechafallecimiento == ""}
                            class={`
                                flex 
                                items-center px-4 py-2 
                                rounded-full 
                                ${fechafallecimiento!=""?`
                                    focus:ring-offset-2
                                    focus:outline-none focus:ring-2
                                    bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300  focus:ring-blue-500 
                                `:`
                                    bg-gray-600 text-white
                                `}
                            `}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                                </svg>
                        </button>
                    </div>
                    <div class="mt-2 col-span-3">
                        <label class="block uppercase tracking-wide text-xs font-bold mb-2" for="grid-first-name">
                            Fecha
                        </label>
                        <input id ="fechadesde" type="date"  
                            class={`
                                input input-bordered
                                w-full
                                ${estilos.bgdark2}
                            `} 
                            bind:value={fechafallecimiento}
                        />
                    </div>
                    <div class="mt-2 col-span-1">
                        <label for = "motivo" class="label">
                            <span class="label-text text-base">Motivo</span>
                        </label>
                    </div>
                    <div class="mt-2 col-span-3">
                        <select 
                            class={`
                                select select-bordered w-full
                                border border-gray-300 rounded-md
                                focus:outline-none focus:ring-2 
                                focus:ring-green-500 
                                focus:border-green-500
                                ${estilos.bgdark2}
                            `}
                            bind:value={motivo}
                            
                        >
                            
                            {#each motivos as m}
                                <option value={m.id}>{m.nombre}</option>    
                            {/each}
                        </select>
                    </div>
                    
                </div>
            </div>

            <hr class="border-green-400 dark:border-green-300" />
            <div class="">
                <h3 class="text-xl mx-1 font-bold mb-2 text-left mt-2">
                    Eliminar
                </h3>
            </div>
            <div class="grid grid-cols-4">
                <div class="col-span-1">
                    <button aria-label="Eliminar" 
                        disabled={caravana!=nombredel}
                        onclick={del}
                        class={`
                            flex 
                            items-center px-4 py-2
                            rounded-full 
                            ${caravana == nombredel?`
                                focus:ring-offset-2 transition-colors duration-300 focus:outline-none focus:ring-2
                                bg-red-600 text-white hover:bg-red-700  focus:ring-red-500 
                            `:`
                                bg-gray-600 text-white
                            `}
                            
                        `}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>                          
                    </button>
                </div>
                <div class="col-span-3 ">
                    <input
                        type="text"
                        placeholder="Escribe la caravana"
                        
                        class={`
                            w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500
                            ${estilos.bgdark2}
                        `}
                        bind:value={nombredel}
                    />
                    <div class="label">
                        <span class="label-text-alt">{caravana}</span>
                    </div>
                </div>
                

            </div>
            <hr class="border-green-400 dark:border-green-300" />
            <div class="">
                <h3 class="text-xl mx-1 font-bold mb-2 text-left mt-2">
                    Transferir
                </h3>
            </div>
            <div class="grid grid-cols-4">
                <div class="col-span-1">
                    <button aria-label="iniciar" 
                        disabled={caravana!=nombretrans}
                        onclick={openModal}
                        class={`
                            flex 
                            items-center px-4 py-2
                            rounded-full 
                            ${caravana == nombretrans?`
                                focus:ring-offset-2 transition-colors duration-300 focus:outline-none focus:ring-2
                                bg-green-600 text-white hover:bg-green-700  focus:ring-green-500 
                            `:`
                                bg-gray-600 text-white
                            `}
                            
                        `}
                    >                    
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                          </svg>                                                    
                    </button>
                </div>
                <div class="col-span-3 ">
                    <input
                        type="text"
                        placeholder="Escribe la caravana"
                        class={`
                            w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500
                            ${estilos.bgdark2}
                        `}
                        bind:value={nombretrans}
                    />
                    <div class="label">
                        <span class="label-text-alt">{caravana}</span>
                    </div>
                </div>
                

            </div>
        </div>
    </div>
</div>
<dialog id="transferModal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div class="modal-box w-11/12 max-w-xl bg-50">
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <!--<h3 class="text-lg font-bold">Buscar cabañas</h3> -->
        <div 
            class="form-control p-8 w-full"
        >
        <h2 class="text-xl font-bold text-green-700 dark:text-green-400 mb-6 text-start">RENSPA</h2>
            <input 
                id ="token" 
                type="text"  
                class={`
                    input 
                    input-bordered 
                    border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                    flex-grow
                    ${estilos.bgdark2}
                `}
                bind:value={codigo}
            />
            {#if malcodigo}
                <div class="label">
                    <span class="label-text-alt text-red-500">No existe un establecimiento con ese codigo</span>                    
                </div>
            {/if}
            <button class="mt-1 btn btn-success text-white text-xl " onclick={transfer} >Transferir</button>
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
              <!-- if there is a button, it will close the modal -->
              
              <button class="btn btn-error text-white" >Cerrar</button>
            </form>
        </div>
    </div>
</dialog>
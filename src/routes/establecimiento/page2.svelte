<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import {Network} from "@capacitor/network"
    import Swal from 'sweetalert2'
    import PocketBase from 'pocketbase'
    import { createRoler } from '$lib/stores/defaultrol.svelte';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { createCaber } from "$lib/stores/capacitor/capcab.svelte";
    import {managerCab} from "$lib/stores/capacitor/offlinecab";
    import {createPer} from "$lib/stores/permisos.svelte"
    import CardBase from '$lib/components/CardBase.svelte';
    import Colaboradores from '$lib/components/establecimiento/Colaboradores.svelte';
    import ListaColabs from '$lib/components/establecimiento/ListaColabs.svelte';
    import { usuario } from '$lib/stores/usuario';
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let usuarioid = ""
    let manager = managerCab()
    let conInternet = $state(false)
    let cab = $state({
        exist:false,
        nombre:"",
        id:""
    })
    let caber = createCaber()
    let per = createPer()
    let colabs = $state([])
    let modoedicion = $state(false)
    //Datos cabaña
    let nombre = $state("")
    let direccion = $state("")
    let contacto = $state("")
    async function getCabaña(){
        try{
            const record = await pb.collection('cabs').getFirstListItem(`id='${cab.id}' && active=true`, {});
            nombre = record.nombre
            direccion = record.direccion
            contacto = record.contacto
            //caber.setCab(record.nombre,record.id)
        }
        catch(err){
            
            caber.setDefault()
            nombre = ""
            direccion = ""
            contacto = ""
            goto("/")
        }
        
    }
    async function getColabs(){
        const records = await pb.collection('estxcolabs').getFullList({
            expand:"colab",
            filter:`cab='${cab.id}'`,
            sort:"colab.apellido"
        });
        colabs = records
    }
    async function guardarColab(data){
        try{
            let userdata = {
                username:data.email.split("@")[0],
                email:data.email,
                emailVisibility:true,
                password:data.contra,
                passwordConfirm:data.contra,
                name:data.email,
                active:true

            }
            const recorduser = await pb.collection('users').create(userdata);
            let colabdata={
                nombre:data.nombre,
                apellido:data.apellido,
                telefono:data.telefono,
                user:recorduser.id
            }
            const recordcolab = await pb.collection('colaboradores').create(colabdata);
            let estxcolabdata = {
                colab:recordcolab.id,
                cab:cab.id
            }
            const recordexc = await pb.collection('estxcolabs').create(estxcolabdata);
            let permisosdata={
                estxcolab:recordexc.id,
                permisos:""
            }
            await pb.collection('permisos').create(permisosdata);

            await getColabs()

        }
        catch(err){
            console.error(err)
        }
    }
    async function guardarCabaña(){
        const data = {
            nombre,
            direccion,
            user: usuarioid,
            active: true,
            contacto
        };

        try{
            
            const record = await pb.collection('cabs').create(data);
            Swal.fire("Exito guadar","Se pudo guardar la cabaña con éxito","success")
            caber.setCab(nombre,record.id)
            per.setPer("0,1,2,3,4,5",usuarioid)
            goto("/")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","No se pudo guardar la cabaña","error")
        }
        
    }
    async function editarCabaña(){
        const data = {
            nombre,
            direccion,
            contacto
        };
        try{
            manager.updateCab(data)
            //const record = await pb.collection('cabs').update(cab.id, data);
            
            caber.setCab({
                nombre:nombre,
                exist:true,
                id:caber.cab.id
            })
            Swal.fire("Exito modificar","Se pudo modificar la cabaña con éxito","success")
            
        }
        catch(err){
            console.error(err)
            Swal.fire("Error modificar","No se pudo modificar la cabaña con éxito","error")
        }
    }
    function mostrarcolab(data){
        console.log("padre: "+data)
    }
    onMount(async ()=>{
        let status = await Network.getStatus()
        await caber.init()
        await manager.init()
        conInternet = status.connected
        cab = caber.cab
        let pb_json = await JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.model.id
        if(cab.exist){
            nombre = manager.cab.nombre
            direccion = manager.cab.direccion
            contacto = manager.cab.contacto
           //await getCabaña()
           //await getColabs()
           
        }
    })
 
</script>
<Navbarr>
    
    {#if cab.exist}
        <CardBase titulo="Bievenido a fertil" cardsize="max-w-5xl">
            <div class="space-y-6">
                <div>
                    <label for="nombre" 
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                    >
                        Nombre:
                    </label>
                    {#if !modoedicion}
                        <label for="nombre" 
                            class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                        >
                            {nombre}
                        </label>
                    {:else}
                        <input 
                            type="text" 
                            id="nombre"
                            disabled={!modoedicion}
                            bind:value={nombre} 
                            required 
                            class={`
                                w-full px-3 py-2 border rounded-md shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                                transition duration-150 ease-in-out
                                ${
                                modoedicion
                                    ? 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }
                            `}
                        />
                    {/if}
                </div>
                <div>
                    <label for="direccion" 
                        class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Dirección
                    </label>
                    {#if !modoedicion}
                        <label for="direccion" 
                            class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                        >
                            {direccion}
                        </label>
                    {:else}
                        <input 
                            type="text" 
                            id="direccion"
                            disabled={!modoedicion}
                            bind:value={direccion} 
                            required 
                            class={`
                                w-full px-3 py-2 border rounded-md shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                                transition duration-150 ease-in-out
                                ${
                                modoedicion
                                    ? 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }
                            `}
                        />
                    {/if}
                </div>
                <div>
                    <label for="contacto" 
                        class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Contacto
                    </label>
                    {#if !modoedicion}
                        <label for="contacto" 
                            class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                        >
                            {contacto}
                        </label>
                    {:else}
                        <input 
                            type="text" 
                            id="contacto"
                            disabled={!modoedicion}
                            bind:value={contacto} 
                            required 
                            class={`
                                w-full px-3 py-2 border rounded-md shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                                transition duration-150 ease-in-out
                                ${
                                modoedicion
                                    ? 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }
                            `}
                        />
                    {/if}
                    
                </div>
            </div>
            <div class="mt-8 flex justify-end">
                {#if  !modoedicion}
                    <button
                        onclick={()=>modoedicion=true}
                        class=" 
                            btn px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md 
                            text-white font-bold font-lg focus:outline-none 
                            focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                        "
                    >
                        Editar establecimiento
                    </button>    
                {:else}
                    <button 
                        onclick={()=>modoedicion=false}
                        class="
                            btn btn-error 
                            text-white 
                            font-bold font-lg
                        "
                    >

                        Cancelar
                    </button>   
                    <button

                        onclick={async ()=>{modoedicion=false;await editarCabaña()}}
                        class="btn px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-bold font-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                        Guardar
                    </button>    
                {/if}
                
            </div>
            <div class="hidden">
                <Colaboradores  {mostrarcolab} {guardarColab}/>
                <ListaColabs {colabs}/>
            </div>
        </CardBase>
    {:else}
        <CardBase titulo="Registra tu establecimiento">
            <div class="space-y-4">
                
                <div>
                    <label for="nombre" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Nombre
                    </label>
                    <input 
                        type="nombre" 
                        id="nombre"
                        
                        bind:value={nombre} 
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                </div>
                <div>
                    <label for="direccion" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Dirección
                    </label>
                    <input 
                        type="direccion" 
                        id="direccion"
                        
                        bind:value={direccion} 
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                </div>
                <div>
                    <label for="contacto" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Contacto
                    </label>
                    <input 
                        type="contacto" 
                        id="contacto"
                        
                        bind:value={contacto} 
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                </div>

            </div>
            {#if conInternet}
            <div class="mt-8 flex justify-end">
                <button
                    onclick={guardarCabaña}
                    class="
                        btn px-6 py-2 
                        bg-green-600 hover:bg-green-700 
                        rounded-md text-white font-bold text-lg 
                        focus:outline-none focus:ring-2 
                        focus:ring-offset-2 focus:ring-green-500
                    "
                >
                  Guardar establecimiento
                </button>
            </div>
            {:else}
                <div class="mt-8 flex justify-end">
                    Debes tener internet para guardar la cabaña
                </div>
            {/if}
        </CardBase>
    {/if}
</Navbarr>


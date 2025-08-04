<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Swal from 'sweetalert2'
    import PocketBase from 'pocketbase'
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { createCaber } from "$lib/stores/cab.svelte";
    import permisos from '$lib/stores/permisos';
    import estilos from '$lib/stores/estilos';
    import CardBase from '$lib/components/CardBase.svelte';
    import tiponoti from '$lib/stores/tiponoti';
    import { getInternet } from '$lib/stores/offline';
    //probar internet
    import { actualizacion,deboActualizar } from '$lib/stores/offline/actualizar';
    import { customoffliner } from '$lib/stores/offline/custom.svelte';
    import { intermitenter } from '$lib/stores/offline/intermitencia.svelte';
    import { velocidader } from '$lib/stores/offline/velocidad.svelte';
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let getvelocidad = $state(0)
    let caber = createCaber()
    let cab = caber.cab
    let tokencolab = $state("")
    
    function volver(){
        goto("/establecimiento")
    }
    async function asociar() {
        
        const resultList = await pb.collection('users').getList(1, 1, {
            filter: `codigo = '${tokencolab}'`,
            skipTotal:true
        });        
        if(resultList.items.length == 0){
            Swal.fire("Error colaborador","No existe un usuario con ese codigo","error")
            return
        }
    

        let pb_json = JSON.parse(localStorage.getItem('pocketbase_auth'))
        
        let origenusuarioid =  pb_json.record.id
        let userid = resultList.items[0].id
        let nombre = resultList.items[0].nombre
        let apellido = resultList.items[0].apellido
        if(userid == origenusuarioid){
            Swal.fire("Error colaborador","No puedes asociarte al establecimiento","error")
            return
        }
        const resultcolab = await pb.collection('colaboradores').getList(1,1,{
            filter:`user = '${userid}'`,
            skipTotal:true
        })
        
        let existecolab = resultcolab.items.length > 0
        if(existecolab){
            
            let colabid = resultcolab.items[0].id
            //verificar si ya esta asociado
            const recordasoci = await pb.collection('estxcolabs').getList(1,1,{
                filter:`cab = '${cab.id}' && colab = '${colabid}'`
            })
            if(recordasoci.items.length>0){
                Swal.fire("Error asociar","El usuario ya esta asociado","error")
                return
            }
            try{    
                let colabid = resultcolab.items[0].id
                //Creo la asociación
                let dataestxcolab = {
                    cab:cab.id,
                    colab:colabid
                }
                const recordestxcolab = await pb.collection('estxcolabs').create(dataestxcolab);
                //Debo crear los permisos para el colaborador
                let datapermisos = {
                    estxcolab:recordestxcolab.id,
                    permisos:""
                }
                const recordpermisos = await pb.collection('permisos').create(datapermisos);
                Swal.fire("Éxito asociar","Se pudo asociar el usuario","success")
                tokencolab = ""
            }
            catch(err){
                console.error(err)
                Swal.fire("Error asociar","No se pudo asociar el usuario","error")
                
                tokencolab = ""
                return
            }


        }
        else{
            try{
                //Debo crear el colaborador
                let data = {
                    nombre:nombre,
                    apellido:apellido,
                    user:userid,
                    telefono:"",
                    rol:""
                }
                const record = await pb.collection('colaboradores').create(data);
                //Creo la asociación
                let dataestxcolab = {
                    cab:cab.id,
                    colab:record.id
                }
                const recordestxcolab = await pb.collection('estxcolabs').create(dataestxcolab);
                //Debo crear los permisos para el colaborador
                let datapermisos = {
                    estxcolab:recordestxcolab.id,
                    permisos:""
                }
                const recordpermisos = await pb.collection('permisos').create(datapermisos);
                Swal.fire("Éxito asociar","Se pudo asociar el usuario","success")
                tokencolab = ""
            }   
            catch(err){
                console.error(err)
                Swal.fire("Error asociar","No se pudo asociar el usuario","error")
                tokencolab = ""
                return

            }
        }
        //Creo las notificaciones
        try{
            let data = {
                texto:"Se te asoció al establecimiento "+ cab.nombre,
                titulo:"Asociado a "+ cab.nombre,
                tipo:tiponoti[0].id,
                origen:origenusuarioid,
                destino:userid,
                leido:false
            }
            const record = await pb.collection('notificaciones').create(data);
        }
        catch(err){
            console.error(err)
        }
    }
    onMount(async ()=>{
        
        //await getUsuarios()
        //await getColabs()
    })
</script>
<Navbarr>
    <div class="mx-1 mt-1">
        <div>
            <button aria-label="volver" class={`btn ${estilos.btnsecondary}`} onclick={volver}>
                Volver         
            </button>
        </div>
    </div>
    <div class="min-h-screen flex items-start justify-center">
        <div
            class={`
                bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full
                max-w-xl
            `}
        >
            <h2 class="text-xl font-bold text-green-700 dark:text-green-400 mb-6 text-start">Código de colaboración</h2>
            <div class="flex space-x-4">
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
                    bind:value={tokencolab}
                />    
                <button class="mt-1 btn btn-success text-white text-xl " onclick={asociar} >Asociar</button>
            </div>
        </div>
    </div>    
</Navbarr>

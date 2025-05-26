<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Swal from 'sweetalert2'
    import PocketBase from 'pocketbase'
    import { createRoler } from '$lib/stores/defaultrol.svelte';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { createCaber } from "$lib/stores/cab.svelte";
    import {createPer} from "$lib/stores/permisos.svelte"
    import CardBase from '$lib/components/CardBase.svelte';
    import Colaboradores from '$lib/components/establecimiento/Colaboradores.svelte';
    import ListaColabs from '$lib/components/establecimiento/ListaColabs.svelte';
    import { usuario } from '$lib/stores/usuario';
    import { codigoSinRepetir,codigoSinRepetirEstablecimiento } from '$lib/pbutils/lib';
    import provincias from '$lib/stores/geo/provincias';
    import localidades from '$lib/stores/geo/localidades';
    import estilos from '$lib/stores/estilos';
    import { randomString } from '$lib/stringutil/lib';
    //offline
    import {openDB} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import {getUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabDataByID} from "$lib/stores/cabsdata"
    import {
        setEstablecimientoSQL,
        getEsblecimientoSQL,
        updateLocalEstablecimientoSQL

    } from '$lib/stores/sqlite/dbestablecimiento';
    import {updateLocalEstablecimientosSQL}  from '$lib/stores/sqlite/dballestablecimientos';
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import {getColabSQL,setColabSQL,updateLocalColabSQL} from '$lib/stores/sqlite/dbcolaboradores';
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import permisos from '$lib/stores/permisos';
    //offline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    let coninternet = $state({})
    let establecimiento = $state({})
    let comandos = $state([])
    let ruta = import.meta.env.VITE_RUTA
    let pre = ""
    const pb = new PocketBase(ruta);
    const regexRenspa = /^\d{2}\.\d{3}\.\d\.\d{5}\.\d{2}$/;
    
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
    let codigo = $state("")
    let renspa = $state("")
    let provincia = $state("")
    let localidad = $state("")
    let localidadesProv = $state([])
    let telefono = $state("")
    let mail = $state("")
    let titular = $state("")
    let renspaValido = $state(true)
    //Desasociar
    let asociado = $state(false)
    let idestxcolab = $state("")
    
    async function getCabaña(){
        try{
            const record = await pb.collection('cabs').getFirstListItem(`id='${cab.id}' && active=true`, {});
            nombre = record.nombre
            direccion = record.direccion
            contacto = record.contacto
            codigo = record.codigo
            contacto = record.contacto
            renspa = record.renspa
            localidad = record.localidad
            provincia = record.provincia
            telefono = record.telefono
            mail = record.mail
            localidadesProv = localidades.filter(lo => lo.idProv == provincia)
            caber.setCab(record.nombre,record.id)
        }
        catch(err){
            
            caber.setDefault()
            nombre = ""
            direccion = ""
            contacto = ""
            codigo = ""
            contacto=""
            renspa=""
            localidad=""
            provincia=""
            telefono=""
            mail=""
            goto(pre+"/")
        }
        
    }
    async function getColabs(){
        const records = await pb.collection('estxcolabspermisos').getFullList({
            expand:"colab",
            filter:`cab='${cab.id}'`,
            sort:"colab.apellido"
        });
        colabs = records
    }
    async function guardarColabOffline() {
        Swal.fire("Error guardar","No se puede crear un colaborador sin internet","error")
    }
    async function guardarColabOnline(data){
        let codigo = await codigoSinRepetir(pb)
        try{
            let nombredata = nombre.trim().split(" ").filter(w=>w !== "").join(".")
            let apellidodata = apellido.trim().split(" ").filter(w=>w !== "").join(".")
            let randomnumber = randomString(5,"n")
            let userdata = {
                "username": nombredata+"."+apellidodata+randomnumber,
                email:data.email,
                password:data.contra,
                passwordConfirm:data.contra,
                name:data.email,
                codigo:codigo,
                nombre:data.nombre.trim(),
                apellido:data.apellido.trim(),
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
            let colabsql = {
                id:recordexc.id,
                colab:recordcolab.id,
                cab:cab.id,
                permisos:"",
                expand:{
                    colab:{
                        id:recordcolab.id,
                        nombre:data.nombre,
                        apellido:data.apellido,
                        telefono:data.telefono,
                        user:recorduser.id
                    }
                }
            }
            colabs.push(colabsql)
            await setColabSQL(db,colabs)
            

        }
        catch(err){
            console.error(err)
        }
    }
    async function guardarColab(data){
        if(coninternet.connected){
            await guardarColabOnline(data)
        }
        else{
            await guardarColabOffline()
        }
    }
    async function guardarCabañaOffline() {
        Swal.fire("Error guardar","No se puede crear un establecimiento sin internet","error")
    }
    async function guardarCabañaOnline() {
        let codigo = await codigoSinRepetirEstablecimiento(pb)
        const data = {
            nombre,
            direccion,
            user: usuarioid,
            active: true,
            contacto,
            renspa,
            localidad,
            provincia,
            telefono,
            mail,
            codigo
        };

        try{

            const record = await pb.collection('cabs').create(data);
            Swal.fire("Exito guadar","Se pudo guardar la cabaña con éxito","success")
            await setEstablecimientoSQL(db,pb,data)
            caber.setCab(nombre,record.id)
            per.setPer("0,1,2,3,4,5",usuarioid)
            goto(pre+"/")
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","No se pudo guardar la cabaña","error")
        }
        renspaValido = true
    }
    async function guardarCabaña(){
        if(coninternet.connected){
            await guardarCabañaOnline()
        }
        else{
            await guardarCabañaOffline()
        }
        
    }
    async function editarCabañaOffline(){
        const data = {
            nombre,
            direccion,
            contacto,
            contacto,
            renspa,
            localidad,
            provincia,
            telefono,
            mail
        };
        try{
            await setEstablecimientoSQL(db,pb,cab.id,data)
            Swal.fire("Exito modificar","Se pudo modificar la cabaña con éxito","success")
            caber.setCab(nombre,cab.id)
        }
        catch(err){
            console.error(err)
            Swal.fire("Error modificar","No se pudo modificar la cabaña con éxito","error")
        }
        renspaValido = true
    }
    async function editarCabañaOnline() {
        const data = {
            nombre,
            direccion,
            contacto,
            contacto,
            renspa,
            localidad,
            provincia,
            telefono,
            mail
        };
        try{
            const record = await pb.collection('cabs').update(cab.id, data);
            await setEstablecimientoSQL(db,data)
            
            Swal.fire("Exito modificar","Se pudo modificar la cabaña con éxito","success")
            caber.setCab(nombre,cab.id)
            
        }
        catch(err){
            console.error(err)
            Swal.fire("Error modificar","No se pudo modificar la cabaña con éxito","error")
        }
        renspaValido = true
    }
    async function editarCabaña(){
        if(coninternet.connected){
            await editarCabañaOnline()
        }
        else{
            await editarCabañaOffline()
        }
    }
    async function desasociarOnline(idestxcolab) {

        try{
            await pb.collection('estxcolabs').delete(idestxcolab);
            colabs = colabs.filter(colab => colab.id != idestxcolab)
            await setColabSQL(db,colabs)
            
        }
        catch(err){
            console.error(err)
            Swal.fire("Error desasociar","No se pudo desasociar el colaborador","error")
        }


        
        //Me hace ruido todo esto porque tengo que laburar con la lista de establecimientos
        try{
            //Aca va a su cabaña, hay un cambio de cabaña, por eso se fija si existe alguna cabaña
            const record = await pb.collection('cabs').getFirstListItem(`user='${usuarioid}' && active=true`, {});
            caber.setCab(record.nombre,record.id)
            per.setPer("0,1,2,3,4,5",usuarioid)
        }
        catch(err){
            try{
                //Revisa si sos colaborador 
                const recordcab = await pb.collection('estxcolabs').getFirstListItem(`colab.user='${usuarioid}'`, {
                    expand: 'colab,cab,colab.user',
                })
                const recordper = await pb.collection("permisos").getFirstListItem(`estxcolab='${recordcab.id}'`)
                per.setPer(recordper.permisos,usuarioid)
                caber.setCab(recordcab.expand.cab.nombre,recordcab.expand.cab.id)
                
            }
            catch(err){
                caber.setDefault()
                per.setDefault()
            }
            
        }
        goto('/')
    }
    async function desasociarOffline(){
        Swal.fire("Error desasociar","No se puede desasociar sin internet","error")
    }
    //Esta funcion es la autodesaciacion del colaborador
    async function desasociar(idestxcolab) {
        if(coninternet.connected){
            await desasociarOnline()
        }
        else{
            await desasociarOffline()
        }
        
    }
    function mostrarcolab(data){
        console.log("padre: "+data)
    }
    function getNombreProvincia(id){
        let p = provincias.filter(pro=>pro.id == id)[0]
        if(p){
            return p.nombre
        }
        else{
            return ""
        }
    }
    function getNombreLocalidad(id){
        let l = localidades.filter(lo=>lo.nombre == id)[0]
        if(l){
            return l.nombre
        }
        else{
            return ""
        }
    }
    function getLocalidades(idProv){
        localidad = ""
        localidadesProv = localidades.filter(lo => lo.idProv == idProv)
    }
    function escribirRenspa(){
        if(!renspaValido){
            renspaValido = regexRenspa.test(renspa)
        }
        
    }
    async function originalMount(){
        cab = caber.cab
        
        let pb_json = await JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.record.id
        if(cab.exist){
           await getCabaña()
           await getColabs()
           const recordcolab = await pb.collection('colaboradores').getList(1,1,{
            filter:`user = '${usuarioid}'`
           })
           if(recordcolab.items.length > 0){
            const recordestxcolab = await pb.collection('estxcolabs').getList(1, 1, {
                filter: `colab = '${recordcolab.items[0].id}' && cab = '${cab.id}'`,
            });
            if(recordestxcolab.items.length > 0){
                asociado = true
                idestxcolab = recordestxcolab.items[0].id
            }
            else{
                asociado = false
            }
           }
           else{
            asociado = false
           }
           
        }
    }
    async function initPage(){
        coninternet = await Network.getStatus();
        //Esto no va andar, sera siempre userer y caber
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        cab = caber.cab
        usuarioid = useroff.id
    }
    async function getLocalSQL(){
        let rescolabs = await getColabSQL(db)
        colabs = rescolabs.lista.filter(colab => colab.cab == caboff.id)
        let res = await getEsblecimientoSQL(db)
        establecimiento = res
        nombre = res.nombre
        direccion = res.direccion
        contacto = res.contacto
        codigo = res.codigo
        renspa = res.renspa
        localidad = res.localidad
        provincia = res.provincia
        telefono = res.telefono
        mail = res.mail    
        localidadesProv = localidades.filter(lo => lo.idProv == provincia)
        
  
    }
    async function updateLocalSQL(){
        await  updateLocalEstablecimientosSQL(db,pb,usuarioid,cab.id)
        let res = await getEsblecimientoSQL(db)
        establecimiento = res
        nombre = res.nombre
        direccion = res.direccion
        contacto = res.contacto
        codigo = res.codigo
        renspa = res.renspa
        localidad = res.localidad
        provincia = res.provincia
        telefono = res.telefono
        mail = res.mail    
        localidadesProv = localidades.filter(lo => lo.idProv == provincia)
        let allcolabs = await updateLocalColabSQLUser(db,pb,usuarioid)
        colabs = allcolabs.filter(colab => colab.cab == caboff.id)

    }
    async function getDataSQL(){
        db = await openDB()
        //Reviso el internet
        let lastinter = await getInternetSQL(db)
        let rescom = await getComandosSQL(db)
        comandos = rescom.lista
        if (coninternet.connected){
            if(lastinter.internet == 0){
                await updateLocalSQL()
            }
            else{
                let ahora = Date.now()
                let antes = lastinter.ultimo
                const cincoMinEnMs = 300000;
                if((ahora - antes) >= cincoMinEnMs){
                    await updateLocalSQL()
                }
                else{
                    await getLocalSQL()            
                }
            }
            await setInternetSQL(db,1,Date.now())
        }
        else{
            await getLocalSQL()
            await setInternetSQL(db,0,Date.now())
        }
    }
    onMount(async ()=>{
        await initPage()
        if(cab.exist){
            await getDataSQL()
        }
        else{
            
            nombre = ""
            direccion = ""
            contacto = ""
            codigo = ""
            contacto=""
            renspa=""
            localidad=""
            provincia=""
            telefono=""
            mail=""
        }
        
    })
 
</script>
<Navbarr>
    
    {#if cab.exist}
        <CardBase titulo={`Bienvenido a ${nombre}`} cardsize="max-w-5xl">
            <div class="space-y-6">
                <div>
                    <label for="RENSPA" 
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                    >
                        RENSPA:
                    </label>
                    {#if !modoedicion}
                        <label for="renspa" 
                            class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                        >
                            {renspa}
                        </label>
                    {:else}
                        <label class="form-control">
                            <input 
                                type="text" 
                                id="renspa"
                                bind:value={renspa}
                                
                                required 
                                class={`
                                    w-full px-3 py-2 border rounded-md shadow-sm
                                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                                    transition duration-150 ease-in-out
                                    border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                `}
                            />
                            <div class="label">
                                <span class="label-text-alt">Formato: 00.000.0.00000.00</span>
                                
                            </div>
                        </label>
                        
                    {/if}
                </div>
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
                            bind:value={nombre} 
                            required 
                            class={`
                                w-full px-3 py-2 border rounded-md shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                                transition duration-150 ease-in-out
                                border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                            `}
                        />
                    {/if}
                </div>
                <div>
                    <label for="Provincia" 
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                    >
                        Provincia:
                    </label>
                    {#if !modoedicion}
                        <label for="Provincia" 
                            class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                        >
                            {getNombreProvincia(provincia)}
                        </label>
                    {:else}
                        <label class="input-group ">
                            <select 
                                class={`
                                    select select-bordered w-full
                                    rounded-md
                                    focus:outline-none focus:ring-2 
                                    focus:ring-green-500 
                                    focus:border-green-500
                                    
                                    ${estilos.bgdark2}
                                `}
                                bind:value={provincia}
                                onchange={()=>getLocalidades(provincia)}
                            >
                                    <option value="" class="rounded"></option>
                                    {#each provincias as p}
                                        <option value={p.id} class="rounded">{p.nombre}</option>
                                    {/each}
                            </select>
                        </label>
                    {/if}
                </div>
                <div>
                    <label for="Localidad" 
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                    >
                        Localidad:
                    </label>
                    {#if !modoedicion}
                        <label for="Provincia" 
                            class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                        >
                            {getNombreLocalidad(localidad)}
                        </label>
                    {:else}
                        <label class="input-group ">
                            <select 
                                class={`
                                    select select-bordered w-full
                                    rounded-md
                                    focus:outline-none focus:ring-2 
                                    focus:ring-green-500 
                                    focus:border-green-500
                                    
                                    ${estilos.bgdark2}
                                `}
                                bind:value={localidad}
                                
                            >
                                    <option value="" class="rounded"></option>
                                    {#each localidadesProv as l}
                                        <option value={l.nombre} class="rounded">{l.nombre}</option>
                                    {/each}
                            </select>
                        </label>
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
                <div>
                    <label for="Teléfono" 
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                    >
                        Teléfono:
                    </label>
                    {#if !modoedicion}
                        <label for="Teléfono" 
                            class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                        >
                            {telefono}
                        </label>
                    {:else}
                        <input 
                            type="text" 
                            id="telefono"
                            
                            bind:value={telefono} 
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
                    <label for="Correo" 
                        class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                    >
                        Correo:
                    </label>
                    {#if !modoedicion}
                        <label for="Correo" 
                            class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1`}
                        >
                            {mail}
                        </label>
                    {:else}
                        <input 
                            type="text" 
                            id="mail"
                            
                            bind:value={mail} 
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
                    <label for="codigo" 
                        class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Codigo de transferencia
                    </label>
                    <label for="codigo" 
                            class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
                        >
                            {codigo}
                        </label>
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
            <Colaboradores bind:colabs={colabs} {mostrarcolab} {guardarColab} {desasociar} {asociado} cabid={cab.id} {cab}/>
            <ListaColabs bind:colabs={colabs}/>
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
        </CardBase>
    {/if}
</Navbarr>


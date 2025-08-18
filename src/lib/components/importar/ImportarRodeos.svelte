<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { onMount } from "svelte";
    import { Filesystem, Directory } from '@capacitor/filesystem';
    import { setLotesSQL, setRodeosSQL } from "$lib/stores/sqlite/dbeventos";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { getPermisosList,getPermisosMessage } from "$lib/permisosutil/lib";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    let {
        db,coninternet,useroff,
        caboff =$bindable({}),usuarioid,rodeos,
        //acciones
        aparecerToast
      } = $props()
    let ruta = import.meta.env.VITE_RUTA
    let caber = createCaber()
    let cab = caber.cab
    

    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    
    let loading = $state(false)
    let verrodeos = $state([])
    async function exportarTemplateOffline() {
        let csvData = [{
            nombre:"",
        }].map(item=>({
            NOMBRE_RODEO:item.nombre,
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Rodeos');
        
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo Rodeos.xlsx",
                directory: Directory.Documents
            });
        } catch(e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo Rodeos.xlsx",
            directory: Directory.Documents
        });
    }
    async function exportarTemplateOnline(){
        let csvData = [{
            nombre:"",
        }].map(item=>({
            NOMBRE_RODEO:item.nombre,
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Rodeos');
        
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo Rodeos.xlsx",
                directory: Directory.Documents
            });
        } catch(e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo Rodeos.xlsx",
            directory: Directory.Documents
        });
    }
    async function exportarTemplate(){
        aparecerToast()
        if(coninternet.connected){
            await exportarTemplateOnline()
            
        }
        else{
            await exportarTemplateOffline()
            
        }
    }
    function importarArchivo(event){
        let file = event.target.files[0];
        
        filename = file.name
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            wkbk = workbook
            
        };
        reader.readAsBinaryString(file);
    }
    async function procesarArchivoOnline(rodeosprocesar) {
        let errores = false
        
        for(let i = 0;i<rodeosprocesar.length;i++){
            let ro = rodeosprocesar[i]
            if(ro.nombre == ""){
                
                continue
            }
            let dataadd = {
                nombre:ro.nombre,
                active:true,
                delete:false,
                cab:caboff.id
            }

            let datamod = {
                nombre:ro.nombre 
            }
            let r_idx = rodeos.findIndex(r=>r.nombre == ro.nombre && caboff.id == r.cab && r.active)  
            if(r_idx == -1){
                
                let record = await pb.collection('rodeos').create(dataadd);
                record = {
                    ...record,
                    expand:{
                        cab: {
                            id: caboff.id,
                            nombre: caboff.nombre,
                            user:usuarioid
                        }
                    }
                }
                
                rodeos.push(record);
            }
        }
        return errores
    }
    async function procesarArchivoOffline(rodeosprocesar) {
        let errores = false
        let comandos = []
        for(let i = 0;i<rodeosprocesar.length;i++){
            let ro = rodrodeosprocesareos[i]

            let dataadd = {
                nombre:ro.nombre,
                active:true,
                delete:false,
                cab:caboff.id
            }

            let datamod = {
                nombre:ro.nombre 
            }

            try{
                const record = await pb.collection('rodeos').getFirstListItem(`nombre="${ro.nombre}"`,{});
                console.log("mod")
                await pb.collection('rodeos').update(record.id, datamod);               
            }
            catch(err){
                console.log("Add")
                await pb.collection('rodeos').create(dataadd);

            }
        }
        let dataprocesar = {
            errores,
            comandos
        }
        return dataprocesar

    }
    async function procesarArchivo(){
        if(filename == ""){
            Swal.fire("Error","Seleccione un archivo","error")
        }

        let sheetrodeos = wkbk.Sheets.Rodeos
        
        if(!sheetrodeos){
            Swal.fire("Error","Debe subir un archivo válido","error")
        }
        
        let rodeosprocesar = []
        let rodeoshashmap = {}
        loading = true
        let errores = false
        for (const [key, value ] of Object.entries(sheetrodeos)) {
            const firstLetter = key.charAt(0);  // Get the first character
            const tail = key.slice(1);
            if(key == "!ref" || key == "!margins" || tail == "1"){
                continue
            }
            if(rodeoshashmap[tail]){
                if(firstLetter=="A"){
                    rodeoshashmap[tail].nombre = value.v
                }
                
            }
            else{
                rodeoshashmap[tail]={
                    nombre:''
                }
                if(firstLetter=="A"){
                    rodeoshashmap[tail].nombre = value.v
                }
                
            }
        }
        for (const [key, value ] of Object.entries(rodeoshashmap)) {
            rodeosprocesar.push(value)
        }
        verrodeos = rodeosprocesar.map(r=>r)
        if(coninternet.connected){
            let listapermisos = getPermisosList(caboff.permisos)
            if(!listapermisos[4]){
                Swal.fire("Error permisos",getPermisosMessage(4),"error")
                filename = ""
                wkbk = null
                loading = false
                return
            }
            if(!listapermisos[2]){
                Swal.fire("Error permisos",getPermisosMessage(2),"error")
                filename = ""
                wkbk = null
                loading = false
                return
            }
            errores = await procesarArchivoOnline(rodeosprocesar)
            await setRodeosSQL(db,rodeos)
        }
        else{
            Swal.fire("Atención","No tienes conexión a internet, no esta habilitado todavia","warning")
            //let dataprocesar = await procesarArchivoOffline(rodeosprocesar)
            //errores = dataprocesar.errores
        }
        filename = ""
        wkbk = null
        loading = false
        if(errores){
            Swal.fire("Error","Ocurrió un error en algun rodeo","error")
         
        }
        else{
            Swal.fire("Éxito importar","Se lograron importar los datos","success")
        }
        
    }
</script>
<div class="space-y-4 grid grid-cols-1 flex justify-center">
    {#if modedebug && verrodeos.length>0}
        <ul>
            {#each verrodeos as vr}
                <li>
                    {JSON.stringify(vr,null,2)}
                </li>
            {/each}
        </ul>
    {/if}
    <button
        class={`
            w-full
            ${estilos.basico} ${estilos.grande} ${estilos.secundario}
        `}
        onclick={exportarTemplate}
    >
       Descargar Plantilla
    </button>
    <div class={`
        w-full
        
    `}>
        <input 
            type="file"
            accept=".xlsx, .xls"  
            class="sr-only"
            id="rodeos-upload"
            onchange={(e)=>importarArchivo(e)}
        />
        <label
              for="rodeos-upload"
              class={`
                w-full flex items-center justify-center px-4 py-4 
                border border-green-300 dark:border-green-600 rounded-md shadow-sm text-lg
                font-medium text-green-700 dark:text-green-300 bg-transparent hover:bg-green-50 
                dark:hover:bg-gray-500 cursor-pointer
              `}
              
        >
        {#if loading}
            <span class="loading loading-spinner loading-xl"></span>
        {:else}
            {filename ? filename : 'Seleccionar archivo'}
        {/if}
        </label>
    </div>
    <div class="flex justify-start">
        <button class="btn btn-success text-white" onclick={procesarArchivo} >Procesar</button>
    </div>

</div>

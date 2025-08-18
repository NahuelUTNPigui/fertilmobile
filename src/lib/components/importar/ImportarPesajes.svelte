<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { onMount } from "svelte";
    import {guardarHistorial} from "$lib/historial/lib"
    import { Filesystem, Directory } from '@capacitor/filesystem';
    import { getPesajesSQL, setPesajesSQL } from "$lib/stores/sqlite/dbeventos";
    import { esMismoDia } from "$lib/stringutil/lib";
    import { loger } from "$lib/stores/logs/logs.svelte";
    import { getPermisosList,getPermisosMessage } from "$lib/permisosutil/lib";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    let {
        db,coninternet,
        useroff,caboff =$bindable({}),
        usuarioid,animales,
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
    let pesajes = $state([])
    let verpesajes = $state([])
    async function exportarTemplateOnline() {
        let csvData = [{
            caravana:"AAA",
            peso:"0",
            fecha:"MM/DD/AAAA"
        }].map(item=>({
            CARAVANA:item.caravana,
            PESO:item.peso,
            FECHA:item.fecha
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Pesajes');
        
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo Pesajes.xlsx",
                directory: Directory.Documents
            });
        } catch(e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo Pesajes.xlsx",
            directory: Directory.Documents
        });
    }
    async function exportarTemplateOffline() {
        let csvData = [{
            caravana:"AAA",
            peso:"0",
            fecha:"MM/DD/AAAA"
        }].map(item=>({
            CARAVANA:item.caravana,
            PESO:item.peso,
            FECHA:item.fecha
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Pesajes');
        
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo Pesajes.xlsx",
                directory: Directory.Documents
            });
        } catch(e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo Pesajes.xlsx",
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
    async function procesarArchivoOnline(pesajesprocesar){
        
        let errores = false
        for(let i = 0;i<pesajesprocesar.length;i++){
            let pe = pesajesprocesar[i]          
            if(pe.fecha == "" || pe.caravana == "" || pe.peso == ""){
                continue
            }
            let ans = animales.filter(a=>a.caravana == pe.caravana && a.cab == caboff.id)
            if(ans.length == 0){
                continue
            }
            let fechaValida = new Date(pe.fecha).getTime()>0
            if(!fechaValida){
                
                continue
            }
            let fecha = new Date(pe.fecha).toISOString().split("T")[0]
            let datapesaje = {
                animal:ans[0].id,
                pesonuevo:pe.peso,
                pesoanterior:ans[0].peso,
                cab:caboff.id,
                fecha
            }

            let datamod = {
                peso:pe.peso,                   
            }
            try {
                let p_idx = pesajes.findIndex(p=>{
                    let mismopesaje = esMismoDia(fecha,p.fecha)
                    mismopesaje &&= p.caravana == pe.caravana
                    return mismopesaje
                })   
                if(p_idx == -1){
                    let record = await pb.collection('pesaje').create(datapesaje);
                    record = { 
                        ...record, 
                        expand: 
                            { animal: {id:ans[0].id,caravana:ans[0].caravana} } 
                    }
                    //await guardarHistorial(pb,ans[0].id)
                    await pb.collection('animales').update(ans[0].id, datamod);
                }
                else{
                    pesajes[p_idx] = {
                        ...pesajes[p_idx],
                        ...datamod
                    }
                    
                    await pb.collection('pesaje').update(pesajes[p_idx].id,datamod);                    
                }
            }
            catch(err){
                console.error(err)
                errores = true
            }
            
        
        }
        return errores
    }
    async function procesarArchivoOffline(pesajeprocesar) {
        let errores = false
        let comandos =[]
        for(let i = 0;i<pesajesprocesar.length;i++){
            let pe = pesajesprocesar[i]          
            if(pe.fecha == "" || pe.caravana == "" || pe.peso == ""){
                continue
            }
            let ans = animales.filter(a=>a.caravana == pe.caravana || a.cab == caboff.id)
            if(ans.length == 0){
                continue
            }
            let fechaValida = new Date(pe.fecha).getTime()>0
            if(!fechaValida){
                
                continue
            }
            let datapesaje = {
                animal:ans[0].id,
                pesonuevo:pe.peso,
                cab:cab.id,
                fecha:pe.fecha?pe.fecha.toISOString().split("T")[0]:""
            }

            let datamod = {
                peso:pe.peso,                   
            }

            try{
                let recordanimal = await pb.collection("animales").getFirstListItem(`caravana="${pe.caravana}" && cab='${cab.id}' && active = True`)
                datapesaje.animal = recordanimal.id
                datapesaje.pesoanterior  = recordanimal.peso
                const record = await pb.collection('pesaje').create(datapesaje);
                await guardarHistorial(pb,recordanimal.id)
                await pb.collection('animales').update(recordanimal.id, datamod);

                
            }
            catch(err){
                console.error(err)
                errores = true
            }
        }
        return {errores, comandos}
    }
    async function procesarArchivo(){
        if(filename == ""){
            Swal.fire("Error","Seleccione un archivo","error")
        }

        let sheetpesajes = wkbk.Sheets.Pesajes
        
        if(!sheetpesajes){
            Swal.fire("Error","Debe subir un archivo válido","error")
        }
        await getDataSQL()
        let pesajesprocesar = []
        let pesajeshashmap = {}
        loading = true
        let errores = false
        for (const [key, value ] of Object.entries(sheetpesajes)) {
            const firstLetter = key.charAt(0);  // Get the first character
            const tail = key.slice(1);
            if(key == "!ref" || key == "!margins" || tail == "1"){
                continue
            }
            if(pesajeshashmap[tail]){
                if(firstLetter=="A"){
                    pesajeshashmap[tail].caravana = value.v
                }
                if(firstLetter=="B"){
                    pesajeshashmap[tail].peso = value.v
                }
                if(firstLetter=="C"){
                    pesajeshashmap[tail].fecha = value.w?value.w:""
                }
                
            }
            else{
                pesajeshashmap[tail]={
                    caravana:'',peso:'',sexo:'',fecha:''
                }
                if(firstLetter=="A"){
                    pesajeshashmap[tail].caravana = value.v
                }
                if(firstLetter=="B"){
                    pesajeshashmap[tail].peso = value.v
                }
                if(firstLetter=="C"){
                    pesajeshashmap[tail].fecha = value.w?value.w:""
                }                
            }
        }
        for (const [key, value ] of Object.entries(pesajeshashmap)) {
            pesajesprocesar.push(value)
        }
        verpesajes = pesajesprocesar.map(p=>p)
        if(coninternet.connected){
            let listapermisos = getPermisosList(caboff.permisos)
            if(!listapermisos[4]){
                Swal.fire("Error permisos",getPermisosMessage(4),"error")
                loading = false
                filename = ""
                wkbk = null
                return 
            }
            if(!listapermisos[2]){
                Swal.fire("Error permisos",getPermisosMessage(2),"error")
                loading = false
                filename = ""
                wkbk = null
                return 
            }
            errores = await procesarArchivoOnline(pesajesprocesar)
            await setPesajesSQL(db,pesajes)
        }
        else{
            Swal.fire("Atención","No tienes conexión a internet, no esta habilitado todavia","warning")
            //let dataprocesar = await procesarArchivoOffline(pesajesprocesar)
            //errores = dataprocesar.errores
            //await setPesajesSQL(db,pesajes)
        }
        if(errores){
            Swal.fire("Error importar","Hubo algún pesaje con errores","error")
        }
        else{
            Swal.fire("Éxito importar","Se lograron importar los datos","success")
        }
        filename = ""
        wkbk = null
        loading = false
    }
    async function getDataSQL(){
        let respesajes = await getPesajesSQL(db)
        pesajes = respesajes.lista
    }
</script>
<div class="space-y-4 grid grid-cols-1 flex justify-center">
    {#if modedebug && verpesajes.length>0}
        <ul>
            {#each verpesajes as vp}
                <li>
                    {JSON.stringify(vp,null,2)}
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
            id="pesaje-upload"
            onchange={(e)=>importarArchivo(e)}
        />
        <label
              for="pesaje-upload"
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

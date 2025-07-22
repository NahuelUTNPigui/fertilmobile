<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import { Filesystem, Directory } from '@capacitor/filesystem';
    import PocketBase from 'pocketbase';
    import Swal from 'sweetalert2';
    
    import categorias from "$lib/stores/categorias";
    import {getObservacionesSQL,setObservacionesSQL} from "$lib/stores/sqlite/dbeventos";
    import { esMismoDia } from "$lib/stringutil/lib";
    import { loger } from "$lib/stores/logs/logs.svelte";
    
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    let {
        db,coninternet,
        useroff,caboff,
        usuarioid,animales,
        //acciones
        aparecerToast
    } = $props()
    let ruta = import.meta.env.VITE_RUTA
    let caber = createCaber()
    let cab = caber.cab
    let loading = $state(false)
    let observaciones = $state([])
    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    let verobs = $state([])
    async  function exportarTemplate(){
        aparecerToast()
        let csvData = [{
            caravana:"AAA",
            categoria:"",
            fecha:"MM/DD/AAAA",
            observacion:"",
            categoria:""
        }].map(item=>({
            CARAVANA: item.caravana,
            CATEGORIA: item.categoria,
            FECHA: item.fecha,
            OBSERVACION: item.observacion,
            CATEGORIA:item.categoria
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Observaciones');
        
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo Observaciones.xlsx",
                directory: Directory.Documents
            });
        } catch(e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo Observaciones.xlsx",
            directory: Directory.Documents
        });
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
    async function procesarArchivoOffline(observacionesprocesa) {
        let errores = false
        let comandos = []
        for(let i = 0;i<observacionesprocesa.length;i++){
            let ob = observacionesprocesa[i]
            let an = animales.filter(a=>a.caravana==ob.caravana)[0]

            let dataadd = {
                animal: an.id,
                categoria: ob.categoria,
                fecha: ob.fecha + " 03:00:00",
                observacion: ob.observacion,
                cab: cab.id,
                active: true,
            }

            let datamod = {
                observacion: ob.observacion,
                categoria: ob.categoria
            }

            try{
                const record = await pb.collection('observaciones').getFirstListItem(`fecha="${ob.fecha + " 03:00:00"}" && animal="${an.id}"`,{});
                await pb.collection('observaciones').update(record.id, datamod);               
            }
            catch(err){
                
                await pb.collection('observaciones').create(dataadd);

            }
        }
        return {errores,comandos}
    }
    async function procesarArchivoOnline(observacionesprocesa) {
        let errores = false
        for(let i = 0;i<observacionesprocesa.length;i++){
            let ob = observacionesprocesa[i]
            if(ob.fecha == "" && ob.caravana == "" && ob.observacion == ""){
                continue
            }
            let ans = animales.filter(a=>a.caravana==ob.caravana && a.cab == caboff.id)    
            if(ans.length == 0){
                
                continue
            }
            let fechaValida = new Date(ob.fecha).getTime()>0
            if(!fechaValida){
                
                continue
            }
            let fecha = new Date(ob.fecha).toISOString().split("T")[0] + " 03:00:00"
            let dataadd = {
                animal: ans[0].id,
                categoria: ob.categoria,
                fecha,
                observacion: ob.observacion,
                cab: caboff.id,
                active: true,
            }

            let datamod = {
                observacion: ob.observacion,
                categoria: ob.categoria
            }
            let o_idx = observaciones.findIndex(o=>{
                let mismaobs = esMismoDia(o.fecha, fecha)
                mismaobs &&= o.animal == ans[0].id
                mismaobs &&= o.active
                return mismaobs
                
            })    
            if(o_idx == -1){
                try{
                    let record = await pb.collection('observaciones').create(dataadd);
                    record = {
                        ...record,
                        expand: {
                            animal: {
                                id: ans[0].id,
                                caravana: ans[0].caravana
                            },
                            cab: {
                                id: caboff.id,
                                nombre: caboff.nombre,
                                user: usuarioid
                            }
                        }
                    }
                    observaciones.push(record);
                }
                catch(err){
                    errores = true
                    console.error( err);
                    
                }
            }
            else{
                try {
                    await pb.collection('observaciones').update(observaciones[o_idx].id, datamod);
                    observaciones[o_idx] = {
                        ...observaciones[o_idx],
                        ...datamod
                    }

                }
                catch (error) {
                    errores = true
                    console.error(error);
                }
                
            }
            
        }
        
        return errores
    }
    async function procesarArchivo(){
        if(filename == ""){
            Swal.fire("Error","Seleccione un archivo","error")
        }

        let sheetobservaciones = wkbk.Sheets.Observaciones
        if(!sheetobservaciones){
            Swal.fire("Error","Debe subir un archivo válido","error")
        }
        
        await getDataSQL()
        let observacionesimport = []
        let observacioneshashmap = {}
        loading = true
        let errores = false
        for (const [key, value ] of Object.entries(sheetobservaciones)) {
            const firstLetter = key.charAt(0);  // Get the first character
            const tail = key.slice(1);
            if(key == "!ref" || key == "!margins" || tail == "1"){
                continue
            }
            if(observacioneshashmap[tail]){
                if(firstLetter=="A"){
                    observacioneshashmap[tail].caravana = value.v
                }
                if(firstLetter=="B"){
                    observacioneshashmap[tail].categoria = value.v.toLocaleLowerCase()
                }
                if(firstLetter=="C"){
                    observacioneshashmap[tail].fecha = value.w
                }
                if(firstLetter=="D"){
                    observacioneshashmap[tail].observacion = value.v
                }
                if(firstLetter=="E"){
                    observacioneshashmap[tail].categoria = value.v
                }
            }
            else{
                observacioneshashmap[tail]={
                     caravana:"", categoria:"", fecha:"", observacion:""
                }
                if(firstLetter=="A"){
                    observacioneshashmap[tail].caravana = value.v
                }
                if(firstLetter=="B"){
                    observacioneshashmap[tail].categoria = value.v.toLocaleLowerCase()
                }
                if(firstLetter=="C"){
                    observacioneshashmap[tail].fecha = value.w
                }
                if(firstLetter=="D"){
                    observacioneshashmap[tail].observacion = value.v
                }
                if(firstLetter=="E"){
                    observacioneshashmap[tail].categoria = value.v
                }
            }
        }
        for (const [key, value ] of Object.entries(observacioneshashmap)) {
            observacionesimport.push(value)
        }
        verobs = observacionesimport.map(o=>o)
        if(coninternet.connected){
            await procesarArchivoOnline(observacionesimport)
            await setObservacionesSQL(db,observaciones)
        }
        else{
            Swal.fire("Atención","No tienes conexión a internet, no esta habilitado todavia","warning")
            //let dataprocesar = await procesarArchivoOffline(observacionesimport)
            //errores = dataprocesar.errores
        }
        
        loading = false
        filename = ""
        wkbk = null
        Swal.fire("Éxito importar","Se lograron importar los datos","success")
    }
    async function getDataSQL() {
        let resobservaciones = await getObservacionesSQL(db)   
        observaciones = resobservaciones.lista
    }
</script>
<div class="space-y-4 grid grid-cols-1 flex justify-center">
    {#if modedebug && verobs}
        <ul>
            {#each verobs as vo}
                {JSON.stringify(vo,null,2)}
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
            id="observaciones-upload"
            onchange={(e)=>importarArchivo(e)}
        />
        <label
              for="observaciones-upload"
              class={`
                w-full flex items-center justify-center px-4 py-4 
                border border-green-300 dark:border-green-600 rounded-md shadow-sm text-lg
                font-medium text-green-700 dark:text-green-300 bg-transparent hover:bg-green-50 
                dark:hover:bg-gray-500 cursor-pointer
              `}
              
        >
              {filename ? filename : 'Seleccionar archivo'}
        </label>
    </div>
    <div class="flex justify-start">
        <button class="btn btn-success text-white" onclick={procesarArchivo} >Procesar</button>
    </div>

</div>

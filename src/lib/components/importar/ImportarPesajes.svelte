<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { onMount } from "svelte";
    import {guardarHistorial} from "$lib/historial/lib"
    let {db,coninternet,useroff,caboff,usuarioid,animales} = $props()

    let ruta = import.meta.env.VITE_RUTA
    let caber = createCaber()
    let cab = caber.cab
    

    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    let loading = $state(false)
    function exportarTemplate(){
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
        
        XLSX.writeFile(wb, 'Modelo pesajes.xlsx');
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
    async function procesarArchivo(){
        if(filename == ""){
            Swal.fire("Error","Seleccione un archivo","error")
        }

        let sheetpesajes = wkbk.Sheets.Pesajes
        
        if(!sheetpesajes){
            Swal.fire("Error","Debe subir un archivo válido","error")
        }
        
        let pesajes = []
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
                    pesajeshashmap[tail].fecha = value.w?new Date(value.w):""
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
                    pesajeshashmap[tail].fecha = value.w?new Date(value.w):""
                }                
            }
        }
        for (const [key, value ] of Object.entries(pesajeshashmap)) {
            pesajes.push(value)
        }
        for(let i = 0;i<pesajes.length;i++){
            let pe = pesajes[i]          

            let datapesaje = {
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
</script>
<div class="space-y-4 grid grid-cols-1 flex justify-center">
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

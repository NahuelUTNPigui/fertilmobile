<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { onMount } from "svelte";
    import { Filesystem, Directory } from '@capacitor/filesystem';
    let {db,coninternet,useroff,caboff,usuarioid,rodeos} = $props()
    let ruta = import.meta.env.VITE_RUTA
    let caber = createCaber()
    let cab = caber.cab
    

    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    
    let loading = $state(false)
    async function exportarTemplate(){
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

        let sheetrodeos = wkbk.Sheets.Rodeos
        console.log(wkbk.Sheets.Rodeos)
        if(!sheetrodeos){
            Swal.fire("Error","Debe subir un archivo válido","error")
        }
        
        let rodeos = []
        let rodeoshashmap = {}
        loading = true
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
            rodeos.push(value)
        }
        for(let i = 0;i<rodeos.length;i++){
            let ro = rodeos[i]

            let dataadd = {
                nombre:ro.nombre,
                active:true,
                delete:false,
                cab:cab.id
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
        filename = ""
        wkbk = null
        loading = false
        Swal.fire("Éxito importar","Se lograron importar los datos","success")
    }
    onMount(async ()=>{
        rodeos = await pb.collection('rodeos').getFullList({
            filter:`active = true && cab ='${cab.id}'`,
            sort: '-nombre',
        })
    })
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

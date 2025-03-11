<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { onMount } from "svelte";
    import { createPer } from "$lib/stores/permisos.svelte";
    import { getPermisosList } from "$lib/permisosutil/lib";
    let ruta = import.meta.env.VITE_RUTA
    let caber = createCaber()
    let cab = caber.cab
    let per = createPer()
    let userpermisos = getPermisosList(per.per.permisos)

    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    let lotes = $state([])
    let loading = $state(false)
    function exportarTemplate(){
        let csvData = [{
            nombre:"",
        }].map(item=>({
            NOMBRE_LOTE:item.nombre,
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Lotes');
        
        XLSX.writeFile(wb, 'Modelo lotes.xlsx');
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
        if(!userpermisos[2]){
            Swal.fire("Error","No tienes permisos de importar","error")
            return
        }
        if(filename == ""){
            Swal.fire("Error","Seleccione un archivo","error")
            return
        }

        let sheetlotes = wkbk.Sheets.Lotes
        
        if(!sheetlotes){
            Swal.fire("Error","Debe subir un archivo válido","error")
            return
        }
        
        let lotes = []
        let loteshashmap = {}
        loading = true
        for (const [key, value ] of Object.entries(sheetlotes)) {
            const firstLetter = key.charAt(0);  // Get the first character
            const tail = key.slice(1);
            if(key == "!ref" || key == "!margins" || tail == "1"){
                continue
            }
            if(loteshashmap[tail]){
                if(firstLetter=="A"){
                    loteshashmap[tail].nombre = value.v
                }
                
            }
            else{
                loteshashmap[tail]={
                    nombre:''
                }
                if(firstLetter=="A"){
                    loteshashmap[tail].nombre = value.v
                }
                
            }
        }
        for (const [key, value ] of Object.entries(loteshashmap)) {
            lotes.push(value)
        }
        for(let i = 0;i<lotes.length;i++){
            let lo = lotes[i]

            let dataadd = {
                nombre:lo.nombre,
                active:true,
                delete:false,
                cab:cab.id
            }

            let datamod = {
                nombre:lo.nombre 
            }

            try{
                const record = await pb.collection('lotes').getFirstListItem(`nombre="${lo.nombre}"`,{});
                console.log("mod")
                await pb.collection('lotes').update(record.id, datamod);               
            }
            catch(err){
                console.log("Add")
                await pb.collection('lotes').create(dataadd);

            }
        }
        filename = ""
        loading = false
        wkbk = null
        Swal.fire("Éxito importar","Se lograron importar los datos","success")
    }
    onMount(async ()=>{
        lotes = await pb.collection('lotes').getFullList({
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
            id="lotes-upload"
            onchange={(e)=>importarArchivo(e)}
        />
        <label
              for="lotes-upload"
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

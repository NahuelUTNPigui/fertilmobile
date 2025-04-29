<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase';
    import Swal from 'sweetalert2';
    import { onMount } from "svelte";
    import categorias from "$lib/stores/categorias";
    let {db,coninternet,useroff,caboff,usuarioid,animales} = $props()
    let ruta = import.meta.env.VITE_RUTA
    let caber = createCaber()
    let cab = caber.cab
    let loading = $state(false)

    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    function exportarTemplate(){
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
        
        XLSX.writeFile(wb, 'Modelo observaciones.xlsx');
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

        let sheetobservaciones = wkbk.Sheets.Observaciones
        if(!sheetobservaciones){
            Swal.fire("Error","Debe subir un archivo válido","error")
        }
        
        let observaciones = []
        let observacioneshashmap = {}
        loading = true
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
                    observacioneshashmap[tail].fecha = value.w?new Date(value.w).toISOString().split("T")[0]:""
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
                    observacioneshashmap[tail].fecha = value.w?new Date(value.w).toISOString().split("T")[0]:""
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
            observaciones.push(value)
        }
        for(let i = 0;i<observaciones.length;i++){
            let ob = observaciones[i]
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
        loading = false
        filename = ""
        wkbk = null
        Swal.fire("Éxito importar","Se lograron importar los datos","success")
    }
    onMount(async ()=>{
        const observaciones = await pb.collection('observaciones').getFullList({
            filter:`active = true && cab ='${cab.id}'`
        })
        //animales = await pb.collection('animales').getFullList({
        //    filter:`delete = false && cab ='${cab.id}'`,
        //}) 
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

<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase';
    import Swal from 'sweetalert2';
    import { onMount } from "svelte";
    let ruta = import.meta.env.VITE_RUTA
    let caber = createCaber()
    let cab = caber.cab
    let animales = $state([])
    

    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    let loading = $state(false)
    function exportarTemplate(){
        let csvData = [{
            fecha:"AAAA/MM/DD",
            observacion:"",
            caravana:"AAA",
            categoria:"Vaca/Vaquillona",
            prenada:"preñada/dudosa/vacia",
            tipo:"eco/tacto",
            nombreveterinario:""
        }].map(item=>({
            FECHA: item.fecha,
            OBSERVACION: item.observacion,
            CARAVANA: item.caravana,
            CATEGORIA: item.categoria,
            PREÑADA: item.prenada,
            TIPO_TACTO: item.tipo,
            NOMBRE_VETERINARIO: item.nombreveterinario
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Tactos');
        
        XLSX.writeFile(wb, 'Modelo tactos.xlsx');
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

        let sheettactos = wkbk.Sheets.Tactos
        if(!sheettactos){
            Swal.fire("Error","Debe subir un archivo válido","error")
        }
        
        let tactos = []
        let tactoshashmap = {}
        loading = true
        for (const [key, value ] of Object.entries(sheettactos)) {
            const firstLetter = key.charAt(0);  // Get the first character
            const tail = key.slice(1);
            if(key == "!ref" || key == "!margins" || tail == "1"){
                continue
            }
            if(tactoshashmap[tail]){
                if(firstLetter=="A"){
                    tactoshashmap[tail].fecha = new Date(value.w).toISOString().split("T")[0]
                }
                if(firstLetter=="B"){
                    tactoshashmap[tail].observacion = value.v
                }
                if(firstLetter=="C"){
                    tactoshashmap[tail].caravana = value.v
                }
                if(firstLetter=="D"){
                    tactoshashmap[tail].categoria = value.v.toLowerCase()
                }
                if(firstLetter=="E"){
                    if (value.v == "preñada"){
                        tactoshashmap[tail].prenada = 2
                    }
                    else if(value.v == "dudosa"){
                        tactoshashmap[tail].prenada = 1
                    }
                    else{
                        tactoshashmap[tail].prenada = 0
                    }
                }
                if(firstLetter=="F"){
                    tactoshashmap[tail].tipo = value.v.toLowerCase()
                }
                if(firstLetter=="G"){
                    tactoshashmap[tail].nombreveterinario = value.v
                }
            }
            else{
                tactoshashmap[tail]={
                    fecha:"", observacion:"", caravana:"", categoria:"", prenada:"", tipo:"", nombreveterinario:""
                }
                if(firstLetter=="A"){
                    tactoshashmap[tail].fecha = new Date(value.w).toISOString().split("T")[0]
                }
                if(firstLetter=="B"){
                    tactoshashmap[tail].observacion = value.v
                }
                if(firstLetter=="C"){
                    tactoshashmap[tail].caravana = value.v
                }
                if(firstLetter=="D"){
                    tactoshashmap[tail].categoria = value.v.toLowerCase()
                }
                if(firstLetter=="E"){
                    if (value.v == "preñada"){
                        tactoshashmap[tail].prenada = 2
                    }
                    else if(value.v == "dudosa"){
                        tactoshashmap[tail].prenada = 1
                    }
                    else{
                        tactoshashmap[tail].prenada = 0
                    }
                }
                if(firstLetter=="F"){
                    tactoshashmap[tail].tipo = value.v.toLowerCase()
                }
                if(firstLetter=="G"){
                    tactoshashmap[tail].nombreveterinario = value.v
                }
            }
        }
        for (const [key, value ] of Object.entries(tactoshashmap)) {
            tactos.push(value)
        }
        for(let i = 0;i<tactos.length;i++){
            let ta = tactos[i]
            let an = animales.filter(a=>a.caravana==ta.caravana)[0]
            //Agregar Tacto si no existe
            let dataadd = {
                fecha: ta.fecha + " 03:00:00",
                active: true,
                observacion: ta.observacion,
                animal: an.id,
                categoria: ta.categoria,
                prenada: ta.prenada,
                tipo: ta.tipo,
                nombreveterinario: ta.nombreveterinario,
                cab: cab.id
            }

            let datamod = {
                observacion: ta.observacion,
                prenada: ta.prenada,
                tipo: ta.tipo,
                nombreveterinario: ta.nombreveterinario
            }

            try{
                const record = await pb.collection('tactos').getFirstListItem(`fecha="${ta.fecha + " 03:00:00"}" && animal="${an.id}"`,{});
                await pb.collection('tactos').update(record.id, datamod);               
                await pb.collection("animales").update(an.id,{prenada:ta.prenada})
            }
            catch(err){
                
                await pb.collection('tactos').create(dataadd);
                await pb.collection("animales").update(an.id,{prenada:ta.prenada})

            }
        }
        filename = ""
        wkbk = null
        loading = false
        Swal.fire("Éxito importar","Se lograron importar los datos","success")
    }
    onMount(async ()=>{
        const tactos = await pb.collection('tactos').getFullList({
            filter:`active = true && cab ='${cab.id}'`
        })
        animales = await pb.collection('animales').getFullList({
            filter:`delete = false && cab ='${cab.id}'`,
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
            id="tactos-upload"
            onchange={(e)=>importarArchivo(e)}
        />
        <label
              for="tactos-upload"
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

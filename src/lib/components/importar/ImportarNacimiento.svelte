<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { onMount } from "svelte";
    let ruta = import.meta.env.VITE_RUTA
    let caber = createCaber()
    let cab = caber.cab
    let loading = $state(false)

    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    let lotes = $state([])
    let rodeos = $state([])
    let animales = $state([])
    let padres = $state([])

    function exportarTemplate(){
        let csvData = [{
            caravana:"AAA",
            peso:"0",
            sexo:"H/M",
            rodeo:"",
            lote:"",
            fechanacimiento:"AAAA/MM/DD",
            nombremadre:"",
            nombrepadre:"",
            observaciones:""
        }].map(item=>({
            CARAVANA: item.caravana,
            PESO: item.peso,
            SEXO: item.sexo,
            RODEO: item.rodeo,
            LOTE: item.lote,
            fechanacimientoIMIENTO: item.fechanacimiento,
            CARAVANA_MADRE: item.nombremadre,
            CARAVANA_PADRE: item.nombrepadre,
            OBSERVACIONES:item.observaciones
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Animales');
        
        XLSX.writeFile(wb, 'Modelo nacimientos.xlsx');
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

        let sheetanimales = wkbk.Sheets.Animales
        if(!sheetanimales){
            Swal.fire("Error","Debe subir un archivo válido","error")
        }
        
        let animales = []
        let animaleshashmap = {}
        loading = true
        for (const [key, value ] of Object.entries(sheetanimales)) {
            const firstLetter = key.charAt(0);  // Get the first character
            const tail = key.slice(1);
            if(key == "!ref" || key == "!margins" || tail == "1"){
                continue
            }
            if(animaleshashmap[tail]){
                if(firstLetter=="A"){
                    animaleshashmap[tail].caravana = value.v
                }
                if(firstLetter=="B"){
                    animaleshashmap[tail].peso = value.v
                }
                if(firstLetter=="C"){
                    animaleshashmap[tail].sexo = value.v
                }
                if(firstLetter=="D"){
                    animaleshashmap[tail].rodeo = value.v
                }
                if(firstLetter=="E"){
                    animaleshashmap[tail].lote = value.v
                }
                if(firstLetter=="F"){
                    animaleshashmap[tail].fechanacimiento = new Date(value.w).toISOString().split("T")[0]
                }
                if(firstLetter=="G"){
                    animaleshashmap[tail].nombremadre = value.v
                }
                if(firstLetter=="H"){
                    animaleshashmap[tail].nombrepadre = value.v
                }
                if(firstLetter=="I"){
                    animaleshashmap[tail].observaciones = value.v
                }
            }
            else{
                animaleshashmap[tail]={
                    caravana:'',peso:'',sexo:'',rodeo:'',lote:"",fechanacimiento:"",nombremadre:"",nombrepadre:"",observaciones:""
                }
                if(firstLetter=="A"){
                    animaleshashmap[tail].caravana = value.v
                }
                if(firstLetter=="B"){
                    animaleshashmap[tail].peso = value.v
                }
                if(firstLetter=="C"){
                    animaleshashmap[tail].sexo = value.v
                }
                if(firstLetter=="D"){
                    animaleshashmap[tail].rodeo = value.v
                }
                if(firstLetter=="E"){
                    animaleshashmap[tail].lote = value.v
                }
                if(firstLetter=="F"){
                    animaleshashmap[tail].fechanacimiento = new Date(value.w).toISOString().split("T")[0]
                }
                if(firstLetter=="G"){
                    animaleshashmap[tail].nombremadre = value.v
                }
                if(firstLetter=="H"){
                    animaleshashmap[tail].nombrepadre = value.v
                }
                if(firstLetter=="I"){
                    animaleshashmap[tail].observaciones = value.v
                }          
            }
        }
        for (const [key, value ] of Object.entries(animaleshashmap)) {
            animales.push(value)
        }
        for(let i = 0;i<animales.length;i++){
            let an = animales[i]
            let conlote = false
            let lote = lotes.filter(l=>l.nombre==an.lote)[0]
            let rodeo = rodeos.filter(r=>r.nombre==an.rodeo)[0]
            let padre = padres.filter(p=>p.caravana==an.nombrepadre)[0]
            let madre = padres.filter(m=>m.caravana==an.nombremadre)[0]
            
            // Agregar animal si no existe y nacimiento
            let dataadd = {
                caravana:an.caravana,
                active:true,
                delete:false,
                sexo:an.sexo,
                peso:an.peso,
                fechanacimiento: an.fechanacimiento+ " 03:00:00",
                nombremadre: an.nombremadre,
                nombrepadre: an.nombrepadre,
                cab:cab.id
            }
            //Modificar nacimiento cuando existe
            let datanacimiento = {
                fecha:an.fechanacimiento + " 03:00:00",
                nombremadre: an.nombremadre,
                nombrepadre: an.nombrepadre,
                observacion:an.observaciones,
                cab:cab.id
            }
            
            if(lote){
                dataadd.lote = lote.id
            }
            if(rodeo){
                dataadd.rodeo = rodeo.id
            }

            if(padre){
                datanacimiento.padre=padre.id
            }
            if(madre){
                datanacimiento.madre = madre.id
            }
            
            try{
                
                const record = await pb.collection('animales').getFirstListItem(`caravana="${an.caravana}"`,{});
                if(record.nacimiento != ""){
                    try{
                        await pb.collection('nacimientos').update(record.nacimiento,datanacimiento)
                    }
                    catch(err){
                        console.error(err)
                    }
                    
                }
                else{
                    try{
                        
                        const recordnacimiento = await pb.collection('nacimientos').create(datanacimiento)
                        await pb.collection('animales').update(record.id,{
                            fechanacimiento: an.fechanacimiento+ " 03:00:00",
                            nacimiento : recordnacimiento.id
                        })
                    }
                    catch(err){
                        console.error(err)
                    }
                    
                }
            }
            catch(err){
                const recordnacimiento = await pb.collection('nacimientos').create( datanacimiento);
                dataadd.nacimiento = recordnacimiento.id
                await pb.collection('animales').create(dataadd);
            }
        }
        filename = ""
        loading = false
        wkbk = null
        Swal.fire("Éxito importar","Se lograron importar los datos","success")
        
    }
    onMount(async ()=>{
        rodeos = await pb.collection('rodeos').getFullList({
            filter:`active = true && cab ='${cab.id}'`,
            sort: '-nombre',
        });
        
        lotes = await pb.collection('lotes').getFullList({
            filter:`active = true && cab ='${cab.id}'`,
            sort: '-nombre',
        });
        animales = await pb.collection('animales').getFullList({
            filter:`delete = false && cab ='${cab.id}'`,
        })

        padres = await pb.collection('animales').getFullList({
            filter:`delete = false && cab ='${cab.id}'`
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
            id="nacimiento-upload"
            onchange={(e)=>importarArchivo(e)}
        />
        <label
              for="nacimiento-upload"
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

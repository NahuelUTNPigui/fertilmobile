<script>
    //LAburar nacimientos
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { onMount } from "svelte";
    import cuentas from '$lib/stores/cuentas';
    import categorias from "$lib/stores/categorias";
    let {animales,animalesusuario} = $props()
    import{verificarNivelCantidad} from "$lib/permisosutil/lib"
    let ruta = import.meta.env.VITE_RUTA
    let caber = createCaber()
    let cab = caber.cab
    let usuarioid = $state("")
    let loading = $state(false)

    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    let lotes = $state([])
    let rodeos = $state([])
    let nacimientos = $state([])
    let padres = $state([])
    let madres = $state([])

    function exportarTemplate(){
        let csvData = [{
            caravana:"AAA",
            peso:"0",
            sexo:"H/M",
            rodeo:"",
            lote:"",
            fechanacimiento:"MM/DD/AAAA",
            nombremadre:"",
            nombrepadre:"",
            observaciones:"",
            categoria:""
        }].map(item=>({
            CARAVANA: item.caravana,
            PESO: item.peso,
            SEXO: item.sexo,
            RODEO: item.rodeo,
            LOTE: item.lote,
            FECHANACIMIENTO: item.fechanacimiento,
            CARAVANA_MADRE: item.nombremadre,
            CARAVANA_PADRE: item.nombrepadre,
            OBSERVACIONES:item.observaciones,
            CATEGORIA:item.categoria
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
        
        let nacimientos = []
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
                    animaleshashmap[tail].fechanacimiento = value.w?new Date(value.w):""
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
                if(firstLetter=="J"){
                    animaleshashmap[tail].categoria = value.v
                }
            }
            else{
                animaleshashmap[tail]={
                    caravana:'',peso:'',sexo:'',rodeo:'',lote:"",fechanacimiento:"",nombremadre:"",nombrepadre:"",observaciones:"",categoria:""
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
                    animaleshashmap[tail].fechanacimiento = value.w?new Date(value.w):""
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
                if(firstLetter=="J"){
                    animaleshashmap[tail].categoria = value.v
                }      
            }
        }
        let nuevoanimales = 0
        let errornuevoanimales = false
        for (const [key, value ] of Object.entries(animaleshashmap)) {
            nacimientos.push(value)
            let conocido = animales.filter(a=>a.caravana == value.caravana).length == 0
            if(!conocido ){
                nuevoanimales += 1
            }
        }
        let verificar = await verificarNivelCantidad(cab.id,nuevoanimales)
        if(!verificar){
            errornuevoanimales = true
            filename = ""
            loading = false
            wkbk = null
            Swal.fire("Error importar","No tienes el plan para agregar mas animales","error")
            return 
            
        }
        for(let i = 0;i<nacimientos.length;i++){
            let an = nacimientos[i]
            let conlote = false
            let lote = lotes.filter(l=>l.nombre==an.lote)[0]
            let rodeo = rodeos.filter(r=>r.nombre==an.rodeo)[0]
            let categoria = categorias.filter(c=>c.id==an.categoria || c.nombre==an.categoria)[0]
            let padre = animales.filter(p=>p.caravana==an.nombrepadre)
            let madre = animales.filter(m=>m.caravana==an.nombremadre)
            
            // Agregar animal si no existe y nacimiento
            let dataadd = {
                caravana:an.caravana,
                active:true,
                delete:false,
                sexo:an.sexo,
                peso:an.peso,
                fechanacimiento: an.fechanacimiento?an.fechanacimiento.toISOString().split("T")[0]+ " 03:00:00":"",
                nombremadre:madre.length>0?madre[0].caravana:an.nombremadre,
                nombrepadre: padre.length>0?padre[0].caravana:an.nombrepadre,
                cab:cab.id
            }
            //Modificar nacimiento cuando existe
            let datanacimiento = {
                fecha:an.fechanacimiento?an.fechanacimiento.toISOString().split("T")[0]+ " 03:00:00":"",
                nombremadre:madre.length>0?madre[0].caravana:an.nombremadre,
                nombrepadre: padre.length>0?padre[0].caravana:an.nombrepadre,
                observacion:an.observaciones,
                cab:cab.id
            }
            
            if(lote){
                dataadd.lote = lote.id
            }
            if(rodeo){
                dataadd.rodeo = rodeo.id
            }
            if(categoria){
                dataadd.categoria = categoria.id
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
                
                if(!errornuevoanimales){
                    const recordnacimiento = await pb.collection('nacimientos').create( datanacimiento);
                    dataadd.nacimiento = recordnacimiento.id
                    await pb.collection('animales').create(dataadd);
                }
                
            }
        }
        filename = ""
        loading = false
        wkbk = null
        Swal.fire("Éxito importar","Se lograron importar los datos","success")
        
    }
    onMount(async ()=>{
        let pb_json =  JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.record.id
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

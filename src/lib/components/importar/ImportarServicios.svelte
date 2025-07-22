<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { Filesystem, Directory } from '@capacitor/filesystem';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { onMount } from "svelte";
    import {guardarHistorial} from "$lib/historial/lib"
    import {addDays} from "$lib/stringutil/lib"
    import categorias from "$lib/stores/categorias";
    import { getServiciosSQL,setServiciosSQL } from "$lib/stores/sqlite/dbeventos";
    import { esMismoDia } from "$lib/stringutil/lib";
    import { loger } from "$lib/stores/logs/logs.svelte";
    
    
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    let {
        db,coninternet,useroff,
        caboff,usuarioid,animales,
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
    let servicios = $state([])
    let verser = $state([])
    async function exportarTemplateOffline(){
        let csvData = [{
            madre:"AAA",
            fechadesde:"MM/DD/AAAA",
            fechahasta:"MM/DD/AAAA",
            padres:"AAA,BBB,CCC",
            observacion:"",
            categoria:""

        }].map(item=>({
            MADRE:item.madre,
            FECHA_DESDE:item.fechadesde,
            FECHA_HASTA:item.fechahasta,
            PADRES:item.padres,
            OBSERVACION:item.observacion,
            CATEGORIA:item.categoria
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Servicios');
        
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo Servicios.xlsx",
                directory: Directory.Documents
            });
        } catch(e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo Servicios.xlsx",
            directory: Directory.Documents
        });
    }
    async function exportarTemplateOnline() {
        let csvData = [{
            madre:"AAA",
            fechadesde:"MM/DD/AAAA",
            fechahasta:"MM/DD/AAAA",
            padres:"AAA,BBB,CCC",
            observacion:"",
            categoria:""

        }].map(item=>({
            MADRE:item.madre,
            FECHA_DESDE:item.fechadesde,
            FECHA_HASTA:item.fechahasta,
            PADRES:item.padres,
            OBSERVACION:item.observacion,
            CATEGORIA:item.categoria
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Servicios');
        
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo Servicios.xlsx",
                directory: Directory.Documents
            });
        } catch(e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo Servicios.xlsx",
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
    async function procesarArchivoOffline(serviciosprocesar){
        let comandos = []
        let errores = false
        
        for(let i = 0;i<serviciosprocesar.length;i++){
            let ser = serviciosprocesar[i]
            
            if(ser.madre != "" && ser.fechadesde != "" && ser.padres !=""){
                let madres = animales.filter(a=>a.caravana==ser.madre && a.cab == caboff.id)
                let padreslista = ser.padres.split(",")
                let padres = padreslista.map(p=>{
                    let padre = ""
                    for(let i=0;i<animales.length;i++){
                        if(animales[i].cab == caboff.id && animales[i].sexo == "M" && animales[i].caravana==p){
                            return animales[i].id
                        }
                    }
                    return padre
                })
                
                if(madres.length > 0 && padres.length > 0){
                    let madre = madres[0].id
                    let padre = padres.join()
                    let categoria = categorias.filter(c=>c.id==an.categoria.toLowerCase())[0]
                    try{
                        let dataser = {
                            fechadesde : new Date(ser.fechadesde).toISOString().split("T")[0] + " 03:00:00",
                            fechaparto: addDays(new Date(ser.fechadesde).toISOString().split("T")[0],280).toISOString().split("T")[0]+" 03:00:00",
                            observacion: ser.observacion,
                            madre:madre,
                            padres:padre,
                            active:true,
                            cab:cab.id
                        }
                        
                        if(ser.fechahasta != ""){
                            dataser.fechahasta = ser.fechahasta.toISOString().split("T")[0] + " 03:00:00"
                        }   
                        if(categoria){
                            dataser.categoria = categoria.id
                        }
                        const record = await pb.collection("servicios").create(dataser)
                    }
                    catch(err){
                        console.error(err)
                        errores = true
                    }
                }
            }

                
        }
        let dataprocesar = {
            comandos,
            errores
        }
        return dataprocesar
    }
    async function procesarArchivoOnline(serviciosprocesar){
        let errores = false
        
        for(let i = 0;i<serviciosprocesar.length;i++){
            let ser = serviciosprocesar[i]
            
            if(ser.madre != "" && ser.fechadesde != "" && ser.padres !=""){
                let madres = animales.filter(a=>a.caravana==ser.madre && a.cab == caboff.id)
                let padreslista = ser.padres.split(",")
                let padres = padreslista.map(p=>{
                    let padre = ""
                    for(let i=0;i<animales.length;i++){
                        if(animales[i].cab == caboff.id && animales[i].sexo == "M" && animales[i].caravana==p){
                            return animales[i].id
                        }
                    }
                    return padre
                })
                let esFechaValida  = new Date(ser.fechadesde).getTime() > 0
                if(esFechaValida && madres.length > 0 && padres.length > 0 ){
                    let madre = madres[0].id
                    let padre = padres.join()
                    let categoria = categorias.filter(c=>c.id==ser.categoria.toLowerCase())[0]
                    let fdesde = new Date(ser.fechadesde)
                    try{
                        let dataser = {
                            fechadesde : fdesde.toISOString().split("T")[0] + " 03:00:00",
                            fechaparto: addDays(ser.fechadesde,280).toISOString().split("T")[0]+" 03:00:00",
                            observacion: ser.observacion,
                            madre:madre,
                            padres:padre,
                            active:true,
                            categoria,
                            cab:caboff.id
                        }
                        let datamod={
                            observacion: ser.observacion,
                            padres:padre,
                        }
                        if(ser.fechahasta != ""){
                            let fechahastaValida = new Date(ser.fechahasta).getTime() > 0   
                            if(!fechahastaValida){
                                dataser.fechahasta = new Date(ser.fechahasta).toISOString().split("T")[0] + " 03:00:00"
                                datamod.fechahasta = new Date(ser.fechahasta).toISOString().split("T")[0] + " 03:00:00"
                            }
                            
                        }   
                        if(categoria){
                            dataser.categoria = categoria.id
                            datamod.categoria = categoria.id
                        }
                        
                        let s_idx = servicios.findIndex(s=>s.madre==madre  && esMismoDia(s.fechadesde,dataser.fechadesde) && s.active)
                        //Crear servicio
                        if(s_idx == -1){
                            let recordser = await pb.collection("servicios").create(dataser)    
                            recordser = {
                                ...recordser,
                                expand:{
                                    madre:{id:recordser.madre,caravana:madres[0].caravana},
                                    cab:{id:recordser.cab, nombre:caboff.nombre},
                                }
                            }
                            servicios.push(recordser)
                        }

                        else{
                            await pb.collection("servicios").update(servicios[s_idx].id,datamod)
                            servicios[s_idx] = {
                                ...servicios[s_idx],
                                ...datamod,
                                
                            }
                        }
                        
                    }
                    catch(err){
                        console.error(err)
                        errores = true
                    }
                }
            }

                
        }
        return errores
    } 
    async function procesarArchivo(){
        if(filename == ""){
            Swal.fire("Error","Seleccione un archivo","error")
        }

        //Que pasa si le cambia el nombre a la pestaña
        let sheetiser = wkbk.Sheets.Servicios
        if(!sheetiser){
            Swal.fire("Error","Debe subir un archivo válido","error")
        }
        await getDataSQL()
        let serviciosprocesar = []
        let serhash = {}
        loading = true
        let errores = false
        for (const [key, value ] of Object.entries(sheetiser)) {
            const firstLetter = key.charAt(0);  // Get the first character
            const tail = key.slice(1);
            if(key == "!ref" || key == "!margins" || tail == "1"){
                continue
            }
            if(serhash[tail]){
                //madre
                if(firstLetter=="A"){
                    serhash[tail].madre = value.v
                }
                //fecha desde
                if(firstLetter=="B"){
                    serhash[tail].fechadesde = value.w?value.w:""
                }
                //fecha hasta
                if(firstLetter=="C"){
                    serhash[tail].fechahasta = value.w?value.w:""
                }
                //padres
                if(firstLetter=="D"){
                    serhash[tail].padres = value.v
                }
                //observacion
                if(firstLetter=="E"){
                    serhash[tail].observacion = value.v
                }
                //categoria
                if(firstLetter=="F"){
                    serhash[tail].categoria = value.v
                }
            }
            else{
                serhash[tail] = {
                    madre:"",fechadesde:"",fechahasta:"",padres:"",observacion:"",categoria:""
                }
                //madre
                if(firstLetter=="A"){
                    serhash[tail].madre = value.v
                }
                //fecha desde
                if(firstLetter=="B"){   
                    serhash[tail].fechadesde = value.w?value.w:""
                }
                //fecha hasta
                if(firstLetter=="C"){
                    serhash[tail].fechahasta = value.w?value.w:""
                }
                //padres
                if(firstLetter=="D"){
                    serhash[tail].padres = value.v
                }
                //observacion
                if(firstLetter=="E"){
                    serhash[tail].observacion = value.v
                }
                //categoria
                if(firstLetter=="F"){
                    serhash[tail].categoria = value.v
                }
            }
        }
        for (const [key, value ] of Object.entries(serhash)) {
            serviciosprocesar.push(value)
        }
        verser = serviciosprocesar.map(s=>s)
        if(coninternet.connected){
            errores = await procesarArchivoOnline(serviciosprocesar)
            await setServiciosSQL(db,servicios)
        }
        else{
            Swal.fire("Atención","No tienes conexión a internet, no esta habilitado todavia","warning")
            //let dataprocesar = await procesarArchivoOffline(serviciosprocesar)
            //errores = dataprocesar.errores
        }
        
        filename = ""
        wkbk = null
        loading = false
        if(errores){
            Swal.fire("Error servicios","Hubo algun error en algun servico","error")
        }
        else{
            Swal.fire("Éxito servicios","Se lograron registrar todos los servicios","success")
        }
    }
    async function getLocalSQL() {
        let resservicios = await getServiciosSQL(db)
        servicios = resservicios.lista
    }
    async function getDataSQL(){
        await getLocalSQL()
    }
</script>
<div class="space-y-4 grid grid-cols-1 flex justify-center">
    {#if modedebug && verser}
        <ul>
            {#each verser as vs}
                <li>
                    {JSON.stringify(vs,null,2)}
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
            id="servicio-upload"
            onchange={(e)=>importarArchivo(e)}
        />
        <label
            for="servicio-upload"
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
<script>
    import { Filesystem, Directory } from '@capacitor/filesystem';
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    
    import {guardarHistorial} from "$lib/historial/lib"
    import {addDays, generarIDAleatorio} from "$lib/stringutil/lib"
    import { esMismoDia } from '$lib/stringutil/lib';
    //offline
    import {concatComandosSQL} from "$lib/stores/sqlite/dbcomandos"
    import {
        getInseminacionesSQL,
        setInseminacionesSQL,
        
    } from "$lib/stores/sqlite/dbeventos"
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
    let inseminaciones = $state([])
    let verinseminaciones = $state([])
    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    let loading = $state(false)


    async function exportarTemplate(){
        aparecerToast()
        let csvData = [{
            madre:"AAA",
            pajuela:"AAA",
            fecha:"MM/DD/AAAA",
            observacion:""

        }].map(item=>({
            MADRE:item.madre,
            PAJUELA:item.pajuela,
            FECHA:item.fecha,
            OBSERVACION:item.observacion
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Inseminaciones');
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo inseminaciones.xlsx",
                directory: Directory.Documents
            });
        } catch(e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo inseminaciones.xlsx",
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
    async function procesarOffline(inseminacionesprocesar) {
        let comandos = []
        for(let i = 0;i<inseminacionesprocesar.length;i++){
            let ins = inseminacionesprocesar[i]
            if(ins.madre != "" && ins.fecha != "" && ins.pajuela !=""){
                try{
                    //let recordmadre = await pb.collection("animales").getFirstListItem(`caravana="${ins.madre}" && cab='${cab.id}' && active = True`)
                    //let recordspadre = await pb.collection("animales").getList(1,1,{
                    //    filter:`caravana="${ins.pajuela}" && cab='${cab.id}' && active = True`,
                    //    skipTotal:true
                    //})
                    let recordmadre = animales.filter(m=>m.caravana == ins.madre)[0]
                    let recordspadre = animales.filter(m=>m.caravana == ins.pajuela)[0]
                    let idprov = "nueva_ins_"+generarIDAleatorio()
                    
                    let datains = {
                        id:idprov,
                        animal:recordmadre.id,
                        categoria:recordmadre.categoria,
                        pajuela:ins.pajuela,
                        padre:recordspadre.items.length!=0?recordspadre.items[0].id:"",
                        fechaparto:addDays(ins.fecha,280).toISOString().split("T")[0]+" 03:00:00",
                        fechainseminacion:ins.fecha.toISOString().split("T")[0]+" 03:00:00",
                        active:true,
                        cab:caboff.id,
                        observacion:ins.observacion
                    }
                    
                    inseminaciones.push(datains)
                    let nuevamadre = recordmadre.id.split("_").length>1
                    let nuevopadre = recordspadre.items.length!=0?recordspadre.items[0].id.split("_").length>1:false
                    let comando = {
                        tipo:"add",
                        coleccion:"inseminacion",
                        data:{...datains},
                        hora:Date.now(),
                        prioridad:0,
                        idprov,    
                        camposprov:`${(nuevamadre && nuevopadre)?"madre,padre":nuevamadre?"madre":nuevopadre?"padre":""}`
                    }
                    comandos.push(comando)
                    

                }
                catch(err){
                    console.error(err)
                }    
            }
        }
    }
    async function procesarOnline(inseminacionesprocesar) {
        let errores = false

        for(let i = 0;i<inseminacionesprocesar.length;i++){
            let ins = inseminacionesprocesar[i]

            
            if(ins.madre != "" && ins.fecha != "" && ins.pajuela !=""){
                try{

                    let lista_madre = animales.filter(m=>m.caravana == ins.madre && m.cab == caboff.id)
                    if(lista_madre.length == 0){
                        continue
                    }

                    let recordmadre = lista_madre[0]
                    let lista_padre = animales.filter(p=>p.caravana == ins.pajuela && p.cab == caboff.id)
                    
                    let fechaValida = new Date(ins.fecha).getTime() > 0
                    if(!fechaValida){
                        continue
                    }


                    //let recordspadre = await pb.collection("animales").getList(`caravana="${ins.pajuela}" && cab='${cab.id}' && active = True`)
                    let datains = {
                        animal:recordmadre.id,
                        categoria:recordmadre.categoria,
                        pajuela:ins.pajuela,
                        padre:lista_padre.length!=0?lista_padre[0].id:"",
                        fechaparto:addDays(new Date(ins.fecha),280).toISOString().split("T")[0]+" 03:00:00",
                        fechainseminacion:new Date(ins.fecha).toISOString().split("T")[0]+" 03:00:00",
                        active:true,
                        cab:caboff.id,
                        observacion:ins.observacion
                    }

                    let datamod = {
                        observacion:ins.observacion,
                        pajuela:ins.pajuela
                    }
 
                    let i_idx = inseminaciones.findIndex(i=>{
                        let mismains = i.animal == recordmadre.id
                        mismains &&= esMismoDia(i.fechainseminacion, ins.fecha) 
                        mismains &&= i.active
                        return mismains
                    })

                    if(i_idx == -1){

                        let record = await pb.collection("inseminacion").create(datains)

                        record = {
                            ...record,
                            expand:{
                                animal:{id:recordmadre.id,caravana:recordmadre.caravana},
                            }
                        }
                       
                        inseminaciones.push(record)
                  
                    }
                    else{
                        await pb.collection("inseminacion").update(inseminaciones[i_idx].id, datamod)
                        inseminaciones[i_idx] = {
                            ...inseminaciones[i_idx],
                            ...datamod
                        }
                    }
                    

                }
                catch(err){
                    if(modedebug){
                        loger.addTextError("Error en: "+ins.madre)
                    }
                    errores = true
                    console.error(err)
                }    
            }
        }
        return errores
    }
    async function procesarArchivo(){
        if(filename == ""){
            Swal.fire("Error","Seleccione un archivo","error")
        }

        let sheetins = wkbk.Sheets.Inseminaciones
        if(!sheetins){
            Swal.fire("Error","Debe subir un archivo válido","error")
        }
        //Solo cuando lo necesito traigo todos los datos
        await getDataSQL()
        let inseminacionesprocesar = []
        let inshash = {}
        loading = true
        for (const [key, value ] of Object.entries(sheetins)) {
            const firstLetter = key.charAt(0);  // Get the first character
            const tail = key.slice(1);
            if(key == "!ref" || key == "!margins" || tail == "1"){
                continue
            }
            if(inshash[tail]){
                if(firstLetter=="A"){
                    inshash[tail].madre = value.v
                }
                if(firstLetter=="B"){
                    inshash[tail].pajuela = value.v
                }
                if(firstLetter=="C"){
                    inshash[tail].fecha = value.w
                }
                if(firstLetter=="D"){
                    inshash[tail].observacion = value.v
                }
            }
            else{
                inshash[tail] = {
                    madre:"",pajuela:"",fecha:"",observacion:""
                }
                if(firstLetter=="A"){
                    inshash[tail].madre = value.v
                }
                if(firstLetter=="B"){
                    inshash[tail].pajuela = value.v
                }
                if(firstLetter=="C"){
                    inshash[tail].fecha = value.w
                }
                if(firstLetter=="D"){
                    inshash[tail].observacion = value.v
                }
            }
        }
        for (const [key, value ] of Object.entries(inshash)) {
            inseminacionesprocesar.push(value)
        }
        verinseminaciones = inseminacionesprocesar.map(i=>i)
        let errores = false
        if(coninternet.connected){
            errores = await procesarOnline(inseminacionesprocesar)
            await setInseminacionesSQL(db,inseminaciones)
            
        }
        else{
            Swal.fire("Atención","No tienes conexión a internet, no esta habilitado todavia","warning")
            //let comandos = await procesarOffline(inseminacionesprocesar)
            //await concatComandosSQL(db,comandos)
            //await setInseminacionesSQL(db,inseminaciones)
        }
        
        filename = ""
        wkbk = null
        loading = false
        if(errores){
            Swal.fire("Éxito importar","Se lograron importar los datos","success")
        }
        else{
            Swal.fire("Error importar","No se lograron importar todos los datos","error")
        }
        
    }
    async function updateLocalSQL() {
        inseminaciones = await updateLocalInseminacionesSQL(db,pb,caboff.id)
    }
    async function getLocalSQL() {
        let resinseminaciones = await getInseminacionesSQL(db)
        //No lo filtro porque 
        inseminaciones = resinseminaciones.lista

    }
    async function getDataSQL() {
        //Creo que se podia hacer una comprobacion
        //de actualizacion de datos por tiempo
        await getLocalSQL()
    }
</script>
<div class="space-y-4 grid grid-cols-1 flex justify-center">
    {#if modedebug && verinseminaciones}
        <ul>
            {#each verinseminaciones as vs}
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
            id="inseminacion-upload"
            onchange={(e)=>importarArchivo(e)}
        />
        <label
            for="inseminacion-upload"
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
<script>
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { Filesystem, Directory } from '@capacitor/filesystem';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { createPer } from "$lib/stores/permisos.svelte";
    import { getPermisosList } from "$lib/permisosutil/lib";
    
    import categorias from "$lib/stores/categorias";
    import{verificarNivelCantidad,verificarNivelOffline} from "$lib/permisosutil/lib"
    //offline
    import {generarIDAleatorio} from "$lib/stringutil/lib"  
    import {concatComandosSQL} from "$lib/stores/sqlite/dbcomandos"
    import { setAnimalesSQL } from "$lib/stores/sqlite/dbanimales";
    import { loger } from "$lib/stores/logs/logs.svelte";
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"

    let {
        db,
        coninternet,
        useroff,
        caboff,
        usuarioid,
        //Tendria que ser bindeble
        animales,
        animalesusuario,
        lotes,
        rodeos
    } = $props();
    
    let ruta = import.meta.env.VITE_RUTA
    let caber = createCaber()
    let cab = caber.cab
    let per = createPer()
    let userpermisos = getPermisosList(per.per.permisos)
    

    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    let loading = $state(false)
    async function exportarTemplateOffline(params) {
        let csvData = [{
            caravana:"AAA",
            peso:"0",
            sexo:"H/M",
            rodeo:"",
            lote:"",
            categoria:""
        }].map(item=>({
            CARAVANA:item.caravana,
            PESO:item.peso,
            SEXO:item.sexo,
            RODEO:item.rodeo,
            LOTE:item.lote,
            CATEGORIA:item.categoria
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Animales');
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo animales.xlsx",
                directory: Directory.Documents
            });
        } catch(e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo animales.xlsx",
            directory: Directory.Documents
        });
    }
    async function exportarTemplateOnline(params) {
        let csvData = [{
            caravana:"AAA",
            peso:"0",
            sexo:"H/M",
            rodeo:"",
            lote:"",
            categoria:""
        }].map(item=>({
            CARAVANA:item.caravana,
            PESO:item.peso,
            SEXO:item.sexo,
            RODEO:item.rodeo,
            LOTE:item.lote,
            CATEGORIA:item.categoria
        }))
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(csvData);
        XLSX.utils.book_append_sheet(wb, ws, 'Animales');
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo animales.xlsx",
                directory: Directory.Documents
            });
        } catch(e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo animales.xlsx",
            directory: Directory.Documents
        });
    }
    async function exportarTemplate(){
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
    async function procesoOffline(animalesimportar,nuevosanimales) {
        let errores = false
        let verificar = await verificarNivelOffline(animalesusuario,nuevosanimales)
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de  animales`,"error")
            loading = false
            return
        }
        let comandos = []
        for(let i = 0;i<animalesimportar.length;i++){
            let an = animalesimportar[i]
            let conlote = false
            let contropa = false
            let lote = lotes.filter(l=>l.nombre==an.lote)[0]
            let rodeo = rodeos.filter(r=>r.nombre==an.rodeo)[0]
            let categoria = categorias.filter(c=>c.id==an.categoria || c.nombre==an.categoria)[0]

            let dataadd = {
                caravana:an.caravana,
                active:true,
                delete:false,
                sexo:an.sexo,
                peso:an.peso,
                cab:caboff.id
            }

            let datamod = {
                caravana:an.caravana,
                sexo:an.sexo,
                peso:an.peso,
                    
            }
            if(lote){
                dataadd.lote = lote.id
                datamod.lote = lote.id
            }
            if(rodeo){
                dataadd.rodeo = rodeo.id
                datamod.rodeo = rodeo.id
            }
            if(categoria){
                dataadd.categoria = categoria.id
                datamod.categoria = categoria.id
            }
            let aidx = animales.findIndex(a=>a.caravana == an.caravana)
            if(aidx == -1){
                let idprov = "nuevo_animal_"+generarIDAleatorio()
                let data ={
                    ...dataadd,
                    id:idprov
                }
                
                animales.push(data)
                //ojo con los nuevos lotes
                let comando = {
                    tipo:"add",
                    coleccion:"animales",
                    data:{...data},
                    hora:Date.now(),
                    prioridad:0,
                    idprov:idprov,    
                    camposprov:``
                }
                comandos.push(comando)
                
            }
            else{
                let data ={
                    ...datamod,
                    id:animales[aidx].id
                }
                
                animales[aidx] = {
                    ...animales[aidx],
                    ...data
                }
                //ojo con los nuevos lotes
                let comando = {
                    tipo:"update",
                    coleccion:"animales",
                    data:{...data},
                    hora:Date.now(),
                    prioridad:0,
                    idprov:idprov,    
                    camposprov:``
                }
                comandos.push(comando)
                
            }
        }
        let procesodata ={
            errores,
            comandos
        }
        return procesodata
    }
    //debo verificar el nivel de la cuenta
    async function procesoOnline(animalesimportar,nuevosanimales) {
        let errores = false
        //El verificar es saber si puede agregar los animales
        let verificar = await verificarNivelCantidad(caboff.id,nuevosanimales)
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de  animales`,"error")
            loading = false
            return
        }
        for(let i = 0;i<animalesimportar.length;i++){
            let an = animalesimportar[i]
            let conlote = false
            let contropa = false
            //LO hago case insensitive?
            let lote = ""
            let rodeo = ""
            let categoria = ""
            if(an.lote != ""){
                let lista = lotes.filter(l=>l.nombre==an.lote)
                if(lista.length>0){
                    lote = lista[0].id
                }
            }
            if(an.rodeo != ""){
                let lista = rodeos.filter(r=>r.nombre==an.rodeo)
                if(lista.length>0){
                    rodeo = lista[0].id
                }
            }
            if(an.categoria != ""){
                let lista = categorias.filter(c=>c.id==an.categoria.toLowerCase())
                if(lista.length>0){
                    categoria = lista[0].id
                }
                
            }
            let dataadd = {
                caravana:an.caravana,
                active:true,
                delete:false,
                sexo:an.sexo,
                peso:an.peso,
                cab:caboff.id
            }

            let datamod = {
                caravana:an.caravana,
                sexo:an.sexo,
                peso:an.peso,
            }
            if(lote != ""){
                dataadd.lote = lote
                datamod.lote = lote
            }
            if(rodeo != ""){
                dataadd.rodeo = rodeo
                datamod.rodeo = rodeo
            }
            if(categoria != ""){
                dataadd.categoria = categoria
                datamod.categoria = categoria
            }
            let aidx = animales.findIndex(a=>a.caravana == an.caravana)
            if(aidx == -1){
                //if(modedebug){
                //    loger.addLog({
                //        time:Date.now(),
                //        text:"add"
                //    })    
                //}
                
                
                try{
                    let a = await pb.collection('animales').create(dataadd);
                    animales.push(a)
                    //if(modedebug){
                    //    loger.addLog({
                    //        time:Date.now(),
                    //        text:JSON.stringify(dataadd,null,2)
                    //    })    
                    //}
                    
                
                }
                catch(err){
                    errores = true
                    //if(modedebug){
                    //    loger.addError({
                    //        time:Date.now(),
                    //        text:JSON.stringify(err,null,2)
                    //    })
                    //}
                    
                    
                }
                
            }
            else{
                //let test = {
                //    ...animales[aidx],
                //    ...datamod
                //}
                //if(modedebug){
                //    loger.addLog({
                //        time:Date.now(),
                //        text:"update"
                //    })
                //}
                
                try{
                    await pb.collection('animales').update(animales[aidx].id, datamod);
                    animales[aidx] = {
                        ...animales[aidx],
                        ...datamod
                    }
                    //Falta el historial del animal
                    //if(modedebug){
                    //    loger.addLog({
                    //        time:Date.now(),
                    //        text:JSON.stringify(datamod,null,2)
                    //    })
                    //}
                    
                }
                catch(err){
                    errores = true
                    //if(modedebug){
                    //    loger.addError({
                    //        time:Date.now(),
                    //        text:JSON.stringify(err,null,2)
                    //    })
                    //}
                    
                }
                
                
            }
        }
        
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

        let sheetanimales = wkbk.Sheets.Animales
        if(!sheetanimales){
            Swal.fire("Error","Debe subir un archivo válido","error")
            return
        }
        
        let animaleshashmap = {}
        loading = true
        let errores = false
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
                    animaleshashmap[tail].categoria = value.v
                }
                
                
            }
            else{
                animaleshashmap[tail]={
                    caravana:'',peso:'',sexo:'',rodeo:'',lote:"",categoria:""
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
                    animaleshashmap[tail].categoria = value.v
                }
                
            }
        }
        let animalesimportar = []
        let nuevosanimales = 0
        for (const [key, value ] of Object.entries(animaleshashmap)) {
            animalesimportar.push(value)
            let conocido = animales.filter(a=>a.caravana == value.caravana).length == 0
            if(!conocido ){
                nuevosanimales += 1
            }
        }
        
        if(coninternet.connected){
            errores = await procesoOnline(animalesimportar,nuevosanimales)
            await setAnimalesSQL(db,animales)
            
        }
        else{
            Swal.fire("Atención","No tienes conexión a internet, no esta habilitado todavia","warning")
            //let procesodata = await procesoOffline(animalesimportar,nuevosanimales)
            //errores = procesodata.errores
            //await concatComandosSQL(db,procesodata.comandos)
            //await setAnimalesSQL(db,animales)

        }
        
        
        loading = false
        
        filename = ""
        wkbk = null
        if(!errores){
            Swal.fire("Éxito importar","Se lograron importar los datos","success")
        }
        else{
            Swal.fire("Error importar","No se lograron importar todos los datos","success")
        }
        
        
    }
    async function onmountoriginal(params) {
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
            id="file-upload"
            onchange={(e)=>importarArchivo(e)}
        />
        <label
              for="file-upload"
              class={`
                w-full flex items-center justify-center px-4 py-4 
                border border-green-300 dark:border-green-600 rounded-md shadow-sm text-lg
                font-medium text-green-700 dark:text-green-300 bg-transparent hover:bg-green-50 
                dark:hover:bg-gray-500 cursor-pointer
              `}
              
        >   {#if loading}
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

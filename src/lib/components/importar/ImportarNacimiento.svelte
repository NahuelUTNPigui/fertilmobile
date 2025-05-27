<script>
    //LAburar nacimientos
    //Necesita dividirse en varios archivos
    import estilos from "$lib/stores/estilos";
    import * as XLSX from 'xlsx';
    import { createCaber } from '$lib/stores/cab.svelte';
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { onMount } from "svelte";
    import cuentas from '$lib/stores/cuentas';
    import categorias from "$lib/stores/categorias";
    import{verificarNivelCantidad, verificarNivelOffline} from "$lib/permisosutil/lib"
    //offline
    import {generarIDAleatorio} from "$lib/stringutil/lib"  
    import {concatComandosSQL} from "$lib/stores/sqlite/dbcomandos"
    import { setAnimalesSQL, editarAnimalSQL, updateLocalAnimalesSQL } from "$lib/stores/sqlite/dbanimales";
    import {
        getNacimientosSQL,
        updateLocalNacimientosSQL,
        setNacimientosSQL

    } from "$lib/stores/sqlite/dbeventos"
    import { validateHeaderName } from "http";
    let {db,
        coninternet,
        useroff,caboff,usuarioid,
        animales,animalesusuario,rodeos,lotes
    } = $props()
    let ruta = import.meta.env.VITE_RUTA
    let caber = createCaber()
    let cab = caber.cab
    let loading = $state(false)

    const pb = new PocketBase(ruta);
    let filename = $state("")
    let wkbk = $state(null)
    let nacimientos = $state([])
    let padres = $state([])
    let madres = $state([])

    async function exportarTemplate(){
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
        XLSX.utils.book_append_sheet(wb, ws, 'Nacimientos');
        const data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        try {
            await Filesystem.deleteFile({
                path: "Modelo nacimientos.xlsx",
                directory: Directory.Documents
            });
        } catch(e) {}
        /* attempt to write to the device */
        await Filesystem.writeFile({
            data,
            path: "Modelo nacimientos.xlsx",
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
    function buscarNacimiento(nac){
        let idx_nacimiento = nacimientos.findIndex(n=>{
            if(n.cab != caboff.id){
                return false
            }
            if(!sonFechasIguales(n.fecha,nac.fecha)){
                return false
            }
            if(n.madre != nac.madre){
                return false
            }
            return true
        })
        return idx_nacimiento
    }
    async function procesarOnline(nuevoanimales) {
        let verificar = await verificarNivelCantidad(caboff.id,nuevoanimales)
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de  animales`,"error")
            loading = false
            return
        }
        for(let i = 0;i<nacimientosprocesar.length;i++){
            let an = nacimientosprocesar[i]
            let conlote = false
            let reslote = lotes.filter(l=>l.nombre==an.lote)
            let resrodeo = rodeos.filter(r=>r.nombre==an.rodeo)
            lote = reslote.length>0?reslote[0]:null
            rodeo = resrodeo.length>0?resrodeo[0]:null
            let categoria = categorias.filter(c=>c.id==an.categoria || c.nombre==an.categoria)[0]
            let padre = animales.filter(p=>p.caravana==an.nombrepadre)
            let madre = animales.filter(m=>m.caravana==an.nombremadre)
            if(madre.length<1){
                continue
            }
            let datanacimiento = {
                fecha:an.fechanacimiento?an.fechanacimiento.toISOString().split("T")[0]+ " 03:00:00":"",
                nombremadre:madre.length>0?madre[0].caravana:an.nombremadre,
                nombrepadre: padre.length>0?padre[0].caravana:an.nombrepadre,
                madre:madre[0].id,
                observacion:an.observaciones,
                cab:caboff.id
            }
            if(padre.length>0){
                datanacimiento.padre=padre[0].id
            }
            let idx_nacimiento = buscarNacimiento(datanacimiento)
            let id_nacimiento = ""
            if(idx_nacimiento == -1){
                let record = await pb.collection("nacimientos")
                record={
                    caravana
                
                }
                id_nacimiento = record.id
                nacimientos.push(record)
            }
            else{
                id_nacimiento = nacimientos[id_nacimiento].id
                await pb.collection("nacimientos").update(id_nacimiento,datanacimiento)
                nacimientos[idx_nacimiento]={
                    ...nacimientos[idx_nacimiento],
                    ...datanacimiento
                }

            }
            if(caravana != ""){
                let idx_animal = animales.findIndex(a=>a.caravana ==caravana)
                //Agregar animal
                if(idx_animal == -1){
                    let dataadd = {
                        caravana:an.caravana,
                        active:true,
                        delete:false,
                        sexo:an.sexo,
                        peso:an.peso,
                        fechanacimiento: an.fechanacimiento?an.fechanacimiento.toISOString().split("T")[0]+ " 03:00:00":"",
                        nombremadre:madre.length>0?madre[0].caravana:an.nombremadre,
                        nombrepadre: padre.length>0?padre[0].caravana:an.nombrepadre,
                        cab:caboff.id
                    }
                    let recordanimal = await pb.collection("animales").create(dataadd)
                    animales.push(recordanimal)
                }
                //setear nacimiento al animal
                else{

                }
            }

        }
    }
    async function procesarOffline(nuevoanimales) {
        let verificar = await verificarNivelOffline(animalesusuario,nuevoanimales)
        if(!verificar){
            Swal.fire("Error guardar",`No tienes el nivel de la cuenta para tener mas de  animales`,"error")
            loading = false
            return
        }
        for(let i = 0;i<nacimientosprocesar.length;i++){
            let an = nacimientosprocesar[i]
            let conlote = false
            let reslote = lotes.filter(l=>l.nombre==an.lote)
            let resrodeo = rodeos.filter(r=>r.nombre==an.rodeo)
            lote = reslote.length>0?reslote[0]:null
            rodeo = resrodeo.length>0?resrodeo[0]:null
            let categoria = categorias.filter(c=>c.id==an.categoria || c.nombre==an.categoria)[0]
            let padre = animales.filter(p=>p.caravana==an.nombrepadre)
            let madre = animales.filter(m=>m.caravana==an.nombremadre)
            let datanacimiento = {
                fecha:an.fechanacimiento?an.fechanacimiento.toISOString().split("T")[0]+ " 03:00:00":"",
                nombremadre:madre.length>0?madre[0].caravana:an.nombremadre,
                nombrepadre: padre.length>0?padre[0].caravana:an.nombrepadre,
                observacion:an.observaciones,
                cab:caboff.id
            }
            if(padre){
                datanacimiento.padre=padre.id
            }
            if(madre){
                datanacimiento.madre = madre.id
            }
        }
    }
    function sonFechasIguales(fecha1, fecha2) {
        const f1 = new Date(fecha1);
        const f2 = new Date(fecha2);

        return (
            f1.getFullYear() === f2.getFullYear() &&
            f1.getMonth() === f2.getMonth() &&
            f1.getDate() === f2.getDate()
        );
    }
    async function procesarArchivo(){
        if(filename == ""){
            Swal.fire("Error","Seleccione un archivo","error")
        }

        let sheetanimales = wkbk.Sheets.Animales
        if(!sheetanimales){
            Swal.fire("Error","Debe subir un archivo válido","error")
        }
        
        let nacimientosprocesar = []
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
            nacimientosprocesar.push(value)
            if(value.caravana != ""){
                let conocido = animales.filter(a=>a.caravana == value.caravana).length == 0
                if(!conocido ){
                    nuevoanimales += 1
                }
            }
        }
        if(coninternet.connected){
            await procesarOnline(nuevoanimales)
        }
        else{
            await procesarOffline(nuevoanimales)
        }
        for(let i = 0;i<nacimientosprocesar.length;i++){
            let an = nacimientosprocesar[i]
            let conlote = false
            let reslote = lotes.filter(l=>l.nombre==an.lote)
            let resrodeo = rodeos.filter(r=>r.nombre==an.rodeo)
            lote = reslote.length>0?reslote[0]:null
            rodeo = resrodeo.length>0?resrodeo[0]:null
            let categoria = categorias.filter(c=>c.id==an.categoria || c.nombre==an.categoria)[0]
            let padre = animales.filter(p=>p.caravana==an.nombrepadre)
            let madre = animales.filter(m=>m.caravana==an.nombremadre)
            
            // Agregar animal si no existe y nacimiento
            //let dataadd = {
            //    caravana:an.caravana,
            //    active:true,
            //    delete:false,
            //    sexo:an.sexo,
            //    peso:an.peso,
            //    fechanacimiento: an.fechanacimiento?an.fechanacimiento.toISOString().split("T")[0]+ " 03:00:00":"",
            //    nombremadre:madre.length>0?madre[0].caravana:an.nombremadre,
            //    nombrepadre: padre.length>0?padre[0].caravana:an.nombrepadre,
            //    cab:caboff.id
            //}
            //Modificar nacimiento cuando existe
            let datanacimiento = {
                fecha:an.fechanacimiento?an.fechanacimiento.toISOString().split("T")[0]+ " 03:00:00":"",
                nombremadre:madre.length>0?madre[0].caravana:an.nombremadre,
                nombrepadre: padre.length>0?padre[0].caravana:an.nombrepadre,
                observacion:an.observaciones,
                cab:caboff.id
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
        nacimientos = await getNacimientosSQL(db,caboff.id)
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

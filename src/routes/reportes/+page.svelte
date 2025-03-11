<script>
    import Navbarr from "$lib/components/Navbarr.svelte";
    import PocketBase from 'pocketbase';
    import { slide } from 'svelte/transition';
    import Swal from "sweetalert2";
    import Chart from 'chart.js/auto';
    import { onMount } from "svelte";
    import { createCaber } from "$lib/stores/cab.svelte";
    import estilos from '$lib/stores/estilos';
    import RadioBadges from "$lib/components/RadioBadges.svelte";
    import StatCard from "$lib/components/StatCard.svelte";
    let opciones = [
        {id:0,nombre:"General"},
        {id:1,nombre:"Stock"}
    ]
    //eventos animales,tactos,nacimientos,rodeos,lotes,tratamientos,inseminaciones ,observaciones,pesajes

    let totaleventos = $state({
        animales:0,
        tactos:0,
        nacimientos:0,
        rodeos:0,
        lotes:0,
        tratamientos:0,
        inseminaciones:0,
        observaciones:0,
        pesajes:0,
        servicios:0
    })
    let opcion = $state(1)
    let ruta = import.meta.env.VITE_RUTA

    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    let caber = createCaber()
    let cab = caber.cab
    //Reportes
    let tiporeporte = $state(0)
    let generarReporteRodeos = $state(false)
    let generarReporteLotes = $state(false)
    let generarReporte = $state(false)
    let generarReportePersonalizado =$state(false)
    let opensFilterlotes = $state([])
    let opensFilterrodeos = $state([])
    let animales = $state([])
    let cargados = $state(false)

    let ctx;
	let canvas;
    let chart;

    let ctxPersonalizadoLotes;
	let canvasPersonalizadoLotes;
    let chartPersonalizadoLotes;

    let ctxPersonalizadoRodeos;
	let canvasPersonalizadoRodeos;
    let chartPersonalizadoRodeos;

    //Reporte test
    let ctxTest
    let canvasTest
    let chartTest

    let lotesrows = $state([])
    let lotes = $state([])
    let rodeosrows = $state([])
    let rodeos = $state([])
    let categoriasrows = $state([
        {nombre: "Vaca", total: 0, pesoProm: 0},
        {nombre: "Vaquillona", total: 0, pesoProm: 0},
        {nombre: "Ternero", total: 0, pesoProm: 0},
        {nombre: "Ternera", total: 0, pesoProm: 0},
        {nombre: "Novillo", total: 0, pesoProm: 0},
        {nombre: "Torito", total: 0, pesoProm: 0},
        {nombre: "Toro", total: 0, pesoProm: 0}
    ])
    
    let categoriasrodeosrows = $state([])
    let categoriaslotesrows = $state([])

    function createChart(){
        ctx = canvas.getContext('2d');
        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: [categoriasrows[0].nombre,
                categoriasrows[1].nombre,
                categoriasrows[2].nombre,
                categoriasrows[3].nombre,
                categoriasrows[4].nombre,
                categoriasrows[5].nombre],
                datasets: [
                    {
                        label: "Pesos promedios por categoria",
                        
                        data: [categoriasrows[0].pesoProm,
                        categoriasrows[1].pesoProm,
                        categoriasrows[2].pesoProm,
                        categoriasrows[3].pesoProm,
                        categoriasrows[4].pesoProm,
                        categoriasrows[5].pesoProm
                        ]
                    }
                ]
            }            
        });
    }

    function createChartPersonalizadoRodeos(){
        ctxPersonalizadoRodeos = canvasPersonalizadoRodeos.getContext('2d');
        if (chartPersonalizadoRodeos) {
            chartPersonalizadoRodeos.destroy();
        }
        let ds = []
        for(let i = 0;i<rodeos.length;i++){
            let d = {
                label: "Pesos promedios por categoria "+rodeos[i].nombre,
                data: [
                            rodeos[i].categoriasrodeos[0].pesoProm,
                            rodeos[i].categoriasrodeos[1].pesoProm,
                            rodeos[i].categoriasrodeos[2].pesoProm,
                            rodeos[i].categoriasrodeos[3].pesoProm,
                            rodeos[i].categoriasrodeos[4].pesoProm,
                            rodeos[i].categoriasrodeos[5].pesoProm
                        ]
            }
            ds.push(d)
        }
        console.log(ds)
        chartPersonalizadoRodeos = new Chart(ctxPersonalizadoRodeos, {
            type: "bar",
            data: {
                labels: [
                    categoriasrows[0].nombre,
                    categoriasrows[1].nombre,
                    categoriasrows[2].nombre,
                    categoriasrows[3].nombre,
                    categoriasrows[4].nombre,
                    categoriasrows[5].nombre
                ],
                datasets: ds
            }            
        });
    }

    function createChartPersonalizadoLotes(){
        ctxPersonalizadoLotes = canvasPersonalizadoLotes.getContext('2d');
        if (chartPersonalizadoLotes) {
            chartPersonalizadoLotes.destroy();
        }
        let ds = []
        for(let i = 0;i<lotes.length;i++){
            let d = {
                label: "Pesos promedios por categoria "+lotes[i].nombre,
                data: [
                            lotes[i].categoriaslotes[0].pesoProm,
                            lotes[i].categoriaslotes[1].pesoProm,
                            lotes[i].categoriaslotes[2].pesoProm,
                            lotes[i].categoriaslotes[3].pesoProm,
                            lotes[i].categoriaslotes[4].pesoProm,
                            lotes[i].categoriaslotes[5].pesoProm
                        ]
            }
            ds.push(d)
        }
        chartPersonalizadoLotes = new Chart(ctxPersonalizadoLotes, {
            type: "bar",
            data: {
                labels: [categoriasrows[0].nombre,
                categoriasrows[1].nombre,
                categoriasrows[2].nombre,
                categoriasrows[3].nombre,
                categoriasrows[4].nombre,
                categoriasrows[5].nombre],
                datasets: ds
            }            
        });
    }

    function createChartTest(){
        ctxTest = canvasTest.getContext('2d');
        if (chartTest) {
            chartTest.destroy();
        }
        let ds = []
        for(let i = 0;i<rodeos.length;i++){
            let d = {
                label: "Pesos promedios por categoria "+rodeos[i].nombre,
                data: [
                            rodeos[i].categoriasrodeos[0].pesoProm,
                            rodeos[i].categoriasrodeos[1].pesoProm,
                            rodeos[i].categoriasrodeos[2].pesoProm,
                            rodeos[i].categoriasrodeos[3].pesoProm,
                            rodeos[i].categoriasrodeos[4].pesoProm,
                            rodeos[i].categoriasrodeos[5].pesoProm
                        ]
            }
            ds.push(d)
        }

        chartTest = new Chart(ctxTest, {
            type:"bar",
            data:{
                labels: [
                    categoriasrows[0].nombre,
                    categoriasrows[1].nombre,
                    categoriasrows[2].nombre,
                    categoriasrows[3].nombre,
                    categoriasrows[4].nombre,
                    categoriasrows[5].nombre
                ],
                datasets:ds
            }
        })
    }

    function openNewModal(){
        nuevoModal.showModal()
        generarReporte = false
        generarReportePersonalizado = false
        generarReporteLotes = false
        generarReporteRodeos = false
    }
    function onchangeTipo(){
        generarReporte = false
        generarReportePersonalizado = false
        generarReporteLotes = false
        generarReporteRodeos = false
        if(tiporeporte == 0){
            generarReporte = true
        }
        else if(tiporeporte == 1){
            generarReporteLotes = true
            generarReportePersonalizado = true
        }
        else{
            generarReporteRodeos = true
            generarReportePersonalizado = true
        }
    }
    
    function ordenar(lista){
        lista.sort((r1,r2)=>r1.nombre.toLocaleLowerCase()>r2.nombre.toLocaleLowerCase()?1:-1)
    }

    async function getCategoriasRows(){
        let pesoVaca = 0
        let pesoVaquillona = 0
        let pesoTernero = 0
        let pesoTernera = 0
        let pesoNovillo = 0
        let pesoTorito = 0
        let pesoToro = 0

        for (let i = 0; i < animales.length; i++) {
            if (animales[i].categoria == "vaca"){
                categoriasrows[0].total += 1
                pesoVaca += animales[i].peso
            }
            if (animales[i].categoria == "vaquillona"){
                categoriasrows[1].total += 1
                pesoVaquillona += animales[i].peso
            }
            if (animales[i].categoria == "ternero"){
                categoriasrows[2].total += 1
                pesoTernero += animales[i].peso
            }
            if (animales[i].categoria == "ternera"){
                categoriasrows[3].total += 1
                pesoTernera += animales[i].peso
            }
            if (animales[i].categoria == "novillo"){
                categoriasrows[4].total += 1
                pesoNovillo += animales[i].peso
            }
            if (animales[i].categoria == "torito"){
                categoriasrows[5].total += 1
                pesoTorito += animales[i].peso
            }
            if (animales[i].categoria == "toro"){
                categoriasrows[6].total += 1
                pesoToro += animales[i].peso
            }
        }

        categoriasrows[0].pesoProm = categoriasrows[0].total==0? 0 : Number((pesoVaca / categoriasrows[0].total).toFixed(2))
        categoriasrows[1].pesoProm = categoriasrows[1].total==0? 0 :Number((pesoVaquillona / categoriasrows[1].total).toFixed(2))
        categoriasrows[2].pesoProm = categoriasrows[2].total==0? 0 :Number((pesoTernero / categoriasrows[2].total).toFixed(2))
        categoriasrows[3].pesoProm = categoriasrows[3].total==0? 0 :Number((pesoTernera / categoriasrows[3].total).toFixed(2))
        categoriasrows[4].pesoProm = categoriasrows[4].total==0? 0 :Number((pesoNovillo / categoriasrows[4].total).toFixed(2))
        categoriasrows[5].pesoProm = categoriasrows[5].total==0? 0 :Number((pesoTorito / categoriasrows[5].total).toFixed(2))
        categoriasrows[6].pesoProm = categoriasrows[6].total==0? 0 :Number((pesoToro / categoriasrows[6].total).toFixed(2))

        createChart()
    }

    async function getLotes(){
        const records = await pb.collection('lotes').getFullList({
            filter:`active=True && cab='${cab.id}'`,
            sort: 'nombre',
        });
        totaleventos.lotes = records.length
        lotes = records
        ordenar(lotes)
        lotesrows = lotes
        for(let i = 0;i<lotes.length;i++){
            opensFilterlotes.push(false)
            let total = await getAnimalesTotalLotes(lotes[i].id)
            lotes[i].total = total

            lotes[i].categoriaslotes = [                
                {nombre: "Vaca", total: 0, pesoProm: 0},
                {nombre: "Vaquillona", total: 0, pesoProm: 0},
                {nombre: "Ternero", total: 0, pesoProm: 0},
                {nombre: "Ternera", total: 0, pesoProm: 0},
                {nombre: "Novillo", total: 0, pesoProm: 0},
                {nombre: "Torito", total: 0, pesoProm: 0},
                {nombre: "Toro", total: 0, pesoProm: 0}
            ]

            let pesoVaca = 0
            let pesoVaquillona = 0
            let pesoTernero = 0
            let pesoTernera = 0
            let pesoNovillo = 0
            let pesoTorito = 0
            let pesoToro = 0
            let pesoLote = 0
            for (let j = 0;j<animales.length;j++){
                pesoLote += animales[j].peso
                if (animales[j].categoria == "vaca" && animales[j].lote == lotes[i].id){
                    lotes[i].categoriaslotes[0].total += 1
                    pesoVaca += animales[j].peso
                }
                if (animales[j].categoria == "vaquillona" && animales[j].lote == lotes[i].id){
                    lotes[i].categoriaslotes[1].total += 1
                    pesoVaquillona += animales[j].peso
                }
                if (animales[j].categoria == "ternero" && animales[j].lote == lotes[i].id){
                    lotes[i].categoriaslotes[2].total += 1
                    pesoTernero += animales[j].peso
                }
                if (animales[j].categoria == "ternera" && animales[j].lote == lotes[i].id){
                    lotes[i].categoriaslotes[3].total += 1
                    pesoTernera += animales[j].peso
                }
                if (animales[j].categoria == "novillo" && animales[j].lote == lotes[i].id){
                    lotes[i].categoriaslotes[4].total += 1
                    pesoNovillo += animales[j].peso
                }
                if (animales[j].categoria == "torito" && animales[j].lote == lotes[i].id){
                    lotes[i].categoriaslotes[5].total += 1
                    pesoTorito += animales[j].peso
                }
                if (animales[j].categoria == "toro" && animales[j].lote == lotes[i].id){
                    lotes[i].categoriaslotes[6].total += 1
                    pesoToro += animales[j].peso
                }
            }

            if (pesoVaca == 0) {
                lotes[i].categoriaslotes[0].pesoProm = 0                
            } else {
                lotes[i].categoriaslotes[0].pesoProm = Number((pesoVaca / lotes[i].categoriaslotes[0].total).toFixed(2))
            }
            
            if (pesoVaquillona == 0) {
                lotes[i].categoriaslotes[1].pesoProm = 0  
            } else {
                lotes[i].categoriaslotes[1].pesoProm = Number((pesoVaquillona / lotes[i].categoriaslotes[1].total).toFixed(2))
            }

            if (pesoTernero == 0) {
                lotes[i].categoriaslotes[2].pesoProm = 0                
            } else {
                lotes[i].categoriaslotes[2].pesoProm = Number((pesoTernero / lotes[i].categoriaslotes[2].total).toFixed(2))
            }

            if (pesoTernera == 0) {
                lotes[i].categoriaslotes[3].pesoProm = 0                
            } else {
                lotes[i].categoriaslotes[3].pesoProm = Number((pesoTernera / lotes[i].categoriaslotes[3].total).toFixed(2))
            }
            
            if (pesoNovillo == 0) {
                lotes[i].categoriaslotes[4].pesoProm = 0  
            } else {
                lotes[i].categoriaslotes[4].pesoProm = Number((pesoNovillo / lotes[i].categoriaslotes[4].total).toFixed(2))
            }
            
            if (pesoTorito == 0) {
                lotes[i].categoriaslotes[5].pesoProm = 0                
            } else {
                lotes[i].categoriaslotes[5].pesoProm = Number((pesoTorito / lotes[i].categoriaslotes[5].total).toFixed(2))
            }
            
            if (pesoToro == 0) {
                lotes[i].categoriaslotes[6].pesoProm = 0  
            } else {
                lotes[i].categoriaslotes[6].pesoProm = Number((pesoToro / lotes[i].categoriaslotes[6].total).toFixed(2))
            }
            lotes[i].pesoProm = lotes[i].total == 0? 0 : Number((pesoLote / lotes[i].total).toFixed(2))
            //lotes[i].chart = createChartPersonalizadoLotes(i)
        }
        createChartPersonalizadoLotes()
        
        
    }

    async function getRodeos(){
        const records = await pb.collection('rodeos').getFullList({
            filter:`active=true && cab='${cab.id}'`,
            sort: 'nombre',
        });
        totaleventos.rodeos = records.length
        rodeos = records
        ordenar(rodeos)
        rodeosrows = rodeos
        for(let i = 0;i<rodeos.length;i++){
            opensFilterrodeos.push(false)
            let total = await getAnimalesTotalRodeos(rodeos[i].id)
            rodeos[i].total = total

            let pesoVaca = 0
            let pesoVaquillona = 0
            let pesoTernero = 0
            let pesoTernera = 0
            let pesoNovillo = 0
            let pesoTorito = 0
            let pesoToro = 0
            let pesoRodeo = 0
            rodeos[i].categoriasrodeos = [
                {nombre: "Vaca", total: 0, pesoProm: 0},
                {nombre: "Vaquillona", total: 0, pesoProm: 0},
                {nombre: "Ternero", total: 0, pesoProm: 0},
                {nombre: "Ternera", total: 0, pesoProm: 0},
                {nombre: "Novillo", total: 0, pesoProm: 0},
                {nombre: "Torito", total: 0, pesoProm: 0},
                {nombre: "Toro", total: 0, pesoProm: 0}
            ]

            for (let j = 0;j<animales.length;j++){
                console.log(animales[j].rodeo)
                console.log(rodeos[i].id)
                if(animales[j].rodeo == rodeos[i].id){
                
                    pesoRodeo += animales[j].peso
                    console.log(animales[j])
                }
                
                
                if (animales[j].categoria == "vaca" && animales[j].rodeo == rodeos[i].id){
                    rodeos[i].categoriasrodeos[0].total += 1
                    pesoVaca += animales[j].peso
                }
                if (animales[j].categoria == "vaquillona" && animales[j].rodeo == rodeos[i].id){
                    rodeos[i].categoriasrodeos[1].total += 1
                    pesoVaquillona += animales[j].peso
                }
                if (animales[j].categoria == "ternero" && animales[j].rodeo == rodeos[i].id){
                    rodeos[i].categoriasrodeos[2].total += 1
                    pesoTernero += animales[j].peso
                }
                if (animales[j].categoria == "ternera" && animales[j].rodeo == rodeos[i].id){
                    rodeos[i].categoriasrodeos[3].total += 1
                    pesoTernera += animales[j].peso
                }
                if (animales[j].categoria == "novillo" && animales[j].rodeo == rodeos[i].id){
                    rodeos[i].categoriasrodeos[4].total += 1
                    pesoNovillo += animales[j].peso
                }
                if (animales[j].categoria == "torito" && animales[j].rodeo == rodeos[i].id){
                    rodeos[i].categoriasrodeos[5].total += 1
                    pesoTorito += animales[j].peso
                }
                if (animales[j].categoria == "toro" && animales[j].rodeo == rodeos[i].id){
                    rodeos[i].categoriasrodeos[6].total += 1
                    pesoToro += animales[j].peso
                }
            }

            if (pesoVaca == 0) {
                rodeos[i].categoriasrodeos[0].pesoProm = 0                
            } else {
                rodeos[i].categoriasrodeos[0].pesoProm = Number((pesoVaca / rodeos[i].categoriasrodeos[0].total).toFixed(2))
            }
            
            if (pesoVaquillona == 0) {
                rodeos[i].categoriasrodeos[1].pesoProm = 0  
            } else {
                rodeos[i].categoriasrodeos[1].pesoProm = Number((pesoVaquillona / rodeos[i].categoriasrodeos[1].total).toFixed(2))
            }

            if (pesoTernero == 0) {
                rodeos[i].categoriasrodeos[2].pesoProm = 0                
            } else {
                rodeos[i].categoriasrodeos[2].pesoProm = Number((pesoTernero / rodeos[i].categoriasrodeos[2].total).toFixed(2))
            }
            
            if (pesoTernera == 0) {
                rodeos[i].categoriasrodeos[3].pesoProm = 0                
            } else {
                rodeos[i].categoriasrodeos[3].pesoProm = Number((pesoTernera / rodeos[i].categoriasrodeos[3].total).toFixed(2))
            }

            if (pesoNovillo == 0) {
                rodeos[i].categoriasrodeos[4].pesoProm = 0  
            } else {
                rodeos[i].categoriasrodeos[4].pesoProm = Number((pesoNovillo / rodeos[i].categoriasrodeos[4].total).toFixed(2))
            }
            
            if (pesoTorito == 0) {
                rodeos[i].categoriasrodeos[5].pesoProm = 0                
            } else {
                rodeos[i].categoriasrodeos[5].pesoProm = Number((pesoTorito / rodeos[i].categoriasrodeos[5].total).toFixed(2))
            }
            
            if (pesoToro == 0) {
                rodeos[i].categoriasrodeos[6].pesoProm = 0  
            } else {
                rodeos[i].categoriasrodeos[6].pesoProm = Number((pesoToro / rodeos[i].categoriasrodeos[6].total).toFixed(2))
            }
            rodeos[i].pesoProm = rodeos[i].total == 0? 0: Number((pesoRodeo / rodeos[i].total).toFixed(2))
            
        }     
        createChartPersonalizadoRodeos()
    }

    async function getAnimales() {
        const record = await pb.collection('animales').getFullList({
            filter: `active = true && delete = false && cab = '${cab.id}'`
        })
        totaleventos.animales = record.length
        animales = record
    }

    async function getAnimalesTotalRodeos(id){
        const results = await pb.collection('animales').getList(1, 10, {
            filter: `active = true && delete = false && rodeo='${id}' `,
        });
        return results.totalItems
    }

    async function getAnimalesTotalLotes(id){
        const results = await pb.collection('animales').getList(1, 10, {
            filter: `active = true && delete = false && lote='${id}'`,
        });
        return results.totalItems
    }
    async function getTotales() {
        let recordtactos = await pb.collection('tactos').getList(1,1,{
            filter:`active=True && cab='${cab.id}'`
        })
        let recordnacimientos = await pb.collection('nacimientos').getList(1,1,{
            filter:`cab='${cab.id}'`
        })
        let recordtratamientos = await pb.collection('tratamientos').getList(1,1,{
            filter:`active=True && cab='${cab.id}'`
        })
        let recordinseminaciones = await pb.collection('inseminacion').getList(1,1,{
            filter:`active=True && cab='${cab.id}'`
        })
        let recordobservaciones = await pb.collection('observaciones').getList(1,1,{
            filter:`active=True && cab='${cab.id}'`
        })
        let recordpesajes = await pb.collection('pesaje').getList(1,1,{
            expand:"animal",
            filter:`animal.cab='${cab.id}'`
        })
        let recordservicios = await pb.collection('servicios').getList(1,1,{
            
            filter:`cab='${cab.id}'`
        })
        totaleventos.tactos = recordtactos.totalItems
        totaleventos.inseminaciones = recordinseminaciones.totalItems
        totaleventos.nacimientos = recordnacimientos.totalItems
        totaleventos.tratamientos = recordtratamientos.totalItems
        totaleventos.observaciones = recordobservaciones.totalItems
        totaleventos.pesajes = recordpesajes.totalItems
        totaleventos.servicios = recordservicios.totalItems
         
    }
    onMount(async ()=>{
        await getTotales()
        await getAnimales()
        await getLotes()
        await getRodeos()
        await getCategoriasRows()
        cargados =  true
        
    })
    
    let isOpenFilter = $state(false)
    function clickFilter(){
        isOpenFilter = !isOpenFilter
    }
    function clickFilterlote(i){
        opensFilterlotes[i] = !opensFilterlotes[i]
    }
    function clickFilterrodeo(i){
        opensFilterrodeos[i] = !opensFilterrodeos[i]
    }

</script>
<Navbarr>
    <div class="w-full grid justify-items-left mx-1 lg:mx-10 mt-1">
        <h1 class="text-2xl">Reportes</h1>  
    </div>
    <div class="mx-1 lg:mx-10 w-4/5 lg:w-1/3 justify-items-left ">
        <RadioBadges opciones={opciones} bind:valor={opcion}/>
    </div>
    {#if cargados}
        {#if opcion == 0}
            <div class="mx-1 lg:mx-10 grid grid-cols-2  lg:grid-cols-3 gap-6">
                <StatCard  titulo="Animales" valor={totaleventos.animales}/>
                <StatCard  titulo="Lotes" valor={totaleventos.lotes}/>
                <StatCard  titulo="Rodeos" valor={totaleventos.rodeos}/>
                <StatCard  titulo="Inseminaciones" valor={totaleventos.inseminaciones}/>
                <StatCard  titulo="Servicios" valor={totaleventos.servicios}/>
                <StatCard  titulo="Nacimientos" valor={totaleventos.nacimientos}/>
                <StatCard  titulo="Tratamientos" valor={totaleventos.tratamientos}/>
                <StatCard  titulo="Observaciones" valor={totaleventos.observaciones}/>
                <StatCard  titulo="Pesajes" valor={totaleventos.pesajes}/>
                <StatCard  titulo="Tactos" valor={totaleventos.tactos}/>
            </div>
        {:else}
            
            <div class="mx-1 lg:mx-10 grid grid-cols-2 lg:grid-cols-3">
                <div>
                    <label for = "sexo" class="label">
                        <span class="label-text text-base">Tipo Reporte</span>
                    </label>
                    <label class="input-group ">
                        <select 
                            class={`
                                select select-bordered w-full
                                rounded-md
                                focus:outline-none focus:ring-2 
                                focus:ring-green-500 
                                focus:border-green-500
                                
                                ${estilos.bgdark2}
                            `}
                            bind:value={tiporeporte}
                            
                        >
                                <option value={0} class="rounded">General</option>
                                <option value={1} class="rounded">Lotes</option>
                                <option value={2} class="rounded">Rodeos</option>
                                
                        </select>
                    </label>
                </div>
                <div>
                    <div class=" mb-2 mt-2 mx-1 lg:mx-10" >
                        <div >
                            <br>
                            <button class={`w-full btn flex btn-primary ${estilos.btntext}`} data-theme="forest" onclick={onchangeTipo}>
                                <span  class="text-xl">Reporte</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            
            {#if generarReporte}
                <div class="w-full grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
                    <table class="table table-lg w-full" >
                        <thead>
                            <tr>
                                <th class="text-base ml-3 pl-3 mr-1 pr-1 border-b dark:border-gray-600">Categoria</th>
                                <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Total</th>
                                <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Peso promedio</th>
                            </tr>
                        </thead>
                        <tbody>
                        {#each categoriasrows as c}
                            <tr>
                                <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{c.nombre}</td>
                                <td class="text-base mx-1 px-1 ">{c.total}</td>
                                <td class="text-base mx-1 px-1 ">{c.pesoProm}</td>
                            </tr>
                        {/each}
                    </tbody>
                    </table>
                </div>
                <div class="mx-1 lg:mx-10">
                    <button
                        aria-label="Evolucion"
                        onclick={()=>chartpesaje.showModal()}
                        class={`
                            ${estilos.sinbordes} ${estilos.chico} ${estilos.primario}
                        `}
                    >
                        Mostrar grafico
                    </button>
                </div>      
            {/if}
            {#if generarReportePersonalizado}
                {#if generarReporteRodeos}
                    
                    <div class="w-full grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
                        <table class="table table-lg w-full">
                            <thead>
                                <tr>
                                    <th class="text-base justify-start border-b dark:border-gray-600">Nombre del rodeo</th>
                                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600" >Total</th>
                                    <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Promedio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each rodeosrows as r, i}
                                <tr class="border-b dark:border-gray-800">
                                    
                                    <td class="text-base ">
                                        <button 
                                            aria-label="Filtrar" 
                                            class="w-full"
                                            onclick={()=>clickFilterrodeo(i)}
                                        >
                                        <div class="flex justify-between items-center px-1">
                                            <h1 class="font-semibold text-lg py-2">{r.nombre}</h1>
                                            <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                class={`size-6 transition-all duration-300 ${opensFilterrodeos[i]? 'transform rotate-180':''}`}
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>            
                                        </button>
                                        
                                    </td>
                                    <td class="font-semibold mx-1 px-1">{r.total}</td>
                                    <td class="font-semibold mx-1 px-1">{r.pesoProm}</td>
                                    
                                </tr>
                                    {#if opensFilterrodeos[i]}
                                        {#each r.categoriasrodeos as cr}
                                            <tr transition:slide>
                                                <td class="text-base  ">{cr.nombre}</td>
                                                <td class="text-base mx-1 px-1 ">{cr.total}</td>
                                                <td class="text-base mx-1 px-1 ">{cr.pesoProm}</td>
                                                
                                            </tr>
                                        {/each}
                                        
                                        
                                    {/if}
                                {/each}
                                
                            </tbody>
                        </table>
                        
                    </div>
                    <div class="mt-1 justify-items-left mx-1 lg:mx-10">
                        <button
                            aria-label="Pesaje Rodeos"
                            onclick={()=>chartpesajepersonalizadorodeos.showModal()}
                            class={`
                                ${estilos.sinbordes} ${estilos.chico} ${estilos.primario}
                            `}
                        >
                            Mostrar grafico
                        </button>
                    </div>
                    
                {/if}
                {#if generarReporteLotes}
                <div class="w-full grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
                    <table class="table table-lg w-full">
                        <thead>
                            <tr>
                                <th class="text-base justify-start border-b dark:border-gray-600">Nombre del lote</th>
                                <th class="text-base mx-1 px-1 border-b dark:border-gray-600" >Total</th>
                                <th class="text-base mx-1 px-1 border-b dark:border-gray-600">Promedio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each lotesrows as l, i}
                                <tr class="border-b dark:border-gray-800">
                                    <td class="text-base  lg:ml-10 justify-start">
                                        <button 
                                            aria-label="Filtrar" 
                                            class="w-full"
                                            onclick={()=>clickFilterlote(i)}
                                        >
                                        <div class="flex justify-between items-center px-1">
                                            <h1 class="font-semibold text-lg py-2">{l.nombre}</h1>
                                            <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                class={`size-6 transition-all duration-300 ${opensFilterlotes[i]? 'transform rotate-180':''}`}
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>            
                                        </button>
                                    </td>
                                    <td class="text-base mx-1 px-1 ">{l.total}</td>
                                    <td class="text-base mx-1 px-1 ">{l.pesoProm}</td>
                                </tr>
                                {#if opensFilterlotes[i]}
                                    {#each l.categoriaslotes as cl}
                                        <tr>
                                            <td class="text-base ">{cl.nombre}</td>
                                            <td class="text-base mx-1 px-1">{cl.total}</td>
                                            <td class="text-base mx-1 px-1">{cl.pesoProm}</td>
                                        </tr>
                                    {/each}
                                {/if}
                            {/each}
                        </tbody>
                    </table>
                    
                </div>
                <div class="mt-1 justify-items-left mx-1 lg:mx-10">
                    <button
                        aria-label="Pesaje Lotes"
                        onclick={()=>chartpesajepersonalizadolotes.showModal()}
                        class={`
                            ${estilos.sinbordes} ${estilos.chico} ${estilos.primario}
                        `}
                    >
                        Mostrar grafico
                    </button>
                </div>
                {/if}
            {/if}
        {/if}
    {/if}
    
</Navbarr>
<dialog id="nuevoModal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div class="
    modal-box w-11/12 max-w-xl
    bg-gradient-to-br from-white to-gray-100 
    dark:from-gray-900 dark:to-gray-800
    ">
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Nuevo reporte</h3>
        <div class="form-control">
            <label for = "rodeo" class="label cursor-pointer flex justify-start gap-2">
                <span class="label-text text-base">Mostrar por rodeos</span>
            </label>
            <input type="checkbox" class="checkbox" name="rodeo" bind:checked={generarReporteRodeos}>
            <label for = "lote" class="label cursor-pointer flex justify-start gap-2">
                <span class="label-text text-base">Mostrar por lotes</span>
            </label>
            <input type="checkbox" class="checkbox" name="lote" bind:checked={generarReporteLotes}>
        </div>
        <div class="modal-action justify-start">
            <form method="dialog" >
                <button class="btn btn-success text-white" disabled='{!generarReporteLotes && !generarReporteRodeos}' onclick={()=>generarReportePersonalizado = true}>Generar reporte</button>
                <button class="btn btn-success text-white justify-end" disabled='{generarReporteLotes || generarReporteRodeos}' onclick={()=>generarReporte = true}>Generar reporte general</button>
            </form>
        </div>
    </div>
</dialog>
<dialog id="chartpesaje" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl ">
    <div 
        class="
            modal-box  max-w-5xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost  rounded-xl">✕</button>
        </form> 
        <h3 class="text-lg font-bold">Pesos promedios</h3>  
        <div class="chart-container justify-items-center">
            <canvas class="" bind:this={canvas} >
            </canvas>
        </div>
        
        <div class="modal-action justify-start ">
            <button class="btn btn-error text-white" onclick={()=>chartpesaje.close()}>Cerrar</button>
        </div>
    </div>
</dialog>
<dialog id="chartpesajepersonalizadolotes" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl ">
    <div 
        class="
            modal-box  max-w-5xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form> 
        <h3 class="text-lg font-bold">Pesos promedios</h3>  
        <div class="chart-container justify-items-center">
            <canvas class="" bind:this={canvasPersonalizadoLotes} >
            </canvas>
        </div>
        
        <div class="modal-action justify-start ">
            <button class="btn btn-error text-white" onclick={()=>chartpesajepersonalizadolotes.close()}>Cerrar</button>
        </div>
    </div>
</dialog>
<dialog id="chartpesajepersonalizadorodeos" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl ">
    <div 
        class="
            modal-box  max-w-5xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form> 
        <h3 class="text-lg font-bold">Pesos promedios</h3>  
        <div class="chart-container justify-items-center">
            <canvas class="" bind:this={canvasPersonalizadoRodeos} >
            </canvas>
            <!--<canvas class="" bind:this={canvasTest} >
            </canvas>-->
        </div>
        
        <div class="modal-action justify-start ">
            <button class="btn btn-error text-white" onclick={()=>chartpesajepersonalizadorodeos.close()}>Cerrar</button>
        </div>
    </div>
</dialog>
<style>
    .chart-container {
        width: 800px;
        height:400px;
     }
</style>
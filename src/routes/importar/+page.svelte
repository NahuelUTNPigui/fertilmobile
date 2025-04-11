<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import CardImportar from '$lib/components/importar/CardImportar.svelte';

    import ImportarServicios from '$lib/components/importar/ImportarServicios.svelte';   
    import ImportarAnimal from '$lib/components/importar/ImportarAnimal.svelte';
    import ImportarLotes from '$lib/components/importar/ImportarLotes.svelte';
    import ImportarNacimiento from '$lib/components/importar/ImportarNacimiento.svelte';
    import ImportarObservaciones from '$lib/components/importar/ImportarObservaciones.svelte';
    import ImportarPesajes from '$lib/components/importar/ImportarPesajes.svelte';
    import ImportarRodeos from '$lib/components/importar/ImportarRodeos.svelte';
    import ImportarTactos from '$lib/components/importar/ImportarTactos.svelte';
    import ImportarInseminaciones from '$lib/components/importar/ImportarInseminaciones.svelte';
    import PocketBase from 'pocketbase';
    import { onMount } from "svelte";
    import { createCaber } from "$lib/stores/cab.svelte";
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let caber = createCaber()
    let cab = caber.cab
    let animales = $state([])
    let animalesusuario = $state(0)
    let cargado = $state(false)
    let usuarioid = $state("")
    onMount(async ()=>{
        let pb_json = await JSON.parse(localStorage.getItem('pocketbase_auth'))
        usuarioid = pb_json.record.id
        const records = await pb.collection('animales').getFullList({
            filter: `active = true && delete = false && cab = '${cab.id}'`
        })
        animales = records
        let animals = await pb.collection('Animalesxuser').getList(1,1,{filter:`user='${usuarioid}'`})
        animalesusuario = animals.totalItems
        cargado = true
    })

</script>
<Navbarr>
    {#if cargado}
    <CardImportar cardsize="max-w-2xl" titulo="Importar animales">
        <ImportarAnimal {animales} {animalesusuario}/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar tactos">
        <ImportarTactos {animales}/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar nacimientos">
        <ImportarNacimiento {animales} {animalesusuario}/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar rodeos">
        <ImportarRodeos/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar lotes">
        <ImportarLotes/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar observaciones">
        <ImportarObservaciones {animales}/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar servicios">
        <ImportarServicios {animales}/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar inseminaciones">
        <ImportarInseminaciones {animales}/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar pesajes">
        <ImportarPesajes {animales}/>
    </CardImportar>
    {:else}
    <CardImportar cardsize="max-w-2xl" titulo="Cargando">
        <span class="loading loading-spinner loading-xl"></span>
    </CardImportar>
    {/if}
    
</Navbarr>
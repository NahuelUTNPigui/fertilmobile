<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    
    import CardImportar from '$lib/components/importar/CardImportar.svelte';
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
    <CardImportar cardsize="max-w-2xl" titulo="Importar animales">
        <ImportarAnimal/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar tactos">
        <ImportarTactos/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar nacimientos">
        <ImportarNacimiento/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar rodeos">
        <ImportarRodeos/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar lotes">
        <ImportarLotes/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar observaciones">
        <ImportarObservaciones/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar inseminaciones">
        <ImportarInseminaciones/>
    </CardImportar>
    <CardImportar cardsize="max-w-2xl" titulo="Importar pesajes">
        <ImportarPesajes/>
    </CardImportar>
</Navbarr>
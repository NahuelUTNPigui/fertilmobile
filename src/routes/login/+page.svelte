<script>
    //TENGO QUE MODIFCAR EL OFFLINE CAB
    import BotonLoges from "$lib/components/herramientas/BotonLoges.svelte"
    import {enabled} from '$lib/stores/enabled'
    import { setInternetSQL } from '$lib/stores/sqlite/dbinternet';
    import {setUserOffline} from '$lib/stores/capacitor/offlineuser'
    import {setCabOffline,setDefaultCabOffline} from '$lib/stores/capacitor/offlinecab'
    import {usuario} from '$lib/stores/usuario'
    import { createCaber } from '$lib/stores/cab.svelte';
    import {createPer} from "$lib/stores/permisos.svelte"
    import Swal from 'sweetalert2'
    import { goto } from '$app/navigation';
    import Oscuro from "$lib/components/OscuroLogin.svelte";
    import PocketBase from 'pocketbase'
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    
    import { Network } from '@capacitor/network';
    import { onMount } from 'svelte';
    import { loger } from '$lib/stores/logs/logs.svelte';
    
    
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    
    let usuarioname= $state('')
    let contra = $state('')
    let showpass = $state(false)
    let logooscuro = $state(true)
    let coninternet = $state({connected:false})
    function isEmpty(str) {
        return (!str || str.length === 0 );
    }
    function nuevo(){
        if(coninternet){
            goto("/user/new")
        }
        else{
            Swal.fire("Sin intenet","Para crear un usuario necesitas internet","info")
        }
        
    }
    async function existeEmailUsuario(useremail) {
        const resultList = await pb.collection('users').getList(1, 1, {
            filter: `name='${useremail}'`,
            skipTotal:true
        });
        if(resultList.items.length>0){
            return true
        }
        else{
            return false
        }
    }
    //Aca deberia borrar los de las cabañas
    async function ingresar(){
        coninternet = await Network.getStatus();
        if(!coninternet.connected){
            Swal.fire("Sin intenet","Para ingresar necesitas internet","info")
            return
        }
        if(isEmpty(usuarioname)){
            Swal.fire('Error login', 'Nombre usuario vacio', 'error');
            return
        }
        if (isEmpty(contra)){
            Swal.fire('Error login', 'Contraseña vacia', 'error');
            return
        }
        let emailExiste = await existeEmailUsuario(usuarioname)
        if(!emailExiste){
            Swal.fire("Error login","No existe un usuario con ese correo","error")
            return
        }
        

        try{
            let caber = createCaber()
            let per = createPer()
            const authData = await pb.collection('users').authWithPassword(
                usuarioname,
                contra,
            );
            if(pb.authStore.isValid){
                if(pb.authStore.model.active){
                    
                    let pa = JSON.parse(localStorage["pocketbase_auth"])
                    usuario.set(pb.authStore.token)
                    
                    enabled.set("si")
                    // Cuando me logeo si o si debo poner si soy de otra cabaña
                    // Cuando te logeas, deberia revisar si tenes una cabaña
                    //Donde pongo si es colaborador o nos
                    await setUserOffline(
                        pa.record.id,
                        pa.record.nombre,
                        pa.record.apellido,
                        pa.record.username,
                        pa.token,
                        pa.record.nivel,
                        pa.record.codigo
                    );
                    
                    let reccabs = await pb.collection("cabs").getList(1,50,{
                        filter:`user='${authData.record.id}' && active=true`
                    })
                    
                    if(reccabs.totalItems > 0){
                        let establecimiento =  reccabs.items[0]
                        //Hay que guardar a la cabaña de preferencias
                        caber.setCab(establecimiento.nombre,establecimiento.id,true)
                        per.setPer("0,1,2,3,4,5",authData.record.id)
                        await setCabOffline(establecimiento.id,establecimiento.nombre,true,"0,1,2,3,4,5",false)
                        
                        localStorage.setItem('hasLoggedIn', 'si');
                        
                    }
                    else{
                        //Revisa si sos colaborador 
                        const recordcolabcab = await pb.collection('estxcolabs').getList(1,1,{
                            filter:`colab.user='${authData.record.id}'`,
                            expand: 'colab,cab,colab.user'
                        })
                        if(recordcolabcab.totalItems>0){
                            let colabcab = recordcolabcab.items[0]
                            let establecimiento = colabcab.expand.cab
                            const recordper = await pb.collection("permisos").getFirstListItem(`estxcolab='${colabcab.id}'`)
                            await setCabOffline(establecimiento.id,establecimiento.nombre,true,recordper.permisos,true)
                            
                            per.setPer(recordper.permisos,authData.record.id)
                            caber.setCab(establecimiento.nombre,establecimiento.id,true)
                            localStorage.setItem('hasLoggedIn', 'si');
                        }
                        //No tiene cab ni es colaborador
                        else{
                            caber.setDefault()
                            per.setDefault()
                            
                            await setDefaultCabOffline()
                        }
                        
                    }
                    
                    goto('/')
                }
                else{
                    Swal.fire('Error login', 'El usuario esta eliminado', 'error');
                }
                
            }
            else{
                if(modedebug){
                    loger.addTextError("Mal puestas las credenciales")
                }
                Swal.fire('Error login', 'Mal puestas las credenciales', 'error');

            }
        }
        catch(e){
            console.error(e)
            if(modedebug){
                loger.addTextError("NO se puede loger")
            }
            Swal.fire('Error login', 'No se puede logear, puede que esten mal escritas las credenciales', 'error');
        }
        
        
    }
    
    function keyEvent(e){
        if(e.code=="Enter"){
            if(usuarioname !="" && contra !=""){
                ingresar()
            }
        }
    }
    onMount(async ()=>{
        coninternet = await Network.getStatus();
    })
</script>
<svelte:window on:keydown={keyEvent}></svelte:window>
<div class="min-h-screen bg-gradient-to-br from-green-400 to-green-700  dark:from-gray-900 dark:to-gray-800 p-4">
    <div class="flex justify-end m-10">
        <Oscuro></Oscuro>
    </div>
    <div class="flex items-center justify-center">
        <div 
            class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full"
            in:fly="{{ y: 50, duration: 200, easing: quintOut }}"
            out:fade
        >
        
            <h1 class="hidden text-3xl font-bold text-green-700 dark:text-green-400 mb-6 text-center">Bienvenido a Fertil</h1>
            <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 32000 10000" class="fill-green-800 dark:fill-green-500" >
                <g id="Capa_x0020_1">
                    <metadata id="CorelCorpID_0Corel-Layer"/>
                    <g id="_710282024">
                     <path class="fil0" d="M5412.18 3189.05c-35.2,-131.84 -390.36,-365.23 -536.95,-428.34 -345.2,-148.61 -449.52,-130.51 -834.77,-130.51 -663.56,0 -1275.16,-16.94 -1930.56,-16.94 -121.75,522.59 -102.71,1061.88 196.16,1514.25 521.1,788.74 1418.2,1009.04 2445.66,1009.04l0 -592.72c-322.74,0 -557.74,-15.41 -856.51,-74.9 -615.32,-122.52 -1260.34,-507.05 -1260.34,-1246.01l1693.48 0c362.29,0 795.94,375.75 795.94,694.32l0 287.89 609.65 0c0,-540.55 -45.95,-421.66 148.33,-613.73 177.83,-175.82 356.4,-459.88 433.17,-701.46 21.73,-68.37 12.52,-69.77 66.67,-102.68 54.1,-32.89 159.93,-81.05 215.69,-106.07 96.34,-43.23 382.44,-152.6 507.86,-152.6l965.28 0c120.5,0 423.88,155.5 517.95,210.24 232.93,135.56 58.22,208.48 413.27,670.57 26.83,34.93 52.75,67.36 82.32,103.96 148.83,184.25 224.24,181.69 223.89,334.96 -0.34,145.76 15.75,221.41 15.75,356.81l592.71 0c0,-304.8 -12.26,-526.97 291.63,-775.26 180.74,-147.67 361.95,-207.93 605.87,-207.01 536.13,2.04 1072.68,0.06 1608.85,0.06 -75.68,157.72 53.32,1164.53 -1777.15,1304.98 -72.58,5.57 -106.76,17.71 -204.3,15.85 -214.54,-4.09 -169.26,-74.25 -169.26,541.99 0,65.85 43.43,50.81 152.41,50.81 815.72,0 1470.49,-207.26 1966.99,-607.1 810.15,-652.43 641.48,-1916.19 505.49,-1916.19l-2066.05 0c-324.23,0 -625.9,107.58 -860.44,257.26 -219.66,140.18 -314.17,288.6 -358.86,318.53 -85.89,-57.52 -173.35,-197.59 -233.97,-291.01 -90.89,-140.06 -104.73,-214.94 -104.73,-437.19 -48.62,-12.98 -198.12,-121.44 -260.88,-162.49 -95.91,-62.73 -163.96,-100.74 -269.74,-153.63 -114.5,-57.25 -480.66,-225.79 -620.94,-225.79l-1033.03 0c-140.9,0 -465.13,107.94 -575.96,152.22 -142.85,57.08 -636.05,289.28 -712.21,388.56 -82.63,107.73 67.64,139.14 -205.12,540.01 -40.71,59.83 -116.33,171.45 -183.25,189.32z"/>
                     <path class="fil0" d="M5767.81 8438.83c269.68,180.59 265.32,194.5 592.47,355.88 144.46,71.27 540.56,219.9 745.38,219.9l999.15 0c328.25,0 1168.5,-534.74 1168.5,-592.71 0,-95.65 -33.87,-93.08 -33.87,-270.96 0,-147.74 226.64,-640.69 295.04,-754.92 95.45,-159.4 168.57,-316.01 288.13,-490.87 100.55,-147.07 60.36,-552.39 60.36,-735.58 -0.01,-192.74 17.36,-327.41 16.95,-508.02 -0.84,-370.57 16.91,-692.22 16.91,-1049.98l-592.71 0 -34.43 1235.68c-6.08,203.43 -0.65,422.64 0.79,627.38 1.72,243.69 -45.43,214.5 -180.71,462.81 -213.27,391.49 -373.05,695.99 -455.09,1136.78 -23.34,125.4 -7.66,74.45 -157.08,164.68 -83.51,50.44 -345.16,183 -460.53,183l-897.54 0c-197.94,0 -601.99,-195.22 -745.13,-270.96 0,-355.82 -262.39,-851.9 -417.48,-1157.46 -31.73,-62.52 -61.33,-111.37 -97.71,-173.24 -159.45,-271.16 -112.48,-199.77 -111.38,-684.56l-16.28 -779.66c-1.23,-99.41 -18.49,-139.12 -17.83,-253.12 0.51,-90.4 -0.05,-180.8 0.24,-271.2 0.9,-273.93 95.84,-220.13 -558.87,-220.13 -69.53,0 -33.42,27.15 -33.82,220.09l51.19 1964.06c8.4,83.18 55.39,123.73 95.89,192.01 177.85,299.87 360.75,630.91 473.52,965.93 20.92,62.15 49,174.8 50.45,233.3 1.95,78.45 -42.49,161.06 -44.51,251.87z"/>
                     <path class="fil0" d="M14658.58 3663.22c0,618.56 -91.54,1280.36 475.07,1574.03 220.14,114.1 399.37,102.51 642.62,102.51 315.32,0 584.27,-168.49 731.9,-402.73 185.47,-294.27 130.3,-353.27 -52.17,-412.47 -66.26,-21.49 -157.9,-58.62 -239.42,-65.4l-84.85 152.24c-80.52,185.95 -225.52,288.06 -457.07,288.06 -338.6,0 -524.97,-170.25 -524.97,-508.04l0 -863.68c0,-612.16 710.72,-564.65 911.09,-352.24 75.08,79.6 99.2,197.56 122.13,233.5 59.07,92.6 130.58,37.36 277.23,-10.26 147.99,-48.04 256.96,-65.43 47.86,-399.51 -353.49,-564.77 -1236.21,-517.72 -1600.06,-136.6 -175.01,183.32 -249.36,448.3 -249.36,800.59z"/>
                     <path class="fil0" d="M14658.58 6152.63l0 2286.2c0,213.65 125.48,169.35 355.63,169.35 100.94,0 135.48,-68.35 135.48,-169.35l0 -914.48 795.93 0c153.08,0 118.54,-144.73 118.54,-338.69 0,-45.74 -8.08,-46.7 -16.93,-84.68 -134.13,-64.36 -716.44,-33.87 -897.54,-33.87l0 -660.45 965.28 0c153.08,0 118.54,-144.73 118.54,-338.7 0,-45.74 -8.08,-46.69 -16.93,-84.67 -40.96,-19.65 -74.09,-33.87 -135.48,-33.87l-1287.05 0c-115.03,0 -135.47,89.16 -135.47,203.21z"/>
                     <path class="fil0" d="M28257.21 3697.09c364.23,0 406.44,82.12 406.44,440.3l-677.39 0c0,-107.73 17.92,-225.53 55.55,-300.08 33.3,-65.96 128.96,-140.22 215.4,-140.22zm-711.26 474.17c0,321.53 -29.71,703.55 174.06,943.64 198.75,234.18 393.67,241.8 689.62,241.8 218.84,0 441.22,-98.71 559.28,-253.59 159.99,-209.92 118.13,-236.8 -30.84,-325.66 -255.97,-152.68 -202.63,-24.83 -319.99,93.37 -146.13,147.17 -552.8,165.14 -612.48,-143.12 -30.71,-158.68 -75.06,-151.86 -229.32,-227.92l1056.74 -23.67c322.88,0.96 270.93,5.89 270.93,-491.13 0,-95.17 -40.01,-212.18 -72.96,-282.67 -209.47,-448.28 -910.63,-527.88 -1263.24,-189.86 -160.47,153.82 -221.8,365.26 -221.8,658.81z"/>
                     <path class="fil0" d="M22973.56 3984.98c0,-154.03 128.5,-287.89 254.02,-287.89 275.87,0 423.37,16.48 423.37,440.3l-677.39 0 0 -152.41zm-457.24 254.02c0,336.26 -15.15,597.71 162.16,853.93 232.01,335.28 868.57,322.76 1120.53,140.87 179.12,-129.3 371.51,-316.05 111.58,-458.5 -57.97,-31.77 -141.87,-86.71 -193,-62.84 -87.02,40.64 -109,254.74 -337.6,254.74 -185.09,0 -345.41,9.83 -402.01,-241.51 -50.21,-222.96 -130.32,-138.23 -258.44,-249.6l1169.22 0.72c226.12,1.72 202.5,-101.41 202.5,-305.55 0,-269.51 -57.58,-480.95 -190.22,-622.65 -320.86,-342.78 -913.52,-314.32 -1202.71,8.73 -136.09,152.04 -182.01,399.07 -182.01,681.66z"/>
                     <path class="fil0" d="M18536.64 4001.92c0,-143.05 102.11,-304.83 287.9,-304.83 292.9,0 389.5,72.69 389.5,440.3l-677.4 0 0 -135.47zm-440.3 0c0,463.94 -66.21,839.7 191.04,1146.8 217.7,259.87 804.57,272.22 1086.5,79.93 84.52,-57.64 229.66,-201.4 229.66,-329.19 0,-77.75 -230.24,-185.84 -304.83,-203.22l-37.05 30.69c-152.55,153.5 -36.92,240.27 -470.99,240.27 -122.26,0 -219.06,-104.18 -246.86,-244.26 -36.94,-186.12 -58.63,-121.11 -221.54,-218.76 -33.94,-20.35 -17.18,-8.56 -39.65,-28.09l1169.22 0.72c237.25,1.81 202.5,-111.57 202.5,-373.29 0,-1109.79 -1558,-995.1 -1558,-101.6z"/>
                     <path class="fil0" d="M16741.56 7304.2c0,-146.73 115.53,-304.83 254.02,-304.83 284.67,0 423.37,13.07 423.37,440.31l-677.39 0 0 -135.48zm-440.31 33.87c0,454.31 -90.58,1051.56 401.16,1258.45 248.36,104.49 648.39,83.19 866.18,-58.85 85.84,-55.98 239.86,-203.6 239.86,-335.93 0,-69.11 -258.48,-230.79 -332.47,-181.71 -34.93,23.17 -38.7,46.86 -58.14,78.98 -12.61,20.83 -8.51,16.22 -27.34,40.41 -148.81,191.12 -561.69,202.72 -638.13,-100.9 -53.15,-211.09 -43.51,-123.15 -225.19,-232.06 -33.93,-20.34 -17.17,-8.55 -39.65,-28.09l1169.23 0.72c234.9,1.8 202.49,-109.44 202.49,-356.35 0,-955.98 -1014.11,-941.28 -1342.41,-614.21 -122.97,122.51 -215.59,291.98 -215.59,529.54z"/>
                     <path class="fil0" d="M24396.08 3680.15l0 1473.33c0,61.39 14.22,94.53 33.87,135.48 119.17,27.76 270.33,27.76 389.5,0 70.77,-147.48 33.87,-517.35 33.87,-728.2 0,-259.66 0,-519.33 0,-779 110.88,-58.66 322.61,-91.3 452.71,-29.34 151.06,71.94 157.22,206.5 156.95,418.84 -0.26,204.79 -29.21,986.25 33.86,1117.7 119.17,27.76 270.33,27.76 389.5,0 67.45,-140.57 33.87,-944.17 33.87,-1151.57 0,-261.45 -42.79,-448.13 -159.16,-602.9 -216.74,-288.27 -750.7,-257.01 -1071.13,-153.21 -73.66,23.86 -144,46.49 -202.6,85.29 -72.2,47.81 -91.24,102.47 -91.24,213.58z"/>
                     <path class="fil0" d="M19959.17 4001.92c0,319.02 -34.69,703.18 56.64,959.44 85.25,239.19 332.85,395.34 620.75,395.34 299.39,0 574.04,-30.09 751.01,-315.88 67.61,-109.19 95.73,-160.44 95.73,-276.84 0,-84.81 -302,-135.48 -338.7,-135.48 -143.86,0 -45.43,338.7 -423.37,338.7 -410.11,0 -321.76,-451.85 -321.76,-914.48 0,-433.57 441.96,-358.05 535.99,-298.9 235.82,148.34 5.09,364.48 414.98,233.78 66.41,-21.18 132.86,-39.43 132.86,-121.16 0,-139.28 -133.78,-309.99 -241.8,-401.73 -259.6,-220.47 -792.09,-205.07 -1057.48,16.93 -122.6,102.56 -224.85,301.17 -224.85,520.28z"/>
                     <path class="fil0" d="M26411.32 3070.5l0 287.89c-228.2,0 -106.95,-8.28 -287.89,33.87 -9.18,110.32 -46.74,239.86 16.94,372.57 120.19,28 127.12,16.93 270.95,16.93l0 745.13c0,714.77 230.17,779 762.07,779 147.21,0 118.54,-168.77 118.54,-304.82 0,-62.17 -26.24,-81.86 -50.8,-118.55 -461.15,0 -372.57,9.01 -372.57,-1100.76 154.67,0 260.17,13.2 389.5,-16.93 45.67,-95.17 33.87,-152.39 33.87,-270.96 0,-175.59 -217.43,-135.48 -423.37,-135.48 0,-154.45 19.33,-312.49 -33.87,-423.37 -123.6,-28.79 -157.26,-16.93 -304.82,-16.93 -94.99,0 -118.55,58.54 -118.55,152.41z"/>
                     <path class="fil0" d="M19671.27 6237.31c-30.51,130.96 -16.93,266.1 -16.93,423.37 -355.58,0 -304.83,-11.37 -304.83,338.69 0,110.54 203.65,84.68 304.83,84.68l0 931.41c0,562.15 360.8,592.72 745.13,592.72 171.96,0 128.34,-291.71 101.61,-406.44 -183.49,-42.75 -406.44,59.46 -406.44,-287.89l0 -829.8c462.82,0 423.37,44.56 423.37,-304.83 0,-45.74 -8.08,-46.69 -16.93,-84.67 -109.54,-52.56 -255.08,-33.87 -406.44,-33.87 0,-484.95 63.34,-440.31 -338.69,-440.31 -26.68,0 -64.18,8.98 -84.68,16.94z"/>
                     <path class="fil0" d="M21771.19 5949.42c0,368.02 -26.21,2456.66 16.93,2641.82 122.79,28.61 283.65,28.61 406.44,0 43.22,-185.51 16.93,-2304.53 16.93,-2675.69 0,-102.83 -178.75,-67.74 -372.56,-67.74 -52.06,0 -67.74,49.61 -67.74,101.61z"/>
                     <path class="fil0" d="M16910.9 3781.76c0,195.74 -16.01,1352.17 16.5,1456.83 29.89,96.2 125.93,67.3 322.2,67.3 96.74,0 118.28,-52.63 119.67,-151.29l-1.15 -1118.84c-0.34,-113.3 -26.17,-202.53 52.84,-235.05 108.68,-44.73 389.27,-21.67 522.97,-52.82 10.58,-127.22 38.76,-189.22 0,-355.63 -155.65,-74.68 -603.72,-11.33 -741.16,20.91 -222.33,52.16 -291.87,85.46 -291.87,368.59z"/>
                     <path class="fil0" d="M18130.21 6965.5l0 1524.13c0,153.08 144.73,118.55 338.69,118.55 117.86,0 119.71,-97.17 118.94,-270.56l-0.39 -1219.7c215.6,-103.45 575.78,19.86 575.78,-118.55 0,-276.57 40.72,-338.69 -169.35,-338.69 -235.45,0 -863.67,-9.03 -863.67,304.82z"/>
                     <path class="fil0" d="M20839.78 6796.16l0 1659.6c0,61.4 14.22,94.53 33.87,135.48 119.17,27.77 270.32,27.77 389.5,0 19.65,-40.95 33.86,-74.08 33.86,-135.48l0 -1659.6c0,-157.57 -160.58,-135.48 -287.89,-135.48 -101,0 -169.34,34.54 -169.34,135.48z"/>
                     <path class="fil0" d="M21771.19 3476.94l0 1710.41c0,154.81 149.91,118.54 355.63,118.54 39.49,0 84.67,-45.18 84.67,-84.67l0 -1778.15c0,-97.84 -185.4,-84.68 -270.95,-84.68 -93.16,0 -169.35,22.43 -169.35,118.55z"/>
                     <path class="fil0" d="M17672.97 6508.26c92.95,62.25 97.83,118.55 237.09,118.55 48.98,0 443.33,-368.97 491.11,-440.31 -23.05,-98.93 -150.88,-203.21 -254.03,-203.21 -68.42,0 -294.11,304.43 -368.24,376.88 -70.39,68.78 -60.65,62.51 -105.93,148.09z"/>
                     <path class="fil0" d="M21923.6 3087.44c240.27,0 321.76,20.6 321.76,-254.02 0,-260.53 -129.43,-220.16 -355.63,-220.16 -135.6,0 -155.43,154.57 -150.32,251.66 7.22,137.11 30.13,222.52 184.19,222.52z"/>
                     <path class="fil0" d="M20822.84 6084.89c0,297.7 -2.07,304.83 304.83,304.83 204.42,0 186.28,-145.79 186.28,-287.89 0,-220.81 -148.37,-186.28 -321.76,-186.28 -121.06,0 -169.35,48.28 -169.35,169.34z"/>
                    </g>
                </g>
            </svg>
            
            
            <div class="space-y-6">
                <div>
                    <label for="username" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Email
                    </label>
                    <input 
                        type="username" 
                        id="username" 
                        bind:value={usuarioname} 
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                </div>
                <div>
                    <label for="password" 
                        
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Contraseña
                    </label>
                    <input 
                        type={showpass?"text":"password"} 
                        id="password" 
                        bind:value={contra} 
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    <div class="form-control ">
                        <label class="label cursor-pointer">
                          <span class="label-text">Mostrar constraseña</span>
                          <input type="checkbox" bind:checked={showpass} class="checkbox" />
                        </label>
                    </div>
                </div>
                <div>
                    <button 
                        class="w-full bg-green-600 text-white rounded-md py-2 px-4 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition" 
                        onclick={ingresar}
                    >
                        Ingresar
                    </button>
                </div>
                
            </div>
            <div class="mt-6 text-center">
                <a href="/recover" 
                    class="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition"
                >
                    ¿Olvidaste la contraseña?
                </a>
            </div>
            
            <div class="mt-8 border-t border-gray-200 pt-6 text-center">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    ¿No tienes una cuenta?
                    <a 
                        href="/user/new" 
                        class="font-medium text-green-600 dark:text-green-400  hover:text-green-800 dark:hover:text-green-300 transition"
                    >
                        Crear una
                    </a>
                </p>
            </div>

        </div>
    </div>
    
</div>
<BotonLoges></BotonLoges>
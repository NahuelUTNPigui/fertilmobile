<script>
    import { Filesystem, Directory } from '@capacitor/filesystem';
    import { InAppBrowser, DefaultWebViewOptions } from '@capacitor/inappbrowser';
    import Navbarr from '$lib/components/Navbarr.svelte';
    import { goto } from "$app/navigation";
    import estilos from "$lib/stores/estilos";
    let ruta = import.meta.env.VITE_RUTA
    let titulo = "Manual usuario"
    let cardsize = "max-w-5xl"
    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    async function verManualEnApp() {
        try {
            await InAppBrowser.openInWebView({
                url: 'https://crecientefertil.com.ar/aplicacion/Manual%20de%20Usuario.pdf',
                options: DefaultWebViewOptions
                //toolbarColor: '#0f766e', // Verde oscuro (ajusta según tu tema)
                //showTitle: true,
                //enableUrlBar: false,
                //presentationStyle: 'fullscreen' // Opcional: más inmersivo en iOS
            });
        } catch (error) {
            console.error('Error al abrir el manual:', error);
            alert('No se pudo abrir el manual. Intenta descargarlo.');
        }
    }
    async function descargarManual(){
        const response = await fetch('/Manual de Usuario.pdf');
        const blob = await response.blob();
        const base64Data = await blobToBase64(blob);

        await Filesystem.writeFile({
            path: 'Manual de Usuario.pdf',
            data: base64Data,
            directory: Directory.Documents
        });
        //goto(`/Manual de Usuario.pdf`)
        //const base64Data = base64String.startsWith('data:application/pdf;base64,')
        //    ? base64String.split(',')[1]
        //    : base64String;
    }
</script>
<Navbarr>
    <div class="bg-transparent p-2">
        <div class="flex items-center justify-center ">
            <div 
                class={`
                    bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-2 w-full 
                    ${cardsize}
                `}
            >
                <h1 class="text-2xl font-bold text-green-700 dark:text-green-400 mb-3 text-start">{titulo}</h1>
                <div class="space-y-4 grid grid-cols-1 flex justify-center">
                    <a
                        href="https://crecientefertil.com.ar/aplicacion/Manual%20de%20Usuario.pdf"
                        download="Manual de Usuario.pdf"
                        class={`
                            w-full text-center
                            ${estilos.basico} ${estilos.grande} ${estilos.primario}
                        `}
                        
                    >
                       Descargar manual
                    </a>
                </div>
                <div class="hidden space-y-4 grid grid-cols-1 flex justify-center">
                    <button
                        onclick={verManualEnApp}
                        download="Manual de Usuario.pdf"
                        class={`
                            w-full
                            ${estilos.basico} ${estilos.grande} ${estilos.primario}
                        `}
                        
                    >
                       Ver manual
                    </button>
                </div>
            </div>
        </div>
    </div>
</Navbarr>
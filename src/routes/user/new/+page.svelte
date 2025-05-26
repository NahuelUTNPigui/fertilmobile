<script>
    import {enabled} from '$lib/stores/enabled'
    import {usuario} from '$lib/stores/usuario'
    import Swal from 'sweetalert2'
    import { goto } from '$app/navigation';
    import Oscuro from "$lib/components/OscuroLogin.svelte";
    import PocketBase from 'pocketbase'
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { randomString } from '$lib/stringutil/lib';

    let ruta = import.meta.env.VITE_RUTA
    let pre = import.meta.env.VITE_PRE
    const pb = new PocketBase(ruta);
    let usuarioemail=''
    let contra = ''
    let confirmcontra = ''
    let nombre = ''
    let apellido = ''
    let malnombre = false
    let malapellido = false
    let malusuarioname = false
    let malcontra = false
    let malconfirmcontra = false
    let botonhabilitado = false
    let condiciones = false




    function isEmpty(str) {
        return (!str || str.length === 0 );
    }
    function validarBoton(){
        botonhabilitado = true
        if(isEmpty(nombre)){
            botonhabilitado = false
            return
        }
        if(isEmpty(apellido)){
            botonhabilitado = false
            return
        }
        if(isEmpty(usuarioemail)){
            botonhabilitado = false
            return
        }
        if (isEmpty(contra) || contra.length < 10){
            botonhabilitado = false
            return
        }
        if (contra != confirmcontra){
            botonhabilitado = false
            return
        }
    }
    function onInput(campo){
        validarBoton()
        if (campo=="NOMBRE"){
            if(isEmpty(nombre)){
                malnombre = true
            }
            else{
                malnombre = false
            }
        }
        if (campo=="APE"){
            if(isEmpty(apellido)){
                malapellido = true
            }
            else{
                malapellido = false
            }
        }
        if(campo == "EMAIL"){
            if(isEmpty(usuarioemail)){
                malusuarioname = true
            }
            else{
                malusuarioname = false
            }
        }
        else if(campo == "CONTRA"){
            if(isEmpty(contra) || contra.length < 10){
                malcontra = true
            }
            else{
                malcontra = false
            }
        }
        else if(campo == "CONF"){
            if(contra != confirmcontra){
                malconfirmcontra = true
            }
            else{
                malconfirmcontra = false
            }
        }
    }
    async function guardar(){
        
        if(isEmpty(usuarioemail)){
            Swal.fire('Error guardar', 'Nombre usuario vacio', 'error');
            return
        }
        if (isEmpty(contra)){
            Swal.fire('Error guardar', 'Contraseña vacia', 'error');
            return
        }
        if (isEmpty(confirmcontra)){
            Swal.fire('Error guardar', 'Confirmar contraseña no puede estar vacio', 'error');
            return
        }
        let coincide = await existeCorreo(usuarioemail)
        if(coincide){
            Swal.fire('Error guardar', 'Ya existe un usuario con ese correo', 'error');
            return
        }
        try{
            let nombredata = nombre.trim().split(" ").filter(w=>w !== "").join(".")
            let apellidodata = apellido.trim().split(" ").filter(w=>w !== "").join(".")
            let randomnumber = randomString(5,"n")
            const data = {
                "username": nombredata+"."+apellidodata+randomnumber,
                "email": usuarioemail.trim(),
                "emailVisibility": true,
                "password": contra,
                "passwordConfirm": confirmcontra,
                "name": usuarioemail.trim(),
                "nombre":nombre.trim(),
                "apellido":apellido.trim(),
                "active": true,
                "codigo":randomString(10,"n")
            };
            const record = await pb.collection('users').create(data);
            Swal.fire('Éxito guardar', 'Se logró guardar el nuevo usuario. Ingrese a la aplicación', 'success');
            goto(pre+"/")
        }catch(e){
            console.error(e)
            Swal.fire('Error guardar', 'No se puede crear el nuevo usuario', 'error');
        }
        
    }
    function volver(){
        goto(pre+"/")
    }
    function keyEvent(e){
        if(e.code=="Enter"){
            if(usuarioemail !="" && contra !="" && confirmcontra !=""){
                guardar()
            }
        }
    }
    async function existeCorreo() {
        
        const record = await pb.collection('users').getList(1,1,
        {
            filter:`email = '${usuarioemail}' && active = true`
        });
        
        if(record.totalItems != 0){
            return true
        }
        else{
            return false
        }
    }
</script>
<svelte:window on:keydown={keyEvent}></svelte:window>   
<div class="min-h-screen bg-gradient-to-br from-green-400 to-green-700  dark:from-gray-900 dark:to-gray-800 p-4">
    <div class="flex justify-end m-10">
        <Oscuro></Oscuro>
    </div>
    <div class="flex items-center justify-center">
        <div 
            class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full"
            in:fly="{{ y: 50, duration: 500, easing: quintOut }}"
            out:fade
        >
            <h1 class="text-3xl font-bold text-green-700 dark:text-green-400 mb-6 text-center">Crear usuario</h1>
            <div class="space-y-6">
                <div>
                    <label for="nombr" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Nombre
                    </label>
                    <input 
                        type="nombre" 
                        id="nombre" 
                        bind:value={nombre} 
                        oninput={()=>onInput("NOMBRE")}
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    {#if malnombre}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe escribir el nombre que usará, lo puede cambiar mas adelante</span>                    
                        </div>
                    {/if}
                </div>
                <div>
                    <label for="apellido" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Apellido
                    </label>
                    <input 
                        type="apellido" 
                        id="apellido" 
                        bind:value={apellido} 
                        oninput={()=>onInput("APE")}
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    {#if malapellido}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe escribir el apellido que usará, luego lo podrá cambiar</span>                    
                        </div>
                    {/if}
                </div>
                <div>
                    <label for="nombreusuario" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Email
                    </label>
                    <input 
                        type="nombreusuario" 
                        id="nombreusuario" 
                        bind:value={usuarioemail} 
                        oninput={()=>onInput("EMAIL")}
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    {#if malusuarioname}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe escribir el correo que usará</span>                    
                        </div>
                    {/if}
                </div>
                <div>
                    <label for="password" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Contraseña
                    </label>
                    <input 
                        type="password" 
                        id="password" 
                        bind:value={contra} 
                        oninput={()=>onInput("CONTRA")}
                        
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    {#if malcontra}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe escribir una contraseña de al menos 10 caracteres</span>                    
                        </div>
                    {/if}
                </div>
                <div>
                    <label for="passwordconf" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Confirmar Contraseña
                    </label>
                    <input 
                        type="password" 
                        id="passwordconf" 
                        bind:value={confirmcontra} 
                        oninput={()=>onInput("CONF")}
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    {#if malconfirmcontra}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Deben coincidir las contraseñas</span>                    
                        </div>
                    {/if}
                </div>
                <div class="">
                    <div class="form-control">
                        <label class="cursor-pointer label">
                            
                            <button 
                                id="terminosBtn"
                                class="px-0 mx-0 underline decoration-green-500 hover:decoration-green-700 cursor-pointer"
                                onclick={()=>condmodal.showModal()}
                            >
                                Acepto  términos y condiciones
                            </button>
                          <input type="checkbox" bind:checked={condiciones} class="checkbox checkbox-success [--chkfg:white]" />
                        </label>
                    </div>
                </div>
                <div>
                    <button 
                        onclick={guardar}
                        class={`
                            w-full  ${botonhabilitado && condiciones?"bg-green-600":"bg-gray-600"} text-white rounded-md py-2 px-4 
                            hover:bg-green-700 focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:ring-offset-2 transition
                        `}
                        disabled='{!botonhabilitado || !condiciones}'
                    >
                      Crear cuenta
                    </button>
                </div>
            </div>
            <div class="mt-6 text-center">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Ya tienes cuenta?
                    <a href={pre+"/" }
                    class="font-medium text-green-600 dark:text-green-400  hover:text-green-800 dark:hover:text-green-300 transition"
                    >
                        Volver
                    </a>
                </p>
            </div>
        </div>
    </div>
</div>
<dialog id="condmodal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div class="
            modal-box max-w-xl w-11/12
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        
        <div class="grid grid-cols-1 m-0 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10" >
            <div class="max-h-[70vh] overflow-y-auto p-4 text-sm text-gray-700 dark:text-white">
                <h1 class="text-xl font-bold mb-4 text-center">TÉRMINOS Y CONDICIONES DE USO DE "CRECIENTE FÉRTIL"</h1>
                
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">1. Aceptación de los Términos</h2>
                  <p class="mb-4">Al registrarte y/o utilizar "Creciente Fértil", aceptas de forma plena y sin reservas los presentes Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, no deberás utilizar la aplicación.</p>
                </div>
              
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">2. Objeto de la Aplicación</h2>
                  <p class="mb-4">"Creciente Fértil" es un sistema de gestión ganadera que, a través de su aplicación móvil y web, permite la carga, gestión y seguimiento de datos relativos a los movimientos y eventos que se realicen en el ganado, facilitando la administración de la información desde cualquier dispositivo.</p>
                </div>
              
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">3. Usuarios Autorizados</h2>
                  <p class="mb-4">La aplicación está dirigida a productores ganaderos y veterinarios. No se establece una restricción de edad; sin embargo, se recomienda que los usuarios sean legalmente capaces de asumir compromisos derivados del uso de la aplicación.</p>
                </div>
              
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">4. Registro y Seguridad de la Información</h2>
                  <p class="mb-4">Para acceder a "Creciente Fértil", es necesario registrarse y crear una cuenta con un usuario y una contraseña privada. La protección y el cuidado de dicha contraseña son responsabilidad exclusiva del usuario. Se recomienda utilizar contraseñas seguras y no compartirlas con terceros. El usuario principal es responsable de autorizar a otros usuarios para asociar su información. Los datos personales y de la hacienda se tratarán con la debida confidencialidad y solo se compartirán con aquellos usuarios autorizados por el titular de la cuenta.</p>
                </div>
              
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">5. Uso de Datos y Privacidad</h2>
                  <p class="mb-4">La información ingresada en la aplicación se utilizará para gestionar los movimientos y eventos del ganado y, de manera general, para generar informes estadísticos (por ejemplo, total de animales registrados en la app), sin comprometer datos personales. Todo el manejo de la información se realiza conforme a la Política de Privacidad, la cual se integra a estos Términos y Condiciones.</p>
                </div>
              
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">6. Planes de Pago y Acceso</h2>
                  <p class="mb-4">La aplicación cuenta con distintos planes de pago. Por el momento, la facturación y los pagos se realizarán de forma externa a la app; una vez verificado el pago, los administradores otorgarán el acceso correspondiente. Cada plan establece límites específicos en la cantidad de datos que se pueden registrar.</p>
                </div>
              
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">7. Restricciones y Responsabilidades del Usuario</h2>
                  <p class="mb-4">El usuario se compromete a:</p>
                  <ul class="list-disc pl-6 mb-4">
                    <li class="mb-2">Utilizar la aplicación únicamente para fines lícitos y de acuerdo con lo establecido en estos Términos.</li>
                    <li class="mb-2">Ingresar información veraz y actualizada.</li>
                    <li>Respetar los límites de datos establecidos según el plan contratado.</li>
                  </ul>
                  <p>El incumplimiento de estas condiciones podrá conllevar la suspensión o cancelación de la cuenta.</p>
                </div>
              
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">8. Propiedad Intelectual</h2>
                  <p class="mb-4">Todos los derechos de propiedad intelectual e industrial sobre "Creciente Fértil" y su contenido corresponden a sus desarrolladores. Se prohíbe la reproducción total o parcial de la aplicación o su contenido sin autorización expresa.</p>
                </div>
              
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">9. Limitación de Responsabilidad</h2>
                  <p class="mb-4">La aplicación se ofrece "tal cual", sin garantías expresas o implícitas. Los desarrolladores no serán responsables por errores, interrupciones en el servicio o pérdida de datos, salvo en casos de dolo o negligencia grave. El uso de la aplicación es responsabilidad exclusiva del usuario. Asimismo, la empresa no garantiza que el uso de la aplicación genere mejoras en la gestión del ganado ni en la productividad de los usuarios. Cada usuario es responsable de la interpretación y utilización de los datos obtenidos a través de la aplicación.</p>
                </div>
              
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">10. Modificaciones a los Términos y Condiciones</h2>
                  <p class="mb-4">"Creciente Fértil" se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones serán notificadas a través de la aplicación o por otros medios. El uso continuado de la aplicación tras la publicación de cambios implicará la aceptación de las nuevas condiciones.</p>
                </div>
              
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">11. Legislación Aplicable y Jurisdicción</h2>
                  <p class="mb-4">Estos Términos y Condiciones se rigen por las leyes de la República Argentina. Cualquier controversia derivada del uso de la aplicación será sometida a la jurisdicción de los tribunales competentes en Argentina.</p>
                </div>
              
                <div class="mb-6">
                  <h2 class="font-semibold text-lg mb-2">12. Contacto</h2>
                  <p class="mb-4">Para cualquier consulta, reclamo o sugerencia sobre estos Términos y Condiciones, los usuarios pueden ponerse en contacto con el equipo de "Creciente Fértil" a través de los canales habilitados en la aplicación.</p>
                </div>
              
                <div class="text-sm italic text-gray-500">
                  <p>Fecha de última actualización: 29/03/2025</p>
                </div>
            </div>
            
        </div>
    </div>
</dialog>
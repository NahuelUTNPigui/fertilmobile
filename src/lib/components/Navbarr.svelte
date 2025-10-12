<script>
  import Oscuro from "./Oscuro.svelte";
  import PocketBase from "pocketbase";
  import { enabled } from "$lib/stores/enabled";
  import { onMount } from "svelte";
  import { usuario } from "$lib/stores/usuario";
  import { goto } from "$app/navigation";

  import { createDarker } from "$lib/stores/dark.svelte";
  import { page } from "$app/stores";
  import { createCaber } from "$lib/stores/cab.svelte";

  import BotonLoges from "$lib/components/herramientas/BotonLoges.svelte";
  //SVG
  import Animal from "$lib/svgs/animal.svelte";
  import Estable from "$lib/svgs/estable.svelte";
  import Lote from "$lib/svgs/lote.svelte";
  import Movimiento from "$lib/svgs/movimiento.svelte";
  import Nacimiento from "$lib/svgs/nacimiento.svelte";
  import Observacion from "$lib/svgs/observacion.svelte";
  import Pesaje from "$lib/svgs/pesaje.svelte";
  import Rodeo from "$lib/svgs/rodeo.svelte";
  import Servicio from "$lib/svgs/servicio.svelte";
  import Tacto from "$lib/svgs/tacto.svelte";
  import Tratamiento from "$lib/svgs/tratamiento.svelte";
  import { loger } from "$lib/stores/logs/logs.svelte";
  import {
    getUserOffline,
    setDefaultUserOffline,
  } from "$lib/stores/capacitor/offlineuser";
  import {
    getCabOffline,
    setDefaultCabOffline,
  } from "$lib/stores/capacitor/offlinecab";
  import { openDB } from "$lib/stores/sqlite/main";
  import { shorterWord } from "$lib/stringutil/lib";
  import { offliner } from "$lib/stores/logs/coninternet.svelte";
  import { customoffliner } from "$lib/stores/offline/custom.svelte";
  import { getInternet } from "$lib/stores/offline";
  //let debo poner el coninternet
  let {
    children,
    coninternet = $bindable({ connected: false, connectionType: "none" }),
  } = $props();
  let pageurl = $page.url.pathname;
  let ruta = import.meta.env.VITE_RUTA;
  let modedebug = import.meta.env.VITE_MODO_DEV == "si";
  //pre
  let pre = "";
  const pb = new PocketBase(ruta);
  let darker = createDarker();
  let leido = $state(true);
  let notificaciones = $state([]);
  let useroff = $state({});
  let caboff = $state({});
  //let coninternet = $state({})
  let cab = $state({
    exist: false,
    nombre: "",
    id: "",
  });

  let nombreusuario = $state("");
  let usuarioid = $state("");
  let rol = "Establecimiento";
  let nombreestablecimiento = $state("");


  let mt=$state("mt-0")
  async function cabuserSQL() {
    let caber = createCaber();
    useroff = await getUserOffline();
    caboff = await getCabOffline();

    nombreestablecimiento = caboff.nombre;
    if (window.innerWidth <= 600) {
      // Pantallas pequeñas
      nombreestablecimiento = nombreestablecimiento.slice(0, 15);
    }

    //let pb_json = JSON.parse(localStorage.getItem('pocketbase_auth'))
    usuarioid = useroff.id;
    nombreusuario = useroff.username;
  }

  //let rol = "cab"
  function getPlatform() {
      if (window.Capacitor) {
          if (window.Capacitor.getPlatform) {
          return window.Capacitor.getPlatform(); // 'ios', 'android', 'web'
          }
      }
      return 'android'; // fallback
  }
  onMount(async () => {
    coninternet = await getInternet(
      modedebug,
      offliner.offline,
      customoffliner.customoffliner,
    );
    let platform = getPlatform()
    if(modedebug){
      
      loger.addTextLog(JSON.stringify(platform))
      
    }
    if(platform != "android"){
      mt = "mt-4"
    }
    //await cabuserSQL()
    let caber = createCaber();
    nombreestablecimiento = caber.cab.nombre;
    //if (window.innerWidth <= 600) { // Pantallas pequeñas
    //  nombreestablecimiento= nombreestablecimiento.slice(0,15)
    //}
    let pb_json = JSON.parse(localStorage.getItem("pocketbase_auth"));
    usuarioid = pb_json.record.id;
    nombreusuario = pb_json.record.username;

    let hab = $enabled;
    if (hab === "no") {
      goto("/");
    }

    cab = caber.cab;
    //SI no tengo internet debo revisar
    await getNotis();
  });

  async function salir() {
    pb.authStore.clear();
    usuario.set("");
    enabled.set("no");
    await setDefaultCabOffline();
    await setDefaultUserOffline();
    goto("/");
  }
  function editarUser() {
    goto("/user/config");
  }
  function cambiarEstablecimiento() {
    goto("/establecimientos");
  }
  function goInternet() {
    goto("/internet");
  }
  let checked = $state("");
  function handleClick() {
    checked == "checked" ? (checked = "") : (checked = "checked");
  }
  async function getNotis() {
    const records = await pb.collection("notificaciones").getFullList({
      sort: "-created",
      filter: `destino = '${usuarioid}' && leido = False`,
    });

    notificaciones = records;
    if (notificaciones.length > 0) {
      leido = false;
    }
  }
  async function leerNotis() {
    leido = true;
    for (let i = 0; i < notificaciones.length; i++) {
      try {
        let data = { leido: true };
        await pb
          .collection("notificaciones")
          .update(notificaciones[i].id, data);
      } catch (err) {
        console.error(err);
      }
    }
  }
  let bgnav = "bg-green-500";
  let classtext = `text-lg px-2 font-extrabold`;
  let classnavbarr = `navbar ${bgnav} `;
  let classtextnavbar = `text-white font-extrabold dark:text-gray-700`;
  
</script>

<div
  class="drawer min-h-screen dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 "
>
  <input id="my-drawer" type="checkbox" class="drawer-toggle" bind:checked />
  <div class="drawer-content w-full">
    <div class={classnavbarr}>
      <div class={`flex-none ${mt}`}>
        <button
          aria-label="menu"
          class={`mx-1 px-0 btn btn-ghost ${classtextnavbar}`}
          onclick={handleClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class=" size-6"
          >
            <path
              fill-rule="evenodd"
              d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="hidden md:block text-lg font-bold">Menu</span>
        </button>
      </div>
      <div class="flex-1">
        <a
          href={"/establecimientos"}
          class={` ps-0 btn btn-ghost text-xl ${classtextnavbar}`}
        >
          {shorterWord(nombreestablecimiento)}
        </a>
      </div>
      <div class="flex mr-1 pr-1 lg:mr-5 lg:pr-5">
        <details class="dropdown dropdown-end">
          <summary
            class={`btn m-0 p-0 bg-transparent hover:bg-transparent ${classtextnavbar} border-none`}
            onclick={leerNotis}
          >
            <div class="indicator">
              {#if !leido}
                <span
                  class="indicator-item badge dark:badge-error badge-error badge-xs"
                ></span>
              {/if}

              <span class={` px-2`}>{shorterWord(nombreusuario)}</span>
            </div>
          </summary>

          <ul
            class={`menu dropdown-content w-52 rounded-box z-[1] shadow ${classtextnavbar} ${bgnav}`}
          >
            {#if notificaciones.length == 0}
              <li><span>Sin notificaciones</span></li>
            {:else}
              {#each notificaciones as n}
                <li><span>{n.titulo}</span></li>
              {/each}
            {/if}
          </ul>
        </details>

        <details class="dropdown dropdown-end">
          <summary class={`btn btn-square btn-ghost ${classtextnavbar}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="inline-block h-5 w-5 stroke-current"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              ></path>
            </svg>
          </summary>
          <div class="pr-3 mr-3">
            <ul
              class={`menu dropdown-content rounded-box z-[1] shadow ${classtextnavbar} ${bgnav}`}
            >
              <li><button onclick={editarUser}>Usuario</button></li>
              <li>
                <button onclick={cambiarEstablecimiento}
                  >Establecimientos</button
                >
              </li>
              <li>
                <button onclick={goInternet}
                  >{coninternet.connected ? "Online 🟢" : "Offline 🔴"}</button
                >
              </li>
              {#if customoffliner.customoffline}
                <li>
                  <button
                    onclick={goInternet}
                  >
                  {customoffliner.customoffline ? "Modo offline" : ""}
                  </button>
                </li>
              {/if}

              <li><button onclick={salir}>Salir</button></li>
            </ul>
          </div>
        </details>
        <Oscuro></Oscuro>
      </div>
    </div>
    {@render children()}
    <BotonLoges></BotonLoges>
  </div>
  <div class="drawer-side">
    <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"
    ></label>

    <ul
      class="
          
          overflow-y-auto
          menu bg-gradient-to-br from-white to-gray-100
          dark:from-gray-900 dark:to-gray-800
          text-base-content min-h-full
          w-2/3 lg:w-1/4 p-4
        "
    >
      <div class="border-b border-green-500 ">
        <h1 class="text-lg text-green-600 dark:text-green-400 italic">
          {`Fertil - ${nombreestablecimiento}`}
        </h1>
      </div>

      <li
        class={`${mt} ${pageurl.includes("inicio") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        <a class={classtext} href="/inicio">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="pl-3 size-10"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          <span class="px-3 flex items-center">
            <div>Inicio</div>
          </span>
        </a>
      </li>
      <li
        class={`${pageurl.includes("establecimiento") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        <a class={`py-0 ${classtext}`} href="/establecimiento">
          <Estable size="size-12" margenes=""></Estable>
          <span class="px-2 flex items-center">
            <div>Establecimiento</div>
          </span>
        </a>
      </li>
      <li
        class={` ${cab.exist ? "" : "disabled"}  ${pageurl.includes("animales") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={`py-0 ${classtext}`} href="/animales">
            <Animal size="size-12" margenes=""></Animal>
            <span class="px-3"> Animales </span>
          </a>
        {:else}
          <div class={`${classtext} py-0`}>
            <Animal size="size-12" margenes=""></Animal>
            <span class="px-3"> Animales </span>
          </div>
        {/if}
      </li>
      <li
        class={`${cab.exist ? "" : "disabled"} ${pageurl.includes("nacimientos") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={classtext} href="/nacimientos">
            <Nacimiento size="size-12" margenes=""></Nacimiento>
            <span class="px-3"> Nacimientos </span>
          </a>
        {:else}
          <div class={classtext}>
            <Nacimiento size="size-12" margenes=""></Nacimiento>
            <span class="px-3"> Nacimientos </span>
          </div>
        {/if}
      </li>
      <li
        class={`${cab.exist ? "" : "disabled"} ${pageurl.includes("servicios") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={classtext} href="/servicios">
            <Servicio size="size-12" margenes=""></Servicio>
            <span class="px-3">Servicios</span>
          </a>
        {:else}
          <div class={classtext}>
            <Servicio size="size-12" margenes=""></Servicio>
            <span class="px-3">Servicios</span>
          </div>
        {/if}
      </li>
      <li
        class={` ${cab.exist ? "" : "disabled"} ${pageurl.includes("tactos") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={classtext} href="/tactos/cab">
            <Tacto size="size-12" margenes=""></Tacto>
            <span class="px-3"> Tactos </span>
          </a>
        {:else}
          <div class={classtext}>
            <Tacto size="size-12" margenes=""></Tacto>
            <span class="px-3"> Tactos </span>
          </div>
        {/if}
      </li>
      <li
        class={`${cab.exist ? "" : "disabled"} ${pageurl.includes("tratamientos") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={classtext} href="/tratamientos">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="hidden size-10"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
              />
            </svg>
            <Tratamiento size="size-12" margenes=""></Tratamiento>
            <span class="px-3">Tratamientos</span>
          </a>
        {:else}
          <div class={classtext}>
            <Tratamiento size="size-12" margenes=""></Tratamiento>
            <span class="px-3">Tratamientos</span>
          </div>
        {/if}
      </li>
      <li
        class={` ${cab.exist ? "" : "disabled"} ${pageurl.includes("movimientos") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={classtext} href="/movimientos">
            <Movimiento size={"size-12"} margenes=""></Movimiento>
            <span class="px-3">Movimientos</span>
          </a>
        {:else}
          <div class={classtext}>
            <Movimiento size={"size-12"} margenes=""></Movimiento>
            <span class="px-3">Movimientos</span>
          </div>
        {/if}
      </li>
      <!--Pesajes-->
      <li
        class={` ${cab.exist ? "" : "disabled"} ${pageurl.includes("pesajes") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={`py-0 ${classtext}`} href={pre + "/pesajes"}>
            <Pesaje size={"size-12"} margenes=""></Pesaje>

            <span class="px-3">Pesajes</span>
          </a>
        {:else}
          <div class={classtext}>
            <Pesaje size={"size-12"} margenes=""></Pesaje>
            <span class="px-3">Pesajes</span>
          </div>
        {/if}
      </li>
      <!--Observaciones-->
      <li
        class={`${cab.exist ? "" : "disabled"} ${pageurl.includes("observaciones") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={`py-0 ${classtext}`} href={pre + "/observaciones"}>
            <Observacion size="size-12" margenes=""></Observacion>

            <span class="px-3">Observaciones</span>
          </a>
        {:else}
          <div class={classtext}>
            <Observacion size="size-12" margenes=""></Observacion>

            <span class="px-3">Observaciones</span>
          </div>
        {/if}
      </li>
      <!--Rodeos-->
      <li
        class={`${cab.exist ? "" : "disabled"} ${pageurl.includes("rodeos") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={`py-0 ${classtext}`} href={pre + "/rodeos"}>
            <Rodeo size={"size-12"} margenes=""></Rodeo>

            <span class="px-3"> Rodeos </span>
          </a>
        {:else}
          <div class={classtext}>
            <Rodeo size={"size-12"} margenes=""></Rodeo>

            <span class="px-3"> Rodeos </span>
          </div>
        {/if}
      </li>
      <!--Lotes-->
      <li
        class={` ${cab.exist ? "" : "disabled"} ${pageurl.includes("lotes") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={`py-0 ${classtext}`} href={pre + "/lotes"}>
            <Lote size="size-12" margenes=""></Lote>
            <span class="px-3"> Lotes </span>
          </a>
        {:else}
          <div class={classtext}>
            <Lote size="size-12" margenes=""></Lote>
            <span class="px-3"> Lotes </span>
          </div>
        {/if}
      </li>
      <!--Reportes-->
      <li
        class={` ${cab.exist ? "" : "disabled"} ${pageurl.includes("reportes") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={`py-0 ${classtext}`} href={pre + "/reportes"}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 10000 10000"
              class="size-12 fill-current"
            >
              <g id="Capa_x0020_1">
                <metadata id="CorelCorpID_0Corel-Layer" />
                <g id="_2668565760">
                  <path
                    class="fil0"
                    d="M3191.54 3017.75c-78.82,-53.75 -231.67,-350.58 -788.14,-474.75 -124.66,-27.81 -1877.33,-46.38 -2079.8,-48.13 -39.58,80.65 -76.24,342.59 -77.32,468.11 -4.97,574.2 250.19,986.43 666.84,1305.58 427.78,327.64 1113.71,423.8 1677.68,428.68l4.43 -512.69c-274.45,-2.37 -481.66,-16.77 -728.58,-68.5 -575.12,-120.49 -1057.55,-413.46 -1107.98,-1090.04 463.97,4.01 928.26,9.74 1392.2,12 206.27,0.99 363.75,50.42 514.91,176.75 68.91,57.58 117.42,105.79 164.88,186.58 114.8,195.43 91.42,271.96 89.51,493.03l512.9 4.43c5.05,-583.89 -43.27,-268.67 265.49,-675.72 112.73,-148.6 194.93,-264.99 254.98,-449.99 25.03,-77.15 8.62,-72.88 149.59,-143.4 108.94,-54.51 414.13,-171.8 544.13,-170.68l835.3 7.22c84.31,0.73 315.04,114.14 376.9,152.58 213,132.37 106.97,-7.87 232.47,309 50.39,127.23 223.62,370.33 323.91,480.58 159.48,175.31 128.22,23.87 123.95,517.28l527.56 4.56c1.88,-217.93 -39.98,-180.99 19.02,-335.29 110.26,-288.36 376.96,-510.95 677.08,-508.35l1465.43 12.67c-1.73,200.37 -95.8,423.39 -180.39,540.61 -110.55,153.17 -220.29,243.04 -390.27,341.95 -319.64,185.98 -814.36,248.12 -1285.67,244.05l-4.43 512.68c851.07,7.36 1727.58,-188.45 2141.18,-866.45 197.04,-323.03 285.74,-743.88 209.99,-1138.46 -12.08,-62.99 -3.51,-157.55 -60.88,-158.04l-1802.48 -15.59c-377.67,-3.27 -709.72,154.54 -959.78,398.15 -32.19,31.37 -74.41,87.18 -99.76,105.41 -11.72,-17.81 -27.27,-43.83 -41.09,-61.3 -171.32,-216.69 -234.47,-274.54 -231.9,-570.98 -75.69,-51.63 -136.32,-99.32 -217.85,-149.07l-238.73 -143.09c-100.34,-55.57 -430.12,-198.94 -565.04,-200.11l-849.96 -7.35c-265.44,-2.29 -767.54,218.12 -943.78,325.76l-185.68 121.49c-49.9,44.78 -28.67,47.7 -34.44,127.51 -3.26,45.02 -16.48,92.49 -30.97,131.06 -35.85,95.43 -195.43,334.29 -265.41,380.26z"
                  />
                  <path
                    class="fil0"
                    d="M3476.56 7341.8c-0.42,49.64 -30.87,188.82 -45.85,219.35l376.11 240.49c145.52,89.9 599.42,266.02 762.62,267.43l795.2 6.89c-44.57,-19.61 -77.07,-60.1 -97.39,-108.21l-21.12 -105.1c0,-70.79 -10.89,-46.64 -11.45,-91.61 -0.61,-49.88 -11.45,-43.39 -11.45,-114.51 0,-48.74 13.8,-76.46 31.49,-94.26l-622.23 -5.38c-141.53,-1.22 -533.46,-161.97 -613.98,-224.65 -46.84,-36.48 -38.29,-117.68 -64.96,-226.66 -36.47,-149.02 -80.72,-287.94 -139.09,-415.27 -30.48,-66.49 -54.14,-125.46 -86.14,-191.32l-199.97 -369.98c-44.25,-74.32 -71.21,-88.38 -69.43,-207.74 7.55,-504.97 -33.29,-1162.38 -28.89,-1670.91l-512.9 -4.43 17.66 883.12c14.94,116.5 1.38,324.35 -0.23,450.47 -1.24,97.11 14.28,126.42 13.61,219.02 -3.16,435.14 -43.27,280.11 121.96,562.8 123.87,211.94 408.38,755.48 406.43,980.46zm3558.58 -2398.7l16.29 -589.03c8.15,-105.09 41.01,-72.04 -470.72,-76.46 -66.8,-0.58 -45.33,103.55 -45.54,175.35l-10.33 482.69 510.3 7.45z"
                  />
                </g>
                <g id="_2658202344">
                  <path
                    class="fil0 str0"
                    d="M7831.14 4935.37l541.77 0c48.92,0 75.59,19.36 75.59,69.29l0 560.67c0,84.75 -108.16,106.39 -107.36,-12.33l0.36 -271.24c0.53,-61.35 -2.64,-88.11 -56.79,-88.11 -34.08,0 -105.03,76.73 -130.62,102.46 -50.65,50.91 -192.5,165.19 -255.25,223.53 -74.84,69.6 -393.96,319.16 -494.26,393.99 -62.9,46.93 -123.18,90.63 -184.5,136.77 -61.34,46.16 -124.44,87.04 -187.22,134.07l-189.51 131.77c-154.83,102.94 -326.09,220.31 -483.67,316.39l-501.47 304.88c-27.04,16.36 -331.57,196.57 -360.33,200.39 -35.28,4.7 -79.32,-37.11 -49.44,-80.69 15.09,-22.01 126.7,-75.72 153.85,-92.14l203.02 -118.26c312.84,-183.9 794.52,-479.15 1078.22,-685.67 240.95,-175.4 404.88,-290.02 647.88,-479.76l606.84 -514.5c29.67,-29.74 67.59,-51.15 39.75,-99.29 -21.08,-36.45 -76.49,-25.13 -132.67,-25.13 -54.6,0 -109.2,-0.01 -163.8,0 -59.89,0.01 -106.62,10.53 -125.8,-32.29 -20.2,-45.12 14.1,-74.8 75.41,-74.8zm-2500.96 2162.84l0 -25.81c2.75,-35.05 16.82,-70.44 45.42,-100.94 21.5,-22.94 526.53,-306.55 629.87,-371.77l524.18 -332.57 873.98 -625.32c14.19,-11.35 23.1,-18.97 38.74,-30.57l316.81 -256.45c22.97,-17.94 208.66,-177.29 223.15,-198.93 -152.23,0 -340.18,30.66 -340.18,-182.69 0,-70.34 74.55,-144.89 144.89,-144.89l611.07 0c88.88,0 157.49,74.53 157.49,144.89l0 623.67c0,167.3 -275.06,206.19 -318.46,28.67 -14.62,-59.79 -9.12,-170.05 -9.12,-242.86 -18.65,12.48 -25.85,16.13 -42.65,32.95 -49.28,49.34 -103.6,90.67 -154.12,135.67 -15.52,13.82 -20.86,18.89 -37.2,32.09l-804.59 625.43c-27.82,21.02 -54.84,41.2 -83.96,60.92l-340.25 233.02c-302.55,201.68 -752.43,483.19 -1065.55,654.26 -94.84,51.81 -131.95,90.35 -224.63,90.35 -77.99,0 -138.84,-70.33 -144.89,-149.12z"
                  />
                  <path
                    class="fil0 str0"
                    d="M8322.51 7839.5l-188.99 0c-30.47,0 -56.7,-17.89 -56.7,-50.4l0 -1782.8c0,-29.4 14.69,-44.09 44.1,-44.09l233.09 0c20.41,0 37.8,27.37 37.8,50.39l0 1770.2c0,38.67 -29.99,56.7 -69.3,56.7zm-359.08 -1839.5l0 1795.4c0,73.82 71.48,151.19 144.89,151.19l245.69 0c84.84,0 151.19,-82.78 151.19,-170.09l0 -1757.6c0,-93.85 -69.91,-170.09 -163.79,-170.09l-226.79 0c-70.67,0 -151.19,73.81 -151.19,151.19z"
                  />
                  <path
                    class="fil0 str0"
                    d="M7679.95 7839.5l-182.69 0c-39.32,0 -69.3,-18.03 -69.3,-56.7l0 -1392.22c0,-38.67 29.98,-56.7 69.3,-56.7 153.88,0 251.98,-25.38 251.98,69.3l0 1367.02c0,47.22 -22.07,69.3 -69.29,69.3zm-365.38 -1417.42l0 1329.22c0,107.8 57.96,195.29 151.19,195.29l245.68 0c70.35,0 144.9,-74.55 144.9,-144.89l0 -1430.02c0,-70.34 -74.55,-144.89 -144.9,-144.89l-245.68 0c-91.73,0 -151.19,85.63 -151.19,195.29z"
                  />
                  <path
                    class="fil0 str0"
                    d="M6785.4 7789.1l0 -982.75c0,-15.16 22.63,-37.79 37.79,-37.79l239.4 0c15.16,0 37.79,22.63 37.79,37.79l0 982.75c0,38.26 -31.8,50.4 -69.3,50.4l-176.38 0c-37.5,0 -69.3,-12.14 -69.3,-50.4zm277.19 157.49l-224.01 0c-33.33,-2.74 -61.8,-8.03 -79.59,-17.68l-32.84 -23.86c-9.03,-8.05 -3.75,-3.1 -9.62,-9.28 -23.87,-25.17 -44.52,-64.34 -44.52,-112.97l0 -963.85c0,-83.05 71.42,-163.78 151.18,-163.78l239.4 0c79.76,0 151.18,80.73 151.18,163.78l0 963.85c0,54.2 -24.87,97.41 -57.55,125.14 -25.42,21.58 -58.57,38.65 -93.63,38.65z"
                  />
                  <path
                    class="fil0 str0"
                    d="M6136.54 7770.2l0 -560.67c0,-94.68 98.09,-69.29 251.98,-69.29 39.32,0 69.3,18.03 69.3,56.69l0 585.87c0,38.67 -29.98,56.7 -69.3,56.7 -153.89,0 -251.98,25.38 -251.98,-69.3zm-107.1 -592.16l0 623.66c0,70.34 74.55,144.89 144.9,144.89l245.68 0c47.72,0 88.41,-30.88 111.7,-58.39 28.02,-33.09 39.49,-78.02 39.49,-136.9l0 -522.87c0,-108.05 -57.3,-195.29 -151.19,-195.29l-245.68 0c-71.55,0 -144.9,74.31 -144.9,144.9z"
                  />
                  <path
                    class="fil0 str0"
                    d="M5493.97 7782.8l0 -264.58c0,-23.02 17.39,-50.4 37.8,-50.4l233.09 0c29.41,0 44.1,14.69 44.1,44.1l0 277.18c0,38.26 -31.8,50.4 -69.3,50.4 -113.35,0 -245.69,23.19 -245.69,-56.7zm-113.39 -258.28l0 251.98c0,48.68 16.95,89 42.3,115.19 25,25.83 61.26,54.9 108.89,54.9l245.69 0c73.41,0 144.89,-77.37 144.89,-151.19l0 -289.78c0,-76.01 -75.19,-151.19 -151.19,-151.19l-239.39 0c-44.5,0 -83.03,27.27 -105.69,51.8 -25.75,27.88 -45.5,66.69 -45.5,118.29z"
                  />
                </g>
              </g>
            </svg>
            <span class="px-3">Reportes</span>
          </a>
        {:else}
          <div class={classtext}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 10000 10000"
              class="size-12 fill-current"
            >
              <g id="Capa_x0020_1">
                <metadata id="CorelCorpID_0Corel-Layer" />
                <g id="_2668565760">
                  <path
                    class="fil0"
                    d="M3191.54 3017.75c-78.82,-53.75 -231.67,-350.58 -788.14,-474.75 -124.66,-27.81 -1877.33,-46.38 -2079.8,-48.13 -39.58,80.65 -76.24,342.59 -77.32,468.11 -4.97,574.2 250.19,986.43 666.84,1305.58 427.78,327.64 1113.71,423.8 1677.68,428.68l4.43 -512.69c-274.45,-2.37 -481.66,-16.77 -728.58,-68.5 -575.12,-120.49 -1057.55,-413.46 -1107.98,-1090.04 463.97,4.01 928.26,9.74 1392.2,12 206.27,0.99 363.75,50.42 514.91,176.75 68.91,57.58 117.42,105.79 164.88,186.58 114.8,195.43 91.42,271.96 89.51,493.03l512.9 4.43c5.05,-583.89 -43.27,-268.67 265.49,-675.72 112.73,-148.6 194.93,-264.99 254.98,-449.99 25.03,-77.15 8.62,-72.88 149.59,-143.4 108.94,-54.51 414.13,-171.8 544.13,-170.68l835.3 7.22c84.31,0.73 315.04,114.14 376.9,152.58 213,132.37 106.97,-7.87 232.47,309 50.39,127.23 223.62,370.33 323.91,480.58 159.48,175.31 128.22,23.87 123.95,517.28l527.56 4.56c1.88,-217.93 -39.98,-180.99 19.02,-335.29 110.26,-288.36 376.96,-510.95 677.08,-508.35l1465.43 12.67c-1.73,200.37 -95.8,423.39 -180.39,540.61 -110.55,153.17 -220.29,243.04 -390.27,341.95 -319.64,185.98 -814.36,248.12 -1285.67,244.05l-4.43 512.68c851.07,7.36 1727.58,-188.45 2141.18,-866.45 197.04,-323.03 285.74,-743.88 209.99,-1138.46 -12.08,-62.99 -3.51,-157.55 -60.88,-158.04l-1802.48 -15.59c-377.67,-3.27 -709.72,154.54 -959.78,398.15 -32.19,31.37 -74.41,87.18 -99.76,105.41 -11.72,-17.81 -27.27,-43.83 -41.09,-61.3 -171.32,-216.69 -234.47,-274.54 -231.9,-570.98 -75.69,-51.63 -136.32,-99.32 -217.85,-149.07l-238.73 -143.09c-100.34,-55.57 -430.12,-198.94 -565.04,-200.11l-849.96 -7.35c-265.44,-2.29 -767.54,218.12 -943.78,325.76l-185.68 121.49c-49.9,44.78 -28.67,47.7 -34.44,127.51 -3.26,45.02 -16.48,92.49 -30.97,131.06 -35.85,95.43 -195.43,334.29 -265.41,380.26z"
                  />
                  <path
                    class="fil0"
                    d="M3476.56 7341.8c-0.42,49.64 -30.87,188.82 -45.85,219.35l376.11 240.49c145.52,89.9 599.42,266.02 762.62,267.43l795.2 6.89c-44.57,-19.61 -77.07,-60.1 -97.39,-108.21l-21.12 -105.1c0,-70.79 -10.89,-46.64 -11.45,-91.61 -0.61,-49.88 -11.45,-43.39 -11.45,-114.51 0,-48.74 13.8,-76.46 31.49,-94.26l-622.23 -5.38c-141.53,-1.22 -533.46,-161.97 -613.98,-224.65 -46.84,-36.48 -38.29,-117.68 -64.96,-226.66 -36.47,-149.02 -80.72,-287.94 -139.09,-415.27 -30.48,-66.49 -54.14,-125.46 -86.14,-191.32l-199.97 -369.98c-44.25,-74.32 -71.21,-88.38 -69.43,-207.74 7.55,-504.97 -33.29,-1162.38 -28.89,-1670.91l-512.9 -4.43 17.66 883.12c14.94,116.5 1.38,324.35 -0.23,450.47 -1.24,97.11 14.28,126.42 13.61,219.02 -3.16,435.14 -43.27,280.11 121.96,562.8 123.87,211.94 408.38,755.48 406.43,980.46zm3558.58 -2398.7l16.29 -589.03c8.15,-105.09 41.01,-72.04 -470.72,-76.46 -66.8,-0.58 -45.33,103.55 -45.54,175.35l-10.33 482.69 510.3 7.45z"
                  />
                </g>
                <g id="_2658202344">
                  <path
                    class="fil0 str0"
                    d="M7831.14 4935.37l541.77 0c48.92,0 75.59,19.36 75.59,69.29l0 560.67c0,84.75 -108.16,106.39 -107.36,-12.33l0.36 -271.24c0.53,-61.35 -2.64,-88.11 -56.79,-88.11 -34.08,0 -105.03,76.73 -130.62,102.46 -50.65,50.91 -192.5,165.19 -255.25,223.53 -74.84,69.6 -393.96,319.16 -494.26,393.99 -62.9,46.93 -123.18,90.63 -184.5,136.77 -61.34,46.16 -124.44,87.04 -187.22,134.07l-189.51 131.77c-154.83,102.94 -326.09,220.31 -483.67,316.39l-501.47 304.88c-27.04,16.36 -331.57,196.57 -360.33,200.39 -35.28,4.7 -79.32,-37.11 -49.44,-80.69 15.09,-22.01 126.7,-75.72 153.85,-92.14l203.02 -118.26c312.84,-183.9 794.52,-479.15 1078.22,-685.67 240.95,-175.4 404.88,-290.02 647.88,-479.76l606.84 -514.5c29.67,-29.74 67.59,-51.15 39.75,-99.29 -21.08,-36.45 -76.49,-25.13 -132.67,-25.13 -54.6,0 -109.2,-0.01 -163.8,0 -59.89,0.01 -106.62,10.53 -125.8,-32.29 -20.2,-45.12 14.1,-74.8 75.41,-74.8zm-2500.96 2162.84l0 -25.81c2.75,-35.05 16.82,-70.44 45.42,-100.94 21.5,-22.94 526.53,-306.55 629.87,-371.77l524.18 -332.57 873.98 -625.32c14.19,-11.35 23.1,-18.97 38.74,-30.57l316.81 -256.45c22.97,-17.94 208.66,-177.29 223.15,-198.93 -152.23,0 -340.18,30.66 -340.18,-182.69 0,-70.34 74.55,-144.89 144.89,-144.89l611.07 0c88.88,0 157.49,74.53 157.49,144.89l0 623.67c0,167.3 -275.06,206.19 -318.46,28.67 -14.62,-59.79 -9.12,-170.05 -9.12,-242.86 -18.65,12.48 -25.85,16.13 -42.65,32.95 -49.28,49.34 -103.6,90.67 -154.12,135.67 -15.52,13.82 -20.86,18.89 -37.2,32.09l-804.59 625.43c-27.82,21.02 -54.84,41.2 -83.96,60.92l-340.25 233.02c-302.55,201.68 -752.43,483.19 -1065.55,654.26 -94.84,51.81 -131.95,90.35 -224.63,90.35 -77.99,0 -138.84,-70.33 -144.89,-149.12z"
                  />
                  <path
                    class="fil0 str0"
                    d="M8322.51 7839.5l-188.99 0c-30.47,0 -56.7,-17.89 -56.7,-50.4l0 -1782.8c0,-29.4 14.69,-44.09 44.1,-44.09l233.09 0c20.41,0 37.8,27.37 37.8,50.39l0 1770.2c0,38.67 -29.99,56.7 -69.3,56.7zm-359.08 -1839.5l0 1795.4c0,73.82 71.48,151.19 144.89,151.19l245.69 0c84.84,0 151.19,-82.78 151.19,-170.09l0 -1757.6c0,-93.85 -69.91,-170.09 -163.79,-170.09l-226.79 0c-70.67,0 -151.19,73.81 -151.19,151.19z"
                  />
                  <path
                    class="fil0 str0"
                    d="M7679.95 7839.5l-182.69 0c-39.32,0 -69.3,-18.03 -69.3,-56.7l0 -1392.22c0,-38.67 29.98,-56.7 69.3,-56.7 153.88,0 251.98,-25.38 251.98,69.3l0 1367.02c0,47.22 -22.07,69.3 -69.29,69.3zm-365.38 -1417.42l0 1329.22c0,107.8 57.96,195.29 151.19,195.29l245.68 0c70.35,0 144.9,-74.55 144.9,-144.89l0 -1430.02c0,-70.34 -74.55,-144.89 -144.9,-144.89l-245.68 0c-91.73,0 -151.19,85.63 -151.19,195.29z"
                  />
                  <path
                    class="fil0 str0"
                    d="M6785.4 7789.1l0 -982.75c0,-15.16 22.63,-37.79 37.79,-37.79l239.4 0c15.16,0 37.79,22.63 37.79,37.79l0 982.75c0,38.26 -31.8,50.4 -69.3,50.4l-176.38 0c-37.5,0 -69.3,-12.14 -69.3,-50.4zm277.19 157.49l-224.01 0c-33.33,-2.74 -61.8,-8.03 -79.59,-17.68l-32.84 -23.86c-9.03,-8.05 -3.75,-3.1 -9.62,-9.28 -23.87,-25.17 -44.52,-64.34 -44.52,-112.97l0 -963.85c0,-83.05 71.42,-163.78 151.18,-163.78l239.4 0c79.76,0 151.18,80.73 151.18,163.78l0 963.85c0,54.2 -24.87,97.41 -57.55,125.14 -25.42,21.58 -58.57,38.65 -93.63,38.65z"
                  />
                  <path
                    class="fil0 str0"
                    d="M6136.54 7770.2l0 -560.67c0,-94.68 98.09,-69.29 251.98,-69.29 39.32,0 69.3,18.03 69.3,56.69l0 585.87c0,38.67 -29.98,56.7 -69.3,56.7 -153.89,0 -251.98,25.38 -251.98,-69.3zm-107.1 -592.16l0 623.66c0,70.34 74.55,144.89 144.9,144.89l245.68 0c47.72,0 88.41,-30.88 111.7,-58.39 28.02,-33.09 39.49,-78.02 39.49,-136.9l0 -522.87c0,-108.05 -57.3,-195.29 -151.19,-195.29l-245.68 0c-71.55,0 -144.9,74.31 -144.9,144.9z"
                  />
                  <path
                    class="fil0 str0"
                    d="M5493.97 7782.8l0 -264.58c0,-23.02 17.39,-50.4 37.8,-50.4l233.09 0c29.41,0 44.1,14.69 44.1,44.1l0 277.18c0,38.26 -31.8,50.4 -69.3,50.4 -113.35,0 -245.69,23.19 -245.69,-56.7zm-113.39 -258.28l0 251.98c0,48.68 16.95,89 42.3,115.19 25,25.83 61.26,54.9 108.89,54.9l245.69 0c73.41,0 144.89,-77.37 144.89,-151.19l0 -289.78c0,-76.01 -75.19,-151.19 -151.19,-151.19l-239.39 0c-44.5,0 -83.03,27.27 -105.69,51.8 -25.75,27.88 -45.5,66.69 -45.5,118.29z"
                  />
                </g>
              </g>
            </svg>
            <span class="px-3">Reportes</span>
          </div>
        {/if}
      </li>
      <!--Importar-->
      <li
        class={`${cab.exist ? "" : "disabled"} ${pageurl.includes("importar") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={`py-0 ${classtext}`} href={pre + "/importar"}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 10000 10000"
              class="size-12 fill-current"
            >
              <g id="Capa_x0020_1">
                <metadata id="CorelCorpID_0Corel-Layer" />
                <g id="_2659219560">
                  <path
                    class="fil0"
                    d="M3177.29 2685.03c-79.44,-54.18 -233.49,-353.35 -794.36,-478.5 -125.65,-28.03 -1892.15,-46.74 -2096.22,-48.51 -39.89,81.29 -76.84,345.3 -77.93,471.8 -5.01,578.74 252.16,994.22 672.11,1315.89 431.15,330.23 1122.5,427.15 1690.92,432.06l4.47 -516.73c-276.62,-2.39 -485.46,-16.9 -734.34,-69.04 -579.65,-121.44 -1065.89,-416.73 -1116.72,-1098.64 467.63,4.04 935.58,9.81 1403.19,12.09 207.9,1 366.62,50.81 518.97,178.14 69.46,58.04 118.35,106.63 166.19,188.06 115.7,196.97 92.13,274.11 90.21,496.92l516.95 4.47c5.09,-588.51 -43.61,-270.8 267.59,-681.06 113.61,-149.77 196.46,-267.08 256.99,-453.54 25.23,-77.77 8.68,-73.46 150.77,-144.53 109.8,-54.94 417.4,-173.16 548.43,-172.03l841.89 7.28c84.98,0.73 317.52,115.03 379.87,153.78 214.68,133.41 107.82,-7.93 234.31,311.44 50.78,128.23 225.38,373.25 326.47,484.37 160.74,176.7 129.23,24.06 124.93,521.37l531.72 4.6c1.9,-219.66 -40.29,-182.43 19.18,-337.95 111.12,-290.63 379.93,-514.97 682.41,-512.36l1477.01 12.78c-1.75,201.94 -96.56,426.72 -181.82,544.87 -111.42,154.38 -222.03,244.96 -393.35,344.65 -322.16,187.45 -820.79,250.08 -1295.82,245.97l-4.47 516.73c857.79,7.42 1741.23,-189.93 2158.09,-873.29 198.59,-325.57 288,-749.74 211.65,-1147.44 -12.18,-63.49 -3.54,-158.79 -61.36,-159.29l-1816.71 -15.71c-380.66,-3.3 -715.32,155.76 -967.36,401.29 -32.45,31.62 -75,87.86 -100.55,106.24 -11.81,-17.95 -27.49,-44.17 -41.41,-61.79 -172.67,-218.39 -236.32,-276.7 -233.74,-575.48 -76.28,-52.03 -137.39,-100.1 -219.56,-150.25l-240.61 -144.21c-101.14,-56.02 -433.53,-200.52 -569.51,-201.7l-856.66 -7.4c-267.54,-2.32 -773.6,219.83 -951.24,328.32l-187.14 122.45c-50.3,45.14 -28.9,48.09 -34.72,128.52 -3.28,45.38 -16.61,93.22 -31.21,132.09 -36.13,96.19 -196.98,336.94 -267.51,383.27z"
                  />
                  <path
                    class="fil0"
                    d="M3464.57 7043.22c-0.43,50.02 -31.12,190.3 -46.22,221.07l379.08 242.39c146.67,90.61 604.15,268.13 768.64,269.55l801.47 6.93c-44.92,-19.76 -77.67,-60.56 -98.15,-109.06l-21.28 -105.92c0,-71.35 -10.99,-47.01 -11.55,-92.34 -0.61,-50.27 -11.54,-43.73 -11.54,-115.42 0,-49.11 13.91,-77.06 31.74,-95l-627.14 -5.42c-142.65,-1.23 -537.67,-163.25 -618.83,-226.42 -47.21,-36.77 -38.59,-118.61 -65.47,-228.45 -36.76,-150.2 -81.36,-290.22 -140.19,-418.54 -30.72,-67.03 -54.57,-126.46 -86.82,-192.84l-201.54 -372.9c-44.61,-74.9 -71.78,-89.08 -69.98,-209.38 7.61,-508.95 -33.56,-1171.55 -29.12,-1684.1l-516.96 -4.47 17.81 890.1c15.06,117.42 1.39,326.91 -0.24,454.02 -1.24,97.88 14.4,127.42 13.72,220.76 -3.19,438.57 -43.61,282.31 122.92,567.24 124.85,213.6 411.61,761.44 409.65,988.2zm3586.66 -2417.64l16.42 -593.68c8.22,-105.93 41.34,-72.61 -474.43,-77.06 -67.32,-0.59 -45.69,104.36 -45.9,176.72l-10.41 486.51 514.32 7.51z"
                  />
                </g>
                <g id="_2659212216">
                  <path
                    class="fil0"
                    d="M5247.66 5076.19l0 3101.85c0,123.05 116.17,239.21 239.22,239.21l3093.87 0c123.05,0 239.22,-116.16 239.22,-239.21l0 -3101.85c0,-110.71 -120.54,-231.24 -231.25,-231.24l-558.17 0c-59.58,0 -126.21,41.84 -157.81,73.43 -157.32,157.32 -45.6,436.9 165.79,436.9l271.11 0 0 2551.64 -2551.65 0 0 -2551.64c181.66,0 331.34,28.47 432.88,-69.48 174.52,-168.33 30.79,-440.85 -153.79,-440.85l-558.17 0c-110.71,0 -231.25,120.53 -231.25,231.24z"
                  />
                  <path
                    class="fil0"
                    d="M6778.65 6519.46c-89.62,-60.01 -105.08,-151.5 -263.14,-151.5 -135.53,0 -255.17,109.39 -255.17,263.14 0,119.01 76.14,175.8 137.55,237.22l382.75 382.75c92.17,92.16 121.44,145.52 269.12,145.52 112.55,0 174.41,-82.71 233.24,-141.54l382.75 -382.74c77.52,-77.51 141.54,-119.42 141.54,-257.16 0,-133.18 -118.3,-247.19 -263.15,-247.19 -144.96,0 -172.72,96.29 -255.16,151.5 0,-318.95 0,-637.91 0,-956.86 0,-158.17 3.95,-321.24 0.32,-478.75 -3.12,-135.08 -112.23,-238.9 -271.43,-238.9 -124.64,0 -236.68,115.16 -239.54,238.9 -3.63,157.51 0.32,320.58 0.32,478.75 0,318.95 0,637.91 0,956.86z"
                  />
                </g>
              </g>
            </svg>
            <span class="px-3">Importar</span>
          </a>
        {:else}
          <div class={classtext}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 10000 10000"
              class="size-12 fill-current"
            >
              <g id="Capa_x0020_1">
                <metadata id="CorelCorpID_0Corel-Layer" />
                <g id="_2659219560">
                  <path
                    class="fil0"
                    d="M3177.29 2685.03c-79.44,-54.18 -233.49,-353.35 -794.36,-478.5 -125.65,-28.03 -1892.15,-46.74 -2096.22,-48.51 -39.89,81.29 -76.84,345.3 -77.93,471.8 -5.01,578.74 252.16,994.22 672.11,1315.89 431.15,330.23 1122.5,427.15 1690.92,432.06l4.47 -516.73c-276.62,-2.39 -485.46,-16.9 -734.34,-69.04 -579.65,-121.44 -1065.89,-416.73 -1116.72,-1098.64 467.63,4.04 935.58,9.81 1403.19,12.09 207.9,1 366.62,50.81 518.97,178.14 69.46,58.04 118.35,106.63 166.19,188.06 115.7,196.97 92.13,274.11 90.21,496.92l516.95 4.47c5.09,-588.51 -43.61,-270.8 267.59,-681.06 113.61,-149.77 196.46,-267.08 256.99,-453.54 25.23,-77.77 8.68,-73.46 150.77,-144.53 109.8,-54.94 417.4,-173.16 548.43,-172.03l841.89 7.28c84.98,0.73 317.52,115.03 379.87,153.78 214.68,133.41 107.82,-7.93 234.31,311.44 50.78,128.23 225.38,373.25 326.47,484.37 160.74,176.7 129.23,24.06 124.93,521.37l531.72 4.6c1.9,-219.66 -40.29,-182.43 19.18,-337.95 111.12,-290.63 379.93,-514.97 682.41,-512.36l1477.01 12.78c-1.75,201.94 -96.56,426.72 -181.82,544.87 -111.42,154.38 -222.03,244.96 -393.35,344.65 -322.16,187.45 -820.79,250.08 -1295.82,245.97l-4.47 516.73c857.79,7.42 1741.23,-189.93 2158.09,-873.29 198.59,-325.57 288,-749.74 211.65,-1147.44 -12.18,-63.49 -3.54,-158.79 -61.36,-159.29l-1816.71 -15.71c-380.66,-3.3 -715.32,155.76 -967.36,401.29 -32.45,31.62 -75,87.86 -100.55,106.24 -11.81,-17.95 -27.49,-44.17 -41.41,-61.79 -172.67,-218.39 -236.32,-276.7 -233.74,-575.48 -76.28,-52.03 -137.39,-100.1 -219.56,-150.25l-240.61 -144.21c-101.14,-56.02 -433.53,-200.52 -569.51,-201.7l-856.66 -7.4c-267.54,-2.32 -773.6,219.83 -951.24,328.32l-187.14 122.45c-50.3,45.14 -28.9,48.09 -34.72,128.52 -3.28,45.38 -16.61,93.22 -31.21,132.09 -36.13,96.19 -196.98,336.94 -267.51,383.27z"
                  />
                  <path
                    class="fil0"
                    d="M3464.57 7043.22c-0.43,50.02 -31.12,190.3 -46.22,221.07l379.08 242.39c146.67,90.61 604.15,268.13 768.64,269.55l801.47 6.93c-44.92,-19.76 -77.67,-60.56 -98.15,-109.06l-21.28 -105.92c0,-71.35 -10.99,-47.01 -11.55,-92.34 -0.61,-50.27 -11.54,-43.73 -11.54,-115.42 0,-49.11 13.91,-77.06 31.74,-95l-627.14 -5.42c-142.65,-1.23 -537.67,-163.25 -618.83,-226.42 -47.21,-36.77 -38.59,-118.61 -65.47,-228.45 -36.76,-150.2 -81.36,-290.22 -140.19,-418.54 -30.72,-67.03 -54.57,-126.46 -86.82,-192.84l-201.54 -372.9c-44.61,-74.9 -71.78,-89.08 -69.98,-209.38 7.61,-508.95 -33.56,-1171.55 -29.12,-1684.1l-516.96 -4.47 17.81 890.1c15.06,117.42 1.39,326.91 -0.24,454.02 -1.24,97.88 14.4,127.42 13.72,220.76 -3.19,438.57 -43.61,282.31 122.92,567.24 124.85,213.6 411.61,761.44 409.65,988.2zm3586.66 -2417.64l16.42 -593.68c8.22,-105.93 41.34,-72.61 -474.43,-77.06 -67.32,-0.59 -45.69,104.36 -45.9,176.72l-10.41 486.51 514.32 7.51z"
                  />
                </g>
                <g id="_2659212216">
                  <path
                    class="fil0"
                    d="M5247.66 5076.19l0 3101.85c0,123.05 116.17,239.21 239.22,239.21l3093.87 0c123.05,0 239.22,-116.16 239.22,-239.21l0 -3101.85c0,-110.71 -120.54,-231.24 -231.25,-231.24l-558.17 0c-59.58,0 -126.21,41.84 -157.81,73.43 -157.32,157.32 -45.6,436.9 165.79,436.9l271.11 0 0 2551.64 -2551.65 0 0 -2551.64c181.66,0 331.34,28.47 432.88,-69.48 174.52,-168.33 30.79,-440.85 -153.79,-440.85l-558.17 0c-110.71,0 -231.25,120.53 -231.25,231.24z"
                  />
                  <path
                    class="fil0"
                    d="M6778.65 6519.46c-89.62,-60.01 -105.08,-151.5 -263.14,-151.5 -135.53,0 -255.17,109.39 -255.17,263.14 0,119.01 76.14,175.8 137.55,237.22l382.75 382.75c92.17,92.16 121.44,145.52 269.12,145.52 112.55,0 174.41,-82.71 233.24,-141.54l382.75 -382.74c77.52,-77.51 141.54,-119.42 141.54,-257.16 0,-133.18 -118.3,-247.19 -263.15,-247.19 -144.96,0 -172.72,96.29 -255.16,151.5 0,-318.95 0,-637.91 0,-956.86 0,-158.17 3.95,-321.24 0.32,-478.75 -3.12,-135.08 -112.23,-238.9 -271.43,-238.9 -124.64,0 -236.68,115.16 -239.54,238.9 -3.63,157.51 0.32,320.58 0.32,478.75 0,318.95 0,637.91 0,956.86z"
                  />
                </g>
              </g>
            </svg>
            <span class="px-3">Importar</span>
          </div>
        {/if}
      </li>

      <li
        class={` ${cab.exist ? "" : "disabled"} ${pageurl.includes("pendientes") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={classtext} href="/pendientes">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-12"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
            <span class="px-3">Pendientes</span>
          </a>
        {:else}
          <div class={classtext}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-12"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
            <span class="px-3">Pendientes</span>
          </div>
        {/if}
      </li>
      <!--Manual-->
      <li
        class={`${cab.exist ? "" : "disabled"} ${pageurl.includes("manual") ? "bg-green-400 text-green-900 dark:bg-green-900 dark:text-green-200 bg-opacity-25" : ""} rounded-full`}
      >
        {#if cab.exist}
          <a class={`py-0 ${classtext}`} href={pre + "/manual"}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="ml-3 size-8"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
            <span class="px-3">Manual</span>
          </a>
        {:else}
          <div class={classtext}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="ml-3 size-8"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
            <span class="px-3">Manual</span>
          </div>
        {/if}
      </li>
    </ul>
  </div>
</div>

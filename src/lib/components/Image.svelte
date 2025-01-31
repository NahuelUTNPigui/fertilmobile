<script>
    import { createRoler } from "$lib/stores/defaultrol.svelte";

    import { goto } from "$app/navigation";
    let {src,alt,title,rol} = $props();
    let classh2 = `mt-3 text-lg font-semibold`
    function selectRol(){
      let roler = createRoler()
      roler.setRol(rol)
      goto("/")
    }
  </script>
  
<button onclick={selectRol}>
  <div class="flex flex-col items-center transition-transform duration-200 hover:scale-105">
    <img 
      {src} 
      {alt} 
      class="w-[300px] h-[200px] lg:w-[500px] lg:h-[400px]  object-cover rounded-lg shadow-md "
    />

    <h2 class={classh2}>{title}</h2>
  </div>
</button>
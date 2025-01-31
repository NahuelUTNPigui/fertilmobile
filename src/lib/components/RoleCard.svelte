<script>
    import { createRoler } from "$lib/stores/defaultrol.svelte";

    import { goto } from "$app/navigation";
    let {title,description,icon,rol} = $props()
    //export let title;
    //export let description;
    //export let icon;
    //export let rol;
    function selectRol(){
      let roler = createRoler()
      roler.setRol(rol)
      if(rol=="cab"){
        goto("/animales")
      }
      else{
        goto("/observaciones/vet")
      }
      
    }
  </script>
  
  <button
    onclick={selectRol}
    class="group flex flex-col items-center p-8 rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl w-[300px]"
  >
    <div class="text-4xl mb-6  group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h2 class="text-2xl font-bold mb-3 ">
      {title}
    </h2>
    <p class="text-center">
      {description}
    </p>
  </button>
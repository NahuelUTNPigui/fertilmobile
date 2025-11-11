<!-- src/lib/components/CustomSelect.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import estilos from "$lib/stores/estilos";

  let {
    lista = [],
    etiqueta = "",
    valor = $bindable(""),
    onelegir = () => {},
    onwrite = () => {},
    size = "w-4/5",
    disabled = false
  } = $props();

  let isOpen = $state(false);
  let cadena = $state("");
  let nombre = $state("");

  // Inicializar nombre desde valor
  $effect(() => {
    if (valor && lista.length) {
      const item = lista.find(e => e.id === valor);
      if (item) {
        nombre = item.nombre;
        cadena = item.nombre;
      }
    }
  });

  function cambioCadena() {
    if (disabled) return;
    if (onwrite) onwrite(cadena);
    
    if (!cadena.trim()) {
      isOpen = false;
      valor = "";
    } else {
      isOpen = true;
      const filtered = lista.filter(e =>
        e.nombre.toLowerCase().includes(cadena.toLowerCase())
      );
      // No auto-seleccionar; dejar que el usuario elija
    }
  }

  function clickOption(id) {
    if (disabled) return;
    const item = lista.find(e => e.id === id);
    if (!item) return;

    valor = id;
    nombre = item.nombre;
    cadena = item.nombre;
    isOpen = false;
    onelegir(id);
  }

  function toggle() {
    if (!disabled) isOpen = !isOpen;
  }

  // Cerrar al hacer clic fuera
  function handleClickOutside(event) {
    const el = event.target;
    if (!el.closest('.custom-select-container')) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="w-full custom-select-container">
  {#if etiqueta}
    <label class="label" for={etiqueta}>
      <span class="label-text text-base">{etiqueta}</span>
    </label>
  {/if}

  <!-- Input deshabilitado para escritura en móviles -->
  <input
    id={etiqueta}
    type="text"
    readonly
    {disabled}
    class="input input-bordered w-full mb-0 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer
           bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600
           text-gray-900 dark:text-white"
    value={nombre || cadena}
    onclick={toggle}
  />

  {#if isOpen}
    <div class={`mt-1 absolute z-10 max-h-40 overflow-auto ${size} shadow-lg rounded-md`}>
      {#if lista.filter(e => e.nombre.toLowerCase().includes(cadena.toLowerCase())).length === 0}
        <div class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
          <div class="py-2 pl-3 text-gray-500 dark:text-gray-400">No hay coincidencias</div>
        </div>
      {:else}
        <div class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md max-h-40 overflow-auto">
          {#each lista.filter(e => e.nombre.toLowerCase().includes(cadena.toLowerCase())) as item}
            <button
              type="button"
              class="w-full text-left py-2 pl-3 pr-9 hover:bg-green-100 dark:hover:bg-gray-700
                     hover:text-green-800 dark:hover:text-white cursor-pointer"
              onclick={() => clickOption(item.id)}
            >
              <span class="truncate">{item.nombre}</span>
              {#if item.id === valor}
                <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-green-600">
                  <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if valor}
    <span class="text-sm mt-1 text-gray-600 dark:text-gray-400">Elegiste a {nombre}</span>
  {/if}
</div>
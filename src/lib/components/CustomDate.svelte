<!-- src/lib/components/CustomDateInput.svelte -->
<script>
  let {
    value = $bindable(""),
    label = "",
    onDateChange = () => {},
    disabled = false
  } = $props();

  let displayValue = $state("");
  let inputRef;

  $effect(() => {
    if (value) {
      // Formato: DD/MM/YYYY
      const [y, m, d] = value.split('-');
      displayValue = `${d}/${m}/${y}`;
    } else {
      displayValue = "";
    }
  });

  function handleNativeInput(e) {
    const val = e.target.value;
    onDateChange(val); // formato ISO: "2025-11-11"
  }

  function handleClick() {
    if (disabled) return;
    // En iOS, forzar el foco para abrir el picker
    if (inputRef) inputRef.focus();
  }
</script>

<div class="w-full">
  {#if label}
    <label class="label" for={label}>
      <span class="label-text text-base">{label}</span>
    </label>
  {/if}

  <!-- Input visible (solo lectura) -->
  <input
    id={label}
    type="text"
    {disabled}
    class="input input-bordered w-full mb-0 rounded-md bg-white dark:bg-gray-800
           text-gray-900 dark:text-white cursor-pointer
           border-gray-300 dark:border-gray-600"
    value={displayValue}
    readonly
    onclick={handleClick}
  />

  <!-- Input nativo oculto (solo para picker) -->
  <input
    bind:this={inputRef}
    type="date"
    class="absolute opacity-0 pointer-events-none"
    value={value}
    oninput={handleNativeInput}
    {disabled}
  />
</div>
<script>
    import { onDestroy, onMount } from "svelte";

    let {
        fecha = $bindable(""),
        etiqueta = "etiqueta",
        onchange = () => {},
    } = $props();
    let isOpen = $state(false);
    let fechaSeleccionada = $state(new Date(fecha));
    let mesActual = $state(
        fecha ? new Date(fecha.getFullYear(), fecha.getMonth(), 1) : new Date(),
    );
    let containerRef = $state(null);
    let days = $derived(daysInMonth(mesActual));
    let firstDay = $derived(firstDayOfMonth(mesActual));
    let blanks = $derived(Array(firstDay).fill(null));
    let daysArray = $derived(Array.from({ length: days }, (_, i) => i + 1));

    function handleClickOutside(e) {
        if (containerRef && !containerRef.contains(e.target)) {
            isOpen = false;
        }
    }
    const daysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };
    const handlePrevMonth = () => {
        mesActual = new Date(
            mesActual.getFullYear(),
            mesActual.getMonth() - 1,
            1,
        );
    };

    const handleNextMonth = () => {
        mesActual = new Date(
            mesActual.getFullYear(),
            mesActual.getMonth() + 1,
            1,
        );
    };

    onMount(() => {
        document.addEventListener("click", handleClickOutside);
    });
    onDestroy(() => {
        document.removeEventListener("click", handleClickOutside);
    });
    const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
    ];
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const formatDate = (date) => {
        if (!date) return "";
        return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };
    const isToday = (day) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            mesActual.getMonth() === today.getMonth() &&
            mesActual.getFullYear() === today.getFullYear()
        );
    };
    const handleDateSelect = (day) => {
        const newDate = new Date(
            mesActual.getFullYear(),
            mesActual.getMonth(),
            day,
        );
        fechaSeleccionada = newDate;
        onchange();
        isOpen = false;
    };
    const isSelected = (day) => {
        if (!fechaSeleccionada) return false;
        return (
            day === fechaSeleccionada.getDate() &&
            mesActual.getMonth() === fechaSeleccionada.getMonth() &&
            mesActual.getFullYear() === fechaSeleccionada.getFullYear()
        );
    };
</script>

<div class="relative w-full" bind:this={containerRef}>
    <label
        class="block text-base font-medium text-foreground mb-2"
        for={etiqueta}
    >
        {etiqueta}
    </label>
    <button
        type="button"
        onclick={() => (isOpen = !isOpen)}
        class={`
            w-full flex items-center 
            justify-between px-4 
            py-2 border border-gray-300 
            dark:border-gray-600 rounded-xl 
            shadow-sm bg-white dark:bg-gray-800 
            hover:border-gray-400 
            dark:hover:border-gray-500 transition
        `}
    >
        {fechaSeleccionada
            ? formatDate(fechaSeleccionada)
            : "Selecciona una fecha"}
    </button>
    {#if isOpen}
        <div
            class="absolute mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-10"
        >
            <div class="flex items-center justify-between mb-4">
                <button
                    aria-label="PrevMont"
                    type="button"
                    onclick={handlePrevMonth}
                    class="p-3 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground"
                >
                    <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
                <div class="text-base font-semibold text-foreground">
                    {monthNames[mesActual.getMonth()]}
                    {mesActual.getFullYear()}
                </div>

                <button
                    aria-labelledby="ForMonth"
                    type="button"
                    onclick={handleNextMonth}
                    class="p-3 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground"
                >
                    <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>
            <div class="grid grid-cols-7 gap-1 mb-2">
                {#each dayNames as day}
                    <div
                        class="text-sm font-medium text-muted-foreground text-center py-2"
                    >
                        {day}
                    </div>
                {/each}
            </div>
            <div class="grid grid-cols-7 gap-2">
                {#each blanks as _, index}
                    <div key={`blank-${index}`} class="aspect-square"></div>
                {/each}
                {#each daysArray as day}
                    <button
                        type="button"
                        onclick={() => handleDateSelect(day)}
                        class={`
                            aspect-square rounded-md text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px] flex items-center justify-center
                            ${isSelected(day) ? "hover:bg-primary/90" : ""}

                        `}
                        class:bg-primary={isSelected(day)}
                        class:text-primary-foreground={isSelected(day)}
                        class:border-2={isToday(day) && !isSelected(day)}
                        class:border-primary={isToday(day) && !isSelected(day)}
                        class:text-foreground={!isSelected(day)}
                    >
                        {day}
                    </button>
                {/each}
            </div>
        </div>
    {/if}
</div>

<script>
    import Chart from "chart.js/auto";
    import { onMount } from "svelte";
    import estilos from "$lib/stores/estilos";
    import { capitalize } from "$lib/stringutil/lib";
    import { createDarker } from "$lib/stores/dark.svelte";
    let { historicorows, elegir,elegirnombre } = $props();
    let darker = createDarker()
    let dark = $state(darker)
    //chart js
    let ctx = $state(null);
    let canvas = $state(null);
    let chart = $state(null);
    let metrica = $state("cantidad");
    let canvasRef = $state(null);

    let colorIndex = $state(0);
    const coloresBase = [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
    ];
    const labels = {
        cantidad: "Cantidad",
        peso: "Peso total (kg)",
        promedio: "Peso promedio (kg)",
    };
    function createChart() {
        ctx = canvasRef.getContext("2d");
        if (chart) {
            chart.destroy();
        }
        let data = historicorows.map((h) => ({
            x: h.fecha,
            y: h[metrica],
        }));
        let label = labels[metrica];
        let color = "#FF6384"
        let dataset = {
            label: elegirnombre,
            data,
            borderColor: color,
            backgroundColor: color + "40", // versión con opacidad
            fill: false,
            tension: 0.3,
        };
        let datasets = [dataset];

        chart = new Chart(ctx, {
            type: "bar",
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 10,
                        bottom: 10,
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: darker.dark?"#ffffff":"#000000",
                            
                            font: {
                                size: 20, // 👈 Tamaño de letra de la leyenda
                                weight: 'bold'
                            }
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${labels[metrica]}: ${context.parsed.y.toFixed(2)}`;
                            },
                        },
                    }
                },
               
            },
        });
    }

    const getChartHeight = () => {
        if (typeof window !== "undefined") {
            return window.innerWidth < 640 ? 250 : 800; // sm: 640px
        }
        return 800;
    };
    onMount(() => {
        createChart();
    });
    //$effect(()=>createChart())
</script>

<!-- Controles de métrica -->
<div>
    <select
        class={`
            select select-bordered w-full
            rounded-md
            focus:outline-none focus:ring-2 
            focus:ring-green-500 
            focus:border-green-500
            
            ${estilos.bgdark2}
        `}
        bind:value={metrica}
        onchange={createChart}
    >
        {#each ["cantidad", "peso", "promedio"] as opcion}
            <option value={opcion} class="rounded">{capitalize(opcion)}</option>
        {/each}
    </select>
</div>

<!-- Canvas del gráfico -->
<!--<canvas bind:this={canvasRef} style="width: 100%; height: 400px;"></canvas>-->
<!--  Canvas responsive -->
<!-- Contenedor con ancho completo -->
<div
    style="width: 100%; height: {getChartHeight()}px; min-height: 200px;"
    class="w-full"
>
    <canvas
        bind:this={canvasRef}
        style="width: 100%; height: 100%;"
        class="w-full h-full"
    ></canvas>
</div>

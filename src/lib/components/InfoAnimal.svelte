<script>
    import estilos from "$lib/stores/estilos";
    import {
        shorterWord,
        capitalize,
        getSexoNombre,
    } from "$lib/stringutil/lib";
    import {
        getEstadoNombre,
        getEstadoColor,
    } from "$lib/components/estadosutils/lib";
    let { animal = $bindable({}) } = $props();
    let verAnimal  = $state(false)
    function calcularEdad(fechaNacimiento, fechaReferencia = new Date()) {
        const nacimiento = new Date(fechaNacimiento);
        const referencia = new Date(fechaReferencia);

        let años = referencia.getFullYear() - nacimiento.getFullYear();
        let meses = referencia.getMonth() - nacimiento.getMonth();
        let dias = referencia.getDate() - nacimiento.getDate();

        if (dias < 0) {
            // Restar un mes y calcular días exactos
            meses -= 1;
            const ultimoMes = new Date(
                referencia.getFullYear(),
                referencia.getMonth(),
                0,
            );
            dias += ultimoMes.getDate();
        }

        if (meses < 0) {
            años -= 1;
            meses += 12;
        }

        return `${años} A ${meses} M ${dias} D`;
    }
    
</script>

{#if verAnimal}
<div class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
    
    <div class="block p-4">
        <div class="flex justify-between items-start mb-2">
            
            {#if animal.sexo == "H" && animal.prenada != 1}
                <div
                    class={`badge badge-outline badge-${getEstadoColor(animal.prenada)}`}
                >
                    {getEstadoNombre(animal.prenada)}
                </div>
            {/if}
        </div>
        <div class="flex items-start">
            <span>Edad:</span>
            <span class="font-semibold">
                {animal.fechanacimiento != "" ? calcularEdad(animal.fechanacimiento) : ""}
            </span>
        </div>

        <div class="grid grid-cols-2 gap-y-2">
            <div class="flex items-start">
                <span class="font-semibold">{getSexoNombre(animal.sexo)}</span>
            </div>
            <div class="flex items-start">
                <span>Categoría:</span>
                <span class="font-semibold">
                    {animal.categoria}
                </span>
            </div>
            <div class="flex items-start">
                <span>Lote:</span>
                <span class="font-semibold">
                    {animal.expand
                        ? animal.expand.lote
                            ? animal.expand.lote.nombre
                            : ""
                        : ""}
                </span>
            </div>
            <div class="flex items-start">
                <span>Rodeo:</span>
                <span class="font-semibold">
                    {animal.expand
                        ? animal.expand.rodeo
                            ? animal.expand.rodeo.nombre
                            : ""
                        : ""}
                </span>
            </div>
        </div>
        <dir class="flex justify-start mx-0 px-0">
        <button 
            class={`${estilos.basico} ${estilos.chico} ${estilos.danger}`} 
            onclick={()=>verAnimal = false}
        >Cerrar</button>
    </dir>
    </div>
</div>
{:else}
<dir class="flex justify-start mx-0 px-0">
        <button 
        class={`${estilos.basico} ${estilos.chico} ${estilos.primario}`} 
            onclick={()=>verAnimal = true}
        >Ver animal</button>
    </dir>
{/if}
<script>
    import estilos from "$lib/stores/estilos";
    import {isEmpty} from "$lib/stringutil/lib"
    import { goto } from "$app/navigation";
    let {colabs = $bindable()} = $props()
    function getColab(id){
        goto("/colaboradores/"+id)
    }
</script>
<div class="w-full grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
    <table class="table table-lg w-full" >
        <thead>
            <tr>
                <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Nombre</th>
                <th class="text-base mx-1 px-1">Apellido</th>
            </tr>

        </thead>
        <tbody>
            {#each colabs as c}
                <tr class="hover:bg-gray-200 dark:hover:bg-gray-900" onclick={()=>getColab(c.id)}>
                    <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10 border-b">{c.expand.colab.nombre}</td>
                    <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10 border-b">{c.expand.colab.apellido}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
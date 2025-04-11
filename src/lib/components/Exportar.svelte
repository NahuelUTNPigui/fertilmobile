<script>
    //En proceso es que necesito un write file diferente para celular
    import estilos from "$lib/stores/estilos";
    let {data,titulo,filtros,confiltros,prepararData} = $props()
    import * as XLSX from "xlsx"
    function exportar(){
        let csvdata = data.map(prepararData)
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([])
        ws['A1']={t:'s',v:titulo,s:{}}
        const range = XLSX.utils.decode_range('A1:K1');
        ws['!merges'] = [{ s: { r: range.s.r, c: range.s.c }, e: { r: range.e.r, c: range.e.c } }];
        XLSX.utils.sheet_add_json(ws, csvdata, { origin: 'A2' });
        XLSX.utils.book_append_sheet(wb, ws, titulo);
        if(confiltros){
            const wsFilter = XLSX.utils.aoa_to_sheet(filtros)
            XLSX.utils.book_append_sheet(wb, wsFilter, 'Filtros aplicados');
        }
        XLSX.writeFile(wb, `${titulo.replace(/\//g, "-")}.xlsx`, { cellStyles: true });
    }
</script>
<button
    onclick={exportar}
    class={`
        bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
        ${estilos.btnsecondary}
        rounded-full
        px-4 pt-2 pb-3
    `} 
    aria-label="Exportar"
>
    <span  class="text-xl font-semibold ">Exportar</span>
    
</button>
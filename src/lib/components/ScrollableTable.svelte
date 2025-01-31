
<script>




    let nacimientos = [
      { id: '1', fecha: '2023-01-01', expand: { madre: { caravana: 'M001' }, padre: { caravana: 'P001' } } },
      { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
      { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
          { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
      { id: '1', fecha: '2023-01-01', expand: { madre: { caravana: 'M001' }, padre: { caravana: 'P001' } } },
      { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
      { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
          { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
        { id: '2', fecha: '2023-01-02', expand: { madre: { caravana: 'M002' }, padre: { caravana: 'P002' } } },
      // Add more sample data here to test scrolling
    ];
  
    let selectedNacimiento = null;
  
    function elegirNacimiento(id) {
      selectedNacimiento = id;
    }
  </script>
  
  <div class="w-full max-w-4xl mx-auto">
    <div class="border rounded-lg overflow-hidden">
      <div class="overflow-x-auto"> 
        <!--Creo que aca esta la clave-->
        <div class="max-h-[400px] overflow-y-auto">
          <table class="table w-full">
            <thead class="sticky top-0 bg-white dark:bg-gray-800 z-10">
              <tr>
                <th class="text-base px-4 py-2">Fecha</th>
                <th class="text-base px-4 py-2">Madre,Padre</th>
                <th class="text-base px-4 py-2">Elegir</th>
              </tr>
            </thead>
            <tbody>
              {#each nacimientos as n (n.id)}
                <tr class="border-t">
                  <td class="text-base px-4 py-2">{new Date(n.fecha).toLocaleDateString()}</td>
                  <td class="text-base px-4 py-2">{n.expand.madre.caravana} , {n.expand.padre.caravana}</td>
                  <td class="text-base px-4 py-2 {n.id === selectedNacimiento ? 'text-green-500' : ''}">
                    <div class="tooltip" data-tip="Nacimiento">
                      <button
                        aria-label="Nacimiento"
                        on:click={() => elegirNacimiento(n.id)}
                        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      >
                        star
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  
  <style lang="postcss">
    /* Add any additional global styles here if needed */
  </style>
import { browser } from "$app/environment";

export function createStorageProxy(storageKey, defaultObj) {
    function load() {
        if (browser) {
            const data = localStorage.getItem(storageKey);
            if (data) {
                try {
                    const parsedData = JSON.parse(data);
                    // Combinar con valores por defecto para asegurar que tenga todos los atributos
                    const mergedData = { ...defaultObj, ...parsedData };
                    // Guardar la versión combinada para futuras cargas
                    localStorage.setItem(storageKey, JSON.stringify(mergedData));
                    return mergedData;
                } catch (e) {
                    console.error("Error parseando", storageKey, e);
                    localStorage.setItem(storageKey, JSON.stringify(defaultObj));
                    return structuredClone(defaultObj);
                }
            }
            else{
                localStorage.setItem(storageKey, JSON.stringify(defaultObj));
                return structuredClone(defaultObj);
            }
            

        }
        else {
            return structuredClone(defaultObj);
        }

    }
    function save(obj) {
        localStorage.setItem(storageKey, JSON.stringify(obj));
    }
    return {storageKey,load,save}
}
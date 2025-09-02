import { browser } from "$app/environment";

export function createStorageProxy(storageKey, defaultObj) {
    function load() {
        if (browser) {
            const data = localStorage.getItem(storageKey);
            if (data) {
                try {
                    return JSON.parse(data);
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
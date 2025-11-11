import { createStorageProxy } from "$lib/filtros/filtros";
export function navegarAPadre(animalId, caravana,animal) {
    const genealogiaStorage = createStorageProxy('genealogia_arbol', {
        progenitores: [],
        posicionActual: -1
    });
    const data = genealogiaStorage.load();
    
    // Si estamos en medio del historial, cortamos lo que sigue
    if (data.posicionActual < data.progenitores.length - 1) {
        data.progenitores = data.progenitores.slice(0, data.posicionActual + 1);
    }
    
    // Agregamos el nuevo animal al historial
    data.progenitores.push({
        id: animalId,
        caravana,
        animal,
        fecha: new Date().toISOString()
    });
    
    data.posicionActual = data.progenitores.length - 1;
    
    genealogiaStorage.save(data);
}

export function volverAtras() {
    const genealogiaStorage = createStorageProxy('genealogia_arbol', {
        progenitores: [],
        posicionActual: -1
    });
    const data = genealogiaStorage.load();
    if (data.posicionActual > 0) {
        data.posicionActual--;
        genealogiaStorage.save(data);
        return data.progenitores[data.posicionActual];
    }
    return null;
}

export function irAElemento(indice) {
    const genealogiaStorage = createStorageProxy('genealogia_arbol', {
        progenitores: [],
        posicionActual: -1
    });
    const data = genealogiaStorage.load();
    if (indice >= 0 && indice < data.progenitores.length) {
        
        data.posicionActual = indice;
        data.progenitores = data.progenitores.slice(0, data.posicionActual + 1);
        genealogiaStorage.save(data);
        return data.progenitores[indice];
    }
    return null;
}
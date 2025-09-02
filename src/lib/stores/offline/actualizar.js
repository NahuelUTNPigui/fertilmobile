
const CINCO_MIN = 300000
const MEDIA_HORA = 1800000
const UNA_HORA = 3600000

const DOS_HORAS = 7200000
export function actualizacion(
    velocidad,          // B/s estimado
    confiabilidad,      // entre 0 y 1
    tipoRed
){
    const MIN = CINCO_MIN;     // 5 minutos
    const MAX = UNA_HORA; // 2 horas
    const vmax = 1_000_000;        // 1MB/s como velocidad máxima razonable

    // Normalizar velocidad
    const vnorm = Math.min(velocidad / vmax, 1);

    // Clamp confiabilidad a [0, 1]
    const c = Math.min(Math.max(confiabilidad, 0), 1);

    // Penalización por tipo de red
    let penalizacionTipo = 0;
    if (tipoRed === "cellular") {
        penalizacionTipo = 0.2; // penalizamos 20%
    } else if (tipoRed === "wifi") {
        penalizacionTipo = 0;   // sin penalización
    } else {
        penalizacionTipo = 0.1; // unknown o ethernet o fallback
    }

    // Score final: promedio velocidad + confiabilidad - penalización
    const rawScore = (vnorm + c) / 2;
    const score = Math.max(0, rawScore - penalizacionTipo); // forzamos score ∈ [0,1]

    // Interpolación inversa
    const intervalo = MIN + (1 - score) * (MAX - MIN);
    return intervalo;
}
export function deboActualizar(
    velocidad,          // B/s estimado
    confiabilidad,      // entre 0 y 1
    coninternet,
    fromColab,
    ahora,
    antes
){
    if(coninternet.connected){
        
        if(confiabilidad<0.75){
            return false
        }
            
        
        let ACTUALIZACION = actualizacion(velocidad,confiabilidad,coninternet.connectionType)
        //No importa si hay internet sino si es tiempo de actualizar
        if((ahora-antes)>=ACTUALIZACION){
            return true
        }
        else{
            return false
        }
    }
    else{
        return false
    }
    
    
    
}

let loges = $state([]);
let errores = $state([]);
let lineas = $state([])
function getShallowCopy(arr, count = 3) {
    return arr.slice(0, count);
}
export const loger = {
    get loges() {
        return loges;
    },
    get errores() {
        return errores;
    },
    get lineas() {
        return lineas;
    },
    addLog: (item) => {
        loges = [...loges, item]; // reactividad
    },
    addTextLog:(text)=>{
        loges = [...loges,{time:Date.now(),text}]
    },
    addTextLogArray:(arr,count=3)=>{
        loges = [...loges,{time:Date.now(),text:JSON.stringify(getShallowCopy(arr,count),null,2)}]
    },
    addError: (item) => {
        errores = [...errores, item];
    },
    addTextError: (text) => {
        
        errores = [...errores,{time:Date.now(),text}]
    },
    addTextLinea: (text) => {
        
        lineas = [...lineas,{time:Date.now(),text}]
    },
    addLineaNumber:(numero,modedebug=true)=>{
        if(modedebug){
            lineas = [...lineas,{time:Date.now(),text:""+numero}]
        }
        
    },
    cleanLog: () => {
        loges = [];
    },
    cleanErrores: () => {
        errores = [];
    },
    cleanLineas: () => {
        lineas = [];
    },
};

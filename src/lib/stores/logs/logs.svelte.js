
let loges = $state([]);
let errores = $state([]);
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
    cleanLog: () => {
        loges = [];
    },
    cleanErrores: () => {
        errores = [];
    },
};

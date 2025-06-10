
let loges = $state([]);
let errores = $state([]);
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
    addError: (item) => {
        errores = [...errores, item];
    },
    cleanLog: () => {
        loges = [];
    },
    cleanErrores: () => {
        errores = [];
    },
};

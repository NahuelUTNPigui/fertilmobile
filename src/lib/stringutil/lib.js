import sexos from "$lib/stores/sexos";
export function isEmpty(str){
    return (!str || str.length === 0 );
}
export function capitalize(s) {
 return (s && String(s[0]).toUpperCase() + String(s).slice(1)) || ""
}
export function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
export function randomString(len, an) {
    an = an && an.toLowerCase();
    var str = "",
        i = 0,
        min = an == "a" ? 10 : 0,
        max = an == "n" ? 10 : 62;
    for (; i++ < len;) {
        var r = Math.random() * (max - min) + min << 0;
        str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);
    }
    return str;
}
export function getWholeWordButLastLetter(word){
    let newword = word.slice(0,word.length - 2)
    return newword
}
export function getSexoNombre(s){
    let sex = sexos.filter(se=>se.id == s)[0]
    if(sex){
        return sex.nombre
    }
    else{
        return ""
    }
    
}

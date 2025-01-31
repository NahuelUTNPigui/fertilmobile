export function isEmpty(str){
    return (!str || str.length === 0 );
}
export function capitalize(s) {
 return (s && String(s[0]).toUpperCase() + String(s).slice(1)) || ""
}

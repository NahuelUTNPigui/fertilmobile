import { Preferences } from '@capacitor/preferences';
const CURRENT_SCHEMA_VERSION = 3;
let userdefault = {
    id:"",
    nombre:"",
    apellido:"",
    username:"",
    token:"",
    codigo: "", // nuevo campo
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastupdate:0,
    nivel:0
}
function migrateV1toV2(user) {
    return {
        ...user,
        codigo: "", // agregar campo nuevo
        schemaVersion: 2
    };
}
function migrateV2toV3(user) {
    return {
        ...user,
        lastupdate: 0, // agregar campo nuevo
        schemaVersion: 3
    };
}
function applyMigrations(user) {
    if (!user.schemaVersion) user.schemaVersion = 1;
    let i = 0
    while (user.schemaVersion < CURRENT_SCHEMA_VERSION || i <  5) {
        if (user.schemaVersion === 1) {
            user = migrateV1toV2(user);
        }
        if (user.schemaVersion === 2) {
            user = migrateV2toV3(user);
        }
        // futuras migraciones aquí
        i += 1;
    }

    return user;
}
export async function setDefaultUserOffline() {
    await Preferences.set({
        key:"usuario",
        value:JSON.stringify(userdefault)
    })
}
export async function editUserCommonData(data) {
    let u = await Preferences.get({ key: 'usuario' });
     u = {
        ...u,
        ...data
     }
    await Preferences.set({key:"usuario",value:JSON.stringify(u)})
    return u
}
export async function setUserOffline(id,nombre,apellido,username,token,nivel,codigo) {

    let u ={
        id,
        nombre,
        apellido,
        username,
        token,//Para que quiero el token
        nivel,
        codigo,
        lastupdate:0,
        schemaVersion:2
    };

    await Preferences.set({key:"usuario",value:JSON.stringify(u)})
}
export async function updateLocalSQLUser(pb) {
    const authData = await pb.collection('users').authRefresh();
    let pb_json = JSON.parse(localStorage.getItem('pocketbase_auth'))
    let usuarioid = pb_json.record.id
    let usermail = pb_json.record.email
    let username = pb_json.record.username
    let nombre = pb_json.record.nombre
    let apellido = pb_json.record.apellido
    let nivel = pb_json.record.nivel
    let codigo = pb_json.record.codigo
    await setUserOffline(
        usuarioid,
        nombre,
        apellido,
        username,
        pb.authStore.token,
        nivel,
        codigo
    );

}
export async function getUserOffline() {
    const u = await Preferences.get({ key: 'usuario' });
    if(u.value){
        let user = JSON.parse(u.value);
        let copia = JSON.parse(u.value);
        user = applyMigrations(user);
        if (copia.schemaVersion !== CURRENT_SCHEMA_VERSION) {
            await Preferences.set({ key: 'usuario', value: JSON.stringify(user) });
        }
        return user
    }
    else{
        return userdefault
    }
}

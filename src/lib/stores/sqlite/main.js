import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";
import { Capacitor } from "@capacitor/core";

const DBNAME = "fertil.db"

//Ademas se va a encargar de interactuar con la nube

// Para mi van en otro archivo por que son funciones
export async function getAnimalesDB(db) {
    
    let animales = await db.query("select id,lista from Colecciones where id=1")
    return animales
}
export async function setAnimalesDB(db,lista) {
    
    let json_lista = JSON.stringify(lista)
    await db.run(`UPDATE Colecciones SET lista = '${json_lista}' WHERE  id = 1`)

}

export async function resetTables(db) {
    
    await db.execute(`DROP TABLE IF EXISTS Colecciones`)
    await db.execute(`DROP TABLE IF EXISTS Animalesuser`)
    await db.execute(`DROP TABLE IF EXISTS Internet`)
    await db.execute(`DROP TABLE IF EXISTS Comandos`)
    // Creo la tabla de colecciones
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Colecciones (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL,
            lista TEXT NOT NULL,
            ultimo INT NOT NULL
        )
    `);
    // Creo la tabla numeros animales
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Animalesuser (
            id INTEGER PRIMARY KEY,
            numero INT NOT NULL,
            ultimo INT NOT NULL
        )
    `);
    // Creo la tabla internet
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Internet (
            id INTEGER PRIMARY KEY,
            internet INT NOT NULL,
            ultimo INT NOT NULL
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Comandos (
            id INTEGER PRIMARY KEY,
            lista TEXT NOT NULL
        )
    `);
    //Consultar si existe algun valor para esas tablas
    //tabla collecciones
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (1,'Animales','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (2,'animaleselegir','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (3,'nacimientos','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (4,'trats','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (5,'tipostrat','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (6,'rodeos','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (7,'lotes','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (8,'observaciones','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (9,'inseminaciones','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (10,'servicios','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (11,'tactos','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (12,'pesajes','[]',0)")
    
    //tabla numeroanimales
    await db.run("INSERT INTO Animalesuser (id,numero,ultimo) VALUES (1,0,0)")
    
    //tabla internet
    await db.run("INSERT INTO Internet (id,internet,ultimo) VALUES (1,0,0)")
    //tabla comandos
    await db.run("INSERT INTO Comandos (id,lista) VALUES (1,'[]')")

    return db;
}
export async function initTables(){
    const platform = Capacitor.getPlatform();
  
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    if (platform === "web") {
        await jeepSqlite(window);
        await customElements.whenDefined("jeep-sqlite");
        const jeepSqliteEl = document.createElement("jeep-sqlite");
        document.body.appendChild(jeepSqliteEl);
        await customElements.whenDefined("jeep-sqlite");
        await sqlite.initWebStore();
    }
    const db = await sqlite.createConnection(
        DBNAME,
        false,
        "no-encryption",
        1,
        false
     );
    await db.open();
    // Creo la tabla de colecciones
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Colecciones (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL,
            lista TEXT NOT NULL,
            ultimo INT NOT NULL
        )
    `);
    // Creo la tabla numeros animales
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Animalesuser (
            id INTEGER PRIMARY KEY,
            numero INT NOT NULL,
            ultimo INT NOT NULL
        )
    `);
    // Creo la tabla internet
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Internet (
            id INTEGER PRIMARY KEY,
            internet INT NOT NULL,
            ultimo INT NOT NULL
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Comandos (
            id INTEGER PRIMARY KEY,
            lista TEXT NOT NULL
        )
    `);
    //Consultar si existe algun valor para esas tablas
    //tabla collecciones
    let colls = await db.query("select * from Colecciones")
    if(!colls.values || colls.values.length == 0){
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (1,'Animales','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (2,'animaleselegir','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (3,'nacimientos','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (4,'trats','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (5,'tipostrat','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (6,'rodeos','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (7,'lotes','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (8,'observaciones','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (9,'inseminaciones','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (10,'servicios','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (11,'tactos','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (12,'pesajes','[]',0)")
    }
    //tabla numeroanimales
    let ans = await db.query("select * from Animalesuser")
    if(!ans.values || ans.values.length == 0){
        await db.run("INSERT INTO Animalesuser (id,numero,ultimo) VALUES (1,0,0)")
    }
    //tabla internet
    let inter = await db.query("select * from Internet")
    if(!inter.values || inter.values.length == 0){
        await db.run("INSERT INTO Internet (id,internet,ultimo) VALUES (1,0,0)")
    }
    //Tabla comandos
    let comander = await db.query("select * from Comandos")
    if(!comander.values || comander.values.length == 0){
        //tabla comandos
        await db.run("INSERT INTO Comandos (id,lista) VALUES (1,'[]')")
    }

    // Save store only for web platform
    if (platform === "web") {
        await sqlite.saveToStore(DBNAME);
    }

    return db;
}   
export async function openDB(){
    let db;
    let sqlitePlugin = CapacitorSQLite;
    let sqliteConnection = new SQLiteConnection(CapacitorSQLite);
    const retCC = (await sqliteConnection.checkConnectionsConsistency()).result;
    const isConn = (await sqliteConnection.isConnection(DBNAME, false)).result;
    if(retCC && isConn) {
        db = await sqliteConnection.retrieveConnection(DBNAME, false);
    } else {
        db = await initTables()
    }
    await db.open();
    const res = (await db.isDBOpen()).result;
    if(!res) {
        throw new Error('sqliteService.openDatabase: ddb not opened')
    }
    return db;
}

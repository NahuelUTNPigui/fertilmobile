import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";
import { Capacitor } from "@capacitor/core";
import { lastVersion } from "./dbversion";
const DBNAME = "fertil.db"

export async function resetTables(db) {
    
    await db.execute(`DROP TABLE IF EXISTS Colecciones`)
    await db.execute(`DROP TABLE IF EXISTS Animalesuser`)
    await db.execute(`DROP TABLE IF EXISTS Internet`)
    await db.execute(`DROP TABLE IF EXISTS Comandos`)
    await db.execute(`DROP TABLE IF EXISTS Establecimiento`)
    await db.execute(`DROP TABLE IF EXISTS Version`)
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
    // Creo la tabla de comandos
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Comandos (
            id INTEGER PRIMARY KEY,
            lista TEXT NOT NULL
        )
    `);
    //Creo la tabla de estableciento
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Establecimiento (
            id INTEGER PRIMARY KEY,
            valores TEXT NOT NULL,
            ultimo INT NOT NULL
        )
    `);
    //Creo la tabla de version
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Version (
            id INTEGER PRIMARY KEY,
            version INTEGER NOT NULL,
            description TEXT NOT NULL
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
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (13,'historiales','[]',0)")
    //Aca solo van los datos de los establecimientos
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (14,'cabs','[]',0)")
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (15,'colaboradores','[]',0)")
    //Aca iria el listado establecimientos asociados en los que quiero mantener los datos
    await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (16,'asociados','[]',0)")
    

    //tabla numeroanimales
    await db.run("INSERT INTO Animalesuser (id,numero,ultimo) VALUES (1,0,0)")
    //tabla internet
    await db.run("INSERT INTO Internet (id,internet,ultimo) VALUES (1,0,0)")
    //tabla comandos
    await db.run("INSERT INTO Comandos (id,lista) VALUES (1,'[]')")
    //Tabla de establecimiento
    await db.run("INSERT INTO Establecimiento (id,valores,ultimo) VALUES (1,'{}',0)")
    //Tabla de version
    let v = lastVersion()
    await db.run(`INSERT INTO Version (id,version,description) VALUES (1,${v.version},'${v.description}')`)

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
    // Creo la tabla de comandos
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Comandos (
            id INTEGER PRIMARY KEY,
            lista TEXT NOT NULL
        )
    `);
    //Creo la tabla de estableciento
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Establecimiento (
            id INTEGER PRIMARY KEY,
            valores TEXT NOT NULL,
            ultimo INT NOT NULL
        )
    `);//Creo la tabla de version
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Version (
            id INTEGER PRIMARY KEY,
            version INTEGER NOT NULL,
            description TEXT NOT NULL
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
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (13,'historiales','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (14,'cabs','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (15,'colaboradores','[]',0)")
        await db.run("INSERT INTO Colecciones (id,nombre,lista,ultimo) VALUES (16,'asociados','[]',0)")
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
    let establer = await db.query("select * from Establecimiento")
    //tabla de establecimento
    if(!establer.values || establer.values.length == 0){
        //tabla establecimiento
        await db.run("INSERT INTO Establecimiento (id,valores,ultimo) VALUES (1,'{}',0)")
    }
    let versioner = await db.query("select * from Version")
    //tabla de Version
    if(!versioner.values || versioner.values.length == 0){
        //aca debo buscar la ultima version
        //tabla establecimiento
        let v = lastVersion()
        await db.run(`INSERT INTO Version (id,version,description) VALUES (1,${v.version},'${v.description}')`)
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

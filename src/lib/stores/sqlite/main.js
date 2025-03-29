import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";
import { Capacitor } from "@capacitor/core";


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

export async function resetTables() {
    const platform = Capacitor.getPlatform();
    alert("platform:", platform);
  
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
        "fertil",
        false,
        "no-encryption",
        1,
        false
    );
    await db.execute(`DROP TABLE Colecciones`)
    await db.execute(`DROP TABLE Animalesuser`)
    await db.execute(`DROP TABLE Internet`)
    // Creo la tabla de colecciones
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Colecciones (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL,
            lista TEXT NOT NULL,
            agregado INT NOT NULL,
            modificado INT NOT NULL,
            eliminado INT NOT NULL,
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
    //Consultar si existe algun valor para esas tablas
    //tabla collecciones
    let colls = await db.query("select * from Colecciones")
    if(!colls.values || colls.values.length == 0){
        await db.run("INSERT INTO Colecciones (id,nombre,lista,agregado,modificado,eliminado,ultimo) VALUES (1,'Animales','',0,0,0,0)")
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

    // Save store only for web platform
    if (platform === "web") {
        await sqlite.saveToStore("fertil");
        alert("Store saved successfully");
    }

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
        "fertil.db",
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
            agregado INT NOT NULL,
            modificado INT NOT NULL,
            eliminado INT NOT NULL,
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
    //Consultar si existe algun valor para esas tablas
    //tabla collecciones
    let colls = await db.query("select * from Colecciones")
    if(!colls.values || colls.values.length == 0){
        await db.run("INSERT INTO Colecciones (id,nombre,lista,agregado,modificado,eliminado,ultimo) VALUES (1,'Animales','',0,0,0,0)")
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

    // Save store only for web platform
    if (platform === "web") {
        await sqlite.saveToStore("fertil");
        alert("Store saved successfully");
    }

    return db;
}   

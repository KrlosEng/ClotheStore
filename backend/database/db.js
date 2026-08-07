const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'tumoda.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conectado exitosamente a la base de datos SQLite (tumoda.db)');
  }
});

// Habilitar claves foráneas
db.run('PRAGMA foreign_keys = ON;');

// Inicializar esquema
function initSchema() {
  return new Promise((resolve, reject) => {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql, (err) => {
      if (err) {
        console.error('Error al ejecutar esquema SQL:', err.message);
        reject(err);
      } else {
        console.log('Esquema de base de datos verificado y listo.');
        resolve();
      }
    });
  });
}

// Helpers asíncronos para consultas SQL
function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function queryGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function queryRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

module.exports = {
  db,
  initSchema,
  queryAll,
  queryGet,
  queryRun
};

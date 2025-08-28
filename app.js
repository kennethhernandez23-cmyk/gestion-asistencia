const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const ExcelJS = require('exceljs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./data.db');

app.use(bodyParser.json());
app.use(express.static('public'));

// --- Crear tablas si no existen ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS trabajadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS asistencia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trabajador_id INTEGER,
    fecha TEXT,
    presente INTEGER,
    tipo_asistencia TEXT DEFAULT 'Presente',
    FOREIGN KEY(trabajador_id) REFERENCES trabajadores(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trabajador_id INTEGER,
    fecha TEXT,
    item TEXT,
    FOREIGN KEY(trabajador_id) REFERENCES trabajadores(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS maquinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS control_maquinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    maquina_id INTEGER,
    fecha TEXT,
    tipo TEXT,
    FOREIGN KEY(maquina_id) REFERENCES maquinas(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    contenido TEXT
  )`);
});

// --- Rutas de trabajadores, asistencia, stock, maquinas, notas ---
// (aquí va todo tu código de rutas tal como lo tenías)

app.get('/trabajadores', (req,res)=>{
  db.all(`SELECT * FROM trabajadores`, [], (err, rows)=> res.json(rows));
});
// ... todas tus otras rutas aquí ...

// --- Iniciar servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));


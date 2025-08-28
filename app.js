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

// --- Trabajadores ---
app.get('/trabajadores', (req,res)=>{
  db.all(`SELECT * FROM trabajadores`, [], (err, rows)=> res.json(rows));
});
app.post('/trabajadores', (req,res)=>{
  const {nombre} = req.body;
  db.run(`INSERT INTO trabajadores(nombre) VALUES (?)`, [nombre], function(err){
    if(err) return res.status(500).send(err.message);
    res.json({id:this.lastID});
  });
});

// --- Asistencia ---
app.get('/asistencia', (req,res)=>{
  const query = `
    SELECT a.*, t.nombre 
    FROM asistencia a 
    JOIN trabajadores t ON t.id = a.trabajador_id
    ORDER BY a.fecha ASC
  `;
  db.all(query, [], (err, rows)=> res.json(rows));
});
app.post('/asistencia', (req,res)=>{
  const {trabajador_id, fecha, presente, tipo_asistencia} = req.body;
  db.run(`INSERT INTO asistencia(trabajador_id, fecha, presente, tipo_asistencia) VALUES (?,?,?,?)`,
    [trabajador_id, fecha, presente ? 1 : 0, tipo_asistencia], function(err){
      if(err) return res.status(500).send(err.message);
      res.json({id:this.lastID});
    });
});
app.get('/exportar-asistencia', async (req,res)=>{
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Asistencia");
  sheet.addRow(["Trabajador","Fecha","Tipo asistencia"]);
  db.all(`SELECT t.nombre, a.fecha, a.tipo_asistencia FROM asistencia a JOIN trabajadores t ON t.id=a.trabajador_id ORDER BY a.fecha ASC`,
    [], async (err, rows)=>{
      if(err) return res.status(500).send(err.message);
      rows.forEach(r=>sheet.addRow([r.nombre, r.fecha, r.tipo_asistencia]));
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition","attachment; filename=asistencia.xlsx");
      await workbook.xlsx.write(res);
      res.end();
    });
});

// --- Stock ---
app.get('/stock', (req,res)=>{
  const query = `
    SELECT s.*, t.nombre 
    FROM stock s 
    JOIN trabajadores t ON t.id = s.trabajador_id
    ORDER BY s.fecha DESC
  `;
  db.all(query, [], (err, rows)=> res.json(rows));
});
app.post('/guardar-stock', (req,res)=>{
  const {trabajador_id, item, fecha} = req.body;
  db.run(`INSERT INTO stock(trabajador_id, item, fecha) VALUES (?,?,?)`, [trabajador_id, item, fecha], function(err){
    if(err) return res.status(500).send(err.message);
    res.json({id:this.lastID});
  });
});

// --- Máquinas ---
app.get('/maquinas', (req,res)=>{
  db.all(`SELECT * FROM maquinas`, [], (err, rows)=> res.json(rows));
});
app.post('/maquinas', (req,res)=>{
  const {nombre} = req.body;
  db.run(`INSERT INTO maquinas(nombre) VALUES (?)`, [nombre], function(err){
    if(err) return res.status(500).send(err.message);
    res.json({id:this.lastID});
  });
});
app.post('/control-maquinas', (req,res)=>{
  const {maquina_id, fecha, tipo} = req.body;
  db.run(`INSERT INTO control_maquinas(maquina_id, fecha, tipo) VALUES (?,?,?)`, [maquina_id, fecha, tipo], function(err){
    if(err) return res.status(500).send(err.message);
    res.json({id:this.lastID});
  });
});
app.get('/control-maquinas', (req,res)=>{
  const query = `
    SELECT cm.*, m.nombre AS maquina
    FROM control_maquinas cm
    JOIN maquinas m ON m.id = cm.maquina_id
    ORDER BY cm.fecha DESC
  `;
  db.all(query, [], (err, rows)=> res.json(rows));
});

// --- Notas ---
app.get('/notas', (req,res)=>{
  db.all(`SELECT * FROM notas ORDER BY fecha DESC`, [], (err, rows)=> res.json(rows));
});
app.post('/notas', (req,res)=>{
  const {fecha, contenido} = req.body;
  db.run(`INSERT INTO notas(fecha, contenido) VALUES (?,?)`, [fecha, contenido], function(err){
    if(err) return res.status(500).send(err.message);
    res.json({id:this.lastID});
  });
});
app.delete('/notas/:id', (req,res)=>{
  const {id} = req.params;
  db.run(`DELETE FROM notas WHERE id=?`, [id], function(err){
    if(err) return res.status(500).send(err.message);
    res.json({deleted:true});
  });
});

// --- Iniciar servidor ---
const PORT = 3000;
app.listen(PORT, ()=> console.log(`Servidor en http://localhost:${PORT}`));


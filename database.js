
import * as SQLite from 'expo-sqlite';

let db;

export async function iniciarBaseDatos() {
  db = await SQLite.openDatabaseAsync('campusswap.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      categoria TEXT NOT NULL,
      descripcion TEXT,
      vendedor TEXT NOT NULL
    );

   CREATE TABLE IF NOT EXISTS productos_locales (
  firebase_id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio REAL NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  vendedor TEXT NOT NULL,
  imagen TEXT
);
  `);
const columnas = await db.getAllAsync(
  'PRAGMA table_info(productos_locales)'
);

if (!columnas.some((columna) => columna.name === 'imagen')) {
  await db.execAsync(
    'ALTER TABLE productos_locales ADD COLUMN imagen TEXT'
  );
}
  console.log('SQLite: base de datos inicializada');
  return db;
}

// CONSULTAR productos guardados localmente
export async function consultarProductosLocales() {
  return await db.getAllAsync(
    'SELECT * FROM productos_locales ORDER BY nombre ASC'
  );
}

// INSERTAR o reemplazar un producto local
export async function guardarProductoLocal(producto) {
  return await db.runAsync(
    `INSERT OR REPLACE INTO productos_locales
    (firebase_id, nombre, precio, categoria, descripcion, vendedor, imagen)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    String(producto.id),
    producto.nombre,
    Number(producto.precio),
    producto.categoria,
    producto.descripcion || '',
    producto.vendedor,
    producto.imagen || ''
  );
}
// ACTUALIZAR un producto local
export async function actualizarProductoLocal(id, producto) {
  return await db.runAsync(
    `UPDATE productos_locales
     SET nombre = ?, precio = ?, categoria = ?,
         descripcion = ?, vendedor = ?, imagen = ?
     WHERE firebase_id = ?`,
    producto.nombre,
    Number(producto.precio),
    producto.categoria,
    producto.descripcion || '',
    producto.vendedor,
    producto.imagen || '',
    String(id)
  );
}

// ELIMINAR un producto local
export async function eliminarProductoLocal(id) {
  return await db.runAsync(
    'DELETE FROM productos_locales WHERE firebase_id = ?',
    String(id)
  );
}
// CONTAR productos almacenados en SQLite
export async function contarProductosLocales() {
  const resultado = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM productos_locales'
  );

  return resultado.total;
}

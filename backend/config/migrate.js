// Migraciones idempotentes: se ejecutan al arrancar el backend y solo agregan lo que falta.
// Cambios de esta version: padres sin cuenta (datos de contacto del responsable en el alumno),
// cuentas con contraseña temporal y plazo para el descargo del alumno.
const { pool } = require('./db');
const { leerEtiqueta, etiquetaCurso, catalogoBase } = require('../services/cursos');

async function columnaExiste(tabla, columna) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tabla, columna]
  );
  return rows[0].n > 0;
}

async function asegurarColumna(tabla, columna, definicion) {
  if (await columnaExiste(tabla, columna)) return false;
  await pool.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
  console.log(`[migracion] ${tabla}.${columna} agregada`);
  return true;
}

async function migrar() {
  await asegurarColumna('usuarios', 'debe_cambiar_clave', 'TINYINT(1) NOT NULL DEFAULT 0');
  await asegurarColumna('usuarios', 'responsable_nombre', 'VARCHAR(150) NULL');
  await asegurarColumna('usuarios', 'responsable_email', 'VARCHAR(150) NULL');
  await asegurarColumna('usuarios', 'responsable_telefono', 'VARCHAR(30) NULL');

  await asegurarColumna('informes', 'fecha_limite_descargo', 'DATETIME NULL');
  await asegurarColumna('informes', 'recordatorio_enviado', 'TINYINT(1) NOT NULL DEFAULT 0');
  await asegurarColumna('informes', 'descargo_vencido', 'TINYINT(1) NOT NULL DEFAULT 0');

  // Catalogo de cursos (año, division, turno, especialidad)
  await pool.query(`CREATE TABLE IF NOT EXISTS cursos (
    id_curso     INT AUTO_INCREMENT PRIMARY KEY,
    anio         TINYINT      NOT NULL,
    division     VARCHAR(3)   NOT NULL,
    turno        VARCHAR(10)  NOT NULL DEFAULT 'Mañana',
    especialidad VARCHAR(30)  NOT NULL DEFAULT '',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cursos UNIQUE (anio, division, turno)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await asegurarColumna('usuarios', 'id_curso', 'INT NULL');

  // Historial de cada informe (quien hizo que y cuando)
  await pool.query(`CREATE TABLE IF NOT EXISTS informe_historial (
    id_historial    INT AUTO_INCREMENT PRIMARY KEY,
    id_informe      INT          NOT NULL,
    usuario_id      INT          NULL,
    accion          VARCHAR(30)  NOT NULL,
    estado_anterior VARCHAR(20)  NULL,
    estado_nuevo    VARCHAR(20)  NULL,
    detalle         VARCHAR(255) NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_historial_informe (id_informe)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  // Catalogo inicial: solo si la tabla esta vacia (instalacion nueva o primera migracion); despues lo administra el gestor
  const [[{ cantidad }]] = await pool.query('SELECT COUNT(*) AS cantidad FROM cursos');
  if (Number(cantidad) === 0) {
    for (const c of catalogoBase()) {
      await pool.query('INSERT IGNORE INTO cursos (anio, division, turno, especialidad) VALUES (?, ?, ?, ?)', [c.anio, c.division, c.turno, c.especialidad]);
    }
    console.log('[migracion] catalogo inicial de cursos cargado');
  }
  await migrarCursosExistentes();

  // Los padres/tutores que ya tenian cuenta pasan a ser datos de contacto del alumno
  const [r] = await pool.query(
    `UPDATE usuarios a
       JOIN usuarios p ON a.id_padre = p.id_usuario
        SET a.responsable_nombre = TRIM(CONCAT(p.nombre, ' ', p.apellido)),
            a.responsable_email = p.email,
            a.responsable_telefono = p.telefono
      WHERE a.rol = 'alumno' AND a.responsable_email IS NULL`
  );
  if (r.affectedRows) console.log(`[migracion] ${r.affectedRows} alumno(s) con responsable copiado desde su tutor`);
}

// Los cursos escritos a mano ("6° 2°") pasan al catalogo y cada alumno queda enlazado a su curso.
// Lo que no se puede interpretar se deja como esta y se avisa en el log.
async function migrarCursosExistentes() {
  const [textos] = await pool.query(
    `SELECT DISTINCT curso AS texto FROM usuarios WHERE rol = 'alumno' AND curso IS NOT NULL AND curso <> ''
     UNION SELECT DISTINCT curso_destino FROM informes WHERE curso_destino IS NOT NULL AND curso_destino <> ''`
  );
  let nuevos = 0;
  for (const { texto } of textos) {
    const c = leerEtiqueta(texto);
    if (!c) { console.warn(`[migracion] curso no interpretable, queda como texto: "${texto}"`); continue; }
    // Las divisiones no se repiten entre turnos: si ya existe ese año+division (en cualquier turno), no se crea otro
    const [r] = await pool.query(
      'INSERT INTO cursos (anio, division, turno) SELECT ?, ?, ? FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM cursos WHERE anio = ? AND division = ?)',
      [c.anio, c.division, 'Mañana', c.anio, c.division]
    );
    nuevos += r.affectedRows;
  }
  const [cursos] = await pool.query('SELECT id_curso, anio, division, turno FROM cursos');
  let enlazados = 0;
  for (const c of cursos) {
    const [r] = await pool.query("UPDATE usuarios SET id_curso = ?, curso = ? WHERE rol = 'alumno' AND id_curso IS NULL AND curso IN (?)",
      [c.id_curso, etiquetaCurso(c), [etiquetaCurso(c), `${c.anio}°${c.division}°`, `${c.anio}° ${c.division}`, `${c.anio}°${c.division}`]]);
    enlazados += r.affectedRows;
    // Los informes a un curso quedan con la misma etiqueta que el catalogo
    await pool.query('UPDATE informes SET curso_destino = ? WHERE curso_destino IN (?)',
      [etiquetaCurso(c), [`${c.anio}°${c.division}°`, `${c.anio}° ${c.division}`, `${c.anio}°${c.division}`]]);
  }
  if (nuevos || enlazados) console.log(`[migracion] cursos: ${nuevos} agregado(s) al catalogo, ${enlazados} alumno(s) enlazado(s)`);
}

module.exports = { migrar };

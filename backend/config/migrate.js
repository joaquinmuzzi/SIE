// Migraciones idempotentes: se ejecutan al arrancar el backend y solo agregan lo que falta.
// Cambios de esta version: padres sin cuenta (datos de contacto del responsable en el alumno),
// cuentas con contraseña temporal y plazo para el descargo del alumno.
const { pool } = require('./db');

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

module.exports = { migrar };

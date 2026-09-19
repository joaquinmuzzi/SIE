-- Migracion incremental para bases de datos ya desplegadas (ej. Railway).
-- Ejecutar una sola vez sobre una base creada con la version anterior de schema.sql.

ALTER TABLE usuarios ADD COLUMN apellido VARCHAR(100) NOT NULL DEFAULT '' AFTER nombre;

ALTER TABLE informes MODIFY COLUMN id_alumno INT NULL;
ALTER TABLE informes ADD COLUMN alcance VARCHAR(20) NOT NULL DEFAULT 'individual' AFTER estado;
ALTER TABLE informes ADD COLUMN curso_destino VARCHAR(20) NULL AFTER alcance;

UPDATE informes SET gravedad = 'alta' WHERE gravedad = 'grave';
UPDATE informes SET gravedad = 'muy_alta' WHERE gravedad = 'muy_grave';

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario  INT AUTO_INCREMENT,
  nombre      VARCHAR(100)   NOT NULL,
  email       VARCHAR(150)   NOT NULL,
  password    VARCHAR(255)   NOT NULL,
  rol         VARCHAR(20)    NOT NULL DEFAULT 'alumno',
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuarios PRIMARY KEY (id_usuario),
  CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS informes (
  id_informe          INT AUTO_INCREMENT,
  titulo              VARCHAR(200)   NOT NULL,
  descripcion         TEXT           NOT NULL,
  fecha               DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_asignado_id INT            NOT NULL,
  creado_por_id       INT            NOT NULL,
  created_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_informes PRIMARY KEY (id_informe),
  CONSTRAINT fk_informes_usuario_asignado
    FOREIGN KEY (usuario_asignado_id) REFERENCES usuarios (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_informes_creado_por
    FOREIGN KEY (creado_por_id) REFERENCES usuarios (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_informes_fecha ON informes (fecha);
CREATE INDEX idx_informes_asignado ON informes (usuario_asignado_id);

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario    INT AUTO_INCREMENT,
  nombre        VARCHAR(100)   NOT NULL,
  email         VARCHAR(150)   NOT NULL,
  password      VARCHAR(255)   NOT NULL,
  rol           VARCHAR(30)    NOT NULL DEFAULT 'alumno',
  dni           VARCHAR(15)    NULL,
  telefono      VARCHAR(20)    NULL,
  cargo         VARCHAR(50)    NULL,
  tiene_acceso  TINYINT(1)     NOT NULL DEFAULT 0,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuarios PRIMARY KEY (id_usuario),
  CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS informes (
  id_informe            INT AUTO_INCREMENT,
  titulo                VARCHAR(200)   NOT NULL,
  tipo                  VARCHAR(30)    NOT NULL DEFAULT 'conducta',
  gravedad              VARCHAR(20)    NOT NULL DEFAULT 'leve',
  estado                VARCHAR(20)    NOT NULL DEFAULT 'activo',
  texto_profesor        TEXT           NULL,
  texto_regente         TEXT           NULL,
  texto_pat             TEXT           NULL,
  descargo_alumno       TEXT           NULL,
  id_alumno             INT            NOT NULL,
  id_padre              INT            NULL,
  creado_por_id         INT            NOT NULL,
  fecha                 DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_informes PRIMARY KEY (id_informe),
  CONSTRAINT fk_informes_alumno
    FOREIGN KEY (id_alumno) REFERENCES usuarios (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_informes_padre
    FOREIGN KEY (id_padre) REFERENCES usuarios (id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_informes_creado_por
    FOREIGN KEY (creado_por_id) REFERENCES usuarios (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_informes_fecha ON informes (fecha);
CREATE INDEX idx_informes_alumno ON informes (id_alumno);
CREATE INDEX idx_informes_estado ON informes (estado);

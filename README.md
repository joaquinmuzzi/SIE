# SIE · Sistema de Informes Escolares

Aplicación web para registrar, seguir y comunicar los **informes de conducta** de la Escuela Técnica N° 35. Docentes y preceptores crean los informes, la regencia y el equipo de acompañamiento intervienen en ellos, el alumno presenta su descargo y las familias consultan los informes que les corresponden desde cualquier dispositivo.

Proyecto de **Prácticas Profesionalizantes 2026** · 6° 2° Computación.

- **Aplicación:** https://sistemadegestiondeinformes.netlify.app
- **API:** https://sie-production-014a.up.railway.app

---

## Funcionalidades

- **Acceso por roles** con usuario y contraseña (JWT). Profesores y preceptores se registran con su cuenta `@bue.edu.ar`.
- **Informes** de tipo *Conducta*, *Consejo de Aula* o *Consejo Escolar de Convivencia*, con gravedad *Leve*, *Alta* o *Muy alta*.
- **Alcance:** a un alumno (búsqueda por DNI o nombre; el tutor se asigna automáticamente), a un curso o a toda la comunidad.
- **Tres intervenciones por informe**, cada una en su propio campo: profesor, regente y PAT.
- **Descargo del alumno** en sus informes individuales mientras el informe no esté cerrado.
- **Estados:** `abierto` → `en_revision` → `cerrado`. Los informes no se borran: se cierran y quedan como antecedente.
- **Descarga en PDF** de los informes cerrados.
- **Paginación** de 10 informes por página.
- **Vínculo alumno–tutor** al registrarse, para que cada familia vea solo lo que le corresponde.

## Roles

| Rol | Ve | Puede |
|---|---|---|
| Profesor / Preceptor | Todos los informes | Crear informes y redactar el texto del profesor en los informes que creó |
| Regente | Todos los informes | Crear informes, redactar el texto del regente, pasar a revisión y finalizar |
| Gestor / Directivo | Todos los informes | Control total: editar todos los campos, cambiar estados y cerrar |
| Asesoría Pedagógica / DOE / PAT | Todos los informes | Redactar el texto del PAT |
| Secretaría | Todos los informes | Consulta |
| Alumno | Sus informes, los de su curso y los generales | Redactar su descargo |
| Padre / Tutor | Informes de sus hijos, de sus cursos y los generales | Consulta y descarga en PDF |

## Tecnologías

| Capa | Tecnología | Despliegue |
|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, jsPDF, Lucide | Netlify |
| Backend | Node.js, Express, JSON Web Tokens, bcryptjs | Railway |
| Base de datos | MySQL (`mysql2`) | Railway |

## Estructura

```
SIE/
├── backend/
│   ├── config/db.js            # Pool de conexión a MySQL
│   ├── controllers/            # Lógica de autenticación e informes
│   ├── db/schema.sql           # Creación de tablas
│   ├── db/migration_v2.sql     # Migración para bases ya desplegadas
│   ├── middleware/auth.js      # Verificación de JWT y autorización por rol
│   ├── models/                 # Acceso a datos (User, Report)
│   ├── routes/                 # /api/auth y /api/reports
│   └── index.js                # Servidor Express
└── frontend/
    └── src/
        ├── api/axios.js        # Cliente HTTP con el token
        ├── context/AuthContext.jsx
        └── pages/              # Login, Registro y Panel (Dashboard)
```

## Instalación local

**Requisitos:** Node.js 18 o superior y un servidor MySQL 8.

### 1. Base de datos

```sql
CREATE DATABASE sistema_informes;
```

Ejecutar `backend/db/schema.sql` sobre esa base. Si la base se creó con una versión anterior, ejecutar una sola vez `backend/db/migration_v2.sql`.

### 2. Backend

```bash
cd backend
npm install
```

Crear `backend/.env`:

```env
PORT=5000
JWT_SECRET=una_clave_larga_y_secreta
CORS_ORIGIN=http://localhost:5173
# Opción A: URL de conexión completa (la que usa Railway)
MYSQL_DATABASE=mysql://usuario:clave@host:3306/sistema_informes
# Opción B: sin MYSQL_DATABASE, se conecta a la base "sistema_informes" con estos datos
# MYSQL_HOST=localhost
# MYSQL_PORT=3306
# MYSQL_USER=root
# MYSQL_PASSWORD=
```

```bash
npm run dev
```

> `CORS_ORIGIN` admite varios orígenes separados por coma. Si no se define, se permite solo el dominio de Netlify.

### 3. Frontend

```bash
cd frontend
npm install
```

Crear `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

La aplicación queda en `http://localhost:5173`.

## API

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Registro de usuario |
| POST | `/api/auth/login` | Público | Inicio de sesión, devuelve el token |
| GET | `/api/auth/alumnos` | Gestor, Directivo, Profesor, Preceptor, Regente | Listado de alumnos |
| GET | `/api/auth/users` | Gestor, Directivo | Listado de usuarios |
| GET | `/api/auth/padres` | Público | Tutores (para el registro de alumnos) |
| GET | `/api/auth/alumnos-sin-padre` | Público | Alumnos sin tutor (para el registro de tutores) |
| POST | `/api/auth/link-hijos` | El propio tutor, Gestor o Directivo | Vincula alumnos a un tutor |
| GET | `/api/reports?page=&limit=` | Autenticado | Informes visibles para el usuario, paginados |
| POST | `/api/reports` | Gestor, Directivo, Profesor, Preceptor, Regente | Crear informe |
| PUT | `/api/reports/:id` | Cada rol edita su propio campo; docentes solo en sus informes | Editar informe (no si está cerrado) |
| PATCH | `/api/reports/:id/state` | Gestor, Directivo, Regente | Cambiar estado |
| POST | `/api/reports/:id/descargo` | Alumno del informe | Cargar descargo |
| DELETE | `/api/reports/:id` | Gestor, Directivo | Cerrar informe (no lo borra) |

## Despliegue

- **Frontend (Netlify):** directorio base `frontend`, comando `npm run build`, carpeta publicada `frontend/dist`, variable `REACT_APP_API_URL` con la URL pública de la API.
- **Backend (Railway):** directorio `backend`, comando `npm start`, variables `MYSQL_DATABASE` (URL de la base MySQL de Railway) y `JWT_SECRET`. `CORS_ORIGIN` es opcional.

## Documentación del proyecto

En la carpeta compartida de Google Drive del proyecto:

- Visión del proyecto y visión de la aplicación
- Diagrama de contexto, listado de acontecimientos y DFD
- DER (notación Chen e IDEF1X) y diccionario de datos
- Planificación: objetivos específicos y diagrama de Gantt
- Manual de usuario y manual de procedimientos
- Bitácora del proyecto

La gestión de tareas se lleva en ClickUp (espacio *Mensajería E.T. 35*).

## Próximas mejoras

- Notificaciones automáticas por correo a tutor, alumno y PAT.
- Confirmación de lectura del tutor.
- Recuperación de contraseña por correo.
- Alta de roles de conducción habilitada solo por la administración.
- Guardado de borradores sin conexión.

## Equipo

| Integrante | Rol en el proyecto |
|---|---|
| Joaquín Muzzi | Líder · datos, backend y despliegue |
| Felipe Igarzábal | Co-líder · diseño del sistema y modelado de datos |
| Santino Portaluppi | Procesos, objetivos y lógica del sistema |
| Kevin Yavi | Diagramas de contexto y acontecimientos, experiencia de usuario |

**Docentes:** Juan Manuel Moya · Aaron Sebastian Serrano — Escuela Técnica N° 35, 2026.

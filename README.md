# SIE · Sistema de Informes Escolares

Aplicación web para registrar, seguir y comunicar los **informes de conducta** de la Escuela Técnica N° 35. Docentes y preceptores crean los informes, la regencia y el equipo de acompañamiento intervienen en ellos, el alumno presenta su descargo dentro de un plazo y las familias reciben avisos por correo (no necesitan cuenta).

Proyecto de **Prácticas Profesionalizantes 2026** · 6° 2° Computación.

- **Aplicación:** https://sistemadegestiondeinformes.netlify.app
- **API:** https://sie-production-014a.up.railway.app

---

## Funcionalidades

- **Acceso por roles** con usuario y contraseña (JWT). **No hay registro público:** el Gestor o Directivo crea las cuentas y la contraseña temporal (aleatoria por usuario) llega por correo; hay que cambiarla en el primer ingreso. Profesores y preceptores usan su cuenta `@bue.edu.ar`.
- **Informes** de tipo *Conducta*, *Consejo de Aula* o *Consejo Escolar de Convivencia*, con gravedad *Leve*, *Alta* o *Muy alta*.
- **Alcance:** a un alumno (búsqueda por DNI o nombre; el responsable del alumno recibe el aviso por correo), a un curso o a toda la comunidad.
- **Tres intervenciones por informe**, cada una en su propio campo: profesor, regente y PAT.
- **Descargo del alumno** en sus informes individuales mientras el informe no esté cerrado.
- **Estados:** `abierto` → `en_revision` → `cerrado`. Los informes no se borran: se cierran y quedan como antecedente.
- **Descarga en PDF** de los informes cerrados, con formato institucional (encabezado, datos del informe, intervenciones y descargo).
- **Paginación** de 10 informes por página, con **búsqueda** (título, alumno, DNI o curso), **filtros por estado y por curso** y contadores.
- **Vista de detalle** de cada informe con sus intervenciones, el avance (emitido → descargo → revisión → cerrado) y las acciones según el rol.
- **Diseño adaptado al celular**: barra inferior y botón para crear informes.
- **Padres y tutores sin cuenta:** el alumno guarda los datos de contacto de su responsable (nombre, correo, teléfono) y este recibe por correo un resumen al crearse el informe y cuando cambia de estado.
- **Plazo para el descargo:** cada informe individual da 5 días hábiles al alumno (aviso, recordatorio a mitad de plazo); al vencer pasa solo a revisión y a los 15 días se cierra automáticamente. Los informes anteriores a esta función no se modifican.
- **Gestión de usuarios** (Gestor/Directivo): alta de cuentas, estado de la contraseña, restablecimiento y eliminación (no se puede eliminar a quien ya tiene informes, a uno mismo ni al último gestor).
- **Mi cuenta:** cada usuario cambia su contraseña desde el engranaje del panel lateral (en celular, junto al botón de salir); se avisa por correo.
- **Catálogo de cursos** (Gestor/Directivo): año, división, turno y especialidad. El curso de un alumno y el destino de un informe por curso se eligen de un desplegable. Se carga solo el catálogo inicial (1° a 6° año: 10, 9, 9, 2, 2 y 3 divisiones) y 6° 1° y 6° 2° figuran en el turno tarde.
- **Historial de cada informe:** quién hizo qué y cuándo (creación, cambios de estado, ediciones, descargo y acciones automáticas del «Sistema»).
- **Estadísticas:** informes por mes, gravedad, tipo y curso, alumnos con más informes y estado de los descargos.

## Roles

| Rol | Ve | Puede |
|---|---|---|
| Profesor / Preceptor | Todos los informes | Crear informes y redactar el texto del profesor en los informes que creó |
| Regente | Todos los informes | Crear informes, redactar el texto del regente, pasar a revisión y finalizar |
| Gestor / Directivo | Todos los informes | Control total: editar todos los campos, cambiar estados y cerrar; administrar cuentas y cursos |
| Asesoría Pedagógica / DOE / PAT | Todos los informes | Redactar el texto del PAT |
| Secretaría | Todos los informes | Consulta |
| Alumno | Sus informes, los de su curso y los generales | Redactar su descargo |
| Padre / Tutor | Sin cuenta | Recibe avisos por correo |

## Tecnologías

| Capa | Tecnología | Despliegue |
|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, jsPDF, Lucide (tipografía IBM Plex Sans) | Netlify |
| Backend | Node.js, Express, JSON Web Tokens, bcryptjs | Railway |
| Base de datos | MySQL (`mysql2`) | Railway |

## Estructura

```
SIE/
├── backend/
│   ├── config/db.js            # Pool de conexión a MySQL
│   ├── controllers/            # Autenticación, informes, cursos e historial/estadísticas
│   ├── db/schema.sql           # Creación de tablas
│   ├── db/migration_v2.sql     # Migración para bases ya desplegadas
│   ├── middleware/auth.js      # Verificación de JWT y autorización por rol
│   ├── models/                 # Acceso a datos (User, Report)
│   ├── config/migrate.js       # Migraciones idempotentes que corren al arrancar
│   ├── routes/                 # /api/auth, /api/reports y /api/cursos
│   ├── services/               # Mails (Resend), claves temporales y ciclo de vida de los informes
│   ├── repositories/           # Acceso a datos del ciclo de vida y del historial
│   ├── test/                   # Pruebas (node:test)
│   └── index.js                # Servidor Express
└── frontend/
    └── src/
        ├── api/axios.js        # Cliente HTTP con el token
        ├── utils/informePdf.js # Generación del PDF del informe
        ├── components/         # AppShell, ReportCard, ReportDetail, ReportForm, UsuariosPanel, CursosPanel,
        │                         #   EstadisticasPanel, HistorialInforme, MiCuenta, AuthLayout y ui
        ├── context/AuthContext.jsx
        └── pages/              # Login, cambio de clave y Panel (Dashboard, con la sección Usuarios)
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
# Correo (opcional; sin esto no se envían mails y el gestor ve la clave temporal en pantalla)
# RESEND_API_KEY=re_xxxxxxxx
# MAIL_FROM=SIE <alertas@tu-dominio-verificado>
# DESCARGO_DIAS_HABILES=5
# CIERRE_DIAS=15
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

### 4. Pruebas

```bash
cd backend
node --test test/ciclo.test.js test/cuenta.test.js test/cursos.test.js
```

## API

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Inicio de sesión, devuelve el token |
| GET | `/api/auth/alumnos` | Gestor, Directivo, Profesor, Preceptor, Regente | Listado de alumnos |
| GET | `/api/auth/users` | Gestor, Directivo | Listado de usuarios |
| POST | `/api/auth/users` | Gestor, Directivo | Crea una cuenta y envía la contraseña temporal por correo |
| POST | `/api/auth/users/:id/reset-password` | Gestor, Directivo | Restablece la contraseña (nueva temporal por correo) |
| DELETE | `/api/auth/users/:id` | Gestor, Directivo | Elimina una cuenta (409 si tiene informes; no a uno mismo ni al último gestor) |
| POST | `/api/auth/change-password` | Autenticado | Cambia la contraseña (obligatorio con una temporal; también desde Mi cuenta) |
| GET | `/api/cursos` | Autenticado | Catálogo de cursos |
| POST / PUT / DELETE | `/api/cursos[/:id]` | Gestor, Directivo | Alta, edición (turno, especialidad) y baja de cursos |
| GET | `/api/reports?page=&limit=&estado=&q=` | Autenticado | Informes visibles para el usuario, paginados, con filtro por estado y curso, búsqueda y cantidad por estado (`counts`) |
| POST | `/api/reports` | Gestor, Directivo, Profesor, Preceptor, Regente | Crear informe |
| PUT | `/api/reports/:id` | Cada rol edita su propio campo; docentes solo en sus informes | Editar informe (no si está cerrado) |
| PATCH | `/api/reports/:id/state` | Gestor, Directivo, Regente | Cambiar estado |
| GET | `/api/reports/stats` | Autenticado | Estadísticas de los informes visibles |
| GET | `/api/reports/:id/historial` | Autenticado | Historial de cambios del informe |
| POST | `/api/reports/:id/descargo` | Alumno del informe | Cargar descargo |
| DELETE | `/api/reports/:id` | Gestor, Directivo | Cerrar informe (no lo borra) |

## Despliegue

- **Frontend (Netlify):** directorio base `frontend`, comando `npm run build`, carpeta publicada `frontend/dist`, variable `REACT_APP_API_URL` con la URL pública de la API.
- **Backend (Railway):** directorio `backend`, comando `npm start`, variables `MYSQL_DATABASE` (URL de la base MySQL de Railway) y `JWT_SECRET`. Para el correo, `RESEND_API_KEY` y `MAIL_FROM` (Railway bloquea SMTP: se usa la API HTTPS de Resend). `CORS_ORIGIN`, `DESCARGO_DIAS_HABILES` y `CIERRE_DIAS` son opcionales. Las migraciones de la base se aplican solas al arrancar.

## Documentación del proyecto

En la carpeta compartida de Google Drive del proyecto:

- Visión del proyecto y visión de la aplicación
- Diagrama de contexto, listado de acontecimientos y DFD
- DER (notación Chen e IDEF1X) y diccionario de datos
- Planificación: objetivos específicos y diagrama de Gantt
- Manual de usuario (v2.2) y manual de procedimientos (v2.2)
- Bitácora del proyecto

La gestión de tareas se lleva en ClickUp (espacio *Mensajería E.T. 35*).

## Próximas mejoras

- Recuperación de contraseña autónoma por correo y carga masiva de cuentas.
- Cambio de curso de un alumno desde la interfaz.
- Confirmar con la escuela los turnos y especialidades de 4° a 6° año.
- Integración con otros sistemas de la escuela.
- Confirmación de lectura del tutor.
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

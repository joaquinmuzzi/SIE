# Sistema de Informes Escolares - MVP

Este es un proyecto full-stack (MERN) para la gestión de informes escolares.

## Características
- **Autenticación:** Registro y login con JWT.
- **Roles:**
  - `Directivo`: Puede crear, editar, ver todos y eliminar informes. También puede ver la lista de alumnos.
  - `Alumno/Padre`: Solo puede ver los informes que le han sido asignados.
- **Frontend:** React + Tailwind CSS + Lucide Icons.
- **Backend:** Node.js + Express + MongoDB + Mongoose.

## Requisitos
- Node.js instalado.
- MongoDB instalado y corriendo localmente (o una URI de MongoDB Atlas).

## Instalación y Ejecución

### 1. Configurar el Backend
```bash
cd backend
npm install
```
Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido (o usa el que ya está):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/sistema-informes
JWT_SECRET=secreto_super_seguro_123
NODE_ENV=development
```
Inicia el servidor:
```bash
npm run dev
```

### 2. Configurar el Frontend
Abre otra terminal:
```bash
cd frontend
npm install
```
Inicia la aplicación:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173` (o el puerto que indique Vite).

## Estructura de Carpetas
- `backend/`: API REST, Modelos de datos, Controladores y Middlewares.
- `frontend/`: Aplicación React, Contexto de Auth, Páginas y consumo de API.

## Notas
- El primer usuario que registres puede ser un `Directivo` para que puedas empezar a cargar informes.
- Los informes se asignan a usuarios con rol `alumno` o `padre`.

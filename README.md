# 🏥 HQ Hospital - Frontend

Frontend del sistema HQ Hospital, una aplicación para la gestión de consultas médicas y administración hospitalaria. Este proyecto está desarrollado en React, utilizando Tailwind CSS y Shadcn/UI para la interfaz de usuario.

## 📋 Descripción General

El sistema permite la gestión de:

- Pacientes
- Doctores
- Especialidades
- Consultas médicas
- Centros médicos
- Empleados

### Características principales:

- Autenticación y autorización con JWT (tokens generados desde el backend)
- Recuperación y restablecimiento de contraseña
- Gestion de las entidades mencionadas con anterioridad
- Módulo de reportes 
- Dashboard con datos de interés

**Backend del sistema:** [Hospital Management System - Backend](https://github.com/JosueGarciaAbata/hospital-management-system)

## 👥 Roles del Sistema

### Administrador
- Acceso al dashboard
- Gestión de centros médicos
- Gestión de doctores
- Gestión de especialidades médicas
- Generación de reportes

### Doctor
- Gestión de pacientes pertenecientes a su centro médico
- Gestión de consultas médicas

## 🛠️ Tecnologías Principales

- **React** - Biblioteca de JavaScript para interfaces de usuario
- **Vite** - Herramienta de build rápida
- **Tailwind CSS** - Framework de CSS utilitario
- **Shadcn/UI** - Componentes de UI
- **React Router DOM** - Enrutamiento
- **React Hook Form** - Manejo de formularios
- **TanStack Query** - Gestión de estado del servidor
- **Axios** - Cliente HTTP



## 📁 Carpetas Principales del Proyecto

```
src/
├── components/        # Componentes empleados en la UI
├── context/           # Contextos globales (ej: AuthContext.jsx)
├── hooks/             # Custom Hooks reutilizables
├── inc/               # Componentes auxiliares (admin UI, providers)
├── layouts/           # Layouts comunes de la aplicación
├── lib/               # Configuraciones y utilidades externas
├── pages/             # Vistas principales (auth, admin, patients, etc.)
├── services/          # Llamadas a la API (authService, doctors.service, etc.)
└── utils/             # Utilidades generales (auth, tokenStorage, rutas protegidas)
```

## ⚙️ Instalación y Configuración

### Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- Opcional: Docker y Docker Compose

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:8080
```

> **Nota:** Si el backend se despliega en otro puerto o servidor, actualizar esta variable con la URL correspondiente.

## 🚀 Ejecución del Proyecto

### Desarrollo Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Levantar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

   El proyecto estará disponible en: http://localhost:5173

### Build de Producción

```bash
npm run build
npm run preview
```

### Ejecución con Docker

1. Asegurar que el archivo `.env` esté configurado correctamente
2. Construir y levantar el contenedor:

```bash
docker compose up -d
```

> ⚠️ **Nota:** Existe un archivo de configuración `nginx.config` en la raíz del proyecto.  
> Este archivo se encarga de cómo Nginx sirve la aplicación dentro del contenedor Docker.  
> En caso de que se desee modificar rutas, servir assets de manera diferente u otros ajustes de despliegue, se debe modificar este archivo antes de construir el contenedor.




## ✨ Alcance del Proyecto

- **Autenticación:** Login y gestión de sesión con JWT, recuperación de contraseña y gestión de perfil
- **Gestión completa:** Pacientes, doctores, empleados, especialidades, centros médicos y consultas médicas
- **Consultas médicas:** Registro y seguimiento completo
- **Dashboard administrativo:** Visualización de datos relevantes
- **Reportes:** Sistema de reportes para administradores
- **Interfaz intuitiva:** CRUDs completos con tablas ordenables y acciones de ver, editar y eliminar


## 🔗 Repositorios Relacionados

- **Backend:** [Hospital Management System - Backend](https://github.com/JosueGarciaAbata/hospital-management-system)

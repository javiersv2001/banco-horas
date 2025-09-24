# Sistema de Login - Banco de Horas

Sistema de autenticación seguro con verificación por PIN para la Institución Universitaria Pascual Bravo.

## 🧭 Resumen del Flujo y Componentes

- **Flujo de Autenticación (Login → PIN → Sesión)**
  1. El usuario inicia sesión con correo institucional y contraseña (POST `/api/auth/login`).
  2. El sistema valida credenciales, crea una sesión temporal y envía un **PIN** por correo.
  3. El usuario ingresa el **PIN** (POST `/api/auth/verify-pin`), se valida y se emite un **token de sesión (JWT)**.
  4. Con el token de sesión, el usuario puede acceder al dashboard y endpoints protegidos (GET `/api/auth/verify-session`).
  5. Puede cerrar sesión (POST `/api/auth/logout`).

- **Componentes del Backend**
  - `config/database.js`: Pool PostgreSQL y utilidades `conectarBD`, `consultarBD`, `transaccionBD`.
  - `config/email.js`: Servicio SMTP con plantillas HTML para **PIN** y **recuperación de contraseña**.
  - `routes/auth.js`: Endpoints de autenticación (login, verify-pin, resend-pin, verify-session, logout, forgot-password).
  - `scripts/`: Utilidades CLI (`configurarBaseDatos`, `crearUsuario`).

- **Tokens JWT usados**
  - `JWT_LOGIN_SECRET`: Emite el token temporal de login (antes de verificar el PIN). Válido por ~15 min.
  - `JWT_SECRET`: Emite el token de sesión tras verificar el PIN. Válido según `SESSION_EXPIRY_HOURS`.


## 🚀 Características

- **Login seguro** con validación de dominio universitario (@pascualbravo.edu.co)
- **Verificación por PIN** enviado al correo electrónico
- **Recuperación de contraseña** por correo electrónico
- **Interfaz responsive** y moderna
- **Base de datos PostgreSQL** para almacenamiento seguro
- **Autenticación JWT** con tokens de sesión
- **Rate limiting** para prevenir ataques de fuerza bruta

## 📋 Requisitos del Sistema

- Node.js 16+ 
- PostgreSQL 12+
- Servidor de correo (Gmail, Outlook, etc.)

## 🛠️ Instalación

### 1. Clonar o descargar el proyecto

```bash
# Si tienes git instalado
git clone <repository-url>
cd banco-de-horas

# O simplemente descarga y extrae los archivos
```

### 2. Instalar dependencias de Node.js

```bash
npm install
```

### 2.1. Configurar base de datos (script automático)

```bash
npm run configurar-bd
```

Este script ejecuta el esquema inicial y crea un usuario administrador por defecto (solo para desarrollo).

### 3. Configurar PostgreSQL

1. Instala PostgreSQL si no lo tienes
2. Crea una base de datos:

```sql
CREATE DATABASE banco_horas;
CREATE USER banco_user WITH PASSWORD 'tu_password_segura';
GRANT ALL PRIVILEGES ON DATABASE banco_horas TO banco_user;
```

3. Ejecuta el schema de la base de datos:

```bash
psql -U banco_user -d banco_horas -f database/schema.sql
```

### 4. Configurar variables de entorno

1. Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

2. Edita el archivo `.env` con tus configuraciones:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banco_horas
DB_USER=banco_user
DB_PASSWORD=tu_password_segura

# JWT Secret Keys (genera claves seguras)
JWT_SECRET=tu-clave-jwt-super-secreta-aqui
JWT_LOGIN_SECRET=tu-clave-login-jwt-secreta

# Email Configuration (ejemplo con Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password

# Application Configuration
PORT=3000
NODE_ENV=development
```

### 5. Configurar correo electrónico

#### Para Gmail:
1. Activa la verificación en 2 pasos
2. Genera una "Contraseña de aplicación"
3. Usa esa contraseña en `EMAIL_PASSWORD`

#### Para otros proveedores:
- **Outlook**: `smtp-mail.outlook.com`, puerto 587
- **Yahoo**: `smtp.mail.yahoo.com`, puerto 587

## 🚀 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000`

## 🧰 Scripts NPM

```
"dev": "nodemon server.js"              # Ejecuta el servidor en modo desarrollo (recarga automática)
"start": "node server.js"               # Ejecuta el servidor en modo producción
"configurar-bd": "node scripts/setup-database.js"  # Crea el esquema y un usuario admin por defecto
```

## 📁 Estructura del Proyecto

```
banco-de-horas/
├── css/
│   └── styles.css          # Estilos CSS responsive
├── js/
│   ├── login.js             # Lógica de login (validación y consumo de API)
│   ├── pin-verification.js  # Verificación de PIN (finaliza sesión)
│   ├── dashboard.js         # Dashboard (verifica sesión, logout)
│   └── forgot-password.js   # Recuperación de contraseña (solicita enlace)
├── config/
│   ├── database.js          # Configuración PostgreSQL (pool y utilidades de BD)
│   └── email.js             # Servicio de correo (PIN y recuperación)
├── routes/
│   └── auth.js           # Rutas de autenticación
├── database/
│   └── schema.sql        # Schema de la base de datos
├── index.html            # Página de login
├── pin-verification.html # Verificación PIN
├── dashboard.html        # Dashboard principal
├── forgot-password.html  # Recuperación contraseña
├── server.js            # Servidor principal
├── package.json         # Dependencias Node.js
└── README.md           # Este archivo
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración
- Rate limiting en endpoints críticos
- Validación de dominio universitario
- Limpieza automática de tokens expirados
- Headers de seguridad con Helmet

## 📧 Configuración de Usuarios

### Crear usuarios manualmente en la base de datos:

```sql
-- Hashear contraseña (usar bcrypt con 12 rounds)
INSERT INTO users (email, password_hash, name) VALUES 
('admin@pascualbravo.edu.co', '$2b$12$hash_de_la_contraseña', 'Administrador');
```

### O usar Node.js para hashear:

```javascript
const bcrypt = require('bcryptjs');
const password = 'mi_contraseña_segura';
const hash = await bcrypt.hash(password, 12);
console.log(hash); // Usar este hash en la base de datos
```

## 🧠 Nombres de funciones y utilidades (Backend en español)

- `config/database.js`
  - `conectarBD()`: Verifica la conexión a PostgreSQL al iniciar el servidor.
  - `consultarBD(sql, params)`: Ejecuta consultas simples y registra duración/filas.
  - `transaccionBD(callback)`: Maneja transacciones (`BEGIN/COMMIT/ROLLBACK`).
- `scripts/create-user.js`
  - `crearUsuario(correo, contraseña, nombre)`: Crea un usuario con correo institucional y contraseña hasheada.
- `scripts/setup-database.js`
  - `configurarBaseDatos()`: Aplica el esquema SQL y crea el usuario administrador por defecto.

Estas funciones han sido renombradas y comentadas para facilitar su comprensión y mantenimiento.

## 🐛 Solución de Problemas

### Error de conexión a la base de datos
- Verifica que PostgreSQL esté ejecutándose
- Confirma las credenciales en `.env`
- Asegúrate de que la base de datos existe

### Emails no se envían
- Verifica la configuración SMTP en `.env`
- Para Gmail, usa contraseña de aplicación
- Revisa los logs del servidor para errores específicos

### Error "Token inválido"
- Los tokens expiran automáticamente
- Cierra sesión e inicia sesión nuevamente
- Verifica que `JWT_SECRET` sea consistente

## 🔧 Personalización

### Cambiar dominio de email
Edita la validación en:
- `js/login.js` (función `validarCorreoInstitucional`)
- `js/forgot-password.js` (función `validarCorreoInstitucional`)
- `routes/auth.js` (validaciones de email en los endpoints)
- `database/schema.sql` (constraint de email si aplica)

### Modificar tiempo de expiración PIN
Cambia `PIN_EXPIRY_MINUTES` en `.env`

### Personalizar emails
Edita las plantillas HTML en `config/email.js`. Los colores están alineados a la Institución Universitaria Pascual Bravo (azules y dorado de acento).

## 📱 Uso del Sistema

1. **Login**: Ingresa email @pascualbravo.edu.co y contraseña
2. **Verificación**: Revisa tu correo y ingresa el PIN de 6 dígitos
3. **Dashboard**: Accede al sistema principal
4. **Recuperación**: Usa "¿Olvidaste tu contraseña?" si es necesario

## 🤝 Soporte

Para problemas técnicos:
1. Revisa los logs del servidor
2. Verifica la configuración de `.env`
3. Consulta la documentación de PostgreSQL y Node.js

## 📄 Licencia

MIT License - Libre para uso educativo y comercial.

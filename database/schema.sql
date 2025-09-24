-- =====================================================
--  Esquema de Base de Datos: Banco de Horas
--  PostgreSQL
--  Contiene:
--   - Tabla de usuarios (users)
--   - Tabla de verificaciones de PIN (pin_verifications)
--   - Tabla de sesiones de login (login_sessions)
--   - Tabla de tokens de recuperación (password_reset_tokens)
--   - Índices de rendimiento
--   - Trigger para updated_at en users
--   - Función de limpieza de registros expirados
-- =====================================================

-- Create database (run this command separately in PostgreSQL)
-- CREATE DATABASE banco_horas;

-- Connect to the database and run the following:

-- ===============================================
--  Tabla: users
--  Propósito: almacena credenciales y perfil básico del usuario.
--  Campos clave:
--   - email: único, restringido al dominio institucional.
--   - last_login: último acceso exitoso.
-- ===============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    CONSTRAINT email_domain_check CHECK (email LIKE '%@pascualbravo.edu.co')
);

-- ===============================================
--  Tabla: pin_verifications
--  Propósito: almacena PIN de verificación temporales para 2FA de inicio de sesión.
--  Relaciones:
--   - user_id -> users(id) ON DELETE CASCADE (al eliminar usuario, se eliminan sus PINs)
--  Notas:
--   - expires_at: tiempo de expiración del PIN
--   - is_used: marca si el PIN ya fue consumido
-- ===============================================
CREATE TABLE IF NOT EXISTS pin_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    pin_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP
);

-- ===============================================
--  Tabla: login_sessions
--  Propósito: gestiona el flujo de sesión (token temporal de login y token de sesión).
--  Relaciones:
--   - user_id -> users(id) ON DELETE CASCADE
--  Notas:
--   - login_token: JWT temporal (antes de verificar PIN)
--   - session_token: JWT de sesión (después de verificar PIN)
--   - is_pin_verified: indica si ya se verificó el PIN
--   - expires_at: vencimiento de la sesión
-- ===============================================
CREATE TABLE IF NOT EXISTS login_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    login_token VARCHAR(255) UNIQUE NOT NULL,
    session_token VARCHAR(255) UNIQUE,
    is_pin_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
--  Tabla: password_reset_tokens
--  Propósito: gestiona tokens de recuperación de contraseña.
--  Relaciones:
--   - user_id -> users(id) ON DELETE CASCADE
--  Notas:
--   - token: string único para construir la URL de restablecimiento
--   - expires_at: vencimiento del token
--   - is_used: marca de consumo del token
-- ===============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP
);

-- ===============================================
--  Índices de rendimiento
--  Propósito: acelerar búsquedas por columnas usadas frecuentemente.
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_pin_verifications_user_id ON pin_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_pin_verifications_pin_code ON pin_verifications(pin_code);
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_login_token ON login_sessions(login_token);
CREATE INDEX IF NOT EXISTS idx_login_sessions_session_token ON login_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- ===============================================
--  Función: update_updated_at_column
--  Propósito: actualizar automáticamente la columna updated_at
--  en la tabla users ante cualquier UPDATE.
-- ===============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===============================================
--  Trigger: update_users_updated_at
--  Propósito: invoca la función anterior en cada UPDATE de users.
-- ===============================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
--  Datos de ejemplo (opcional, para pruebas)
--  Nota: Los hashes de contraseña son ficticios.
-- ===============================================
INSERT INTO users (email, password_hash, name) VALUES 
    ('admin@pascualbravo.edu.co', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQq', 'Administrador Sistema'),
    ('estudiante@pascualbravo.edu.co', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQq', 'Estudiante Prueba')
ON CONFLICT (email) DO NOTHING;

-- ===============================================
--  Función: cleanup_expired_records
--  Propósito: elimina registros expirados de
--   - pin_verifications
--   - login_sessions
--   - password_reset_tokens
--  Recomendado ejecutarla periódicamente (cron/scheduler).
-- ===============================================
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void AS $$
BEGIN
    -- Clean expired PIN verifications
    DELETE FROM pin_verifications WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Clean expired login sessions
    DELETE FROM login_sessions WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Clean expired password reset tokens
    DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
--  Programación recomendada (opcional):
--   - Usar cron (Linux) o Tareas Programadas (Windows)
--   - Intervalo sugerido: cada 15 minutos
-- ===============================================

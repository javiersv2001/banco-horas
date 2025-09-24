// ===============================================
//  Dashboard (Frontend)
//  - Verifica sesión activa periódicamente
//  - Muestra saludo con nombre del usuario
//  - Permite cerrar sesión de forma segura
// ===============================================

// URL base de la API
const URL_BASE_API = 'http://localhost:3000/api';

// Elementos del DOM
const saludoUsuario = document.getElementById('userWelcome');
const botonLogout = document.getElementById('logoutBtn');

// Verificar autenticación y cargar datos del usuario
function verificarAutenticacion() {
    const sessionToken = sessionStorage.getItem('sessionToken');
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (!sessionToken || !userEmail) {
        // Redirigir al login si no hay sesión válida
        window.location.href = 'index.html';
        return false;
    }
    
    // Mostrar nombre del usuario si está disponible
    if (userName) {
        saludoUsuario.textContent = `Bienvenido, ${userName}`;
    } else {
        saludoUsuario.textContent = `Bienvenido, ${userEmail.split('@')[0]}`;
    }
    
    return true;
}

// Verificar sesión con el servidor
async function verificarSesion() {
    const sessionToken = sessionStorage.getItem('sessionToken');
    
    if (!sessionToken) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const response = await fetch(`${URL_BASE_API}/auth/verify-session`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Sesión inválida');
        }
        
        const data = await response.json();
        
        // Actualizar información del usuario si es necesaria
        if (data.user && data.user.name) {
            sessionStorage.setItem('userName', data.user.name);
            saludoUsuario.textContent = `Bienvenido, ${data.user.name}`;
        }
        
    } catch (error) {
        console.error('Error verificando sesión:', error);
        // Si la sesión no es válida, limpiar y redirigir
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// Cerrar sesión
async function cerrarSesion() {
    const sessionToken = sessionStorage.getItem('sessionToken');
    
    try {
        // Notificar al servidor sobre el logout
        if (sessionToken) {
            await fetch(`${URL_BASE_API}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        // Limpiar datos locales y redirigir
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// Event listeners
botonLogout.addEventListener('click', function() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        cerrarSesion();
    }
});

// Prevenir acceso directo sin autenticación
window.addEventListener('beforeunload', function() {
    // Opcional: limpiar datos sensibles si es necesario
});

// Verificar sesión periódicamente (cada 5 minutos)
setInterval(verificarSesion, 5 * 60 * 1000);

// Inicializar la página
window.addEventListener('load', function() {
    if (verificarAutenticacion()) {
        verificarSesion();
    }
});

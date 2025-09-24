// ===============================================
//  Configuración e interacción de Login (Frontend)
//  - Valida correo institucional y contraseña
//  - Se comunica con la API para iniciar sesión
//  - Maneja errores y redirecciones
// ===============================================

// URL base de la API
const URL_BASE_API = 'http://localhost:3000/api';

// Elementos del DOM
const formularioLogin = document.getElementById('loginForm');
const inputCorreo = document.getElementById('email');
const inputContraseña = document.getElementById('password');
const errorCorreo = document.getElementById('emailError');
const errorContraseña = document.getElementById('passwordError');
const contenedorErrorLogin = document.getElementById('loginError');

// Valida que el correo pertenezca al dominio institucional
function validarCorreoInstitucional(correo) {
    const dominioUniversidad = '@pascualbravo.edu.co';
    return correo.toLowerCase().endsWith(dominioUniversidad.toLowerCase());
}

// Utilidades para mostrar/ocultar mensajes de error
function mostrarError(elemento, mensaje) {
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
}

function ocultarError(elemento) {
    elemento.textContent = '';
    elemento.style.display = 'none';
}

function mostrarErrorLogin(mensaje) {
    const textoError = contenedorErrorLogin.querySelector('.error-text');
    textoError.textContent = mensaje;
    contenedorErrorLogin.style.display = 'block';
}

function ocultarErrorLogin() {
    contenedorErrorLogin.style.display = 'none';
}

// Validación en tiempo real de entradas del usuario
inputCorreo.addEventListener('input', function() {
    ocultarError(errorCorreo);
    ocultarErrorLogin();
    
    if (this.value && !validarCorreoInstitucional(this.value)) {
        mostrarError(errorCorreo, 'Debe usar un correo del dominio @pascualbravo.edu.co');
    }
});

inputContraseña.addEventListener('input', function() {
    ocultarError(errorContraseña);
    ocultarErrorLogin();
});

// Envío del formulario de login
formularioLogin.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Limpiar errores previos
    ocultarError(errorCorreo);
    ocultarError(errorContraseña);
    ocultarErrorLogin();
    
    const correo = inputCorreo.value.trim();
    const contraseña = inputContraseña.value.trim();
    
    // Validaciones
    let hasErrors = false;
    
    if (!correo) {
        mostrarError(errorCorreo, 'El correo electrónico es requerido');
        hasErrors = true;
    } else if (!validarCorreoInstitucional(correo)) {
        mostrarError(errorCorreo, 'Debe usar un correo del dominio @pascualbravo.edu.co');
        hasErrors = true;
    }
    
    if (!contraseña) {
        mostrarError(errorContraseña, 'La contraseña es requerida');
        hasErrors = true;
    }
    
    if (hasErrors) return;
    
    // Deshabilitar el botón mientras se procesa
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Verificando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${URL_BASE_API}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: correo, password: contraseña })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Guardar información del usuario en sessionStorage
            sessionStorage.setItem('userEmail', correo);
            sessionStorage.setItem('loginToken', data.token);
            
            // Modo desarrollo: si llega devPin desde el backend, mostrarlo
            if (data.devPin) {
                console.log('PIN de desarrollo (devPin):', data.devPin);
                try { alert('PIN de desarrollo: ' + data.devPin); } catch (e) {}
                sessionStorage.setItem('devPin', data.devPin);
            }
            
            // Redirigir a la página de verificación PIN
            window.location.href = 'pin-verification.html';
        } else {
            mostrarErrorLogin(data.message || 'Credenciales incorrectas. Verifique su email y contraseña.');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarErrorLogin('Error de conexión con el servidor. Intente nuevamente.');
    } finally {
        // Restaurar el botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Al cargar la página: verificar si ya hay una sesión activa
window.addEventListener('load', function() {
    const token = sessionStorage.getItem('loginToken');
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (token && userEmail) {
        // Verificar si el token sigue siendo válido
        fetch(`${URL_BASE_API}/auth/verify-session`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = 'dashboard.html';
            }
        })
        .catch(error => {
            console.log('Sesión expirada o inválida');
            sessionStorage.clear();
        });
    }
});

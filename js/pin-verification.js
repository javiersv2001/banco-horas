// ===============================================
//  Verificación de PIN (Frontend)
//  - Valida PIN de 6 dígitos
//  - Reenvía PIN cuando se solicita
//  - Completa sesión guardando token de sesión
// ===============================================

// URL base de la API
const URL_BASE_API = 'http://localhost:3000/api';

// Elementos del DOM
const formularioPin = document.getElementById('pinForm');
const inputPin = document.getElementById('pin');
const errorPin = document.getElementById('pinError');
const contenedorErrorPin = document.getElementById('pinErrorContainer');
const exitoPin = document.getElementById('pinSuccess');
const spanCorreoUsuario = document.getElementById('userEmail');
const botonReenviarPin = document.getElementById('resendPin');

// Verificar si el usuario tiene acceso a esta página
function verificarAcceso() {
    const userEmail = sessionStorage.getItem('userEmail');
    const loginToken = sessionStorage.getItem('loginToken');
    
    if (!userEmail || !loginToken) {
        window.location.href = 'index.html';
        return false;
    }
    
    spanCorreoUsuario.textContent = userEmail;
    return true;
}

// Mostrar errores y mensajes
function mostrarError(elemento, mensaje) {
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
}

function ocultarError(elemento) {
    elemento.textContent = '';
    elemento.style.display = 'none';
}

function mostrarErrorPin(mensaje) {
    const textoError = contenedorErrorPin.querySelector('.error-text');
    textoError.textContent = mensaje;
    contenedorErrorPin.style.display = 'block';
}

function ocultarErrorPin() {
    contenedorErrorPin.style.display = 'none';
}

function mostrarExito(mensaje) {
    const textoExito = exitoPin.querySelector('.success-text');
    textoExito.textContent = mensaje;
    exitoPin.style.display = 'block';
    setTimeout(() => {
        exitoPin.style.display = 'none';
    }, 3000);
}

// Validación del PIN (solo números, 6 dígitos)
inputPin.addEventListener('input', function() {
    ocultarError(errorPin);
    ocultarErrorPin();
    
    // Solo permitir números
    this.value = this.value.replace(/[^0-9]/g, '');
    
    if (this.value.length > 6) {
        this.value = this.value.slice(0, 6);
    }
});

// Manejo del formulario de verificación PIN
formularioPin.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Limpiar errores previos
    ocultarError(errorPin);
    ocultarErrorPin();
    
    const pin = inputPin.value.trim();
    const userEmail = sessionStorage.getItem('userEmail');
    const loginToken = sessionStorage.getItem('loginToken');
    
    // Validaciones
    if (!pin) {
        mostrarError(errorPin, 'El código PIN es requerido');
        return;
    }
    
    if (pin.length !== 6) {
        mostrarError(errorPin, 'El código PIN debe tener 6 dígitos');
        return;
    }
    
    if (!/^\d{6}$/.test(pin)) {
        mostrarError(errorPin, 'El código PIN solo debe contener números');
        return;
    }
    
    // Deshabilitar el botón mientras se procesa
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Verificando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${URL_BASE_API}/auth/verify-pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginToken}`
            },
            body: JSON.stringify({ email: userEmail, pin })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Guardar token de sesión completa
            sessionStorage.setItem('sessionToken', data.sessionToken);
            sessionStorage.setItem('userName', data.user.name);
            
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        } else {
            mostrarErrorPin(data.message || 'Código PIN incorrecto. Verifique e intente nuevamente.');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarErrorPin('Error de conexión con el servidor. Intente nuevamente.');
    } finally {
        // Restaurar el botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Reenviar PIN
botonReenviarPin.addEventListener('click', async function() {
    const userEmail = sessionStorage.getItem('userEmail');
    const loginToken = sessionStorage.getItem('loginToken');
    
    if (!userEmail || !loginToken) {
        window.location.href = 'index.html';
        return;
    }
    
    // Deshabilitar el botón mientras se procesa
    const originalText = this.textContent;
    this.textContent = 'Enviando...';
    this.disabled = true;
    
    try {
        const response = await fetch(`${URL_BASE_API}/auth/resend-pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginToken}`
            },
            body: JSON.stringify({ email: userEmail })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarExito('PIN reenviado correctamente a tu correo electrónico');
        } else {
            mostrarErrorPin(data.message || 'Error al reenviar el PIN. Intente nuevamente.');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarErrorPin('Error de conexión con el servidor. Intente nuevamente.');
    } finally {
        // Restaurar el botón
        this.textContent = originalText;
        this.disabled = false;
    }
});

// Inicializar la página
window.addEventListener('load', function() {
    verificarAcceso();
});

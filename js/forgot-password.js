// ===============================================
//  Recuperación de contraseña (Frontend)
//  - Valida correo institucional
//  - Solicita enlace de recuperación a la API
// ===============================================

// URL base de la API
const URL_BASE_API = 'http://localhost:3000/api';

// Elementos del DOM
const formularioOlvido = document.getElementById('forgotPasswordForm');
const inputCorreo = document.getElementById('email');
const errorCorreo = document.getElementById('emailError');
const errorOlvido = document.getElementById('forgotError');
const exitoOlvido = document.getElementById('forgotSuccess');

// Valida que el correo pertenezca al dominio institucional
function validarCorreoInstitucional(correo) {
    const dominio = '@pascualbravo.edu.co';
    return correo.toLowerCase().endsWith(dominio.toLowerCase());
}

// Mostrar/ocultar mensajes de error y éxito
function mostrarError(elemento, mensaje) {
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
}

function ocultarError(elemento) {
    elemento.textContent = '';
    elemento.style.display = 'none';
}

function mostrarErrorOlvido(mensaje) {
    const textoError = errorOlvido.querySelector('.error-text');
    textoError.textContent = mensaje;
    errorOlvido.style.display = 'block';
    exitoOlvido.style.display = 'none';
}

function ocultarErrorOlvido() {
    errorOlvido.style.display = 'none';
}

function mostrarExito(mensaje) {
    const textoExito = exitoOlvido.querySelector('.success-text');
    textoExito.textContent = mensaje;
    exitoOlvido.style.display = 'block';
    errorOlvido.style.display = 'none';
}

// Validación en tiempo real
inputCorreo.addEventListener('input', function() {
    ocultarError(errorCorreo);
    ocultarErrorOlvido();
    
    if (this.value && !validarCorreoInstitucional(this.value)) {
        mostrarError(errorCorreo, 'Debe usar un correo del dominio @pascualbravo.edu.co');
    }
});

// Manejo del formulario de recuperación de contraseña
formularioOlvido.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Limpiar errores previos
    ocultarError(errorCorreo);
    ocultarErrorOlvido();
    exitoOlvido.style.display = 'none';
    
    const correo = inputCorreo.value.trim();
    
    // Validaciones
    if (!correo) {
        mostrarError(errorCorreo, 'El correo electrónico es requerido');
        return;
    }
    
    if (!validarCorreoInstitucional(correo)) {
        mostrarError(errorCorreo, 'Debe usar un correo del dominio @pascualbravo.edu.co');
        return;
    }
    
    // Deshabilitar el botón mientras se procesa
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${URL_BASE_API}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: correo })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarExito('Se ha enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y sigue las instrucciones.');
            inputCorreo.value = '';
        } else {
            mostrarErrorOlvido(data.message || 'Error al enviar el enlace de recuperación. Verifique que el correo esté registrado.');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarErrorOlvido('Error de conexión con el servidor. Intente nuevamente.');
    } finally {
        // Restaurar el botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Limpiar mensajes al cargar la página
window.addEventListener('load', function() {
    errorOlvido.style.display = 'none';
    exitoOlvido.style.display = 'none';
});

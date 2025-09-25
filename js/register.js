// js/register.js
// Registro de usuario: valida datos y llama a POST /api/register en el MISMO dominio (Render)

document.addEventListener('DOMContentLoaded', () => {
  // ----- Elementos del formulario (usa los ids que ya tienes) -----
  const form = document.getElementById('registerForm');
  const nameInput = document.getElementById('name');        // Nombre completo
  const emailInput = document.getElementById('email');      // Correo
  const passInput = document.getElementById('password');    // Contraseña

  // Cajas de mensajes (opcionales, si no existen se usa alert)
  const errorBox = document.getElementById('registerError');       // <div id="registerError">...</div>
  const successBox = document.getElementById('registerSuccess');   // <div id="registerSuccess">...</div>

  // Helpers para mostrar/ocultar mensajes
  function show(el, msg) {
    if (!el) return alert(msg);
    el.textContent = msg;
    el.style.display = 'block';
  }
  function hide(el) {
    if (el) el.style.display = 'none';
  }
  function showError(msg) {
    hide(successBox);
    show(errorBox, msg);
  }
  function showOk(msg) {
    hide(errorBox);
    show(successBox, msg);
  }

  // Validación simple
  function isInstitutionalEmail(mail) {
    // Permite @pascualbravo.edu.co; quita esta validación si quieres permitir cualquiera
    return /@pascualbravo\.edu\.co$/i.test(mail);
  }

  if (!form) return; // si no encuentra el form, no hace nada

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hide(errorBox);
    hide(successBox);

    const full_name = (nameInput?.value || '').trim();
    const email = (emailInput?.value || '').trim();
    const password = passInput?.value || '';

    // Validaciones mínimas
    if (full_name.length < 2) return showError('Ingresa tu nombre completo.');
    if (!email) return showError('Ingresa tu correo.');
    if (!isInstitutionalEmail(email)) return showError('Debe ser correo institucional @pascualbravo.edu.co');
    if (password.length < 8) return showError('La contraseña debe tener al menos 8 caracteres.');

    try {
      // IMPORTANTE: misma URL de tu servidor (Render). No uses http://localhost...
      const resp = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password })
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) {
        return showError(data.msg || 'No se pudo registrar. Intenta de nuevo.');
      }

      showOk('¡Registro exitoso! Te llevamos al inicio de sesión…');
      setTimeout(() => { window.location.href = '/'; }, 1200);
    } catch (err) {
      console.error(err);
      showError('Error de conexión con el servidor.');
    }
  });
});

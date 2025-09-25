// js/register.js
// Registro de usuario: valida datos y envía POST /api/register al backend en Render

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del formulario
  const form = document.getElementById('registerForm');
  const nameInput = document.getElementById('name');        // input nombre
  const emailInput = document.getElementById('email');      // input correo
  const passInput = document.getElementById('password');    // input contraseña

  // Cajas de mensajes (si no existen, usa alert)
  const errorBox = document.getElementById('registerError');       // <div id="registerError">
  const successBox = document.getElementById('registerSuccess');   // <div id="registerSuccess">

  // Funciones helpers
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

  // Validación de correo institucional
  function isInstitutionalEmail(mail) {
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

// js/login.js
// Maneja el formulario de login y llama al backend en /api/login

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passInput = document.getElementById('password');

  const errorBox = document.getElementById('loginError');     // <div id="loginError">
  const successBox = document.getElementById('loginSuccess'); // <div id="loginSuccess">

  // Helpers UI
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

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hide(errorBox);
    hide(successBox);

    const email = (emailInput?.value || '').trim();
    const password = passInput?.value || '';

    if (!email || !password) {
      return showError('Debes completar ambos campos.');
    }

    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) {
        return showError(data.msg || 'Credenciales incorrectas.');
      }

      // Guardar datos mínimos de sesión para el dashboard
      sessionStorage.setItem('userName', data.user.name);
      sessionStorage.setItem('userEmail', data.user.email);
      sessionStorage.setItem('loginToken', 'true'); // compat con guardias antiguos

      showOk('¡Bienvenido, ' + data.user.name + '!');
      setTimeout(() => { window.location.href = '/dashboard'; }, 900);
    } catch (err) {
      console.error(err);
      showError('Error de conexión con el servidor.');
    }
  });
});

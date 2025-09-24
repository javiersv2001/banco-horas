// Registro de usuario - Frontend
// Valida datos y llama a POST /api/auth/register

const URL_BASE_API = 'http://localhost:3000/api/auth';

const form = document.getElementById('registerForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const errBox = document.getElementById('registerError');
const errText = errBox?.querySelector('.error-text');
const okBox = document.getElementById('registerSuccess');

function mostrarError(msg) {
  errText.textContent = msg;
  errBox.style.display = 'block';
  okBox.style.display = 'none';
}

function mostrarOk(msg) {
  okBox.querySelector('.success-text').textContent = msg;
  okBox.style.display = 'block';
  errBox.style.display = 'none';
}

function validarCorreoInstitucional(correo) {
  return /@pascualbravo\.edu\.co$/i.test(correo);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passInput.value;

  if (name.length < 2) return mostrarError('Nombre inválido');
  if (!validarCorreoInstitucional(email)) return mostrarError('Debe usar su correo institucional @pascualbravo.edu.co');
  if (password.length < 8) return mostrarError('La contraseña debe tener al menos 8 caracteres');

  try {
    const res = await fetch(`${URL_BASE_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) return mostrarError(data.message || 'No se pudo registrar');
    mostrarOk('Registro exitoso. Ahora puedes iniciar sesión.');
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  } catch (err) {
    mostrarError('Error de conexión');
  }
});

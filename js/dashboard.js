// js/dashboard.js
// Protege el dashboard y pinta datos del usuario guardados en sessionStorage

document.addEventListener('DOMContentLoaded', () => {
  // Guard simple de sesión: si no hay userEmail, vuelve al login
  const userEmail = sessionStorage.getItem('userEmail');
  const userName  = sessionStorage.getItem('userName');

  if (!userEmail) {
    // No hay sesión -> volver al login
    window.location.href = '/';
    return;
  }

  // Pinta nombre/correo en la UI
  const welcomeEl = document.getElementById('userWelcome');
  const nameEl    = document.getElementById('userNameSpan');
  const emailEl   = document.getElementById('userEmailSpan');

  if (welcomeEl) welcomeEl.textContent = `Hola, ${userName || userEmail}`;
  if (nameEl)    nameEl.textContent    = userName || '—';
  if (emailEl)   emailEl.textContent   = userEmail || '—';

  // Botón de cerrar sesión
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.clear();
      window.location.href = '/';
    });
  }
});

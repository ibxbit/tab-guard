// src/content/overlay.js

(function () {
  // Prevent multiple overlays
  if (document.getElementById('tab-guard-overlay')) return;

  // Create the overlay container
  const overlay = document.createElement('div');
  overlay.id = 'tab-guard-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  overlay.style.color = '#fff';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '999999';
  overlay.style.fontFamily = 'Poppins, sans-serif';
  overlay.style.fontSize = '2rem';
  overlay.style.textAlign = 'center';

  // Add the message
  overlay.innerHTML = `
    <div>
      <p style="margin: 0;">🚫 Stay focused!</p>
      <p style="margin: 0;">You can access this site after your focus session ends.</p>
    </div>
  `;

  // Append the overlay to the body
  document.body.appendChild(overlay);
})();

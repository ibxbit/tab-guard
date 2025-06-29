import { getCustomBlockedMessage, getTheme } from '../src/utils/storage.js';

const logo = document.getElementById('logo');
const message = document.getElementById('message');

let x = 100;
let y = 100;
let dx = 1;
let dy = 1;

const colors = ["#1abc9c", "#e84393", "#f1c40f", "#8e44ad", "#2ecc71", "#e74c3c"];
let currentColorIndex = 0;

function changeBackgroundColor() {
  currentColorIndex = (currentColorIndex + 1) % colors.length;
  document.body.style.backgroundColor = colors[currentColorIndex];
}

// Animate the text on bounce
function bounceText() {
  message.classList.remove("bounce");
  // Force reflow to restart animation
  void message.offsetWidth;
  message.classList.add("bounce");
}

function update() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  x += dx;
  y += dy;

  const hitHorizontal = x + logo.clientWidth >= w || x <= 0;
  const hitVertical = y + logo.clientHeight >= h || y <= 0;

  if (hitHorizontal) dx *= -1;
  if (hitVertical) dy *= -1;

  if (hitHorizontal || hitVertical) {
    changeBackgroundColor();
    bounceText();
  }

  logo.style.left = `${x}px`;
  logo.style.top = `${y}px`;

  requestAnimationFrame(update);
}

// Add bounce animation class
const style = document.createElement('style');
style.innerHTML = `
  .bounce {
    animation: bouncePop 0.6s ease;
  }
`;
document.head.appendChild(style);

// Initialize blocked page
async function initializeBlockedPage() {
  try {
    // Load custom message
    const customMessage = await getCustomBlockedMessage();
    updateMessage(customMessage);
    
    // Apply theme
    const theme = await getTheme();
    applyTheme(theme);
    
    // Add click event to logo for fun
    if (logo) {
      logo.addEventListener('click', () => {
        logo.style.transform = 'scale(1.2) rotate(360deg)';
        setTimeout(() => {
          logo.style.transform = '';
        }, 500);
      });
    }
  } catch (error) {
    console.error('Error initializing blocked page:', error);
  }
}

// Update the message with custom text
function updateMessage(message) {
  if (!message) return;
  
  // Clear existing content
  message.innerHTML = '';
  
  // Split message into individual characters and wrap in spans
  const characters = message.split('');
  characters.forEach(char => {
    const span = document.createElement('span');
    span.textContent = char;
    message.appendChild(span);
  });
}

// Apply theme to the page
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeBlockedPage);

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.customBlockedMessage) {
      updateMessage(changes.customBlockedMessage.newValue);
    }
    if (changes.theme) {
      applyTheme(changes.theme.newValue);
    }
  }
});

update();

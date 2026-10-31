// ============================================================
// TOAST GLOBAL
// ============================================================

function showToast(msg, color = '#10b981') {
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `
      @keyframes fadeInOut {
        0%   { opacity: 0; transform: translateY(10px); }
        15%  { opacity: 1; transform: translateY(0); }
        75%  { opacity: 1; }
        100% { opacity: 0; transform: translateY(-10px); }
      }`;
    document.head.appendChild(style);
  }
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:${color}; color:white; padding:12px 20px;
    border-radius:8px; font-size:14px; font-weight:500;
    box-shadow:0 4px 12px rgba(0,0,0,0.15);
    animation: fadeInOut 3.5s ease forwards;`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}

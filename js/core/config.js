// ============================================================
// CONFIGURACIÓN DE SUPABASE
// ============================================================

const yJ = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXB";
const Ym = "hYmFzZSIsInJlZiI6InlvaHljanpwamZpeWRzemJsYXZuIiwicm9";
const ZS = "sZSI6ImFub24iLCJpYXQiOjE3NzI0ODU5MDksImV4cCI6MjA4ODA";
const MT = "2MTkwOX0.0M-kAb3rh8Qhr6DxiYW29KrBtvaxI8spOZpADW45a0k";

// ==================== SUPABASE CONFIG (editar aquí) ====================
window._SUPA_URL    = 'https://yohycjzpjfiydszblavn.supabase.co';
window._SUPA_KEY    = yJ + Ym + ZS + MT;
window._SUPA_BUCKET = 'ods-imagenes';
// Corrección para Secret
//    window._SUPA_URL    = "${{ secrets.SUPA_URL }}";
//    window._SUPA_KEY    = "${{ secrets.SUPA_KEY }}";
//    window._SUPA_BUCKET = "${{ secrets.SUPA_BUCKET }}";
// ======================================================================

// Validación temprana de credenciales
(function checkCreds() {
  const missing = [];
  if (!window._SUPA_URL || window._SUPA_URL.includes('TU_PROYECTO')) missing.push('SUPABASE_URL');
  if (!window._SUPA_KEY || window._SUPA_KEY === 'TU_ANON_KEY')       missing.push('SUPABASE_KEY');
  if (missing.length) {
    console.warn('⚠️ Conexión a la Nube no configurado. Edita las líneas _SUPA_URL y _SUPA_KEY en el script. Faltan:', missing.join(', '));
  }
})();

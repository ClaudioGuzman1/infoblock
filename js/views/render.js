// ============================================================
// RENDER principal
// ============================================================

function render() {
  const root = document.getElementById('root');
  if (appState.view === 'list') {
    root.innerHTML = renderListView();
  } else if (appState.view === 'supabase') {
    root.innerHTML = renderSupabaseView();
  } else {
    root.innerHTML = renderFormView();
  }
}

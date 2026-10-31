// ============================================================
// ESTADO DE LA APLICACIÓN
// ============================================================

class AppState {
  constructor() {
    this.view = 'list';
    this.orders = [];
    this.currentOrder = null;
    this.search = '';
    this.tab = 'general';
    this.listeners = [];
    // Supabase cloud view state
    this.cloudOrders = [];
    this.cloudSearch = '';
    this.cloudLoading = false;
    this.cloudPage = 0;
    this.cloudPageSize = 150;
    this.cloudTotal = 0;
    // ID del registro de Supabase que se está editando (null = nuevo local)
    this.cloudEditId = null;
  }
  setState(newState) {
    Object.assign(this, newState);
    this.notify();
  }
  subscribe(listener) {
    this.listeners.push(listener);
  }
  notify() {
    this.listeners.forEach(listener => listener());
  }
}
const appState = new AppState();

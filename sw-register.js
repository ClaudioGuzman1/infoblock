// ============================================================
// REGISTRO DEL SERVICE WORKER - Soy IDC
// Compatible con GitHub Pages y dominio raíz
// ============================================================

(() => {
    if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Este navegador no soporta Service Workers');
        return;
    }

    window.addEventListener('load', async () => {
        try {
            // Obtiene automáticamente la carpeta donde está index.html
            const basePath = new URL('./', window.location.href).pathname;

            // Service Worker ubicado en la misma carpeta
            const swPath = `${basePath}service-worker.js`;

            const registration = await navigator.serviceWorker.register(
                swPath,
                {
                    scope: basePath
                }
            );

            console.log('✅ Service Worker registrado');
            console.log('📁 Base:', basePath);
            console.log('📄 SW:', swPath);
            console.log('🎯 Scope:', registration.scope);

            // Comprobar actualizaciones periódicamente
            setInterval(() => {
                registration.update().catch(err => {
                    console.warn('⚠️ Error actualizando Service Worker:', err);
                });
            }, 60 * 60 * 1000);

        } catch (error) {
            // IMPORTANTE:
            // Un error del Service Worker NO debe impedir que
            // la aplicación continúe funcionando normalmente.
            console.warn('⚠️ No se pudo registrar el Service Worker:', error);
        }
    });
})();

// --- ESCUDO DE INICIALIZAÇÃO DO MOTOR MODULAR ---

window.initApplication = function() {
    console.log("Iniciando acoplamento dos controladores modulares...");

    // 1. Garantir vinculação do botão de login do professor
    try {
        var authBtn = document.querySelector('[onclick="window.openProfLogin()"]');
        if (authBtn) {
            console.log("Gatilho HTML interceptado para validação física.");
        }
    } catch (e) {
        console.warn("Aviso na checagem de nós DOM estáticos:", e);
    }

    // 2. Acoplar sistema drag and drop de hologramas
    try {
        var holo = window.el('draggable-hologram');
        var header = window.el('drag-header');
        if (holo && header && typeof window.makeDraggable === 'function') {
            window.makeDraggable(holo, header);
        }
    } catch (e) {
        console.error("Falha ao inicializar subsistema arrastável:", e);
    }

    // 3. Inicializar dados persistentes locais do storage de forma segura
    try {
        if (typeof window.initTurmasData === 'function') {
            window.initTurmasData();
        } else {
            window.allTurmas = window.readJSONKey(window.STORAGE_KEYS.classes, []);
        }
    } catch (e) {
        console.error("Erro crítico na leitura do LocalStorage para Turmas:", e);
    }

    // 4. Interceptar sincronizações via Query URL (?sync=) externos
    try {
        var urlParams = new URLSearchParams(window.location.search);
        var syncData = urlParams.get('sync');
        var mutantData = urlParams.get('mutant');
        
        if (syncData && typeof window.handleUrlSync === 'function') {
            window.handleUrlSync(syncData);
        }
        if (mutantData && typeof window.handleMutantPayload === 'function') {
            window.handleMutantPayload(mutantData);
        }
    } catch (e) {
        console.error("Falha ao processar telemetria externa vinda da URL:", e);
    }

    // 5. Verificação de Consentimento LGPD
    try {
        var lgpdAccepted = localStorage.getItem(window.STORAGE_KEYS.lgpd);
        if (!lgpdAccepted) {
            var modalLgpd = window.el('modal-lgpd');
            if (modalLgpd) {
                modalLgpd.classList.remove('hidden');
                modalLgpd.classList.add('flex');
            }
        }
    } catch (e) {
        console.error("Falha de barreira regulatória da LGPD local:", e);
    }
};

// --- FUNÇÕES COMPLEMENTARES DE INFRAESTRUTURA SEGUIDAS À RISCA ---
window.authProf = function() {
    var pinField = window.el('prof-pin-input');
    var errLabel = window.el('login-error');
    if (!pinField) return;

    if (pinField.value === '1234') {
        if (errLabel) errLabel.classList.add('hidden');
        window.closeProfLogin();
        window.enterProfDashboard();
    } else {
        if (errLabel) errLabel.classList.remove('hidden');
        pinField.value = '';
        pinField.focus();
    }
};

window.logoutProf = function() {
    window.goBackToHome();
};

// --- ACIONAMENTO DO DOMLOADED REFORÇADO ---
if (document.readyState === "complete" || document.readyState === "interactive") {
    window.initApplication();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        window.initApplication();
    });
}
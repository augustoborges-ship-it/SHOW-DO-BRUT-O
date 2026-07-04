// --- ESCUDO DE INICIALIZAÇÃO DO MOTOR MODULAR (SISTEMA DE AUTO-CURA) ---

window.initApplication = function() {
    console.log("Iniciando Acoplamento de Segurança Máxima AAA+...");

    // 1. BLINDAGEM MÁXIMA DOS BOTÕES PRINCIPAIS (Ignora o HTML se estiver quebrado)
    try {
        // Localiza o Card do Educador visualmente, ignorando bugs de código
        var profCard = document.querySelector('[onclick*="openProfLogin"]') || 
                       Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Educador'))?.parentElement;
        
        if (profCard) {
            profCard.removeAttribute('onclick'); // Desativa qualquer chamada HTML quebrada
            
            profCard.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log("Interceptador: Card Educador Clicado.");
                
                var modal = document.getElementById('modal-prof-login');
                
                // AUTO-CURA: Se o modal não existir no HTML, o JS cria na hora!
                if (!modal) {
                    console.warn("Auto-Cura: Modal PRO ausente. Injetando via JavaScript na força bruta.");
                    modal = document.createElement('div');
                    modal.id = 'modal-prof-login';
                    modal.className = 'fixed inset-0 z-[99999] flex bg-black/90 backdrop-blur-xl flex-col items-center justify-center p-4';
                    modal.innerHTML = `
                        <div class="bg-gradient-to-b from-gray-900 to-black border-2 border-purple-500 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(168,85,247,0.4)] relative">
                            <button onclick="document.getElementById('modal-prof-login').classList.add('hidden'); document.getElementById('modal-prof-login').classList.remove('flex');" class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                            <div class="w-20 h-20 bg-purple-900/50 border border-purple-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">🔒</div>
                            <h2 class="text-2xl font-black text-white font-orbitron tracking-wider mb-2 uppercase">Acesso Restrito</h2>
                            <p class="text-purple-200/70 text-sm font-montserrat mb-8">Insira o PIN do Educador. (Padrão: 1234)</p>
                            <input type="password" id="prof-pin-input" placeholder="****" maxlength="4" class="w-full text-center text-3xl font-black tracking-widest bg-black/50 border-2 border-purple-500/50 rounded-xl p-4 text-white focus:border-purple-400 focus:outline-none mb-6">
                            <div id="login-error" class="hidden text-red-400 text-sm font-bold mb-4 animate-pulse">PIN Incorreto!</div>
                            <button id="btn-unlock-pro-js" class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all uppercase tracking-widest">Desbloquear</button>
                        </div>
                    `;
                    document.body.appendChild(modal);
                    document.getElementById('btn-unlock-pro-js').addEventListener('click', window.authProf);
                } else {
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                    var pinInput = document.getElementById('prof-pin-input');
                    var errLabel = document.getElementById('login-error');
                    if (pinInput) pinInput.value = '';
                    if (errLabel) errLabel.classList.add('hidden');
                }
            });
        }

        // Localiza o Card do Modo Aluno e faz a mesma blindagem
        var alunoCard = document.querySelector('[onclick*="openStudentSetup"]') || 
                        Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Modo Aluno'))?.parentElement;
        
        if (alunoCard) {
            alunoCard.removeAttribute('onclick');
            alunoCard.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.openStudentSetup === 'function') {
                    window.openStudentSetup();
                } else if (typeof openStudentSetup === 'function') {
                    openStudentSetup();
                }
            });
        }
    } catch (e) {
        console.error("Falha na blindagem dos botões principais:", e);
    }

    // 2. Acoplar Hologramas e Utilitários
    try {
        var holo = document.getElementById('draggable-hologram');
        var header = document.getElementById('drag-header');
        if (holo && header && (typeof window.makeDraggable === 'function' || typeof makeDraggable === 'function')) {
            var dragFn = window.makeDraggable || makeDraggable;
            dragFn(holo, header);
        }
    } catch (e) {}

    // 3. Inicializar Motor de Turmas
    try {
        if (typeof window.initTurmasData === 'function') window.initTurmasData();
        else if (typeof initTurmasData === 'function') initTurmasData();
    } catch (e) {}
};

// --- FUNÇÕES DE SEGURANÇA E NAVEGAÇÃO ---
window.authProf = function() {
    var pinField = document.getElementById('prof-pin-input');
    var errLabel = document.getElementById('login-error');
    if (!pinField) return;

    if (pinField.value === '1234') {
        if (errLabel) errLabel.classList.add('hidden');
        var modal = document.getElementById('modal-prof-login');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        window.checkLGPDFirst();
    } else {
        if (errLabel) errLabel.classList.remove('hidden');
        pinField.value = '';
        pinField.focus();
    }
};

window.checkLGPDFirst = function() {
    var lgpdKey = (window.STORAGE_KEYS && window.STORAGE_KEYS.lgpd) ? window.STORAGE_KEYS.lgpd : 'brutao_lgpd_accepted';
    var accepted = false;
    try { accepted = localStorage.getItem(lgpdKey); } catch(e){}
    
    if (accepted) {
        window.forcaEntradaDashboard();
    } else {
        var modalLgpd = document.getElementById('modal-lgpd');
        // Auto-cura do modal LGPD caso tenha sido apagado
        if (!modalLgpd) {
            console.warn("Auto-Cura: Modal LGPD injetado via JavaScript.");
            modalLgpd = document.createElement('div');
            modalLgpd.id = 'modal-lgpd';
            modalLgpd.className = 'fixed inset-0 z-[99999] flex bg-black/95 backdrop-blur-xl flex-col items-center justify-center p-4';
            modalLgpd.innerHTML = `
                <div class="bg-gradient-to-b from-slate-900 to-black border-2 border-indigo-500 rounded-3xl p-8 max-w-xl w-full shadow-[0_0_50px_rgba(99,102,241,0.4)] relative">
                    <div class="w-16 h-16 bg-indigo-900/50 border border-indigo-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">⚖️</div>
                    <h2 class="text-2xl font-black text-white font-orbitron text-center uppercase tracking-widest mb-4">Termo de Privacidade (LGPD)</h2>
                    <div class="bg-black/50 border border-white/10 rounded-xl p-5 mb-6 text-sm text-gray-300 font-montserrat text-left">
                        <p class="mb-3">Os dados do Game Show são armazenados <strong>localmente neste dispositivo</strong>.</p>
                        <p>Ao inserir métricas de alunos, você atua como Controlador de dados.</p>
                    </div>
                    <div class="flex gap-4">
                        <button id="btn-lgpd-recusar" class="w-1/3 bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-700">Sair</button>
                        <button id="btn-lgpd-aceitar" class="w-2/3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black py-3 rounded-xl hover:scale-105 transition-transform">Concordar e Entrar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modalLgpd);
            
            document.getElementById('btn-lgpd-aceitar').addEventListener('click', function() {
                try { localStorage.setItem(lgpdKey, 'true'); } catch(e){}
                modalLgpd.classList.add('hidden'); modalLgpd.classList.remove('flex');
                window.forcaEntradaDashboard();
            });
            
            document.getElementById('btn-lgpd-recusar').addEventListener('click', function() {
                modalLgpd.classList.add('hidden'); modalLgpd.classList.remove('flex');
            });
        } else {
            modalLgpd.classList.remove('hidden');
            modalLgpd.classList.add('flex');
        }
    }
};

window.forcaEntradaDashboard = function() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); 
    var painel = document.getElementById('screen-prof-dashboard');
    if (painel) {
        painel.classList.add('active');
        if (typeof window.checkReportsInbox === 'function') window.checkReportsInbox();
        else if (typeof checkReportsInbox === 'function') checkReportsInbox();
    } else {
        alert("ERRO GRAVE: A tela do Painel PRO não existe no seu arquivo HTML! Revise o seu código index.html.");
    }
};

// --- ACIONAMENTO DO MOTOR COM ATRASO DE SEGURANÇA ---
if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(window.initApplication, 300);
} else {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(window.initApplication, 300);
    });
}
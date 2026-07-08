// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Eventos de inicialização, DOMContentLoaded e Conexão UI -> Motor
// =========================================================================

/* STREAMING_CHUNK:Configurando escopo global e variáveis blindadas... */
window.PIN_ACESSO_PRO = "1234";
window.dificuldadeModoTreino = "fácil";
window.bancoOriginal = [];

/* STREAMING_CHUNK:Declarando função global de Acesso PRO... */
window.authProf = function(e) {
    if(e) e.preventDefault();
    var inputSenha = document.getElementById('prof-pin-input') || document.querySelector('#modal-prof-login input');
    
    if (!inputSenha) {
        var modais = document.querySelectorAll('.fixed');
        for(var i=0; i<modais.length; i++) {
            if(modais[i].innerText.indexOf('ACESSO RESTRITO') !== -1 || modais[i].innerText.indexOf('PIN') !== -1) {
                inputSenha = modais[i].querySelector('input');
                break;
            }
        }
    }
    
    if (inputSenha && inputSenha.value === window.PIN_ACESSO_PRO) {
        inputSenha.value = "";
        var modal = inputSenha.closest('.fixed');
        if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
        if (typeof window.enterProfDashboard === 'function') window.enterProfDashboard();
    } else if (inputSenha) {
        inputSenha.classList.add('border-red-500', 'animate-pulse');
        setTimeout(function() { inputSenha.classList.remove('border-red-500', 'animate-pulse'); }, 1000);
    }
};

/* STREAMING_CHUNK:Declarando função global de Níveis de Treino... */
window.setDificuldadeTreino = function(nivel, btnElement) {
    window.dificuldadeModoTreino = String(nivel).toLowerCase();
    if(btnElement) {
        var container = btnElement.parentElement;
        if(container) {
            var irmaos = container.querySelectorAll('button');
            for(var i=0; i<irmaos.length; i++) {
                irmaos[i].classList.remove('bg-blue-600', 'border-blue-400', 'bg-green-600');
                irmaos[i].classList.add('bg-transparent', 'border-gray-600');
            }
        }
        btnElement.classList.remove('bg-transparent', 'border-gray-600');
        btnElement.classList.add('bg-blue-600', 'border-blue-400');
    }
};

/* STREAMING_CHUNK:Processando e validando banco de dados JSON... */
window.initTurmasData = function() { 
    if(typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) {
        window.allTurmas = window.readJSONKey(window.STORAGE_KEYS.classes, []); 
    }
};

window.initGameData = function() {
    console.log("[Core-Init] Mapeando Banco Global e Customizado...");

    const mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null;
    const mutantData = window.__MUTANT || mHash;
    if (mutantData) {
        try { 
            const p = JSON.parse(decodeURIComponent(escape(atob(mutantData)))); 
            window.CURRENT_MISSION_ID = p.missionId; 
            window.MUTANT_MODE = p.mode; 
            window.allQuestions = p.questions; 
            return; 
        } catch(e){}
    }

    try {
        window.initTurmasData();

        var rawBank = window.BANCO_BRUTAO_GLOBAL;
        
        if (!rawBank || !Array.isArray(rawBank) || rawBank.length === 0) {
            console.warn("[Core-Init] ALERTA: window.BANCO_BRUTAO_GLOBAL está vazio ou não foi carregado. Verifique se o arquivo motor_do_banco_de_questoes.js está correto.");
            window.allQuestions = [];
            return;
        }

        const globalQuestionsParsed = rawBank.map((q, index) => { 
            let anoSeguro = String(q.ano || 'Geral');
            if (anoSeguro !== 'Geral' && !anoSeguro.toLowerCase().includes('ano')) {
                anoSeguro += 'º Ano';
            }

            let altA = "", altB = "", altC = "", altD = "";
            if (Array.isArray(q.alternativas)) {
                altA = String(q.alternativas[0] || ""); altB = String(q.alternativas[1] || "");
                altC = String(q.alternativas[2] || ""); altD = String(q.alternativas[3] || "");
            } else if (q.alternativas && typeof q.alternativas === 'object') {
                altA = String(q.alternativas.A || q.alternativas.a || ""); altB = String(q.alternativas.B || q.alternativas.b || "");
                altC = String(q.alternativas.C || q.alternativas.c || ""); altD = String(q.alternativas.D || q.alternativas.d || "");
            }

            let ansIdx = 0;
            if (q.correta !== undefined && q.correta !== null) ansIdx = parseInt(q.correta);
            else if (q.gabarito_letra) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[String(q.gabarito_letra).toUpperCase()] || 0;
            else if (q.resposta_correta) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[String(q.resposta_correta).toUpperCase()] || 0;

            let comp = String(q.disciplina || q.componente || 'Geral');
            let prof = String(q.nivel || q.nivel_proficiencia || q.grau_interno || 'Básico');

            return { 
                id: String(q.id || `GLOBAL_${index}`), 
                text: String(q.pergunta || q.enunciado || "Sem enunciado"), 
                category: `${comp} • ${anoSeguro} • Proficiência: ${prof}`, 
                componente: comp.toLowerCase(), 
                ano: anoSeguro.toLowerCase(), 
                proficiencia: prof.toLowerCase(), 
                options: [altA, altB, altC, altD], 
                answer: ansIdx, 
                explicacao: String(q.justificativa_gabarito || q.explicacao || q.feedback_correto || ""), 
                image_url: q.imagem || q.image_url || null, 
                bncc: String(q.habilidade_bncc_codigo_referencial || q.bncc || "N/A"), 
                isCustom: false 
            }; 
        });

        var customQuestions = [];
        if (typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) {
            customQuestions = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []);
        }

        window.allQuestions = globalQuestionsParsed.concat(customQuestions);
        console.log(`[Core-Init] SUCESSO! ${window.allQuestions.length} questões injetadas em RAM.`);

    } catch (e) {
        console.error("[Core-Init] Falha fatal:", e);
    }
};

/* STREAMING_CHUNK:Aplicando Event Delegation... */
document.addEventListener("DOMContentLoaded", function() {
    console.log("[Core-DOM] Módulo Blindado carregado.");
    if (typeof window.initGameData === 'function') window.initGameData();

    // Event Delegation de Segurança para os botões do Modo Treino e PIN
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        var txt = btn.innerText ? btn.innerText.trim().toUpperCase() : "";

        // Fallback global caso os botões não possuam atributo 'onclick' nativo no HTML
        if (txt === "DESBLOQUEAR" && typeof window.authProf === 'function' && !btn.hasAttribute('onclick')) {
            window.authProf(e);
        } else if ((txt === "FÁCIL" || txt === "MÉDIO" || txt === "DIFÍCIL") && typeof window.setDificuldadeTreino === 'function' && !btn.hasAttribute('onclick')) {
            e.preventDefault();
            window.setDificuldadeTreino(txt, btn);
        } else if (txt === "JOGAR AGORA" && typeof window.startStudentGame === 'function' && !btn.hasAttribute('onclick')) {
            e.preventDefault();
            window.startStudentGame();
        }
    });
});
// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Eventos de inicialização, DOMContentLoaded e Conexão UI -> Motor
// =========================================================================

console.log("🚀 [SISTEMA] inicializa_o_e_controladores_principais.js carregado com sucesso.");

/* STREAMING_CHUNK:Configurando escopo global e variáveis... */
window.PIN_ACESSO_PRO = "1234";
window.dificuldadeModoTreino = "fácil";

/* STREAMING_CHUNK:Acesso PRO Indestrutível... */
window.authProf = function(e) {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    var inputSenha = document.getElementById('prof-pin-input') || document.querySelector('#modal-prof-login input');
    
    if (!inputSenha) {
        var modais = document.querySelectorAll('.fixed');
        for(var i=0; i<modais.length; i++) {
            if(modais[i].innerText.indexOf('ACESSO RESTRITO') !== -1 || modais[i].innerText.indexOf('PIN') !== -1) {
                inputSenha = modais[i].querySelector('input'); break;
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

/* STREAMING_CHUNK:Conversor Universal do Banco de Questões... */
window.initGameData = function() {
    console.log("⚙️ [Core] Convertendo o Banco de 7MB para o Jogo...");
    try {
        if(typeof window.initTurmasData === 'function') window.initTurmasData();
        var rawBank = window.BANCO_BRUTAO_GLOBAL;
        
        if (!rawBank || !Array.isArray(rawBank) || rawBank.length === 0) {
            console.error("🚨 ERRO: O arquivo motor_do_banco_de_questoes.js não carregou ou está vazio.");
            return;
        }

        window.allQuestions = rawBank.map((q, index) => { 
            let anoSeguro = String(q.ano || 'Geral');
            if (anoSeguro !== 'Geral' && !anoSeguro.toLowerCase().includes('ano')) anoSeguro += 'º Ano';

            let altA = "", altB = "", altC = "", altD = "";
            if (Array.isArray(q.alternativas)) {
                altA = String(q.alternativas[0] || ""); altB = String(q.alternativas[1] || "");
                altC = String(q.alternativas[2] || ""); altD = String(q.alternativas[3] || "");
            } else if (q.alternativas && typeof q.alternativas === 'object') {
                altA = String(q.alternativas.A || q.alternativas.a || ""); altB = String(q.alternativas.B || q.alternativas.b || "");
                altC = String(q.alternativas.C || q.alternativas.c || ""); altD = String(q.alternativas.D || q.alternativas.d || "");
            }

            let ansIdx = 0;
            if (q.correta !== undefined && q.correta !== null) {
                ansIdx = parseInt(q.correta);
                if (isNaN(ansIdx)) ansIdx = 0;
            } else if (q.gabarito_letra) {
                ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[String(q.gabarito_letra).toUpperCase()] || 0;
            } else if (q.resposta_correta) {
                ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[String(q.resposta_correta).toUpperCase()] || 0;
            }

            let comp = String(q.disciplina || q.componente || 'Geral');
            let profRaw = String(q.nivel || q.nivel_proficiencia || q.grau_interno || 'Básico');
            let tagsRaw = Array.isArray(q.tags) ? q.tags.join(" ") : "";
            let profCompleta = (profRaw + " " + tagsRaw).toLowerCase();

            return { 
                id: String(q.id || `GLOBAL_${index}`), 
                text: String(q.pergunta || q.enunciado || "Sem enunciado"), 
                category: `${comp} • ${anoSeguro} • Proficiência: ${profRaw}`, 
                componente: comp.toLowerCase(), 
                ano: anoSeguro.toLowerCase(), 
                proficiencia: profCompleta, 
                options: [altA, altB, altC, altD], 
                answer: ansIdx, 
                explicacao: String(q.justificativa_gabarito || q.feedback_correto || ""), 
                image_url: q.imagem || q.image_url || null, 
                bncc: String(q.habilidade_bncc_codigo_referencial || "N/A"), 
                isCustom: false 
            }; 
        });

        var customQuestions = [];
        if (typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) {
            customQuestions = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []);
        }
        window.allQuestions = window.allQuestions.concat(customQuestions);
        console.log(`✅ [Core] SUCESSO: ${window.allQuestions.length} questões mapeadas e prontas para uso!`);
    } catch (e) {
        console.error("🚨 Falha fatal ao converter questões:", e);
    }
};

/* STREAMING_CHUNK:Gatilhos Globais de Prevenção de Erros de HTML... */
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        if (typeof window.initGameData === 'function') window.initGameData();
    }, 500); 

    document.addEventListener('click', function(e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        var txt = btn.innerText ? btn.innerText.trim().toUpperCase() : "";

        if (txt === "DESBLOQUEAR") {
            e.preventDefault(); e.stopPropagation();
            if(typeof window.authProf === 'function') window.authProf(e);
        } else if (txt === "FÁCIL" || txt === "MÉDIO" || txt === "DIFÍCIL") {
            e.preventDefault(); e.stopPropagation();
            window.dificuldadeModoTreino = txt.toLowerCase();
            var irmaos = btn.parentElement.querySelectorAll('button');
            for(var i=0; i<irmaos.length; i++) {
                irmaos[i].classList.remove('bg-blue-600', 'border-blue-400');
                irmaos[i].classList.add('bg-transparent', 'border-gray-600');
            }
            btn.classList.remove('bg-transparent', 'border-gray-600');
            btn.classList.add('bg-blue-600', 'border-blue-400');
        } else if (txt === "JOGAR AGORA" || txt === "INICIAR MISSÃO") {
            e.preventDefault(); e.stopPropagation();
            
            if(!window.allQuestions || window.allQuestions.length === 0) {
                if(typeof window.initGameData === 'function') window.initGameData();
            }

            var isStudentScreen = btn.closest('#screen-setup-student') || document.querySelector('#screen-setup-student.active') || document.querySelector('.screen.active');
            
            if (isStudentScreen) {
                if (typeof window.startStudentGame === 'function') window.startStudentGame();
                else alert("Erro: O arquivo logica_e_core_do_jogo.js não carregou. Recarregue a página.");
            } else {
                if (typeof window.startGame === 'function') window.startGame();
                else alert("Erro: O arquivo logica_e_core_do_jogo.js não carregou. Recarregue a página.");
            }
        }
    }, true);
});
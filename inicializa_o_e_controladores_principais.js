---

### ARQUIVO 2: A Ligação Impecável
Este arquivo faz a união do seu HTML com as lógicas. Ele escuta o PIN de forma segura, mapeia o Banco que carregamos acima e gerencia os Modais.

**Ação:** Substitua o conteúdo do arquivo `inicializa_o_e_controladores_principais.js` pelo código abaixo:

```javascript:inicializa_o_e_controladores_principais.js
// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Eventos de inicialização, Conversão do Banco e Acesso PRO
// =========================================================================

console.log("🚀 [Core] Inicializador e Controladores carregados.");

window.PIN_ACESSO_PRO = "1234";

// =====================================================
// 1. ACESSO PRO (BLINDADO)
// =====================================================
window.authProf = function(e) {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    var inputSenha = document.getElementById('prof-pin-input');
    
    // Fallback: Se o ID direto falhar, procura dentro dos modais
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
        var modal = inputSenha.closest('.fixed') || document.getElementById('modal-prof-login');
        if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
        
        // Verifica a LGPD (Termo de Privacidade)
        var lgpdKey = window.STORAGE_KEYS ? window.STORAGE_KEYS.lgpd : 'brutao_lgpd_accepted';
        if(!localStorage.getItem(lgpdKey)) {
             var lgpdModal = document.getElementById('modal-lgpd');
             if(lgpdModal) { lgpdModal.classList.remove('hidden'); lgpdModal.classList.add('flex'); }
        } else {
             // Entra no Painel do Professor
             document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
             var dash = document.getElementById('screen-prof-dashboard');
             if(dash) dash.classList.add('active');
             
             if(window.audioSystem && window.audioSystem.play) window.audioSystem.play('abertura');
             if (typeof window.checkReportsInbox === 'function') window.checkReportsInbox();
        }
    } else if (inputSenha) {
        // Erro visual (Animação de negação)
        inputSenha.classList.add('border-red-500', 'animate-pulse');
        setTimeout(function() { inputSenha.classList.remove('border-red-500', 'animate-pulse'); }, 1000);
    }
};

// =====================================================
// 2. CONVERSOR E LEITURA DO BANCO DE QUESTÕES (À PROVA DE BALAS)
// =====================================================
window.initGameData = function() {
    console.log("⚙️ [Core] Convertendo o Banco de Questões para a RAM...");
    
    // Suporte à Fábrica de Jogos (Verifica se está rodando uma Missão Exportada/Embed)
    var mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null;
    var mutantData = window.__MUTANT || mHash;
    
    if (mutantData) {
        try { 
            var p = JSON.parse(decodeURIComponent(escape(atob(mutantData)))); 
            window.CURRENT_MISSION_ID = p.missionId; 
            window.MUTANT_MODE = p.mode; 
            window.allQuestions = p.questions; 
            console.log("✅ [Core] Missão Mutante carregada:", p.missionId);
            return; 
        } catch(e) { console.error("Erro ao decodificar jogo exportado:", e); }
    }

    try {
        if(typeof window.initTurmasData === 'function') window.initTurmasData();
        var rawBank = window.BANCO_BRUTAO_GLOBAL;
        
        // Proteção: Se o arquivo externo não tiver carregado, injeta modo emergência
        if (!rawBank || !Array.isArray(rawBank) || rawBank.length === 0) {
            console.error("🚨 ERRO: Banco vazio ou erro de digitação no arquivo JSON externo.");
            rawBank = [{
                "id": "EMERGENCIA_F", "disciplina": "Matemática", "ano": "5º Ano", "nivel": "Básico",
                "pergunta": "O seu arquivo motor_do_banco_de_questoes.js tem um erro de digitação. Corrija o JSON. Quanto é 1+1?",
                "alternativas": ["1", "2", "3", "4"], "correta": 1, "justificativa_gabarito": "2."
            }];
            let tmp = []; for(let i=0; i<16; i++) tmp = tmp.concat(rawBank); rawBank = tmp;
        }

        // Traduz as variáveis do seu JSON para as variáveis do jogo
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
                ansIdx = parseInt(q.correta); if (isNaN(ansIdx)) ansIdx = 0;
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

        // Junta com as questões que o professor cria na própria plataforma
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

// 3. MONITORAMENTO DE CARREGAMENTO (Cão de Guarda do Cache)
// Aguarda o arquivo de 7MB carregar antes de iniciar o motor
window.watchdogBanco = setInterval(function() {
    if (window.BANCO_BRUTAO_GLOBAL && window.BANCO_BRUTAO_GLOBAL.length > 0) {
        clearInterval(window.watchdogBanco);
        window.initGameData();
    }
}, 300);

setTimeout(function() { clearInterval(window.watchdogBanco); }, 5000);

// =====================================================
// 3. EVENTOS GLOBAIS E CLIQUES
// =====================================================
document.addEventListener("DOMContentLoaded", function() {
    // Escuta a dificuldade no Modo Treino
    var diffRadios = document.querySelectorAll('input[name="student-diff"]');
    if(diffRadios.length > 0) {
        diffRadios.forEach(r => r.addEventListener('change', function(e) {
             window.dificuldadeModoTreino = e.target.value;
        }));
    }

    // Interceptador Otimizado (Event Delegation Limpo)
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('button') || e.target.closest('.cursor-pointer');
        if (!btn) return;
        var txt = btn.innerText ? btn.innerText.trim().toUpperCase() : "";

        if (txt.includes("ACESSO PRO") || txt.includes("EDUCADOR")) {
            e.preventDefault(); e.stopPropagation();
            if (typeof window.openProfLogin === 'function') window.openProfLogin();
        } 
        else if (txt.includes("JOGAR AGORA") || txt.includes("JOGAR")) {
            // Se estiver na tela principal e clicou no Modo Aluno, vai pra tela de setup
            if (btn.closest('#screen-home') || (!document.getElementById('screen-setup-student') || !document.getElementById('screen-setup-student').classList.contains('active'))) {
                e.preventDefault(); e.stopPropagation();
                if(typeof window.openStudentSetup === 'function') window.openStudentSetup();
                return;
            }

            e.preventDefault(); e.stopPropagation();
            var isStudentScreen = btn.closest('#screen-setup-student') || document.querySelector('#screen-setup-student.active');
            
            if (isStudentScreen) {
                if (typeof window.startStudentGame === 'function') window.startStudentGame();
            } else {
                if (typeof window.startGame === 'function') window.startGame();
            }
        }
    }, true);
});
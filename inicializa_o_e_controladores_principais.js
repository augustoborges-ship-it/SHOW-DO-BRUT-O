// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Inicialização, Mapeamento do Banco e Autenticação
// =========================================================================

console.log("🚀 [Motor] Inicializador ativado.");

window.PIN_ACESSO_PRO = "1234";

// 1. DESBLOQUEIO DO EDUCADOR
window.authProf = function() {
    var inputSenha = document.getElementById('prof-pin-input');
    if (!inputSenha) return;
    
    if (inputSenha.value === window.PIN_ACESSO_PRO) {
        inputSenha.value = "";
        var modal = document.getElementById('modal-prof-login');
        if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
        
        var lgpdKey = window.STORAGE_KEYS ? window.STORAGE_KEYS.lgpd : 'brutao_lgpd_accepted';
        if(!localStorage.getItem(lgpdKey)) {
             var lgpdModal = document.getElementById('modal-lgpd');
             if(lgpdModal) { lgpdModal.classList.remove('hidden'); lgpdModal.classList.add('flex'); }
        } else {
             document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
             var dash = document.getElementById('screen-prof-dashboard');
             if(dash) dash.classList.add('active');
             if(window.audioSystem && window.audioSystem.play) window.audioSystem.play('abertura');
             if (typeof window.checkReportsInbox === 'function') window.checkReportsInbox();
        }
    } else {
        var err = document.getElementById('login-error');
        if(err) {
            err.classList.remove('hidden');
            err.style.animation = 'none';
            setTimeout(function() { err.style.animation = ''; }, 10);
        }
    }
};

// 2. CONVERSOR DO BANCO DE QUESTÕES
window.initGameData = function() {
    try {
        if(typeof window.initTurmasData === 'function') window.initTurmasData();
        
        var mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null;
        if (mHash || window.__MUTANT) {
            var data = mHash || window.__MUTANT;
            try { 
                var p = JSON.parse(decodeURIComponent(escape(atob(data)))); 
                window.CURRENT_MISSION_ID = p.missionId; 
                window.allQuestions = p.questions; 
                console.log("✅ [Core] Missão Mutante carregada!"); return; 
            } catch(e) { }
        }

        var rawBank = window.BANCO_BRUTAO_GLOBAL || [];
        
        if (rawBank.length === 0) {
            console.warn("⚠️ Banco Vazio ou Falha no Carregamento. Injetando modo de segurança.");
            rawBank = [{
                "id": "EMERGENCIA_TOTAL", "disciplina": "Geral", "ano": "Geral", "nivel": "Básico",
                "pergunta": "O sistema detectou uma falha ao ler o arquivo 'motor_do_banco_de_questoes.js'. Verifique a formatação do JSON. Quanto é 2+2?",
                "alternativas": ["1", "2", "4", "8"], "correta": 2, "justificativa_gabarito": "Se viu isso, o sistema não travou na tela preta."
            }];
        }

        window.allQuestions = rawBank.map(function(q, index) { 
            let anoSeguro = String(q.ano || 'Geral').trim();
            if (anoSeguro !== 'Geral' && !anoSeguro.toLowerCase().includes('ano')) anoSeguro += 'º Ano';

            let altArray = ['', '', '', ''];
            if (Array.isArray(q.alternativas)) {
                altArray = [String(q.alternativas[0]||""), String(q.alternativas[1]||""), String(q.alternativas[2]||""), String(q.alternativas[3]||"")];
            } else if (q.alternativas && typeof q.alternativas === 'object') {
                altArray = [String(q.alternativas.A||q.alternativas.a||""), String(q.alternativas.B||q.alternativas.b||""), String(q.alternativas.C||q.alternativas.c||""), String(q.alternativas.D||q.alternativas.d||"")];
            }

            let ansIdx = 0;
            let resp = q.resposta_correta ?? q.gabarito_letra ?? q.gabarito ?? q.correta ?? 0;
            if (typeof resp === 'string') {
                let limpa = resp.trim().toUpperCase();
                let mapLetra = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                if (mapLetra[limpa] !== undefined) ansIdx = mapLetra[limpa];
                else { let n = parseInt(limpa, 10); if(!isNaN(n)) ansIdx = (n >= 0 && n <= 3) ? n : 0; }
            } else if (typeof resp === 'number') {
                ansIdx = (resp >= 0 && resp <= 3) ? resp : 0;
            }

            let comp = String(q.disciplina || q.componente || 'Geral');
            let prof = String(q.nivel || q.nivel_proficiencia || q.grau_interno || 'Básico');

            return { 
                id: String(q.id || `GLOBAL_${index}`), 
                text: String(q.pergunta || q.enunciado || "Sem enunciado"), 
                category: `${comp} • ${anoSeguro} • Proficiência: ${prof}`, 
                componente: comp.toLowerCase(), ano: anoSeguro.toLowerCase(), proficiencia: prof.toLowerCase(), 
                options: altArray, answer: ansIdx, explicacao: String(q.justificativa_gabarito || q.feedback_correto || ""), 
                image_url: q.imagem || q.image_url || null, bncc: String(q.habilidade_bncc_codigo_referencial || "N/A"), isCustom: false 
            }; 
        });

        // Mescla com banco customizado local
        if (typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) {
            let customQuestions = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []);
            if(Array.isArray(customQuestions)) {
                 window.allQuestions = window.allQuestions.concat(customQuestions);
            }
        }

        console.log(`✅ [Motor] SUCESSO! ${window.allQuestions.length} questões mapeadas para o jogo.`);
    } catch (e) {
        console.error("🚨 Falha fatal ao mapear questões:", e);
        window.allQuestions = [];
    }
};

// 3. WATCHDOG (Garante que o banco de 7MB tenha tempo para carregar)
window.watchdogTempo = 0;
window.watchdogBanco = setInterval(function() {
    window.watchdogTempo += 200;
    if (window.BANCO_BRUTAO_GLOBAL && window.BANCO_BRUTAO_GLOBAL.length > 0) {
        clearInterval(window.watchdogBanco);
        window.initGameData();
    } else if (window.watchdogTempo >= 5000) {
        // Desiste após 5s e roda o init (que vai carregar o fallback)
        clearInterval(window.watchdogBanco);
        window.initGameData();
    }
}, 200);

document.addEventListener("DOMContentLoaded", function() {
    // Escuta mudanças nos radio buttons de dificuldade do modo aluno
    document.body.addEventListener('change', function(e) {
        if(e.target && e.target.name === 'student-diff') {
            window.dificuldadeModoTreino = e.target.value.toLowerCase();
            var container = e.target.closest('.flex');
            if(container) {
                container.querySelectorAll('button, div.bg-blue-950').forEach(el => {
                     // Ajusta o visual conforme seu CSS existente
                });
            }
        }
    });
});
// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Inicialização, Leitura Segura do Banco 7MB e Acesso PRO
// =========================================================================

console.log("🚀 [Motor] Inicializador ativado. Aguardando Banco...");

window.PIN_ACESSO_PRO = "1234";

// 1. DESBLOQUEIO DO EDUCADOR (Lê o ID exato do seu HTML)
window.authProf = function() {
    var inputSenha = document.getElementById('prof-pin-input');
    if (!inputSenha) return;
    
    if (inputSenha.value === window.PIN_ACESSO_PRO) {
        inputSenha.value = "";
        var modal = document.getElementById('modal-prof-login');
        if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
        
        // Verifica LGPD
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

// 2. CONVERSOR DO BANCO DE QUESTÕES (Tolerante a qualquer formatação)
window.initGameData = function() {
    try {
        if(typeof window.initTurmasData === 'function') window.initTurmasData();
        
        var rawBank = window.BANCO_BRUTAO_GLOBAL || [];
        
        if (rawBank.length === 0) {
            console.error("🚨 Banco Vazio. Verifique a formatação do motor_do_banco_de_questoes.js");
            return;
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

        var customQuestions = [];
        if (typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) {
            customQuestions = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []);
        }
        window.allQuestions = window.allQuestions.concat(customQuestions);
        console.log(`✅ [Motor] SUCESSO! ${window.allQuestions.length} questões na RAM prontas para o jogo!`);
    } catch (e) {
        console.error("🚨 Falha fatal ao mapear questões:", e);
    }
};

// 3. CÃO DE GUARDA DO CACHE (Garante que o arquivo gigante de 7MB carregue)
window.watchdogBanco = setInterval(function() {
    if (window.BANCO_BRUTAO_GLOBAL && window.BANCO_BRUTAO_GLOBAL.length > 0) {
        clearInterval(window.watchdogBanco);
        window.initGameData();
    }
}, 200);

setTimeout(function() { clearInterval(window.watchdogBanco); }, 5000);
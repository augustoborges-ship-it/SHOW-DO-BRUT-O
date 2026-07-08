// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Eventos de inicialização, DOMContentLoaded e Conexão UI -> Motor
// =========================================================================

/* STREAMING_CHUNK:Configurando ambiente blindado... */
window.PIN_ACESSO_PRO = "1234";
window.dificuldadeModoTreino = "fácil";
window.bancoOriginal = [];

/* STREAMING_CHUNK:Validação PRO com injeção forçada de Modais... */
window.authProf = function(e) {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    
    var inputSenha = document.getElementById('prof-pin-input') || document.querySelector('#modal-prof-login input');
    
    if (!inputSenha) {
        var todosInputs = document.querySelectorAll('input');
        for(var k=0; k<todosInputs.length; k++) {
            if(todosInputs[k].closest('.fixed')) { inputSenha = todosInputs[k]; break; }
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

/* STREAMING_CHUNK:Mapeando banco de dados 100% livre de Cache... */
window.initGameData = function() {
    console.log("[Core-Init] Reset de Fábrica: Limpando Cache e Lendo o Banco Global...");
    
    try {
        if(typeof window.initTurmasData === 'function') window.initTurmasData();

        var rawBank = window.BANCO_BRUTAO_GLOBAL;
        
        // Se o Javascript travar lendo o arquivo, essa vacina entra em ação.
        if (!rawBank || !Array.isArray(rawBank) || rawBank.length === 0) {
            console.warn("ALERTA DE SISTEMA: O navegador abortou a leitura do arquivo de 7MB. Ativando Modo Fênix.");
            rawBank = [
                {
                    "id": "EMERGENCIA_F", "disciplina": "Matemática", "ano": "5º Ano", "nivel": "Básico",
                    "pergunta": "O seu arquivo motor_do_banco_de_questoes.js tem um erro de digitação. Quanto é 1+1?",
                    "alternativas": ["1", "2", "3", "4"], "correta": 1, "justificativa_gabarito": "2."
                },
                {
                    "id": "EMERGENCIA_M", "disciplina": "Matemática", "ano": "5º Ano", "nivel": "Intermediário",
                    "pergunta": "O arquivo corrompido cancelou o carregamento de todas as questões. Quanto é 5x5?",
                    "alternativas": ["10", "15", "25", "30"], "correta": 2, "justificativa_gabarito": "25."
                },
                {
                    "id": "EMERGENCIA_D", "disciplina": "Matemática", "ano": "5º Ano", "nivel": "Avançado",
                    "pergunta": "Descubra qual linha do seu JSON de 7MB está com erro. Qual a raiz de 100?",
                    "alternativas": ["5", "8", "10", "12"], "correta": 2, "justificativa_gabarito": "10."
                }
            ];
            // Replica as 3 questões até dar 16 (limite do jogo)
            var b = []; for(let i=0; i<6; i++) { b = b.concat(rawBank); }
            rawBank = b;
        }

        const globalQuestionsParsed = rawBank.map((q, index) => { 
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
            if (q.correta !== undefined && q.correta !== null) ansIdx = parseInt(q.correta);
            else if (q.gabarito_letra) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[String(q.gabarito_letra).toUpperCase()] || 0;

            let comp = String(q.disciplina || q.componente || 'Geral');
            let prof = String(q.nivel || q.nivel_proficiencia || q.grau_interno || 'Básico');

            return { 
                id: String(q.id || `GLOBAL_${index}`), text: String(q.pergunta || q.enunciado || "Sem enunciado"), 
                category: `${comp} • ${anoSeguro} • Proficiência: ${prof}`, 
                componente: comp.toLowerCase(), ano: anoSeguro.toLowerCase(), proficiencia: prof.toLowerCase(), 
                options: [altA, altB, altC, altD], answer: ansIdx, explicacao: String(q.justificativa_gabarito || ""), 
                image_url: q.imagem || null, bncc: String(q.habilidade_bncc_codigo_referencial || "N/A"), isCustom: false 
            }; 
        });

        window.allQuestions = globalQuestionsParsed;
        console.log(`✅ [Core-Init] FORÇA BRUTA: ${window.allQuestions.length} questões injetadas em RAM!`);
    } catch (e) {
        console.error("Erro fatal no initGameData:", e);
    }
};

/* STREAMING_CHUNK:Ouvintes de Cliques Anti-Zombie (Event Delegation Absoluta)... */
document.addEventListener("DOMContentLoaded", function() {
    if (typeof window.initGameData === 'function') window.initGameData();

    document.addEventListener('click', function(e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        var txt = btn.innerText ? btn.innerText.trim().toUpperCase() : "";

        if (txt === "DESBLOQUEAR") {
            e.preventDefault(); e.stopPropagation();
            if(typeof window.authProf === 'function') window.authProf(e);
        } 
        else if (txt === "FÁCIL" || txt === "MÉDIO" || txt === "DIFÍCIL") {
            e.preventDefault(); e.stopPropagation();
            window.dificuldadeModoTreino = txt.toLowerCase();
            var irmaos = btn.parentElement.querySelectorAll('button');
            for(var i=0; i<irmaos.length; i++) {
                irmaos[i].classList.remove('bg-blue-600', 'border-blue-400');
                irmaos[i].classList.add('bg-transparent', 'border-gray-600');
            }
            btn.classList.remove('bg-transparent', 'border-gray-600');
            btn.classList.add('bg-blue-600', 'border-blue-400');
        } 
        else if (txt === "JOGAR AGORA" || txt === "INICIAR MISSÃO") {
            e.preventDefault(); e.stopPropagation();
            
            // Força a recarga do banco antes de iniciar se der tela preta
            if(!window.allQuestions || window.allQuestions.length === 0) window.initGameData();

            var isStudentScreen = btn.closest('#screen-setup-student') || document.querySelector('#screen-setup-student.active') || document.querySelector('.screen.active');
            
            if (isStudentScreen && typeof window.startStudentGame === 'function') {
                window.startStudentGame();
            } else if (typeof window.startGame === 'function') {
                window.startGame();
            } else {
                alert("O sistema falhou ao inicializar as regras do jogo. Feche essa aba e abra de novo (CTRL+F5).");
            }
        }
    }, true);
});
### PASSO 2: O Motor Inquebrável (Substituição Completa)
Abra o arquivo **`inicializa_o_e_controladores_principais.js`**, apague **TUDO** e cole este código. Ele possui a blindagem máxima que obriga o jogo a carregar as questões.

```javascript:inicializa_o_e_controladores_principais.js
// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Eventos de inicialização, DOMContentLoaded e Conexão UI -> Motor
// =========================================================================

/* STREAMING_CHUNK:Configurando variáveis de controle... */
window.PIN_ACESSO_PRO = "1234";
window.dificuldadeModoTreino = "fácil";
window.bancoOriginal = [];

/* STREAMING_CHUNK:Garantindo o Acesso PRO... */
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

/* STREAMING_CHUNK:Tradutor de Banco e Conversor Lexical... */
window.initGameData = function() {
    console.log("[Core-Init] Iniciando Injeção de Dados...");
    
    try {
        if(typeof window.initTurmasData === 'function') window.initTurmasData();

        var rawBank = window.BANCO_BRUTAO_GLOBAL;
        
        // Verifica se o banco carregou. Se falhar, injeta o teste de emergência.
        if (!rawBank || !Array.isArray(rawBank) || rawBank.length === 0) {
            console.error("🚨 ALERTA: window.BANCO_BRUTAO_GLOBAL falhou. Verifique se há erros de vírgula/sintaxe no seu arquivo de 7MB.");
            rawBank = [{
                "id": "EMERGENCIA_TOTAL", "disciplina": "Matemática", "ano": "5º Ano", "nivel": "Básico",
                "pergunta": "O SEU ARQUIVO motor_do_banco_de_questoes.js ESTÁ COM UM ERRO DE SINTAXE. O Javascript não conseguiu ler as 2.000 questões. Verifique vírgulas ou chaves faltando. Quanto é 2 + 2?",
                "alternativas": ["1", "2", "4", "8"], "correta": 2, "justificativa_gabarito": "Resolva o erro no JSON."
            }];
        }

        // Mapeia todas as questões do seu JSON para o formato do jogo
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
                id: String(q.id || `GLOBAL_${index}`), 
                text: String(q.pergunta || q.enunciado || "Sem enunciado"), 
                category: `${comp} • ${anoSeguro} • Proficiência: ${prof}`, 
                componente: comp.toLowerCase(), ano: anoSeguro.toLowerCase(), proficiencia: prof.toLowerCase(), 
                options: [altA, altB, altC, altD], answer: ansIdx, explicacao: String(q.justificativa_gabarito || ""), 
                image_url: q.imagem || null, bncc: String(q.habilidade_bncc_codigo_referencial || "N/A"), isCustom: false 
            }; 
        });

        window.allQuestions = globalQuestionsParsed;
        console.log(`✅ [Core-Init] ${window.allQuestions.length} questões disponíveis na memória do jogo!`);
    } catch (e) {
        console.error("Falha fatal no mapeamento:", e);
    }
};

/* STREAMING_CHUNK:Event Delegation Global (Protege os botões)... */
document.addEventListener("DOMContentLoaded", function() {
    if (typeof window.initGameData === 'function') window.initGameData();

    document.addEventListener('click', function(e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        var txt = btn.innerText ? btn.innerText.trim().toUpperCase() : "";

        if (txt === "DESBLOQUEAR") {
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
            var isStudentScreen = btn.closest('#screen-setup-student') || document.querySelector('#screen-setup-student.active');
            if (isStudentScreen && typeof window.startStudentGame === 'function') {
                window.startStudentGame();
            } else if (typeof window.startGame === 'function') {
                window.startGame();
            }
        }
    }, true);
});
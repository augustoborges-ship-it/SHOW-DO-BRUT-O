// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Gatilhos, Leitura de Banco e Início do Jogo
// =========================================================================

console.log("🚀 [Core] Inicializador ativado.");

/* STREAMING_CHUNK:Variaveis e Acesso PRO... */
window.PIN_ACESSO_PRO = "1234";
window.dificuldadeModoTreino = "fácil";

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

/* STREAMING_CHUNK:Conversor Limpo do Banco... */
window.initGameData = function() {
    console.log("⚙️ [Core] Lendo o Banco de Questões...");
    try {
        if(typeof window.initTurmasData === 'function') window.initTurmasData();
        var rawBank = window.BANCO_BRUTAO_GLOBAL;
        
        // Se o arquivo de 7MB der erro de vírgula, essa proteção salva o jogo
        if (!rawBank || !Array.isArray(rawBank) || rawBank.length === 0) {
            console.error("🚨 ERRO: window.BANCO_BRUTAO_GLOBAL vazio. Verifique a sintaxe do arquivo de questões.");
            rawBank = [];
            for (let i = 0; i < 16; i++) {
                rawBank.push({
                    "id": "EMERGENCIA_" + i, "disciplina": "Matemática", "ano": "5º Ano", "nivel": "Básico",
                    "pergunta": `🚨 MODO DE SOBREVIVÊNCIA 🚨 O seu arquivo 'motor_do_banco_de_questoes.js' falhou. Questão Falsa ${i+1}. Quanto é 2 + 2?`,
                    "alternativas": ["1", "2", "4", "8"], "correta": 2, "justificativa_gabarito": "Se viu isso, corrija seu JSON."
                });
            }
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

            return { 
                id: String(q.id || `GLOBAL_${index}`), 
                text: String(q.pergunta || q.enunciado || "Sem enunciado"), 
                category: `${comp} • ${anoSeguro} • Proficiência: ${profRaw}`, 
                componente: comp.toLowerCase(), ano: anoSeguro.toLowerCase(), proficiencia: profRaw.toLowerCase(), 
                options: [altA, altB, altC, altD], answer: ansIdx, explicacao: String(q.justificativa_gabarito || q.feedback_correto || ""), 
                image_url: q.imagem || q.image_url || null, bncc: String(q.habilidade_bncc_codigo_referencial || "N/A"), isCustom: false 
            }; 
        });

        var customQuestions = [];
        if (typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) {
            customQuestions = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []);
        }
        window.allQuestions = window.allQuestions.concat(customQuestions);
        console.log(`✅ [Core] ${window.allQuestions.length} questões na memória!`);
    } catch (e) {
        console.error("🚨 Falha fatal:", e);
    }
};

/* STREAMING_CHUNK:Lógica Absoluta do Modo Treino... */
window.startStudentGameSafe = function() {
    if(typeof window.clearProgress === 'function') window.clearProgress(); 
    window.isStudentMode = true; 
    
    var container = document.getElementById('screen-setup-student') || document.querySelector('.screen.active') || document;
    var selects = container.querySelectorAll('select');
    var inputsText = container.querySelectorAll('input[type="text"]');
    
    var pName = "Herói Anônimo";
    for (var k = 0; k < inputsText.length; k++) {
        if (inputsText[k].placeholder && inputsText[k].placeholder.toLowerCase().indexOf('nome') !== -1 && inputsText[k].value.trim() !== "") {
            pName = inputsText[k].value.trim(); break;
        }
    }
    
    var anoEscolar = "5º Ano"; var disc = "Matemática";
    if (selects.length >= 2) { anoEscolar = selects[0].value; disc = selects[1].value; } 
    else if (selects.length === 1) { anoEscolar = selects[0].value; }
    
    var difSelecionada = window.dificuldadeModoTreino || "fácil";
    var tagsAceitas = [];
    if (difSelecionada === "fácil") tagsAceitas = ["básico", "b1", "b2", "fácil", "baixo"];
    else if (difSelecionada === "médio") tagsAceitas = ["intermediário", "b3", "b4", "médio", "adequado", "a1", "a2"];
    else if (difSelecionada === "difícil") tagsAceitas = ["avançado", "b5", "b6", "difícil", "alto", "a3"];

    var numAnoBusca = String(anoEscolar).replace(/\D/g, "");

    if(!window.allQuestions || window.allQuestions.length === 0) window.initGameData();

    // Filtro Flexível (Verifica Nível, Disciplina e Ano)
    window.questoesDaPartida = window.allQuestions.filter(function(q) {
        var bateAno = q.ano.includes(String(anoEscolar).toLowerCase()) || q.ano.includes(numAnoBusca) || q.ano === numAnoBusca;
        var bateDisc = q.componente.includes(String(disc).toLowerCase());
        var bateDificuldade = false;
        for (var x = 0; x < tagsAceitas.length; x++) {
            if (q.proficiencia.includes(tagsAceitas[x])) { bateDificuldade = true; break; }
        }
        return bateAno && bateDisc && bateDificuldade;
    });

    // SISTEMA ANTI-TELA PRETA: Se faltar questão com esse nível, puxa a matéria toda
    if (window.questoesDaPartida.length === 0) {
        window.questoesDaPartida = window.allQuestions.filter(function(q) {
            return (q.ano.includes(String(anoEscolar).toLowerCase()) || q.ano.includes(numAnoBusca) || q.ano === numAnoBusca) && q.componente.includes(String(disc).toLowerCase());
        });
        
        // PÂNICO TOTAL: Se não achar nada da matéria, roda o banco inteiro
        if (window.questoesDaPartida.length === 0) {
            window.questoesDaPartida = [...window.allQuestions];
        }
    }

    // Embaralha
    for (var r = window.questoesDaPartida.length - 1; r > 0; r--) {
        var s = Math.floor(Math.random() * (r + 1));
        var aux = window.questoesDaPartida[r];
        window.questoesDaPartida[r] = window.questoesDaPartida[s];
        window.questoesDaPartida[s] = aux;
    }

    window.teams = [{ name: pName, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }];
    window.gameMode = 'single'; window.currentTeamIndex = 0;
    
    if (window.STORAGE_KEYS && typeof window.readJSONKey === 'function' && typeof window.writeJSONKey === 'function') {
        var todayStr = new Date().toISOString().split('T')[0]; 
        window.currentStudentTelemetryKey = pName.toLowerCase() + "_" + todayStr;
        var telemetry = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); 
        if (!telemetry[window.currentStudentTelemetryKey]) { telemetry[window.currentStudentTelemetryKey] = { attempts: 0, sent: false }; } 
        telemetry[window.currentStudentTelemetryKey].attempts++; 
        window.writeJSONKey(window.STORAGE_KEYS.telemetry, telemetry);
    }

    window.activeQuestions = [];
    while(window.activeQuestions.length < 16 && window.questoesDaPartida.length > 0) {
        for(let q of window.questoesDaPartida) {
            if(window.activeQuestions.length < 16) window.activeQuestions.push(q);
        }
    }
    window.globalQuestionIndex = 0;

    var telas = document.querySelectorAll('.screen');
    for(var t = 0; t < telas.length; t++) telas[t].classList.remove('active');
    
    var gameScreen = document.getElementById('screen-game') || document.getElementById('tela-jogo');
    if(gameScreen) { gameScreen.classList.remove('hidden'); gameScreen.classList.add('active', 'flex'); }
    
    if (typeof window.fireUpGame === 'function') window.fireUpGame();
};

/* STREAMING_CHUNK:Eventos Globais... */
document.addEventListener("DOMContentLoaded", function() {
    window.initGameData(); // Chama na hora que a página carrega

    document.addEventListener('click', function(e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        var txt = btn.innerText ? btn.innerText.trim().toUpperCase() : "";

        if (txt === "DESBLOQUEAR") {
            e.preventDefault(); e.stopPropagation();
            window.authProf(e);
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
            var isStudentScreen = btn.closest('#screen-setup-student') || document.querySelector('#screen-setup-student.active') || document.querySelector('.screen.active');
            
            if (isStudentScreen) {
                window.startStudentGameSafe();
            } else {
                if (typeof window.startGame === 'function') window.startGame();
            }
        }
    }, true);
});
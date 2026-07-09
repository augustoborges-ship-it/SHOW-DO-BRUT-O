#### ARQUIVO 2: O Escudo Lexical (Se adapta ao seu Layout Lindo)
Abra o arquivo `inicializa_o_e_controladores_principais.js`, apague tudo e cole isso:

```javascript:inicializa_o_e_controladores_principais.js
// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Eventos de inicialização, DOMContentLoaded e Conexão UI -> Motor
// Arquitetura: Event Delegation Global (Blindagem contra quebras de DOM)
// =========================================================================

window.PIN_ACESSO_PRO = "1234";
window.dificuldadeModoTreino = "fácil";
window.questoesDaPartida = [];
window.indiceQuestaoAtual = 0;
window.EVENT_DELEGATION_MOUNTED = false;
window.isEmergencyBank = false;

window.authProf = function(e) {
    if(e) e.preventDefault();
    var inputSenha = document.getElementById('prof-pin-input') || document.querySelector('#modal-prof-login input');
    
    if (!inputSenha) {
        var modais = document.querySelectorAll('.fixed');
        for(var i=0; i<modais.length; i++) {
            if(modais[i].innerText.indexOf('ACESSO RESTRITO') !== -1) {
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

window.initGameData = function() {
    console.log("[Core-Init] Iniciando o mapeamento do Banco Global...");

    var mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null;
    var mutantData = window.__MUTANT || mHash;
    if (mutantData) {
        try { 
            var p = JSON.parse(decodeURIComponent(escape(atob(mutantData)))); 
            window.CURRENT_MISSION_ID = p.missionId; 
            window.MUTANT_MODE = p.mode; 
            window.allQuestions = p.questions; 
            return; 
        } catch(e) {}
    }

    try {
        if (typeof window.initTurmasData === 'function') window.initTurmasData();
        var rawBank = window.BANCO_BRUTAO_GLOBAL;

        if (rawBank && typeof rawBank === 'object' && !Array.isArray(rawBank)) {
            rawBank = Object.keys(rawBank).map(function(k) { return rawBank[k]; });
        }

        if (!rawBank || !Array.isArray(rawBank) || rawBank.length === 0) {
            console.warn("[Core-Init] Erro de sintaxe no arquivo de 7MB. Ativando Modo Emergência.");
            window.isEmergencyBank = true;
            rawBank = [{
                "id": "ERRO_SINTAXE_01", "disciplina": "Matemática", "ano": "5º Ano", "nivel": "Básico",
                "pergunta": "🚨 MODO EMERGÊNCIA. O seu arquivo motor_do_banco_de_questoes.js tem um erro de sintaxe. Quanto é 2+2?",
                "alternativas": ["1", "2", "4", "8"], "correta": 2, "justificativa_gabarito": "Você precisa consertar o JSON para o banco completo voltar a funcionar.", "imagem": null
            }];
        } else {
            window.isEmergencyBank = false;
        }

        var globalQuestionsParsed = rawBank.map(function(q, index) {
            var anoSeguro = String(q.ano || 'Geral');
            if (anoSeguro !== 'Geral' && anoSeguro.toLowerCase().indexOf('ano') === -1) anoSeguro += 'º Ano';

            var altA = "", altB = "", altC = "", altD = "";
            if (Array.isArray(q.alternativas)) {
                altA = String(q.alternativas[0] || ""); altB = String(q.alternativas[1] || "");
                altC = String(q.alternativas[2] || ""); altD = String(q.alternativas[3] || "");
            } else if (q.alternativas && typeof q.alternativas === 'object') {
                altA = String(q.alternativas.A || q.alternativas.a || ""); altB = String(q.alternativas.B || q.alternativas.b || "");
                altC = String(q.alternativas.C || q.alternativas.c || ""); altD = String(q.alternativas.D || q.alternativas.d || "");
            }

            var ansIdx = 0;
            if (q.correta !== undefined && q.correta !== null) ansIdx = parseInt(q.correta);
            else if (q.gabarito_letra) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[String(q.gabarito_letra).toUpperCase()] || 0;

            var comp = String(q.disciplina || q.componente || 'Geral');
            var prof = String(q.nivel || q.nivel_proficiencia || q.grau_interno || 'Básico');

            return { 
                id: String(q.id || ("GLOBAL_" + index)), text: String(q.pergunta || q.enunciado || "Sem enunciado"), 
                category: comp + " • " + anoSeguro + " • Proficiência: " + prof, componente: comp.toLowerCase(), 
                ano: anoSeguro.toLowerCase(), proficiencia: prof.toLowerCase(), options: [altA, altB, altC, altD], 
                answer: ansIdx, explicacao: String(q.justificativa_gabarito || q.explicacao || q.feedback_correto || ""), 
                image_url: q.imagem || q.image_url || null, bncc: String(q.habilidade_bncc_codigo_referencial || q.bncc || "N/A"), isCustom: false 
            }; 
        });

        var customQuestions = [];
        if (typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) {
            customQuestions = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []);
        }

        window.allQuestions = globalQuestionsParsed.concat(customQuestions);
        console.log("[Core-Init] SUCESSO! " + window.allQuestions.length + " questões injetadas na Memória RAM.");

    } catch (e) { console.error("[Core-Init] Falha fatal ao inicializar banco:", e); }
};

document.addEventListener("DOMContentLoaded", function() {
    if (window.EVENT_DELEGATION_MOUNTED) return;
    window.EVENT_DELEGATION_MOUNTED = true;

    console.log("[Core-DOM] Módulo Blindado de Interface carregado.");
    if (typeof window.initGameData === 'function') window.initGameData();

    // ESTA É A MÁGICA QUE SE ADAPTA AO SEU HTML VISUAL
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('button') || e.target.closest('.cursor-pointer');
        if (!btn) return;
        var textoBotao = btn.innerText ? btn.innerText.trim().toUpperCase() : "";

        if (textoBotao.includes("ACESSO PRO") || textoBotao.includes("EDUCADOR")) {
            e.preventDefault(); e.stopPropagation();
            var modal = document.getElementById('modal-prof-login');
            if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
        }
        else if (textoBotao.includes("DESBLOQUEAR")) {
            e.preventDefault(); e.stopPropagation();
            if(typeof window.authProf === 'function') window.authProf(e);
        }
        else if (textoBotao === "FÁCIL" || textoBotao === "MÉDIO" || textoBotao === "DIFÍCIL") {
            e.preventDefault(); e.stopPropagation();
            var containerModoTreino = btn.parentElement;
            if (containerModoTreino) {
                var todosOsIrmaos = containerModoTreino.querySelectorAll('button');
                for (var j = 0; j < todosOsIrmaos.length; j++) {
                    todosOsIrmaos[j].classList.remove('bg-blue-600', 'border-blue-400', 'bg-green-600');
                    todosOsIrmaos[j].classList.add('bg-transparent', 'border-gray-600');
                }
                btn.classList.remove('bg-transparent', 'border-gray-600');
                btn.classList.add('bg-blue-600', 'border-blue-400');
                window.dificuldadeModoTreino = textoBotao.toLowerCase();
            }
        }
        else if (textoBotao.includes("JOGAR AGORA") || textoBotao.includes("JOGAR")) {
            e.preventDefault(); e.stopPropagation();

            // Se for o JOGAR da tela inicial (Home)
            if (btn.closest('#screen-home') || (!document.getElementById('screen-setup-student') || !document.getElementById('screen-setup-student').classList.contains('active'))) {
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                var scrSetup = document.getElementById('screen-setup-student');
                if(scrSetup) scrSetup.classList.add('active');
                return;
            }

            if (!window.allQuestions || window.allQuestions.length === 0) {
                 alert("Erro Crítico: O motor falhou em alocar dados em RAM. Dê CTRL+F5."); return;
            }

            var container = btn.closest('.screen') || btn.closest('.fixed') || btn.closest('.absolute') || document;
            var selects = container.querySelectorAll('select');
            var inputsText = container.querySelectorAll('input[type="text"]');
            
            var inputNome = null;
            for (var k = 0; k < inputsText.length; k++) {
                if (inputsText[k].id === 'student-name' || inputsText[k].placeholder.toLowerCase().indexOf('nome') !== -1) {
                    inputNome = inputsText[k]; break;
                }
            }
            
            var anoEscolar = "5º Ano"; var disc = "Matemática";
            if (selects.length >= 2) { anoEscolar = selects[0].value; disc = selects[1].value; }
            
            if (window.isEmergencyBank) { anoEscolar = "5º Ano"; disc = "Matemática"; }
            
            var pName = (inputNome && inputNome.value.trim() !== "") ? inputNome.value.trim() : "Herói Anônimo";

            var tagsAceitas = ["básico"];
            if (window.dificuldadeModoTreino === "fácil") tagsAceitas = ["básico", "b1", "b2", "fácil", "baixo"];
            else if (window.dificuldadeModoTreino === "médio") tagsAceitas = ["intermediário", "b3", "b4", "médio", "adequado"];
            else if (window.dificuldadeModoTreino === "difícil") tagsAceitas = ["avançado", "b5", "b6", "difícil", "alto"];

            var numAnoBusca = anoEscolar.replace(/\D/g, "");

            window.questoesDaPartida = window.allQuestions.filter(function(q) {
                var qAno = String(q.ano || "").toLowerCase(); var qComp = String(q.componente || q.disciplina || "").toLowerCase();
                var qNiv = String(q.proficiencia || q.nivel_proficiencia || q.nivel || "").toLowerCase();
                var bateAno = qAno.includes(anoEscolar.toLowerCase()) || qAno.includes(numAnoBusca) || qAno === numAnoBusca;
                var bateDisc = qComp.includes(disc.toLowerCase());
                var bateDificuldade = false;
                for (var x = 0; x < tagsAceitas.length; x++) { if (qNiv.includes(tagsAceitas[x])) { bateDificuldade = true; break; } }
                return bateAno && bateDisc && bateDificuldade;
            });

            if (window.questoesDaPartida.length === 0) {
                window.questoesDaPartida = window.allQuestions.filter(function(q) {
                    var qAno = String(q.ano || "").toLowerCase(); var qComp = String(q.componente || q.disciplina || "").toLowerCase();
                    return (qAno.includes(anoEscolar.toLowerCase()) || qAno.includes(numAnoBusca) || qAno === numAnoBusca) && qComp.includes(disc.toLowerCase());
                });
                
                if (window.questoesDaPartida.length === 0) {
                    if (typeof window.showSystemMessage === 'function') window.showSystemMessage("Filtro Vazio", "A inteligência não encontrou itens cadastrados para " + disc + " do " + anoEscolar + ".", "info");
                    else alert("Sistema Brutão: Nenhuma questão encontrada para os filtros aplicados.");
                    return;
                }
            }

            for (var r = window.questoesDaPartida.length - 1; r > 0; r--) {
                var s = Math.floor(Math.random() * (r + 1));
                var aux = window.questoesDaPartida[r]; window.questoesDaPartida[r] = window.questoesDaPartida[s]; window.questoesDaPartida[s] = aux;
            }

            window.isStudentMode = true; window.gameMode = 'single'; window.currentTeamIndex = 0;
            window.teams = [{ name: pName, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }];
            window.activeQuestions = window.questoesDaPartida.slice(0, 16); window.globalQuestionIndex = 0;

            if (window.STORAGE_KEYS && typeof window.readJSONKey === 'function' && typeof window.writeJSONKey === 'function') {
                var todayStr = new Date().toISOString().split('T')[0]; 
                window.currentStudentTelemetryKey = pName.toLowerCase() + "_" + todayStr;
                var telemetry = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); 
                if (!telemetry[window.currentStudentTelemetryKey]) { telemetry[window.currentStudentTelemetryKey] = { attempts: 0, sent: false }; } 
                telemetry[window.currentStudentTelemetryKey].attempts++; 
                window.writeJSONKey(window.STORAGE_KEYS.telemetry, telemetry);
            }

            var modais = document.querySelectorAll('.fixed, .absolute');
            for(var m=0; m<modais.length; m++) { modais[m].classList.remove('flex'); modais[m].classList.add('hidden'); }
            var telas = document.querySelectorAll('.screen');
            for(var t = 0; t < telas.length; t++) telas[t].classList.remove('active');
            var gameScreen = document.getElementById('screen-game') || document.getElementById('tela-jogo');
            if(gameScreen) { gameScreen.classList.remove('hidden'); gameScreen.classList.add('active', 'flex'); }

            if (typeof window.startStudentGame === 'function') { window.activeQuestions = window.questoesDaPartida.slice(0, 16); window.fireUpGame(); } 
            else if (typeof window.fireUpGame === 'function') { window.fireUpGame(); } 
            else if (typeof window.loadQuestion === 'function') { window.loadQuestion(); }
        }
    });
});
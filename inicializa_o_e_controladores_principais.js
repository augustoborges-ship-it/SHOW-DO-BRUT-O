// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Eventos de inicialização, DOMContentLoaded e Conexão UI -> Motor
// Arquitetura: Event Delegation Global (Blindagem contra quebras de DOM)
// =========================================================================

window.PIN_ACESSO_PRO = "1234"; // CORREÇÃO: Variável ativada!
window.dificuldadeModoTreino = "fácil";
window.questoesDaPartida = [];
window.indiceQuestaoAtual = 0;
window.EVENT_DELEGATION_MOUNTED = false;

// TRADUTOR DO BANCO GIGANTE (Mapeia o JSON para o Motor)
window.initGameData = function() {
    console.log("[Core-Init] Mapeando Banco Global e Customizado...");
    
    // Suporte ao Link Mágico (Embed - Missões Híbridas)
    var mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null;
    var mutantData = window.__MUTANT || mHash;
    if (mutantData) {
        try { 
            var p = JSON.parse(decodeURIComponent(escape(atob(mutantData)))); 
            window.CURRENT_MISSION_ID = p.missionId; 
            window.MUTANT_MODE = p.mode; 
            window.allQuestions = p.questions; 
            if(mHash) { 
                var s = document.createElement('style'); 
                s.innerHTML = 'div[onclick="window.openProfLogin()"]{display:none!important;}'; 
                document.head.appendChild(s); 
            }
            return; 
        } catch(e) {}
    }

    try {
        if (typeof window.initTurmasData === 'function') window.initTurmasData();
        
        var rawBank = window.BANCO_BRUTAO_GLOBAL || [];
        
        // Tradutor Universal (Resolve a divergência entre os JSONs)
        var globalQuestionsParsed = rawBank.map(function(q, index) {
            var anoSeguro = String(q.ano || 'Geral');
            if (anoSeguro !== 'Geral' && anoSeguro.toLowerCase().indexOf('ano') === -1) {
                anoSeguro += 'º Ano';
            }

            var altA = "", altB = "", altC = "", altD = "";
            if (Array.isArray(q.alternativas)) {
                altA = q.alternativas[0] || ""; altB = q.alternativas[1] || "";
                altC = q.alternativas[2] || ""; altD = q.alternativas[3] || "";
            } else if (q.alternativas) {
                altA = q.alternativas.A || ""; altB = q.alternativas.B || "";
                altC = q.alternativas.C || ""; altD = q.alternativas.D || "";
            }

            var ansIdx = 0;
            if (q.correta !== undefined && q.correta !== null) ansIdx = parseInt(q.correta);
            else if (q.gabarito_letra) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[q.gabarito_letra.toUpperCase()] || 0;
            else if (q.resposta_correta) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[q.resposta_correta.toUpperCase()] || 0;

            return { 
                id: q.id || ("GLOBAL_" + index), 
                text: q.pergunta || q.enunciado || "Sem enunciado", 
                category: (q.disciplina || q.componente || 'Geral') + " • " + anoSeguro + " • Proficiência: " + (q.nivel || q.nivel_proficiencia || 'Básico'), 
                componente: String(q.disciplina || q.componente || '').toLowerCase(), 
                ano: anoSeguro.toLowerCase(), 
                proficiencia: String(q.nivel || q.nivel_proficiencia || q.grau_interno || 'Básico').toLowerCase(), 
                options: [altA, altB, altC, altD], 
                answer: ansIdx, 
                explicacao: q.justificativa_gabarito || q.explicacao || q.feedback_correto || "", 
                image_url: q.imagem || q.image_url || null, 
                bncc: q.habilidade_bncc_codigo_referencial || q.bncc || "N/A", 
                isCustom: false 
            }; 
        });

        var customQuestions = [];
        if (typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) {
            customQuestions = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []);
        }
        window.allQuestions = globalQuestionsParsed.concat(customQuestions);
        console.log("[Core-Init] Total de " + window.allQuestions.length + " questões prontas.");
    } catch (e) {
        console.error("[Core-Init] Falha fatal ao inicializar banco:", e);
    }
};

document.addEventListener("DOMContentLoaded", function() {
    if (window.EVENT_DELEGATION_MOUNTED) return;
    window.EVENT_DELEGATION_MOUNTED = true;

    console.log("[Core-DOM] Módulo Blindado de Interface carregado.");
    
    // Dispara a leitura do banco imediatamente
    if (typeof window.initGameData === 'function') window.initGameData();

    // DELEGAÇÃO GLOBAL DE EVENTOS (À prova de falhas de renderização de Modais)
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        
        var textoBotao = btn.innerText ? btn.innerText.trim().toUpperCase() : "";

        // ========================================================
        // A. DESBLOQUEIO DO ACESSO PRO (PIN)
        // ========================================================
        if (textoBotao === "DESBLOQUEAR") {
            e.preventDefault();
            e.stopPropagation(); // Trava outros eventos fantasma

            var modal = btn.closest('.fixed') || btn.closest('.absolute') || btn.parentElement.parentElement;
            var inputSenha = modal ? modal.querySelector('input') : null;
            
            if (inputSenha && inputSenha.value === window.PIN_ACESSO_PRO) {
                inputSenha.value = ""; // Limpa a senha
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
                
                // Abre o painel
                if (typeof window.enterProfDashboard === 'function') {
                    window.enterProfDashboard();
                }
            } else {
                // Efeito Tremor de Erro (Tailwind)
                if (inputSenha) {
                    inputSenha.classList.add('border-red-500', 'animate-pulse');
                    setTimeout(function() {
                        inputSenha.classList.remove('border-red-500', 'animate-pulse');
                    }, 1000);
                }
            }
        }

        // ========================================================
        // B. SELEÇÃO DE DIFICULDADE (MODO TREINO)
        // ========================================================
        else if (textoBotao === "FÁCIL" || textoBotao === "MÉDIO" || textoBotao === "DIFÍCIL") {
            e.preventDefault();
            var containerModoTreino = btn.parentElement;
            
            // Garante que é o grupo de botões de Dificuldade
            if (containerModoTreino && containerModoTreino.innerText.toUpperCase().indexOf("FÁCIL") !== -1) {
                var todosOsIrmaos = containerModoTreino.querySelectorAll('button');
                for (var j = 0; j < todosOsIrmaos.length; j++) {
                    todosOsIrmaos[j].classList.remove('bg-blue-600', 'border-blue-400', 'bg-green-600');
                    todosOsIrmaos[j].classList.add('bg-transparent', 'border-gray-600');
                }
                
                // Pinta o botão selecionado
                btn.classList.remove('bg-transparent', 'border-gray-600');
                btn.classList.add('bg-blue-600', 'border-blue-400');
                window.dificuldadeModoTreino = textoBotao.toLowerCase();
            }
        }

        // ========================================================
        // C. START DA PARTIDA (JOGAR AGORA)
        // ========================================================
        else if (textoBotao === "JOGAR AGORA") {
            e.preventDefault();
            e.stopPropagation(); // Desliga a chamada inline do HTML para evitar execução dupla

            var container = btn.closest('.screen') || btn.closest('.fixed') || btn.closest('.absolute') || document;
            var selects = container.querySelectorAll('select');
            var inputsText = container.querySelectorAll('input[type="text"]');
            
            // Busca o input do nome do aluno
            var inputNome = null;
            for (var k = 0; k < inputsText.length; k++) {
                if (inputsText[k].id === 'student-name' || inputsText[k].placeholder.toLowerCase().indexOf('nome') !== -1) {
                    inputNome = inputsText[k];
                    break;
                }
            }
            if (!inputNome && inputsText.length > 0) inputNome = inputsText[0];
            
            // Busca o Ano e Disciplina selecionados
            var anoEscolar = "5º Ano";
            var disc = "Matemática";
            if (selects.length >= 2) {
                anoEscolar = selects[0].value;
                disc = selects[1].value;
            }
            
            var pName = (inputNome && inputNome.value.trim() !== "") ? inputNome.value.trim() : "Herói Anônimo";

            // Dicionário de Sinônimos Lexicais para Inteligência de Filtro
            var tagsAceitas = ["básico"];
            if (window.dificuldadeModoTreino === "fácil") tagsAceitas = ["básico", "b1", "b2", "fácil", "baixo"];
            else if (window.dificuldadeModoTreino === "médio") tagsAceitas = ["intermediário", "b3", "b4", "médio", "adequado"];
            else if (window.dificuldadeModoTreino === "difícil") tagsAceitas = ["avançado", "b5", "b6", "difícil", "alto"];

            var numAnoBusca = anoEscolar.replace(/\D/g, "");

            window.questoesDaPartida = window.allQuestions.filter(function(q) {
                var qAno = String(q.ano || "").toLowerCase();
                var qComp = String(q.componente || q.disciplina || "").toLowerCase();
                var qNiv = String(q.proficiencia || q.nivel_proficiencia || q.nivel || "").toLowerCase();

                var bateAno = qAno.includes(anoEscolar.toLowerCase()) || qAno.includes(numAnoBusca) || qAno === numAnoBusca;
                var bateDisc = qComp.includes(disc.toLowerCase());
                var bateDificuldade = false;

                for (var x = 0; x < tagsAceitas.length; x++) {
                    if (qNiv.includes(tagsAceitas[x])) { bateDificuldade = true; break; }
                }
                return bateAno && bateDisc && bateDificuldade;
            });

            // Se for restrito demais, solta a trava da dificuldade para o jogo não travar
            if (window.questoesDaPartida.length === 0) {
                console.warn("[Core] Filtro rigoroso falhou. Buscando qualquer questão no eixo Ano/Disciplina...");
                window.questoesDaPartida = window.allQuestions.filter(function(q) {
                    var qAno = String(q.ano || "").toLowerCase();
                    var qComp = String(q.componente || q.disciplina || "").toLowerCase();
                    return (qAno.includes(anoEscolar.toLowerCase()) || qAno.includes(numAnoBusca) || qAno === numAnoBusca) && qComp.includes(disc.toLowerCase());
                });
                
                if (window.questoesDaPartida.length === 0) {
                    if (typeof window.showSystemMessage === 'function') {
                        window.showSystemMessage("Banco Vazio", "A inteligência não encontrou itens cadastrados para " + disc + " do " + anoEscolar + ".", "error");
                    } else {
                        alert("Sistema Brutão: Nenhuma questão encontrada para " + disc + " do " + anoEscolar + ".");
                    }
                    return;
                }
            }

            // Algoritmo de Embaralhamento Rápido (Fisher-Yates)
            for (var r = window.questoesDaPartida.length - 1; r > 0; r--) {
                var s = Math.floor(Math.random() * (r + 1));
                var aux = window.questoesDaPartida[r];
                window.questoesDaPartida[r] = window.questoesDaPartida[s];
                window.questoesDaPartida[s] = aux;
            }

            // Mapeamento forçado nas Globais Oficiais da Engine
            window.isStudentMode = true;
            window.gameMode = 'single';
            window.currentTeamIndex = 0;
            window.teams = [{ 
                name: pName, 
                level: 0, 
                status: 'playing', 
                helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, 
                turmaId: null, 
                students: [], 
                responseTimes: [] 
            }];
            window.activeQuestions = window.questoesDaPartida.slice(0, 16);
            window.globalQuestionIndex = 0;

            // Telemetria (se existir o módulo no config)
            if (window.STORAGE_KEYS && typeof window.readJSONKey === 'function' && typeof window.writeJSONKey === 'function') {
                var todayStr = new Date().toISOString().split('T')[0]; 
                window.currentStudentTelemetryKey = pName.toLowerCase() + "_" + todayStr;
                var telemetry = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); 
                if (!telemetry[window.currentStudentTelemetryKey]) { telemetry[window.currentStudentTelemetryKey] = { attempts: 0, sent: false }; } 
                telemetry[window.currentStudentTelemetryKey].attempts++; 
                window.writeJSONKey(window.STORAGE_KEYS.telemetry, telemetry);
            }

            // Ocultar modal/tela de setup
            var modalAtivo = btn.closest('.fixed') || btn.closest('.absolute');
            if (modalAtivo) { modalAtivo.classList.remove('flex'); modalAtivo.classList.add('hidden'); }
            
            var telas = document.querySelectorAll('.screen');
            for(var t = 0; t < telas.length; t++) telas[t].classList.remove('active');
            
            // Disparar o Core do Jogo
            var gameScreen = document.getElementById('screen-game') || document.getElementById('tela-jogo');
            if(gameScreen) { gameScreen.classList.remove('hidden'); gameScreen.classList.add('active', 'flex'); }

            if (typeof window.fireUpGame === 'function') {
                window.fireUpGame();
            } else if (typeof window.loadQuestion === 'function') {
                window.loadQuestion();
            }
        }
    });
});
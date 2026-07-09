// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Eventos de inicialização, DOMContentLoaded e Motor Unificado
// Arquitetura: Fuso Horário Único (Sem dependências externas para iniciar)
// =========================================================================

console.log("🚀 [SISTEMA] inicializa_o_e_controladores_principais.js carregado.");

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

/* STREAMING_CHUNK:Conversor Universal do Banco de Questões (Isolamento de Estado)... */
window.initGameData = function() {
    console.log("⚙️ [Core] Convertendo o Banco de Questões para o Jogo...");
    try {
        if(typeof window.initTurmasData === 'function') window.initTurmasData();

        // Aceita o banco no nome oficial e também em nomes alternativos comuns.
        var rawBank = window.BANCO_BRUTAO_GLOBAL || window.BANCO_DE_QUESTOES_GLOBAL || window.BANCO_QUESTOES_GLOBAL || window.bancoDeQuestoes || window.questions || [];
        if (rawBank && !Array.isArray(rawBank) && Array.isArray(rawBank.questoes)) rawBank = rawBank.questoes;
        if (rawBank && !Array.isArray(rawBank) && Array.isArray(rawBank.items)) rawBank = rawBank.items;

        // SISTEMA DE SOBREVIVÊNCIA DE FALHA DE ARQUIVO
        if (!rawBank || !Array.isArray(rawBank) || rawBank.length === 0) {
            console.error("🚨 ERRO: O arquivo motor_do_banco_de_questoes.js não carregou, está vazio ou não criou window.BANCO_BRUTAO_GLOBAL.");
            rawBank = [];
            for (let i = 0; i < 32; i++) {
                rawBank.push({
                    "id": "EMERGENCIA_" + i,
                    "disciplina": "Matemática",
                    "ano": "5º Ano",
                    "nivel": (i % 3 === 0) ? "Básico" : ((i % 3 === 1) ? "Adequado" : "Avançado"),
                    "pergunta": `🚨 MODO DE SOBREVIVÊNCIA 🚨 O banco global não foi reconhecido. Questão falsa ${i+1}. Quanto é 2 + 2?`,
                    "alternativas": ["1", "2", "4", "8"],
                    "correta": 2,
                    "justificativa_gabarito": "Fallback automático. Verifique se o arquivo motor_do_banco_de_questoes.js existe, foi carregado antes deste arquivo e contém window.BANCO_BRUTAO_GLOBAL = [...]."
                });
            }
        }

        function textoSeguro(valor, padrao) {
            if (valor === undefined || valor === null) return padrao || "";
            return String(valor);
        }

        function normalizarAno(ano) {
            let anoSeguro = textoSeguro(ano, 'Geral').trim();
            if (anoSeguro !== 'Geral' && !anoSeguro.toLowerCase().includes('ano')) {
                const num = anoSeguro.replace(/[^0-9]/g, '');
                anoSeguro = num ? (num + 'º Ano') : anoSeguro;
            }
            return anoSeguro;
        }

        function extrairAlternativas(q) {
            const fonte = q.alternativas || q.opcoes || q.opções || q.options || q.respostas || [];
            if (Array.isArray(fonte)) {
                return [0,1,2,3].map(i => textoSeguro(fonte[i], ""));
            }
            if (fonte && typeof fonte === 'object') {
                return [
                    textoSeguro(fonte.A || fonte.a || fonte['0'] || fonte[0], ""),
                    textoSeguro(fonte.B || fonte.b || fonte['1'] || fonte[1], ""),
                    textoSeguro(fonte.C || fonte.c || fonte['2'] || fonte[2], ""),
                    textoSeguro(fonte.D || fonte.d || fonte['3'] || fonte[3], "")
                ];
            }
            return ["", "", "", ""];
        }

        function indiceResposta(q, alternativas) {
            const candidatos = [
                q.correta, q.resposta_correta, q.gabarito_letra, q.gabarito,
                q.answer, q.answerIndex, q.indice_correto, q.alternativa_correta
            ];

            for (let i = 0; i < candidatos.length; i++) {
                let valor = candidatos[i];
                if (valor === undefined || valor === null || valor === "") continue;

                if (typeof valor === 'number' && isFinite(valor)) {
                    // Mantém o padrão do projeto: 0=A, 1=B, 2=C, 3=D. Se vier 4, entende como D.
                    if (valor >= 0 && valor <= 3) return valor;
                    if (valor >= 1 && valor <= 4) return valor - 1;
                }

                let s = String(valor).trim();
                let upper = s.toUpperCase();
                if ({A:0,B:1,C:2,D:3}[upper] !== undefined) return {A:0,B:1,C:2,D:3}[upper];

                let n = parseInt(s, 10);
                if (!isNaN(n)) {
                    if (n >= 0 && n <= 3) return n;
                    if (n >= 1 && n <= 4) return n - 1;
                }

                let idxTexto = alternativas.map(a => String(a).trim().toLowerCase()).indexOf(s.toLowerCase());
                if (idxTexto >= 0) return idxTexto;
            }
            return 0;
        }

        // Mapeador robusto e flexível
        window.allQuestions = rawBank.map((q, index) => {
            q = q || {};
            let anoSeguro = normalizarAno(q.ano || q.serie || q.série || q.ano_escolar);
            let alternativas = extrairAlternativas(q);
            let ansIdx = indiceResposta(q, alternativas);
            let comp = textoSeguro(q.disciplina || q.componente || q.area || q.materia || q.matéria, 'Geral');
            let profRaw = textoSeguro(q.nivel || q.nível || q.nivel_proficiencia || q.proficiencia || q.proficiência || q.grau_interno || q.dificuldade, 'Básico');
            let tagsRaw = Array.isArray(q.tags) ? q.tags.join(" ") : textoSeguro(q.tags, "");
            let profCompleta = (profRaw + " " + tagsRaw).toLowerCase();
            let enunciado = q.pergunta || q.enunciado || q.text || q.texto || q.questao || q.questão || "Sem enunciado";
            let explicacao = q.justificativa_gabarito || q.feedback_correto || q.explicacao || q.explicação || q.justificativa || q.comentario || "";
            let codigoBncc = q.habilidade_bncc_codigo_referencial || q.bncc || q.habilidade_bncc || q.habilidade || q.codigo_habilidade || "N/A";

            return {
                id: textoSeguro(q.id || q.codigo || q.cod || `GLOBAL_${index}`),
                text: textoSeguro(enunciado, "Sem enunciado"),
                category: `${comp} • ${anoSeguro} • Proficiência: ${profRaw}`,
                componente: comp.toLowerCase(),
                ano: anoSeguro.toLowerCase(),
                proficiencia: profCompleta,
                options: alternativas,
                answer: ansIdx,
                explicacao: textoSeguro(explicacao, ""),
                image_url: q.imagem || q.image_url || q.imagem_url || q.url_imagem || null,
                bncc: textoSeguro(codigoBncc, "N/A"),
                isCustom: false
            };
        }).filter(q => q.text && q.options && q.options.length === 4);

        var customQuestions = [];
        if (typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) {
            customQuestions = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []);
            if (!Array.isArray(customQuestions)) customQuestions = [];
        }
        window.allQuestions = window.allQuestions.concat(customQuestions);
        console.log(`✅ [Core] SUCESSO: ${window.allQuestions.length} questões mapeadas e injetadas no jogo!`);

        if (typeof window.renderQuestionBank === 'function') {
            var qbScreen = document.getElementById('screen-question-bank');
            if (qbScreen && qbScreen.classList.contains('active')) window.renderQuestionBank();
        }
    } catch (e) {
        console.error("🚨 Falha fatal ao converter questões:", e);
    }
};

/* STREAMING_CHUNK:LÓGICA CONSOLIDADA: O Início do Modo Treino (Blindagem Final)... */
window.startStudentGameSafe = function() {
    console.log("🚦 [Treino] Iniciando Preparativos...");
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

    // Garante que o banco exista! Se estiver vazio, tenta ler novamente (ou gera o de sobrevivência).
    if(!window.allQuestions || window.allQuestions.length === 0) {
        window.initGameData();
    }

    // Filtro OMNI-DIRECIONAL (Mais forte e tolerante)
    window.questoesDaPartida = window.allQuestions.filter(function(q) {
        var qAno = q.ano; var qComp = q.componente; var qProf = q.proficiencia; 
        var bateAno = qAno.includes(String(anoEscolar).toLowerCase()) || qAno.includes(numAnoBusca) || qAno === numAnoBusca;
        var bateDisc = qComp.includes(String(disc).toLowerCase());
        var bateDificuldade = false;
        for (var x = 0; x < tagsAceitas.length; x++) {
            if (qProf.includes(tagsAceitas[x])) { bateDificuldade = true; break; }
        }
        return bateAno && bateDisc && bateDificuldade;
    });

    // SISTEMA ANTI-TELA PRETA 1: Ignora Dificuldade, vai só por disciplina e ano
    if (window.questoesDaPartida.length === 0) {
        window.questoesDaPartida = window.allQuestions.filter(function(q) {
            var qAno = q.ano; var qComp = q.componente;
            return (qAno.includes(String(anoEscolar).toLowerCase()) || qAno.includes(numAnoBusca) || qAno === numAnoBusca) && qComp.includes(String(disc).toLowerCase());
        });
        
        // SISTEMA ANTI-TELA PRETA 2 (PÂNICO TOTAL): Injeta o banco todo, o jogo VAI RODAR
        if (window.questoesDaPartida.length === 0) {
            console.warn("⚠️ Filtro de disciplina falhou. Carregando o banco global massivo.");
            window.questoesDaPartida = [...window.allQuestions];
        }
    }

    // Embaralha as questões sorteadas
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
    
    console.log("🎯 [Treino] Disparando FireUpGame...");
    if (typeof window.fireUpGame === 'function') window.fireUpGame();
};

/* STREAMING_CHUNK:Gatilhos Globais de Prevenção de Erros de HTML (O Protetor Final)... */
document.addEventListener("DOMContentLoaded", function() {
    // Retardo mínimo para garantir que os outros scripts gigantes carreguem antes
    setTimeout(function() {
        if (typeof window.initGameData === 'function') window.initGameData();
    }, 600); 

    // O Event Delegation é a última barreira. Ele escuta cliques em TODO o documento e intercepta.
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
            
            var isStudentScreen = btn.closest('#screen-setup-student') || document.querySelector('#screen-setup-student.active') || document.querySelector('.screen.active');
            
            if (isStudentScreen) {
                // Rota do Modo Treino Blindada
                window.startStudentGameSafe();
            } else {
                // Rota do Jogo Oficial do Professor
                if (typeof window.startGame === 'function') window.startGame();
                else alert("Erro fatal: A lógica principal do jogo não carregou. Recarregue a página.");
            }
        }
    }, true);
});
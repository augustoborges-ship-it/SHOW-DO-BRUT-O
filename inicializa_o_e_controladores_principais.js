// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Eventos de inicialização, DOMContentLoaded e Motor Unificado
// Arquitetura: Fuso Horário Único (Sem dependências externas para iniciar)
// =========================================================================

console.log("🚀 [SISTEMA] inicializa_o_e_controladores_principais.js carregado.");

/* STREAMING_CHUNK:Configurando escopo global e variáveis... */
window.PIN_ACESSO_PRO = "1234";
window.dificuldadeModoTreino = "fácil";
window.bancoOriginal = [];

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
        
        var lgpdKey = window.STORAGE_KEYS ? window.STORAGE_KEYS.lgpd : 'brutao_lgpd_accepted';
        if(!localStorage.getItem(lgpdKey)) {
             var lgpdModal = document.getElementById('modal-lgpd');
             if(lgpdModal) { lgpdModal.classList.remove('hidden'); lgpdModal.classList.add('flex'); }
        } else {
             if (typeof window.enterProfDashboard === 'function') window.enterProfDashboard();
        }
    } else if (inputSenha) {
        inputSenha.classList.add('border-red-500', 'animate-pulse');
        setTimeout(function() { inputSenha.classList.remove('border-red-500', 'animate-pulse'); }, 1000);
    }
};

/* STREAMING_CHUNK:Conversor Universal do Banco de Questões (Isolamento de Estado)... */
window.initGameData = function() {
    console.log("⚙️ [Core] Convertendo o Banco de Questões para o Jogo...");
    
    // Suporte ao Link Mágico (Embed Mutant)
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
        } catch(e) { console.error("Erro ao decodificar mutante:", e); }
    }

    try {
        if(typeof window.initTurmasData === 'function') window.initTurmasData();
        var rawBank = window.BANCO_BRUTAO_GLOBAL;
        
        // SISTEMA DE SOBREVIVÊNCIA DE FALHA DE ARQUIVO
        if (!rawBank || !Array.isArray(rawBank) || rawBank.length === 0) {
            console.error("🚨 ERRO: O arquivo motor_do_banco_de_questoes.js não carregou ou está vazio devido a erro de sintaxe.");
            // Cria um banco falso robusto de 32 questões para o jogo nunca travar e permitir testar a UI
            rawBank = [];
            for (let i = 0; i < 32; i++) {
                rawBank.push({
                    "id": "EMERGENCIA_" + i,
                    "disciplina": "Matemática",
                    "ano": "5º Ano",
                    "nivel": (i % 3 === 0) ? "Básico" : ((i % 3 === 1) ? "Intermediário" : "Avançado"),
                    "pergunta": `🚨 MODO DE SOBREVIVÊNCIA 🚨 O seu arquivo 'motor_do_banco_de_questoes.js' falhou. Questão Falsa ${i+1}. Quanto é 2 + 2?`,
                    "alternativas": ["1", "2", "4", "8"],
                    "correta": 2,
                    "justificativa_gabarito": "Este é um fallback automático. O seu JSON original possui erro."
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
        console.log(`✅ [Core] SUCESSO: ${window.allQuestions.length} questões prontas!`);
    } catch (e) {
        console.error("🚨 Falha fatal ao converter questões:", e);
    }
};

/* STREAMING_CHUNK:Eventos Globais... */
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        if (typeof window.initGameData === 'function') window.initGameData();
    }, 300); 

    // Ouve as trocas de dificuldade no Modo Treino
    var diffRadios = document.querySelectorAll('input[name="student-diff"]');
    if(diffRadios.length > 0) {
        diffRadios.forEach(r => r.addEventListener('change', function(e) {
             window.dificuldadeModoTreino = e.target.value;
        }));
    }
});
```eof

```javascript:logica_e_core_do_jogo.js
// =========================================================================
// Arquivo: logica_e_core_do_jogo.js
// Função: Motor principal de partida, regras, validações e progressão
// =========================================================================

console.log("🚀 [SISTEMA] logica_e_core_do_jogo.js carregado com sucesso.");

/* STREAMING_CHUNK:Inicializando globais e salvamento... */
window.saveProgress = function() { 
    if (!window.activeQuestions || !window.activeQuestions.length || !window.teams || !window.teams.length) return; 
    window.writeJSONKey(window.STORAGE_KEYS.state, { 
        version: 2, savedAt: new Date().toISOString(), teams: window.teams, 
        currentTeamIndex: window.currentTeamIndex, gameMode: window.gameMode, 
        isStudentMode: window.isStudentMode, activeQuestions: window.activeQuestions, 
        globalQuestionIndex: window.globalQuestionIndex, timeLeft: window.timeLeft, 
        answerHistory: window.answerHistory, currentStudentTelemetryKey: window.currentStudentTelemetryKey || null,
        missionId: window.CURRENT_MISSION_ID || null 
    }); 
};

window.clearProgress = function() { window.removeStorageKey(window.STORAGE_KEYS.state); };

window.resumeGame = function() { 
    const st = window.readJSONKey(window.STORAGE_KEYS.state, null); 
    if(!st || !Array.isArray(st.teams) || !Array.isArray(st.activeQuestions) || !st.activeQuestions.length) { 
        window.clearProgress(); 
        if (typeof window.showSystemMessage === 'function') window.showSystemMessage("Aviso", "Não há partida salva válida para retomar.", "info"); 
        return; 
    } 
    window.teams = st.teams; window.currentTeamIndex = Number.isInteger(st.currentTeamIndex) ? st.currentTeamIndex : 0; 
    window.gameMode = st.gameMode || 'single'; window.isStudentMode = !!st.isStudentMode; 
    window.activeQuestions = st.activeQuestions; window.globalQuestionIndex = Number.isInteger(st.globalQuestionIndex) ? st.globalQuestionIndex : 0; 
    window.timeLeft = Number.isFinite(st.timeLeft) ? st.timeLeft : 30; window.answerHistory = Array.isArray(st.answerHistory) ? st.answerHistory : []; 
    window.currentStudentTelemetryKey = st.currentStudentTelemetryKey || window.currentStudentTelemetryKey || null; 
    
    window.qsa('.screen').forEach(screen => screen.classList.remove('active')); 
    const screenGame = window.el('screen-game') || document.getElementById('tela-jogo');
    if(screenGame) screenGame.classList.add('active'); 
    const hudTeam = window.el('hud-team');
    if(hudTeam) hudTeam.style.display = window.gameMode === 'multi' ? 'flex' : 'none'; 
    if(window.audioSystem && typeof window.audioSystem.stopAll === 'function') {
        window.audioSystem.stopAll(); window.audioSystem.play('suspense', true); 
    }
    if (typeof window.loadQuestion === 'function') window.loadQuestion(); 
};

window.recordAnswerSnapshot = function(question, selectedIndex, wasCorrect, team, reason = 'answer') { 
    window.answerHistory.push({ 
        questionId: question ? question.id : null, bncc: question ? (question.bncc || "N/A") : "N/A", 
        proficiencia: question ? (question.proficiencia || "N/A") : "N/A", componente: question ? (question.componente || "N/A") : "N/A", 
        teamName: team ? team.name : null, selectedIndex: selectedIndex, selectedText: (question && selectedIndex !== null && selectedIndex >= 0) ? question.options[selectedIndex] : null, 
        correctIndex: question ? question.answer : null, wasCorrect: wasCorrect, reason: reason, levelAfter: team ? team.level : null, timestamp: new Date().toISOString() 
    }); 
    window.saveProgress(); 
};

/* STREAMING_CHUNK:Gatilho do Jogo Oficial do Professor... */
window.startGame = function() {
    window.clearProgress(); window.isStudentMode = false; 
    const errDiv = window.el('setup-error-msg'); if(errDiv) errDiv.remove();
    
    let selectedYears = Array.from(window.qsa('#screen-setup input[id^="ano"]:checked')).map(cb => cb.value.toLowerCase()); 
    let selectedMundos = Array.from(window.qsa('#screen-setup input[id^="mundo"]:checked')).map(cb => cb.value.toLowerCase()); 
    if (selectedYears.length === 0) selectedYears = ['5º ano'];
    if (selectedMundos.length === 0) selectedMundos = ['matemática'];
    
    window.teams = [{ name: "Equipe 1", level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }];
    window.gameMode = 'single'; window.currentTeamIndex = 0;
    
    if(!window.allQuestions || window.allQuestions.length === 0) window.initGameData();
    
    let filteredQuestions = window.allQuestions.filter(q => { 
        let matchesYear = selectedYears.some(y => String(q.ano).includes(y) || String(q.category).toLowerCase().includes(y)); 
        let matchesMundo = selectedMundos.some(m => String(q.componente).includes(m)); 
        return matchesYear && matchesMundo; 
    });
    
    if (filteredQuestions.length === 0) filteredQuestions = window.allQuestions;
    filteredQuestions = filteredQuestions.sort(() => Math.random() - 0.5); 
    
    window.activeQuestions = []; 
    while(window.activeQuestions.length < 16) { 
        for(let q of filteredQuestions) if(window.activeQuestions.length < 16) window.activeQuestions.push(q);
    } 
    window.globalQuestionIndex = 0; 
    const setupScreen = window.el('screen-setup'); if(setupScreen) setupScreen.classList.remove('active'); 
    window.fireUpGame();
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
    
    // Suporta radio buttons
    var diffRadios = document.querySelector('input[name="student-diff"]:checked');
    var difSelecionada = diffRadios ? diffRadios.value.toLowerCase() : (window.dificuldadeModoTreino || "fácil");
    
    var tagsAceitas = [];
    if (difSelecionada === "fácil") tagsAceitas = ["básico", "b1", "b2", "fácil", "baixo"];
    else if (difSelecionada === "médio") tagsAceitas = ["intermediário", "b3", "b4", "médio", "adequado", "a1", "a2"];
    else if (difSelecionada === "difícil") tagsAceitas = ["avançado", "b5", "b6", "difícil", "alto", "a3"];

    var numAnoBusca = String(anoEscolar).replace(/\D/g, "");

    // Garante que o banco exista! Se estiver vazio, tenta ler novamente.
    if(!window.allQuestions || window.allQuestions.length === 0) {
        if(typeof window.initGameData === 'function') window.initGameData();
    }

    // Filtro OMNI-DIRECIONAL 
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

    // SISTEMA ANTI-TELA PRETA: Ignora Dificuldade
    if (window.questoesDaPartida.length === 0) {
        window.questoesDaPartida = window.allQuestions.filter(function(q) {
            var qAno = q.ano; var qComp = q.componente;
            return (qAno.includes(String(anoEscolar).toLowerCase()) || qAno.includes(numAnoBusca) || qAno === numAnoBusca) && qComp.includes(String(disc).toLowerCase());
        });
        
        // PÂNICO TOTAL: Injeta TUDO
        if (window.questoesDaPartida.length === 0) {
            console.warn("⚠️ Filtro não encontrou nada. Carregando o banco global massivo.");
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

window.startStudentGame = window.startStudentGameSafe; // Alias para retrocompatibilidade

/* STREAMING_CHUNK:Inicializando Visualizações e Áudio... */
window.fireUpGame = function() {
    const hudTeam = window.el('hud-team');
    if(hudTeam) hudTeam.style.display = window.gameMode === 'multi' ? 'flex' : 'none'; 
    const screenGame = window.el('screen-game') || document.getElementById('tela-jogo');
    if(screenGame) screenGame.classList.add('active'); 
    
    if(window.audioSystem) {
        window.audioSystem.stopAll(); window.audioSystem.play('abertura'); window.audioSystem.play('voice_comecar'); 
        setTimeout(() => { window.audioSystem.play('suspense', true); }, 5000); 
    }
    if(typeof window.loadQuestion === 'function') window.loadQuestion(); 
};

/* STREAMING_CHUNK:O Motor de Renderização de Questão na Tela... */
window.loadQuestion = function() {
    window.isWaitingAnswer = false; 
    const team = window.teams[window.currentTeamIndex]; 
    const q = window.activeQuestions[window.globalQuestionIndex]; 
    
    if(window.gameMode === 'multi') { const currTeamHud = window.el('current-team-name-hud'); if(currTeamHud) currTeamHud.innerText = team.name; }
    if(typeof window.restoreHelpsUI === 'function') window.restoreHelpsUI(); 
    
    const qCount = window.el('q-counter'); if(qCount) qCount.innerText = team.level + 1;
    const bgGame = window.el('bg-game'); if(bgGame) bgGame.classList.remove('dim-bg-extreme'); 
    const charHost = window.el('char-host'); if(charHost) charHost.classList.remove('dim-bg-extreme'); 
    const qPanel = window.el('question-panel-wrapper'); if(qPanel) qPanel.classList.remove('dim-bg-extreme');
    const s1 = window.el('spot-1'); if(s1) s1.className = 'spotlight spot-left spot-white'; 
    const s2 = window.el('spot-2'); if(s2) s2.className = 'spotlight spot-right spot-white';
    if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('normal');
    
    const qWrapper = window.el('question-panel-wrapper') || window.el('main-q-box'); 
    if(qWrapper) { qWrapper.classList.remove('animate-q-slide'); void qWrapper.offsetWidth; qWrapper.classList.add('animate-q-slide'); }
    const awDisp = window.el('award-display'); if(awDisp) awDisp.classList.remove('animate-award-pop');
    
    let profColor = 'text-white'; 
    let profDisplay = (q.proficiencia || '').toUpperCase(); 
    let prof = q.proficiencia ? q.proficiencia.toLowerCase() : '';
    if (prof.includes('básico') || prof.includes('fácil') || prof.includes('baixo')) { profColor = 'text-orange-400 drop-shadow-md'; profDisplay = 'BÁSICO'; } 
    else if (prof.includes('adequado') || prof.includes('médio') || prof.includes('a1') || prof.includes('a2')) { profColor = 'text-green-400 drop-shadow-md'; profDisplay = 'ADEQUADO'; } 
    else if (prof.includes('avançado') || prof.includes('difícil') || prof.includes('a3')) { profColor = 'text-blue-400 drop-shadow-md'; profDisplay = 'AVANÇADO'; }
    
    const qCat = window.el('q-category');
    if(qCat) qCat.innerHTML = `${(q.componente || '').toUpperCase()} &bull; ${(q.ano || '').toUpperCase()} &bull; PROFICIÊNCIA: <span class="${profColor}">${profDisplay}</span>`; 
    
    const qTextEl = window.el('q-text') || document.getElementById('question-text'); 
    if(qTextEl) {
        qTextEl.innerHTML = ''; qTextEl.classList.add('typing-cursor');
        let txt = q.text; let idx = 0; 
        if(window.typeWriterTimeout) clearTimeout(window.typeWriterTimeout);
        function type() { 
            if(idx < txt.length) { 
                qTextEl.innerHTML = txt.substring(0, idx+1); idx++; 
                window.typeWriterTimeout = setTimeout(type, 25); 
            } else { qTextEl.classList.remove('typing-cursor'); } 
        }
        type();
    }
    
    const btnHologram = window.el('btn-toggle-hologram'); const dragImgEl = window.el('drag-q-image'); 
    if(typeof window.closeDraggableHologram === 'function') window.closeDraggableHologram(); 
    if(btnHologram) { btnHologram.classList.add('hidden'); btnHologram.classList.remove('flex'); }
    if(dragImgEl) dragImgEl.src = "";
    
    if (q.image_url && dragImgEl) { 
        if(typeof window.normalizeImageUrl === 'function') {
            const finalUrl = window.normalizeImageUrl(q.image_url); 
            dragImgEl.onload = () => { if(btnHologram){ btnHologram.classList.remove('hidden'); btnHologram.classList.add('flex'); } }; 
            dragImgEl.src = finalUrl; 
        }
    }
    
    const qid = window.el('q-id'); if(qid) qid.innerText = q.id !== "SEM-ID" ? `ID: ${q.id}` : ""; 
    if(awDisp) awDisp.innerText = window.awards[team.level] || "1 MILHÃO"; 
    const sAwDisp = window.el('stop-award-display'); if(sAwDisp) sAwDisp.innerText = team.level === 0 ? "0" : window.awards[team.level - 1]; 
    const lAwDisp = window.el('lose-award-display'); if(lAwDisp) lAwDisp.innerText = window.loseAwards[team.level] || "0";
    
    const container = window.el('alternatives-container') || document.getElementById('options-container'); 
    if(container) {
        container.innerHTML = ''; 
        const letters = ['A', 'B', 'C', 'D'];
        if(window.audioSystem) window.audioSystem.play('pergunta'); 
        if (team.level === 0) { 
            setTimeout(() => { if (team.level === 0 && !window.isWaitingAnswer && window.audioSystem) window.audioSystem.play('voice_pergunta'); }, 3500); 
        } else { if(window.audioSystem) window.audioSystem.play('voice_proxima'); }
        
        q.options.forEach((opt, i) => { 
            const btn = window.ce('button'); 
            btn.className = 'btn-alternative min-h-[3.5rem] rounded-full flex items-center px-4 py-2 relative overflow-hidden group transition-all w-full'; 
            btn.onclick = () => window.selectAnswer(i, btn); 
            btn.innerHTML = `<div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 z-10"><span class="text-red-700 font-bold text-lg font-orbitron">${letters[i]}</span></div><span class="text-white font-bold text-sm md:text-base w-full text-center z-10 font-montserrat drop-shadow-md">${opt}</span>`; 
            container.appendChild(btn); 
        });
    }
    
    if(typeof window.resetTimer === 'function') window.resetTimer(); 
    window.saveProgress(); window.questionStartTime = Date.now();
};

/* STREAMING_CHUNK:Lógica base de Timer e Respostas... */
window.resetTimer = function() { 
    clearInterval(window.timerInterval); 
    if (window.audioTimeout) clearTimeout(window.audioTimeout); 
    window.timeLeft = 30; 
    const timerCircle = window.el('timer-circle'); const timerDisplay = window.el('timer-display'); const gameVig = window.el('game-vignette');
    if(timerCircle) timerCircle.classList.remove('timer-panic'); if(timerDisplay) timerDisplay.classList.remove('text-red-500'); if(gameVig) gameVig.classList.remove('vignette-panic'); 
    if(timerDisplay) timerDisplay.innerText = window.timeLeft; window.isAudioPlaying = true; 
    if(window.audioSystem) {
        window.audioSystem.voice_pergunta.onended = () => { window.isAudioPlaying = false; }; 
        window.audioSystem.voice_proxima.onended = () => { window.isAudioPlaying = false; }; 
    }
    window.audioTimeout = setTimeout(() => { window.isAudioPlaying = false; }, window.teams[window.currentTeamIndex].level === 0 ? 25000 : 6000); 
    
    window.timerInterval = setInterval(() => { 
        if(window.isWaitingAnswer || window.isAudioPlaying) return; 
        window.timeLeft--; if(timerDisplay) timerDisplay.innerText = window.timeLeft; 
        if(window.timeLeft <= 5) { if(gameVig) gameVig.classList.add('vignette-panic'); } 
        if(window.timeLeft === 10) { if(timerCircle) timerCircle.classList.add('timer-panic'); if(timerDisplay) timerDisplay.classList.add('text-red-500'); } 
        if(window.timeLeft <= 0) { clearInterval(window.timerInterval); window.forceTimeOut(); } 
    }, 1000); 
};
window.pauseTimer = function() { clearInterval(window.timerInterval); if(window.el('timer-circle')) window.el('timer-circle').classList.remove('timer-panic'); if(window.el('game-vignette')) window.el('game-vignette').classList.remove('vignette-panic'); };
window.resumeTimer = function() { window.resetTimer(); };

window.forceTimeOut = function() { 
    if(typeof window.closeDraggableHologram === 'function') window.closeDraggableHologram(); 
    if(window.el('game-vignette')) window.el('game-vignette').classList.remove('vignette-panic'); 
    const team = window.teams[window.currentTeamIndex]; team.status = 'lost'; window.teams[window.currentTeamIndex].responseTimes.push(30000); 
    if(window.audioSystem) { window.audioSystem.stopAll(); window.audioSystem.play('errou'); }
    window.isWaitingAnswer = true; 
    if(window.el('spot-1')) window.el('spot-1').className = 'spotlight spot-left spot-red'; if(window.el('spot-2')) window.el('spot-2').className = 'spotlight spot-right spot-red'; 
    if(window.el('main-q-box')) window.el('main-q-box').classList.add('animate-shake'); 
    if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('erro'); 
    const q = window.activeQuestions[window.globalQuestionIndex]; window.lastAnsweredQuestion = q; window.recordAnswerSnapshot(q, null, false, team, 'timeout'); 
    
    window.qsa('.btn-alternative').forEach((btn, idx) => { btn.style.pointerEvents = 'none'; if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); else btn.classList.add('correct'); }); 
    const tempoAudio = Math.random() > 0.5 ? 'voice_tempo1' : 'voice_tempo2'; 
    if(window.audioSystem) window.audioSystem.play(tempoAudio); 
    let tempoTriggered = false; const goTempo = () => { if(tempoTriggered) return; tempoTriggered = true; setTimeout(() => { if(window.el('main-q-box')) window.el('main-q-box').classList.remove('animate-shake'); if(typeof window.showFeedbackAndNext === 'function') window.showFeedbackAndNext("Tempo Esgotado!", 'time'); }, 800); }; 
    if(window.audioSystem) { window.audioSystem[tempoAudio].onended = goTempo; window.audioSystem[tempoAudio].onerror = goTempo; }
    setTimeout(goTempo, 8000); 
};

window.selectAnswer = function(selectedIndex, buttonElement) { 
    if(typeof window.closeDraggableHologram === 'function') window.closeDraggableHologram(); 
    if (window.isWaitingAnswer) return; 
    clearInterval(window.timerInterval); if(window.el('timer-circle')) window.el('timer-circle').classList.remove('timer-panic'); if(window.el('game-vignette')) window.el('game-vignette').classList.remove('vignette-panic'); 
    window.pendingAnswerIndex = selectedIndex; window.pendingButtonElement = buttonElement; 
    if (window.questionStartTime) { window.teams[window.currentTeamIndex].responseTimes.push(Date.now() - window.questionStartTime); } 
    
    if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('tenso_cinematic'); 
    if(window.el('spot-1')) window.el('spot-1').className = 'spotlight spot-left spot-tension'; if(window.el('spot-2')) window.el('spot-2').className = 'spotlight spot-right spot-tension'; 
    const q = window.activeQuestions[window.globalQuestionIndex]; const letters = ['A', 'B', 'C', 'D']; 
    if(window.el('confirm-letter')) window.el('confirm-letter').innerText = letters[selectedIndex]; if(window.el('confirm-text')) window.el('confirm-text').innerText = q.options[selectedIndex]; 
    buttonElement.classList.add('pulse-answer'); 
    const mConf = window.el('modal-confirm'); if(mConf) { mConf.classList.remove('hidden'); mConf.classList.add('flex'); }
    
    if(window.audioSystem) {
        window.audioSystem.stop('suspense'); window.audioSystem.play('certeza'); 
        const voiceName = Math.random() > 0.5 ? 'voice_certeza' : 'voice_posso'; window.audioSystem.play(voiceName); 
        const btnSim = window.el('btn-confirm-sim'); const btnNao = window.el('btn-confirm-nao'); 
        if(btnSim) btnSim.classList.add('opacity-40', 'pointer-events-none', 'grayscale'); if(btnNao) btnNao.classList.add('opacity-40', 'pointer-events-none', 'grayscale'); 
        const enableButtons = () => { if(btnSim) btnSim.classList.remove('opacity-40', 'pointer-events-none', 'grayscale'); if(btnNao) btnNao.classList.remove('opacity-40', 'pointer-events-none', 'grayscale'); }; 
        window.audioSystem[voiceName].onended = enableButtons; window.audioSystem[voiceName].onerror = enableButtons; setTimeout(enableButtons, 3500); 
    }
    setTimeout(() => { const cb = window.el('confirm-box'); if(cb){ cb.classList.remove('scale-95'); cb.classList.add('scale-100'); } }, 10); 
};

window.cancelAnswer = function() { 
    window.teams[window.currentTeamIndex].responseTimes.pop(); window.questionStartTime = Date.now(); 
    if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('normal'); 
    if(window.el('spot-1')) window.el('spot-1').className = 'spotlight spot-left spot-white'; if(window.el('spot-2')) window.el('spot-2').className = 'spotlight spot-right spot-white'; 
    const cb = window.el('confirm-box'); if(cb) { cb.classList.remove('scale-100'); cb.classList.add('scale-95'); }
    setTimeout(() => { const mc = window.el('modal-confirm'); if(mc){ mc.classList.add('hidden'); mc.classList.remove('flex'); } }, 300); 
    if(window.pendingButtonElement) window.pendingButtonElement.classList.remove('pulse-answer'); 
    window.pendingAnswerIndex = null; window.pendingButtonElement = null; 
    if(window.audioSystem) { window.audioSystem.stop('certeza'); window.audioSystem.play('suspense', true); }
    window.resumeTimer(); 
};

window.confirmAnswer = function() { 
    const mConf = window.el('modal-confirm'); if(mConf){ mConf.classList.add('hidden'); mConf.classList.remove('flex'); }
    window.isWaitingAnswer = true; const team = window.teams[window.currentTeamIndex]; const q = window.activeQuestions[window.globalQuestionIndex]; 
    
    if(window.el('bg-game')) window.el('bg-game').classList.add('dim-bg-extreme'); if(window.el('char-host')) window.el('char-host').classList.add('dim-bg-extreme'); if(window.el('question-panel-wrapper')) window.el('question-panel-wrapper').classList.add('dim-bg-extreme'); 
    if(window.el('spot-1')) { window.el('spot-1').className = 'spotlight spot-left'; window.el('spot-1').style.opacity = '0'; } 
    if(window.el('spot-2')) { window.el('spot-2').className = 'spotlight spot-right'; window.el('spot-2').style.opacity = '0'; }
    
    window.qsa('.btn-alternative').forEach(btn => { if(btn !== window.pendingButtonElement) { btn.classList.add('tension-dim'); btn.style.pointerEvents = 'none'; } }); 
    if(window.pendingButtonElement) { window.pendingButtonElement.classList.remove('pulse-answer'); window.pendingButtonElement.classList.add('animate-suspense', 'tension-focus'); }
    
    window.tensionFlashesInterval = setInterval(() => { if(Math.random() > 0.5) { const f = window.el('camera-flash-overlay'); if(f){ f.classList.remove('do-flash'); void f.offsetWidth; f.classList.add('do-flash'); } } }, 600); 
    
    setTimeout(() => { 
        clearInterval(window.tensionFlashesInterval); if(window.pendingButtonElement) window.pendingButtonElement.classList.remove('animate-suspense', 'tension-focus'); 
        if(window.el('bg-game')) window.el('bg-game').classList.remove('dim-bg-extreme'); if(window.el('char-host')) window.el('char-host').classList.remove('dim-bg-extreme'); if(window.el('question-panel-wrapper')) window.el('question-panel-wrapper').classList.remove('dim-bg-extreme'); 
        window.qsa('.btn-alternative').forEach(btn => btn.classList.remove('tension-dim')); if(window.el('spot-1')) window.el('spot-1').style.opacity = ''; if(window.el('spot-2')) window.el('spot-2').style.opacity = ''; 
        
        const isCorrect = window.pendingAnswerIndex === q.answer; 
        if (isCorrect) { 
            if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('acerto'); 
            if(window.el('spot-1')) window.el('spot-1').className = 'spotlight spot-left spot-green'; if(window.el('spot-2')) window.el('spot-2').className = 'spotlight spot-right spot-green'; 
            team.level++; window.globalQuestionIndex++; window.lastAnsweredQuestion = q; window.recordAnswerSnapshot(q, window.pendingAnswerIndex, true, team); 
            if(window.audioSystem) { window.audioSystem.stopAll(); window.audioSystem.play('certa'); window.audioSystem.play('voice_acerto'); }
            if(window.pendingButtonElement) window.pendingButtonElement.classList.add('flash-correct'); if(window.el('award-display')) window.el('award-display').classList.add('animate-award-pop'); 
            window.qsa('.btn-alternative').forEach((btn, idx) => { if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); }); 
            
            const floatScore = window.ce('div'); floatScore.className = 'floating-score'; floatScore.innerText = `+${window.awards[team.level-1]}`; if(window.pendingButtonElement) window.pendingButtonElement.appendChild(floatScore); 
            
            let nextActionTriggered = false; const goNext = () => { 
                if (nextActionTriggered) return; nextActionTriggered = true; 
                setTimeout(() => { 
                    const gameScreen = window.el('screen-game') || document.getElementById('tela-jogo'); if(gameScreen){ gameScreen.style.transition = 'opacity 0.6s ease'; gameScreen.style.opacity = '0'; }
                    setTimeout(() => { 
                        if(team.level < 16) { 
                            if(gameScreen) gameScreen.style.opacity = '1'; if(typeof window.advanceToNextTurn === 'function') window.advanceToNextTurn(); 
                        } else { 
                            team.status = 'won'; if(window.audioSystem) { window.audioSystem.stopAll(); window.audioSystem.play('vitoria'); }
                            if(window.el('final-win-award')) window.el('final-win-award').innerText = "1 MILHÃO"; if(window.el('end-win-team')) window.el('end-win-team').innerText = window.isStudentMode ? `Fim de Treino: ${team.name}` : `Equipe Campeã: ${team.name}`; 
                            const winScreen = window.el('screen-end-win') || document.getElementById('tela-resultado'); if(winScreen){ winScreen.classList.remove('hidden'); winScreen.classList.add('active', 'flex'); }
                            if(typeof window.checkGameEnd === 'function') window.checkGameEnd('win'); 
                            setTimeout(() => { const winBox = window.el('win-box'); if(winBox){ winBox.classList.remove('scale-90', 'opacity-0'); winBox.classList.add('scale-100', 'opacity-100'); } if(typeof window.triggerConfetti === 'function') window.triggerConfetti(); }, 300); 
                        } 
                    }, 600); 
                }, 1200); 
            }; 
            if(window.audioSystem) { window.audioSystem.voice_acerto.onended = goNext; window.audioSystem.voice_acerto.onerror = goNext; } setTimeout(goNext, 8000); 
        } else { 
            if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('erro'); 
            if(window.el('spot-1')) window.el('spot-1').className = 'spotlight spot-left spot-red'; if(window.el('spot-2')) window.el('spot-2').className = 'spotlight spot-right spot-red'; if(window.el('main-q-box')) window.el('main-q-box').classList.add('animate-shake'); 
            team.status = 'lost'; window.globalQuestionIndex++; window.lastAnsweredQuestion = q; window.recordAnswerSnapshot(q, window.pendingAnswerIndex, false, team); 
            if(window.audioSystem) { window.audioSystem.stopAll(); window.audioSystem.play('errou'); window.audioSystem.play('voice_errou'); }
            if(window.pendingButtonElement) window.pendingButtonElement.classList.add('wrong'); window.qsa('.btn-alternative')[q.answer].classList.add('correct'); window.qsa('.btn-alternative').forEach((btn, idx) => { if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); }); 
            
            let erroTriggered = false; const goErro = () => { 
                if (erroTriggered) return; erroTriggered = true; 
                setTimeout(() => { if(window.el('main-q-box')) window.el('main-q-box').classList.remove('animate-shake'); if(typeof window.showFeedbackAndNext === 'function') window.showFeedbackAndNext("Resposta Incorreta!", 'wrong'); }, 800); 
            }; 
            if(window.audioSystem) { window.audioSystem.voice_errou.onended = goErro; window.audioSystem.voice_errou.onerror = goErro; } setTimeout(goErro, 8000); 
        } 
    }, 5000); 
};

/* STREAMING_CHUNK:Transições de Telas e Modais Finais e QR CODE... */
window.checkGameEnd = function(screenType) { 
    let activeCount = window.teams.filter(t => t.status === 'playing').length; 
    const btnText = window.el(`btn-end-${screenType}-text`) || window.el('btn-voltar-menu'); 
    
    if (activeCount === 0) { 
        if(btnText) btnText.innerText = "VER RESULTADOS"; 
        
        // Atacha o clique para mostrar o leaderboard
        const btn = window.el(`btn-end-${screenType}`) || window.el('btn-voltar-menu');
        if (btn) {
            btn.onclick = () => { 
                const s = window.el(`screen-end-${screenType}`) || document.getElementById('tela-resultado'); 
                if(s) s.classList.remove('active'); 
                window.showLeaderboard(); 
            }; 
        }
    } 
    else { 
        if(btnText) btnText.innerText = "CONTINUAR JOGO"; 
        const btn = window.el(`btn-end-${screenType}`);
        if(btn) {
            btn.onclick = () => { 
                const s = window.el(`screen-end-${screenType}`); if(s) s.style.opacity = '0'; 
                setTimeout(() => { if(s) s.classList.remove('active'); const sg = window.el('screen-game') || document.getElementById('tela-jogo'); if(sg) sg.classList.add('active'); window.advanceToNextTurn(); }, 500); 
            }; 
        }
    } 
};
window.advanceToNextTurn = function() { 
    let next = (window.currentTeamIndex + 1) % window.teams.length; let found = false; let loops = 0; 
    while (loops < window.teams.length) { if (window.teams[next].status === 'playing') { found = true; break; } next = (next + 1) % window.teams.length; loops++; } 
    if (found) { window.currentTeamIndex = next; if(typeof window.showTurnTransition === 'function') window.showTurnTransition(window.teams[window.currentTeamIndex].name, () => { window.loadQuestion(); if(window.audioSystem) window.audioSystem.play('suspense', true); }); } 
    else { window.showLeaderboard(); } 
};
window.useHelp = function(type) { 
    const team = window.teams[window.currentTeamIndex]; if (type !== 'pular' && team.helps[type]) return; 
    if (type === 'pular' && team.helps.pular >= 3) { if(typeof window.showSystemMessage === 'function') window.showSystemMessage("Aviso", "Sem pulos disponíveis.", "info"); if(window.audioSystem) window.audioSystem.play('voice_sem_pulos'); return; } 
    if(typeof window.closeHelp === 'function') window.closeHelp(); 
    if (type === 'eliminar') { 
        if(window.audioSystem) window.audioSystem.play('eliminar'); if(typeof window.pauseTimer === 'function') window.pauseTimer(); team.helps.eliminar = true; window.saveProgress(); const cartas = [0, 1, 2, 3].sort(() => Math.random() - 0.5); const container = window.el('cards-container'); if(container) { container.innerHTML = ''; cartas.forEach((val) => { container.innerHTML += `<div class="w-20 h-32 cursor-pointer flip-card" onclick="window.chooseCarta(${val}, this)"><div class="flip-card-inner w-full h-full relative"><div class="flip-card-front absolute inset-0 bg-blue-900 border-2 border-yellow-400 rounded-xl flex items-center justify-center text-white font-black">?</div><div class="flip-card-back absolute inset-0 bg-white border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center p-2 text-black"><span class="text-blue-950 font-black font-orbitron text-xs">${val===0?'REI':val===1?'ÁS':val===2?'DUAS':'TRÊS'}</span></div></div></div>`; }); } const mc = window.el('modal-cartas'); if(mc) { mc.classList.remove('hidden'); mc.classList.add('flex'); } 
    } else if (type === 'palpite') { 
        if(window.audioSystem) { window.audioSystem.play('plateia'); window.audioSystem.play('voice_palpite'); } if(typeof window.pauseTimer === 'function') window.pauseTimer(); team.helps.palpite = true; window.saveProgress(); const q = window.activeQuestions[window.globalQuestionIndex]; const container = window.el('audience-bars'); if(container) { container.innerHTML = ''; [0, 1, 2, 3].forEach(i => { let v = i === q.answer ? 65 : 11; container.innerHTML += `<div class="flex items-center w-full gap-4 text-xs font-bold"><div class="w-6 h-6 rounded-full bg-blue-950 border border-cyan-400 flex items-center justify-center">${['A','B','C','D'][i]}</div><div class="w-full bg-black/50 h-6 rounded-full relative overflow-hidden"><div class="h-full bg-yellow-500" style="width:${v}%"></div><span class="absolute right-4 text-white">${v}%</span></div></div>`; }); } const ma = window.el('modal-audience'); if(ma) { ma.classList.remove('hidden'); ma.classList.add('flex'); } 
    } else if (type === 'dica') { 
        if(window.audioSystem) { window.audioSystem.play('dica'); window.audioSystem.play('voice_dica'); } if(typeof window.pauseTimer === 'function') window.pauseTimer(); team.helps.dica = true; window.saveProgress(); const q = window.activeQuestions[window.globalQuestionIndex]; const container = window.el('dica-boards'); if(container) { container.innerHTML = ''; [1,2,3].forEach(idx => { container.innerHTML += `<div class="flex-1 bg-blue-950 border border-yellow-500 rounded-xl p-4 text-center"><span class="text-cyan-400 text-[10px] block mb-2">Especialista ${idx}</span><div class="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto text-red-700 font-bold mb-2">${['A','B','C','D'][q.answer]}</div><p class="text-white text-[11px] truncate">${q.options[q.answer]}</p></div>`; }); } const md = window.el('modal-dica'); if(md) { md.classList.remove('hidden'); md.classList.add('flex'); } 
    } else if (type === 'pular') { const sl = window.el('skips-left'); if(sl) sl.innerText = 3 - team.helps.pular; const mp = window.el('modal-pular'); if(mp) { mp.classList.remove('hidden'); mp.classList.add('flex'); } } 
};
window.chooseCarta = function(val, element) { 
    element.classList.add('flipped'); window.qsa('#cards-container .flip-card').forEach(c=>c.style.pointerEvents='none'); 
    setTimeout(() => { const mc = window.el('modal-cartas'); if(mc) { mc.classList.add('hidden'); mc.classList.remove('flex'); } const btns = window.qsa('#alternatives-container .btn-alternative') || window.qsa('#options-container .btn-alternative'); const q = window.activeQuestions[window.globalQuestionIndex]; let wrong = [0,1,2,3].filter(i => i!==q.answer).sort(() => Math.random() - 0.5); for(let k=0; k<val; k++) if(wrong[k]!==undefined && btns[wrong[k]]) btns[wrong[k]].classList.add('animate-eliminate'); if(typeof window.resumeTimer === 'function') window.resumeTimer(); }, 2000); 
};
window.confirmStop = function() { 
    window.isWaitingAnswer = true; const mp = window.el('modal-parar'); if(mp) { mp.classList.add('hidden'); mp.classList.remove('flex'); } const val = window.teams[window.currentTeamIndex].level === 0 ? "0" : window.awards[window.teams[window.currentTeamIndex].level - 1]; 
    window.teams[window.currentTeamIndex].status = 'stopped'; window.globalQuestionIndex++; window.saveProgress(); const fsa = window.el('final-stop-award'); if(fsa) fsa.innerText = val; const est = window.el('end-stop-team'); if(est) est.innerText = `Equipe Parou: ${window.teams[window.currentTeamIndex].name}`; 
    if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('consolando'); const sg = window.el('screen-game') || document.getElementById('tela-jogo'); if(sg) sg.classList.remove('active'); const ses = window.el('screen-end-stop'); if(ses) ses.classList.add('active'); window.checkGameEnd('stop'); 
};
window.confirmSkip = function() { if(typeof window.cancelSkip === 'function') window.cancelSkip(); window.teams[window.currentTeamIndex].helps.pular++; window.globalQuestionIndex++; window.saveProgress(); if(window.globalQuestionIndex < window.activeQuestions.length) window.loadQuestion(); else if(typeof window.showSystemMessage === 'function') window.showSystemMessage("Fim", "Sem perguntas para pular.", "error"); };

/* STREAMING_CHUNK: Leaderboard e Geração de Código QR... */
window.showLeaderboard = function() {
    if(typeof window.closeDraggableHologram === 'function') window.closeDraggableHologram(); 
    window.clearProgress(); 
    if(window.audioSystem) { window.audioSystem.stopAll(); window.audioSystem.play('vitoria'); }
    
    // Esconde todas as telas
    window.qsa('.screen').forEach(s => { s.classList.remove('active', 'flex'); s.style.display = 'none'; });
    
    let leaderboardScreen = window.el('screen-leaderboard') || document.getElementById('tela-resultado'); 
    if (!leaderboardScreen) { 
        leaderboardScreen = window.ce('div'); 
        leaderboardScreen.id = 'screen-leaderboard'; 
        document.body.appendChild(leaderboardScreen); 
    } 
    leaderboardScreen.classList.add('active', 'flex');
    leaderboardScreen.style.display = 'flex';
    
    const sortedTeams = [...window.teams].sort((a, b) => b.level === a.level ? 0 : b.level - a.level);
    
    let rankingHTML = sortedTeams.map((t, index) => {
        let prize = t.level === 0 ? "0" : (window.awards[t.level - 1] || "1 MILHÃO"); 
        if (t.status === 'won' || t.level >= 16) prize = "1 MILHÃO";
        let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        return `<div class="flex items-center justify-between p-3 md:p-4 border-2 rounded-2xl bg-blue-900/80 border-blue-400 w-full mb-2"><div class="flex items-center gap-4"><span class="text-3xl">${medal}</span><span class="text-xl font-bold font-orbitron text-white">${t.name}</span></div><div class="bg-black/50 px-4 py-1.5 rounded-xl border border-white/10"><span class="text-xl font-black text-yellow-300 font-orbitron">${prize}</span></div></div>`;
    }).join('');
    
    let actionButtonsHTML = '';
    
    // GERA O QR CODE APENAS PARA O MODO ALUNO
    if (window.isStudentMode && window.teams.length > 0) {
        const sumTimes = window.teams[0].responseTimes.reduce((a,b)=>a+b, 0); 
        const calculatedAvg = window.teams[0].responseTimes.length ? Math.floor(sumTimes / window.teams[0].responseTimes.length) : 30000;
        
        let telemetry = {};
        if (typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) {
            telemetry = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); 
        }
        
        const attemptsCount = telemetry[window.currentStudentTelemetryKey] ? telemetry[window.currentStudentTelemetryKey].attempts : 1;
        
        const teamHistory = window.answerHistory.filter(a => a.teamName === window.teams[0].name).map(a => ({
            qid: a.questionId, bncc: a.bncc, prof: a.proficiencia, comp: a.componente, 
            sel: a.selectedIndex, cor: a.correctIndex, wasCorrect: a.wasCorrect, selTxt: a.selectedText, reason: a.reason
        }));
        
        const syncObj = { 
            type: 'student_training', 
            student: window.teams[0].name, 
            level: window.teams[0].level, 
            date: new Date().toISOString().split('T')[0], 
            timestamp: Date.now(), 
            attempts: attemptsCount, 
            avgTimeMs: calculatedAvg, 
            history: teamHistory, 
            missionId: window.CURRENT_MISSION_ID || "Treino Livre" 
        };
        
        const syncHash = btoa(unescape(encodeURIComponent(JSON.stringify(syncObj))));
        let baseUrl = window.location.origin + window.location.pathname; 
        baseUrl = baseUrl.replace('blob:', '').endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        
        const shareText = `🏆 *Show do Brutão* 🏆\n\nOlá Professor! Terminei o meu treino.\n👤 *Herói:* ${window.teams[0].name}\n📈 *Nível Alcançado:* ${window.teams[0].level}\n\nLink do boletim:\n🔗 ${baseUrl}?sync=${syncHash}`;
        const alreadySent = telemetry[window.currentStudentTelemetryKey] ? telemetry[window.currentStudentTelemetryKey].sent : false;

        // Gera a URL do QR Code pela API Pública
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(baseUrl + "?sync=" + syncHash)}&color=020617&bgcolor=ffffff`;

        actionButtonsHTML = `
            <div class="w-full flex flex-col items-center mt-6 border-t-2 border-dashed border-cyan-800/50 pt-6">
                <h3 class="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-4">Entregar Missão ao Professor</h3>
                
                <div class="flex flex-col md:flex-row items-center gap-6 w-full">
                    <div class="flex flex-col items-center bg-black/40 p-4 rounded-2xl border border-white/10 shrink-0">
                        <div class="bg-white p-2 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                            <img src="${qrCodeUrl}" alt="QR Code Sincronização" class="w-28 h-28">
                        </div>
                        <span class="text-[9px] font-bold text-gray-400 uppercase mt-3 text-center max-w-[120px]">Professor: Use a câmera para sincronizar</span>
                    </div>

                    <div class="flex-1 flex flex-col gap-3 w-full">
                        ${alreadySent ? `<div class="w-full bg-gray-800 border border-gray-600 rounded-xl py-3.5 text-center text-xs font-bold text-gray-400">✅ ENVIADO HOJE</div>` : `<a href="https://wa.me/?text=${encodeURIComponent(shareText)}" onclick="if(window.STORAGE_KEYS) { localStorage.setItem(window.STORAGE_KEYS.telemetry, JSON.stringify({...JSON.parse(localStorage.getItem(window.STORAGE_KEYS.telemetry)||'{}'), ['${window.currentStudentTelemetryKey}']: {attempts: ${attemptsCount}, sent: true}})); }" target="_blank" class="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-700 border-2 border-green-300 py-3.5 flex items-center justify-center gap-2 text-xs font-black font-orbitron hover:scale-105 transition-transform shadow-[0_0_15px_rgba(34,197,94,0.3)] text-white">📲 ENVIAR POR WHATSAPP</a>`} 
                        
                        <div class="flex gap-2">
                            <button onclick="if(typeof window.downloadBoletimOffline === 'function') window.downloadBoletimOffline('${syncHash}', '${window.teams[0].name}')" class="flex-1 bg-cyan-950 border border-cyan-500 text-cyan-300 font-black py-3 rounded-xl text-xs font-orbitron hover:bg-cyan-900 transition-colors shadow-inner">💾 BAIXAR (.brutao)</button> 
                            <button onclick="if(typeof window.copyToClipboardFallback === 'function') window.copyToClipboardFallback('${baseUrl}?sync=${syncHash}', this)" class="flex-1 bg-blue-900 border border-blue-500 text-blue-200 font-black py-3 rounded-xl text-xs font-orbitron hover:bg-blue-800 transition-colors shadow-inner">📋 COPIAR LINK</button>
                        </div>
                    </div>
                </div>
            </div>
            <button onclick="if(typeof window.goBackToHome === 'function') { window.goBackToHome(); } else { window.location.reload(); }" class="mt-6 text-gray-500 text-[10px] font-bold uppercase font-montserrat hover:text-white transition-colors">Voltar ao Início</button>
        `;
    } else { 
        actionButtonsHTML = `<button onclick="if(typeof window.goBackToHome === 'function') { window.goBackToHome(); } else { window.location.reload(); }" class="rounded-full bg-gradient-to-b from-blue-600 to-blue-900 border-2 border-cyan-400 px-12 py-4 text-white font-black font-orbitron text-md mt-8 w-full hover:scale-105 transition-transform shadow-lg">VOLTAR AO INÍCIO</button>`; 
    }

    // Se o HTML tem o container original de leaderboard (do design Premium), injeta nele
    const leaderboardContainer = document.getElementById('leaderboard-container');
    if (leaderboardContainer) {
        leaderboardContainer.innerHTML = `
            <div class="bg-gray-800/80 p-8 rounded-3xl border border-gray-700 shadow-2xl w-full backdrop-blur-md">
                <h3 class="text-2xl font-black font-orbitron text-yellow-400 mb-6 uppercase text-center">Desempenho</h3>
                ${rankingHTML}
                ${actionButtonsHTML}
            </div>
        `;
        if (typeof window.triggerConfetti === 'function') window.triggerConfetti();
        return;
    }

    // Caso não exista o container, renderiza a tela padrão de fallback
    leaderboardScreen.innerHTML = `
        <div class="absolute inset-0 bg-black/90 z-0"></div>
        <div class="relative z-20 flex flex-col items-center w-full max-w-2xl p-6 md:p-10 bg-[#0f172a] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_50px_rgba(34,211,238,0.15)]" id="ranking-box">
            <div class="w-20 h-20 bg-cyan-900/50 border border-cyan-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">🏆</div>
            <h1 class="text-3xl md:text-4xl font-black font-orbitron mb-6 uppercase tracking-widest text-cyan-400 text-center">Fim de Jogo</h1>
            <div class="w-full overflow-y-auto max-h-64 custom-scrollbar mb-2 pr-2">${rankingHTML}</div>
            ${actionButtonsHTML}
        </div>
        <div class="absolute inset-0 pointer-events-none z-30 overflow-hidden" id="confetti-container-ranking" data-confetti-container></div>
    `;
    if (typeof window.triggerConfetti === 'function') window.triggerConfetti();
};
---

### ARQUIVO 2: O Cérebro do Jogo (Substitua todo o conteúdo)
Abra o arquivo **`logica_e_core_do_jogo.js`**, apague tudo e cole este código completo. Eu retirei todas as dependências frágeis. A partir de agora, se o jogador quiser iniciar o modo Treino e algo falhar na filtragem, o jogo misturará as questões sozinho e abrirá a tela sem perguntar nada.

```javascript:logica_e_core_do_jogo.js
// =========================================================================
// Arquivo: logica_e_core_do_jogo.js
// Função: Motor principal de partida, regras, validações e progressão
// =========================================================================

/* STREAMING_CHUNK:Globais e sistema de State... */
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

/* STREAMING_CHUNK:Gatilhos Multiplayer e Singleplayer... */
window.startGame = function() {
    window.clearProgress(); window.isStudentMode = false; 
    const errDiv = window.el('setup-error-msg'); if(errDiv) errDiv.remove();
    const showError = (msg) => { const e = window.ce('div'); e.id = 'setup-error-msg'; e.className = 'mt-4 bg-red-900/80 border-2 border-red-500 text-white font-bold p-4 rounded-xl text-center shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'; e.innerText = msg; const actionArea = window.el('setup-action-area'); if(actionArea) actionArea.prepend(e); };
    
    let selectedYears = Array.from(window.qsa('#screen-setup input[id^="ano"]:checked')).map(cb => cb.value.toLowerCase()); 
    let selectedMundos = Array.from(window.qsa('#screen-setup input[id^="mundo"]:checked')).map(cb => cb.value.toLowerCase()); 
    if (selectedYears.length === 0) selectedYears = ['5º ano'];
    if (selectedMundos.length === 0) selectedMundos = ['matemática'];
    
    window.teams = [{ name: "Jogador 1", level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }];
    window.gameMode = 'single'; window.currentTeamIndex = 0;
    
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

/* STREAMING_CHUNK:O Motor de Partida Blindado contra Bancos Vazios... */
window.startStudentGame = function() {
    window.clearProgress(); window.isStudentMode = true; 
    
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
    var tagsAceitas = ["básico"];
    if (difSelecionada === "fácil") tagsAceitas = ["básico", "b1", "b2", "fácil", "baixo"];
    else if (difSelecionada === "médio") tagsAceitas = ["intermediário", "b3", "b4", "médio", "adequado"];
    else if (difSelecionada === "difícil") tagsAceitas = ["avançado", "b5", "b6", "difícil", "alto"];

    var numAnoBusca = String(anoEscolar).replace(/\D/g, "");

    if(!window.allQuestions || window.allQuestions.length === 0) {
        if(typeof window.initGameData === 'function') window.initGameData();
    }

    // FASE 1: Filtragem Rigorosa
    window.questoesDaPartida = window.allQuestions.filter(function(q) {
        var qAno = String(q.ano || "").toLowerCase();
        var qComp = String(q.componente || q.disciplina || "").toLowerCase();
        var qNiv = String(q.proficiencia || q.nivel_proficiencia || q.nivel || "").toLowerCase();
        var bateAno = qAno.includes(String(anoEscolar).toLowerCase()) || qAno.includes(numAnoBusca) || qAno === numAnoBusca;
        var bateDisc = qComp.includes(String(disc).toLowerCase());
        var bateDificuldade = false;
        for (var x = 0; x < tagsAceitas.length; x++) {
            if (qNiv.includes(tagsAceitas[x])) { bateDificuldade = true; break; }
        }
        return bateAno && bateDisc && bateDificuldade;
    });

    // FASE 2: Tolerância de Falha (Se não achou a dificuldade, ignora a dificuldade)
    if (window.questoesDaPartida.length === 0) {
        window.questoesDaPartida = window.allQuestions.filter(function(q) {
            var qAno = String(q.ano || "").toLowerCase();
            var qComp = String(q.componente || q.disciplina || "").toLowerCase();
            return (qAno.includes(String(anoEscolar).toLowerCase()) || qAno.includes(numAnoBusca) || qAno === numAnoBusca) && qComp.includes(String(disc).toLowerCase());
        });
        
        // FASE 3: O Botão do Pânico (Se ainda der zero, joga TUDO que tiver no banco pra não travar a tela)
        if (window.questoesDaPartida.length === 0) {
            console.warn("Filtro total falhou. Carregando o banco global massivo.");
            window.questoesDaPartida = [...window.allQuestions];
        }
    }

    // Embaralhador Rápido de Questões
    for (var r = window.questoesDaPartida.length - 1; r > 0; r--) {
        var s = Math.floor(Math.random() * (r + 1));
        var aux = window.questoesDaPartida[r];
        window.questoesDaPartida[r] = window.questoesDaPartida[s];
        window.questoesDaPartida[s] = aux;
    }

    window.teams = [{ name: pName, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }];
    window.gameMode = 'single'; window.currentTeamIndex = 0;
    
    // Telemetria (Log)
    if (window.STORAGE_KEYS && typeof window.readJSONKey === 'function' && typeof window.writeJSONKey === 'function') {
        var todayStr = new Date().toISOString().split('T')[0]; 
        window.currentStudentTelemetryKey = pName.toLowerCase() + "_" + todayStr;
        var telemetry = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); 
        if (!telemetry[window.currentStudentTelemetryKey]) { telemetry[window.currentStudentTelemetryKey] = { attempts: 0, sent: false }; } 
        telemetry[window.currentStudentTelemetryKey].attempts++; 
        window.writeJSONKey(window.STORAGE_KEYS.telemetry, telemetry);
    }

    // Separa as 16 balas da pistola
    window.activeQuestions = [];
    while(window.activeQuestions.length < 16 && window.questoesDaPartida.length > 0) {
        for(let q of window.questoesDaPartida) {
            if(window.activeQuestions.length < 16) window.activeQuestions.push(q);
        }
    }
    window.globalQuestionIndex = 0;

    // Remove as telas de menu ativas
    var telas = document.querySelectorAll('.screen');
    for(var t = 0; t < telas.length; t++) telas[t].classList.remove('active');
    
    var gameScreen = document.getElementById('screen-game') || document.getElementById('tela-jogo');
    if(gameScreen) { gameScreen.classList.remove('hidden'); gameScreen.classList.add('active', 'flex'); }
    
    // Gatilho final
    if (typeof window.fireUpGame === 'function') window.fireUpGame();
    else if (typeof window.loadQuestion === 'function') window.loadQuestion();
};

/* STREAMING_CHUNK:Disparo de Transições de Tela... */
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

/* STREAMING_CHUNK:Lógica Intocável do Apresentador e HUD... */
window.loadQuestion = function() {
    window.isWaitingAnswer = false; 
    const team = window.teams[window.currentTeamIndex]; 
    const q = window.activeQuestions[window.globalQuestionIndex]; 
    
    if(window.gameMode === 'multi') window.el('current-team-name-hud').innerText = team.name;
    if(typeof window.restoreHelpsUI === 'function') window.restoreHelpsUI(); 
    window.el('q-counter').innerText = team.level + 1;
    window.el('bg-game').classList.remove('dim-bg-extreme'); 
    window.el('char-host').classList.remove('dim-bg-extreme'); 
    window.el('question-panel-wrapper').classList.remove('dim-bg-extreme');
    window.el('spot-1').className = 'spotlight spot-left spot-white'; 
    window.el('spot-2').className = 'spotlight spot-right spot-white';
    if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('normal');
    
    const qWrapper = window.el('question-panel-wrapper'); 
    qWrapper.classList.remove('animate-q-slide'); 
    void qWrapper.offsetWidth; qWrapper.classList.add('animate-q-slide');
    window.el('award-display').classList.remove('animate-award-pop');
    
    let profColor = 'text-white'; 
    let profDisplay = (q.proficiencia || '').toUpperCase(); 
    let prof = q.proficiencia ? q.proficiencia.toLowerCase() : '';
    if (prof.includes('básico') || prof.includes('fácil') || prof.includes('baixo')) { profColor = 'text-orange-400 drop-shadow-md'; profDisplay = 'BÁSICO'; } 
    else if (prof.includes('adequado') || prof.includes('médio')) { profColor = 'text-green-400 drop-shadow-md'; profDisplay = 'ADEQUADO'; } 
    else if (prof.includes('avançado') || prof.includes('difícil')) { profColor = 'text-blue-400 drop-shadow-md'; profDisplay = 'AVANÇADO'; }
    
    window.el('q-category').innerHTML = `${(q.componente || '').toUpperCase()} &bull; ${(q.ano || '').toUpperCase()} &bull; PROFICIÊNCIA: <span class="${profColor}">${profDisplay}</span>`; 
    
    const qTextEl = window.el('q-text'); qTextEl.innerHTML = ''; qTextEl.classList.add('typing-cursor');
    let txt = q.text; let idx = 0; 
    if(window.typeWriterTimeout) clearTimeout(window.typeWriterTimeout);
    function type() { 
        if(idx < txt.length) { 
            qTextEl.innerHTML = txt.substring(0, idx+1); idx++; 
            window.typeWriterTimeout = setTimeout(type, 25); 
        } else { qTextEl.classList.remove('typing-cursor'); } 
    }
    type();
    
    const btnHologram = window.el('btn-toggle-hologram'); const dragImgEl = window.el('drag-q-image'); 
    if(typeof window.closeDraggableHologram === 'function') window.closeDraggableHologram(); 
    if(btnHologram) { btnHologram.classList.add('hidden'); btnHologram.classList.remove('flex'); }
    if(dragImgEl) dragImgEl.src = "";
    
    if (q.image_url && dragImgEl) { 
        const finalUrl = window.normalizeImageUrl(q.image_url); 
        dragImgEl.onload = () => { if(btnHologram){ btnHologram.classList.remove('hidden'); btnHologram.classList.add('flex'); } }; 
        dragImgEl.src = finalUrl; 
    }
    
    window.el('q-id').innerText = q.id !== "SEM-ID" ? `ID: ${q.id}` : ""; 
    window.el('award-display').innerText = window.awards[team.level] || "1 MILHÃO"; 
    window.el('stop-award-display').innerText = team.level === 0 ? "0" : window.awards[team.level - 1]; 
    window.el('lose-award-display').innerText = window.loseAwards[team.level] || "0";
    
    const container = window.el('alternatives-container'); container.innerHTML = ''; 
    const letters = ['A', 'B', 'C', 'D'];
    if(window.audioSystem) window.audioSystem.play('pergunta'); 
    if (team.level === 0) { 
        setTimeout(() => { if (team.level === 0 && !window.isWaitingAnswer && window.audioSystem) window.audioSystem.play('voice_pergunta'); }, 3500); 
    } else { if(window.audioSystem) window.audioSystem.play('voice_proxima'); }
    
    q.options.forEach((opt, i) => { 
        const btn = window.ce('button'); 
        btn.className = 'btn-alternative min-h-[3.5rem] rounded-full flex items-center px-4 py-2 relative overflow-hidden group transition-all'; 
        btn.onclick = () => window.selectAnswer(i, btn); 
        btn.innerHTML = `<div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 z-10"><span class="text-red-700 font-bold text-lg font-orbitron">${letters[i]}</span></div><span class="text-white font-bold text-sm md:text-base w-full text-center z-10 font-montserrat drop-shadow-md">${opt}</span>`; 
        container.appendChild(btn); 
    });
    
    if(typeof window.resetTimer === 'function') window.resetTimer(); 
    window.saveProgress(); window.questionStartTime = Date.now();
};

/* STREAMING_CHUNK:Lógica base de Timer e Respostas... */
window.resetTimer = function() { 
    clearInterval(window.timerInterval); 
    if (window.audioTimeout) clearTimeout(window.audioTimeout); 
    window.timeLeft = 30; 
    const timerCircle = window.el('timer-circle'); const timerDisplay = window.el('timer-display'); 
    timerCircle.classList.remove('timer-panic'); timerDisplay.classList.remove('text-red-500'); window.el('game-vignette').classList.remove('vignette-panic'); 
    timerDisplay.innerText = window.timeLeft; window.isAudioPlaying = true; 
    if(window.audioSystem) {
        window.audioSystem.voice_pergunta.onended = () => { window.isAudioPlaying = false; }; 
        window.audioSystem.voice_proxima.onended = () => { window.isAudioPlaying = false; }; 
    }
    window.audioTimeout = setTimeout(() => { window.isAudioPlaying = false; }, window.teams[window.currentTeamIndex].level === 0 ? 25000 : 6000); 
    
    window.timerInterval = setInterval(() => { 
        if(window.isWaitingAnswer || window.isAudioPlaying) return; 
        window.timeLeft--; timerDisplay.innerText = window.timeLeft; 
        if(window.timeLeft <= 5) { window.el('game-vignette').classList.add('vignette-panic'); } 
        if(window.timeLeft === 10) { timerCircle.classList.add('timer-panic'); timerDisplay.classList.add('text-red-500'); } 
        if(window.timeLeft <= 0) { clearInterval(window.timerInterval); window.forceTimeOut(); } 
    }, 1000); 
};
window.pauseTimer = function() { clearInterval(window.timerInterval); window.el('timer-circle').classList.remove('timer-panic'); window.el('game-vignette').classList.remove('vignette-panic'); };
window.resumeTimer = function() { window.resetTimer(); };

window.forceTimeOut = function() { 
    if(typeof window.closeDraggableHologram === 'function') window.closeDraggableHologram(); 
    window.el('game-vignette').classList.remove('vignette-panic'); 
    const team = window.teams[window.currentTeamIndex]; team.status = 'lost'; window.teams[window.currentTeamIndex].responseTimes.push(30000); 
    if(window.audioSystem) { window.audioSystem.stopAll(); window.audioSystem.play('errou'); }
    window.isWaitingAnswer = true; 
    window.el('spot-1').className = 'spotlight spot-left spot-red'; window.el('spot-2').className = 'spotlight spot-right spot-red'; window.el('main-q-box').classList.add('animate-shake'); 
    if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('erro'); 
    const q = window.activeQuestions[window.globalQuestionIndex]; window.lastAnsweredQuestion = q; window.recordAnswerSnapshot(q, null, false, team, 'timeout'); 
    
    window.qsa('.btn-alternative').forEach((btn, idx) => { btn.style.pointerEvents = 'none'; if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); else btn.classList.add('correct'); }); 
    const tempoAudio = Math.random() > 0.5 ? 'voice_tempo1' : 'voice_tempo2'; 
    if(window.audioSystem) window.audioSystem.play(tempoAudio); 
    let tempoTriggered = false; const goTempo = () => { if(tempoTriggered) return; tempoTriggered = true; setTimeout(() => { window.el('main-q-box').classList.remove('animate-shake'); if(typeof window.showFeedbackAndNext === 'function') window.showFeedbackAndNext("Tempo Esgotado!", 'time'); }, 800); }; 
    if(window.audioSystem) { window.audioSystem[tempoAudio].onended = goTempo; window.audioSystem[tempoAudio].onerror = goTempo; }
    setTimeout(goTempo, 8000); 
};

window.selectAnswer = function(selectedIndex, buttonElement) { 
    if(typeof window.closeDraggableHologram === 'function') window.closeDraggableHologram(); 
    if (window.isWaitingAnswer) return; 
    clearInterval(window.timerInterval); window.el('timer-circle').classList.remove('timer-panic'); window.el('game-vignette').classList.remove('vignette-panic'); 
    window.pendingAnswerIndex = selectedIndex; window.pendingButtonElement = buttonElement; 
    if (window.questionStartTime) { window.teams[window.currentTeamIndex].responseTimes.push(Date.now() - window.questionStartTime); } 
    
    if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('tenso_cinematic'); 
    window.el('spot-1').className = 'spotlight spot-left spot-tension'; window.el('spot-2').className = 'spotlight spot-right spot-tension'; 
    const q = window.activeQuestions[window.globalQuestionIndex]; const letters = ['A', 'B', 'C', 'D']; 
    window.el('confirm-letter').innerText = letters[selectedIndex]; window.el('confirm-text').innerText = q.options[selectedIndex]; 
    buttonElement.classList.add('pulse-answer'); window.el('modal-confirm').classList.remove('hidden'); window.el('modal-confirm').classList.add('flex'); 
    
    if(window.audioSystem) {
        window.audioSystem.stop('suspense'); window.audioSystem.play('certeza'); 
        const voiceName = Math.random() > 0.5 ? 'voice_certeza' : 'voice_posso'; window.audioSystem.play(voiceName); 
        const btnSim = window.el('btn-confirm-sim'); const btnNao = window.el('btn-confirm-nao'); 
        btnSim.classList.add('opacity-40', 'pointer-events-none', 'grayscale'); btnNao.classList.add('opacity-40', 'pointer-events-none', 'grayscale'); 
        const enableButtons = () => { btnSim.classList.remove('opacity-40', 'pointer-events-none', 'grayscale'); btnNao.classList.remove('opacity-40', 'pointer-events-none', 'grayscale'); }; 
        window.audioSystem[voiceName].onended = enableButtons; window.audioSystem[voiceName].onerror = enableButtons; setTimeout(enableButtons, 3500); 
    }
    setTimeout(() => { window.el('confirm-box').classList.remove('scale-95'); window.el('confirm-box').classList.add('scale-100'); }, 10); 
};

window.cancelAnswer = function() { 
    window.teams[window.currentTeamIndex].responseTimes.pop(); window.questionStartTime = Date.now(); 
    if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('normal'); 
    window.el('spot-1').className = 'spotlight spot-left spot-white'; window.el('spot-2').className = 'spotlight spot-right spot-white'; 
    window.el('confirm-box').classList.remove('scale-100'); window.el('confirm-box').classList.add('scale-95'); 
    setTimeout(() => { window.el('modal-confirm').classList.add('hidden'); window.el('modal-confirm').classList.remove('flex'); }, 300); 
    if(window.pendingButtonElement) window.pendingButtonElement.classList.remove('pulse-answer'); 
    window.pendingAnswerIndex = null; window.pendingButtonElement = null; 
    if(window.audioSystem) { window.audioSystem.stop('certeza'); window.audioSystem.play('suspense', true); }
    window.resumeTimer(); 
};

window.confirmAnswer = function() { 
    window.el('modal-confirm').classList.add('hidden'); window.el('modal-confirm').classList.remove('flex'); 
    window.isWaitingAnswer = true; const team = window.teams[window.currentTeamIndex]; const q = window.activeQuestions[window.globalQuestionIndex]; 
    
    window.el('bg-game').classList.add('dim-bg-extreme'); window.el('char-host').classList.add('dim-bg-extreme'); window.el('question-panel-wrapper').classList.add('dim-bg-extreme'); 
    window.el('spot-1').className = 'spotlight spot-left'; window.el('spot-2').className = 'spotlight spot-right'; window.el('spot-1').style.opacity = '0'; window.el('spot-2').style.opacity = '0'; 
    
    window.qsa('.btn-alternative').forEach(btn => { if(btn !== window.pendingButtonElement) { btn.classList.add('tension-dim'); btn.style.pointerEvents = 'none'; } }); 
    window.pendingButtonElement.classList.remove('pulse-answer'); window.pendingButtonElement.classList.add('animate-suspense', 'tension-focus'); 
    
    window.tensionFlashesInterval = setInterval(() => { if(Math.random() > 0.5) { const f = window.el('camera-flash-overlay'); f.classList.remove('do-flash'); void f.offsetWidth; f.classList.add('do-flash'); } }, 600); 
    
    setTimeout(() => { 
        clearInterval(window.tensionFlashesInterval); window.pendingButtonElement.classList.remove('animate-suspense', 'tension-focus'); 
        window.el('bg-game').classList.remove('dim-bg-extreme'); window.el('char-host').classList.remove('dim-bg-extreme'); window.el('question-panel-wrapper').classList.remove('dim-bg-extreme'); 
        window.qsa('.btn-alternative').forEach(btn => btn.classList.remove('tension-dim')); window.el('spot-1').style.opacity = ''; window.el('spot-2').style.opacity = ''; 
        
        const isCorrect = window.pendingAnswerIndex === q.answer; 
        if (isCorrect) { 
            if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('acerto'); 
            window.el('spot-1').className = 'spotlight spot-left spot-green'; window.el('spot-2').className = 'spotlight spot-right spot-green'; 
            team.level++; window.globalQuestionIndex++; window.lastAnsweredQuestion = q; window.recordAnswerSnapshot(q, window.pendingAnswerIndex, true, team); 
            if(window.audioSystem) { window.audioSystem.stopAll(); window.audioSystem.play('certa'); window.audioSystem.play('voice_acerto'); }
            window.pendingButtonElement.classList.add('flash-correct'); window.el('award-display').classList.add('animate-award-pop'); 
            window.qsa('.btn-alternative').forEach((btn, idx) => { if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); }); 
            
            const floatScore = window.ce('div'); floatScore.className = 'floating-score'; floatScore.innerText = `+${window.awards[team.level-1]}`; window.pendingButtonElement.appendChild(floatScore); 
            
            let nextActionTriggered = false; const goNext = () => { 
                if (nextActionTriggered) return; nextActionTriggered = true; 
                setTimeout(() => { 
                    const gameScreen = window.el('screen-game'); gameScreen.style.transition = 'opacity 0.6s ease'; gameScreen.style.opacity = '0'; 
                    setTimeout(() => { 
                        if(team.level < 16) { 
                            gameScreen.style.opacity = '1'; if(typeof window.advanceToNextTurn === 'function') window.advanceToNextTurn(); 
                        } else { 
                            team.status = 'won'; if(window.audioSystem) { window.audioSystem.stopAll(); window.audioSystem.play('vitoria'); }
                            window.el('final-win-award').innerText = "1 MILHÃO"; window.el('end-win-team').innerText = window.isStudentMode ? `Fim de Treino: ${team.name}` : `Equipe Campeã: ${team.name}`; 
                            const winScreen = window.el('screen-end-win'); winScreen.classList.remove('hidden'); winScreen.classList.add('active'); 
                            if(typeof window.checkGameEnd === 'function') window.checkGameEnd('win'); 
                            setTimeout(() => { const winBox = window.el('win-box'); winBox.classList.remove('scale-90', 'opacity-0'); winBox.classList.add('scale-100', 'opacity-100'); if(typeof window.triggerConfetti === 'function') window.triggerConfetti(); }, 300); 
                        } 
                    }, 600); 
                }, 1200); 
            }; 
            if(window.audioSystem) { window.audioSystem.voice_acerto.onended = goNext; window.audioSystem.voice_acerto.onerror = goNext; } setTimeout(goNext, 8000); 
        } else { 
            if(typeof window.changeBrutusPose === 'function') window.changeBrutusPose('erro'); 
            window.el('spot-1').className = 'spotlight spot-left spot-red'; window.el('spot-2').className = 'spotlight spot-right spot-red'; window.el('main-q-box').classList.add('animate-shake'); 
            team.status = 'lost'; window.globalQuestionIndex++; window.lastAnsweredQuestion = q; window.recordAnswerSnapshot(q, window.pendingAnswerIndex, false, team); 
            if(window.audioSystem) { window.audioSystem.stopAll(); window.audioSystem.play('errou'); window.audioSystem.play('voice_errou'); }
            window.pendingButtonElement.classList.add('wrong'); window.qsa('.btn-alternative')[q.answer].classList.add('correct'); window.qsa('.btn-alternative').forEach((btn, idx) => { if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); }); 
            
            let erroTriggered = false; const goErro = () => { 
                if (erroTriggered) return; erroTriggered = true; 
                setTimeout(() => { window.el('main-q-box').classList.remove('animate-shake'); if(typeof window.showFeedbackAndNext === 'function') window.showFeedbackAndNext("Resposta Incorreta!", 'wrong'); }, 800); 
            }; 
            if(window.audioSystem) { window.audioSystem.voice_errou.onended = goErro; window.audioSystem.voice_errou.onerror = goErro; } setTimeout(goErro, 8000); 
        } 
    }, 5000); 
};

/* STREAMING_CHUNK:Transições de Telas e Modais Finais... */
window.checkGameEnd = function(screenType) { 
    let activeCount = window.teams.filter(t => t.status === 'playing').length; const btn = window.el(`btn-end-${screenType}`); const btnText = window.el(`btn-end-${screenType}-text`); 
    if (activeCount === 0) { btnText.innerText = "VER RESULTADOS"; btn.onclick = () => { window.el(`screen-end-${screenType}`).classList.remove('active'); window.showLeaderboard(); }; } 
    else { btnText.innerText = "CONTINUAR JOGO"; btn.onclick = () => { window.el(`screen-end-${screenType}`).style.opacity = '0'; setTimeout(() => { window.el(`screen-end-${screenType}`).classList.remove('active'); window.el('screen-game').classList.add('active'); window.advanceToNextTurn(); }, 500); }; } 
};
window.advanceToNextTurn = function() { 
    let next = (window.currentTeamIndex + 1) % window.teams.length; let found = false; let loops = 0; 
    while (loops < window.teams.length) { if (window.teams[next].status === 'playing') { found = true; break; } next = (next + 1) % window.teams.length; loops++; } 
    if (found) { window.currentTeamIndex = next; window.showTurnTransition(window.teams[window.currentTeamIndex].name, () => { window.loadQuestion(); window.audioSystem.play('suspense', true); }); } 
    else { window.showLeaderboard(); } 
};
window.useHelp = function(type) { 
    const team = window.teams[window.currentTeamIndex]; if (type !== 'pular' && team.helps[type]) return; 
    if (type === 'pular' && team.helps.pular >= 3) { window.showSystemMessage("Aviso", "Sem pulos disponíveis.", "info"); window.audioSystem.play('voice_sem_pulos'); return; } 
    window.closeHelp(); 
    if (type === 'eliminar') { 
        window.audioSystem.play('eliminar'); window.pauseTimer(); team.helps.eliminar = true; window.saveProgress(); const cartas = [0, 1, 2, 3].sort(() => Math.random() - 0.5); const container = window.el('cards-container'); container.innerHTML = ''; 
        cartas.forEach((val) => { container.innerHTML += `<div class="w-20 h-32 cursor-pointer flip-card" onclick="window.chooseCarta(${val}, this)"><div class="flip-card-inner w-full h-full relative"><div class="flip-card-front absolute inset-0 bg-blue-900 border-2 border-yellow-400 rounded-xl flex items-center justify-center text-white font-black">?</div><div class="flip-card-back absolute inset-0 bg-white border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center p-2 text-black"><span class="text-blue-950 font-black font-orbitron text-xs">${val===0?'REI':val===1?'ÁS':val===2?'DUAS':'TRÊS'}</span></div></div></div>`; }); 
        window.el('modal-cartas').classList.remove('hidden'); window.el('modal-cartas').classList.add('flex'); 
    } else if (type === 'palpite') { 
        window.audioSystem.play('plateia'); window.audioSystem.play('voice_palpite'); window.pauseTimer(); team.helps.palpite = true; window.saveProgress(); const q = window.activeQuestions[window.globalQuestionIndex]; const container = window.el('audience-bars'); container.innerHTML = ''; 
        [0, 1, 2, 3].forEach(i => { let v = i === q.answer ? 65 : 11; container.innerHTML += `<div class="flex items-center w-full gap-4 text-xs font-bold"><div class="w-6 h-6 rounded-full bg-blue-950 border border-cyan-400 flex items-center justify-center">${['A','B','C','D'][i]}</div><div class="w-full bg-black/50 h-6 rounded-full relative overflow-hidden"><div class="h-full bg-yellow-500" style="width:${v}%"></div><span class="absolute right-4 text-white">${v}%</span></div></div>`; }); 
        window.el('modal-audience').classList.remove('hidden'); window.el('modal-audience').classList.add('flex'); 
    } else if (type === 'dica') { 
        window.audioSystem.play('dica'); window.audioSystem.play('voice_dica'); window.pauseTimer(); team.helps.dica = true; window.saveProgress(); const q = window.activeQuestions[window.globalQuestionIndex]; const container = window.el('dica-boards'); container.innerHTML = ''; 
        [1,2,3].forEach(idx => { container.innerHTML += `<div class="flex-1 bg-blue-950 border border-yellow-500 rounded-xl p-4 text-center"><span class="text-cyan-400 text-[10px] block mb-2">Especialista ${idx}</span><div class="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto text-red-700 font-bold mb-2">${['A','B','C','D'][q.answer]}</div><p class="text-white text-[11px] truncate">${q.options[q.answer]}</p></div>`; }); 
        window.el('modal-dica').classList.remove('hidden'); window.el('modal-dica').classList.add('flex'); 
    } else if (type === 'pular') { window.el('skips-left').innerText = 3 - team.helps.pular; window.el('modal-pular').classList.remove('hidden'); window.el('modal-pular').classList.add('flex'); } 
};
window.chooseCarta = function(val, element) { 
    element.classList.add('flipped'); window.qsa('#cards-container .flip-card').forEach(c=>c.style.pointerEvents='none'); 
    setTimeout(() => { window.el('modal-cartas').classList.add('hidden'); window.el('modal-cartas').classList.remove('flex'); const btns = window.qsa('#alternatives-container .btn-alternative'); const q = window.activeQuestions[window.globalQuestionIndex]; let wrong = [0,1,2,3].filter(i => i!==q.answer).sort(() => Math.random() - 0.5); for(let k=0; k<val; k++) if(wrong[k]!==undefined) btns[wrong[k]].classList.add('animate-eliminate'); window.resumeTimer(); }, 2000); 
};
window.confirmStop = function() { 
    window.isWaitingAnswer = true; window.el('modal-parar').classList.add('hidden'); window.el('modal-parar').classList.remove('flex'); const val = window.teams[window.currentTeamIndex].level === 0 ? "0" : window.awards[window.teams[window.currentTeamIndex].level - 1]; 
    window.teams[window.currentTeamIndex].status = 'stopped'; window.globalQuestionIndex++; window.saveProgress(); window.el('final-stop-award').innerText = val; window.el('end-stop-team').innerText = `Equipe Parou: ${window.teams[window.currentTeamIndex].name}`; 
    window.changeBrutusPose('consolando'); window.el('screen-game').classList.remove('active'); window.el('screen-end-stop').classList.add('active'); window.checkGameEnd('stop'); 
};
window.confirmSkip = function() { window.cancelSkip(); window.teams[window.currentTeamIndex].helps.pular++; window.globalQuestionIndex++; window.saveProgress(); if(window.globalQuestionIndex < window.activeQuestions.length) window.loadQuestion(); else window.showSystemMessage("Fim", "Sem perguntas para pular.", "error"); };
window.saveClass = function() { const name = window.el('add-class-name').value.trim(); const year = window.el('add-class-year') ? window.el('add-class-year').value : ''; if (!name) { window.el('add-class-error').classList.remove('hidden'); return; } if (window.activeTurmaId && window.el('modal-add-class').dataset.mode === 'edit') { const idx = window.allTurmas.findIndex(t => t.id === window.activeTurmaId); if (idx !== -1) { window.allTurmas[idx].name = name; window.allTurmas[idx].ano = year; } } else { const newClass = { id: `TURMA_${Date.now()}`, name: name, ano: year, students: [] }; window.allTurmas.push(newClass); window.activeTurmaId = newClass.id; } window.writeJSONKey(window.STORAGE_KEYS.classes, window.allTurmas); window.closeAddClassModal(); window.showSystemMessage("Sucesso", "Turma guardada.", "success"); window.renderClassList(); window.updateClassDetailsView(); };
window.deleteCurrentClass = function() { if(!window.activeTurmaId || !confirm("Excluir esta turma?")) return; window.allTurmas = window.allTurmas.filter(t => t.id !== window.activeTurmaId); window.writeJSONKey(window.STORAGE_KEYS.classes, window.allTurmas); window.activeTurmaId = null; window.renderClassList(); window.updateClassDetailsView(); };
window.saveStudent = function() { const name = window.el('add-student-name').value.trim(); if (!name) { window.el('add-student-error').classList.remove('hidden'); return; } const idx = window.allTurmas.findIndex(t => t.id === window.activeTurmaId); if(idx === -1) return; window.allTurmas[idx].students.push({ id: `ALUNO_${Date.now()}`, name: name, race: window.el('add-student-race').value, isBolsa: window.el('add-student-bolsa').checked, isAEE: window.el('add-student-aee').checked }); window.writeJSONKey(window.STORAGE_KEYS.classes, window.allTurmas); window.closeAddStudentModal(); window.updateClassDetailsView(); window.renderClassList(); };
window.deleteStudent = function(sid) { const idx = window.allTurmas.findIndex(t => t.id === window.activeTurmaId); if(idx === -1 || !confirm("Remover aluno permanentemente?")) return; window.allTurmas[idx].students = window.allTurmas[idx].students.filter(s => s.id !== sid); window.writeJSONKey(window.STORAGE_KEYS.classes, window.allTurmas); window.updateClassDetailsView(); window.renderClassList(); };
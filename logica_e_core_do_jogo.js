---

### ARQUIVO 2: O Cérebro do Jogo (Garante que "Jogar Agora" inicie a partida)
Abra o arquivo **`logica_e_core_do_jogo.js`**, apague absolutamente tudo e cole este código. Ele restaura a função global de carregar a tela e o filtro inteligente.

```javascript:logica_e_core_do_jogo.js
// =========================================================================
// Arquivo: logica_e_core_do_jogo.js
// Função: Motor principal de partida, regras, validações e progressão
// =========================================================================

/* STREAMING_CHUNK:Inicializando funções de salvamento... */
window.saveProgress = function() { 
    if (!window.activeQuestions || !window.activeQuestions.length || !window.teams || !window.teams.length) return; 
    window.writeJSONKey(window.STORAGE_KEYS.state, { 
        version: 2, 
        savedAt: new Date().toISOString(), 
        teams: window.teams, 
        currentTeamIndex: window.currentTeamIndex, 
        gameMode: window.gameMode, 
        isStudentMode: window.isStudentMode, 
        activeQuestions: window.activeQuestions, 
        globalQuestionIndex: window.globalQuestionIndex, 
        timeLeft: window.timeLeft, 
        answerHistory: window.answerHistory, 
        currentStudentTelemetryKey: window.currentStudentTelemetryKey || null,
        missionId: window.CURRENT_MISSION_ID || null 
    }); 
};

window.clearProgress = function() { window.removeStorageKey(window.STORAGE_KEYS.state); };

/* STREAMING_CHUNK:Recuperando partida... */
window.resumeGame = function() { 
    const st = window.readJSONKey(window.STORAGE_KEYS.state, null); 
    if(!st || !Array.isArray(st.teams) || !Array.isArray(st.activeQuestions) || !st.activeQuestions.length) { 
        window.clearProgress(); 
        if (typeof window.showSystemMessage === 'function') window.showSystemMessage("Aviso", "Não há partida salva válida para retomar.", "info"); 
        return; 
    } 
    window.teams = st.teams; 
    window.currentTeamIndex = Number.isInteger(st.currentTeamIndex) ? st.currentTeamIndex : 0; 
    window.gameMode = st.gameMode || 'single'; 
    window.isStudentMode = !!st.isStudentMode; 
    window.activeQuestions = st.activeQuestions; 
    window.globalQuestionIndex = Number.isInteger(st.globalQuestionIndex) ? st.globalQuestionIndex : 0; 
    window.timeLeft = Number.isFinite(st.timeLeft) ? st.timeLeft : 30; 
    window.answerHistory = Array.isArray(st.answerHistory) ? st.answerHistory : []; 
    window.currentStudentTelemetryKey = st.currentStudentTelemetryKey || window.currentStudentTelemetryKey || null; 
    
    window.qsa('.screen').forEach(screen => screen.classList.remove('active')); 
    const screenGame = window.el('screen-game') || document.getElementById('tela-jogo');
    if(screenGame) screenGame.classList.add('active'); 
    const hudTeam = window.el('hud-team');
    if(hudTeam) hudTeam.style.display = window.gameMode === 'multi' ? 'flex' : 'none'; 
    if(window.audioSystem && typeof window.audioSystem.stopAll === 'function') {
        window.audioSystem.stopAll(); 
        window.audioSystem.play('suspense', true); 
    }
    if (typeof window.loadQuestion === 'function') window.loadQuestion(); 
};

/* STREAMING_CHUNK:Registrando telemetria... */
window.recordAnswerSnapshot = function(question, selectedIndex, wasCorrect, team, reason = 'answer') { 
    window.answerHistory.push({ 
        questionId: question ? question.id : null, bncc: question ? (question.bncc || "N/A") : "N/A", 
        proficiencia: question ? (question.proficiencia || "N/A") : "N/A", componente: question ? (question.componente || "N/A") : "N/A", 
        teamName: team ? team.name : null, selectedIndex: selectedIndex, selectedText: (question && selectedIndex !== null && selectedIndex >= 0) ? question.options[selectedIndex] : null, 
        correctIndex: question ? question.answer : null, wasCorrect: wasCorrect, reason: reason, levelAfter: team ? team.level : null, timestamp: new Date().toISOString() 
    }); 
    window.saveProgress(); 
};

/* STREAMING_CHUNK:Iniciando Jogo Multiplayer... */
window.startGame = function() {
    window.clearProgress(); window.isStudentMode = false; 
    const errDiv = window.el('setup-error-msg'); if(errDiv) errDiv.remove();
    const showError = (msg) => { const e = window.ce('div'); e.id = 'setup-error-msg'; e.className = 'mt-4 bg-red-900/80 border-2 border-red-500 text-white font-bold p-4 rounded-xl text-center shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'; e.innerText = msg; const actionArea = window.el('setup-action-area'); if(actionArea) actionArea.prepend(e); };
    
    const selectedYears = Array.from(window.qsa('#screen-setup input[id^="ano"]:checked')).map(cb => cb.value.toLowerCase()); 
    const selectedMundos = Array.from(window.qsa('#screen-setup input[id^="mundo"]:checked')).map(cb => cb.value.toLowerCase()); 
    const qSourceEl = window.qs('input[name="q_source"]:checked');
    const qSource = qSourceEl ? qSourceEl.value : 'all';
    
    if (selectedYears.length === 0 || selectedMundos.length === 0) { showError("ERRO: Selecione ao menos um Ano e uma Disciplina."); return; }
    
    const modeEl = window.qs('input[name="gamemode"]:checked');
    const mode = modeEl ? modeEl.value : 'single'; 
    const autoModeEl = window.el('teams-inputs-auto');
    const isAutoMode = autoModeEl ? autoModeEl.classList.contains('flex') : false;
    window.teams = [];
    
    if (mode === 'single') { 
        const t1El = window.el('team1');
        const t1 = (t1El && t1El.value.trim()) ? t1El.value.trim() : "Jogador 1"; 
        window.teams.push({ name: t1, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }); 
    } else {
        if (isAutoMode) {
            const turmaIdEl = window.el('setup-select-turma');
            const turmaId = turmaIdEl ? turmaIdEl.value : null; 
            if (!turmaId) { showError("ERRO: Selecione uma turma."); return; }
            const turma = window.allTurmas.find(t => t.id === turmaId); 
            const tcEl = window.el('auto-team-count');
            const numTeams = tcEl ? parseInt(tcEl.value) : 2;
            if (!turma || turma.students.length < numTeams) { showError(`ERRO: A turma precisa ter no mínimo ${numTeams} alunos.`); return; }
            let shuffledStudents = [...turma.students].sort(() => Math.random() - 0.5);
            for(let i = 0; i < numTeams; i++) {
                window.teams.push({ name: `Equipe ${i+1}`, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: turma.id, students: [], responseTimes: [] });
            }
            shuffledStudents.forEach((student, index) => { window.teams[index % numTeams].students.push(student); });
        } else {
            const t1 = window.el('team1') ? window.el('team1').value.trim() : ''; const t2 = window.el('team2') ? window.el('team2').value.trim() : ''; const t3 = window.el('team3') ? window.el('team3').value.trim() : ''; const t4 = window.el('team4') ? window.el('team4').value.trim() : '';
            if(t1) window.teams.push({ name: t1, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
            if(t2) window.teams.push({ name: t2, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
            if(t3) window.teams.push({ name: t3, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
            if(t4) window.teams.push({ name: t4, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
        }
    }
    if (window.teams.length === 0) { showError("ERRO: Configure pelo menos 1 Equipe."); return; }
    
    window.gameMode = window.teams.length > 1 ? 'multi' : 'single'; 
    window.currentTeamIndex = 0;
    
    let filteredQuestions = window.allQuestions.filter(q => { 
        let matchesYear = selectedYears.some(y => String(q.ano).includes(y) || String(q.category).toLowerCase().includes(y)); 
        let matchesMundo = selectedMundos.some(m => { if (m === 'português') return String(q.componente).includes('português'); return String(q.componente).includes(m); }); 
        let matchesSource = true; 
        if (qSource === 'bncc') matchesSource = !q.isCustom; 
        if (qSource === 'custom') matchesSource = q.isCustom; 
        return matchesYear && matchesMundo && matchesSource; 
    });
    
    if (filteredQuestions.length === 0) { showError(`AVISO: Não há questões para os filtros selecionados.`); return; }
    
    filteredQuestions = filteredQuestions.sort(() => Math.random() - 0.5); 
    window.activeQuestions = []; 
    let totalNeeded = 16 * window.teams.length; 
    while(window.activeQuestions.length < totalNeeded) { 
        for(let q of filteredQuestions) {
            if(window.activeQuestions.length < totalNeeded) window.activeQuestions.push(q);
        }
    } 
    window.globalQuestionIndex = 0; 
    const setupScreen = window.el('screen-setup');
    if(setupScreen) setupScreen.classList.remove('active'); 
    window.fireUpGame();
};

/* STREAMING_CHUNK:Iniciando Módulo de Estudante... */
window.startStudentGame = function() {
    window.clearProgress(); 
    window.isStudentMode = true; 
    
    var errArea = document.getElementById('student-error-area');
    if (errArea) errArea.innerHTML = '';
    
    var container = document.getElementById('screen-setup-student') || document.querySelector('.screen.active') || document;
    var selects = container.querySelectorAll('select');
    var inputsText = container.querySelectorAll('input[type="text"]');
    
    var inputNome = null;
    for (var k = 0; k < inputsText.length; k++) {
        if (inputsText[k].id === 'student-name' || inputsText[k].placeholder.toLowerCase().indexOf('nome') !== -1 || inputsText[k].placeholder.toLowerCase().indexOf('name') !== -1) {
            inputNome = inputsText[k];
            break;
        }
    }
    
    var anoEscolar = "5º Ano";
    var disc = "Matemática";
    
    if (selects.length >= 2) {
        anoEscolar = selects[0].value;
        disc = selects[1].value;
    } else if (selects.length === 1) {
        anoEscolar = selects[0].value;
    }
    
    var pName = (inputNome && inputNome.value.trim() !== "") ? inputNome.value.trim() : "Herói Anônimo";

    var tagsAceitas = ["básico"];
    var difSelecionada = window.dificuldadeModoTreino || "fácil";
    if (difSelecionada === "fácil") tagsAceitas = ["básico", "b1", "b2", "fácil", "baixo"];
    else if (difSelecionada === "médio") tagsAceitas = ["intermediário", "b3", "b4", "médio", "adequado"];
    else if (difSelecionada === "difícil") tagsAceitas = ["avançado", "b5", "b6", "difícil", "alto"];

    var numAnoBusca = String(anoEscolar).replace(/\D/g, "");

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

    if (window.questoesDaPartida.length === 0) {
        window.questoesDaPartida = window.allQuestions.filter(function(q) {
            var qAno = String(q.ano || "").toLowerCase();
            var qComp = String(q.componente || q.disciplina || "").toLowerCase();
            return (qAno.includes(String(anoEscolar).toLowerCase()) || qAno.includes(numAnoBusca) || qAno === numAnoBusca) && qComp.includes(String(disc).toLowerCase());
        });
        
        if (window.questoesDaPartida.length === 0) {
            if (typeof window.showSystemMessage === 'function') {
                window.showSystemMessage("BANCO VAZIO", "A inteligência não encontrou itens cadastrados para " + disc + " do " + anoEscolar + ".", "info");
            } else {
                alert("BANCO VAZIO: Nenhuma questão encontrada para " + disc + " do " + anoEscolar + ".");
            }
            return;
        }
    }

    for (var r = window.questoesDaPartida.length - 1; r > 0; r--) {
        var s = Math.floor(Math.random() * (r + 1));
        var aux = window.questoesDaPartida[r];
        window.questoesDaPartida[r] = window.questoesDaPartida[s];
        window.questoesDaPartida[s] = aux;
    }

    window.teams = [{ 
        name: pName, level: 0, status: 'playing', 
        helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, 
        turmaId: null, students: [], responseTimes: [] 
    }];
    
    window.gameMode = 'single';
    window.currentTeamIndex = 0;
    
    if (window.STORAGE_KEYS && typeof window.readJSONKey === 'function' && typeof window.writeJSONKey === 'function') {
        var todayStr = new Date().toISOString().split('T')[0]; 
        window.currentStudentTelemetryKey = pName.toLowerCase() + "_" + todayStr;
        var telemetry = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); 
        if (!telemetry[window.currentStudentTelemetryKey]) { telemetry[window.currentStudentTelemetryKey] = { attempts: 0, sent: false }; } 
        telemetry[window.currentStudentTelemetryKey].attempts++; 
        window.writeJSONKey(window.STORAGE_KEYS.telemetry, telemetry);
    }

    window.activeQuestions = window.questoesDaPartida.slice(0, 16);
    window.globalQuestionIndex = 0;

    var telas = document.querySelectorAll('.screen');
    for(var t = 0; t < telas.length; t++) telas[t].classList.remove('active');
    
    var gameScreen = document.getElementById('screen-game') || document.getElementById('tela-jogo');
    if(gameScreen) { gameScreen.classList.remove('hidden'); gameScreen.classList.add('active', 'flex'); }
    
    if (typeof window.fireUpGame === 'function') {
        window.fireUpGame();
    } else if (typeof window.loadQuestion === 'function') {
        window.loadQuestion();
    }
};

/* STREAMING_CHUNK:Iniciando visualizações do jogo... */
window.fireUpGame = function() {
    if (window.gameMode === 'multi') {
        const hudTeam = window.el('hud-team');
        if(hudTeam) hudTeam.style.display = 'flex'; 
        const isAuto = window.teams.some(t => t.turmaId !== null);
        if(isAuto) {
            const transScreen = window.el('screen-transition'); 
            if(transScreen) {
                transScreen.innerHTML = `<h1 class="text-4xl md:text-6xl font-black text-gold-premium font-orbitron uppercase animate-pulse text-center whitespace-pre-line">A Sortear Alunos...<br><span class="text-2xl text-cyan-300 font-montserrat mt-4 block">A Formar Equipas Mágicas</span></h1>`;
                transScreen.classList.remove('hidden'); 
                transScreen.classList.add('flex'); 
                transScreen.style.opacity = '1'; 
            }
            if(window.audioSystem && typeof window.audioSystem.play === 'function') window.audioSystem.play('suspense');
            setTimeout(() => { 
                if(transScreen) transScreen.style.opacity = '0'; 
                setTimeout(() => { 
                    if(transScreen) { transScreen.classList.add('hidden'); transScreen.classList.remove('flex'); }
                    if(typeof window.showTurnTransition === 'function') {
                        window.showTurnTransition(window.teams[window.currentTeamIndex].name, () => { 
                            const screenGame = window.el('screen-game');
                            if(screenGame) screenGame.classList.add('active'); 
                            if(window.audioSystem) {
                                window.audioSystem.stopAll(); 
                                window.audioSystem.play('abertura'); 
                                window.audioSystem.play('voice_comecar'); 
                                setTimeout(() => { window.audioSystem.play('suspense', true); }, 5000); 
                            }
                            if(typeof window.loadQuestion === 'function') window.loadQuestion(); 
                        }); 
                    }
                }, 500); 
            }, 2500);
        } else { 
            if(typeof window.showTurnTransition === 'function') {
                window.showTurnTransition(window.teams[window.currentTeamIndex].name, () => { 
                    const screenGame = window.el('screen-game');
                    if(screenGame) screenGame.classList.add('active'); 
                    if(window.audioSystem) {
                        window.audioSystem.stopAll(); 
                        window.audioSystem.play('abertura'); 
                        window.audioSystem.play('voice_comecar'); 
                        setTimeout(() => { window.audioSystem.play('suspense', true); }, 5000); 
                    }
                    if(typeof window.loadQuestion === 'function') window.loadQuestion(); 
                }); 
            }
        }
    } else { 
        const hudTeam = window.el('hud-team');
        if(hudTeam) hudTeam.style.display = 'none'; 
        const screenGame = window.el('screen-game') || document.getElementById('tela-jogo');
        if(screenGame) screenGame.classList.add('active'); 
        if(window.audioSystem) {
            window.audioSystem.stopAll(); 
            window.audioSystem.play('abertura'); 
            window.audioSystem.play('voice_comecar'); 
            setTimeout(() => { window.audioSystem.play('suspense', true); }, 5000); 
        }
        if(typeof window.loadQuestion === 'function') window.loadQuestion(); 
    }
};

/* STREAMING_CHUNK:Lógica restante inalterada do arquivo... */
// ... existing code ...
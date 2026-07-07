// --- 4. LÓGICA DE DADOS (DASHBOARDS E RESULTADOS TRI) ---
window.calculateGradeAndProficiency = function(history) { 
    if (!history || history.length === 0) return { grade: 0, proficiency: 'Abaixo do Básico', correctPct: 0 }; 
    let totalWeight = 0; let earnedWeight = 0; let correctAnswers = 0; 
    history.forEach(h => { 
        let w = 1; const p = (h.prof || '').toLowerCase(); 
        if (p.includes('adequado') || p.includes('médio')) w = 2; 
        if (p.includes('avançado') || p.includes('difícil')) w = 3; 
        totalWeight += w; 
        if (h.wasCorrect) { earnedWeight += w; correctAnswers++; } 
    }); 
    let grade = totalWeight > 0 ? (earnedWeight / totalWeight) * 10 : 0; 
    let prof = 'Abaixo do Básico'; 
    if (grade >= 9) prof = 'Avançado'; else if (grade >= 7) prof = 'Adequado'; else if (grade >= 5) prof = 'Básico'; 
    return { grade: parseFloat(grade.toFixed(2)), proficiency: prof, correctPct: Math.round((correctAnswers / history.length) * 100) }; 
};

window.getProficiencyStyles = function(prof) { 
    if (prof === 'Avançado') return { bg: 'bg-[#38bdf8]', text: 'text-[#38bdf8]', border: 'border-[#38bdf8]', hex: '#38bdf8' }; 
    if (prof === 'Adequado') return { bg: 'bg-[#6bff89]', text: 'text-[#6bff89]', border: 'border-[#6bff89]', hex: '#6bff89' }; 
    if (prof === 'Básico') return { bg: 'bg-[#facc15]', text: 'text-[#facc15]', border: 'border-[#facc15]', hex: '#facc15' }; 
    return { bg: 'bg-[#ff6b6b]', text: 'text-[#ff6b6b]', border: 'border-[#ff6b6b]', hex: '#ff6b6b' }; 
};

window.markTelemetrySent = function(key, attempts) { 
    let t = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); 
    t[key] = t[key] || {}; t[key].attempts = attempts; t[key].sent = true; 
    window.writeJSONKey(window.STORAGE_KEYS.telemetry, t); 
};

// --- GESTÃO DE MISSÕES (A NOVA FÁBRICA) ---
window.saveMission = function() {
    if(!window.activeMissionId) return;
    const mission = window.allMissions.find(m => m.id === window.activeMissionId);
    if(!mission) return;

    mission.name = window.el('mission-edit-name').value.trim() || "Missão sem nome";
    mission.mode = window.el('mission-edit-mode').value;
    mission.dateStart = window.el('mission-edit-start').value;
    mission.dateEnd = window.el('mission-edit-end').value;

    window.writeJSONKey(window.STORAGE_KEYS.missions, window.allMissions);
    window.showSystemMessage("Guardado", "A sua missão foi atualizada com sucesso.", "success");
    if(typeof window.renderMissionList === 'function') window.renderMissionList();
};

window.deleteCurrentMission = function() {
    if(!window.activeMissionId || !confirm("Tem a certeza que deseja excluir esta missão permanentemente?")) return;
    window.allMissions = window.allMissions.filter(m => m.id !== window.activeMissionId);
    window.writeJSONKey(window.STORAGE_KEYS.missions, window.allMissions);
    window.activeMissionId = null;
    if(typeof window.updateMissionEditorView === 'function') window.updateMissionEditorView();
    if(typeof window.renderMissionList === 'function') window.renderMissionList();
};

window.generateMutantGameFromMission = function() {
    window.saveMission(); // Garante que guarda antes de gerar
    const mission = window.allMissions.find(m => m.id === window.activeMissionId);
    if(!mission) return;
    
    // Filtra as questões exatas que o professor selecionou
    let exportQ = window.allQuestions.filter(q => mission.questionIds.includes(q.id));
    
    if (exportQ.length === 0) {
        window.showSystemMessage("Erro", "Tem de selecionar pelo menos uma questão para esta missão na lista abaixo.", "error");
        return;
    }
    
    // Monta o pacote de dados
    const payloadStr = JSON.stringify({ 
        missionId: mission.name, 
        mode: mission.mode,
        dateStart: mission.dateStart,
        dateEnd: mission.dateEnd,
        questions: exportQ 
    });
    const payloadBase64 = btoa(unescape(encodeURIComponent(payloadStr)));
    
    // Gera o Link Mágico
    const url = window.location.href.split('#')[0].split('?')[0] + '#mutant=' + payloadBase64;
    const iframe = `<iframe src="${url}" width="100%" height="750" style="border:none; border-radius:15px; overflow:hidden;" allowfullscreen></iframe>`;
    
    if(typeof window.showEmbedModal === 'function') window.showEmbedModal(url, iframe); 
};

// --- 6. CONTROLO DO JOGO (GAMEPLAY LOOP) ---
window.saveProgress = function() { if (!window.activeQuestions || !window.activeQuestions.length || !window.teams || !window.teams.length) return; window.writeJSONKey(window.STORAGE_KEYS.state, { version: 2, savedAt: new Date().toISOString(), teams: window.teams, currentTeamIndex: window.currentTeamIndex, gameMode: window.gameMode, isStudentMode: window.isStudentMode, activeQuestions: window.activeQuestions, globalQuestionIndex: window.globalQuestionIndex, timeLeft: window.timeLeft, answerHistory: window.answerHistory, currentStudentTelemetryKey: window.currentStudentTelemetryKey || null }); };
window.clearProgress = function() { window.removeStorageKey(window.STORAGE_KEYS.state); };
window.resumeGame = function() { const st = window.readJSONKey(window.STORAGE_KEYS.state, null); if(!st || !Array.isArray(st.teams) || !Array.isArray(st.activeQuestions) || !st.activeQuestions.length) { window.clearProgress(); window.showSystemMessage("Aviso", "Não há partida salva válida para retomar.", "info"); return; } window.teams = st.teams; window.currentTeamIndex = Number.isInteger(st.currentTeamIndex) ? st.currentTeamIndex : 0; window.gameMode = st.gameMode || 'single'; window.isStudentMode = !!st.isStudentMode; window.activeQuestions = st.activeQuestions; window.globalQuestionIndex = Number.isInteger(st.globalQuestionIndex) ? st.globalQuestionIndex : 0; window.timeLeft = Number.isFinite(st.timeLeft) ? st.timeLeft : 30; window.answerHistory = Array.isArray(st.answerHistory) ? st.answerHistory : []; window.currentStudentTelemetryKey = st.currentStudentTelemetryKey || window.currentStudentTelemetryKey || null; window.qsa('.screen').forEach(screen => screen.classList.remove('active')); window.el('screen-game').classList.add('active'); window.el('hud-team').style.display = window.gameMode === 'multi' ? 'flex' : 'none'; window.audioSystem.stopAll(); window.audioSystem.play('suspense', true); window.loadQuestion(); };
window.recordAnswerSnapshot = function(question, selectedIndex, wasCorrect, team, reason = 'answer') { window.answerHistory.push({ questionId: question ? question.id : null, bncc: question ? (question.bncc || "N/A") : "N/A", proficiencia: question ? (question.proficiencia || "N/A") : "N/A", componente: question ? (question.componente || "N/A") : "N/A", teamName: team ? team.name : null, selectedIndex, selectedText: (question && selectedIndex !== null && selectedIndex >= 0) ? question.options[selectedIndex] : null, correctIndex: question ? question.answer : null, wasCorrect, reason, levelAfter: team ? team.level : null, timestamp: new Date().toISOString() }); window.saveProgress(); };

window.startGame = function() {
    window.clearProgress(); window.isStudentMode = false; const errDiv = window.el('setup-error-msg'); if(errDiv) errDiv.remove();
    const showError = (msg) => { const e = window.ce('div'); e.id = 'setup-error-msg'; e.className = 'mt-4 bg-red-900/80 border-2 border-red-500 text-white font-bold p-4 rounded-xl text-center shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'; e.innerText = msg; window.el('setup-action-area').prepend(e); };
    const selectedYears = Array.from(window.qsa('#screen-setup input[id^="ano"]:checked')).map(cb => cb.value.toLowerCase()); 
    const selectedMundos = Array.from(window.qsa('#screen-setup input[id^="mundo"]:checked')).map(cb => cb.value.toLowerCase()); 
    const qSource = window.qs('input[name="q_source"]:checked').value;
    
    if (selectedYears.length === 0 || selectedMundos.length === 0) { showError("ERRO: Selecione ao menos um Ano e uma Disciplina."); return; }
    
    const mode = window.qs('input[name="gamemode"]:checked').value; 
    const isAutoMode = window.el('teams-inputs-auto').classList.contains('flex');
    window.teams = [];
    
    if (mode === 'single') { 
        const t1 = window.el('team1').value.trim() || "Jogador 1"; 
        window.teams.push({ name: t1, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }); 
    } else {
        if (isAutoMode) {
            const turmaId = window.el('setup-select-turma').value; 
            if (!turmaId) { showError("ERRO: Selecione uma turma."); return; }
            const turma = window.allTurmas.find(t => t.id === turmaId); 
            const numTeams = parseInt(window.el('auto-team-count').value);
            if (!turma || turma.students.length < numTeams) { showError(`ERRO: A turma precisa ter no mínimo ${numTeams} alunos.`); return; }
            let shuffledStudents = [...turma.students].sort(() => Math.random() - 0.5);
            for(let i = 0; i < numTeams; i++) {
                window.teams.push({ name: `Equipa ${i+1}`, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: turma.id, students: [], responseTimes: [] });
            }
            shuffledStudents.forEach((student, index) => { window.teams[index % numTeams].students.push(student); });
        } else {
            const t1 = window.el('team1').value.trim(); const t2 = window.el('team2').value.trim(); const t3 = window.el('team3').value.trim(); const t4 = window.el('team4').value.trim();
            if(t1) window.teams.push({ name: t1, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
            if(t2) window.teams.push({ name: t2, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
            if(t3) window.teams.push({ name: t3, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
            if(t4) window.teams.push({ name: t4, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
        }
    }
    if (window.teams.length === 0) { showError("ERRO: Configure pelo menos 1 Equipa."); return; }
    
    window.gameMode = window.teams.length > 1 ? 'multi' : 'single'; 
    window.currentTeamIndex = 0;
    
    let filteredQuestions = window.allQuestions.filter(q => { 
        let matchesYear = selectedYears.some(y => q.ano.includes(y) || q.category.toLowerCase().includes(y)); 
        let matchesMundo = selectedMundos.some(m => { if (m === 'português') return q.componente.includes('português'); return q.componente.includes(m); }); 
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
    window.el('screen-setup').classList.remove('active'); 
    window.fireUpGame();
};

window.fireUpGame = function() {
    if (window.gameMode === 'multi') {
        window.el('hud-team').style.display = 'flex'; 
        const isAuto = window.teams.some(t => t.turmaId !== null);
        if(isAuto) {
            const transScreen = window.el('screen-transition'); 
            transScreen.innerHTML = `<h1 class="text-4xl md:text-6xl font-black text-gold-premium font-orbitron uppercase animate-pulse text-center whitespace-pre-line">A Sortear Alunos...<br><span class="text-2xl text-cyan-300 font-montserrat mt-4 block">A Formar Equipas Mágicas</span></h1>`;
            transScreen.classList.remove('hidden'); transScreen.classList.add('flex'); transScreen.style.opacity = '1'; 
            window.audioSystem.play('suspense');
            setTimeout(() => { 
                transScreen.style.opacity = '0'; 
                setTimeout(() => { 
                    transScreen.classList.add('hidden'); transScreen.classList.remove('flex'); 
                    window.showTurnTransition(window.teams[window.currentTeamIndex].name, () => { 
                        window.el('screen-game').classList.add('active'); 
                        window.audioSystem.stopAll(); window.audioSystem.play('abertura'); window.audioSystem.play('voice_comecar'); 
                        setTimeout(() => { window.audioSystem.play('suspense', true); }, 5000); 
                        window.loadQuestion(); 
                    }); 
                }, 500); 
            }, 2500);
        } else { 
            window.showTurnTransition(window.teams[window.currentTeamIndex].name, () => { 
                window.el('screen-game').classList.add('active'); 
                window.audioSystem.stopAll(); window.audioSystem.play('abertura'); window.audioSystem.play('voice_comecar'); 
                setTimeout(() => { window.audioSystem.play('suspense', true); }, 5000); 
                window.loadQuestion(); 
            }); 
        }
    } else { 
        window.el('hud-team').style.display = 'none'; 
        window.el('screen-game').classList.add('active'); 
        window.audioSystem.stopAll(); window.audioSystem.play('abertura'); window.audioSystem.play('voice_comecar'); 
        setTimeout(() => { window.audioSystem.play('suspense', true); }, 5000); 
        window.loadQuestion(); 
    }
};

window.loadQuestion = function() {
    window.isWaitingAnswer = false; const team = window.teams[window.currentTeamIndex]; const q = window.activeQuestions[window.globalQuestionIndex]; 
    if(window.gameMode === 'multi') window.el('current-team-name-hud').innerText = team.name;
    window.restoreHelpsUI(); window.el('q-counter').innerText = team.level + 1;
    
    window.el('bg-game').src = "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BACKGROUND_PERGUNTAS_NORMAL.png";
    window.el('bg-game').classList.remove('dim-bg-extreme'); window.el('char-host').classList.remove('dim-bg-extreme'); window.el('question-panel-wrapper').classList.remove('dim-bg-extreme');
    window.el('spot-1').className = 'spotlight spot-left spot-white'; window.el('spot-2').className = 'spotlight spot-right spot-white';
    window.changeBrutusPose('normal');
    
    const qWrapper = window.el('question-panel-wrapper'); qWrapper.classList.remove('animate-q-slide'); void qWrapper.offsetWidth; qWrapper.classList.add('animate-q-slide');
    window.el('award-display').classList.remove('animate-award-pop');
    
    let profColor = 'text-white'; let profDisplay = (q.proficiencia || '').toUpperCase(); let prof = q.proficiencia ? q.proficiencia.toLowerCase() : '';
    if (prof.includes('básico') || prof.includes('fácil') || prof.includes('baixo')) { profColor = 'text-orange-400 drop-shadow-md'; profDisplay = 'BÁSICO'; } 
    else if (prof.includes('adequado') || prof.includes('médio')) { profColor = 'text-green-400 drop-shadow-md'; profDisplay = 'ADEQUADO'; } 
    else if (prof.includes('avançado') || prof.includes('difícil')) { profColor = 'text-blue-400 drop-shadow-md'; profDisplay = 'AVANÇADO'; }
    window.el('q-category').innerHTML = `${(q.componente || '').toUpperCase()} &bull; ${(q.ano || '').toUpperCase()} &bull; PROFICIÊNCIA: <span class="${profColor}">${profDisplay}</span>`; 
    
    const qTextEl = window.el('q-text'); qTextEl.innerHTML = ''; qTextEl.classList.add('typing-cursor');
    let txt = q.text; let idx = 0; if(window.typeWriterTimeout) clearTimeout(window.typeWriterTimeout);
    function type() { if(idx < txt.length) { qTextEl.innerHTML = txt.substring(0, idx+1); idx++; window.typeWriterTimeout = setTimeout(type, 25); } else { qTextEl.classList.remove('typing-cursor'); } }
    type();
    
    const btnHologram = window.el('btn-toggle-hologram'); const dragImgEl = window.el('drag-q-image'); 
    window.closeDraggableHologram(); btnHologram.classList.add('hidden'); btnHologram.classList.remove('flex'); dragImgEl.src = "";
    if (q.image_url) { const finalUrl = window.normalizeImageUrl(q.image_url); dragImgEl.onload = () => { btnHologram.classList.remove('hidden'); btnHologram.classList.add('flex'); }; dragImgEl.src = finalUrl; }
    
    window.el('q-id').innerText = q.id !== "SEM-ID" ? `ID: ${q.id}` : ""; 
    window.el('award-display').innerText = window.awards[team.level] || "1 MILHÃO"; 
    window.el('stop-award-display').innerText = team.level === 0 ? "0" : window.awards[team.level - 1]; 
    window.el('lose-award-display').innerText = window.loseAwards[team.level] || "0";
    
    const container = window.el('alternatives-container'); container.innerHTML = ''; const letters = ['A', 'B', 'C', 'D'];
    window.audioSystem.play('pergunta'); if (team.level === 0) { setTimeout(() => { if (team.level === 0 && !window.isWaitingAnswer) window.audioSystem.play('voice_pergunta'); }, 3500); } else window.audioSystem.play('voice_proxima');
    
    q.options.forEach((opt, i) => { 
        const btn = window.ce('button'); btn.className = 'btn-alternative min-h-[3.5rem] rounded-full flex items-center px-4 py-2 relative overflow-hidden group transition-all'; 
        btn.onclick = () => window.selectAnswer(i, btn); 
        btn.innerHTML = `<div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 z-10"><span class="text-red-700 font-bold text-lg font-orbitron">${letters[i]}</span></div><span class="text-white font-bold text-sm md:text-base w-full text-center z-10 font-montserrat drop-shadow-md">${opt}</span>`; 
        container.appendChild(btn); 
    });
    window.resetTimer(); window.saveProgress(); window.questionStartTime = Date.now();
};

window.resetTimer = function() { clearInterval(window.timerInterval); if (window.audioTimeout) clearTimeout(window.audioTimeout); window.timeLeft = 30; const timerCircle = window.el('timer-circle'); const timerDisplay = window.el('timer-display'); timerCircle.classList.remove('timer-panic'); timerDisplay.classList.remove('text-red-500'); window.el('game-vignette').classList.remove('vignette-panic'); timerDisplay.innerText = window.timeLeft; window.isAudioPlaying = true; window.audioSystem.voice_pergunta.onended = () => { window.isAudioPlaying = false; }; window.audioSystem.voice_proxima.onended = () => { window.isAudioPlaying = false; }; window.audioTimeout = setTimeout(() => { window.isAudioPlaying = false; }, window.teams[window.currentTeamIndex].level === 0 ? 25000 : 6000); window.timerInterval = setInterval(() => { if(window.isWaitingAnswer || window.isAudioPlaying) return; window.timeLeft--; timerDisplay.innerText = window.timeLeft; if(window.timeLeft <= 5) { window.el('game-vignette').classList.add('vignette-panic'); } if(window.timeLeft === 10) { timerCircle.classList.add('timer-panic'); timerDisplay.classList.add('text-red-500'); } if(window.timeLeft <= 0) { clearInterval(window.timerInterval); window.forceTimeOut(); } }, 1000); };
window.pauseTimer = function() { clearInterval(window.timerInterval); window.el('timer-circle').classList.remove('timer-panic'); window.el('game-vignette').classList.remove('vignette-panic'); };
window.resumeTimer = function() { window.resetTimer(); };

window.forceTimeOut = function() { window.closeDraggableHologram(); window.el('game-vignette').classList.remove('vignette-panic'); const team = window.teams[window.currentTeamIndex]; team.status = 'lost'; window.teams[window.currentTeamIndex].responseTimes.push(30000); window.audioSystem.stopAll(); window.audioSystem.play('errou'); window.isWaitingAnswer = true; window.el('bg-game').src = "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BACKGROUND_FEEDBACK_ERRO.png"; window.el('spot-1').className = 'spotlight spot-left spot-red'; window.el('spot-2').className = 'spotlight spot-right spot-red'; window.el('main-q-box').classList.add('animate-shake'); window.changeBrutusPose('erro'); const q = window.activeQuestions[window.globalQuestionIndex]; window.lastAnsweredQuestion = q; window.recordAnswerSnapshot(q, null, false, team, 'timeout'); window.qsa('.btn-alternative').forEach((btn, idx) => { btn.style.pointerEvents = 'none'; if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); else btn.classList.add('correct'); }); const tempoAudio = Math.random() > 0.5 ? 'voice_tempo1' : 'voice_tempo2'; window.audioSystem.play(tempoAudio); let tempoTriggered = false; const goTempo = () => { if(tempoTriggered) return; tempoTriggered = true; setTimeout(() => { window.el('main-q-box').classList.remove('animate-shake'); window.showFeedbackAndNext("Tempo Esgotado!", 'time'); }, 800); }; window.audioSystem[tempoAudio].onended = goTempo; window.audioSystem[tempoAudio].onerror = goTempo; setTimeout(goTempo, 8000); };

window.selectAnswer = function(selectedIndex, buttonElement) { window.closeDraggableHologram(); if (window.isWaitingAnswer) return; clearInterval(window.timerInterval); window.el('timer-circle').classList.remove('timer-panic'); window.el('game-vignette').classList.remove('vignette-panic'); window.pendingAnswerIndex = selectedIndex; window.pendingButtonElement = buttonElement; if (window.questionStartTime) { window.teams[window.currentTeamIndex].responseTimes.push(Date.now() - window.questionStartTime); } window.el('bg-game').src = "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BACKGROUND_PERGUNTAS_SUSPENSE.png"; window.changeBrutusPose('tenso_cinematic'); window.el('spot-1').className = 'spotlight spot-left spot-tension'; window.el('spot-2').className = 'spotlight spot-right spot-tension'; const q = window.activeQuestions[window.globalQuestionIndex]; const letters = ['A', 'B', 'C', 'D']; window.el('confirm-letter').innerText = letters[selectedIndex]; window.el('confirm-text').innerText = q.options[selectedIndex]; buttonElement.classList.add('pulse-answer'); window.el('modal-confirm').classList.remove('hidden'); window.el('modal-confirm').classList.add('flex'); window.audioSystem.stop('suspense'); window.audioSystem.play('certeza'); const voiceName = Math.random() > 0.5 ? 'voice_certeza' : 'voice_posso'; window.audioSystem.play(voiceName); const btnSim = window.el('btn-confirm-sim'); const btnNao = window.el('btn-confirm-nao'); btnSim.classList.add('opacity-40', 'pointer-events-none', 'grayscale'); btnNao.classList.add('opacity-40', 'pointer-events-none', 'grayscale'); const enableButtons = () => { btnSim.classList.remove('opacity-40', 'pointer-events-none', 'grayscale'); btnNao.classList.remove('opacity-40', 'pointer-events-none', 'grayscale'); }; window.audioSystem[voiceName].onended = enableButtons; window.audioSystem[voiceName].onerror = enableButtons; setTimeout(enableButtons, 3500); setTimeout(() => { window.el('confirm-box').classList.remove('scale-95'); window.el('confirm-box').classList.add('scale-100'); }, 10); };
window.cancelAnswer = function() { window.teams[window.currentTeamIndex].responseTimes.pop(); window.questionStartTime = Date.now(); window.el('bg-game').src = "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BACKGROUND_PERGUNTAS_NORMAL.png"; window.changeBrutusPose('normal'); window.el('spot-1').className = 'spotlight spot-left spot-white'; window.el('spot-2').className = 'spotlight spot-right spot-white'; window.el('confirm-box').classList.remove('scale-100'); window.el('confirm-box').classList.add('scale-95'); setTimeout(() => { window.el('modal-confirm').classList.add('hidden'); window.el('modal-confirm').classList.remove('flex'); }, 300); if(window.pendingButtonElement) window.pendingButtonElement.classList.remove('pulse-answer'); window.pendingAnswerIndex = null; window.pendingButtonElement = null; window.audioSystem.stop('certeza'); window.audioSystem.play('suspense', true); window.resumeTimer(); };

window.confirmAnswer = function() { window.el('modal-confirm').classList.add('hidden'); window.el('modal-confirm').classList.remove('flex'); window.isWaitingAnswer = true; const team = window.teams[window.currentTeamIndex]; const q = window.activeQuestions[window.globalQuestionIndex]; window.el('bg-game').classList.add('dim-bg-extreme'); window.el('char-host').classList.add('dim-bg-extreme'); window.el('question-panel-wrapper').classList.add('dim-bg-extreme'); window.el('spot-1').className = 'spotlight spot-left'; window.el('spot-2').className = 'spotlight spot-right'; window.el('spot-1').style.opacity = '0'; window.el('spot-2').style.opacity = '0'; window.qsa('.btn-alternative').forEach(btn => { if(btn !== window.pendingButtonElement) { btn.classList.add('tension-dim'); btn.style.pointerEvents = 'none'; } }); window.pendingButtonElement.classList.remove('pulse-answer'); window.pendingButtonElement.classList.add('animate-suspense', 'tension-focus'); window.tensionFlashesInterval = setInterval(() => { if(Math.random() > 0.5) { const f = window.el('camera-flash-overlay'); f.classList.remove('do-flash'); void f.offsetWidth; f.classList.add('do-flash'); } }, 600); setTimeout(() => { clearInterval(window.tensionFlashesInterval); window.pendingButtonElement.classList.remove('animate-suspense', 'tension-focus'); window.el('bg-game').classList.remove('dim-bg-extreme'); window.el('char-host').classList.remove('dim-bg-extreme'); window.el('question-panel-wrapper').classList.remove('dim-bg-extreme'); window.qsa('.btn-alternative').forEach(btn => btn.classList.remove('tension-dim')); window.el('spot-1').style.opacity = ''; window.el('spot-2').style.opacity = ''; const isCorrect = window.pendingAnswerIndex === q.answer; if (isCorrect) { window.el('bg-game').src = "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BACKGROUND_FEEDBACK_ACERTO.png"; window.changeBrutusPose('acerto'); window.el('spot-1').className = 'spotlight spot-left spot-green'; window.el('spot-2').className = 'spotlight spot-right spot-green'; team.level++; window.globalQuestionIndex++; window.lastAnsweredQuestion = q; window.recordAnswerSnapshot(q, window.pendingAnswerIndex, true, team); window.audioSystem.stopAll(); window.audioSystem.play('certa'); window.audioSystem.play('voice_acerto'); window.pendingButtonElement.classList.add('flash-correct'); window.el('award-display').classList.add('animate-award-pop'); window.qsa('.btn-alternative').forEach((btn, idx) => { if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); }); const floatScore = window.ce('div'); floatScore.className = 'floating-score'; floatScore.innerText = `+${window.awards[team.level-1]}`; window.pendingButtonElement.appendChild(floatScore); let nextActionTriggered = false; const goNext = () => { if (nextActionTriggered) return; nextActionTriggered = true; setTimeout(() => { const gameScreen = window.el('screen-game'); gameScreen.style.transition = 'opacity 0.6s ease'; gameScreen.style.opacity = '0'; setTimeout(() => { if(team.level < 16) { gameScreen.style.opacity = '1'; window.advanceToNextTurn(); } else { team.status = 'won'; window.audioSystem.stopAll(); window.audioSystem.play('vitoria'); window.el('final-win-award').innerText = "1 MILHÃO"; window.el('end-win-team').innerText = window.isStudentMode ? `Fim de Treino: ${team.name}` : `Equipe Campeã: ${team.name}`; const winScreen = window.el('screen-end-win'); winScreen.classList.remove('hidden'); winScreen.classList.add('active'); window.checkGameEnd('win'); setTimeout(() => { const winBox = window.el('win-box'); winBox.classList.remove('scale-90', 'opacity-0'); winBox.classList.add('scale-100', 'opacity-100'); window.triggerConfetti(); }, 300); } }, 600); }, 1200); }; window.audioSystem.voice_acerto.onended = goNext; window.audioSystem.voice_acerto.onerror = goNext; setTimeout(goNext, 8000); } else { window.el('bg-game').src = "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BACKGROUND_FEEDBACK_ERRO.png"; window.changeBrutusPose('erro'); window.el('spot-1').className = 'spotlight spot-left spot-red'; window.el('spot-2').className = 'spotlight spot-right spot-red'; window.el('main-q-box').classList.add('animate-shake'); team.status = 'lost'; window.globalQuestionIndex++; window.lastAnsweredQuestion = q; window.recordAnswerSnapshot(q, window.pendingAnswerIndex, false, team); window.audioSystem.stopAll(); window.audioSystem.play('errou'); window.audioSystem.play('voice_errou'); window.pendingButtonElement.classList.add('wrong'); window.qsa('.btn-alternative')[q.answer].classList.add('correct'); window.qsa('.btn-alternative').forEach((btn, idx) => { if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); }); let erroTriggered = false; const goErro = () => { if (erroTriggered) return; erroTriggered = true; setTimeout(() => { window.el('main-q-box').classList.remove('animate-shake'); window.showFeedbackAndNext("Resposta Incorreta!", 'wrong'); }, 800); }; window.audioSystem.voice_errou.onended = goErro; window.audioSystem.voice_errou.onerror = goErro; setTimeout(goErro, 8000); } }, 5000); };

window.checkGameEnd = function(screenType) { let activeCount = window.teams.filter(t => t.status === 'playing').length; const btn = window.el(`btn-end-${screenType}`); const btnText = window.el(`btn-end-${screenType}-text`); if (activeCount === 0) { btnText.innerText = "VER RESULTADOS"; btn.onclick = () => { window.el(`screen-end-${screenType}`).classList.remove('active'); window.showLeaderboard(); }; } else { btnText.innerText = "CONTINUAR JOGO"; btn.onclick = () => { window.el(`screen-end-${screenType}`).style.opacity = '0'; setTimeout(() => { window.el(`screen-end-${screenType}`).classList.remove('active'); window.el('screen-game').classList.add('active'); window.advanceToNextTurn(); }, 500); }; } };
window.advanceToNextTurn = function() { let next = (window.currentTeamIndex + 1) % window.teams.length; let found = false; let loops = 0; while (loops < window.teams.length) { if (window.teams[next].status === 'playing') { found = true; break; } next = (next + 1) % window.teams.length; loops++; } if (found) { window.currentTeamIndex = next; window.showTurnTransition(window.teams[window.currentTeamIndex].name, () => { window.loadQuestion(); window.audioSystem.play('suspense', true); }); } else { window.showLeaderboard(); } };

// --- 8. AJUDAS DO JOGO ---
window.useHelp = function(type) { const team = window.teams[window.currentTeamIndex]; if (type !== 'pular' && team.helps[type]) return; if (type === 'pular' && team.helps.pular >= 3) { window.showSystemMessage("Aviso", "Sem pulos disponíveis.", "info"); window.audioSystem.play('voice_sem_pulos'); return; } window.closeHelp(); if (type === 'eliminar') { window.audioSystem.play('eliminar'); window.pauseTimer(); team.helps.eliminar = true; window.saveProgress(); const cartas = [0, 1, 2, 3].sort(() => Math.random() - 0.5); const container = window.el('cards-container'); container.innerHTML = ''; cartas.forEach((val) => { container.innerHTML += `<div class="w-20 h-32 cursor-pointer flip-card" onclick="window.chooseCarta(${val}, this)"><div class="flip-card-inner w-full h-full relative"><div class="flip-card-front absolute inset-0 bg-blue-900 border-2 border-yellow-400 rounded-xl flex items-center justify-center text-white font-black">?</div><div class="flip-card-back absolute inset-0 bg-white border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center p-2 text-black"><span class="text-blue-950 font-black font-orbitron text-xs">${val===0?'REI':val===1?'ÁS':val===2?'DUAS':'TRÊS'}</span></div></div></div>`; }); window.el('modal-cartas').classList.remove('hidden'); window.el('modal-cartas').classList.add('flex'); } else if (type === 'palpite') { window.audioSystem.play('plateia'); window.audioSystem.play('voice_palpite'); window.pauseTimer(); team.helps.palpite = true; window.saveProgress(); const q = window.activeQuestions[window.globalQuestionIndex]; const container = window.el('audience-bars'); container.innerHTML = ''; [0, 1, 2, 3].forEach(i => { let v = i === q.answer ? 65 : 11; container.innerHTML += `<div class="flex items-center w-full gap-4 text-xs font-bold"><div class="w-6 h-6 rounded-full bg-blue-950 border border-cyan-400 flex items-center justify-center">${['A','B','C','D'][i]}</div><div class="w-full bg-black/50 h-6 rounded-full relative overflow-hidden"><div class="h-full bg-yellow-500" style="width:${v}%"></div><span class="absolute right-4 text-white">${v}%</span></div></div>`; }); window.el('modal-audience').classList.remove('hidden'); window.el('modal-audience').classList.add('flex'); } else if (type === 'dica') { window.audioSystem.play('dica'); window.audioSystem.play('voice_dica'); window.pauseTimer(); team.helps.dica = true; window.saveProgress(); const q = window.activeQuestions[window.globalQuestionIndex]; const container = window.el('dica-boards'); container.innerHTML = ''; [1,2,3].forEach(idx => { container.innerHTML += `<div class="flex-1 bg-blue-950 border border-yellow-500 rounded-xl p-4 text-center"><span class="text-cyan-400 text-[10px] block mb-2">Especialista ${idx}</span><div class="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto text-red-700 font-bold mb-2">${['A','B','C','D'][q.answer]}</div><p class="text-white text-[11px] truncate">${q.options[q.answer]}</p></div>`; }); window.el('modal-dica').classList.remove('hidden'); window.el('modal-dica').classList.add('flex'); } else if (type === 'pular') { window.el('skips-left').innerText = 3 - team.helps.pular; window.el('modal-pular').classList.remove('hidden'); window.el('modal-pular').classList.add('flex'); } };
window.chooseCarta = function(val, element) { element.classList.add('flipped'); window.qsa('#cards-container .flip-card').forEach(c=>c.style.pointerEvents='none'); setTimeout(() => { window.el('modal-cartas').classList.add('hidden'); window.el('modal-cartas').classList.remove('flex'); const btns = window.qsa('#alternatives-container .btn-alternative'); const q = window.activeQuestions[window.globalQuestionIndex]; let wrong = [0,1,2,3].filter(i => i!==q.answer).sort(() => Math.random() - 0.5); for(let k=0; k<val; k++) if(wrong[k]!==undefined) btns[wrong[k]].classList.add('animate-eliminate'); window.resumeTimer(); }, 2000); };
window.confirmStop = function() { window.isWaitingAnswer = true; window.el('modal-parar').classList.add('hidden'); window.el('modal-parar').classList.remove('flex'); const val = window.teams[window.currentTeamIndex].level === 0 ? "0" : window.awards[window.teams[window.currentTeamIndex].level - 1]; window.teams[window.currentTeamIndex].status = 'stopped'; window.globalQuestionIndex++; window.saveProgress(); window.el('final-stop-award').innerText = val; window.el('end-stop-team').innerText = `Equipe Parou: ${window.teams[window.currentTeamIndex].name}`; window.changeBrutusPose('consolando'); window.el('screen-game').classList.remove('active'); window.el('screen-end-stop').classList.add('active'); window.checkGameEnd('stop'); };
window.confirmSkip = function() { window.cancelSkip(); window.teams[window.currentTeamIndex].helps.pular++; window.globalQuestionIndex++; window.saveProgress(); if(window.globalQuestionIndex < window.activeQuestions.length) window.loadQuestion(); else window.showSystemMessage("Fim", "Sem perguntas para pular.", "error"); };
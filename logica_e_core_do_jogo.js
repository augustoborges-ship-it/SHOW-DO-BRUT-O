// --- AUTENTICAÇÃO E PERFIS ---
function authProf() { const pin = el('prof-pin-input').value.trim(); if (pin === '1234') { closeProfLogin(); checkLGPDFirst(); } else { el('login-error').classList.remove('hidden'); } }
function checkLGPDFirst() { const accepted = readJSONKey(STORAGE_KEYS.lgpd, false); if (accepted) { enterProfDashboard(); } else { el('modal-lgpd').classList.remove('hidden'); el('modal-lgpd').classList.add('flex'); } }
function acceptLGPD() { if (!el('lgpd-checkbox').checked) { alert("Marque a caixa para concordar."); return; } writeJSONKey(STORAGE_KEYS.lgpd, true); el('modal-lgpd').classList.add('hidden'); enterProfDashboard(); }
function declineLGPD() { el('modal-lgpd').classList.add('hidden'); }
function logoutProf() { qsa('.screen').forEach(s => s.classList.remove('active')); el('screen-home').classList.add('active'); }

// --- GESTÃO DE ESTADO E PROGRESSO ---
function saveProgress() { if (!activeQuestions || !activeQuestions.length || !teams || !teams.length) return; writeJSONKey(STORAGE_KEYS.state, { version: 2, savedAt: new Date().toISOString(), teams, currentTeamIndex, gameMode, isStudentMode, activeQuestions, globalQuestionIndex, timeLeft, answerHistory, currentStudentTelemetryKey: window.currentStudentTelemetryKey || null }); }
function clearProgress() { removeStorageKey(STORAGE_KEYS.state); }
function resumeGame() { const st = readJSONKey(STORAGE_KEYS.state, null); if(!st || !Array.isArray(st.teams) || !Array.isArray(st.activeQuestions) || !st.activeQuestions.length) { clearProgress(); showSystemMessage("Aviso", "Não há partida salva válida para retomar.", "info"); return; } teams = st.teams; currentTeamIndex = Number.isInteger(st.currentTeamIndex) ? st.currentTeamIndex : 0; gameMode = st.gameMode || 'single'; isStudentMode = !!st.isStudentMode; activeQuestions = st.activeQuestions; globalQuestionIndex = Number.isInteger(st.globalQuestionIndex) ? st.globalQuestionIndex : 0; timeLeft = Number.isFinite(st.timeLeft) ? st.timeLeft : 30; answerHistory = Array.isArray(st.answerHistory) ? st.answerHistory : []; window.currentStudentTelemetryKey = st.currentStudentTelemetryKey || window.currentStudentTelemetryKey || null; qsa('.screen').forEach(screen => screen.classList.remove('active')); el('screen-game').classList.add('active'); el('hud-team').style.display = gameMode === 'multi' ? 'flex' : 'none'; audioSystem.stopAll(); audioSystem.play('suspense', true); loadQuestion(); }
function recordAnswerSnapshot(question, selectedIndex, wasCorrect, team, reason = 'answer') { answerHistory.push({ questionId: question ? question.id : null, bncc: question ? (question.bncc || "N/A") : "N/A", proficiencia: question ? (question.proficiencia || "N/A") : "N/A", componente: question ? (question.componente || "N/A") : "N/A", teamName: team ? team.name : null, selectedIndex, selectedText: (question && selectedIndex !== null && selectedIndex >= 0) ? question.options[selectedIndex] : null, correctIndex: question ? question.answer : null, wasCorrect, reason, levelAfter: team ? team.level : null, timestamp: new Date().toISOString() }); saveProgress(); }

// --- MOTOR DE SESSÕES ---
function startGame() {
    clearProgress(); isStudentMode = false; const errDiv = el('setup-error-msg'); if(errDiv) errDiv.remove();
    const showError = (msg) => { const e = ce('div'); e.id = 'setup-error-msg'; e.className = 'mt-4 bg-red-900/80 border-2 border-red-500 text-white font-bold p-4 rounded-xl text-center shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'; e.innerText = msg; el('setup-action-area').prepend(e); };
    const selectedYears = Array.from(qsa('#screen-setup input[id^="ano"]:checked')).map(cb => cb.value.toLowerCase()); const selectedMundos = Array.from(qsa('#screen-setup input[id^="mundo"]:checked')).map(cb => cb.value.toLowerCase()); const qSource = qs('input[name="q_source"]:checked').value;
    if (selectedYears.length === 0 || selectedMundos.length === 0) { showError("ERRO: Selecione ao menos um Ano e uma Disciplina."); return; }
    const mode = qs('input[name="gamemode"]:checked').value; const isAutoMode = el('teams-inputs-auto').classList.contains('flex');
    teams = [];
    if (mode === 'single') { const t1 = el('team1').value.trim() || "Jogador 1"; teams.push({ name: t1, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }); }
    else {
        if (isAutoMode) {
            const turmaId = el('setup-select-turma').value; if (!turmaId) { showError("ERRO: Selecione uma turma."); return; }
            const turma = allTurmas.find(t => t.id === turmaId); const numTeams = parseInt(el('auto-team-count').value);
            if (!turma || turma.students.length < numTeams) { showError(`ERRO: A turma precisa ter no mínimo ${numTeams} alunos.`); return; }
            let shuffledStudents = [...turma.students].sort(() => Math.random() - 0.5);
            for(let i = 0; i < numTeams; i++) teams.push({ name: `Equipe ${i+1}`, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: turma.id, students: [], responseTimes: [] });
            shuffledStudents.forEach((student, index) => { teams[index % numTeams].students.push(student); });
        } else {
            const t1 = el('team1').value.trim(); const t2 = el('team2').value.trim(); const t3 = el('team3').value.trim(); const t4 = el('team4').value.trim();
            if(t1) teams.push({ name: t1, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
            if(t2) teams.push({ name: t2, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
            if(t3) teams.push({ name: t3, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
            if(t4) teams.push({ name: t4, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] });
        }
    }
    if (teams.length === 0) { showError("ERRO: Configure pelo menos 1 Equipe."); return; }
    gameMode = teams.length > 1 ? 'multi' : 'single'; currentTeamIndex = 0;
    let filteredQuestions = allQuestions.filter(q => { let matchesYear = selectedYears.some(y => q.ano.includes(y) || q.category.toLowerCase().includes(y)); let matchesMundo = selectedMundos.some(m => { if (m === 'português') return q.componente.includes('português'); return q.componente.includes(m); }); let matchesSource = true; if (qSource === 'bncc') matchesSource = !q.isCustom; if (qSource === 'custom') matchesSource = q.isCustom; return matchesYear && matchesMundo && matchesSource; });
    if (filteredQuestions.length === 0) { showError(`AVISO: Não há questões para os filtros selecionados.`); return; }
    filteredQuestions = filteredQuestions.sort(() => Math.random() - 0.5); activeQuestions = []; let totalNeeded = 16 * teams.length; while(activeQuestions.length < totalNeeded) { for(let q of filteredQuestions) if(activeQuestions.length < totalNeeded) activeQuestions.push(q); } globalQuestionIndex = 0; el('screen-setup').classList.remove('active'); fireUpGame();
}

function startStudentGame() {
    clearProgress(); isStudentMode = true; el('student-error-area').innerHTML = '';
    const pName = el('student-name').value.trim() || "Herói Anônimo"; const year = el('student-year').value.toLowerCase(); const subject = el('student-subject').value.toLowerCase(); const diff = qs('input[name="student-diff"]:checked').value.toLowerCase();
    teams = [{ name: pName, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }]; gameMode = 'single'; currentTeamIndex = 0;
    let filteredQuestions = allQuestions.filter(q => { let matchesYear = q.ano.includes(year) || q.category.toLowerCase().includes(year); let matchesSubj = q.componente.includes(subject); let matchesDiff = false; if (diff === 'fácil') matchesDiff = q.proficiencia.includes('básico') || q.proficiencia.includes('fácil') || q.proficiencia.includes('baixo'); else if (diff === 'médio') matchesDiff = q.proficiencia.includes('adequado') || q.proficiencia.includes('médio'); else if (diff === 'difícil') matchesDiff = q.proficiencia.includes('avançado') || q.proficiencia.includes('difícil') || q.proficiencia.includes('alto'); return matchesYear && matchesSubj && matchesDiff; });
    if(filteredQuestions.length === 0) { filteredQuestions = allQuestions.filter(q => (q.ano.includes(year) || q.category.toLowerCase().includes(year)) && q.componente.includes(subject)); if(filteredQuestions.length > 0) showSystemMessage("Aviso", "Questões aproximadas carregadas.", "info"); }
    if (filteredQuestions.length === 0) { el('student-error-area').innerHTML = `<div class="bg-red-900/80 border-2 border-red-500 text-white font-bold p-3 rounded-xl text-center mb-4">Nenhuma questão para este filtro.</div>`; return; }
    
    const todayStr = new Date().toISOString().split('T')[0]; window.currentStudentTelemetryKey = `${pName.toLowerCase()}_${todayStr}`;
    let telemetry = readJSONKey(STORAGE_KEYS.telemetry, {}); if (!telemetry[window.currentStudentTelemetryKey]) { telemetry[window.currentStudentTelemetryKey] = { attempts: 0, sent: false }; } telemetry[window.currentStudentTelemetryKey].attempts++; writeJSONKey(STORAGE_KEYS.telemetry, telemetry);
    
    filteredQuestions = filteredQuestions.sort(() => Math.random() - 0.5); activeQuestions = []; let totalNeeded = 16; while(activeQuestions.length < totalNeeded) { for(let q of filteredQuestions) if(activeQuestions.length < totalNeeded) activeQuestions.push(q); } globalQuestionIndex = 0; el('screen-setup-student').classList.remove('active'); fireUpGame();
}

function fireUpGame() {
    if (gameMode === 'multi') {
        el('hud-team').style.display = 'flex'; const isAuto = teams.some(t => t.turmaId !== null);
        if(isAuto) {
            const transScreen = el('screen-transition'); el('transition-text').innerHTML = `Sorteando Alunos...<br><span class="text-2xl text-cyan-300 font-montserrat mt-4 block">Formando Equipes Mágicas</span>`;
            transScreen.classList.remove('hidden'); transScreen.classList.add('flex'); transScreen.style.opacity = '1'; audioSystem.play('suspense');
            setTimeout(() => { transScreen.style.opacity = '0'; setTimeout(() => { transScreen.classList.add('hidden'); transScreen.classList.remove('flex'); showTurnTransition(teams[currentTeamIndex].name, () => { el('screen-game').classList.add('active'); audioSystem.stopAll(); audioSystem.play('abertura'); audioSystem.play('voice_comecar'); setTimeout(() => { audioSystem.play('suspense', true); }, 5000); loadQuestion(); }); }, 500); }, 2500);
        } else { showTurnTransition(teams[currentTeamIndex].name, () => { el('screen-game').classList.add('active'); audioSystem.stopAll(); audioSystem.play('abertura'); audioSystem.play('voice_comecar'); setTimeout(() => { audioSystem.play('suspense', true); }, 5000); loadQuestion(); }); }
    } else { el('hud-team').style.display = 'none'; el('screen-game').classList.add('active'); audioSystem.stopAll(); audioSystem.play('abertura'); audioSystem.play('voice_comecar'); setTimeout(() => { audioSystem.play('suspense', true); }, 5000); loadQuestion(); }
}

function loadQuestion() {
    isWaitingAnswer = false; const team = teams[currentTeamIndex]; const q = activeQuestions[globalQuestionIndex]; if(gameMode === 'multi') el('current-team-name-hud').innerText = team.name;
    restoreHelpsUI(); el('q-counter').innerText = team.level + 1;
    
    el('bg-game').classList.remove('dim-bg-extreme'); el('char-host').classList.remove('dim-bg-extreme'); el('question-panel-wrapper').classList.remove('dim-bg-extreme');
    el('spot-1').className = 'spotlight spot-left spot-white'; el('spot-2').className = 'spotlight spot-right spot-white';
    changeBrutusPose('normal');
    
    const qWrapper = el('question-panel-wrapper'); qWrapper.classList.remove('animate-q-slide'); void qWrapper.offsetWidth; qWrapper.classList.add('animate-q-slide');
    el('award-display').classList.remove('animate-award-pop');

    let profColor = 'text-white'; let profDisplay = (q.proficiencia || '').toUpperCase(); let prof = q.proficiencia ? q.proficiencia.toLowerCase() : '';
    if (prof.includes('básico') || prof.includes('fácil') || prof.includes('baixo')) { profColor = 'text-orange-400 drop-shadow-md'; profDisplay = 'BÁSICO'; } else if (prof.includes('adequado') || prof.includes('médio')) { profColor = 'text-green-400 drop-shadow-md'; profDisplay = 'ADEQUADO'; } else if (prof.includes('avançado') || prof.includes('difícil')) { profColor = 'text-blue-400 drop-shadow-md'; profDisplay = 'AVANÇADO'; }
    el('q-category').innerHTML = `${(q.componente || '').toUpperCase()} &bull; ${(q.ano || '').toUpperCase()} &bull; PROFICIÊNCIA: <span class="${profColor}">${profDisplay}</span>`; 
    
    const qTextEl = el('q-text'); qTextEl.innerHTML = ''; qTextEl.classList.add('typing-cursor');
    let txt = q.text; let idx = 0; if(typeWriterTimeout) clearTimeout(typeWriterTimeout);
    function type() { if(idx < txt.length) { qTextEl.innerHTML = txt.substring(0, idx+1); idx++; typeWriterTimeout = setTimeout(type, 25); } else { qTextEl.classList.remove('typing-cursor'); } }
    type();
    
    const btnHologram = el('btn-toggle-hologram'); const dragImgEl = el('drag-q-image'); closeDraggableHologram(); btnHologram.classList.add('hidden'); btnHologram.classList.remove('flex'); dragImgEl.src = "";
    if (q.image_url) { const finalUrl = normalizeImageUrl(q.image_url); dragImgEl.onload = () => { btnHologram.classList.remove('hidden'); btnHologram.classList.add('flex'); }; dragImgEl.src = finalUrl; }
    el('q-id').innerText = q.id !== "SEM-ID" ? `ID: ${q.id}` : ""; el('award-display').innerText = awards[team.level] || "1 MILHÃO"; el('stop-award-display').innerText = team.level === 0 ? "0" : awards[team.level - 1]; el('lose-award-display').innerText = loseAwards[team.level] || "0";
    const container = el('alternatives-container'); container.innerHTML = ''; const letters = ['A', 'B', 'C', 'D'];
    audioSystem.play('pergunta'); if (team.level === 0) { setTimeout(() => { if (team.level === 0 && !isWaitingAnswer) audioSystem.play('voice_pergunta'); }, 3500); } else audioSystem.play('voice_proxima');
    q.options.forEach((opt, i) => { const btn = ce('button'); btn.className = 'btn-alternative min-h-[3.5rem] rounded-full flex items-center px-4 py-2 relative overflow-hidden group transition-all'; btn.onclick = () => selectAnswer(i, btn); btn.innerHTML = `<div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 z-10"><span class="text-red-700 font-bold text-lg font-orbitron">${letters[i]}</span></div><span class="text-white font-bold text-sm md:text-base w-full text-center z-10 font-montserrat drop-shadow-md">${opt}</span>`; container.appendChild(btn); });
    resetTimer(); saveProgress(); window.questionStartTime = Date.now();
}

function resetTimer() { 
    clearInterval(timerInterval); if (window.audioTimeout) clearTimeout(window.audioTimeout); 
    timeLeft = 30; const timerCircle = el('timer-circle'); const timerDisplay = el('timer-display');
    timerCircle.classList.remove('timer-panic'); timerDisplay.classList.remove('text-red-500'); el('game-vignette').classList.remove('vignette-panic');
    timerDisplay.innerText = timeLeft; window.isAudioPlaying = true; 
    audioSystem.voice_pergunta.onended = () => { window.isAudioPlaying = false; }; audioSystem.voice_proxima.onended = () => { window.isAudioPlaying = false; }; 
    window.audioTimeout = setTimeout(() => { window.isAudioPlaying = false; }, teams[currentTeamIndex].level === 0 ? 25000 : 6000); 
    timerInterval = setInterval(() => { 
        if(isWaitingAnswer || window.isAudioPlaying) return; 
        timeLeft--; timerDisplay.innerText = timeLeft; 
        if(timeLeft <= 5) { el('game-vignette').classList.add('vignette-panic'); }
        if(timeLeft === 10) { timerCircle.classList.add('timer-panic'); timerDisplay.classList.add('text-red-500'); }
        if(timeLeft <= 0) { clearInterval(timerInterval); forceTimeOut(); } 
    }, 1000); 
}

function pauseTimer() { clearInterval(timerInterval); el('timer-circle').classList.remove('timer-panic'); el('game-vignette').classList.remove('vignette-panic'); }
function resumeTimer() { resetTimer(); }

function forceTimeOut() { 
    closeDraggableHologram(); el('game-vignette').classList.remove('vignette-panic'); const team = teams[currentTeamIndex]; team.status = 'lost'; teams[currentTeamIndex].responseTimes.push(30000); audioSystem.stopAll(); audioSystem.play('errou'); isWaitingAnswer = true; 
    el('spot-1').className = 'spotlight spot-left spot-red'; el('spot-2').className = 'spotlight spot-right spot-red'; el('main-q-box').classList.add('animate-shake'); changeBrutusPose('erro');
    const q = activeQuestions[globalQuestionIndex]; window.lastAnsweredQuestion = q; recordAnswerSnapshot(q, null, false, team, 'timeout');
    qsa('.btn-alternative').forEach((btn, idx) => { btn.style.pointerEvents = 'none'; if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); else btn.classList.add('correct'); });
    const tempoAudio = Math.random() > 0.5 ? 'voice_tempo1' : 'voice_tempo2'; audioSystem.play(tempoAudio); 
    let tempoTriggered = false; const goTempo = () => { if(tempoTriggered) return; tempoTriggered = true; setTimeout(() => { el('main-q-box').classList.remove('animate-shake'); showFeedbackAndNext("Tempo Esgotado!", 'time'); }, 800); }; audioSystem[tempoAudio].onended = goTempo; audioSystem[tempoAudio].onerror = goTempo; setTimeout(goTempo, 8000); 
}

function selectAnswer(selectedIndex, buttonElement) { 
    closeDraggableHologram(); if (isWaitingAnswer) return; clearInterval(timerInterval); el('timer-circle').classList.remove('timer-panic'); el('game-vignette').classList.remove('vignette-panic'); pendingAnswerIndex = selectedIndex; pendingButtonElement = buttonElement; 
    if (window.questionStartTime) { teams[currentTeamIndex].responseTimes.push(Date.now() - window.questionStartTime); } 
    
    changeBrutusPose('tenso_cinematic'); 
    el('spot-1').className = 'spotlight spot-left spot-tension'; el('spot-2').className = 'spotlight spot-right spot-tension';

    const q = activeQuestions[globalQuestionIndex]; const letters = ['A', 'B', 'C', 'D']; 
    el('confirm-letter').innerText = letters[selectedIndex]; el('confirm-text').innerText = q.options[selectedIndex]; 
    buttonElement.classList.add('pulse-answer'); 
    el('modal-confirm').classList.remove('hidden'); el('modal-confirm').classList.add('flex'); 
    audioSystem.stop('suspense'); audioSystem.play('certeza'); const voiceName = Math.random() > 0.5 ? 'voice_certeza' : 'voice_posso'; audioSystem.play(voiceName); 
    const btnSim = el('btn-confirm-sim'); const btnNao = el('btn-confirm-nao'); 
    btnSim.classList.add('opacity-40', 'pointer-events-none', 'grayscale'); btnNao.classList.add('opacity-40', 'pointer-events-none', 'grayscale'); 
    const enableButtons = () => { btnSim.classList.remove('opacity-40', 'pointer-events-none', 'grayscale'); btnNao.classList.remove('opacity-40', 'pointer-events-none', 'grayscale'); }; 
    audioSystem[voiceName].onended = enableButtons; audioSystem[voiceName].onerror = enableButtons; setTimeout(enableButtons, 3500); 
    setTimeout(() => { el('confirm-box').classList.remove('scale-95'); el('confirm-box').classList.add('scale-100'); }, 10); 
}

function cancelAnswer() { 
    teams[currentTeamIndex].responseTimes.pop(); window.questionStartTime = Date.now(); changeBrutusPose('normal'); 
    el('spot-1').className = 'spotlight spot-left spot-white'; el('spot-2').className = 'spotlight spot-right spot-white';
    el('confirm-box').classList.remove('scale-100'); el('confirm-box').classList.add('scale-95'); 
    setTimeout(() => { el('modal-confirm').classList.add('hidden'); el('modal-confirm').classList.remove('flex'); }, 300); 
    if(pendingButtonElement) pendingButtonElement.classList.remove('pulse-answer'); 
    pendingAnswerIndex = null; pendingButtonElement = null; audioSystem.stop('certeza'); audioSystem.play('suspense', true); resumeTimer(); 
}

function confirmAnswer() {
    el('modal-confirm').classList.add('hidden'); el('modal-confirm').classList.remove('flex'); 
    isWaitingAnswer = true; const team = teams[currentTeamIndex]; const q = activeQuestions[globalQuestionIndex]; 
    
    el('bg-game').classList.add('dim-bg-extreme'); el('char-host').classList.add('dim-bg-extreme'); el('question-panel-wrapper').classList.add('dim-bg-extreme');
    el('spot-1').className = 'spotlight spot-left'; el('spot-2').className = 'spotlight spot-right'; el('spot-1').style.opacity = '0'; el('spot-2').style.opacity = '0';
    
    qsa('.btn-alternative').forEach(btn => { if(btn !== pendingButtonElement) { btn.classList.add('tension-dim'); btn.style.pointerEvents = 'none'; } }); 
    pendingButtonElement.classList.remove('pulse-answer'); pendingButtonElement.classList.add('animate-suspense', 'tension-focus');

    tensionFlashesInterval = setInterval(() => { if(Math.random() > 0.5) { const f = el('camera-flash-overlay'); f.classList.remove('do-flash'); void f.offsetWidth; f.classList.add('do-flash'); } }, 600);

    setTimeout(() => {
        clearInterval(tensionFlashesInterval);
        pendingButtonElement.classList.remove('animate-suspense', 'tension-focus'); 
        el('bg-game').classList.remove('dim-bg-extreme'); el('char-host').classList.remove('dim-bg-extreme'); el('question-panel-wrapper').classList.remove('dim-bg-extreme'); qsa('.btn-alternative').forEach(btn => btn.classList.remove('tension-dim')); el('spot-1').style.opacity = ''; el('spot-2').style.opacity = '';
        
        const isCorrect = pendingAnswerIndex === q.answer;
        if (isCorrect) {
            changeBrutusPose('acerto'); el('spot-1').className = 'spotlight spot-left spot-green'; el('spot-2').className = 'spotlight spot-right spot-green'; team.level++; globalQuestionIndex++; window.lastAnsweredQuestion = q; recordAnswerSnapshot(q, pendingAnswerIndex, true, team); audioSystem.stopAll(); audioSystem.play('certa'); audioSystem.play('voice_acerto'); pendingButtonElement.classList.add('flash-correct'); el('award-display').classList.add('animate-award-pop'); qsa('.btn-alternative').forEach((btn, idx) => { if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); });
            
            const floatScore = ce('div'); floatScore.className = 'floating-score'; floatScore.innerText = `+${awards[team.level-1]}`; pendingButtonElement.appendChild(floatScore);

            let nextActionTriggered = false; const goNext = () => { if (nextActionTriggered) return; nextActionTriggered = true; setTimeout(() => { const gameScreen = el('screen-game'); gameScreen.style.transition = 'opacity 0.6s ease'; gameScreen.style.opacity = '0'; setTimeout(() => { if(team.level < 16) { gameScreen.style.opacity = '1'; advanceToNextTurn(); } else { team.status = 'won'; audioSystem.stopAll(); audioSystem.play('vitoria'); el('final-win-award').innerText = "1 MILHÃO"; el('end-win-team').innerText = isStudentMode ? `Fim de Treino: ${team.name}` : `Equipe Campeã: ${team.name}`; const winScreen = el('screen-end-win'); winScreen.classList.remove('hidden'); winScreen.classList.add('active'); checkGameEnd('win'); setTimeout(() => { const winBox = el('win-box'); winBox.classList.remove('scale-90', 'opacity-0'); winBox.classList.add('scale-100', 'opacity-100'); triggerConfetti(); }, 300); } }, 600); }, 1200); };
            audioSystem.voice_acerto.onended = goNext; audioSystem.voice_acerto.onerror = goNext; setTimeout(goNext, 8000); 
        } else {
            changeBrutusPose('erro'); el('spot-1').className = 'spotlight spot-left spot-red'; el('spot-2').className = 'spotlight spot-right spot-red'; el('main-q-box').classList.add('animate-shake'); team.status = 'lost'; globalQuestionIndex++; window.lastAnsweredQuestion = q; recordAnswerSnapshot(q, pendingAnswerIndex, false, team); audioSystem.stopAll(); audioSystem.play('errou'); audioSystem.play('voice_errou'); pendingButtonElement.classList.add('wrong'); qsa('.btn-alternative')[q.answer].classList.add('correct'); qsa('.btn-alternative').forEach((btn, idx) => { if(idx !== q.answer) btn.classList.add('fade-out-wrong-btn'); });
            let erroTriggered = false; const goErro = () => { if (erroTriggered) return; erroTriggered = true; setTimeout(() => { el('main-q-box').classList.remove('animate-shake'); showFeedbackAndNext("Resposta Incorreta!", 'wrong'); }, 800); }; audioSystem.voice_errou.onended = goErro; audioSystem.voice_errou.onerror = goErro; setTimeout(goErro, 8000);
        }
    }, 5000); 
}

function checkGameEnd(screenType) { let activeCount = teams.filter(t => t.status === 'playing').length; const btn = el(`btn-end-${screenType}`); const btnText = el(`btn-end-${screenType}-text`); if (activeCount === 0) { btnText.innerText = "VER RESULTADOS"; btn.onclick = () => { el(`screen-end-${screenType}`).classList.remove('active'); showLeaderboard(); }; } else { btnText.innerText = "CONTINUAR JOGO"; btn.onclick = () => { el(`screen-end-${screenType}`).style.opacity = '0'; setTimeout(() => { el(`screen-end-${screenType}`).classList.remove('active'); el('screen-game').classList.add('active'); advanceToNextTurn(); }, 500); }; } }
function advanceToNextTurn() { let next = (currentTeamIndex + 1) % teams.length; let found = false; let loops = 0; while (loops < teams.length) { if (teams[next].status === 'playing') { found = true; break; } next = (next + 1) % teams.length; loops++; } if (found) { currentTeamIndex = next; showTurnTransition(teams[currentTeamIndex].name, () => { loadQuestion(); audioSystem.play('suspense', true); }); } else { showLeaderboard(); } }

window.downloadBoletimOffline = function(hash, studentName) { const blob = new Blob([hash], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = ce('a'); a.href = url; const dateStr = new Date().toISOString().split('T')[0]; a.download = `Boletim_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.brutao`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); showSystemMessage("Sucesso", "Boletim salvo! Entregue este arquivo (.brutao) ao seu professor.", "success"); };

function useHelp(type) { const team = teams[currentTeamIndex]; if (type !== 'pular' && team.helps[type]) return; if (type === 'pular' && team.helps.pular >= 3) { showSystemMessage("Aviso", "Sem pulos disponíveis.", "info"); audioSystem.play('voice_sem_pulos'); return; } closeHelp(); if (type === 'eliminar') { audioSystem.play('eliminar'); pauseTimer(); team.helps.eliminar = true; saveProgress(); const cartas = [0, 1, 2, 3].sort(() => Math.random() - 0.5); const container = el('cards-container'); container.innerHTML = ''; cartas.forEach((val) => { container.innerHTML += `<div class="w-20 h-32 cursor-pointer flip-card" onclick="chooseCarta(${val}, this)"><div class="flip-card-inner w-full h-full relative"><div class="flip-card-front absolute inset-0 bg-blue-900 border-2 border-yellow-400 rounded-xl flex items-center justify-center text-white font-black">?</div><div class="flip-card-back absolute inset-0 bg-white border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center p-2 text-black"><span class="text-blue-950 font-black font-orbitron text-xs">${val===0?'REI':val===1?'ÁS':val===2?'DUAS':'TRÊS'}</span></div></div></div>`; }); el('modal-cartas').classList.remove('hidden'); el('modal-cartas').classList.add('flex'); } else if (type === 'palpite') { audioSystem.play('plateia'); audioSystem.play('voice_palpite'); pauseTimer(); team.helps.palpite = true; saveProgress(); const q = activeQuestions[globalQuestionIndex]; const container = el('audience-bars'); container.innerHTML = ''; [0, 1, 2, 3].forEach(i => { let v = i === q.answer ? 65 : 11; container.innerHTML += `<div class="flex items-center w-full gap-4 text-xs font-bold"><div class="w-6 h-6 rounded-full bg-blue-950 border border-cyan-400 flex items-center justify-center">${['A','B','C','D'][i]}</div><div class="w-full bg-black/50 h-6 rounded-full relative overflow-hidden"><div class="h-full bg-yellow-500" style="width:${v}%"></div><span class="absolute right-4 text-white">${v}%</span></div></div>`; }); el('modal-audience').classList.remove('hidden'); el('modal-audience').classList.add('flex'); } else if (type === 'dica') { audioSystem.play('dica'); audioSystem.play('voice_dica'); pauseTimer(); team.helps.dica = true; saveProgress(); const q = activeQuestions[globalQuestionIndex]; const container = el('dica-boards'); container.innerHTML = ''; [1,2,3].forEach(idx => { container.innerHTML += `<div class="flex-1 bg-blue-950 border border-yellow-500 rounded-xl p-4 text-center"><span class="text-cyan-400 text-[10px] block mb-2">Especialista ${idx}</span><div class="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto text-red-700 font-bold mb-2">${['A','B','C','D'][q.answer]}</div><p class="text-white text-[11px] truncate">${q.options[q.answer]}</p></div>`; }); el('modal-dica').classList.remove('hidden'); el('modal-dica').classList.add('flex'); } else if (type === 'pular') { el('skips-left').innerText = 3 - team.helps.pular; el('modal-pular').classList.remove('hidden'); el('modal-pular').classList.add('flex'); } }
window.chooseCarta = function(val, element) { element.classList.add('flipped'); qsa('#cards-container .flip-card').forEach(c=>c.style.pointerEvents='none'); setTimeout(() => { el('modal-cartas').classList.add('hidden'); el('modal-cartas').classList.remove('flex'); const btns = qsa('#alternatives-container .btn-alternative'); const q = activeQuestions[globalQuestionIndex]; let wrong = [0,1,2,3].filter(i => i!==q.answer).sort(() => Math.random() - 0.5); for(let k=0; k<val; k++) if(wrong[k]!==undefined) btns[wrong[k]].classList.add('animate-eliminate'); resumeTimer(); }, 2000); }

function confirmStop() { isWaitingAnswer = true; el('modal-parar').classList.add('hidden'); el('modal-parar').classList.remove('flex'); const val = teams[currentTeamIndex].level === 0 ? "0" : awards[teams[currentTeamIndex].level - 1]; teams[currentTeamIndex].status = 'stopped'; globalQuestionIndex++; saveProgress(); el('final-stop-award').innerText = val; el('end-stop-team').innerText = `Equipe Parou: ${teams[currentTeamIndex].name}`; changeBrutusPose('consolando'); el('screen-game').classList.remove('active'); el('screen-end-stop').classList.add('active'); checkGameEnd('stop'); }
function confirmSkip() { cancelSkip(); teams[currentTeamIndex].helps.pular++; globalQuestionIndex++; saveProgress(); if(globalQuestionIndex < activeQuestions.length) loadQuestion(); else showSystemMessage("Fim", "Sem perguntas para pular.", "error"); }

// --- GESTÃO DE TURMAS ---
function saveClass() { const name = el('add-class-name').value.trim(); if (!name) { el('add-class-error').classList.remove('hidden'); return; } const newClass = { id: `TURMA_${Date.now()}`, name: name, students: [] }; allTurmas.push(newClass); writeJSONKey(STORAGE_KEYS.classes, allTurmas); closeAddClassModal(); showSystemMessage("Sucesso", "Turma salva.", "success"); activeTurmaId = newClass.id; renderClassList(); updateClassDetailsView(); }
function deleteCurrentClass() { if(!activeTurmaId || !confirm("Excluir esta turma?")) return; allTurmas = allTurmas.filter(t => t.id !== activeTurmaId); writeJSONKey(STORAGE_KEYS.classes, allTurmas); activeTurmaId = null; renderClassList(); updateClassDetailsView(); }
function saveStudent() { const name = el('add-student-name').value.trim(); if (!name) { el('add-student-error').classList.remove('hidden'); return; } const idx = allTurmas.findIndex(t => t.id === activeTurmaId); if(idx === -1) return; allTurmas[idx].students.push({ id: `ALUNO_${Date.now()}`, name: name, race: el('add-student-race').value, isBolsa: el('add-student-bolsa').checked, isAEE: el('add-student-aee').checked }); writeJSONKey(STORAGE_KEYS.classes, allTurmas); closeAddStudentModal(); updateClassDetailsView(); renderClassList(); }
function deleteStudent(sid) { const idx = allTurmas.findIndex(t => t.id === activeTurmaId); if(idx === -1 || !confirm("Remover aluno?")) return; allTurmas[idx].students = allTurmas[idx].students.filter(s => s.id !== sid); writeJSONKey(STORAGE_KEYS.classes, allTurmas); updateClassDetailsView(); renderClassList(); }
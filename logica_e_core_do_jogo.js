#### 2. `logica_e_core_do_jogo.js`
**O que foi corrigido:** O filtro do Modo Aluno foi completamente estabilizado. Ele agora lê com segurança os valores dos `<select>` e dos *radio buttons*, evitando que o banco fique vazio. O processo de salvamento (Telemetry) e o QR Code também foram revisados.

```javascript:logica_e_core_do_jogo.js
// =========================================================================
// Arquivo: logica_e_core_do_jogo.js
// Função: Motor de Partida, Modo Aluno, QR Code e Relatórios
// =========================================================================

window.saveProgress = function() { 
    if (!window.activeQuestions || !window.teams) return; 
    if(window.STORAGE_KEYS && typeof window.writeJSONKey === 'function') {
        window.writeJSONKey(window.STORAGE_KEYS.state, { 
            version: 2, savedAt: new Date().toISOString(), teams: window.teams, 
            currentTeamIndex: window.currentTeamIndex, gameMode: window.gameMode, 
            isStudentMode: window.isStudentMode, activeQuestions: window.activeQuestions, 
            globalQuestionIndex: window.globalQuestionIndex, timeLeft: window.timeLeft, 
            answerHistory: window.answerHistory, currentStudentTelemetryKey: window.currentStudentTelemetryKey || null,
            missionId: window.CURRENT_MISSION_ID || null 
        }); 
    }
};

window.clearProgress = function() { if(window.STORAGE_KEYS) window.removeStorageKey(window.STORAGE_KEYS.state); };

// 1. INÍCIO DO MODO ALUNO
window.startStudentGame = function() {
    console.log("🚦 Iniciando Modo Aluno...");
    window.clearProgress(); window.isStudentMode = true; 
    
    var errArea = document.getElementById('student-error-area');
    if(errArea) errArea.innerHTML = '';
    
    var pNameEl = document.getElementById('student-name');
    var pName = (pNameEl && pNameEl.value.trim() !== "") ? pNameEl.value.trim() : "Herói Anônimo";
    
    var yearEl = document.getElementById('student-year');
    var anoEscolar = yearEl ? yearEl.value.toLowerCase() : "5º ano";
    
    var subjectEl = document.getElementById('student-subject');
    var disc = subjectEl ? subjectEl.value.toLowerCase() : "matemática";
    
    var diffRadios = document.querySelector('input[name="student-diff"]:checked');
    var difSelecionada = diffRadios ? diffRadios.value.toLowerCase() : (window.dificuldadeModoTreino || "fácil");
    
    var tagsAceitas = [];
    if (difSelecionada === "fácil") tagsAceitas = ["básico", "b1", "b2", "fácil", "baixo"];
    else if (difSelecionada === "médio") tagsAceitas = ["intermediário", "b3", "b4", "médio", "adequado"];
    else if (difSelecionada === "difícil") tagsAceitas = ["avançado", "b5", "b6", "difícil", "alto"];

    var numAnoBusca = String(anoEscolar).replace(/\D/g, "");

    // Se as questões ainda não estiverem na memória, força a inicialização
    if(!window.allQuestions || window.allQuestions.length === 0) {
        if(typeof window.initGameData === 'function') window.initGameData();
    }

    // Filtro Flexível (Nunca deixa a tela preta)
    window.questoesDaPartida = window.allQuestions.filter(function(q) {
        var bateAno = q.ano.includes(numAnoBusca);
        var bateDisc = q.componente.includes(disc);
        var bateDificuldade = tagsAceitas.some(t => q.proficiencia.includes(t));
        return bateAno && bateDisc && bateDificuldade;
    });

    if (window.questoesDaPartida.length === 0) {
        window.questoesDaPartida = window.allQuestions.filter(function(q) {
            return q.ano.includes(numAnoBusca) && q.componente.includes(disc);
        });
    }

    if (window.questoesDaPartida.length === 0) window.questoesDaPartida = [...window.allQuestions];

    if (window.questoesDaPartida.length === 0) {
        if(errArea) errArea.innerHTML = '<div class="bg-red-900 border-2 border-red-500 text-white font-bold p-3 rounded-xl text-center mb-4">Banco de Questões Vazio.</div>';
        return;
    }

    window.questoesDaPartida.sort(() => Math.random() - 0.5);

    window.teams = [{ name: pName, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }];
    window.gameMode = 'single'; window.currentTeamIndex = 0;
    
    if (window.STORAGE_KEYS && typeof window.writeJSONKey === 'function') {
        var todayStr = new Date().toISOString().split('T')[0]; 
        window.currentStudentTelemetryKey = pName.toLowerCase() + "_" + todayStr;
        var telemetry = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); 
        if (!telemetry[window.currentStudentTelemetryKey]) telemetry[window.currentStudentTelemetryKey] = { attempts: 0, sent: false };
        telemetry[window.currentStudentTelemetryKey].attempts++; 
        window.writeJSONKey(window.STORAGE_KEYS.telemetry, telemetry);
    }

    // Seleciona até 16 questões
    window.activeQuestions = window.questoesDaPartida.slice(0, 16);
    window.globalQuestionIndex = 0;

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    var gameScreen = document.getElementById('screen-game') || document.getElementById('tela-jogo');
    if(gameScreen) { gameScreen.classList.remove('hidden'); gameScreen.classList.add('active', 'flex'); }
    
    if (typeof window.fireUpGame === 'function') window.fireUpGame();
};

// 2. INÍCIO DO JOGO PROFESSOR
window.startGame = function() {
    window.clearProgress(); window.isStudentMode = false; 
    let selectedYears = Array.from(document.querySelectorAll('#screen-setup input[id^="ano"]:checked')).map(cb => cb.value.toLowerCase()); 
    let selectedMundos = Array.from(document.querySelectorAll('#screen-setup input[id^="mundo"]:checked')).map(cb => cb.value.toLowerCase()); 
    if (selectedYears.length === 0) selectedYears = ['5º ano']; if (selectedMundos.length === 0) selectedMundos = ['matemática'];
    
    window.teams = [{ name: "Equipe 1", level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }];
    window.gameMode = 'single'; window.currentTeamIndex = 0;
    
    if(!window.allQuestions || window.allQuestions.length === 0) window.initGameData();
    
    let filteredQuestions = window.allQuestions.filter(q => { 
        let matchesYear = selectedYears.some(y => q.ano.includes(y)); 
        let matchesMundo = selectedMundos.some(m => q.componente.includes(m)); 
        return matchesYear && matchesMundo; 
    });
    
    if (filteredQuestions.length === 0) filteredQuestions = [...window.allQuestions];
    filteredQuestions.sort(() => Math.random() - 0.5); 
    
    window.activeQuestions = filteredQuestions.slice(0, 16); 
    window.globalQuestionIndex = 0; 
    const setupScreen = document.getElementById('screen-setup'); if(setupScreen) setupScreen.classList.remove('active'); 
    if (typeof window.fireUpGame === 'function') window.fireUpGame();
};

// 3. QR CODE E RELATÓRIOS (TELA FINAL)
window.showLeaderboard = function() {
    if(typeof window.closeDraggableHologram === 'function') window.closeDraggableHologram(); 
    window.clearProgress(); 
    if(window.audioSystem && window.audioSystem.stopAll) { window.audioSystem.stopAll(); window.audioSystem.play('vitoria'); }
    
    document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active', 'flex'); s.style.display = 'none'; });
    
    let leaderboardScreen = document.getElementById('screen-leaderboard') || document.getElementById('tela-resultado'); 
    if (!leaderboardScreen) { 
        leaderboardScreen = document.createElement('div'); leaderboardScreen.id = 'screen-leaderboard'; document.body.appendChild(leaderboardScreen); 
    } 
    leaderboardScreen.classList.add('active', 'flex');
    leaderboardScreen.style.display = 'flex';
    
    const sortedTeams = [...window.teams].sort((a, b) => b.level === a.level ? 0 : b.level - a.level);
    let rankingHTML = sortedTeams.map((t, index) => {
        let prize = t.level === 0 ? "0" : (window.awards ? window.awards[t.level - 1] : "1 MILHÃO"); 
        if (t.status === 'won' || t.level >= 16) prize = "1 MILHÃO";
        let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        return `<div class="flex items-center justify-between p-3 md:p-4 border-2 rounded-2xl bg-blue-900/80 border-blue-400 w-full mb-2 shadow-lg"><div class="flex items-center gap-4"><span class="text-3xl">${medal}</span><span class="text-xl font-bold font-orbitron text-white">${t.name}</span></div><div class="bg-black/50 px-4 py-1.5 rounded-xl border border-white/10"><span class="text-xl font-black text-yellow-300 font-orbitron">${prize}</span></div></div>`;
    }).join('');
    
    let actionButtonsHTML = '';
    
    if (window.isStudentMode && window.teams.length > 0) {
        const sumTimes = window.teams[0].responseTimes.reduce((a,b)=>a+b, 0); 
        const calculatedAvg = window.teams[0].responseTimes.length ? Math.floor(sumTimes / window.teams[0].responseTimes.length) : 30000;
        
        let telemetry = {};
        if (typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) telemetry = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); 
        
        const attemptsCount = telemetry[window.currentStudentTelemetryKey] ? telemetry[window.currentStudentTelemetryKey].attempts : 1;
        const teamHistory = window.answerHistory ? window.answerHistory.filter(a => a.teamName === window.teams[0].name).map(a => ({
            qid: a.questionId, bncc: a.bncc, prof: a.proficiencia, comp: a.componente, 
            sel: a.selectedIndex, cor: a.correctIndex, wasCorrect: a.wasCorrect, selTxt: a.selectedText, reason: a.reason
        })) : [];
        
        const syncObj = { type: 'student_training', student: window.teams[0].name, level: window.teams[0].level, date: new Date().toISOString().split('T')[0], timestamp: Date.now(), attempts: attemptsCount, avgTimeMs: calculatedAvg, history: teamHistory, missionId: window.CURRENT_MISSION_ID || "Treino Livre" };
        const syncHash = btoa(unescape(encodeURIComponent(JSON.stringify(syncObj))));
        
        let baseUrl = window.location.origin + window.location.pathname; 
        baseUrl = baseUrl.replace('blob:', '').endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        
        const shareText = `🏆 *Show do Brutão* 🏆\n\nOlá Professor! Terminei o meu treino.\n👤 *Herói:* ${window.teams[0].name}\n📈 *Nível:* ${window.teams[0].level}/16\n🔗 ${baseUrl}?sync=${syncHash}`;
        
        const qrCodeUrl = `[https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=$](https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=$){encodeURIComponent(baseUrl + "?sync=" + syncHash)}&color=020617&bgcolor=ffffff`;
        const alreadySent = telemetry[window.currentStudentTelemetryKey] ? telemetry[window.currentStudentTelemetryKey].sent : false;

        actionButtonsHTML = `
            <div class="w-full flex flex-col items-center mt-6 border-t-2 border-dashed border-cyan-800/50 pt-6">
                <h3 class="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-4">Entregar Missão ao Professor</h3>
                <div class="flex flex-col md:flex-row items-center gap-6 w-full">
                    <div class="flex flex-col items-center bg-black/40 p-4 rounded-2xl border border-white/10 shrink-0">
                        <div class="bg-white p-2 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                            <img src="${qrCodeUrl}" alt="QR Code Sincronização" class="w-28 h-28">
                        </div>
                        <span class="text-[9px] font-bold text-gray-400 uppercase mt-3 text-center max-w-[120px]">Professor: Use a câmera para importar o boletim</span>
                    </div>
                    <div class="flex-1 flex flex-col gap-3 w-full">
                        ${alreadySent ? `<div class="w-full bg-gray-800 border border-gray-600 rounded-xl py-3.5 text-center text-xs font-bold text-gray-400">✅ ENVIADO HOJE</div>` : `<a href="[https://wa.me/?text=$](https://wa.me/?text=$){encodeURIComponent(shareText)}" onclick="if(window.STORAGE_KEYS) { localStorage.setItem(window.STORAGE_KEYS.telemetry, JSON.stringify({...JSON.parse(localStorage.getItem(window.STORAGE_KEYS.telemetry)||'{}'), ['${window.currentStudentTelemetryKey}']: {attempts: ${attemptsCount}, sent: true}})); }" target="_blank" class="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-700 border-2 border-green-300 py-3.5 flex items-center justify-center gap-2 text-xs font-black font-orbitron hover:scale-105 transition-transform shadow-[0_0_15px_rgba(34,197,94,0.3)] text-white">📲 ENVIAR POR WHATSAPP</a>`} 
                        <div class="flex gap-2">
                            <button onclick="if(typeof window.downloadBoletimOffline === 'function') window.downloadBoletimOffline('${syncHash}', '${window.teams[0].name}')" class="flex-1 bg-cyan-950 border border-cyan-500 text-cyan-300 font-black py-3 rounded-xl text-xs font-orbitron hover:bg-cyan-900 transition-colors shadow-inner">💾 BAIXAR ARQUIVO</button> 
                            <button onclick="if(typeof window.copyToClipboardFallback === 'function') window.copyToClipboardFallback('${baseUrl}?sync=${syncHash}', this)" class="flex-1 bg-blue-900 border border-blue-500 text-blue-200 font-black py-3 rounded-xl text-xs font-orbitron hover:bg-blue-800 transition-colors shadow-inner">📋 COPIAR LINK</button>
                        </div>
                    </div>
                </div>
            </div>
            <button onclick="window.location.reload();" class="mt-6 text-gray-500 text-[10px] font-bold uppercase font-montserrat hover:text-white transition-colors">Voltar ao Início</button>
        `;
    } else { 
        actionButtonsHTML = `<button onclick="window.location.reload();" class="rounded-full bg-gradient-to-b from-blue-600 to-blue-900 border-2 border-cyan-400 px-12 py-4 text-white font-black font-orbitron text-md mt-8 w-full hover:scale-105 transition-transform shadow-lg">VOLTAR AO INÍCIO</button>`; 
    }

    const leaderboardContainer = document.getElementById('leaderboard-container');
    if (leaderboardContainer) {
        leaderboardContainer.innerHTML = `<div class="bg-gray-800/80 p-8 rounded-3xl border border-gray-700 shadow-2xl w-full backdrop-blur-md"><h3 class="text-2xl font-black font-orbitron text-yellow-400 mb-6 uppercase text-center">Desempenho</h3>${rankingHTML}${actionButtonsHTML}</div>`;
    } else {
        leaderboardScreen.innerHTML = `<div class="absolute inset-0 bg-black/90 z-0"></div><div class="relative z-20 flex flex-col items-center w-full max-w-2xl p-6 md:p-10 bg-[#0f172a] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_50px_rgba(34,211,238,0.15)]"><div class="w-20 h-20 bg-cyan-900/50 border border-cyan-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🏆</div><h1 class="text-3xl md:text-4xl font-black font-orbitron mb-6 uppercase text-cyan-400 text-center">Fim de Jogo</h1><div class="w-full overflow-y-auto max-h-64 mb-2">${rankingHTML}</div>${actionButtonsHTML}</div>`;
    }
    if (typeof window.triggerConfetti === 'function') window.triggerConfetti();
};
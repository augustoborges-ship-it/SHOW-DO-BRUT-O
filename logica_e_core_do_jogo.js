---

### ARQUIVO 2: `logica_e_core_do_jogo.js`
Este arquivo abriga o verdadeiro fluxo da aplicação: Como as questões são filtradas no Modo Aluno, como a Fábrica de Jogos do Professor funciona e como os Relatórios / QR Code são emitidos no Fim do Jogo.

```javascript:logica_e_core_do_jogo.js
// =========================================================================
// Arquivo: logica_e_core_do_jogo.js
// Função: Motor de Partida, Modo Aluno, QR Code e Relatórios
// =========================================================================

console.log("🚀 [Motor] Lógica de Partida Ativada.");

window.saveProgress = function () {
    if (!window.activeQuestions || !window.teams) return;
    if (window.STORAGE_KEYS && typeof window.writeJSONKey === "function") {
        window.writeJSONKey(window.STORAGE_KEYS.state, {
            version: 2, savedAt: new Date().toISOString(), teams: window.teams,
            currentTeamIndex: window.currentTeamIndex, gameMode: window.gameMode,
            isStudentMode: window.isStudentMode, activeQuestions: window.activeQuestions,
            globalQuestionIndex: window.globalQuestionIndex, timeLeft: window.timeLeft,
            answerHistory: window.answerHistory, currentStudentTelemetryKey: window.currentStudentTelemetryKey || null,
            missionId: window.CURRENT_MISSION_ID || null,
        });
    }
};

window.clearProgress = function () {
    if (window.STORAGE_KEYS) window.removeStorageKey(window.STORAGE_KEYS.state);
};

window.normalizeGameText = function (value) {
    return String(value == null ? "" : value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

// =========================================================================
// 1. INÍCIO DO JOGO: MODO ALUNO (O Sistema de Filtro Inquebrável)
// =========================================================================
window.startStudentGame = function () {
    console.log("🚦 Preparando Partida do Modo Aluno...");
    window.clearProgress();
    window.isStudentMode = true;

    var errArea = document.getElementById("student-error-area");
    if (errArea) errArea.innerHTML = "";

    // Pega as configurações do HTML
    var pNameEl = document.getElementById("student-name");
    var pName = pNameEl && pNameEl.value.trim() !== "" ? pNameEl.value.trim() : "Herói Anônimo";

    var yearEl = document.getElementById("student-year");
    var anoEscolar = yearEl ? window.normalizeGameText(yearEl.value) : "5º ano";

    var subjectEl = document.getElementById("student-subject");
    var disc = subjectEl ? window.normalizeGameText(subjectEl.value) : "matematica";

    var diffRadios = document.querySelector('input[name="student-diff"]:checked');
    var difSelecionada = window.normalizeGameText(diffRadios ? diffRadios.value : (window.dificuldadeModoTreino || "fácil"));

    var tagsAceitas = [];
    if (difSelecionada === "facil") tagsAceitas = ["basico", "b1", "b2", "facil", "baixo"];
    else if (difSelecionada === "medio") tagsAceitas = ["intermediario", "b3", "b4", "medio", "adequado"];
    else if (difSelecionada === "dificil") tagsAceitas = ["avancado", "b5", "b6", "dificil", "alto"];

    var numAnoBusca = String(anoEscolar).replace(/\D/g, "");

    if (!window.allQuestions || window.allQuestions.length === 0) window.initGameData();

    // Filtro 1: Máximo (Ano + Disciplina + Dificuldade)
    window.questoesDaPartida = window.allQuestions.filter(function (q) {
        var qAno = window.normalizeGameText(q.ano);
        var qDisc = window.normalizeGameText(q.componente);
        var qProf = window.normalizeGameText(q.proficiencia);
        var bateAno = qAno.includes(numAnoBusca) || qAno.includes(anoEscolar);
        var bateDisc = qDisc.includes(disc) || disc.includes(qDisc);
        var bateDificuldade = tagsAceitas.some(tag => qProf.includes(tag));
        return bateAno && bateDisc && bateDificuldade;
    });

    // Filtro 2: Fallback (Ano + Disciplina)
    if (window.questoesDaPartida.length === 0) {
        window.questoesDaPartida = window.allQuestions.filter(function (q) {
            var qDisc = window.normalizeGameText(q.componente);
            return (window.normalizeGameText(q.ano).includes(numAnoBusca) || window.normalizeGameText(q.ano).includes(anoEscolar)) && (qDisc.includes(disc) || disc.includes(qDisc));
        });
    }

    // Filtro 3: Sobrevivência Total (Se der tudo errado, puxe todo o banco!)
    if (window.questoesDaPartida.length === 0) {
        window.questoesDaPartida = [...window.allQuestions];
        console.warn("Filtro total falhou. Carregando o banco global inteiro.");
    }

    if (window.questoesDaPartida.length === 0) {
        if (errArea) errArea.innerHTML = '<div class="bg-red-900 border border-red-500 text-white font-bold p-3 rounded-xl text-center mb-4">Banco de Questões Vazio ou Erro Fatal de JS.</div>';
        return;
    }

    // Mistura as questões escolhidas
    window.questoesDaPartida.sort(() => Math.random() - 0.5);

    window.teams = [{ name: pName, level: 0, status: "playing", helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }];
    window.gameMode = "single";
    window.currentTeamIndex = 0;

    // Regista o ID do aluno para os Relatórios
    if (window.STORAGE_KEYS && typeof window.writeJSONKey === "function") {
        var todayStr = new Date().toISOString().split("T")[0];
        window.currentStudentTelemetryKey = pName.toLowerCase() + "_" + todayStr;
        var telemetry = window.readJSONKey(window.STORAGE_KEYS.telemetry, {});
        if (!telemetry[window.currentStudentTelemetryKey]) telemetry[window.currentStudentTelemetryKey] = { attempts: 0, sent: false };
        telemetry[window.currentStudentTelemetryKey].attempts++;
        window.writeJSONKey(window.STORAGE_KEYS.telemetry, telemetry);
    }

    window.activeQuestions = window.questoesDaPartida.slice(0, 16);
    window.globalQuestionIndex = 0;

    // Transição Segura de Telas
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active", "flex"));
    var gameScreen = document.getElementById("screen-game") || document.getElementById("tela-jogo");
    if (gameScreen) { gameScreen.classList.remove("hidden"); gameScreen.classList.add("active", "flex"); }

    if (typeof window.fireUpGame === "function") window.fireUpGame();
};

// =========================================================================
// 2. INÍCIO DO JOGO: EDUCADOR E EMBED
// =========================================================================
window.startGame = function () {
    window.clearProgress(); window.isStudentMode = false;
    let selectedYears = Array.from(document.querySelectorAll('#screen-setup input[id^="ano"]:checked')).map(cb => window.normalizeGameText(cb.value));
    let selectedMundos = Array.from(document.querySelectorAll('#screen-setup input[id^="mundo"]:checked')).map(cb => window.normalizeGameText(cb.value));
    
    if (selectedYears.length === 0) selectedYears = ["5º ano"];
    if (selectedMundos.length === 0) selectedMundos = ["matemática"];

    window.teams = [{ name: "Equipe 1", level: 0, status: "playing", helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }];
    window.gameMode = "single"; window.currentTeamIndex = 0;

    if (!window.allQuestions || window.allQuestions.length === 0) window.initGameData();

    let filteredQuestions = window.allQuestions.filter(q => {
        let qAno = window.normalizeGameText(q.ano);
        let qMundo = window.normalizeGameText(q.componente);
        let matchesYear = selectedYears.some(y => qAno.includes(y));
        let matchesMundo = selectedMundos.some(m => qMundo.includes(m) || m.includes(qMundo));
        return matchesYear && matchesMundo;
    });

    if (filteredQuestions.length === 0) filteredQuestions = [...window.allQuestions];
    filteredQuestions.sort(() => Math.random() - 0.5);

    window.activeQuestions = filteredQuestions.slice(0, 16);
    window.globalQuestionIndex = 0;
    
    const setupScreen = document.getElementById("screen-setup");
    if (setupScreen) setupScreen.classList.remove("active");
    if (typeof window.fireUpGame === "function") window.fireUpGame();
};

// =========================================================================
// 3. TELA DE LEADERBOARD, QR CODE E BOLETIM (FIM DE JOGO)
// =========================================================================
window.showLeaderboard = function () {
    if (typeof window.closeDraggableHologram === "function") window.closeDraggableHologram();
    window.clearProgress();
    if (window.audioSystem && window.audioSystem.stopAll) { window.audioSystem.stopAll(); window.audioSystem.play("vitoria"); }
    
    // Esconde a bagunça visual do jogo
    document.querySelectorAll(".screen").forEach(function (screen) {
        screen.classList.remove("active", "flex"); screen.style.display = "";
    });

    var leaderboardScreen = document.getElementById("screen-leaderboard") || document.getElementById("tela-resultado");
    if (!leaderboardScreen) {
        leaderboardScreen = document.createElement("div"); leaderboardScreen.id = "screen-leaderboard"; document.body.appendChild(leaderboardScreen);
    }
    
    leaderboardScreen.className = "screen result-dashboard-screen active";
    leaderboardScreen.style.display = "flex";
    if (window.updateInterfaceContext) window.updateInterfaceContext("screen-leaderboard");

    // Constrói HTML do Topo do Leaderboard
    var teams = Array.isArray(window.teams) ? window.teams : [];
    var sortedTeams = teams.slice().sort((a, b) => Number(b.level || 0) - Number(a.level || 0));
    var mainTeam = sortedTeams[0] || { name: "Jogador", level: 0, responseTimes: [] };
    
    var prize = mainTeam.level > 0 && window.awards ? window.awards[Math.min(mainTeam.level - 1, window.awards.length - 1)] : "0";
    if (mainTeam.level >= 16) prize = "1 MILHÃO";

    var rankingHTML = sortedTeams.map(function (team, index) {
        var teamPrize = team.level > 0 && window.awards ? window.awards[Math.min(team.level - 1, window.awards.length - 1)] : "0";
        if (team.level >= 16) teamPrize = "1 MILHÃO";
        let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        
        return `
        <div class="flex items-center justify-between p-3 md:p-4 border-2 rounded-2xl bg-blue-900/80 border-blue-400 w-full mb-2 shadow-lg">
            <div class="flex items-center gap-4"><span class="text-3xl">${medal}</span><span class="text-xl font-bold font-orbitron text-white">${team.name}</span></div>
            <div class="bg-black/50 px-4 py-1.5 rounded-xl border border-white/10"><span class="text-xl font-black text-yellow-300 font-orbitron">${teamPrize}</span></div>
        </div>`;
    }).join("");

    var actionButtonsHTML = "";

    // SE FOR MODO ALUNO: CRIA O QR CODE E GERA O PAYLOAD
    if (window.isStudentMode && teams.length) {
        var sumTimes = mainTeam.responseTimes.reduce((a,b)=>a+b, 0); 
        var avgMs = mainTeam.responseTimes.length ? Math.round(sumTimes / mainTeam.responseTimes.length) : 0;
        
        var telemetry = window.STORAGE_KEYS && window.readJSONKey ? window.readJSONKey(window.STORAGE_KEYS.telemetry, {}) : {};
        var attemptsCount = telemetry[window.currentStudentTelemetryKey] ? telemetry[window.currentStudentTelemetryKey].attempts : 1;
        
        var history = (window.answerHistory || []).filter(a => a.teamName === mainTeam.name);
        var compactHistory = history.map(a => ({ qid: a.questionId, bncc: a.bncc, prof: a.proficiencia, comp: a.componente, sel: a.selectedIndex, cor: a.correctIndex, wasCorrect: a.wasCorrect, selTxt: a.selectedText, reason: a.reason }));
        
        var syncObj = { type: "student_training", student: mainTeam.name, level: mainTeam.level, date: new Date().toISOString().split("T")[0], timestamp: Date.now(), attempts: attemptsCount, avgTimeMs: avgMs, history: compactHistory, missionId: window.CURRENT_MISSION_ID || "Treino Livre" };
        var syncHash = btoa(unescape(encodeURIComponent(JSON.stringify(syncObj))));
        
        var baseUrl = window.location.origin + window.location.pathname;
        if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
        var shareUrl = baseUrl + "?sync=" + syncHash;
        
        var shareText = `🏆 *Show do Brutão* 🏆\n\nOlá Professor! Terminei o meu treino.\n👤 *Herói:* ${mainTeam.name}\n📈 *Nível:* ${mainTeam.level}/16\n🔗 ${shareUrl}`;
        var qrCodeUrl = "[https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=](https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=)" + encodeURIComponent(shareUrl) + "&color=020617&bgcolor=ffffff";
        var alreadySent = telemetry[window.currentStudentTelemetryKey] ? telemetry[window.currentStudentTelemetryKey].sent : false;

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
                        ${alreadySent ? `<div class="w-full bg-gray-800 border border-gray-600 rounded-xl py-3.5 text-center text-xs font-bold text-gray-400">✅ ENVIADO HOJE</div>` : `<a href="[https://wa.me/?text=$](https://wa.me/?text=$){encodeURIComponent(shareText)}" target="_blank" onclick="if(window.STORAGE_KEYS) { localStorage.setItem(window.STORAGE_KEYS.telemetry, JSON.stringify({...JSON.parse(localStorage.getItem(window.STORAGE_KEYS.telemetry)||'{}'), ['${window.currentStudentTelemetryKey}']: {attempts: ${attemptsCount}, sent: true}})); }" class="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-700 border-2 border-green-300 py-3.5 flex items-center justify-center gap-2 text-xs font-black font-orbitron hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.3)] text-white">📲 ENVIAR POR WHATSAPP</a>`}
                        <div class="flex gap-2">
                            <button onclick="if(typeof window.downloadBoletimOffline === 'function') window.downloadBoletimOffline('${syncHash}', '${mainTeam.name}')" class="flex-1 bg-cyan-950 border border-cyan-500 text-cyan-300 font-black py-3 rounded-xl text-xs font-orbitron hover:bg-cyan-900 transition-colors shadow-inner">💾 BAIXAR ARQUIVO</button>
                            <button onclick="if(typeof window.copyToClipboardFallback === 'function') window.copyToClipboardFallback('${shareUrl}', this)" class="flex-1 bg-blue-900 border border-blue-500 text-blue-200 font-black py-3 rounded-xl text-xs font-orbitron hover:bg-blue-800 transition-colors shadow-inner">📋 COPIAR LINK</button>
                        </div>
                    </div>
                </div>
            </div>
            <button onclick="window.location.reload();" class="mt-6 text-gray-500 text-[10px] font-bold uppercase font-montserrat hover:text-white transition-colors">Voltar ao Início</button>
        `;
    } else {
        // Se for o Professor Jogando no Projetor, aparece apenas um botão de saída
        actionButtonsHTML = `<button onclick="window.location.reload();" class="rounded-full bg-gradient-to-b from-blue-600 to-blue-900 border-2 border-cyan-400 px-12 py-4 text-white font-black font-orbitron text-md mt-8 w-full hover:scale-105 transition-transform shadow-lg">VOLTAR AO INÍCIO</button>`;
    }

    leaderboardScreen.innerHTML = `
        <div class="absolute inset-0 bg-black/90 z-0"></div>
        <div class="relative z-20 flex flex-col items-center w-full max-w-2xl p-6 md:p-10 bg-[#0f172a] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_50px_rgba(34,211,238,0.15)]">
            <div class="w-20 h-20 bg-cyan-900/50 border border-cyan-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🏆</div>
            <h1 class="text-3xl md:text-4xl font-black font-orbitron mb-6 uppercase text-cyan-400 text-center">Desempenho</h1>
            <div class="w-full overflow-y-auto max-h-64 mb-2 pr-2">${rankingHTML}</div>
            ${actionButtonsHTML}
        </div>
        <div class="absolute inset-0 pointer-events-none z-30 overflow-hidden" id="confetti-container-ranking" data-confetti-container></div>
    `;

    if (typeof window.triggerConfetti === "function") window.triggerConfetti();
};
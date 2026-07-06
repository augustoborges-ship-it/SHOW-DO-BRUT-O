// --- CONTROLO GERAL DA INTERFACE ---
function skipIntro() { if (window.isIntroSkipped) return; window.isIntroSkipped = true; const overlay = el('intro-overlay'); if (overlay) { overlay.style.opacity = '0'; setTimeout(() => { overlay.style.display = 'none'; }, 1000); } }
function toggleMute() { window.isMuted = !window.isMuted; Object.keys(audioSystem).forEach(k => { if (typeof audioSystem[k] !== 'function') audioSystem[k].muted = window.isMuted; }); el('icon-mute').innerText = window.isMuted ? '🔇' : '🔊'; }
function toggleFullscreen() { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e=>{}); el('icon-fullscreen').innerText = '🗗'; } else { if(document.exitFullscreen) { document.exitFullscreen(); el('icon-fullscreen').innerText = '⛶'; } } }
function showSystemMessage(title, text, type = 'info') { const m = el('modal-system-msg'); if(!m) return; el('sys-msg-title').innerText = title; el('sys-msg-text').innerText = text; m.classList.remove('hidden'); m.classList.add('flex'); }
function closeSystemMessage() { el('modal-system-msg').classList.add('hidden'); el('modal-system-msg').classList.remove('flex'); }
function triggerConfetti() { const c = qs('.screen.active [data-confetti-container]') || el('confetti-container') || qs('[data-confetti-container]'); if(!c) return; c.innerHTML = ''; const colors = ['#FFDF73','#D4AF37','#ffffff','#3B82F6','#EF4444']; for(let i=0; i<100; i++) { const p = ce('div'); p.className = 'confetti-piece'; p.style.width = (Math.random()*10+5)+'px'; p.style.height = (Math.random()*20+10)+'px'; p.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)]; p.style.left = (Math.random()*100)+'vw'; p.style.top = '-20px'; p.style.opacity = Math.random()+0.5; p.style.transform = `rotate(${Math.random()*360}deg)`; p.style.transition = `top ${Math.random()*3+2}s cubic-bezier(0.25,0.46,0.45,0.94) ${Math.random()*2}s, transform ${Math.random()*3+2}s linear ${Math.random()*2}s, opacity ${Math.random()*3+2}s ease-in ${Math.random()*2}s`; c.appendChild(p); setTimeout(()=>{ p.style.top='120vh'; p.style.transform=`rotate(${Math.random()*720+360}deg)`; p.style.opacity='0'; },50); } }
function previewImage() { let url = el('add-q-image').value.trim(); url = normalizeImageUrl(url); const container = el('image-preview-container'); const img = el('image-preview'); if(url) { img.onload = () => { container.classList.remove('hidden'); container.classList.add('flex'); }; img.onerror = () => { container.classList.add('hidden'); container.classList.remove('flex'); }; img.src = url; } else { container.classList.add('hidden'); container.classList.remove('flex'); img.src = ""; } }

// --- ANIMAÇÕES E PERSONAGENS ---
function changeBrutusPose(poseName) { const hostImg = el('char-host'); const hostSprite = el('char-host-sprite'); const hostCinematic = el('char-host-cinematic'); const cinematicVignette = el('cinematic-vignette'); if(!hostImg || !hostSprite || !brutusPoses[poseName]) return; const pose = brutusPoses[poseName]; hostImg.style.opacity = '0'; hostSprite.style.opacity = '0'; if(hostCinematic) { hostCinematic.style.opacity = '0'; hostCinematic.classList.remove('cinematic-zoom'); } if(cinematicVignette) cinematicVignette.style.opacity = '0'; clearInterval(spriteInterval); clearInterval(cinematicInterval); setTimeout(() => { hostSprite.classList.add('hidden'); hostImg.classList.add('hidden'); if(hostCinematic) hostCinematic.classList.add('hidden'); if (pose.type === 'img') { hostImg.classList.remove('hidden'); hostImg.src = pose.src; hostImg.style.opacity = '1'; } else if (pose.type === 'sprite') { hostSprite.classList.remove('hidden'); hostSprite.style.backgroundImage = `url('${pose.src}')`; hostSprite.style.backgroundSize = `${pose.cols * 100}% ${pose.rows * 100}%`; hostSprite.style.opacity = '1'; let currentFrame = 0; spriteInterval = setInterval(() => { const col = currentFrame % pose.cols; const row = Math.floor(currentFrame / pose.cols); const xPos = pose.cols > 1 ? (col / (pose.cols - 1)) * 100 : 0; const yPos = pose.rows > 1 ? (row / (pose.rows - 1)) * 100 : 0; hostSprite.style.backgroundPosition = `${xPos}% ${yPos}%`; currentFrame = (currentFrame + 1) % pose.frames; }, 150); } else if (pose.type === 'cinematic') { if(!hostCinematic) return; hostCinematic.classList.remove('hidden'); hostCinematic.style.opacity = '1'; hostCinematic.innerHTML = ''; const shakeWrapper = ce('div'); shakeWrapper.className = 'absolute inset-0 w-full h-full animate-camera-shake'; const breathWrapper = ce('div'); breathWrapper.className = 'absolute inset-0 w-full h-full animate-tense-breathing'; pose.frames.forEach((src, idx) => { const img = ce('img'); img.src = src; img.className = 'cinematic-img'; if(idx === 0) img.style.opacity = '1'; breathWrapper.appendChild(img); }); const sweatData = [ { left: '57%', top: '23%', delay: 1800, dur: 2800 }, { left: '64%', top: '28%', delay: 2500, dur: 2200 }, { left: '53%', top: '26%', delay: 3500, dur: 1800 }, { left: '62%', top: '35%', delay: 4200, dur: 1200 } ]; sweatData.forEach(pos => { const sweat = ce('div'); sweat.className = 'sweat-drop'; sweat.style.left = pos.left; sweat.style.top = pos.top; sweat.style.animation = `sweat-trickle ${pos.dur}ms cubic-bezier(0.4, 0, 0.2, 1) ${pos.delay}ms forwards`; breathWrapper.appendChild(sweat); }); shakeWrapper.appendChild(breathWrapper); hostCinematic.appendChild(shakeWrapper); void hostCinematic.offsetWidth; hostCinematic.classList.add('cinematic-zoom'); if(cinematicVignette) cinematicVignette.style.opacity = '1'; let currentFrame = 0; const totalFrames = pose.frames.length; const timePerFrame = 5000 / (totalFrames - 1); cinematicInterval = setInterval(() => { currentFrame++; if (currentFrame >= totalFrames) { clearInterval(cinematicInterval); return; } const imgs = breathWrapper.querySelectorAll('.cinematic-img'); if(imgs[currentFrame]) imgs[currentFrame].style.opacity = '1'; if(imgs[currentFrame - 1]) { setTimeout(() => { if(imgs[currentFrame - 1]) imgs[currentFrame - 1].style.opacity = '0'; }, 300); } }, timePerFrame); } }, 150); }

// --- RENDERIZAÇÃO DE LISTAS DE TURMAS ---
function renderClassList() { const container = el('class-list-container'); container.innerHTML = ''; if(allTurmas.length === 0) { container.innerHTML = `<div class="text-center text-gray-500 py-6 text-sm">Nenhuma turma.</div>`; return; } allTurmas.forEach(t => { const isActive = t.id === activeTurmaId; const card = ce('div'); card.className = `border rounded-xl p-3 mb-3 cursor-pointer transition-all ${isActive ? 'bg-indigo-600 border-indigo-400':'bg-black/40 border-white/10'}`; card.onclick = () => { activeTurmaId = t.id; renderClassList(); updateClassDetailsView(); }; card.innerHTML = `<div class="flex justify-between items-center"><h4 class="text-white font-bold font-orbitron truncate pr-2">${t.name}</h4><span class="bg-black/50 text-indigo-300 text-[10px] font-black px-2 py-1 rounded-lg">${t.students.length} 👤</span></div>`; container.appendChild(card); }); }
function updateClassDetailsView() { const emptyState = el('class-details-empty'); const contentState = el('class-details-content'); if (!activeTurmaId) { emptyState.classList.remove('hidden'); contentState.classList.add('hidden'); return; } const turma = allTurmas.find(t => t.id === activeTurmaId); if(!turma) return; emptyState.classList.add('hidden'); contentState.classList.remove('hidden'); contentState.classList.add('flex'); el('active-class-name').innerText = turma.name; el('active-class-count').innerText = turma.students.length; renderStudentList(turma); }
function renderStudentList(turma) { const container = el('student-list-container'); container.innerHTML = ''; if (turma.students.length === 0) { container.innerHTML = `<div class="text-gray-500 text-sm text-center mt-10">Nenhum aluno.</div>`; return; } turma.students.forEach(s => { const tags = []; if(s.race && s.race !== 'Nao Declarado') tags.push(`<span class="bg-gray-800 text-gray-300 border border-gray-600 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">${s.race}</span>`); if(s.isBolsa) tags.push(`<span class="bg-green-900/50 text-green-400 border border-green-700 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Bolsa Família</span>`); if(s.isAEE) tags.push(`<span class="bg-blue-900/50 text-blue-400 border border-blue-700 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">AEE</span>`); const card = ce('div'); card.className = "bg-white/5 border border-white/10 rounded-xl p-3 mb-2 flex justify-between items-center hover:bg-white/10 transition-colors"; card.innerHTML = `<div><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold">${s.name.charAt(0).toUpperCase()}</div><h4 class="text-white font-bold text-sm">${s.name}</h4></div>${tags.length>0 ? '<div class="flex gap-1 mt-2 flex-wrap">'+tags.join('')+'</div>':''}</div><button onclick="deleteStudent('${s.id}')" class="text-red-400 p-2 hover:text-white">🗑️</button>`; container.appendChild(card); }); }

// --- 🚀 MOTOR VISUAL AAA+ (DASHBOARDS E ANALÍTICA) ---
window.renderReportsList = function() {
    const container = el('reports-list-container');
    const analyticsPanel = el('reports-analytics-panel');
    
    let reports = readJSONKey(STORAGE_KEYS.reports, []); 
    const filterId = el('report-filter-class') ? el('report-filter-class').value : null; 
    if(filterId) reports = reports.filter(r => r.linkedClassId === filterId);

    // Estruturas do Radar VAAR Avançado
    let stats = {
        totalScore: 0,
        countVuln: 0, scoreVuln: 0, // PPI ou Bolsa
        countGeral: 0, scoreGeral: 0, // Ampla Concorrência
        levelsVuln: { abaixo: 0, basico: 0, adequado: 0, avancado: 0 },
        levelsGeral: { abaixo: 0, basico: 0, adequado: 0, avancado: 0 }
    };

    reports.forEach(r => { 
        let isVuln = false;
        if(r.linkedClassId) { 
            const classObj = allTurmas.find(t => t.id === r.linkedClassId); 
            if(classObj) { 
                const rName = r.student.toLowerCase().trim();
                let studentObj = classObj.students.find(s => s.name.toLowerCase().trim() === rName) || 
                                 classObj.students.find(s => {
                                     const sName = s.name.toLowerCase().trim();
                                     return sName.split(' ')[0] === rName.split(' ')[0] && (sName.startsWith(rName) || rName.startsWith(sName));
                                 });
                
                if(studentObj && (studentObj.isBolsa || ['Preta', 'Parda', 'Indigena'].includes(studentObj.race))) {
                    isVuln = true;
                } 
            } 
        } 
        
        let normalizedScore = (r.level / 16) * 10;
        stats.totalScore += normalizedScore;
        
        let lvlCat = 'abaixo';
        if (r.level >= 13) lvlCat = 'avancado';
        else if (r.level >= 9) lvlCat = 'adequado';
        else if (r.level >= 5) lvlCat = 'basico';

        if(isVuln) {
            stats.countVuln++;
            stats.scoreVuln += normalizedScore;
            stats.levelsVuln[lvlCat]++;
        } else {
            stats.countGeral++;
            stats.scoreGeral += normalizedScore;
            stats.levelsGeral[lvlCat]++;
        }
    });

    const totalR = reports.length;
    
    // 1. RENDERIZAÇÃO DO DASHBOARD (RADAR VAAR) ESTILO EDUQBRASIL
    if(analyticsPanel) {
        if(totalR === 0) {
            analyticsPanel.innerHTML = `<div class="text-center text-gray-500 py-6">Sem dados suficientes para gerar o Radar Diagnóstico.</div>`;
        } else {
            const avgGeralStr = stats.countGeral > 0 ? (stats.scoreGeral / stats.countGeral).toFixed(1) : '--';
            const avgVulnStr = stats.countVuln > 0 ? (stats.scoreVuln / stats.countVuln).toFixed(1) : '--';
            const avgTotalStr = (stats.totalScore / totalR).toFixed(1);

            const getBarHtml = (lvls, total) => {
                if(total === 0) return `<div class="w-full h-10 bg-black/50 rounded border border-white/5 flex items-center justify-center text-gray-600 text-xs font-bold uppercase tracking-widest">--</div>`;
                const pAbaixo = (lvls.abaixo/total)*100;
                const pBasico = (lvls.basico/total)*100;
                const pAdequado = (lvls.adequado/total)*100;
                const pAvancado = (lvls.avancado/total)*100;
                return `
                <div class="w-full h-10 rounded-lg overflow-hidden flex font-black text-xs text-blue-950 text-center shadow-inner">
                    ${pAbaixo > 0 ? `<div style="width:${pAbaixo}%" class="bg-[#ff6b6b] flex items-center justify-center relative group text-white border-r border-black/20"><span class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black/90 text-white px-2 py-1 rounded text-[9px] pointer-events-none transition-opacity">Abaixo do Básico</span>${Math.round(pAbaixo)}%</div>` : ''}
                    ${pBasico > 0 ? `<div style="width:${pBasico}%" class="bg-[#facc15] flex items-center justify-center relative group border-r border-black/20"><span class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black/90 text-white px-2 py-1 rounded text-[9px] pointer-events-none transition-opacity">Básico</span>${Math.round(pBasico)}%</div>` : ''}
                    ${pAdequado > 0 ? `<div style="width:${pAdequado}%" class="bg-[#6bff89] flex items-center justify-center relative group border-r border-black/20"><span class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black/90 text-white px-2 py-1 rounded text-[9px] pointer-events-none transition-opacity">Adequado</span>${Math.round(pAdequado)}%</div>` : ''}
                    ${pAvancado > 0 ? `<div style="width:${pAvancado}%" class="bg-[#38bdf8] flex items-center justify-center relative group text-white"><span class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black/90 text-white px-2 py-1 rounded text-[9px] pointer-events-none transition-opacity">Avançado</span>${Math.round(pAvancado)}%</div>` : ''}
                </div>`;
            };

            analyticsPanel.innerHTML = `
                <div class="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                    <div>
                        <h3 class="text-2xl font-black font-orbitron uppercase text-white flex items-center gap-3">
                            <span class="text-cyan-400">📊</span> Questionário Socioeconómico
                        </h3>
                        <p class="text-gray-400 text-sm font-montserrat mt-2">Diagnóstica com ${totalR} alunos a participar</p>
                    </div>
                    <div class="bg-[#1e88e5] border-4 border-white/20 rounded-2xl px-8 py-3 text-center shadow-[0_10px_20px_rgba(30,136,229,0.3)]">
                        <span class="block text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Nota Média</span>
                        <span class="text-4xl font-black text-white font-orbitron">${avgTotalStr}<span class="text-xl text-blue-200">/10</span></span>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div class="lg:col-span-3">
                        <div class="flex flex-wrap gap-4 items-center mb-6 text-xs font-bold uppercase tracking-widest text-gray-300">
                            <span class="text-white mr-4">Desempenho:</span>
                            <span class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-[#ff6b6b]"></div>Abaixo Básico</span>
                            <span class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-[#facc15]"></div>Básico</span>
                            <span class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-[#6bff89]"></div>Adequado</span>
                            <span class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-[#38bdf8]"></div>Avançado</span>
                        </div>
                        
                        <div class="space-y-6">
                            <div class="flex flex-col md:flex-row md:items-center gap-4">
                                <span class="w-32 text-sm font-bold text-gray-400 uppercase tracking-widest shrink-0">Alunos PPI / Baixo NSE</span>
                                <div class="flex-1">${getBarHtml(stats.levelsVuln, stats.countVuln)}</div>
                            </div>
                            <div class="flex flex-col md:flex-row md:items-center gap-4">
                                <span class="w-32 text-sm font-bold text-gray-400 uppercase tracking-widest shrink-0">Ampla Concorr. / Alto NSE</span>
                                <div class="flex-1">${getBarHtml(stats.levelsGeral, stats.countGeral)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-black/30 border border-white/5 p-6 rounded-2xl flex flex-col justify-center shadow-inner">
                        <h4 class="text-sm font-black uppercase tracking-widest text-white mb-6 text-center border-b border-white/10 pb-4">Média Geral</h4>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center bg-[#ffeaa7] px-4 py-3 rounded-xl shadow-md">
                                <span class="text-xs font-black text-yellow-900 uppercase">PPI / Baixo NSE</span>
                                <span class="text-xl font-black text-yellow-900">${avgVulnStr}</span>
                            </div>
                            <div class="flex justify-between items-center bg-[#b8e994] px-4 py-3 rounded-xl shadow-md">
                                <span class="text-xs font-black text-green-900 uppercase">Geral / Alto NSE</span>
                                <span class="text-xl font-black text-green-900">${avgGeralStr}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // 2. RENDERIZAÇÃO DA LISTA BRUTA DE HISTÓRICO (Tabela Tradicional)
    if(container) {
        container.innerHTML = '';
        if(reports.length === 0) { 
            container.innerHTML = `<div class="col-span-1 md:col-span-2 flex flex-col items-center justify-center text-gray-400 py-16 border-4 border-dashed border-cyan-800/50 rounded-3xl bg-blue-950/20 mt-4 cursor-default transition-all hover:bg-blue-950/40 hover:border-cyan-500/80"><div class="text-6xl mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">📥</div><h3 class="text-2xl md:text-3xl font-black font-orbitron uppercase text-cyan-400 mb-2">Arraste os Boletins Aqui</h3><p class="text-sm font-montserrat text-cyan-100/70">Solte os arquivos <span class="text-white font-bold bg-black/50 px-2 py-0.5 rounded">.brutao</span> direto nesta tela para sincronizar com a turma.</p></div>`; 
            return; 
        }
        reports.sort((a, b) => new Date(b.date) - new Date(a.date));
        reports.forEach(r => {
            let tagsHtml = ''; 
            if (r.attempts && r.avgTimeMs) { 
                if (r.avgTimeMs < 3000 && r.level > 2) tagsHtml += `<span class="bg-red-900 text-red-200 border border-red-500 px-2 py-0.5 rounded text-[9px] font-bold">🚨 Chute rápido (${(r.avgTimeMs/1000).toFixed(1)}s)</span>`; 
                else if (r.attempts === 1) tagsHtml += `<span class="bg-yellow-600 text-white border border-yellow-400 px-2 py-0.5 rounded text-[9px] font-bold">🏅 1ª Tentativa</span>`; 
                else if (r.attempts > 1) tagsHtml += `<span class="bg-orange-800 text-orange-200 border border-orange-500 px-2 py-0.5 rounded text-[9px] font-bold">⚠️ ${r.attempts}ª Tentativa</span>`; 
            }
            const isWin = r.level >= 16; const errorsCount = r.history ? r.history.filter(h => !h.wasCorrect).length : '?'; 
            const card = ce('div'); card.className = "bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col shadow-lg"; 
            card.innerHTML = `<div class="flex justify-between items-start mb-4 border-b border-white/10 pb-3"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">${r.student.charAt(0).toUpperCase()}</div><div><h4 class="text-white font-bold truncate max-w-[150px]">${r.student}</h4><p class="text-gray-400 text-[10px]">${r.date}</p><div class="mt-1 flex gap-1 flex-wrap">${tagsHtml}</div></div></div><span class="text-2xl">${isWin ? '🏆' : '🎮'}</span></div><div class="grid grid-cols-3 gap-2 text-center"><div class="bg-black/40 rounded-lg p-2"><span class="block text-gray-400 text-[9px] uppercase font-bold">Nível</span><span class="text-xl font-black text-white">${r.level}/16</span></div><div class="bg-black/40 rounded-lg p-2"><span class="block text-gray-400 text-[9px] uppercase font-bold">Erros</span><span class="text-xl font-black text-red-400">${errorsCount}</span></div><div class="bg-black/40 rounded-lg p-2"><span class="block text-gray-400 text-[9px] uppercase font-bold">Placar</span><span class="text-lg font-black text-yellow-400 flex items-center justify-center h-full">${r.level===0?'0':awards[r.level-1]}</span></div></div>`; 
            container.appendChild(card);
        });
    }
};

window.renderSkillsAnalysis = function() {
    const container = el('skills-analysis-container');
    let reports = readJSONKey(STORAGE_KEYS.reports, []);
    const filterId = el('report-filter-class') ? el('report-filter-class').value : null;
    if(filterId) reports = reports.filter(r => r.linkedClassId === filterId);

    window.globalItemStats = {}; 

    reports.forEach(r => {
        if(r.history && Array.isArray(r.history)) {
            r.history.forEach(h => {
                // Junta IDs e Habilidades para métricas
                let key = h.bncc && h.bncc !== "N/A" ? h.bncc : (h.qid || 'Sem Habilidade');
                if(!window.globalItemStats[key]) {
                    window.globalItemStats[key] = { 
                        id: key, 
                        total: 0, correct: 0, 
                        comp: h.comp, 
                        opts: {'A':0, 'B':0, 'C':0, 'D':0},
                        qId: h.qid 
                    };
                }
                window.globalItemStats[key].total++;
                if(h.wasCorrect) window.globalItemStats[key].correct++;
                let optLetter = ['A','B','C','D'][h.sel];
                if(optLetter) window.globalItemStats[key].opts[optLetter]++;
            });
        }
    });

    let itemsArray = Object.values(window.globalItemStats);
    if(itemsArray.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-10 font-bold border-2 border-dashed border-gray-700 rounded-xl">Nenhuma telemetria profunda mapeada.</div>';
        return;
    }

    // Calcula Aproveitamento (%)
    itemsArray.forEach(item => {
        item.pct = Math.round((item.correct / item.total) * 100);
    });
    // Ordena do mais crítico (menor %) para o menos crítico
    itemsArray.sort((a,b) => a.pct - b.pct);

    let itemsHtml = itemsArray.map((item, index) => {
        let colorClass = 'bg-[#ff6b6b] border-[#e05252] text-white'; // Vermelho (Crítico)
        if(item.pct >= 80) colorClass = 'bg-[#f1c40f] border-[#d4ac0d] text-blue-950'; // Amarelo
        if(item.pct >= 90) colorClass = 'bg-[#6bff89] border-[#4ddf6a] text-blue-950'; // Verde

        return `
        <div onclick="window.showItemDetails('${item.id}')" class="min-w-[130px] flex-shrink-0 cursor-pointer hover:-translate-y-2 transition-transform shadow-[0_5px_15px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden group">
            <div class="${colorClass.split(' ')[0]} py-3 px-2 text-center border-b-4 border-black/20 group-hover:brightness-110 transition-all">
                <span class="block font-black font-orbitron ${colorClass.split(' ')[2]} text-xs uppercase truncate">ITEM ${index+1}</span>
                <span class="block ${colorClass.split(' ')[2]} opacity-80 text-[10px] font-bold mt-1 tracking-widest truncate">${item.id}</span>
            </div>
            <div class="bg-white text-center py-3 relative">
                <span class="font-black text-2xl ${colorClass.split(' ')[0].replace('bg-', 'text-')} drop-shadow-sm">${item.pct}%</span>
                <div class="absolute bottom-0 left-0 h-1 ${colorClass.split(' ')[0]}" style="width: ${item.pct}%"></div>
            </div>
        </div>`;
    }).join('');

    container.innerHTML = `
        <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-2xl mb-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-white font-black text-xl font-orbitron uppercase flex items-center gap-2">
                    <span class="text-cyan-400">🎯</span> Aproveitamento por %
                </h3>
            </div>
            <div class="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-widest mb-4 px-2">
                <span class="text-red-400">Mais crítico ⬇</span>
                <span class="text-green-400">Menos crítico ⬆</span>
            </div>
            <div class="flex gap-4 overflow-x-auto custom-scrollbar pb-6 pt-2 px-2 border-b-2 border-cyan-800/30">
                ${itemsHtml}
            </div>
        </div>
        <div id="item-details-view" class="bg-white rounded-2xl p-8 shadow-2xl hidden flex-col transition-all text-blue-950 mb-10">
            <!-- Conteúdo Dinâmico do Gráfico -->
        </div>
    `;
};

window.showItemDetails = function(id) {
    const detailsView = el('item-details-view');
    const item = window.globalItemStats[id];
    if(!item || !detailsView) return;

    const maxOpts = Math.max(...Object.values(item.opts), 1);
    
    // Gráfico de Barras EduqBrasil
    const barsHtml = ['A','B','C','D'].map(l => {
        const count = item.opts[l];
        const hPct = Math.round((count / maxOpts) * 100);
        // Barra verde se for a mais escolhida (apenas para impacto visual) ou manter neutro
        let barColor = 'bg-[#e74c3c]'; // Vermelho clássico
        if (hPct === 100 && count > 0) barColor = 'bg-[#2ecc71]'; // Verde para a mais clicada

        return `
        <div class="flex flex-col items-center justify-end h-56 w-16 group relative">
            <div class="w-full ${barColor} shadow-md transition-all duration-1000 ease-out" style="height: ${hPct}%;"></div>
            <span class="mt-4 text-gray-500 font-black font-orbitron border-t-2 border-gray-300 w-full text-center pt-2 text-xl">${l}</span>
            <div class="absolute -top-8 text-xl font-black text-gray-700">${count}</div>
        </div>`;
    }).join('');

    detailsView.innerHTML = `
        <div class="flex justify-between items-start mb-8 border-b-2 border-gray-100 pb-6">
            <div>
                <h3 class="text-4xl font-black font-orbitron uppercase text-blue-950 flex items-center gap-4">
                    <span>📑</span> Distribuição de Respostas
                </h3>
                <div class="flex gap-3 mt-4">
                    <span class="bg-[#3498db] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">${item.comp || 'Geral'}</span>
                    <span class="bg-[#9b59b6] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">Habilidade: ${item.id}</span>
                    <span class="bg-[#f39c12] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">QID: ${item.qId}</span>
                </div>
            </div>
            <button onclick="document.getElementById('item-details-view').classList.add('hidden')" class="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-colors text-xl font-bold">X</button>
        </div>
        <div class="w-full">
            <h4 class="text-center text-gray-400 text-sm font-bold uppercase tracking-widest mb-10">Contagem de respostas por alternativa</h4>
            
            <!-- Eixos do Gráfico -->
            <div class="relative w-full max-w-3xl mx-auto h-64 border-l-2 border-b-2 border-gray-300 flex justify-around items-end pb-0 pt-8 pl-4 pr-4">
                
                <!-- Linhas Guia Horizontais -->
                <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-[3.2rem]">
                    <div class="border-t border-gray-100 w-full"></div>
                    <div class="border-t border-gray-100 w-full"></div>
                    <div class="border-t border-gray-100 w-full"></div>
                    <div class="border-t border-gray-100 w-full"></div>
                </div>

                ${barsHtml}
            </div>
        </div>
    `;
    detailsView.classList.remove('hidden');
    detailsView.classList.add('flex');
    detailsView.scrollIntoView({ behavior: 'smooth', block: 'end' });
};

window.clearReports = function() { if(confirm("Limpar diário?")) { writeJSONKey(STORAGE_KEYS.reports, []); window.renderReportsList(); if(!el('tab-content-skills').classList.contains('hidden')) window.renderSkillsAnalysis(); if(typeof window.checkReportsInbox === 'function') window.checkReportsInbox(); } };

// --- NAVEGAÇÃO E MODAIS ---
window.openProfLogin = function() { el('prof-pin-input').value = ''; el('login-error').classList.add('hidden'); el('modal-prof-login').classList.remove('hidden'); el('modal-prof-login').classList.add('flex'); };
window.closeProfLogin = function() { el('modal-prof-login').classList.add('hidden'); el('modal-prof-login').classList.remove('flex'); };
window.enterProfDashboard = function() { qsa('.screen').forEach(s => s.classList.remove('active')); el('screen-prof-dashboard').classList.add('active'); if(typeof window.checkReportsInbox === 'function') window.checkReportsInbox(); };
window.backToProfDashboard = function() { qsa('.screen').forEach(s => s.classList.remove('active')); el('screen-prof-dashboard').classList.add('active'); };
window.backToProfDashboardFromReports = function() { window.backToProfDashboard(); };
window.backToProfDashboardFromClass = function() { window.backToProfDashboard(); };
window.goBackToHome = function() { qsa('.screen').forEach(s => s.classList.remove('active')); el('screen-home').classList.add('active'); };
window.openClassManager = function() { qsa('.screen').forEach(s => s.classList.remove('active')); el('screen-class-manager').classList.add('active'); window.renderClassList(); window.updateClassDetailsView(); };
window.openQuestionBank = function() { qsa('.screen').forEach(s => s.classList.remove('active')); el('screen-question-bank').classList.add('active'); if(typeof window.renderQuestionBank === 'function') window.renderQuestionBank(); };
window.openReportsInbox = function() { qsa('.screen').forEach(s => s.classList.remove('active')); el('screen-reports').classList.add('active'); window.renderReportsList(); if(!el('tab-content-skills').classList.contains('hidden')) window.renderSkillsAnalysis(); };
window.switchReportTab = function(tab) { ['analytics', 'skills', 'list'].forEach(t => { el('tab-btn-' + t).className = t === tab ? "px-4 py-2 rounded-lg bg-cyan-600 text-white font-bold text-xs uppercase shadow-md whitespace-nowrap transition-colors" : "px-4 py-2 rounded-lg text-gray-400 hover:text-white font-bold text-xs uppercase whitespace-nowrap transition-colors"; if (el('tab-content-' + t)) { if (t === tab) el('tab-content-' + t).classList.remove('hidden'); else el('tab-content-' + t).classList.add('hidden'); } }); };
window.openAddClassModal = function() { el('add-class-name').value = ''; el('add-class-error').classList.add('hidden'); el('modal-add-class').classList.remove('hidden'); el('modal-add-class').classList.add('flex'); };
window.closeAddClassModal = function() { el('modal-add-class').classList.add('hidden'); el('modal-add-class').classList.remove('flex'); };
window.openAddStudentModal = function() { if(!activeTurmaId) return; el('add-student-name').value = ''; el('add-student-bolsa').checked = false; el('add-student-aee').checked = false; el('modal-add-student').classList.remove('hidden'); el('modal-add-student').classList.add('flex'); };
window.closeAddStudentModal = function() { el('modal-add-student').classList.add('hidden'); el('modal-add-student').classList.remove('flex'); };

window.openStudentSetup = function() { window.closeDraggableHologram(); if(typeof audioSystem !== 'undefined') audioSystem.play('suspense'); qsa('.screen').forEach(s => s.classList.remove('active')); el('screen-setup-student').classList.add('active'); const mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null; if(window.__MUTANT || mHash) { const f = el('student-filters-wrapper'); if(f) f.style.display = 'none'; const d = el('student-diff-wrapper'); if(d) d.style.display = 'none'; const title = qs('#screen-setup-student h2'); if(title) title.innerText = window.CURRENT_MISSION_ID || "Avaliação"; } };
window.openSetup = function() { window.closeDraggableHologram(); if(typeof window.initTurmasData === 'function') window.initTurmasData(); const selectTurma = el('setup-select-turma'); selectTurma.innerHTML = '<option value="">Selecione uma Turma para Sorteio...</option>'; if(allTurmas.length === 0) { selectTurma.innerHTML = '<option value="">Nenhuma turma cadastrada. Use o Gestor.</option>'; selectTurma.disabled = true; window.setTeamMode('manual'); } else { selectTurma.disabled = false; allTurmas.forEach(t => { selectTurma.innerHTML += `<option value="${t.id}">${t.name} (${t.students.length} alunos)</option>`; }); window.setTeamMode('auto'); } if(typeof audioSystem !== 'undefined') audioSystem.play('voice_setup'); qsa('.screen').forEach(s => s.classList.remove('active')); el('screen-setup').classList.add('active'); };
window.toggleGameMode = function(mode) { if (mode === 'single') { el('multi-mode-options').classList.add('hidden'); el('teams-inputs-auto').classList.add('hidden'); el('teams-inputs-auto').classList.remove('flex'); el('teams-inputs-manual').classList.remove('hidden'); el('teams-inputs-manual').classList.add('flex'); el('team1').placeholder = "Seu Nome"; el('team1').value = "Jogador 1"; el('team2').classList.add('hidden'); el('team3').classList.add('hidden'); el('team4').classList.add('hidden'); } else { el('multi-mode-options').classList.remove('hidden'); const isAuto = el('btn-mode-auto').classList.contains('bg-cyan-600'); if(isAuto) { el('teams-inputs-auto').classList.remove('hidden'); el('teams-inputs-auto').classList.add('flex'); el('teams-inputs-manual').classList.add('hidden'); el('teams-inputs-manual').classList.remove('flex'); } else { el('teams-inputs-auto').classList.add('hidden'); el('teams-inputs-auto').classList.remove('flex'); el('teams-inputs-manual').classList.remove('hidden'); el('teams-inputs-manual').classList.add('flex'); } el('team1').placeholder = "Nome da Equipe 1"; el('team1').value = "Equipe 1"; el('team2').classList.remove('hidden'); el('team3').classList.remove('hidden'); el('team4').classList.remove('hidden'); } };
window.setTeamMode = function(mode) { const btnAuto = el('btn-mode-auto'); const btnManual = el('btn-mode-manual'); const autoView = el('teams-inputs-auto'); const manualView = el('teams-inputs-manual'); if(mode === 'auto') { btnAuto.className = "flex-1 py-2 text-xs font-bold uppercase rounded bg-cyan-600 text-white shadow-inner transition-colors"; btnManual.className = "flex-1 py-2 text-xs font-bold uppercase rounded text-gray-400 hover:text-white transition-colors"; autoView.classList.remove('hidden'); autoView.classList.add('flex'); manualView.classList.add('hidden'); manualView.classList.remove('flex'); } else { btnManual.className = "flex-1 py-2 text-xs font-bold uppercase rounded bg-cyan-600 text-white shadow-inner transition-colors"; btnAuto.className = "flex-1 py-2 text-xs font-bold uppercase rounded text-gray-400 hover:text-white transition-colors"; manualView.classList.remove('hidden'); manualView.classList.add('flex'); autoView.classList.add('hidden'); autoView.classList.remove('flex'); } };
window.setTeamCount = function(num) { el('auto-team-count').value = num; [2, 3, 4].forEach(n => { const btn = el('btn-tc-' + n); if (n === num) btn.className = "w-8 h-8 rounded-full bg-cyan-500 text-blue-950 font-black border-2 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all"; else btn.className = "w-8 h-8 rounded-full bg-blue-900 text-gray-400 font-bold border-2 border-transparent hover:border-blue-500 transition-all"; }); };

window.showFeedbackAndNext = function(title, type) { window.changeBrutusPose('erro'); const q = window.lastAnsweredQuestion || activeQuestions[globalQuestionIndex]; const letters = ['A', 'B', 'C', 'D']; el('feedback-title').innerText = title; el('feedback-correct-answer').innerText = `${letters[q.answer]}) ${q.options[q.answer]}`; el('feedback-explanation').innerText = q.explicacao; const fbScreen = el('modal-feedback'); fbScreen.classList.remove('hidden'); fbScreen.classList.add('flex'); window.pendingFeedbackType = type; };
window.closeFeedbackAndNext = function() { el('modal-feedback').classList.add('hidden'); el('modal-feedback').classList.remove('flex'); const team = teams[currentTeamIndex]; const lostVal = loseAwards[team.level] || "0"; const gameScreen = el('screen-game'); gameScreen.style.transition = 'opacity 0.8s ease'; gameScreen.style.opacity = '0'; setTimeout(() => { gameScreen.classList.remove('active'); gameScreen.style.opacity = '1'; el('final-lose-award').innerText = lostVal; qs('#screen-end-lose h1').innerText = window.pendingFeedbackType === 'time' ? "TEMPO ESGOTADO!" : "Você Errou!"; el('end-lose-team').innerText = isStudentMode ? `Fim de Treino: ${team.name}` : `Equipe Eliminada: ${team.name}`; const endScreen = el('screen-end-lose'); endScreen.classList.add('active'); if(typeof window.checkGameEnd === 'function') window.checkGameEnd('lose'); setTimeout(() => { endScreen.style.opacity = '1'; }, 50); }, 800); };
window.restoreHelpsUI = function() { const helps = teams[currentTeamIndex].helps; const resetCard = (id, used) => { const card = el(id); if (!card) return; if (used) { card.classList.remove('hover:scale-105', 'cursor-pointer'); card.classList.add('grayscale', 'opacity-50', 'cursor-not-allowed'); card.onclick = null; } else { card.classList.add('hover:scale-105', 'cursor-pointer'); card.classList.remove('grayscale', 'opacity-50', 'cursor-not-allowed'); if(id==='card-eliminar') card.onclick = () => { if(typeof window.useHelp === 'function') window.useHelp('eliminar'); }; if(id==='card-palpite') card.onclick = () => { if(typeof window.useHelp === 'function') window.useHelp('palpite'); }; if(id==='card-dica') card.onclick = () => { if(typeof window.useHelp === 'function') window.useHelp('dica'); }; if(id==='card-pular') card.onclick = () => { if(typeof window.useHelp === 'function') window.useHelp('pular'); }; } }; resetCard('card-eliminar', helps.eliminar); resetCard('card-palpite', helps.palpite); resetCard('card-dica', helps.dica); resetCard('card-pular', helps.pular >= 3); const helpBtn = el('btn-ajudas'); if (teams[currentTeamIndex].level === 15) helpBtn.classList.add('opacity-40', 'pointer-events-none'); else helpBtn.classList.remove('opacity-40', 'pointer-events-none'); };
window.showTurnTransition = function(teamName, callback) { window.closeDraggableHologram(); const transScreen = el('screen-transition'); el('transition-text').innerText = `Vez da Equipe:\n${teamName}`; transScreen.classList.remove('hidden'); transScreen.classList.add('flex'); transScreen.style.opacity = '0'; setTimeout(() => { transScreen.style.transition = 'opacity 0.5s ease'; transScreen.style.opacity = '1'; setTimeout(() => { if (callback) callback(); setTimeout(() => { transScreen.style.opacity = '0'; setTimeout(() => { transScreen.classList.add('hidden'); transScreen.classList.remove('flex'); }, 500); }, 2000); }, 500); }, 50); };
window.showLeaderboard = function() { window.closeDraggableHologram(); if(typeof window.clearProgress === 'function') window.clearProgress(); if(typeof audioSystem !== 'undefined') { audioSystem.stopAll(); audioSystem.play('vitoria'); } qsa('.screen').forEach(s => { s.classList.remove('active'); }); let leaderboardScreen = el('screen-leaderboard'); if (!leaderboardScreen) { leaderboardScreen = ce('div'); leaderboardScreen.id = 'screen-leaderboard'; document.body.appendChild(leaderboardScreen); } leaderboardScreen.className = 'screen active flex justify-center items-center relative overflow-hidden'; const sortedTeams = [...teams].sort((a, b) => b.level === a.level ? 0 : b.level - a.level); let rankingHTML = sortedTeams.map((t, index) => { let prize = t.level === 0 ? "0" : (awards[t.level - 1] || "1 MILHÃO"); if (t.status === 'won' || t.level >= 16) prize = "1 MILHÃO"; let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'; return `<div class="flex items-center justify-between p-3 md:p-4 border-2 rounded-2xl bg-blue-900/80 border-blue-400 w-full mb-2"><div class="flex items-center gap-4"><span class="text-3xl">${medal}</span><span class="text-xl font-bold font-orbitron">${t.name}</span></div><div class="bg-black/50 px-4 py-1.5 rounded-xl"><span class="text-xl font-black text-yellow-300 font-orbitron">${prize}</span></div></div>`; }).join(''); let actionButtonsHTML = ''; if (isStudentMode) { const sumTimes = teams[0].responseTimes.reduce((a,b)=>a+b, 0); const calculatedAvg = teams[0].responseTimes.length ? Math.floor(sumTimes / teams[0].responseTimes.length) : 30000; let telemetry = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); const attemptsCount = telemetry[window.currentStudentTelemetryKey] ? telemetry[window.currentStudentTelemetryKey].attempts : 1; const teamHistory = answerHistory.filter(a => a.teamName === teams[0].name).map(a => ({ qid: a.questionId, bncc: a.bncc, prof: a.proficiencia, comp: a.componente, sel: a.selectedIndex, cor: a.correctIndex, wasCorrect: a.wasCorrect, selTxt: a.selectedText, reason: a.reason })); const syncObj = { type: 'student_training', student: teams[0].name, level: teams[0].level, date: new Date().toISOString().split('T')[0], timestamp: Date.now(), attempts: attemptsCount, avgTimeMs: calculatedAvg, history: teamHistory, missionId: window.CURRENT_MISSION_ID || "Treino Livre" }; const syncHash = btoa(unescape(encodeURIComponent(JSON.stringify(syncObj)))); let baseUrl = window.location.origin + window.location.pathname; baseUrl = baseUrl.replace('blob:', '').endsWith('/') ? baseUrl.slice(0, -1) : baseUrl; const shareText = `🏆 *Show do Brutão* 🏆\n\nOlá Professor! Terminei o meu treino.\n👤 *Herói:* ${teams[0].name}\n📈 *Nível Alcançado:* ${teams[0].level}\n\nLink do boletim:\n🔗 ${baseUrl}?sync=${syncHash}`; const alreadySent = telemetry[window.currentStudentTelemetryKey] ? telemetry[window.currentStudentTelemetryKey].sent : false; actionButtonsHTML = `<div class="w-full flex flex-col md:flex-row gap-3 mt-4">${alreadySent ? `<div class="flex-1 bg-gray-800 border border-gray-600 rounded-full py-3.5 text-center text-xs font-bold text-gray-400">✅ ENVIADO HOJE</div>` : `<a href="https://wa.me/?text=${encodeURIComponent(shareText)}" onclick="localStorage.setItem('brutao_telemetry', JSON.stringify({...JSON.parse(localStorage.getItem('brutao_telemetry')||'{}'), ['${window.currentStudentTelemetryKey}']: {attempts: ${attemptsCount}, sent: true}}));" target="_blank" class="flex-1 rounded-full bg-gradient-to-b from-green-500 to-green-700 border-2 border-green-300 py-3.5 flex items-center justify-center gap-2 text-xs font-black font-orbitron hover:scale-105 transition-all">📲 WHATSAPP</a>`} <button onclick="if(typeof window.downloadBoletimOffline === 'function') window.downloadBoletimOffline('${syncHash}', '${teams[0].name}')" class="flex-1 bg-blue-950 border-2 border-cyan-500 text-cyan-300 font-black py-3.5 rounded-full text-xs font-orbitron hover:scale-105 transition-all shadow-[0_0_10px_rgba(34,211,238,0.3)]">💾 BAIXAR (.brutao)</button> <button onclick="window.copyToClipboardFallback('${syncHash}', this)" class="flex-1 bg-blue-900 border border-cyan-500 text-cyan-300 font-black py-3.5 rounded-full text-xs font-orbitron hover:scale-105 transition-all">📋 COPIAR</button></div><button onclick="window.goBackToHome()" class="mt-4 text-gray-500 text-xs font-bold uppercase font-montserrat hover:text-white">Sair</button>`; } else { actionButtonsHTML = `<button onclick="window.goBackToHome()" class="rounded-full bg-gradient-to-b from-blue-600 to-blue-900 border-2 border-cyan-400 px-12 py-4 text-white font-black font-orbitron text-md mt-4 w-full hover:scale-105 transition-all">VOLTAR AO INÍCIO</button>`; } leaderboardScreen.innerHTML = `<div class="absolute inset-0 bg-black/90 z-0"></div><div class="relative z-20 flex flex-col items-center w-full max-w-2xl p-8 bg-slate-900 border-4 border-yellow-500 rounded-3xl shadow-2xl" id="ranking-box"><h1 class="text-3xl md:text-5xl font-black font-orbitron mb-6 uppercase tracking-wider text-yellow-400">Ranking Final</h1><div class="w-full overflow-y-auto max-h-60 custom-scrollbar mb-4 pr-1">${rankingHTML}</div><div class="w-full flex flex-col items-center">${actionButtonsHTML}</div></div><div class="absolute inset-0 pointer-events-none z-30 overflow-hidden" id="confetti-container-ranking" data-confetti-container></div>`; window.triggerConfetti(); };

window.openHelp = function() { window.closeDraggableHologram(); if(typeof audioSystem !== 'undefined') audioSystem.play('voice_ajudas'); if(typeof window.pauseTimer === 'function') window.pauseTimer(); el('modal-help').classList.remove('hidden'); el('modal-help').classList.add('flex'); };
window.closeHelp = function() { el('modal-help').classList.add('hidden'); el('modal-help').classList.remove('flex'); if(typeof window.resumeTimer === 'function') window.resumeTimer(); };
window.closeAudience = function() { el('modal-audience').classList.add('hidden'); el('modal-audience').classList.remove('flex'); if(typeof window.resumeTimer === 'function') window.resumeTimer(); };
window.closeDica = function() { el('modal-dica').classList.add('hidden'); el('modal-dica').classList.remove('flex'); if(typeof window.resumeTimer === 'function') window.resumeTimer(); };
window.openStopModal = function() { window.closeDraggableHologram(); if(typeof window.pauseTimer === 'function') window.pauseTimer(); el('stop-value-modal').innerText = teams[currentTeamIndex].level === 0 ? "0" : awards[teams[currentTeamIndex].level - 1]; el('modal-parar').classList.remove('hidden'); el('modal-parar').classList.add('flex'); window.changeBrutusPose('pensativo'); };
window.cancelStop = function() { el('modal-parar').classList.add('hidden'); el('modal-parar').classList.remove('flex'); if(typeof window.resumeTimer === 'function') window.resumeTimer(); window.changeBrutusPose('normal'); };
window.cancelSkip = function() { el('modal-pular').classList.add('hidden'); el('modal-pular').classList.remove('flex'); if(typeof window.resumeTimer === 'function') window.resumeTimer(); };

window.toggleDraggableHologram = function() { const holo = el('draggable-hologram'); if (holo && holo.classList.contains('hidden')) window.openDraggableHologram(); else window.closeDraggableHologram(); };
window.openDraggableHologram = function() { const holo = el('draggable-hologram'); if(holo) { holo.style.top = '15%'; holo.style.left = '5vw'; holo.style.transform = 'none'; holo.classList.remove('hidden'); holo.classList.add('flex', 'animate-holo'); } };
window.closeDraggableHologram = function() { const holo = el('draggable-hologram'); if (holo) { holo.classList.add('hidden'); holo.classList.remove('flex', 'animate-holo'); } };
window.makeDraggable = function(elmnt, header) { let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0; if (header) { header.onmousedown = dragMouseDown; header.ontouchstart = dragMouseDown; } function dragMouseDown(e) { e = e || window.event; if(e.target.tagName.toLowerCase() === 'button') return; if(e.type === 'touchstart') { pos3 = e.touches[0].clientX; pos4 = e.touches[0].clientY; } else { e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY; } document.onmouseup = closeDragElement; document.onmousemove = elementDrag; document.ontouchend = closeDragElement; document.ontouchmove = elementDrag; header.classList.add('cursor-grabbing'); } function elementDrag(e) { e = e || window.event; let clientX, clientY; if(e.type === 'touchmove') { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } else { e.preventDefault(); clientX = e.clientX; clientY = e.clientY; } pos1 = pos3 - clientX; pos2 = pos4 - clientY; pos3 = clientX; pos4 = clientY; elmnt.style.top = (elmnt.offsetTop - pos2) + "px"; elmnt.style.left = (elmnt.offsetLeft - pos1) + "px"; elmnt.style.transform = "none"; } function closeDragElement() { document.onmouseup = null; document.onmousemove = null; document.ontouchend = null; document.ontouchmove = null; header.classList.remove('cursor-grabbing'); } };

// --- JANELAS DA FÁBRICA DE JOGOS E EXPORTAÇÃO ---
window.openExportGame = function() { el('modal-export-game').classList.remove('hidden'); el('modal-export-game').classList.add('flex'); };
window.closeExportGame = function() { el('modal-export-game').classList.add('hidden'); el('modal-export-game').classList.remove('flex'); };
window.showEmbedModal = function(link, iframe) { el('share-link-input').value = link; el('share-iframe-input').value = iframe; el('modal-share').classList.remove('hidden'); el('modal-share').classList.add('flex'); };

window.openImportFilterModal = function() { el('modal-import-filter').classList.remove('hidden'); el('modal-import-filter').classList.add('flex'); };
window.closeImportFilterModal = function() { el('modal-import-filter').classList.add('hidden'); el('modal-import-filter').classList.remove('flex'); window.pendingImportQuestions = []; };
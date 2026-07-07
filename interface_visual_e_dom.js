// --- CONTROLO GERAL DA INTERFACE ---
window.skipIntro = function() { if (window.isIntroSkipped) return; window.isIntroSkipped = true; const overlay = el('intro-overlay'); if (overlay) { overlay.style.opacity = '0'; setTimeout(() => { overlay.style.display = 'none'; }, 1000); } };
window.toggleMute = function() { window.isMuted = !window.isMuted; Object.keys(audioSystem).forEach(k => { if (typeof audioSystem[k] !== 'function') audioSystem[k].muted = window.isMuted; }); el('icon-mute').innerText = window.isMuted ? '🔇' : '🔊'; };
window.toggleFullscreen = function() { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e=>{}); el('icon-fullscreen').innerText = '🗗'; } else { if(document.exitFullscreen) { document.exitFullscreen(); el('icon-fullscreen').innerText = '⛶'; } } };
window.showSystemMessage = function(title, text, type = 'info') { const m = el('modal-system-msg'); if(!m) return; el('sys-msg-title').innerText = title; el('sys-msg-text').innerText = text; m.classList.remove('hidden'); m.classList.add('flex'); };
window.closeSystemMessage = function() { el('modal-system-msg').classList.add('hidden'); el('modal-system-msg').classList.remove('flex'); };
window.triggerConfetti = function() { const c = qs('.screen.active [data-confetti-container]') || el('confetti-container') || qs('[data-confetti-container]'); if(!c) return; c.innerHTML = ''; const colors = ['#FFDF73','#D4AF37','#ffffff','#3B82F6','#EF4444']; for(let i=0; i<100; i++) { const p = ce('div'); p.className = 'confetti-piece'; p.style.width = (Math.random()*10+5)+'px'; p.style.height = (Math.random()*20+10)+'px'; p.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)]; p.style.left = (Math.random()*100)+'vw'; p.style.top = '-20px'; p.style.opacity = Math.random()+0.5; p.style.transform = `rotate(${Math.random()*360}deg)`; p.style.transition = `top ${Math.random()*3+2}s cubic-bezier(0.25,0.46,0.45,0.94) ${Math.random()*2}s, transform ${Math.random()*3+2}s linear ${Math.random()*2}s, opacity ${Math.random()*3+2}s ease-in ${Math.random()*2}s`; c.appendChild(p); setTimeout(()=>{ p.style.top='120vh'; p.style.transform=`rotate(${Math.random()*720+360}deg)`; p.style.opacity='0'; },50); } };
window.previewImage = function() { let url = el('add-q-image').value.trim(); url = normalizeImageUrl(url); const container = el('image-preview-container'); const img = el('image-preview'); if(url) { img.onload = () => { container.classList.remove('hidden'); container.classList.add('flex'); }; img.onerror = () => { container.classList.add('hidden'); container.classList.remove('flex'); }; img.src = url; } else { container.classList.add('hidden'); container.classList.remove('flex'); img.src = ""; } };

// --- ANIMAÇÕES E PERSONAGENS ---
window.changeBrutusPose = function(poseName) { const hostImg = el('char-host'); const hostSprite = el('char-host-sprite'); const hostCinematic = el('char-host-cinematic'); const cinematicVignette = el('cinematic-vignette'); if(!hostImg || !hostSprite || !brutusPoses[poseName]) return; const pose = brutusPoses[poseName]; hostImg.style.opacity = '0'; hostSprite.style.opacity = '0'; if(hostCinematic) { hostCinematic.style.opacity = '0'; hostCinematic.classList.remove('cinematic-zoom'); } if(cinematicVignette) cinematicVignette.style.opacity = '0'; clearInterval(spriteInterval); clearInterval(cinematicInterval); setTimeout(() => { hostSprite.classList.add('hidden'); hostImg.classList.add('hidden'); if(hostCinematic) hostCinematic.classList.add('hidden'); if (pose.type === 'img') { hostImg.classList.remove('hidden'); hostImg.src = pose.src; hostImg.style.opacity = '1'; } else if (pose.type === 'sprite') { hostSprite.classList.remove('hidden'); hostSprite.style.backgroundImage = `url('${pose.src}')`; hostSprite.style.backgroundSize = `${pose.cols * 100}% ${pose.rows * 100}%`; hostSprite.style.opacity = '1'; let currentFrame = 0; spriteInterval = setInterval(() => { const col = currentFrame % pose.cols; const row = Math.floor(currentFrame / pose.cols); const xPos = pose.cols > 1 ? (col / (pose.cols - 1)) * 100 : 0; const yPos = pose.rows > 1 ? (row / (pose.rows - 1)) * 100 : 0; hostSprite.style.backgroundPosition = `${xPos}% ${yPos}%`; currentFrame = (currentFrame + 1) % pose.frames; }, 150); } else if (pose.type === 'cinematic') { if(!hostCinematic) return; hostCinematic.classList.remove('hidden'); hostCinematic.style.opacity = '1'; hostCinematic.innerHTML = ''; const shakeWrapper = ce('div'); shakeWrapper.className = 'absolute inset-0 w-full h-full animate-camera-shake'; const breathWrapper = ce('div'); breathWrapper.className = 'absolute inset-0 w-full h-full animate-tense-breathing'; pose.frames.forEach((src, idx) => { const img = ce('img'); img.src = src; img.className = 'cinematic-img'; if(idx === 0) img.style.opacity = '1'; breathWrapper.appendChild(img); }); const sweatData = [ { left: '57%', top: '23%', delay: 1800, dur: 2800 }, { left: '64%', top: '28%', delay: 2500, dur: 2200 }, { left: '53%', top: '26%', delay: 3500, dur: 1800 }, { left: '62%', top: '35%', delay: 4200, dur: 1200 } ]; sweatData.forEach(pos => { const sweat = ce('div'); sweat.className = 'sweat-drop'; sweat.style.left = pos.left; sweat.style.top = pos.top; sweat.style.animation = `sweat-trickle ${pos.dur}ms cubic-bezier(0.4, 0, 0.2, 1) ${pos.delay}ms forwards`; breathWrapper.appendChild(sweat); }); shakeWrapper.appendChild(breathWrapper); hostCinematic.appendChild(shakeWrapper); void hostCinematic.offsetWidth; hostCinematic.classList.add('cinematic-zoom'); if(cinematicVignette) cinematicVignette.style.opacity = '1'; let currentFrame = 0; const totalFrames = pose.frames.length; const timePerFrame = 5000 / (totalFrames - 1); cinematicInterval = setInterval(() => { currentFrame++; if (currentFrame >= totalFrames) { clearInterval(cinematicInterval); return; } const imgs = breathWrapper.querySelectorAll('.cinematic-img'); if(imgs[currentFrame]) imgs[currentFrame].style.opacity = '1'; if(imgs[currentFrame - 1]) { setTimeout(() => { if(imgs[currentFrame - 1]) imgs[currentFrame - 1].style.opacity = '0'; }, 300); } }, timePerFrame); } }, 150); };

// --- RENDERIZAÇÃO DE LISTAS DE TURMAS ---
window.renderClassList = function() { const container = el('class-list-container'); container.innerHTML = ''; if(allTurmas.length === 0) { container.innerHTML = `<div class="text-center text-gray-500 py-6 text-sm">Nenhuma turma.</div>`; return; } allTurmas.forEach(t => { const isActive = t.id === activeTurmaId; const card = ce('div'); card.className = `border rounded-xl p-3 mb-3 cursor-pointer transition-all ${isActive ? 'bg-indigo-600 border-indigo-400':'bg-black/40 border-white/10'}`; card.onclick = () => { activeTurmaId = t.id; renderClassList(); updateClassDetailsView(); }; card.innerHTML = `<div class="flex justify-between items-center"><h4 class="text-white font-bold font-orbitron truncate pr-2">${t.name}</h4><span class="bg-black/50 text-indigo-300 text-[10px] font-black px-2 py-1 rounded-lg">${t.students.length} 👤</span></div>`; container.appendChild(card); }); };
window.updateClassDetailsView = function() { const emptyState = el('class-details-empty'); const contentState = el('class-details-content'); if (!activeTurmaId) { emptyState.classList.remove('hidden'); contentState.classList.add('hidden'); return; } const turma = allTurmas.find(t => t.id === activeTurmaId); if(!turma) return; emptyState.classList.add('hidden'); contentState.classList.remove('hidden'); contentState.classList.add('flex'); el('active-class-name').innerText = turma.name; el('active-class-count').innerText = turma.students.length; renderStudentList(turma); };
window.renderStudentList = function(turma) { const container = el('student-list-container'); container.innerHTML = ''; if (turma.students.length === 0) { container.innerHTML = `<div class="text-gray-500 text-sm text-center mt-10">Nenhum aluno.</div>`; return; } turma.students.forEach(s => { const tags = []; if(s.race && s.race !== 'Nao Declarado') tags.push(`<span class="bg-gray-800 text-gray-300 border border-gray-600 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">${s.race}</span>`); if(s.isBolsa) tags.push(`<span class="bg-green-900/50 text-green-400 border border-green-700 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Bolsa Família</span>`); if(s.isAEE) tags.push(`<span class="bg-blue-900/50 text-blue-400 border border-blue-700 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">AEE</span>`); const card = ce('div'); card.className = "bg-white/5 border border-white/10 rounded-xl p-3 mb-2 flex justify-between items-center hover:bg-white/10 transition-colors"; card.innerHTML = `<div><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold">${s.name.charAt(0).toUpperCase()}</div><h4 class="text-white font-bold text-sm">${s.name}</h4></div>${tags.length>0 ? '<div class="flex gap-1 mt-2 flex-wrap">'+tags.join('')+'</div>':''}</div><button onclick="deleteStudent('${s.id}')" class="text-red-400 p-2 hover:text-white">🗑️</button>`; container.appendChild(card); }); };

// --- 🚀 MOTOR VISUAL AAA+ (DASHBOARDS E ANALÍTICA PEDAGÓGICA AVANÇADA) ---
// Função auxiliar para calcular a nota TRI do aluno
window.calculateGradeAndProficiency = function(history) {
    if (!history || history.length === 0) return { grade: 0, proficiency: 'Abaixo do Básico', correctPct: 0 };
    let totalWeight = 0;
    let earnedWeight = 0;
    let correctAnswers = 0;
    history.forEach(h => {
        let w = 1; // Peso base (Básico)
        const p = (h.prof || '').toLowerCase();
        if (p.includes('adequado') || p.includes('médio')) w = 2;
        if (p.includes('avançado') || p.includes('difícil')) w = 3;
        
        totalWeight += w;
        if (h.wasCorrect) {
            earnedWeight += w;
            correctAnswers++;
        }
    });
    
    let grade = totalWeight > 0 ? (earnedWeight / totalWeight) * 10 : 0;
    let prof = 'Abaixo do Básico';
    if (grade >= 9) prof = 'Avançado';
    else if (grade >= 7) prof = 'Adequado';
    else if (grade >= 5) prof = 'Básico';

    return { 
        grade: parseFloat(grade.toFixed(2)), 
        proficiency: prof, 
        correctPct: Math.round((correctAnswers / history.length) * 100) 
    };
};

// Obter cores para as proficiências
window.getProficiencyStyles = function(prof) {
    if (prof === 'Avançado') return { bg: 'bg-[#38bdf8]', text: 'text-[#38bdf8]', border: 'border-[#38bdf8]', hex: '#38bdf8' };
    if (prof === 'Adequado') return { bg: 'bg-[#6bff89]', text: 'text-[#6bff89]', border: 'border-[#6bff89]', hex: '#6bff89' };
    if (prof === 'Básico') return { bg: 'bg-[#facc15]', text: 'text-[#facc15]', border: 'border-[#facc15]', hex: '#facc15' };
    return { bg: 'bg-[#ff6b6b]', text: 'text-[#ff6b6b]', border: 'border-[#ff6b6b]', hex: '#ff6b6b' }; // Abaixo do Básico
};

window.renderReportsList = function() {
    const classId = el('report-filter-class') ? el('report-filter-class').value : null;
    let allRawReports = readJSONKey(STORAGE_KEYS.reports, []);
    
    const panelAnalytics = el('tab-content-analytics');
    const panelSkills = el('tab-content-skills');
    const panelList = el('tab-content-list');

    if (!classId) {
        const noDataHtml = `<div class="w-full flex flex-col items-center justify-center text-gray-400 py-20 border-4 border-dashed border-cyan-800/50 rounded-3xl bg-blue-950/20 mt-4"><div class="text-7xl mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">👥</div><h3 class="text-3xl font-black font-orbitron uppercase text-cyan-400 mb-2">Selecione uma Turma</h3><p class="text-sm font-montserrat text-cyan-100/70 text-center max-w-lg">O Painel Pedagógico de Alta Definição necessita que selecione uma turma no topo para mapear a inteligência demográfica e o desempenho TRI.</p></div>`;
        if(panelAnalytics) panelAnalytics.innerHTML = noDataHtml;
        if(panelSkills) panelSkills.innerHTML = noDataHtml;
        if(panelList) panelList.innerHTML = noDataHtml;
        return;
    }

    const classObj = allTurmas.find(t => t.id === classId);
    if (!classObj) return;

    let classReports = allRawReports.filter(r => r.linkedClassId === classId);
    
    // FILTRO DE MISSÃO (NOVIDADE: Comparação entre Atividades)
    const missionSet = new Set(classReports.map(r => r.missionId || 'Atividade de Treino'));
    const missions = Array.from(missionSet);
    
    // Injetar o Filtro de Missão se não existir no header do painel
    let missionSelector = el('mission-filter-select');
    if (!missionSelector) {
        const filterArea = ce('div');
        filterArea.className = "w-full bg-black/40 border border-white/10 p-4 rounded-2xl mb-6 flex items-center justify-between shadow-lg";
        filterArea.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-3xl">🧭</span>
                <div>
                    <h4 class="text-white font-black uppercase tracking-widest text-sm">Filtro de Atividade</h4>
                    <p class="text-gray-400 text-[10px]">Acompanhe e compare o rendimento por missão.</p>
                </div>
            </div>
            <select id="mission-filter-select" onchange="window.renderReportsList()" class="bg-blue-950 border-2 border-cyan-500 text-cyan-300 font-bold p-3 rounded-xl outline-none min-w-[250px] shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                ${missions.map((m, i) => `<option value="${m}" ${i===0?'selected':''}>${m}</option>`).join('')}
            </select>
        `;
        if(panelAnalytics && panelAnalytics.parentNode) {
            // Insere antes das abas, logo abaixo do header
            const parent = panelAnalytics.parentNode;
            const existingFilter = el('global-mission-filter-wrap');
            if(existingFilter) existingFilter.remove();
            filterArea.id = 'global-mission-filter-wrap';
            parent.insertBefore(filterArea, parent.firstChild);
            missionSelector = el('mission-filter-select');
        }
    }

    const selectedMission = missionSelector ? missionSelector.value : (missions[0] || 'Atividade de Treino');
    let filteredReports = classReports.filter(r => (r.missionId || 'Atividade de Treino') === selectedMission);

    // DADOS PEDAGÓGICOS PROCESSADOS
    let analyticsData = {
        totalStudents: classObj.students.length,
        participating: 0,
        generalGradeSum: 0,
        ppiStats: { count: 0, gradeSum: 0, levels: { 'Abaixo do Básico':0, 'Básico':0, 'Adequado':0, 'Avançado':0 } },
        brancosStats: { count: 0, gradeSum: 0, levels: { 'Abaixo do Básico':0, 'Básico':0, 'Adequado':0, 'Avançado':0 } },
        itemsPerformance: {}, // { qid: { total:0, correct:0, opts:{A:0,B:0,C:0,D:0}, prof:'', text:'', comp:'', id:'' } }
        studentTable: []
    };

    // PROCESSAMENTO CRUZADO (Inteligência Lexical)
    classObj.students.forEach(student => {
        const rName = student.name.toLowerCase().trim();
        
        // Busca relatório para este aluno
        let report = filteredReports.find(r => r.student.toLowerCase().trim() === rName);
        if (!report) {
            report = filteredReports.find(r => {
                const sName = r.student.toLowerCase().trim();
                const p1 = sName.split(' ')[0]; const p2 = rName.split(' ')[0];
                return p1 === p2 && (sName.startsWith(rName) || rName.startsWith(sName));
            });
        }

        const isPPI = ['Preta', 'Parda', 'Indigena'].includes(student.race) || student.isBolsa;
        const targetStatGroup = isPPI ? analyticsData.ppiStats : analyticsData.brancosStats;

        if (report) {
            analyticsData.participating++;
            const calc = window.calculateGradeAndProficiency(report.history);
            
            analyticsData.generalGradeSum += calc.grade;
            targetStatGroup.count++;
            targetStatGroup.gradeSum += calc.grade;
            targetStatGroup.levels[calc.proficiency]++;

            // Popular itens para a Tab de Skills
            if(report.history) {
                report.history.forEach(h => {
                    let key = h.bncc && h.bncc !== "N/A" ? h.bncc : (h.qid || 'Sem Habilidade');
                    if(!analyticsData.itemsPerformance[key]) {
                        analyticsData.itemsPerformance[key] = { id: key, qId: h.qid, comp: h.comp, prof: h.prof, total: 0, correct: 0, opts: {'A':0, 'B':0, 'C':0, 'D':0} };
                    }
                    analyticsData.itemsPerformance[key].total++;
                    if(h.wasCorrect) analyticsData.itemsPerformance[key].correct++;
                    let optL = ['A','B','C','D'][h.sel];
                    if(optL) analyticsData.itemsPerformance[key].opts[optL]++;
                });
            }

            analyticsData.studentTable.push({ name: student.name, race: student.race, ppi: isPPI, participated: true, grade: calc.grade, pct: calc.correctPct, prof: calc.proficiency, helps: report.history.filter(h => h.reason !== 'answer').length });
        } else {
            analyticsData.studentTable.push({ name: student.name, race: student.race, ppi: isPPI, participated: false, grade: 0, pct: 0, prof: '-', helps: 0 });
        }
    });

    // ---------------------------------------------------------
    // TAB 1: RADAR VAAR & DASHBOARD GERAL
    // ---------------------------------------------------------
    if (panelAnalytics) {
        if(analyticsData.participating === 0) {
            panelAnalytics.innerHTML = `<div class="text-center text-gray-400 py-16 bg-black/40 rounded-3xl border border-white/10"><div class="text-6xl mb-4">📭</div><h3 class="text-2xl font-black font-orbitron uppercase text-white">Nenhuma participação registrada</h3><p class="text-sm mt-2">Nenhum aluno desta turma sincronizou resultados para a atividade: <strong class="text-cyan-400">${selectedMission}</strong></p></div>`;
        } else {
            const partPct = Math.round((analyticsData.participating / analyticsData.totalStudents) * 100);
            const avgClass = (analyticsData.generalGradeSum / analyticsData.participating).toFixed(2);
            const avgPPI = analyticsData.ppiStats.count > 0 ? (analyticsData.ppiStats.gradeSum / analyticsData.ppiStats.count).toFixed(2) : '--';
            const avgBrancos = analyticsData.brancosStats.count > 0 ? (analyticsData.brancosStats.gradeSum / analyticsData.brancosStats.count).toFixed(2) : '--';

            const drawBar = (stats) => {
                const total = stats.count;
                if(total === 0) return `<div class="w-full h-8 bg-white/5 rounded-md border border-white/10 flex items-center justify-center text-gray-600 text-xs font-bold uppercase tracking-widest">Sem Amostragem</div>`;
                const pAbaixo = (stats.levels['Abaixo do Básico']/total)*100;
                const pBasico = (stats.levels['Básico']/total)*100;
                const pAdeq = (stats.levels['Adequado']/total)*100;
                const pAvan = (stats.levels['Avançado']/total)*100;
                
                return `
                <div class="w-full h-10 rounded-lg overflow-hidden flex font-black text-xs text-blue-950 text-center shadow-inner">
                    ${pAbaixo > 0 ? `<div style="width:${pAbaixo}%" class="bg-[#ff6b6b] flex items-center justify-center relative group text-white border-r border-black/20"><span class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black/90 text-white px-2 py-1 rounded text-[9px] pointer-events-none transition-opacity z-10 whitespace-nowrap">Abaixo do Básico</span>${Math.round(pAbaixo)}%</div>` : ''}
                    ${pBasico > 0 ? `<div style="width:${pBasico}%" class="bg-[#facc15] flex items-center justify-center relative group border-r border-black/20"><span class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black/90 text-white px-2 py-1 rounded text-[9px] pointer-events-none transition-opacity z-10">Básico</span>${Math.round(pBasico)}%</div>` : ''}
                    ${pAdeq > 0 ? `<div style="width:${pAdeq}%" class="bg-[#6bff89] flex items-center justify-center relative group border-r border-black/20"><span class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black/90 text-white px-2 py-1 rounded text-[9px] pointer-events-none transition-opacity z-10">Adequado</span>${Math.round(pAdeq)}%</div>` : ''}
                    ${pAvan > 0 ? `<div style="width:${pAvan}%" class="bg-[#38bdf8] flex items-center justify-center relative group text-white"><span class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black/90 text-white px-2 py-1 rounded text-[9px] pointer-events-none transition-opacity z-10">Avançado</span>${Math.round(pAvan)}%</div>` : ''}
                </div>`;
            };

            panelAnalytics.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                    <!-- Card Participação -->
                    <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center">
                        <h4 class="text-gray-400 font-bold text-xs uppercase tracking-widest mb-4">Participação</h4>
                        <div class="relative w-32 h-32">
                            <svg viewBox="0 0 36 36" class="w-full h-full drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" stroke-width="3.8"/>
                                <path stroke-dasharray="${partPct}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22d3ee" stroke-width="3.8" stroke-linecap="round" class="animate-[dash_1.5s_ease-out_forwards]"/>
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                <span class="text-3xl font-black font-orbitron text-cyan-300">${partPct}%</span>
                            </div>
                        </div>
                        <p class="text-white font-bold mt-4">${analyticsData.participating} de ${analyticsData.totalStudents} Alunos</p>
                    </div>

                    <!-- Card Médias (TRI) -->
                    <div class="lg:col-span-3 bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-center">
                        <div class="flex items-center gap-3 mb-6">
                            <span class="text-3xl">⚖️</span>
                            <div>
                                <h3 class="text-xl font-black text-white font-orbitron uppercase">Desempenho Ponderado (TRI)</h3>
                                <p class="text-gray-400 text-xs font-montserrat">As notas vão de 0 a 10 e consideram o peso cognitivo da habilidade.</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="bg-blue-950 border-2 border-cyan-500/50 rounded-xl p-4 text-center shadow-lg relative overflow-hidden">
                                <div class="absolute inset-0 bg-cyan-500/10"></div>
                                <span class="block text-cyan-200 text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10">Média Geral da Turma</span>
                                <span class="text-5xl font-black text-white font-orbitron relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">${avgClass}</span>
                            </div>
                            <div class="bg-amber-950 border-2 border-yellow-500/50 rounded-xl p-4 text-center shadow-lg relative overflow-hidden">
                                <div class="absolute inset-0 bg-yellow-500/10"></div>
                                <span class="block text-yellow-200 text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10">Média Alunos PPI/Bolsa</span>
                                <span class="text-5xl font-black text-yellow-400 font-orbitron relative z-10">${avgPPI}</span>
                            </div>
                            <div class="bg-emerald-950 border-2 border-green-500/50 rounded-xl p-4 text-center shadow-lg relative overflow-hidden">
                                <div class="absolute inset-0 bg-green-500/10"></div>
                                <span class="block text-emerald-200 text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10">Média Ampla Concorrência</span>
                                <span class="text-5xl font-black text-emerald-400 font-orbitron relative z-10">${avgBrancos}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Painel de Equidade (Barras Empilhadas) -->
                <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h3 class="text-2xl font-black text-white font-orbitron uppercase mb-6 flex items-center gap-3">
                        <span class="text-fuchsia-400">📊</span> Mapa de Equidade Educacional
                    </h3>
                    <div class="flex flex-wrap gap-4 items-center mb-8 text-xs font-bold uppercase tracking-widest text-gray-300 bg-black/30 p-3 rounded-xl border border-white/5 w-fit mx-auto">
                        <span class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-[#ff6b6b] shadow-[0_0_8px_#ff6b6b]"></div>Abaixo Básico</span>
                        <span class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-[#facc15] shadow-[0_0_8px_#facc15]"></div>Básico</span>
                        <span class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-[#6bff89] shadow-[0_0_8px_#6bff89]"></div>Adequado</span>
                        <span class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]"></div>Avançado</span>
                    </div>
                    
                    <div class="space-y-8">
                        <div class="flex flex-col md:flex-row md:items-center gap-6">
                            <div class="w-48 text-right shrink-0">
                                <span class="block text-sm font-black text-yellow-400 uppercase tracking-widest">Grupo Prioritário</span>
                                <span class="text-[10px] text-gray-500 font-bold uppercase">PPI / Baixo NSE (${analyticsData.ppiStats.count} alunos)</span>
                            </div>
                            <div class="flex-1">${drawBar(analyticsData.ppiStats)}</div>
                        </div>
                        <div class="flex flex-col md:flex-row md:items-center gap-6">
                            <div class="w-48 text-right shrink-0">
                                <span class="block text-sm font-black text-emerald-400 uppercase tracking-widest">Ampla Concorrência</span>
                                <span class="text-[10px] text-gray-500 font-bold uppercase">Brancos / Alto NSE (${analyticsData.brancosStats.count} alunos)</span>
                            </div>
                            <div class="flex-1">${drawBar(analyticsData.brancosStats)}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // ---------------------------------------------------------
    // TAB 2: SKILLS (TERMÔMETRO DE ITENS E DISTRATORES)
    // ---------------------------------------------------------
    if (panelSkills) {
        window.globalItemStats = analyticsData.itemsPerformance;
        let itemsArray = Object.values(window.globalItemStats);
        
        if(itemsArray.length === 0) {
            panelSkills.innerHTML = '<div class="text-center text-gray-500 py-10 font-bold border-2 border-dashed border-gray-700 rounded-xl bg-black/40">Nenhuma telemetria profunda mapeada para esta atividade.</div>';
        } else {
            itemsArray.forEach(item => { item.pct = Math.round((item.correct / item.total) * 100); });
            itemsArray.sort((a,b) => a.pct - b.pct); // Mais crítico primeiro

            let itemsHtml = itemsArray.map((item, index) => {
                let colorClass = 'bg-[#ff6b6b] border-[#e05252] text-white'; // Vermelho
                if(item.pct >= 70) colorClass = 'bg-[#f1c40f] border-[#d4ac0d] text-blue-950'; // Amarelo
                if(item.pct >= 85) colorClass = 'bg-[#6bff89] border-[#4ddf6a] text-blue-950'; // Verde

                return `
                <div onclick="window.showItemDetails('${item.id}')" class="min-w-[140px] flex-shrink-0 cursor-pointer hover:-translate-y-2 transition-transform shadow-[0_5px_15px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden group border-2 border-transparent hover:border-white/50">
                    <div class="${colorClass.split(' ')[0]} py-3 px-2 text-center border-b-4 border-black/20 group-hover:brightness-110 transition-all">
                        <span class="block font-black font-orbitron ${colorClass.split(' ')[2]} text-xs uppercase truncate">ITEM ${index+1}</span>
                        <span class="block ${colorClass.split(' ')[2]} opacity-80 text-[10px] font-bold mt-1 tracking-widest truncate" title="${item.id}">${item.id}</span>
                    </div>
                    <div class="bg-black/80 text-center py-4 relative backdrop-blur-md">
                        <span class="font-black text-3xl ${colorClass.split(' ')[0].replace('bg-', 'text-')} drop-shadow-sm font-orbitron">${item.pct}%</span>
                        <div class="absolute bottom-0 left-0 h-1.5 ${colorClass.split(' ')[0]} shadow-[0_0_10px_currentColor]" style="width: ${item.pct}%"></div>
                    </div>
                </div>`;
            }).join('');

            panelSkills.innerHTML = `
                <div class="bg-slate-900/80 border border-white/10 rounded-3xl p-8 shadow-2xl mb-6">
                    <div class="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <div>
                            <h3 class="text-white font-black text-2xl font-orbitron uppercase flex items-center gap-3">
                                <span class="text-red-400">🌡️</span> Termômetro de Dificuldade
                            </h3>
                            <p class="text-gray-400 text-xs font-montserrat mt-2">Questões ordenadas da mais crítica para a de maior domínio. Clique num item para ver os distratores.</p>
                        </div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-widest mb-4 px-2">
                        <span class="text-red-400 flex items-center gap-1"><span>⬅</span> Mais Crítico</span>
                        <span class="text-green-400 flex items-center gap-1">Menos Crítico <span>➡</span></span>
                    </div>
                    <div class="flex gap-4 overflow-x-auto custom-scrollbar pb-8 pt-2 px-2 border-b-2 border-cyan-800/30">
                        ${itemsHtml}
                    </div>
                </div>
                <div id="item-details-view" class="bg-gradient-to-b from-blue-950 to-black rounded-3xl p-8 shadow-[0_0_40px_rgba(34,211,238,0.15)] border-2 border-cyan-500/30 hidden flex-col transition-all mb-10">
                    <!-- Gráfico injetado aqui -->
                </div>
            `;
        }
    }

    // ---------------------------------------------------------
    // TAB 3: LIST (TABELA DE INTELIGÊNCIA PEDAGÓGICA)
    // ---------------------------------------------------------
    if (panelList) {
        let tableRows = analyticsData.studentTable.map(s => {
            const statusIcon = s.participated ? '<span class="text-green-400 text-lg" title="Sincronizado">✅</span>' : '<span class="text-red-500 text-lg" title="Pendente">❌</span>';
            const profObj = window.getProficiencyStyles(s.prof);
            const ppiBadge = s.ppi ? `<span class="bg-yellow-900 text-yellow-300 border border-yellow-500 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest shadow-sm">PPI/Bolsa</span>` : `<span class="bg-gray-800 text-gray-300 border border-gray-600 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">Geral</span>`;
            
            return `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="p-4 text-center">${statusIcon}</td>
                <td class="p-4 font-bold text-white">${s.name}</td>
                <td class="p-4 text-center">${ppiBadge}</td>
                <td class="p-4 text-center">
                    <span class="text-2xl font-black font-orbitron ${s.participated ? 'text-white' : 'text-gray-600'}">${s.participated ? s.grade.toFixed(1) : '-'}</span>
                </td>
                <td class="p-4 text-center">
                    <span class="text-sm font-bold ${s.participated ? 'text-cyan-300' : 'text-gray-600'}">${s.participated ? s.pct+'%' : '-'}</span>
                </td>
                <td class="p-4 text-center">
                    ${s.participated ? `<span class="${profObj.bg} ${profObj.text.replace('text-', 'text-')} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-black shadow-md">${s.prof}</span>` : `<span class="text-gray-600 text-xs">-</span>`}
                </td>
            </tr>`;
        }).join('');

        panelList.innerHTML = `
            <div class="bg-slate-900/80 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden">
                <div class="flex justify-between items-center mb-6 px-4">
                    <h3 class="text-white font-black text-2xl font-orbitron uppercase flex items-center gap-3">
                        <span class="text-indigo-400">📋</span> Painel de Acompanhamento Individual
                    </h3>
                    <button onclick="window.print()" class="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase hover:bg-indigo-500 transition-colors shadow-md">🖨️ Exportar PDF</button>
                </div>
                <div class="overflow-x-auto w-full rounded-2xl border border-white/10">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-black/60 text-cyan-400 text-xs uppercase tracking-widest font-black font-orbitron">
                                <th class="p-4 text-center w-16">Status</th>
                                <th class="p-4">Nome do Aluno(a)</th>
                                <th class="p-4 text-center">Grupo VAAR</th>
                                <th class="p-4 text-center">Nota TRI</th>
                                <th class="p-4 text-center">Acertos</th>
                                <th class="p-4 text-center">Proficiência</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm font-montserrat">
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};

window.showItemDetails = function(id) {
    const detailsView = el('item-details-view');
    const item = window.globalItemStats[id];
    if(!item || !detailsView) return;

    const maxOpts = Math.max(...Object.values(item.opts), 1);
    
    const barsHtml = ['A','B','C','D'].map(l => {
        const count = item.opts[l];
        const hPct = Math.round((count / maxOpts) * 100);
        let barColor = 'bg-[#e74c3c] shadow-[0_0_15px_#e74c3c]'; 
        if (hPct === 100 && count > 0) barColor = 'bg-[#2ecc71] shadow-[0_0_15px_#2ecc71]'; 

        return `
        <div class="flex flex-col items-center justify-end h-56 w-16 group relative">
            <div class="absolute -top-10 text-2xl font-black text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity">${count}</div>
            <div class="w-full ${barColor} rounded-t-md transition-all duration-1000 ease-out flex flex-col items-center justify-start pt-2" style="height: ${hPct}%;">
                ${hPct > 0 ? `<span class="text-black/50 font-black text-xs">${count}</span>` : ''}
            </div>
            <span class="mt-4 text-cyan-300 font-black font-orbitron border-t-2 border-cyan-800 w-full text-center pt-3 text-2xl">${l}</span>
        </div>`;
    }).join('');

    detailsView.innerHTML = `
        <div class="flex justify-between items-start mb-8 border-b-2 border-cyan-900/50 pb-6">
            <div>
                <h3 class="text-3xl md:text-4xl font-black font-orbitron uppercase text-white flex items-center gap-4">
                    <span>🕵️</span> Autópsia do Item: <span class="text-cyan-400">${item.id}</span>
                </h3>
                <div class="flex gap-3 mt-4">
                    <span class="bg-blue-900/80 text-blue-200 border border-blue-500 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">${item.comp || 'Geral'}</span>
                    <span class="bg-fuchsia-900/80 text-fuchsia-200 border border-fuchsia-500 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">Proficiência: ${item.prof || 'Básico'}</span>
                    <span class="bg-yellow-900/80 text-yellow-200 border border-yellow-500 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">Acertos: ${item.pct}%</span>
                </div>
            </div>
            <button onclick="document.getElementById('item-details-view').classList.add('hidden')" class="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all text-xl font-black shadow-[0_0_15px_rgba(239,68,68,0.4)]">X</button>
        </div>
        <div class="w-full">
            <h4 class="text-center text-gray-400 text-sm font-bold uppercase tracking-widest mb-10">Análise de Distratores (Alternativas Escolhidas)</h4>
            
            <div class="relative w-full max-w-4xl mx-auto h-64 border-l-2 border-b-2 border-cyan-800 flex justify-around items-end pb-0 pt-8 pl-4 pr-4 bg-black/20 rounded-tr-3xl">
                <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-[3.5rem]">
                    <div class="border-t border-cyan-900/30 w-full"></div>
                    <div class="border-t border-cyan-900/30 w-full"></div>
                    <div class="border-t border-cyan-900/30 w-full"></div>
                    <div class="border-t border-cyan-900/30 w-full"></div>
                </div>
                ${barsHtml}
            </div>
        </div>
    `;
    detailsView.classList.remove('hidden');
    detailsView.classList.add('flex');
    detailsView.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.clearReports = function() { if(confirm("Atenção! Esta ação apagará TODOS os boletins guardados no seu navegador. Continuar?")) { writeJSONKey(STORAGE_KEYS.reports, []); window.renderReportsList(); if(typeof window.checkReportsInbox === 'function') window.checkReportsInbox(); } };

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
window.openReportsInbox = function() { qsa('.screen').forEach(s => s.classList.remove('active')); el('screen-reports').classList.add('active'); window.renderReportsList(); };
window.switchReportTab = function(tab) { ['analytics', 'skills', 'list'].forEach(t => { el('tab-btn-' + t).className = t === tab ? "px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-sm uppercase shadow-[0_0_15px_rgba(34,211,238,0.4)] whitespace-nowrap transition-all" : "px-6 py-3 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold text-sm uppercase whitespace-nowrap transition-all"; if (el('tab-content-' + t)) { if (t === tab) { el('tab-content-' + t).classList.remove('hidden'); el('tab-content-' + t).classList.add('flex'); } else { el('tab-content-' + t).classList.add('hidden'); el('tab-content-' + t).classList.remove('flex'); } } }); };
window.openAddClassModal = function() { el('add-class-name').value = ''; el('add-class-error').classList.add('hidden'); el('modal-add-class').classList.remove('hidden'); el('modal-add-class').classList.add('flex'); };
window.closeAddClassModal = function() { el('modal-add-class').classList.add('hidden'); el('modal-add-class').classList.remove('flex'); };
window.openAddStudentModal = function() { if(!activeTurmaId) return; el('add-student-name').value = ''; el('add-student-bolsa').checked = false; el('add-student-aee').checked = false; el('modal-add-student').classList.remove('hidden'); el('modal-add-student').classList.add('flex'); };
window.closeAddStudentModal = function() { el('modal-add-student').classList.add('hidden'); el('modal-add-student').classList.remove('flex'); };

// JANELAS DA FÁBRICA DE JOGOS, EMBED E COMUNIDADE MANTIDAS INTACTAS
window.openExportGame = function() { el('modal-export-game').classList.remove('hidden'); el('modal-export-game').classList.add('flex'); };
window.closeExportGame = function() { el('modal-export-game').classList.add('hidden'); el('modal-export-game').classList.remove('flex'); };
window.showEmbedModal = function(link, iframe) { el('share-link-input').value = link; el('share-iframe-input').value = iframe; el('modal-share').classList.remove('hidden'); el('modal-share').classList.add('flex'); };
window.openImportFilterModal = function() { el('modal-import-filter').classList.remove('hidden'); el('modal-import-filter').classList.add('flex'); };
window.closeImportFilterModal = function() { el('modal-import-filter').classList.add('hidden'); el('modal-import-filter').classList.remove('flex'); window.pendingImportQuestions = []; };
// --- 5. RENDERIZAÇÃO E INTERFACE (UI) ---
window.skipIntro = function() { if (window.isIntroSkipped) return; window.isIntroSkipped = true; const overlay = window.el('intro-overlay'); if (overlay) { overlay.style.opacity = '0'; setTimeout(() => { overlay.style.display = 'none'; }, 1000); } };
window.toggleMute = function() { window.isMuted = !window.isMuted; Object.keys(window.audioSystem).forEach(k => { if (typeof window.audioSystem[k] !== 'function') window.audioSystem[k].muted = window.isMuted; }); window.el('icon-mute').innerText = window.isMuted ? '🔇' : '🔊'; };
window.toggleFullscreen = function() { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e=>{}); window.el('icon-fullscreen').innerText = '🗗'; } else { if(document.exitFullscreen) { document.exitFullscreen(); window.el('icon-fullscreen').innerText = '⛶'; } } };
window.showSystemMessage = function(title, text, type = 'info') { const m = window.el('modal-system-msg'); if(!m) return; window.el('sys-msg-title').innerText = title; window.el('sys-msg-text').innerText = text; m.classList.remove('hidden'); m.classList.add('flex'); };
window.closeSystemMessage = function() { window.el('modal-system-msg').classList.add('hidden'); window.el('modal-system-msg').classList.remove('flex'); };
window.triggerConfetti = function() { const c = window.qs('.screen.active [data-confetti-container]') || window.el('confetti-container') || window.qs('[data-confetti-container]'); if(!c) return; c.innerHTML = ''; const colors = ['#FFDF73','#D4AF37','#ffffff','#3B82F6','#EF4444']; for(let i=0; i<100; i++) { const p = window.ce('div'); p.className = 'confetti-piece'; p.style.width = (Math.random()*10+5)+'px'; p.style.height = (Math.random()*20+10)+'px'; p.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)]; p.style.left = (Math.random()*100)+'vw'; p.style.top = '-20px'; p.style.opacity = Math.random()+0.5; p.style.transform = `rotate(${Math.random()*360}deg)`; p.style.transition = `top ${Math.random()*3+2}s cubic-bezier(0.25,0.46,0.45,0.94) ${Math.random()*2}s, transform ${Math.random()*3+2}s linear ${Math.random()*2}s, opacity ${Math.random()*3+2}s ease-in ${Math.random()*2}s`; c.appendChild(p); setTimeout(()=>{ p.style.top='120vh'; p.style.transform=`rotate(${Math.random()*720+360}deg)`; p.style.opacity='0'; },50); } };
window.previewImage = function() { let url = window.el('add-q-image').value.trim(); url = window.normalizeImageUrl(url); const container = window.el('image-preview-container'); const img = window.el('image-preview'); if(url) { img.onload = () => { container.classList.remove('hidden'); container.classList.add('flex'); }; img.onerror = () => { container.classList.add('hidden'); container.classList.remove('flex'); }; img.src = url; } else { container.classList.add('hidden'); container.classList.remove('flex'); img.src = ""; } };

window.changeBrutusPose = function(poseName) { 
    const hostImg = window.el('char-host'); const hostSprite = window.el('char-host-sprite'); const hostCinematic = window.el('char-host-cinematic'); const cinematicVignette = window.el('cinematic-vignette'); 
    if(!hostImg || !hostSprite || !window.brutusPoses[poseName]) return; 
    const pose = window.brutusPoses[poseName]; hostImg.style.opacity = '0'; hostSprite.style.opacity = '0'; 
    if(hostCinematic) { hostCinematic.style.opacity = '0'; hostCinematic.classList.remove('cinematic-zoom'); } 
    if(cinematicVignette) cinematicVignette.style.opacity = '0'; 
    clearInterval(window.spriteInterval); clearInterval(window.cinematicInterval); 
    setTimeout(() => { 
        hostSprite.classList.add('hidden'); hostImg.classList.add('hidden'); if(hostCinematic) hostCinematic.classList.add('hidden'); 
        if (pose.type === 'img') { hostImg.classList.remove('hidden'); hostImg.src = pose.src; hostImg.style.opacity = '1'; } 
        else if (pose.type === 'sprite') { hostSprite.classList.remove('hidden'); hostSprite.style.backgroundImage = `url('${pose.src}')`; hostSprite.style.backgroundSize = `${pose.cols * 100}% ${pose.rows * 100}%`; hostSprite.style.opacity = '1'; let currentFrame = 0; window.spriteInterval = setInterval(() => { const col = currentFrame % pose.cols; const row = Math.floor(currentFrame / pose.cols); const xPos = pose.cols > 1 ? (col / (pose.cols - 1)) * 100 : 0; const yPos = pose.rows > 1 ? (row / (pose.rows - 1)) * 100 : 0; hostSprite.style.backgroundPosition = `${xPos}% ${yPos}%`; currentFrame = (currentFrame + 1) % pose.frames; }, 150); } 
        else if (pose.type === 'cinematic') { 
            if(!hostCinematic) return; hostCinematic.classList.remove('hidden'); hostCinematic.style.opacity = '1'; hostCinematic.innerHTML = ''; 
            const shakeWrapper = window.ce('div'); shakeWrapper.className = 'absolute inset-0 w-full h-full animate-camera-shake'; 
            const breathWrapper = window.ce('div'); breathWrapper.className = 'absolute inset-0 w-full h-full animate-tense-breathing'; 
            pose.frames.forEach((src, idx) => { const img = window.ce('img'); img.src = src; img.className = 'cinematic-img'; if(idx === 0) img.style.opacity = '1'; breathWrapper.appendChild(img); }); 
            const sweatData = [ { left: '57%', top: '23%', delay: 1800, dur: 2800 }, { left: '64%', top: '28%', delay: 2500, dur: 2200 }, { left: '53%', top: '26%', delay: 3500, dur: 1800 }, { left: '62%', top: '35%', delay: 4200, dur: 1200 } ]; 
            sweatData.forEach(pos => { const sweat = window.ce('div'); sweat.className = 'sweat-drop'; sweat.style.left = pos.left; sweat.style.top = pos.top; sweat.style.animation = `sweat-trickle ${pos.dur}ms cubic-bezier(0.4, 0, 0.2, 1) ${pos.delay}ms forwards`; breathWrapper.appendChild(sweat); }); 
            shakeWrapper.appendChild(breathWrapper); hostCinematic.appendChild(shakeWrapper); void hostCinematic.offsetWidth; hostCinematic.classList.add('cinematic-zoom'); 
            if(cinematicVignette) cinematicVignette.style.opacity = '1'; 
            let currentFrame = 0; const totalFrames = pose.frames.length; const timePerFrame = 5000 / (totalFrames - 1); 
            window.cinematicInterval = setInterval(() => { currentFrame++; if (currentFrame >= totalFrames) { clearInterval(window.cinematicInterval); return; } const imgs = breathWrapper.querySelectorAll('.cinematic-img'); if(imgs[currentFrame]) imgs[currentFrame].style.opacity = '1'; if(imgs[currentFrame - 1]) { setTimeout(() => { if(imgs[currentFrame - 1]) imgs[currentFrame - 1].style.opacity = '0'; }, 300); } }, timePerFrame); 
        } 
    }, 150); 
};

window.renderClassList = function() { 
    const container = window.el('class-list-container'); 
    container.innerHTML = ''; 
    if(window.allTurmas.length === 0) { container.innerHTML = `<div class="text-center text-gray-500 py-6 text-sm">Nenhuma turma.</div>`; return; } 
    window.allTurmas.forEach(t => { 
        const isActive = t.id === window.activeTurmaId; 
        const card = window.ce('div'); 
        card.className = `border rounded-xl p-3 mb-3 cursor-pointer transition-all ${isActive ? 'bg-indigo-600 border-indigo-400':'bg-black/40 border-white/10 hover:bg-indigo-900/40'}`; 
        card.onclick = () => { window.activeTurmaId = t.id; window.renderClassList(); window.updateClassDetailsView(); }; 
        card.innerHTML = `<div class="flex justify-between items-center"><h4 class="text-white font-bold font-orbitron truncate pr-2">${t.name} <span class="text-[10px] text-indigo-300 ml-2">${t.ano||''}</span></h4><div class="flex gap-2"><button onclick="event.stopPropagation(); window.openAddClassModal('${t.id}')" class="text-yellow-400 hover:text-white px-2">✏️</button><span class="bg-black/50 text-indigo-300 text-[10px] font-black px-2 py-1 rounded-lg">${t.students.length} 👤</span></div></div>`; 
        container.appendChild(card); 
    }); 
};

window.updateClassDetailsView = function() { 
    const emptyState = window.el('class-details-empty'); 
    const contentState = window.el('class-details-content'); 
    if (!window.activeTurmaId) { emptyState.classList.remove('hidden'); contentState.classList.add('hidden'); return; } 
    const turma = window.allTurmas.find(t => t.id === window.activeTurmaId); 
    if(!turma) return; 
    emptyState.classList.add('hidden'); contentState.classList.remove('hidden'); contentState.classList.add('flex'); 
    window.el('active-class-name').innerText = turma.name + (turma.ano ? ` (${turma.ano})` : ''); 
    window.el('active-class-count').innerText = turma.students.length; 
    window.renderStudentList(turma); 
};

window.renderStudentList = function(turma) { 
    const container = window.el('student-list-container'); 
    container.innerHTML = ''; 
    if (turma.students.length === 0) { container.innerHTML = `<div class="text-gray-500 text-sm text-center mt-10">Nenhum aluno.</div>`; return; } 
    turma.students.forEach(s => { 
        const tags = []; 
        if(s.race && s.race !== 'Nao Declarado') tags.push(`<span class="bg-gray-800 text-gray-300 border border-gray-600 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">${s.race}</span>`); 
        if(s.isBolsa) tags.push(`<span class="bg-green-900/50 text-green-400 border border-green-700 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Bolsa Família</span>`); 
        if(s.isAEE) tags.push(`<span class="bg-blue-900/50 text-blue-400 border border-blue-700 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">AEE</span>`); 
        const card = window.ce('div'); 
        card.className = "bg-white/5 border border-white/10 rounded-xl p-3 mb-2 flex justify-between items-center hover:bg-white/10 transition-colors"; 
        card.innerHTML = `<div><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold">${s.name.charAt(0).toUpperCase()}</div><h4 class="text-white font-bold text-sm">${s.name}</h4></div>${tags.length>0 ? '<div class="flex gap-1 mt-2 flex-wrap">'+tags.join('')+'</div>':''}</div><button onclick="window.deleteStudent('${s.id}')" class="text-red-400 p-2 hover:text-white">🗑️</button>`; 
        container.appendChild(card); 
    }); 
};

// ... Funções de Analytics (As que eu enviei nas mensagens anteriores mantêm-se iguaizinhas aqui em baixo. Pode juntá-las, mas como pedimos só as novidades, vamos focar no UI principal).

// --- NAVEGAÇÃO, LOGIN E GERAL ---
window.openProfLogin = function() { window.el('prof-pin-input').value = ''; window.el('login-error').classList.add('hidden'); window.el('modal-prof-login').classList.remove('hidden'); window.el('modal-prof-login').classList.add('flex'); };
window.closeProfLogin = function() { window.el('modal-prof-login').classList.add('hidden'); window.el('modal-prof-login').classList.remove('flex'); };
window.enterProfDashboard = function() { window.qsa('.screen').forEach(s => s.classList.remove('active')); window.el('screen-prof-dashboard').classList.add('active'); };
window.backToProfDashboard = function() { window.qsa('.screen').forEach(s => s.classList.remove('active')); window.el('screen-prof-dashboard').classList.add('active'); };
window.backToProfDashboardFromReports = function() { window.backToProfDashboard(); };
window.backToProfDashboardFromClass = function() { window.backToProfDashboard(); };
window.goBackToHome = function() { window.qsa('.screen').forEach(s => s.classList.remove('active')); window.el('screen-home').classList.add('active'); };
window.openClassManager = function() { window.qsa('.screen').forEach(s => s.classList.remove('active')); window.el('screen-class-manager').classList.add('active'); window.renderClassList(); window.updateClassDetailsView(); };
window.openQuestionBank = function() { window.qsa('.screen').forEach(s => s.classList.remove('active')); window.el('screen-question-bank').classList.add('active'); if(typeof window.renderQuestionBank === 'function') window.renderQuestionBank(); };

window.openReportsInbox = function() { 
    window.qsa('.screen').forEach(s => s.classList.remove('active')); 
    window.el('screen-reports').classList.add('active'); 
    
    // Auto-popula o dropdown de turmas
    const select = window.el('report-filter-class'); 
    if (select) { 
        const currentVal = select.value; 
        select.innerHTML = '<option value="">Todas as Turmas (Visão Geral)</option>'; 
        window.allTurmas.forEach(t => { 
            select.innerHTML += `<option value="${t.id}">${t.name} (${t.ano||''})</option>`; 
        }); 
        
        // Se já tinha uma selecionada, mantém. Senão, e houver turmas, seleciona a primeira automaticamente!
        if (currentVal && window.allTurmas.find(t => t.id === currentVal)) { 
            select.value = currentVal; 
        } else if (window.allTurmas.length > 0) { 
            select.value = window.allTurmas[0].id; 
        } 
    } 
    
    if(typeof window.renderReportsList === 'function') window.renderReportsList(); 
    if(window.el('tab-content-skills') && !window.el('tab-content-skills').classList.contains('hidden') && typeof window.renderSkillsAnalysis === 'function') window.renderSkillsAnalysis(); 
};

window.switchReportTab = function(tab) { 
    ['analytics', 'skills', 'list'].forEach(t => { 
        const btn = window.el('tab-btn-' + t);
        if (btn) { btn.className = t === tab ? "px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-sm uppercase shadow-[0_0_15px_rgba(34,211,238,0.4)] whitespace-nowrap transition-all" : "px-6 py-3 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold text-sm uppercase whitespace-nowrap transition-all"; }
        const content = window.el('tab-content-' + t);
        if (content) { if (t === tab) { content.classList.remove('hidden'); content.classList.add('flex'); } else { content.classList.add('hidden'); content.classList.remove('flex'); } } 
    }); 
};

// Função unificada para Criar e Editar Turmas
window.editingTurmaId = null;
window.openAddClassModal = function(turmaId = null) { 
    const title = window.el('modal-class-title');
    const btnSave = window.el('btn-save-class');
    
    if (turmaId) {
        window.editingTurmaId = turmaId;
        const turma = window.allTurmas.find(t => t.id === turmaId);
        window.el('add-class-name').value = turma.name;
        if(window.el('add-class-ano')) window.el('add-class-ano').value = turma.ano || '1º ano';
        title.innerText = "Editar Turma";
        btnSave.innerText = "Salvar Alterações";
    } else {
        window.editingTurmaId = null;
        window.el('add-class-name').value = '';
        if(window.el('add-class-ano')) window.el('add-class-ano').value = '1º ano';
        title.innerText = "Nova Turma";
        btnSave.innerText = "Criar Turma";
    }
    window.el('add-class-error').classList.add('hidden'); 
    window.el('modal-add-class').classList.remove('hidden'); 
    window.el('modal-add-class').classList.add('flex'); 
};
window.closeAddClassModal = function() { window.el('modal-add-class').classList.add('hidden'); window.el('modal-add-class').classList.remove('flex'); window.editingTurmaId = null; };

window.openAddStudentModal = function() { if(!window.activeTurmaId) return; window.el('add-student-name').value = ''; window.el('add-student-bolsa').checked = false; window.el('add-student-aee').checked = false; window.el('modal-add-student').classList.remove('hidden'); window.el('modal-add-student').classList.add('flex'); };
window.closeAddStudentModal = function() { window.el('modal-add-student').classList.add('hidden'); window.el('modal-add-student').classList.remove('flex'); };

// CENTRAL DE MISSÕES E EMBED
window.openExportGame = function() { 
    window.qsa('.screen').forEach(s => s.classList.remove('active')); 
    window.el('screen-mission-manager').classList.add('active'); 
    window.activeMissionId = null;
    if(typeof window.renderMissionList === 'function') window.renderMissionList(); 
    if(typeof window.updateMissionEditorView === 'function') window.updateMissionEditorView(); 
};
window.closeExportGame = function() { window.backToProfDashboard(); };

window.showEmbedModal = function(link, iframe) { 
    window.el('share-link-input').value = link; 
    window.el('share-iframe-input').value = iframe; 
    window.el('modal-share').classList.remove('hidden'); 
    window.el('modal-share').classList.add('flex'); 
};

// ... Resto das funções de Jogo e Animações (Holgrama, Cartas, etc) mantêm-se iguais e sem quebras de linha gigantes.
window.openHelp = function() { window.closeDraggableHologram(); if(typeof window.audioSystem !== 'undefined') window.audioSystem.play('voice_ajudas'); if(typeof window.pauseTimer === 'function') window.pauseTimer(); window.el('modal-help').classList.remove('hidden'); window.el('modal-help').classList.add('flex'); };
window.closeHelp = function() { window.el('modal-help').classList.add('hidden'); window.el('modal-help').classList.remove('flex'); if(typeof window.resumeTimer === 'function') window.resumeTimer(); };
// ...
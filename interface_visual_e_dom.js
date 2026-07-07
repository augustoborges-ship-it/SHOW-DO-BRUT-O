// ... existing code ...
window.closeImportFilterModal = function() { window.el('modal-import-filter').classList.add('hidden'); window.el('modal-import-filter').classList.remove('flex'); window.pendingImportQuestions = []; };

// --- 🚀 GESTÃO DE MISSÕES (A NOVA FÁBRICA DE JOGOS) ---
window.openMissionManager = function() { 
    window.qsa('.screen').forEach(s => s.classList.remove('active')); 
    window.el('screen-mission-manager').classList.add('active'); 
    window.activeMissionId = null;
    window.renderMissionList(); 
    window.updateMissionEditorView(); 
};

window.renderMissionList = function() { 
    const container = window.el('mission-list-container'); 
    container.innerHTML = ''; 
    if(window.allMissions.length === 0) { 
        container.innerHTML = `<div class="text-center text-gray-500 py-6 text-sm">Nenhuma missão guardada. Crie a primeira!</div>`; 
        return; 
    } 
    window.allMissions.forEach(m => { 
        const isActive = m.id === window.activeMissionId; 
        const qCount = m.questionIds ? m.questionIds.length : 0;
        const card = window.ce('div'); 
        card.className = `border rounded-xl p-3 mb-3 cursor-pointer transition-all ${isActive ? 'bg-amber-600/30 border-amber-400':'bg-black/40 border-white/10 hover:border-white/30'}`; 
        card.onclick = () => { window.openMissionEditor(m.id); }; 
        card.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <h4 class="text-white font-bold font-orbitron truncate pr-2 text-sm">${m.name}</h4>
            </div>
            <div class="flex justify-between items-center mt-2">
                <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${m.mode === 'prova' ? 'Avaliação' : 'Treino'}</span>
                <span class="bg-black/50 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-500/30">${qCount} Qs</span>
            </div>
        `; 
        container.appendChild(card); 
    }); 
};

window.createNewMission = function() {
    const newMission = {
        id: `MISSION_${Date.now()}`,
        name: "Nova Missão",
        mode: "prova",
        dateStart: "",
        dateEnd: "",
        questionIds: []
    };
    window.allMissions.push(newMission);
    window.writeJSONKey(window.STORAGE_KEYS.missions, window.allMissions);
    window.openMissionEditor(newMission.id);
    window.renderMissionList();
};

window.openMissionEditor = function(id) {
    window.activeMissionId = id;
    window.updateMissionEditorView();
};

window.updateMissionEditorView = function() {
    const emptyState = window.el('mission-details-empty'); 
    const contentState = window.el('mission-details-content'); 
    if (!window.activeMissionId) { 
        emptyState.classList.remove('hidden'); contentState.classList.add('hidden'); 
        return; 
    } 
    const mission = window.allMissions.find(m => m.id === window.activeMissionId); 
    if(!mission) return; 

    emptyState.classList.add('hidden'); 
    contentState.classList.remove('hidden'); 
    contentState.classList.add('flex'); 
    
    window.el('mission-edit-name').value = mission.name;
    window.el('mission-edit-mode').value = mission.mode || 'prova';
    window.el('mission-edit-start').value = mission.dateStart || '';
    window.el('mission-edit-end').value = mission.dateEnd || '';
    window.el('mission-q-count').innerText = mission.questionIds ? mission.questionIds.length : 0;
    
    window.renderMissionQuestionsSelector(mission.questionIds || []);
};

window.renderMissionQuestionsSelector = function(selectedIds) {
    const container = window.el('mission-questions-selector');
    container.innerHTML = '';
    const searchTerm = (window.el('mission-q-search').value || '').toLowerCase();

    let pool = window.allQuestions;
    if(searchTerm) {
        pool = pool.filter(q => q.text.toLowerCase().includes(searchTerm) || (q.bncc && q.bncc.toLowerCase().includes(searchTerm)) || q.id.toLowerCase().includes(searchTerm));
    }

    if(pool.length === 0) {
        container.innerHTML = `<div class="text-gray-500 text-center py-4">Nenhuma questão encontrada no banco.</div>`;
        return;
    }

    pool.forEach(q => {
        const isChecked = selectedIds.includes(q.id);
        const colorBorder = isChecked ? 'border-amber-400 bg-blue-900/60' : 'border-white/10 bg-black/40';
        container.innerHTML += `
            <label class="flex items-start gap-3 p-4 mb-3 border ${colorBorder} rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors">
                <input type="checkbox" value="${q.id}" class="mission-q-cb w-5 h-5 mt-1 accent-amber-500 cursor-pointer" ${isChecked ? 'checked' : ''} onchange="window.toggleMissionQuestionStyle(this, '${q.id}')">
                <div class="flex-1">
                    <div class="flex gap-2 mb-2 flex-wrap">
                        <span class="bg-black/50 text-white px-2 py-0.5 rounded border border-gray-600 text-[10px] font-mono">${q.id}</span>
                        <span class="bg-blue-900/50 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 text-[10px] uppercase font-bold tracking-widest">${q.componente}</span>
                        <span class="bg-fuchsia-900/50 text-fuchsia-300 px-2 py-0.5 rounded border border-fuchsia-800 text-[10px] uppercase font-bold tracking-widest">${q.proficiencia}</span>
                    </div>
                    <p class="text-sm text-gray-200 line-clamp-2 leading-relaxed">${q.text}</p>
                </div>
            </label>
        `;
    });
};

window.toggleMissionQuestionStyle = function(checkbox, qId) {
    const mission = window.allMissions.find(m => m.id === window.activeMissionId);
    if(!mission) return;
    if(!mission.questionIds) mission.questionIds = [];

    if(checkbox.checked) {
        if(!mission.questionIds.includes(qId)) mission.questionIds.push(qId);
        checkbox.closest('label').className = "flex items-start gap-3 p-4 mb-3 border border-amber-400 bg-blue-900/60 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors";
    } else {
        mission.questionIds = mission.questionIds.filter(id => id !== qId);
        checkbox.closest('label').className = "flex items-start gap-3 p-4 mb-3 border border-white/10 bg-black/40 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors";
    }
    window.el('mission-q-count').innerText = mission.questionIds.length;
    // Salva automaticamente a seleção em background
    window.writeJSONKey(window.STORAGE_KEYS.missions, window.allMissions);
    window.renderMissionList();
};

window.selectAllMissionQuestions = function() {
    const mission = window.allMissions.find(m => m.id === window.activeMissionId);
    if(!mission) return;
    const checkboxes = document.querySelectorAll('.mission-q-cb');
    let isSelecting = Array.from(checkboxes).some(cb => !cb.checked); // Se tiver um desmarcado, marca todos. Senão desmarca.
    
    checkboxes.forEach(cb => {
        cb.checked = isSelecting;
        window.toggleMissionQuestionStyle(cb, cb.value);
    });
};

window.filterMissionQuestions = function() {
    const mission = window.allMissions.find(m => m.id === window.activeMissionId);
    if(mission) window.renderMissionQuestionsSelector(mission.questionIds || []);
};
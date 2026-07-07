// ... existing code ...
window.processMassImportData = window.importMassCodes;
window.wipeAllDataLGPD = function() { if(confirm("Deseja apagar PERMANENTEMENTE todos os dados curados (turmas, alunos, VAAR e relatórios) para fins de conformidade com a LGPD? A ação é local e definitiva.")) { removeStorageKey(STORAGE_KEYS.classes); removeStorageKey(STORAGE_KEYS.reports); removeStorageKey(STORAGE_KEYS.telemetry); removeStorageKey(STORAGE_KEYS.missions); showSystemMessage("Esquecimento Concluído", "Informações privadas foram expurgadas.", "success"); goBackToHome(); } };

// --- SALVAR E GERAR MISSÕES (MOTOR NOVO) ---
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
    window.renderMissionList();
};

window.deleteCurrentMission = function() {
    if(!window.activeMissionId || !confirm("Tem a certeza que deseja excluir esta missão permanentemente?")) return;
    window.allMissions = window.allMissions.filter(m => m.id !== window.activeMissionId);
    window.writeJSONKey(window.STORAGE_KEYS.missions, window.allMissions);
    window.activeMissionId = null;
    window.updateMissionEditorView();
    window.renderMissionList();
};

window.generateMutantGameFromMission = async function() {
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
    
    window.showEmbedModal(url, iframe); 
};
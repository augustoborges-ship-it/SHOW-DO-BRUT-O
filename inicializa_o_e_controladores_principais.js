// --- INICIALIZAÇÃO DE DADOS ---
function initTurmasData() { allTurmas = readJSONKey(STORAGE_KEYS.classes, []); }
function initGameData() {
    try { 
        initTurmasData(); 
        const bnccQuestions = bancoEmbutidoJSONL.trim().split('\n').filter(l => l.trim() && l.trim().startsWith('{')).map(l => { const q = JSON.parse(l.trim()); const optMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }; return { id: q.id || "BNCC", text: q.enunciado, category: `${q.componente} • ${q.ano} • Proficiência: ${q.nivel_proficiencia||'Básico'}`, componente: (q.componente||'').toLowerCase(), ano: (q.ano||'').toLowerCase(), proficiencia: (q.nivel_proficiencia||'Básico').toLowerCase(), options: [q.alternativas.A, q.alternativas.B, q.alternativas.C, q.alternativas.D], answer: optMap[q.resposta_correta], explicacao: q.explicacao||"", image_url: q.image_url||null, bncc: q.bncc||"N/A", isCustom: false }; }); 
        const cust = readJSONKey(STORAGE_KEYS.customQuestions, []); 
        allQuestions = [...bnccQuestions, ...cust]; 
    } catch (e) { console.error(e); }
}

// --- INTEGRAÇÕES E IMPORTAÇÕES MULTIPLAYER ---
function checkMagicLinkSync() { const urlParams = new URLSearchParams(window.location.search); const syncData = urlParams.get('sync'); if (syncData) { try { const decoded = JSON.parse(atob(syncData)); processImportedBoletim(decoded); } catch(e) { console.error("Link quebrado."); } } }
function processImportedBoletim(data) { if(data.type !== 'student_training') return; const token = `${data.student}_${data.timestamp}`.toLowerCase().replace(/[^a-z0-9]/g, ''); let reports = readJSONKey(STORAGE_KEYS.reports, []); if(reports.some(r => r.tokenSignature === token)) { showSystemMessage("Spam Evitado", `Este relatório já foi importado! Duplicidade travada.`, "error"); window.history.replaceState({}, document.title, window.location.pathname); return; } window.pendingSyncData = data; window.pendingSyncData.tokenSignature = token; el('sync-student-name').innerText = data.student; el('sync-level').innerText = data.level; const select = el('sync-class-select'); select.innerHTML = '<option value="">Apenas Histórico Geral (Sem Vínculo)</option>'; allTurmas.forEach(t => { select.innerHTML += `<option value="${t.id}">${t.name}</option>`; }); el('modal-sync').classList.remove('hidden'); el('modal-sync').classList.add('flex'); audioSystem.play('certa'); }
function acceptSync() { if(!window.pendingSyncData) return; let reports = readJSONKey(STORAGE_KEYS.reports, []); window.pendingSyncData.receivedAt = new Date().toISOString(); window.pendingSyncData.isNew = true; window.pendingSyncData.linkedClassId = el('sync-class-select').value || null; reports.push(window.pendingSyncData); writeJSONKey(STORAGE_KEYS.reports, reports); el('modal-sync').classList.add('hidden'); window.history.replaceState({}, document.title, window.location.pathname); showSystemMessage("Importado", "Boletim guardado com sucesso no Diário.", "success"); if(typeof window.checkReportsInbox === 'function') window.checkReportsInbox(); }
function rejectSync() { el('modal-sync').classList.add('hidden'); window.history.replaceState({}, document.title, window.location.pathname); }
function importMassCodes() { const rawInput = el('mass-import-textarea') ? el('mass-import-textarea').value : prompt("Cole o código:"); if(!rawInput) return; const codes = rawInput.split(/[\n,]+/); let added = 0; let skipped = 0; let reports = readJSONKey(STORAGE_KEYS.reports, []); codes.forEach(code => { const cleanCode = code.trim(); if(!cleanCode) return; try { const dec = JSON.parse(atob(cleanCode)); const token = `${dec.student}_${dec.timestamp}`.toLowerCase().replace(/[^a-z0-9]/g, ''); if(!reports.some(r => r.tokenSignature === token) && dec.type === 'student_training') { dec.receivedAt = new Date().toISOString(); dec.isNew = true; dec.tokenSignature = token; dec.linkedClassId = null; reports.push(dec); added++; } else skipped++; } catch(e) { skipped++; } }); if (el('modal-mass-import')) { el('modal-mass-import').classList.add('hidden'); el('modal-mass-import').classList.remove('flex'); } if(added > 0) { writeJSONKey(STORAGE_KEYS.reports, reports); showSystemMessage("Sucesso", `${added} boletim(ns) importado(s)!`, "success"); if(el('screen-reports') && el('screen-reports').classList.contains('active')) { renderReportsList(); if(!el('tab-content-skills').classList.contains('hidden')) renderSkillsAnalysis(); } if(typeof window.checkReportsInbox === 'function') window.checkReportsInbox(); } else showSystemMessage("Nenhum Dado", "Códigos já existiam ou são inválidos.", "info"); }
window.processMassImportData = importMassCodes;
function wipeAllDataLGPD() { if(confirm("Deseja apagar PERMANENTEMENTE todos os dados curados (turmas, alunos, VAAR e relatórios) para fins de conformidade com a LGPD? A ação é local e definitiva.")) { removeStorageKey(STORAGE_KEYS.classes); removeStorageKey(STORAGE_KEYS.reports); removeStorageKey(STORAGE_KEYS.telemetry); showSystemMessage("Esquecimento Concluído", "Informações privadas foram expurgadas.", "success"); goBackToHome(); } }

// --- NOVA CENTRAL DE MISSÕES (Substitui a Fábrica de HTML) ---
window.generateMutantGame = async function() {
    const missao = el('export-mission-name').value.trim() || "Atividade de Treino";
    const mode = el('export-mode').value;
    const src = el('export-source').value;
    let pool = src === 'all' ? allQuestions : allQuestions.filter(q => q.isCustom);
    if (pool.length === 0) return showSystemMessage("Erro", "Sem questões suficientes para gerar o Jogo.", "error");
    
    let exportQ = pool;
    if (mode === 'prova') exportQ = [...pool].sort(() => Math.random() - 0.5).slice(0, 16);
    
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ missionId: missao, mode: mode, questions: exportQ }))));
    
    // Gera o Link Mágico Direto (URL Base + #mutant=Hash)
    const url = window.location.href.split('#')[0].split('?')[0] + '#mutant=' + payload;
    
    // Gera o iFrame para inserção em sites (Google Sites, Blogs, etc)
    const iframe = `<iframe src="${url}" width="100%" height="750" style="border:none; border-radius:15px; overflow:hidden;" allowfullscreen></iframe>`;
    
    if(typeof window.closeExportGame === 'function') window.closeExportGame(); 
    if(typeof window.showEmbedModal === 'function') window.showEmbedModal(url, iframe); 
};

// --- INJEÇÃO DA MUTAÇÃO (Apanha o Link Mágico ao Abrir) ---
const originalInit = window.initGameData;
window.initGameData = function() {
    const mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null;
    const mutantData = window.__MUTANT || mHash;
    if (mutantData) {
        try { 
            const p = JSON.parse(decodeURIComponent(escape(atob(mutantData)))); 
            window.CURRENT_MISSION_ID = p.missionId; 
            window.MUTANT_MODE = p.mode; 
            allQuestions = p.questions; 
            if(mHash) { const s = ce('style'); s.innerHTML = 'div[onclick="openProfLogin()"]{display:none!important;}'; document.head.appendChild(s); }
            return; 
        } catch(e){}
    }
    if(originalInit) originalInit();
};

const originalStart = window.startStudentGame;
window.startStudentGame = function() {
    const mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null;
    const mutantData = window.__MUTANT || mHash;
    if (mutantData) {
        clearProgress(); isStudentMode = true; el('student-error-area').innerHTML = '';
        const n = el('student-name').value.trim() || "Herói Anônimo";
        teams = [{ name: n, level: 0, status: 'playing', helps: { eliminar:false, palpite:false, dica:false, pular:0 }, turmaId: null, students: [], responseTimes: [] }]; gameMode = 'single'; currentTeamIndex = 0;
        window.currentStudentTelemetryKey = n.toLowerCase() + "_" + new Date().toISOString().split('T')[0];
        let t = readJSONKey(STORAGE_KEYS.telemetry, {}); t[window.currentStudentTelemetryKey] = t[window.currentStudentTelemetryKey] || { attempts: 0, sent: false }; t[window.currentStudentTelemetryKey].attempts++; writeJSONKey(STORAGE_KEYS.telemetry, t);
        
        let fq = allQuestions; if(window.MUTANT_MODE === 'treino') fq = fq.sort(() => Math.random() - 0.5);
        activeQuestions = []; while(activeQuestions.length < 16) { for(let q of fq) if(activeQuestions.length < 16) activeQuestions.push(q); } 
        activeQuestions = activeQuestions.map(q => JSON.parse(JSON.stringify(q)));
        activeQuestions.forEach(q => { const opts = q.options.map((txt, i) => ({ txt: txt, isC: i === q.answer })); opts.sort(() => Math.random() - 0.5); q.options = opts.map(o => o.txt); q.answer = opts.findIndex(o => o.isC); });
        globalQuestionIndex = 0; el('screen-setup-student').classList.remove('active'); fireUpGame();
    } else if(originalStart) { originalStart(); }
};

const originalOpenSetup = window.openStudentSetup;
window.openStudentSetup = function() {
    if(originalOpenSetup) originalOpenSetup();
    const mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null;
    if(window.__MUTANT || mHash) {
        const f = el('student-filters-wrapper'); if(f) f.style.display = 'none';
        const d = el('student-diff-wrapper'); if(d) d.style.display = 'none';
        const title = qs('#screen-setup-student h2'); if(title) title.innerText = window.CURRENT_MISSION_ID || "Avaliação";
    }
};

// --- EVENTOS DO APLICATIVO ---
window.addEventListener('DOMContentLoaded', () => { 
    initGameData(); 
    const holoEl = el("draggable-hologram"); const holoHeader = el("drag-header"); 
    if(holoEl && holoHeader) makeDraggable(holoEl, holoHeader);
    if(readJSONKey(STORAGE_KEYS.state, null) && el('btn-resume-home')) el('btn-resume-home').classList.remove('hidden'); 
    if(window.location.search.includes('sync')) checkMagicLinkSync(); 
    setTimeout(skipIntro, 8500); 
});

window.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.code === 'Enter') skipIntro(); });
window.addEventListener('beforeunload', function(e) { const sq = localStorage.getItem(STORAGE_KEYS.customQuestions); if(sq && sq !== '[]') { e.preventDefault(); e.returnValue = ''; } });
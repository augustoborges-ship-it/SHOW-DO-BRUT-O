// --- INICIALIZAÇÃO DE DADOS ---
window.initTurmasData = function() { window.allTurmas = window.readJSONKey(window.STORAGE_KEYS.classes, []); };

window.initGameData = function() {
    const mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null;
    const mutantData = window.__MUTANT || mHash;
    if (mutantData) {
        try { 
            const p = JSON.parse(decodeURIComponent(escape(atob(mutantData)))); 
            window.CURRENT_MISSION_ID = p.missionId; 
            window.MUTANT_MODE = p.mode; 
            window.allQuestions = p.questions; 
            if(mHash) { 
                const s = window.ce('style'); 
                s.innerHTML = 'div[onclick="window.openProfLogin()"]{display:none!important;}'; 
                document.head.appendChild(s); 
            }
            return; 
        } catch(e){}
    }
    
    try { 
        window.initTurmasData(); 
        const bnccQuestions = window.bancoEmbutidoJSONL.trim().split('\n').filter(l => l.trim() && l.trim().startsWith('{')).map(l => { 
            const q = JSON.parse(l.trim()); 
            const optMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }; 
            return { 
                id: q.id || "BNCC", 
                text: q.enunciado, 
                category: `${q.componente} • ${q.ano} • Proficiência: ${q.nivel_proficiencia||'Básico'}`, 
                componente: (q.componente||'').toLowerCase(), 
                ano: (q.ano||'').toLowerCase(), 
                proficiencia: (q.nivel_proficiencia||'Básico').toLowerCase(), 
                options: [q.alternativas.A, q.alternativas.B, q.alternativas.C, q.alternativas.D], 
                answer: optMap[q.resposta_correta], 
                explicacao: q.explicacao||"", 
                image_url: q.image_url||null, 
                bncc: q.bncc||"N/A", 
                isCustom: false 
            }; 
        }); 
        const cust = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); 
        window.allQuestions = [...bnccQuestions, ...cust]; 
    } catch (e) {}
};

// --- INTEGRAÇÕES E IMPORTAÇÕES ---
window.checkMagicLinkSync = function() { 
    const urlParams = new URLSearchParams(window.location.search); 
    const syncData = urlParams.get('sync'); 
    if (syncData) { 
        try { const decoded = JSON.parse(atob(syncData)); window.processImportedBoletim(decoded); } catch(e) {} 
    } 
};

window.processImportedBoletim = function(data) { 
    if(data.type !== 'student_training') return; 
    const token = String(data.student + '_' + data.timestamp).toLowerCase().replace(new RegExp("[^a-z0-9]", "g"), ''); 
    let reports = window.readJSONKey(window.STORAGE_KEYS.reports, []); 
    if(reports.some(r => r.tokenSignature === token)) { 
        window.showSystemMessage("Spam Evitado", `Este relatório já foi importado!`, "error"); 
        window.history.replaceState({}, document.title, window.location.pathname); 
        return; 
    } 
    window.pendingSyncData = data; 
    window.pendingSyncData.tokenSignature = token; 
    window.el('sync-student-name').innerText = data.student; 
    window.el('sync-level').innerText = data.level; 
    const select = window.el('sync-class-select'); 
    select.innerHTML = '<option value="">Apenas Histórico Geral (Sem Vínculo)</option>'; 
    window.allTurmas.forEach(t => { select.innerHTML += `<option value="${t.id}">${t.name}</option>`; }); 
    window.el('modal-sync').classList.remove('hidden'); window.el('modal-sync').classList.add('flex'); 
    window.audioSystem.play('certa'); 
};

window.acceptSync = function() { 
    if(!window.pendingSyncData) return; 
    let reports = window.readJSONKey(window.STORAGE_KEYS.reports, []); 
    window.pendingSyncData.receivedAt = new Date().toISOString(); 
    window.pendingSyncData.isNew = true; 
    window.pendingSyncData.linkedClassId = window.el('sync-class-select').value || null; 
    reports.push(window.pendingSyncData); 
    window.writeJSONKey(window.STORAGE_KEYS.reports, reports); 
    window.el('modal-sync').classList.add('hidden'); 
    window.history.replaceState({}, document.title, window.location.pathname); 
    window.showSystemMessage("Importado", "Boletim guardado com sucesso no Diário.", "success"); 
    if(typeof window.checkReportsInbox === 'function') window.checkReportsInbox(); 
};

window.rejectSync = function() { 
    window.el('modal-sync').classList.add('hidden'); 
    window.history.replaceState({}, document.title, window.location.pathname); 
};

window.importMassCodes = function() { 
    const rawInput = window.el('mass-import-textarea') ? window.el('mass-import-textarea').value : prompt("Cole o código:"); 
    if(!rawInput) return; 
    const codes = rawInput.split(new RegExp("[\\n,]+")); 
    let added = 0; let skipped = 0; 
    let reports = window.readJSONKey(window.STORAGE_KEYS.reports, []); 
    codes.forEach(code => { 
        const cleanCode = code.trim(); 
        if(!cleanCode) return; 
        try { 
            const dec = JSON.parse(atob(cleanCode)); 
            const token = String(dec.student + '_' + dec.timestamp).toLowerCase().replace(new RegExp("[^a-z0-9]", "g"), ''); 
            if(!reports.some(r => r.tokenSignature === token) && dec.type === 'student_training') { 
                dec.receivedAt = new Date().toISOString(); 
                dec.isNew = true; dec.tokenSignature = token; 
                dec.linkedClassId = null; reports.push(dec); added++; 
            } else skipped++; 
        } catch(e) { skipped++; } 
    }); 
    if (window.el('modal-mass-import')) { window.el('modal-mass-import').classList.add('hidden'); window.el('modal-mass-import').classList.remove('flex'); } 
    if(added > 0) { 
        window.writeJSONKey(window.STORAGE_KEYS.reports, reports); 
        window.showSystemMessage("Sucesso", `${added} boletim(ns) importado(s)!`, "success"); 
        if(window.el('screen-reports') && window.el('screen-reports').classList.contains('active')) { window.renderReportsList(); if(!window.el('tab-content-skills').classList.contains('hidden')) window.renderSkillsAnalysis(); } 
        if(typeof window.checkReportsInbox === 'function') window.checkReportsInbox(); 
    } else window.showSystemMessage("Nenhum Dado", "Códigos já existiam ou são inválidos.", "info"); 
};

window.processMassImportData = window.importMassCodes;

window.wipeAllDataLGPD = function() { 
    if(confirm("Deseja apagar PERMANENTEMENTE todos os dados curados (turmas, alunos, VAAR e relatórios) para fins de conformidade com a LGPD? A ação é local e definitiva.")) { 
        window.removeStorageKey(window.STORAGE_KEYS.classes); 
        window.removeStorageKey(window.STORAGE_KEYS.reports); 
        window.removeStorageKey(window.STORAGE_KEYS.telemetry); 
        window.showSystemMessage("Esquecimento Concluído", "Informações privadas foram expurgadas.", "success"); 
        window.goBackToHome(); 
    } 
};

window.downloadBoletimOffline = function(hash, studentName) { 
    const blob = new Blob([hash], { type: "text/plain" }); 
    const url = URL.createObjectURL(blob); 
    const a = window.ce('a'); a.href = url; 
    const dateStr = new Date().toISOString().split('T')[0]; 
    a.download = `Boletim_${studentName.replace(new RegExp("[^a-zA-Z0-9]", "g"), '_')}_${dateStr}.brutao`; 
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); 
    window.showSystemMessage("Sucesso", "Boletim salvo! Entregue este arquivo (.brutao) ao seu professor.", "success"); 
};

// --- ARRANQUE DO JOGO E EVENTOS PRINCIPAIS ---
window.openStudentSetup = function() { 
    window.closeDraggableHologram(); 
    if(typeof window.audioSystem !== 'undefined') window.audioSystem.play('suspense'); 
    window.qsa('.screen').forEach(s => s.classList.remove('active')); 
    window.el('screen-setup-student').classList.add('active'); 
    const mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null; 
    if(window.__MUTANT || mHash) { 
        const f = window.el('student-filters-wrapper'); if(f) f.style.display = 'none'; 
        const d = window.el('student-diff-wrapper'); if(d) d.style.display = 'none'; 
        const title = window.qs('#screen-setup-student h2'); if(title) title.innerText = window.CURRENT_MISSION_ID || "Avaliação"; 
    } 
};

window.openSetup = function() { 
    window.closeDraggableHologram(); 
    if(typeof window.initTurmasData === 'function') window.initTurmasData(); 
    const selectTurma = window.el('setup-select-turma'); 
    selectTurma.innerHTML = '<option value="">Selecione uma Turma para Sorteio...</option>'; 
    if(window.allTurmas.length === 0) { 
        selectTurma.innerHTML = '<option value="">Nenhuma turma cadastrada. Use o Gestor.</option>'; 
        selectTurma.disabled = true; window.setTeamMode('manual'); 
    } else { 
        selectTurma.disabled = false; 
        window.allTurmas.forEach(t => { selectTurma.innerHTML += `<option value="${t.id}">${t.name} (${t.students.length} alunos)</option>`; }); 
        window.setTeamMode('auto'); 
    } 
    if(typeof window.audioSystem !== 'undefined') window.audioSystem.play('voice_setup'); 
    window.qsa('.screen').forEach(s => s.classList.remove('active')); 
    window.el('screen-setup').classList.add('active'); 
};

window.startStudentGame = function() {
    // 1. Limpa Cofre do Diário para nova jogada
    window.writeJSONKey(window.STORAGE_KEYS.outbox, null); 
    if(window.el('btn-resume-home')) window.el('btn-resume-home').classList.add('hidden');
    if(window.el('btn-recover-report')) window.el('btn-recover-report').classList.add('hidden');

    const mHash = window.location.hash.startsWith('#mutant=') ? window.location.hash.substring(8) : null;
    const mutantData = window.__MUTANT || mHash;
    
    if (mutantData) {
        window.clearProgress(); window.isStudentMode = true; window.el('student-error-area').innerHTML = '';
        const n = window.el('student-name').value.trim() || "Herói Anônimo";
        window.teams = [{ name: n, level: 0, status: 'playing', helps: { eliminar:false, palpite:false, dica:false, pular:0 }, turmaId: null, students: [], responseTimes: [] }]; 
        window.gameMode = 'single'; window.currentTeamIndex = 0;
        window.currentStudentTelemetryKey = n.toLowerCase() + "_" + new Date().toISOString().split('T')[0];
        
        let t = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); 
        t[window.currentStudentTelemetryKey] = t[window.currentStudentTelemetryKey] || { attempts: 0, sent: false }; 
        t[window.currentStudentTelemetryKey].attempts++; 
        window.writeJSONKey(window.STORAGE_KEYS.telemetry, t);
        
        let fq = window.allQuestions; 
        if(window.MUTANT_MODE === 'treino') fq = fq.sort(() => Math.random() - 0.5);
        window.activeQuestions = []; 
        while(window.activeQuestions.length < 16) { 
            for(let q of fq) if(window.activeQuestions.length < 16) window.activeQuestions.push(q); 
        } 
        
        window.activeQuestions = window.activeQuestions.map(q => JSON.parse(JSON.stringify(q)));
        window.activeQuestions.forEach(q => { 
            const opts = q.options.map((txt, i) => ({ txt: txt, isC: i === q.answer })); 
            opts.sort(() => Math.random() - 0.5); 
            q.options = opts.map(o => o.txt); 
            q.answer = opts.findIndex(o => o.isC); 
        });
        
        window.globalQuestionIndex = 0; 
        window.el('screen-setup-student').classList.remove('active'); 
        window.fireUpGame();
    } else {
        window.clearProgress(); window.isStudentMode = true; window.el('student-error-area').innerHTML = '';
        const pName = window.el('student-name').value.trim() || "Herói Anônimo"; 
        const year = window.el('student-year').value.toLowerCase(); 
        const subject = window.el('student-subject').value.toLowerCase(); 
        const diff = window.qs('input[name="student-diff"]:checked').value.toLowerCase();
        
        window.teams = [{ name: pName, level: 0, status: 'playing', helps: { eliminar: false, palpite: false, dica: false, pular: 0 }, turmaId: null, students: [], responseTimes: [] }]; 
        window.gameMode = 'single'; window.currentTeamIndex = 0;
        
        let filteredQuestions = window.allQuestions.filter(q => { 
            let matchesYear = q.ano.includes(year) || q.category.toLowerCase().includes(year); 
            let matchesSubj = q.componente.includes(subject); 
            let matchesDiff = false; 
            if (diff === 'fácil') matchesDiff = q.proficiencia.includes('básico') || q.proficiencia.includes('fácil') || q.proficiencia.includes('baixo'); 
            else if (diff === 'médio') matchesDiff = q.proficiencia.includes('adequado') || q.proficiencia.includes('médio'); 
            else if (diff === 'difícil') matchesDiff = q.proficiencia.includes('avançado') || q.proficiencia.includes('difícil') || q.proficiencia.includes('alto'); 
            return matchesYear && matchesSubj && matchesDiff; 
        });
        
        if(filteredQuestions.length === 0) { 
            filteredQuestions = window.allQuestions.filter(q => (q.ano.includes(year) || q.category.toLowerCase().includes(year)) && q.componente.includes(subject)); 
            if(filteredQuestions.length > 0) window.showSystemMessage("Aviso", "Questões aproximadas carregadas.", "info"); 
        }
        
        if (filteredQuestions.length === 0) { 
            window.el('student-error-area').innerHTML = `<div class="bg-red-900/80 border-2 border-red-500 text-white font-bold p-3 rounded-xl text-center mb-4">Nenhuma questão para este filtro.</div>`; 
            return; 
        }
        
        const todayStr = new Date().toISOString().split('T')[0]; 
        window.currentStudentTelemetryKey = `${pName.toLowerCase()}_${todayStr}`;
        let telemetry = window.readJSONKey(window.STORAGE_KEYS.telemetry, {}); 
        if (!telemetry[window.currentStudentTelemetryKey]) { telemetry[window.currentStudentTelemetryKey] = { attempts: 0, sent: false }; } 
        telemetry[window.currentStudentTelemetryKey].attempts++; 
        window.writeJSONKey(window.STORAGE_KEYS.telemetry, telemetry);
        
        filteredQuestions = filteredQuestions.sort(() => Math.random() - 0.5); 
        window.activeQuestions = []; 
        let totalNeeded = 16; 
        while(window.activeQuestions.length < totalNeeded) { 
            for(let q of filteredQuestions) if(window.activeQuestions.length < totalNeeded) window.activeQuestions.push(q); 
        } 
        window.globalQuestionIndex = 0; 
        window.el('screen-setup-student').classList.remove('active'); 
        window.fireUpGame();
    }
};

window.addEventListener('DOMContentLoaded', () => { 
    window.initGameData(); 
    const holoEl = window.el("draggable-hologram"); const holoHeader = window.el("drag-header"); 
    if(holoEl && holoHeader) window.makeDraggable(holoEl, holoHeader);
    
    // VERIFICAÇÃO BLINDADA DO BACKUP DE JOGO
    const st = window.readJSONKey(window.STORAGE_KEYS.state, null);
    if(st && window.el('btn-resume-home')) {
        if(!window.CURRENT_MISSION_ID || st.missionId === window.CURRENT_MISSION_ID) {
            window.el('btn-resume-home').classList.remove('hidden'); 
        }
    }
    
    // VERIFICAÇÃO BLINDADA DO COFRE DE BOLETINS
    const ob = window.readJSONKey(window.STORAGE_KEYS.outbox, null);
    if(ob && window.el('btn-recover-report')) {
        if(!window.CURRENT_MISSION_ID || ob.missionId === window.CURRENT_MISSION_ID) {
            window.el('btn-recover-report').classList.remove('hidden');
        }
    }

    if(window.location.search.includes('sync')) window.checkMagicLinkSync(); 
    setTimeout(window.skipIntro, 8500); 
});

window.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.code === 'Enter') window.skipIntro(); });
window.addEventListener('beforeunload', function(e) { const sq = localStorage.getItem(window.STORAGE_KEYS.customQuestions); if(sq && sq !== '[]') { e.preventDefault(); e.returnValue = ''; } });
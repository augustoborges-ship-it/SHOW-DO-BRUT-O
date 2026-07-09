// --- 3. BANCO DE QUESTÕES GLOBAL (MÓDULO EXTERNO) ---

/* 
 * ATENÇÃO MESTRE: 
 * O banco de questões não fica mais chumbado aqui! 
 * O jogo agora procura por uma variável mágica chamada 'window.BANCO_BRUTAO_GLOBAL'
 * que será carregada de um arquivo externo (ex: banco_questoes_global.js).
 * Isso garante carregamento instantâneo, funciona offline e permite atualizações sem tocar no código do jogo!
 */

window.pendingImportQuestions = [];

window.renderQuestionBank = function() { 
    const container = window.el('qb-list-container'); 
    if(!container) return;

    // Garante que o banco global seja convertido antes de renderizar a lista.
    if ((!window.allQuestions || window.allQuestions.length === 0) && typeof window.initGameData === 'function') {
        window.initGameData();
    }

    const listaQuestoes = Array.isArray(window.allQuestions) ? window.allQuestions : [];
    container.innerHTML = ''; 
    if(listaQuestoes.length === 0) { 
        container.innerHTML = `<div class="text-center text-gray-500 py-10 font-bold">O banco global e pessoal estão vazios. Verifique se motor_do_banco_de_questoes.js criou window.BANCO_BRUTAO_GLOBAL.</div>`; 
        return; 
    } 
    listaQuestoes.forEach((q) => { 
        const isCust = q.isCustom; 
        const card = window.ce('div'); 
        card.className = "bg-white/5 border border-white/10 rounded-xl p-4 mb-4 hover:bg-white/10 transition-colors shadow-lg"; 
        const badgeColor = isCust ? 'bg-fuchsia-900 text-fuchsia-300 border-fuchsia-500' : 'bg-blue-900 text-blue-300 border-blue-500'; 
        const badgeText = isCust ? 'Editável (Seu Banco)' : 'Nativa (Banco Global)'; 
        const btnHtml = isCust ? `<div class="flex gap-2"><button onclick="window.editCustomQuestion('${q.id}')" class="text-yellow-400 text-xs font-bold bg-yellow-900/30 px-3 py-1 rounded border border-yellow-500/30 hover:bg-yellow-500 hover:text-black transition-colors">Editar</button><button onclick="window.deleteCustomQuestion('${q.id}')" class="text-red-400 text-xs font-bold bg-red-900/30 px-3 py-1 rounded border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors">Excluir</button></div>` : ''; 
        card.innerHTML = `<div class="flex justify-between items-start mb-2"><div class="flex gap-3 items-center flex-wrap"><span class="text-white font-bold font-mono text-sm bg-black/50 px-2 py-1 rounded border border-gray-700">${q.id}</span><span class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${badgeColor}">${badgeText}</span><span class="text-gray-400 text-xs">${q.category}</span></div>${btnHtml}</div><p class="text-gray-200 text-sm mb-3 font-medium">${q.text}</p>`; 
        container.appendChild(card); 
    }); 
};

window.openAddQuestionModal = function() { 
    window.editingQuestionId = null; window.el('add-q-id').disabled = false; window.el('add-q-id').value = `Q_PRO_${Date.now().toString().slice(-4)}`; 
    window.el('add-q-enunciado').value = ""; window.el('add-q-image').value = ""; window.el('add-q-optA').value = ""; window.el('add-q-optB').value = ""; window.el('add-q-optC').value = ""; window.el('add-q-optD').value = ""; 
    window.el('modal-add-question').classList.remove('hidden'); window.el('modal-add-question').classList.add('flex'); 
};

window.closeAddQuestionModal = function() { window.el('modal-add-question').classList.add('hidden'); window.el('modal-add-question').classList.remove('flex'); };

window.saveCustomQuestion = function() { 
    const id = window.el('add-q-id').value.trim(); const comp = window.el('add-q-comp').value; const ano = window.el('add-q-ano').value; const prof = window.el('add-q-prof').value; 
    const enunciado = window.el('add-q-enunciado').value.trim(); let imageUrl = window.el('add-q-image').value.trim(); imageUrl = window.normalizeImageUrl(imageUrl); 
    const optA = window.el('add-q-optA').value.trim(); const optB = window.el('add-q-optB').value.trim(); const optC = window.el('add-q-optC').value.trim(); const optD = window.el('add-q-optD').value.trim(); 
    if(!enunciado || !optA || !optB || !optC || !optD) { window.el('add-q-error').classList.remove('hidden'); return; } 
    const ansMap = {'A': 0, 'B': 1, 'C': 2, 'D': 3}; const ansLetter = window.qs('input[name="add-q-answer"]:checked').value; 
    const newQ = { id: window.editingQuestionId || id || `CUST_${Date.now()}`, text: enunciado, category: `${comp} • ${ano} • Proficiência: ${prof}`, componente: comp.toLowerCase(), ano: ano.toLowerCase(), proficiencia: prof.toLowerCase(), options: [optA, optB, optC, optD], answer: ansMap[ansLetter], explicacao: window.el('add-q-expl').value || "Salvo pelo professor.", bncc: window.el('add-q-bncc').value || "N/A", image_url: imageUrl || null, isCustom: true }; 
    let cq = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); 
    if(window.editingQuestionId) { const idx = cq.findIndex(x=>x.id === window.editingQuestionId); if(idx !== -1) cq[idx] = newQ; } else { cq.push(newQ); } 
    window.writeJSONKey(window.STORAGE_KEYS.customQuestions, cq); window.closeAddQuestionModal(); 
    if(typeof window.initGameData === 'function') window.initGameData(); window.renderQuestionBank(); 
    window.showSystemMessage("Sucesso", "Questão salva no seu banco pessoal.", "success"); 
};

window.deleteCustomQuestion = function(id) { window.questionToDeleteId = id; window.el('modal-delete-q').classList.remove('hidden'); window.el('modal-delete-q').classList.add('flex'); window.el('btn-confirm-del-q').onclick = window.executeDeleteCustomQuestion; };
window.closeDeleteQModal = function() { window.el('modal-delete-q').classList.add('hidden'); window.el('modal-delete-q').classList.remove('flex'); window.questionToDeleteId = null; };

window.executeDeleteCustomQuestion = function() { 
    if(!window.questionToDeleteId) return; 
    let cq = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); 
    cq = cq.filter(q => q.id !== window.questionToDeleteId); 
    window.writeJSONKey(window.STORAGE_KEYS.customQuestions, cq); 
    if(typeof window.initGameData === 'function') window.initGameData(); 
    window.renderQuestionBank(); window.closeDeleteQModal(); 
};

window.exportCustomQuestions = function() { 
    const savedCustom = localStorage.getItem(window.STORAGE_KEYS.customQuestions); 
    if (!savedCustom || savedCustom === '[]') { window.showSystemMessage("Aviso", "O seu banco de questões customizadas está vazio.", "info"); return; } 
    const blob = new Blob([savedCustom], { type: "application/json" }); const url = URL.createObjectURL(blob); 
    const a = window.ce('a'); a.href = url; a.download = `Brutao_Questoes_Colaborativas_${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); 
};

window.editCustomQuestion = function(id) { 
    let customQuestions = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); const qToEdit = customQuestions.find(q => q.id === id); if (!qToEdit) return; 
    window.editingQuestionId = qToEdit.id; window.el('add-q-id').value = qToEdit.id; window.el('add-q-id').disabled = true; 
    const setSelect = (selId, val) => { const elObj = window.el(selId); for(let i=0; i<elObj.options.length; i++) { if(elObj.options[i].value.toLowerCase() === val.toLowerCase()) { elObj.selectedIndex = i; break; } } }; 
    setSelect('add-q-comp', qToEdit.componente); setSelect('add-q-ano', qToEdit.ano); setSelect('add-q-prof', qToEdit.proficiencia); 
    window.el('add-q-enunciado').value = qToEdit.text; window.el('add-q-image').value = qToEdit.image_url || ""; 
    window.el('add-q-optA').value = qToEdit.options[0]; window.el('add-q-optB').value = qToEdit.options[1]; window.el('add-q-optC').value = qToEdit.options[2]; window.el('add-q-optD').value = qToEdit.options[3]; 
    window.el('add-q-bncc').value = qToEdit.bncc || ""; window.el('add-q-expl').value = qToEdit.explicacao !== "Salvo pelo professor." ? qToEdit.explicacao : ""; 
    const ansMapRev = {0: 'a', 1: 'b', 2: 'c', 3: 'd'}; window.el(`ans-${ansMapRev[qToEdit.answer]}`).checked = true; 
    window.el('modal-add-question').classList.remove('hidden'); window.el('modal-add-question').classList.add('flex'); 
};

window.openCommunityBank = function() { window.el('modal-community-bank').classList.remove('hidden'); window.el('modal-community-bank').classList.add('flex'); window.renderCommunityBankList(); };
window.closeCommunityBank = function() { window.el('modal-community-bank').classList.add('hidden'); window.el('modal-community-bank').classList.remove('flex'); };

window.renderCommunityBankList = function() { 
    const container = window.el('community-bank-list'); 
    if(!container) return;
    container.innerHTML = ''; 
    const nativeQs = window.BANCO_BRUTAO_GLOBAL || []; 
    
    if (nativeQs.length === 0) { container.innerHTML = '<p class="text-gray-400 text-center py-10">O banco global está vazio ou o arquivo externo não foi carregado.</p>'; return; } 
    
    nativeQs.forEach((q, index) => { 
        const div = window.ce('div'); 
        div.className = "flex items-start gap-4 p-4 bg-black/40 border border-white/10 rounded-xl mb-3 hover:bg-white/5 transition-colors cursor-pointer group"; 
        div.onclick = function(e) { if(e.target.tagName.toLowerCase() !== 'input') { const cb = window.el(`comm-cb-${index}`); if(cb) cb.checked = !cb.checked; } }; 
        
        // Tratamento robusto para os nomes do JSON
        const comp = q.disciplina || q.componente || 'Geral';
        let anoStr = String(q.ano || 'Geral');
        if (anoStr !== 'Geral' && !anoStr.toLowerCase().includes('ano')) anoStr += 'º Ano';
        const prof = q.nivel || q.nivel_proficiencia || 'Básico';
        const enun = q.pergunta || q.enunciado || 'Questão sem enunciado';

        div.innerHTML = `<input type="checkbox" id="comm-cb-${index}" value="${index}" class="comm-checkbox w-6 h-6 mt-1 accent-emerald-500 cursor-pointer"><div class="flex-1 pointer-events-none"><div class="flex gap-2 items-center mb-2 flex-wrap"><span class="bg-blue-900/50 text-blue-300 border border-blue-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">${comp}</span><span class="bg-indigo-900/50 text-indigo-300 border border-indigo-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">${anoStr}</span><span class="bg-yellow-900/50 text-yellow-300 border border-yellow-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">${prof}</span></div><p class="text-white text-sm font-medium leading-relaxed group-hover:text-emerald-200 transition-colors">${enun}</p></div>`; 
        container.appendChild(div); 
    }); 
};

window.toggleSelectAllCommunity = function(sourceCheckbox) { const checkboxes = document.querySelectorAll('.comm-checkbox'); checkboxes.forEach(cb => cb.checked = sourceCheckbox.checked); };

window.cloneCommunitySelected = function() { 
    const checkboxes = document.querySelectorAll('.comm-checkbox:checked'); 
    if (checkboxes.length === 0) { window.showSystemMessage("Aviso", "Selecione pelo menos uma questão para importar.", "info"); return; } 
    
    const nativeQs = window.BANCO_BRUTAO_GLOBAL || []; 
    let current = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); 
    let added = 0; 
    
    checkboxes.forEach(cb => { 
        const idx = parseInt(cb.value); const rawQ = nativeQs[idx]; 
        if (rawQ) { 
            let anoSeguro = String(rawQ.ano || 'Geral');
            if (anoSeguro !== 'Geral' && !anoSeguro.toLowerCase().includes('ano')) anoSeguro += 'º Ano';
            
            let altA = "", altB = "", altC = "", altD = "";
            if (Array.isArray(rawQ.alternativas)) {
                altA = rawQ.alternativas[0] || ""; altB = rawQ.alternativas[1] || ""; altC = rawQ.alternativas[2] || ""; altD = rawQ.alternativas[3] || "";
            } else if (rawQ.alternativas) {
                altA = rawQ.alternativas.A || ""; altB = rawQ.alternativas.B || ""; altC = rawQ.alternativas.C || ""; altD = rawQ.alternativas.D || "";
            }

            let ansIdx = 0;
            if (rawQ.correta !== undefined && rawQ.correta !== null) ansIdx = parseInt(rawQ.correta);
            else if (rawQ.gabarito_letra) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[rawQ.gabarito_letra.toUpperCase()] || 0;
            else if (rawQ.resposta_correta) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[rawQ.resposta_correta.toUpperCase()] || 0;

            const newId = `CUST_CLONE_${Date.now()}_${Math.floor(Math.random()*1000)}`; 
            const questionToAdd = { 
                id: newId, 
                text: rawQ.pergunta || rawQ.enunciado, 
                category: `${rawQ.disciplina || rawQ.componente} • ${anoSeguro} • Proficiência: ${rawQ.nivel || rawQ.nivel_proficiencia||'Básico'}`, 
                componente: String(rawQ.disciplina || rawQ.componente||'').toLowerCase(), 
                ano: anoSeguro.toLowerCase(), 
                proficiencia: String(rawQ.nivel || rawQ.nivel_proficiencia||'Básico').toLowerCase(), 
                options: [altA, altB, altC, altD], 
                answer: ansIdx, 
                explicacao: rawQ.justificativa_gabarito || rawQ.explicacao||"", 
                image_url: rawQ.imagem || rawQ.image_url||null, 
                bncc: rawQ.habilidade_bncc_codigo_referencial || rawQ.bncc||"N/A", 
                isCustom: true 
            }; 
            current.push(questionToAdd); added++; 
        } 
    }); 
    window.writeJSONKey(window.STORAGE_KEYS.customQuestions, current); 
    if(typeof window.initGameData === 'function') window.initGameData(); 
    window.renderQuestionBank(); window.closeCommunityBank(); 
    window.showSystemMessage("Sucesso Absoluto", `${added} questão(ões) do Banco Global foram somadas ao seu banco pessoal! Agora você pode editá-las livremente.`, "success"); 
};

window.handleImportFile = function(event) { 
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); 
    reader.onload = function(e) { 
        try { 
            const data = JSON.parse(e.target.result); if (!Array.isArray(data)) throw new Error(""); 
            const valid = data.filter(q => q.id && q.text && q.isCustom); if (valid.length === 0) return; 
            let current = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); let added = 0; 
            valid.forEach(nq => { const newId = `CUST_IMP_${Date.now()}_${Math.floor(Math.random()*1000)}`; current.push({...nq, id: newId}); added++; }); 
            window.writeJSONKey(window.STORAGE_KEYS.customQuestions, current); 
            if(typeof window.initGameData === 'function') window.initGameData(); 
            window.renderQuestionBank(); 
            window.showSystemMessage("Sucesso", `${added} questões injetadas no seu banco.`, "success"); 
        } catch (err) { window.showSystemMessage("Erro", "Ficheiro inválido ou corrompido.", "error"); } 
        event.target.value = ''; 
    }; 
    reader.readAsText(file); 
};
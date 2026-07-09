// =========================================================================
// Arquivo: banco_de_questoes.js
// Função: Gestão Visual do Banco de Questões e Import/Export
// =========================================================================

window.pendingImportQuestions = [];

window.renderQuestionBank = function() { 
    const container = window.el ? window.el('qb-list-container') : document.getElementById('qb-list-container'); 
    if(!container) return;
    container.innerHTML = ''; 
    
    if(!window.allQuestions || window.allQuestions.length === 0) { 
        container.innerHTML = `<div class="text-center text-gray-500 py-10 font-bold">O banco global e pessoal estão vazios.</div>`; 
        return; 
    } 
    
    window.allQuestions.forEach((q) => { 
        const isCust = q.isCustom; 
        const card = document.createElement('div'); 
        card.className = "bg-white/5 border border-white/10 rounded-xl p-4 mb-4 hover:bg-white/10 transition-colors shadow-lg"; 
        const badgeColor = isCust ? 'bg-fuchsia-900 text-fuchsia-300 border-fuchsia-500' : 'bg-blue-900 text-blue-300 border-blue-500'; 
        const badgeText = isCust ? 'Editável (Seu Banco)' : 'Nativa (Banco Global)'; 
        const btnHtml = isCust ? `<div class="flex gap-2"><button onclick="window.editCustomQuestion('${q.id}')" class="text-yellow-400 text-xs font-bold bg-yellow-900/30 px-3 py-1 rounded border border-yellow-500/30 hover:bg-yellow-500 hover:text-black transition-colors">Editar</button><button onclick="window.deleteCustomQuestion('${q.id}')" class="text-red-400 text-xs font-bold bg-red-900/30 px-3 py-1 rounded border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors">Excluir</button></div>` : ''; 
        card.innerHTML = `<div class="flex justify-between items-start mb-2"><div class="flex gap-3 items-center flex-wrap"><span class="text-white font-bold font-mono text-sm bg-black/50 px-2 py-1 rounded border border-gray-700">${q.id}</span><span class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${badgeColor}">${badgeText}</span><span class="text-gray-400 text-xs">${q.category}</span></div>${btnHtml}</div><p class="text-gray-200 text-sm mb-3 font-medium">${q.text}</p>`; 
        container.appendChild(card); 
    }); 
};

window.openAddQuestionModal = function() { 
    window.editingQuestionId = null; 
    var idInput = document.getElementById('add-q-id'); if(idInput) { idInput.disabled = false; idInput.value = `Q_PRO_${Date.now().toString().slice(-4)}`; }
    ['add-q-enunciado', 'add-q-image', 'add-q-optA', 'add-q-optB', 'add-q-optC', 'add-q-optD'].forEach(id => {
        var el = document.getElementById(id); if(el) el.value = "";
    });
    var modal = document.getElementById('modal-add-question'); 
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
};

window.closeAddQuestionModal = function() { 
    var modal = document.getElementById('modal-add-question'); 
    if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
};

window.saveCustomQuestion = function() { 
    const id = document.getElementById('add-q-id').value.trim(); 
    const comp = document.getElementById('add-q-comp').value; 
    const ano = document.getElementById('add-q-ano').value; 
    const prof = document.getElementById('add-q-prof').value; 
    const enunciado = document.getElementById('add-q-enunciado').value.trim(); 
    let imageUrl = document.getElementById('add-q-image') ? document.getElementById('add-q-image').value.trim() : ''; 
    if(typeof window.normalizeImageUrl === 'function') imageUrl = window.normalizeImageUrl(imageUrl); 
    
    const optA = document.getElementById('add-q-optA').value.trim(); 
    const optB = document.getElementById('add-q-optB').value.trim(); 
    const optC = document.getElementById('add-q-optC').value.trim(); 
    const optD = document.getElementById('add-q-optD').value.trim(); 
    
    if(!enunciado || !optA || !optB || !optC || !optD) { 
        var err = document.getElementById('add-q-error');
        if(err) err.classList.remove('hidden'); 
        return; 
    } 
    
    const ansMap = {'A': 0, 'B': 1, 'C': 2, 'D': 3}; 
    var radio = document.querySelector('input[name="add-q-answer"]:checked');
    const ansLetter = radio ? radio.value : 'A'; 
    
    const explInput = document.getElementById('add-q-expl');
    const bnccInput = document.getElementById('add-q-bncc');
    
    const newQ = { 
        id: window.editingQuestionId || id || `CUST_${Date.now()}`, 
        text: enunciado, 
        category: `${comp} • ${ano} • Proficiência: ${prof}`, 
        componente: comp.toLowerCase(), 
        ano: ano.toLowerCase(), 
        proficiencia: prof.toLowerCase(), 
        options: [optA, optB, optC, optD], 
        answer: ansMap[ansLetter], 
        explicacao: explInput ? explInput.value : "Salvo pelo professor.", 
        bncc: bnccInput ? bnccInput.value : "N/A", 
        image_url: imageUrl || null, 
        isCustom: true 
    }; 
    
    let cq = [];
    if(typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) cq = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); 
    
    if(window.editingQuestionId) { 
        const idx = cq.findIndex(x => x.id === window.editingQuestionId); 
        if(idx !== -1) cq[idx] = newQ; 
    } else { 
        cq.push(newQ); 
    } 
    
    if(typeof window.writeJSONKey === 'function' && window.STORAGE_KEYS) window.writeJSONKey(window.STORAGE_KEYS.customQuestions, cq); 
    
    window.closeAddQuestionModal(); 
    if(typeof window.initGameData === 'function') window.initGameData(); 
    window.renderQuestionBank(); 
    
    if(typeof window.showSystemMessage === 'function') window.showSystemMessage("Sucesso", "Questão salva no seu banco pessoal.", "success"); 
    else alert("Questão salva!");
};

window.deleteCustomQuestion = function(id) { 
    window.questionToDeleteId = id; 
    var modal = document.getElementById('modal-delete-q');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
    var btn = document.getElementById('btn-confirm-del-q');
    if(btn) btn.onclick = window.executeDeleteCustomQuestion; 
};

window.closeDeleteQModal = function() { 
    var modal = document.getElementById('modal-delete-q');
    if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
    window.questionToDeleteId = null; 
};

window.executeDeleteCustomQuestion = function() { 
    if(!window.questionToDeleteId) return; 
    let cq = [];
    if(typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) cq = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); 
    cq = cq.filter(q => q.id !== window.questionToDeleteId); 
    if(typeof window.writeJSONKey === 'function' && window.STORAGE_KEYS) window.writeJSONKey(window.STORAGE_KEYS.customQuestions, cq); 
    
    if(typeof window.initGameData === 'function') window.initGameData(); 
    window.renderQuestionBank(); 
    window.closeDeleteQModal(); 
};

window.exportCustomQuestions = function() { 
    if(!window.STORAGE_KEYS) return;
    const savedCustom = localStorage.getItem(window.STORAGE_KEYS.customQuestions); 
    if (!savedCustom || savedCustom === '[]') { 
        if(typeof window.showSystemMessage === 'function') window.showSystemMessage("Aviso", "O seu banco de questões customizadas está vazio.", "info"); 
        else alert("Banco vazio");
        return; 
    } 
    const blob = new Blob([savedCustom], { type: "application/json" }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `Brutao_Questoes_Colaborativas_${new Date().toISOString().slice(0,10)}.json`; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url); 
};

window.editCustomQuestion = function(id) { 
    let customQuestions = [];
    if(typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) customQuestions = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); 
    const qToEdit = customQuestions.find(q => q.id === id); 
    if (!qToEdit) return; 
    
    window.editingQuestionId = qToEdit.id; 
    var idInput = document.getElementById('add-q-id');
    if(idInput) { idInput.value = qToEdit.id; idInput.disabled = true; }
    
    const setSelect = (selId, val) => { 
        const elObj = document.getElementById(selId); 
        if(!elObj) return;
        for(let i=0; i<elObj.options.length; i++) { 
            if(elObj.options[i].value.toLowerCase() === val.toLowerCase()) { 
                elObj.selectedIndex = i; break; 
            } 
        } 
    }; 
    
    setSelect('add-q-comp', qToEdit.componente); 
    setSelect('add-q-ano', qToEdit.ano); 
    setSelect('add-q-prof', qToEdit.proficiencia); 
    
    if(document.getElementById('add-q-enunciado')) document.getElementById('add-q-enunciado').value = qToEdit.text; 
    if(document.getElementById('add-q-image')) document.getElementById('add-q-image').value = qToEdit.image_url || ""; 
    
    if(document.getElementById('add-q-optA')) document.getElementById('add-q-optA').value = qToEdit.options[0]; 
    if(document.getElementById('add-q-optB')) document.getElementById('add-q-optB').value = qToEdit.options[1]; 
    if(document.getElementById('add-q-optC')) document.getElementById('add-q-optC').value = qToEdit.options[2]; 
    if(document.getElementById('add-q-optD')) document.getElementById('add-q-optD').value = qToEdit.options[3]; 
    
    if(document.getElementById('add-q-bncc')) document.getElementById('add-q-bncc').value = qToEdit.bncc || ""; 
    if(document.getElementById('add-q-expl')) document.getElementById('add-q-expl').value = qToEdit.explicacao !== "Salvo pelo professor." ? qToEdit.explicacao : ""; 
    
    const ansMapRev = {0: 'a', 1: 'b', 2: 'c', 3: 'd'}; 
    var radio = document.getElementById(`ans-${ansMapRev[qToEdit.answer]}`);
    if(radio) radio.checked = true; 
    
    var modal = document.getElementById('modal-add-question');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
};

window.openCommunityBank = function() { 
    var modal = document.getElementById('modal-community-bank');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
    window.renderCommunityBankList(); 
};
window.closeCommunityBank = function() { 
    var modal = document.getElementById('modal-community-bank');
    if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
};

window.renderCommunityBankList = function() { 
    const container = document.getElementById('community-bank-list'); 
    if(!container) return;
    container.innerHTML = ''; 
    const nativeQs = window.BANCO_BRUTAO_GLOBAL || []; 
    
    if (nativeQs.length === 0) { 
        container.innerHTML = '<p class="text-gray-400 text-center py-10">O banco global está vazio ou o arquivo externo não foi carregado.</p>'; 
        return; 
    } 
    
    nativeQs.forEach((q, index) => { 
        const div = document.createElement('div'); 
        div.className = "flex items-start gap-4 p-4 bg-black/40 border border-white/10 rounded-xl mb-3 hover:bg-white/5 transition-colors cursor-pointer group"; 
        div.onclick = function(e) { 
            if(e.target.tagName.toLowerCase() !== 'input') { 
                const cb = document.getElementById(`comm-cb-${index}`); 
                if(cb) cb.checked = !cb.checked; 
            } 
        }; 
        
        const comp = q.disciplina || q.componente || 'Geral';
        let anoStr = String(q.ano || 'Geral');
        if (anoStr !== 'Geral' && !anoStr.toLowerCase().includes('ano')) anoStr += 'º Ano';
        const prof = q.nivel || q.nivel_proficiencia || 'Básico';
        const enun = q.pergunta || q.enunciado || 'Questão sem enunciado';

        div.innerHTML = `<input type="checkbox" id="comm-cb-${index}" value="${index}" class="comm-checkbox w-6 h-6 mt-1 accent-emerald-500 cursor-pointer"><div class="flex-1 pointer-events-none"><div class="flex gap-2 items-center mb-2 flex-wrap"><span class="bg-blue-900/50 text-blue-300 border border-blue-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">${comp}</span><span class="bg-indigo-900/50 text-indigo-300 border border-indigo-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">${anoStr}</span><span class="bg-yellow-900/50 text-yellow-300 border border-yellow-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">${prof}</span></div><p class="text-white text-sm font-medium leading-relaxed group-hover:text-emerald-200 transition-colors">${enun}</p></div>`; 
        container.appendChild(div); 
    }); 
};

window.toggleSelectAllCommunity = function(sourceCheckbox) { 
    const checkboxes = document.querySelectorAll('.comm-checkbox'); 
    checkboxes.forEach(cb => cb.checked = sourceCheckbox.checked); 
};

window.cloneCommunitySelected = function() { 
    const checkboxes = document.querySelectorAll('.comm-checkbox:checked'); 
    if (checkboxes.length === 0) { 
        if(typeof window.showSystemMessage === 'function') window.showSystemMessage("Aviso", "Selecione pelo menos uma questão para importar.", "info"); 
        return; 
    } 
    
    const nativeQs = window.BANCO_BRUTAO_GLOBAL || []; 
    let current = [];
    if(typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) current = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); 
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
            else if (rawQ.gabarito_letra) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[String(rawQ.gabarito_letra).toUpperCase()] || 0;
            else if (rawQ.resposta_correta) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[String(rawQ.resposta_correta).toUpperCase()] || 0;

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
    
    if(typeof window.writeJSONKey === 'function' && window.STORAGE_KEYS) window.writeJSONKey(window.STORAGE_KEYS.customQuestions, current); 
    if(typeof window.initGameData === 'function') window.initGameData(); 
    window.renderQuestionBank(); 
    window.closeCommunityBank(); 
    if(typeof window.showSystemMessage === 'function') window.showSystemMessage("Sucesso Absoluto", `${added} questão(ões) do Banco Global foram somadas ao seu banco pessoal! Agora você pode editá-las livremente.`, "success"); 
};

window.handleImportFile = function(event) { 
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); 
    reader.onload = function(e) { 
        try { 
            const data = JSON.parse(e.target.result); if (!Array.isArray(data)) throw new Error(""); 
            const valid = data.filter(q => q.id && q.text && q.isCustom); if (valid.length === 0) return; 
            let current = [];
            if(typeof window.readJSONKey === 'function' && window.STORAGE_KEYS) current = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); 
            let added = 0; 
            valid.forEach(nq => { const newId = `CUST_IMP_${Date.now()}_${Math.floor(Math.random()*1000)}`; current.push({...nq, id: newId}); added++; }); 
            if(typeof window.writeJSONKey === 'function' && window.STORAGE_KEYS) window.writeJSONKey(window.STORAGE_KEYS.customQuestions, current); 
            if(typeof window.initGameData === 'function') window.initGameData(); 
            window.renderQuestionBank(); 
            if(typeof window.showSystemMessage === 'function') window.showSystemMessage("Sucesso", `${added} questões injetadas no seu banco.`, "success"); 
        } catch (err) { 
            if(typeof window.showSystemMessage === 'function') window.showSystemMessage("Erro", "Ficheiro inválido ou corrompido.", "error"); 
        } 
        event.target.value = ''; 
    }; 
    reader.readAsText(file); 
};
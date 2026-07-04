// --- BANCO EMBUTIDO DA BNCC ---
const bancoEmbutidoJSONL = `
{"id": "LP_1ANO_0001", "componente": "Língua Portuguesa", "ano": "1º ano", "nivel_proficiencia": "Básico", "enunciado": "Qual é a letra inicial de BOLA?", "alternativas": {"A": "D", "B": "C", "C": "F", "D": "B"}, "resposta_correta": "D", "explicacao": "BOLA começa com B.", "bncc": "EF01LP01", "isCustom": false}
{"id": "MAT_5ANO_0100", "componente": "Matemática", "ano": "5º ano", "nivel_proficiencia": "Avançado", "enunciado": "Tabela de pontos: Ana 8, Bia 6, Caio 9. Quem fez menos pontos?", "alternativas": {"A": "Ana", "B": "Todos", "C": "Bia", "D": "Caio"}, "resposta_correta": "C", "explicacao": "Bia fez 6, o menor número.", "bncc": "EF05MA01", "isCustom": false}
`;

// --- FUNÇÕES DE GESTÃO DO BANCO DE QUESTÕES ---
function renderQuestionBank() { 
    const container = el('qb-list-container'); container.innerHTML = ''; 
    if(allQuestions.length === 0) { container.innerHTML = `<div class="text-center text-gray-500 py-10">O banco está vazio.</div>`; return; } 
    allQuestions.forEach((q) => { 
        const isCust = q.isCustom; 
        const card = ce('div'); 
        card.className = "bg-white/5 border border-white/10 rounded-xl p-4 mb-4 hover:bg-white/10 transition-colors"; 
        card.innerHTML = `<div class="flex justify-between items-start mb-2"><div class="flex gap-3 items-center flex-wrap"><span class="text-white font-bold font-mono text-sm bg-black/50 px-2 py-1 rounded border border-gray-700">${q.id}</span><span class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${isCust?'bg-fuchsia-900 text-fuchsia-300 border-fuchsia-500':'bg-blue-900 text-blue-300 border-blue-500'}">${isCust?'Custom':'BNCC'}</span><span class="text-gray-400 text-xs">${q.category}</span></div>${isCust?`<div class="flex gap-2"><button onclick="editCustomQuestion('${q.id}')" class="text-yellow-400 text-xs font-bold bg-yellow-900/30 px-3 py-1 rounded border border-yellow-500/30">Editar</button><button onclick="deleteCustomQuestion('${q.id}')" class="text-red-400 text-xs font-bold bg-red-900/30 px-3 py-1 rounded border border-red-500/30">Excluir</button></div>`:''}</div><p class="text-gray-200 text-sm mb-3 font-medium">${q.text}</p>`; 
        container.appendChild(card); 
    }); 
}

function openAddQuestionModal() { 
    editingQuestionId = null; el('add-q-id').disabled = false; el('add-q-id').value = `Q_PRO_${Date.now().toString().slice(-4)}`; 
    el('add-q-enunciado').value = ""; el('add-q-image').value = ""; el('add-q-optA').value = ""; el('add-q-optB').value = ""; el('add-q-optC').value = ""; el('add-q-optD').value = ""; 
    el('modal-add-question').classList.remove('hidden'); el('modal-add-question').classList.add('flex'); 
}

function closeAddQuestionModal() { el('modal-add-question').classList.add('hidden'); el('modal-add-question').classList.remove('flex'); }

function saveCustomQuestion() { 
    const id = el('add-q-id').value.trim(); const comp = el('add-q-comp').value; const ano = el('add-q-ano').value; const prof = el('add-q-prof').value; 
    const enunciado = el('add-q-enunciado').value.trim(); let imageUrl = el('add-q-image').value.trim(); imageUrl = normalizeImageUrl(imageUrl); 
    const optA = el('add-q-optA').value.trim(); const optB = el('add-q-optB').value.trim(); const optC = el('add-q-optC').value.trim(); const optD = el('add-q-optD').value.trim(); 
    if(!enunciado || !optA || !optB || !optC || !optD) { el('add-q-error').classList.remove('hidden'); return; } 
    const ansMap = {'A': 0, 'B': 1, 'C': 2, 'D': 3}; const ansLetter = qs('input[name="add-q-answer"]:checked').value; 
    const newQ = { id: editingQuestionId || id || `CUST_${Date.now()}`, text: enunciado, category: `${comp} • ${ano} • Proficiência: ${prof}`, componente: comp.toLowerCase(), ano: ano.toLowerCase(), proficiencia: prof.toLowerCase(), options: [optA, optB, optC, optD], answer: ansMap[ansLetter], explicacao: el('add-q-expl').value || "Salvo pelo professor.", bncc: el('add-q-bncc').value || "N/A", image_url: imageUrl || null, isCustom: true }; 
    let cq = readJSONKey(STORAGE_KEYS.customQuestions, []); 
    if(editingQuestionId) { const idx = cq.findIndex(x=>x.id===editingQuestionId); if(idx!==-1) cq[idx]=newQ; } else cq.push(newQ); 
    writeJSONKey(STORAGE_KEYS.customQuestions, cq); closeAddQuestionModal(); initGameData(); renderQuestionBank(); showSystemMessage("Sucesso", "Questão salva.", "success"); 
}

function deleteCustomQuestion(id) { questionToDeleteId = id; el('modal-delete-q').classList.remove('hidden'); el('modal-delete-q').classList.add('flex'); el('btn-confirm-del-q').onclick = executeDeleteCustomQuestion; }
function closeDeleteQModal() { el('modal-delete-q').classList.add('hidden'); el('modal-delete-q').classList.remove('flex'); questionToDeleteId = null; }
function executeDeleteCustomQuestion() { if(!questionToDeleteId) return; let cq = readJSONKey(STORAGE_KEYS.customQuestions, []); cq = cq.filter(q => q.id !== questionToDeleteId); writeJSONKey(STORAGE_KEYS.customQuestions, cq); initGameData(); renderQuestionBank(); closeDeleteQModal(); }

function exportCustomQuestions() { 
    const savedCustom = localStorage.getItem(STORAGE_KEYS.customQuestions); 
    if (!savedCustom || savedCustom === '[]') { showSystemMessage("Aviso", "Banco vazio.", "info"); return; } 
    const blob = new Blob([savedCustom], { type: "application/json" }); const url = URL.createObjectURL(blob); 
    const a = ce('a'); a.href = url; a.download = `backup_${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); 
}

function handleImportFile(event) { 
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); 
    reader.onload = function(e) { 
        try { 
            const data = JSON.parse(e.target.result); 
            if (!Array.isArray(data)) throw new Error(""); 
            const valid = data.filter(q => q.id && q.text && q.isCustom); if (valid.length === 0) return; 
            let current = readJSONKey(STORAGE_KEYS.customQuestions, []); let added = 0; 
            valid.forEach(nq => { if (!current.find(eq => eq.id === nq.id)) { current.push(nq); added++; } }); 
            writeJSONKey(STORAGE_KEYS.customQuestions, current); initGameData(); renderQuestionBank(); showSystemMessage("Sucesso", `${added} questões importadas.`, "success"); 
        } catch (err) { showSystemMessage("Erro", "Ficheiro inválido.", "error"); } event.target.value = ''; 
    }; reader.readAsText(file); 
}

function editCustomQuestion(id) { 
    let customQuestions = readJSONKey(STORAGE_KEYS.customQuestions, []); const qToEdit = customQuestions.find(q => q.id === id); if (!qToEdit) return; 
    editingQuestionId = qToEdit.id; el('add-q-id').value = qToEdit.id; el('add-q-id').disabled = true; 
    const setSelect = (selId, val) => { const el = el(selId); for(let i=0; i<el.options.length; i++) if(el.options[i].value.toLowerCase() === val.toLowerCase()) { el.selectedIndex = i; break; } }; 
    setSelect('add-q-comp', qToEdit.componente); setSelect('add-q-ano', qToEdit.ano); setSelect('add-q-prof', qToEdit.proficiencia); 
    el('add-q-enunciado').value = qToEdit.text; el('add-q-image').value = qToEdit.image_url || ""; 
    el('add-q-optA').value = qToEdit.options[0]; el('add-q-optB').value = qToEdit.options[1]; el('add-q-optC').value = qToEdit.options[2]; el('add-q-optD').value = qToEdit.options[3]; 
    el('add-q-bncc').value = qToEdit.bncc || ""; el('add-q-expl').value = qToEdit.explicacao !== "Salvo pelo professor." ? qToEdit.explicacao : ""; 
    const ansMapRev = {0: 'a', 1: 'b', 2: 'c', 3: 'd'}; el(`ans-${ansMapRev[qToEdit.answer]}`).checked = true; 
    el('modal-add-question').classList.remove('hidden'); el('modal-add-question').classList.add('flex'); 
}
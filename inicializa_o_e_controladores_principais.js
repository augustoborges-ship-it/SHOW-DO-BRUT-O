// ... existing code ...
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
        const rawBank = window.BANCO_BRUTAO_GLOBAL || [];
        
        // --- NOVO MOTOR DE PARSE (BLINDADO CONTRA NÚMEROS E NOMES DIFERENTES) ---
        const globalQuestionsParsed = rawBank.map((q, index) => { 
            // 1. Blindagem do Ano (Garante que vira texto, ex: "1º Ano")
            let anoSeguro = String(q.ano || 'Geral');
            if (anoSeguro !== 'Geral' && !anoSeguro.toLowerCase().includes('ano')) {
                anoSeguro += 'º Ano';
            }

            // 2. Extrai as alternativas seja como Array (novo json) ou Objeto (antigo)
            let altA = "", altB = "", altC = "", altD = "";
            if (Array.isArray(q.alternativas)) {
                altA = q.alternativas[0] || ""; altB = q.alternativas[1] || "";
                altC = q.alternativas[2] || ""; altD = q.alternativas[3] || "";
            } else if (q.alternativas) {
                altA = q.alternativas.A || ""; altB = q.alternativas.B || "";
                altC = q.alternativas.C || ""; altD = q.alternativas.D || "";
            }

            // 3. Lê o gabarito (Número vs Letra)
            let ansIdx = 0;
            if (q.correta !== undefined && q.correta !== null) ansIdx = parseInt(q.correta);
            else if (q.gabarito_letra) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[q.gabarito_letra.toUpperCase()] || 0;
            else if (q.resposta_correta) ansIdx = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[q.resposta_correta.toUpperCase()] || 0;

            // 4. Mapeia tudo para o idioma do jogo
            return { 
                id: q.id || `GLOBAL_${index}`, 
                text: q.pergunta || q.enunciado || "Sem enunciado", 
                category: `${q.disciplina || q.componente || 'Geral'} • ${anoSeguro} • Proficiência: ${q.nivel || q.nivel_proficiencia || 'Básico'}`, 
                componente: String(q.disciplina || q.componente || '').toLowerCase(), 
                ano: anoSeguro.toLowerCase(), 
                proficiencia: String(q.nivel || q.nivel_proficiencia || 'Básico').toLowerCase(), 
                options: [altA, altB, altC, altD], 
                answer: ansIdx, 
                explicacao: q.justificativa_gabarito || q.explicacao || q.feedback_correto || "", 
                image_url: q.imagem || q.image_url || null, 
                bncc: q.habilidade_bncc_codigo_referencial || q.bncc || "N/A", 
                isCustom: false 
            }; 
        }); 
        
        const customQuestions = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []); 
        window.allQuestions = [...globalQuestionsParsed, ...customQuestions]; 
        
    } catch (e) {
        console.error("Falha ao inicializar dados do jogo:", e);
    }
};

// --- INTEGRAÇÕES E IMPORTAÇÕES ---
window.checkMagicLinkSync = function() { 
// ... existing code ...
```

### 2️⃣ Atualizar o Painel do Professor (Para clonagem de itens)

Abra o arquivo **`banco_de_questoes.js`**. Procure as funções `window.renderCommunityBankList` e `window.cloneCommunitySelected` (na segunda metade do arquivo) e substitua por esta versão:

```javascript:Banco de Questões:banco_de_questoes.js
// ... existing code ...
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
// ... existing code ...
```

Feitas essas duas substituições, o jogo estará **blindado contra falhas** e o botão do PIN (junto com a seleção de Modo Treino) vai voltar a voar na velocidade da luz com as suas 2.000 questões!
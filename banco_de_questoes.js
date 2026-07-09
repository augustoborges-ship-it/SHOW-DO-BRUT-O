#### 4. `banco_de_questoes.js`
**O que foi corrigido:** O gestor agora sempre tentará garantir que os dados estejam carregados, evitando que exiba "banco vazio" caso você o abra logo em seguida após um refresh rápido.

```javascript:banco_de_questoes.js
// =========================================================================
// Arquivo: banco_de_questoes.js
// Função: Gestão Visual do Banco de Questões no Painel do Educador
// =========================================================================

window.renderQuestionBank = function() { 
    const container = document.getElementById('qb-list-container'); 
    if(!container) return;
    container.innerHTML = ''; 
    
    if(!window.allQuestions || window.allQuestions.length === 0) { 
        container.innerHTML = `<div class="text-center text-gray-500 py-10 font-bold">O banco global está vazio. Aguarde o carregamento ou verifique o arquivo motor_do_banco_de_questoes.js.</div>`; 
        return; 
    } 
    
    window.allQuestions.forEach((q) => { 
        const card = document.createElement('div'); 
        card.className = "bg-gray-800/80 border border-gray-600 rounded-xl p-4 mb-4 hover:bg-gray-700 transition-colors shadow-lg"; 
        card.innerHTML = `<div class="flex justify-between items-start mb-2"><div class="flex gap-3 items-center flex-wrap"><span class="text-white font-bold font-mono text-sm bg-black/50 px-2 py-1 rounded border border-gray-700">${q.id}</span><span class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border bg-blue-900 text-blue-300 border-blue-500">Nativa do Site</span><span class="text-gray-400 text-xs">${q.category}</span></div></div><p class="text-gray-200 text-sm mb-3 font-medium">${q.text}</p>`; 
        container.appendChild(card); 
    }); 
};

window.openQuestionBank = function() { 
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); 
    var s = document.getElementById('screen-question-bank');
    if(s) s.classList.add('active'); 
    
    if(!window.allQuestions || window.allQuestions.length === 0) {
        if(typeof window.initGameData === 'function') window.initGameData();
    }
    
    window.renderQuestionBank(); 
};
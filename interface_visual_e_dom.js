#### 3. `interface_visual_e_dom.js`
**O que foi corrigido:** Ocultação de telas e ativação dos modais de forma segura garantindo o funcionamento do Link Embed e ações de cópia.

```javascript:interface_visual_e_dom.js
// =========================================================================
// Arquivo: interface_visual_e_dom.js
// Função: Interações de Tela, Modais, Fábrica de Jogos e Embed
// =========================================================================

window.goBackToHome = function() { window.location.reload(); };

window.openStudentSetup = function() {
    if(window.audioSystem && window.audioSystem.play) window.audioSystem.play('suspense');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    var s = document.getElementById('screen-setup-student');
    if (s) s.classList.add('active');
};

window.openProfLogin = function() {
    var pin = document.getElementById('prof-pin-input');
    if(pin) pin.value = "";
    var err = document.getElementById('login-error');
    if(err) err.classList.add('hidden');
    var modal = document.getElementById('modal-prof-login');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
    if(window.audioSystem && window.audioSystem.play) window.audioSystem.play('certeza');
};

window.closeProfLogin = function() {
    var modal = document.getElementById('modal-prof-login');
    if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
    if(window.audioSystem && window.audioSystem.stop) window.audioSystem.stop('certeza');
};

// FÁBRICA DE JOGOS E LINK EMBED
window.generateMutantGame = async function(type) {
    var missaoEl = document.getElementById('export-mission-name');
    var missao = missaoEl ? missaoEl.value.trim() : "Missão Brutão";
    var modeEl = document.getElementById('export-mode');
    var mode = modeEl ? modeEl.value : "treino";
    
    var pool = window.allQuestions; 
    if (!pool || pool.length === 0) { alert("Banco vazio. Não é possível gerar."); return; }
    
    var payload = btoa(unescape(encodeURIComponent(JSON.stringify({ missionId: missao, mode: mode, questions: pool }))));
    var url = window.location.href.split('#')[0].split('?')[0] + '#mutant=' + payload;
    
    if (type === 'embed') {
        var iframe = `<iframe src="${url}" width="100%" height="750" style="border:none; border-radius:15px; overflow:hidden;" allowfullscreen></iframe>`;
        var modalExport = document.getElementById('modal-export-game');
        if(modalExport) { modalExport.classList.add('hidden'); modalExport.classList.remove('flex'); }
        
        var linkInput = document.getElementById('share-link-input');
        if(linkInput) linkInput.value = url;
        var iframeInput = document.getElementById('share-iframe-input');
        if(iframeInput) iframeInput.value = iframe;
        
        var modalShare = document.getElementById('modal-share');
        if(modalShare) { modalShare.classList.remove('hidden'); modalShare.classList.add('flex'); }
    }
};

window.copyToClipboardFallback = function(text, btnElement) { 
    const t = document.createElement("textarea"); 
    t.value = text; t.style.position = "fixed"; t.style.left = "-9999px"; 
    document.body.appendChild(t); t.focus(); t.select(); 
    try { 
        document.execCommand('copy'); 
        if(btnElement) { btnElement.innerText = '📋 COPIADO!'; btnElement.className = 'bg-cyan-600 text-white font-bold px-4 py-2 rounded-lg text-xs shrink-0'; } 
    } catch (err) {} 
    document.body.removeChild(t); 
};

window.triggerConfetti = function() { 
    const c = document.querySelector('.screen.active [data-confetti-container]') || document.getElementById('confetti-container'); 
    if(!c) return; c.innerHTML = ''; const colors = ['#FFDF73','#D4AF37','#ffffff','#3B82F6','#EF4444']; 
    for(let i=0; i<100; i++) { 
        const p = document.createElement('div'); p.className = 'confetti-piece'; 
        p.style.width = (Math.random()*10+5)+'px'; p.style.height = (Math.random()*20+10)+'px'; 
        p.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)]; 
        p.style.left = (Math.random()*100)+'vw'; p.style.top = '-20px'; p.style.opacity = Math.random()+0.5; 
        p.style.transform = `rotate(${Math.random()*360}deg)`; 
        p.style.transition = `top ${Math.random()*3+2}s cubic-bezier(0.25,0.46,0.45,0.94) ${Math.random()*2}s, transform ${Math.random()*3+2}s linear ${Math.random()*2}s, opacity ${Math.random()*3+2}s ease-in ${Math.random()*2}s`; 
        c.appendChild(p); setTimeout(()=>{ p.style.top='120vh'; p.style.transform=`rotate(${Math.random()*720+360}deg)`; p.style.opacity='0'; },50); 
    } 
};
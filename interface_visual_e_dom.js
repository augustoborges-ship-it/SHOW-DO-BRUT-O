### 2. `interface_visual_e_dom.js`
Neste arquivo, a função `changeBrutusPose` é totalmente capaz de interpretar e renderizar a tag `<video>` dinamicamente. Ele cria o elemento e faz a transição entre imagem e vídeo com precisão cirúrgica de acordo com a sua interface.

```javascript:interface_visual_e_dom.js
// =========================================================================
// Arquivo: interface_visual_e_dom.js
// Função: Interações de Tela, Modais, Fábrica de Jogos e Render de Vídeo
// =========================================================================

window.goBackToHome = function () { window.location.reload(); };

window.showScreenSafe = function (id) {
    document.querySelectorAll(".screen").forEach(function (s) {
        s.classList.remove("active", "flex"); s.style.display = "";
    });
    var screen = document.getElementById(id);
    if (screen) screen.classList.add("active");
    if (typeof window.updateInterfaceContext === "function") window.updateInterfaceContext(id);
};

window.openStudentSetup = function () {
    if (window.audioSystem && window.audioSystem.play) window.audioSystem.play("suspense");
    window.showScreenSafe("screen-setup-student");
};

window.openProfLogin = function () {
    var pin = document.getElementById("prof-pin-input");
    if (pin) pin.value = "";
    var err = document.getElementById("login-error");
    if (err) err.classList.add("hidden");
    var modal = document.getElementById("modal-prof-login");
    if (modal) { modal.classList.remove("hidden"); modal.classList.add("flex"); }
    if (window.audioSystem && window.audioSystem.play) window.audioSystem.play("certeza");
};

window.closeProfLogin = function () {
    var modal = document.getElementById("modal-prof-login");
    if (modal) { modal.classList.add("hidden"); modal.classList.remove("flex"); }
    if (window.audioSystem && window.audioSystem.stop) window.audioSystem.stop("certeza");
};

// =========================================================================
// RENDERIZAÇÃO INTELIGENTE DE PERSONAGEM (SUPORTE A MP4)
// =========================================================================
window.changeBrutusPose = function(poseName) {
    const hostImg = document.getElementById('char-host');
    const hostSprite = document.getElementById('char-host-sprite');
    const hostCinematic = document.getElementById('char-host-cinematic');
    const cinematicVignette = document.getElementById('cinematic-vignette');
    let hostVideo = document.getElementById('char-host-video');

    // Cria a tag <video> dinamicamente sem alterar seu arquivo HTML
    if (!hostVideo) {
        const stage = document.getElementById('character-stage') || (hostImg ? hostImg.parentElement : null);
        if (stage) {
            hostVideo = document.createElement('video');
            hostVideo.id = 'char-host-video';
            hostVideo.className = 'hidden absolute right-0 bottom-0 h-full w-auto object-contain object-bottom-right transition-opacity duration-300 pointer-events-none';
            hostVideo.muted = true; // Necessário para tocar instantaneamente no navegador
            hostVideo.playsInline = true;
            hostVideo.loop = true;
            stage.appendChild(hostVideo);
        }
    }

    if(!window.brutusPoses || !window.brutusPoses[poseName]) return;
    
    const pose = window.brutusPoses[poseName];

    // Transição Suave (Oculta o elemento atual)
    if(hostImg) hostImg.style.opacity = '0';
    if(hostSprite) hostSprite.style.opacity = '0';
    if(hostCinematic) { hostCinematic.style.opacity = '0'; hostCinematic.classList.remove('cinematic-zoom'); }
    if(cinematicVignette) cinematicVignette.style.opacity = '0';
    if(hostVideo) { hostVideo.style.opacity = '0'; }

    clearInterval(window.spriteInterval);
    clearInterval(window.cinematicInterval);

    setTimeout(() => {
        // Tira todos do fluxo visual
        if(hostSprite) { hostSprite.classList.add('hidden'); hostSprite.classList.remove('flex'); }
        if(hostImg) { hostImg.classList.add('hidden'); hostImg.classList.remove('flex'); }
        if(hostCinematic) { hostCinematic.classList.add('hidden'); hostCinematic.classList.remove('flex'); }
        if(hostVideo) { hostVideo.classList.add('hidden'); hostVideo.classList.remove('flex'); hostVideo.pause(); }

        // Renderiza o elemento correto com base na configuração do 'brutusPoses'
        if (pose.type === 'img') {
            if(hostImg) {
                hostImg.classList.remove('hidden');
                hostImg.src = pose.src;
                hostImg.style.opacity = '1';
            }
        } else if (pose.type === 'video') {
            if(hostVideo) {
                hostVideo.classList.remove('hidden');
                hostVideo.src = pose.src;
                hostVideo.style.opacity = '1';
                hostVideo.play().catch(e => console.warn("Aviso: O vídeo não pôde ser reproduzido automaticamente.", e));
            }
            if(cinematicVignette) cinematicVignette.style.opacity = '1';
        } else if (pose.type === 'sprite') {
            if(hostSprite) {
                hostSprite.classList.remove('hidden');
                hostSprite.style.backgroundImage = `url('${pose.src}')`;
                hostSprite.style.backgroundSize = `${pose.cols * 100}% ${pose.rows * 100}%`;
                hostSprite.style.opacity = '1';
                let currentFrame = 0;
                window.spriteInterval = setInterval(() => {
                    const col = currentFrame % pose.cols;
                    const row = Math.floor(currentFrame / pose.cols);
                    const xPos = pose.cols > 1 ? (col / (pose.cols - 1)) * 100 : 0;
                    const yPos = pose.rows > 1 ? (row / (pose.rows - 1)) * 100 : 0;
                    hostSprite.style.backgroundPosition = `${xPos}% ${yPos}%`;
                    currentFrame = (currentFrame + 1) % pose.frames;
                }, 150);
            }
        } else if (pose.type === 'cinematic') {
            if(hostCinematic) {
                hostCinematic.classList.remove('hidden');
                hostCinematic.style.opacity = '1';
                hostCinematic.innerHTML = '';
                const shakeWrapper = document.createElement('div');
                shakeWrapper.className = 'absolute inset-0 w-full h-full animate-camera-shake';
                const breathWrapper = document.createElement('div');
                breathWrapper.className = 'absolute inset-0 w-full h-full animate-tense-breathing';
                
                pose.frames.forEach((src, idx) => {
                    const img = document.createElement('img');
                    img.src = src;
                    img.className = 'cinematic-img';
                    if(idx === 0) img.style.opacity = '1';
                    breathWrapper.appendChild(img);
                });
                
                const sweatData = [
                    { left: '57%', top: '23%', delay: 1800, dur: 2800 },
                    { left: '64%', top: '28%', delay: 2500, dur: 2200 },
                    { left: '53%', top: '26%', delay: 3500, dur: 1800 },
                    { left: '62%', top: '35%', delay: 4200, dur: 1200 }
                ];
                sweatData.forEach(pos => {
                    const sweat = document.createElement('div');
                    sweat.className = 'sweat-drop';
                    sweat.style.left = pos.left; sweat.style.top = pos.top;
                    sweat.style.animation = `sweat-trickle ${pos.dur}ms cubic-bezier(0.4, 0, 0.2, 1) ${pos.delay}ms forwards`;
                    breathWrapper.appendChild(sweat);
                });
                
                shakeWrapper.appendChild(breathWrapper);
                hostCinematic.appendChild(shakeWrapper);
                void hostCinematic.offsetWidth;
                hostCinematic.classList.add('cinematic-zoom');
                if(cinematicVignette) cinematicVignette.style.opacity = '1';
                
                let currentFrame = 0;
                const totalFrames = pose.frames.length;
                const timePerFrame = 5000 / (totalFrames - 1);
                window.cinematicInterval = setInterval(() => {
                    currentFrame++;
                    if (currentFrame >= totalFrames) { clearInterval(window.cinematicInterval); return; }
                    const imgs = breathWrapper.querySelectorAll('.cinematic-img');
                    if(imgs[currentFrame]) imgs[currentFrame].style.opacity = '1';
                    if(imgs[currentFrame - 1]) {
                        setTimeout(() => { if(imgs[currentFrame - 1]) imgs[currentFrame - 1].style.opacity = '0'; }, 300);
                    }
                }, timePerFrame);
            }
        }
    }, 150);
};

// =========================================================================
// FÁBRICA DE JOGOS E EXPORTAÇÃO
// =========================================================================
window.generateMutantGame = async function (type) {
    var missaoEl = document.getElementById("export-mission-name");
    var missao = missaoEl ? missaoEl.value.trim() : "Missão Brutão";
    var modeEl = document.getElementById("export-mode");
    var mode = modeEl ? modeEl.value : "treino";

    var pool = window.allQuestions;
    if (!pool || pool.length === 0) {
        alert("O Banco está vazio ou não terminou de carregar. Tente novamente."); return;
    }

    var payload = btoa(unescape(encodeURIComponent(JSON.stringify({ missionId: missao, mode: mode, questions: pool }))));
    var url = window.location.href.split("#")[0].split("?")[0] + "#mutant=" + payload;

    if (type === "embed") {
        var iframe = `<iframe src="${url}" width="100%" height="750" style="border:none; border-radius:15px; overflow:hidden;" allowfullscreen></iframe>`;
        var modalExport = document.getElementById("modal-export-game");
        if (modalExport) { modalExport.classList.add("hidden"); modalExport.classList.remove("flex"); }

        var linkInput = document.getElementById("share-link-input");
        if (linkInput) linkInput.value = url;
        var iframeInput = document.getElementById("share-iframe-input");
        if (iframeInput) iframeInput.value = iframe;

        var modalShare = document.getElementById("modal-share");
        if (modalShare) { modalShare.classList.remove("hidden"); modalShare.classList.add("flex"); }
    }
};

window.copyToClipboardFallback = function (text, btnElement) {
    const t = document.createElement("textarea");
    t.value = text; t.style.position = "fixed"; t.style.left = "-9999px";
    document.body.appendChild(t); t.focus(); t.select();
    try {
        document.execCommand("copy");
        if (btnElement) {
            btnElement.innerText = "📋 COPIADO!";
            btnElement.className = "bg-cyan-600 text-white font-bold px-4 py-2 rounded-lg text-xs shrink-0";
        }
    } catch (err) {}
    document.body.removeChild(t);
};

window.downloadBoletimOffline = function (syncHash, studentName) {
    try {
        var content = JSON.stringify({ format: "show-do-brutao-boletim", version: 1, payload: String(syncHash || "") }, null, 2);
        var blob = new Blob([content], { type: "application/json;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        var safeName = String(studentName || "estudante").replace(/[^a-zA-Z0-9À-ÿ_-]+/g, "_");
        link.href = url;
        link.download = "boletim_" + safeName + "_" + new Date().toISOString().split('T')[0] + ".brutao";
        document.body.appendChild(link);
        link.click(); link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (error) {
        if (window.showSystemMessage) window.showSystemMessage("NÃO FOI POSSÍVEL BAIXAR", "Utilize a opção de copiar o link.");
    }
};

window.triggerConfetti = function () {
    const c = document.querySelector(".screen.active [data-confetti-container]") || document.getElementById("confetti-container") || document.getElementById("confetti-container-ranking");
    if (!c) return; c.innerHTML = "";
    const colors = ["#FFDF73", "#D4AF37", "#ffffff", "#3B82F6", "#EF4444"];
    for (let i = 0; i < 100; i++) {
        const p = document.createElement("div"); p.className = "confetti-piece";
        p.style.width = Math.random() * 10 + 5 + "px"; p.style.height = Math.random() * 20 + 10 + "px";
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.left = Math.random() * 100 + "vw"; p.style.top = "-20px"; p.style.opacity = Math.random() + 0.5;
        p.style.transform = `rotate(${Math.random() * 360}deg)`;
        p.style.transition = `top ${Math.random() * 3 + 2}s cubic-bezier(0.25,0.46,0.45,0.94) ${Math.random() * 2}s, transform ${Math.random() * 3 + 2}s linear ${Math.random() * 2}s, opacity ${Math.random() * 3 + 2}s ease-in ${Math.random() * 2}s`;
        c.appendChild(p);
        setTimeout(() => { p.style.top = "120vh"; p.style.transform = `rotate(${Math.random() * 720 + 360}deg)`; p.style.opacity = "0"; }, 50);
    }
};
// --- 1. CONFIGURAÇÕES BASE E UTILITÁRIOS ---
window.APP_CONFIG = Object.freeze({ 
    storagePrefix: 'brutao_', 
    assetsBase: 'https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/' 
});

window.STORAGE_KEYS = Object.freeze({ 
    state: window.APP_CONFIG.storagePrefix + 'premium_state', 
    customQuestions: window.APP_CONFIG.storagePrefix + 'custom_qs', 
    classes: window.APP_CONFIG.storagePrefix + 'classes', 
    reports: window.APP_CONFIG.storagePrefix + 'reports', 
    telemetry: window.APP_CONFIG.storagePrefix + 'telemetry', 
    lgpd: window.APP_CONFIG.storagePrefix + 'lgpd_accepted',
    missions: window.APP_CONFIG.storagePrefix + 'missions' 
});

window.el = function(id) { return document.getElementById(id); };
window.qs = function(selector, scope = document) { return scope.querySelector(selector); };
window.qsa = function(selector, scope = document) { return scope.querySelectorAll(selector); };
window.ce = function(tagName) { return document.createElement(tagName); };
window.asset = function(fileName) { return window.APP_CONFIG.assetsBase + fileName; };

window.readJSONKey = function(key, fallback) { 
    try { 
        const raw = localStorage.getItem(key); 
        return raw ? JSON.parse(raw) : fallback; 
    } catch (err) { 
        return fallback; 
    } 
};

window.writeJSONKey = function(key, value) { 
    try { 
        localStorage.setItem(key, JSON.stringify(value)); 
        return true; 
    } catch (err) { 
        return false; 
    } 
};

window.removeStorageKey = function(key) { 
    try { localStorage.removeItem(key); } catch (err) {} 
};

window.copyToClipboardFallback = function(text, btnElement) { 
    const t = window.ce("textarea"); 
    t.value = text; 
    t.style.position = "fixed"; 
    t.style.left = "-9999px"; 
    document.body.appendChild(t); 
    t.focus(); 
    t.select(); 
    try { 
        document.execCommand('copy'); 
        if(btnElement) { 
            btnElement.innerText = '📋 COPIADO!'; 
            btnElement.className = 'bg-cyan-600 text-white font-bold px-4 py-2 rounded-lg text-xs shrink-0'; 
        } 
    } catch (err) {} 
    document.body.removeChild(t); 
};

window.normalizeImageUrl = function(url) { 
    if(!url) return ""; 
    let clean = url.trim(); 
    let m = clean.match(new RegExp("/file/d/([a-zA-Z0-9_-]+)")); 
    if(m) return "https://drive.google.com/uc?export=view&id=" + m[1]; 
    if(clean.includes('dropbox.com') && clean.endsWith('dl=0')) return clean.replace('dl=0', 'raw=1'); 
    return clean; 
};

// --- 2. VARIÁVEIS GLOBAIS DE ESTADO ---
window.allQuestions = []; 
window.allTurmas = []; 
window.allMissions = [];
window.activeTurmaId = null;
window.activeMissionId = null;
window.activeQuestions = []; 
window.globalQuestionIndex = 0; 
window.teams = []; 
window.currentTeamIndex = 0;
window.gameMode = 'single'; 
window.isStudentMode = false; 
window.timeLeft = 30; 
window.timerInterval = null;
window.isWaitingAnswer = false; 
window.pendingAnswerIndex = null; 
window.pendingButtonElement = null;
window.answerHistory = []; 
window.editingQuestionId = null; 
window.questionToDeleteId = null; 
window.isMuted = false;
window.typeWriterTimeout = null; 
window.tensionFlashesInterval = null; 
window.spriteInterval = null; 
window.cinematicInterval = null;
window.dragCounter = 0;
window.isIntroSkipped = false;
window.pendingFeedbackType = null;
window.questionStartTime = null;
window.isAudioPlaying = false;
window.audioTimeout = null;
window.lastAnsweredQuestion = null;
window.pendingSyncData = null;

window.brutusPoses = { 
    normal: { type: 'img', src: window.asset("BRUTUS_APRESENTA%C3%87%C3%83O%20INICIAL.png") }, 
    pensativo: { type: 'img', src: window.asset("BRUTUS_PARTICIPANTE_AGUARDANDO%20A%20PERGUNTA.png") }, 
    tenso_cinematic: { 
        type: 'cinematic', 
        frames: [
            window.asset("FRAME%202.svg"), window.asset("FRAME%203.svg"), window.asset("FRAME%204.svg"), 
            window.asset("FRAME%205.svg"), window.asset("FRAME%206.svg"), window.asset("FRAME%207.svg"), 
            window.asset("FRAME%208.svg"), window.asset("FRAME%209.svg"), window.asset("FRAME%2010.svg"), 
            window.asset("FRAME%2011.svg")
        ] 
    }, 
    acerto: { type: 'img', src: window.asset("BRUTUS%20ACERTOU.png") }, 
    erro: { type: 'img', src: window.asset("BRUTUS%20ERROU.png") }, 
    consolando: { type: 'img', src: window.asset("BRUT%C3%83O%20CONSOLANDO%20O%20PARTICIPANTE.png") } 
};

window.awards = ["1 MIL", "2 MIL", "3 MIL", "4 MIL", "5 MIL", "10 MIL", "20 MIL", "30 MIL", "40 MIL", "50 MIL", "100 MIL", "200 MIL", "300 MIL", "400 MIL", "500 MIL", "1 MILHÃO"];
window.loseAwards = ["0", "500", "1 MIL", "1.5 MIL", "2 MIL", "2.5 MIL", "5 MIL", "10 MIL", "15 MIL", "20 MIL", "25 MIL", "50 MIL", "100 MIL", "150 MIL", "200 MIL", "0"];

window.audioSystem = {
    abertura: new Audio(window.asset("abertura.mp3")), suspense: new Audio(window.asset("BACKGROUND%20MUSIC%20SUSPENSE.mp3")), 
    pergunta: new Audio(window.asset("pergunta.mp3")), certeza: new Audio(window.asset("coracao-batendo.mp3")), 
    certa: new Audio(window.asset("ACERTO.mp3")), errou: new Audio(window.asset("PERDEU.mp3")), 
    parou: new Audio(window.asset("parou.mp3")), vitoria: new Audio(window.asset("vitoria.mp3")), 
    eliminar: new Audio(window.asset("CARTA%20DA%20SORTE%20AJUDA.mp3")), plateia: new Audio(window.asset("plateia.mp3")), 
    dica: new Audio(window.asset("dica.mp3")), pular_efeito: new Audio(window.asset("pular_efeito.mp3")), 
    voice_setup: new Audio(window.asset("tela%20de%20Configura%C3%A7%C3%A3o.mp3")), voice_comecar: new Audio(window.asset("(Bot%C3%A3o%20Come%C3%A7ar).mp3")), 
    voice_pergunta: new Audio(window.asset("pergunta%20na%20tela.mp3")), voice_proxima: new Audio(window.asset("pr%C3%B3xima%20nova%20pergunta.mp3")), 
    voice_certeza: new Audio(window.asset("Voc%C3%AA%20est%C3%A1%20certo%20disso.mp3")), voice_posso: new Audio(window.asset("Posso%20confirmar.mp3")), 
    voice_errou: new Audio(window.asset("Errou%20a%20resposta.mp3")), voice_acerto: new Audio(window.asset("Certa%20resposta.mp3")), 
    voice_ajudas: new Audio(window.asset("aba%20de%20Ajudas.mp3")), voice_sem_pulos: new Audio(window.asset("Sem%20pulos%20restantes.mp3")), 
    voice_vai_parar: new Audio(window.asset("Vai%20Parar.mp3")), voice_confirmou_parar: new Audio(window.asset("Confirmou%20que%20vai%20Parar%20(Fim%20de%20Jogo.mp3")), 
    voice_cancelou_parar: new Audio(window.asset("Cancelou%20o%20Parar%20(Voltou%20pro%20jogo.mp3")), voice_tempo1: new Audio(window.asset("Cron%C3%B4metro%20zerou%2001.mp3")), 
    voice_tempo2: new Audio(window.asset("Cron%C3%B4metro%20zerou%2002.mp3")),
    play: function(sound, loop = false) { 
        try { 
            if(!this[sound]) return; 
            if(sound.startsWith('voice_')) { 
                Object.keys(this).forEach(k => { 
                    if(k.startsWith('voice_') && k !== sound && typeof this[k] !== 'function') this.stop(k); 
                }); 
            } 
            this[sound].loop = loop; 
            this[sound].currentTime = 0; 
            this[sound].play().catch(e=>{}); 
        } catch(e) {} 
    },
    stop: function(sound) { 
        try { 
            if(!this[sound]) return; 
            this[sound].pause(); 
            this[sound].currentTime = 0; 
        } catch(e) {} 
    },
    stopAll: function() { 
        Object.keys(this).forEach(k => { 
            if (typeof this[k] !== 'function') this.stop(k); 
        }); 
    }
};
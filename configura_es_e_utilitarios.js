// --- CONFIGURAÇÕES BASE ---
window.APP_CONFIG = Object.freeze({
    storagePrefix: 'brutao_',
    assetsBase: 'https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/'
});

window.STORAGE_KEYS = Object.freeze({
    state: `${window.APP_CONFIG.storagePrefix}premium_state`,
    customQuestions: `${window.APP_CONFIG.storagePrefix}custom_qs`,
    classes: `${window.APP_CONFIG.storagePrefix}classes`,
    reports: `${window.APP_CONFIG.storagePrefix}reports`,
    telemetry: `${window.APP_CONFIG.storagePrefix}telemetry`,
    lgpd: `${window.APP_CONFIG.storagePrefix}lgpd_accepted`
});

// --- FUNÇÕES UTILITÁRIAS GLOBAIS BLINDADAS ---
window.el = function(id) { return document.getElementById(id); };
window.qs = function(selector, scope = document) { return scope.querySelector(selector); };
window.qsa = function(selector, scope = document) { return scope.querySelectorAll(selector); };
window.ce = function(tagName) { return document.createElement(tagName); };
window.asset = function(fileName) { return `${window.APP_CONFIG.assetsBase}${fileName}`; };

window.readJSONKey = function(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
        console.warn('Storage local inválido, usando fallback seguro:', key, err);
        return fallback;
    }
};

window.writeJSONKey = function(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (err) {
        console.warn('Falha ao salvar no storage local:', key, err);
        return false;
    }
};

window.removeStorageKey = function(key) {
    try { localStorage.removeItem(key); } catch (err) { console.warn('Falha ao remover storage local:', key, err); }
};

window.copyToClipboardFallback = function(text, btnElement) { 
    const t = window.ce("textarea"); t.value = text; t.style.position = "fixed"; t.style.left = "-9999px"; 
    document.body.appendChild(t); t.focus(); t.select(); 
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
    let clean=url.trim(); 
    let m=clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/); 
    if(m) return `https://drive.google.com/uc?export=view&id=${m[1]}`; 
    if(clean.includes('dropbox.com') && clean.endsWith('dl=0')) return clean.replace('dl=0', 'raw=1'); 
    return clean; 
};

// --- VARIÁVEIS DE ESTADO GLOBAL ---
var allQuestions = []; 
var allTurmas = []; 
var activeTurmaId = null;
var activeQuestions = []; 
var globalQuestionIndex = 0; 
var teams = []; 
var currentTeamIndex = 0;
var gameMode = 'single'; 
var isStudentMode = false; 
var timeLeft = 30; 
var timerInterval;
var isWaitingAnswer = false; 
var pendingAnswerIndex = null; 
var pendingButtonElement = null;
var answerHistory = []; 
var editingQuestionId = null; 
var questionToDeleteId = null; 
window.isMuted = false;
var typeWriterTimeout = null; 
var tensionFlashesInterval = null; 
var spriteInterval = null; 
var cinematicInterval = null;
var dragCounter = 0;
window.isIntroSkipped = false;
window.pendingFeedbackType = null;
window.questionStartTime = null;
window.isAudioPlaying = false;
window.audioTimeout = null;
window.lastAnsweredQuestion = null;
window.pendingSyncData = null;

var brutusPoses = { 
    normal: { type: 'img', src: "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BRUTUS_APRESENTA%C3%87%C3%83O%20INICIAL.png" }, 
    pensativo: { type: 'img', src: "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BRUTUS_PARTICIPANTE_AGUARDANDO%20A%20PERGUNTA.png" }, 
    tenso_cinematic: { 
        type: 'cinematic', 
        frames: [
            "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/FRAME%202.svg",
            "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/FRAME%203.svg",
            "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/FRAME%204.svg",
            "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/FRAME%205.svg",
            "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/FRAME%206.svg",
            "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/FRAME%207.svg",
            "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/FRAME%208.svg",
            "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/FRAME%209.svg",
            "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/FRAME%2010.svg",
            "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/FRAME%2011.svg"
        ] 
    }, 
    acerto: { type: 'img', src: "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BRUTUS%20ACERTOU.png" }, 
    erro: { type: 'img', src: "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BRUTUS%20ERROU.png" }, 
    consolando: { type: 'img', src: "https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BRUT%C3%83O%20CONSOLANDO%20O%20PARTICIPANTE.png" } 
};

var awards = ["1 MIL", "2 MIL", "3 MIL", "4 MIL", "5 MIL", "10 MIL", "20 MIL", "30 MIL", "40 MIL", "50 MIL", "100 MIL", "200 MIL", "300 MIL", "400 MIL", "500 MIL", "1 MILHÃO"];
var loseAwards = ["0", "500", "1 MIL", "1.5 MIL", "2 MIL", "2.5 MIL", "5 MIL", "10 MIL", "15 MIL", "20 MIL", "25 MIL", "50 MIL", "100 MIL", "150 MIL", "200 MIL", "0"];

var audioSystem = {
    abertura: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/abertura.mp3"),
    suspense: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/BACKGROUND%20MUSIC%20SUSPENSE.mp3"),
    pergunta: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/pergunta.mp3"),
    certeza: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/coracao-batendo.mp3"),
    certa: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/ACERTO.mp3"),
    errou: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/PERDEU.mp3"),
    parou: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/parou.mp3"),
    vitoria: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/vitoria.mp3"),
    eliminar: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/CARTA%20DA%20SORTE%20AJUDA.mp3"),
    plateia: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/plateia.mp3"),
    dica: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/dica.mp3"),
    pular_efeito: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/pular_efeito.mp3"),
    voice_setup: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/tela%20de%20Configura%C3%A7%C3%A3o.mp3"),
    voice_comecar: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/(Bot%C3%A3o%20Come%C3%A7ar).mp3"),
    voice_pergunta: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/pergunta%20na%20tela.mp3"),
    voice_proxima: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/pr%C3%B3xima%20nova%20pergunta.mp3"),
    voice_certeza: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/Voc%C3%AA%20est%C3%A1%20certo%20disso.mp3"),
    voice_posso: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/Posso%20confirmar.mp3"),
    voice_errou: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/Errou%20a%20resposta.mp3"),
    voice_acerto: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/Certa%20resposta.mp3"),
    voice_ajudas: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/aba%20de%20Ajudas.mp3"),
    voice_sem_pulos: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/Sem%20pulos%20restantes.mp3"),
    voice_vai_parar: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/Vai%20Parar.mp3"),
    voice_confirmou_parar: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/Confirmou%20que%20vai%20Parar%20(Fim%20de%20Jogo.mp3"),
    voice_cancelou_parar: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/Cancelou%20o%20Parar%20(Voltou%20pro%20jogo.mp3"),
    voice_tempo1: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/Cron%C3%B4metro%20zerou%2001.mp3"),
    voice_tempo2: new Audio("https://raw.githubusercontent.com/augustoborges-ship-it/SHOW-DO-BRUT-O/main/Cron%C3%B4metro%20zerou%2002.mp3"),
    play: function(sound, loop = false) { try { if(!this[sound]) return; if(sound.startsWith('voice_')) { Object.keys(this).forEach(k => { if(k.startsWith('voice_') && k !== sound && typeof this[k] !== 'function') this.stop(k); }); } this[sound].loop = loop; this[sound].currentTime = 0; this[sound].play().catch(e=>{}); } catch(e) {} },
    stop: function(sound) { try { if(!this[sound]) return; this[sound].pause(); this[sound].currentTime = 0; } catch(e) {} },
    stopAll: function() { Object.keys(this).forEach(k => { if (typeof this[k] !== 'function') this.stop(k); }); }
};
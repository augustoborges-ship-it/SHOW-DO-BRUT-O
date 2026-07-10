// =========================================================================
// Arquivo: inicializa_o_e_controladores_principais.js
// Função: Central de Controle, Inicialização Sequencial e Autenticação
// =========================================================================

console.log("🚀 [Core] Sistema Operacional ativado. Iniciando módulos...");

window.PIN_ACESSO_PRO = "1234";

// 1. GESTOR DE AUTENTICAÇÃO
window.authProf = function() {
    var inputSenha = document.getElementById("prof-pin-input");
    if (!inputSenha) return;

    if (inputSenha.value === window.PIN_ACESSO_PRO) {
        inputSenha.value = "";
        var modal = document.getElementById("modal-prof-login");
        if (modal) {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
        }

        var lgpdKey = window.STORAGE_KEYS ? window.STORAGE_KEYS.lgpd : "brutao_lgpd_accepted";
        if (!localStorage.getItem(lgpdKey)) {
            var lgpdModal = document.getElementById("modal-lgpd");
            if (lgpdModal) {
                lgpdModal.classList.remove("hidden");
                lgpdModal.classList.add("flex");
            }
        } else {
            document.querySelectorAll(".screen").forEach(s => s.classList.remove("active", "flex"));
            var dash = document.getElementById("screen-prof-dashboard");
            if (dash) dash.classList.add("active");
            
            if (typeof window.updateInterfaceContext === "function") window.updateInterfaceContext("screen-prof-dashboard");
            if (window.audioSystem && window.audioSystem.play) window.audioSystem.play("abertura");
            if (typeof window.checkReportsInbox === "function") window.checkReportsInbox();
        }
    } else {
        var err = document.getElementById("login-error");
        if (err) {
            err.classList.remove("hidden");
            err.style.animation = "none";
            setTimeout(function () { err.style.animation = ""; }, 10);
        }
    }
};

// 2. CONVERSOR DO BANCO DE DADOS (INQUEBRÁVEL)
window.initGameData = function() {
    try {
        console.log("⚙️ [Core] Mapeando Banco de Questões...");
        if (typeof window.initTurmasData === "function") window.initTurmasData();

        // Modo Embedded / Link Mágico
        var mHash = window.location.hash.startsWith("#mutant=") ? window.location.hash.substring(8) : null;
        if (mHash || window.__MUTANT) {
            var data = mHash || window.__MUTANT;
            try {
                var p = JSON.parse(decodeURIComponent(escape(atob(data))));
                window.CURRENT_MISSION_ID = p.missionId;
                window.allQuestions = p.questions;
                console.log("✅ [Core] Missão Personalizada carregada com sucesso.");
                return;
            } catch (e) { console.error("Falha ao decodificar a Missão:", e); }
        }

        // Leitura do Banco Global
        var rawBank = window.BANCO_BRUTAO_GLOBAL;
        if (!rawBank || !Array.isArray(rawBank) || rawBank.length === 0) {
            console.error("🚨 ERRO CRÍTICO: O arquivo motor_do_banco_de_questoes.js não contém o array window.BANCO_BRUTAO_GLOBAL ou o arquivo quebrou.");
            rawBank = [{
                id: "SISTEMA_01", disciplina: "Geral", ano: "Geral", nivel: "Básico",
                pergunta: "Houve uma falha crítica ao ler o seu arquivo JSON de 2.000 questões (provavelmente uma vírgula ou aspas faltando). O sistema acionou a defesa para não travar a tela. Conserte o arquivo motor_do_banco_de_questoes.js. Quanto é 2+2?",
                alternativas: ["1", "2", "4", "8"], correta: 2, justificativa_gabarito: "Fallback automático acionado."
            }];
        }

        window.allQuestions = rawBank.map(function (q, index) {
            let anoSeguro = String(q.ano || "Geral").trim();
            if (anoSeguro !== "Geral" && !anoSeguro.toLowerCase().includes("ano")) anoSeguro += "º Ano";

            let altArray = ["", "", "", ""];
            if (Array.isArray(q.alternativas)) {
                altArray = [String(q.alternativas[0]||""), String(q.alternativas[1]||""), String(q.alternativas[2]||""), String(q.alternativas[3]||"")];
            } else if (q.alternativas && typeof q.alternativas === "object") {
                altArray = [String(q.alternativas.A||q.alternativas.a||""), String(q.alternativas.B||q.alternativas.b||""), String(q.alternativas.C||q.alternativas.c||""), String(q.alternativas.D||q.alternativas.d||"")];
            }

            let ansIdx = 0;
            let resp = q.resposta_correta ?? q.gabarito_letra ?? q.gabarito ?? q.correta ?? 0;
            if (typeof resp === "string") {
                let limpa = resp.trim().toUpperCase();
                let mapLetra = { A: 0, B: 1, C: 2, D: 3 };
                if (mapLetra[limpa] !== undefined) ansIdx = mapLetra[limpa];
                else { let n = parseInt(limpa, 10); if (!isNaN(n)) ansIdx = n >= 0 && n <= 3 ? n : 0; }
            } else if (typeof resp === "number") {
                ansIdx = resp >= 0 && resp <= 3 ? resp : 0;
            }

            let comp = String(q.disciplina || q.componente || "Geral");
            let prof = String(q.nivel || q.nivel_proficiencia || q.grau_interno || "Básico");

            return {
                id: String(q.id || `GLOBAL_${index}`),
                text: String(q.pergunta || q.enunciado || "Sem enunciado"),
                category: `${comp} • ${anoSeguro} • Proficiência: ${prof}`,
                componente: comp.toLowerCase(),
                ano: anoSeguro.toLowerCase(),
                proficiencia: prof.toLowerCase(),
                options: altArray,
                answer: ansIdx,
                explicacao: String(q.justificativa_gabarito || q.explicacao || q.feedback_correto || ""),
                image_url: q.imagem || q.image_url || null,
                bncc: String(q.habilidade_bncc_codigo_referencial || q.bncc || "N/A"),
                isCustom: false,
            };
        });

        // Junta Banco Customizado (se existir)
        if (typeof window.readJSONKey === "function" && window.STORAGE_KEYS) {
            let customQs = window.readJSONKey(window.STORAGE_KEYS.customQuestions, []);
            if (Array.isArray(customQs)) window.allQuestions = window.allQuestions.concat(customQs);
        }
        console.log(`✅ [Core] SUCESSO! ${window.allQuestions.length} questões na RAM prontas.`);
    } catch (e) {
        console.error("🚨 Falha fatal ao mapear o banco:", e);
        window.allQuestions = [];
    }
};

// 3. LISTENERS SEGUROS DE DOM E UI
document.addEventListener("DOMContentLoaded", function () {
    // Tenta inicializar os dados assim que o DOM carregar
    if (typeof window.initGameData === "function") window.initGameData();
    
    // Mostra o botão "Retomar" se houver partida em cache
    var resume = document.getElementById("btn-resume-home");
    try {
        var st = (window.STORAGE_KEYS && window.readJSONKey) ? window.readJSONKey(window.STORAGE_KEYS.state, null) : null;
        if (resume && st && Array.isArray(st.activeQuestions) && st.activeQuestions.length) resume.classList.remove("hidden");
    } catch (e) {}

    // Escuta a dificuldade do Modo Aluno diretamente no HTML Visual
    document.body.addEventListener("change", function (e) {
        if (e.target && e.target.name === "student-diff") {
            window.dificuldadeModoTreino = e.target.value.toLowerCase();
            // Lida com o design dos botões se precisar (seu CSS Tailwind cuida do resto via peer-checked)
        }
    });
});

// A Rota Principal (Sem Adivinhações de Cliques)
window.startStudentGameSafe = function () {
    if (!window.allQuestions || window.allQuestions.length === 0) {
        if (typeof window.initGameData === "function") window.initGameData();
    }
    if (typeof window.startStudentGame === "function") window.startStudentGame();
    else alert("Erro fatal: A lógica principal do jogo não foi carregada no navegador.");
};
console.log("✅ SUCESSO: O arquivo motor_do_banco_de_questoes.js foi lido pelo navegador!");

window.BANCO_BRUTAO_GLOBAL = [
    // =========================================================================
    // MESTRE, COLE AS SUAS 2.000 QUESTÕES AQUI ABAIXO!
    // (Pode apagar esta questão de teste quando for colar as suas)
    // =========================================================================
    {
        "id": "QUESTAO_TESTE_BLINDADA",
        "disciplina": "Matemática",
        "ano": "5º Ano",
        "nivel": "Básico",
        "pergunta": "Se você está lendo isso, o motor conectou o arquivo de 7MB com sucesso! Quanto é 10 + 10?",
        "alternativas": ["10", "20", "30", "40"],
        "correta": 1,
        "justificativa_gabarito": "O motor está funcionando!"
    }
    // =========================================================================
];

console.log("✅ FIM DA LEITURA: " + window.BANCO_BRUTAO_GLOBAL.length + " questões injetadas na variável global.");
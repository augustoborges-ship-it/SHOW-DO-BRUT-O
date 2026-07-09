// =========================================================================
// O GRANDE COFRE DE QUESTÕES (BANCO GLOBAL DO SHOW DO BRUTÃO)
// =========================================================================
console.log("✅ [Motor de Banco] Iniciando a leitura do arquivo massivo...");

window.BANCO_BRUTAO_GLOBAL = [
  // =========================================================================
  // MESTRE: COLE AS SUAS 2.000 QUESTÕES AQUI ABAIXO!
  // (Pode apagar estas duas questões de teste quando for colar as suas)
  // =========================================================================
  {
    "id": "MAT_01_BAS_B1_0001",
    "disciplina": "Matemática",
    "ano": "1º ano",
    "nivel": "Básico",
    "grau_interno": "B1",
    "pergunta": "Observe a imagem com bolinhas. Há 7 bolinhas ao todo. Qual número representa essa quantidade?",
    "alternativas": { "A": "5", "B": "6", "C": "7", "D": "8" },
    "correta": 2,
    "gabarito_letra": "C",
    "justificativa_gabarito": "A alternativa C está correta.",
    "bncc": "EF01MA01 / EF01MA03",
    "imagem": "MAT_01_BAS_B1_0001.png"
  },
  {
    "id": "MAT_09_AVAN_AV3_0427",
    "disciplina": "Matemática",
    "ano": "9º ano",
    "nivel": "Avançado",
    "grau_interno": "A3",
    "pergunta": "Um jogo educativo custa R$ 164,00 e está com desconto de 25%. Qual é o valor do desconto?",
    "alternativas": { "A": "R$ 36,00", "B": "R$ 41,00", "C": "R$ 123,00", "D": "R$ 205,00" },
    "correta": 1,
    "gabarito_letra": "B",
    "justificativa_gabarito": "A alternativa B está correta.",
    "bncc": "EF09MA05",
    "imagem": "MAT_09_AVAN_AV3_0427.png"
  }
];

console.log("✅ [Motor de Banco] Leitura concluída! Total injetado: " + window.BANCO_BRUTAO_GLOBAL.length);
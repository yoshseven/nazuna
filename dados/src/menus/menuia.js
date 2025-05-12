/**
 * Menu de Inteligência Artificial
 * @module menuia
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com os comandos de IA
 */
async function menuIa(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭─🌸 *${botName}*
│ Oii, *${userName}*
╰───────────────

╭─🌷 *IAs DE TEXTO* 🌷─
│ Escolha sua opção:
├──────────────┤
│ *${prefix}nazu*
│    → Conversar com Nazu
│ *${prefix}gpt*
│    → Usar ChatGPT
│ *${prefix}gpt4*
│    → Usar GPT-4
│ *${prefix}llama*
│    → Usar LLaMA
│ *${prefix}llama3*
│    → Usar LLaMA 3
│ *${prefix}cognimai* ou *${prefix}cog*
│    → Usar CognimAI
│ *${prefix}qwen*
│    → Usar Qwen
│ *${prefix}gemma*
│    → Usar Gemma
│ *${prefix}gecko*
│    → Usar Gecko
╰──────────────╯

╭─🌷 *IAs DE IMAGEM* 🌷─
│ Escolha sua opção:
├──────────────┤
│ *${prefix}imagine*
│    → Gerar imagens com IA
╰──────────────╯

╭─🌷 *IAs DE FERRAMENTAS* 🌷
│ Escolha sua opção:
├──────────────┤
│ *${prefix}code-gen*
│    → Gerar código com IA
╰──────────────╯
`;
}

module.exports = menuIa;

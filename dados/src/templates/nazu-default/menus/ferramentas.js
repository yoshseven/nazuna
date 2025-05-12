/**
 * Menu de ferramentas utilitárias
 * @module ferramentas
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com comandos de ferramentas
 * @description Lista todas as ferramentas utilitárias disponíveis,
 * incluindo geração de nicks, captura de tela, upload de arquivos e encurtador de links
 */
async function menuFerramentas(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭─🌸 *${botName}*
│ Oii, *${userName}*
╰───────────────

╭─🌷 *FERRAMENTAS* 🌷─
│ Escolha sua opção: 
├──────────────┤
│ *${prefix}gerarnick* ou *${prefix}nick*
│    → Criar nicks personalizados
│ *${prefix}ssweb*
│    → Capturar tela de sites
│ *${prefix}upload*
│    → Fazer upload de arquivos
│ *${prefix}encurtalink*
│    → Encurtar links
╰──────────────╯
`;
}

module.exports = menuFerramentas;

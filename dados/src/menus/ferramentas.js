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
╭═══ 🌸 *${botName}* 🌸 ═══╮
│ Olá, *${userName}*!
╰══════════════════════╯

╭═══ 🛠️ *FERRAMENTAS* 🛠️ ═══╮
│
│╭─▸ *Comandos:*
││
││◕⁠➜ ${prefix}gerarnick / ${prefix}nick
││    ↳ Criar nicks personalizados
││◕⁠➜ ${prefix}ssweb
││    ↳ Capturar tela de sites
││◕⁠➜ ${prefix}upload
││    ↳ Fazer upload de arquivos
││◕⁠➜ ${prefix}encurtalink
││    ↳ Encurtar links
││◕⁠➜ ${prefix}qrcode
││    ↳ Gerar qr-code
││◕⁠➜ ${prefix}tradutor
││    ↳ Traduzir textos
││◕⁠➜ ${prefix}dicionario
││    ↳ Significado de uma palavra
│
╰══════════════════════╯
`;
}

module.exports = menuFerramentas;

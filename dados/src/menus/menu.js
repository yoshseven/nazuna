/**
 * Menu principal do bot que lista todos os submenus disponíveis
 * @module menu
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com lista de submenus
 */
async function menu(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭═══ 🌸 *${botName}* 🌸 ═══╮
│ Olá, *${userName}*!
╰══════════════════════╯

╭═══ 📖 *MENU PRINCIPAL* 📖 ═══╮
│
│╭─▸ *Submenus Disponíveis:*
││
││🤖 ${prefix}menuia
││  ↳ Inteligência Artificial
││📥 ${prefix}menudown
││  ↳ Baixar vídeos e músicas
││🛠️ ${prefix}menuadm
││  ↳ Gerenciar o grupo
││🎭 ${prefix}menubn
││  ↳ Jogos e brincadeiras
││👑 ${prefix}menudono
││  ↳ Comandos do dono
││🌟 ${prefix}menumemb
││  ↳ Para todos os membros
││⚒️ ${prefix}ferramentas
││  ↳ Ferramentas úteis
││💫 ${prefix}menufig
││  ↳ Criar figurinhas
││🎵 ${prefix}alteradores
││  ↳ Efeitos Audio/Video
││💡 ${prefix}menurpg
││  ↳ Aventura e diversão RPG
││🎨 ${prefix}menulogos (Novo!)
││  ↳ Logos e efeitos de texto
│
╰══════════════════════╯
`;
}

module.exports = menu;

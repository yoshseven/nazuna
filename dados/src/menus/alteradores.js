/**
 * Menu de downloads e pesquisas de mídia
 * @module menudown
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com comandos de download
 */
async function menudown(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭═══ 🌸 *${botName}* 🌸 ═══╮
│ Olá, *${userName}*!
╰══════════════════════╯

╭═══ 🎵 *ALTERADORES* 📼 ═══╮
│
│  ╭─▸ *Alteradores de video:*
│  │
│  │  \`${prefix}play\`
│  │  \`${prefix}videorapido\`
│  │  \`${prefix}fastvid\`
│  │  \`${prefix}videoslow\`
│  │  \`${prefix}videolento\`
│  │  \`${prefix}videoreverso\`
│  │  \`${prefix}videoloop\`
│  │  \`${prefix}videomudo\`
│  │  \`${prefix}videobw\`
│  │  \`${prefix}pretoebranco\`
│  │  \`${prefix}tomp3\`
│  │  \`${prefix}sepia\`
│  │  \`${prefix}espelhar\`
│  │  \`${prefix}rotacionar\`
│
│  ╭─▸ *Alteradores de audio:*
│  │
│  │  \`${prefix}tiktok\`
│
╰═══════════════════════════════╯
`;
}

module.exports = menudown;

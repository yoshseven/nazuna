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

╭═══ 📥 *DOWNLOADS E PESQUISAS* 📥 ═══╮
│
│╭─▸ *Pesquisas de Mídia:*
││
││◕⁠➜ ${prefix}letra
││    ↳ Buscar letras de musicas
││◕⁠➜ ${prefix}play
││    ↳ Baixar música do YouTube
││◕⁠➜ ${prefix}playvid
││    ↳ Baixar vídeo do YouTube
││◕⁠➜ ${prefix}assistir
││    ↳ Pesquisar filmes para assistir
││◕⁠➜ ${prefix}mcplugin
││    ↳ Buscar plugins de Minecraft
││◕⁠➜ ${prefix}apkmod / ${prefix}mod
││    ↳ Buscar APKs modificados
││◕⁠➜ ${prefix}clima
││    ↳ Pesquisar clima de uma cidade
││◕⁠➜ ${prefix}dicionario
││    ↳ Significado de uma palavra
││◕⁠➜ ${prefix}wikipedia
││    ↳ Fazer pesquisa no wikipedia
│
│╭─▸ *Downloads Diretos:*
││
││◕⁠➜ ${prefix}tiktok / ${prefix}ttk
││    ↳ Baixar vídeos do TikTok
││◕⁠➜ ${prefix}pinterest / ${prefix}pin
││    ↳ Baixar do Pinterest
││◕⁠➜ ${prefix}instagram / ${prefix}ig
││    ↳ Baixar do Instagram
││◕⁠➜ ${prefix}igstory
││    ↳ Baixar story do Instagram
│
╰══════════════════════╯
`;
}

module.exports = menudown;

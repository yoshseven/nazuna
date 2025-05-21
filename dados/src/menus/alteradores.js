/**
 * Menu de downloads e pesquisas de mídia
 * @module menudown
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com comandos de download
 */
async function menuAlterador(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭═══ 🌸 *${botName}* 🌸 ═══╮
│ Olá, *${userName}*!
╰══════════════════════╯

╭═══ 🎵 *ALTERADORES* 📼 ═══╮
│
│╭─▸ *Alteradores de video:*
││
││◕⁠➜ ${prefix}play
││◕⁠➜ ${prefix}videorapido
││◕⁠➜ ${prefix}fastvid
││◕⁠➜ ${prefix}videoslow
││◕⁠➜ ${prefix}videolento
││◕⁠➜ ${prefix}videoreverso
││◕⁠➜ ${prefix}videoloop
││◕⁠➜ ${prefix}videomudo
││◕⁠➜ ${prefix}videobw
││◕⁠➜ ${prefix}pretoebranco
││◕⁠➜ ${prefix}tomp3
││◕⁠➜ ${prefix}sepia
││◕⁠➜ ${prefix}espelhar
││◕⁠➜ ${prefix}rotacionar
│
│╭─▸ *Alteradores de audio:*
││
││◕⁠➜ ${prefix}speedup
││◕⁠➜ ${prefix}vozmenino
││◕⁠➜ ${prefix}vozmulher
││◕⁠➜ ${prefix}vozhomem
││◕⁠➜ ${prefix}vozcrianca
││◕⁠➜ ${prefix}vozeco
││◕⁠➜ ${prefix}eco
││◕⁠➜ ${prefix}vozlenta
││◕⁠➜ ${prefix}audiolento
││◕⁠➜ ${prefix}vozrapida
││◕⁠➜ ${prefix}audiorapido
││◕⁠➜ ${prefix}vozcaverna
││◕⁠➜ ${prefix}bass
││◕⁠➜ ${prefix}bass2
││◕⁠➜ ${prefix}bass3
││◕⁠➜ ${prefix}volumeboost
││◕⁠➜ ${prefix}aumentarvolume
││◕⁠➜ ${prefix}reverb
││◕⁠➜ ${prefix}drive
││◕⁠➜ ${prefix}equalizer
││◕⁠➜ ${prefix}equalizar
││◕⁠➜ ${prefix}reverse
││◕⁠➜ ${prefix}audioreverso
││◕⁠➜ ${prefix}pitch
││◕⁠➜ ${prefix}flanger
││◕⁠➜ ${prefix}grave
││◕⁠➜ ${prefix}vozgrave
││◕⁠➜ ${prefix}chorus
││◕⁠➜ ${prefix}phaser
││◕⁠➜ ${prefix}tremolo
││◕⁠➜ ${prefix}vibrato
││◕⁠➜ ${prefix}lowpass
│
╰══════════════════════╯
`;
}

module.exports = menuAlterador;

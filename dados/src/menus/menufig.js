/**
 * Menu de criação e manipulação de figurinhas
 * @module menufig
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com comandos de figurinhas
 * @description Lista todos os comandos relacionados a figurinhas,
 * incluindo criação, conversão, renomeação e gerenciamento de stickers
 */
async function menuSticker(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭═══ 🌸 *${botName}* 🌸 ═══╮
│ Olá, *${userName}*!
╰══════════════════════╯

╭═══ ✨ *FIGURINHAS* ✨ ═══╮
│
│  ╭─▸ *Criação de Figurinhas:*
│  │
│  │  \`${prefix}emojimix\`
│  │    ↳ Combinar emojis em figurinhas
│  │  \`${prefix}ttp\`
│  │    ↳ Texto em figurinha
│  │  \`${prefix}sticker\` / \`${prefix}s\`
│  │    ↳ Criar figurinha de mídia
│  │  \`${prefix}qc\`
│  │    ↳ Criar figurinha com citação
│  │  \`${prefix}brat\`
│  │    ↳ Criar figurinha estilo brat
│
│  ╭─▸ *Outros Comandos de Figurinhas:*
│  │
│  │  \`${prefix}figualetoria\`
│  │    ↳ Gerar figurinha aleatória
│  │  \`${prefix}rename\`
│  │    ↳ Renomear figurinha
│  │  \`${prefix}rgtake\`
│  │    ↳ Pegar figurinha registrada
│  │  \`${prefix}take\`
│  │    ↳ Roubar figurinha
│  │  \`${prefix}toimg\`
│  │    ↳ Converter figurinha em imagem
│
╰══════════════════════════╯
`;
}

module.exports = menuSticker;

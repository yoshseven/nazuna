/**
 * Menu de comandos gerais para membros
 * @module menumemb
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com comandos para membros
 * @description Lista todos os comandos disponíveis para membros comuns,
 * incluindo verificação de status, rankings e estatísticas do grupo/bot
 */
async function menuMembros(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭═══ 🌸 *${botName}* 🌸 ═══╮
│ Olá, *${userName}*!
╰══════════════════════╯

╭═══ 🌟 *COMANDOS PARA MEMBROS* 🌟 ═══╮
│
│  ╭─▸ *Informações e Status:*
│  │
│  │  \`${prefix}perfil\`
│  │    ↳ Ver seu perfil
│  │  \`${prefix}dono\`
│  │    ↳ Ver informações do dono
│  │  \`${prefix}criador\`
│  │    ↳ Ver informações do criador
│  │  \`${prefix}ping\`
│  │    ↳ Verificar status do bot
│  │  \`${prefix}rvisu\`
│  │    ↳ Revelar visualização única
│  │  \`${prefix}totalcmd\`
│  │    ↳ Total de comandos do bot
│  │  \`${prefix}statusgp\`
│  │    ↳ Ver estatísticas do grupo
│  │  \`${prefix}statusbot\`
│  │    ↳ Ver estatísticas globais do bot
│  │  \`${prefix}meustatus\`
│  │    ↳ Ver suas estatísticas pessoais
│
│  ╭─▸ *Configurações Pessoais:*
│  │
│  │  \`${prefix}mention\`
│  │    ↳ Configurar menções
│  │  \`${prefix}afk [motivo?]\`
│  │    ↳ Definir status AFK
│  │  \`${prefix}voltei\`
│  │    ↳ Remover status AFK
│
│  ╭─▸ *Rankings:*
│  │
│  │  \`${prefix}rankativo\`
│  │    ↳ Ver ranking de ativos do grupo
│  │  \`${prefix}rankinativo\`
│  │    ↳ Ver ranking de inativos do grupo
│  │  \`${prefix}rankativog\`
│  │    ↳ Ver ranking global de ativos
│
╰═════════════════════════════════╯
`;
}

module.exports = menuMembros;

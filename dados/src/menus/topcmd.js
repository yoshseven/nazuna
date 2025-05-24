/**
 * Menu que exibe os comandos mais utilizados
 * @module topcmd
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @param {Array} [topCommands=[]] - Lista dos comandos mais utilizados
 * @returns {Promise<string>} Menu formatado com os comandos mais usados
 */
async function menuTopCmd(prefix, botName = "MeuBot", userName = "Usuário", topCommands = []) {
  // Caso não tenha comandos registrados ainda
  if (!topCommands || topCommands.length === 0) {
    return `
╭═══ 🌸 *${botName}* 🌸 ═══╮
│ Olá, *${userName}*!
╰══════════════════════╯

╭═ 📊 *COMANDOS MAIS USADOS* 📊 ═╮
│
│ Nenhum comando foi registrado ainda.
│ Use ${prefix}comandos para ver a lista
│ de comandos disponíveis!
│
╰══════════════════════╯
`;
  }

  // Formata os comandos mais usados
  const commandsList = topCommands
    .map((cmd, index) => {
      const position = index + 1;
      const emoji = position <= 3 ? ['🥇', '🥈', '🥉'][index] : '🏅';
      return `││${emoji} ${position}º: *${prefix}${cmd.name}*\n││   ↳ ${cmd.count} usos por ${cmd.uniqueUsers} usuários`;
    })
    .join('\n│\n');

  return `
╭═══ 🌸 *${botName}* 🌸 ═══╮
│ Olá, *${userName}*!
╰══════════════════════╯

╭═══ 📊 *COMANDOS MAIS USADOS* 📊 ═══╮
│
│╭─▸ *Top ${topCommands.length} Comandos:*
││
${commandsList}
│
│╭─▸ *Informações:*
││
││🔍 Use ${prefix}cmdinfo [comando]
││   ↳ Para ver estatísticas detalhadas
││   ↳ Ex: ${prefix}cmdinfo menu
│
╰══════════════════════╯
`;
}

module.exports = menuTopCmd; 
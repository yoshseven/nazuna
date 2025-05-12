/**
 * Menu de administração de grupo
 * @module menuadm
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com comandos administrativos
 * @description Lista todos os comandos disponíveis para administradores de grupo,
 * incluindo gerenciamento de membros, configurações do grupo e recursos de moderação
 */
async function menuadm(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭─🌸 *${botName}*
│ Oii, *${userName}*
╰───────────────

╭🌷 *ADMINISTRAÇÃO* 🌷─
│ Escolha sua opção: 
├──────────────┤
│ *${prefix}del* ou *${prefix}d*
│    → Deletar mensagens
│ *${prefix}hidetag*
│    → Marcar todos escondido
│ *${prefix}marcar*
│    → Marcar membros
│ *${prefix}ban* ou *${prefix}b*
│    → Banir usuário
│ *${prefix}promover*
│    → Promover a admin
│ *${prefix}rebaixar*
│    → Rebaixar admin
│ *${prefix}mute*
│    → Silenciar grupo
│ *${prefix}desmute*
│    → Desativar silêncio
│ *${prefix}blockcmd*
│    → Bloquear comando
│ *${prefix}unblockcmd*
│    → Desbloquear comando
│ *${prefix}linkgp*
│    → Gerar link do grupo
│ *${prefix}grupo* A/F
│    → Abrir/fechar grupo
│ *${prefix}setname*
│    → Mudar nome do grupo
│ *${prefix}setdesc*
│    → Mudar descrição
│ *${prefix}tttend* ou *${prefix}rv*
│    → Encerrar votação
│ *${prefix}blockuser [usuário] [motivo?]*
│    → Bloquear usuário no grupo
│ *${prefix}unblockuser [usuário]*
│    → Desbloquear usuário no grupo
│ *${prefix}listblocksgp*
│    → Listar bloqueios do grupo
╰──────────────╯

╭──🌷 *ATIVAÇÕES* 🌷──
│ Escolha sua opção: 
├──────────────┤
│ *${prefix}modobn*
│    → Ativar modo boas-novas
│ *${prefix}modonsfw*
│    → Ativar modo NSFW
│ *${prefix}antilinkgp*
│    → Bloquear links
│ *${prefix}antiporn*
│    → Bloquear conteúdo adulto
│ *${prefix}bemvindo* ou *${prefix}bv*
│    → Ativar boas-vindas
│ *${prefix}saida*
│    → Ativar mensagem de saída
│ *${prefix}soadm*
│    → Restringir a admins
╰──────────────╯

╭🌷 *CONFIGURAÇÕES* 🌷─
│ Escolha sua opção: 
├──────────────┤
│ *${prefix}legendasaiu*
│    → Legenda de saída
│ *${prefix}legendabv*
│    → Legenda de boas-vindas
│ *${prefix}fotobv*
│    → Foto de boas-vindas
│ *${prefix}fotosaiu*
│    → Foto de saída
╰──────────────╯
`;
}

module.exports = menuadm;

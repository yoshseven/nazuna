/**
 * Menu de administração de grupo
 * @module menuadm
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @param {boolean} [isLiteMode=false] - Indica se o Modo Lite está ativo
 * @returns {Promise<string>} Menu formatado com comandos administrativos
 * @description Lista todos os comandos disponíveis para administradores de grupo,
 * incluindo gerenciamento de membros, configurações do grupo e recursos de moderação.
 * Filtra comandos inadequados se o Modo Lite estiver ativo.
 */
async function menuadm(prefix, botName = "MeuBot", userName = "Usuário", isLiteMode = false) {
  return `
╭═══ 🌸 *${botName}* 🌸 ═══╮
│ Olá, *${userName}*!
╰══════════════════════╯

╭═══ 🛡️ *ADMINISTRAÇÃO* 🛡️ ═══╮
│
│╭─▸ *Gerenciamento de Usuários:*
││
││◕⁠➜ ${prefix}ban / ${prefix}b
││    ↳ Banir usuário
││◕⁠➜ ${prefix}promover
││    ↳ Promover a admin
││◕⁠➜ ${prefix}rebaixar
││    ↳ Rebaixar admin
││◕⁠➜ ${prefix}mute
││    ↳ Silenciar usuário
││◕⁠➜ ${prefix}desmute
││    ↳ Desmutar usuário
││◕⁠➜ ${prefix}adv [usuário] [motivo?]
││    ↳ Adicionar advertência a usuário
││◕⁠➜ ${prefix}rmadv [usuário]
││    ↳ Remover advertência de usuário
││◕⁠➜ ${prefix}listadv
││    ↳ Listar Advertências
││◕⁠➜ ${prefix}blockuser [usuário] [motivo?]
││    ↳ Bloquear usuário no bot
││◕⁠➜ ${prefix}unblockuser [usuário]
││    ↳ Desbloquear usuário no bot
││◕⁠➜ ${prefix}listblocksgp
││    ↳ Listar bloqueios do grupo
││◕⁠➜ ${prefix}addblacklist [usuário] [motivo?]
││    ↳ Adicionar usuário na blacklist
││◕⁠➜ ${prefix}delblacklist [usuário]
││    ↳ Remover usuário da blacklist
││◕⁠➜ ${prefix}listblacklist
││    ↳ Listar usuários na blacklist
│
│╭─▸ *Gerenciamento do Grupo:*
││
││◕⁠➜ ${prefix}del / ${prefix}d
││    ↳ Deletar mensagens
││◕⁠➜ ${prefix}limpar
││    ↳ Limpar o chat visualmente
││◕⁠➜ ${prefix}hidetag
││    ↳ Marcar todos escondido
││◕⁠➜ ${prefix}marcar
││    ↳ Marcar membros
││◕⁠➜ ${prefix}linkgp
││    ↳ Gerar link do grupo
││◕⁠➜ ${prefix}grupo A/F
││    ↳ Abrir/fechar grupo
││◕⁠➜ ${prefix}setname
││    ↳ Mudar nome do grupo
││◕⁠➜ ${prefix}setdesc
││    ↳ Mudar descrição
││◕⁠➜ ${prefix}addregra [regra]
││    ↳ Adicionar regra ao grupo
││◕⁠➜ ${prefix}delregra [número]
││    ↳ Remover regra do grupo
││◕⁠➜ ${prefix}backupgp
││    ↳ Fazer backup do grupo
││◕⁠➜ ${prefix}restaurargp
││    ↳ Restaurar backup do grupo
│
│╭─▸ *Controle de Comandos do Grupo:*
││
││◕⁠➜ ${prefix}blockcmd
││    ↳ Bloquear comando
││◕⁠➜ ${prefix}unblockcmd
││    ↳ Desbloquear comando
│
│╭─▸ *Moderação Avançada (Moderadores):*
││
││◕⁠➜ ${prefix}addmod
││    ↳ Adicionar moderador
││◕⁠➜ ${prefix}delmod
││    ↳ Remover moderador
││◕⁠➜ ${prefix}listmods
││    ↳ Listar moderadores
││◕⁠➜ ${prefix}grantmodcmd
││    ↳ Permitir cmd para mods
││◕⁠➜ ${prefix}revokemodcmd
││    ↳ Revogar cmd para mods
││◕⁠➜ ${prefix}listmodcmds
││    ↳ Listar cmds de mods
│
│╭─▸ *Recursos e Ativações:*
││
││◕⁠➜ ${prefix}modobn
││    ↳ Ativar modo boas-novas
${!isLiteMode ? `││◕⁠➜ ${prefix}modonsfw` : `││🚫 ${prefix}modonsfw (Lite)`}
${!isLiteMode ? `││    ↳ Ativar modo NSFW` : `││    ↳ (Desativado no Modo Lite)`}
││◕⁠➜ ${prefix}antilinkgp
││    ↳ Bloquear links de grupos
││◕⁠➜ ${prefix}antilinkhard
││    ↳ Bloquear todo tipo de links
${!isLiteMode ? `││◕⁠➜ ${prefix}antiporn` : `││🚫 ${prefix}antiporn (Lite)`}
${!isLiteMode ? `││    ↳ Bloquear conteúdo adulto` : `││    ↳ (Desativado no Modo Lite)`}
││◕⁠➜ ${prefix}modolite
││    ↳ Filtrar conteudo para crianças
││◕⁠➜ ${prefix}bemvindo / ${prefix}bv
││    ↳ Ativar boas-vindas
││◕⁠➜ ${prefix}saida
││    ↳ Ativar mensagem de saída
││◕⁠➜ ${prefix}autosticker
││    ↳ Ativar auto figurinhas
││◕⁠➜ ${prefix}soadm
││    ↳ Restringir bot a admins
││◕⁠➜ ${prefix}x9
││    ↳ x9 de admins
││◕⁠➜ ${prefix}antiflood
││    ↳ Anti flood de comandos
││◕⁠➜ ${prefix}cmdlimit
││    ↳ Limitar comandos diários
││◕⁠➜ ${prefix}antifake
││    ↳ Banir números fake
││◕⁠➜ ${prefix}antipt
││    ↳ Banir números de Portugal
││◕⁠➜ ${prefix}autodl
││    ↳ Sistema de Auto DL
│
│╭─▸ *Configurações de Aparência:*
││
││◕⁠➜ ${prefix}legendasaiu
││    ↳ Legenda de saída
││◕⁠➜ ${prefix}legendabv
││    ↳ Legenda de boas-vindas
││◕⁠➜ ${prefix}fotobv
││    ↳ Foto de boas-vindas
││◕⁠➜ ${prefix}rmfotobv
││    ↳ Remover Foto de boas-vindas
││◕⁠➜ ${prefix}fotosaiu
││    ↳ Foto de saída
││◕⁠➜ ${prefix}rmfotosaiu
││    ↳ Remover Foto de saída
│
╰══════════════════════╯
`;
}

module.exports = menuadm;


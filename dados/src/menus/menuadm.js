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
│    → Silenciar usuário
│ *${prefix}desmute*
│    → Desmutar usuário
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
│    → Encerrar jogo da velha
│ *${prefix}blockuser [usuário] [motivo?]*
│    → Bloquear usuário no bot
│ *${prefix}unblockuser [usuário]*
│    → Desbloquear usuário no bot
│ *${prefix}listblocksgp*
│    → Listar bloqueios do grupo
│ *${prefix}addblacklist [usuário] [motivo?]*
│    → Adicionar usuário na blacklist
│ *${prefix}delblacklist [usuário]*
│    → Remover usuário da blacklist
│ *${prefix}listblacklist*
│    → Listar usuários na blacklist
│ *${prefix}adv [usuário] [motivo?]*
│    → Adicionar advertência a usuário
│ *${prefix}rmadv [usuário]*
│    → Remover advertência de usuário
│ *${prefix}listadv*
│    → Listar Advertências
╰──────────────╯

╭──🌷 *ATIVAÇÕES* 🌷──
│ Escolha sua opção: 
├──────────────┤
│ *${prefix}modobn*
│    → Ativar modo boas-novas
│ *${prefix}modonsfw*
│    → Ativar modo NSFW
│ *${prefix}antilinkgp*
│    → Bloquear links de grupos
│ *${prefix}antilinkhard*
│    → Bloquear todo tipo de links
│ *${prefix}antiporn*
│    → Bloquear conteúdo adulto
│ *${prefix}bemvindo* ou *${prefix}bv*
│    → Ativar boas-vindas
│ *${prefix}saida*
│    → Ativar mensagem de saída
│ *${prefix}autosticker*
│    → Ativar auto figurinhas
│ *${prefix}soadm*
│    → Restringir bot a admins
│ *${prefix}x9*
│    → x9 de admins
│ *${prefix}antiflood*
│    → Anti flood de comandos
│ *${prefix}cmdlimit*
│    → Limitar comandos diários
│ *${prefix}antiloc*
│    → Anti localização
│ *${prefix}antidoc*
│    → Anti documentos
│ *${prefix}antifake*
│    → Banir números fake
│ *${prefix}antipt*
│    → Banir números de Portugal
│ *${prefix}autodl*
│    → Sitema de Auto DL
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
│ *${prefix}rmfotobv*
│    → Remover Foto
│ *${prefix}fotosaiu*
│    → Foto de saída
│ *${prefix}rmfotosaiu*
│    → Remover Foto
╰──────────────╯
`;
}

module.exports = menuadm;

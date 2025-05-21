/**
 * Menu exclusivo para o dono do bot
 * @module menudono
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com comandos do dono
 * @description Lista todos os comandos disponíveis apenas para o dono do bot,
 * incluindo configurações do bot e funções administrativas globais
 */
async function menuDono(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭═══ 🌸 *${botName}* 🌸 ═══╮
│ Olá, *${userName}*! (Dono)
╰══════════════════════╯

╭═══ 👑 *PAINEL DO DONO* 👑 ═══╮
│
│╭─▸ *Configurações do Bot:*
││
││◕⁠➜ ${prefix}prefixo
││    ↳ Mudar prefixo do bot
││◕⁠➜ ${prefix}numerodono
││    ↳ Definir número do dono
││◕⁠➜ ${prefix}nomedono
││    ↳ Alterar nome do dono
││◕⁠➜ ${prefix}nomebot
││    ↳ Mudar nome do bot
││◕⁠➜ ${prefix}fotomenu
││    ↳ Configurar foto do menu
││◕⁠➜ ${prefix}videomenu
││    ↳ Configurar vídeo do menu
│
│╭─▸ *Funções Administrativas Globais:*
││
││◕⁠➜ ${prefix}antipv
││    ↳ Anti PV (ignora mensagens)
││◕⁠➜ ${prefix}antipv2
││    ↳ Anti PV (avisa usuários)
││◕⁠➜ ${prefix}antipv3
││    ↳ Anti PV (bloqueia usuários)
││◕⁠➜ ${prefix}tm
││    ↳ Fazer transmissão em grupos
││◕⁠➜ ${prefix}entrar
││    ↳ Entrar em um grupo
││◕⁠➜ ${prefix}cases
││    ↳ Ver todas as cases
││◕⁠➜ ${prefix}getcase
││    ↳ Pegar código de uma case
││◕⁠➜ ${prefix}seradm
││    ↳ Tornar-se admin em um grupo
││◕⁠➜ ${prefix}sermembro
││    ↳ Tornar-se membro em um grupo
││◕⁠➜ ${prefix}bangp
││    ↳ Banir grupo do bot
││◕⁠➜ ${prefix}unbangp
││    ↳ Desbanir grupo do bot
││◕⁠➜ ${prefix}addpremium
││    ↳ Adicionar usuário premium
││◕⁠➜ ${prefix}delpremium
││    ↳ Remover usuário premium
││◕⁠➜ ${prefix}blockcmdg [comando] [motivo?]
││    ↳ Bloquear comando globalmente
││◕⁠➜ ${prefix}unblockcmdg [comando]
││    ↳ Desbloquear comando globalmente
││◕⁠➜ ${prefix}blockuserg [usuário] [motivo?]
││    ↳ Bloquear usuário globalmente
││◕⁠➜ ${prefix}unblockuserg [usuário]
││    ↳ Desbloquear usuário globalmente
││◕⁠➜ ${prefix}listblocks
││    ↳ Listar bloqueios globais
││◕⁠➜ ${prefix}modoliteglobal
││    ↳ Filtrar conteudo para crianças
│
╰══════════════════════╯
`;
}

module.exports = menuDono;

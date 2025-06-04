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
│ Olá, *${userName}*! (👑 Dono)
╰══════════════════════╯

╭═══ 👑 *PAINEL DO DONO* 👑 ═══╮
│
│╭─▸ *Configurações Gerais:*
││
││◕⁠➜ ${prefix}prefixo [novo_prefixo]
││    ↳ Mudar prefixo do bot
││◕⁠➜ ${prefix}numerodono [numero]
││    ↳ Definir número do dono
││◕⁠➜ ${prefix}nomedono [nome]
││    ↳ Alterar nome do dono
││◕⁠➜ ${prefix}nomebot [nome]
││    ↳ Mudar nome do bot
││◕⁠➜ ${prefix}fotomenu [link/imagem]
││    ↳ Configurar foto do menu
││◕⁠➜ ${prefix}videomenu [link/video]
││    ↳ Configurar vídeo do menu
│
│╭─▸ *Atualização e Manutenção:*
││
││◕⁠➜ ${prefix}updatebot
││    ↳ Atualizar o bot completo
││◕⁠➜ ${prefix}updatemodules
││    ↳ Atualizar módulos (Pro)
││◕⁠➜ ${prefix}restart
││    ↳ Reiniciar o bot
││◕⁠➜ ${prefix}shutdown
││    ↳ Desligar o bot
│
│╭─▸ *Gerenciamento de Acesso:*
││
││◕⁠➜ ${prefix}addsubdono [@user/numero]
││    ↳ Adicionar subdono
││◕⁠➜ ${prefix}delsubdono [@user/numero]
││    ↳ Remover subdono
││◕⁠➜ ${prefix}listsubdonos
││    ↳ Listar subdonos
││◕⁠➜ ${prefix}addpremium [@user/numero] [dias]
││    ↳ Adicionar usuário premium
││◕⁠➜ ${prefix}delpremium [@user/numero]
││    ↳ Remover usuário premium
││◕⁠➜ ${prefix}listprem
││    ↳ Listar usuários premium
││◕⁠➜ ${prefix}bangp [id_grupo]
││    ↳ Banir grupo do bot
││◕⁠➜ ${prefix}unbangp [id_grupo]
││    ↳ Desbanir grupo do bot
││◕⁠➜ ${prefix}listbangp
││    ↳ Listar grupos banidos
││◕⁠➜ ${prefix}blockcmdg [comando] [motivo?]
││    ↳ Bloquear comando globalmente
││◕⁠➜ ${prefix}unblockcmdg [comando]
││    ↳ Desbloquear comando globalmente
││◕⁠➜ ${prefix}blockuserg [@user/numero] [motivo?]
││    ↳ Bloquear usuário globalmente
││◕⁠➜ ${prefix}unblockuserg [@user/numero]
││    ↳ Desbloquear usuário globalmente
││◕⁠➜ ${prefix}listblocks
││    ↳ Listar bloqueios globais
│
│╭─▸ *Sistema de Aluguel:*
││
││◕⁠➜ ${prefix}rentalmode [on/off]
││    ↳ Ativar/desativar modo aluguel
││◕⁠➜ ${prefix}addaluguel [id_grupo] [dias/permanente]
││    ↳ Definir aluguel para um grupo
││◕⁠➜ ${prefix}gerarcodigo [dias/permanente] [id_grupo?]
││    ↳ Gerar código de ativação
│
│╭─▸ *Administração de Grupos (Dono):*
││
││◕⁠➜ ${prefix}entrar [link_convite]
││    ↳ Entrar em um grupo
││◕⁠➜ ${prefix}seradm [id_grupo?]
││    ↳ Tornar-se admin em um grupo
││◕⁠➜ ${prefix}sermembro [id_grupo?]
││    ↳ Tornar-se membro em um grupo
│
│╭─▸ *Funções de Debug e Controle:*
││
││◕⁠➜ ${prefix}antipv [on/off]
││    ↳ Anti PV (ignora mensagens)
││◕⁠➜ ${prefix}antipv2 [on/off]
││    ↳ Anti PV (avisa usuários)
││◕⁠➜ ${prefix}antipv3 [on/off]
││    ↳ Anti PV (bloqueia usuários)
││◕⁠➜ ${prefix}tm [mensagem]
││    ↳ Fazer transmissão em grupos
││◕⁠➜ ${prefix}cases
││    ↳ Ver todas as cases
││◕⁠➜ ${prefix}getcase [nome_case]
││    ↳ Pegar código de uma case
││◕⁠➜ ${prefix}getcmd [nome_cmd]
││    ↳ Pegar código de um comando
││◕⁠➜ ${prefix}getfile [caminho_arquivo]
││    ↳ Obter arquivo do servidor
││◕⁠➜ ${prefix}exec [comando]
││    ↳ Executar comando no terminal
││◕⁠➜ ${prefix}exec2 [comando]
││    ↳ Executar comando (stdout)
││◕⁠➜ ${prefix}modoliteglobal [on/off]
││    ↳ Ativar/desativar Modo Lite global
│
╰══════════════════════╯
`;
}

module.exports = menuDono;


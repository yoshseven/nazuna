/**
 * Menu de brincadeiras e jogos
 * @module menubn
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @param {boolean} [isLiteMode=false] - Indica se o Modo Lite está ativo
 * @returns {Promise<string>} Menu formatado com comandos de diversão
 * @description Lista todos os comandos de brincadeiras, incluindo jogos,
 * interações entre usuários, brincadeiras com gêneros específicos e rankings.
 * Filtra comandos inadequados se o Modo Lite estiver ativo.
 */
async function menubn(prefix, botName = "MeuBot", userName = "Usuário", isLiteMode = false) {
  let menuContent = `
╭═══ 🌸 *${botName}* 🌸 ═══╮
│ Olá, *${userName}*!
╰══════════════════════╯

╭═══ 🎉 *DIVERSÃO E JOGOS* 🎉 ═══╮
│
│╭─▸ *Jogos Rápidos:*
││
││◕⁠➜ ${prefix}jogodavelha
││◕⁠➜ ${prefix}eununca
││◕⁠➜ ${prefix}vab
││◕⁠➜ ${prefix}chance
││◕⁠➜ ${prefix}quando
││◕⁠➜ ${prefix}casal
││◕⁠➜ ${prefix}shipo
││◕⁠➜ ${prefix}sn
││◕⁠➜ ${prefix}ppt
${!isLiteMode ? `││◕⁠➜ ${prefix}suicidio` : ''}
│
│╭─▸ *Interações Comuns:*
││
││◕⁠➜ ${prefix}chute
││◕⁠➜ ${prefix}chutar
││◕⁠➜ ${prefix}tapa
││◕⁠➜ ${prefix}soco
││◕⁠➜ ${prefix}socar
││◕⁠➜ ${prefix}explodir
││◕⁠➜ ${prefix}abraco
││◕⁠➜ ${prefix}abracar
││◕⁠➜ ${prefix}morder
││◕⁠➜ ${prefix}mordida
││◕⁠➜ ${prefix}lamber
││◕⁠➜ ${prefix}lambida
││◕⁠➜ ${prefix}beijo
││◕⁠➜ ${prefix}beijar
││◕⁠➜ ${prefix}mata
││◕⁠➜ ${prefix}matar
││◕⁠➜ ${prefix}cafune
`;

  if (!isLiteMode) {
    menuContent += `│
│╭─▸ *Interações "Hot" 🔥:*
││
││◕⁠➜ ${prefix}surubao
││◕⁠➜ ${prefix}sexo
││◕⁠➜ ${prefix}beijob
││◕⁠➜ ${prefix}beijarb
││◕⁠➜ ${prefix}tapar
││◕⁠➜ ${prefix}goza
││◕⁠➜ ${prefix}gozar
││◕⁠➜ ${prefix}mamar
││◕⁠➜ ${prefix}mamada
`;
  }

  menuContent += `│
│╭─▸ *Brincadeiras - Masculino 🧑:*
││
${!isLiteMode ? `││◕⁠➜ ${prefix}gay` : ''}
││◕⁠➜ ${prefix}burro
││◕⁠➜ ${prefix}inteligente
││◕⁠➜ ${prefix}otaku
││◕⁠➜ ${prefix}fiel
││◕⁠➜ ${prefix}infiel
${!isLiteMode ? `││◕⁠➜ ${prefix}corno` : ''}
││◕⁠➜ ${prefix}gado
││◕⁠➜ ${prefix}gostoso
││◕⁠➜ ${prefix}feio
││◕⁠➜ ${prefix}rico
││◕⁠➜ ${prefix}pobre
${!isLiteMode ? `││◕⁠➜ ${prefix}pirocudo` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}nazista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}ladrao` : ''}
││◕⁠➜ ${prefix}safado
││◕⁠➜ ${prefix}vesgo
││◕⁠➜ ${prefix}bebado
${!isLiteMode ? `││◕⁠➜ ${prefix}machista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}homofobico` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}racista` : ''}
││◕⁠➜ ${prefix}chato
││◕⁠➜ ${prefix}sortudo
││◕⁠➜ ${prefix}azarado
││◕⁠➜ ${prefix}forte
││◕⁠➜ ${prefix}fraco
││◕⁠➜ ${prefix}pegador
││◕⁠➜ ${prefix}otario
││◕⁠➜ ${prefix}macho
││◕⁠➜ ${prefix}bobo
││◕⁠➜ ${prefix}nerd
││◕⁠➜ ${prefix}preguicoso
││◕⁠➜ ${prefix}trabalhador
││◕⁠➜ ${prefix}brabo
││◕⁠➜ ${prefix}lindo
││◕⁠➜ ${prefix}malandro
││◕⁠➜ ${prefix}simpatico
││◕⁠➜ ${prefix}engracado
││◕⁠➜ ${prefix}charmoso
││◕⁠➜ ${prefix}misterioso
││◕⁠➜ ${prefix}carinhoso
││◕⁠➜ ${prefix}desumilde
││◕⁠➜ ${prefix}humilde
││◕⁠➜ ${prefix}ciumento
││◕⁠➜ ${prefix}corajoso
││◕⁠➜ ${prefix}covarde
││◕⁠➜ ${prefix}esperto
${!isLiteMode ? `││◕⁠➜ ${prefix}talarico` : ''}
││◕⁠➜ ${prefix}chorao
││◕⁠➜ ${prefix}brincalhao
${!isLiteMode ? `││◕⁠➜ ${prefix}bolsonarista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}petista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}comunista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}lulista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}traidor` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}bandido` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}cachorro` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}vagabundo` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}pilantra` : ''}
││◕⁠➜ ${prefix}mito
││◕⁠➜ ${prefix}padrao
││◕⁠➜ ${prefix}comedia
${!isLiteMode ? `││◕⁠➜ ${prefix}psicopata` : ''}
││◕⁠➜ ${prefix}fortao
││◕⁠➜ ${prefix}magrelo
││◕⁠➜ ${prefix}bombado
││◕⁠➜ ${prefix}chefe
││◕⁠➜ ${prefix}presidente
││◕⁠➜ ${prefix}rei
││◕⁠➜ ${prefix}patrao
││◕⁠➜ ${prefix}playboy
││◕⁠➜ ${prefix}zueiro
││◕⁠➜ ${prefix}gamer
││◕⁠➜ ${prefix}programador
││◕⁠➜ ${prefix}visionario
││◕⁠➜ ${prefix}billionario
││◕⁠➜ ${prefix}poderoso
││◕⁠➜ ${prefix}vencedor
││◕⁠➜ ${prefix}senhor
│
│╭─▸ *Brincadeiras - Feminino 👩:*
││
${!isLiteMode ? `││◕⁠➜ ${prefix}lésbica` : ''}
││◕⁠➜ ${prefix}burra
││◕⁠➜ ${prefix}inteligente
││◕⁠➜ ${prefix}otaku
││◕⁠➜ ${prefix}fiel
││◕⁠➜ ${prefix}infiel
${!isLiteMode ? `││◕⁠➜ ${prefix}corna` : ''}
││◕⁠➜ ${prefix}gada
││◕⁠➜ ${prefix}gostosa
││◕⁠➜ ${prefix}feia
││◕⁠➜ ${prefix}rica
││◕⁠➜ ${prefix}pobre
${!isLiteMode ? `││◕⁠➜ ${prefix}bucetuda` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}nazista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}ladra` : ''}
││◕⁠➜ ${prefix}safada
││◕⁠➜ ${prefix}vesga
││◕⁠➜ ${prefix}bêbada
${!isLiteMode ? `││◕⁠➜ ${prefix}machista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}homofóbica` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}racista` : ''}
││◕⁠➜ ${prefix}chata
││◕⁠➜ ${prefix}sortuda
││◕⁠➜ ${prefix}azarada
││◕⁠➜ ${prefix}forte
││◕⁠➜ ${prefix}fraca
││◕⁠➜ ${prefix}pegadora
││◕⁠➜ ${prefix}otária
││◕⁠➜ ${prefix}boba
││◕⁠➜ ${prefix}nerd
││◕⁠➜ ${prefix}preguiçosa
││◕⁠➜ ${prefix}trabalhadora
││◕⁠➜ ${prefix}braba
││◕⁠➜ ${prefix}linda
││◕⁠➜ ${prefix}malandra
││◕⁠➜ ${prefix}simpática
││◕⁠➜ ${prefix}engraçada
││◕⁠➜ ${prefix}charmosa
││◕⁠➜ ${prefix}misteriosa
││◕⁠➜ ${prefix}carinhosa
││◕⁠➜ ${prefix}desumilde
││◕⁠➜ ${prefix}humilde
││◕⁠➜ ${prefix}ciumenta
││◕⁠➜ ${prefix}corajosa
││◕⁠➜ ${prefix}covarde
││◕⁠➜ ${prefix}esperta
${!isLiteMode ? `││◕⁠➜ ${prefix}talarica` : ''}
││◕⁠➜ ${prefix}chorona
││◕⁠➜ ${prefix}brincalhona
${!isLiteMode ? `││◕⁠➜ ${prefix}bolsonarista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}petista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}comunista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}lulista` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}traidora` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}bandida` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}cachorra` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}vagabunda` : ''}
${!isLiteMode ? `││◕⁠➜ ${prefix}pilantra` : ''}
││◕⁠➜ ${prefix}mito
││◕⁠➜ ${prefix}padrão
││◕⁠➜ ${prefix}comédia
${!isLiteMode ? `││◕⁠➜ ${prefix}psicopata` : ''}
││◕⁠➜ ${prefix}fortona
││◕⁠➜ ${prefix}magrela
││◕⁠➜ ${prefix}bombada
││◕⁠➜ ${prefix}chefe
││◕⁠➜ ${prefix}presidenta
││◕⁠➜ ${prefix}rainha
││◕⁠➜ ${prefix}patroa
││◕⁠➜ ${prefix}playgirl
││◕⁠➜ ${prefix}zueira
││◕⁠➜ ${prefix}gamer
││◕⁠➜ ${prefix}programadora
││◕⁠➜ ${prefix}visionária
││◕⁠➜ ${prefix}bilionária
││◕⁠➜ ${prefix}poderosa
││◕⁠➜ ${prefix}vencedora
││◕⁠➜ ${prefix}senhora
`;

  if (!isLiteMode) {
    menuContent += `│
│╭─▸ *Rankings Masculinos 🏆:*
││
││◕⁠➜ ${prefix}rankgay
││◕⁠➜ ${prefix}rankburro
││◕⁠➜ ${prefix}rankinteligente
││◕⁠➜ ${prefix}rankotaku
││◕⁠➜ ${prefix}rankfiel
││◕⁠➜ ${prefix}rankinfiel
││◕⁠➜ ${prefix}rankcorno
││◕⁠➜ ${prefix}rankgado
││◕⁠➜ ${prefix}rankgostoso
││◕⁠➜ ${prefix}rankrico
││◕⁠➜ ${prefix}rankpobre
││◕⁠➜ ${prefix}rankforte
││◕⁠➜ ${prefix}rankpegador
││◕⁠➜ ${prefix}rankmacho
││◕⁠➜ ${prefix}ranknerd
││◕⁠➜ ${prefix}ranktrabalhador
││◕⁠➜ ${prefix}rankbrabo
││◕⁠➜ ${prefix}ranklindo
││◕⁠➜ ${prefix}rankmalandro
││◕⁠➜ ${prefix}rankengracado
││◕⁠➜ ${prefix}rankcharmoso
││◕⁠➜ ${prefix}rankvisionario
││◕⁠➜ ${prefix}rankpoderoso
││◕⁠➜ ${prefix}rankvencedor
│
│╭─▸ *Rankings Femininos 🏆:*
││
││◕⁠➜ ${prefix}ranklesbica
││◕⁠➜ ${prefix}rankburra
││◕⁠➜ ${prefix}rankinteligente
││◕⁠➜ ${prefix}rankotaku
││◕⁠➜ ${prefix}rankfiel
││◕⁠➜ ${prefix}rankinfiel
││◕⁠➜ ${prefix}rankcorna
││◕⁠➜ ${prefix}rankgada
││◕⁠➜ ${prefix}rankgostosa
││◕⁠➜ ${prefix}rankrica
││◕⁠➜ ${prefix}rankpobre
││◕⁠➜ ${prefix}rankforte
││◕⁠➜ ${prefix}rankpegadora
││◕⁠➜ ${prefix}ranknerd
││◕⁠➜ ${prefix}ranktrabalhadora
││◕⁠➜ ${prefix}rankbraba
││◕⁠➜ ${prefix}ranklinda
││◕⁠➜ ${prefix}rankmalandra
││◕⁠➜ ${prefix}rankengracada
││◕⁠➜ ${prefix}rankcharmosa
││◕⁠➜ ${prefix}rankvisionaria
││◕⁠➜ ${prefix}rankpoderosa
││◕⁠➜ ${prefix}rankvencedora
`;
  }

  menuContent += `│
╰══════════════════════╯
`;

  return menuContent;
}

module.exports = menubn;


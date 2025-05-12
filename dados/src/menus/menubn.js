/**
 * Menu de brincadeiras e jogos
 * @module menubn
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com comandos de diversão
 * @description Lista todos os comandos de brincadeiras, incluindo jogos,
 * interações entre usuários, brincadeiras com gêneros específicos e rankings
 */
async function menubn(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭─🌸 *${botName}*
│ Oii, *${userName}*
╰───────────────

╭──🌷 *JOGOS* 🌷──
│ Escolha sua opção:
├──────────────┤
│ → *${prefix}jogodavelha* ou *${prefix}ttt*
│ → *${prefix}eununca*
│ → *${prefix}vab*
╰──────────────╯

╭─🌷 *INTERAÇÕES COMUNS*
│ Escolha sua opção:
├──────────────┤
│ → *${prefix}chute*
│ → *${prefix}chutar*
│ → *${prefix}tapa*
│ → *${prefix}soco*
│ → *${prefix}socar*
│ → *${prefix}explodir*
│ → *${prefix}abraco*
│ → *${prefix}abracar*
│ → *${prefix}morder*
│ → *${prefix}mordida*
│ → *${prefix}lamber*
│ → *${prefix}lambida*
│ → *${prefix}beijo*
│ → *${prefix}beijar*
│ → *${prefix}mata*
│ → *${prefix}matar*
│ → *${prefix}cafune*
╰──────────────╯

╭─🌷 *INTERAÇÕES "HOT"*
│ Escolha sua opção:
├──────────────┤
│ → *${prefix}beijob*
│ → *${prefix}beijarb*
│ → *${prefix}tapar*
│ → *${prefix}goza*
│ → *${prefix}gozar*
│ → *${prefix}mamar*
│ → *${prefix}mamada*
╰──────────────╯

╭─🌷 *BRINCADEIRAS - MASCULINO*
│ Escolha sua opção:
├──────────────┤
│ → *${prefix}gay*
│ → *${prefix}burro*
│ → *${prefix}inteligente*
│ → *${prefix}otaku*
│ → *${prefix}fiel*
│ → *${prefix}infiel*
│ → *${prefix}corno*
│ → *${prefix}gado*
│ → *${prefix}gostoso*
│ → *${prefix}feio*
│ → *${prefix}rico*
│ → *${prefix}pobre*
│ → *${prefix}pirocudo*
│ → *${prefix}pirokudo*
│ → *${prefix}nazista*
│ → *${prefix}ladrao*
│ → *${prefix}safado*
│ → *${prefix}vesgo*
│ → *${prefix}bebado*
│ → *${prefix}machista*
│ → *${prefix}homofobico*
│ → *${prefix}racista*
│ → *${prefix}chato*
│ → *${prefix}sortudo*
│ → *${prefix}azarado*
│ → *${prefix}forte*
│ → *${prefix}fraco*
│ → *${prefix}pegador*
│ → *${prefix}otario*
│ → *${prefix}macho*
│ → *${prefix}bobo*
│ → *${prefix}nerd*
│ → *${prefix}preguicoso*
│ → *${prefix}trabalhador*
│ → *${prefix}brabo*
│ → *${prefix}lindo*
│ → *${prefix}malandro*
│ → *${prefix}simpatico*
│ → *${prefix}engracado*
│ → *${prefix}charmoso*
│ → *${prefix}misterioso*
│ → *${prefix}carinhoso*
│ → *${prefix}desumilde*
│ → *${prefix}humilde*
│ → *${prefix}ciumento*
│ → *${prefix}corajoso*
│ → *${prefix}covarde*
│ → *${prefix}esperto*
│ → *${prefix}talarico*
│ → *${prefix}chorao*
│ → *${prefix}brincalhao*
│ → *${prefix}bolsonarista*
│ → *${prefix}petista*
│ → *${prefix}comunista*
│ → *${prefix}lulista*
│ → *${prefix}traidor*
│ → *${prefix}bandido*
│ → *${prefix}cachorro*
│ → *${prefix}vagabundo*
│ → *${prefix}pilantra*
│ → *${prefix}mito*
│ → *${prefix}padrao*
│ → *${prefix}comedia*
│ → *${prefix}psicopata*
│ → *${prefix}fortao*
│ → *${prefix}magrelo*
│ → *${prefix}bombado*
│ → *${prefix}chefe*
│ → *${prefix}presidente*
│ → *${prefix}rei*
│ → *${prefix}patrao*
│ → *${prefix}playboy*
│ → *${prefix}zueiro*
│ → *${prefix}gamer*
│ → *${prefix}programador*
│ → *${prefix}visionario*
│ → *${prefix}billionario*
│ → *${prefix}poderoso*
│ → *${prefix}vencedor*
│ → *${prefix}senhor*
╰──────────────╯

╭─🌷 *BRINCADEIRAS - FEMININO*
│ Escolha sua opção:
├──────────────┤
│ → *${prefix}lésbica*
│ → *${prefix}burra*
│ → *${prefix}inteligente*
│ → *${prefix}otaku*
│ → *${prefix}fiel*
│ → *${prefix}infiel*
│ → *${prefix}corna*
│ → *${prefix}gado*
│ → *${prefix}gostosa*
│ → *${prefix}feia*
│ → *${prefix}rica*
│ → *${prefix}pobre*
│ → *${prefix}bucetuda*
│ → *${prefix}nazista*
│ → *${prefix}ladra*
│ → *${prefix}safada*
│ → *${prefix}vesga*
│ → *${prefix}bêbada*
│ → *${prefix}machista*
│ → *${prefix}homofóbica*
│ → *${prefix}racista*
│ → *${prefix}chata*
│ → *${prefix}sortuda*
│ → *${prefix}azarada*
│ → *${prefix}forte*
│ → *${prefix}fraca*
│ → *${prefix}pegadora*
│ → *${prefix}otária*
│ → *${prefix}boba*
│ → *${prefix}nerd*
│ → *${prefix}preguiçosa*
│ → *${prefix}trabalhadora*
│ → *${prefix}braba*
│ → *${prefix}linda*
│ → *${prefix}malandra*
│ → *${prefix}simpática*
│ → *${prefix}engraçada*
│ → *${prefix}charmosa*
│ → *${prefix}misteriosa*
│ → *${prefix}carinhosa*
│ → *${prefix}desumilde*
│ → *${prefix}humilde*
│ → *${prefix}ciumenta*
│ → *${prefix}corajosa*
│ → *${prefix}covarde*
│ → *${prefix}esperta*
│ → *${prefix}talarica*
│ → *${prefix}chorona*
│ → *${prefix}brincalhona*
│ → *${prefix}bolsonarista*
│ → *${prefix}petista*
│ → *${prefix}comunista*
│ → *${prefix}lulista*
│ → *${prefix}traidora*
│ → *${prefix}bandida*
│ → *${prefix}cachorra*
│ → *${prefix}vagabunda*
│ → *${prefix}pilantra*
│ → *${prefix}mito*
│ → *${prefix}padrão*
│ → *${prefix}comédia*
│ → *${prefix}psicopata*
│ → *${prefix}fortona*
│ → *${prefix}magrela*
│ → *${prefix}bombada*
│ → *${prefix}chefe*
│ → *${prefix}presidenta*
│ → *${prefix}rainha*
│ → *${prefix}patroa*
│ → *${prefix}playgirl*
│ → *${prefix}zueira*
│ → *${prefix}gamer*
│ → *${prefix}programadora*
│ → *${prefix}visionária*
│ → *${prefix}bilionária*
│ → *${prefix}poderosa*
│ → *${prefix}vencedora*
│ → *${prefix}senhora*
╰──────────────╯

╭─🌷 *RANK MASCULINOS*
│ Escolha sua opção:
├──────────────┤
│ → *${prefix}rankgay*
│ → *${prefix}rankburro*
│ → *${prefix}rankinteligente*
│ → *${prefix}rankotaku*
│ → *${prefix}rankfiel*
│ → *${prefix}rankinfiel*
│ → *${prefix}rankcorno*
│ → *${prefix}rankgado*
│ → *${prefix}rankgostoso*
│ → *${prefix}rankrico*
│ → *${prefix}rankpobre*
│ → *${prefix}rankforte*
│ → *${prefix}rankpegador*
│ → *${prefix}rankmacho*
│ → *${prefix}ranknerd*
│ → *${prefix}ranktrabalhador*
│ → *${prefix}rankbrabo*
│ → *${prefix}ranklindo*
│ → *${prefix}rankmalandro*
│ → *${prefix}rankengracado*
│ → *${prefix}rankcharmoso*
│ → *${prefix}rankvisionario*
│ → *${prefix}rankpoderoso*
│ → *${prefix}rankvencedor*
╰──────────────╯

╭─🌷 *RANK FEMININOS*
│ Escolha sua opção:
├──────────────┤
│ → *${prefix}ranklesbica*
│ → *${prefix}rankburra*
│ → *${prefix}rankinteligente*
│ → *${prefix}rankotaku*
│ → *${prefix}rankfiel*
│ → *${prefix}rankinfiel*
│ → *${prefix}rankcorna*
│ → *${prefix}rankgada*
│ → *${prefix}rankgostosa*
│ → *${prefix}rankrica*
│ → *${prefix}rankpobre*
│ → *${prefix}rankforte*
│ → *${prefix}rankpegadora*
│ → *${prefix}ranknerd*
│ → *${prefix}ranktrabalhadora*
│ → *${prefix}rankbraba*
│ → *${prefix}ranklinda*
│ → *${prefix}rankmalandra*
│ → *${prefix}rankengracada*
│ → *${prefix}rankcharmosa*
│ → *${prefix}rankvisionaria*
│ → *${prefix}rankpoderosa*
│ → *${prefix}rankvencedora*
│ → *${prefix}senhora*
╰──────────────╯
`;
}

module.exports = menubn;

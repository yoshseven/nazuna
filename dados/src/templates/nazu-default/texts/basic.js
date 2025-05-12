/**
 * Sistema de textos e mensagens do bot
 * @module basic
 * @description Centraliza todas as mensagens e respostas do bot,
 * incluindo mensagens de erro, avisos e feedback para o usuário
 */

/**
 * Arrays de mensagens para diferentes situações
 * Cada array contém variações de mensagens para tornar o bot mais dinâmico
 */

/** @type {string[]} Mensagens de aguarde */
const aguardeArray = [
  "⌛ Preparando tudo com carinho... só um instante, tá bem?",
  "⏳ Quase lá! Obrigado por esperar~",
  "✨ Deixando tudo lindo pra você... já já termina!",
  "☁️ Ajustando os últimos detalhes... só mais um pouquinho~",
  "⏰ Processando com muito cuidado... obrigado pela paciência!",
  "⚙️ Carregando... obrigado por ficar juntinho até aqui!",
  "⛅ Um momentinho, só... já vai valer a pena~",
  "⌛ Finalizando coisinhas fofas... quase pronto!",
  "⏳ Um instante e já vai florescer~",
  "✨ Caprichando nos detalhes... obrigado por esperar!"
];

/** @type {string[]} Mensagens de erro */
const erroArray = [
  "✖️ Ah não... algo deu errado... desculpa mesmo!",
  "❌ Ops... não era pra acontecer isso...",
  "⚠️ T-tivemos um probleminha... já já fica tudo bem!",
  "✖️ Erro detectado... prometo tentar de novo!",
  "❌ Ihh... alguma coisinha saiu diferente do esperado...",
  "⚠️ Parece que algo não funcionou direito... tente mais uma vez!"
];

/** @type {string[]} Mensagens de permissão de admin */
const adminArray = [
  "🚫 Esse comando é só pros adminzinhos do grupo~",
  "⚠️ Você precisa ser admin pra fazer isso, viu?",
  "❗ Apenas administradores podem usar esse comando!",
  "🚨 Hm... parece que só admin pode fazer isso!",
  "⚡ Comando reservado para administradores, tá bem?"
];

/** @type {string[]} Mensagens de permissão de dono */
const donoArray = [
  "👑 Esse comando é só pro dono do bot!",
  "🚫 Apenas o dono supremo pode usar esse comando!",
  "👑 Você precisa ser o dono do bot pra isso funcionar~",
  "❗ Só o dono do bot tem permissão para isso!",
  "⚡ Acesso negado: comando exclusivo do dono!"
];

/** @type {string[]} Mensagens de uso em grupo */
const grupoArray = [
  "👥 Esse comando é pra usar num grupo!",
  "🚫 Só funciona em grupinhos animados, sabia?",
  "👥 Hm... esse comando só é liberado em grupo!",
  "⚠️ Você precisa estar num grupo para usar isso~",
  "❗ Comando disponível apenas em grupos!"
];

/** @type {string[]} Mensagens de modo brincadeira */
const modoBrincadeiraArray = [
  "🎈 O modo brincadeira tá desligado... ativa ele primeiro!",
  "⚡ Esse comando precisa que o modo brincadeira esteja ativo!",
  "✨ Liga o modo brincadeira pra gente poder brincar~",
  "🚨 Sem modo brincadeira ativo, sem diversão...",
  "🎉 Ativa o modo brincadeira primeiro, tá bom?"
];

/** @type {string[]} Mensagens de bot admin */
const botAdmArray = [
  "🤖 Eu preciso ser admin pra fazer isso!",
  "🚫 Não consigo fazer isso... me dá admin, por favorzinho~",
  "⚠️ Preciso de poderes de admin pra funcionar direitinho!",
  "❗ Me promove a admin que eu consigo fazer!",
  "⚡ Eu queria te ajudar, mas preciso ser admin antes!"
];

/** @type {string[]} Mensagens de uso em privado */
const privadoArray = [
  "✉️ Esse comando é só no privado, tá bom?",
  "🚫 Manda uma mensagem no meu privado pra usar isso!",
  "📩 Hm... esse comando precisa ser feito no privado!",
  "⚠️ Tenta chamar no privado pra gente fazer isso certinho~",
  "❗ Esse comando é exclusivo no privado, beleza?"
];

/** @type {string[]} Mensagens de marcar imagem */
const marcarImagemArray = [
  "🖼️ Marca uma imagem pra eu poder trabalhar nela, tá?",
  "📸 Ops... você esqueceu de marcar uma imagem!",
  "🖌️ Preciso de uma imagem pra editar... marca ela pra mim~",
  "🖼️ Hm... esse comando só funciona se você marcar uma foto!",
  "✨ Marca uma imagem que eu faço a mágica acontecer~"
];

/** @type {string[]} Mensagens de marcar vídeo */
const marcarVideoArray = [
  "🎥 Marca um vídeo pra eu poder ajudar!",
  "📹 Opa... você não marcou nenhum vídeo!",
  "🎬 Esse comando precisa de um vídeo marcado, viu?",
  "🎞️ Marca um vídeo que eu cuido do resto~",
  "📽️ Sem vídeo marcado, sem diversão... marca um pra mim?"
];

/** @type {string[]} Mensagens de marcar mídia */
const marcarMidiaArray = [
  "📁 Marca uma mídia (foto, vídeo, áudio ou documento) pra eu ver!",
  "📦 Opa... você esqueceu de marcar algo! Pode ser foto, vídeo, áudio ou doc~",
  "📎 Preciso que você marque uma mídia pra eu processar!",
  "📌 Marca algo (imagem, vídeo, áudio...) que eu faço a mágica~",
  "📂 Esse comando só funciona com mídias marcadas, tá bom?"
];

/** @type {string[]} Mensagens de digitar link */
const digitarLinkArray = [
  "🔗 Opa... cadê o link? Preciso dele pra continuar!",
  "📎 Você esqueceu de colocar o link! Cola ele aqui pra mim~",
  "🌐 Sem link, sem diversão... manda um pra gente?",
  "🔗 Esse comando precisa de um link, tá bom?",
  "✨ Manda o link que eu faço a mágica acontecer~"
];

/** @type {string[]} Mensagens de digitar nome */
const digitarNomeArray = [
  "📛 Opa... qual é o nome? Preciso dele pra continuar!",
  "🏷️ Você esqueceu de digitar o nome! Escreve ele pra mim~",
  "👤 Sem nome, sem graça... me fala um aí?",
  "📛 Esse comando precisa de um nome, tá bom?",
  "✨ Me diz o nome que eu cuido do resto~"
];

/** @type {string[]} Mensagens de digitar nome ou link */
const digitarNomeOuLinkArray = [
  "📝 Você pode digitar um nome ou colar um link, tá bom?",
  "🔤 Opa... preciso de um nome ou link pra continuar!",
  "📌 Manda um nome ou link que eu resolvo o resto~",
  "✨ Pode ser um nome ou um link, eu aceito os dois!",
  "🌐🔤 Sem nome/link, sem diversão... me ajuda aí?"
];

/** @type {string[]} Mensagens de marcar alguém */
const marcarAlguemArray = [
  "👤 Ops... você precisa marcar alguém pra eu poder ajudar!",
  "📍 Marca um amiguinho pra gente continuar~",
  "🤗 Quem vai ser? Marca a pessoa aqui pra mim!",
  "👥 Esse comando precisa que você marque alguém, tá bom?",
  "✨ Marca quem você quer que eu ajude, por favorzinho~",
  "🔍 Cadê a pessoa? Precisa marcar ela pra funcionar!",
  "👀 Tá faltando alguém marcado... quem será?",
  "💬 Marca o usuário que você quer mencionar, tá bem?"
];

/** @type {string[]} Mensagens de marcar figurinha */
const marcarFigurinhaArray = [
  "💟 Ops... você esqueceu de marcar a figurinha!",
  "🖍️ Marca uma figurinha pra eu poder trabalhar nela~",
  "✨ Preciso de uma figurinha marcada pra fazer a mágica!",
  "🎨 Cadê a figurinha? Marca ela pra mim, por favorzinho!",
  "🛑 Esse comando só funciona com figurinhas marcadas!",
  "📌 Marca a figurinha que você quer editar, tá bem?",
  "🤩 Que figurinha linda! Mas... você precisa marcar ela primeiro~",
  "🧸 Marca a figurinha fofa que você quer modificar!"
];

/** @type {string[]} Mensagens de marcar visualização única */
const marcarVisualizacaoUnicaArray = [
  "🔒 Ops... marque uma mídia de visualização única (áudio, vídeo ou foto) pra eu poder ajudar!",
  "👀 Esse comando precisa de uma mídia que some depois de vista! Marca ela pra mim~",
  "💨 Marque algo que desaparece (áudio/vídeo/foto) pra eu processar!",
  "🫥 Cadê a mídia efêmera? Precisa marcar pra funcionar!",
  "⏳ Essa magia só funciona com mídias de visualização única, marca aí!"
];

/** @type {string[]} Mensagens de premium */
const precisaSerPremiumArray = [
  "🌟 Opa... esse recurso é exclusivo pra contas/grupos Premium!",
  "💎 Você precisa ser Premium (ou estar num grupo Premium) pra isso!",
  "✨ Que tal assinar o Premium? Esse comando é especialzinho~",
  "🔮 Funcionalidade mágica liberada apenas para usuários Premium!",
  "🪙 Sem Premium, sem essa diversão... que tal experimentar?"
];

/** @type {string[]} Mensagens de digitar nick */
const digitarNickArray = [
  "🏷️ Opa... qual vai ser o nick? Escreve pra mim!",
  "📛 Me conta como quer ser chamado daqui pra frente~",
  "👤 Sem nick novo, sem mudança! Digita aí seu apelido",
  "✨ Quer mudar de nick? Me diz pra eu registrar!",
  "💬 Digita o novo nome que você quer usar, tá bem?"
];

/** @type {string[]} Mensagens de digitar prompt */
const digitarPromptArray = [
  "💭 O que você quer perguntar? Escreve aí sua dúvida!",
  "🤔 Tô curioso... qual é sua pergunta ou prompt?",
  "📝 Digita o que você quer que eu responda ou crie~",
  "✨ Solta aí sua ideia que eu trabalho nela!",
  "🧠 Me alimenta com seu prompt criativo, por favor~"
];

/** @type {((necessarios: string, exemplo: string) => string)[]} Mensagens de formato específico */
const formatoEspecificoArray = [
  (necessarios, exemplo) => `📌 Você precisa usar: ${necessarios}\n✨ Exemplo: ${exemplo}`,
  (necessarios, exemplo) => `🔣 Formato incorreto!\n✅ Necessário: ${necessarios}\n💡 Tente assim: ${exemplo}`,
  (necessarios, exemplo) => `🛑 Faltou algo!\n⚙️ Precisa ter: ${necessarios}\n🎯 Modelo: ${exemplo}`,
  (necessarios, exemplo) => `⚠️ Atenção!\n📝 Elementos obrigatórios: ${necessarios}\n🧩 Exemplo prático: ${exemplo}`,
  (necessarios, exemplo) => `💬 Tem que conter:\n🔮 ${necessarios}\n🌰 Assim ó: ${exemplo}`
];

/** @type {((tipo: string) => string)[]} Mensagens de marcar mensagem */
const marcarMensagemArray = [
  (tipo) => `💬 Ops! Você precisa marcar ${tipo} pra eu poder ajudar!`,
  (tipo) => `🔍 Cadê a mensagem? Marca ${tipo} que eu cuido do resto~`,
  (tipo) => `📩 Esse comando precisa de ${tipo} marcado, tá bem?`,
  (tipo) => `✨ Marca ${tipo} que eu faço a mágica acontecer!`,
  (tipo) => `🤔 Quer que eu trabalhe em quê? Marca ${tipo} pra mim!`,
  (tipo) => `🛑 Sem ${tipo} marcado, sem diversão... marca aí!`,
  (tipo) => `👀 Tá faltando ${tipo} marcado... qual será?`
];

/**
 * Seleciona uma mensagem aleatória de um array
 * @param {Array} arr Array de mensagens
 * @param {...any} args Argumentos adicionais para mensagens funcionais
 * @returns {string} Mensagem selecionada
 */
function random(arr, ...args) {
  const item = arr[Math.floor(Math.random() * arr.length)];
  return typeof item === 'function' ? item(...args) : item;
}

/**
 * Exporta funções para gerar mensagens aleatórias
 * @exports basic
 */
module.exports = {
  aguarde: () => random(aguardeArray),
  erro: () => random(erroArray),
  admin: () => random(adminArray),
  dono: () => random(donoArray),
  grupo: () => random(grupoArray),
  modoBrincadeira: () => random(modoBrincadeiraArray),
  botAdm: () => random(botAdmArray),
  privado: () => random(privadoArray),
  marcarImagem: () => random(marcarImagemArray),
  marcarVideo: () => random(marcarVideoArray),
  marcarMidia: () => random(marcarMidiaArray),
  digitarLink: () => random(digitarLinkArray),
  digitarNome: () => random(digitarNomeArray),
  digitarNomeOuLink: () => random(digitarNomeOuLinkArray),
  marcarAlguem: () => random(marcarAlguemArray),
  marcarFigurinha: () => random(marcarFigurinhaArray),
  marcarVisualizacaoUnica: () => random(marcarVisualizacaoUnicaArray),
  precisaSerPremium: () => random(precisaSerPremiumArray),
  digitarNick: () => random(digitarNickArray),
  digitarPrompt: () => random(digitarPromptArray),
  formatoEspecifico: (necessarios, exemplo) => random(formatoEspecificoArray, necessarios, exemplo),
  marcarMensagem: (tipo = "uma mensagem") => random(marcarMensagemArray, tipo),
};

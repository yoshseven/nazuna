/*
 * Módulo Creator Hub ("OnlyFans") - RPG Nazuna
 * Permite aos jogadores criar perfis, postar conteúdo e gerenciar subscrições.
 * 
 * Criado originalmente por: Hiudy
 * 
 * Manter créditos ao criar ou modificar!
 */

const fs = require("fs").promises;
const path = require("path");
const { carregarDadosJogador, salvarDadosJogador, normalizar } = require("./utils");
const { adicionarDinheiro, removerDinheiro } = require("./economy");
const { CUSTOS } = require("./config");

const CreatorHubPath = path.join("dados", "database", "creator_hub");
const CreatorsFile = path.join(CreatorHubPath, "creators.json"); // Lista de criadores ativos

let CREATORS_LIST = {}; // { creatorId: { nomeExibicao, taxaMensal } }

// Garante que o diretório exista
async function inicializarDiretorioCreatorHub() {
    try {
        await fs.mkdir(CreatorHubPath, { recursive: true });
        // Carrega a lista de criadores
        if (await fs.access(CreatorsFile).then(() => true).catch(() => false)) {
            const data = await fs.readFile(CreatorsFile, "utf-8");
            CREATORS_LIST = JSON.parse(data);
        } else {
            await fs.writeFile(CreatorsFile, JSON.stringify({}, null, 2));
        }
    } catch (err) {
        console.error("Erro crítico ao inicializar diretório/lista do Creator Hub:", err);
    }
}

inicializarDiretorioCreatorHub();

// Salva a lista geral de criadores
async function salvarListaCriadores() {
    try {
        await fs.writeFile(CreatorsFile, JSON.stringify(CREATORS_LIST, null, 2));
    } catch (err) {
        console.error("Erro ao salvar lista de criadores:", err);
    }
}

// Carrega os dados de um criador específico (posts, assinantes)
async function carregarDadosCriador(creatorId) {
    const filePath = path.join(CreatorHubPath, `${creatorId}.json`);
    try {
        if (await fs.access(filePath).then(() => true).catch(() => false)) {
            const data = await fs.readFile(filePath, "utf-8");
            const dados = JSON.parse(data);
            dados.posts = dados.posts || [];
            dados.assinantes = dados.assinantes || {}; // { assinanteId: { desde: timestamp, proximo_pagamento: timestamp } }
            return dados;
        } else {
            return null; // Criador não encontrado (embora deva estar na lista)
        }
    } catch (err) {
        console.error(`Erro ao carregar dados do criador ${creatorId}:`, err);
        return null;
    }
}

// Salva os dados de um criador específico
async function salvarDadosCriador(creatorId, dadosCriador) {
    const filePath = path.join(CreatorHubPath, `${creatorId}.json`);
    try {
        await fs.writeFile(filePath, JSON.stringify(dadosCriador, null, 2));
        return true;
    } catch (err) {
        console.error(`Erro ao salvar dados do criador ${creatorId}:`, err);
        return false;
    }
}

// --- Funções do Creator Hub ---

// Ativa o perfil de criador
async function ativarPerfilCriador(senderId, taxaMensal) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    if (CREATORS_LIST[senderId]) {
        return { msg: `✨ Você já é um criador! Sua taxa atual é ${CREATORS_LIST[senderId].taxaMensal} moedas.` };
    }

    const taxa = parseInt(taxaMensal);
    if (isNaN(taxa) || taxa <= 0) {
        return { msg: "⚠️ A taxa mensal deve ser um número positivo de moedas." };
    }

    // Custo para ativar? (Opcional)
    // const custoAtivacao = CUSTOS.ATIVAR_CREATOR_HUB;
    // if (dadosJogador.dinheiro < custoAtivacao) { ... }
    // const remocao = removerDinheiro(dadosJogador, custoAtivacao);
    // if (!remocao) { ... }
    // dadosJogador = remocao;

    const nomeExibicao = dadosJogador.nome || senderId.split("@")[0];

    // Cria o arquivo de dados do criador
    const dadosIniciaisCriador = { posts: [], assinantes: {} };
    const saveCreator = await salvarDadosCriador(senderId, dadosIniciaisCriador);
    if (!saveCreator) {
        // Devolver custo de ativação se houver
        return { msg: "❌ Erro ao inicializar os dados do criador. Tente novamente." };
    }

    // Adiciona à lista geral
    CREATORS_LIST[senderId] = { nomeExibicao, taxaMensal: taxa };
    await salvarListaCriadores();
    await salvarDadosJogador(senderId, dadosJogador); // Salva caso tenha havido custo

    return { msg: `🎉 Perfil de Criador ativado! Sua taxa de assinatura mensal é ${taxa} moedas. Comece a postar com .criador postar <texto>!` };
}

// Posta conteúdo no perfil (texto, imagem, vídeo)
async function postarConteudo(senderId, textoPost, funcoesExternas = {}) {
    const { upload, getFileBuffer, m } = funcoesExternas; // Recebe funções do handler/cases
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    if (!CREATORS_LIST[senderId]) {
        return { msg: "❌ Você precisa ativar seu perfil de criador primeiro (.criador ativar <taxa_mensal>)." };
    }

    if (!textoPost && !m?.quoted) {
        return { msg: "⚠️ Você precisa escrever algo ou marcar uma imagem/vídeo para postar." };
    }

    let dadosCriador = await carregarDadosCriador(senderId);
    if (!dadosCriador) return { msg: "❌ Erro ao carregar seus dados de criador." };

    let mediaInfo = null;

    // Verifica se há mídia citada e se as funções de upload/buffer foram passadas
    if (m?.quoted && upload && getFileBuffer) {
        const quotedMsg = m.quoted.message;
        const isQuotedImage = !!quotedMsg?.imageMessage;
        const isQuotedVideo = !!quotedMsg?.videoMessage;

        if (isQuotedImage || isQuotedVideo) {
            try {
                const mediaKey = isQuotedImage ? quotedMsg.imageMessage : quotedMsg.videoMessage;
                const mediaType = isQuotedImage ? "image" : "video";
                const buffer = await getFileBuffer(mediaKey, mediaType);
                const link = await upload(buffer); // Usa a função de upload do bot
                if (link) {
                    mediaInfo = { type: mediaType, url: link };
                } else {
                    return { msg: "⚠️ Falha ao fazer upload da mídia. Post não criado." };
                }
            } catch (error) {
                console.error("Erro no upload/buffer para Creator Hub:", error);
                return { msg: "⚠️ Ocorreu um erro ao processar a mídia. Post não criado." };
            }
        }
    }

    const novoPost = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        texto: textoPost || "", // Permite post só com mídia
        media: mediaInfo, // { type: 'image'/'video', url: '...' } ou null
        gorjetas: 0,
        quem_deu_gorjeta: []
    };

    dadosCriador.posts.unshift(novoPost); // Adiciona no início (mais recente)
    // Limitar número de posts? (Opcional)
    // const MAX_POSTS = 100;
    // if (dadosCriador.posts.length > MAX_POSTS) {
    //     dadosCriador.posts.pop(); // Remove o mais antigo
    // }

    const saveCreator = await salvarDadosCriador(senderId, dadosCriador);
    if (!saveCreator) return { msg: "❌ Erro ao salvar seu novo post." };

    return { msg: `✅ Conteúdo postado com sucesso no seu perfil!` };
}

// Subscreve a um criador
async function subscreverCriador(senderId, nomeCriador) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    const nomeNormalizado = normalizar(nomeCriador);
    const creatorEntry = Object.entries(CREATORS_LIST).find(([id, data]) => normalizar(data.nomeExibicao) === nomeNormalizado || id.split("@")[0] === nomeCriador.replace("@", ""));

    if (!creatorEntry) return { msg: `❓ Criador "${nomeCriador}" não encontrado.` };

    const [creatorId, creatorInfo] = creatorEntry;

    if (creatorId === senderId) {
        return { msg: "❌ Você não pode subscrever a si mesmo." };
    }

    let dadosCriador = await carregarDadosCriador(creatorId);
    if (!dadosCriador) return { msg: "❌ Erro ao carregar dados do criador." };

    if (dadosCriador.assinantes[senderId]) {
        const proximoPagamento = new Date(dadosCriador.assinantes[senderId].proximo_pagamento).toLocaleDateString();
        return { msg: `✨ Você já é assinante de ${creatorInfo.nomeExibicao}! Sua próxima renovação é em ${proximoPagamento}.` };
    }

    const taxa = creatorInfo.taxaMensal;
    if (dadosJogador.dinheiro < taxa) {
        return { msg: `💰 Você precisa de ${taxa} moedas para subscrever ${creatorInfo.nomeExibicao}.` };
    }

    // Cobra do assinante
    const remocao = removerDinheiro(dadosJogador, taxa);
    if (!remocao) return { msg: "⚠️ Falha ao cobrar a taxa de assinatura!" };
    dadosJogador = remocao;

    // Adiciona ao criador (com taxa?)
    // TODO: Definir se o criador recebe o valor total ou há uma taxa da plataforma
    let dadosCriadorOriginal = await carregarDadosJogador(creatorId);
    if (dadosCriadorOriginal) {
        const ganhoCriador = Math.floor(taxa * (1 - (CUSTOS.TAXA_CREATOR_HUB / 100))); // Ex: 10% taxa
        adicionarDinheiro(dadosCriadorOriginal, ganhoCriador);
        await salvarDadosJogador(creatorId, dadosCriadorOriginal);
    } else {
        console.warn(`Criador ${creatorId} não encontrado para receber pagamento.`);
    }

    // Adiciona assinante
    const agora = new Date();
    const proximoPagamentoTimestamp = new Date(agora.getFullYear(), agora.getMonth() + 1, agora.getDate()).toISOString();
    dadosCriador.assinantes[senderId] = {
        desde: agora.toISOString(),
        proximo_pagamento: proximoPagamentoTimestamp
    };

    const saveCreator = await salvarDadosCriador(creatorId, dadosCriador);
    if (!saveCreator) {
        // Devolve dinheiro ao assinante e remove do criador se falhar
        adicionarDinheiro(dadosJogador, taxa);
        if (dadosCriadorOriginal) {
            removerDinheiro(dadosCriadorOriginal, ganhoCriador);
            await salvarDadosJogador(creatorId, dadosCriadorOriginal);
        }
        await salvarDadosJogador(senderId, dadosJogador);
        return { msg: "❌ Erro ao salvar dados da assinatura. Tente novamente." };
    }

    await salvarDadosJogador(senderId, dadosJogador); // Salva o dinheiro atualizado do assinante

    return { msg: `✅ Assinatura de ${creatorInfo.nomeExibicao} ativada por ${taxa} moedas! Válida por 1 mês. Use .feed ${nomeCriador} para ver o conteúdo.` };
}

// Cancela a subscrição a um criador
async function cancelarSubscricao(senderId, nomeCriador) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    const nomeNormalizado = normalizar(nomeCriador);
    const creatorEntry = Object.entries(CREATORS_LIST).find(([id, data]) => normalizar(data.nomeExibicao) === nomeNormalizado || id.split("@")[0] === nomeCriador.replace("@", ""));

    if (!creatorEntry) return { msg: `❓ Criador "${nomeCriador}" não encontrado.` };

    const [creatorId, creatorInfo] = creatorEntry;
    let dadosCriador = await carregarDadosCriador(creatorId);
    if (!dadosCriador) return { msg: "❌ Erro ao carregar dados do criador." };

    if (!dadosCriador.assinantes[senderId]) {
        return { msg: `❌ Você não é assinante de ${creatorInfo.nomeExibicao}.` };
    }

    // Remove assinante
    delete dadosCriador.assinantes[senderId];

    const saveCreator = await salvarDadosCriador(creatorId, dadosCriador);
    if (!saveCreator) return { msg: "❌ Erro ao salvar dados ao cancelar assinatura." };

    return { msg: `✅ Assinatura de ${creatorInfo.nomeExibicao} cancelada. Você não será cobrado na próxima renovação.` };
}

// Vê o feed de um criador (se for assinante)
async function verFeed(senderId, nomeCriador, pagina = 1) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    const nomeNormalizado = normalizar(nomeCriador);
    const creatorEntry = Object.entries(CREATORS_LIST).find(([id, data]) => normalizar(data.nomeExibicao) === nomeNormalizado || id.split("@")[0] === nomeCriador.replace("@", ""));

    if (!creatorEntry) return { msg: `❓ Criador "${nomeCriador}" não encontrado.` };

    const [creatorId, creatorInfo] = creatorEntry;
    let dadosCriador = await carregarDadosCriador(creatorId);
    if (!dadosCriador) return { msg: "❌ Erro ao carregar dados do criador." };

    // Verifica se é o próprio criador ou um assinante válido
    const ehAssinante = !!dadosCriador.assinantes[senderId];
    const ehCriador = senderId === creatorId;

    if (!ehAssinante && !ehCriador) {
        return { msg: `🔒 Você precisa ser assinante (${creatorInfo.taxaMensal} moedas/mês) para ver o feed de ${creatorInfo.nomeExibicao}. Use .criador subscrever ${nomeCriador}` };
    }

    // Verifica validade da assinatura (se não for o criador)
    if (ehAssinante) {
        const agora = new Date();
        const proximoPagamento = new Date(dadosCriador.assinantes[senderId].proximo_pagamento);
        if (agora > proximoPagamento) {
            // Remove assinatura expirada
            delete dadosCriador.assinantes[senderId];
            await salvarDadosCriador(creatorId, dadosCriador);
            return { msg: `⏳ Sua assinatura de ${creatorInfo.nomeExibicao} expirou! Renove com .criador subscrever ${nomeCriador}` };
        }
    }

    if (dadosCriador.posts.length === 0) {
        return { msg: `📪 O feed de ${creatorInfo.nomeExibicao} está vazio por enquanto.` };
    }

    const porPagina = 3; // Quantos posts mostrar por página
    const inicio = (pagina - 1) * porPagina;
    const fim = inicio + porPagina;
    const totalPaginas = Math.ceil(dadosCriador.posts.length / porPagina);

    if (pagina < 1 || pagina > totalPaginas) {
        return { msg: `⚠️ Página inválida. O feed tem ${totalPaginas} páginas.` };
    }

    const postsPagina = dadosCriador.posts.slice(inicio, fim);

    let texto = `📰 *Feed de ${creatorInfo.nomeExibicao} (Página ${pagina}/${totalPaginas}):*
=====================
`;
    postsPagina.forEach(post => {
        const dataPost = new Date(post.timestamp).toLocaleString("pt-BR");
        texto += `*Postado em:* ${dataPost}
`;
        if (post.texto) {
            texto += `*Texto:* ${post.texto}
`;
        }
        if (post.media) {
            texto += `*Mídia:* [${post.media.type === 'image' ? 'Imagem' : 'Vídeo'}] ${post.media.url}
`;
        }
        texto += `*Gorjetas:* ${post.gorjetas} moedas
`;
        texto += `---------------------
`;
    });
    texto += `Use .feed ${nomeCriador} [numero_pagina] para ver outras páginas.
Use .criador gorjeta ${nomeCriador} <post_id> <valor> para apoiar!`;

    return { msg: texto };
}

// TODO: Implementar gorjetas
// async function darGorjeta(senderId, nomeCriador, postId, valor) { ... }

// TODO: Implementar desativação de perfil
// async function desativarPerfilCriador(senderId) { ... }

// TODO: Implementar renovação automática (pode ser complexo, talvez manual por enquanto)

module.exports = {
    ativarPerfilCriador,
    postarConteudo,
    subscreverCriador,
    cancelarSubscricao,
    verFeed,
    // Exportar outras funções
    CREATORS_LIST
};


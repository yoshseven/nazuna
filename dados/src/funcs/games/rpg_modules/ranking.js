/*
 * Módulo de Ranking - RPG Nazuna (Versão Aprimorada)
 * Gerencia a leitura, escrita e exibição dos rankings (Ouro, XP, Monstros, PvP).
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const fs = require("fs").promises;
const path = require("path");
const { RpgPath, carregarDadosJogador, formatarMoeda } = require("./utils"); // Adicionado formatarMoeda
const { GERAL } = require("./config");

const RankPath = path.join("dados", "database", "ranking.json");

// Estrutura esperada do ranking.json:
// {
//   "ouro": { "senderId1": 1000, "senderId2": 500 },
//   "xp": { "senderId1": 200, "senderId2": 150 },
//   "monstros": { "senderId1": 50, "senderId2": 30 },
//   "pvp": { "senderId1": { "rating": 1500, "vitorias": 10, "derrotas": 5 }, ... },
//   "reset": timestamp // Data do último reset (se aplicável)
// }

// Garante que o arquivo de ranking exista com a estrutura correta
async function inicializarRanking() {
    try {
        await fs.access(RankPath);
        // Verifica se as categorias existem, se não, adiciona
        const ranking = await lerRanking(false); // Lê sem inicializar recursivamente
        let modificado = false;
        const categorias = ["ouro", "xp", "monstros", "pvp"];
        for (const cat of categorias) {
            if (!ranking[cat]) {
                ranking[cat] = {};
                modificado = true;
                console.log(`${GERAL.NOME_BOT} Info: Categoria de ranking '${cat}' adicionada ao arquivo.`);
            }
        }
        if (!ranking.reset) {
            ranking.reset = Date.now();
            modificado = true;
        }
        if (modificado) {
            await salvarRanking(ranking);
        }

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`${GERAL.NOME_BOT} Info: Arquivo de ranking não encontrado. Criando um novo...`);
            try {
                const estruturaInicial = { ouro: {}, xp: {}, monstros: {}, pvp: {}, reset: Date.now() };
                await fs.writeFile(RankPath, JSON.stringify(estruturaInicial, null, 2));
                console.log(`${GERAL.NOME_BOT} Info: Arquivo de ranking criado com sucesso.`);
            } catch (writeError) {
                console.error(`${GERAL.NOME_BOT} Erro: Falha crítica ao criar o arquivo de ranking:`, writeError);
            }
        } else {
            console.error(`${GERAL.NOME_BOT} Erro: Falha ao verificar/inicializar o arquivo de ranking:`, error);
        }
    }
}

// Chama a inicialização quando o módulo é carregado
inicializarRanking();

// Lê o arquivo de ranking
async function lerRanking(garantirInicializacao = true) {
    try {
        if (garantirInicializacao) {
            await inicializarRanking(); // Garante que o ficheiro e categorias existam
        }
        const data = await fs.readFile(RankPath, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha ao ler o arquivo de ranking:`, err);
        return { ouro: {}, xp: {}, monstros: {}, pvp: {}, reset: null }; // Estrutura vazia em caso de erro
    }
}

// Escreve no arquivo de ranking
async function salvarRanking(rankingData) {
    try {
        await fs.writeFile(RankPath, JSON.stringify(rankingData, null, 2));
        return true;
    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha ao salvar o arquivo de ranking:`, err);
        return false;
    }
}

// Atualiza o valor de um jogador em um tipo específico de ranking (ouro, xp, monstros)
async function atualizarRankingSimples(senderId, tipo, valor) {
    if (!senderId || !["ouro", "xp", "monstros"].includes(tipo) || typeof valor !== 'number') {
        console.error(`${GERAL.NOME_BOT} Erro: Parâmetros inválidos para atualizarRankingSimples.`, { senderId, tipo, valor });
        return false;
    }
    
    try {
        const ranking = await lerRanking();
        if (!ranking[tipo]) ranking[tipo] = {}; // Garante que a categoria existe
        
        ranking[tipo][senderId] = (ranking[tipo][senderId] || 0) + valor;
        
        // Garante que o valor não seja negativo (opcional)
        // if (ranking[tipo][senderId] < 0) ranking[tipo][senderId] = 0;

        return await salvarRanking(ranking);
    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha ao atualizar ranking simples para ${senderId} (tipo: ${tipo}):`, err);
        return false;
    }
}

// --- Lógica de Ranking PvP (Elo Simplificado) ---

const ELO_K_FACTOR = 32; // Fator K padrão para cálculo Elo
const ELO_DEFAULT_RATING = 1500; // Rating inicial para novos jogadores no PvP

// Calcula a probabilidade esperada de vitória do jogador A sobre o jogador B
function calcularProbabilidadeEsperada(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

// Atualiza o ranking PvP após uma batalha
async function atualizarRankingPvP(vencedorId, perdedorId) {
    if (!vencedorId || !perdedorId) {
        console.warn(`${GERAL.NOME_BOT} Warn: Tentativa de atualizar ranking PvP sem vencedor/perdedor definidos.`);
        return false;
    }

    try {
        const ranking = await lerRanking();
        if (!ranking.pvp) ranking.pvp = {}; // Garante que a categoria existe

        // Obtém ou inicializa os dados dos jogadores no ranking PvP
        const dadosVencedor = ranking.pvp[vencedorId] || { rating: ELO_DEFAULT_RATING, vitorias: 0, derrotas: 0 };
        const dadosPerdedor = ranking.pvp[perdedorId] || { rating: ELO_DEFAULT_RATING, vitorias: 0, derrotas: 0 };

        // Calcula as probabilidades esperadas
        const probVencedor = calcularProbabilidadeEsperada(dadosVencedor.rating, dadosPerdedor.rating);
        const probPerdedor = calcularProbabilidadeEsperada(dadosPerdedor.rating, dadosVencedor.rating);

        // Calcula a mudança no rating Elo
        const mudancaRatingVencedor = Math.round(ELO_K_FACTOR * (1 - probVencedor));
        const mudancaRatingPerdedor = Math.round(ELO_K_FACTOR * (0 - probPerdedor));

        // Atualiza os ratings e contadores
        dadosVencedor.rating += mudancaRatingVencedor;
        dadosVencedor.vitorias += 1;
        dadosPerdedor.rating += mudancaRatingPerdedor;
        // Garante que o rating não fique abaixo de um mínimo (ex: 100)
        dadosPerdedor.rating = Math.max(100, dadosPerdedor.rating); 
        dadosPerdedor.derrotas += 1;

        // Salva os dados atualizados no objeto ranking
        ranking.pvp[vencedorId] = dadosVencedor;
        ranking.pvp[perdedorId] = dadosPerdedor;

        // Salva o arquivo de ranking
        const sucesso = await salvarRanking(ranking);
        if (sucesso) {
            console.log(`${GERAL.NOME_BOT} Info: Ranking PvP atualizado. Vencedor: ${vencedorId} (+${mudancaRatingVencedor}), Perdedor: ${perdedorId} (${mudancaRatingPerdedor})`);
        }
        return sucesso;

    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha ao atualizar ranking PvP entre ${vencedorId} e ${perdedorId}:`, err);
        return false;
    }
}

// Obtém o ranking formatado para exibição
async function obterRankingFormatado(tipo, limite = 5) {
    try {
        const ranking = await lerRanking();
        if (!ranking[tipo]) {
            return `⚠️ Ranking de '${tipo}' não encontrado ou vazio.`;
        }

        let rankingArray = [];
        let titulo = `🏆 *Top ${limite} - Ranking de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}* 🏆`;
        let formatarValor = (v) => v; // Função padrão para formatar valor

        if (tipo === "pvp") {
            titulo = `⚔️ *Top ${limite} - Ranking PvP (Elo)* ⚔️`;
            rankingArray = Object.entries(ranking.pvp).map(([id, dados]) => [id, dados]); // [ [senderId, { rating, v, d }], ... ]
            // Ordena por rating (decrescente)
            rankingArray.sort(([, dadosA], [, dadosB]) => dadosB.rating - dadosA.rating);
            formatarValor = (dados) => `${dados.rating} Elo (V:${dados.vitorias}/D:${dados.derrotas})`;
        } else if (tipo === "ouro") {
            rankingArray = Object.entries(ranking.ouro); // [ [senderId, valor], ... ]
            rankingArray.sort(([, valorA], [, valorB]) => valorB - valorA);
            formatarValor = (v) => formatarMoeda(v);
        } else { // xp, monstros
            rankingArray = Object.entries(ranking[tipo]);
            rankingArray.sort(([, valorA], [, valorB]) => valorB - valorA);
        }

        if (rankingArray.length === 0) {
            return `📊 Ranking de *${tipo.charAt(0).toUpperCase() + tipo.slice(1)}* está vazio por enquanto!`;
        }

        // Pega os top 'limite'
        const topRanking = rankingArray.slice(0, limite);

        // Busca os nomes dos jogadores
        let textoRanking = `${titulo}\n---------------------------------\n`;
        let posicao = 1;
        for (const [senderId, valorOuDados] of topRanking) {
            let nomeJogador = `Lenda_${senderId.substring(0, 4)}`; // Nome padrão
            try {
                const dadosJogador = await carregarDadosJogador(senderId);
                if (dadosJogador && dadosJogador.nome) {
                    nomeJogador = dadosJogador.nome;
                }
            } catch (e) { /* Ignora se não conseguir carregar dados */ }
            
            textoRanking += `${posicao}. *${nomeJogador}* - ${formatarValor(valorOuDados)}\n`;
            posicao++;
        }
        textoRanking += "---------------------------------";

        return textoRanking;

    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha ao formatar ranking de ${tipo}:`, err);
        return `⚙️ ${GERAL.NOME_BOT} Erro: Não foi possível obter o ranking de ${tipo}. Tente novamente mais tarde.`;
    }
}

module.exports = {
    lerRanking,
    salvarRanking,
    atualizarRankingSimples, // Para ouro, xp, monstros
    atualizarRankingPvP,     // Para PvP
    obterRankingFormatado,
    inicializarRanking
};


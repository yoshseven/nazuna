/*
 * Módulo de Filhos - RPG Nazuna (Versão Polida)
 * Gerencia a possibilidade de ter e interagir com filhos após o casamento.
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const { carregarDadosJogador, salvarDadosJogador, normalizar, formatarMoeda } = require("./utils");
const { GERAL, MOEDA, DIFICULDADE } = require("./config");
const { encontrarNPC } = require("./relationships"); // Para obter nome do cônjuge

// --- Funções de Gestão e Lógica ---

// Inicializa a estrutura de filhos se não existir
function inicializarEstruturaFilhos(dadosJogador) {
    if (!dadosJogador.familia) {
        dadosJogador.familia = {
            filhos: [] // Array de objetos representando os filhos
        };
    }
    if (!Array.isArray(dadosJogador.familia.filhos)) {
        dadosJogador.familia.filhos = [];
    }
}

// Gera um nome aleatório para um filho (pode ser expandido com mais opções)
function gerarNomeFilho(sexo) {
    const nomesMasculinos = ["Hiroshi", "Kenji", "Yuki", "Ren", "Haru", "Sora", "Daiki", "Kazuki", "Ryo", "Takumi"];
    const nomesFemininos = ["Aiko", "Yumi", "Hana", "Sakura", "Mei", "Rin", "Emi", "Nao", "Yua", "Mio"];
    
    if (sexo === "masculino") {
        return nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)];
    } else {
        return nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];
    }
}

// Verifica a possibilidade de ter um filho (pode ser chamado periodicamente ou por comando)
async function tentarTerFilho(senderId) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };

    const dadosRelacionamento = dadosJogador.relacionamentos || {};
    const conjugeId = dadosRelacionamento.conjuge;

    if (!conjugeId) {
        return { success: false, msg: "💍 Você precisa estar casado(a) e feliz para pensar em aumentar a família!" };
    }

    const npcConjuge = encontrarNPC(conjugeId);
    if (!npcConjuge) {
         console.error(`${GERAL.NOME_BOT} Erro: Cônjuge ${conjugeId} não encontrado no NPC_DB para ${senderId}`);
         return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Não foi possível encontrar informações sobre seu cônjuge.` };
    }

    inicializarEstruturaFilhos(dadosJogador);

    // Condições para ter filho (Exemplos)
    const tempoMinimoCasado = (DIFICULDADE.TEMPO_MIN_CASADO_PARA_FILHO_DIAS || 7) * 24 * 60 * 60 * 1000;
    const dataCasamento = dadosRelacionamento[conjugeId]?.data_casamento;
    if (!dataCasamento || (Date.now() - dataCasamento < tempoMinimoCasado)) {
        const diasRestantes = Math.ceil((tempoMinimoCasado - (Date.now() - (dataCasamento || Date.now()))) / (1000 * 60 * 60 * 24));
        return { success: false, msg: `⏳ O amor precisa de tempo para florescer... e a família também! Talvez daqui a ${diasRestantes} dia(s).` };
    }

    // Limite de filhos
    if (dadosJogador.familia.filhos.length >= (DIFICULDADE.MAX_FILHOS_POR_JOGADOR || 2)) {
        return { success: false, msg: `👨‍👩‍👧‍👦 Sua casa já está cheia de alegria (e barulho)! O limite de filhos foi atingido por enquanto.` };
    }

    // Chance de ter filho
    const chance = DIFICULDADE.CHANCE_TER_FILHO_POR_TENTATIVA || 0.10;
    if (Math.random() < chance) {
        const sexo = Math.random() < 0.5 ? "masculino" : "feminino";
        const nomeFilho = gerarNomeFilho(sexo);
        
        const novoFilho = {
            id: `child_${senderId}_${Date.now()}`,
            nome: nomeFilho,
            sexo: sexo,
            data_nascimento: Date.now(),
            estagio: "bebe" // bebe, crianca, adolescente (futuro)
            // Adicionar mais atributos no futuro: humor, necessidades, etc.
        };

        dadosJogador.familia.filhos.push(novoFilho);
        await salvarDadosJogador(senderId, dadosJogador);

        const emojiSexo = sexo === "masculino" ? "👦" : "👧";
        return {
            success: true,
            msg: `🎉👶 Boas Novas! A cegonha trouxe um presente especial! Você e ${npcConjuge.nome} tiveram um(a) lindo(a) ${sexo === "masculino" ? "filho" : "filha"} chamado(a) *${nomeFilho}*! ${emojiSexo}\nPrepare-se para noites sem dormir e muitas alegrias!`
        };
    } else {
        return { success: false, msg: `🕰️ A natureza tem seu próprio tempo... Parece que não foi desta vez. Mas não desanime!` };
    }
}

// Visualiza os filhos do jogador
async function verFilhos(senderId) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece...` };

    inicializarEstruturaFilhos(dadosJogador);

    if (dadosJogador.familia.filhos.length === 0) {
        return { success: true, msg: "👨‍👩‍👧 Sua família ainda não cresceu. Se for casado(a), quem sabe o futuro reserva uma surpresa?" };
    }

    let msg = "🌟 --- Sua Família --- 🌟\n";
    dadosJogador.familia.filhos.forEach(filho => {
        const idadeMs = Date.now() - filho.data_nascimento;
        // Simplificado para dias por enquanto
        const idadeDias = Math.floor(idadeMs / (1000 * 60 * 60 * 24)); 
        const emojiSexo = filho.sexo === "masculino" ? "👶" : "👶"; // Usar bebê por enquanto
        msg += `\n${emojiSexo} *${filho.nome}* (${filho.sexo})
   - Idade: ${idadeDias} dia(s) de vida (Estágio: ${filho.estagio || 'bebê'})\n`; // Expandir para mostrar estágio de vida
    });

    return { success: true, msg: msg };
}

// TODO: Adicionar interações com filhos (brincar, ensinar, etc.) que podem dar bônus ou afetar o desenvolvimento.
// Ex: interagirFilho(senderId, idFilho, tipoInteracao)

module.exports = {
    tentarTerFilho,
    verFilhos
};


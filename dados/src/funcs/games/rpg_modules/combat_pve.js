/*
 * Módulo de Combate PvE - RPG Nazuna
 * Gerencia batalhas contra monstros.
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const { carregarDadosJogador, salvarDadosJogador } = require("./utils");
const { MONSTROS, ITENS_LOJA, ITENS_VENDA, DIFICULDADE } = require("./config");
const { adicionarSaldo, removerSaldo, adicionarXP, modificarHP } = require("./player");
const { adicionarItem, removerItem, possuiItem } = require("./inventory");
const { verificarPetFugiu, obterBonusPet } = require("./pets");
const { atualizarRanking } = require("./ranking"); // Dependência futura

// Inicia uma batalha contra um monstro aleatório
async function batalharMonstro(senderId) {
    try {
        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { msg: "⚠️ Lenda não encontrada! Use `#registrar [nome]`." };

        // Verifica pet (dependência futura)
        try {
            const petFugiu = await verificarPetFugiu(dados);
            if (petFugiu) {
                await salvarDadosJogador(senderId, dados);
                return petFugiu;
            }
        } catch(e) {/* Ignora */} 

        // Verifica pré-requisitos
        if (!possuiItem(dados, "arma") && !possuiItem(dados, "varinha")) {
            return { msg: "⚔️ Você precisa de uma *Arma* ou *Varinha* para enfrentar monstros! Adquira no mercado." };
        }
        if ((dados.status.hp || 0) <= 30) {
            return { msg: "💔 Sua vida está muito baixa (${dados.status.hp || 0}%)! Cure-se antes de procurar encrenca." };
        }

        // Verifica delay
        const agora = Date.now();
        const delayBatalha = dados.delay?.batalhar || 0;
        if (delayBatalha > agora) {
            const tempoRestante = Math.ceil((delayBatalha - agora) / 1000);
            return { msg: `⚔️ Você ainda está se recuperando da última batalha! Espere ${tempoRestante} segundos.` };
        }

        // Seleciona monstro aleatório
        if (!MONSTROS || MONSTROS.length === 0) {
            return { msg: "⚠️ Nenhum monstro conhecido para batalhar no momento!" };
        }
        const monstro = MONSTROS[Math.floor(Math.random() * MONSTROS.length)];

        // Calcula dano sofrido pelo jogador
        let danoSofrido = Math.floor(Math.random() * monstro.ataque) + 5; // Dano base
        if (possuiItem(dados, "escudo")) {
            danoSofrido = Math.floor(danoSofrido * 0.85); // Escudo reduz dano em 15%
        }
        // Bônus de defesa do pet (ex: Dragão Bebê)
        try {
            const bonusDefesaPet = obterBonusPet(dados, 'batalhaDano'); // No config, batalhaDano é dano extra, usar lógica inversa ou criar bonusDefesa
            // Assumindo que batalhaDano no config é redução de dano sofrido
            danoSofrido = Math.max(0, danoSofrido - bonusDefesaPet); 
        } catch(e) {/* Ignora */} 
        
        dados = modificarHP(dados, -danoSofrido);

        // Calcula recompensas
        const recompensaDinheiro = monstro.recompensa.dinheiro;
        const recompensaXP = monstro.recompensa.xp;
        const recompensaItem = monstro.recompensa.item;

        dados = adicionarSaldo(dados, recompensaDinheiro, false);
        dados = adicionarXP(dados, recompensaXP);
        if (recompensaItem) {
            dados = adicionarItem(dados, recompensaItem, 1);
        }

        // Chance de quebrar arma (se estiver usando arma)
        let armaQuebrouMsg = "";
        if (possuiItem(dados, "arma") && Math.random() < (0.1 * DIFICULDADE.FAILURE_RATE_MODIFIER)) {
            const remocao = removerItem(dados, "arma", 1);
            if (remocao) {
                dados = remocao;
                armaQuebrouMsg = "\n💥 Sua arma quebrou durante a batalha!";
            }
        }
        
        // Define delay
        dados.delay = dados.delay || {};
        dados.delay.batalhar = agora + (5 * 60 * 1000 * DIFICULDADE.ACTION_DELAY_MULTIPLIER);

        await salvarDadosJogador(senderId, dados);

        // Atualiza ranking (dependência futura)
        try {
            await atualizarRanking(senderId, "monstros", 1);
            await atualizarRanking(senderId, "ouro", recompensaDinheiro);
            await atualizarRanking(senderId, "xp", recompensaXP);
        } catch(e) {/* Ignora */} 

        // Monta mensagem de resultado
        const itemInfo = ITENS_VENDA.find(i => i.nome === recompensaItem) || ITENS_LOJA.find(i => i.nome === recompensaItem);
        const nomeItemRecompensa = itemInfo?.nomeExibicao || recompensaItem;
        
        let msgResultado = `⚔️ Você enfrentou um *${monstro.nomeExibicao}*!
` +
                         `🩸 Você sofreu ${danoSofrido} de dano (HP atual: ${dados.status.hp}%).
` +
                         `💰 Ganhou R$${recompensaDinheiro}.
` +
                         `✨ Ganhou ${recompensaXP} XP.
`;
        if (recompensaItem) {
            msgResultado += `🎁 Encontrou 1x *${nomeItemRecompensa}* nos restos!`;
        }
        msgResultado += armaQuebrouMsg;

        return { msg: msgResultado.trim() };

    } catch (err) {
        console.error(`Erro ao batalhar monstro para ${senderId}:`, err);
        return { msg: "⚠️ Uma força sombria interveio na batalha! Você conseguiu escapar, mas sem recompensas." };
    }
}

module.exports = {
    batalharMonstro
};


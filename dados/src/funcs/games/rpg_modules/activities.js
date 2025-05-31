/*
 * Módulo de Atividades - RPG Nazuna
 * Gerencia ações de coleta de recursos como mineração, pesca, caça, etc.
 * 
 * Criado originalmente por: Hiudy
 * 
 * Manter créditos ao criar ou modificar!
 */

const { carregarDadosJogador, salvarDadosJogador } = require("./utils");
const { ITENS_LOJA, ITENS_VENDA, DIFICULDADE, MONSTROS } = require("./config"); // MONSTROS pode não ser necessário aqui, mas estava no original
const { adicionarSaldo, removerSaldo, adicionarXP, modificarHP, modificarFadiga, modificarMoral } = require("./player");
const { adicionarItem, removerItem, possuiItem } = require("./inventory");
const { verificarPetFugiu, obterBonusPet } = require("./pets"); // Dependência futura
// const { atualizarRanking } = require("./ranking"); // Dependência futura

// Função genérica para verificar pré-requisitos comuns (jogador existe, pet, delay)
async function verificarPreRequisitosAtividade(senderId, nomeAtividade, itemNecessario = null) {
    let dados = await carregarDadosJogador(senderId);
    if (!dados) return { erro: "⚠️ Lenda não encontrada! Use `#registrar [nome]`." };

    // Verifica pet (dependência futura)
    try {
        const petFugiu = await verificarPetFugiu(dados);
        if (petFugiu) {
            await salvarDadosJogador(senderId, dados);
            return { erro: petFugiu.msg, dados }; // Retorna dados atualizados
        }
    } catch(e) {/* Ignora */} 

    // Verifica item necessário
    if (itemNecessario && !possuiItem(dados, itemNecessario)) {
        const itemInfo = ITENS_LOJA.find(i => i.nome === itemNecessario);
        return { erro: `🛠️ Você precisa de *${itemInfo?.nomeExibicao || itemNecessario}* para esta atividade! Compre no mercado.` };
    }
    
    // Verifica item necessário secundário (ex: munição para caçar)
    if (nomeAtividade === 'cacar' && !possuiItem(dados, 'municao')) {
        return { erro: `🏹 Você precisa de *Munição* para caçar!` };
    }

    // Verifica delay
    const agora = Date.now();
    const delayAtividade = dados.delay?.[nomeAtividade] || 0;
    if (delayAtividade > agora) {
        const tempoRestante = Math.ceil((delayAtividade - agora) / 1000);
        // Mensagens de delay específicas por atividade
        const mensagensDelay = {
            minerar: `⛏️ A mina ainda ecoa com seus últimos golpes! Espere ${tempoRestante} segundos.`,
            pescar: `🌊 As águas precisam de calma... e você também! Espere ${tempoRestante} segundos.`,
            cacar: `🦌 As presas estão ariscas. Deixe a floresta descansar por ${tempoRestante} segundos.`,
            plantar: `🌾 A terra precisa absorver os nutrientes. Volte em ${tempoRestante} segundos.`,
            cortar: `🌲 A floresta sussurra para esperar... Volte em ${tempoRestante} segundos.`
        };
        return { erro: mensagensDelay[nomeAtividade] || `⏳ Ação em cooldown! Espere ${tempoRestante} segundos.` };
    }

    return { dados }; // Retorna os dados do jogador se tudo estiver OK
}

// Mineração
async function minerar(senderId) {
    const check = await verificarPreRequisitosAtividade(senderId, "minerar", "picareta");
    if (check.erro) return { msg: check.erro };
    let dados = check.dados;

    try {
        const agora = Date.now();
        const mineriosPossiveis = [
            { nome: "carvao", chance: 50, nomeExibicao: "Carvão" },
            { nome: "ferro", chance: 30, nomeExibicao: "Ferro" },
            { nome: "prata", chance: 20, nomeExibicao: "Prata" },
            { nome: "ouro", chance: 15, nomeExibicao: "Ouro" },
            { nome: "diamante", chance: 5 * (1 / DIFICULDADE.FAILURE_RATE_MODIFIER), nomeExibicao: "Diamante" }, // Mais difícil encontrar raros
            { nome: "esmeralda", chance: 3 * (1 / DIFICULDADE.FAILURE_RATE_MODIFIER), nomeExibicao: "Esmeralda" }
        ];
        
        const ganhos = [];
        let picaretaQuebrou = false;

        // Lógica de mineração
        for (const m of mineriosPossiveis) {
            if (Math.random() * 100 < m.chance) {
                const qtd = Math.floor(Math.random() * 3) + 1; // 1 a 3
                ganhos.push({ nome: m.nome, qtd, nomeExibicao: m.nomeExibicao });
                dados = adicionarItem(dados, m.nome, qtd);
            }
        }

        // Chance de quebrar picareta (aumentada pela dificuldade)
        if (Math.random() < (0.25 * DIFICULDADE.FAILURE_RATE_MODIFIER)) {
            const remocao = removerItem(dados, "picareta", 1);
            if (remocao) {
                dados = remocao;
                picaretaQuebrou = true;
            }
        }

        // Define delay (aumentado pela dificuldade)
        dados.delay = dados.delay || {};
        dados.delay.minerar = agora + (3 * 60 * 1000 * DIFICULDADE.ACTION_DELAY_MULTIPLIER);
        dados = modificarFadiga(dados, 10);

        await salvarDadosJogador(senderId, dados);

        let texto = ganhos.length ? ganhos.map(g => `${g.qtd}x *${g.nomeExibicao}*`).join(", ") : "nada de valor";
        let msgFinal = `⛏️ Você balançou sua picareta e encontrou: ${texto}!`;
        if (picaretaQuebrou) {
            msgFinal += "\n💥 *Sua picareta quebrou no processo!* Você precisará de uma nova.";
        }
        if (!ganhos.length && !picaretaQuebrou) {
             msgFinal = "⛏️ Você minerou diligentemente, mas encontrou apenas pedras comuns desta vez.";
        }

        return { msg: msgFinal };

    } catch (err) {
        console.error(`Erro ao minerar para ${senderId}:`, err);
        return { msg: "⚠️ Um desmoronamento repentino o forçou a sair da mina!" };
    }
}

// Pesca
async function pescar(senderId) {
    const check = await verificarPreRequisitosAtividade(senderId, "pescar", "isca");
    if (check.erro) return { msg: check.erro };
    let dados = check.dados;

    try {
        const agora = Date.now();
        let peixes = Math.floor(Math.random() * 11) + 5; // 5 a 15
        peixes = Math.floor(peixes * (1 / DIFICULDADE.FAILURE_RATE_MODIFIER)); // Menos peixes com dificuldade

        // Aplica bônus do pet (dependência futura)
        try {
            const bonus = obterBonusPet(dados, 'pesca'); // Exemplo
            if (bonus) peixes = Math.floor(peixes * bonus);
        } catch(e) {/* Ignora */} 

        // Consome isca e adiciona peixes
        let remocao = removerItem(dados, "isca", 1);
        if (!remocao) return { msg: "⚠️ Algo deu errado ao usar a isca!" }; // Segurança
        dados = remocao;
        dados = adicionarItem(dados, "peixe", peixes);

        // Define delay
        dados.delay = dados.delay || {};
        dados.delay.pescar = agora + (2 * 60 * 1000 * DIFICULDADE.ACTION_DELAY_MULTIPLIER);
        dados = modificarFadiga(dados, 5);

        await salvarDadosJogador(senderId, dados);

        return { msg: `🎣 Lançou a linha e fisgou ${peixes} peixes! Bom trabalho, pescador!` };

    } catch (err) {
        console.error(`Erro ao pescar para ${senderId}:`, err);
        return { msg: "⚠️ Um monstro marinho faminto roubou sua isca e assustou os peixes!" };
    }
}

// Caça
async function cacar(senderId) {
    // Verifica arma E munição
    const check = await verificarPreRequisitosAtividade(senderId, "cacar", "arma"); 
    if (check.erro) return { msg: check.erro };
    let dados = check.dados;

    try {
        const agora = Date.now();
        let carnes = Math.floor(Math.random() * 11) + 10; // 10 a 20
        carnes = Math.floor(carnes * (1 / DIFICULDADE.FAILURE_RATE_MODIFIER)); // Menos carne com dificuldade
        let armaQuebrou = false;

        // Aplica bônus do pet (dependência futura)
        try {
            const bonus = obterBonusPet(dados, 'caca'); // Exemplo
            if (bonus) carnes = Math.floor(carnes * bonus);
        } catch(e) {/* Ignora */} 

        // Consome munição
        let remocaoMunicao = removerItem(dados, "municao", 1);
        if (!remocaoMunicao) return { msg: "⚠️ Falha ao usar a munição!" };
        dados = remocaoMunicao;

        // Chance de quebrar arma
        if (Math.random() < (0.2 * DIFICULDADE.FAILURE_RATE_MODIFIER)) {
            const remocaoArma = removerItem(dados, "arma", 1);
            if (remocaoArma) {
                dados = remocaoArma;
                armaQuebrou = true;
            }
        }

        // Adiciona carne
        dados = adicionarItem(dados, "carne", carnes);

        // Define delay
        dados.delay = dados.delay || {};
        dados.delay.cacar = agora + (4 * 60 * 1000 * DIFICULDADE.ACTION_DELAY_MULTIPLIER);
        dados = modificarFadiga(dados, 12);

        await salvarDadosJogador(senderId, dados);

        let msgFinal = `🏹 Rastreou sua presa e conseguiu ${carnes} carnes suculentas!`;
        if (armaQuebrou) {
            msgFinal = `🏹 Caçou ${carnes} carnes, mas *sua arma não resistiu e quebrou*!`;
        }

        return { msg: msgFinal };

    } catch (err) {
        console.error(`Erro ao caçar para ${senderId}:`, err);
        return { msg: "⚠️ Um urso furioso o expulsou da floresta antes que pudesse caçar!" };
    }
}

// Plantar
async function plantar(senderId) {
    const check = await verificarPreRequisitosAtividade(senderId, "plantar", "semente");
    if (check.erro) return { msg: check.erro };
    let dados = check.dados;

    try {
        const agora = Date.now();
        let colheita = Math.floor(Math.random() * 5) + 3; // 3 a 7
        colheita = Math.floor(colheita * (1 / DIFICULDADE.FAILURE_RATE_MODIFIER)); // Menos colheita

        // Aplica bônus do pet (dependência futura)
        try {
            const bonus = obterBonusPet(dados, 'plantio'); // Exemplo
            if (bonus) colheita = Math.floor(colheita * bonus);
        } catch(e) {/* Ignora */} 

        // Consome semente e adiciona trigo
        let remocao = removerItem(dados, "semente", 1);
        if (!remocao) return { msg: "⚠️ Falha ao usar a semente!" };
        dados = remocao;
        dados = adicionarItem(dados, "trigo", colheita);

        // Define delay
        dados.delay = dados.delay || {};
        dados.delay.plantar = agora + (5 * 60 * 1000 * DIFICULDADE.ACTION_DELAY_MULTIPLIER);
        dados = modificarFadiga(dados, 8);

        await salvarDadosJogador(senderId, dados);

        return { msg: `🌾 Semeou, cuidou e colheu ${colheita} trigos dourados! O trabalho árduo compensa.` };

    } catch (err) {
        console.error(`Erro ao plantar para ${senderId}:`, err);
        return { msg: "⚠️ Uma praga de gafanhotos devorou sua plantação antes da colheita!" };
    }
}

// Cortar Madeira
async function cortar(senderId) {
    const check = await verificarPreRequisitosAtividade(senderId, "cortar", "machado");
    if (check.erro) return { msg: check.erro };
    let dados = check.dados;

    try {
        const agora = Date.now();
        let madeira = Math.floor(Math.random() * 7) + 4; // 4 a 10
        madeira = Math.floor(madeira * (1 / DIFICULDADE.FAILURE_RATE_MODIFIER)); // Menos madeira
        let machadoQuebrou = false;

        // Aplica bônus do pet (dependência futura)
        try {
            const bonus = obterBonusPet(dados, 'corte'); // Exemplo
            if (bonus) madeira = Math.floor(madeira * bonus);
        } catch(e) {/* Ignora */} 

        // Chance de quebrar machado
        if (Math.random() < (0.2 * DIFICULDADE.FAILURE_RATE_MODIFIER)) {
            const remocao = removerItem(dados, "machado", 1);
            if (remocao) {
                dados = remocao;
                machadoQuebrou = true;
            }
        }

        // Adiciona madeira
        dados = adicionarItem(dados, "madeira", madeira);

        // Define delay
        dados.delay = dados.delay || {};
        dados.delay.cortar = agora + (3 * 60 * 1000 * DIFICULDADE.ACTION_DELAY_MULTIPLIER);
        dados = modificarFadiga(dados, 10);

        await salvarDadosJogador(senderId, dados);

        let msgFinal = `🪓 Derrubou árvores e coletou ${madeira} toras de madeira!`;
        if (machadoQuebrou) {
            msgFinal = `🪓 Cortou ${madeira} madeiras, mas *seu machado cedeu e quebrou*!`;
        }

        return { msg: msgFinal };

    } catch (err) {
        console.error(`Erro ao cortar para ${senderId}:`, err);
        return { msg: "⚠️ Um espírito ancestral da floresta o expulsou antes que pudesse cortar mais!" };
    }
}

module.exports = {
    minerar,
    pescar,
    cacar,
    plantar,
    cortar
};


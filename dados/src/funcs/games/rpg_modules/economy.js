/*
 * Módulo de Economia - RPG Nazuna
 * Gerencia empregos, loja, compra/venda e banco.
 * 
 * Criado originalmente por: Hiudy
 * 
 * Manter créditos ao criar ou modificar!
 */

const { carregarDadosJogador, salvarDadosJogador, normalizar, formatarMoeda } = require("./utils");
const { EMPREGOS, ITENS_LOJA, ITENS_VENDA, DIFICULDADE, VALORES_INICIAIS_JOGADOR, MOEDA, BANCO, GERAL, LIMITES } = require("./config");
const { adicionarSaldo, removerSaldo, adicionarXP, modificarHP, modificarFadiga, modificarMoral } = require("./player");
const { adicionarItem, removerItem, possuiItem, formatarInventario } = require("./inventory");
const { verificarPetFugiu } = require("./pets"); // Dependência futura
const { atualizarRanking } = require("./ranking"); // Dependência futura

// Lista os empregos disponíveis e bloqueados para o jogador
async function listarEmpregos(senderId) {
    try {
        const dados = await carregarDadosJogador(senderId);
        if (!dados) return { msg: "⚠️ Lenda não encontrada! Use `#registrar [nome]`." };

        const xpAtual = dados.xp || 0;
        const disp = EMPREGOS.filter(e => xpAtual >= e.xp).map(e => e.nome);
        const bloq = EMPREGOS.filter(e => xpAtual < e.xp).map(e => `${e.nome} (requer ${e.xp} XP)`);

        let texto = "⚔️ *Caminhos Disponíveis* ⚔️\n";
        texto += disp.length ? `- ${disp.join(", \n- ")}\n` : "Nenhum caminho livre no momento! Ganhe mais XP!\n";
        texto += "\n🔒 *Caminhos Bloqueados* 🔒\n";
        texto += bloq.length ? `- ${bloq.join(", \n- ")}` : "Nenhum caminho fechado! Você desbloqueou todos!";
        texto += `\n\nUse 
${GERAL.PREFIXO_BOT}entrar [nome_emprego]
 para seguir um caminho.`;
        return { msg: texto };
    } catch (err) {
        console.error(`Erro ao listar empregos para ${senderId}:`, err);
        return { msg: "⚠️ Os ventos do destino ocultaram os caminhos disponíveis!" };
    }
}

// Permite ao jogador sair do emprego atual
async function sairEmprego(senderId) {
    try {
        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { msg: "⚠️ Lenda não encontrada!" };
        if (dados.emprego === "desempregado") return { msg: "😅 Você já vive como um andarilho livre!" };

        const empregoAnterior = dados.emprego;
        dados.emprego = "desempregado";
        await salvarDadosJogador(senderId, dados);
        return { msg: `🌬️ Você abandonou o caminho de *${empregoAnterior}*! A liberdade (e a falta de salário) te chama, aventureiro!` };
    } catch (err) {
        console.error(`Erro ao sair do emprego para ${senderId}:`, err);
        return { msg: "⚠️ Uma força maior o impede de abandonar seu posto!" };
    }
}

// Permite ao jogador entrar em um emprego
async function entrarEmprego(senderId, nomeEmprego) {
    try {
        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { msg: "⚠️ Lenda não encontrada!" };

        const empregoNormalizado = normalizar(nomeEmprego);
        const job = EMPREGOS.find(e => normalizar(e.nome) === empregoNormalizado);

        if (!job) return { msg: `⚠️ Caminho "${nomeEmprego}" desconhecido! Veja os disponíveis com 
${GERAL.PREFIXO_BOT}empregos
.` };
        if (dados.emprego === job.nome) return { msg: `😅 Você já trilha o caminho de *${job.nome}*!` };

        const xpAtual = dados.xp || 0;
        if (xpAtual < job.xp) return { msg: `😓 Sua experiência (${xpAtual} XP) ainda não é suficiente para o caminho de *${job.nome}* (requer ${job.xp} XP)!` };

        dados.emprego = job.nome;
        await salvarDadosJogador(senderId, dados);
        return { msg: `🌟 Parabéns! Você agora trilha o caminho de *${job.nome}*! Que sua jornada seja próspera! 🛡️` };
    } catch (err) {
        console.error(`Erro ao entrar no emprego para ${senderId}:`, err);
        return { msg: "⚠️ O destino bloqueou sua tentativa de seguir este caminho!" };
    }
}

// Executa a ação de trabalhar
async function trabalhar(senderId) {
    try {
        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { msg: "⚠️ Lenda não encontrada!" };

        // Verifica pet (dependência futura)
        try {
            const petFugiu = await verificarPetFugiu(dados);
            if (petFugiu) {
                await salvarDadosJogador(senderId, dados);
                return petFugiu;
            }
        } catch(e) {/* Ignora */} 

        if (dados.emprego === "desempregado") return { msg: `😅 Andarilhos não têm patrão! Escolha um caminho com 
${GERAL.PREFIXO_BOT}entrar [emprego]
.` };
        if ((dados.status.fadiga || 0) >= 100) return { msg: "😴 Exausto! Sua energia está no limite. Descanse um pouco ou use uma poção." };
        if ((dados.status.hp || 0) <= 0) return { msg: "💔 Ferido demais para trabalhar! Cure-se antes de voltar à labuta." };

        const job = EMPREGOS.find(e => e.nome === dados.emprego);
        if (!job) {
            console.error(`Erro: Emprego inválido nos dados do jogador ${senderId}: ${dados.emprego}`);
            dados.emprego = "desempregado"; // Corrige o estado inválido
            await salvarDadosJogador(senderId, dados);
            return { msg: "⚠️ Seu caminho profissional se perdeu na névoa! Você agora é um andarilho." };
        }

        const agora = Date.now();
        const delayTrabalhar = dados.delay?.trabalhar || 0;
        if (LIMITES.ATIVAR_COOLDOWNS_ACOES && delayTrabalhar > agora) {
            const tempoRestante = Math.ceil((delayTrabalhar - agora) / 1000);
            return { msg: job.msgDelay.replace("#segundos#", tempoRestante) };
        }

        // Lógica de trabalho (simplificada, precisa expandir com as chances e textos originais)
        let salario = 0;
        let xpGanho = 1;
        let textoResultado = "";
        const chanceSucesso = Math.random(); // 0 a 1

        // Simulação básica: 70% sucesso, 20% falha parcial, 10% falha total/evento negativo
        if (chanceSucesso < 0.7) { 
            salario = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
            salario = Math.floor(salario * DIFICULDADE.GOLD_REWARD_MODIFIER);
            textoResultado = `💼 Dia produtivo como *${job.nome}*! Você ganhou ${formatarMoeda(salario)}.`;
        } else if (chanceSucesso < 0.9) {
            salario = Math.floor((Math.random() * (job.max - job.min + 1)) + job.min) / 3; // Ganha 1/3
            salario = Math.floor(salario * DIFICULDADE.GOLD_REWARD_MODIFIER);
            xpGanho = 0.5;
            textoResultado = `🛠️ Um contratempo atrapalhou seu trabalho como *${job.nome}*, mas você ainda ganhou ${formatarMoeda(salario)}.`;
        } else {
            xpGanho = 0.2;
            textoResultado = `💥 Algo deu muito errado no seu trabalho como *${job.nome}*! Sem ganhos hoje.`;
            // Adicionar penalidades específicas (perder HP, item quebrar) aqui
            if (job.nome === 'ladrao' && Math.random() < (0.2 * DIFICULDADE.FAILURE_RATE_MODIFIER)) {
                 dados = modificarHP(dados, -20);
                 textoResultado = `🚨 Pego pelos guardas durante sua atividade como *${job.nome}*! Você perdeu 20 HP.`;
            }
        }

        // Aplica ganhos e penalidades
        if (salario > 0) {
            dados = adicionarSaldo(dados, salario, false); // Adiciona na carteira
            try { await atualizarRanking(senderId, "ouro", salario); } catch(e) {/* Ignora */} 
        }
        dados = adicionarXP(dados, xpGanho);
        dados = modificarFadiga(dados, 15); // Aumenta fadiga
        dados = modificarMoral(dados, -5); // Diminui moral

        // Define o novo delay
        if (LIMITES.ATIVAR_COOLDOWNS_ACOES) {
            dados.delay = dados.delay || {};
            dados.delay.trabalhar = agora + (job.delay * 1000);
        }

        // Verifica se desbloqueou novo emprego
        const xpAtual = dados.xp || 0;
        const proximo = EMPREGOS.find(e => e.xp > job.xp && e.xp <= xpAtual && !EMPREGOS.find(j => j.nome === e.nome && j.xp < job.xp)); // Encontra o próximo nível
        if (proximo && dados.emprego !== proximo.nome) {
             textoResultado += `\n\n📜 Sua experiência abriu um novo caminho! Você agora pode se tornar *${proximo.nome}*!`;
        }

        await salvarDadosJogador(senderId, dados);
        try { await atualizarRanking(senderId, "xp", xpGanho); } catch(e) {/* Ignora */} 

        return { msg: textoResultado };

    } catch (err) {
        console.error(`Erro ao trabalhar para ${senderId}:`, err);
        return { msg: "⚠️ Uma sombra misteriosa atrapalhou seu dia de trabalho!" };
    }
}

// Mostra a loja
async function mostrarLoja() {
    try {
        let texto = `🛒 *Mercado de ${GERAL.NOME_MUNDO_RPG}* 🛒\n\n⚔️ *Tesouros à venda* ⚔️\n`;
        ITENS_LOJA.forEach(i => {
            texto += `- *${i.nomeExibicao || i.nome}*: ${formatarMoeda(i.valor)}${i.pet ? ' (Pet)' : ''}\n`;
        });
        texto += "\n📜 *Como comprar?*\nUse: `" + GERAL.PREFIXO_BOT + "comprar [item]`\nEx: `" + GERAL.PREFIXO_BOT + "comprar picareta`";
        return { msg: texto };
    } catch (err) {
        console.error("Erro ao gerar loja:", err);
        return { msg: "⚠️ O mercado parece estar fechado por decreto real!" };
    }
}

// Compra um item da loja
async function comprarItem(senderId, nomeItem, quantidade = 1) {
    try {
        const itemNormalizado = normalizar(nomeItem);
        const itemInfo = ITENS_LOJA.find(i => normalizar(i.nome) === itemNormalizado);

        if (!itemInfo) return { msg: `⚠️ Item "${nomeItem}" não encontrado no mercado! Use 
${GERAL.PREFIXO_BOT}loja
 para ver os itens.` };

        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { msg: "⚠️ Lenda não encontrada!" };

        const custoTotal = itemInfo.valor * quantidade;

        if ((dados.saldo.carteira || 0) < custoTotal) {
            return { msg: `💸 ${MOEDA.NOME_PLURAL} insuficientes na mochila! Você tem ${formatarMoeda(dados.saldo.carteira || 0)}, mas ${quantidade}x *${itemInfo.nomeExibicao || itemInfo.nome}* custa ${formatarMoeda(custoTotal)}.` };
        }

        if (itemInfo.pet && dados.pet) {
            const petAtualInfo = ITENS_LOJA.find(i => i.nome === dados.pet.nome);
            return { msg: `⚠️ Você já tem um companheiro leal ao seu lado: *${petAtualInfo?.nomeExibicao || dados.pet.nome}*!` };
        }
        if (itemInfo.pet && quantidade > 1) {
             return { msg: `⚠️ Você só pode ter um companheiro pet por vez!` };
        }

        // Remove o saldo e adiciona o item
        dados = removerSaldo(dados, custoTotal, false); // Remove da carteira
        dados = adicionarItem(dados, itemInfo.nome, quantidade);

        // Se for pet, atualiza os dados do pet
        if (itemInfo.pet) {
            dados.pet = { nome: itemInfo.nome, ultimaAlimentacao: Date.now() };
        }

        await salvarDadosJogador(senderId, dados);
        return { msg: `🛒 Você adquiriu ${quantidade}x *${itemInfo.nomeExibicao || itemInfo.nome}* por ${formatarMoeda(custoTotal)}! ${itemInfo.pet ? 'Seu novo companheiro está pronto para a aventura!' : 'Guardado na sua mochila!'}` };

    } catch (err) {
        console.error(`Erro ao comprar item para ${senderId}:`, err);
        return { msg: "⚠️ O mercador parece desconfiado e recusou sua oferta!" };
    }
}

// Vende um item do inventário
async function venderItem(senderId, nomeItem, quantidade = 1) {
    try {
        const itemNormalizado = normalizar(nomeItem);
        quantidade = parseInt(quantidade);
        if (isNaN(quantidade) || quantidade <= 0) return { msg: "⚠️ Quantidade inválida para venda." };

        // Procura o item na lista de itens vendáveis e na loja (para itens comprados)
        const itemInfoVenda = ITENS_VENDA.find(i => normalizar(i.nome) === itemNormalizado);
        const itemInfoLoja = ITENS_LOJA.find(i => normalizar(i.nome) === itemNormalizado);
        const itemInfo = itemInfoVenda || itemInfoLoja; // Prioriza info de venda se existir

        if (!itemInfo || !itemInfo.venda) return { msg: `⚠️ O item "${nomeItem}" não pode ser vendido ou não existe.` };

        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { msg: "⚠️ Lenda não encontrada!" };

        if (!possuiItem(dados, itemInfo.nome, quantidade)) {
            return { msg: `⚠️ Você não tem ${quantidade}x *${itemInfo.nomeExibicao || itemInfo.nome}* para vender! Possui: ${dados.inv[itemInfo.nome] || 0}.` };
        }

        // Se for pet, remove o pet dos dados do jogador
        if (itemInfo.pet && dados.pet?.nome === itemInfo.nome) {
            // Não se pode vender o pet ativo diretamente, talvez implementar uma função específica para abandonar/vender pet?
            // Por agora, vamos impedir a venda se for o pet ativo.
             return { msg: `⚠️ Você não pode vender seu companheiro ativo *${itemInfo.nomeExibicao || itemInfo.nome}*! Considere dar um lar a ele antes.` };
            // Ou se permitir a venda:
            // dados.pet = null;
        }

        const ganhoTotal = itemInfo.venda * quantidade;

        // Remove o item e adiciona o saldo
        dados = removerItem(dados, itemInfo.nome, quantidade);
        if (!dados) return { msg: "⚠️ Falha ao remover o item da mochila durante a venda!" }; // Segurança
        dados = adicionarSaldo(dados, ganhoTotal, false); // Adiciona na carteira

        await salvarDadosJogador(senderId, dados);
        return { msg: `💰 Vendeu ${quantidade}x *${itemInfo.nomeExibicao || itemInfo.nome}* por ${formatarMoeda(ganhoTotal)}!` };

    } catch (err) {
        console.error(`Erro ao vender item para ${senderId}:`, err);
        return { msg: "⚠️ O comprador parece ter se arrependido e cancelou a negociação!" };
    }
}

// Deposita dinheiro no banco
async function depositarBanco(senderId, valor) {
    try {
        valor = parseInt(valor);
        if (isNaN(valor) || valor <= 0) return { msg: "⚠️ Valor inválido para depósito." };

        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { msg: "⚠️ Lenda não encontrada!" };

        if ((dados.saldo.carteira || 0) < valor) {
            return { msg: `💸 ${MOEDA.NOME_PLURAL} insuficientes na mochila! Você tem ${formatarMoeda(dados.saldo.carteira || 0)} para depositar.` };
        }

        // Calcula taxa de depósito
        const taxa = Math.floor(valor * (BANCO.TAXA_DEPOSITO_PERCENTUAL / 100));
        const valorDepositado = valor - taxa;

        dados = removerSaldo(dados, valor, false); // Remove valor total da carteira
        dados = adicionarSaldo(dados, valorDepositado, true); // Adiciona valor líquido no banco

        await salvarDadosJogador(senderId, dados);
        let msg = `🏦 Depositou ${formatarMoeda(valorDepositado)} no ${BANCO.NOME_BANCO}!`;
        if (taxa > 0) {
            msg += ` (Taxa de ${formatarMoeda(taxa)} aplicada).`;
        }
        msg += ` Saldo bancário: ${formatarMoeda(dados.saldo.banco)}`;
        return { msg };

    } catch (err) {
        console.error(`Erro ao depositar para ${senderId}:`, err);
        return { msg: `⚠️ Os cofres do ${BANCO.NOME_BANCO} parecem trancados! Tente novamente mais tarde.` };
    }
}

// Levanta dinheiro do banco
async function sacarBanco(senderId, valor) {
    try {
        valor = parseInt(valor);
        if (isNaN(valor) || valor <= 0) return { msg: "⚠️ Valor inválido para levantamento." };

        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { msg: "⚠️ Lenda não encontrada!" };

        // Calcula taxa de saque
        const taxa = Math.floor(valor * (BANCO.TAXA_SAQUE_PERCENTUAL / 100));
        const valorTotalNecessario = valor + taxa;

        if ((dados.saldo.banco || 0) < valorTotalNecessario) {
            let msgErro = `🏦 Saldo insuficiente no ${BANCO.NOME_BANCO}! Você tem ${formatarMoeda(dados.saldo.banco || 0)}.`;
            if (taxa > 0) {
                msgErro += ` O saque de ${formatarMoeda(valor)} requer um total de ${formatarMoeda(valorTotalNecessario)} (incluindo taxa de ${formatarMoeda(taxa)}).`;
            }
            return { msg: msgErro };
        }

        dados = removerSaldo(dados, valorTotalNecessario, true); // Remove valor + taxa do banco
        dados = adicionarSaldo(dados, valor, false); // Adiciona valor líquido na carteira

        await salvarDadosJogador(senderId, dados);
        let msg = `💰 Levantou ${formatarMoeda(valor)} do ${BANCO.NOME_BANCO}!`;
         if (taxa > 0) {
            msg += ` (Taxa de ${formatarMoeda(taxa)} aplicada).`;
        }
        msg += ` Saldo bancário: ${formatarMoeda(dados.saldo.banco)}. Saldo na mochila: ${formatarMoeda(dados.saldo.carteira)}`;
        return { msg };

    } catch (err) {
        console.error(`Erro ao levantar para ${senderId}:`, err);
        return { msg: `⚠️ O banqueiro do ${BANCO.NOME_BANCO} parece ocupado demais para atender seu pedido!` };
    }
}


module.exports = {
    listarEmpregos,
    sairEmprego,
    entrarEmprego,
    trabalhar,
    mostrarLoja,
    comprarItem,
    venderItem,
    depositarBanco, // Renomeado para clareza
    sacarBanco // Renomeado para clareza
};


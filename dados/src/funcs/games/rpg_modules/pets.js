/*
 * Módulo de Pets - RPG Nazuna (Versão Refatorada e Polida)
 * Gerencia os companheiros animais dos jogadores, incluindo nível, XP, felicidade e habilidades.
 * 
 * Criado originalmente por: Hiudy
 * 
 * Manter créditos ao criar ou modificar!
 */

const { carregarDadosJogador, salvarDadosJogador, normalizar, formatarMoeda } = require("./utils"); // Adicionado formatarMoeda
const { ITENS_LOJA, DIFICULDADE, GERAL } = require("./config");
const { removerItem, possuiItem } = require("./inventory");

// --- Funções de Cálculo e Lógica --- 

// Calcula XP necessário para o próximo nível do pet (curva mais suave que Pokémon)
function xpParaProximoNivelPet(nivelAtual) {
    if (nivelAtual >= DIFICULDADE.PET_NIVEL_MAXIMO) return Infinity;
    // Exemplo: 100 * (nível ^ 1.5)
    return Math.floor(100 * Math.pow(nivelAtual + 1, 1.5));
}

// Define habilidades passivas que podem ser desbloqueadas
const HABILIDADES_PET = {
    farejador_basico: { nome: "Faro Aguçado", descricao: "Aumenta levemente a chance de encontrar itens extras em atividades.", nivel_req: 5 },
    companheiro_veloz: { nome: "Companheiro Veloz", descricao: "Reduz levemente o tempo de cooldown de algumas atividades.", nivel_req: 10 },
    presenca_calmante: { nome: "Presença Calmante", descricao: "Aumenta ligeiramente a felicidade ganha em interações.", nivel_req: 15 },
    ajudante_combate: { nome: "Ajudante de Combate", descricao: "Oferece um pequeno bônus de dano em batalhas PvE.", nivel_req: 20 }
};

// Adiciona XP ao pet e verifica level up (retorna objeto pet atualizado e mensagens)
function adicionarXPPet(pet, xpGanho) {
    if (!pet || pet.nivel >= DIFICULDADE.PET_NIVEL_MAXIMO) return { pet, mensagens: [] };

    let mensagens = [];
    pet.xp_atual += xpGanho;
    mensagens.push(`🐾 Seu companheiro *${pet.nome_apelido || pet.nome_exibicao}* ganhou ${xpGanho} XP!`);

    let xpNecessario = xpParaProximoNivelPet(pet.nivel);
    while (pet.xp_atual >= xpNecessario && pet.nivel < DIFICULDADE.PET_NIVEL_MAXIMO) {
        pet.nivel++;
        pet.xp_atual -= xpNecessario;
        mensagens.push(`
🎉 NÍVEL ACIMA! 🎉
Seu fiel *${pet.nome_apelido || pet.nome_exibicao}* alcançou o nível ${pet.nivel}!`);
        
        // Verifica desbloqueio de habilidades passivas
        for (const key in HABILIDADES_PET) {
            const habilidade = HABILIDADES_PET[key];
            if (pet.nivel >= habilidade.nivel_req && !pet.habilidades.includes(key)) {
                pet.habilidades.push(key);
                mensagens.push(`✨ Habilidade passiva desbloqueada: *${habilidade.nome}*!`);
            }
        }

        if (pet.nivel >= DIFICULDADE.PET_NIVEL_MAXIMO) break;
        xpNecessario = xpParaProximoNivelPet(pet.nivel);
    }
    pet.xp_proximo_nivel = xpNecessario; // Atualiza o XP necessário para o próximo nível
    return { pet, mensagens };
}

// --- Funções de Gestão e Interação ---

// Verifica se o pet do jogador fugiu (considera felicidade)
// Retorna um objeto { msg: "mensagem" } se fugiu, ou null caso contrário.
// Modifica os dados do jogador diretamente se o pet fugir.
async function verificarPetFugiu(dadosJogador) {
    if (!dadosJogador || !dadosJogador.pet) {
        return null; // Jogador não tem pet
    }

    const pet = dadosJogador.pet;
    const agora = Date.now();
    const ultimaAlimentacao = pet.ultimaAlimentacao || (agora - (DIFICULDADE.PET_FUGITIVE_TIMER_SECONDS * 1000 * 2)); // Assume nunca alimentado
    const ultimaInteracao = pet.ultimaInteracao || ultimaAlimentacao; // Considera interação também
    const tempoDesdeCuidado = agora - Math.max(ultimaAlimentacao, ultimaInteracao);
    
    // Chance base de fuga aumenta com tempo sem cuidado
    const chanceBaseFuga = Math.min(0.8, tempoDesdeCuidado / (DIFICULDADE.PET_FUGITIVE_TIMER_SECONDS * 1000 * 10)); // Ex: máx 80% após 10x o tempo limite
    
    // Felicidade reduz a chance de fuga (0 felicidade = chance base, 100 felicidade = 1/4 da chance base)
    const modFelicidade = 1 - (pet.felicidade / 133); // 100 felicidade -> 1 - 0.75 = 0.25
    const chanceFinalFuga = chanceBaseFuga * modFelicidade;

    if (Math.random() < chanceFinalFuga && !GERAL.DEBUG_MODE) { // Não foge em modo debug
        const nomePet = pet.nome_apelido || pet.nome_exibicao;
        const nomeJogador = dadosJogador.nome || "Herói";
        
        // Remove o pet
        dadosJogador.pet = null;

        const mensagemFuga = `💔 Oh não, ${nomeJogador}! Seu *${nomePet}* parece ter se sentido negligenciado e decidiu buscar um novo lar... Ele deixou um bilhete amargo:

` +
                 `📜 *Bilhete de ${nomePet}* 📜\n` +
                 `Querido ${nomeJogador},\n` +
                 `Nossas aventuras foram ótimas, mas sinto que nossos caminhos precisam se separar. Preciso de mais atenção e carinho do que você pôde me dar ultimamente. ` +
                 `Espero que entenda. Que você continue sua jornada com sucesso!\n` +
                 `Com uma lambida de despedida (e um pouco de ressentimento),\n` +
                 `~${nomePet}`;
        
        return { msg: mensagemFuga };
    }

    return null; // Pet não fugiu
}

async function alimentarPet(senderId) {
    try {
        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };

        const petFugiuCheck = await verificarPetFugiu(dados);
        if (petFugiuCheck) {
            await salvarDadosJogador(senderId, dados);
            return { success: false, msg: petFugiuCheck.msg };
        }

        if (!dados.pet) return { success: false, msg: `🐾 Você não tem um companheiro para alimentar! Adote um na ${GERAL.PREFIXO_BOT}loja.` };
        if (!possuiItem(dados, "racao")) return { success: false, msg: `🎒 Sem ração na mochila! Compre no ${GERAL.PREFIXO_BOT}mercado para alimentar seu pet.` };

        const pet = dados.pet;
        const agora = Date.now();
        const ultimaAlimentacao = pet.ultimaAlimentacao || 0;
        const cooldownRestante = (ultimaAlimentacao + DIFICULDADE.PET_FEED_COOLDOWN_SECONDS * 1000) - agora;

        if (cooldownRestante > 0 && !GERAL.DEBUG_MODE) { // Ignora cooldown em modo debug
            const minutosRestantes = Math.ceil(cooldownRestante / (1000 * 60));
            return { success: false, msg: `⏳ Seu *${pet.nome_apelido || pet.nome_exibicao}* ainda está digerindo a última refeição! Tente alimentá-lo novamente em ${minutosRestantes} minuto(s).` };
        }

        // Consome ração
        const remocao = removerItem(dados, "racao", 1);
        if (!remocao) return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Falha ao usar a ração do inventário!` };
        dados = remocao;

        // Atualiza pet
        pet.ultimaAlimentacao = agora;
        pet.felicidade = Math.min(100, (pet.felicidade || 50) + DIFICULDADE.PET_FELICIDADE_GANHO_COMIDA);

        // Adiciona XP ao pet por ser alimentado
        const { pet: petAtualizado, mensagens: msgsXP } = adicionarXPPet(pet, DIFICULDADE.PET_XP_GANHO_COMIDA);
        dados.pet = petAtualizado;

        await salvarDadosJogador(senderId, dados);

        let msgFinal = `🍖 Você ofereceu uma saborosa ração para *${pet.nome_apelido || pet.nome_exibicao}*! Ele(a) devorou tudo e parece satisfeito(a)! (+${DIFICULDADE.PET_FELICIDADE_GANHO_COMIDA} Felicidade)`;
        if (msgsXP.length > 0) {
            msgFinal += "\n" + msgsXP.join("\n");
        }
        return { success: true, msg: msgFinal };

    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha ao alimentar pet para ${senderId}:`, err);
        return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Algo inesperado aconteceu ao tentar alimentar seu pet.` };
    }
}

// Interage com o pet (brincar, etc.)
async function interagirPet(senderId) {
    try {
        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };

        const petFugiuCheck = await verificarPetFugiu(dados);
        if (petFugiuCheck) {
            await salvarDadosJogador(senderId, dados);
            return { success: false, msg: petFugiuCheck.msg };
        }

        if (!dados.pet) return { success: false, msg: `🐾 Você não tem um companheiro para interagir! Adote um na ${GERAL.PREFIXO_BOT}loja.` };

        const pet = dados.pet;
        const agora = Date.now();
        const ultimaInteracao = pet.ultimaInteracao || 0;
        const cooldownRestante = (ultimaInteracao + DIFICULDADE.PET_INTERACT_COOLDOWN_SECONDS * 1000) - agora;

        if (cooldownRestante > 0 && !GERAL.DEBUG_MODE) {
            const minutosRestantes = Math.ceil(cooldownRestante / (1000 * 60));
            return { success: false, msg: `⏳ Seu *${pet.nome_apelido || pet.nome_exibicao}* ainda está relaxando da última brincadeira! Dê um tempo a ele(a) e tente interagir novamente em ${minutosRestantes} minuto(s).` };
        }

        // Atualiza pet
        pet.ultimaInteracao = agora;
        // Modificador de felicidade baseado na habilidade
        let felicidadeGanho = DIFICULDADE.PET_FELICIDADE_GANHO_INTERACAO;
        if (pet.habilidades.includes("presenca_calmante")) {
            felicidadeGanho = Math.floor(felicidadeGanho * 1.2); // Ex: 20% a mais
        }
        pet.felicidade = Math.min(100, (pet.felicidade || 50) + felicidadeGanho);

        // Adiciona XP por interação
        const { pet: petAtualizado, mensagens: msgsXP } = adicionarXPPet(pet, DIFICULDADE.PET_XP_GANHO_INTERACAO);
        dados.pet = petAtualizado;

        await salvarDadosJogador(senderId, dados);

        let msgFinal = `💖 Você fez carinho e brincou com seu *${pet.nome_apelido || pet.nome_exibicao}*! Ele(a) retribui com um olhar cheio de afeto! (+${felicidadeGanho} Felicidade)`;
        if (msgsXP.length > 0) {
            msgFinal += "\n" + msgsXP.join("\n");
        }
        return { success: true, msg: msgFinal };

    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha ao interagir com pet para ${senderId}:`, err);
        return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Algo inesperado aconteceu ao tentar interagir com seu pet.` };
    }
}

// Obtém o bônus de um pet para uma atividade específica (considera nível e habilidades)
// Retorna um objeto { multiplicador: X, adicional: Y }
function obterBonusPet(dadosJogador, tipoAtividade) {
    const bonusPadrao = { multiplicador: 1, adicional: 0 };
    if (!dadosJogador || !dadosJogador.pet) {
        return bonusPadrao;
    }

    const pet = dadosJogador.pet;
    const petInfoBase = ITENS_LOJA.find(i => i.nome === pet.nome_base); // Usa nome_base para encontrar info original
    if (!petInfoBase || !petInfoBase.bonus) {
        return bonusPadrao;
    }

    // Bônus pode escalar com nível (exemplo simples)
    const fatorNivel = 1 + (pet.nivel / (DIFICULDADE.PET_NIVEL_MAXIMO * 2)); // Ex: Nível max/2 = 1.25x, Nível max = 1.5x
    let bonusMultiplicador = 1;
    let bonusAdicional = 0;

    switch (tipoAtividade) {
        case 'caca':
        case 'pesca':
        case 'mineracao':
            bonusMultiplicador = petInfoBase.bonus[tipoAtividade] ? (1 + (petInfoBase.bonus[tipoAtividade] * fatorNivel)) : 1;
            // Habilidade Farejador Básico
            if (pet.habilidades.includes("farejador_basico")) {
                bonusMultiplicador *= 1.1; // Ex: 10% a mais de chance/quantidade
            }
            break;
        case 'missaoDelay': // Retorna multiplicador de delay (menor é melhor)
            bonusMultiplicador = petInfoBase.bonus.missaoDelay ? (1 - ((1 - petInfoBase.bonus.missaoDelay) * fatorNivel)) : 1;
            // Habilidade Companheiro Veloz
            if (pet.habilidades.includes("companheiro_veloz")) {
                bonusMultiplicador *= 0.9; // Ex: 10% mais rápido
            }
            // Garante que não seja zero ou negativo
            bonusMultiplicador = Math.max(0.1, bonusMultiplicador);
            break;
        case 'batalhaDano': // Retorna dano adicional fixo (escala com nível)
            bonusAdicional = Math.floor((petInfoBase.bonus.batalhaDano || 0) * fatorNivel);
             // Habilidade Ajudante de Combate
            if (pet.habilidades.includes("ajudante_combate")) {
                bonusAdicional += 5; // Ex: +5 de dano fixo
            }
            break;
        default:
            return bonusPadrao;
    }
    
    return { multiplicador: bonusMultiplicador, adicional: bonusAdicional };
}

// Compra um pet na loja
async function comprarPet(senderId, nomePetLoja) {
    try {
        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };
        if (dados.pet) return { success: false, msg: `❤️ Você já tem um companheiro fiel ao seu lado: *${dados.pet.nome_apelido || dados.pet.nome_exibicao}*!` };

        const petInfo = ITENS_LOJA.find(i => normalizar(i.nomeExibicao) === normalizar(nomePetLoja) && i.tipo === "pet");
        if (!petInfo) return { success: false, msg: `❓ Pet "${nomePetLoja}" não encontrado na loja de adoção. Use ${GERAL.PREFIXO_BOT}loja pets.` };

        const custo = petInfo.preco;
        if (dados.dinheiro < custo) return { success: false, msg: `💸 Você precisa de ${formatarMoeda(custo)} para adotar um ${petInfo.nomeExibicao}, mas só tem ${formatarMoeda(dados.dinheiro)}.` };

        // Deduz o dinheiro
        dados.dinheiro -= custo;

        // Adiciona o pet
        dados.pet = {
            nome_base: petInfo.nome, // Nome original do item/espécie
            nome_exibicao: petInfo.nomeExibicao, // Nome padrão para exibição
            nome_apelido: null, // Apelido dado pelo jogador
            nivel: 1,
            xp_atual: 0,
            xp_proximo_nivel: xpParaProximoNivelPet(1),
            felicidade: 70, // Felicidade inicial
            ultimaAlimentacao: Date.now(), // Considera alimentado ao comprar
            ultimaInteracao: Date.now(),
            habilidades: [] // Habilidades passivas desbloqueadas
        };

        await salvarDadosJogador(senderId, dados);
        return { success: true, msg: `🎉 Parabéns pela adoção! Um adorável *${petInfo.nomeExibicao}* agora é seu companheiro! Cuide bem dele(a) usando ${GERAL.PREFIXO_BOT}pet alimentar e ${GERAL.PREFIXO_BOT}pet interagir.` };

    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha ao comprar pet para ${senderId}:`, err);
        return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Algo inesperado aconteceu durante a adoção.` };
    }
}

// Mostra o status do pet atual
async function verPet(senderId) {
    try {
        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };

        const petFugiuCheck = await verificarPetFugiu(dados);
        if (petFugiuCheck) {
            await salvarDadosJogador(senderId, dados);
            return { success: false, msg: petFugiuCheck.msg };
        }

        if (!dados.pet) return { success: false, msg: `🐾 Você ainda não tem um pet. Visite a ${GERAL.PREFIXO_BOT}loja para adotar um companheiro!` };

        const pet = dados.pet;
        const petBaseInfo = ITENS_LOJA.find(i => i.nome === pet.nome_base);
        
        let statusMsg = `🌟 --- Status de ${pet.nome_apelido || pet.nome_exibicao} --- 🌟
`;
        statusMsg += `🐾 Espécie: ${pet.nome_exibicao}
`;
        statusMsg += `📈 Nível: ${pet.nivel} (${pet.xp_atual} / ${pet.xp_proximo_nivel} XP)
`;
        statusMsg += `😊 Felicidade: ${pet.felicidade}/100
`;
        statusMsg += `✨ Habilidades Passivas:
`;
        if (pet.habilidades.length > 0) {
            pet.habilidades.forEach(key => {
                const hab = HABILIDADES_PET[key];
                if (hab) statusMsg += `  - *${hab.nome}*: ${hab.descricao}\n`;
            });
        } else {
            statusMsg += `  (Nenhuma habilidade desbloqueada ainda)\n`;
        }
        
        statusMsg += `
💪 Bônus Atuais (Estimados):
`;
        const bonusCaca = obterBonusPet(dados, 'caca');
        const bonusMissao = obterBonusPet(dados, 'missaoDelay');
        const bonusDano = obterBonusPet(dados, 'batalhaDano');
        let temBonus = false;
        if (bonusCaca.multiplicador > 1) { statusMsg += `  - Coleta/Caça: +${((bonusCaca.multiplicador - 1) * 100).toFixed(1)}% itens/chance\n`; temBonus = true; }
        if (bonusMissao.multiplicador < 1) { statusMsg += `  - Missões: ${((1 - bonusMissao.multiplicador) * 100).toFixed(1)}% mais rápidas\n`; temBonus = true; }
        if (bonusDano.adicional > 0) { statusMsg += `  - Batalha PvE: +${bonusDano.adicional} de dano\n`; temBonus = true; }
        if (!temBonus) statusMsg += `  (Nenhum bônus significativo ativo no momento)\n`;

        const agora = Date.now();
        const tempoDesdeAlim = Math.floor((agora - (pet.ultimaAlimentacao || 0)) / (1000 * 60));
        const tempoDesdeInter = Math.floor((agora - (pet.ultimaInteracao || 0)) / (1000 * 60));
        statusMsg += `
🕒 Última alimentação: ${tempoDesdeAlim} min atrás
`;
        statusMsg += `🕒 Última interação: ${tempoDesdeInter} min atrás`;

        return { success: true, msg: statusMsg };

    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha ao ver pet para ${senderId}:`, err);
        return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Não foi possível verificar o status do seu pet.` };
    }
}

// Renomeia o pet
async function renomearPet(senderId, novoApelido) {
     try {
        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };
        if (!dados.pet) return { success: false, msg: `🐾 Você não tem um pet para renomear!` };

        if (!novoApelido || novoApelido.length < 2 || novoApelido.length > 15) {
            return { success: false, msg: "⚠️ O apelido deve ter entre 2 e 15 caracteres." };
        }
        // Remove caracteres potencialmente problemáticos
        const apelidoLimpo = novoApelido.replace(/[`"\/]/g, '').trim();
        if (apelidoLimpo.length < 2) {
             return { success: false, msg: "⚠️ O apelido contém caracteres inválidos ou é muito curto após limpeza." };
        }
        
        const nomeAntigo = dados.pet.nome_apelido || dados.pet.nome_exibicao;
        dados.pet.nome_apelido = apelidoLimpo;
        await salvarDadosJogador(senderId, dados);

        return { success: true, msg: `🏷️ Você renomeou *${nomeAntigo}* para *${apelidoLimpo}*! Um nome digno de um companheiro lendário!` };

    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha ao renomear pet para ${senderId}:`, err);
        return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Algo inesperado aconteceu ao tentar renomear seu pet.` };
    }
}

module.exports = {
    verificarPetFugiu, // Usado internamente e talvez por outros módulos
    alimentarPet,
    interagirPet,
    obterBonusPet,
    comprarPet,
    verPet,
    renomearPet,
    adicionarXPPet // Exporta para que outras atividades possam dar XP ao pet
};


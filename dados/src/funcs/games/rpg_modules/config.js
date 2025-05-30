/*
 * Módulo de Configuração - RPG Nazuna
 * Centraliza constantes, dados base, configurações de balanceamento e personalização.
 * 
 * Criado originalmente por: Hiudy
 * 
 * Manter créditos ao criar ou modificar!
 */

// --- Configurações Gerais do Bot/RPG ---
const GERAL = {
    // Prefixo principal do bot (usado em mensagens, menus, etc.)
    PREFIXO_BOT: ".", 
    // Nome do Bot (usado em mensagens)
    NOME_BOT: "Nazuna",
    // Nome do Mundo/Reino do RPG (usado em textos de lore/ambientação)
    NOME_MUNDO_RPG: "Aincrad", 
    // Ativar/Desativar mensagens de boas-vindas/registro automático?
    ATIVAR_MSG_BEM_VINDO: true,
};

// --- Configurações da Moeda ---
const MOEDA = {
    // Nome singular da moeda
    NOME_SINGULAR: "Ouro",
    // Nome plural da moeda
    NOME_PLURAL: "Ouros",
    // Símbolo/Prefixo da moeda (ex: R$, $, €)
    SIMBOLO: "G", 
    // Posição do símbolo ("antes" ou "depois" do valor)
    POSICAO_SIMBOLO: "depois", 
    // Separador de milhares (ex: "." ou ",")
    SEPARADOR_MILHAR: ".",
    // Separador decimal (ex: "," ou ".")
    SEPARADOR_DECIMAL: ",",
    // Permitir centavos/decimais? (true/false)
    PERMITIR_DECIMAIS: false, 
    // Número de casas decimais (se permitido)
    CASAS_DECIMAIS: 2, 
};

// --- Configurações do Banco ---
const BANCO = {
    // Nome do banco
    NOME_BANCO: "Banco Central de Aincrad",
    // Taxa de depósito (percentual, 0 para sem taxa)
    TAXA_DEPOSITO_PERCENTUAL: 0.5, 
    // Taxa de saque (percentual, 0 para sem taxa)
    TAXA_SAQUE_PERCENTUAL: 1.0, 
    // Permitir saldo bancário negativo? (true/false)
    PERMITIR_SALDO_NEGATIVO: false,
};

// --- Configurações de Limites e Cooldowns (Ativáveis/Desativáveis) ---
const LIMITES = {
    // Ativar/Desativar cooldowns globais para ações (trabalhar, minerar, etc.)?
    ATIVAR_COOLDOWNS_ACOES: true,
    // Ativar/Desativar limite de membros em guildas?
    ATIVAR_LIMITE_MEMBROS_GUILDA: true,
    // Ativar/Desativar limite de posts no Creator Hub?
    ATIVAR_LIMITE_POSTS_CRIADOR: false,
    // Limite máximo de posts (se ativo)
    MAX_POSTS_CRIADOR: 100,
    // Ativar/Desativar limite de presentes diários para NPCs?
    ATIVAR_LIMITE_PRESENTES_NPC: true,
    // Máximo de presentes por dia por NPC (se ativo)
    MAX_PRESENTES_NPC_DIA: 2,
    // Ativar/Desativar limite de conversas diárias com NPCs?
    ATIVAR_LIMITE_CONVERSAS_NPC: false,
    // Máximo de conversas por dia por NPC (se ativo)
    MAX_CONVERSAS_NPC_DIA: 5,
    // Ativar/Desativar custo para criar guilda?
    ATIVAR_CUSTO_CRIAR_GUILDA: true,
    // Ativar/Desativar custo para ativar perfil de criador?
    ATIVAR_CUSTO_ATIVAR_CRIADOR: false,
    // Custo para ativar perfil (se ativo)
    CUSTO_ATIVAR_CRIADOR: 500,
};

// --- Configurações de Dificuldade e Balanceamento ---
const DIFICULDADE = {
    // Fator exponencial para XP necessário (ex: 1.5 significa 50% mais XP por nível)
    XP_CURVE_FACTOR: 1.7, 
    // Multiplicador para custos de itens na loja
    SHOP_COST_MULTIPLIER: 1.5, 
    // Multiplicador para delays de ações (trabalhar, minerar, etc.)
    ACTION_DELAY_MULTIPLIER: 1.8, 
    // Modificador para taxas de falha (maior = mais falhas)
    FAILURE_RATE_MODIFIER: 1.3, 
    // Modificador para recompensas de ouro (menor = menos ouro)
    GOLD_REWARD_MODIFIER: 0.8, 
    // Modificador para HP/Ataque de monstros (maior = mais fortes)
    MONSTER_STAT_MODIFIER: 1.4, 
    // Custo base para criar guilda (usar LIMITES.ATIVAR_CUSTO_CRIAR_GUILDA para ativar/desativar)
    GUILD_CREATION_COST: 10000, 
    // Aposta mínima para duelo PvP
    PVP_MIN_BET: 250, 
    // Tempo (em segundos) que um pet pode ficar sem comer antes de fugir
    PET_FUGITIVE_TIMER_SECONDS: 3 * 24 * 60 * 60, // 3 dias
    // Tempo (em segundos) de cooldown para alimentar pet
    PET_FEED_COOLDOWN_SECONDS: 24 * 60 * 60, // 1 dia
    // Taxa do Creator Hub (percentual retido pela "plataforma")
    TAXA_CREATOR_HUB: 10, // 10%
};

// --- Dados Base do Jogo --- 
// (Considerar mover para JSONs em /data/ futuramente)

// Empregos
const EMPREGOS = [
    // Ajustar min/max/xp/delay conforme DIFICULDADE
    { nome: 'lixeiro', min: 50, max: 150, xp: 0, delay: 120 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'A próxima coleta é em #segundos# segundos, aventureiro!' },
    { nome: 'faxineiro', min: 80, max: 200, xp: 30, delay: 150 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'O castelo brilha! Volte em #segundos# segundos.' },
    { nome: 'garcom', min: 100, max: 250, xp: 60, delay: 180 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Descanso, herói! Volte em #segundos# segundos.' },
    { nome: 'motorista', min: 150, max: 300, xp: 120, delay: 200 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Próxima caravana em #segundos# segundos.' },
    { nome: 'vendedor', min: 200, max: 400, xp: 180, delay: 220 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Mercado vazio! Volte em #segundos# segundos.' },
    { nome: 'cozinheiro', min: 250, max: 500, xp: 250, delay: 240 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Taverna fechada! Volte em #segundos# segundos.' },
    { nome: 'professor', min: 300, max: 600, xp: 350, delay: 260 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Próxima aula em #segundos# segundos, sábio!' },
    { nome: 'engenheiro', min: 400, max: 800, xp: 500, delay: 280 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Sem projetos, mestre! Volte em #segundos# segundos.' },
    { nome: 'policial', min: 450, max: 900, xp: 700, delay: 300 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Guarda descansa! Volte em #segundos# segundos.' },
    { nome: 'advogado', min: 500, max: 1000, xp: 900, delay: 320 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Próximo caso em #segundos# segundos.' },
    { nome: 'medico', min: 600, max: 1200, xp: 1200, delay: 340 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Curandeiro, descanse! Volte em #segundos# segundos.' },
    { nome: 'ferreiro', min: 350, max: 700, xp: 400, delay: 270 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Forja esfriou! Volte em #segundos# segundos.' },
    { nome: 'alquimista', min: 450, max: 850, xp: 600, delay: 290 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Poções em preparo! Volte em #segundos# segundos.' },
    { nome: 'aventureiro', min: 500, max: 1000, xp: 1000, delay: 350 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Nova aventura em #segundos# segundos!' },
    { nome: 'ladrao', min: 300, max: 600, xp: 800, delay: 310 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Guardas alertas! Espere #segundos# segundos.' },
    { nome: 'mago', min: 550, max: 1100, xp: 1100, delay: 360 * DIFICULDADE.ACTION_DELAY_MULTIPLIER, msgDelay: 'Mana recarregando! Volte em #segundos# segundos.' }
];

// Itens da loja e vendaveis
const ITENS_LOJA = [
    // Ajustar valor conforme DIFICULDADE
    { nome: 'picareta', valor: Math.floor(700 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 300, nomeExibicao: 'Picareta' },
    { nome: 'isca', valor: Math.floor(800 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 320, nomeExibicao: 'Isca' },
    { nome: 'faca', valor: Math.floor(900 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 350, nomeExibicao: 'Faca' },
    { nome: 'arma', valor: Math.floor(1100 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 480, nomeExibicao: 'Arma' },
    { nome: 'municao', valor: Math.floor(300 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 80, nomeExibicao: 'Munição' },
    { nome: 'racao', valor: Math.floor(150 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 50, nomeExibicao: 'Ração' },
    { nome: 'escudo', valor: Math.floor(1450 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 760, nomeExibicao: 'Escudo' },
    { nome: 'semente', valor: Math.floor(200 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 80, nomeExibicao: 'Semente' },
    { nome: 'pocao', valor: Math.floor(500 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 200, nomeExibicao: 'Poção' },
    { nome: 'machado', valor: Math.floor(950 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 400, nomeExibicao: 'Machado' },
    { nome: 'varinha', valor: Math.floor(1200 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 500, nomeExibicao: 'Varinha' },
    { nome: 'lobo', valor: Math.floor(2000 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 800, pet: true, bonus: { caca: 0.2 }, nomeExibicao: 'Lobo' },
    { nome: 'falcao', valor: Math.floor(2500 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 1000, pet: true, bonus: { missaoDelay: 0.9 }, nomeExibicao: 'Falcão' },
    { nome: 'dragao bebe', valor: Math.floor(5000 * DIFICULDADE.SHOP_COST_MULTIPLIER), venda: 2000, pet: true, bonus: { batalhaDano: 10 }, nomeExibicao: 'Dragão Bebê' }
];

const ITENS_VENDA = [
    { nome: 'carvao', venda: 50, nomeExibicao: 'Carvão' },
    { nome: 'prata', venda: 70, nomeExibicao: 'Prata' },
    { nome: 'ferro', venda: 80, nomeExibicao: 'Ferro' },
    { nome: 'ouro', venda: 95, nomeExibicao: 'Ouro' },
    { nome: 'diamante', venda: 115, nomeExibicao: 'Diamante' },
    { nome: 'esmeralda', venda: 130, nomeExibicao: 'Esmeralda' },
    { nome: 'peixe', venda: 40, nomeExibicao: 'Peixe' },
    { nome: 'carne', venda: 30, nomeExibicao: 'Carne' },
    { nome: 'trigo', venda: 60, nomeExibicao: 'Trigo' },
    { nome: 'madeira', venda: 55, nomeExibicao: 'Madeira' },
    { nome: 'mana', venda: 150, nomeExibicao: 'Mana' }
];

// Missoes (Mantido como estava, mas pode ser movido para JSON)
const MISSOES = [
    // Ajustar recompensas conforme DIFICULDADE
    { nome: 'caca ao tesouro', recompensa: { dinheiro: Math.floor(1000 * DIFICULDADE.GOLD_REWARD_MODIFIER), xp: 50, item: 'diamante' }, dificuldade: 1, desc: 'Desbrave a floresta e encontre o baú perdido!', nomeExibicao: 'Caça ao Tesouro' },
    { nome: 'derrote o bandido', recompensa: { dinheiro: Math.floor(1500 * DIFICULDADE.GOLD_REWARD_MODIFIER), xp: 80, item: 'arma' }, dificuldade: 2, desc: 'Enfrente o bandido que assola a vila!', nomeExibicao: 'Derrote o Bandido' },
    { nome: 'entrega urgente', recompensa: { dinheiro: Math.floor(800 * DIFICULDADE.GOLD_REWARD_MODIFIER), xp: 40 }, dificuldade: 1, desc: 'Corra contra o tempo para entregar um pacote!', nomeExibicao: 'Entrega Urgente' },
    { nome: 'resgate na mina', recompensa: { dinheiro: Math.floor(2000 * DIFICULDADE.GOLD_REWARD_MODIFIER), xp: 100, item: 'esmeralda' }, dificuldade: 3, desc: 'Salve os mineiros presos!', nomeExibicao: 'Resgate na Mina' },
    { nome: 'derrote o dragao', recompensa: { dinheiro: Math.floor(3000 * DIFICULDADE.GOLD_REWARD_MODIFIER), xp: 150, item: 'varinha' }, dificuldade: 4, desc: 'Enfrente o dragão e prove sua coragem!', nomeExibicao: 'Derrote o Dragão' }
];

// Monstros (Mantido como estava, mas pode ser movido para JSON)
const MONSTROS = [
    // Ajustar stats e recompensas conforme DIFICULDADE
    { nome: 'goblin', hp: Math.floor(50 * DIFICULDADE.MONSTER_STAT_MODIFIER), ataque: Math.floor(10 * DIFICULDADE.MONSTER_STAT_MODIFIER), recompensa: { dinheiro: Math.floor(200 * DIFICULDADE.GOLD_REWARD_MODIFIER), xp: 20, item: 'carvao' }, nomeExibicao: 'Goblin' },
    { nome: 'lobo selvagem', hp: Math.floor(80 * DIFICULDADE.MONSTER_STAT_MODIFIER), ataque: Math.floor(15 * DIFICULDADE.MONSTER_STAT_MODIFIER), recompensa: { dinheiro: Math.floor(350 * DIFICULDADE.GOLD_REWARD_MODIFIER), xp: 30, item: 'carne' }, nomeExibicao: 'Lobo Selvagem' },
    { nome: 'troll', hp: Math.floor(120 * DIFICULDADE.MONSTER_STAT_MODIFIER), ataque: Math.floor(20 * DIFICULDADE.MONSTER_STAT_MODIFIER), recompensa: { dinheiro: Math.floor(500 * DIFICULDADE.GOLD_REWARD_MODIFIER), xp: 50, item: 'ferro' }, nomeExibicao: 'Troll' },
    { nome: 'dragao menor', hp: Math.floor(200 * DIFICULDADE.MONSTER_STAT_MODIFIER), ataque: Math.floor(30 * DIFICULDADE.MONSTER_STAT_MODIFIER), recompensa: { dinheiro: Math.floor(1000 * DIFICULDADE.GOLD_REWARD_MODIFIER), xp: 100, item: 'diamante' }, nomeExibicao: 'Dragão Menor' }
];

// Frutas do cassino
const FRUTAS_CASINO = {
    nomes: ['maça', 'banana', 'cereja', 'uva', 'abacaxi', 'melancia'],
    icones: ['🍎', '🍌', '🍒', '🍇', '🍍', '🍉']
};

// Valores iniciais do jogador
const VALORES_INICIAIS_JOGADOR = {
    saldo: { banco: 0, carteira: 250 }, // Reduzido devido à dificuldade
    inv: {},
    emprego: 'desempregado',
    xp: 0,
    nivel: 1, // Adicionado nível inicial
    stats: { hp: 100, hp_max: 100, ataque: 10, defesa: 5, velocidade: 10 }, // Adicionado stats base
    status: { fadiga: 0, moral: 100 }, // Removido HP daqui, movido para stats
    missoes: { ativas: {}, concluidas: [] }, // Estrutura correta
    guilda: null,
    pet: null,
    delay: {},
    titulo: null,
    casa: null, // Adicionado casa inicial
    decoracoes_casa: {}, // Adicionado decorações
    relacionamentos: {}, // Adicionado relacionamentos
    pokemon_time: [], // Adicionado time Pokémon
    pokemon_pc: [], // Adicionado PC Pokémon
    pokedex: {}, // Adicionado Pokédex
};

module.exports = {
    GERAL,
    MOEDA,
    BANCO,
    LIMITES,
    DIFICULDADE,
    EMPREGOS,
    ITENS_LOJA,
    ITENS_VENDA,
    MISSOES,
    MONSTROS,
    FRUTAS_CASINO,
    VALORES_INICIAIS_JOGADOR
};


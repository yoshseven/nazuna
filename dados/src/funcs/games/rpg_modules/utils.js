/*
 * Módulo de Utilitários - RPG Nazuna
 * Contém funções auxiliares para o sistema de RPG.
 * 
 * Criado originalmente por: Hiudy
 * 
 * Manter créditos ao criar ou modificar!
 */

const fs = require("fs").promises;
const path = require("path");
const { MOEDA } = require("./config"); // Importa configurações da moeda

const RpgPath = path.join(__dirname, "/../../../../database/rpg"); // Diretório base para dados dos jogadores

// Normaliza texto para minusculas e sem acentos
const normalizar = (texto) => {
    if (typeof texto !== "string") return "";
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

// Salva os dados de um jogador
const salvarDadosJogador = async (senderId, dados) => {
    try {
        const userPath = path.join(RpgPath, `${senderId}.json`);
        await fs.writeFile(userPath, JSON.stringify(dados, null, 2));
        return true;
    } catch (err) {
        console.error(`Erro ao salvar dados para ${senderId}:`, err);
        return false;
    }
};

// Carrega os dados de um jogador
const carregarDadosJogador = async (senderId) => {
    try {
        const userPath = path.join(RpgPath, `${senderId}.json`);
        if (await fs.access(userPath).then(() => true).catch(() => false)) {
            const data = await fs.readFile(userPath, "utf-8");
            return JSON.parse(data);
        }
        return null; // Jogador não encontrado
    } catch (err) {
        console.error(`Erro ao carregar dados para ${senderId}:`, err);
        return null;
    }
};

// Verifica e cria o diretório base do RPG se não existir
const inicializarDiretorioRPG = async () => {
    try {
        await fs.mkdir(RpgPath, { recursive: true });
    } catch (err) {
        console.error("Erro ao criar diretório base do RPG:", err);
    }
};

// Formata um valor numérico como moeda de acordo com as configurações
const formatarMoeda = (valor) => {
    const numero = Number(valor) || 0;
    let valorFormatado;

    if (MOEDA.PERMITIR_DECIMAIS) {
        valorFormatado = numero.toFixed(MOEDA.CASAS_DECIMAIS);
    } else {
        valorFormatado = Math.floor(numero).toString();
    }

    // Aplica separadores
    const partes = valorFormatado.split(".");
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, MOEDA.SEPARADOR_MILHAR);
    valorFormatado = partes.join(MOEDA.SEPARADOR_DECIMAL);

    // Adiciona símbolo
    if (MOEDA.POSICAO_SIMBOLO === "antes") {
        return `${MOEDA.SIMBOLO} ${valorFormatado}`;
    } else {
        return `${valorFormatado} ${MOEDA.SIMBOLO}`;
    }
};

// Inicializa o diretório ao carregar o módulo
inicializarDiretorioRPG();

module.exports = {
    normalizar,
    salvarDadosJogador,
    carregarDadosJogador,
    formatarMoeda, // Exporta a nova função
    RpgPath // Exporta o caminho base se necessário em outros módulos
};


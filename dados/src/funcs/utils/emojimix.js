/**
 * Sistema de Emoji Mix Otimizado
 * Desenvolvido por Hiudy
 * Versão: 2.0.0
 */

const axios = require('axios');

// Configurações
const CONFIG = {
  API: {
    BASE_URL: 'https://tenor.googleapis.com/v2/featured',
    KEY: "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ",
    PARAMS: {
      contentfilter: 'high',
      media_filter: 'png_transparent',
      component: 'proactive',
      collection: 'emoji_kitchen_v5'
    }
  },
  CACHE: {
    MAX_SIZE: 1000,
    EXPIRE_TIME: 24 * 60 * 60 * 1000 // 24 horas
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000 // 1 segundo
  }
};

// Cache para resultados de emoji mix
class EmojiMixCache {
  constructor(maxSize = CONFIG.CACHE.MAX_SIZE) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  getKey(emoji1, emoji2) {
    return `${emoji1}_${emoji2}`;
  }

  get(emoji1, emoji2) {
    const key = this.getKey(emoji1, emoji2);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Verifica se o cache expirou
    if (Date.now() - cached.timestamp > CONFIG.CACHE.EXPIRE_TIME) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.urls;
  }

  set(emoji1, emoji2, urls) {
    // Limpa cache antigo se necessário
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    const key = this.getKey(emoji1, emoji2);
    this.cache.set(key, {
      urls,
      timestamp: Date.now()
    });
  }
}

// Validador de emoji
class EmojiValidator {
  static isEmoji(str) {
    const emojiRegex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])$/;
    return emojiRegex.test(str);
  }

  static validate(emoji1, emoji2) {
    if (!emoji1 || !emoji2) {
      throw new Error('❌ Dois emojis são necessários');
    }

    if (!this.isEmoji(emoji1) || !this.isEmoji(emoji2)) {
      throw new Error('❌ Entrada inválida. Use apenas emojis');
    }
  }
}

// Cliente da API Tenor
class TenorClient {
  constructor() {
    if (!CONFIG.API.KEY) {
      throw new Error('Chave da API Tenor não configurada');
    }

    this.axios = axios.create({
      baseURL: CONFIG.API.BASE_URL,
      timeout: 10000
    });
  }

  async fetchMix(emoji1, emoji2, attempt = 1) {
    try {
      const response = await this.axios.get('', {
        params: {
          key: CONFIG.API.KEY,
          ...CONFIG.API.PARAMS,
          q: `${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error('❌ Combinação de emojis não disponível');
      }

      return response.data.results.map(result => result.url);
    } catch (error) {
      if (error.response?.status === 429 && attempt < CONFIG.RETRY.MAX_ATTEMPTS) {
        // Retry com delay exponencial
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY.DELAY * attempt));
        return this.fetchMix(emoji1, emoji2, attempt + 1);
      }
      throw new Error(`❌ Erro ao misturar emojis: ${error.message}`);
    }
  }
}

// Cache e cliente instanciados uma única vez
const cache = new EmojiMixCache();
const client = new TenorClient();

/**
 * Mistura dois emojis
 * @param {string} emoji1 - Primeiro emoji
 * @param {string} emoji2 - Segundo emoji
 * @returns {Promise<string>} URL da imagem resultante
 */
async function emojiMix(emoji1, emoji2) {
  try {
    // Valida emojis
    EmojiValidator.validate(emoji1, emoji2);

    // Verifica cache
    const cached = cache.get(emoji1, emoji2);
    if (cached) {
      return cached[Math.floor(Math.random() * cached.length)];
    }

    // Busca novos resultados
    const urls = await client.fetchMix(emoji1, emoji2);
    cache.set(emoji1, emoji2, urls);
    
    // Retorna um resultado aleatório
    return urls[Math.floor(Math.random() * urls.length)];
  } catch (error) {
    console.error('Erro no EmojiMix:', error);
    throw error;
  }
}

module.exports = emojiMix;

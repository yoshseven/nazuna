/**
 * Sistema de Estilização de Texto Otimizado
 * Versão: 2.0.0
 */

const axios = require('axios');
const { DOMParser } = require('linkedom');

// Configurações
const CONFIG = {
  API_URL: 'http://qaz.wtf/u/convert.cgi',
  CACHE: {
    MAX_SIZE: 1000,
    EXPIRE_TIME: 24 * 60 * 60 * 1000 // 24 horas
  },
  TIMEOUT: 10000, // 10 segundos
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000 // 1 segundo
  },
  // Mapeamento de estilos personalizados
  CUSTOM_STYLES: new Map([
    ['bold', '𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳'],
    ['italic', '𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻'],
    ['fancy', '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃'],
    ['gothic', '𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷']
  ])
};

// Sistema de Cache
class StyleCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = CONFIG.CACHE.MAX_SIZE;
  }

  getKey(text) {
    return text.toLowerCase().trim();
  }

  get(text) {
    const key = this.getKey(text);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > CONFIG.CACHE.EXPIRE_TIME) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.styles;
  }

  set(text, styles) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    const key = this.getKey(text);
    this.cache.set(key, {
      styles,
      timestamp: Date.now()
    });
  }
}

// Gerador de Estilos Local
class LocalStyleGenerator {
  static normalizeText(text) {
    return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  }

  static applyStyle(text, styleMap) {
    const normalized = this.normalizeText(text);
    let styled = '';
    
    for (const char of normalized) {
      const index = 'abcdefghijklmnopqrstuvwxyz'.indexOf(char);
      styled += index >= 0 ? styleMap[index] : char;
    }
    
    return styled;
  }

  static generateLocalStyles(text) {
    const styles = [];
    
    for (const [name, styleMap] of CONFIG.CUSTOM_STYLES) {
      styles.push(this.applyStyle(text, styleMap));
    }
    
    return styles;
  }
}

// Cliente HTTP
class StyleClient {
  constructor() {
    this.axios = axios.create({
      timeout: CONFIG.TIMEOUT
    });
  }

  async fetchStyles(text, attempt = 1) {
    try {
      const { data } = await this.axios.get(CONFIG.API_URL, {
        params: { text: encodeURIComponent(text) }
      });

      const document = new DOMParser().parseFromString(data, 'text/html');
      const styles = [];

      document.querySelectorAll('table tr').forEach(row => {
        const secondTd = row.querySelector('td:nth-child(2)');
        if (secondTd) {
          const style = secondTd.textContent.trim();
          if (style && style !== text) {
            styles.push(style);
          }
        }
      });

      return styles;
    } catch (error) {
      if (attempt < CONFIG.RETRY.MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY.DELAY * attempt));
        return this.fetchStyles(text, attempt + 1);
      }
      throw error;
    }
  }
}

// Cache e cliente instanciados uma única vez
const cache = new StyleCache();
const client = new StyleClient();

/**
 * Gera estilos de texto diferentes
 * @param {string} text - Texto para estilizar
 * @returns {Promise<string[]>} Array de estilos
 */
async function styleText(text) {
  try {
    // Validações
    if (!text || typeof text !== 'string') {
      throw new Error('Texto inválido');
    }

    if (text.length > 100) {
      throw new Error('Texto muito longo (máximo 100 caracteres)');
    }

    // Verifica cache
    const cached = cache.get(text);
    if (cached) {
      return cached;
    }

    // Gera estilos locais primeiro
    let styles = LocalStyleGenerator.generateLocalStyles(text);

    try {
      // Tenta buscar estilos online
      const onlineStyles = await client.fetchStyles(text);
      styles = [...new Set([...styles, ...onlineStyles])];
    } catch (error) {
      console.warn('Erro ao buscar estilos online, usando apenas estilos locais:', error.message);
    }

    // Remove estilos vazios ou duplicados
    styles = styles
      .filter(style => style && style.trim())
      .filter((style, index, self) => self.indexOf(style) === index);

    // Salva no cache
    if (styles.length > 0) {
      cache.set(text, styles);
    }

    return styles;
  } catch (error) {
    console.error('Erro ao gerar estilos:', error);
    // Retorna array vazio em caso de erro
    return [];
  }
}

module.exports = styleText;

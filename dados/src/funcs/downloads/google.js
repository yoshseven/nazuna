/**
 * Sistema de Pesquisa Google Otimizado
 * Desenvolvido por Hiudy
 * Versão: 2.0.0
 */

const { googleIt, googleImage } = require('@bochilteam/scraper');

// Configurações
const CONFIG = {
  API: {
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  },
  SEARCH: {
    MAX_RESULTS: 10,
    MIN_TITLE_LENGTH: 10,
    MIN_DESC_LENGTH: 20,
    PREVIEW_URL: 'https://image.thum.io/get/fullpage'
  },
  CACHE: {
    MAX_SIZE: 100,
    EXPIRE_TIME: 15 * 60 * 1000 // 15 minutos
  },
  ERROR_MESSAGES: {
    INVALID_QUERY: 'Termo de busca inválido',
    NO_RESULTS: 'Nenhum resultado encontrado',
    NO_VALID_RESULTS: 'Nenhum resultado válido formatado',
    NO_IMAGES: 'Nenhuma imagem encontrada',
    NETWORK_ERROR: 'Erro de conexão com a API',
    GENERAL_ERROR: 'Erro ao realizar a pesquisa'
  }
};

// Cache para resultados
class SearchCache {
  constructor() {
    this.cache = new Map();
  }

  getKey(type, query) {
    return `${type}:${query.toLowerCase().trim()}`;
  }

  get(type, query) {
    const key = this.getKey(type, query);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > CONFIG.CACHE.EXPIRE_TIME) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(type, query, data) {
    if (this.cache.size >= CONFIG.CACHE.MAX_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    const key = this.getKey(type, query);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Formatador de Resultados
class ResultFormatter {
  static formatTextResult(article) {
    const { title, url, description } = article;
    
    if (!title?.trim() || !url?.trim()) return null;
    
    return {
      formatted: `*${title.trim()}*\n_${url.trim()}_\n_${description?.trim() || 'Sem descrição'}_`,
      data: {
        title: title.trim(),
        url: url.trim(),
        description: description?.trim() || 'Sem descrição'
      }
    };
  }

  static validateResult(result) {
    if (!result) return false;
    
    const { title, url, description } = result.data;
    return (
      title.length >= CONFIG.SEARCH.MIN_TITLE_LENGTH &&
      url.startsWith('http') &&
      (!description || description.length >= CONFIG.SEARCH.MIN_DESC_LENGTH)
    );
  }

  static getPreviewImage(query) {
    return `${CONFIG.SEARCH.PREVIEW_URL}/https://google.com/search?q=${encodeURIComponent(query)}`;
  }
}

// Gerenciador de Pesquisa
class SearchManager {
  constructor() {
    this.cache = new SearchCache();
  }

  async retryOperation(operation, attempt = 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt < CONFIG.API.MAX_RETRIES && error.message.includes('network')) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.API.RETRY_DELAY * attempt));
        return this.retryOperation(operation, attempt + 1);
      }
      throw error;
    }
  }

  async searchText(query) {
    if (!query || typeof query !== 'string') {
      return { ok: false, msg: CONFIG.ERROR_MESSAGES.INVALID_QUERY };
    }

    const cached = this.cache.get('text', query);
    if (cached) return cached;

    try {
      const search = await this.retryOperation(() => googleIt(query));
      
      if (!search.articles?.length) {
        return { ok: false, msg: CONFIG.ERROR_MESSAGES.NO_RESULTS };
      }

      const formattedResults = search.articles
        .map(article => ResultFormatter.formatTextResult(article))
        .filter(result => result && ResultFormatter.validateResult(result));

      if (!formattedResults.length) {
        return { ok: false, msg: CONFIG.ERROR_MESSAGES.NO_VALID_RESULTS };
      }

      const result = {
        ok: true,
        image: ResultFormatter.getPreviewImage(query),
        text: formattedResults.map(r => r.formatted).join('\n\n'),
        array: formattedResults.map(r => r.data)
      };

      this.cache.set('text', query, result);
      return result;
    } catch (error) {
      console.error('Erro em searchText:', error);
      return {
        ok: false,
        msg: error.message.includes('network') 
          ? CONFIG.ERROR_MESSAGES.NETWORK_ERROR 
          : CONFIG.ERROR_MESSAGES.GENERAL_ERROR
      };
    }
  }

  async searchImage(query) {
    if (!query || typeof query !== 'string') {
      return { ok: false, msg: CONFIG.ERROR_MESSAGES.INVALID_QUERY };
    }

    const cached = this.cache.get('image', query);
    if (cached) return cached;

    try {
      const images = await this.retryOperation(() => googleImage(query));
      
      if (!images?.length) {
        return { ok: false, msg: CONFIG.ERROR_MESSAGES.NO_IMAGES };
      }

      const validImages = images
        .map(url => url.trim())
        .filter(url => url.startsWith('http'))
        .slice(0, CONFIG.SEARCH.MAX_RESULTS);

      if (!validImages.length) {
        return { ok: false, msg: CONFIG.ERROR_MESSAGES.NO_VALID_RESULTS };
      }

      const result = {
        ok: true,
        result: validImages
      };

      this.cache.set('image', query, result);
      return result;
    } catch (error) {
      console.error('Erro em searchImage:', error);
      return {
        ok: false,
        msg: error.message.includes('network')
          ? CONFIG.ERROR_MESSAGES.NETWORK_ERROR
          : CONFIG.ERROR_MESSAGES.GENERAL_ERROR
      };
    }
  }
}

// Instância única do gerenciador de pesquisa
const searchManager = new SearchManager();

module.exports = {
  search: (query) => searchManager.searchText(query),
  image: (query) => searchManager.searchImage(query)
};

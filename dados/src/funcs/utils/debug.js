/**
 * Sistema de Debug e Relatório de Erros
 * Versão: 2.0.0
 */

const fs = require('fs').promises;
const path = require('path');

// Configurações
const CONFIG = {
  LOG_DIR: path.join(__dirname, '../../../logs'),
  ERROR_LEVELS: {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    FATAL: 'FATAL'
  },
  MAX_LOG_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_LOGS: 5, // Máximo de arquivos de log
  RATE_LIMIT: {
    WINDOW: 60 * 1000, // 1 minuto
    MAX_REQUESTS: 50 // Máximo de logs por minuto
  }
};

// Sistema de Rate Limiting
class RateLimiter {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  async isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Limpa registros antigos
    for (const [timestamp] of this.requests) {
      if (timestamp < windowStart) {
        this.requests.delete(timestamp);
      }
    }

    // Conta requisições na janela atual
    const requestCount = Array.from(this.requests.values())
      .filter(request => request.key === key)
      .length;

    if (requestCount >= this.maxRequests) {
      return false;
    }

    this.requests.set(now, { key, timestamp: now });
    return true;
  }
}

// Gerenciador de Logs
class LogManager {
  constructor() {
    this.rateLimiter = new RateLimiter(
      CONFIG.RATE_LIMIT.WINDOW,
      CONFIG.RATE_LIMIT.MAX_REQUESTS
    );
    this.initializeLogDir();
  }

  async initializeLogDir() {
    try {
      await fs.mkdir(CONFIG.LOG_DIR, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de logs:', error);
    }
  }

  getLogFileName() {
    const date = new Date();
    return `error_log_${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.log`;
  }

  async rotateLogsIfNeeded() {
    try {
      const logFile = path.join(CONFIG.LOG_DIR, this.getLogFileName());
      
      try {
        const stats = await fs.stat(logFile);
        if (stats.size > CONFIG.MAX_LOG_SIZE) {
          const timestamp = Date.now();
          await fs.rename(
            logFile,
            path.join(CONFIG.LOG_DIR, `error_log_${timestamp}.old`)
          );
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      // Mantém apenas os logs mais recentes
      const files = await fs.readdir(CONFIG.LOG_DIR);
      if (files.length > CONFIG.MAX_LOGS) {
        const oldFiles = files
          .filter(f => f.endsWith('.old'))
          .sort()
          .slice(0, files.length - CONFIG.MAX_LOGS);
        
        for (const file of oldFiles) {
          await fs.unlink(path.join(CONFIG.LOG_DIR, file));
        }
      }
    } catch (error) {
      console.error('Erro na rotação de logs:', error);
    }
  }

  formatError(error, version, level) {
    const timestamp = new Date().toISOString();
    const errorDetails = {
      timestamp,
      level,
      version,
      message: error.message || 'Erro desconhecido',
      stack: error.stack || 'Stack não disponível',
      code: error.code || 'NO_CODE'
    };

    return JSON.stringify(errorDetails, null, 2);
  }

  async writeLog(formattedError) {
    try {
      await this.rotateLogsIfNeeded();
      const logFile = path.join(CONFIG.LOG_DIR, this.getLogFileName());
      await fs.appendFile(logFile, formattedError + '\n\n');
    } catch (error) {
      console.error('Erro ao escrever log:', error);
    }
  }
}

// Instância única do gerenciador de logs
const logManager = new LogManager();

/**
 * Reporta um erro com proteção contra flood
 * @param {Error} error - Objeto de erro
 * @param {string} version - Versão do bot
 * @param {string} [level=ERROR] - Nível do erro
 * @returns {Promise<void>}
 */
async function reportError(error, version, level = CONFIG.ERROR_LEVELS.ERROR) {
  try {
    // Verifica rate limit
    const errorKey = `${error.message}_${error.code || 'NO_CODE'}`;
    const isAllowed = await logManager.rateLimiter.isAllowed(errorKey);
    
    if (!isAllowed) {
      console.log('⚠️ Rate limit excedido para logs de erro');
      return;
    }

    // Formata e salva o erro
    const formattedError = logManager.formatError(error, version, level);
    await logManager.writeLog(formattedError);

    // Log no console apenas para erros críticos
    if (level === CONFIG.ERROR_LEVELS.FATAL) {
      console.error('❌ Erro crítico detectado:', error);
    }
  } catch (err) {
    console.error('Erro no sistema de debug:', err);
  }
}

// Exporta a função principal e níveis de erro
module.exports = Object.assign(reportError, {
  LEVELS: CONFIG.ERROR_LEVELS
});

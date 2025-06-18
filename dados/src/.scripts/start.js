#!/usr/bin/env node

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const os = require('os');

// Constants
const CONFIG_PATH = path.join(process.cwd(), 'dados', 'src', 'config.json');
const NODE_MODULES_PATH = path.join(process.cwd(), 'node_modules');
const QR_CODE_DIR = path.join(process.cwd(), 'dados', 'database', 'qr-code');
const CONNECT_FILE = path.join(process.cwd(), 'dados', 'src', 'connect.js');
const RESTART_DELAY = 50; // milliseconds
const isWindows = os.platform() === 'win32';
const dualMode = process.argv.includes('dual');

// Get version from package.json
let version = 'Desconhecida';
try {
  const packageJson = JSON.parse(fsSync.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  version = packageJson.version;
} catch (error) {
  // Silently fail if package.json can't be read
}

// Utility functions for colored output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[1;32m',
  red: '\x1b[1;31m',
  blue: '\x1b[1;34m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[1;36m',
  magenta: '\x1b[1;35m',
  dim: '\x1b[2m',
  bold: '\x1b[1m'
};

function mensagem(text) {
  console.log(`${colors.green}${text}${colors.reset}`);
}

function aviso(text) {
  console.log(`${colors.red}${text}${colors.reset}`);
}

function info(text) {
  console.log(`${colors.cyan}${text}${colors.reset}`);
}

function detalhe(text) {
  console.log(`${colors.dim}${text}${colors.reset}`);
}

function separador() {
  console.log(`${colors.blue}============================================${colors.reset}`);
}

// Function to check if a process is running
let botProcess = null;
let restartCount = 0;
const MAX_RESTART_COUNT = 10;
const RESTART_COUNT_RESET_INTERVAL = 60000; // 1 minute

// Function to handle graceful shutdown
function setupGracefulShutdown() {
  const shutdown = () => {
    console.log('\n');
    mensagem('🛑 Encerrando o bot...');
    
    if (botProcess) {
      botProcess.removeAllListeners('close');
      botProcess.kill();
    }
    
    process.exit(0);
  };

  // Handle termination signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  if (isWindows) {
    // Windows-specific handling
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.on('SIGINT', () => {
      shutdown();
    });
  }
}

// Display header with animation
async function displayHeader() {
  const header = [
    `   ${colors.bold}🚀 Inicializador da Nazuna 🚀${colors.reset}        `,
    `   ${colors.bold}🔧 Criado por Hiudy - Versão: ${version} 🔧${colors.reset}`
  ];
  
  separador();
  
  // Animate each line
  for (const line of header) {
    await new Promise(resolve => {
      process.stdout.write(line + '\n');
      setTimeout(resolve, 100);
    });
  }
  
  separador();
  console.log();
}

// Check prerequisites
async function checkPrerequisites() {
  // Check if configuration exists
  if (!fsSync.existsSync(CONFIG_PATH)) {
    aviso("⚠ Opa! Parece que você ainda não configurou o bot.");
    mensagem(`🔹 Para configurar, execute: ${colors.blue}npm run config${colors.reset}`);
    process.exit(1);
  }

  // Check if modules are installed
  if (!fsSync.existsSync(NODE_MODULES_PATH)) {
    aviso("⚠ Opa! Parece que os módulos ainda não foram instalados.");
    mensagem(`📦 Para instalar, execute: ${colors.blue}npm run config:install${colors.reset}`);
    process.exit(1);
  }
  
  // Check if connect.js exists
  if (!fsSync.existsSync(CONNECT_FILE)) {
    aviso(`⚠ Arquivo de conexão não encontrado: ${CONNECT_FILE}`);
    aviso("Verifique se o bot foi instalado corretamente.");
    process.exit(1);
  }
}

// Function to start the bot with improved error handling
function startBot(codeMode = false) {
  
  // Prepare arguments
  const args = ['--expose-gc', CONNECT_FILE];
  if (codeMode) args.push('--code');
  if (dualMode) args.push('--dual');
  
  // Spawn the bot process
  info(`🚀 Iniciando o bot ${codeMode ? 'com código' : 'com QR Code'}${dualMode ? ' (modo dual)' : ''}...`);
  
  botProcess = spawn('node', args, {
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  
  botProcess.on('error', (error) => {
    aviso(`❌ Erro ao iniciar o processo: ${error.message}`);
    restartBot(codeMode);
  });
  
  botProcess.on('close', (code) => {
    if (code !== 0) {
      aviso(`⚠ O bot caiu com código: ${code}`);
      restartBot(codeMode);
    }
  });
  
  return botProcess;
}

// Function to restart the bot with exponential backoff
function restartBot(codeMode) {
  restartCount++;
  
  // If too many restarts, slow down to prevent resource exhaustion
  let delay = RESTART_DELAY;
  
  if (restartCount > MAX_RESTART_COUNT) {
    const exponentialDelay = Math.min(30000, RESTART_DELAY * Math.pow(1.5, restartCount - MAX_RESTART_COUNT));
    delay = exponentialDelay;
    aviso(`⚠ Muitas reinicializações (${restartCount}). Aguardando ${Math.round(delay/1000)} segundos...`);
  } else {
    aviso(`⚠ O bot caiu! Reiniciando em ${delay/1000} segundo...`);
  }
  
  setTimeout(() => {
    if (botProcess) {
      botProcess.removeAllListeners('close');
      botProcess.removeAllListeners('error');
    }
    startBot(codeMode);
  }, delay);
}

// Function to check for automatic connection
async function checkAutoConnect() {
  try {
    // Ensure QR directory exists
    if (!fsSync.existsSync(QR_CODE_DIR)) {
      await fs.mkdir(QR_CODE_DIR, { recursive: true });
      return false;
    }
    
    // Check if there are session files
    const files = await fs.readdir(QR_CODE_DIR);
    return files.length > 2;
  } catch (error) {
    aviso(`❌ Erro ao verificar diretório QR Code: ${error.message}`);
    return false;
  }
}

// Function to prompt for connection method
async function promptConnectionMethod() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`${colors.yellow}🔗 Como deseja conectar o bot?${colors.reset}`);
    console.log(`${colors.yellow}1.${colors.reset} Conexão por QR Code`);
    console.log(`${colors.yellow}2.${colors.reset} Conexão por Código`);
    console.log(`${colors.yellow}3.${colors.reset} Sair`);
    
    rl.question(`Escolha uma opção (1/2/3): `, (answer) => {
      console.log();
      rl.close();
      
      switch (answer.trim()) {
        case '1':
          mensagem("📡 Iniciando conexão por QR Code...");
          resolve({ method: 'qr' });
          break;
        case '2':
          mensagem("🔑 Iniciando conexão por Código...");
          resolve({ method: 'code' });
          break;
        case '3':
          mensagem("👋 Saindo...");
          process.exit(0);
          break;
        default:
          aviso("❌ Opção inválida! Usando QR Code como padrão.");
          resolve({ method: 'qr' });
      }
    });
  });
}

// Main function
async function main() {
  try {
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    // Display header
    await displayHeader();
    
    // Check prerequisites
    await checkPrerequisites();
    
    // Check for auto-connect
    const hasSession = await checkAutoConnect();
    
    if (hasSession) {
      mensagem("📡 QR Code já detectado! Iniciando conexão automática...");
      startBot(false);
    } else {
      // Prompt for connection method
      const { method } = await promptConnectionMethod();
      startBot(method === 'code');
    }
  } catch (error) {
    aviso(`❌ Erro inesperado: ${error.message}`);
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  aviso(`❌ Erro fatal: ${error.message}`);
  process.exit(1);
}); 
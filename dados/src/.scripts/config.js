#!/usr/bin/env node

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const readline = require('readline');
const os = require('os');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Constants
const CONFIG_FILE = path.join(process.cwd(), 'dados', 'src', 'config.json');
const isWindows = os.platform() === 'win32';

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
  bold: '\x1b[1m',
  underline: '\x1b[4m'
};

function printMessage(text) {
  console.log(`${colors.green}${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.red}${text}${colors.reset}`);
}

function printInfo(text) {
  console.log(`${colors.cyan}${text}${colors.reset}`);
}

function printDetail(text) {
  console.log(`${colors.dim}${text}${colors.reset}`);
}

function printSeparator() {
  console.log(`${colors.blue}============================================${colors.reset}`);
}

// Function to validate input with better error messages
function validateInput(input, field) {
  switch (field) {
    case 'prefixo':
      if (input.length !== 1) {
        printWarning(`❌ O prefixo deve ter exatamente 1 caractere.`);
        return false;
      }
      return true;
      
    case 'numero':
      if (!/^[0-9]{10,15}$/.test(input)) {
        printWarning(`❌ O número deve conter apenas dígitos (10-15 caracteres).`);
        printDetail(`   Exemplo: 5511987654321 (sem símbolos ou espaços)`);
        return false;
      }
      return true;
      
    default:
      return true;
  }
}

// Function to handle graceful shutdown
function setupGracefulShutdown() {
  const shutdown = () => {
    console.log('\n');
    printWarning('🛑 Configuração cancelada pelo usuário.');
    process.exit(0);
  };

  // Handle termination signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Function to install dependencies with progress indicator
async function installDependencies() {
  printSeparator();
  printMessage("📦 Instalando dependências...");
  
  try {
    // Different install command based on platform
    const installCommand = isWindows ? 
      'npm install --no-optional --force --no-bin-links' : 
      'npm install --no-optional --force --no-bin-links';
    
    // Show spinner while installing
    await new Promise((resolve, reject) => {
      const npmProcess = exec(installCommand, (error) => {
        if (error) reject(error);
        else resolve();
      });
      
      const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      let i = 0;
      const interval = setInterval(() => {
        process.stdout.write(`\r${spinner[i]} Instalando dependências...`);
        i = (i + 1) % spinner.length;
      }, 100);
      
      npmProcess.on('close', () => {
        clearInterval(interval);
        process.stdout.write('\r                                \r');
      });
    });
    
    printMessage("✔ Instalação concluída! Rode 'npm start' para iniciar o bot.");
  } catch (error) {
    printWarning(`❌ Erro na instalação: ${error.message}`);
    printInfo("ℹ️ Você pode tentar instalar manualmente com: npm install --force");
    process.exit(1);
  }
}

// Display animated header
async function displayHeader() {
  const header = [
    `${colors.bold}🔧 Configurador da Nazuna - v${version}${colors.reset}`,
    `${colors.bold}🚀 Criado por Hiudy${colors.reset}`
  ];
  
  printSeparator();
  
  // Animate each line
  for (const line of header) {
    await new Promise(resolve => {
      process.stdout.write(line + '\n');
      setTimeout(resolve, 100);
    });
  }
  
  printSeparator();
  console.log();
}

// Main function
async function main() {
  try {
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    // Check if --install option is provided
    if (process.argv.includes('--install')) {
      await installDependencies();
      process.exit(0);
    }
    
    // Display header
    await displayHeader();
    
    // Load existing configuration
    const defaultConfig = {
      nomedono: "",
      numerodono: "",
      nomebot: "",
      prefixo: "!",
      aviso: false,
      debug: false,
      enablePanel: false
    };
    
    let config = { ...defaultConfig };
    
    try {
      if (fsSync.existsSync(CONFIG_FILE)) {
        const existingConfig = JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8'));
        config = { ...config, ...existingConfig };
        printInfo("ℹ️ Configuração existente carregada.");
      }
    } catch (error) {
      printWarning(`⚠ Erro ao ler configuração existente: ${error.message}`);
      printInfo("ℹ️ Usando valores padrão.");
    }
    
    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Terms of use with better formatting
    printWarning("⚠ TERMOS DE USO:");
    console.log(`${colors.yellow}1.${colors.reset} Não remova os créditos do criador`);
    console.log(`${colors.yellow}2.${colors.reset} Não venda este projeto`);
    console.log(`${colors.yellow}3.${colors.reset} Use de forma ética e responsável`);
    console.log();
    
    const termsAccepted = await confirm(rl, "Você concorda com os termos?", "n");
    if (!termsAccepted) {
      printWarning("❌ Instalação cancelada. É necessário aceitar os termos.");
      rl.close();
      return;
    }
    
    printMessage("✔ Termos aceitos!");
    console.log();
    
    // Collect configuration with improved prompts
    printInfo(`${colors.bold}${colors.underline}CONFIGURAÇÃO BÁSICA${colors.reset}`);
    config.nomedono = await promptInput(rl, "👤 Qual seu nome?", config.nomedono);
    config.numerodono = await promptInput(rl, "📞 Qual seu número (somente dígitos, 10-15)?", config.numerodono, "numero");
    config.nomebot = await promptInput(rl, "🤖 Qual o nome do bot?", config.nomebot);
    config.prefixo = await promptInput(rl, "⚙️ Qual o prefixo (1 caractere)?", config.prefixo, "prefixo");
    
    console.log();
    printInfo(`${colors.bold}${colors.underline}CONFIGURAÇÃO AVANÇADA${colors.reset}`);
    config.aviso = await confirm(rl, "📢 Ativar avisos do sistema?", config.aviso ? "s" : "n");
    config.debug = await confirm(rl, "🔍 Ativar modo de depuração?", config.debug ? "s" : "n");
    config.enablePanel = await confirm(rl, "🖥️ Ativar painel web?", config.enablePanel ? "s" : "n");
    
    // Save configuration
    try {
      // Ensure directory exists
      const configDir = path.dirname(CONFIG_FILE);
      if (!fsSync.existsSync(configDir)) {
        await fs.mkdir(configDir, { recursive: true });
      }
      
      // Write config file with pretty formatting
      await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
      
      // Show configuration summary
      console.log();
      printInfo("📋 Resumo da configuração:");
      printDetail(`   Nome: ${config.nomedono}`);
      printDetail(`   Número: ${config.numerodono}`);
      printDetail(`   Nome do Bot: ${config.nomebot}`);
      printDetail(`   Prefixo: ${config.prefixo}`);
      printDetail(`   Avisos: ${config.aviso ? 'Ativados' : 'Desativados'}`);
      printDetail(`   Debug: ${config.debug ? 'Ativado' : 'Desativado'}`);
      printDetail(`   Painel Web: ${config.enablePanel ? 'Ativado' : 'Desativado'}`);
      
      // Finalization
      printSeparator();
      printMessage("🎉 Configuração concluída com sucesso!");
      printSeparator();
      
      const installNow = await confirm(rl, "📦 Instalar dependências agora?", "s");
      if (installNow) {
        rl.close();
        await installDependencies();
      } else {
        printMessage("⚡ Para instalar depois, use: npm run config:install");
      }
      
      printSeparator();
      printMessage(`🚀 Nazuna pronta para uso! - v${version}`);
      printSeparator();
    } catch (error) {
      printWarning(`❌ Erro ao salvar configuração: ${error.message}`);
    }
    
    rl.close();
  } catch (error) {
    printWarning(`❌ Erro inesperado: ${error.message}`);
    process.exit(1);
  }
}

// Function to prompt for input with default value
async function promptInput(rl, prompt, defaultValue, field = null) {
  return new Promise((resolve) => {
    const displayPrompt = `${prompt} ${colors.dim}(Atual: ${defaultValue || 'Não definido'})${colors.reset}: `;
    rl.question(displayPrompt, (input) => {
      const value = input.trim() || defaultValue;
      
      if (field && !validateInput(value, field)) {
        return promptInput(rl, prompt, defaultValue, field).then(resolve);
      }
      
      resolve(value);
    });
  });
}

// Function to confirm yes/no with better formatting
async function confirm(rl, prompt, defaultValue = 'n') {
  return new Promise((resolve) => {
    const defaultText = defaultValue.toLowerCase() === 's' ? 'S/n' : 's/N';
    rl.question(`${prompt} (${defaultText}): `, (input) => {
      const response = (input.trim() || defaultValue).toLowerCase();
      resolve(response === 's' || response === 'sim' || response === 'y' || response === 'yes');
    });
  });
}

// Run main function
main().catch(error => {
  printWarning(`❌ Erro fatal: ${error.message}`);
  process.exit(1);
}); 
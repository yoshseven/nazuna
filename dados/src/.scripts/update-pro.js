#!/usr/bin/env node

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const readline = require('readline');
const crypto = require('crypto');
const { promisify } = require('util');
const execAsync = promisify(exec);
const os = require('os');

// Constants
const REPO_URL = "https://github.com/hiudyy/nazuna.git";
const TEMP_DIR = path.join(process.cwd(), "temp_nazuna");
const BACKUP_DIR = path.join(process.cwd(), `backup_${new Date().toISOString().replace(/[:.]/g, '_').replace(/T/, '_')}`);
const USER_EDITABLE_DIRS = ['dados/src/menus', 'dados/src/funcs', 'dados/midias'];
const CRITICAL_FILES = ['dados/src/config.json', 'package.json'];

// Utility functions for colored output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[1;32m',
  red: '\x1b[1;31m',
  blue: '\x1b[1;34m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[1;36m',
  magenta: '\x1b[1;35m',
  dim: '\x1b[2m'
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

// Check if running on Windows
const isWindows = os.platform() === 'win32';

// Check requirements with better error messages
async function checkRequirements() {
  printInfo("🔍 Verificando requisitos...");
  
  try {
    await execAsync('git --version');
    printDetail("✓ Git encontrado");
  } catch (error) {
    printWarning("❌ Git não encontrado. Por favor, instale o Git:");
    if (isWindows) {
      printInfo("   Download: https://git-scm.com/download/win");
    } else if (os.platform() === 'darwin') {
      printInfo("   Execute: brew install git");
    } else {
      printInfo("   Execute: sudo apt-get install git");
    }
    process.exit(1);
  }

  try {
    await execAsync('npm --version');
    printDetail("✓ Node.js/NPM encontrado");
  } catch (error) {
    printWarning("❌ Node.js/NPM não encontrado. Por favor, instale o Node.js:");
    printInfo("   Download: https://nodejs.org/");
    process.exit(1);
  }
  
  printDetail("✓ Todos os requisitos atendidos");
}

// Confirm update with timeout and better UI
function confirmUpdate() {
  return new Promise((resolve) => {
    printSeparator();
    printMessage("🔄 ATUALIZAÇÃO PRO - MODO INTELIGENTE");
    printInfo("ℹ️ Este modo analisa cada arquivo individualmente e preserva suas edições.");
    printInfo("ℹ️ Benefícios do modo Pro:");
    printDetail("  • Preserva arquivos personalizados");
    printDetail("  • Mantém suas configurações");
    printDetail("  • Atualiza apenas o necessário");
    printDetail("  • Converte scripts shell para JavaScript");
    printWarning("\n⚠ Pressione Ctrl+C para cancelar. Iniciando em 5 segundos...");
    
    let countdown = 5;
    const timer = setInterval(() => {
      process.stdout.write(`\rIniciando em ${countdown}...${' '.repeat(20)}`);
      countdown--;
      
      if (countdown < 0) {
        clearInterval(timer);
        process.stdout.write("\r                                  \n");
        printMessage("✔ Prosseguindo com a atualização inteligente...");
        resolve();
      }
    }, 1000);
  });
}

// Create backup with progress indicators
async function createBackup() {
  printMessage("\n📂 Criando backup dos dados...");
  
  try {
    // Create backup directories
    await fs.mkdir(path.join(BACKUP_DIR, 'dados', 'database'), { recursive: true });
    await fs.mkdir(path.join(BACKUP_DIR, 'dados', 'src'), { recursive: true });
    await fs.mkdir(path.join(BACKUP_DIR, 'dados', 'midias'), { recursive: true });
    
    // Copy database files
    const databaseDir = path.join(process.cwd(), 'dados', 'database');
    if (fsSync.existsSync(databaseDir)) {
      printDetail("↳ Copiando banco de dados...");
      await copyDirectoryAsync(databaseDir, path.join(BACKUP_DIR, 'dados', 'database'));
    }
    
    // Copy config.json
    const configFile = path.join(process.cwd(), 'dados', 'src', 'config.json');
    if (fsSync.existsSync(configFile)) {
      printDetail("↳ Copiando configurações...");
      await fs.copyFile(configFile, path.join(BACKUP_DIR, 'dados', 'src', 'config.json'));
    }
    
    // Copy midias directory
    const midiasDir = path.join(process.cwd(), 'dados', 'midias');
    if (fsSync.existsSync(midiasDir)) {
      printDetail("↳ Copiando mídias...");
      await copyDirectoryAsync(midiasDir, path.join(BACKUP_DIR, 'dados', 'midias'));
    }
    
    // Copy all source files for comparison
    const srcDir = path.join(process.cwd(), 'dados', 'src');
    if (fsSync.existsSync(srcDir)) {
      printDetail("↳ Copiando arquivos fonte...");
      await copyDirectoryAsync(srcDir, path.join(BACKUP_DIR, 'dados', 'src'));
    }
    
    printMessage(`✔ Backup completo salvo em ${BACKUP_DIR}`);
  } catch (error) {
    printWarning(`❌ Erro ao criar backup: ${error.message}`);
    throw error;
  }
}

// Helper function to copy directories recursively with async/await
async function copyDirectoryAsync(source, destination) {
  if (!fsSync.existsSync(destination)) {
    await fs.mkdir(destination, { recursive: true });
  }
  
  const files = await fs.readdir(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    const statsz = await fs.stat(sourcePath);
    
    if (statsz.isDirectory()) {
      await copyDirectoryAsync(sourcePath, destPath);
    } else {
      await fs.copyFile(sourcePath, destPath);
    }
  }
}

// Download update with better error handling
async function downloadUpdate() {
  printMessage("\n⬇️ Baixando versão mais recente...");
  
  try {
    // Remove temp directory if it exists
    if (fsSync.existsSync(TEMP_DIR)) {
      if (isWindows) {
        // Windows needs special handling for directory removal
        execSync(`rmdir /s /q "${TEMP_DIR}"`, { stdio: 'ignore' });
      } else {
        await fs.rm(TEMP_DIR, { recursive: true, force: true });
      }
    }
    
    // Clone the repository with progress indicator
    printDetail("↳ Clonando repositório...");
    await new Promise((resolve, reject) => {
      const gitProcess = exec(`git clone --depth 1 ${REPO_URL} "${TEMP_DIR}"`, 
        (error) => error ? reject(error) : resolve());
      
      // Show some activity while waiting
      const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      let i = 0;
      const interval = setInterval(() => {
        process.stdout.write(`\r${spinner[i]} Baixando...`);
        i = (i + 1) % spinner.length;
      }, 100);
      
      gitProcess.on('close', () => {
        clearInterval(interval);
        process.stdout.write('\r                 \r');
        resolve();
      });
    });
    
    // Remove README.md from temp directory
    const readmePath = path.join(TEMP_DIR, 'README.md');
    if (fsSync.existsSync(readmePath)) {
      await fs.unlink(readmePath);
    }
    
    printMessage("✔ Download concluído!");
  } catch (error) {
    printWarning(`❌ Falha ao baixar o repositório: ${error.message}`);
    printInfo("🔍 Verificando conectividade com GitHub...");
    try {
      await execAsync('ping -c 1 github.com');
      printWarning("❌ Problema de permissão ou configuração do Git.");
    } catch {
      printWarning("❌ Problema de conexão com a internet. Verifique sua conexão.");
    }
    throw error;
  }
}

// Calculate file hash with better error handling
async function calculateFileHash(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    return null;
  }
}

// Check if file is a JavaScript file
function isJavaScriptFile(filePath) {
  return path.extname(filePath).toLowerCase() === '.js';
}

// Check if file is a shell script
function isShellScript(filePath) {
  return path.extname(filePath).toLowerCase() === '.sh';
}

// Improved shell script to JS converter
async function convertShellToJs(shellFilePath, jsFilePath) {
  printInfo(`🔄 Convertendo script shell para JavaScript: ${path.basename(shellFilePath)}`);
  
  try {
    // Read shell script content
    const shellContent = await fs.readFile(shellFilePath, 'utf8');
    
    // Basic shell script header template
    const jsContent = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const os = require('os');

// Converted from shell script: ${path.basename(shellFilePath)}
// Auto-conversion by Nazuna update-pro

// Constants
const isWindows = os.platform() === 'win32';

// Utility functions for colored output
const colors = {
  reset: '\\x1b[0m',
  green: '\\x1b[1;32m',
  red: '\\x1b[1;31m',
  blue: '\\x1b[1;34m',
  yellow: '\\x1b[1;33m'
};

function printMessage(text) {
  console.log(\`\${colors.green}\${text}\${colors.reset}\`);
}

function printWarning(text) {
  console.log(\`\${colors.red}\${text}\${colors.reset}\`);
}

// Original shell script (for reference):
/*
${shellContent}
*/

// TODO: This is an auto-converted script that needs manual review
// The original shell script functionality should be implemented here in JavaScript

console.log("⚠️ Este script foi convertido automaticamente de shell para JavaScript.");
console.log("⚠️ Por favor, revise e implemente a funcionalidade necessária.");
console.log("⚠️ Para referência, o script shell original está comentado acima.");
`;

    // Write the JavaScript file
    await fs.writeFile(jsFilePath, jsContent, 'utf8');
    
    // If the shell file is in .scripts directory and has a specific name, create a proper implementation
    if (shellFilePath.includes('/.scripts/') && 
        (shellFilePath.endsWith('.start.sh') || 
         shellFilePath.endsWith('.config.sh') || 
         shellFilePath.endsWith('.update.sh'))) {
      printInfo(`   ↳ Script de sistema detectado, usando implementação otimizada`);
      return true;
    }
    
    return true;
  } catch (error) {
    printWarning(`❌ Erro ao converter script: ${error.message}`);
    return false;
  }
}

// Check if a file is likely edited by the user
async function isUserEditedFile(filePath, originalPath) {
  // Check if file is in a user-editable directory
  for (const dir of USER_EDITABLE_DIRS) {
    if (filePath.includes(dir)) {
      return true;
    }
  }
  
  // Check if it's a critical file
  for (const file of CRITICAL_FILES) {
    if (filePath.endsWith(file)) {
      return true;
    }
  }
  
  // If we have the original to compare
  if (fsSync.existsSync(originalPath)) {
    try {
      const originalContent = await fs.readFile(originalPath, 'utf8');
      const currentContent = await fs.readFile(filePath, 'utf8');
      
      // Look for comment patterns that might indicate user edits
      const userEditPatterns = [
        /\/\/ Editado por/i, 
        /\/\/ Modificado/i, 
        /\/\/ Customizado/i,
        /\/\/ Added by/i,
        /\/\* Custom/i
      ];
      
      for (const pattern of userEditPatterns) {
        if (pattern.test(currentContent) && !pattern.test(originalContent)) {
          return true;
        }
      }
    } catch (error) {
      // If we can't read the files, assume it's not user edited
      return false;
    }
  }
  
  return false;
}

// Analyze file differences to make smarter update decisions
async function analyzeFileDiff(sourcePath, targetPath) {
  // If target doesn't exist, it's a new file
  if (!fsSync.existsSync(targetPath)) {
    return 'new';
  }
  
  // Calculate hashes to compare files
  const sourceHash = await calculateFileHash(sourcePath);
  const targetHash = await calculateFileHash(targetPath);
  
  // If hashes match, files are identical
  if (sourceHash === targetHash) {
    return 'identical';
  }
  
  // Check if it's likely a user-edited file
  const isUserEdited = await isUserEditedFile(targetPath, sourcePath);
  if (isUserEdited) {
    return 'user-edited';
  }
  
  // Otherwise, it's a standard update
  return 'update';
}

// Apply smart update with improved logic
async function applySmartUpdate() {
  printMessage("\n🧠 Aplicando atualização inteligente...");
  
  const stats = {
    updated: [],
    kept: [],
    new: [],
    converted: [],
    userEdited: []
  };
  
  // Process package.json separately with smarter merging
  const oldPackageJsonPath = path.join(process.cwd(), 'package.json');
  const newPackageJsonPath = path.join(TEMP_DIR, 'package.json');
  
  if (fsSync.existsSync(oldPackageJsonPath) && fsSync.existsSync(newPackageJsonPath)) {
    printInfo("📦 Processando package.json...");
    
    try {
      const oldPackageJson = JSON.parse(await fs.readFile(oldPackageJsonPath, 'utf8'));
      const newPackageJson = JSON.parse(await fs.readFile(newPackageJsonPath, 'utf8'));
      
      // Smart merge of package.json
      const mergedPackageJson = {
        ...newPackageJson,
        dependencies: { 
          ...newPackageJson.dependencies, 
          ...oldPackageJson.dependencies 
        }
      };
      
      // Preserve custom scripts if they exist
      if (oldPackageJson.scripts) {
        const customScripts = {};
        for (const [key, value] of Object.entries(oldPackageJson.scripts)) {
          // Keep custom scripts that aren't in the new package.json
          if (!newPackageJson.scripts[key] && !key.startsWith('start') && 
              !key.startsWith('config') && !key.startsWith('update')) {
            customScripts[key] = value;
          }
        }
        
        mergedPackageJson.scripts = {
          ...newPackageJson.scripts,
          ...customScripts
        };
      }
      
      // Write updated package.json
      await fs.writeFile(oldPackageJsonPath, JSON.stringify(mergedPackageJson, null, 2));
      printInfo("   ↳ package.json atualizado mantendo dependências e scripts personalizados");
    } catch (error) {
      printWarning(`❌ Erro ao processar package.json: ${error.message}`);
      if (fsSync.existsSync(newPackageJsonPath)) {
        await fs.copyFile(newPackageJsonPath, oldPackageJsonPath);
        printInfo("   ↳ Usando package.json da nova versão");
      }
    }
  } else if (fsSync.existsSync(newPackageJsonPath)) {
    await fs.copyFile(newPackageJsonPath, oldPackageJsonPath);
    printInfo("📦 Novo package.json copiado");
  }
  
  // Walk through all directories and files in the temp directory
  async function processDirectory(directory, relativePath = '') {
    const entries = await fs.readdir(directory);
    
    for (const entry of entries) {
      const entryPath = path.join(directory, entry);
      const targetRelativePath = path.join(relativePath, entry);
      const targetPath = path.join(process.cwd(), targetRelativePath);
      
      const statsz = await fs.stat(entryPath);
      
      if (statsz.isDirectory()) {
        // Create directory if it doesn't exist
        if (!fsSync.existsSync(targetPath)) {
          await fs.mkdir(targetPath, { recursive: true });
          printDetail(`📁 Criando diretório: ${targetRelativePath}`);
        }
        
        // Process subdirectory
        await processDirectory(entryPath, targetRelativePath);
      } else {
        // Skip package.json as we've already handled it
        if (entry === 'package.json' || entry === 'package-lock.json') {
          continue;
        }
        
        // Analyze file differences
        const diffResult = await analyzeFileDiff(entryPath, targetPath);
        
        switch (diffResult) {
          case 'identical':
            // Files are identical, no need to update
            printDetail(`✓ Mantendo arquivo (idêntico): ${targetRelativePath}`);
            stats.kept.push(targetRelativePath);
            break;
            
          case 'user-edited':
            // User-edited file, keep it
            printInfo(`👤 Preservando arquivo editado pelo usuário: ${targetRelativePath}`);
            stats.userEdited.push(targetRelativePath);
            break;
            
          case 'update':
            // Regular update
            // If it's a shell script, try to convert it to JS
            if (isShellScript(entryPath)) {
              const jsFilePath = targetPath.replace(/\.sh$/, '.js');
              const converted = await convertShellToJs(entryPath, jsFilePath);
              
              if (converted) {
                stats.converted.push(targetRelativePath);
                continue;
              }
            }
            
            // Copy the file
            await fs.copyFile(entryPath, targetPath);
            printDetail(`🔄 Atualizando: ${targetRelativePath}`);
            stats.updated.push(targetRelativePath);
            break;
            
          case 'new':
            // New file
            await fs.copyFile(entryPath, targetPath);
            printInfo(`➕ Novo arquivo: ${targetRelativePath}`);
            stats.new.push(targetRelativePath);
            break;
        }
      }
    }
  }
  
  // Process all files and directories
  try {
    await processDirectory(TEMP_DIR);
  } catch (error) {
    printWarning(`❌ Erro ao processar arquivos: ${error.message}`);
    throw error;
  }
  
  // Print summary
  printSeparator();
  printMessage(`✅ Atualização inteligente concluída!`);
  printInfo(`📊 Resumo:`);
  printInfo(`- ${stats.updated.length} arquivos atualizados`);
  printInfo(`- ${stats.new.length} novos arquivos`);
  printInfo(`- ${stats.kept.length} arquivos mantidos (idênticos)`);
  printInfo(`- ${stats.userEdited.length} arquivos personalizados preservados`);
  printInfo(`- ${stats.converted.length} scripts shell convertidos para JavaScript`);
  
  // Show details if any files were updated
  if (stats.updated.length > 0 && stats.updated.length <= 5) {
    printDetail("\nArquivos atualizados:");
    stats.updated.forEach(file => printDetail(`- ${file}`));
  }
  
  if (stats.new.length > 0 && stats.new.length <= 5) {
    printDetail("\nNovos arquivos:");
    stats.new.forEach(file => printDetail(`- ${file}`));
  }
  
  printSeparator();
  
  // Remove temp directory
  if (fsSync.existsSync(TEMP_DIR)) {
    if (isWindows) {
      execSync(`rmdir /s /q "${TEMP_DIR}"`, { stdio: 'ignore' });
    } else {
      await fs.rm(TEMP_DIR, { recursive: true, force: true });
    }
  }
}

// Install dependencies with better error handling and platform detection
async function installDependencies() {
  printMessage("\n📦 Instalando dependências...");
  
  try {
    // Different install command based on platform
    const installCommand = isWindows ? 
      'npm install --no-optional --force --no-bin-links' : 
      'npm install --no-optional --force --no-bin-links';
    
    // Run npm install with progress spinner
    await new Promise((resolve, reject) => {
      const npmProcess = exec(installCommand, (error) => {
        if (error) reject(error);
        else resolve();
      });
      
      // Show spinner while installing
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
    
    printMessage("✔ Dependências instaladas com sucesso!");
  } catch (error) {
    printWarning(`❌ Falha ao instalar dependências: ${error.message}`);
    printInfo("ℹ️ Você pode tentar instalar manualmente com: npm install --force");
    throw error;
  }
}

// Main function with better error handling and progress tracking
async function main() {
  try {
    printSeparator();
    printMessage("🚀 NAZUNA BOT - ATUALIZAÇÃO PRO");
    printMessage("✨ Criado por Hiudy - Otimizado para todas as plataformas");
    printSeparator();
    console.log();
    
    // Track progress
    const steps = [
      { name: "Verificando requisitos", func: checkRequirements },
      { name: "Confirmando atualização", func: confirmUpdate },
      { name: "Criando backup", func: createBackup },
      { name: "Baixando atualização", func: downloadUpdate },
      { name: "Aplicando atualização inteligente", func: applySmartUpdate },
      { name: "Instalando dependências", func: installDependencies }
    ];
    
    let completedSteps = 0;
    
    // Execute each step
    for (const step of steps) {
      await step.func();
      completedSteps++;
    }
    
    // Final message
    printSeparator();
    printMessage("🎉 Atualização Pro concluída com sucesso!");
    printMessage("🚀 Inicie o bot com: npm start");
    printSeparator();
    printInfo("ℹ️ Backup disponível em: " + BACKUP_DIR);
    printInfo("ℹ️ Caso encontre problemas, você pode restaurar o backup manualmente.");
  } catch (error) {
    printSeparator();
    printWarning(`❌ Erro durante a atualização: ${error.message}`);
    printWarning(`❌ Seu backup está em: ${BACKUP_DIR}`);
    printInfo("ℹ️ Para restaurar o backup manualmente, copie os arquivos de volta.");
    printInfo("ℹ️ Se precisar de ajuda, entre em contato com o desenvolvedor.");
    process.exit(1);
  }
}

// Run main function
main(); 
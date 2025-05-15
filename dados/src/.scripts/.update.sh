#!/bin/bash

# nazuna Bot - Script de Atualização
# Criado por Hiudy
# Mantenha os créditos, por favor! <3

# Configurações iniciais
set -e
BACKUP_DIR="./backup_$(date +%Y%m%d_%H%M%S)"
REPO_URL="https://github.com/hiudyy/nazuna.git"
BRANCH="main"

# Lista de arquivos/diretórios "inúteis" a serem excluídos
UNWANTED_FILES=(".git" ".gitignore" "README.md" "LICENSE" ".github")

# Funções utilitárias
print_message() {
    printf "\033[1;32m%s\033[0m\n" "$1"
}

print_warning() {
    printf "\033[1;31m%s\033[0m\n" "$1"
}

print_separator() {
    printf "\033[1;34m============================================\033[0m\n"
}

# Verifica dependências
check_requirements() {
    command -v git >/dev/null 2>&1 || { print_warning "❌ Git não encontrado. Instale o Git."; exit 1; }
    command -v npm >/dev/null 2>&1 || { print_warning "❌ Node.js/NPM não encontrado. Instale o Node.js."; exit 1; }
}

# Confirmação do usuário com timeout de 5 segundos
confirm_update() {
    print_warning "⚠ Esta ação atualizará apenas os arquivos modificados e removerá arquivos desnecessários (com backup dos dados)."
    print_warning "Pressione Ctrl+C para cancelar. Iniciando em 5 segundos..."
    
    for i in {5..1}; do
        printf "\rIniciando em %d..." "$i"
        sleep 1
    done
    printf "\r%-20s\n" ""
    
    print_message "✔ Prosseguindo com a atualização..."
}

# Criação do backup
create_backup() {
    print_message "📂 Criando backup dos dados..."
    mkdir -p "$BACKUP_DIR/dados/database" "$BACKUP_DIR/dados/src" "$BACKUP_DIR/dados/midias"
    
    cp -rp "./dados/database/." "$BACKUP_DIR/dados/database/" 2>/dev/null || true
    cp -p "./dados/src/config.json" "$BACKUP_DIR/dados/src/" 2>/dev/null || true
    cp -rp "./dados/midias/." "$BACKUP_DIR/dados/midias/" 2>/dev/null || true
    
    print_message "✔ Backup salvo em $BACKUP_DIR"
}

# Inicializa o repositório Git, se necessário
init_git_repo() {
    if [ ! -d ".git" ]; then
        print_message "🔧 Inicializando repositório Git local..."
        git init
        git remote add origin "$REPO_URL"
        git fetch origin
        git checkout -b "$BRANCH" --track "origin/$BRANCH" || {
            print_warning "❌ Falha ao configurar o repositório. Verifique a URL ou o branch."
            exit 1
        }
    else
        print_message "🔄 Repositório Git já existe. Verificando configuração..."
        git remote set-url origin "$REPO_URL" 2>/dev/null || git remote add origin "$REPO_URL"
    fi
}

# Download apenas das alterações
download_update() {
    print_message "⬇️ Baixando alterações do repositório..."
    git fetch origin || {
        print_warning "❌ Falha ao buscar atualizações. Verifique sua conexão."
        exit 1
    }
    
    # Verifica se há alterações
    if git diff --quiet "origin/$BRANCH" -- . ':!dados'; then
        print_message "ℹ️ Nenhuma alteração detectada no repositório remoto."
        exit 0
    fi
}

# Aplicação da atualização
apply_update() {
    print_message "🚚 Aplicando alterações..."
    # Preserva arquivos importantes antes do merge
    cp -p "./dados/src/config.json" "/tmp/config.json" 2>/dev/null || true
    
    # Faz o merge das alterações, ignorando a pasta dados
    git pull origin "$BRANCH" --no-rebase || {
        print_warning "❌ Conflito detectado. Resolva os conflitos manualmente ou restaure o backup."
        exit 1
    }
    
    # Restaura arquivos preservados
    cp -p "/tmp/config.json" "./dados/src/config.json" 2>/dev/null || true
    rm -f "/tmp/config.json" 2>/dev/null || true
}

# Exclusão de arquivos inúteis
remove_unwanted_files() {
    print_message "🗑️ Removendo arquivos desnecessários..."
    for file in "${UNWANTED_FILES[@]}"; do
        if [ -e "$file" ]; then
            rm -rf "$file" && print_message "✔ $file removido."
        else
            print_message "ℹ️ $file não encontrado, pulando."
        fi
    done
}

# Instalação de dependências (se necessário)
install_dependencies() {
    print_message "📦 Verificando dependências..."
    if [ -f "package.json" ] && ! git diff --quiet "origin/$BRANCH" -- package.json; then
        print_message "🔄 package.json foi alterado. Instalando dependências..."
        npm install --no-bin-links --force || {
            print_warning "❌ Falha ao instalar dependências. Verifique package.json."
            exit 1
        }
        print_message "✔ Dependências instaladas!"
    else
        print_message "ℹ️ Nenhuma alteração em package.json. Pulando instalação de dependências."
    fi
}

# Limpeza final
cleanup() {
    print_message "🧹 Finalizando..."
    rm -rf "$BACKUP_DIR" || true
}

# Main
main() {
    print_separator
    print_message "🔄 Atualização do nazuna Bot"
    print_message "🚀 Criado por Hiudy"
    print_separator
    echo

    check_requirements
    confirm_update
    create_backup
    init_git_repo
    download_update
    apply_update
    remove_unwanted_files
    install_dependencies
    cleanup

    print_separator
    print_message "🎉 Atualização concluída com sucesso!"
    print_message "🚀 Inicie o bot com: npm start"
    print_separator
}

# Executa com tratamento de erros
main || {
    print_warning "❌ Erro durante a atualização. Seu backup está em $BACKUP_DIR"
    exit 1
}
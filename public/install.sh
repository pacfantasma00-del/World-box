#!/usr/bin/env bash
# ==============================================================================
# ASTRO CORE MATRIX & WORLDBOX GOD SIMULATOR
# Automated Installer & Environment Setup for Termux (Android) & Linux / WSL
# ==============================================================================

set -e

# Terminal Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "====================================================================="
echo "  🌌 ASTRO CORE MATRIX & WORLDBOX SIMULATOR — INSTALADOR AUTOMÁTICO  "
echo "====================================================================="
echo -e "${NC}"

TARGET_DIR="${HOME}/astro-worldbox"
DEFAULT_HOST="https://ais-dev-ey4tpgqmojf6ewpllwpnn6-178215896812.us-east1.run.app"
SERVER_URL="${1:-$DEFAULT_HOST}"

echo -e "${BLUE}[1/6] Identificando ambiente e instalando pacotes necessários...${NC}"

# Detect Termux or Standard Linux
if [ -n "$PREFIX" ] && [ -d "$PREFIX/bin" ] && command -v pkg >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Ambiente Termux (Android) detectado.${NC}"
    echo -e "${YELLOW}Executando: pkg update e instalando dependências (Node.js LTS, Python, Unzip, Curl)...${NC}"
    pkg update -y || true
    pkg install -y nodejs-lts python unzip curl git
elif command -v apt-get >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Ambiente Debian/Ubuntu/WSL detectado.${NC}"
    if [ "$EUID" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
        sudo apt-get update -y || true
        sudo apt-get install -y nodejs npm python3 unzip curl git
    else
        apt-get update -y || true
        apt-get install -y nodejs npm python3 unzip curl git
    fi
elif command -v pacman >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Ambiente Arch Linux detectado.${NC}"
    sudo pacman -Sy --noconfirm nodejs npm python unzip curl git
elif command -v apk >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Ambiente Alpine Linux detectado.${NC}"
    apk add --no-cache nodejs npm python3 unzip curl git bash
elif command -v brew >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Ambiente macOS (Homebrew) detectado.${NC}"
    brew install node python unzip curl
else
    echo -e "${YELLOW}Aviso: Gerenciador de pacotes não identificado automaticamente.${NC}"
    echo -e "${YELLOW}Verifique se 'node', 'npm', 'curl' e 'unzip' estão instalados.${NC}"
fi

echo -e "\n${BLUE}[2/6] Verificando versões instaladas...${NC}"
if command -v node >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Node.js: $(node -v)${NC}"
else
    echo -e "${RED}✗ Node.js não foi encontrado. Por favor, instale Node.js 18+ manualmente.${NC}"
    exit 1
fi

if command -v curl >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Curl instalado.${NC}"
else
    echo -e "${RED}✗ Curl não foi encontrado.${NC}"
    exit 1
fi

if command -v unzip >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Unzip instalado.${NC}"
else
    echo -e "${RED}✗ Unzip não foi encontrado.${NC}"
    exit 1
fi

echo -e "\n${BLUE}[3/6] Preparando diretório do projeto em: ${TARGET_DIR}...${NC}"
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

echo -e "\n${BLUE}[4/6] Baixando pacote completo atualizado do servidor (${SERVER_URL})...${NC}"
ZIP_URL="${SERVER_URL}/api/download-zip"
echo -e "URL: ${ZIP_URL}"

# Download ZIP with resume / retry
curl -f -L --retry 3 --retry-delay 2 -sS "$ZIP_URL" -o worldbox-package.zip

if [ ! -s worldbox-package.zip ]; then
    echo -e "${RED}✗ Erro: O arquivo baixado está vazio ou a conexão falhou.${NC}"
    echo -e "${YELLOW}Tente rodar: curl -sSL \"$ZIP_URL\" -o worldbox-package.zip${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Pacote baixado com sucesso! Extraindo arquivos...${NC}"
unzip -o -q worldbox-package.zip

echo -e "\n${BLUE}[5/6] Instalando dependências Node.js (npm install)...${NC}"
npm install --no-audit --prefer-offline || npm install

echo -e "\n${BLUE}[6/6] Criando script de inicialização segura com PM2 e Node direto...${NC}"

# Script de inicialização defensiva contra TypeError: Cannot read properties of undefined (reading 'includes')
cat << 'EOF' > start.sh
#!/usr/bin/env bash
PORT=${PORT:-3000}
export PORT
export NODE_ENV=development

echo "========================================================="
echo "  🌌 INICIANDO ASTRO CORE MATRIX & WORLDBOX SIMULATOR   "
echo "  Porta: http://127.0.0.1:${PORT}                       "
echo "========================================================="

# Execução limpa com tsx / node
if command -v npx >/dev/null 2>&1; then
    npx tsx server.ts
elif [ -f dist/server.js ]; then
    node dist/server.js
else
    npm run dev
fi
EOF

chmod +x start.sh

# Se PM2 estiver instalado, oferecer opção ou iniciar
if command -v pm2 >/dev/null 2>&1; then
    echo -e "${PURPLE}✓ PM2 detectado no sistema!${NC}"
fi

echo -e "\n${GREEN}${BOLD}=====================================================================${NC}"
echo -e "${GREEN}${BOLD}  ✨ INSTALAÇÃO E ATUALIZAÇÃO CONCLUÍDAS COM SUCESSO!                ${NC}"
echo -e "${GREEN}${BOLD}=====================================================================${NC}"
echo -e ""
echo -e "O projeto foi configurado em: ${BOLD}${TARGET_DIR}${NC}"
echo -e ""
echo -e "Para iniciar o servidor agora:"
echo -e "  ${CYAN}cd ${TARGET_DIR} && ./start.sh${NC}"
echo -e ""
echo -e "Ou via PM2 (em segundo plano no Termux):"
echo -e "  ${CYAN}cd ${TARGET_DIR} && pm2 start start.sh --name astro-worldbox${NC}"
echo -e "  ${CYAN}pm2 logs astro-worldbox${NC}"
echo -e ""
echo -e "Depois abra no navegador do seu celular ou PC:"
echo -e "  ${BOLD}👉 http://127.0.0.1:3000${NC}"
echo -e "${GREEN}=====================================================================${NC}"

#!/bin/bash

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo -e "${RED}✖ Fichier .env manquant${NC}"
    exit 1
fi

# Charger les variables d'environnement
source .env

# Configuration FTP
FTP_HOST="91.108.101.20"
FTP_USER="u377790247"
FTP_PASS="${FTP_PASSWORD}"
FTP_PATH="domains/grizip.com/public_html"
FTP_PORT="21"

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
echo_status() {
    echo -e "${GREEN}➤ $1${NC}"
}

echo_error() {
    echo -e "${RED}✖ $1${NC}"
}

# Vérifier si le mot de passe est défini
if [ -z "$FTP_PASSWORD" ]; then
    echo_error "FTP_PASSWORD non défini dans .env"
    exit 1
fi

# Construction du projet
echo_status "Construction du projet..."
npm run build

if [ $? -ne 0 ]; then
    echo_error "Erreur lors de la construction du projet"
    exit 1
fi

# Remplacer la section qui génère et exécute le script FTP par celle-ci:
echo_status "Préparation du déploiement FTP..."
SCRIPT_FTP="$(mktemp)"

cat << EOF > "$SCRIPT_FTP"
# Désactiver la vérification SSL
set ssl:verify-certificate no
# Se connecter au serveur
open -u $FTP_USER,$FTP_PASS ftp://$FTP_HOST:$FTP_PORT
# Aller au répertoire cible
cd $FTP_PATH

# Supprimer les fichiers existants
glob rm *.html *.txt *.xml *.svg

# Supprimer les dossiers existants s'ils existent
rm -rf assets
rm -rf Illustrations

# Upload des fichiers racine (vérifier leur existence)
lcd dist
mput *.html
mput *.txt
mput *.xml
mput *.svg

# Création et upload des assets
mkdir -p assets
cd assets
lcd assets
mput *
cd ..
lcd ..

# Quitter
bye
EOF

# Exécution du déploiement
echo_status "Déploiement en cours..."
lftp -f "$SCRIPT_FTP" 2>&1 | tee ftp_log.txt

# Vérifier si des erreurs se sont produites
if grep -q "Error" ftp_log.txt || grep -q "Fatal" ftp_log.txt; then
    echo_error "Des erreurs se sont produites lors du déploiement."
    cat ftp_log.txt
    rm "$SCRIPT_FTP" ftp_log.txt
    exit 1
fi

# Nettoyage
rm "$SCRIPT_FTP" ftp_log.txt
echo_status "Déploiement terminé avec succès!" 
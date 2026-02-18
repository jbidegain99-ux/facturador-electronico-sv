#!/bin/bash
set -e

# ============================================================================
# Azure Deployment Script for Facturador Electronico SV
# ============================================================================
# Usage:
#   ./scripts/deploy-azure.sh [api|web|all]
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Docker installed and running
#   - Environment variables set (see below)
#
# Required Environment Variables:
#   ACR_NAME          - Azure Container Registry name (without .azurecr.io)
#   RESOURCE_GROUP    - Azure Resource Group
#   API_APP_NAME      - Azure App Service name for API
#   WEB_APP_NAME      - Azure App Service name for Web
#   NEXT_PUBLIC_API_URL - API URL for frontend (optional, has default)
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values (adjust these for your setup)
ACR_NAME="${ACR_NAME:-republicodeacr}"
RESOURCE_GROUP="${RESOURCE_GROUP:-facturador-sv-rg}"
API_APP_NAME="${API_APP_NAME:-facturador-api-sv}"
WEB_APP_NAME="${WEB_APP_NAME:-facturador-web-sv}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://facturador-api-sv.azurewebsites.net}"

# Image names
API_IMAGE="${ACR_NAME}.azurecr.io/facturador-api:latest"
WEB_IMAGE="${ACR_NAME}.azurecr.io/facturador-web:latest"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi

    # Check if logged into Azure
    if ! az account show &> /dev/null; then
        log_warning "Not logged into Azure. Running 'az login'..."
        az login
    fi

    log_success "All prerequisites met"
}

# Login to ACR
login_acr() {
    log_info "Logging into Azure Container Registry: ${ACR_NAME}..."
    az acr login --name "${ACR_NAME}"
    log_success "Logged into ACR"
}

# Build API Docker image
build_api() {
    log_info "Building API Docker image..."
    cd "$ROOT_DIR"

    docker build \
        -f apps/api/Dockerfile \
        -t "${API_IMAGE}" \
        .

    log_success "API image built: ${API_IMAGE}"
}

# Build Web Docker image
build_web() {
    log_info "Building Web Docker image..."
    cd "$ROOT_DIR"

    docker build \
        -f apps/web/Dockerfile \
        --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
        -t "${WEB_IMAGE}" \
        .

    log_success "Web image built: ${WEB_IMAGE}"
}

# Push images to ACR
push_api() {
    log_info "Pushing API image to ACR..."
    docker push "${API_IMAGE}"
    log_success "API image pushed"
}

push_web() {
    log_info "Pushing Web image to ACR..."
    docker push "${WEB_IMAGE}"
    log_success "Web image pushed"
}

# Deploy to Azure App Service
deploy_api() {
    log_info "Deploying API to Azure App Service: ${API_APP_NAME}..."

    az webapp config container set \
        --name "${API_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --container-image-name "${API_IMAGE}"

    log_info "Restarting API App Service..."
    az webapp restart \
        --name "${API_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}"

    log_success "API deployed successfully"
    log_info "API URL: https://${API_APP_NAME}.azurewebsites.net"
}

deploy_web() {
    log_info "Deploying Web to Azure App Service: ${WEB_APP_NAME}..."

    az webapp config container set \
        --name "${WEB_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --container-image-name "${WEB_IMAGE}"

    log_info "Restarting Web App Service..."
    az webapp restart \
        --name "${WEB_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}"

    log_success "Web deployed successfully"
    log_info "Web URL: https://${WEB_APP_NAME}.azurewebsites.net"
}

# Show logs
show_logs() {
    local app_name="$1"
    log_info "Streaming logs for ${app_name}..."
    az webapp log tail \
        --name "${app_name}" \
        --resource-group "${RESOURCE_GROUP}"
}

# Main deployment functions
deploy_api_full() {
    check_prerequisites
    login_acr
    build_api
    push_api
    deploy_api
}

deploy_web_full() {
    check_prerequisites
    login_acr
    build_web
    push_web
    deploy_web
}

deploy_all() {
    check_prerequisites
    login_acr

    log_info "Building all images..."
    build_api
    build_web

    log_info "Pushing all images..."
    push_api
    push_web

    log_info "Deploying all services..."
    deploy_api
    deploy_web

    echo ""
    log_success "============================================"
    log_success "  Deployment Complete!"
    log_success "============================================"
    log_info "API URL: https://${API_APP_NAME}.azurewebsites.net"
    log_info "Web URL: https://${WEB_APP_NAME}.azurewebsites.net"
    log_info ""
    log_info "To view logs, run:"
    log_info "  ./scripts/deploy-azure.sh logs api"
    log_info "  ./scripts/deploy-azure.sh logs web"
}

# Print usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  all           Build and deploy both API and Web (default)"
    echo "  api           Build and deploy API only"
    echo "  web           Build and deploy Web only"
    echo "  build-api     Build API image only (no deploy)"
    echo "  build-web     Build Web image only (no deploy)"
    echo "  push-api      Push API image to ACR"
    echo "  push-web      Push Web image to ACR"
    echo "  logs api|web  Stream logs from App Service"
    echo "  help          Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  ACR_NAME            Azure Container Registry name (default: republicodeacr)"
    echo "  RESOURCE_GROUP      Azure Resource Group (default: republicode-rg)"
    echo "  API_APP_NAME        API App Service name (default: facturador-api-sv)"
    echo "  WEB_APP_NAME        Web App Service name (default: facturador-web-sv)"
    echo "  NEXT_PUBLIC_API_URL API URL for frontend"
}

# Parse command line arguments
case "${1:-all}" in
    all)
        deploy_all
        ;;
    api)
        deploy_api_full
        ;;
    web)
        deploy_web_full
        ;;
    build-api)
        build_api
        ;;
    build-web)
        check_prerequisites
        build_web
        ;;
    push-api)
        check_prerequisites
        login_acr
        push_api
        ;;
    push-web)
        check_prerequisites
        login_acr
        push_web
        ;;
    logs)
        if [ -z "$2" ]; then
            log_error "Please specify 'api' or 'web'"
            exit 1
        fi
        case "$2" in
            api)
                show_logs "${API_APP_NAME}"
                ;;
            web)
                show_logs "${WEB_APP_NAME}"
                ;;
            *)
                log_error "Unknown service: $2. Use 'api' or 'web'"
                exit 1
                ;;
        esac
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac

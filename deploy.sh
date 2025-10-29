#!/bin/bash
set -e

# =============================================================================
# CarParking MCP - Cloud Run Deployment Script (Integrated)
# =============================================================================

# Color Definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (modify these values)
PROJECT_ID="azoom-yongrok-choi"
REGION="asia-northeast1"
SERVICE_NAME="carparking-mcp"
SERVICE_ACCOUNT="synapse-prototype@azoom-yongrok-choi.iam.gserviceaccount.com"

# =============================================================================
# Function Definitions
# =============================================================================

print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# =============================================================================
# Pre-flight Check
# =============================================================================

print_header "Pre-flight Check"

# Check gcloud CLI installation
if ! command -v gcloud &> /dev/null; then
  print_error "gcloud CLI is not installed."
  echo "Install: https://cloud.google.com/sdk/docs/install"
  exit 1
fi
print_success "gcloud CLI verified"

# Verify Project ID
if [[ "$PROJECT_ID" == "your-gcp-project-id" ]]; then
  print_error "Please set PROJECT_ID!"
  echo "Method 1: export GCP_PROJECT_ID=your-project-id"
  echo "Method 2: Modify PROJECT_ID variable in this script"
  exit 1
fi

print_info "Project ID: $PROJECT_ID"
print_info "Region: $REGION"
print_info "Service Name: $SERVICE_NAME"

# Set current project
gcloud config set project "$PROJECT_ID" --quiet

# =============================================================================
# Pre-build Check
# =============================================================================

print_header "Step 1: Source Code Verification"

# Check src directory (React components)
if [ ! -d "src/carparking-carousel" ] || [ ! -d "src/carparking-search-input" ]; then
  print_error "React component source not found!"
  print_info "Required directories: src/carparking-carousel, src/carparking-search-input"
  exit 1
fi

print_success "React component source verified"

# Check carparking server source
if [ ! -f "carparking/src/server.ts" ]; then
  print_error "MCP server source not found!"
  exit 1
fi

print_success "MCP server source verified"
print_info "Assets will be generated automatically during Docker build"

# =============================================================================
# Container Build
# =============================================================================

print_header "Step 2: Container Image Build"

# Use Artifact Registry (instead of gcr.io)
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/gpt-carparking/${SERVICE_NAME}"
print_info "Image URL: $IMAGE_URL"

print_info "Starting Cloud Build..."
gcloud builds submit \
  --tag "$IMAGE_URL" \
  --timeout=10m \
  --project "$PROJECT_ID"

print_success "Container image build completed"

# =============================================================================
# Cloud Run Deployment
# =============================================================================

print_header "Step 3: Cloud Run Deployment"

print_info "Deploying... (max 5 minutes)"

gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URL" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,BIGQUERY_PROJECT=${PROJECT_ID}" \
  --port 8080 \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60s \
  --concurrency 80 \
  --service-account "$SERVICE_ACCOUNT" \
  --project "$PROJECT_ID" \
  --quiet

print_success "Cloud Run deployment completed!"

# =============================================================================
# Deployment Information
# =============================================================================

print_header "Deployment Complete!"

# Get actual service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --format='value(status.url)' \
  --project "$PROJECT_ID")

# Update STATIC_ASSETS_URL environment variable (so widgets can reference their own assets)
print_info "Updating STATIC_ASSETS_URL environment variable..."
gcloud run services update "$SERVICE_NAME" \
  --region "$REGION" \
  --set-env-vars "NODE_ENV=production,BIGQUERY_PROJECT=${PROJECT_ID},STATIC_ASSETS_URL=${SERVICE_URL}" \
  --project "$PROJECT_ID" \
  --quiet

print_success "Environment variable updated"

echo ""
print_success "Service URL: $SERVICE_URL"
print_info "MCP Endpoint: ${SERVICE_URL}/mcp"
print_info "Health Check: ${SERVICE_URL}/health"
print_info "Assets Example: ${SERVICE_URL}/assets/carparking-carousel-2d2b.js"
echo ""

print_info "📋 How to add to ChatGPT:"
echo "  1. ChatGPT Settings > Connectors > Add Connector"
echo "  2. Name: CarParking Search"
echo "  3. Type: MCP"
echo "  4. URL: ${SERVICE_URL}/mcp"
echo ""

# =============================================================================
# Health Check
# =============================================================================

print_header "Health Check Test"

sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/health")

if [ "$HTTP_CODE" -eq 200 ]; then
  print_success "Health Check succeeded! (HTTP $HTTP_CODE)"
else
  print_error "Health Check failed! (HTTP $HTTP_CODE)"
  print_warning "Check logs: gcloud run logs read $SERVICE_NAME --region $REGION"
fi

# =============================================================================
# Next Steps
# =============================================================================

print_header "Next Steps"
echo ""
echo "1️⃣  Test service:"
echo "   curl ${SERVICE_URL}/health"
echo ""
echo "2️⃣  Check logs:"
echo "   gcloud run logs tail $SERVICE_NAME --region $REGION"
echo ""
echo "3️⃣  Redeploy:"
echo "   ./deploy.sh"
echo ""
echo "4️⃣  Delete:"
echo "   gcloud run services delete $SERVICE_NAME --region $REGION"
echo ""

print_success "Deployment script completed! 🎉"


#!/bin/bash

# 🚀 Lemonfox.ai + Prisma + Netlify Setup Script
# This script helps you set up the complete integration

echo "🚀 Setting up Lemonfox.ai + Prisma + Netlify Integration..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if Node.js is installed
check_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    if command -v npm &> /dev/null; then
        print_success "npm is installed"
    else
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    npm install --legacy-peer-deps
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Generate Prisma client
generate_prisma_client() {
    print_info "Generating Prisma client..."
    npx prisma generate
    if [ $? -eq 0 ]; then
        print_success "Prisma client generated successfully"
    else
        print_error "Failed to generate Prisma client"
        exit 1
    fi
}

# Check if .env file exists
check_env_file() {
    if [ -f ".env" ]; then
        print_success ".env file exists"

        # Check if DATABASE_URL is set
        if grep -q "DATABASE_URL=" .env; then
            DB_URL=$(grep "DATABASE_URL=" .env | cut -d '=' -f2)
            if [[ $DB_URL == "postgresql://username:password@host:5432/database?sslmode=require" ]]; then
                print_warning "DATABASE_URL is still the default. Please update it with your Neon database URL."
            else
                print_success "DATABASE_URL is configured"
            fi
        else
            print_warning "DATABASE_URL not found in .env file"
        fi

        # Check if LEMONFOX_API_KEY is set
        if grep -q "LEMONFOX_API_KEY=" .env; then
            print_success "LEMONFOX_API_KEY is configured"
        else
            print_warning "LEMONFOX_API_KEY not found in .env file"
        fi
    else
        print_warning ".env file not found. Please create it using .env.example"
    fi
}

# Run database migration
run_migration() {
    read -p "Do you want to run the database migration? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Running database migration..."
        npx prisma migrate dev --name init
        if [ $? -eq 0 ]; then
            print_success "Database migration completed successfully"
        else
            print_error "Database migration failed"
            exit 1
        fi
    else
        print_info "Skipping database migration"
    fi
}

# Build the project
build_project() {
    print_info "Building the project..."
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Project built successfully"
    else
        print_error "Project build failed"
        exit 1
    fi
}

# Check if Netlify CLI is installed
check_netlify_cli() {
    if command -v netlify &> /dev/null; then
        print_success "Netlify CLI is installed"
        return 0
    else
        print_warning "Netlify CLI is not installed"
        print_info "To install Netlify CLI, run: npm install -g netlify-cli"
        return 1
    fi
}

# Test local development
test_local() {
    read -p "Do you want to test local development? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Starting local development server..."
        print_info "In another terminal, run: netlify functions:serve"
        print_info "Then visit: http://localhost:3000"
        npm start
    else
        print_info "Skipping local development test"
    fi
}

# Main setup function
main() {
    echo "🔍 Checking prerequisites..."
    check_nodejs
    check_npm

    echo ""
    echo "📦 Installing dependencies..."
    install_dependencies

    echo ""
    echo "🔧 Setting up Prisma..."
    generate_prisma_client

    echo ""
    echo "📝 Checking environment configuration..."
    check_env_file

    echo ""
    echo "🗃️ Database setup..."
    run_migration

    echo ""
    echo "🏗️ Building project..."
    build_project

    echo ""
    echo "🌐 Netlify setup..."
    check_netlify_cli

    echo ""
    print_success "Setup completed successfully! 🎉"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update your .env file with your Neon database URL"
    echo "2. Configure your email provider API keys"
    echo "3. Test local development with: npm start"
    echo "4. Deploy to Netlify when ready"
    echo ""
    echo "📚 For detailed instructions, see: DEPLOYMENT_GUIDE.md"

    echo ""
    test_local
}

# Run the main function
main
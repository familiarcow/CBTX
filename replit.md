# replit.md

## Overview

This is a full-stack decentralized exchange (DEX) application called "fromBase" that enables swapping between cbBTC and other assets on the Base network. The application is built with a React frontend and Express.js backend, integrating with THORChain for cross-chain swaps and using Coinbase Wallet for Web3 connectivity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Context for Web3, TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Animation**: Framer Motion for UI animations

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Development Mode**: Vite middleware integration for hot reloading
- **Production Mode**: Static file serving with API routes
- **Environment Handling**: Separate development and production server configurations

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Connection**: Connection pooling with @neondatabase/serverless
- **Schema**: Simple user management with username/password authentication

## Key Components

### Web3 Integration
- **Wallet Provider**: Coinbase Wallet SDK for wallet connectivity
- **Network**: Base chain (Chain ID: 8453) as primary network
- **Web3 Library**: Web3.js for blockchain interactions
- **Smart Contracts**: ERC20 token approvals and THORChain router deposits

### THORChain Integration
- **Purpose**: Cross-chain swap functionality
- **API**: THORNode API for quotes and swap execution
- **Supported Assets**: ETH, USDC, cbBTC on Base chain
- **Transaction Tracking**: Real-time swap status monitoring

### Basename Support
- **Purpose**: ENS-style domain resolution for Base network
- **Integration**: Custom basename resolution and avatar display
- **Contract**: L2 resolver for basename lookup

### Asset Management
- **Supported Assets**: 
  - ETH (native Base token)
  - USDC (0x833589fcd6edb6e08f4c7c32d4f71b54bda02913)
  - cbBTC (0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf)
- **Balance Tracking**: Real-time balance updates via BaseScan API
- **Price Data**: USD pricing from THORChain pools

## Data Flow

### Swap Process
1. User selects source asset and amount
2. Frontend requests quote from THORChain API
3. Quote displays expected output and fees
4. User confirms transaction
5. For ERC20 tokens: Approval transaction first
6. Deposit transaction to THORChain router
7. Real-time tracking of swap stages
8. Balance refresh after completion

### Balance Updates
1. Initial load: Fetch balances for all supported assets
2. Sequential loading with rate limiting (600ms intervals)
3. Event-driven refresh after transactions
4. USD value calculation using THORChain price data

## External Dependencies

### APIs
- **THORNode API**: Swap quotes and pool data (thornode.ninerealms.com)
- **BaseScan API**: Balance and transaction data for Base network
- **Neon Database**: PostgreSQL database hosting

### Third-Party Services
- **Coinbase Wallet**: Web3 wallet connectivity
- **Vercel**: Deployment platform (configured in vercel.json)
- **Base Network**: Ethereum L2 for all transactions

### UI Libraries
- **Radix UI**: Headless component primitives
- **Lucide React**: Icon library
- **React Hook Form**: Form state management
- **Zod**: Schema validation

## Deployment Strategy

### Development
- **Server**: Express with Vite middleware for HMR
- **Port**: 5001 for main server, 24678 for HMR
- **Environment**: Environment variables for API keys and database

### Production
- **Build Process**: Vite build for frontend, TypeScript compilation for backend
- **Static Serving**: Express serves built assets from dist/public
- **Vercel Configuration**: Serverless functions with filesystem routing
- **Environment Variables**: DATABASE_URL, BASESCAN_API_KEY required

### Database
- **Migrations**: Drizzle Kit for schema management
- **Schema Location**: ./db/schema.ts
- **Migration Output**: ./migrations directory
- **Connection**: Environment-based connection string

The application follows a modern full-stack architecture with clear separation between frontend, backend, and database layers, emphasizing Web3 integration and cross-chain functionality through THORChain.
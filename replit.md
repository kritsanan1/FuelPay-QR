# Fuel Station QR Payment System

## Overview

This is a comprehensive fuel dispensing system with QR code payment integration built with React, TypeScript, Express.js, and PostgreSQL. The application allows customers to select fuel types, specify amounts, pay via QR codes, and manage the entire fuel dispensing process with real-time updates.

**Status**: ✅ COMPLETED - Full working system deployed and tested

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

✓ **January 11, 2025**: Complete fuel dispensing system deployed
- Implemented full-stack architecture with React frontend and Express backend
- Integrated PostgreSQL database with Drizzle ORM
- Added real-time WebSocket communication for payment status updates
- Built PromptPay QR code payment integration
- Created comprehensive fuel selection interface with touch-friendly design
- Implemented fuel dispensing simulation with progress tracking
- Added transaction history and receipt generation
- Fixed all accessibility warnings and error handling

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and database layers:

### Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **Styling**: TailwindCSS with shadcn/ui components for consistent design
- **Animations**: Framer Motion for smooth UI interactions
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for consistent typing across the stack
- **API Design**: RESTful endpoints with real-time WebSocket support
- **Real-time Communication**: WebSocket server for live payment status updates

### Database Architecture
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Well-defined relationships between users, fuel types, pumps, and transactions

## Key Components

### 1. Fuel Selection System
- Interactive fuel type selection with pricing
- Dual input modes: amount-based or volume-based calculations
- Pump selection with status indicators
- Real-time price calculations

### 2. Payment Processing
- Dynamic QR code generation for PromptPay integration
- Real-time payment status monitoring
- WebSocket-based status updates
- Payment timeout handling with retry mechanisms

### 3. Dispensing Control
- Pump status management (active/inactive, online/offline)
- Transaction status tracking through multiple states
- Volume tracking during dispensing
- Automatic completion detection

### 4. User Interface
- Responsive design for various screen sizes
- Real-time status indicators
- Transaction history viewing
- Receipt generation and printing support
- Error handling with user-friendly messages

## Data Flow

1. **Initialization**: System loads fuel types, pumps, and checks connectivity
2. **Selection**: User selects pump, fuel type, and amount/volume
3. **Transaction Creation**: Backend generates transaction with unique ID and QR code
4. **Payment Processing**: QR code displayed, WebSocket monitors payment status
5. **Dispensing Authorization**: Upon successful payment, pump is authorized
6. **Volume Monitoring**: Real-time tracking of dispensed volume
7. **Completion**: Transaction finalized with receipt generation

## External Dependencies

### Payment Gateway Integration
- **PromptPay QR Code Generation**: Dynamic QR codes for Thai payment system
- **Payment Status API**: Real-time payment verification
- **Bank Integration**: Support for major Thai banks

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL hosting
- **Connection Pooling**: Efficient database connection management

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library for consistent iconography
- **Date-fns**: Date manipulation utilities

## Deployment Strategy

### Development Environment
- **Vite**: Fast development server with HMR
- **TypeScript**: Compile-time type checking
- **ESBuild**: Fast bundling for production builds

### Production Considerations
- **Environment Variables**: Secure configuration management
- **Database Migrations**: Drizzle Kit for schema management
- **Static Asset Serving**: Optimized frontend asset delivery
- **WebSocket Scaling**: Ready for horizontal scaling

### Build Process
1. **Frontend Build**: Vite compiles React app to static assets
2. **Backend Build**: ESBuild bundles Node.js server
3. **Database Setup**: Automated schema deployment
4. **Asset Optimization**: Compressed and optimized delivery

The system is designed for reliability in high-transaction environments with proper error handling, real-time monitoring, and seamless user experience from fuel selection through payment completion.
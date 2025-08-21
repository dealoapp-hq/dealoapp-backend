# 🚀 Dealo Backend - Africa's Trusted Social Economy for Learning & Earning

[![NestJS](https://img.shields.io/badge/NestJS-10.3.3-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-6.0+-red.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Dealo** connects personalized AI learning and instructor-led courses with a job marketplace, social profiles, and financial tools. Starting with free YouTube + AI-powered LMS, users gain skills, earn certifications, and access gigs. Our added social layer lets users build their profile, showcase achievements, gain endorsements, and grow their reputation—paving the way to a full professional social economy.

## 🌟 What Makes Dealo Special?

Dealo is designed as a comprehensive platform that combines the best features of:
- **Udemy** (Learning & Courses)
- **LinkedIn** (Professional Networking & Profiles)
- **Fiverr** (Freelance Marketplace)
- **AI-Powered Personalization** (Unique to Dealo)

### 🎯 Target Market
- **Youth unemployment in Nigeria >30%** - No trusted skill-to-income pathway
- **Freelancers lack credibility and proof** - Need verified skills and endorsements
- **Local Instructors lack tools** - To monetize bespoke courses
- **Edtech platforms are isolated** - No social learning integration

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Mobile App    │    │   Admin Panel   │
│   (React/Next)  │    │   (React Native)│    │   (Dashboard)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Dealo API     │
                    │   (NestJS)      │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MySQL DB      │    │   Redis Cache   │    │   AI Services   │
│   (Primary)     │    │   (Sessions)    │    │   (Gemini/OpenAI)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Features

### 🎓 **Learning & Education**
- **AI-Powered Course Generation** - Convert YouTube videos to structured courses
- **Personalized Learning Paths** - AI-driven recommendations based on skills and goals
- **Interactive Quizzes** - Auto-generated assessments with AI
- **Certification System** - Verified skills and achievements
- **Instructor-Led Courses** - Support for traditional course creation
- **Micro-learning Modules** - Bite-sized content for mobile users

### 💼 **Job Marketplace**
- **Freelance Job Board** - Post and bid on projects
- **AI Job Matching** - Smart recommendations based on skills
- **Proposal System** - Detailed project proposals with portfolios
- **Bidding & Escrow** - Secure payment protection
- **Project Management** - Milestone tracking and delivery
- **Review System** - Client and freelancer feedback

### 👥 **Social Networking**
- **Professional Profiles** - Skills, certifications, portfolio showcase
- **Endorsement System** - Peer verification of skills
- **Social Feed** - Posts, comments, and engagement
- **Networking** - Connect with professionals and mentors
- **Achievement System** - Gamification and skill validation
- **Community Groups** - Industry-specific communities

### 💰 **Financial Tools**
- **Payment Processing** - Multiple gateway support (Paystack, Flutterwave)
- **Escrow Protection** - Secure payment handling
- **Subscription Plans** - Premium features and tools
- **Revenue Sharing** - Instructor and platform revenue split
- **Withdrawal System** - Freelancer earnings management
- **Financial Analytics** - Earnings tracking and insights

### 🤖 **AI-Powered Features**
- **Smart Course Recommendations** - Personalized learning paths
- **Job Matching Algorithm** - AI-powered project recommendations
- **Content Generation** - Auto-generate course content and quizzes
- **Skill Assessment** - AI evaluation of user capabilities
- **Market Analysis** - Trending skills and job opportunities
- **Chatbot Support** - AI-powered customer service

### 📱 **Real-time Features**
- **Live Chat** - Real-time messaging between users
- **Push Notifications** - Instant updates and alerts
- **Live Streaming** - Video calls and screen sharing
- **Real-time Analytics** - Live dashboard updates
- **Activity Feeds** - Real-time social interactions

## 🛠️ Tech Stack

### **Backend Framework**
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **TypeORM** - Object-Relational Mapping
- **MySQL** - Primary database
- **Redis** - Caching and sessions

### **Authentication & Security**
- **JWT** - JSON Web Tokens
- **Passport.js** - Authentication middleware
- **Bcrypt** - Password hashing
- **Helmet** - Security headers
- **Rate Limiting** - API protection

### **Real-time Communication**
- **Socket.io** - WebSocket implementation
- **WebSocket Gateway** - NestJS WebSocket support

### **AI & Machine Learning**
- **Google Gemini AI** - Course generation and content creation
- **OpenAI** - Advanced AI features
- **Custom ML Models** - Job matching and recommendations

### **Payment & Financial**
- **Paystack Integration** - Nigerian payment gateway
- **Flutterwave Integration** - Pan-African payments
- **Escrow System** - Secure payment protection

### **Email & Communication**
- **Nodemailer** - Email sending
- **Handlebars** - Email templates
- **Zoho Mail** - Professional email service

### **Development Tools**
- **Swagger/OpenAPI** - API documentation
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MySQL** (v8.0 or higher)
- **Redis** (v6.0 or higher)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/dealoapp-hq/dealoapp-backend.git
cd dealoapp-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your configuration
nano .env
```

### 4. Database Setup
```bash
# Create database
npm run db:create

# Run migrations
npm run db:migrate

# Generate migration (if needed)
npm run db:generate
```

### 5. Start the Application
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### 6. Access the Application
- **API Server**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=dealo_db

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AI Services
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Payment Gateways
PAYSTACK_SECRET_KEY=your_paystack_secret
PAYSTACK_PUBLIC_KEY=your_paystack_public
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public

# Email (Zoho)
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=hello@dealonetwork.com
SMTP_PASS=your_email_password

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=dealo-uploads

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
RATE_LIMIT_TTL=60000
RATE_LIMIT_LIMIT=100
```

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/auth/profile
POST /api/v1/auth/verify-email
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

### User Management

```http
GET    /api/v1/users/profile
PUT    /api/v1/users/profile
GET    /api/v1/users/search
GET    /api/v1/users/top-freelancers
GET    /api/v1/users/top-instructors
```

### Course Management

```http
GET    /api/v1/courses
POST   /api/v1/courses
GET    /api/v1/courses/:id
PUT    /api/v1/courses/:id
DELETE /api/v1/courses/:id
POST   /api/v1/courses/ai/generate
```

### Job Marketplace

```http
GET    /api/v1/jobs
POST   /api/v1/jobs
GET    /api/v1/jobs/:id
PUT    /api/v1/jobs/:id
DELETE /api/v1/jobs/:id
POST   /api/v1/jobs/:id/proposals
POST   /api/v1/jobs/:id/bids
```

### Payment & Escrow

```http
POST   /api/v1/payments
GET    /api/v1/payments/:id
POST   /api/v1/escrow/create
POST   /api/v1/escrow/release
POST   /api/v1/escrow/dispute
```

### Real-time Features

```http
# WebSocket Connections
ws://localhost:3000/chat
ws://localhost:3000/notifications
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Database Schema

### Core Entities

- **Users** - User profiles, roles, skills
- **Courses** - Learning content and structure
- **Jobs** - Freelance opportunities
- **Proposals** - Job applications
- **Payments** - Financial transactions
- **Chat** - Real-time messaging
- **Notifications** - User alerts
- **Analytics** - User activity tracking

### Relationships

```
Users (1) ←→ (Many) Courses
Users (1) ←→ (Many) Jobs
Users (1) ←→ (Many) Proposals
Jobs (1) ←→ (Many) Proposals
Users (1) ←→ (Many) Payments
Users (Many) ←→ (Many) ChatRooms
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt encryption
- **Rate Limiting** - API abuse prevention
- **Input Validation** - Request sanitization
- **CORS Protection** - Cross-origin security
- **Helmet Security** - HTTP headers protection
- **SQL Injection Prevention** - TypeORM protection

## 🚀 Deployment

### Docker Deployment

```bash
# Build the image
docker build -t dealo-backend .

# Run the container
docker run -p 3000:3000 dealo-backend
```

### Production Deployment

1. **Set up a production server** (AWS, DigitalOcean, etc.)
2. **Configure environment variables**
3. **Set up MySQL and Redis**
4. **Install PM2 for process management**
5. **Configure Nginx as reverse proxy**
6. **Set up SSL certificates**

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start dist/main.js --name dealo-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow **TypeScript** best practices
- Write **unit tests** for new features
- Update **API documentation**
- Follow **conventional commits**
- Ensure **code linting** passes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Ibrahim Openiyi** - CEO & Lead Developer
- **Pius Lucky** - CTO & Backend Engineer
- **Mogbojuri Oluwasegun** - CPO & Product Manager
- **Michael Adeniyi** - QA Engineer & CMO

## 🌍 Business Model

### Revenue Streams

1. **Course Sales** - ₦500–₦5,000/course (70/30 revenue share)
2. **Subscription Plans** - ₦600/month for AI tools + certifications
3. **Commission** - 5% on freelance transactions
4. **Premium Tools** - Advanced features and analytics

### Market Opportunity

- **$60B freelance economy** in Africa by 2030 (McKinsey, 2022)
- **80M+ projected gig workers** (World Bank, 2023)
- **$1.5T global e-learning market** by 2033 (Statista, 2024)

## 📞 Support

- **Email**: hello@dealonetwork.com
- **Website**: https://dealonetwork.com
- **Documentation**: https://docs.dealonetwork.com
- **Community**: https://t.me/dealonetwork

## 🎯 Roadmap

### Phase 1 (Q1 2024)
- [x] Core platform development
- [x] AI-powered learning features
- [x] Job marketplace MVP
- [x] Payment integration

### Phase 2 (Q2 2024)
- [ ] Mobile app development
- [ ] Advanced AI features
- [ ] Social networking expansion
- [ ] Partnership integrations

### Phase 3 (Q3 2024)
- [ ] Pan-African expansion
- [ ] Advanced analytics
- [ ] Enterprise features
- [ ] API marketplace

---

**Dealo** - Empowering Africa's workforce through learning, earning, and networking! 🚀

*Built with ❤️ for Africa's digital economy*

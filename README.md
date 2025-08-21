<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Dealo Backend API

**Africa's trusted social economy for learning and earning**

Dealo connects personalized AI learning and instructor-led courses with a job marketplace, social profiles, and financial tools. Starting with free YouTube + AI-powered LMS, users gain skills, earn certifications, and access gigs.

## 🚀 Features

### Core Functionality

- **AI-Powered Learning**: Generate courses from YouTube videos using Gemini AI
- **Social Profiles**: Build reputation with endorsements and achievements
- **Freelance Marketplace**: Post and bid on jobs with smart matching
- **Certification System**: Earn verifiable certificates for completed courses
- **Payment Processing**: Integrated payment solutions for Africa

### Technical Features

- **RESTful API**: Comprehensive API with Swagger documentation
- **JWT Authentication**: Secure user authentication and authorization
- **Database**: MySQL with TypeORM for data persistence
- **AI Integration**: Google Gemini and OpenAI for intelligent features
- **Rate Limiting**: Built-in protection against abuse
- **Queue Management**: Redis-based job processing
- **Validation**: Comprehensive input validation and sanitization

## 🏗️ Architecture

```
src/
├── auth/           # Authentication & Authorization
├── users/          # User management & profiles
├── courses/        # Course management & learning
├── jobs/           # Freelance marketplace
├── payments/       # Payment processing
├── ai/             # AI-powered services
├── config/         # Configuration files
└── common/         # Shared utilities
```

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: MySQL with TypeORM
- **Authentication**: JWT with Passport
- **AI Services**: Google Gemini, OpenAI
- **Queue**: Redis with Bull
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- Redis (v6.0 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd dealo-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp env.example .env
# Edit .env with your configuration
```

### 4. Set up the database

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE dealo;
```

### 5. Run migrations (if using migrations)

```bash
npm run db:migrate
```

### 6. Start the development server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`
API Documentation: `http://localhost:3000/api/docs`

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/profile` - Get current user profile
- `POST /api/v1/auth/refresh` - Refresh access token

### User Management

- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/search` - Search users
- `GET /api/v1/users/top-freelancers` - Get top freelancers
- `GET /api/v1/users/top-instructors` - Get top instructors

### Course Management

- `GET /api/v1/courses` - Get all courses
- `POST /api/v1/courses` - Create a new course
- `GET /api/v1/courses/:id` - Get course by ID
- `PUT /api/v1/courses/:id` - Update course
- `POST /api/v1/courses/:id/publish` - Publish course
- `POST /api/v1/courses/generate-from-youtube` - Generate course from YouTube

### Job Marketplace

- `GET /api/v1/jobs` - Get all jobs
- `POST /api/v1/jobs` - Create a new job
- `GET /api/v1/jobs/:id` - Get job by ID
- `PUT /api/v1/jobs/:id` - Update job
- `POST /api/v1/jobs/:id/assign/:freelancerId` - Assign freelancer
- `POST /api/v1/jobs/:id/complete` - Complete job

### AI Services

- `POST /api/v1/ai/generate-course` - Generate course from YouTube
- `POST /api/v1/ai/generate-quiz` - Generate quiz from content
- `POST /api/v1/ai/learning-path` - Generate personalized learning path
- `POST /api/v1/ai/job-match` - Analyze job match
- `GET /api/v1/ai/recommendations` - Get personalized recommendations

## 🔧 Configuration

### Environment Variables

| Variable         | Description             | Default       |
| ---------------- | ----------------------- | ------------- |
| `NODE_ENV`       | Application environment | `development` |
| `PORT`           | Server port             | `3000`        |
| `DB_HOST`        | Database host           | `localhost`   |
| `DB_PORT`        | Database port           | `3306`        |
| `DB_USERNAME`    | Database username       | `root`        |
| `DB_PASSWORD`    | Database password       | -             |
| `DB_NAME`        | Database name           | `dealo`       |
| `JWT_SECRET`     | JWT secret key          | -             |
| `JWT_EXPIRES_IN` | JWT expiration time     | `7d`          |
| `REDIS_HOST`     | Redis host              | `localhost`   |
| `REDIS_PORT`     | Redis port              | `6379`        |
| `GEMINI_API_KEY` | Google Gemini API key   | -             |
| `OPENAI_API_KEY` | OpenAI API key          | -             |

## 🧪 Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Deployment

### Production Build

```bash
npm run build
npm run start:prod
```

### Docker (coming soon)

```bash
docker build -t dealo-backend .
docker run -p 3000:3000 dealo-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@dealonetwork.com or join our Slack channel.

## 🏆 Team

- **Ibrahim Openiyi** - CEO & Lead Developer
- **Pius Lucky** - CTO
- **Mogbojuri Oluwasegun** - CPO
- **Michael Adeniyi** - QA Engineer & CMO

---

**Dealo** - Empowering Africa's digital workforce through AI-powered learning and earning opportunities.

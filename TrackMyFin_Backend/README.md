# Finance Tracker Backend

A comprehensive Spring Boot backend application for personal finance tracking with features for managing transactions, budgets, and categories.

## Features

- **User Authentication & Authorization** - JWT-based authentication with Spring Security
- **Transaction Management** - Create, read, update, and delete financial transactions
- **Category Management** - Organize transactions with customizable categories
- **Budget Tracking** - Set and monitor budgets with spending alerts
- **Financial Reports** - Get summaries of income, expenses, and net balance
- **RESTful API** - Complete REST API for frontend integration

## Tech Stack

- **Java 21** - Programming language
- **Spring Boot 3.3.3** - Framework
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Database operations
- **MySQL** - Database
- **JWT** - JSON Web Tokens for authentication
- **Lombok** - Reduce boilerplate code
- **Maven** - Build tool

## Prerequisites

- Java 21 or higher
- Maven 3.6+
- MySQL 8.0+

## Setup Instructions

### 1. Database Setup
Create a MySQL database:
```sql
CREATE DATABASE financeTrackerDB;
```

### 2. Configuration
Update `src/main/resources/application.properties` with your database credentials:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/financeTrackerDB
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### 3. Run the Application
Development profile (H2, recommended for local startup):
```powershell
$env:SPRING_PROFILES_ACTIVE='dev'
$env:SERVER_PORT='8095'
mvn spring-boot:run
```

The application will start on `http://localhost:8095`.

You can also use helper scripts from the backend root:
- `start-backend-dev.ps1`
- `start-backend-dev.bat`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction
- `GET /api/transactions/summary` - Get financial summary
- `POST /api/voice-expense` - Create a transaction from natural language voice text via Gemini

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `GET /api/categories/type/{type}` - Get categories by type (INCOME/EXPENSE)

### Budgets
- `GET /api/budgets` - Get user budgets
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/{id}` - Update budget
- `DELETE /api/budgets/{id}` - Delete budget
- `GET /api/budgets/current` - Get current active budgets

### Health
- `GET /api/health` - Backend health
- `GET /api/health/gemini` - Gemini API/key health

Gemini key setup (PowerShell):
```powershell
$env:GEMINI_API_KEY='your_google_ai_studio_key'
```

Voice expense request example:
```bash
curl -X POST http://localhost:8080/api/voice-expense \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "I spent 200 rupees on lunch"
  }'
```

## Sample API Usage

### Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Create Transaction (with JWT token)
```bash
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 100.00,
    "description": "Grocery shopping",
    "type": "EXPENSE",
    "categoryId": 1
  }'
```

## Database Schema

The application creates the following tables:
- `users` - User information and authentication
- `categories` - Transaction categories
- `transactions` - Financial transactions
- `budgets` - Budget management

## Default Categories

The application automatically creates default categories:

**Income Categories:**
- Salary, Freelance, Investment, Business

**Expense Categories:**
- Food, Transportation, Shopping, Entertainment, Bills, Healthcare

## Security

- JWT tokens expire after 24 hours
- Passwords are encrypted using BCrypt
- API endpoints are protected except for authentication routes
- User can only access their own data

## Development

### Running Tests
```bash
mvn test
```

### Building JAR
```bash
mvn clean package
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

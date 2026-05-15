# Finance Tracker Frontend - Quick Start

## Prerequisites

- Your Spring Boot backend running on **http://localhost:8080**
- Node.js installed for the React frontend

## Start the Application

1. **Start your Spring Boot backend** (in your separate IDE)
   - Make sure it's running on port 8080
   - Verify your CategoryController endpoints are working

2. **Start the React frontend:**
   ```bash
   npm start
   ```
   - Frontend will run on http://localhost:3000

## Test the Connection

1. **Login to your account** (JWT authentication required)
2. **Go to Categories page** from the navigation menu
3. **Click "Test Connection"** to verify backend connectivity
4. **Try adding/editing categories** to test full functionality

## Troubleshooting

- **"Cannot connect to server"**: Ensure your Spring Boot backend is running on port 8080
- **Authentication errors**: Check JWT token validation in your backend
- **CORS issues**: Verify your backend has `@CrossOrigin(origins = "http://localhost:3000")`

## API Integration

The frontend expects these Category API endpoints:
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

Your CategoryController already implements all required endpoints!
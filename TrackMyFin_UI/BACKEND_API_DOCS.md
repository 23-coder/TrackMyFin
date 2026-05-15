# Backend API Documentation

## Your Spring Boot CategoryController API Endpoints

Based on your CategoryController, here are all the available API endpoints:

### 🔐 Authentication
All endpoints require JWT authentication via Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### 📋 Category Endpoints

#### 1. **GET /api/categories**
- **Purpose**: Get all categories
- **Method**: GET
- **Response**: `List<Category>`
- **Example Response**:
```json
[
  {
    "id": 1,
    "name": "Food & Dining",
    "description": "Restaurant meals and food purchases",
    "color": "#ff6b6b",
    "icon": "🍔"
  }
]
```

#### 2. **POST /api/categories**
- **Purpose**: Create a new category
- **Method**: POST
- **Request Body**: `Category` object
- **Response**: `Category` (created)
- **Example Request**:
```json
{
  "name": "Transportation",
  "description": "Travel and transport costs",
  "color": "#4ecdc4",
  "icon": "🚗"
}
```

#### 3. **GET /api/categories/{id}**
- **Purpose**: Get category by ID
- **Method**: GET
- **Path Parameter**: `id` (Long)
- **Response**: `Category` or 404 Not Found

#### 4. **PUT /api/categories/{id}**
- **Purpose**: Update existing category
- **Method**: PUT
- **Path Parameter**: `id` (Long)
- **Request Body**: `Category` object
- **Response**: `Category` (updated) or 404 Not Found

#### 5. **DELETE /api/categories/{id}**
- **Purpose**: Delete category by ID
- **Method**: DELETE
- **Path Parameter**: `id` (Long)
- **Response**: 200 OK or 404 Not Found

#### 6. **GET /api/categories/type/{type}**
- **Purpose**: Get categories by type
- **Method**: GET
- **Path Parameter**: `type` (CategoryType enum)
- **Response**: `List<Category>`

#### 7. **GET /api/categories/default**
- **Purpose**: Get default categories
- **Method**: GET
- **Response**: `List<Category>`

#### 8. **POST /api/categories/initialize-defaults**
- **Purpose**: Initialize default categories
- **Method**: POST
- **Response**: Success message

## 🏗️ Category Entity Structure

Based on your controller, your Category entity should have:

```java
public class Category {
    private Long id;
    private String name;
    private String description;
    private String color;  // Frontend expects this
    private String icon;   // Frontend expects this
    private CategoryType type; // Optional enum
    
    // getters and setters
}
```

## 🔧 Frontend Integration

Your frontend expects these specific fields in the Category JSON:
- `id`: String or Long (frontend uses String)
- `name`: String (required)
- `description`: String (optional)
- `color`: String (hex color like "#ff6b6b")
- `icon`: String (emoji like "🍔")

## 🚀 Starting Your Backend

To start your Spring Boot server:

```bash
# Maven
mvn spring-boot:run

# Gradle
./gradlew bootRun

# JAR file
java -jar target/finance-tracker-0.0.1-SNAPSHOT.jar
```

The server should start on **http://localhost:8080**

## 🔍 Test Your Backend

Once your server is running, test these endpoints:

```bash
# Health check (if you have actuator)
curl http://localhost:8080/actuator/health

# Test categories endpoint (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8080/api/categories
```

## ⚠️ Common Issues

1. **CORS Configuration**: Your `@CrossOrigin(origins = "*")` should work, but you might need:
   ```java
   @CrossOrigin(origins = "http://localhost:3000")
   ```

2. **Authentication**: Make sure your JWT authentication is configured to accept tokens from your frontend.

3. **Database**: Ensure your database is running and connected.

4. **Port Conflicts**: Make sure nothing else is using port 8080.

## 🔄 Frontend-Backend Compatibility

Your CategoryController is compatible with the frontend! The frontend sends:
- POST requests with `{name, description, color, icon}`
- PUT requests with the same structure
- Expects responses with `{id, name, description, color, icon}`

Just make sure your Category entity includes the `color` and `icon` fields that the frontend expects.
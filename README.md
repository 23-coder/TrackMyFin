# TrackMyFin - Personal Finance Tracker 💰

A full-stack personal finance tracking application built with Spring Boot backend and React TypeScript frontend.

![TrackMyFin Logo](TrackMyFin_UI/public/favicon.svg)

## 🌟 Features

- 💰 **Transaction Management** - Add, edit, and categorize your income and expenses
- 📊 **Analytics Dashboard** - Visual insights into your spending patterns
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🌙 **Dark/Light Mode** - Toggle between themes for comfortable viewing
- 📤 **Export Functionality** - Export your data to PDF and Excel formats
- 🔐 **Secure Authentication** - User registration and login system
- 📈 **Real-time Updates** - Live data synchronization

## 🏗️ Project Structure

```
TrackMyFin/
├── TrackMyFin_Backend/     # Spring Boot REST API
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration files
│   └── pom.xml            # Maven dependencies
├── TrackMyFin_UI/          # React TypeScript Frontend
│   ├── src/                # React source code
│   ├── public/             # Static assets
│   └── package.json        # NPM dependencies
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Java 11 or higher
- Node.js 16 or higher
- Maven 3.6 or higher

### 🔧 Backend Setup

```bash
cd TrackMyFin_Backend
mvn clean install
mvn spring-boot:run
```

Backend runs on: `http://localhost:8080`

### 🎨 Frontend Setup

```bash
cd TrackMyFin_UI
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

## 🛠️ Tech Stack

### Backend
- **Framework**: Spring Boot
- **Language**: Java
- **Database**: H2 (Development) / MySQL (Production)
- **Security**: JWT Authentication
- **Build Tool**: Maven

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Charts**: Chart.js / Recharts
- **Build Tool**: Create React App

## 📖 Documentation

- [Backend API Documentation](./TrackMyFin_Backend/README.md)
- [Frontend Documentation](./TrackMyFin_UI/README.md)
- [Quick Start Guide](./TrackMyFin_UI/QUICK_START.md)

## 🎯 Key Components

### Dashboard
- Financial overview with charts and summaries
- Recent transaction history
- Quick action buttons for common tasks

### Transactions
- Comprehensive transaction management
- Category-based organization
- Search and filtering capabilities

### Analytics
- Visual spending analysis
- Category-wise breakdowns
- Trend analysis over time

### Profile Management
- User account settings
- Preference configuration
- Data export options

## 🔧 Development

### Running Development Servers

**Backend (with auto-reload):**
```bash
./start-backend-dev.bat  # Windows Batch
# or
./start-backend-dev.ps1  # PowerShell
```

**Frontend (with hot reload):**
```bash
./start-dev-server.ps1   # PowerShell
```

### Building for Production

**Backend:**
```bash
cd TrackMyFin_Backend
mvn clean package
```

**Frontend:**
```bash
cd TrackMyFin_UI
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🌟 Show your support

Give a ⭐️ if this project helped you!

---

<div align="center">
  <p>Built with ❤️ using Spring Boot and React</p>
</div>

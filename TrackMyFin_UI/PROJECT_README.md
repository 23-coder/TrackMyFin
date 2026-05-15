# Finance Tracker UI

A modern React application built with TypeScript, TailwindCSS, and React Router featuring a clean, professional design with dark/light mode support.

## Features

- ✅ **React + TypeScript** - Type-safe development
- ✅ **TailwindCSS** - Utility-first CSS framework for styling
- ✅ **React Router** - Client-side routing for navigation
- ✅ **Dark/Light Mode** - Theme toggle with context API
- ✅ **Responsive Design** - Mobile-first responsive layout
- ✅ **Professional UI** - Clean and modern interface
- ✅ **Navigation Bar** - Responsive navigation with theme toggle

## Pages

1. **Home** - Landing page with features showcase
2. **About** - Company information and team details
3. **Contact** - Contact form and company information
4. **Login** - User authentication form
5. **Register** - User registration form with validation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd finance-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - **Note: this is a one-way operation!**

## Project Structure

```
src/
├── components/
│   └── NavBar.tsx          # Navigation component
├── contexts/
│   └── ThemeContext.tsx    # Theme management context
├── pages/
│   ├── Home.tsx           # Home page
│   ├── About.tsx          # About page
│   ├── Contact.tsx        # Contact page
│   ├── Login.tsx          # Login page
│   └── Register.tsx       # Registration page
├── styles/
│   └── globals.css        # Global styles and utilities
├── App.tsx                # Main app component with routing
├── index.css              # TailwindCSS imports and base styles
└── index.tsx              # App entry point
```

## Theme System

The application includes a comprehensive theme system with:

- **Context API** for state management
- **localStorage** persistence
- **Automatic dark class** application
- **Smooth transitions** between themes
- **System preference** detection

## Responsive Design

The UI is built with a mobile-first approach and includes:

- **Breakpoint system** using TailwindCSS
- **Responsive navigation** with mobile menu
- **Flexible layouts** that adapt to screen size
- **Touch-friendly** interactive elements

## Design Features

- **Professional color scheme** with primary blue tones
- **Consistent typography** using Inter font family
- **Smooth animations** and transitions
- **Accessible components** with proper contrast ratios
- **Modern glass-morphism** effects and shadows

## Technology Stack

- **React 19.1.1** - UI library
- **TypeScript 4.9.5** - Type safety
- **TailwindCSS 3.4.17** - Styling
- **React Router 7.9.1** - Routing
- **Create React App** - Build tooling

## Browser Support

This project supports all modern browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
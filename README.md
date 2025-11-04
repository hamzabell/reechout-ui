# Reechout - AI Cold Email Personalization (React Version)

This is the React migration of the original Reechout application. The application has been completely rewritten using React, TypeScript, and Tailwind CSS while maintaining all the original functionality.

## 🚀 Features

- **Modern React Architecture**: Built with React 19, TypeScript, and modern hooks
- **Tailwind CSS**: Fully converted from custom CSS to utility-first styling
- **React Router**: Client-side routing with protected routes
- **Authentication**: Mock authentication system with session management
- **Responsive Design**: Mobile-first responsive layout
- **Dashboard**: Multiple dashboard sections (Overview, Campaigns, Leads, Templates, Analytics, Settings)
- **Netlify Functions**: Backendless API functions for data operations
- **🤖 AI-Powered Features**: 
  - **Lemonfox AI Integration**: Company research and lead intelligence
  - **AI Email Personalization**: Dynamic content generation using OpenAI
  - **Smart Template Generation**: AI-powered email template creation
  - **Email Analysis**: AI-powered email effectiveness scoring
  - **Lead Research**: Automated company and contact research
- **📊 Advanced Lead Management**:
  - CSV import/export functionality
  - Bulk operations (status updates, deletion)
  - Advanced search and filtering
  - Lead scoring and insights
- **📧 Email Campaign Management**:
  - Template creation and management
  - Campaign scheduling and tracking
  - Performance analytics
  - A/B testing capabilities

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, React Router DOM
- **Styling**: Tailwind CSS with custom configuration
- **Icons**: Font Awesome
- **Deployment**: Netlify (static hosting + functions)
- **Build Tool**: Create React App

## 📁 Project Structure

```
reechout-react/
├── public/
│   └── index.html
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── Toast.tsx
│   ├── pages/              # Page components
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── OverviewPage.tsx
│   │   ├── CampaignsPage.tsx
│   │   ├── LeadsPage.tsx
│   │   ├── TemplatesPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   ├── services/           # API and business logic
│   │   └── authService.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main App component with routing
│   ├── index.tsx           # Application entry point
│   └── index.css           # Global styles and Tailwind imports
├── netlify/
│   └── functions/          # Netlify functions
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── package.json
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd reechout-react
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

This creates a `build` folder with the production-ready application.

## 🏗️ Architecture

### Routing

The application uses React Router with the following route structure:

- `/` - Landing page (public)
- `/login` - Login/Signup page (public)
- `/dashboard` - Protected dashboard layout
  - `/dashboard/overview` - Dashboard overview (default)
  - `/dashboard/campaigns` - Campaign management
  - `/dashboard/leads` - Lead management
  - `/dashboard/templates` - Email templates
  - `/dashboard/analytics` - Performance analytics
  - `/dashboard/settings` - Application settings

### Authentication

The app includes a mock authentication system that:
- Stores user sessions in localStorage
- Includes session timeout (24 hours)
- Provides login/signup functionality
- Protects dashboard routes
- Automatically redirects authenticated users

### State Management

State is managed using:
- React hooks (useState, useEffect, useCallback)
- Custom hooks for complex logic (useAuth, useToast)
- Context API is available for future expansion

### Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Theme**: Extended with brand colors and animations
- **Responsive Design**: Mobile-first approach with breakpoints
- **Glassmorphism**: Modern glass effects for UI elements

## 🔧 Configuration

### Tailwind CSS

The `tailwind.config.js` file includes:
- Custom color palette matching the original design
- Extended font families (Inter)
- Custom animations and transitions
- Brand-specific gradients and shadows

### Netlify Configuration

The `netlify.toml` file configures:
- Build settings and Node.js version
- React Router redirects for SPA functionality
- Security headers
- Static asset caching
- Functions directory

## 📝 Migration Notes

### What was migrated:
- ✅ All HTML pages converted to React components
- ✅ Custom CSS converted to Tailwind CSS
- ✅ JavaScript functionality converted to TypeScript/React
- ✅ Authentication system rewritten with React hooks
- ✅ Routing implemented with React Router
- ✅ Responsive layout maintained and improved
- ✅ Netlify functions copied and integrated

### Improvements made:
- 🚀 Modern React patterns with hooks
- 🎨 Cleaner styling with Tailwind CSS
- 🔒 TypeScript for better type safety
- 📱 Enhanced mobile responsiveness
- 🎯 Component-based architecture
- 🔧 Better state management
- 🚦 Improved routing and navigation

## 🚀 Deployment

The application is configured for deployment on Netlify:

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Deploy! 🎉

The `netlify.toml` file handles all the necessary configuration automatically.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

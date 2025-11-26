# 🦷 Dental Clinic Management System - Frontend

A modern, responsive frontend application for the Dental Clinic Management System built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui. This application provides role-based dashboards for Super Admins, Clinic Admins, Dentists, and Receptionists.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Role-Based Access](#-role-based-access)
- [Components](#-components)
- [API Integration](#-api-integration)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Styling](#-styling)
- [Development](#-development)
- [Building for Production](#-building-for-production)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Features

- **🔐 Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control
  - Protected routes
  - Automatic token refresh
  - Secure session management

- **👥 Patient Management**
  - Complete patient profiles
  - Patient search and filtering
  - Medical history tracking
  - Treatment plans
  - Visit records

- **📅 Appointment Scheduling**
  - Calendar-based booking
  - Appointment management
  - Reminders and notifications
  - Queue management

- **🦷 Dental Charting**
  - Interactive 3D dental chart
  - Tooth condition tracking
  - Treatment history
  - Image gallery
  - AI-powered diagnosis assistance

- **💰 Financial Management**
  - Invoice generation
  - Payment tracking
  - Financial reports
  - Petty cash management

- **📦 Inventory Management**
  - Stock tracking
  - Requisition management
  - Low stock alerts

- **💬 Communication**
  - SMS notifications
  - SMS template management
  - In-app messaging

- **🤖 AI-Powered Features**
  - AI-assisted diagnosis
  - Treatment recommendations
  - Medical record analysis

- **👨‍💼 Super Admin Dashboard**
  - Multi-clinic management
  - Analytics and reporting
  - Billing management
  - System-wide notifications
  - Clinic creation and management

### Role-Based Dashboards

- **Super Admin**: System-wide management and analytics
- **Clinic Admin**: Clinic-level administration
- **Dentist**: Patient care and treatment management
- **Receptionist**: Front desk operations and scheduling

## 🛠 Tech Stack

### Core Technologies

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Date Handling**: date-fns, dayjs
- **PDF Generation**: jsPDF

### Key Dependencies

- **UI Framework**: 
  - `@radix-ui/*` - Headless UI primitives
  - `tailwindcss` - Utility-first CSS
  - `class-variance-authority` - Component variants
  - `clsx` & `tailwind-merge` - Conditional styling

- **Data Visualization**:
  - `recharts` - Chart library

- **Forms & Validation**:
  - React Hook Form (via shadcn/ui)
  - Zod validation

- **State Management**:
  - React Hooks (useState, useEffect, useContext)
  - Local state management

- **API Communication**:
  - `axios` - HTTP client
  - Custom API client wrapper

- **Utilities**:
  - `lodash` - Utility functions
  - `uuid` - Unique ID generation
  - `date-fns` - Date manipulation

## 🏗 Architecture

### Next.js App Router Structure

```
┌─────────────────────────────────────┐
│         User Request                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Next.js Middleware             │
│  • Route protection                 │
│  • Authentication checks            │
│  • Cache control                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      App Router (app/)              │
│  • Route definitions                │
│  • Layout components                │
│  • Page components                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Components Layer               │
│  • UI components (shadcn/ui)        │
│  • Feature components               │
│  • Layout components                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      API Client Layer               │
│  • Axios configuration              │
│  • API service functions            │
│  • Request/response interceptors    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Backend API (Express)          │
│  • RESTful endpoints                │
│  • Authentication                   │
│  • Business logic                   │
└─────────────────────────────────────┘
```

### Key Architectural Patterns

1. **Server Components & Client Components**: Optimal use of Next.js 15 features
2. **Component Composition**: Reusable UI components
3. **API Abstraction**: Centralized API client
4. **Type Safety**: Full TypeScript coverage
5. **Responsive Design**: Mobile-first approach

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm** or **yarn** or **pnpm**: Package manager
- **Git**: Version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Configure backend URL**
   
   Update your `.env.local` file:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   BACKEND_URL=http://localhost:3001
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

The application will start on `http://localhost:3000` (or the port specified in your configuration).

### First Time Setup

1. **Access the application**: Navigate to `http://localhost:3000`
2. **Login**: Use your credentials to access the system
3. **Select Role**: Choose your role (Super Admin, Admin, Dentist, or Receptionist)
4. **Explore**: Navigate through the dashboard and features

## 📁 Project Structure

```
Frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Login page
│   ├── globals.css              # Global styles
│   │
│   ├── admin/                   # Admin role pages
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── queue/
│   │   ├── visits/
│   │   ├── invoices/
│   │   ├── dental-charting/
│   │   ├── inventory/
│   │   ├── finances/
│   │   ├── petty-cash/
│   │   ├── reports/
│   │   └── sms/
│   │
│   ├── dentist/                 # Dentist role pages
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── queue/
│   │   └── visits/
│   │
│   ├── receptionist/            # Receptionist role pages
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── queue/
│   │   ├── invoices/
│   │   ├── petty-cash/
│   │   └── sms/
│   │
│   └── super-admin/             # Super Admin pages
│       ├── dashboard/
│       ├── clinics/
│       ├── billing/
│       ├── notifications/
│       ├── messages/
│       └── settings/
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ...                  # 50+ UI components
│   │
│   ├── layout/                  # Layout components
│   │   ├── main-layout.tsx
│   │   └── sidebar.tsx
│   │
│   ├── dental-charting/         # Dental charting components
│   │   ├── dental-chart.tsx
│   │   ├── DentalChart3D.tsx
│   │   ├── tooth-detail-modal.tsx
│   │   ├── image-gallery.tsx
│   │   └── ai-diagnosis-panel.tsx
│   │
│   ├── super-admin/             # Super admin components
│   │   ├── stats-card.tsx
│   │   ├── status-badge.tsx
│   │   └── clinic-form.tsx
│   │
│   └── theme-provider.tsx       # Theme context
│
├── lib/                         # Utility libraries
│   ├── api-client.ts            # API client wrapper
│   ├── axiosConfig.ts           # Axios configuration
│   ├── utils.ts                 # Utility functions
│   ├── africastalking-sms.ts    # SMS utilities
│   └── api/                     # API service functions
│       └── super-admin.ts
│
├── hooks/                       # Custom React hooks
│   ├── use-toast.ts
│   └── use-mobile.tsx
│
├── types/                       # TypeScript type definitions
│   ├── types.ts
│   ├── super-admin.ts
│   └── global.d.ts
│
├── public/                      # Static assets
│   ├── placeholder-logo.png
│   └── ...
│
├── styles/                      # Additional styles
│   └── globals.css
│
├── middleware.ts                # Next.js middleware
├── next.config.mjs              # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── components.json              # shadcn/ui configuration
└── package.json                 # Dependencies and scripts
```

## 👥 Role-Based Access

### Super Admin

**Access**: `/super-admin/*`

**Features**:
- System-wide analytics dashboard
- Clinic management (create, edit, suspend, delete)
- Billing and subscription management
- System-wide notifications
- Messaging to all clinics
- Settings and configuration

### Clinic Admin

**Access**: `/admin/*`

**Features**:
- Clinic dashboard with statistics
- Patient management
- Appointment scheduling
- Queue management
- Visit records
- Invoice management
- Dental charting
- Inventory management
- Financial reports
- Petty cash management
- SMS management

### Dentist

**Access**: `/dentist/*`

**Features**:
- Personal dashboard
- Patient management
- Appointment calendar
- Queue management
- Visit records and treatment notes
- Dental charting
- AI diagnosis assistance

### Receptionist

**Access**: `/receptionist/*`

**Features**:
- Reception dashboard
- Patient check-in/out
- Appointment booking
- Queue management
- Invoice creation
- Payment processing
- SMS notifications
- Petty cash management

## 🧩 Components

### UI Components (shadcn/ui)

The application uses shadcn/ui, a collection of reusable components built with Radix UI and Tailwind CSS:

- **Forms**: Input, Textarea, Select, Checkbox, Radio, Switch
- **Layout**: Card, Separator, Scroll Area, Tabs, Accordion
- **Feedback**: Toast, Alert, Dialog, Alert Dialog
- **Navigation**: Button, Dropdown Menu, Navigation Menu, Breadcrumb
- **Data Display**: Table, Badge, Avatar, Progress, Chart
- **Overlays**: Dialog, Sheet, Popover, Tooltip, Hover Card

### Custom Components

- **MainLayout**: Main application layout with sidebar
- **Sidebar**: Navigation sidebar with role-based menu
- **DentalChart**: Interactive dental charting component
- **DentalChart3D**: 3D visualization of dental chart
- **ToothDetailModal**: Detailed tooth information modal
- **ImageGallery**: Image gallery for dental records
- **AIDiagnosisPanel**: AI-powered diagnosis assistant
- **StatsCard**: Reusable statistics card
- **StatusBadge**: Status indicator badge
- **ClinicForm**: Clinic creation/edit form

## 🔌 API Integration

### API Client

The application uses a centralized API client (`lib/api-client.ts`) that:
- Handles authentication tokens
- Manages request/response interceptors
- Provides type-safe API calls
- Handles errors consistently

### Axios Configuration

Axios is configured in `lib/axiosConfig.ts` with:
- Base URL configuration
- Request interceptors (adds auth tokens)
- Response interceptors (handles errors, token refresh)
- Error handling

### API Service Functions

API service functions are organized by feature:
- `lib/api/super-admin.ts` - Super admin API calls
- Additional API services can be added as needed

### Example API Call

```typescript
import api from '@/lib/axiosConfig';

// GET request
const patients = await api.get('/api/patients');

// POST request
const newPatient = await api.post('/api/patients', {
  name: 'John Doe',
  phone: '+1234567890',
  // ... other fields
});

// PUT request
await api.put(`/api/patients/${id}`, updatedData);

// DELETE request
await api.delete(`/api/patients/${id}`);
```

## 🔧 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3001

# Application Configuration
NEXT_PUBLIC_APP_NAME=Dental Clinic Management System
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Keys (if needed for client-side features)
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_AFRICASTALKING_API_KEY=your-africastalking-api-key

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_DIAGNOSIS=true
NEXT_PUBLIC_ENABLE_SMS=true
```

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never expose sensitive keys.

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build application for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Type-check TypeScript |

## 🎨 Styling

### Tailwind CSS

The application uses Tailwind CSS for styling:
- Utility-first CSS framework
- Responsive design utilities
- Custom color palette
- Dark mode support (if configured)

### Design System

- **Colors**: Custom color palette defined in `tailwind.config.ts`
- **Typography**: Consistent font sizes and weights
- **Spacing**: Standard spacing scale
- **Components**: Consistent component styling via shadcn/ui

### Custom Styles

Global styles are defined in:
- `app/globals.css` - Global styles and Tailwind directives
- `styles/globals.css` - Additional global styles

## 💻 Development

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for Next.js and TypeScript
- **Naming**: camelCase for variables, PascalCase for components
- **File Structure**: Feature-based organization

### Adding New Features

1. **Create Page**: Add new page in `app/[role]/[feature]/page.tsx`
2. **Create Components**: Add reusable components in `components/`
3. **Add API Service**: Create API service functions in `lib/api/`
4. **Add Types**: Define TypeScript types in `types/`
5. **Update Navigation**: Add route to sidebar navigation

### Component Development

```typescript
// Example component structure
"use client" // Required for client components

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function MyComponent() {
  const [state, setState] = useState()
  
  return (
    <Card>
      <Button onClick={() => setState('clicked')}>
        Click me
      </Button>
    </Card>
  )
}
```

### Best Practices

1. **Use Server Components** when possible (default in App Router)
2. **Add "use client"** only when needed (interactivity, hooks, browser APIs)
3. **Type everything** - Use TypeScript types
4. **Reuse components** - Use shadcn/ui components
5. **Handle loading states** - Show loading indicators
6. **Handle errors** - Display user-friendly error messages
7. **Optimize images** - Use Next.js Image component
8. **Code splitting** - Leverage Next.js automatic code splitting

## 🏗 Building for Production

### Build Process

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Build Optimization

Next.js automatically optimizes:
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Automatic image optimization
- **Font Optimization**: Automatic font optimization
- **Bundle Analysis**: Use `@next/bundle-analyzer` for analysis

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production backend URL
3. Set up proper CORS on backend
4. Configure CDN for static assets (if needed)
5. Set up monitoring and error tracking

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Connect your Git repository to Vercel
2. **Configure Environment Variables**: Add all required env variables
3. **Deploy**: Vercel will automatically deploy on push

### Docker Deployment

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### Other Platforms

The application can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Railway**
- **Render**
- **Any Node.js hosting platform**

## 🧪 Testing

### Running Tests

```bash
# Run tests (when configured)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Strategy

- **Unit Tests**: Test individual components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test user flows (using Playwright or Cypress)

## 🔒 Security

### Security Features

- **JWT Authentication**: Secure token-based auth
- **Protected Routes**: Middleware-based route protection
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: Next.js built-in CSRF protection
- **Secure Headers**: Configured via Next.js
- **Environment Variables**: Sensitive data in env vars

### Security Best Practices

1. **Never expose secrets** - Use server-side env vars
2. **Validate inputs** - Validate all user inputs
3. **Sanitize data** - Sanitize data before rendering
4. **Use HTTPS** - Always use HTTPS in production
5. **Keep dependencies updated** - Regular security updates
6. **Implement rate limiting** - Prevent abuse

## 📱 Responsive Design

The application is fully responsive:
- **Mobile**: Optimized for mobile devices
- **Tablet**: Tablet-friendly layouts
- **Desktop**: Full-featured desktop experience

### Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

2. **API Connection Issues**
   - Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
   - Verify backend server is running
   - Check CORS configuration on backend

3. **Type Errors**
   - Run `npm run type-check` to identify issues
   - Ensure all types are properly imported

4. **Styling Issues**
   - Clear browser cache
   - Restart development server
   - Check Tailwind configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add TypeScript types for new features
- Update documentation as needed
- Test your changes thoroughly

## 📝 License

ISC License

## 📞 Support

For support, please open an issue in the repository or contact the development team.

## 🙏 Acknowledgments

- Next.js team
- shadcn/ui community
- Radix UI team
- Tailwind CSS team
- All contributors

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**


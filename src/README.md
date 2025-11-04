# Frontend Source Code

This directory contains the React + TypeScript frontend application built with Vite.

## Structure

```
src/
├── assets/         # Static assets (images, fonts, etc.)
├── components/     # React components
│   ├── Authpage.tsx           # Login/Register page
│   ├── DatabasePage.tsx       # Database management
│   ├── Home.tsx              # Main dashboard
│   ├── Notepage.tsx          # Notes management
│   ├── SchedulePage.tsx      # Schedule management
│   ├── HistoryModal.tsx      # History viewing modal
│   └── ui/                   # Reusable UI components
├── lib/            # Utility libraries and helpers
├── App.tsx         # Main application component
├── main.tsx        # Application entry point
└── index.css       # Global styles
```

## Key Components

- **Authpage.tsx**: Handles user authentication (login/register) with role-based access
- **Home.tsx**: Main dashboard showing welcome message and navigation
- **SchedulePage.tsx**: Create, view, edit, and delete schedules
- **Notepage.tsx**: Manage notes with CRUD operations
- **DatabasePage.tsx**: Database management interface
- **HistoryModal.tsx**: View audit trail of user actions

## Environment Variables

Required in `.env`:
```
VITE_API_URL=http://localhost:5000
```

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
```

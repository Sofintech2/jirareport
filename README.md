# Jira Report Generator

A modern web application for generating customized Jira reports with an intuitive interface.

## Features

- Generate detailed Jira reports
- Real-time report preview
- Customizable report templates
- Modern and responsive UI
- Dark/Light theme support

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **API Integration**: REST APIs
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env` file with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── editor/           # Report editor page
│   └── page.tsx          # Home page
├── components/            # Reusable components
│   ├── ui/               # UI components
│   └── editor/           # Editor-specific components
├── lib/                  # Utility functions and helpers
├── public/               # Static assets
└── styles/               # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

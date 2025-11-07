# Cobbee - Support Creators You Love

[![CI/CD Pipeline](https://github.com/0xmonas/grape/actions/workflows/ci.yml/badge.svg)](https://github.com/0xmonas/grape/actions/workflows/ci.yml)

A modern platform for creators to receive support from their fans through coffee donations. Built with Next.js 16, React 19, and a bold neo-brutalist design.

## 🚀 Features

- **Accept Donations**: Supporters can buy you coffees with custom amounts and messages
- **Creator Profiles**: Customizable profiles with avatars, bios, and cover images
- **Dashboard**: Track earnings, supporters, and coffee counts
- **Discover Creators**: Browse and support amazing creators
- **Neo-Brutalist Design**: Bold colors, thick borders, and chunky shadows

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Package Manager**: pnpm 9.x
- **Analytics**: Vercel Analytics
- **Forms**: React Hook Form + Zod validation

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/0xmonas/grape.git
cd grape

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint errors automatically
pnpm typecheck    # Run TypeScript type checking
```

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── [username]/        # Dynamic creator profiles
│   ├── dashboard/         # Creator dashboard
│   ├── login/            # Authentication
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   └── ...
├── lib/                  # Utilities & mock data
├── hooks/                # Custom React hooks
├── public/               # Static assets
└── .github/              # GitHub Actions workflows
```

## 📚 Documentation

- [AGENTS.md](AGENTS.md) - Complete codebase guide for AI agents
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API specification (future)
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 🔒 Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

See [.env.example](.env.example) for all available variables.

## 📝 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Design inspired by neo-brutalism aesthetic
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

**Built with ❤️ by the Cobbee team**

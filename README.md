# REACH Church App

A modern web application for **REACH Church**, built to connect the congregation, share church life, and deliver a fast, accessible experience on every device.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](#license)

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## About

**REACH Church App** is the official digital platform for REACH Church. The project is built with [Next.js App Router](https://nextjs.org/docs/app) and TypeScript, providing a scalable foundation for church-facing features such as announcements, events, media, and community engagement.

This repository is actively under development. The current release focuses on project setup, core architecture, and development workflow.

---

## Features

### Current

- Next.js 16 App Router with React 19
- TypeScript for type-safe development
- ESLint configuration for consistent code quality
- Responsive layout and optimized fonts via `next/font`
- Environment-based configuration (secrets kept local)

### Planned

- Church homepage and service information
- Events and announcements
- Sermon and media library
- Member resources and contact forms
- Admin content management

---

## Tech Stack

| Category        | Technology                          |
| --------------- | ----------------------------------- |
| Framework       | [Next.js 16](https://nextjs.org/)   |
| UI Library      | [React 19](https://react.dev/)      |
| Language        | [TypeScript 5](https://www.typescriptlang.org/) |
| Linting         | ESLint + `eslint-config-next`       |
| Package Manager | npm                                 |

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or later ([Download](https://nodejs.org/))
- **npm** 10.x or later (included with Node.js)
- **Git** ([Download](https://git-scm.com/))

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/truonga-dev/REACH_Church_App.git
cd REACH_Church_App
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in the required values. See [Environment Variables](#environment-variables) for details.

> **Important:** Never commit `.env.local` or any file containing secrets. These files are excluded via `.gitignore`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure the variables for your environment.

| Variable | Description | Required |
| -------- | ----------- | -------- |
| —        | Add variables here as the project grows | — |

`.env.local` is loaded automatically by Next.js during local development and is **never** pushed to GitHub.

---

## Available Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start the development server             |
| `npm run build` | Create an optimized production build     |
| `npm run start` | Run the production build locally         |
| `npm run lint`  | Run ESLint across the project            |

---

## Project Structure

```
reach-church/
├── public/              # Static assets (images, icons, fonts)
├── src/
│   └── app/             # Next.js App Router pages and layouts
│       ├── layout.tsx   # Root layout and global metadata
│       ├── page.tsx     # Home page
│       └── globals.css  # Global styles
├── .gitignore           # Git ignore rules (committed — protects secrets)
├── eslint.config.mjs    # ESLint configuration
├── next.config.ts       # Next.js configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

---

## Deployment

The recommended deployment platform for Next.js is [Vercel](https://vercel.com/).

1. Push your branch to GitHub.
2. Import the repository in Vercel.
3. Add environment variables in the Vercel project settings.
4. Deploy.

For other platforms, refer to the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

---

## Contributing

This is a private church project. If you are a team member:

1. Create a feature branch from `main`.
2. Make your changes and run `npm run lint`.
3. Commit with a clear, descriptive message.
4. Open a pull request for review.

---

## License

This project is **private** and proprietary to REACH Church. Unauthorized copying, distribution, or use is prohibited.

---

## Contact

**Repository:** [github.com/truonga-dev/REACH_Church_App](https://github.com/truonga-dev/REACH_Church_App)

For questions about this project, please contact the REACH Church development team.

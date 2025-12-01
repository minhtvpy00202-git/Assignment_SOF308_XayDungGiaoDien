# Blog Management Application

A social media blog application built with Vue.js 3, TypeScript, Bootstrap 5, and JSON Server.

## Features

- User registration and authentication
- Create, edit, and delete blog posts
- Like and share posts
- Comment on posts (inline and dedicated views)
- Direct messaging between users
- User profiles with post management
- Responsive design with Bootstrap 5

## Tech Stack

- **Frontend**: Vue.js 3 (Composition API), TypeScript
- **UI Framework**: Bootstrap 5
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Backend**: JSON Server
- **Build Tool**: Vite

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the JSON Server (backend API):
```bash
npm run server
```
This will start the API server on http://localhost:3000

3. In a separate terminal, start the development server:
```bash
npm run dev
```
This will start the frontend on http://localhost:5173

## Available Scripts

- `npm run dev` - Start the Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start JSON Server on port 3000

## Project Structure

```
blog_app/
├── src/
│   ├── types/          # TypeScript interfaces and types
│   ├── components/     # Vue components
│   ├── views/          # Page components
│   ├── composables/    # Composition API logic
│   ├── services/       # API service layer
│   ├── router/         # Vue Router configuration
│   └── main.ts         # Application entry point
├── db.json             # JSON Server database
└── package.json
```

## API Endpoints

JSON Server provides the following REST endpoints:

- `GET/POST /users` - User management
- `GET/POST/PUT/DELETE /posts` - Blog posts
- `GET/POST/DELETE /comments` - Post comments
- `GET/POST/DELETE /likes` - Post likes
- `GET/POST /shares` - Post shares
- `GET/POST /messages` - Direct messages

## Development Notes

- Bootstrap 5 is configured globally in main.ts
- TypeScript interfaces are defined in src/types/index.ts
- The application uses Vue 3 Composition API with reactive refs
- Authentication tokens are stored in localStorage

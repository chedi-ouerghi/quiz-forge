# 🏆 QuizForge: The Ultimate Gamified Learning Experience

QuizForge is a state-of-the-art, full-stack mobile application designed to transform learning into an addictive and rewarding experience. Built with a modern tech stack, it features sequential quiz progression, real-time-like notifications, and a deep gamification system including XP, levels, and badges.

---

## 🚀 Key Features

- **Sequential Quiz Progression**: Unlock quizzes step-by-step. Master a topic (60% score required) to move to the next challenge within a difficulty level.
- **Dynamic Leveling System**: Earn XP for every correct answer. Profile levels (Beginner to Expert) update dynamically based on your total knowledge.
- **Smart Notification System**: Get notified about new quizzes, user mentions in discussions, and replies to your comments.
- **Advanced Comment Threads**: Engage with the community through nested discussions, replies, and mentions within каждая quiz.
- **Privacy & Security**: Secure authentication with JWT and protected API routes.
- **Stunning UI/UX**: A premium mobile interface featuring Glassmorphism, smooth animations, and a cohesive dark-mode theme.

---

## 🛠 Tech Stack

### **Frontend (Mobile App)**
- **Framework**: [Expo](https://expo.dev/) / React Native
- **Navigation**: Expo Router (File-based routing)
- **Styling**: Vanilla CSS-in-JS with a centralized Design System
- **Icons**: Lucide-react-native & MaterialIcons
- **State Management**: React Hooks (useContext, useMemo, useCallback)
- **Animations**: React Native Animated API (with Native Driver)

### **Backend (Server)**
- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Security**: JWT (JSON Web Tokens), Bcryptjs, Helmet
- **Logging**: Winston & Morgan

---

## 📂 Project Structure

```text
QuizForge/
├── client/                # Expo Mobile Application
│   ├── app/               # Expo Router pages ((tabs), auth, quiz)
│   ├── components/        # Reusable UI & Feature components
│   ├── constants/         # Theme, Design Tokens, Mock Data
│   ├── services/          # API Clients & Auth Logic
│   └── hooks/             # Custom React Hooks
├── server/                # Express API Backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── db/            # Schema, Migrations, Seeders
│   │   ├── middlewares/   # Auth & Error handling
│   │   ├── routes/        # Express Route definitions
│   │   └── services/      # Business logic (Notifications, etc.)
```

---

## ⚙️ Getting Started

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v18+)
- [MySQL](https://www.mysql.com/) server running
- [Expo Go](https://expo.dev/client) app installed on your physical device (to test mobile)

### **1. Setup Backend**
```bash
cd server
npm install

# Configure environment variables
# Create a .env file based on .env.example
cp .env.example .env

# Run migrations and seed the database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### **2. Setup Frontend**
```bash
cd client
npm install

# Start the Expo development server
npx expo start
```
*Tip: Scan the QR code with your Expo Go app to view the application on your device.*

---

## 🧪 Development Scripts

### **Server**
- `npm run dev`: Start server in watch mode (tsx)
- `npm run build`: Compile TypeScript to JS
- `npm run db:generate`: Create SQL migration files from schema
- `npm run db:migrate`: Apply migrations to your MySQL DB
- `npm run db:seed`: Populate the database with initial quizzes, questions, and badges

### **Client**
- `npx expo start`: Start Expo dev server
- `npx expo run:android`: Run on Android Emulator
- `npx expo run:ios`: Run on iOS Simulator

---

## 🎨 Design System
QuizForge uses a custom design system defined in `client/constants/theme.ts`. It includes:
- **Glassmorphic Components**: `GlassCard`, `NeonButton`
- **Dynamic Badges**: Color-coded by difficulty
- **Fluid Layouts**: Responsive spacing and typography scales

---

## 📜 License
This project is for educational and portfolio purposes.

---


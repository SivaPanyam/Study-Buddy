# Study Buddy 📚

An AI-powered learning platform that helps students prepare for exams with personalized study plans, flashcards, quizzes, notes, and gamification features.

## Features ✨

- **📖 Study Plans**: AI-generated structured study plans with weekly breakdowns
- **🎯 Flashcards**: Create and review flashcards with AI-powered generation
- **📝 Notes**: Take notes and get AI-powered summaries
- **📄 Document Processing**: Upload PDFs and Word docs for note extraction
- **🧠 Quiz Generator**: Generate quizzes to test your knowledge
- **🎮 Gamification**: Earn XP, unlock badges, and maintain study streaks
- **⏱️ Pomodoro Timer**: Study with the Pomodoro technique
- **🎵 Soundscapes**: Focus music to enhance study sessions
- **☀️ Dark/Light Theme**: Personalized UI themes
- **☁️ Cloud Sync**: All data synced to Supabase

---

## Tech Stack 🛠️

- **Frontend**: React 19 + Vite + TailwindCSS
- **Backend**: Supabase (PostgreSQL)
- **AI Integration**: Google Generative AI (Gemini)
- **State Management**: React Context API
- **Routing**: React Router v7
- **Document Processing**: PDF.js + Mammoth

---

## Prerequisites 📋

Before you start, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- A **Supabase** account (free tier available)
- A **Google AI Studio** account for API access

---

## Setup Instructions 🚀

### 1. Clone the Repository

```bash
git clone https://github.com/SivaPanyam/AICTE-Batch-7-Study_Buddy.git
cd "Study Buddy"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create API Keys

#### 🔑 Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Sign in with your Google account
3. Click **"Create API Key"** button
4. Select **"Create API key in new project"** (or choose existing project)
5. Copy the generated API key
6. Keep it safe - you'll need it in step 4

**⚠️ Important**: Never share your API key publicly!

#### 🔑 Supabase Keys

1. Go to [Supabase](https://supabase.com) and sign in
2. Create a new project:
   - Click **"New Project"**
   - Enter your project name
   - Create a strong password (save it somewhere safe)
   - Select the region closest to you
   - Click **"Create new project"**
3. Wait 2-3 minutes for the project to initialize
4. Once ready, go to **Settings → API** to get your credentials:
   - Copy the **Project URL** → This is `VITE_SUPABASE_URL`
   - Copy the **anon public** key → This is `VITE_SUPABASE_ANON_KEY`

5. **Create Database Tables** (Very Important!):
   - In Supabase dashboard, go to **SQL Editor**
   - Click **"New Query"**
   - Paste the complete SQL script below:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create study_plans table
CREATE TABLE study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  weeks JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create flashcard_decks table
CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create flashcard_cards table
CREATE TABLE flashcard_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  card_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
);

-- Create study_notes table
CREATE TABLE study_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create user_gamification table
CREATE TABLE user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  xp_total INT DEFAULT 0,
  level INT DEFAULT 1,
  badges JSONB DEFAULT '[]'::jsonb,
  last_xp_update TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create user_streaks table
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_streak INT DEFAULT 0,
  last_completion_date DATE,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create quiz_attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic TEXT,
  score INT,
  total_questions INT,
  answers JSONB,
  completed_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX idx_study_plans_created_at ON study_plans(created_at DESC);
CREATE INDEX idx_flashcard_decks_user_id ON flashcard_decks(user_id);
CREATE INDEX idx_flashcard_cards_deck_id ON flashcard_cards(deck_id);
CREATE INDEX idx_study_notes_user_id ON study_notes(user_id);
CREATE INDEX idx_study_notes_updated_at ON study_notes(updated_at DESC);
CREATE INDEX idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies to ensure users only access their own data
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own plans" ON study_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON study_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON study_plans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON study_plans
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own decks" ON flashcard_decks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decks" ON flashcard_decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own decks" ON flashcard_decks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own decks" ON flashcard_decks
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read cards from own decks" ON flashcard_cards
  FOR SELECT USING (
    deck_id IN (SELECT id FROM flashcard_decks WHERE auth.uid() = user_id)
  );
CREATE POLICY "Users can insert cards to own decks" ON flashcard_cards
  FOR INSERT WITH CHECK (
    deck_id IN (SELECT id FROM flashcard_decks WHERE auth.uid() = user_id)
  );
CREATE POLICY "Users can update cards in own decks" ON flashcard_cards
  FOR UPDATE USING (
    deck_id IN (SELECT id FROM flashcard_decks WHERE auth.uid() = user_id)
  );
CREATE POLICY "Users can delete cards from own decks" ON flashcard_cards
  FOR DELETE USING (
    deck_id IN (SELECT id FROM flashcard_decks WHERE auth.uid() = user_id)
  );

CREATE POLICY "Users can read own notes" ON study_notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON study_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON study_notes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON study_notes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own gamification" ON user_gamification
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gamification" ON user_gamification
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification" ON user_gamification
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

- Click the **"Run"** button
- Wait for all tables and policies to be created successfully

### 4. Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Open `.env.local` and replace with your actual API keys:

```env
# Get this from Google AI Studio (https://aistudio.google.com/app/apikeys)
VITE_GEMINI_API_KEY=your_actual_google_gemini_api_key

# Get these from Supabase Settings → API
VITE_SUPABASE_URL=your_actual_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
```

3. Save the file

### 5. Start the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173` 🎉

---

## Building for Production 📦

Create an optimized production build:

```bash
npm run build
```

The build output will be in the `dist/` folder.

To preview the production build locally:

```bash
npm run preview
```

---

## Project Structure 📁

```
Study Buddy/
├── src/
│   ├── components/        # Reusable React components
│   ├── context/          # React Context (Auth, Gamification, Theme)
│   ├── hooks/            # Custom React hooks
│   ├── layout/           # Layout components (Sidebar, Topbar, MainLayout)
│   ├── lib/              # External lib config (Supabase)
│   ├── pages/            # Full page components
│   ├── services/         # API services (Gemini)
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # App entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── .env.example          # Example environment variables
├── .gitignore           # Git ignore rules
├── index.html           # HTML entry point
├── package.json         # Dependencies & scripts
├── vite.config.js       # Vite configuration
└── README.md            # This file
```

---

## Available Pages 📄

| Page           | Description                                             |
| -------------- | ------------------------------------------------------- |
| **Dashboard**  | Overview of progress, XP, level, and upcoming tasks     |
| **Goals**      | Create and manage study goals with AI planning          |
| **Courses**    | AI-recommended courses based on your goals              |
| **Flashcards** | Create flashcard decks and study with spaced repetition |
| **Quiz**       | Daily quizzes and mock interviews                       |
| **Notes**      | Take and organize study notes                           |
| **Documents**  | Upload & analyze PDFs and Word documents                |
| **Settings**   | Customize profile and preferences                       |

---

## Gamification System 🎮

Earn XP and progress through levels by:

- ✅ Completing study tasks (25 XP)
- 📝 Creating notes (10 XP)
- 🎯 Creating flashcard decks (20 XP)
- 📊 Taking quizzes (50-120 XP based on score)
- 🔥 Maintaining daily streaks (Bonus XP)

### XP Progression

- **Level 1**: 0 XP
- **Level 2**: 1000 XP
- **Level 3**: 2000 XP
- Each level requires an additional 1000 XP

Unlock special badges for achievements!

---

## Troubleshooting 🔧

### "API Key Not Working" Error

- ✓ Double-check your API key from Google AI Studio
- ✓ Make sure you have `.env.local` file (NOT `.env.example`)
- ✓ Restart the dev server after changing keys
- ✓ No spaces in your API key

### "Supabase Connection Failed"

- ✓ Verify your Supabase URL and anon key are correct
- ✓ Check if all database tables were created successfully
- ✓ Ensure RLS policies are enabled
- ✓ Check your Supabase dashboard for any warnings

### "Slow Page Loading"

- ✓ Clear your browser cache
- ✓ Restart the dev server
- ✓ Check Supabase query performance in your dashboard
- ✓ Check your network connection speed

### "404 Page Not Found"

- ✓ Make sure you're accessing `http://localhost:5173` (not 5174 or other ports)
- ✓ Check that Vite dev server is running
- ✓ Try hard refresh (`Ctrl+Shift+R` on Windows/Linux or `Cmd+Shift+R` on Mac)

---

## Contributing 🤝

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License 📜

This project is open source and available under the MIT License.

---

## Acknowledgments 🙏

- Built for AICTE Batch 7
- Powered by [Google Generative AI](https://ai.google.dev/)
- Backend by [Supabase](https://supabase.com/)
- Frontend by [React](https://react.dev/) + [Vite](https://vitejs.dev/)

---

## Support 💬

Have questions or issues? Here's how you can get help:

- 📖 Check the [Troubleshooting](#troubleshooting-) section
- 🐛 Open an issue on [GitHub](https://github.com/SivaPanyam/AICTE-Batch-7-Study_Buddy/issues)
- 💬 Start a discussion on GitHub

---

Happy Learning! 🎓✨

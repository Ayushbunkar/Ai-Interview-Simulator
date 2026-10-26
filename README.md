# InterviewForge AI — Software Engineering Hiring Simulator

InterviewForge AI is a complete, production-quality personal AI interview simulator engineered to replicate the rigorous hiring processes of **TCS, Capgemini, service-based consulting firms, and top product engineering companies**.

---

## 🚀 Key Architectural Features

- **Four-Round Deterministic State Machine**:
  1. **Technical Round 1**: Programming fundamentals, Java & OOP, Collections, Exceptions, and Basic DSA.
  2. **Technical Round 2**: Advanced CS concepts (DBMS, ACID, OS, Networks, REST APIs, Git, and Project Architecture Discussion).
  3. **Coding Interview Round**: LeetCode-style problem presentation, approach explanation, live Monaco Code Editor, and real compiler execution.
  4. **Behavioral & HR Round**: STAR framework evaluation (Situation, Task, Action, Result), team conflict, deadlines, failure learning, and cultural fit.
- **Candidate Interruption & Clarification Engine**: Ask the interviewer about constraints, input types, or assumptions at any time without counting as an answer or penalizing your score.
- **Dual AI Operation Mode**:
  - **Live Groq AI Engine**: Official Groq SDK (`llama-3.3-70b-versatile`) with structured JSON schema validation.
  - **Offline Local Development Engine**: Runs 100% locally with zero external network or API key dependencies.
- **Real Online Compiler Execution**:
  - Integrated with **OnlineCompiler.io / Judge0** API supporting **Java (OpenJDK 25)**, **Python 3.14**, and **C++ (GCC 15)**.
  - Test harness executes standard I/O and class method problems against visible and hidden test cases with actual execution duration (ms), memory (KB), stdout, and compiler output.
- **Seeded Knowledge Repository**:
  - **200+ Core Technical & HR Questions** (30 Java/OOP, 25 DBMS/SQL, 20 OS, 20 Networks, 30 DSA concepts, 15 Backend/REST, 20 System Design, 40 Behavioral).
  - **60 LeetCode-Style Coding Problems** (20 Easy, 30 Medium, 10 Hard) with test cases, starter code, and reference solutions.
- **Transparent Calibrated Rubrics**: Configurable percentage weightings for correctness, reasoning, depth/trade-offs, complexity, and communication.
- **Exportable Reports & 7-Day Revision Roadmap**: Markdown and JSON exports with personalized 7-day preparation plans based on actual weaknesses identified during the session.

---

## 📦 Technology Stack

- **Frontend**: Next.js 14 App Router, React 18, TypeScript (Strict Mode), Tailwind CSS, Monaco Editor (`@monaco-editor/react`), Lucide React icons.
- **Backend**: Next.js Server-Side Route Handlers, Zod Request Validation, TypeScript Service Layer.
- **Persistence**: Serverless PostgreSQL via [Neon](https://neon.tech) (`@neondatabase/serverless` & Drizzle ORM `drizzle-orm/neon-serverless`), with zero local toolchain dependencies and persistent cloud storage across all Vercel serverless cold-starts.
- **AI Providers**: Groq SDK (`groq-sdk`) + Local Development Rule Engine fallback.
- **Compiler Execution**: OnlineCompiler.io / Judge0 REST API adapter.

---

## ⚡ Quick Start (Windows PowerShell)

```powershell
# 1. Clone or open the workspace
cd "d:\Ai interview Simulator"

# 2. Install dependencies
npm install

# 3. Seed the local SQLite database (200 questions, 60 coding problems, 153 test cases)
npm run db:seed

# 4. Run automated test suite
npm test

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables Configuration

Create a `.env.local` file in the project root:

```env
# AI Provider (Groq API) - Optional for initial local dev mode
# Free API key available at: https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Online Compiler API (Judge0 / OnlineCompiler.io compatible)
ONLINECOMPILER_API_KEY=your_onlinecompiler_api_key_here
ONLINECOMPILER_API_URL=https://api.onlinecompiler.io/api/judge0

# Database Configuration (Neon Serverless PostgreSQL or local PostgreSQL)
DATABASE_URL=your_postgresql_database_url_here
```

---

## 🧪 Verification & Acceptance Test Suite

To run both unit and integration simulation tests:

```powershell
npm test
```

### Verified Test Results:
- `ok 1` — Seeded Question Bank contains >= 200 questions across required 8 categories.
- `ok 2` — Seeded Coding Problem Bank contains >= 60 problems (20 Easy, 30 Medium, 10 Hard).
- `ok 3` — Local Development Deterministic AI Engine evaluates answers without network.
- `ok 4` — Candidate clarification interruption preserves active question without penalty.
- `ok 5` — Rubric weighted scoring mathematics is calibrated to 100%.
- `ok 6` — Successfully configure and create a full 4-round interview session.
- `ok 7` — Candidate submits answer and receives rubric score and feedback.
- `ok 8` — Compiler Provider executes code with live OnlineCompiler.io key.
- `ok 9` — Conclude interview and verify persistent report derivation and 7-day plan.

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub or GitLab:
   ```powershell
   git init
   git add .
   git commit -m "feat: InterviewForge AI release"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Import the project into [Vercel](https://vercel.com/new).
3. In the Vercel Dashboard under **Environment Variables**, add:
   - `ONLINECOMPILER_API_KEY`: `<your_onlinecompiler_api_key>`
   - `ONLINECOMPILER_API_URL`: `https://api.onlinecompiler.io/api/judge0`
   - `GROQ_API_KEY`: `<your_groq_api_key>` (optional, Local Dev Engine active if empty)
   - `GROQ_MODEL`: `openai/gpt-oss-120b`
   - `DATABASE_URL`: `<your_neon_or_postgresql_database_url>`
4. Deploy! Vercel will run `npm run build` and launch the application globally.

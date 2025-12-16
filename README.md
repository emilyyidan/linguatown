# Lingua Town

A language learning application where users practice conversations with AI characters at different locations in a virtual town. Complete conversations to unlock buildings and progress through difficulty levels.

## Architecture Overview

This is a [Next.js](https://nextjs.org) application using the App Router architecture, built with TypeScript and React.

### Core Technologies

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI:** OpenAI API (GPT-4o-mini, Whisper)
- **State Management:** React hooks + localStorage

## Project Structure

```
lingua-town/
├── app/                    # Next.js App Router pages and API routes
│   ├── page.tsx           # Home page (town view with buildings)
│   ├── [building]/        # Dynamic route for building pages
│   │   └── page.tsx       # Individual building conversation page
│   └── api/               # API routes
│       ├── chat/          # Character conversation endpoint
│       ├── evaluate/      # Language evaluation endpoint
│       └── voice/stream/  # Voice transcription endpoint
├── components/            # React components
│   ├── BuildingCard.tsx   # Building display with progress visualization
│   └── ChatInterface.tsx  # Main conversation UI component
├── lib/                   # Core business logic (language-agnostic utilities)
│   ├── characters.ts      # Character definitions and location data
│   ├── language.ts        # Language selection and configuration
│   ├── openai.ts          # OpenAI client initialization
│   ├── progress.ts        # Progress tracking and persistence
│   ├── prompts.ts         # LLM prompt engineering and conversation utilities
│   ├── topics.ts          # Topic definitions by location and difficulty
│   └── topicSelection.ts  # Topic selection and completion logic
└── public/                # Static assets (building images, etc.)
```

## Core Logic Locations

### `/lib` Directory

The `/lib` directory contains all core business logic, separated by domain:

#### **`lib/progress.ts`** - Progress & State Management
- **Purpose:** Tracks user progress through locations, difficulty levels, and topics
- **Key Functions:**
  - `completeConversation()` - Records conversation completion and checks for level advancement
  - `getAllLocationStages()` - Retrieves completion status for all locations
  - `getGlobalLevel()` / `setGlobalLevel()` - Manages current difficulty level
- **Storage:** Uses localStorage (scoped by learning language)
- **Data Structure:** Hierarchical progress by language → difficulty → location → topics

#### **`lib/prompts.ts`** - LLM Prompt Engineering
- **Purpose:** Constructs system prompts for OpenAI API calls
- **Key Functions:**
  - `buildSystemPrompt()` - Main prompt builder with difficulty-specific instructions
  - `buildHintPrompt()` - Generates hints for learners
  - `buildEvaluationPrompt()` - Creates evaluation prompts for grammar checking
  - `mapMessagesToConversationContext()` - Utility for context management
- **Constants:** `CONVERSATION_CONTEXT_SIZE`, `RECENT_CONTEXT_SIZE`
- **Features:** Location-specific scenarios, difficulty-adaptive conversation styles

#### **`lib/characters.ts`** - Character & Location Data
- **Purpose:** Defines characters, roles, and opening messages per location
- **Key Functions:**
  - `getCharacterName()`, `getCharacterRole()`, `getOpeningMessage()` - Character data access
  - `formatLocationName()` - Slug-to-title conversion utility
- **Data:** Multi-language character definitions (names, roles, messages)

#### **`lib/topics.ts`** - Topic Definitions
- **Purpose:** Defines conversation topics by location and difficulty level
- **Data Structure:** `TopicsByLocation` - nested map of location → difficulty → topics
- **Topics:** Each location has 5 topics per difficulty (beginner/intermediate/advanced)

#### **`lib/topicSelection.ts`** - Topic Management
- **Purpose:** Handles topic selection and completion tracking
- **Key Functions:**
  - `selectNextTopic()` - Selects next available topic (prioritizes uncompleted)
  - `completeTopic()` - Marks topic as completed

#### **`lib/language.ts`** - Language Configuration
- **Purpose:** Manages learning and native language settings
- **Key Functions:**
  - `getLearningLanguage()` / `setLearningLanguage()` - Current learning language
  - `getNativeLanguage()` - User's native language (currently always "en")
  - `getAvailableLearningLanguages()` - Supported languages
- **Storage:** localStorage

#### **`lib/openai.ts`** - OpenAI Client
- **Purpose:** Centralized OpenAI API client initialization
- **Key Function:** `getOpenAIClient()` - Returns configured OpenAI instance
- **Environment:** Requires `OPENAI_API_KEY` environment variable

### API Routes (`/app/api`)

#### **`/api/chat`** - Conversation Endpoint
- **Purpose:** Generates character responses and hints
- **Flow:**
  1. Receives conversation state (messages, turn count, difficulty, topic)
  2. Builds system prompt using `buildSystemPrompt()`
  3. Calls OpenAI to generate character response
  4. Optionally generates hint (for beginner/intermediate)
  5. Returns response text, hint, and conversation end flag
- **Models:** GPT-4o-mini (150 tokens, temperature 0.8)

#### **`/api/evaluate`** - Language Evaluation
- **Purpose:** Evaluates user input for grammar/vocabulary errors
- **Flow:**
  1. Receives user message and conversation context
  2. Builds evaluation prompt using `buildEvaluationPrompt()`
  3. Calls OpenAI for error checking
  4. Returns correction or "OK" status
- **Models:** GPT-4o-mini (200 tokens, temperature 0.3 for consistency)

#### **`/api/voice/stream`** - Voice Transcription
- **Purpose:** Transcribes audio input to text
- **Flow:**
  1. Receives base64-encoded audio (WebM format)
  2. Converts to buffer and sends to Whisper API
  3. Returns transcribed text
- **Models:** Whisper-1

### Components

#### **`ChatInterface.tsx`** - Main Conversation UI
- **Purpose:** Handles the conversation flow and UI
- **Key Features:**
  - Message display and input (text or voice)
  - Hint display (always visible for beginner, clickable for intermediate)
  - Turn counting and conversation end detection
  - Countdown timer and navigation on completion
  - Progress tracking (marks topics/conversations complete)
- **State Management:** Manages conversation state, hints, voice recording, turn count

#### **`BuildingCard.tsx`** - Building Visualization
- **Purpose:** Displays building with progress visualization
- **Features:**
  - Level-based building images (1-3)
  - Decorative elements (bakery-specific)
  - Completion animations
  - Progress stages visualization

## Data Flow

### Conversation Flow

1. **User selects building** → `app/[building]/page.tsx`
2. **Topic selection** → `selectNextTopic()` chooses next available topic
3. **Conversation starts** → `ChatInterface` loads, calls `/api/chat` for opening message
4. **User sends message:**
   - Message sent to `/api/chat` (character response)
   - Message sent to `/api/evaluate` (error checking) - parallel call
   - Response displayed with hint (if applicable)
   - Corrections shown inline if errors found
5. **Conversation ends** → Turn count reaches limit, countdown starts
6. **Completion** → Progress saved, user navigated back to town

### Progress Tracking Flow

1. **Conversation completion** → `completeConversation()` called
2. **Stage incremented** → Location stage count increases (max 3 per location)
3. **Topic marked complete** → Topic added to completed topics list
4. **Level check** → If all locations complete, difficulty level advances
5. **Storage** → Progress saved to localStorage (scoped by language)

### Prompt Engineering Flow

1. **System prompt built** → `buildSystemPrompt()` combines:
   - Character/location context
   - Difficulty-specific conversation style
   - Topic or scenario instructions
   - Language requirements
   - Turn count and end-of-conversation handling
2. **Context preparation** → Recent messages included via `conversationContext`
3. **LLM call** → OpenAI generates response following prompt guidelines
4. **Response parsing** → Tags like `[CONTINUE]`/`[END]` extracted if present

## Key Design Patterns

### 1. **Prompt Engineering Strategy**
- Difficulty-adaptive prompts (beginner: simple, advanced: complex)
- Location-specific scenarios per difficulty
- Turn-based conversation management (min/max turns per difficulty)
- Context-aware hints and evaluations

### 2. **Progress Persistence**
- localStorage-based (client-side only)
- Scoped by learning language
- Hierarchical structure: language → difficulty → location → topics
- Automatic migration for backward compatibility

### 3. **Topic System**
- Topics defined per location/difficulty combination
- Completion tracking prevents immediate repeats
- Random selection from available topics
- Topic guidance displayed to users

### 4. **Multi-language Support**
- Character names/roles translated per language
- Language-specific prompts and instructions
- Progress scoped by language
- Language picker in UI

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```
OPENAI_API_KEY=your_api_key_here
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

- `OPENAI_API_KEY` (required) - OpenAI API key for chat, evaluation, and transcription

## Development Notes

### Adding a New Language

1. Add language code to `Language` type in `lib/characters.ts`
2. Add character translations in `lib/characters.ts`
3. Add language name/flag in `lib/language.ts`
4. Add to `getAvailableLearningLanguages()` in `lib/language.ts`

### Adding a New Location

1. Add location to `ALL_LOCATIONS` in `lib/progress.ts`
2. Add character definition in `lib/characters.ts`
3. Add scenario prompts in `lib/prompts.ts` (`locationScenarios`)
4. Add topics in `lib/topics.ts`
5. Add building images to `public/buildings/`
6. Add building position in `app/page.tsx` (`buildings` array)

### Modifying Conversation Behavior

- **Turn limits:** Modify `getTurnLimits()` in `lib/prompts.ts`
- **Conversation style:** Modify `getDifficultyGuidelines()` in `lib/prompts.ts`
- **Scenarios:** Modify `locationScenarios` in `lib/prompts.ts`
- **Hints:** Modify `buildHintPrompt()` in `lib/prompts.ts`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

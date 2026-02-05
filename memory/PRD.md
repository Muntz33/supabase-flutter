# Dr Ethergreen – YKY Hub PRD

## Original Problem Statement
Build Dr Ethergreen – YKY Hub (You Know You) - a voice-first, hyper-realistic, gamified spiritual/biohacking app that fuses astrology, Human Design, Gene Keys, numerology, and bio-resonance into one mystical platform with Voice AI Oracle, Tarot Engine, Bio-Scanner, and more.

## User Personas
1. **Spiritual Seekers** - Users interested in astrology, tarot, and self-discovery
2. **Biohackers** - Health-optimizers seeking frequency-based remedies
3. **Human Design Enthusiasts** - Those exploring their energetic blueprint
4. **Wellness Community** - Users wanting to connect with like-minded souls

## Core Requirements (Static)
- Voice AI Oracle with TTS/STT (OpenAI)
- Hyper-personalized Tarot Engine
- Bio-Resonance Voice Scanner
- User Soulprint (HD + Gene Keys + Numerology)
- Community Sanctuary
- Premium Subscription ($19.99/mo via Stripe)
- Obsidian dark theme with emerald accents

## Tech Stack
- **Backend**: FastAPI + MongoDB
- **Frontend**: React + Tailwind CSS + Framer Motion
- **AI**: OpenAI GPT-5.2 (chat), TTS-1-HD (onyx voice), Whisper-1 (STT)
- **Payments**: Stripe
- **Auth**: JWT

## What's Been Implemented (Jan 2026)

### MVP Features ✅
- [x] Animated splash screen with emerald orb
- [x] User authentication (register/login with JWT)
- [x] Dashboard with Bento Grid layout
- [x] Voice Oracle with text & voice input/output
- [x] Tarot Engine (single, 3-card, celtic cross spreads)
- [x] Bio-Resonance Scanner with voice analysis
- [x] Community Sanctuary (posts, categories)
- [x] Profile/Soulprint page
- [x] Premium subscription flow (Stripe checkout)
- [x] Database search (peptides, herbs, frequencies)
- [x] Obsidian dark theme with glass-morphism

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/profile` - Update profile
- `GET /api/profile/soulprint` - Get holographic soulprint
- `POST /api/oracle/chat` - Text chat with Oracle
- `POST /api/oracle/speak` - Get voice response (TTS)
- `POST /api/oracle/listen` - Transcribe voice (STT)
- `POST /api/tarot/draw` - Draw tarot cards
- `GET /api/tarot/history` - Get reading history
- `POST /api/bio/scan` - Bio-resonance scan
- `POST /api/community/post` - Create post
- `GET /api/community/feed` - Get feed
- `POST /api/payments/checkout` - Create Stripe checkout
- `GET /api/payments/status/{id}` - Check payment status
- `GET /api/database/search` - Search remedies database

## Prioritized Backlog

### P0 - Critical
- [ ] Fix external URL routing for production

### P1 - High Priority
- [ ] Human Design bodygraph visualization
- [ ] Gene Keys hologram animation
- [ ] BaZi pillars calculator
- [ ] Expand database to 20k+ entries
- [ ] Voice pattern memory (user recognition)

### P2 - Medium Priority
- [ ] Custom voice meditations
- [ ] Transit notifications
- [ ] Social sharing features
- [ ] Advanced numerology calculator
- [ ] GG33 master tables integration

### P3 - Future Enhancements
- [ ] Live readings feature
- [ ] AI coaching sessions
- [ ] Supplement stacking recommendations
- [ ] Mobile app (React Native)

## Next Tasks
1. Add more database entries (peptides, herbs, frequencies)
2. Implement Human Design bodygraph SVG
3. Add transit calculation logic
4. Create voice meditation generator
5. Enhance community with reactions/replies

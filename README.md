# MakeCryptoGreatAgain (MCGA) 🚀

A revolutionary Web3 platform that combines AI personality interactions, voice synthesis, and blockchain technology on the Solana network. Chat with iconic personalities, solve challenges, and earn MCGA tokens while participating in a vibrant community ecosystem.

## 🌟 Features

### 🎭 AI Character Interactions
- **10 Unique Personalities**: Chat with AI versions of Donald Trump, Elon Musk, Andrew Tate, Kanye West, Ben Shapiro, and more
- **Voice Synthesis**: Each character speaks in their authentic voice using advanced TTS technology
- **Multi-Language Support**: Select characters support German and Japanese conversations
- **Video Recording**: Record and export your conversations as video clips

### 🏆 Challenge System
- **Smart Contract Challenges**: Solve character-specific puzzles to win token pools
- **Dynamic Cooldowns**: Token holders enjoy reduced waiting times between attempts
- **On-Chain Verification**: All challenge results are verified via Solana smart contracts

### 🗳️ Community Governance
- **Character Voting**: Vote on which new personalities join the platform
- **Weighted Voting**: Your MCGA token holdings determine your voting power
- **Community Stats**: Track engagement and see platform leaderboards

### 💰 Token Economy
- **MCGA Token Integration**: Access premium features with native token
- **Tiered Access**: Different characters require different token amounts
- **Reward System**: Earn tokens by solving challenges and participating

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Swiper** for character carousel
- **Recharts** for data visualization

### Blockchain
- **Solana** blockchain integration
- **Anchor Framework** for smart contracts
- **@solana/wallet-adapter** for wallet connectivity
- **SPL Token** support

### Backend Services
- **Supabase** for database and real-time features
- **Play.ht** for voice synthesis
- **OpenAI API** for character responses

### Smart Contracts
- Custom Rust/Anchor programs for:
  - Token pool management
  - Challenge verification
  - Reward distribution

## 🚀 Getting Started

### Prerequisites
```bash
node >= 18.0.0
npm or yarn
Solana wallet (Phantom recommended)
```

### Installation
```bash
# Clone the repository
git clone [repository-url]
cd mcga-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_PLAYHT_API_KEY=your_playht_key
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build
```

## 🎮 How to Use

### 1. Connect Your Wallet
- Click "Connect Wallet" in the top navigation
- Approve the connection with your Solana wallet

### 2. Acquire MCGA Tokens
- Purchase MCGA tokens to access premium characters
- Trump is available for free to all users

### 3. Start Chatting
- Select a character from the carousel
- Type your message and receive AI-generated responses
- Enable voice mode to hear characters speak

### 4. Participate in Challenges
- Visit the Challenge page
- Solve character-specific puzzles
- Win token rewards from challenge pools

### 5. Community Engagement
- Vote on new characters in the Roadmap section
- Check your ranking in the Social leaderboards
- Track platform statistics

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── configs/            # Configuration files
├── hooks/              # Custom React hooks
├── pages/              # Main page components
├── smart-contract/     # Solana program files
├── stores/             # Zustand state management
├── styles/             # CSS stylesheets
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🎨 Characters Available

| Character | Price (MCGA) | Special Features |
|-----------|--------------|------------------|
| Donald Trump | FREE | Available to all users |
| Kanye West | 100,000 | Music industry insights |
| Logan Paul | 10,000 | Content creation tips |
| Connor McGregor | 300,000 | Fighting spirit |
| Ben Shapiro | 400,000 | Facts and logic |
| Elon Musk | 500,000 | Tech innovation |
| Andrew Tate | 700,000 | Business mindset |
| Satoshi Nakamoto | 600,000 | Crypto knowledge |
| Alex Jones | 2,000,000 | Conspiracy theories |
| Adolf Hitler | 1,000,000 | Historical perspective |

## 🔧 Smart Contract Features

### Challenge System
- **Pool Management**: Each character has a dedicated token pool
- **Hash Verification**: Secure answer checking via cryptographic hashes
- **Automated Rewards**: Instant token distribution for correct answers

### Access Control
- **Token Gating**: Premium characters require minimum token holdings
- **Cooldown Management**: Dynamic waiting periods based on token balance
- **Admin Functions**: Character and pool management capabilities

## 🎯 Roadmap

- ✅ Core chat functionality
- ✅ Voice synthesis integration
- ✅ Challenge system
- ✅ Community voting
- 🔄 Mobile app development
- 🔄 Additional character personalities
- 🔄 NFT integration
- 🔄 Advanced AI capabilities

## 🔒 Security Features

- **Wallet Integration**: Secure Solana wallet connectivity
- **Smart Contract Auditing**: Thoroughly tested challenge contracts
- **Input Validation**: Comprehensive user input sanitization
- **Rate Limiting**: TTS queue management to prevent abuse

## 🌐 Network Support

- **Mainnet**: Production deployment
- **Devnet**: Development and testing
- **Configurable Endpoints**: Easy network switching

## 📱 Responsive Design

- **Desktop First**: Optimized for large screens
- **Mobile Friendly**: Responsive design for all devices
- **Touch Support**: Mobile gesture compatibility
- **Progressive Web App**: Installable web application

## 🎵 Audio & Video Features

- **Voice Synthesis**: Character-specific voice generation
- **Video Recording**: Export conversations as MP4 files
- **Audio Streaming**: Real-time audio playback
- **Subtitle Generation**: Dynamic text overlay for videos

## 🔄 Real-time Features

- **Live Updates**: Real-time challenge status updates
- **Queue Management**: Live TTS request tracking
- **Community Stats**: Real-time leaderboard updates
- **Voting Results**: Live voting tallies

## 📊 Analytics & Tracking

- **User Engagement**: Message and interaction tracking
- **Token Metrics**: Balance and transaction monitoring
- **Challenge Stats**: Success rates and attempt tracking
- **Performance Monitoring**: Speed insights integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Token Address**: `jAxVYyzXPVCYfoK6gpr6SbQ4AUjL6QydWuRAwHXpump`
- **Network**: Solana Mainnet
- **Program ID**: `DNsprXHccVbxFTE2RNvchU3E3W1Hn3U4yosFSiVs8bQT`

---

**Disclaimer**: This platform is for entertainment purposes. AI-generated content may not reflect real personalities' actual views or opinions. Always verify information independently and use responsibly.

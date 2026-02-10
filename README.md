# Flipr.lol

SOL/USD price prediction platform on Solana.

## Architecture

- **Backend**: Anchor/Rust Solana program
- **Frontend**: Next.js 15 + TailwindCSS
- **Oracle**: Pyth Network SOL/USD feed
- **Model**: Parimutuel betting with LP vault

## Development

```bash
# Program
cd programs/flipr
anchor build
anchor test

# Frontend
cd app
npm install
npm run dev
```

## Links

- Live: https://flipr.lol (coming soon)
- Docs: See ARCHITECTURE.md

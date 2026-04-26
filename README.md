# wild-stories-tv-wstv

## Deployment (Vercel)

1. Go to https://vercel.com
2. Import GitHub repo: wildlife-cinematic-pro/wild-stories-tv-wstv
3. Framework: Next.js (auto-detected)
4. Set Environment Variables (if needed)
5. Deploy

Deployment behavior:
- push to main -> production deploy
- pull request -> preview deploy

CI and deployment notes:
- GitHub Actions CI runs first on the configured branches and pull requests
- Vercel deploy runs after push through the GitHub integration
- CI failures do not automatically block deploy unless branch protection is enabled

Recommended branch protection:
- Require CI to pass before merging to main
- This ensures only valid builds deploy to production

# Google Ads Campaign Creator

A web application for creating Google Ads campaigns with a simple and intuitive interface. Built with Next.js, TypeScript, and TailwindCSS.

## Features

- Google OAuth Authentication
- Integration with Google Ads API
- Search campaign creation with maximize clicks targeting
- Input for headlines (10 headlines with max 30 characters each) and descriptions (max 90 characters)
- Campaign budget and max CPC settings

## Prerequisites

- Node.js 18.x or higher
- A Google Cloud Project with OAuth 2.0 configured
- A Google Ads Developer Token
- Google Ads MCC account (for accessing multiple accounts)

## Setup

### Clone the repository

```bash
git clone <repository-url>
cd gads-creator
```

### Install dependencies

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000  # Use your production URL in production

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=your_google_ads_developer_token
```

### OAuth Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Create an OAuth 2.0 Client ID with the following settings:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000` (and your production URL)
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (and your production URL)
5. Enable the Google Ads API for your project

### Google Ads Configuration

1. Apply for a Google Ads Developer Token through your Google Ads account
2. Once approved, add the token to your `.env.local` file

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

The easiest way to deploy this application is with [Vercel](https://vercel.com/), which is optimized for Next.js.

1. Connect your GitHub repository to Vercel
2. Configure the environment variables in the Vercel dashboard
3. Deploy

## License

MIT

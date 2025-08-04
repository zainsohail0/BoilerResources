# Deployment Guide

## Vercel Deployment Setup

### 1. Create Vercel Account
- Sign up at [vercel.com](https://vercel.com)
- Connect your GitHub repository

### 2. GitHub Repository Secrets
Add these secrets in your GitHub repository settings (Settings > Secrets and variables > Actions):

- `VERCEL_TOKEN`: Your Vercel API token (get from Vercel Account Settings > Tokens)
- `VERCEL_ORG_ID`: Your Vercel organization ID (get from Vercel Team Settings)
- `VERCEL_PROJECT_ID`: Your Vercel project ID (get from Project Settings > General)

### 3. Environment Variables
Set these in Vercel dashboard for your project:

#### Backend Environment Variables:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `NODE_ENV`: production
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `EMAIL_USER`: Your email for notifications
- `EMAIL_PASS`: Your email password/app password

### 4. MongoDB Atlas Setup
1. Create account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for Vercel)
5. Get connection string for MONGODB_URI

### 5. Deploy
1. Push to main branch
2. GitHub Actions will automatically deploy to Vercel
3. Check deployment status in Vercel dashboard

## Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Domain Setup
- Custom domain can be added in Vercel project settings
- SSL is automatically provided
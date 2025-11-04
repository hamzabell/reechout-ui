# Environment Variables

Copy this file to `.env.local` and fill in your API keys:

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8888/.netlify/functions

# AI Service Configuration
REACT_APP_LEMONFOX_API_KEY=your_lemonfox_api_key_here
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Email Service Configuration
REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key_here
REACT_APP_SENDER_EMAIL=your_sender_email@example.com
REACT_APP_SENDER_NAME=Your Name

# Airtable Configuration
REACT_APP_AIRTABLE_API_KEY=your_airtable_api_key_here
REACT_APP_AIRTABLE_BASE_ID=your_airtable_base_id_here

# Development Configuration
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

## Required API Keys

### Lemonfox AI
- Get your API key from https://lemonfox.io
- Used for company research and lead intelligence

### OpenAI API
- Get your API key from https://platform.openai.com
- Used for email personalization and content generation

### SendGrid
- Get your API key from https://app.sendgrid.com
- Used for sending emails

### Airtable
- Get your API key and Base ID from https://airtable.com
- Used for storing leads, campaigns, and templates

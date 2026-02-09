import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  },
});

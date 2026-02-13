require('dotenv/config');

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    eas: {
      projectId: '42a98aa9-d950-4993-8527-51078ee7f874',
    },
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    firebaseApiKey: process.env.FIREBASE_API_KEY || '',
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    firebaseAppId: process.env.FIREBASE_APP_ID || '',
  },
  owner: 'conzoad',
});

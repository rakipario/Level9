const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// Polyfill for Node.js 18 (undici/openai compatibility)
if (!global.File) {
  const { File } = require('buffer');
  global.File = File;
}
if (!global.Blob) {
  const { Blob } = require('buffer');
  global.Blob = Blob;
}
if (!global.FormData) {
  const { FormData } = require('undici');
  global.FormData = FormData;
}

require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const agentRoutes = require('./routes/agents');
const integrationRoutes = require('./routes/integrations');
const aiRoutes = require('./routes/ai');
const uploadRoutes = require('./routes/upload');
const widgetRoutes = require('./routes/widget');
// OAuth disabled for now - uncomment when credentials are ready
// const oauthRoutes = require('./routes/oauth');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure for Railway/Heroku proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Logging
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route for basic health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Relay AI Backend',
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/widget', widgetRoutes);
// app.use('/api/oauth', oauthRoutes); // Disabled until OAuth configured

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

module.exports = app;

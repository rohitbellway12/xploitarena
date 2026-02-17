// src/app.js
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');


// Routes import karo
const authRoutes = require('./routes/auth.routes');
const programRoutes = require('./routes/program.routes');
const reportRoutes = require('./routes/report.routes');
const companyRoutes = require('./routes/company.routes');
const researcherRoutes = require('./routes/researcher.routes');
const adminRoutes = require('./routes/admin.routes');
const socialAuthRoutes = require('./routes/socialAuth.routes');
const eventRoutes = require('./routes/event.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// ---- Middleware ----
app.use(helmet()); // Security headers
app.use(cors()); // Cross-Origin Resource Sharing
app.use(morgan('combined')); // HTTP request logging
app.use(express.json({ limit: '10kb' })); // Body parsing for JSON

// ---- Rate Limiting ----
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter); // Stricter limit for auth

// ---- Routes ----
app.get('/', (req, res) => {
  res.send('XploitArena Backend is running!');
});

app.use('/api/auth', authRoutes); // Auth routes ko mount kiya
app.use('/api/auth/social', socialAuthRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/researcher', researcherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/upload', require('./routes/upload.routes'));

// ---- Error Handling Middleware (Always at the end) ----
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// ---- Server Start ----
setInterval(() => {}, 60000);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
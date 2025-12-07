const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./src/routes/authRoutes');
const issueRoutes = require('./src/routes/issueRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const { connectDB, sequelize } = require('./src/config/db');

dotenv.config();

const app = express();

// Define CORS options
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root route
app.get('/', (req, res) => {
  res.send('CivicFix Backend running');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await sequelize.sync();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `🚀 Server is running on port ${PORT} (listening on 0.0.0.0)`
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

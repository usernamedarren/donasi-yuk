require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend (production)
app.use(express.static(path.join(__dirname, '../../frontend')));

// health check - no database needed
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is healthy', status: 'ok', timestamp: new Date() });
});

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not set - database routes will fail');
  app.get('/api/config', (req, res) => {
    res.status(200).json({ 
      message: 'Server running but DATABASE_URL not configured',
      status: 'ok',
      requiresConfiguration: true
    });
  });
} else {
  // Only load routes if DATABASE_URL is set
  const authRoutes = require('./routes/auth');
  const adminCampaignRoutes = require('./routes/adminCampaign');
  const campaignRoutes = require('./routes/campaigns');
  const donationRoutes = require('./routes/donations');
  const rewardRoutes = require('./routes/rewards');
  const missionRoutes = require('./routes/missions');
  const userRoutes = require('./routes/user');
  const adminRoutes = require('./routes/admin');

  // routes utama
  app.use('/auth', authRoutes);
  app.use('/admin', adminCampaignRoutes);
  app.use('/campaigns', campaignRoutes);
  app.use('/donations', donationRoutes);
  app.use('/rewards', rewardRoutes);
  app.use('/missions', missionRoutes);
  app.use('/users', userRoutes);
  app.use('/admin-dashboard', adminRoutes);
}

// Serve frontend for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/beranda/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is healthy', status: 'ok', timestamp: new Date() });
});

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not set - database routes will fail');
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

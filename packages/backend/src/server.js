require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const adminCampaignRoutes = require('./routes/adminCampaign');

const campaignRoutes = require('./routes/campaigns');   // ⬅️ pakai 'campaigns.js'
const donationRoutes = require('./routes/donations');   // ⬅️ pakai 'donations.js'
// kalau mau pakai route lain juga bisa:
const rewardRoutes = require('./routes/rewards');
const missionRoutes = require('./routes/missions');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// health check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running', status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is healthy', status: 'ok' });
});

// routes utama
app.use('/auth', authRoutes);
app.use('/admin', adminCampaignRoutes);     // verifikasi kampanye admin

app.use('/campaigns', campaignRoutes);
app.use('/donations', donationRoutes);
app.use('/rewards', rewardRoutes);
app.use('/missions', missionRoutes);
app.use('/users', userRoutes);
app.use('/admin-dashboard', adminRoutes);   // kalau route admin lama kamu pakai ini

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

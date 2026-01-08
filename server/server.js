require('dotenv').config({ path: '../.env' });
const app = require('./app');
const connectDB = require('./config/db');
const { updateExpiredSubscriptions } = require('./utils/subscriptionManager');
const { seedPlans } = require('./utils/seeder');

connectDB().then(async () => {
    // Seed default plans if none exist
    await seedPlans();
    // Run initial expiry check
    updateExpiredSubscriptions();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
import cron from 'node-cron';
import { User } from '../models/userModel.js';

export const removeUnverifiedAccounts = () => {
    const cronJob = cron.schedule('*/30 * * * *', async () => {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const usersToDelete = await User.deleteMany({
            createdAt: { $lt: thirtyMinutesAgo },
            accountVerified :false
        });
    });
    return cronJob;
};


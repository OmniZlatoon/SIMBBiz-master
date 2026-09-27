const { createClient } = require('redis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const redisUrl = new URL(process.env.REDIS_URI);
if (redisUrl.hostname.endsWith('.upstash.io') && redisUrl.protocol === 'redis:') {
    redisUrl.protocol = 'rediss:';
}

const redisClient = createClient({
    url: redisUrl.toString(),
    socket: {
        reconnectStrategy: (retries) => {
            if (retries >= 5) {
                return new Error('Redis connection failed after 5 retries');
            }
            return Math.min((retries + 1) * 50, 500);
        }
    }
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
redisClient.on('connect', () => console.log('⏳ Connecting to Redis...'));
redisClient.on('ready', () => console.log('✅ Redis Connection Successful!'));

const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (err) {
        console.error('❌ Could not connect to Redis:', err);
    }
};

connectRedis();

module.exports = redisClient;

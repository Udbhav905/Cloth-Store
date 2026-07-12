import Redis from "ioredis";

// Connect to Redis (defaults to localhost:6379)
// You can configure this using process.env.REDIS_URL
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  retryStrategy: (times) => {
    // Keep retrying forever, but cap the delay at 5 seconds so it doesn't spam
    const delay = Math.min(times * 500, 5000);
    if (times % 10 === 0) {
      console.error("⚠️ Still trying to connect to Redis...");
    }
    return delay;
  },
  maxRetriesPerRequest: null,
});

redisClient.on("error", (err) => {
  // Catch errors to prevent crash
});

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis successfully");
});

const cache = {
  get: async (key) => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`Cache get error for key ${key}:`, err);
      return null;
    }
  },
  set: async (key, value, ttlSeconds = 1800) => {
    try {
      await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
      console.error(`Cache set error for key ${key}:`, err);
    }
  },
  del: async (key) => {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error(`Cache del error for key ${key}:`, err);
    }
  },
  delPattern: async (pattern) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (err) {
      console.error(`Cache delPattern error for pattern ${pattern}:`, err);
    }
  }
};

export default cache;
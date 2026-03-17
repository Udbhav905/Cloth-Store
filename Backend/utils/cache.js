// utils/cache.js
import NodeCache from "node-cache";

// Cache for 5 minutes, check for expired keys every 60s
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export default cache;
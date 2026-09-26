import Redish from "ioredis";
const redis = new Redish(process.env.REDIS_URL);
export default redis;
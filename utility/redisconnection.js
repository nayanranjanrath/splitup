import Redish from "ioredis";
const redis = new Redish("redis://localhost:6379");
export default redis;
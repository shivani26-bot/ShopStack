import Redis from "ioredis";
console.log(process.env.REDIS_DATABASE_URI!, "ffff");
const redis = new Redis(process.env.REDIS_DATABASE_URI!);

export default redis;

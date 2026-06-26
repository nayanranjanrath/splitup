import redis from "../utility/redisconnection.js";

export const ratelimiter = async(req,res,next)=>{
try {
    const ip = req.ip;
    const key = `limit${ip}`
    let attempts = await redis.get(key)
     if (!attempts) {
            await redis.set(key, 1, "EX", 480); // 8 minutes  is fine i think 
            return next();
        }
         attempts = Number(attempts);
            if (attempts >= 5) {
            return res.status(429).json({
                success: false,
                message: "Too many attempts. Try again later."
            });
        } await redis.incr(key);

        next();


} catch (error) {
    console.log(error)
     return res.status(500).json({ success: false, message: "Internal server error" })

}


}
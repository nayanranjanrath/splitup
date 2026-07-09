import cron from "node-cron"
import platformsharerequestmodel from "../../models/platformsharerequest.model"
import { v2 as cloudinary } from 'cloudinary'


cron.schedule('0 0 * * *',async()=>{
try {
      console.log("Checking expired requests...");

    const expiredRequests = await platformsharerequestmodel.find({
        expiresAt: { $lt: new Date() }
    });

    for (const request of expiredRequests) {

        for (const image of request.proofimage) {

            await cloudinary.uploader.destroy(image.publicId);
        }

        await request.deleteOne();
    }

    console.log("Cleanup completed.");

} catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, message: "Internal server error" });
}
})
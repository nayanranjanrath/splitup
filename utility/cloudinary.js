import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});



console.log(cloudinary.config());

export const uploadtocloudinar = async (localpath) => {
try {
  const result = await cloudinary.uploader.upload(localpath)
  console.log("fille sucessfully uploaded to cloudinary",result)
  fs.unlinkSync(localpath);
  return result
} catch (error) {
       if ( fs.existsSync(localpath)) {
      fs.unlinkSync(localpath);
    }
  console.log(error)
}
}



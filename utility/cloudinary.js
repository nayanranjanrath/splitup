import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'




console.log(cloudinary.config());

export const uploadtocloudinar = async (localpath) => {
try {
  const result = await cloudinary.uploader.upload(localpath,{resource_type:"image"})
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



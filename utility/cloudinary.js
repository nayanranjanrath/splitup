import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadtocloudinar = async (path) => {
try {
  const result = await cloudinary.uploader.upload(path,{resource_type:"auto"})
  console.log("fille sucessfully uploaded to cloudinary",result)
  fs.unlinkSync(Path);
  return result
} catch (error) {
       if (localFilePath && fs.existsSync(Path)) {
      fs.unlinkSync(Path);
    }
  console.log(error)
}
}


export default uploadtocloudinar ;
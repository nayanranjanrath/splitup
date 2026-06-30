import sharp from "sharp";
import path from "path";
export const resize = async (filePath) => {
  const outputPath = `./public/uploads/resized-${Date.now()}.jpg`;
try{
  await sharp(filePath)
    .resize(300, 300, {
      fit: "cover"
    })
    .jpeg({
      quality: 80
    })
    .toFile(outputPath);

  return outputPath;
}
catch(err){
    console.log(err)
    throw err
}}


export const convertToJpg = async (filePath) => {
    const outputPath = filePath.replace(path.extname(filePath), ".jpg");

   try {
     await sharp(filePath)
        .jpeg({
            quality: 95
        })
        .toFile(outputPath);

    return {outputPath};
   } catch (error) {
    console.log(error)
    throw error
   }
};


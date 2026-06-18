import sharp from "sharp";

const resize = async (filePath) => {
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
}}

export default resize;
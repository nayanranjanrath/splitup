import sharp from "sharp";
import fs from "fs";
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


;

export const convertToJpg = async (filePath) => {

    const absolutePath = path.resolve(filePath);

    const outputPath = path.join(
        path.dirname(absolutePath),
        `proof-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    );

    try {

        await sharp(absolutePath)
            .jpeg({
                quality: 90
            })
            .toFile(outputPath);

        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        }

        return {
            outputPath
        };

    } catch (error) {

        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        }

        throw error;
    }
};
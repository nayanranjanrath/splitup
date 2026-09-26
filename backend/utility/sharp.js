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


/* =========================================================
   DELETE FILE SAFELY
========================================================= */

export async function deleteFileSafely(
  filePath,
  retries = 5,
  delay = 200
) {
  if (!filePath || !fs.existsSync(filePath)) {
    return true;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fs.promises.rm(filePath, {
        force: true,
      });

      return true;
    } catch (error) {
      if (
        !["EBUSY", "EPERM", "EACCES"].includes(
          error.code
        )
      ) {
        throw error;
      }

      if (attempt === retries) {
        console.warn(
          `Could not delete file after ${retries} attempts:`,
          filePath,
          error.code
        );

        return false;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }

  return false;
}



export async function convertToJpg(inputPath) {
  if (!inputPath) {
    throw new Error("Input image path is required");
  }

  if (!fs.existsSync(inputPath)) {
    throw new Error(
      `Input image does not exist: ${inputPath}`
    );
  }

  const parsed = path.parse(inputPath);

  const outputPath = path.join(
    parsed.dir,
    `converted-${parsed.name}.jpg`
  );

  

  await sharp(inputPath)
    .rotate()
    .jpeg({
      quality: 85,
      mozjpeg: true,
    })
    .toFile(outputPath);

  return {
    outputPath,
  };
}
const fs = require("fs");
const path = require("path");

const sharp = require("sharp");

const dir = path.resolve("./public/");

const avifOptions = {
  quality: 48,
  effort: 6,
  chromaSubsampling: "4:2:0",
};

const webpOptions = {
  quality: 55,
  alphaQuality: 70,
  speed: 8,
  chromaSubsampling: "4:2:0",
};

const extension = (filename) => filename.split(".")[1];

// const errorHandler = (err) => {
//   if (err) {
//     console.info(err);
//   } else {
//     return;
//   }
// };

function main() {
  fs.readdir(dir, (error, filenames) => {
    if (error) {
      return;
    }
    filenames
      .map((filename) => {
        if (["avif", "webp"].includes(extension(filename))) {
          fs.unlink(`${dir}/${filename}`, () => {
            console.info(`${filename} has been deleted`);
          });
          return "";
        }
        return filename;
      })
      .filter((filename) => {
        return ["jpeg", "png", "jpg"].includes(extension(filename));
      })
      .forEach((filename) => {
        sharp(path.join(dir, filename))
          .toFormat("avif")
          .avif(avifOptions)
          .toFile(`${dir}/${filename.split(".")[0]}.avif`);
        sharp(path.join(dir, filename))
          .toFormat("webp")
          .webp(webpOptions)
          .toFile(`${dir}/${filename.split(".")[0]}.webp`);
      });
  });
}

main();

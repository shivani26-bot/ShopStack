// https://imagekit.io/docs/image-transformation
// https://imagekit.io/docs/ai-transformations

// use image kit for ai enhancements, follow the website url for documentation

export const enhancements = [
  { label: "Remove BG", effect: "e-bgremove" }, //Add a drop shadow around an object in an image using the e-dropshadow transformation parameter. You can control the direction, elevation, and saturation of the light source.
  { label: "Drop Shadow", effect: "e-dropshadow" },
  { label: "Retouch", effect: "e-retouch" }, //Improve the quality of an image using the e-retouch transformation parameter. The input image's resolution must be less than 16 MP.
  { label: "Upscale", effect: "e-upscale" }, //Increase the resolution of an image using the e-upscale transformation parameter. The input image's resolution must be less than 16 MP. The output image's resolution will be 16 MP.
];

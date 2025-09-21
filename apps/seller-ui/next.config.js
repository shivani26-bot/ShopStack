// file is where you configure custom behavior for your app.It sits in the root of your project and exports a config object.

//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  //specifically for the Next.js <Image /> component.
  //   Next.js <Image /> optimizes images (automatic resizing, lazy loading, WebP conversion, etc.).
  // For security reasons, Next.js doesn’t allow optimization of images from any random external domain.
  // You must explicitly whitelist external domains you want to load images from.
  //   So if you’re storing images on ImageKit and using <Image src="https://ik.imagekit.io/..."/>, Next.js will:
  // Fetch the image from ik.imagekit.io
  // Optimize it (resize, format, cache)
  // Serve it via Next.js’ image optimizer
  // Without this, Next.js will throw an error like:
  // Invalid src prop (https://ik.imagekit.io/...) on <Image>, hostname is not configured under images in your next.config.js
  images: {
    remotePatterns: [{ hostname: "ik.imagekit.io" }], //allow Next.js to optimize images from ImageKit
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);

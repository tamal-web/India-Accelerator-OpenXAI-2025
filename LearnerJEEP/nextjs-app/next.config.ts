// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   devIndicators: false,
// };

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/((?!api/).*)",
        destination: "/static-app-shell",
      },
    ];
  },
  // devIndicators: true,
};

export default nextConfig;

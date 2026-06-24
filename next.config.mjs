/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // sharp + png-to-ico are native modules — keep them external to the server bundle
    serverComponentsExternalPackages: ["sharp", "png-to-ico"],
  },
  async redirects() {
    return [
      // The app is the generator — send the root straight to it.
      { source: "/", destination: "/generator", permanent: false },
    ];
  },
};

export default nextConfig;

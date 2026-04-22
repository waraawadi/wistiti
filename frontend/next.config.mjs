/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** Image Docker plus légère (node server.js) */
  output: "standalone",
  /** Lib React FedaPay (class components / CJS) — voir https://docs.fedapay.com/sdks/fr/reactjs-fr */
  transpilePackages: ["fedapay-reactjs"],
  async redirects() {
    return [
      {
        source: "/dashboard/evenements/nouveau",
        destination: "/dashboard/evenements",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Bật hỗ trợ WebAssembly không đồng bộ và Top Level Await
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    if (isServer) {
      config.output.webassemblyModuleFilename = './../static/wasm/[modulehash].wasm';
    } else {
      config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;

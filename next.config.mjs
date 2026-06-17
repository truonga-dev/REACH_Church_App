import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  allowedDevOrigins: [
    '192.168.1.7',
    '192.168.1.0/24',
    'localhost',
    '127.0.0.1',
  ],
};

export default withPWA(nextConfig);

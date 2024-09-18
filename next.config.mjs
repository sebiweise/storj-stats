/** @type {import('next').NextConfig} */
const nextConfig = {
    ...(process.env.NEXT_BUILD_OUTPUT && {
        output: process.env.NEXT_BUILD_OUTPUT
    })
};

export default nextConfig;

import dotenv from 'dotenv';
dotenv.config();

if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in the environment variables");
}

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not defined in the environment variables");
}

if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is not defined in the environment variables");
}

if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET is not defined in the environment variables");
}

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is not defined in the environment variables");
}

if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not defined in the environment variables");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_SECRET is not defined in the environment variables");
}

if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("GOOGLE_REFRESH_TOKEN is not defined in the environment variables");
}

if (!process.env.GOOGLE_USER) {
    throw new Error("GOOGLE_USER is not defined in the environment variables");
}

const config = {
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL || 'info',
    mongodbUri: process.env.MONGODB_URI,
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    imagekitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    googleUser: process.env.GOOGLE_USER,
    
    testQueueId: process.env.TEST_QUEUE_ID,
    testStaff1AccessToken: process.env.TEST_STAFF_1_ACCESS_TOKEN,
    testStaff2AccessToken: process.env.TEST_STAFF_2_ACCESS_TOKEN,

    clientUrl: process.env.CLIENT_URL || "http://localhost:5173"
};

export default config;
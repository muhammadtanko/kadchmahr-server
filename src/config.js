require("dotenv").config();

const {
    APP_PORT, MONGO_URI, JWT_KEY,
    CLOUDFLARE_BUCKET, CLOUDFLARE_ACCESS_KEY_ID,
    CLOUDFLARE_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DOMAIN,
} = process.env;

module.exports = {
    appPort: APP_PORT || 5000,
    mongoURI: MONGO_URI,
    webToken: {
        secretKey: JWT_KEY,
        expiresIn: "8h",
    },
    cloudFlareBucket: CLOUDFLARE_BUCKET,
    cloudFlareAccessKey: CLOUDFLARE_ACCESS_KEY_ID,
    cloudFlareSecret: CLOUDFLARE_SECRET_ACCESS_KEY,
    cloudFlareAccountId: CLOUDFLARE_ACCOUNT_ID,
    cloudFlareDomain: CLOUDFLARE_DOMAIN,
};

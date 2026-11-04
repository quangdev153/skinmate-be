const crypto = require('crypto');
const https = require('https');

const requiredConfig = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

function getConfig() {
    const missing = requiredConfig.filter((key) => !process.env[key]);
    if (missing.length) {
        const error = new Error(`Cloudinary is not configured. Missing: ${missing.join(', ')}`);
        error.code = 'CLOUDINARY_NOT_CONFIGURED';
        throw error;
    }
    return {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    };
}

function createSignature(params, secret) {
    const payload = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&');
    return crypto.createHash('sha1').update(payload + secret).digest('hex');
}

function appendField(chunks, boundary, name, value) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
}

function uploadToCloudinary(file, folder = 'skinmate/collection') {
    const config = getConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { folder, timestamp };
    const boundary = `----SkinMate${crypto.randomBytes(12).toString('hex')}`;
    const chunks = [];

    appendField(chunks, boundary, 'api_key', config.apiKey);
    appendField(chunks, boundary, 'folder', folder);
    appendField(chunks, boundary, 'timestamp', timestamp);
    appendField(chunks, boundary, 'signature', createSignature(params, config.apiSecret));
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="skinmate-image"\r\nContent-Type: ${file.mimetype}\r\n\r\n`));
    chunks.push(file.buffer);
    chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    const body = Buffer.concat(chunks);

    return new Promise((resolve, reject) => {
        const request = https.request({
            method: 'POST',
            hostname: 'api.cloudinary.com',
            path: `/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length,
            },
        }, (response) => {
            let responseBody = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => { responseBody += chunk; });
            response.on('end', () => {
                let payload;
                try { payload = JSON.parse(responseBody); } catch { payload = null; }
                if (response.statusCode >= 200 && response.statusCode < 300 && payload?.secure_url) {
                    resolve({ secureUrl: payload.secure_url, publicId: payload.public_id });
                    return;
                }
                const error = new Error(payload?.error?.message || 'Cloudinary image upload failed');
                error.code = 'CLOUDINARY_UPLOAD_FAILED';
                error.statusCode = response.statusCode;
                reject(error);
            });
        });
        request.setTimeout(30000, () => request.destroy(new Error('Cloudinary upload timed out')));
        request.on('error', reject);
        request.write(body);
        request.end();
    });
}

module.exports = { uploadToCloudinary };

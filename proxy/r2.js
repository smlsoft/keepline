/**
 * Cloudflare R2 Storage — upload/download/delete ไฟล์
 * ใช้แทนการเก็บ base64 ใน MongoDB (ช้า + ใหญ่เกินไป)
 */
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "openclaw-images";

let client;

function getR2Client() {
  if (!client) {
    if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return null; // R2 ไม่ได้ config → fallback
    }
    client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

/**
 * Upload ไฟล์ไป R2
 * @param {string} sourceId - LINE sourceId (แยก folder ตามคน)
 * @param {string} filename - ชื่อไฟล์
 * @param {Buffer} data - ข้อมูลไฟล์
 * @param {string} mimeType - content type
 * @returns {string|null} r2Key หรือ null ถ้า R2 ไม่พร้อม
 */
async function uploadToR2(sourceId, filename, data, mimeType) {
  const s3 = getR2Client();
  if (!s3) return null;

  const key = `${sourceId}/${Date.now()}-${filename}`;
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: data,
    ContentType: mimeType,
  }));
  return key;
}

/**
 * สร้าง signed URL สำหรับดูไฟล์ (1 ชั่วโมง)
 */
async function getR2SignedUrl(key) {
  const s3 = getR2Client();
  if (!s3) return null;
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }), { expiresIn: 3600 });
}

/**
 * ลบไฟล์จาก R2
 */
async function deleteFromR2(key) {
  const s3 = getR2Client();
  if (!s3) return;
  await s3.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));
}

/**
 * เช็คว่า R2 พร้อมใช้งานหรือไม่
 */
function isR2Ready() {
  return !!(R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

module.exports = { uploadToR2, getR2SignedUrl, deleteFromR2, isR2Ready };

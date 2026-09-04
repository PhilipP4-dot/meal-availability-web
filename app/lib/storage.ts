import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const bucket = process.env.BUCKET ?? process.env.AWS_S3_BUCKET_NAME;
const endpoint = process.env.ENDPOINT ?? process.env.AWS_ENDPOINT_URL;
const accessKeyId = process.env.ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.REGION ?? process.env.AWS_DEFAULT_REGION ?? "auto";

function storage() {
  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Railway bucket credentials are not configured.");
  }
  return {
    bucket,
    client: new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: process.env.AWS_S3_URL_STYLE === "path",
    }),
  };
}

export async function uploadMealImage(key: string, bytes: Uint8Array, contentType: string) {
  const { client, bucket: bucketName } = storage();
  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: bytes,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
}

export async function getMealImage(key: string) {
  const { client, bucket: bucketName } = storage();
  return client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
}

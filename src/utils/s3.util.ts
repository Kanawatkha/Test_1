// utils/s3.util.ts
import { S3Client, GetObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import ApplicationConfig from "../configs/application.config";

const s3Client = new S3Client({
  region: ApplicationConfig.aws.awsRegion,
});

/**
 * แปลง Stream เป็น string
 */
const streamToString = async (stream: Readable): Promise<string> => {
  return await new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
};

/**
 * ดึงไฟล์จาก S3 แล้วคืนค่าเป็น string
 */
export const getFileFromS3 = async (
  bucketName: string,
  key: string
): Promise<string | null> => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return null;
    }

    const bodyContents = await streamToString(response.Body as Readable);
    return bodyContents;
  } catch (error: any) {
    if (isS3NotFound(error)) {
      return null;
    }
    throw error;
  }
};



// Helper: detect not-found
const isS3NotFound = (err: unknown): boolean => {
  // AWS SDK v3 บางทีเป็น err.name === 'NoSuchKey'
  // หรือ err.$metadata?.httpStatusCode === 404
  // และบางกรณีเป็น S3ServiceException (client v3)
  const anyErr = err as any;
  if (anyErr?.name === "NoSuchKey") return true;
  if (anyErr?.Code === "NoSuchKey") return true;
  if (anyErr?.$metadata?.httpStatusCode === 404) return true;
  if (anyErr instanceof S3ServiceException && anyErr.$metadata?.httpStatusCode === 404) return true;
  return false;
};

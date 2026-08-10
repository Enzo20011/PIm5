import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { filename, filetype } = req.body;
    if (!filename || !filetype) {
      return res.status(400).json({ message: 'Missing filename or filetype' });
    }

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });

    const uniqueId = uuidv4();
    const extension = filename.split('.').pop();
    const key = `products/${uniqueId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      ContentType: filetype,
    });

    // La URL firmada expira en 60 segundos
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    res.status(200).json({
      url: presignedUrl,
      key,
      publicUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
    });
  } catch (error) {
    console.error('S3 Presign Error:', error);
    res.status(500).json({ message: 'Error generating presigned URL' });
  }
}

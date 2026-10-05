import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Solo imágenes. La extensión sale de acá y no del nombre que manda el cliente.
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// Verifica el ID token de Firebase y que el usuario sea admin, sin firebase-admin:
// 1) Identity Toolkit valida el token y devuelve el uid.
// 2) Se lee users/{uid} en Firestore con ese mismo token, así que aplican las reglas
//    de seguridad (cada usuario solo puede leer su propio perfil).
async function isAdminToken(idToken: string): Promise<boolean> {
  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) throw new Error('Faltan FIREBASE_API_KEY / FIREBASE_PROJECT_ID en el servidor');

  const lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!lookup.ok) return false;
  const uid = (await lookup.json()).users?.[0]?.localId;
  if (!uid) return false;

  const profile = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  if (!profile.ok) return false;
  return (await profile.json()).fields?.role?.stringValue === 'admin';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const idToken = (req.headers?.authorization || '').replace(/^Bearer /, '');
    if (!idToken) {
      return res.status(401).json({ message: 'Falta el token de autenticación' });
    }
    if (!(await isAdminToken(idToken))) {
      return res.status(403).json({ message: 'Solo los administradores pueden subir imágenes' });
    }

    const { filetype, size } = req.body || {};
    const extension = ALLOWED_TYPES[filetype];
    if (!extension) {
      return res.status(400).json({ message: 'Tipo de archivo no permitido (solo JPG, PNG, WEBP o GIF)' });
    }
    if (typeof size === 'number' && size > MAX_SIZE_BYTES) {
      return res.status(400).json({ message: 'La imagen supera los 5 MB' });
    }

    const region = process.env.AWS_REGION || 'us-east-1';
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });

    const key = `products/${uuidv4()}.${extension}`;

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
      publicUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`
    });
  } catch (error) {
    console.error('S3 Presign Error:', error);
    res.status(500).json({ message: 'Error generating presigned URL' });
  }
}

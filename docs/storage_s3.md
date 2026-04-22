## Option A — AWS S3 (+ CloudFront)

### Variables à mettre dans `.env` (VPS)
- **`STORAGE_BACKEND=s3`**
- `AWS_ACCESS_KEY_ID=...`
- `AWS_SECRET_ACCESS_KEY=...`
- `BUCKET_NAME=mon-bucket`
- `AWS_S3_REGION_NAME=eu-west-3` (exemple)
- `AWS_S3_ENDPOINT_URL=` (vide sur AWS)

### Bucket policy (JSON) — exemple (lecture publique des objets)
À adapter avec ton nom de bucket.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mon-bucket/*"
    }
  ]
}
```

### CloudFront devant S3
- **Origin**: bucket S3
- **Default behavior**: cache assets (images/vidéos)
- **CORS**: autoriser les origin du frontend (ex: `https://example.com`)
- **Conseil**: si tu veux protéger certaines URLs, il faut signer (CloudFront signed URLs). Ici on reste simple.


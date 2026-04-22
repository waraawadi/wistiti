## Option B — Cloudflare R2 (+ CDN intégré)

### Variables à mettre dans `.env` (VPS)
- **`STORAGE_BACKEND=r2`**
- `AWS_ACCESS_KEY_ID=...` (R2 Access Key)
- `AWS_SECRET_ACCESS_KEY=...` (R2 Secret)
- `BUCKET_NAME=mon-bucket`
- `AWS_S3_REGION_NAME=auto`
- **`R2_ENDPOINT_URL=https://{ACCOUNT_ID}.r2.cloudflarestorage.com`**
- (optionnel) `AWS_S3_ADDRESSING_STYLE=virtual`

### CORS bucket R2 (exemple)
Dans Cloudflare R2 (Bucket → Settings → CORS):

```json
[
  {
    "AllowedOrigins": ["https://example.com"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### CDN
R2 s'intègre avec Cloudflare. Si tu exposes tes objets via un domaine (ex: `cdn.example.com`), configure le routing côté Cloudflare.


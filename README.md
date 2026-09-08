# AWS Serverless Image Thumbnail Generator

A fully serverless image-processing web app on AWS. Users pick an image in the browser, it's uploaded to S3, and a Lambda function automatically generates an optimized thumbnail using Python and Pillow — no servers to manage.

![AWS Serverless Thumbnail Generator Web Application](screenshots/aws-thumbnail.jpg)

---

## What It Does

- Select and preview an image directly in the browser
- Upload securely to S3 via a presigned URL (no AWS credentials ever touch the frontend)
- Automatically trigger thumbnail generation on upload (`s3:ObjectCreated`)
- Resize to a max of **300×300px** while preserving aspect ratio
- Display the generated thumbnail on the page — no manual refresh needed
- Download the thumbnail straight from the browser

```
Choose Image → Upload to S3 → Lambda Processing → Thumbnail Stored
             → Displayed in Browser → Download
```

---

## Architecture

![Architecture Diagram](screenshots/architecture-diagram.png)

```
Browser (S3 static site)
        │
        ▼
  API Gateway ──▶ Upload Lambda ──▶ Presigned URL ──▶ Browser
                                                          │
                                                    PUT image
                                                          ▼
                                                 Source S3 Bucket
                                                          │
                                              s3:ObjectCreated event
                                                          ▼
                                          Thumbnail Processor Lambda
                                              (Python + Pillow)
                                                          │
                                        ┌─────────────────┴─────────────────┐
                                        ▼                                   ▼
                              Destination S3 Bucket                 CloudWatch Logs
                               (thumbnails/*.jpg)
                                        │
                                        ▼
                         API Gateway ──▶ Upload Lambda ──▶ Browser (preview + download)
```

**Why presigned URLs?** The browser never holds AWS credentials. It asks the Upload Lambda for a short-lived, single-use URL and uploads directly to S3 with it.

**Why event-driven?** S3 fires an `ObjectCreated` event on every upload, invoking the processor Lambda on demand — no polling, no idle compute.

---

## How It Works

### 1. Frontend (S3 Static Website)
Plain HTML/CSS/JS, hosted on S3 Static Website Hosting. Handles image selection, preview, upload orchestration, polling for the finished thumbnail, and download.

### 2. API Gateway
An HTTP API that exposes the public endpoint the frontend talks to, fronting the Lambda backend.

### 3. Upload API Lambda
- Generates a unique S3 object key
- Returns a presigned URL so the browser can `PUT` the image directly to the source bucket
- Later, checks whether the corresponding thumbnail exists and returns it

### 4. Source S3 Bucket
Receives the original upload and emits an `s3:ObjectCreated:*` event, which invokes the processor Lambda.

### 5. Thumbnail Processor Lambda
- Parses the S3 event for bucket + key
- Downloads the image (`s3:GetObject`) into memory via `BytesIO`
- Resizes with Pillow, preserving aspect ratio:

  ```python
  image.thumbnail((300, 300))
  ```

  (`thumbnail()` caps both dimensions at 300px without distorting the image, unlike a hard resize.)
- Converts to JPEG and uploads to the destination bucket under `thumbnails/`

```
thumbnails/
├── image1-thumbnail.jpg
├── image2-thumbnail.jpg
└── image3-thumbnail.jpg
```

### 6. Frontend polling
After upload, the frontend polls the API for the processed thumbnail and renders it automatically once available — the user never has to open S3 or refresh the page.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Hosting | Amazon S3 Static Website Hosting |
| API | Amazon API Gateway (HTTP API) |
| Compute | AWS Lambda (Python) |
| Image processing | Pillow |
| Storage | Amazon S3 (separate source/destination buckets) |
| Secure upload | S3 Presigned URLs |
| Trigger | S3 Event Notifications |
| Access control | AWS IAM |
| Monitoring | Amazon CloudWatch |
| Regions | Website: `ap-south-2` (Hyderabad) · Processing: `us-east-1` (N. Virginia) |

---

## Project Structure

```
aws-serverless-thumbnail-generator/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── lambda/
│   ├── upload_api/
│   │   └── lambda_function.py
│   └── thumbnail_processor/
│       └── lambda_function.py
├── screenshots/
├── requirements.txt
├── .gitignore
└── README.md
```

---

## IAM Permissions

Least-privilege roles scoped per function:

**Upload API Lambda** — generates presigned URLs, checks for finished thumbnails
```
s3:PutObject   (source bucket)
s3:GetObject   (destination bucket)
```

**Thumbnail Processor Lambda** — reads originals, writes thumbnails
```
s3:GetObject
s3:PutObject
logs:CreateLogGroup
logs:CreateLogStream
logs:PutLogEvents
```

![IAM Role Permissions](screenshots/iam-role-permissions.png)

---

## Security Design

- No AWS credentials in frontend JavaScript — ever
- Browser interacts with S3 only via short-lived presigned URLs
- Source and destination buckets are private (no public access)
- Website-hosting bucket kept separate from image-storage buckets
- CORS scoped to the required origins/methods only

```
Browser → API Gateway → Lambda → Presigned URL → Direct S3 PUT/GET
```

---

## Monitoring

All Lambda invocations log to CloudWatch, used here to confirm successful runs, debug S3/Lambda/API Gateway integration issues, and trace the event-driven flow end to end.

![CloudWatch Logs](screenshots/cloudwatch-logs.png)

---

## Deployment Steps

1. Create separate S3 buckets for source images and thumbnails
2. Build the thumbnail processor Lambda; attach a Pillow layer
3. Set `DESTINATION_BUCKET` as an environment variable
4. Attach least-privilege IAM permissions
5. Configure `s3:ObjectCreated` event notification → processor Lambda
6. Test with a direct S3 upload
7. Create and configure the static website S3 bucket
8. Build the HTML/CSS/JS frontend
9. Build the Upload API Lambda + API Gateway HTTP API
10. Wire the frontend to API Gateway; implement presigned uploads
11. Configure CORS
12. Add polling for thumbnail availability, preview, and download
13. Test the full browser-to-AWS workflow end to end

---

## What I Learned

- Designing an event-driven serverless architecture on AWS
- Wiring S3 → Lambda → S3 pipelines with presigned URLs
- Building and securing an HTTP API with API Gateway
- Processing images in-memory with Python/Pillow and `BytesIO`
- Scoping IAM roles to least privilege across multiple functions
- Debugging distributed serverless systems with CloudWatch Logs
- Handling async workflows on the frontend (upload → poll → display)

---

## Key AWS Concepts

`S3` · `Lambda` · `API Gateway` · `IAM` · `CloudWatch` · `Presigned URLs` · `S3 Static Hosting` · `S3 Event Notifications` · `Lambda Layers` · `CORS` · `Event-Driven Architecture`

# AWS Serverless Image Thumbnail Generator

A serverless image-processing web application built on AWS that allows users to upload an image from a browser, automatically generate an optimized thumbnail, preview the result, and download the generated thumbnail.

The application combines a static frontend with an event-driven AWS backend using **Amazon S3, Amazon API Gateway, AWS Lambda, Python, Pillow, IAM, and Amazon CloudWatch**.

---

## Features

- Browser-based image upload
- Static frontend hosted using Amazon S3
- Secure uploads using S3 presigned URLs
- Amazon API Gateway integration
- AWS Lambda serverless backend
- Event-driven thumbnail generation
- Maximum thumbnail size of **300×300 pixels**
- Original image aspect ratio preserved
- Automatic thumbnail preview
- Download generated thumbnail
- Private source and destination S3 buckets
- CloudWatch logging and monitoring
- No servers to provision or manage

---

## Architecture

![AWS Serverless Thumbnail Generator Architecture](screenshots/architecture-diagram.png)

### Architecture Flow

```text
User Browser
     │
     ▼
Amazon S3 Static Website
     │
     ▼
Amazon API Gateway
     │
     ▼
Upload API Lambda
     │
     │ Generates Presigned PUT URL
     ▼
Amazon S3
Original Image Bucket
     │
     │ s3:ObjectCreated Event
     ▼
Thumbnail Processor Lambda
(Python + Pillow)
     │
     ├──────────────► Amazon CloudWatch
     │                 Logs & Monitoring
     ▼
Amazon S3
Thumbnail Bucket
     │
     ▼
Presigned GET URL
     │
     ▼
Browser Preview
     │
     ▼
Download Thumbnail
```

---

## How It Works

1. The user opens the static web application hosted on Amazon S3.
2. The user selects an image from their device.
3. The frontend sends a request to Amazon API Gateway.
4. API Gateway invokes the upload API Lambda function.
5. Lambda generates a temporary S3 presigned upload URL.
6. The browser uploads the image directly to the private source S3 bucket.
7. The S3 upload generates an `s3:ObjectCreated:*` event.
8. Amazon S3 automatically invokes the thumbnail processor Lambda.
9. Lambda retrieves the uploaded image from S3.
10. Python and Pillow resize the image to fit within **300×300 pixels while preserving its aspect ratio**.
11. The generated JPEG thumbnail is stored in the destination S3 bucket under the `thumbnails/` prefix.
12. The frontend checks for the generated thumbnail.
13. Once available, the thumbnail is automatically displayed on the website.
14. The user can download the generated thumbnail directly from the browser.

---

## Tech Stack

| Component | Technology / AWS Service |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Static Website Hosting | Amazon S3 |
| API Layer | Amazon API Gateway |
| Serverless Compute | AWS Lambda |
| Object Storage | Amazon S3 |
| Image Processing | Python, Pillow |
| Secure File Access | S3 Presigned URLs |
| Event Processing | S3 Event Notifications |
| Access Control | AWS IAM |
| Monitoring & Logging | Amazon CloudWatch |
| Architecture | Serverless / Event-Driven |

---

## Serverless Backend

The backend contains two main Lambda responsibilities.

### Upload API Lambda

The upload API Lambda is connected to Amazon API Gateway.

It is responsible for:

- Receiving requests from the frontend
- Generating unique S3 object keys
- Creating presigned PUT URLs for image uploads
- Checking whether generated thumbnails are available
- Generating temporary URLs for retrieving thumbnails

This allows the frontend to interact with private S3 buckets without exposing AWS credentials in the browser.

### Thumbnail Processor Lambda

The thumbnail processor Lambda is automatically triggered by Amazon S3.

It:

- Reads the S3 event payload
- Extracts the source bucket and object key
- Retrieves the uploaded image using `s3:GetObject`
- Processes the image in memory using Python `BytesIO`
- Uses Pillow to resize the image
- Preserves the original aspect ratio
- Converts the processed image to JPEG
- Stores the generated thumbnail using `s3:PutObject`

Generated thumbnails follow the structure:

```text
thumbnails/<filename>-thumbnail.jpg
```

---

## Secure Upload Using Presigned URLs

The source image bucket remains private.

Instead of allowing public uploads directly to the bucket, the frontend requests a temporary **presigned PUT URL** from the serverless backend.

```text
Browser
   │
   │ Request Upload URL
   ▼
API Gateway
   │
   ▼
AWS Lambda
   │
   │ Generate Presigned URL
   ▼
Browser ─────────────► Private Amazon S3
        Direct Upload
```

This design means:

- AWS credentials are not stored in frontend JavaScript.
- The source image bucket does not require public write access.
- Upload URLs are temporary.
- S3 handles the actual image upload directly.

Generated thumbnails are also retrieved using temporary presigned URLs.

---

## Event-Driven Processing

Thumbnail generation is asynchronous and event-driven.

```text
Image Uploaded
      │
      ▼
Amazon S3
      │
      │ ObjectCreated
      ▼
AWS Lambda
      │
      ▼
Process Image
      │
      ▼
Thumbnail S3 Bucket
```

The frontend does not need to directly invoke the thumbnail processor.

Amazon S3 automatically triggers the processing Lambda whenever a new image is uploaded.

---

## IAM Permissions

Lambda execution roles provide the permissions required for each function to interact with AWS services.

Important permissions include:

- `s3:GetObject` — retrieve images and generated thumbnails
- `s3:PutObject` — upload/store objects in S3
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

IAM permissions should follow the **principle of least privilege** and be scoped to the required S3 resources.

---

## CORS Configuration

The frontend and backend communicate across different AWS endpoints.

Cross-Origin Resource Sharing (**CORS**) is configured to allow the required browser requests between:

```text
S3 Static Website
        │
        ├──► API Gateway
        │
        └──► Amazon S3 Presigned URL
```

Only the required HTTP operations are allowed while the source and destination image buckets remain private.

---

## Project Structure

```text
aws-serverless-thumbnail-generator/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── lambda/
│   ├── upload_api/
│   │   └── lambda_function.py
│   │
│   └── thumbnail_processor/
│       └── lambda_function.py
│
├── screenshots/
│   ├── architecture-diagram.png
│   ├── aws-thumbnail.jpg
│   ├── api-gateway.png
│   ├── upload-api-lambda.png
│   ├── s3-event-trigger-config.png
│   ├── lambda-function-code.png
│   ├── cloudwatch-logs.png
│   ├── iam-role-permissions.png
│   └── before-after-thumbnail.png
│
├── lambda_function.py
├── requirements.txt
├── .gitignore
└── README.md
```

---

## Deployment Overview

1. Created separate S3 buckets for original images and generated thumbnails.
2. Created an additional S3 bucket for the static web application.
3. Enabled S3 static website hosting.
4. Built the frontend using HTML, CSS, and JavaScript.
5. Created an Amazon API Gateway HTTP API.
6. Created an upload API Lambda function.
7. Implemented S3 presigned URL generation.
8. Configured CORS for browser requests.
9. Created the thumbnail processor Lambda function.
10. Added Pillow for image processing.
11. Configured an S3 `ObjectCreated` event notification.
12. Connected the source S3 bucket to the thumbnail processor Lambda.
13. Configured IAM permissions for S3 and CloudWatch.
14. Connected the frontend to API Gateway.
15. Implemented automatic checking for generated thumbnails.
16. Added browser preview functionality.
17. Added thumbnail download functionality.
18. Tested the complete browser-to-AWS workflow.

---

# Screenshots

## Working Web Application

The completed application showing the original uploaded image alongside the automatically generated thumbnail.

The generated thumbnail can also be downloaded directly from the browser.

![Working Serverless Thumbnail Generator](screenshots/aws-thumbnail.jpg)

---

## API Gateway

Amazon API Gateway provides the HTTP API used by the frontend to communicate with the serverless backend.

![Amazon API Gateway](screenshots/api-gateway.png)

---

## Upload API Lambda

The upload API Lambda generates presigned URLs and handles requests from the frontend through API Gateway.

![Upload API Lambda](screenshots/upload-api-lambda.png)

---

## S3 Event Trigger

Amazon S3 automatically invokes the thumbnail processor when a new image is uploaded.

![S3 Event Trigger Configuration](screenshots/s3-event-trigger-config.png)

---

## Thumbnail Processor Lambda

The processing Lambda uses Python and Pillow to resize uploaded images and generate thumbnails.

![Lambda Function Code](screenshots/lambda-function-code.png)

---

## CloudWatch Logs

Lambda execution information and errors are captured using Amazon CloudWatch Logs.

![CloudWatch Logs](screenshots/cloudwatch-logs.png)

---

## IAM Role Permissions

AWS IAM controls the permissions Lambda functions use when accessing S3 and CloudWatch.

![IAM Role Permissions](screenshots/iam-role-permissions.png)

---

## Original Image vs Generated Thumbnail

Example showing the original image and the automatically generated thumbnail.

![Original Image vs Generated Thumbnail](screenshots/before-after-thumbnail.png)

---

## Security Design

The project demonstrates several AWS security practices:

- Source images are stored in a private S3 bucket.
- Generated thumbnails are stored in a private S3 bucket.
- Browser uploads use temporary S3 presigned URLs.
- AWS credentials are never stored in frontend JavaScript.
- Lambda functions use IAM execution roles.
- IAM permissions are scoped to required AWS resources.
- CORS controls browser requests between different origins.
- Public access is limited to the static website content required for the application.

---

## What I Learned

Through this project, I gained hands-on experience with:

- Designing a serverless web application on AWS
- Building event-driven architectures with Amazon S3 and AWS Lambda
- Hosting a frontend using S3 static website hosting
- Connecting JavaScript applications to Amazon API Gateway
- Generating and using S3 presigned URLs
- Uploading files securely from a browser to private S3 buckets
- Processing images using Python and Pillow
- Configuring S3 Event Notifications
- Working with IAM execution roles and permissions
- Configuring CORS for browser-based AWS applications
- Monitoring and troubleshooting Lambda with CloudWatch
- Handling asynchronous image-processing workflows
- Connecting multiple AWS services into an end-to-end application

---

## Key AWS Concepts Demonstrated

`Amazon S3` • `AWS Lambda` • `Amazon API Gateway` • `AWS IAM` • `Amazon CloudWatch` • `S3 Presigned URLs` • `S3 Event Notifications` • `S3 Static Website Hosting` • `CORS` • `Event-Driven Architecture` • `Serverless Computing`

---

## Project Result

The final application provides an end-to-end serverless workflow:

```text
Select Image
     ↓
Upload from Browser
     ↓
Secure S3 Upload
     ↓
Automatic Lambda Processing
     ↓
Thumbnail Generated
     ↓
Displayed in Browser
     ↓
Download Thumbnail
```

The entire image-processing workflow runs using managed AWS services without requiring a continuously running application server.

---

Built as a hands-on AWS project to strengthen practical knowledge of **serverless architecture, event-driven systems, API integration, secure S3 access, IAM, and cloud monitoring**.

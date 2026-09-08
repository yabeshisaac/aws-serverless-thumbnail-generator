# AWS Serverless Image Thumbnail Generator

A serverless image-processing web application built on AWS that allows users to upload an image from a browser, automatically generate an optimized thumbnail, preview the result, and download the generated thumbnail.

The project combines a static frontend with an event-driven AWS backend using **Amazon S3, Amazon API Gateway, AWS Lambda, Python, Pillow, IAM, and CloudWatch**.

## Features

- Browser-based image upload
- Static frontend hosted on Amazon S3
- Secure image upload using S3 presigned URLs
- API Gateway integration with AWS Lambda
- Automatic event-driven thumbnail generation
- Maximum thumbnail size of **300×300 pixels**
- Original aspect ratio preserved
- Automatic thumbnail preview in the browser
- Download generated thumbnail
- Private source and destination image buckets
- CloudWatch logging and monitoring
- No servers to provision or manage

## Architecture

![AWS Serverless Thumbnail Generator Architecture](screenshots/architecture-diagram.png)

### Application Flow

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
     │
     ▼
Amazon S3
Thumbnail Bucket
     │
     ▼
Presigned GET URL
     │
     ▼
Browser Preview / Download
```

## How It Works

1. The user opens the static web application hosted on Amazon S3.
2. The user selects an image from their device.
3. The frontend sends a request to Amazon API Gateway.
4. API Gateway invokes the upload API Lambda function.
5. The Lambda function generates a presigned S3 upload URL.
6. The browser uploads the original image directly to the private source S3 bucket.
7. The upload generates an `s3:ObjectCreated:*` event.
8. Amazon S3 automatically invokes the thumbnail-processing Lambda function.
9. The Lambda function retrieves and processes the image using Python and Pillow.
10. The image is resized to fit within **300×300 pixels while preserving its aspect ratio**.
11. The generated JPEG thumbnail is stored in the destination S3 bucket under the `thumbnails/` prefix.
12. The frontend checks for the generated thumbnail and displays it automatically.
13. The user can download the generated thumbnail directly from the web application.

## Tech Stack

| Component | Technology / AWS Service |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Website Hosting | Amazon S3 Static Website Hosting |
| API Layer | Amazon API Gateway |
| Serverless Compute | AWS Lambda |
| Object Storage | Amazon S3 |
| Image Processing | Python, Pillow |
| Secure Upload / Download | S3 Presigned URLs |
| Event Processing | S3 Event Notifications |
| Access Control | AWS IAM |
| Monitoring & Logging | Amazon CloudWatch |
| Architecture | Serverless / Event-Driven |

## Serverless Backend

The application uses two main Lambda responsibilities.

### Upload API Lambda

The upload API Lambda is invoked through Amazon API Gateway.

It:

- Receives image upload requests from the frontend.
- Generates unique S3 object keys.
- Creates presigned URLs for secure browser-to-S3 uploads.
- Checks for generated thumbnails.
- Provides temporary URLs that allow the frontend to retrieve generated images.

This allows the browser to communicate with private S3 buckets without storing AWS credentials in frontend code.

### Thumbnail Processor Lambda

The thumbnail-processing Lambda is automatically invoked by an S3 `ObjectCreated` event.

It:

- Extracts the source bucket and object key from the S3 event.
- Retrieves the uploaded image using `s3:GetObject`.
- Processes the image in memory using Python `BytesIO`.
- Uses Pillow to resize the image.
- Preserves the original image aspect ratio.
- Generates a JPEG thumbnail.
- Stores the result in the destination S3 bucket using `s3:PutObject`.

Generated objects follow the structure:

```text
thumbnails/<filename>-thumbnail.jpg
```

## Presigned URL Upload

The source image bucket remains private.

Instead of exposing the bucket publicly, the frontend requests a temporary **presigned PUT URL** from the backend.

```text
Browser
   │
   │ Request upload URL
   ▼
API Gateway
   │
   ▼
Lambda
   │
   │ Generate presigned URL
   ▼
Browser ─────────► Private S3 Bucket
       Direct PUT
```

This avoids placing AWS credentials in the browser and prevents the source bucket from requiring public write access.

Generated thumbnails are also accessed through temporary presigned URLs.

## IAM Permissions

Lambda execution roles provide only the AWS permissions required by each function.

Important permissions include:

- `s3:GetObject` — retrieve source images and generated thumbnails
- `s3:PutObject` — upload images and store generated thumbnails
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

IAM permissions should follow the **principle of least privilege** and be scoped to the required S3 resources.

## CORS Configuration

Because the frontend is hosted from an S3 website endpoint while uploads are performed against another S3 bucket, Cross-Origin Resource Sharing (CORS) is configured for browser-based uploads.

The configuration permits the required HTTP operations from the web application's origin while the image-processing buckets remain private.

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
│   ├── website-thumbnail-generator.png
│   ├── api-gateway.png
│   ├── upload-api-lambda.png
│   ├── s3-event-trigger-config.png
│   ├── lambda-function-code.png
│   ├── cloudwatch-logs.png
│   ├── iam-role-permissions.png
│   └── before-after-thumbnail.png
│
├── requirements.txt
├── .gitignore
└── README.md
```

## Deployment Overview

1. Created separate S3 buckets for original images and generated thumbnails.
2. Created an additional S3 bucket to host the static frontend.
3. Enabled S3 static website hosting for the frontend.
4. Built the frontend using HTML, CSS, and JavaScript.
5. Created an API Gateway HTTP API.
6. Created an upload API Lambda function.
7. Configured the Lambda function to generate S3 presigned URLs.
8. Configured CORS for browser-based requests.
9. Created the thumbnail-processing Lambda function.
10. Added Pillow for image processing.
11. Configured the S3 `ObjectCreated` event notification.
12. Connected the source S3 bucket event to the thumbnail Lambda.
13. Configured IAM permissions for S3 and CloudWatch access.
14. Connected the frontend to API Gateway.
15. Implemented automatic checking for the generated thumbnail.
16. Added browser preview and thumbnail download functionality.
17. Tested the complete browser-to-AWS workflow.

## Screenshots

### Working Web Application

The completed web application showing the original uploaded image and the automatically generated thumbnail.

![Working Thumbnail Generator](screenshots/website-thumbnail-generator.png)

The application also allows the generated thumbnail to be downloaded directly from the browser.

### API Gateway

Amazon API Gateway provides the HTTP API used by the frontend to communicate with the serverless backend.

![API Gateway](screenshots/api-gateway.png)

### Upload API Lambda

The Lambda function used by the API layer to generate presigned S3 URLs and handle thumbnail retrieval requests.

![Upload API Lambda](screenshots/upload-api-lambda.png)

### S3 Event Trigger

The source S3 bucket automatically invokes the thumbnail processor whenever a new image is uploaded.

![S3 Event Trigger Configuration](screenshots/s3-event-trigger-config.png)

### Thumbnail Processor Lambda

Python and Pillow are used to process uploaded images and generate optimized thumbnails.

![Lambda Function Code](screenshots/lambda-function-code.png)

### CloudWatch Logs

Lambda execution and troubleshooting information is captured using Amazon CloudWatch.

![CloudWatch Logs](screenshots/cloudwatch-logs.png)

### IAM Permissions

IAM execution roles control the permissions Lambda functions have when interacting with S3 and CloudWatch.

![IAM Role Permissions](screenshots/iam-role-permissions.png)

### Original vs Generated Thumbnail

Example output demonstrating the difference between the original image and generated thumbnail.

![Original vs Thumbnail](screenshots/before-after-thumbnail.png)

## Security Design

The application follows several important AWS security practices:

- Source images are stored in a private S3 bucket.
- Generated thumbnails are stored in a private S3 bucket.
- Browser uploads use temporary presigned URLs.
- AWS credentials are never stored in frontend JavaScript.
- IAM roles are used for Lambda-to-AWS service access.
- CORS controls browser access to S3 and API Gateway.
- Public access is limited to the static website content required for the application.

## What I Learned

Through this project, I gained hands-on experience with:

- Designing a complete serverless web application on AWS.
- Building event-driven architectures using S3 and Lambda.
- Hosting static applications using Amazon S3.
- Integrating a JavaScript frontend with Amazon API Gateway.
- Generating and using S3 presigned URLs.
- Securely uploading files directly from a browser to Amazon S3.
- Processing images using Python and Pillow.
- Configuring S3 Event Notifications.
- Working with IAM roles and least-privilege permissions.
- Configuring CORS for cross-origin browser requests.
- Monitoring and troubleshooting Lambda using CloudWatch.
- Handling asynchronous workflows where image processing happens after an upload.
- Connecting multiple AWS services into an end-to-end application.

## Key AWS Concepts Demonstrated

`Amazon S3` • `AWS Lambda` • `Amazon API Gateway` • `AWS IAM` • `Amazon CloudWatch` • `S3 Presigned URLs` • `S3 Event Notifications` • `Static Website Hosting` • `CORS` • `Event-Driven Architecture` • `Serverless Computing`

---

This project was built as a hands-on implementation to strengthen my practical understanding of AWS serverless architectures, secure S3 access, API integration, event-driven processing, IAM, and cloud monitoring.

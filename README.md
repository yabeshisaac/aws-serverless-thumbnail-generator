# AWS Serverless Image Thumbnail Generator

Event-driven serverless image processing pipeline built on AWS. Automatically generates a 300x300 thumbnail whenever an image is uploaded to S3 — no servers to manage.

## Architecture

User uploads image
│
▼
S3 Bucket (input) ──► S3 Event Notification
│
▼
AWS Lambda (Python + Pillow)
│
▼
S3 Bucket (output) ── stores 300x300 thumbnail
│
▼
Amazon CloudWatch ── logs & monitoring


**Flow:**
1. An image is uploaded to the input S3 bucket.
2. The upload triggers an S3 event notification, invoking an AWS Lambda function.
3. The Lambda function (Python, using the Pillow library) resizes the image to 300x300 pixels.
4. The resized thumbnail is written to the output S3 bucket.
5. Execution logs and any errors are captured in Amazon CloudWatch for monitoring and debugging.

## Tech Stack

| Component | Service |
|---|---|
| Storage (input/output) | Amazon S3 |
| Compute | AWS Lambda |
| Image processing | Python, Pillow |
| Access control | IAM (least-privilege execution role) |
| Monitoring/Logs | Amazon CloudWatch |
| Region used | us-east-1 (N. Virginia) |

## IAM Permissions

The Lambda execution role was scoped to least-privilege access:
- `s3:GetObject` on the input bucket
- `s3:PutObject` on the output bucket
- CloudWatch Logs write access (`logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`)

## Project Structure

.
├── lambda_function.py # Lambda handler — resizes images using Pillow
├── requirements.txt # Python dependencies (Pillow)
├── screenshots/ # Console screenshots and test output
└── README.md


## Setup / How It Was Deployed

1. Created two S3 buckets: an input bucket for original images and an output bucket for generated thumbnails.
2. Wrote the Lambda function in Python using the Pillow library for image resizing.
3. Packaged Pillow as a Lambda layer (since it's a compiled dependency not available by default in the Lambda runtime).
4. Configured an S3 event notification on the input bucket to trigger the Lambda function on `s3:ObjectCreated:*` events.
5. Attached an IAM execution role scoped to only the required S3 and CloudWatch actions.
6. Tested by uploading sample images and verifying the resized thumbnail appeared in the output bucket, with logs visible in CloudWatch.

## Screenshots

**S3 event trigger configuration:**
![S3 event trigger config](screenshots/s3-event-trigger-config.png)

**Lambda function code:**
![Lambda function code](screenshots/lambda-function-code.png)

**CloudWatch execution logs:**
![CloudWatch logs](screenshots/cloudwatch-logs.png)

**IAM role permissions (least privilege):**
![IAM role permissions](screenshots/iam-role-permissions.png)

**Original image vs. generated thumbnail:**
![Before and after](screenshots/before-after-thumbnail.png)

## What I Learned

- Designing event-driven, serverless architectures on AWS without provisioning or managing any servers.
- Handling binary dependencies (Pillow) in Lambda using layers.
- Writing least-privilege IAM policies scoped to specific S3 actions and buckets.
- Using CloudWatch for debugging and monitoring serverless function execution.

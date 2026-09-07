# AWS Serverless Image Thumbnail Generator

An event-driven serverless image processing pipeline built on AWS. When an image is uploaded to Amazon S3, an AWS Lambda function automatically processes the image and generates a thumbnail with a maximum size of **300×300 pixels while preserving the original aspect ratio**.

The solution is fully event-driven and requires no server provisioning or management.

## Architecture

![AWS Serverless Thumbnail Generator Architecture](screenshots/architecture-diagram.png)

### Architecture Flow

```text
User uploads image
        │
        ▼
Amazon S3 (Input Bucket)
        │
        │ S3 ObjectCreated Event
        ▼
AWS Lambda
(Python + Pillow)
        │
        ├──────────────► Amazon CloudWatch
        │                 Logs & Monitoring
        ▼
Amazon S3 (Output Bucket)
        │
        └── thumbnails/<filename>-thumbnail.jpg

## How It Works

1. An image is uploaded to the input Amazon S3 bucket.
2. The upload generates an `s3:ObjectCreated:*` event.
3. The S3 event automatically invokes the AWS Lambda function.
4. Lambda retrieves the uploaded image from S3.
5. Python and Pillow resize the image to fit within **300×300 pixels while preserving its aspect ratio**.
6. The processed image is converted to JPEG and stored in the output S3 bucket under the `thumbnails/` prefix.
7. Lambda execution information and errors are recorded in Amazon CloudWatch Logs.

## Tech Stack

| Component | Technology / AWS Service |
|---|---|
| Object Storage | Amazon S3 |
| Serverless Compute | AWS Lambda |
| Image Processing | Python, Pillow |
| Access Control | AWS IAM |
| Monitoring & Logging | Amazon CloudWatch |
| Architecture | Event-Driven / Serverless |
| AWS Region | us-east-1 (N. Virginia) |

## Lambda Processing Logic

The Lambda function:

- Extracts the source bucket and object key from the S3 event.
- Retrieves the uploaded image using `s3:GetObject`.
- Processes the image in memory using Python `BytesIO`.
- Uses Pillow's `thumbnail()` method to resize the image while maintaining its aspect ratio.
- Converts the generated thumbnail to JPEG.
- Stores the result in the destination S3 bucket.

Generated objects follow this structure:

```text
thumbnails/<original-filename>-thumbnail.jpg
```

The destination bucket is supplied to the Lambda function through the environment variable:

```text
DESTINATION_BUCKET
```

This avoids hardcoding the destination bucket name directly in the application code.

## IAM Permissions

The Lambda execution role provides the permissions required for the function to interact with S3 and write execution logs to CloudWatch.

Required actions include:

- `s3:GetObject` — retrieve images from the input bucket
- `s3:PutObject` — store generated thumbnails in the output bucket
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

> IAM permissions should be scoped to only the resources and actions required by the Lambda function.

## Project Structure

```text
aws-serverless-thumbnail-generator/
│
├── lambda_function.py
├── requirements.txt
├── .gitignore
├── README.md
│
└── screenshots/
    ├── s3-event-trigger-config.png
    ├── lambda-function-code.png
    ├── cloudwatch-logs.png
    ├── iam-role-permissions.png
    └── before-after-thumbnail.png
```

## Deployment

1. Created separate Amazon S3 buckets for original images and generated thumbnails.
2. Created the Lambda function using the Python runtime.
3. Added Pillow to the Lambda environment using a Lambda Layer.
4. Configured the `DESTINATION_BUCKET` environment variable with the output bucket name.
5. Configured an S3 Event Notification on the input bucket for `s3:ObjectCreated:*` events.
6. Connected the S3 event notification to the Lambda function.
7. Configured the Lambda execution role with the required S3 and CloudWatch permissions.
8. Uploaded a test image to the input bucket.
9. Verified that Lambda executed automatically and created the thumbnail in the output bucket.
10. Verified successful execution using Amazon CloudWatch Logs.

## Screenshots

### S3 Event Trigger Configuration

Shows the S3 event notification configured to invoke the Lambda function when a new object is uploaded.

![S3 Event Trigger Configuration](screenshots/s3-event-trigger-config.png)

### Lambda Function

Python Lambda function responsible for processing uploaded images and generating thumbnails.

![Lambda Function Code](screenshots/lambda-function-code.png)

### CloudWatch Execution Logs

Successful Lambda invocation and execution details captured by Amazon CloudWatch.

![CloudWatch Logs](screenshots/cloudwatch-logs.png)

### IAM Role Permissions

Permissions used by the Lambda execution role for S3 access and CloudWatch logging.

![IAM Role Permissions](screenshots/iam-role-permissions.png)

### Original Image vs Generated Thumbnail

Original uploaded image compared with the automatically generated thumbnail.

![Original vs Thumbnail](screenshots/before-after-thumbnail.png)

## What I Learned

Through this project, I gained hands-on experience with:

- Building an event-driven serverless architecture on AWS.
- Integrating Amazon S3 events with AWS Lambda.
- Processing images programmatically using Python and Pillow.
- Managing external Python dependencies using Lambda Layers.
- Configuring Lambda environment variables.
- Working with IAM permissions for AWS service-to-service access.
- Using Amazon CloudWatch Logs to monitor and troubleshoot Lambda executions.
- Working with S3 object keys and event payloads in Python.

## Key AWS Concepts Demonstrated

`Amazon S3` • `AWS Lambda` • `AWS IAM` • `Amazon CloudWatch` • `Lambda Layers` • `S3 Event Notifications` • `Event-Driven Architecture` • `Serverless Computing`

---

This project was built as a hands-on implementation to strengthen my practical understanding of AWS serverless architectures, event-driven systems, IAM, and cloud monitoring.

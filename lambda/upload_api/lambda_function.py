import json
import boto3
import uuid
from botocore.exceptions import ClientError

s3 = boto3.client("s3", region_name="us-east-1")

SOURCE_BUCKET = "yabesh-original-images-2026"
DESTINATION_BUCKET = "yabesh-thumbnail-images-2026"


def lambda_handler(event, context):

    route_key = event.get("routeKey", "")

    # POST /upload
    if route_key == "POST /upload":

        body = json.loads(event.get("body") or "{}")

        filename = body.get("filename", "image.jpg")
        content_type = body.get("contentType", "image/jpeg")

        extension = (
            filename.rsplit(".", 1)[-1].lower()
            if "." in filename
            else "jpg"
        )

        if extension not in ["jpg", "jpeg", "png", "webp"]:
            return response(400, {"error": "Unsupported image type"})

        image_id = str(uuid.uuid4())

        source_key = f"uploads/{image_id}.{extension}"
        thumbnail_key = f"thumbnails/{image_id}-thumbnail.jpg"

        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": SOURCE_BUCKET,
                "Key": source_key,
                "ContentType": content_type
            },
            ExpiresIn=300
        )

        return response(200, {
            "uploadUrl": upload_url,
            "key": source_key,
            "thumbnailKey": thumbnail_key
        })

    # GET /thumbnail
    if route_key == "GET /thumbnail":

        params = event.get("queryStringParameters") or {}
        thumbnail_key = params.get("key")

        if not thumbnail_key:
            return response(400, {"error": "Missing thumbnail key"})

        if not thumbnail_key.startswith("thumbnails/"):
            return response(400, {"error": "Invalid thumbnail key"})

        try:
            s3.head_object(
                Bucket=DESTINATION_BUCKET,
                Key=thumbnail_key
            )

        except ClientError as e:
            status = e.response.get(
                "ResponseMetadata", {}
            ).get("HTTPStatusCode", 500)

            if status in [403, 404]:
                return response(404, {"ready": False})

            raise

        thumbnail_url = s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": DESTINATION_BUCKET,
                "Key": thumbnail_key
            },
            ExpiresIn=300
        )

        return response(200, {
            "ready": True,
            "thumbnailUrl": thumbnail_url
        })

    return response(404, {"error": "Route not found"})


def response(status_code, body):

    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(body)
    }

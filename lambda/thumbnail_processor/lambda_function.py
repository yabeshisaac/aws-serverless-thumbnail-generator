import io
import os
from urllib.parse import unquote_plus

import boto3
from PIL import Image

s3 = boto3.client("s3")

DEST_BUCKET = os.environ["DESTINATION_BUCKET"]


def lambda_handler(event, context):
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = unquote_plus(record["s3"]["object"]["key"])

        response = s3.get_object(Bucket=bucket, Key=key)

        image = Image.open(io.BytesIO(response["Body"].read()))

        image.thumbnail((300, 300))

        if image.mode != "RGB":
            image = image.convert("RGB")

        buffer = io.BytesIO()
        image.save(buffer, "JPEG")
        buffer.seek(0)

        filename = os.path.splitext(os.path.basename(key))[0]

        s3.put_object(
            Bucket=DEST_BUCKET,
            Key=f"thumbnails/{filename}-thumbnail.jpg",
            Body=buffer,
            ContentType="image/jpeg"
        )

    return {
        "statusCode": 200,
        "body": "Thumbnail created successfully"
    }

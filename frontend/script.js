const API_BASE =
  "https://puoblcrgpl.execute-api.ap-south-2.amazonaws.com";


const fileInput =
  document.getElementById("fileInput");

const fileName =
  document.getElementById("fileName");

const originalPreview =
  document.getElementById("originalPreview");

const originalPlaceholder =
  document.getElementById("originalPlaceholder");

const thumbnailPreview =
  document.getElementById("thumbnailPreview");

const thumbnailPlaceholder =
  document.getElementById("thumbnailPlaceholder");

const thumbnailResult =
  document.getElementById("thumbnailResult");

const downloadBtn =
  document.getElementById("downloadBtn");

const uploadBtn =
  document.getElementById("uploadBtn");

const statusText =
  document.getElementById("status");


let currentThumbnailUrl = null;


/* ================================
   FILE SELECTION
================================ */

fileInput.addEventListener("change", () => {

  const file = fileInput.files[0];

  if (!file) {

    fileName.textContent =
      "No file chosen";

    originalPreview.style.display =
      "none";

    originalPlaceholder.style.display =
      "block";

    resetThumbnail();

    return;
  }


  fileName.textContent =
    file.name;


  /* Show original image immediately */

  const previewURL =
    URL.createObjectURL(file);

  originalPreview.src =
    previewURL;

  originalPreview.style.display =
    "block";

  originalPlaceholder.style.display =
    "none";


  /* Reset previous result */

  resetThumbnail();

  statusText.textContent = "";

});


/* ================================
   GENERATE THUMBNAIL
================================ */

uploadBtn.addEventListener("click", async () => {

  const file =
    fileInput.files[0];


  if (!file) {

    statusText.textContent =
      "Please choose an image first.";

    return;

  }


  try {

    uploadBtn.disabled = true;

    resetThumbnail();


    /* STEP 1 */

    statusText.textContent =
      "Preparing secure upload...";


    const apiResponse =
      await fetch(`${API_BASE}/upload`, {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          filename:
            file.name,

          contentType:
            file.type

        })

      });


    if (!apiResponse.ok) {

      throw new Error(
        "Unable to get upload URL"
      );

    }


    const data =
      await apiResponse.json();


    /* STEP 2 */

    statusText.textContent =
      "Uploading image to Amazon S3...";


    const uploadResponse =
      await fetch(data.uploadUrl, {

        method: "PUT",

        headers: {
          "Content-Type":
            file.type
        },

        body: file

      });


    if (!uploadResponse.ok) {

      throw new Error(
        "S3 upload failed"
      );

    }


    /* STEP 3 */

    statusText.textContent =
      "Image uploaded. AWS Lambda is generating thumbnail...";


    await waitForThumbnail(
      data.thumbnailKey
    );


  }

  catch (error) {

    console.error(error);

    statusText.textContent =
      "Something went wrong while processing the image.";

  }

  finally {

    uploadBtn.disabled = false;

  }

});


/* ================================
   WAIT FOR THUMBNAIL
================================ */

async function waitForThumbnail(
  thumbnailKey
) {

  const maxAttempts = 30;


  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {

    statusText.textContent =
      `Generating thumbnail... (${attempt}/${maxAttempts})`;


    try {

      const response =
        await fetch(
          `${API_BASE}/thumbnail?key=${encodeURIComponent(thumbnailKey)}`
        );


      if (response.ok) {

        const data =
          await response.json();


        if (
          data.ready &&
          data.thumbnailUrl
        ) {

          currentThumbnailUrl =
            data.thumbnailUrl;


          thumbnailPreview.src =
            currentThumbnailUrl;


          thumbnailPreview.style.display =
            "block";


          thumbnailPlaceholder.style.display =
            "none";


          thumbnailResult.style.display =
            "block";


          downloadBtn.style.display =
            "inline-block";


          statusText.textContent =
            "Thumbnail generated successfully!";


          return;

        }

      }

    }

    catch (error) {

      console.log(
        "Thumbnail not ready yet."
      );

    }


    await sleep(1000);

  }


  throw new Error(
    "Thumbnail generation timed out"
  );

}


/* ================================
   DOWNLOAD THUMBNAIL
================================ */

downloadBtn.addEventListener(
  "click",
  async () => {

    if (!currentThumbnailUrl) {

      return;

    }


    try {

      downloadBtn.disabled = true;

      downloadBtn.textContent =
        "Downloading...";


      const response =
        await fetch(
          currentThumbnailUrl
        );


      if (!response.ok) {

        throw new Error(
          "Download failed"
        );

      }


      const blob =
        await response.blob();


      const blobUrl =
        URL.createObjectURL(blob);


      const link =
        document.createElement("a");


      link.href =
        blobUrl;


      link.download =
        "aws-thumbnail.jpg";


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      URL.revokeObjectURL(
        blobUrl
      );


      downloadBtn.textContent =
        "✓ Downloaded";


      setTimeout(() => {

        downloadBtn.textContent =
          "↓ Download Thumbnail";

      }, 1500);

    }

    catch (error) {

      console.error(error);

      statusText.textContent =
        "Unable to download thumbnail.";

    }

    finally {

      downloadBtn.disabled = false;

    }

  }
);


/* ================================
   RESET THUMBNAIL
================================ */

function resetThumbnail() {

  currentThumbnailUrl = null;


  thumbnailPreview.src = "";

  thumbnailPreview.style.display =
    "none";


  thumbnailResult.style.display =
    "none";


  thumbnailPlaceholder.style.display =
    "block";


  downloadBtn.style.display =
    "none";

}


/* ================================
   SLEEP
================================ */

function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );

}
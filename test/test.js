const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function uploadImage() {
  // 1. Build a FormData instance and append the file
  const form = new FormData();
  const filePath = path.join(__dirname, 'image.png');
  form.append('file', fs.createReadStream(filePath));

  try {
    // 2. Send POST to the endpoint with multipart/form-data headers
    const response = await axios.post(
      'https://backend-production-bb1f.up.railway.app/files',
      form,
      {
        headers: {
          ...form.getHeaders(), // ensures proper Content-Type with boundary
        },
      }
    );
    console.log('Upload successful:', response.data);
  } catch (err) {
    console.error('Upload failed:', err.response?.data || err.message);
  }
}

uploadImage();

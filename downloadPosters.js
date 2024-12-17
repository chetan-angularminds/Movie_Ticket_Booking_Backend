const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const fileListUrl = 'https://movie-ticket-booking-backend-mjx1.onrender.com/static/posters/list';
const fileBaseUrl = 'https://movie-ticket-booking-backend-mjx1.onrender.com/static/posters';
const localDir = path.join(__dirname, 'static/posters'); // Local folder to store images

// Ensure the local directory exists
if (!fs.existsSync(localDir)) {
  fs.mkdirSync(localDir, { recursive: true });
}

// Function to fetch file list
const fetchFileList = async () => {
  try {
    const response = await axios.get(fileListUrl);
    return response.data; // List of files
  } catch (error) {
    console.error('Error fetching file list:', error.message);
    process.exit(1);
  }
};

// Function to download a single file
const downloadFile = async (filename) => {
  const fileUrl = `${fileBaseUrl}/${filename}`;
  const filePath = path.join(localDir, filename);

  try {
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`Downloaded: ${filename}`);
        resolve();
      });
      writer.on('error', (err) => {
        console.error(`Error downloading ${filename}:`, err.message);
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Failed to download ${filename}:`, error.message);
  }
};

// Main function
const syncImages = async () => {
  try {
    console.log('Fetching file list...');
    const fileList = await fetchFileList();

    if (fileList.length === 0) {
      console.log('No files to download.');
      return;
    }

    console.log(`Found ${fileList.length} files. Starting download...`);
    for (const file of fileList) {
      await downloadFile(file);
    }

    console.log('All files downloaded successfully!');
  } catch (error) {
    console.error('Error during sync:', error.message);
  }
};

// Run the script
syncImages();

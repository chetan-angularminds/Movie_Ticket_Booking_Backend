const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const fileListUrl = 'https://movie-ticket-booking-backend-mjx1.onrender.com/static/posters/list';
const fileBaseUrl = 'https://movie-ticket-booking-backend-mjx1.onrender.com/static/posters';
const localDir = path.join(__dirname, 'static/posters');

// Ensure the local directory exists
if (!fs.existsSync(localDir)) {
  fs.mkdirSync(localDir, { recursive: true });
}

// Function to fetch file list
const fetchFileList = async () => {
  try {
    const response = await axios.get(fileListUrl);
    return response.data;
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

// Function to check if there are changes to commit
const hasChangesToCommit = () => {
  try {
    const diffOutput = execSync('git diff --stat').toString();
    return diffOutput.includes('static/posters');
  } catch (error) {
    console.error('Error checking for changes:', error);
    return false;
  }
};

// Function to commit the changes
const commitChanges = async () => {
  if (!hasChangesToCommit()) {
    console.log('No changes to commit.');
    return false;
  }

  try {
    execSync('git add static/posters');
    execSync('git commit -m "Updated images in static/posters [ci skip]"');
    console.log('Changes committed successfully!');
    return true;
  } catch (error) {
    console.error('Error committing changes:', error);
    process.exit(1);
  }
};

// Function to push changes
const pushChanges = async () => {
  try {
    execSync('git push');
    console.log('Changes pushed to remote repository!');
  } catch (error) {
    console.error('Error pushing changes:', error);
    process.exit(1);
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

    // Commit changes after download
    const committed = await commitChanges();

    // Push the changes only if a commit was made
    if (committed) {
      await pushChanges();
    } else {
      console.log('No changes to push.');
    }
  } catch (error) {
    console.error('Error during sync:', error);
  }
};

// Run the script
syncImages();

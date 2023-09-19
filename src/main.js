// 📂 Auto Update FiveM Artifacts
// 📝 By: ! Tuncion#0809
// 📝 Version: 1.0.0
// 📝 Date: 19.08.2023

const fs = require('fs');
const axios = require('axios');
const { exec } = require('child_process');
const commentjson = require('comment-json');
const input = require('prompt-sync')({sigint: true});

// Welcome Screen
console.log(`📂 Auto Update FiveM Artifacts`);
console.log('-------------------------------');

// Load Config File
const ConfigFile = fs.readFileSync('./config.json').toString();
const Config = commentjson.parse(ConfigFile);

// Load Internal Data File
const InternalFile = fs.readFileSync('./src/internal.json').toString();
const InternalData = commentjson.parse(InternalFile);

// Fetch newest artifact
const UpdateChannel = Config.UpdateChannel == 'windows' ? 'build_server_windows' : 'build_proot_linux';

console.log(`✅ Fetching newest artifact for ${Config.UpdateChannel}`);
axios.get(`https://runtime.fivem.net/artifacts/fivem/${UpdateChannel}/master/`).then(async (response) => { 
    const DownloadInternalID = (response.data.split('<a href="')[1].split('"')[0]).replace('./', '');
    const DownloadID = DownloadInternalID.split('-')[0];
    const DownloadURL = `https://runtime.fivem.net/artifacts/fivem/${UpdateChannel}/master/${DownloadInternalID}`;

    // Check if newest artifact is already downloaded
    console.log(`✅ Checking if newest artifact is already downloaded`)
    if (InternalData.ArtifactVersion == DownloadID) {
        console.log('-------------------------------');
        console.log('❌ Newest artifact is already downloaded');
        return input('👌 Press any key to exit...');
    };

    // Download artifact
    console.log(`✅ Downloading newest artifact for ${Config.UpdateChannel}`);
    const DownloadResult = await DownloadFromURL(DownloadURL, './temp/fivem.tar.xz');
    if (!DownloadResult) {
        console.log(`❌ Error downloading file: ${DownloadURL}`);
        return input('👌 Press any key to exit...');
    };
    console.log(`✅ File downloaded and saved as fivem.tar.xz`);
    
    // Check Server Files Path
    console.log(`✅ Checking Server Files Path`);
    if (!fs.existsSync(Config.ServerFilesPath)) {
        console.log('-------------------------------');
        console.log(`❌ Server Files Path not found: ${Config.ServerFilesPath}`);
        return input('👌 Press any key to exit...');
    };

    // Extract artifact
    console.log(`✅ Extracting artifact`);
    exec(`tar -xJf ./temp/fivem.tar.xz -C ${Config.ServerFilesPath}`, async (error, stdout, stderr) => {
        if (error) return console.log('❌ Error extracting file:', error);

        // Save Internal Data
        console.log(`✅ Saving artifact version in internal data`);
        InternalData.ArtifactVersion = DownloadID;
        fs.writeFileSync('./src/internal.json', commentjson.stringify(InternalData, null, 4));

        // Delete temp file
        console.log(`✅ Deleting temp file`);
        fs.unlinkSync('./temp/fivem.tar.xz');

        // Done fetching
        console.log('✅ Artifact successfully extracted');
        console.log('-------------------------------');
        console.log(`✅ You updated artifact v${InternalData.ArtifactVersion} to v${DownloadID}\n`);
        console.log('⚠️\xa0 PLEASE RESTART YOUR FXSERVER TO APPLY THE CHANGES');
        input('👌 Press any key to exit...');
    });
});

/**
 * Downloads a file from a URL and saves it to a specified output file.
 * @async
 * @function DownloadFromURL
 * @param {string} DownloadURL - The URL to download the file from.
 * @param {string} OutputFile - The path to save the downloaded file to.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the download was successful, or false if there was an error.
 */
async function DownloadFromURL(DownloadURL, OutputFile) {
    const writer = fs.createWriteStream(OutputFile);
  
    try {
      const response = await axios({
        method: 'get',
        url: DownloadURL,
        responseType: 'stream',
      });
      response.data.pipe(writer);
  
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      return true;
    } catch (error) {
      return false;
    };
};
  
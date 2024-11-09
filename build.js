const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Define the output folder
const outputFolder = path.resolve(__dirname, 'out');

// Function to clean the output folder if it exists
async function cleanOutputFolder() {
    if (fs.existsSync(outputFolder)) {
        await fs.promises.rm(outputFolder, { recursive: true, force: true });
        console.log('Output folder cleaned.');
    }
}

// Run the cleaning function and then the esbuild process
cleanOutputFolder().then(() => {
    esbuild.build({
        entryPoints: ['src/extension.ts'], // Your entry file
        bundle: true,
        outfile: 'out/extension.js',
        external: ['vscode'], // Mark vscode as external
        platform: 'node', // Ensures the output is suitable for Node.js
        target: 'node14', // Set your desired Node.js version
        sourcemap: false,
        minify: true, // Optionally minify the output
    }).then(() => {
        console.log('Build completed successfully.');
    }).catch(() => {
        console.error('Build failed.');
        process.exit(1);
    });
}).catch((err) => {
    console.error('Error cleaning output folder:', err);
    process.exit(1);
});

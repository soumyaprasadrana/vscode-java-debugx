const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['src/extension.ts'], // Your entry file
    bundle: true,
    outfile: 'out/extension.js',
    external: ['vscode'], // Mark vscode as external
    platform: 'node', // This ensures the output is suitable for Node.js
    target: 'node14', // Set your desired Node.js version
    sourcemap: false,
    minify: true, // Optionally minify the output
}).catch(() => process.exit(1));

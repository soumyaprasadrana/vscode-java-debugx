// Copyright (c) 2024 Soumya Prasad Rana
// 
// Licensed under the MIT License. See the LICENSE file in the project root for license information.
//
// Author: Soumya Prasad Rana
// Email: soumyaprasad.rana@gmail.com
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { minimatch } from 'minimatch'; // Use the correct import for minimatch

export async function searchExternalFiles(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('java.debugx');
    const externalFolder = config.get<string>('externalFolder');
    const filePatterns = config.get<string[]>('filePatterns') || [];

    if (!externalFolder || !fs.existsSync(externalFolder)) {
        vscode.window.showErrorMessage('External folder not found or not set.');
        return;
    }

    // Check if the files have already been indexed
    let fileIndex: vscode.Uri[] = context.globalState.get('externalFileIndex') || [];

    // Prompt for search term
    let searchTerm: string | undefined;
    let validInputReceived = false;

    while (!validInputReceived) {
        searchTerm = await vscode.window.showInputBox({
            placeHolder: 'Type at least 4 characters to search or "reindex" to reindex...',
            prompt: 'Search for files in the external folder',
        });

        // Check if the input was canceled
        if (searchTerm === undefined) {
            vscode.window.showInformationMessage('Input canceled.');
            return;
        }

        // Proceed only if the input has 4 or more characters
        if (searchTerm.length >= 4) {
            if (searchTerm.toLowerCase() === "reindex") {
                // Remove cached index and reindex
                vscode.window.showInformationMessage('Reindexing files...');
                fileIndex = await indexFiles(externalFolder, filePatterns, context);
                context.globalState.update('externalFileIndex', fileIndex);
                return;
            } else {
                validInputReceived = true;
            }
        } else {
            vscode.window.showInformationMessage('Please enter at least 4 characters.');
        }
    }

    // If the index is empty, index the files
    if (fileIndex.length === 0) {
        vscode.window.showInformationMessage('Indexing files in the external folder...');
        fileIndex = await indexFiles(externalFolder, filePatterns, context);
        context.globalState.update('externalFileIndex', fileIndex);
    } else {
        vscode.window.showInformationMessage(`Using cached indexed files: ${fileIndex.length} files found.`);
    }
    function truncateFilePath(filePath: string, maxLength: number = 60): string {
        if (filePath.length <= maxLength) {
            return filePath; // No need to truncate
        }
        const start = filePath.substring(0, 10); // First 10 characters of the path
        const end = filePath.substring(filePath.length - 30); // Last 30 characters of the path
        return `${start}...${end}`; // Truncate and show start and end
    }

    try {
        // Filter files based on user input
        const filteredFiles = fileIndex.filter(file =>
            file && file.fsPath && path.basename(file.fsPath).toLowerCase().includes(searchTerm!.toLowerCase()) || file && file.path && path.basename(file.path).toLowerCase().includes(searchTerm!.toLowerCase())
        );

        if (filteredFiles.length === 0) {
            vscode.window.showInformationMessage('No files found matching your search.');
            return;
        }

        const filePickItems = filteredFiles.map(file => {
            const fullPath = file.fsPath || file.path;
            const relativePath = vscode.workspace.asRelativePath(fullPath);

            return {
                label: path.basename(fullPath),  // Show the file name
                description: fullPath,  // Show the truncated relative path as description

            };
        });

        const selectedFile = await vscode.window.showQuickPick(
            filePickItems,
            { placeHolder: 'Select a file to open' }
        );

        if (selectedFile) {
            const fullPath = selectedFile.description;  // Get the full path from the 'detail'
            const document = await vscode.workspace.openTextDocument(fullPath);
            await vscode.window.showTextDocument(document);
        }
        else {
            vscode.window.showInformationMessage('File selection canceled.');
        }
    } catch (err: any) {
        vscode.window.showErrorMessage(`Error during search: ${err.message}`);
    }
}

async function indexFiles(folder: string, filePatterns: string[], context: vscode.ExtensionContext): Promise<vscode.Uri[]> {
    const files: vscode.Uri[] = [];
    const statusBarMessage = vscode.window.setStatusBarMessage('Indexing files...');

    const readDir = async (dir: string) => {
        const dirents = fs.readdirSync(dir, { withFileTypes: true });
        for (const dirent of dirents) {
            const res = path.resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
                await readDir(res);
            } else {
                // Check if the file matches any of the patterns
                if (filePatterns.some(pattern => minimatch(dirent.name, pattern))) {
                    files.push(vscode.Uri.file(res));
                    statusBarMessage.dispose();
                    vscode.window.setStatusBarMessage(`Indexing: ${dirent.name}`);
                }
            }
        }
    };

    await readDir(folder);
    statusBarMessage.dispose(); // Remove the message when done
    vscode.window.showInformationMessage(`Indexed ${files.length} files.`);
    return files;
}

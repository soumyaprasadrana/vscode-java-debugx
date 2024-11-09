import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BridgeResponseProvider } from './bridgeResponseProvider';
import { bridgeConfigSchema } from './bridgeconfigschemaprovider';

// Function to register the generate bridge config command
export function registerGenerateBridgeConfigCommand(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('java.debugx.bridge.generateBridgeConfig', async () => {
        // Sample configuration object based on your schema, with $schema reference
        const sampleConfig = JSON.parse(`{
 "$schema": "./java.debugx-bridge-config-schema.json",
  "name": "Java DebugX Bridge Config",
  "type": "java",
  "instance": "com.debugx.bridge.VsCodeDebugxBridge",
  "commands": [
    {
      "title": "Get Object Properties",
      "command": "objectProperties",
      "responseid": "props",
      "args": ["this"],
      "autotrigger": true,
      "events":{
        "stackFrameChanged":  true
      },
      "hideonerror": true
    }
  ]
}`)



        // Generate the file name with timestamp for the config
        const timestamp = Date.now();
        const configFileName = `java.debugx-bridge-config-${timestamp}.json`;

        // Schema file name (no timestamp, to keep it consistent)
        const schemaFileName = 'java.debugx-bridge-config-schema.json';

        // Get the workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found. Please open a workspace.');
            return;
        }

        // Construct paths for the config and schema files
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const configFilePath = path.join(workspacePath, configFileName);
        const schemaFilePath = path.join(workspacePath, schemaFileName);

        try {
            // Write or override the schema file
            fs.writeFileSync(schemaFilePath, JSON.stringify(bridgeConfigSchema, null, 2));

            // Write the sample config file with schema reference
            fs.writeFileSync(configFilePath, JSON.stringify(sampleConfig, null, 2));

            vscode.window.showInformationMessage(`Config file created: ${configFileName}`);
            vscode.window.showInformationMessage(`Schema file created/updated: ${schemaFileName}`);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to create files: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}
export function registerBridgeResponsesResetCommand(context: any, bridgeResponseProvider: BridgeResponseProvider) {
    const clearBridgeResDisposable = vscode.commands.registerCommand("java.debugx.bridge.clearInsights", () => {
        bridgeResponseProvider.reset();
    })
    context.subscriptions.push(clearBridgeResDisposable);
}
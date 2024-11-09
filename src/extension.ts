// Copyright (c) 2024 Soumya Prasad Rana
// 
// Licensed under the MIT License. See the LICENSE file in the project root for license information.
//
// Author: Soumya Prasad Rana
// Email: soumyaprasad.rana@gmail.com
import * as vscode from 'vscode';
import { searchExternalFiles } from './externalFileSearch';
import { BridgeResponseProvider } from './bridgeResponseProvider';
import { registerBridgeResponsesResetCommand, registerGenerateBridgeConfigCommand } from './generateSampleBridgeConfig';
import { registerDebugInsightsCommand, registerMacroRecordingCommandsWithInfostore, registerThreadListener } from './handleGetDebugInsights';
import { DebugSessionsTrackerFactory } from './debugSessionsTracker';
import { Logger } from './logger';
import { StatusBarProvider } from './statusBarProvider';
import { ContextProvider } from './vscodeContextProvider';

export function activate(context: vscode.ExtensionContext) {

    Logger.log('JavaDebugX Extension activated');
    StatusBarProvider.initialize("JavaDebugX");
    ContextProvider.initialize(context);


    let disposable = vscode.commands.registerCommand('java.debugx.output.showLogs', () => {
        Logger.showLogs();
    });

    context.subscriptions.push(disposable);


    // Register command to open input box and search files
    const searchFilesCommand = vscode.commands.registerCommand('java.debugx.searchExternalFiles', async () => {
        await searchExternalFiles(context);
    });

    context.subscriptions.push(searchFilesCommand);

    registerGenerateBridgeConfigCommand(context);

    const bridgeResponseProvider = new BridgeResponseProvider();
    const bridgeResponseProviderDisp = vscode.window.registerTreeDataProvider('java.debugx.viewBridgeResponses', bridgeResponseProvider);
    context.subscriptions.push(bridgeResponseProviderDisp);

    registerBridgeResponsesResetCommand(context, bridgeResponseProvider);

    //Register Debug Thread Listener
    registerThreadListener(context, bridgeResponseProvider);
    registerDebugInsightsCommand(context, bridgeResponseProvider);
    registerMacroRecordingCommandsWithInfostore(context);

    //context.subscriptions.push(vscode.debug.registerDebugAdapterTrackerFactory('java', new DebugSessionsTrackerFactory()));
    vscode.debug.registerDebugAdapterTrackerFactory('java', new DebugSessionsTrackerFactory())

}


export function deactivate() {
    StatusBarProvider.dispose();
}

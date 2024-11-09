// Copyright (c) 2024 Soumya Prasad Rana
// 
// Licensed under the MIT License. See the LICENSE file in the project root for license information.
//
// Author: Soumya Prasad Rana
// Email: soumyaprasad.rana@gmail.com
import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel | null = null;

    // Initialize the output channel if it doesn't exist
    private static getOutputChannel(): vscode.OutputChannel {
        if (!Logger.outputChannel) {
            Logger.outputChannel = vscode.window.createOutputChannel('JavaDebugX');
        }
        return Logger.outputChannel;
    }

    // Method to log messages
    public static log(message: string): void {
        const outputChannel = Logger.getOutputChannel();
        const timestamp = new Date().toISOString();
        outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    // Method to log messages
    public static logInformation(message: string): void {
        const outputChannel = Logger.getOutputChannel();
        const timestamp = new Date().toISOString();
        outputChannel.appendLine(`[${timestamp}] ${message}`);
        vscode.window.showInformationMessage(`${message}`);
    }

    // Method to log messages
    public static logError(error: any): void {
        const outputChannel = Logger.getOutputChannel();
        const timestamp = new Date().toISOString();
        outputChannel.appendLine(`[${timestamp}] ${error} 
            ${error.stack ? error.stack : ''}`);
        vscode.window.showErrorMessage(`${error.toString()}`);
    }
    // Method to show the output channel
    public static showLogs(): void {
        const outputChannel = Logger.getOutputChannel();
        outputChannel.show();
    }
}

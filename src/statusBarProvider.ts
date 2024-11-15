// Copyright (c) 2024 Soumya Prasad Rana
// 
// Licensed under the MIT License. See the LICENSE file in the project root for license information.
//
// Author: Soumya Prasad Rana
// Email: soumyaprasad.rana@gmail.com
import * as vscode from 'vscode';

export class StatusBarProvider {
    private static statusBarItem: vscode.StatusBarItem;
    private static extensionName: string = "JavaDebugX";

    // Initialize the status bar item for the extension name
    public static initialize(extensionName: string): void {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.statusBarItem.text = `$(callstack-view-session) ${extensionName}`;
        this.statusBarItem.tooltip = `${extensionName} is active`;
        this.statusBarItem.command = `java.debugx.output.showLogs`;
        this.statusBarItem.show();
        this.extensionName = extensionName;
    }

    public static async showProgress(taskLabel: string, task: () => Promise<void>): Promise<void> {
        this.statusBarItem.text = `$(sync~spin) ${taskLabel}...`;
        try {
            await task();
        } finally {
            this.statusBarItem.text = `$(callstack-view-session) ${this.extensionName}`; // Reset to default after task completes
        }
    }

    public static setProgressMessage(text: string) {
        this.statusBarItem.text = `$(sync~spin) ${text}`;
    }


    // Dispose of the status bar item when the extension deactivates
    public static dispose(): void {
        this.statusBarItem.dispose();
    }
}

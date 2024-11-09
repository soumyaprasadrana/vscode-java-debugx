import * as vscode from 'vscode';

export class StatusBarProvider {
    private static statusBarItem: vscode.StatusBarItem;

    // Initialize the status bar item for the extension name
    public static initialize(extensionName: string): void {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.statusBarItem.text = `$(tools) ${extensionName}`;
        this.statusBarItem.tooltip = `${extensionName} is active`;
        this.statusBarItem.command = `java.debugx.output.showLogs`;
        this.statusBarItem.show();
    }

    public static async showProgress(taskLabel: string, task: () => Promise<void>): Promise<void> {
        this.statusBarItem.text = `$(sync~spin) ${taskLabel}...`;
        try {
            await task();
        } finally {
            this.statusBarItem.text = `$(tools) JavaDebugX`; // Reset to default after task completes
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

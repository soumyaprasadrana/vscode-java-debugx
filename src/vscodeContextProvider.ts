// Copyright (c) 2024 Soumya Prasad Rana
// 
// Licensed under the MIT License. See the LICENSE file in the project root for license information.
//
// Author: Soumya Prasad Rana
// Email: soumyaprasad.rana@gmail.com
import * as vscode from 'vscode';

export class ContextProvider {
    private static context: vscode.ExtensionContext;

    // Initialize with the ExtensionContext during activation
    public static initialize(context: vscode.ExtensionContext): void {
        this.context = context;
    }

    // Retrieve the ExtensionContext anywhere in the extension
    public static getContext(): vscode.ExtensionContext {
        if (!this.context) {
            throw new Error("Context has not been initialized. Call initialize() in the activate function.");
        }
        return this.context;
    }

    public static setContextPersistToWorkspaceState(key: string, value: any) {
        vscode.commands.executeCommand('setContext', key, value);
        this.context.workspaceState.update(key, value);
    }

    public static getContextFromWorkspaceState<T>(key: string): T | undefined {
        return this.context.workspaceState.get<T>(key);
    }

}

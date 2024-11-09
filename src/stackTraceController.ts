// Copyright (c) 2024 Soumya Prasad Rana
// 
// Licensed under the MIT License. See the LICENSE file in the project root for license information.
//
// Author: Soumya Prasad Rana
// Email: soumyaprasad.rana@gmail.com
import * as vscode from 'vscode';
import { DebugInfoStore } from './handleGetDebugInsights';
import { format } from 'path';

interface StackFrameInfo {
    frameName: string;
    source: string;
    line: number;
}

export class StackTraceCollector {
    private stackFrames: StackFrameInfo[] = [];
    private loadedWhenStackTrace: boolean = false;
    constructor(debugInfoStore: DebugInfoStore) {
        // Listen to thread pause and step events
        //vscode.debug.onDidChangeActiveDebugSession(() => this.loadStackFrames());
        vscode.debug.onDidReceiveDebugSessionCustomEvent((event) => {
            if ((!this.loadedWhenStackTrace && event.event === 'stackTrace') || event.event === 'stepOver' || event.event === 'stepIn' || event.event === 'stepInTargets') {

            }
        });
    }

    public initialLoad(): boolean {
        return this.loadedWhenStackTrace;
    }
    public async initFromFrame(stackFrame: vscode.DebugStackFrame) {
        await this.fetchStackFrames(stackFrame?.session, stackFrame.threadId);
        this.loadedWhenStackTrace = true;
    }
    private async fetchStackFrames(session: vscode.DebugSession, threadId: number) {
        try {
            const stackFramesResponse = await session.customRequest('stackTrace', {
                threadId: threadId,
                startFrame: 0,
                levels: 20
            });

            // Update stackFrames with current data
            this.stackFrames = stackFramesResponse.stackFrames.map((frame: any) => ({
                frameName: frame.name,
                source: frame.source?.name || 'Unknown Source',
                line: frame.line || 0
            }));

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to retrieve stack frames: ${error}`);
        }
    }

    // Get the collected stack trace
    public getStackTrace(): StackFrameInfo[] {
        return [...this.stackFrames];
    }
}

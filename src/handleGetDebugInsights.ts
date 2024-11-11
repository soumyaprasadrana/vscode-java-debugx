
// Copyright (c) 2024 Soumya Prasad Rana
// 
// Licensed under the MIT License. See the LICENSE file in the project root for license information.
//
// Author: Soumya Prasad Rana
// Email: soumyaprasad.rana@gmail.com
import { BridgeConfigManager, CommandConfig } from './bridgeConfig'; // Import your BridgeConfigManager
import * as vscode from 'vscode';
import { BridgeResponseProvider } from './bridgeResponseProvider';
import { CommandArgumentsParser } from './commandArgumentsParser';
import { DebugSessionsTracker } from './debugSessionsTracker';
import { registerMacroRecordingCommands } from './registerMacroRecordingCommands';
import { Logger } from './logger';
import { ContextProvider } from './vscodeContextProvider';

export class DebugInfoStore {
    private activeThread: vscode.DebugThread | null = null;
    private activeStackFrame: vscode.DebugStackFrame | null = null;
    private isMultiThreadedSession: boolean = false;
    private activeThreadIdForMultiThreadedSession: any = null;
    private hasThreadChangedBetweenFrames: boolean = false;

    public setMultiThreadedSession() {
        this.isMultiThreadedSession = true;
    }

    public setActiveThreadForMultiThreadSession(threadId: any) {
        this.activeThreadIdForMultiThreadedSession = threadId;
    }

    public setHasThreadChangedBetweenFrames(status: boolean) {
        this.hasThreadChangedBetweenFrames = status;
    }

    public getHasThreadChangedBetweenFrames(): boolean {
        return this.hasThreadChangedBetweenFrames;
    }

    public isMultiThreaded(): boolean {
        return this.isMultiThreadedSession;
    }

    public resetMultiThreadVars() {
        this.isMultiThreadedSession = false;
        this.hasThreadChangedBetweenFrames = false;
        this.activeThreadIdForMultiThreadedSession = null;
    }

    public getThreadIdForMultiThreadedSession() {
        return this.activeThreadIdForMultiThreadedSession;
    }

    // Store the active thread and frame information
    public updateActiveDebugInfo(thread: vscode.DebugThread | null, stackFrame: vscode.DebugStackFrame | null) {
        this.activeThread = thread;
        this.activeStackFrame = stackFrame;
    }

    // Retrieve the active thread and frame information
    public getActiveDebugInfo(): { thread: vscode.DebugThread | null, stackFrame: vscode.DebugStackFrame | null } {
        return {
            thread: this.activeThread,
            stackFrame: this.activeStackFrame
        };
    }

    // Check if there is any active thread or stack frame stored
    public hasActiveDebugInfo(): boolean {
        return !!(this.activeThread || this.activeStackFrame);
    }
}

const debugInfoStore = new DebugInfoStore();
//const stackTraceCollector = new StackTraceCollector(debugInfoStore);
const parser = new CommandArgumentsParser(debugInfoStore);

export function registerMacroRecordingCommandsWithInfostore(context: any) {
    registerMacroRecordingCommands(context, debugInfoStore);
}

export function registerThreadListener(context: vscode.ExtensionContext, bridgeResponseProvider: BridgeResponseProvider) {


    // Register the listener for active stack item changes
    vscode.debug.onDidChangeActiveStackItem(async (activeItem) => {
        // Update the stored active thread or stack frame when it changes
        if (activeItem instanceof vscode.DebugThread) {
            debugInfoStore.updateActiveDebugInfo(activeItem, null); // Only thread is active
        } else if (activeItem instanceof vscode.DebugStackFrame) {
            // Active item is a stack frame, so update with the associated thread
            /*if(!stackTraceCollector.initialLoad()){
                await stackTraceCollector.initFromFrame(activeItem);
            }
            const currentStackTrace = stackTraceCollector.getStackTrace();
            console.log(currentStackTrace);*/
            const threadId = activeItem.threadId;
            if (activeItem) {
                const threadsResponse = await activeItem.session.customRequest('threads');

                const matchingThreads = threadsResponse.threads.filter((thread: any) => thread.id === threadId);
                const matchingThread = matchingThreads.length > 0 ? matchingThreads[0] : null;
                if (matchingThread) {
                    debugInfoStore.updateActiveDebugInfo(matchingThread, activeItem);
                } else {
                    vscode.window.showErrorMessage('No matching debug thread found.');
                }
            }
            //Let's see if bridge is configured 
            handleStackChange("stackFrameChanged", bridgeResponseProvider);
        }
    });
    vscode.debug.onDidTerminateDebugSession(session => {
        bridgeResponseProvider.reset();
        //console.log(JSON.stringify(DebugSessionsTracker.getActiveTrackerInstance()?.getTrackedEvents(), null, 2));
        console.log(JSON.stringify(DebugSessionsTracker.getActiveTrackerInstance()?.parseDebugSessionEvents(), null, 2));
        DebugSessionsTracker.getActiveTrackerInstance()?.resetSession();
        if (ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isRecording')) {
            DebugSessionsTracker.getActiveTrackerInstance()?.createMacro();
            ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isRecording', false);
        }
        if (ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isPlaying')) {
            ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPlaying', false);
            new Promise(resolve => setTimeout(resolve, 3000)).then((res) => {
                ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPaused', false); // Debug session ended force update the micro play context var

            });
        }
    })
    vscode.debug.onDidStartDebugSession(session => {
        if (session.type === 'java') {
            const config = session.configuration;

        }
    });


}

export function registerDebugInsightsCommand(context: vscode.ExtensionContext, bridgeResponseProvider: BridgeResponseProvider) {
    let disposable = vscode.commands.registerCommand('java.debugx.bridge.debugInsights', async () => {
        handleGetDebugInsights(bridgeResponseProvider);
    });
    context.subscriptions.push(disposable);
}

async function handleGetDebugInsights(bridgeResponseProvider: BridgeResponseProvider) {
    const config = vscode.workspace.getConfiguration('java.debugx');
    const bridgeConfigPath = config.get<string>('bridgeConfigPath');

    if (!bridgeConfigPath) {
        vscode.window.showErrorMessage('Bridge config path is not set. Please set it in the configuration.');
        return;
    }

    const bridgeConfigManager = new BridgeConfigManager(bridgeConfigPath);

    // Register the bridge configuration
    await bridgeConfigManager.registerBridgeConfiguration();

    // Check if the bridge is configured and proceed with command execution logic
    if (!bridgeConfigManager.isBridgeConfigured()) {
        vscode.window.showErrorMessage('Bridge configuration is invalid.');
        return;
    }

    // Retrieve commands and auto-triggers
    const commands = bridgeConfigManager.getCommands();
    if (!commands)
        return;
    // Get command names
    const commandItems = commands.map(command => {
        return {
            label: command.title,  // Show the file name
            command: command,  // Show the truncated relative path as description

        };
    });

    // Show command selection to the user
    const selectedCommand = await vscode.window.showQuickPick(commandItems, {
        placeHolder: 'Select a command to execute'
    });

    if (!selectedCommand) {
        return; // User canceled the selection
    }

    // Build the evaluation command based on the type and selected command
    const commandConfig = selectedCommand.command;
    if (!commandConfig) {
        vscode.window.showErrorMessage('Command not found in configuration.');
        return;
    }


    const args = commandConfig.args || [];
    let evalCommand = "";
    if (bridgeConfigManager.getType() == "java") {
        evalCommand = `((${bridgeConfigManager.getInstanceName()})Class.forName("${bridgeConfigManager.getInstanceName()}").getConstructor(Object.class).newInstance(this)).${commandConfig.command}(${args.join(', ')})`

        if (commandConfig.reponsetype) {
            if (commandConfig.reponsetype == "org.json.JSONObject") {
                evalCommand = `${evalCommand}.toString()`
            } else if (commandConfig.reponsetype == "com.ibm.json.java.JSONObject") {
                evalCommand = `${evalCommand}.serialize()`
            } else {
                vscode.window.showErrorMessage(`Invalid response type for command ${commandConfig.title}`);
                return;
            }
        } else if (!commandConfig.reponsetype) {
            evalCommand = `${evalCommand}.serialize()`;
        }
    }

    const activeDebugInfo = debugInfoStore.getActiveDebugInfo();
    // Evaluate the command (implement this method based on your context)
    if (activeDebugInfo.thread && activeDebugInfo.stackFrame) {
        const response = await debugSessionEval(activeDebugInfo.stackFrame?.session, activeDebugInfo.stackFrame, evalCommand);

        const cleanResult = response.startsWith('\'"') && response.endsWith('"\'')
            ? JSON.parse(response.slice(2, -2))
            : response;
        let jsonResponse;
        try {
            jsonResponse = JSON.parse(cleanResult);
        } catch (err: any) {
            vscode.window.showErrorMessage(`Command response parse error ${err.message}`)
            return;
        }

        pushResponseToView(commandConfig, bridgeResponseProvider, selectedCommand.command.responseid, jsonResponse);
    } else {
        vscode.window.showErrorMessage('No active stack frame found. Please ensure you are debugging.');
    }
}



export async function debugSessionEval(session: vscode.DebugSession, frame: vscode.DebugStackFrame, command: string): Promise<any> {
    try {
        const escapedCommand = command.replace(/\n/g, '\\n').replace(/\t/g, '\\t');

        const response = await session.customRequest('evaluate', {
            expression: escapedCommand,
            frameId: frame.frameId, // Use frameId to evaluate in the context of the given stack frame
        });
        console.debug(response);
        return response?.result;
    } catch (error: any) {
        console.error(error);
        vscode.window.showErrorMessage(`Error evaluating : ${error.message}`);
        Logger.log(`Error evaluating : ${error.message}`)
        return `{"status":"error","messge":"${error.message}"}`;
    }
}

function pushResponseToView(commandConfig: CommandConfig, bridgeResponseProvider: BridgeResponseProvider, responseid: any, response: any) {
    if (response.status == "success" && response[responseid] != null && !commandConfig.destructure)
        response = response[responseid]
    if (commandConfig.destructure && commandConfig.destructurepath) {
        let evalres = getValueByPath(response, commandConfig.destructurepath);
        if (evalres.evaluated) {
            responseid = evalres.key;
            response = evalres.response;
        }
    }
    if (response.status == "hidden")
        return;
    bridgeResponseProvider.updateResponse(responseid, response);
}

function getValueByPath(obj: any, path: string): { evaluated: Boolean, response: any, key?: any } {
    const keys = path.split(".");

    let result: any = obj;
    var lastKey: any = null;
    for (const key of keys) {
        // Check if key is an array access (e.g., myList[0])
        const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
        if (arrayMatch) {
            const arrayKey = arrayMatch[1]; // Object property name (e.g., 'myList')
            const index = parseInt(arrayMatch[2]); // Array index (e.g., '0')

            if (result && Array.isArray(result[arrayKey]) && index < result[arrayKey].length) {
                result = result[arrayKey][index];
                lastKey = arrayKey;
            } else {
                return { evaluated: false, response: obj }; // Return original object if any key/index is invalid
            }
        } else {
            // Regular object property access
            if (result && key in result) {
                result = result[key];
                lastKey = key;
            } else {
                return { evaluated: false, response: obj };; // Return original object if any key is invalid
            }
        }
    }

    return { evaluated: true, response: result, key: lastKey };;
}

// Function to handle stack changes
async function handleStackChange(event: string, bridgeResponseProvider: BridgeResponseProvider) {
    const config = vscode.workspace.getConfiguration('java.debugx');
    const bridgeConfigPath = config.get<string>('bridgeConfigPath');

    if (!bridgeConfigPath) {
        return; // Do nothing if the path is not set
    }

    const bridgeConfigManager = new BridgeConfigManager(bridgeConfigPath);

    // Register the bridge configuration
    await bridgeConfigManager.registerBridgeConfiguration();

    // Check if the bridge is configured
    if (!bridgeConfigManager.isBridgeConfigured()) {
        return; // Do nothing if the configuration is invalid
    }
    if (bridgeConfigManager.getType() != "java") {
        return; //  Doesn't support other languages 
    }

    // Retrieve auto-trigger commands
    const autoTriggers = bridgeConfigManager.getAutoTriggers();

    if (autoTriggers.length === 0) {
        return; // No auto-trigger commands to execute
    }
    //const prevResponses = bridgeResponseProvider.getResponsesCopy();
    //bridgeResponseProvider.reset();

    // Execute each auto-trigger command
    for (const triggerCommand of autoTriggers) {

        const commandConfig = triggerCommand;

        if (!commandConfig) {
            continue; // Skip if the command configuration is not found
        }

        if (event == "stackFrameChanged" && !commandConfig.events.stackFrameChanged) {
            continue; //Skip the command
        }

        if (event == "stepOver" && !commandConfig.events.stepOver) {
            continue; // Skip the command
        }


        if (event == "stackFrameChanged" && commandConfig.persistOnStackChange && bridgeResponseProvider.getResponsesCopy().has(commandConfig.responseid)) {
            continue;
        }

        // Get the current stack frame
        const currentFrame = debugInfoStore.getActiveDebugInfo();

        if (!currentFrame || !currentFrame.stackFrame?.session) {
            continue; // Skip if no active stack frame
        }

        // Build the evaluation command based on the type and selected command

        const args = commandConfig.args ? await parser.parseArgs(commandConfig.args) : [];
        let evalCommand = "";
        if (bridgeConfigManager.getType() == "java") {
            evalCommand = `((${bridgeConfigManager.getInstanceName()})Class.forName("${bridgeConfigManager.getInstanceName()}").getConstructor(Object.class).newInstance(this)).${commandConfig.command}(${args.join(', ')})`

            if (commandConfig.reponsetype) {
                if (commandConfig.reponsetype == "org.json.JSONObject") {
                    evalCommand = `${evalCommand}.toString()`
                } else if (commandConfig.reponsetype == "com.ibm.json.java.JSONObject") {
                    evalCommand = `${evalCommand}.serialize()`
                } else {
                    vscode.window.showErrorMessage(`Invalid response type for command ${commandConfig.title}`);
                    return;
                }
            } else if (!commandConfig.reponsetype) {
                evalCommand = `${evalCommand}.toString()`;
            }
        }
        // Evaluate the command
        const response = await debugSessionEval(currentFrame.stackFrame?.session, currentFrame.stackFrame, evalCommand);
        const cleanResult = response.startsWith('"') && response.endsWith('"')
            ? response.slice(1, -1)
            : response;
        let jsonResponse;
        try {
            jsonResponse = JSON.parse(sanitizeJSONString(cleanResult));
        } catch (err: any) {
            vscode.window.showErrorMessage(`Autotrigger command response parse error ${err.message}`)
            continue;
        }
        if (jsonResponse.status == "error" && commandConfig.hideonerror)
            continue;

        // Push the response to the view
        pushResponseToView(commandConfig, bridgeResponseProvider, commandConfig.responseid, jsonResponse);
    }

}
function sanitizeJSONString(input: string) {
    return input
        .replace(/\n/g, "")    // Escapes newlines
        .replace(/\r/g, "")    // Escapes carriage returns
        .replace(/\t/g, "")    // Escapes tabs
}
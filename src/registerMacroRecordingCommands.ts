// Copyright (c) 2024 Soumya Prasad Rana
// 
// Licensed under the MIT License. See the LICENSE file in the project root for license information.
//
// Author: Soumya Prasad Rana
// Email: soumyaprasad.rana@gmail.com
import * as vscode from 'vscode';
import { DebugSessionsTracker, StackFrame } from './debugSessionsTracker';
import * as fs from 'fs';
import * as path from 'path';
import { DebugInfoStore } from './handleGetDebugInsights';
import { Logger } from './logger';
import { StatusBarProvider } from './statusBarProvider';
import { ContextProvider } from './vscodeContextProvider';

export async function registerMacroRecordingCommands(context: vscode.ExtensionContext, debugInfoStore: DebugInfoStore) {

    let startDisposable = vscode.commands.registerCommand('java.debugx.macro.startRecording', async () => {
        if (!DebugSessionsTracker.getActiveTrackerInstance()?.setMacroStartIndex()) {
            Logger.logError(`Unable to start macro recording session`);
        }
        else {
            Logger.logInformation(`Macro recording session started`);
            ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isRecording', true);
        }
    });
    context.subscriptions.push(startDisposable);

    let stopDisposable = vscode.commands.registerCommand('java.debugx.macro.stopRecording', async () => {
        //ContextProvider.setContextPersistToWorkspaceState( 'java.debugx.macro.isRecording', false);
        if (!DebugSessionsTracker.getActiveTrackerInstance()?.setMacroEndIndex())
            Logger.logError(`Unable to stop macro recording session`);
        else {
            DebugSessionsTracker.getActiveTrackerInstance()?.createMacro();
            ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isRecording', false);
        }
    });

    context.subscriptions.push(stopDisposable);

    let playDisposable = vscode.commands.registerCommand('java.debugx.macro.playRecording', async () => {
        if (ContextProvider.getContextFromWorkspaceState('java.debugx.macro.isPlaying')) {
            Logger.logError(`Can't play right now, already playing a macro.`);
            return;
        }
        playMacroCommand(debugInfoStore);

    });
    context.subscriptions.push(playDisposable);

    let pauseDisposable = vscode.commands.registerCommand('java.debugx.macro.pauseMacroPlay', async () => {
        const isPlaying = ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isPlaying');
        if (!isPlaying) {
            Logger.logError(`Unable to pause, make sure macro session is playing.`);
        }
        else {
            Logger.logInformation(`Macro execution paused`);
            ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPaused', true);
            StatusBarProvider.setProgressMessage(`Macro execution paused`);
        }
    });
    context.subscriptions.push(pauseDisposable);

    let resumeDisposable = vscode.commands.registerCommand('java.debugx.macro.resumeMacroPlay', async () => {
        const isPlaying = ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isPlaying');
        const isPaused = ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isPaused');
        if (!isPlaying || !isPaused) {
            Logger.logError(`Unable to resume, make sure macro session is playing and is in paused state.`);
        }
        else {
            Logger.logInformation(`Macro execution resumed`);
            ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPaused', false);
        }
    });
    context.subscriptions.push(resumeDisposable);

    let stopMacroDisposable = vscode.commands.registerCommand('java.debugx.macro.stopMacroPlay', async () => {
        const isPlaying = ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isPlaying');
        const isPaused = ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isPaused');
        if (!isPlaying || !isPaused) {
            Logger.logError(`Unable to stop, make sure macro session is playing and is in paused state.`);
        }
        else {
            Logger.logInformation(`Macro execution stopped`);
            ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPlaying', false);
            await new Promise(resolve => setTimeout(resolve, 3000));
            ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPaused', false);
        }
    });
    context.subscriptions.push(stopMacroDisposable);
}

async function validateDebugState(): Promise<boolean> {
    const activeSession = vscode.debug.activeDebugSession;
    const activeStackItem = vscode.debug.activeStackItem;
    if (!activeSession && !activeStackItem) {
        Logger.logError("Macros can only be played while debugging and in a stopped state.");
        return false;
    }
    return true;
}

async function showMacroPicker(): Promise<string | undefined> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceFolder) {
        Logger.logError("No workspace folder is open.");
        return;
    }

    const macrosDir = path.join(workspaceFolder, 'macros');
    if (!fs.existsSync(macrosDir)) {
        Logger.logError(`Macro directory not found at ${macrosDir}`);
        return;
    }

    // Read all JSON files in the macros folder
    const macroFiles = fs.readdirSync(macrosDir).filter(file => file.endsWith('.json'));
    if (macroFiles.length === 0) {
        Logger.logInformation("No macros found in the macros folder.");
        return;
    }

    // Display macro files in quick pick
    const selectedMacro = await vscode.window.showQuickPick(macroFiles, {
        placeHolder: "Select a macro to play"
    });

    return selectedMacro ? path.join(macrosDir, selectedMacro) : undefined;
}

async function loadMacroFile(macroFilePath: string): Promise<StackFrame[] | undefined> {
    try {
        const fileContent = fs.readFileSync(macroFilePath, 'utf-8');
        return JSON.parse(fileContent) as StackFrame[];
    } catch (error: any) {
        Logger.logError(`Failed to load macro file: ${error.message}`);
        return;
    }
}

async function playMacroCommand(debugInfoStore: DebugInfoStore) {

    // Step 1: Check debug state
    if (!await validateDebugState()) return;

    // Step 2: Show macro files in quick pick
    const macroFilePath = await showMacroPicker();
    if (!macroFilePath) return;

    // Step 3: Load and parse the selected macro file
    const macro = await loadMacroFile(macroFilePath);
    if (!macro) return;

    Logger.log(`Loaded macro file ${macroFilePath}.`);
    // Proceed with playing the macro using the loaded `macro` array
    try {
        StatusBarProvider.showProgress("Playing Macro...", async () => {
            try {
                ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPlaying', true);
                await playMacro(macro, macroFilePath, debugInfoStore);
            }
            catch (err: any) {
                Logger.logError(`Error occurred while playing the macro: ${err.message}`);
                ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPlaying', false); await new Promise(resolve => setTimeout(resolve, 3000)); ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPaused', false);
            }
        });

    } catch (err: any) {
        ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPlaying', false); await new Promise(resolve => setTimeout(resolve, 3000)); ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPaused', false);
        Logger.logError(`Error occurred while playing the macro: ${err.message}`)
    }
}


async function playMacro(macro: StackFrame[], macroFilePath: string, debugInfoStore: DebugInfoStore): Promise<void> {
    const currentThreadId = debugInfoStore.hasActiveDebugInfo() ? debugInfoStore.getActiveDebugInfo().stackFrame?.threadId : null;

    if (currentThreadId == null) {
        throw new Error(`Unable to find current stopped thread ID.`);
    }
    let currentStepIndex = 1;  // Start after the initial breakpoint.

    // Validate initial breakpoint location
    const initialStep = macro[0];

    // Reset debugInfoStore MultiThread variables
    debugInfoStore.resetMultiThreadVars();

    // Check if the macro is multi threaded
    const isMultiThreadedSession = hasMultipleThreadIds(macro);

    if (initialStep.prevEvent.event == 'undefined' && !await validateCurrentPosition(initialStep.file, initialStep.line, debugInfoStore)) {
        throw new Error(`Debug position mismatch at macro start: Expected ${initialStep.file}:${initialStep.line}`);
    } else {
        if (initialStep.prevEvent.event != 'undefined')
            currentStepIndex = 0;
    }

    let isPlaying = ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isPlaying') ?? false;
    let isPaused = ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isPaused') ?? false;

    const config = vscode.workspace.getConfiguration('java.debugx');
    const delayTime = config.get<number>('macro.stepDelayInSeconds') ?? 1;
    // Iterate through each step in the macro
    let count = 0;
    while (isPlaying) {
        count++;
        isPlaying = ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isPlaying') ?? false;
        isPaused = ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isPaused') ?? false;

        if (isPaused) {
            Logger.log(`Macro play execution paused at step ${currentStepIndex - 1}. Waiting for 2 seconds.`);
            await new Promise(resolve => setTimeout(resolve, 2000));

        }
        // Continue only if not paused
        while (!isPaused && currentStepIndex < macro.length) {

            const step = macro[currentStepIndex];
            if (delayTime) {
                Logger.log(`[macro-step] [delay] waiting for ${delayTime} seconds.`);
                await new Promise(resolve => setTimeout(resolve, (delayTime * 1000)));
            }
            StatusBarProvider.setProgressMessage(`[macro-step] [${currentStepIndex + 1}] ${step.file}:${step.line}`);

            if (step.prevEvent) {
                delete step.prevEvent.event.seq;
            }

            const { event: commandToExecute } = step.prevEvent;
            Logger.log(`[macro-step] [${currentStepIndex + 1}]  beforeExecute`);
            let multiThreadSessionCurrentThread = null;

            if (isMultiThreadedSession) {

                debugInfoStore.setMultiThreadedSession();
                const hasThreadChangedBetweenFrames = hasThreadChanged(step, macro[currentStepIndex - 1]);

                if ((commandToExecute && commandToExecute.command && commandToExecute.command == 'multithread-stopped')) {
                    if (step.breakpoints && step.breakpoints.length > 0) {
                        for (const item of step.breakpoints) {
                            if (!syncBreakpointsFromMetadata(item.event?.event.arguments)) {
                                throw new Error(`Playback halted: Unable to sync breakpoints ${JSON.stringify(commandToExecute.arguments.lines)}.`);
                            }
                        }
                        // Current session is a multi threaded session and current step is a multithreaded-stopped event, we have done some breakpoint operation so now we have to wait for the debugger to stop the thread for the current step
                        await waitForDebuggerStop(debugInfoStore);
                    }

                }

                if (hasThreadChangedBetweenFrames) {
                    const debugSession = vscode.debug.activeDebugSession;
                    if (debugSession) {
                        // Get all threads for the current session
                        const response = await debugSession.customRequest('threads');
                        const threads = response.threads;

                        for (const thread of threads) {
                            // Get the top stack frame for each stopped thread
                            const stackResponse = await debugSession.customRequest('stackTrace', {
                                threadId: thread.id,
                                startFrame: 0,
                                levels: 1
                            });

                            const topFrame = stackResponse.stackFrames[0];

                            // Check if the top frame's file matches the current event's file
                            if (topFrame?.source?.name === step.file) {
                                // Set the event current thread Id to the changed thread
                                multiThreadSessionCurrentThread = thread.id;
                                break; // Stop searching after finding the first match
                            }
                        }
                    }
                    if ((commandToExecute && commandToExecute.command && commandToExecute.command == 'multithread-stopped')) {
                        if (multiThreadSessionCurrentThread == null)
                            throw new Error(`Playback halted: Unable to find stopped thread for current step.`);
                        else
                            Logger.log(`[macro-step] [${currentStepIndex + 1}] [validated] Thread [${multiThreadSessionCurrentThread}] is stopped.`)
                    } else {
                        if (multiThreadSessionCurrentThread != null) {
                            debugInfoStore.setHasThreadChangedBetweenFrames(true);
                            debugInfoStore.setActiveThreadForMultiThreadSession(multiThreadSessionCurrentThread);
                        }
                    }

                } else {
                    debugInfoStore.setHasThreadChangedBetweenFrames(false);
                    debugInfoStore.setActiveThreadForMultiThreadSession(null);
                }
            }
            if ((commandToExecute && commandToExecute.command && commandToExecute.command == 'multithread-stopped')) {
                currentStepIndex++;
                continue; //skip; doesn't need macro execution for prev event
            }

            try {
                if (commandToExecute.command === 'setBreakpoints') {
                    if (!syncBreakpointsFromMetadata(commandToExecute.arguments)) {
                        throw new Error(`Playback halted: Unable to sync breakpoints ${JSON.stringify(commandToExecute.arguments.lines)}.`);
                    }
                    const continueEvent = {
                        command: "continue",
                        arguments: { threadId: debugInfoStore.getActiveDebugInfo().stackFrame?.threadId }, // Placeholder, to be overridden
                        type: "request"
                    };
                    await executeDebugCommand(continueEvent, debugInfoStore);
                } else {
                    if (step.breakpoints && step.breakpoints.length > 0) {
                        for (const item of step.breakpoints) {
                            if (!syncBreakpointsFromMetadata(item.event?.event.arguments)) {
                                throw new Error(`Playback halted: Unable to sync breakpoints ${JSON.stringify(commandToExecute.arguments.lines)}.`);
                            }
                        }
                    }
                    await executeDebugCommand(commandToExecute, debugInfoStore);
                }

                Logger.log(`[macro-step] [${currentStepIndex + 1}]  executed, waiting debugger to stop`);
                const reached = await waitForDebuggerStop(debugInfoStore);

                if (!reached || !await validateCurrentPosition(step.file, step.line, debugInfoStore)) {
                    await processException(
                        debugInfoStore?.getActiveDebugInfo().stackFrame?.session,
                        debugInfoStore.getActiveDebugInfo().stackFrame?.threadId,
                        macroFilePath,
                        debugInfoStore
                    );
                    throw new Error(`Playback halted: Expected ${step.file}:${step.line} but reached a different location.`);
                } else {
                    Logger.log(`[macro-step] [${currentStepIndex + 1}]  ${step.prevEvent.parsedMessage ?? 'Executed ' + commandToExecute.command}`);
                }

            } catch (error) {
                ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPlaying', false); await new Promise(resolve => setTimeout(resolve, 3000)); ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPaused', false);
                Logger.logError(`Error during playback: ${error}`);
                break;
            }

            // Increment step index and refetch `isPaused`
            currentStepIndex++;
            isPaused = ContextProvider.getContextFromWorkspaceState<boolean>('java.debugx.macro.isPaused') ?? false;
        }

        // Exit if all steps are processed
        if (currentStepIndex >= macro.length) {
            isPlaying = false;
            ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPlaying', false); await new Promise(resolve => setTimeout(resolve, 3000)); ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPaused', false);
            break;
        }
    }
    ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPlaying', false); await new Promise(resolve => setTimeout(resolve, 3000)); ContextProvider.setContextPersistToWorkspaceState('java.debugx.macro.isPaused', false);
    Logger.logInformation(`Macro execution ended.`)

}

function hasMultipleThreadIds(stackFrames: StackFrame[]): boolean {
    const threadIds = new Set<number>();

    for (const frame of stackFrames) {
        const threadId = frame.prevEvent?.event?.arguments?.threadId;

        if (threadId !== undefined) {
            threadIds.add(threadId);
        }

        if (threadIds.size > 1) {
            return true; // Found multiple different threadIds
        }
    }

    return false; // Only one unique threadId found (or none at all)
}

function syncBreakpointsFromMetadata(metadata: any) {
    const { source, lines } = metadata;

    if (!source || !source.path || !Array.isArray(lines)) {
        console.error("Invalid metadata format");
        return false;
    }

    const documentUri = source.path.includes("jdt://") ? vscode.Uri.parse(source.path) : vscode.Uri.file(source.path);

    // Get all current breakpoints for this file
    const currentBreakpoints = vscode.debug.breakpoints.filter(bp =>
        bp instanceof vscode.SourceBreakpoint &&
        bp.location.uri.toString() === documentUri.toString()
    );

    // Get line numbers of current breakpoints in this file
    const currentLines = currentBreakpoints.map((bp: any) => bp.location.range.start.line + 1); // Convert to 1-based line numbers

    // Determine lines to add or remove
    const linesToAdd = lines.filter(line => !currentLines.includes(line));
    const linesToRemove = currentBreakpoints.filter((bp: any) => !lines.includes(bp.location.range.start.line + 1));

    // Add new breakpoints if there are lines to add
    if (linesToAdd.length > 0) {
        const newBreakpoints = linesToAdd.map(line => new vscode.SourceBreakpoint(
            new vscode.Location(documentUri, new vscode.Position(line - 1, 0)) // Convert line back to 0-based
        ));
        vscode.debug.addBreakpoints(newBreakpoints);
        Logger.log(`Added breakpoints at lines: ${linesToAdd.join(", ")}`);
    }

    // Remove outdated breakpoints if there are lines to remove
    if (linesToRemove.length > 0) {
        vscode.debug.removeBreakpoints(linesToRemove);
        const removedLines = linesToRemove.map((bp: any) => bp.location.range.start.line + 1);
        Logger.log(`Removed breakpoints from lines: ${removedLines.join(", ")}`);
    }
    return true;
}

function hasThreadChanged(frame1: StackFrame, frame2: StackFrame): boolean {
    if (!frame1 || !frame2)
        return false;

    if (frame2.prevEvent?.event?.command == 'multithread-stopped')
        return true;

    const threadId1 = frame1.prevEvent?.event?.arguments?.threadId;
    const threadId2 = frame2.prevEvent?.event?.arguments?.threadId;

    // Check if both thread IDs are present and differ
    if (threadId1 !== undefined && threadId2 !== undefined) {
        return threadId1 !== threadId2;
    }

    // If either thread ID is missing, return false
    return false;
}



async function processException(session: vscode.DebugSession | undefined, threadId: number | undefined, macroFilePath: string, debugInfoStore: DebugInfoStore) {
    try {
        if (!session || !threadId)
            return;
        if (session.configuration.type == 'java' || session.configuration.type == 'pwa-node' || session.configuration.type == 'node') {
            const line = getCurrentLine();
            if (line && (line.lineText.includes("catch") || line.lineText.includes("except"))) {
                Logger.log(`             Seems we caught an exception, will try to get diagnostic infomations...`)
                try {
                    const response = await session.customRequest('next', {
                        threadId: threadId,
                    });
                    console.log(response);
                    const reached = await waitForDebuggerStop(debugInfoStore);
                    if (!reached) {
                        Logger.logError(`Unable to fetch exception details.`);
                        return;
                    }
                    const exVar = extractExceptionVariableName(line.lineText);

                    let exEvalExp;
                    if (session.configuration.type == 'java')
                        exEvalExp = `String.format(\"{\\"exception\\": { \\"message\\": \\"%s\\", \\"stackTrace\\": \\"%s\\" }, \\"cause\\": { \\"message\\": \\"%s\\", \\"stackTrace\\": \\"%s\\" }}\",${exVar}.getMessage(),java.util.Arrays.stream(${exVar}.getStackTrace()).map(Object::toString).collect(java.util.stream.Collectors.joining(\"\\n\")),(${exVar}.getCause() != null ? ${exVar}.getCause().getMessage() : \"null\"),(${exVar}.getCause() != null ? java.util.Arrays.stream(${exVar}.getCause().getStackTrace()).map(Object::toString).collect(java.util.stream.Collectors.joining("\\n")) : \"null\"))`;
                    else
                        exEvalExp = `return "message:" + error.message +"\\n"+ "stack:"+ error.stack.split('\n').join('\\n')`;

                    const exceptionDetails = await session.customRequest('evaluate', {
                        expression: exEvalExp,
                        frameId: debugInfoStore.getActiveDebugInfo()?.stackFrame?.frameId
                    });

                    if (exceptionDetails && exceptionDetails.result) {

                        try {
                            const cleanResult = (exceptionDetails.result.startsWith('"') && exceptionDetails.result.endsWith('"')) || (exceptionDetails.result.startsWith("'") && exceptionDetails.result.endsWith("'"))
                                ? exceptionDetails.result.slice(1, -1)
                                : exceptionDetails.result;
                            let jsonRes = false;
                            let diagnosticInfo;
                            try {
                                diagnosticInfo = JSON.parse(cleanResult);
                                jsonRes = true;
                            } catch (err) {
                                diagnosticInfo = cleanResult;
                            }
                            const workspaceFolders = vscode.workspace.workspaceFolders;
                            if (!workspaceFolders) {
                                Logger.logError('No workspace is open.');
                                return false;
                            }
                            const workspaceFolder = workspaceFolders[0].uri.fsPath;
                            const macrosFolder = `${workspaceFolder}/macros/diagnostics`;
                            // Create the macros folder if it doesn't exist
                            if (!fs.existsSync(macrosFolder)) {
                                fs.mkdirSync(macrosFolder, { recursive: true });
                            }

                            // Generate a timestamp
                            const timestamp = Date.now();

                            // Create the filename
                            const filename = `${macroFilePath.split("/").pop()?.replace(".json", "")}-diagnostic-${timestamp}${jsonRes ? '.json' : '.txt'}`;

                            // Create the full file path
                            const filePath = `${macrosFolder}/${filename}`;

                            // Write the debugEventsData to the file
                            if (jsonRes)
                                fs.writeFileSync(filePath, JSON.stringify(diagnosticInfo, null, 2));
                            else
                                fs.writeFileSync(filePath, diagnosticInfo);

                            const fileUri = vscode.Uri.file(filePath);

                            Logger.logInformation(`Macro session diagnostic data saved to [${filePath}](${fileUri.toString()})`);


                        } catch (err: any) {
                            Logger.logError(`Error Occured while saving macro session diagnostic data ${err}`);
                            Logger.log(err.toString());
                        }
                    }


                } catch (err: any) {
                    Logger.logError(`Error extracting exception details: ${err.message}`);
                    return;
                }
            }

        }
        else {
            Logger.log(`Processing exception is not supported for ${session.configuration.type}.`)
        }
    } catch (error: any) {
        console.error(error);
        Logger.logError(`Error evaluating Java code: ${error.message}`);
        return;
    }
}

/**
 * Extracts the exception variable name from a catch/except block line in Java, Node, Python.
 * Supports both single and multi-type catch blocks.
 *
 * @param lineContent - The content of the line with the catch block.
 * @returns The extracted exception variable name, or null if not found.
 */
function extractExceptionVariableName(lineContent: string): string | null {
    // Regular expression to match Java catch blocks with single or multiple exception types
    const catchRegex = /catch\s*\(\s*([\w|<> ]+)\s+(\w+)\s*\)/g;
    // Regular expression to match Python except blocks
    const exceptRegex = /except\s+([\w|<> ]+)\s+as\s+(\w+)/g;
    let match;

    // Find all matches for 'catch' blocks in the line content
    while ((match = catchRegex.exec(lineContent)) !== null) {
        // The variable name is captured in the second group
        if (match[2]) {
            return match[2];
        }
    }

    // Find all matches for 'except' blocks in the line content
    while ((match = exceptRegex.exec(lineContent)) !== null) {
        // The variable name is captured in the second group
        if (match[2]) {
            return match[2];
        }
    }

    // If no variable name is found, return null
    return null;
}



function getCurrentLine() {
    const editor = vscode.window.activeTextEditor; // Get the active text editor
    if (editor) {
        const position = editor.selection.active; // Get the current cursor position
        const lineNumber = position.line; // Current line number (0-indexed)
        const lineText = editor.document.lineAt(lineNumber).text; // Get the text of the current line

        console.log(`Current Line Number: ${lineNumber + 1}`); // +1 to convert to 1-indexed
        console.log(`Current Line Text: ${lineText}`);
        return { lineNumber: lineNumber + 1, lineText }; // Return line number as 1-indexed
    } else {
        console.warn('No active editor found.');
        return null;
    }
}

// Helper function to execute a debug command on the current thread
async function executeDebugCommand(commandEvent: any, debugInfoStore: DebugInfoStore): Promise<void> {
    if (!debugInfoStore.isMultiThreaded()) {
        const currentThreadId = debugInfoStore.getActiveDebugInfo().stackFrame?.threadId;
        const session = debugInfoStore.getActiveDebugInfo().stackFrame?.session;
        commandEvent.arguments.threadId = currentThreadId;
        const res = await session?.customRequest(commandEvent.command, commandEvent.arguments);
        return res;
    } else {
        const currentThreadId = debugInfoStore.getHasThreadChangedBetweenFrames() && debugInfoStore.getThreadIdForMultiThreadedSession() != null ? debugInfoStore.getThreadIdForMultiThreadedSession() : debugInfoStore.getActiveDebugInfo().stackFrame?.threadId;
        const session = debugInfoStore.getActiveDebugInfo().stackFrame?.session;
        commandEvent.arguments.threadId = currentThreadId;
        const res = await session?.customRequest(commandEvent.command, commandEvent.arguments);
        return res;
    }
}

// Helper function to validate the current debugger position
async function validateCurrentPosition(file: string, line: number, debugInfoStore: DebugInfoStore): Promise<boolean> {
    const currentStackFrameFromStore = debugInfoStore.getActiveDebugInfo().stackFrame;
    const crrentStackFrameFromTracker = DebugSessionsTracker.getActiveTrackerInstance()?.getCurrentFrame();
    if (!debugInfoStore.isMultiThreaded() && crrentStackFrameFromTracker.id != currentStackFrameFromStore?.frameId) {
        throw new Error(`Unable to verify current stack item,  something went wrong.`);
    }
    Logger.log(`Validating current position [current-file] ${crrentStackFrameFromTracker.file} [line] ${crrentStackFrameFromTracker.line} against [macro-step-file] ${file} [line] ${line}`)
    return crrentStackFrameFromTracker && crrentStackFrameFromTracker.file === file && crrentStackFrameFromTracker.line === line;

}

// Helper function to wait for debugger stop
async function waitForDebuggerStop(debugInfoStore: DebugInfoStore): Promise<boolean> {
    return new Promise((resolve) => {
        vscode.debug.onDidChangeActiveStackItem(async (activeItem) => {

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
                        resolve(true);
                    } else {
                        Logger.logError('No matching debug thread found.');
                    }
                }

            }



        });
    });
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import { Logger } from './logger';

interface DebugSessionEvent {
    event: string;
    eventMessage: any;
}

const relevantEvents = [
    'initialize',
    'launch',
    'setBreakpoints',
    'stopped',
    'next',  // Equivalent to stepOver
    'stepIn',
    'stepOut',
    'continue',
    'terminated',
    'exited'
];

export interface StackFrame {
    file: string;
    line: number;
    method: string;
    prevEvent?: any;
    breakpoints?: any;
}

interface DebugSessionData {
    events: { event: any, parsedMessage: string }[];
    breakpoints: StackFrame[];
    steps: StackFrame[];
    threadInfo: Record<number, string>;
}

export class DebugSessionsTracker implements vscode.DebugAdapterTracker {

    private static instance: DebugSessionsTracker | null = null;
    private activeSession: vscode.DebugSession | null = null;
    private debugSessionEventTracker: DebugSessionEvent[] = [];
    private macroStartIndex: number = 0;
    private macroEndIndex: number = 0;

    private currentFrame: any;
    private currentThread: any;

    // Singleton implementation
    private constructor(session: vscode.DebugSession) {
        this.setActiveSession(session);
    }

    public getCurrentFrame() {
        return this.currentFrame;
    }

    public getCurrentThread() {
        return this.currentThread;
    }


    public setMacroStartIndex(): boolean {
        if (!this.activeSession) {
            Logger.log(`Unable to set macro start index due to no active session found`);
            return false;
        }
        if(this.activeSession.type != 'java'){
            Logger.logError(`Currently, Debug Macro session recordings are supported only for Java debug sessions.`);
            return false;
        }
        if (this.debugSessionEventTracker.length == 0) {
            this.macroStartIndex = 0;

        } else {
            this.macroStartIndex = this.debugSessionEventTracker.length - 1;
        }
        return true;
    }

    public setMacroEndIndex(): boolean {
        if (!this.activeSession) {
            Logger.log(`Unable to set macro end index due to no active session found`);
            return false;
        }
        if (this.debugSessionEventTracker.length == 0) {
            return false;

        } else {
            this.macroEndIndex = this.debugSessionEventTracker.length - 1;
        }
        return true;
    }

    public createMacro(): boolean {
        if (this.macroStartIndex == this.macroEndIndex) {
            return false;
        }
        const debugEventsData = this.parseDebugSession(this.debugSessionEventTracker.splice(this.macroStartIndex, this.macroEndIndex - this.macroStartIndex));
        if (debugEventsData.steps.length > 0) {
            try {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    vscode.window.showErrorMessage('No workspace is open.');
                    return false;
                }
                const workspaceFolder = workspaceFolders[0].uri.fsPath;
                const macrosFolder = `${workspaceFolder}/macros`;
                // Create the macros folder if it doesn't exist
                if (!fs.existsSync(macrosFolder)) {
                    fs.mkdirSync(macrosFolder, { recursive: true });
                }

                // Generate a timestamp
                const timestamp = Date.now();

                // Create the filename
                const filename = `macro-session-${timestamp}.json`;

                // Create the full file path
                const filePath = `${macrosFolder}/${filename}`;

                // Write the debugEventsData to the file
                fs.writeFileSync(filePath, JSON.stringify(debugEventsData.steps, null, 2));

                vscode.window.showInformationMessage(`Macro session data saved to ${filePath}`);
                //Rest Macro Index Points
                this.macroStartIndex = 0;
                this.macroEndIndex = 0;
                return true;
            } catch (err) {
                vscode.window.showErrorMessage(`Error Occured while saving macro session ${err}`);
                return false;
            }

        } else {
            return false;
        }
    }

    // Get the singleton instance, create one if none exists
    public static getInstance(session: vscode.DebugSession): DebugSessionsTracker {
        if (!DebugSessionsTracker.instance) {
            DebugSessionsTracker.instance = new DebugSessionsTracker(session);
            Logger.log(`Created new debug tracker instance for debug session [${session.id}] [config] ${JSON.stringify(session.configuration)}`);
        } else if (DebugSessionsTracker.instance.activeSession) {
            throw new Error("Only one debug session is allowed at a time.");
        }
        return DebugSessionsTracker.instance;
    }

    public static getActiveTrackerInstance() {
        return this.instance;
    }

    // Set the active session
    private setActiveSession(session: vscode.DebugSession): void {
        this.activeSession = session;
        this.debugSessionEventTracker = [];  // Reset tracking for a new session
    }

    // Reset the active session (e.g., when the session terminates)
    public resetSession(): void {
        this.activeSession = null;
        this.debugSessionEventTracker = [];
        DebugSessionsTracker.instance = null;  // Clear the singleton instance

    }

    //Get all tracked events
    public getTrackedEvents(): DebugSessionEvent[] {
        return this.debugSessionEventTracker;
    }

    // Event handlers
    onWillStartSession() {
        //console.log("onWillStartSession");
        this.debugSessionEventTracker.push({ event: "onWillStartSession", eventMessage: {} });
    }

    onWillReceiveMessage(message: any) {
        //console.log("onWillReceiveMessage", message);
        this.debugSessionEventTracker.push({ event: "onWillReceiveMessage", eventMessage: message });
    }

    onDidSendMessage?(message: any): void {
        //console.log("onDidSendMessage", message);
        this.debugSessionEventTracker.push({ event: "onDidSendMessage", eventMessage: message });

        if (message.event === 'stopped') {
            this.currentThread = message.body.threadId;
        } else if (message.command === 'stackTrace' && this.currentThread !== null) {
            const frames = message.body.stackFrames || [];
            if (frames.length > 0) {
                const topFrame = frames[0];
                const currentFrame = {
                    file: topFrame.source?.name || 'unknown file',
                    sourceRef: topFrame.source?.sourceReference || 0,
                    line: topFrame.line,
                    method: topFrame.name,
                    id: topFrame.id,
                    column: topFrame.column
                };
                console.log(`Setting current frame and thread ID: ${currentFrame}`);
                this.currentFrame = currentFrame;
                // this.currentThread = this.currentThread;
            }
        }
    }

    onWillStopSession?(): void {
        //console.log("onWillStopSession");
        this.debugSessionEventTracker.push({ event: "onWillStopSession", eventMessage: {} });
    }

    onError?(error: Error): void {
        //console.log("onError", error);
        this.debugSessionEventTracker.push({ event: "onError", eventMessage: error });
    }

    onExit?(code: number | undefined, signal: string | undefined): void {
        //console.log("onExit", code);
        this.debugSessionEventTracker.push({ event: "onExit", eventMessage: { code, signal } });
        this.resetSession();  // Reset the session on exit
    }


    public parseDebugSessionEvents(): DebugSessionData {
        return this.parseDebugSession(this.debugSessionEventTracker);
    }

    parseDebugSession(debugSessionEventTracker: DebugSessionEvent[]): DebugSessionData {
        const events: DebugSessionEvent[] = debugSessionEventTracker;

        const sessionData: DebugSessionData = {
            events: [],
            breakpoints: [],
            steps: [],
            threadInfo: {}
        };

        let currentThreadId: number | null = null;
        let lastStackFrame: { file: string; line: number; method: string } | null = null;
        let lastStoppedEvent: any = null;
        let lastSetBreakPointProcessedEvent: any = null;

        for (const { event, eventMessage } of events) {
            try {
                switch (event) {
                    case 'onWillReceiveMessage':
                        if (eventMessage.command === 'launch') {
                            sessionData.events.push({ event: eventMessage, parsedMessage: `Session launched for program: ${eventMessage.arguments?.program || 'unknown'}` });
                        } else if (eventMessage.command === 'setBreakpoints') {
                            const sourceFile = eventMessage.arguments?.source?.name;
                            const breakpoints = eventMessage.arguments?.breakpoints || [];
                            let bpLines = '';
                            for (const bp of breakpoints) {
                                bpLines += bp.line+" ";
                                sessionData.breakpoints.push({ file: sourceFile, line: bp.line, method: '' });
                             }
                             sessionData.events.push({ event: eventMessage, parsedMessage: `Breakpoint set at ${sourceFile}:${bpLines}` });

                        } else if (['next', 'stepIn', 'stepOut', 'continue'].includes(eventMessage.command)) {
                            sessionData.events.push({ event: eventMessage, parsedMessage: `Step command issued: ${eventMessage.command}` });
                        }
                        break;

                    case 'onDidSendMessage':
                        if (eventMessage.event === 'stopped') {
                            currentThreadId = eventMessage.body.threadId;
                            lastStoppedEvent = eventMessage;
                            sessionData.events.push({ event: eventMessage, parsedMessage: `Program stopped in thread ${currentThreadId}` });
                        } else if (eventMessage.command === 'stackTrace' && currentThreadId !== null) {
                            const frames = eventMessage.body.stackFrames || [];
                            if (frames.length > 0) {
                                const topFrame = frames[0];
                                const currentFrame = {
                                    file: topFrame.source?.name || 'unknown file',
                                    line: topFrame.line,
                                    method: topFrame.name
                                };

                                // Check for duplicates before pushing
                                if (!lastStackFrame ||
                                    lastStackFrame.file !== currentFrame.file ||
                                    lastStackFrame.line !== currentFrame.line ||
                                    lastStackFrame.method !== currentFrame.method) {
                                    // Extract the last relevant event for the step
                                    const lastEvent = this.getLastThreadOperationEvent(sessionData.events);

                                    if (lastStoppedEvent.body.reason == 'breakpoint' && lastEvent.event.command == 'continue') {
                                        const lastSetBreakPointEvent = this.getLastThreadBreakpointOperationEvent(sessionData.events);
                                        sessionData.steps.push({
                                            ...currentFrame,
                                            prevEvent: lastSetBreakPointEvent,
                                        })
                                    } else {
                                        const needToProcessBreakpoints = this.getBreakpointSyncList(sessionData.events);
                                        if(needToProcessBreakpoints.length>0 && (!lastSetBreakPointProcessedEvent || (lastSetBreakPointProcessedEvent && lastSetBreakPointProcessedEvent != needToProcessBreakpoints[needToProcessBreakpoints.length-1]))){
                                            sessionData.steps.push({
                                                ...currentFrame,
                                                prevEvent: lastEvent, // Attach the last event that occurred before this step
                                                breakpoints:needToProcessBreakpoints
                                            });
                                            lastSetBreakPointProcessedEvent = needToProcessBreakpoints;
                                        }else{
                                            sessionData.steps.push({
                                                ...currentFrame,
                                                prevEvent: lastEvent // Attach the last event that occurred before this step
                                            });
                                        }
                                        
                                    }


                                    lastStackFrame = currentFrame; // Update last stack frame


                                }
                                sessionData.events.push({ event: eventMessage, parsedMessage: `Stack trace retrieved for thread ${currentThreadId}: ${JSON.stringify(currentFrame)}` });
                            }
                        } else if (eventMessage.event === 'thread') {
                            const threadId = eventMessage.body.threadId;
                            const reason = eventMessage.body.reason;
                            if (reason === 'started') {
                                sessionData.threadInfo[threadId] = 'running';
                                sessionData.events.push({ event: eventMessage, parsedMessage: `Thread ${threadId} started` });
                            } else if (reason === 'exited') {
                                sessionData.threadInfo[threadId] = 'exited';
                                sessionData.events.push({ event: eventMessage, parsedMessage: `Thread ${threadId} exited` });
                            }
                        } else if (eventMessage.event === 'terminated') {
                            sessionData.events.push({ event: eventMessage, parsedMessage: 'Debug session terminated' });
                        }
                        break;

                    case 'onWillStartSession':
                        sessionData.events.push({ event: "onWillStartSession", parsedMessage: 'Session starting' });
                        break;

                    case 'onWillStopSession':
                        sessionData.events.push({ event: "onWillStartSession", parsedMessage: 'Session ending' });
                        break;

                    case 'onExit':
                        sessionData.events.push({ event: eventMessage, parsedMessage: `Adapter exited with code ${eventMessage.code} and signal ${eventMessage.signal}` });
                        break;

                    default:
                        // Catch-all for unhandled events
                        sessionData.events.push({ event: event, parsedMessage: `Unhandled event` });
                }
            } catch (error) {
                console.error(`Error processing event ${event}:`, error);
            }
        }

        return sessionData;
    }

    private getLastThreadOperationEvent(events: { event: any; parsedMessage: string }[]): any {
        for (let i = events.length - 1; i >= 0; i--) {
            const event = events[i];
            // Check the parsedMessage for relevant thread operations
            if (event.parsedMessage.includes('Step command issued:')) {
                return event; // Return the last relevant thread operation event
            }
        }
        return { event: 'undefined', parsedMessage: 'No previous event' }; // Fallback if no relevant event is found
    }
    private getLastThreadBreakpointOperationEvent(events: { event: any; parsedMessage: string }[]): any {
        for (let i = events.length - 1; i >= 0; i--) {
            const event = events[i];
            // Check the parsedMessage for relevant thread operations
            if (event.parsedMessage.includes('Breakpoint set')) {
                return event; // Return the last relevant thread operation event
            }
        }
        return { event: 'undefined', parsedMessage: 'No previous event' }; // Fallback if no relevant event is found
    }

  /**
 * Compares breakpoint events before and after the last stack trace retrieve
 * and returns a list of changes to sync breakpoints.
 * @param events - Array of events containing debug operation data.
 * @returns An array of objects representing breakpoint additions or removals.
 */
private getBreakpointSyncList(events: { event: any; parsedMessage: string }[]): any[] {
    // Step 1: Find the last "Stack trace retrieved" index
    let lastStackTraceIndex = -1;
    for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].parsedMessage.includes('Stack trace retrieved')) {
            lastStackTraceIndex = i;
            break;
        }
    }

    if (lastStackTraceIndex === -1) {
        // No stack trace events found
        return [];
    }

    // Step 2: Collect relevant setBreakpoints events before the last stack trace index
    const breakpointEventsMap: Record<string, any> = {};
    for (let i = lastStackTraceIndex - 1; i >= 0; i--) {
        const event = events[i];
        if (event.event.command === "setBreakpoints" && event.event.arguments.source) {
            const filePath = event.event.arguments.source.path;

            // Store only the latest setBreakpoints event per file
            if (!breakpointEventsMap[filePath]) {
                breakpointEventsMap[filePath] = event;
            }
        }
    }

    // Step 3: Extract the unique breakpoint events from the map
    const oldBreakpoints = Object.values(breakpointEventsMap);

    // Step 4: Collect `setBreakpoints` events after the last stack trace for new data
    const newBreakpoints: Record<string, any> = {};
    for (let i = lastStackTraceIndex + 1; i < events.length; i++) {
        const event = events[i];
        if (event.event.command === "setBreakpoints" && event.event.arguments.source) {
            const filePath = event.event.arguments.source.path;
            newBreakpoints[filePath] = event; // Latest occurrence for each file
        }
    }

    const syncList: any[] = [];

    // Step 5: Compare the old and new breakpoints by file path
    for (const oldEvent of oldBreakpoints) {
        const filePath = oldEvent.event.arguments.source.path;
        const oldLines = oldEvent.event.arguments.lines;

        if (newBreakpoints[filePath]) {
            const newLines = newBreakpoints[filePath].event.arguments.lines;
            const linesDiffer = oldLines.length !== newLines.length ||
                oldLines.some((line:any, index:any) => line !== newLines[index]);

            if (linesDiffer) {
                // Update required for this file
                syncList.push({ action: "update", event: newBreakpoints[filePath] });
            }
        } else {
            // File missing in new data, mark all breakpoints for removal
            syncList.push({ action: "remove", event: oldEvent });
        }
    }

    // Step 6: Identify any new files in the new data segment
    for (const filePath in newBreakpoints) {
        if (!breakpointEventsMap[filePath]) {
            // New file, mark breakpoints as additions
            syncList.push({ action: "add", event: newBreakpoints[filePath] });
        }
    }

    return syncList;
}


    
}

export class DebugSessionsTrackerFactory implements vscode.DebugAdapterTrackerFactory {
    public createDebugAdapterTracker(session: vscode.DebugSession): vscode.DebugAdapterTracker {
        Logger.log(`Creating tracker instance for
             [${session.id}]`);
        return DebugSessionsTracker.getInstance(session);
    }
}
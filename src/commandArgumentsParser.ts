import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DebugInfoStore, debugSessionEval } from './handleGetDebugInsights';

export class CommandArgumentsParser {
    private workspaceFolder: string;
    private debugInfoStore: DebugInfoStore;
    private persistValues:Map<String,any> = new Map<String,any>();

    constructor(debugInfoStore: DebugInfoStore) {
        // Get the first workspace folder or set an empty string if no workspace is open
        this.workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
        this.debugInfoStore = debugInfoStore;
    }

    public async parseArgs(args: string[]): Promise<string[]> {
        return Promise.all(args.map(arg => this.processArgument(arg)));
    }

    private async processArgument(arg: string): Promise<string> {
        // Check if argument is a function, specifically $file:
        if (arg.startsWith('$file:')) {
            let filePath = arg.substring('$file:'.length);

            // Resolve workspace folder if ${workspaceFolder} is specified
            filePath = filePath.replace('${workspaceFolder}', this.workspaceFolder);

            // Resolve the full path for relative paths
            const resolvedPath = filePath.startsWith('/')
                ? filePath
                : path.resolve(this.workspaceFolder, filePath);

            return `"${ (await this.readFileContent(resolvedPath)).replace(/"/g, '\\"')}"`;
        }
        if (arg.startsWith('$persist:')) {
            let evalCommand = arg.substring('$persist:'.length);
            if(this.persistValues.has(evalCommand))
                return `${this.persistValues.get(evalCommand)}`
            else{
                if(this.debugInfoStore.hasActiveDebugInfo()){
                    const stackFrame = this.debugInfoStore.getActiveDebugInfo().stackFrame;
                    if(stackFrame == null){
                        return evalCommand; //let expression ebaluated at command execution runtime
                    }
                    const evalRes = await debugSessionEval(stackFrame.session,stackFrame,evalCommand);
                    if(!evalRes){
                        return evalCommand;
                    }
                    if(evalRes.startsWith("{")){
                        const evalResObj = JSON.parse(evalRes);
                        if(evalResObj.status && evalResObj.status=="evalerror"){
                            return evalCommand;
                        }else{
                            this.persistValues.set(evalCommand,evalRes);
                            return evalRes;
                        }
                    }else{
                        this.persistValues.set(evalCommand,evalRes)
                        return evalRes;
                    }
                }else{
                    return evalCommand;
                }
                
            }
                
        }

        // If no function detected, return the argument as-is
        return arg;
    }

    private async readFileContent(filePath: string): Promise<string> {
        try {
            // Read file contents as a string
            return fs.promises.readFile(filePath, 'utf-8');
        } catch (error:any) {
            vscode.window.showErrorMessage(`Error reading file at ${filePath}: ${error.message}`);
            return ''; // Return an empty string if file reading fails
        }
    }
}

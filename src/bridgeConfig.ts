// Copyright (c) 2024 Soumya Prasad Rana
// 
// Licensed under the MIT License. See the LICENSE file in the project root for license information.
//
// Author: Soumya Prasad Rana
// Email: soumyaprasad.rana@gmail.com

import * as fs from 'fs';
import * as vscode from 'vscode';
import { Logger } from './logger';

export interface CommandConfig {
    title: string;
    command: string;
    responseid: string;
    reponsetype?: string;
    args?: string[];
    autotrigger?: boolean;
    hideonerror?: boolean;
    presentation?: { //not yet implemented
        [key: string]: {
            type: "list" | "tree" | "plain";
            view?: "default" | "output" | "terminal" | "codelens";
        };
    };
    events: Events;       // Configuration for events
    persistOnStackChange?: boolean; // Indicates whether to persist data on stack changes, default: true
    destructure?: boolean, //whether to de structure the data
    destructurepath?: string
}

interface Events {
    stepOver: boolean;          // Indicates if command should triggered on step over events 
    stackFrameChanged: boolean; // Indicates if command should triggered on stack frame changed events
}

interface BridgeConfig {
    name?: string;
    type: "java" | "js";
    instance: string;
    commands: CommandConfig[];
    autoTriggers: CommandConfig[];
}


export class BridgeConfigManager {
    private configPath: string;
    private config: BridgeConfig | null = null;
    private isConfigured: boolean = false;

    constructor(configPath: string) {
        this.configPath = configPath;
    }

    // Method to load and validate the bridge configuration
    public async loadConfiguration(): Promise<void> {
        if (!fs.existsSync(this.configPath)) {
            throw new Error(`Configuration file not found at ${this.configPath}`);
        }

        const rawData = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(rawData) as BridgeConfig;

        // Validate the configuration
        if (this.validateBridgeConfig(this.config)) {
            this.isConfigured = true;
            this.extractAutoTriggers();
        } else {
            throw new Error('Invalid bridge configuration');
        }
    }

    public extractAutoTriggers() {
        if (this.config == null)
            return;
        for (const command of this.config.commands) {
            if (command.autotrigger) {
                if (!this.config.autoTriggers)
                    this.config.autoTriggers = []
                this.config.autoTriggers.push(command);
            }
        }
    }

    validateBridgeConfig(config: any): config is BridgeConfig {
        // Check for required properties
        const requiredProps = ["name", "type", "instance", "commands"];
        for (const prop of requiredProps) {
            if (!(prop in config)) {
                console.error(`Missing required property: ${prop}`);
                return false;
            }
        }

        // Validate name
        if (typeof config.name !== "string") {
            console.error("Invalid type for property 'name'. Expected a string.");
            return false;
        }

        // Validate type
        if (!["java", "js"].includes(config.type)) {
            console.error("Invalid value for property 'type'. Expected 'java' or 'js'.");
            return false;
        }

        // Validate instance
        if (typeof config.instance !== "string") {
            console.error("Invalid type for property 'instance'. Expected a string.");
            return false;
        }

        // Validate commands
        if (!Array.isArray(config.commands)) {
            console.error("Invalid type for property 'commands'. Expected an array.");
            return false;
        }

        for (const command of config.commands) {
            // Check for required properties
            const requiredProps = ["title", "command", "responseid"];
            for (const prop of requiredProps) {
                if (!(prop in command)) {
                    console.error(`Missing required property in command : ${prop}`);
                    return false;
                }
            }
            if (typeof command.title !== "string") {
                console.error("Invalid type for command property 'title'. Expected a string.");
                return false;
            }
            if (typeof command.responseid !== "string") {
                console.error("Invalid type for command property 'title'. Expected a string.");
                return false;
            }
            if (typeof command.command !== "string") {
                console.error("Invalid type for command property 'command'. Expected a string.");
                return false;
            }

            if (command.args && !Array.isArray(command.args)) {
                console.error("Invalid type for command property 'args'. Expected an array of strings.");
                return false;
            }
            if (command.autotrigger !== undefined && typeof command.autotrigger !== "boolean") {
                console.error("Invalid type for command property 'autotrigger'. Expected a boolean.");
                return false;
            }
            if (command.presentation && command.autotrigger) {
                for (const key in command.presentation) {
                    const pres = command.presentation[key];
                    if (typeof pres.type !== "string" || !["list", "tree", "plain"].includes(pres.type)) {
                        console.error(`Invalid type for presentation type in command ${command.title}.`);
                        return false;
                    }
                    if (pres.view !== undefined && !["default", "output", "terminal", "codelens"].includes(pres.view)) {
                        console.error(`Invalid value for presentation view in command ${command.title}.`);
                        return false;
                    }
                }
            }
        }

        // If all validations pass
        return true;
    }
    // Method to extract auto-trigger commands
    public getAutoTriggers(): CommandConfig[] {
        return this.config?.autoTriggers || [];
    }

    // Method to check if the bridge is configured
    public isBridgeConfigured(): boolean {
        return this.isConfigured;
    }

    // Method to get the commands
    public getCommands(): CommandConfig[] | undefined {
        return this.config?.commands;
    }

    public getInstanceName(): string {
        return this.config?.instance || "";
    }

    public getType(): string {
        return this.config?.type || "";
    }

    //  Method to register and validate the bridge configuration
    public async registerBridgeConfiguration(): Promise<void> {
        try {
            await this.loadConfiguration(); // Load and validate the configuration

            if (!this.isConfigured) {
                throw new Error('Bridge configuration is invalid.');
            }

            // Store the bridge configuration in a top-level variable or context
            // Here, we're simulating a global variable. Adjust as needed.
            (global as any).bridgeConfig = this.config; // Store it in a global variable
            //vscode.window.showInformationMessage('Bridge configuration loaded successfully.');
            Logger.log(`Bridge configuration loaded successfully.`)
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }
}

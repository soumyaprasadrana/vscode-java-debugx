import * as vscode from 'vscode';

// Represents a single response entry in the tree view with added styling
class BridgeResponseItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly value: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        
        // Set description with styled value representation
        this.description = this.getFormattedDescription(value);
        
        // Dynamically assign icon based on value type
        this.iconPath = this.getIcon(value);
    }

    // Formats the value for display in the tree item
    private getFormattedDescription(value: any): string {
        if (Array.isArray(value)) {
            return `Array(${value.length})`;
        }
        if (typeof value === 'object' && value !== null) {
            return 'Object';
        }
        if (typeof value === 'string') {
            return `String: "${value}"`; // Add quotes for clarity
        }
        return String(value);
    }

    // Returns the appropriate icon for each data type
    private getIcon(value: any): vscode.ThemeIcon {
        if (Array.isArray(value)) {
            return new vscode.ThemeIcon('list-unordered');
        }
        if (typeof value === 'object' && value !== null) {
            return new vscode.ThemeIcon('symbol-structure');
        }
        if (typeof value === 'string') {
            return new vscode.ThemeIcon('symbol-string');
        }
        if (typeof value === 'number') {
            return new vscode.ThemeIcon('symbol-numeric');
        }
        if (typeof value === 'boolean') {
            return new vscode.ThemeIcon('symbol-boolean');
        }
        return new vscode.ThemeIcon('symbol-key');
    }

    // Recursive method to expand JSON keys as tree items
    public getChildren(): BridgeResponseItem[] {
        if (typeof this.value === 'object' && this.value !== null) {
            const entries = Array.isArray(this.value)
                ? this.value.map((val, index) => [`[${index}]`, val]) // Format array indices
                : Object.entries(this.value); // Object entries as key-value pairs

            return entries.map(([key, val]) => {
                const hasChildren = typeof val === 'object' && val !== null && Object.keys(val).length > 0;
                const collapsibleState = hasChildren
                    ? vscode.TreeItemCollapsibleState.Collapsed
                    : vscode.TreeItemCollapsibleState.None;
                return new BridgeResponseItem(key, val, collapsibleState);
            });
        }
        return [];
    }
}

// Tree data provider for showing bridge command responses in a tree view
export class BridgeResponseProvider implements vscode.TreeDataProvider<BridgeResponseItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<BridgeResponseItem | undefined> = new vscode.EventEmitter<BridgeResponseItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<BridgeResponseItem | undefined> = this._onDidChangeTreeData.event;

    private responses: Map<string, any> = new Map();

    // Add or update a command response to the view
    public updateResponse(commandName: string, jsonResponse: any) {
        this.responses.set(commandName, jsonResponse);
        this._onDidChangeTreeData.fire(undefined);
    }

    public getResponsesCopy() : Map<string,any>{
        return new Map(this.responses);
    }

    public reset() {
        this.responses.clear();
        this._onDidChangeTreeData.fire(undefined);
    }

    public remove(key:string){
        this.responses.delete(key);
    }

    getTreeItem(element: BridgeResponseItem): vscode.TreeItem {
        return element;
    }

    // Retrieves top-level items (each command's response) or child items
    getChildren(element?: BridgeResponseItem): BridgeResponseItem[] {
        if (!element) {
            // Display each command's response as a top-level item
            return Array.from(this.responses.entries())
                .filter(([_, jsonResponse]) => jsonResponse && Object.keys(jsonResponse).length > 0)
                .map(([commandName, jsonResponse]) =>
                    new BridgeResponseItem(commandName, jsonResponse, vscode.TreeItemCollapsibleState.Collapsed)
                );
        }
        // Expand JSON keys recursively for child nodes
        return element.getChildren();
    }
}

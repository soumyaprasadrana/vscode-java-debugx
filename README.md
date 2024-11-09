<h1>
  <img src="media/vscode-java-debugx.gif" alt="Java DebugX" width="100" style="vertical-align: middle;"/>
  vscode-java-debugx
</h1>


## Overview

**Java DebugX** is a Visual Studio Code extension aimed at improving Java debugging by offering advanced macro recording and playback features. It allows developers to record key debugging events such as step-in, step-out, and breakpoints in a macro JSON format. This feature enables users to capture complex debugging sessions and replay them later, saving time and eliminating the need to manually redo the debugging process.


## Features

- **Macro Recording and Playback**: Record debugging sessions, including step-ins, step-outs, and breakpoints. Play back the recorded sessions at any time.
 **Recording**
![JavaDebugXMacroRecording](/media/vscode-java-debugx-macro-recording.gif)
 **Playback**
![JavaDebugXMacro](/media/vscode-java-debugx-play-macro.gif)

- **Customizable Bridge Configurations**: Define custom bridge classes and methods to integrate additional debugging insights.
- **Advanced Debug Insights**: View detailed, real-time debugging information in a dedicated Insights view.
![DebugInsight](/media/vscode-java-debugx-bridge.gif)

- **Search External Files**: Search and index external files during debugging to improve traceability.
- **Customizable File Patterns**: Define which files to include when indexing external files.




## Installation

To install the **Java DebugX** extension in Visual Studio Code:

1. Open **Visual Studio Code**.
2. Go to the **Extensions** view by clicking on the Extensions icon in the Activity Bar or pressing `Ctrl+Shift+X`.
3. Search for **Java DebugX**.
4. Click **Install**.

Alternatively, you can install it directly from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=soumyaprasadrana.vscode-java-debugx).

## Getting Started

Once installed, the extension is activated when a Java project is opened. You can then start using the extension to record, play, and analyze debugging sessions.

### Key Features and Commands

- **Start Macro Recording**: Begin recording your debugging session. This will capture step-ins, step-outs, and breakpoints.
- **Stop Macro Recording**: Stop recording and save the session data.
- **Play Macro Recording**: Re-execute the recorded session.
- **Pause/Resume/Stop Macro Playback**: Pause,resume or stop the playback of your recorded debugging session.
- **Generate Sample Bridge Config**: Generate a sample configuration file to set up your custom bridge and define commands.
- **Debug Insights**: View detailed insights from bridge configuration into your debugging session through a dedicated panel.

You can access these commands via the **Command Palette** (`Ctrl+Shift+P`), or find them in the **JavaDebugX** menu.

*You can add screenshots or GIFs of key actions here to guide users through the workflow.*

## Configuration

You can configure the extension by modifying the settings in your `settings.json`. The available settings are:

- **java.debugx.filePatterns**: Define file patterns to include when indexing external files (e.g., `*.java`, `*.js`, `*.xml`).
- **java.debugx.externalFolder**: Set the path to an external folder that you want to index.
- **java.debugx.macro.stepDelayInSeconds**: Configure the step delay during macro playback.
- **java.debugx.bridgeConfigPath**: Set the absolute path to your custom bridge configuration file.

You can access and modify these settings in the **Settings** tab or directly in your `settings.json` file.

## Views and Menus

- **Insights View**: A dedicated view to show real-time debugging insights.
![DebugInsightView](/media/vscode-java-debugx-bridge-insights.gif)

- **Debug Toolbar**: Commands for controlling the macro recording and playback are available in the debug toolbar.

*You can add a screenshot or GIF of the Insights view here.*

## Example Usage

### Generating a Sample Bridge Config

To generate a sample bridge configuration file:

1. Open the Command Palette (`Ctrl+Shift+P`).
2. Search for and select **Generate Sample Bridge Config**.

This will generate a new bridge configuration file in your workspace, which you can modify to create your custom bridge logic.



## Limitation

The macro recording feature is well-tested when your debug session interacts with only a single thread. However, if you are debugging multiple threads simultaneously, the events will be recorded but playback might not work as expected. We are actively working on improving support for multi-threaded debugging sessions.

## Development

If you'd like to contribute or develop the extension locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/soumyaprasadrana/vscode-java-debugx.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the extension in VS Code with from debug view

## License

This project is licensed under the [SEE LICENSE IN LICENSE](LICENSE).

## Author

**Soumya Prasad Rana**  
Email: soumyaprasad.rana@gmail.com  
GitHub: [soumyaprasadrana](https://github.com/soumyaprasadrana)

## Support

If you encounter any issues or need help, please visit the [issues page](https://github.com/soumyaprasadrana/vscode-java-debugx/issues) and open a new issue or check for existing discussions.


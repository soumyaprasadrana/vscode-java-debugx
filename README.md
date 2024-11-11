<p align="center">
  <a href="" rel="noopener">
 <img width=200px height=200px src="media/vscode-java-debugx.gif" alt="Project logo"></a>
</p>

<h3 align="center"> <b>Java DebugX</b> </h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/soumyaprasadrana/vscode-java-debugx.svg)](https://github.com/soumyaprasadrana/vscode-java-debugx/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/soumyaprasadrana/vscode-java-debugx.svg)](https://github.com/soumyaprasadrana/vscode-java-debugx/pulls)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)
</div>

---


## 🌟 Overview

**Java DebugX** is a powerful Visual Studio Code extension designed to enhance your Java debugging experience with advanced macro recording and playback features. 📽️✨ With Java DebugX, you can record essential debugging events—like **step-in**, **step-out**, and **breakpoints**—in a structured JSON format. 

This feature enables you to capture intricate debugging sessions and replay them effortlessly, saving time and sparing you from manually redoing steps. ⏱️🔄 Perfect for complex Java applications, Java DebugX streamlines your workflow and boosts your productivity. ⚡

## Features

- 🎥 **Macro Recording & Playback**: Effortlessly record your debugging sessions, capturing all **step-ins**, **step-outs**, and **breakpoints**. Rewind and replay these recorded sessions anytime for quick and efficient troubleshooting! ⏪⏯️
 **Recording**
![JavaDebugXMacroRecording](/media/vscode-java-debugx-macro-recording.gif)
 **Playback**
![JavaDebugXMacro](/media/vscode-java-debugx-play-macro.gif)
**🧵 Enhanced Multi-Threaded Compatibility**
Java DebugX is designed to work seamlessly with **multi-threaded debugging**! 🎉 Now, you can record and replay debugging sessions even in complex, multi-threaded applications. This enhancement captures step-in, step-over, and other critical debugging events across threads, allowing you to efficiently review and trace through complex scenarios without retracing steps manually. 🚀
![JavaDebugXMacroMultiThread](/media/vscode-java-debugx-play-macro-play-multithread.gif)

- 🔧 **Customizable Bridge Configurations**: Set up custom bridge classes and methods to bring extra insights into your debugging process, tailored to your needs. 🌉
- 🕵️‍♂️ **Advanced Debug Insights**: Access in-depth, real-time debugging details in the specialized **Insights** view for more informed problem-solving. 📊
![DebugInsight](/media/vscode-java-debugx-bridge.gif)

- 🔍 **Search External Files**: Seamlessly search and index external files during debugging to boost traceability and streamline your workflow. 📁
- 🎛️ **Customizable File Patterns**: Tailor which files to include in indexing external files by defining custom file patterns for optimized debugging. 📝




## 🚀 Installation

To install the **Java DebugX** extension in Visual Studio Code:

1. Open **Visual Studio Code**.
2. Go to the **Extensions** view by clicking on the Extensions icon in the Activity Bar or pressing `Ctrl+Shift+X`.
3. 🔍 Search for **Java DebugX**.
4. Click **Install** to add it to your editor.

> Alternatively, you can install it directly from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=soumyaprasadrana.vscode-java-debugx) or from [Open VSX](https://open-vsx.org/extension/soumyaprasadrana/vscode-java-debugx).

## 🎉 Getting Started

After installing **Java DebugX**, it activates automatically whenever you open a Java project. You can now dive right in and start using its powerful features to record, play back, and analyze your debugging sessions for a more efficient development workflow! 🛠️

### 🚀 Key Features and Commands

- **🎬 Start Macro Recording**: Begin capturing your debugging session, including step-ins, step-outs, and breakpoints.
- **⏹️ Stop Macro Recording**: End the recording and save the session data.  
  ![MacroRecActions](/media/vscode-java-debugx-macro-start-stop.gif)
- **▶️ Play Macro Recording**: Re-execute the captured debugging session.
- **⏸️/▶️/⏹️ Pause, Resume, or Stop Playback**: Control the playback of your recorded debugging session.  
  ![MacroRecPlayActions](/media/vscode-java-debugx-play-macro-action-buttons.gif)
- **🛠️ Generate Sample Bridge Config**: Create a sample config file to define custom bridge commands and methods.
- **🔍 Debug Insights**: Access detailed insights and bridge configurations in a dedicated panel for enriched debugging information.

These commands are accessible through the **Command Palette** (`Ctrl+Shift+P`). Happy debugging! 🎉

## Configuration ⚙️

You can configure the extension by modifying the settings in your `settings.json`. The available settings are:

- **java.debugx.filePatterns** 📂: Define file patterns to include when indexing external files (e.g., `*.java`, `*.js`, `*.xml`).
- **java.debugx.externalFolder** 🗂️: Set the path to an external folder that you want to index.
- **java.debugx.macro.stepDelayInSeconds** ⏱️: Configure the step delay during macro playback.
- **java.debugx.bridgeConfigPath** 🔧: Set the absolute path to your custom bridge configuration file.

You can access and modify these settings in the **Settings** tab ⚙️ or directly in your `settings.json` file. 

## Views and Menus 🖥️

- **Insights View** 📊: A dedicated view to show real-time debugging insights.  
  ![DebugInsightView](/media/vscode-java-debugx-bridge-insights.gif)

- **Debug Toolbar** 🛠️: Commands for controlling the macro recording and playback are available in the debug toolbar.

## Example Usage 💡

### Typical Scenario 🚀

Here’s a typical scenario: You’re debugging a large Java application and find a potential root cause. But after stepping forward, you realize you need to repeat the process to verify something. In a real-life setting, this is where Java DebugX shines—you can record the session once, then replay it up to the exact point you need to examine again.

**Java DebugX** even includes enhanced diagnostics to help when your macro takes a wrong path. If your playback reaches a point that differs from the expected line (like reaching an unexpected catch block or exception), DebugX will try to gather diagnostics and log them to a file, giving you a better understanding of potential issues. 📂🛠️

### Generating a Sample Bridge Config ⚙️

To generate a sample bridge configuration file:

1. Open the Command Palette (`Ctrl+Shift+P`) 🔍.
2. Search for and select **Generate Sample Bridge Config** 📝.

This will generate a new bridge configuration file in your workspace, which you can modify to create your custom bridge logic. 🔧

## Development 🛠️

If you'd like to contribute or develop the extension locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/soumyaprasadrana/vscode-java-debugx.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the extension in VS Code from the debug view ▶️

## License 📜

This project is licensed under the [SEE LICENSE IN LICENSE](LICENSE).

## Author ✍️

**Soumya Prasad Rana**  
Email: soumyaprasad.rana@gmail.com 📧  
GitHub: [soumyaprasadrana](https://github.com/soumyaprasadrana) 🐙

## Support 🆘

If you encounter any issues or need help, please visit the [issues page](https://github.com/soumyaprasadrana/vscode-java-debugx/issues) and open a new issue or check for existing discussions.

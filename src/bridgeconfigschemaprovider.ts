// Copyright (c) 2024 Soumya Prasad Rana
// 
// Licensed under the MIT License. See the LICENSE file in the project root for license information.
//
// Author: Soumya Prasad Rana
// Email: soumyaprasad.rana@gmail.com
export const bridgeConfigSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Java DebugX Bridge Config",
  "description": "Configuration for Java DebugX Bridge Class and Commands",
  "type": "object",
  "properties": {
    "name": {
      "description": "The name of the bridge configuration",
      "type": "string",
      "default": "Java DebugX Bridge Config"
    },
    "type": {
      "description": "The type of bridge (Java, Python, etc.)",
      "type": "string",
      "enum": ["java"]
    },
    "instance": {
      "description": "The full class path of the bridge instance to load",
      "type": "string"
    },
    "commands": {
      "description": "List of commands available for the bridge",
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "description": "Human-readable title of the command",
            "type": "string"
          },
          "command": {
            "description": "The method name in the bridge class to execute",
            "type": "string"
          },
          "responseid": {
            "description": "Response id to be shown while in tree node",
            "type": "string"
          },
          "onFile": {
            "description": "Condition to auto trigger if file name matches to current frame file name",
            "type": "string"
          },
          "reponsetype": {
            "description": "Expected Type of object we are going to get from this command",
            "type": "string",
            "enum": ["com.ibm.json.java.JSONObject", "org.json.JSONObject", "object"]
          },
          "args": {
            "description": "Arguments to pass to the command method",
            "type": "array",
            "items": {
              "type": "string"
            },
            "default": []
          },
          "autotrigger": {
            "description": "Whether to automatically trigger this command on stack frame changes",
            "type": "boolean",
            "default": false
          },
          "hideonerror": {
            "description": "If autotrigger is enabled and if command fails it will not show it in insights",
            "type": "boolean",
            "default": true
          },
          "presentation": {
            "description": "Defines how the command output should be displayed in the IDE; required only if autotrigger is true",
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "properties": {
                "type": {
                  "description": "The format to render the output attribute (list, tree, or plain)",
                  "type": "string",
                  "enum": ["list", "tree", "plain"]
                },
                "view": {
                  "description": "Where to display the output in the IDE",
                  "type": "string",
                  "enum": ["default", "output", "terminal", "codelens"],
                  "default": "default"
                }
              },
              "required": ["type", "view"]
            }
          },
          "events": {
            "type": "object",
            "properties": {
              "stepOver": {
                "type": "boolean",
                "description": "Indicates if step over events are enabled"
              },
              "stackFrameChanged": {
                "type": "boolean",
                "description": "Indicates if stack frame changed events are enabled"
              }
            },
            "required": ["stackFrameChanged"]
          },
          "persistOnStackChange": {
            "type": "boolean",
            "description": "Indicates whether to persist data on stack changes",
            "default": true
          },
          "destructure": {
            "type": "boolean",
            "description": "Destructure the response",
            "default": false
          },
          "destructurepath": {
            "type": "string",
            "description": "Destructure path inside the object",
          },
        },
        "required": ["title", "command", "responseid", "hideonerror", "events"]
      }
    }
  },
  "required": ["name", "type", "instance", "commands"]
}

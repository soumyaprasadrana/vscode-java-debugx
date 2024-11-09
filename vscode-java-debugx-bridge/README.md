# VS Code Java DebugX Extension - Bridge Sample

## Overview

This directory contains a sample implementation for the **Java DebugX Extension Bridge**, which acts as a reference for developers looking to extend debugging functionalities in their Java applications through a custom bridge. The bridge facilitates JSON-based communication between the Visual Studio Code debugging environment and Java applications, allowing users to inspect object properties and execute dynamic commands.

Developers can use this sample as a guide for creating their own bridge classes, which they can customize for specific applications.

## Architecture

### 1. **Bridge Interface (`IBridge`)**

   It is **advised** to maintain an interface for your bridge implementation to keep your bridge repository clean and extensible. By defining a common interface like `IBridge`, you can ensure a consistent structure for your bridge classes, making it easier to add new features, debug, and maintain your code.

   However, it is **not mandatory** to use the provided `IBridge` class in the sample repository. You are free to implement your own methods and structure based on your application's needs. The `IBridge` interface in this sample provides a basic structure to start with, but you can modify it or create your own interfaces and implementations.

   **Example of the `IBridge` Interface:**

   ```java
    package com.debugx.bridge;

    import org.json.JSONObject;

    public interface IBridge {
    
        /**
         * Executes a command with the given arguments.
         * @param object The command to execute.
         * @return A JSON object containing all the properties of a object.
         */
        JSONObject objectProperties(Object object);
    }
   ```

   The method `objectProperties` in this interface is just a sample method. You can extend or replace it with your own methods that suit your application's specific debugging requirements.

   By using an interface, you ensure that your bridge implementation can be easily swapped, extended, or replaced without major changes to the rest of the project, thus maintaining cleaner architecture and promoting flexibility.


### 2. **Sample Bridge Implementation (`VsCodeDebugxBridge`)**

   The `VsCodeDebugxBridge` class is a **sample reference implementation** of the `IBridge` interface. This class demonstrates how to retrieve object properties and return them in a structured JSON format. It uses Java reflection to access both public and private fields of an object and includes error handling for situations where a field is not accessible.

   **However, it is important to note that this is not a mandatory implementation.** You are encouraged to use this sample as a reference or starting point, but you are free to implement your own bridge class with a different structure or methods to suit your specific needs.

   If you choose to follow this example, you can customize it by adding more fields, methods, or additional logic to suit the requirements of your debugging setup. You may also opt to remove or modify the `objectProperties` method to meet your specific debugging objectives.

   **Example of the `VsCodeDebugxBridge` Class:**

   ```java
   package com.debugx.bridge;

import org.json.JSONObject;
import org.json.JSONArray;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

public class VsCodeDebugxBridge implements IBridge {

    private Object context;

    public VsCodeDebugxBridge(Object context) {
        this.context = context;
    }

    public Object getContext() {
        return context;
    }

    @Override
    public JSONObject objectProperties(Object object) {
        JSONObject jsonObject = new JSONObject();

        // Check if the provided object is null
        if (object == null) {
            jsonObject.put("status", "error");
            jsonObject.put("message", "Provided object is null.");
            return jsonObject;
        }

        Class<?> objectClass = object.getClass();

        // Class-level information
        jsonObject.put("className", objectClass.getName());
        jsonObject.put("packageName",
                objectClass.getPackage() != null ? objectClass.getPackage().getName() : "No package");

        // Superclass information
        Class<?> superclass = objectClass.getSuperclass();
        jsonObject.put("superclassName", (superclass != null) ? superclass.getName() : "No superclass");

        // Implemented interfaces
        JSONArray interfacesArray = new JSONArray();
        for (Class<?> iface : objectClass.getInterfaces()) {
            interfacesArray.put(iface.getName());
        }
        jsonObject.put("interfaces", interfacesArray);

        // Get all declared fields, including private ones
        java.lang.reflect.Field[] fields = objectClass.getDeclaredFields();
        JSONArray fieldsArray = new JSONArray();

        for (java.lang.reflect.Field field : fields) {
            field.setAccessible(true); // Allow access to private fields
            JSONObject fieldDetails = new JSONObject();

            try {
                // Get the field name, type, modifiers, and value
                fieldDetails.put("name", field.getName());
                fieldDetails.put("type", field.getType().getName());
                fieldDetails.put("modifiers", Modifier.toString(field.getModifiers()));
                Object fieldValue = field.get(object);
                fieldDetails.put("value", (fieldValue != null) ? fieldValue.toString() : "null");
            } catch (IllegalAccessException e) {
                // Handle the case where the field cannot be accessed
                fieldDetails.put("value", "Access denied");
            }

            fieldsArray.put(fieldDetails);
        }
        jsonObject.put("fields", fieldsArray);

        // Constructor information
        JSONArray constructorsArray = new JSONArray();
        Constructor<?>[] constructors = objectClass.getDeclaredConstructors();
        for (Constructor<?> constructor : constructors) {
            JSONObject constructorDetails = new JSONObject();
            constructorDetails.put("name", constructor.getName());
            constructorDetails.put("modifiers", Modifier.toString(constructor.getModifiers()));
            JSONArray parameterTypesArray = new JSONArray();
            for (Class<?> paramType : constructor.getParameterTypes()) {
                parameterTypesArray.put(paramType.getName());
            }
            constructorDetails.put("parameters", parameterTypesArray);
            constructorsArray.put(constructorDetails);
        }
        jsonObject.put("constructors", constructorsArray);

        // Method information
        JSONArray methodsArray = new JSONArray();
        Method[] methods = objectClass.getDeclaredMethods();
        for (Method method : methods) {
            JSONObject methodDetails = new JSONObject();
            methodDetails.put("name", method.getName());
            methodDetails.put("returnType", method.getReturnType().getName());
            methodDetails.put("modifiers", Modifier.toString(method.getModifiers()));
            JSONArray parameterTypesArray = new JSONArray();
            for (Class<?> paramType : method.getParameterTypes()) {
                parameterTypesArray.put(paramType.getName());
            }
            methodDetails.put("parameters", parameterTypesArray);
            methodsArray.put(methodDetails);
        }
        jsonObject.put("methods", methodsArray);

        return jsonObject;
    }

}

   ```

   This class is just one way to implement the bridge. Depending on your requirements, you can adjust the logic for how properties are collected, how errors are handled, and how the final JSON structure is returned. Feel free to modify this implementation or create an entirely different approach based on your application's specific needs.


### 3. **Bridge Configuration**

   The bridge relies on a configuration file that defines commands and maps them to methods in the bridge class. In the main extension, this configuration file can be generated or updated to suit specific debugging needs. 

   **Example Configuration File (`java.debugx-bridge-config.json`):**

   ```json
   {
       "name": "Java DebugX Bridge Config",
       "type": "java",
       "instance": "com.debugx.bridge.VsCodeDebugxBridge",
       "commands": [
           {
               "title": "Inspect Object Properties",
               "command": "objectProperties",
               "responseid": "objectDetails",
               "reponsetype": "org.json.JSONObject",
               "args": ["this"],
               "autotrigger": true
           }
       ]
   }
   ```

### 4. **Generating a Sample Bridge Config**

   To quickly generate a sample bridge configuration in your VS Code workspace, use the **"Generate Sample Bridge Config"** command available after installing the extension. This command will create a default bridge configuration file that you can use as a template to build your own.

   **How to Use:**

   1. Open the Command Palette in VS Code (`Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS).
   2. Search for **"Generate Sample Bridge Config"** and select it.
   3. The extension will generate a sample bridge config file in your workspace directory, which you can modify according to your needs.

   This file provides a starting point for setting up your bridge, with sample commands and structure.



### 5. **Schemas**

   The schema defines the structure of the bridge configuration file, ensuring that developers adhere to a consistent format for commands, responses, and other parameters in the configuration.

   **Sample Schema File (`java.debugx-bridge-config-schema.json`):**

   ```json
   {
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
      "enum": [
        "java"
      ]
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
            "enum": [
              "com.ibm.json.java.JSONObject",
              "org.json.JSONObject",
              "object"
            ]
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
                  "enum": [
                    "list",
                    "tree",
                    "plain"
                  ]
                },
                "view": {
                  "description": "Where to display the output in the IDE",
                  "type": "string",
                  "enum": [
                    "default",
                    "output",
                    "terminal",
                    "codelens"
                  ],
                  "default": "default"
                }
              },
              "required": [
                "type",
                "view"
              ]
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
            "required": [
              "stackFrameChanged"
            ]
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
            "description": "Destructure path inside the object"
          }
        },
        "required": [
          "title",
          "command",
          "responseid",
          "hideonerror",
          "events"
        ]
      }
    }
  },
  "required": [
    "name",
    "type",
    "instance",
    "commands"
  ]
}
   ```

## Using the Sample Bridge

1. **Create a Custom Bridge**:
   Use `VsCodeDebugxBridge` as a reference to create your own bridge class, implementing the `IBridge` interface. Customize the `objectProperties` method to include additional details, logging, or even conditional checks for specific fields or classes.

2. **Modify the Configuration**:
   Adjust the `java.debugx-bridge-config.json` file to specify your custom commands and the `instance` field to your bridge class. Use the configuration schema as a guide to ensure correct formatting.

3. **Run the Extension**:
   Load the main extension in Visual Studio Code, ensuring the workspace has your custom bridge and configuration files. Run commands as defined in the configuration to inspect Java objects and interact with the bridge in the debug session.

4. **Extend and Customize**:
   Expand the `IBridge` interface or add new methods to your bridge class as needed. You can define additional commands in the configuration file to match these methods, allowing flexible debugging capabilities.

## Contributing

This sample bridge is intended to be a starting point. Contributions to improve the bridge’s functionality and extensibility are welcome!

## License

This project is licensed under the MIT License.

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
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

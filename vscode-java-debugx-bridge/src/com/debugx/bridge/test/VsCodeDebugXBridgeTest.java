package com.debugx.bridge.test;

public class VsCodeDebugXBridgeTest {

    private int classMem;

    VsCodeDebugXBridgeTest(int classMem) {
        this.classMem = classMem;
    }

    int getClassMem() {
        System.out.println("getClassMem :: entry");
        this.classMem += 1;
        return this.classMem;
    }

    void exec() {
        try {
            int i = 0;
            int j = 0;

            while (true) {
                i++;
                j++;
                if (i * j > 200)
                    break;
            }

            int res = devide(i, j);
            System.out.println("Result = " + res);
            VsCodeDebugXBridgeTest obj = new VsCodeDebugXBridgeTest(5);
            System.out.println("Class Member = " + obj.getClassMem());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        new VsCodeDebugXBridgeTest(10).exec();
    }

    private static int devide(int i, int j) {
        return i / j;
    }
}

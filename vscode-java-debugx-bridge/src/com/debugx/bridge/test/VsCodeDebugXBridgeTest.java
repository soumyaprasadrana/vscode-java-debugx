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
            MyThread thread = new MyThread();
            thread.start();
            MyThread2 thread2 = new MyThread2();
            thread2.start();
            MyTestClass testClass = new MyTestClass();
            int c = testClass.abc();

            int i = c;
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
            thread.join();
            thread2.join();
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

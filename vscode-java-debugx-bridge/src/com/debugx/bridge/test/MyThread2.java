package com.debugx.bridge.test;

public class MyThread2 extends Thread {

    @Override
    public void run() {
        int sec = 0;
        while (true) {
            System.out.println("Thread2 is running");
            try {
                Thread.sleep(2 * 1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            if (sec == 10) {
                break;
            }
            sec++;

        }
    }
}

package com.maps;

import org.junit.Test;
import static org.junit.Assert.*;

import org.openqa.selenium.*;
import org.openqa.selenium.interactions.*;
import org.openqa.selenium.firefox.*;

import com.maps.log.LogEntryFactory;
import com.maps.log.LogEntry;

import java.util.List;
import java.util.Random;

import com.maps.log.LogEntry.*;
import com.maps.MapDriver.*;

/**
 * Unit test for simple App.
 */
public class AppTest extends MapTest {

    /**
     * Perform random stuff 
     */
    class RandomMover implements Runnable {
        private MapDriver mapDriver;
        int numSteps; 
        Random r;

        public RandomMover(MapDriver mapDriver, int numSteps) {
            this.mapDriver = mapDriver;
            this.numSteps = numSteps;
            this.r = new Random(); 
        }

        public void run() {
            for (int i = 0; i < numSteps ; i++) {
                int choice = r.nextInt(10);
                switch (choice) {
                    case 0: mapDriver.sendMessage("Panning map");
                            mapDriver.panBy(r.nextInt(500), 500);
                            try { Thread.sleep(10); } catch (Exception e) {}
                            break;

                    case 1: mapDriver.sendMessage("Zooming by double click");
                            mapDriver.zoomByDoubleClick();
                            try { Thread.sleep(2000); } catch (Exception e) {}
                            break;

                    case 2: mapDriver.sendMessage("Zooming by button");
                            mapDriver.zoomByButton(Zoom.IN);
                            try { Thread.sleep(2000); } catch (Exception e) {}
                            break;

                    case 3: mapDriver.sendMessage("Jumping to SF");
                            mapDriver.jumpTo(Location.SF);
                            try { Thread.sleep(2000); } catch (Exception e) {}
                            break;

                    case 4: mapDriver.sendMessage("Jumping to Boston");
                            mapDriver.jumpTo(Location.BOS);
                            try { Thread.sleep(2000); } catch (Exception e) {}
                            break;
                }
            }
        }
    }

    /**
     * Two browsers doing random stuff simultaneously should end up in the same
     * position
     */
    @Test
    public void testEventualConvergence() {
        MapDriver mapDriver = createMapDriver();
        mapDriver.startSharing("Jossie");
        assertTrue(mapDriver.getSessionId() != null);
        MapDriver mapDriver2 = createMapDriver(mapDriver.getSessionId(), "Johnnie");

        mapDriver.jumpTo(Location.BOS);
        Thread t1 = new Thread(new RandomMover(mapDriver, 15));

        try { Thread.sleep(100); } catch (Exception e) {}

        mapDriver.jumpTo(Location.SF);
        Thread t2 = new Thread(new RandomMover(mapDriver2, 15));

        t1.start();
        t2.start();

        try { 
            t1.join();
            t2.join();
        } catch (Exception e) {}

        try { Thread.sleep(5000); } catch (Exception e) {}

        assertEquals(mapDriver.getCenter(), mapDriver2.getCenter());
        assertEquals(mapDriver.getZoom(),   mapDriver2.getZoom());
    }

    /**
     * Launch two browser windows and start a sharing session between them.
     */
    @Test
    public void testOneMover() {
        MapDriver mapDriver = createMapDriver();
        mapDriver.startSharing("Jossie");
        assertTrue(mapDriver.getSessionId() != null);
        MapDriver mapDriver2 = createMapDriver(mapDriver.getSessionId(), "Johnnie");
        MapDriver mapDriver3 = createMapDriver(mapDriver.getSessionId(), "Julito");

        try { Thread.sleep(2000); } catch (Exception e) {}

        mapDriver.enableDebugLogs();
        mapDriver2.enableDebugLogs();
        mapDriver3.enableDebugLogs();

        mapDriver.panBy(100, 250);
        try { Thread.sleep(2000); } catch (Exception e) {}
        mapDriver.zoomByDoubleClick();
        try { Thread.sleep(2000); } catch (Exception e) {}
        mapDriver.panBy(200, 350);
        try { Thread.sleep(2000); } catch (Exception e) {}
        mapDriver.zoomByDoubleClick();
        try { Thread.sleep(2000); } catch (Exception e) {}
        mapDriver.zoomByButton(Zoom.IN);
        try { Thread.sleep(2000); } catch (Exception e) {}
        mapDriver.zoomByButton(Zoom.OUT);
        try { Thread.sleep(2000); } catch (Exception e) {}
        mapDriver.jumpTo(Location.BOS);
        try { Thread.sleep(2000); } catch (Exception e) {}
        mapDriver.jumpTo(Location.SF);
        try { Thread.sleep(2000); } catch (Exception e) {}

        List<LogEntry> logs1 = mapDriver.getLogs();
        List<LogEntry> logs2 = mapDriver2.getLogs();
        List<LogEntry> logs3 = mapDriver3.getLogs();

        assertEquals(mapDriver.getCenter(), mapDriver2.getCenter());
        assertEquals(mapDriver.getCenter(), mapDriver3.getCenter());

        assertEquals(mapDriver.getZoom(), mapDriver2.getZoom());
        assertEquals(mapDriver.getZoom(), mapDriver3.getZoom());

        assertEquals(8,  logs1.size());
        assertEquals(8, logs2.size());
        assertEquals(8, logs3.size());
        assertEquals(logs2, logs3);
        
        for (int i = 0; i < logs2.size(); i++) {
            /* Users that didn't move shouldn't emit messages */
            assertTrue(logs2.get(i).getAction() != LogAction.SEND);
            assertTrue(logs3.get(i).getAction() != LogAction.SEND);
        }

        List<LogEntry> cLogs1 = LogEntryFactory.generateComplement(logs1);
        assertEquals(cLogs1, logs2);
    }
}

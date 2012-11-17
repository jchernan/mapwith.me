package com.maps;

import org.junit.Test;
import static org.junit.Assert.*;

import com.maps.log.LogEntryFactory;
import com.maps.log.LogEntry;
import com.maps.log.LogEntry.*;
import com.maps.MapDriver.*;

import java.util.List;
import java.util.Random;


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
                            sleep(2000);
                            break;

                    case 1: mapDriver.sendMessage("Zooming by double click");
                            mapDriver.zoomByDoubleClick();
                            sleep(2000);
                            break;

                    case 2: mapDriver.sendMessage("Zooming by button");
                            mapDriver.zoomByButton(Zoom.IN);
                            sleep(2000);
                            break;

                    case 3: mapDriver.sendMessage("Jumping to SF");
                            mapDriver.jumpTo(Location.SF);
                            sleep(2000);
                            break;

                    case 4: mapDriver.sendMessage("Jumping to Boston");
                            mapDriver.jumpTo(Location.BOS);
                            sleep(2000);
                            break;
                }
            }
        }
    }

    /**
     * Two browsers doing random stuff simultaneously should end up in the same
     * position
     */
    @Test public void testEventualConvergence() {
        MapDriver mapDriver = createMapDriver();
        mapDriver.startSharing("Jossie");
        assertTrue(mapDriver.getSessionId() != null);
        MapDriver mapDriver2 = createMapDriver(mapDriver.getSessionId(), "Johnnie");

        mapDriver.jumpTo(Location.BOS);
        Thread t1 = new Thread(new RandomMover(mapDriver, 15));

        sleep(100);

        mapDriver.jumpTo(Location.SF);
        Thread t2 = new Thread(new RandomMover(mapDriver2, 15));

        t1.start();
        t2.start();

        try { 
            t1.join();
            t2.join();
        } catch (Exception e) {}

        sleep(5000);

        assertEquals(mapDriver.getCenter(), mapDriver2.getCenter());
        assertEquals(mapDriver.getZoom(),   mapDriver2.getZoom());
    }

    /**
     * Launch two browser windows and start a sharing session between them.
     */
    @Test public void testOneMover() {
        MapDriver mapDriver = createMapDriver();
        mapDriver.startSharing("Jossie");
        assertTrue(mapDriver.getSessionId() != null);
        MapDriver mapDriver2 = createMapDriver(mapDriver.getSessionId(), "Johnnie");
        MapDriver mapDriver3 = createMapDriver(mapDriver.getSessionId(), "Julito");

        sleep(2000);

        mapDriver.enableDebugLogs();
        mapDriver2.enableDebugLogs();
        mapDriver3.enableDebugLogs();

        mapDriver.panBy(100, 250);
        sleep(2000);
        mapDriver.zoomByDoubleClick();
        sleep(2000);
        mapDriver.panBy(200, 350);
        sleep(2000);
        mapDriver.zoomByDoubleClick();
        sleep(2000);
        mapDriver.zoomByButton(Zoom.IN);
        sleep(2000);
        mapDriver.zoomByButton(Zoom.OUT);
        sleep(2000);
        mapDriver.jumpTo(Location.BOS);
        sleep(2000);
        mapDriver.jumpTo(Location.SF);
        sleep(2000);

        List<LogEntry> logs1 = mapDriver.getLogs();
        List<LogEntry> logs2 = mapDriver2.getLogs();
        List<LogEntry> logs3 = mapDriver3.getLogs();

        assertEquals(mapDriver.getCenter(), mapDriver2.getCenter());
        assertEquals(mapDriver.getCenter(), mapDriver3.getCenter());

        assertEquals(mapDriver.getZoom(), mapDriver2.getZoom());
        assertEquals(mapDriver.getZoom(), mapDriver3.getZoom());

        for (int i = 0; i < logs1.size(); i++) {
            /* Users that moved shouldn't receive messages */
            assertTrue("User should not have received messages",
                logs1.get(i).getAction() != LogAction.RECEIVE);
        }

        for (int i = 0; i < logs2.size(); i++) {
            /* Users that didn't move shouldn't emit messages */
            assertTrue("User should not have sent messages",
                logs2.get(i).getAction() != LogAction.SEND);
            assertTrue("User should not have sent messages",
                logs3.get(i).getAction() != LogAction.SEND);
        }

        assertEquals(8,  logs1.size());
        assertEquals(8, logs2.size());
        assertEquals(8, logs3.size());
        assertEquals(logs2, logs3);
        
        List<LogEntry> cLogs1 = LogEntryFactory.generateComplement(logs1);
        assertEquals(cLogs1, logs2);
    }
}

package com.maps;

import org.junit.Test;
import static org.junit.Assert.*;

import com.maps.log.LogEntryFactory;
import com.maps.log.LogEntry;
import com.maps.log.LogEntry.*;
import com.maps.MapDriver.*;

import java.util.List;


/**
* Unit test for simple map interactions
*/
public class SimpleTest extends MapTest {

    /**
    * Pan by
    */
    @Test public void testPan() {
        MapDriver[] mapDrivers = simpleTestInit();
        mapDrivers[0].sendMessage("Panning map");
        mapDrivers[0].panBy(100, 250);
        simpleTestCheck(mapDrivers[0], mapDrivers[1], 1);
    }

    /**
    * Zoom by double click
    */
    @Test public void testZoomByDoubleClick() {
        MapDriver[] mapDrivers = simpleTestInit();
        mapDrivers[0].sendMessage("Zooming by double click");
        mapDrivers[0].zoomByDoubleClick();
        simpleTestCheck(mapDrivers[0], mapDrivers[1], 1);
    }

    /**
    * Zoom by button
    */
    @Test public void testZoomByButton() {
        MapDriver[] mapDrivers = simpleTestInit();
        mapDrivers[0].sendMessage("Zooming in by button");
        mapDrivers[0].zoomByButton(Zoom.IN);
        sleep(2000);
        mapDrivers[0].sendMessage("Zooming out by button");
        mapDrivers[0].zoomByButton(Zoom.OUT);
        simpleTestCheck(mapDrivers[0], mapDrivers[1], 2);
    }

    private MapDriver[] simpleTestInit() {
        MapDriver mapDriver1 = createMapDriver();
        mapDriver1.startSharing("Jossie");
        Integer sessionId = mapDriver1.getSessionId();
        assertTrue(sessionId != null);
        MapDriver mapDriver2 = createMapDriver(sessionId, "Johnnie");
        sleep(2000);
        mapDriver1.enableDebugLogs();
        mapDriver2.enableDebugLogs();
        return new MapDriver[]{mapDriver1, mapDriver2};
    }

    private void simpleTestCheck(MapDriver mapDriver1, MapDriver mapDriver2,
            int expectedLogCount) {

        sleep(2000);

        List<LogEntry> logs1 = mapDriver1.getLogs();
        List<LogEntry> logs2 = mapDriver2.getLogs();

        assertEquals(mapDriver1.getCenter(), mapDriver2.getCenter());
        assertEquals(mapDriver1.getZoom(), mapDriver2.getZoom());

        for (int i = 0; i < logs1.size(); i++) {
            /* Users that moved shouldn't receive messages */
            assertTrue(logs1.get(i).getAction() != LogAction.RECEIVE);
        }

        for (int i = 0; i < logs2.size(); i++) {
            /* Users that didn't move shouldn't emit messages */
            assertTrue(logs2.get(i).getAction() != LogAction.SEND);
        }

        assertEquals(expectedLogCount,  logs1.size());
        assertEquals(expectedLogCount, logs2.size());

        List<LogEntry> cLogs1 = LogEntryFactory.generateComplement(logs1);
        assertEquals(cLogs1, logs2);
    }
}


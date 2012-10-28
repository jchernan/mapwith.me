package com.maps;

import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;

import org.openqa.selenium.*;
import org.openqa.selenium.interactions.*;
import org.openqa.selenium.firefox.*;

import com.maps.log.LogComparator;
import com.maps.log.LogEntry;
import java.util.List;

import com.maps.log.LogEntry.*;
import com.maps.MapDriver.*;

/**
 * Unit test for simple App.
 */
public class AppTest 
    extends TestCase
{
    /**
     * Create the test case
     *
     * @param testName name of the test case
     */
    public AppTest( String testName )
    {
        super( testName );
    }

    /**
     * @return the suite of tests being tested
     */
    public static Test suite()
    {
        return new TestSuite( AppTest.class );
    }

   
    /**
     * Launch two browser windows and start a sharing session between them.
     */
    public void testOneMover()
    {
        MapDriver mapDriver = new MapDriver();
        mapDriver.startSharing("Jossie");
        assertTrue(mapDriver.getSessionId() != null);
        MapDriver mapDriver2 = new MapDriver(mapDriver.getSessionId(), "Johnnie");
        MapDriver mapDriver3 = new MapDriver(mapDriver.getSessionId(), "Julito");

        try { Thread.sleep(2000); } catch (Exception e) {}

        mapDriver.enableDebugLogs();
        mapDriver2.enableDebugLogs();
        mapDriver3.enableDebugLogs();

        mapDriver.panBy(100, 250);
        mapDriver.zoomByDoubleClick();
        mapDriver.panBy(200, 350);
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


        mapDriver.close();
        mapDriver2.close();
        mapDriver3.close();
            
        assertEquals(8,  logs1.size());
        assertEquals(16, logs2.size());
        assertEquals(16, logs3.size());
        assertEquals(logs2, logs3);
        
        for (int i = 0; i < logs2.size(); i++) {
            /* Users that didn't move shouldn't emit messages */
            assertTrue(logs2.get(i).getAction() != LogAction.SEND);
            assertTrue(logs3.get(i).getAction() != LogAction.SEND);
        }

        assertTrue(LogComparator.compare(logs1, logs2));
    }
}

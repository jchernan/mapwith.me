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

        List<LogEntry> logs1 = mapDriver.getLogs();
        List<LogEntry> logs2 = mapDriver2.getLogs();
        List<LogEntry> logs3 = mapDriver3.getLogs();

        mapDriver.close();
        mapDriver2.close();
        mapDriver3.close();
            
        assertEquals(4, logs1.size());
        assertEquals(8, logs2.size());
        assertEquals(8, logs3.size());
        assertEquals(logs2, logs3);
        
        for (int i = 0; i < logs2.size(); i++) {
            /* Users that didn't move shouldn't emit messages */
            assertTrue(logs2.get(i).getAction() != LogEntry.LogAction.SEND);
            assertTrue(logs3.get(i).getAction() != LogEntry.LogAction.SEND);
        }

        assertTrue(LogComparator.compare(logs1, logs2));
    }
}

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
    public void testApp()
    {
        MapDriver mapDriver = new MapDriver();
        mapDriver.startSharing("Jossie");
        assertTrue(mapDriver.getSessionId() != null);
        MapDriver mapDriver2 = new MapDriver(mapDriver.getSessionId(), "Johnnie");

        try { Thread.sleep(2000); } catch (Exception e) {}

        mapDriver.enableDebugLogs();
        mapDriver2.enableDebugLogs();

        mapDriver.panBy(100, 250);
        mapDriver.zoomByDoubleClick();

        try { Thread.sleep(2000); } catch (Exception e) {}

        List<LogEntry> logs1 = mapDriver.getLogs();
        List<LogEntry> logs2 = mapDriver2.getLogs();

        mapDriver.close();
        mapDriver2.close();

        assertTrue(LogComparator.compare(logs1, logs2));
    }
}

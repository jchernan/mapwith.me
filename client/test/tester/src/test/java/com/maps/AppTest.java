package com.maps;

import org.junit.*;
import org.junit.rules.TestName;
import org.junit.rules.TestWatcher;
import org.junit.runner.Description;
import static org.junit.Assert.*;

import org.openqa.selenium.*;
import org.openqa.selenium.interactions.*;
import org.openqa.selenium.firefox.*;

import com.maps.log.LogEntryFactory;
import com.maps.log.LogEntry;

import java.util.List;
import java.util.ArrayList;
import java.util.Random;
import java.io.FileOutputStream;
import java.io.File;

import com.maps.log.LogEntry.*;
import com.maps.MapDriver.*;

/**
 * Unit test for simple App.
 */
public class AppTest {

    private String REPORTS_DIR = "target/surefire-reports/";

    private List<MapDriver> mapDrivers;

    @Rule
    public TestName testName = new TestName();

    @Rule
    public TestWatcher testWatcher = new TestWatcher() {
        @Override
        protected void succeeded(Description d) {
            for (MapDriver driver : mapDrivers) {
                driver.close();
            }
            mapDrivers = null;
        }

        @Override
        protected void failed(Throwable e, Description d) {
            for (MapDriver driver : mapDrivers) {
                captureScreenshot(testName.getMethodName(), driver);
                driver.close();
            }
            mapDrivers = null;
        }
    };

    @Before
    public void setUp() {
        mapDrivers = new ArrayList<MapDriver>();
    }

    private void captureScreenshot(String testName, MapDriver driver) {

        try {
            new File(REPORTS_DIR).mkdirs();
            String fileName = this.getClass().getCanonicalName()
                + "-" + testName
                + "-" + driver.getUserName()
                + "-screenshot.png";
            FileOutputStream out = new FileOutputStream(
                REPORTS_DIR + fileName);
            TakesScreenshot ts = (TakesScreenshot) driver.getWebDriver();
            out.write(ts.getScreenshotAs(OutputType.BYTES));
            out.close();
        } catch (Exception e) {
            // No need to crash the tests if the screenshot fails
        }
    }

    private void addDriver(MapDriver driver) {
        mapDrivers.add(driver);
    }
   
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
                int choice = r.nextInt(5);
                switch (choice) {
                    case 0: mapDriver.panBy(r.nextInt(500), r.nextInt(500));
                            break;

                    case 1: mapDriver.zoomByDoubleClick();
                            try { Thread.sleep(2000); } catch (Exception e) {}
                            break;

                    case 2: mapDriver.zoomByButton(Zoom.IN);
                            try { Thread.sleep(2000); } catch (Exception e) {}
                            break;

                    case 3: mapDriver.jumpTo(Location.SF);
                            try { Thread.sleep(2000); } catch (Exception e) {}
                            break;

                    case 4: mapDriver.jumpTo(Location.BOS);
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
        MapDriver mapDriver = new MapDriver();
        addDriver(mapDriver);
        mapDriver.startSharing("Jossie");
        assertTrue(mapDriver.getSessionId() != null);
        MapDriver mapDriver2 = new MapDriver(mapDriver.getSessionId(), "Johnnie");
        addDriver(mapDriver2);

        Thread t1 = new Thread(new RandomMover(mapDriver, 15));
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
        MapDriver mapDriver = new MapDriver();
        addDriver(mapDriver);
        mapDriver.startSharing("Jossie");
        assertTrue(mapDriver.getSessionId() != null);
        MapDriver mapDriver2 = new MapDriver(mapDriver.getSessionId(), "Johnnie");
        addDriver(mapDriver2);
        MapDriver mapDriver3 = new MapDriver(mapDriver.getSessionId(), "Julito");
        addDriver(mapDriver3);

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

package com.maps;

import org.junit.Before;
import org.junit.Rule;
import org.junit.rules.TestName;
import org.junit.rules.TestWatcher;
import org.junit.runner.Description;
import static org.junit.Assert.*;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

import java.util.List;
import java.util.ArrayList;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;

import com.maps.log.LogEntry;
import com.maps.MapDriver.*;


public class MapTest {

    private String REPORTS_DIR = "target/surefire-reports/";
    private double SAME_POINT_THRESH = 0.0001;

    private List<MapDriver> mapDrivers;

    @Before
    public void setUp() {
        mapDrivers = new ArrayList<MapDriver>();
    }

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
            new File(REPORTS_DIR).mkdirs();
            for (MapDriver driver : mapDrivers) {
                captureScreenshot(testName.getMethodName(), driver);
                captureLogs(testName.getMethodName(), driver);
                driver.close();
            }
            mapDrivers = null;
        }
    };

    private void captureScreenshot(String testName, MapDriver driver) {
        try {
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

    private void captureLogs(String testName, MapDriver driver) {
        try {
            String fileName = this.getClass().getCanonicalName()
                + "-" + testName
                + "-" + driver.getUserName()
                + ".log";
            FileWriter fileWriter = new FileWriter(
                REPORTS_DIR + fileName);
            BufferedWriter out = new BufferedWriter(fileWriter);
            List<LogEntry> logs = driver.getLogs();
            for (LogEntry log : logs) {
                out.write(log.toString());
                out.newLine();
            }
            out.close();
        } catch (Exception e) {
            // No need to crash the tests if the screenshot fails
        }
    }

    public MapDriver createMapDriver() {
        MapDriver mapDriver = new MapDriver();
        addDriver(mapDriver);
        return mapDriver;
    }

    public MapDriver createMapDriver(Integer sessionId, String username) {
        MapDriver mapDriver = new MapDriver(sessionId, username);
        addDriver(mapDriver);
        return mapDriver;
    }

    private void addDriver(MapDriver driver) {
        mapDrivers.add(driver);
    }

    public void assertSameCenter(MapDriver d1, MapDriver d2) {
        Point p1 = d1.getCenter();
        Point p2 = d2.getCenter();
        assertTrue(Math.abs(p1.getLatitude()
            - p2.getLatitude()) < SAME_POINT_THRESH);
        assertTrue(Math.abs(p1.getLongitude()
            - p2.getLongitude()) < SAME_POINT_THRESH);
    }

    public void assertSameZoom(MapDriver d1, MapDriver d2) {
        assertEquals(d1.getZoom(), d2.getZoom());
    }

    public void sleep(long millis) {
        try { Thread.sleep(millis); } catch (Exception e) {}
    }
}


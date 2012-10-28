package com.maps;

import org.openqa.selenium.*;
import org.openqa.selenium.interactions.*;
import org.openqa.selenium.firefox.*;
import java.util.regex.*;
import java.util.*;
import com.maps.log.*;

public class MapDriver {
    private WebDriver driver;
    private JavascriptExecutor js;
    private Integer id = null;
    private Actions emptyBuilder = null;
    enum Zoom { IN, OUT }
    enum Location { SF, BOS }

    /* Start a Firefox window and point it to mapwith.me */
    public MapDriver() {
        this(null, null);
    }
    
    public MapDriver(Integer sessionId, String username) {
        this.driver = new FirefoxDriver();
        this.js = (JavascriptExecutor) this.driver;
        this.id = sessionId;
        this.emptyBuilder = new Actions(driver);

        if (sessionId == null) {
            this.driver.get("file:///Users/jmunizn/Documents/Projects/maps2/maps/client/index.html");
        } else {
            this.driver.get("file:///Users/jmunizn/Documents/Projects/maps2/maps/client/index.html?session_id=" + sessionId);
            joinSharingSession(username);
        }

    }

    private void joinSharingSession(String username) {
        /* This can only happen when no other sharing session exists */
        assert(isSharing());

        /* Type username */
        perform(emptyBuilder.sendKeys(find("modal-form-input"), username));
        /* Click 'Join' on modal */
        perform(emptyBuilder.click(find("join-modal")));
    }

    private boolean isSharing() {
        return id != null; 
    }

    private static void perform(Actions a) {
        a.build().perform();
    }

    private WebElement find(String id) {
        return driver.findElement(By.id(id));
    }

    private WebElement findByClass(String className) {
        return driver.findElement(By.className(className));
    }


    private static int parseId(String url) {
        Pattern p = Pattern.compile(".*session_id=([0-9]*).*");
        Matcher m = p.matcher(url);
        if (m.matches()) {
            return Integer.parseInt(m.group(1));
        } else {
            throw new IllegalArgumentException("Cannot parse " + url);
        }
    }

    public void startSharing(String username) {
        /* This can only happen when no other sharing session exists */
        assert(! isSharing());
        
        /* Click on share */
        perform(emptyBuilder.click(find("share")));
        /* Type username */
        perform(emptyBuilder.sendKeys(find("popover-form-input"), username));
        /* Click 'Start' on popover */
        perform(emptyBuilder.click(find("popover-form-button")));
 
        /* Now parse the resulting ID */
        try { Thread.sleep(1000); } catch (Exception e) {}
        this.id = parseId(find("session-link").getText());
    }

    public Integer getSessionId() {
        return this.id;
    }

    public void panBy(int xOff, int yOff) {
        perform(emptyBuilder.dragAndDropBy(find("map"), xOff, yOff));
    }

    public void zoomByDoubleClick() {
        perform(emptyBuilder.doubleClick(find("map")));
    }

    public void zoomByButton(Zoom zoom) {
        switch (zoom) { 
            case IN: 
                perform(emptyBuilder.click(findByClass("leaflet-control-zoom-in")));
                break;
            case OUT:
                perform(emptyBuilder.click(findByClass("leaflet-control-zoom-out")));
                break;
        }
    }

    public void jumpTo(Location location) {
        switch (location) {
            case BOS:
                perform(emptyBuilder.click(find("navbar-button-bos")));
                break;
            case SF:
                perform(emptyBuilder.click(find("navbar-button-sf")));
                break;
        }
    }



    public void enableDebugLogs() {
        String logLevel = "window.MapApp.log.levels.DEBUG";
        String script = "window.MapApp.log.setLogLevel(" + logLevel + ");";
        js.executeScript(script);
    }

    public List<LogEntry> getLogs() {
        String script = "return window.MapApp.log.getLogs();";
        List<Object> jsLogs = (List<Object>) js.executeScript(script); 
        List<LogEntry> entries = new ArrayList<LogEntry>();
        for (Object log : jsLogs) {
            entries.add(LogEntryFactory.createLogEntry(log));
        }
        return entries;
    }

    public void close() {
        driver.close();
    }
}

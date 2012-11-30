package com.maps;

import org.openqa.selenium.*;
import org.openqa.selenium.interactions.*;
import org.openqa.selenium.firefox.*;
import java.util.regex.*;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.TimeUnit;
import com.maps.log.*;

public class MapDriver {
    private WebDriver driver;
    private JavascriptExecutor js;
    private Integer id = null;
    private Actions emptyBuilder = null;
    private String username = null;

    private String mapLocator;
    private String zoomInLocator;
    private String zoomOutLocator;

    enum Zoom { IN, OUT }
    enum Location { SF, BOS }

    static class Point {
        public Point(Double latitude, Double longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
        }
    
        public Point(String latitude, String longitude) {
            this(Double.parseDouble(latitude), Double.parseDouble(longitude));
        }

        private Double latitude;
        private Double longitude;

        public Double getLatitude() { 
            return this.latitude;
        }

        public Double getLongitude() {
            return this.longitude;
        }

        @Override
        public boolean equals(Object o) {
            if (o instanceof Point) {
                Point p = (Point)o;
                return p.latitude.equals(latitude) && 
                       p.longitude.equals(longitude);
            } else {
                return false;
            }
        }
        
        @Override
        public String toString() {
            return String.format("Point(%s,%s)", latitude, longitude);
        }
    }

    /* Start a Firefox window and point it to mapwith.me */
    public MapDriver() {
        this(null, null);
    }
    
    public MapDriver(Integer sessionId, String username) {
        this.driver = new FirefoxDriver();
        this.js = (JavascriptExecutor) this.driver;
        this.id = sessionId;
        this.emptyBuilder = new Actions(driver);
        this.username = username;

        //String baseUrl = "file:///Users/jmunizn/Documents/Projects/maps2/maps/client/index.html";
        String baseUrl = String.format("file:///%s/../../index.html", System.getProperty("user.dir"));

        if (sessionId != null) {
            baseUrl = baseUrl + "?session_id=" + sessionId;
        }

        this.driver.get(baseUrl);

        if (sessionId != null) {
            joinSharingSession(username);
        }

        String mapClass = this.driver.findElement(By.id("map")).getAttribute("class");
        if (mapClass.equals("map-google")) {
            this.mapLocator = "//div[@id='map']/div/div/div";
            this.zoomInLocator = "//div[@id='map']/div/div[7]/div[2]/div";
            this.zoomOutLocator = "//div[@id='map']/div/div[7]/div[2]/div[4]";
        } else {
            this.mapLocator = "//div[@id='map']";
            this.zoomInLocator = "//*[@class='leaflet-control-zoom-in']";
            this.zoomOutLocator = "//*[@class='leaflet-control-zoom-out']";
        }
    }

    public WebDriver getWebDriver() {
        return driver;
    }

    public String getUserName() {
        return username;
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

    private WebElement findByXPath(String id) {
        return driver.findElement(By.xpath(id));
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
        this.username = username;
    }

    public Integer getSessionId() {
        return this.id;
    }

    public void sendMessage(String message) {
        perform(emptyBuilder.sendKeys(find("chat_text"), message));
        perform(emptyBuilder.click(find("chat_button")));
    }

    public void panBy(int xOff, int yOff) {
        perform(emptyBuilder.dragAndDropBy(findByXPath(mapLocator), xOff, yOff));
    }

    public void zoomByDoubleClick() {
        perform(emptyBuilder.doubleClick(findByXPath(mapLocator)));
    }

    public void zoomByButton(Zoom zoom) {
        try {
        switch (zoom) { 
            case IN: 
                perform(emptyBuilder.click(findByXPath(zoomInLocator)));
                break;
            case OUT:
                perform(emptyBuilder.click(findByXPath(zoomOutLocator)));
                break;
        }
        } catch (NoSuchElementException e) {
            // exeption means we are using gmaps
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
    
    public Object getCenter() {
        String script = "return window.MapApp.map.getCenter()";
        Json center = new Json(js.executeScript(script));
          
        return new Point(
            center.get("latitude").getValue(), 
            center.get("longitude").getValue());
    }

    public Long getZoom() {
        String script = "return window.MapApp.map.getZoom()";
        Long zoom = (Long) js.executeScript(script);
        return zoom;
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

package com.maps;

import org.openqa.selenium.*;
import org.openqa.selenium.interactions.*;
import org.openqa.selenium.firefox.*;
import java.util.regex.*;

public class MapDriver {
    private WebDriver driver;
    private Integer id = null;
    private Actions emptyBuilder = null;

    /* Start a Firefox window and point it to mapwith.me */
    public MapDriver() {
        this(null, null);
    }
    
    public MapDriver(Integer sessionId, String username) {
        this.driver = new FirefoxDriver();
        this.id = sessionId;
        this.emptyBuilder = new Actions(driver);

        if (sessionId == null) {
            this.driver.get("http://mapwith.me");
        } else {
            this.driver.get("http://mapwith.me?session_id=" + sessionId);
            joinSharingSession(username);
        }

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

    public void panBy(int xOff, int yOff) {
        perform(emptyBuilder.dragAndDropBy(find("map"), xOff, yOff));
    }

    public void zoomByDoubleClick() {
        perform(emptyBuilder.doubleClick(find("map")));
    }


    private void joinSharingSession(String username) {
        /* This can only happen when no other sharing session exists */
        assert(isSharing());

        /* Type username */
        perform(emptyBuilder.sendKeys(find("modal-form-input"), username));
        /* Click 'Join' on modal */
        perform(emptyBuilder.click(find("join-modal")));
    }



    public Integer getSessionId() {
        return this.id;
    }

    public void close() {
        driver.close();
    }
}

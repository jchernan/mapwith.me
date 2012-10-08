package com.maps;

import org.openqa.selenium.*;
import org.openqa.selenium.interactions.*;
import org.openqa.selenium.firefox.*;

public class MapDriver {
    private WebDriver driver;
    private Integer id = null;
    private Actions emptyBuilder = null;

    /* Start a Firefox window and point it to mapwith.me */
    public MapDriver() {
        this.driver = new FirefoxDriver();
        this.id = null;
        this.emptyBuilder = new Actions(driver);

        this.driver.get("http://mapwith.me");
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
        System.out.println(find("session-link").getText());
        Integer id = 0; //TODO: Change me
    }


}

package com.maps;

import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;

import org.openqa.selenium.*;
import org.openqa.selenium.interactions.*;
import org.openqa.selenium.firefox.*;

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

    public static WebDriver getDriver() {
        WebDriver driver = new FirefoxDriver();
        driver.get("http://mapwith.me");
        return driver;
 
    }

    public static Actions startSharing(String username) {
        WebDriver driver = getDriver();
        Actions builder = new Actions(driver);

        /* Click on share */
        builder.click(driver.findElement(By.id("share"))).build().perform();
        /* Type username */
        builder.sendKeys(driver.findElement(By.id("popover-form-input")), username).build().perform();
        /* Click 'Start' on popover */
        builder.click(driver.findElement(By.id("popover-form-button"))).build().perform();
         
        return builder;
    }

    /**
     * Rigourous Test :-)
     */
    public void testApp()
    {

        //Actions builder = startSharing("JulianBot");

        MapDriver mapDriver = new MapDriver();
        mapDriver.startSharing("Jossie");
/* 
        WebDriver driver = new FirefoxDriver();
        

        driver.get("http://mapwith.me");
        
 //       WebElement target = driver.findElement(By.id("map"));
        Actions builder = new Actions(driver);

        builder.click(driver.findElement(By.id("share"))).build().perform();
        builder.sendKeys(driver.findElement(By.id("popover-form-input")), "JulianBot").build().perform();

        builder.click(driver.findElement(By.id("popover-form-button"))).build().perform();
        builder.doubleClick(driver.findElement(By.id("map"))).build().perform();

        builder.dragAndDropBy(driver.findElement(By.id("map")), 200, 250).dragAndDropBy(driver.findElement(By.id("map")), 200, 250).build().perform();

//        builder.dragAndDropBy(driver.findElement(By.id("map")), 200, 250).build().perform();
//        builder.dragAndDropBy(driver.findElement(By.id("map")), 200, 250).build().perform();
//        builder.dragAndDropBy(driver.findElement(By.id("map")), 200, 250).build().perform();
//        builder.dragAndDropBy(driver.findElement(By.id("map")), 200, 250).build().perform();
//        builder.dragAndDropBy(driver.findElement(By.id("map")), 200, 250).build().perform();

//        builder.moveToElement(target, 40, 40).click().click().build().perform();
*/


        assertTrue( true );
    }
}

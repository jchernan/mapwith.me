package com.maps.log;

import java.lang.Integer;
import java.lang.Double;

public class ChangeMapLog extends LogEntry {

    private double latitude;
    private double longitude;
    private int zoom;

    protected ChangeMapLog(LogCategory category, LogAction action) {
        super(category, action);
        latitude = Double.MIN_VALUE;
        longitude = Double.MIN_VALUE;
        zoom = Integer.MIN_VALUE;
    }
    
    public void setLatitude(double lat) {
        this.latitude = lat;
    }

    public void setLongitude(double lon) {
        this.longitude = lon;
    }

    public void setZoom(int zoom) {
        this.zoom = zoom;
    }
    
    public double getLatitude() {
        return latitude;
    }
    
    public double getLongitude() {
        return longitude;
    }
   
    public int getZoom() {
        return zoom;
    }

    public boolean equals(Object obj) {
        if (obj instanceof ChangeMapLog) {
            ChangeMapLog that = (ChangeMapLog) obj;
            return this.getCategory() == that.getCategory()
                && this.getAction() == that.getAction()
                && this.getLatitude() == that.getLatitude()
                && this.getLongitude() == that.getLongitude()
                && this.getZoom() == that.getZoom();
        } else {
            return false;
        }
    }

    public String toString() {
        String value = super.toString();
        if (latitude != Double.MIN_VALUE 
            && longitude != Double.MIN_VALUE) {
            value += " [Latitude: " + latitude 
                + " Longitude: " + longitude + "]"; 
        }
        if (zoom != Integer.MIN_VALUE) {
            value += " [Zoom: " + zoom + "]";
        }
        return value;
    }
}


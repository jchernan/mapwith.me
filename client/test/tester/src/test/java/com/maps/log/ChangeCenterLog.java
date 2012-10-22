package com.maps.log;

public class ChangeCenterLog extends LogEntry {

    private double latitude;
    private double longitude;

    public ChangeCenterLog(LogAction action) {
        super(LogCategory.CHANGE_CENTER, action);
    }
    
    public void setLatitude(double lat) {
        this.latitude = lat;
    }

    public void setLongitude(double lon) {
        this.longitude = lon;
    }

    public double getLatitude() {
        return latitude;
    }
    
    public double getLongitude() {
        return longitude;
    }
    
    public boolean equals(Object obj) {
        if (obj instanceof ChangeCenterLog) {
            ChangeCenterLog that = (ChangeCenterLog) obj;
            return this.getAction() == that.getAction()
                && this.getLatitude() == that.getLatitude()
                && this.getLongitude() == that.getLongitude();
        } else {
            return false;
        }
    }

    public String toString() {
        return super.toString() 
            + " [Latitude: " + latitude 
            + " Longitude: " + longitude + "]";
    }
}


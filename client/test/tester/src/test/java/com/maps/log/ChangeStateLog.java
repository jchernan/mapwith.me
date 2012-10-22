package com.maps.log;

public class ChangeStateLog extends LogEntry {

    private double latitude;
    private double longitude;
    private int zoom;

    public ChangeStateLog(LogAction action) {
        super(LogCategory.CHANGE_STATE, action);
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
        if (obj instanceof ChangeStateLog) {
            ChangeStateLog that = (ChangeStateLog) obj;
            return this.getAction() == that.getAction()
                && this.getLatitude() == that.getLatitude()
                && this.getLongitude() == that.getLongitude()
                && this.getZoom() == that.getZoom();
        } else {
            return false;
        }
    }

    public String toString() {
        return super.toString() 
            + " [Latitude: " + latitude 
            + " Longitude: " + longitude 
            + "] [Zoom: " + zoom + "]";
    }
}


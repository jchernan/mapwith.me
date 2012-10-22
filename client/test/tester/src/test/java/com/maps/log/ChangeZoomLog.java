package com.maps.log;

public class ChangeZoomLog extends LogEntry {

    private int zoom;

    public ChangeZoomLog(LogAction action) {
        super(LogCategory.CHANGE_ZOOM, action);
    }
    
    public void setZoom(int zoom) {
        this.zoom = zoom;
    }

    public int getZoom() {
        return zoom;
    }

    public boolean equals(Object obj) {
        if (obj instanceof ChangeZoomLog) {
            ChangeZoomLog that = (ChangeZoomLog) obj;
            return this.getAction() == that.getAction()
                && this.getZoom() == that.getZoom();
        } else {
            return false;
        }
    }

    public String toString() {
        return super.toString() 
            + " [Zoom: " + zoom + "]";
    }
}


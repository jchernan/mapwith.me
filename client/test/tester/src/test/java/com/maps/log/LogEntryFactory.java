package com.maps.log;

import java.lang.Integer;
import java.lang.Double;
import java.util.List;
import java.util.ArrayList;
import com.maps.log.LogEntry.LogAction;
import com.maps.log.LogEntry.LogCategory;

public class LogEntryFactory {

    public static LogEntry createLogEntry(Object jsLog) {
        Json json = new Json(jsLog); 
        String category = json.get("category").getValue();
        LogEntry log = null;
        if (category.equals("change-center")) {
            log = createChangeCenterLog(json);
        } else if (category.equals("change-zoom")) {
            log = createChangeZoomLog(json);
        } else if (category.equals("change-state")) {
            log = createChangeStateLog(json);
        }
        return log;
    }

    public static LogEntry createChangeCenterLog(
        LogAction action, double latitude, double longitude) {
        ChangeMapLog log = new ChangeMapLog(
            LogCategory.CHANGE_CENTER, action);
        log.setLatitude(latitude);
        log.setLongitude(longitude);
        return log;
    }

    public static LogEntry createChangeZoomLog(
        LogAction action, int zoom) {
        ChangeMapLog log = new ChangeMapLog(
            LogCategory.CHANGE_ZOOM, action);
        log.setZoom(zoom);
        return log;
    }

    public static LogEntry createChangeStateLog(
        LogAction action, double latitude, double longitude, int zoom) {
        ChangeMapLog log = new ChangeMapLog(
            LogCategory.CHANGE_STATE, action);
        log.setLatitude(latitude);
        log.setLongitude(longitude);
        log.setZoom(zoom);
        return log;
    }

    private static LogEntry createChangeCenterLog(Json json) {
        return createChangeCenterLog(getAction(json), 
            getLatitude(json), getLongitude(json));
    }

    private static LogEntry createChangeZoomLog(Json json) {
        return createChangeZoomLog(getAction(json), getZoom(json));
    }

    private static LogEntry createChangeStateLog(Json json) {
        return createChangeStateLog(getAction(json), 
            getLatitude(json), getLongitude(json), getZoom(json));
    }

    private static LogAction getAction(Json json) {
        String action = json.get("action").getValue();
        if (action.equals("send")) {
            return LogAction.SEND;
        } else if (action.equals("receive")) {
            return LogAction.RECEIVE;
        } else if (action.equals("set")) {
            return LogAction.SET;
        } else {
            return null;
        }
    }

    private static double getLatitude(Json json) {
        Json center = json.get("center").getJson();
        return Double.valueOf(center.get("latitude").getValue());
    }

    private static double getLongitude(Json json) {
        Json center = json.get("center").getJson();
        return Double.valueOf(center.get("longitude").getValue());
    }

    private static int getZoom(Json json) {
        return Integer.valueOf(json.get("zoom").getValue());
    }

    public static List<LogEntry> generateComplement(List<LogEntry> list) {
       
        List<LogEntry> cList = new ArrayList<LogEntry>();

        for (LogEntry entry : list) {
            LogAction action = entry.getAction();
            switch(action) {
                case SEND:
                    cList.add(clone(entry, LogAction.RECEIVE));
                    break;
                case RECEIVE:
                    cList.add(clone(entry, LogAction.SEND));
                    break;
            }
        }
        
        return cList;
    }

    private static LogEntry clone(LogEntry entry, LogAction action) {
        LogEntry clone = null;
        LogCategory category = entry.getCategory();
        if (entry instanceof ChangeMapLog) {
            ChangeMapLog change = (ChangeMapLog) entry;
            switch(category) {
                case CHANGE_CENTER:
                    clone = LogEntryFactory.createChangeCenterLog(
                        action, 
                        change.getLatitude(), 
                        change.getLongitude());
                    break;
                case CHANGE_ZOOM:
                    clone = LogEntryFactory.createChangeZoomLog(
                        action, 
                        change.getZoom()); 
                    break;
                case CHANGE_STATE:
                    clone = LogEntryFactory.createChangeStateLog(
                        action, 
                        change.getLatitude(), 
                        change.getLongitude(),
                        change.getZoom());
                    break;
            }
        }
        return clone;
    }

}


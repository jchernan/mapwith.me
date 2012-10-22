package com.maps.log;

public class LogEntry {
    
    public enum LogCategory {
        CHANGE_CENTER,
        CHANGE_ZOOM,
        CHANGE_STATE
    }

    public enum LogAction {
        SEND,
        RECEIVE,
        SET
    }

    private LogCategory category;
    private LogAction action;

    public LogEntry(LogCategory category, LogAction action) {
        this.category = category;
        this.action = action;
    }

    public LogCategory getCategory() {
        return category;
    }

    public LogAction getAction() {
        return action;
    }

    public String toString() {
        return "[" + category + "] [" + action + "]";
    }
}


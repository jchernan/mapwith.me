package com.maps.log;

import java.util.List;
import java.util.ArrayList;
import com.maps.log.LogEntry.LogAction;
import com.maps.log.LogEntry.LogCategory;

public class LogComparator {

    public static boolean compare(List<LogEntry> list1, List<LogEntry> list2) {
        List<LogEntry> cList1 = generateComplement(list1);
        return cList1.equals(list2);
    }

    private static List<LogEntry> generateComplement(List<LogEntry> list) {
       
        List<LogEntry> cList = new ArrayList<LogEntry>();

        for (LogEntry entry : list) {
            LogAction action = entry.getAction();
            switch(action) {
                case SEND:
                    generateSendComplement(entry, cList);
                    break;
                case RECEIVE:
                    generateReceiveComplement(entry, cList);
                    break;
            }
        }
        
        return cList;
    }

    private static void generateSendComplement(LogEntry entry, 
            List<LogEntry> cList) {
        LogCategory category = entry.getCategory();
        switch(category) {
            case CHANGE_CENTER:
                ChangeCenterLog changeCenter = (ChangeCenterLog) entry;
                cList.add(LogEntryFactory.createChangeCenterLog(
                    LogAction.RECEIVE, 
                    changeCenter.getLatitude(), 
                    changeCenter.getLongitude()));
                cList.add(LogEntryFactory.createChangeCenterLog(
                    LogAction.SET, 
                    changeCenter.getLatitude(), 
                    changeCenter.getLongitude()));
                break;
            case CHANGE_ZOOM:
                ChangeZoomLog changeZoom = (ChangeZoomLog) entry;
                cList.add(LogEntryFactory.createChangeZoomLog(
                    LogAction.RECEIVE, 
                    changeZoom.getZoom())); 
                cList.add(LogEntryFactory.createChangeZoomLog(
                    LogAction.SET, 
                    changeZoom.getZoom())); 
                break;
            case CHANGE_STATE:
                ChangeStateLog changeState = (ChangeStateLog) entry;
                cList.add(LogEntryFactory.createChangeStateLog(
                    LogAction.RECEIVE, 
                    changeState.getLatitude(), 
                    changeState.getLongitude(),
                    changeState.getZoom()));
                cList.add(LogEntryFactory.createChangeStateLog(
                    LogAction.SET, 
                    changeState.getLatitude(), 
                    changeState.getLongitude(),
                    changeState.getZoom()));
                break;
        }
    }

    private static void generateReceiveComplement(LogEntry entry, 
            List<LogEntry> cList) {
        LogCategory category = entry.getCategory();
        switch(category) {
            case CHANGE_CENTER:
                ChangeCenterLog changeCenter = (ChangeCenterLog) entry;
                cList.add(LogEntryFactory.createChangeCenterLog(
                    LogAction.SEND, 
                    changeCenter.getLatitude(), 
                    changeCenter.getLongitude()));
                break;
            case CHANGE_ZOOM:
                ChangeZoomLog changeZoom = (ChangeZoomLog) entry;
                cList.add(LogEntryFactory.createChangeZoomLog(
                    LogAction.SEND, 
                    changeZoom.getZoom())); 
                break;
            case CHANGE_STATE:
                ChangeStateLog changeState = (ChangeStateLog) entry;
                cList.add(LogEntryFactory.createChangeStateLog(
                    LogAction.SEND, 
                    changeState.getLatitude(), 
                    changeState.getLongitude(),
                    changeState.getZoom()));
                break;
        }
        
    }

}

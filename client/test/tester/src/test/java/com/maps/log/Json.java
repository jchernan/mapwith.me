package com.maps.log;

import java.util.Map;
import java.util.Set;

public class Json {

    private Map<String, Object> map;

    public Json(Object json) {
        this.map = (Map<String, Object>) json; 
    }

    public JsonValue get(String key) {
        return new JsonValue(map.get(key));
    }

    public Set<String> keySet() {
        return map.keySet();
    }

    public String toString() {
        return map.toString();
    }

    public class JsonValue {
        
        private Json json;
        private String value;

        public JsonValue(Object value) {
            if (value instanceof Map) {
                this.value = null;
                this.json = new Json(value);
            } else {
                this.value = value.toString();
                this.json = null;
            }
        }

        public boolean isJson() {
            return json != null;
        }

        public Json getJson() {
            return json;
        }

        public String getValue() {
            return value;
        }

        public String toString() {
            if (isJson()) {
                return getJson().toString();
            } else {
                return getValue().toString();
            }
        }
    }
}

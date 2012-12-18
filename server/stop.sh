#!/bin/bash

kill -9 $(ps aux | grep collab | grep -v grep  | head -n 1 | awk '{print $2}' ) 2>/dev/null

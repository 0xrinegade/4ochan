#!/bin/bash
echo "Killing any existing Node.js processes..."
ps -ef | grep "NODE_ENV=development tsx server/index.ts" | grep -v grep | awk '{print $2}' | xargs -r kill -9
echo "Waiting a moment..."
sleep 2
echo "Done!"
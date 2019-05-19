import datetime
import sys
import time
import subprocess

participant = sys.argv[1]
print(participant)

value = datetime.datetime.fromtimestamp(time.time())
print(participant + " at " + value.strftime('%Y-%m-%d_%H:%M:%S'))
f = open(participant + "/" + value.strftime('%Y-%m-%d_%H:%M:%S') + "_videoStart.txt", 'w')
f.write("Video process start: " + str(time.time()) + "\n")

# Open quicktime and start recording
subprocess.call(["osascript -e 'tell application \"QuickTime Player\" to activate' -e 'tell application \"QuickTime Player\" to start (new movie recording)'", "-1"], shell=True)

# Note the time the recordning started for later analysis and syncronization
f.write("Video recording started: " + str(time.time()) )
f.close()
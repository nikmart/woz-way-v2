#!/bin/bash

printf "Video startup for DJ Bot\n"
printf "Participant ID: "
read answer
printf "$answer\n"

cd ~/Desktop/WoZ-Way-Sessions

# create a new directory for the participant and go to that directory
mkdir "$answer"
mkdir "$answer"/VIDEO

# start the video recording
python ~/GitRepos/woz-way-v2/start_video.py "$answer"/VIDEO
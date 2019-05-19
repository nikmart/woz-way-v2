# WoZ Way -- Version 2
This project contains all the code to run Woz Way Version 2, a Wizard of Oz controlled speech agent. This work is part of Nik Martelaro's thesis, "The Needfinding Machine." There are two components to the system, the BOT and the CONTROL. The BOT is the in-home radio with speech agent. The CONTROL interface provides the a tool for remote designers and researchers to control the vocie of the Bot and to takes notes on the interaction.

### BOT
The BOT directory contains the souce code for the in-context Bot. The Bot uses the Apple Text-to-Speech system to control music and speak messages. The Bot also steams a live video/audio feed over web chat (using Hangouts or Skype),

#### Requirements
1. MacOS
2. Installed Apple voices - whichever voices and languages you would like. I recommend the high quality versions.
3. NodeJS and NPM
5. Speakers
6. Webcam with microphone
7. [forever.js](https://github.com/foreverjs/forever) (a system to keep node apps running in the background)

#### Instructions
1. Clone this repo using git
2. Navigate to `BOT` directory using your Terminal
3. Run `npm install`
4. Run `npm install forever -g` to install forever.js
5. Run `forever start_bot.json &`
6. To stop the process, run `forever stopall`


### CONTROL
The CONTROL directory contains the source code for running the Bot control page. It is a NodeJS based web application that allows for the remote wizard to control the speech of the Bot and the music volume. There are three areas to on the interface.

1. A section to write custom messages that are sent to the Bot and spoken out loud.
2. A section with pre-defined messages and quick play buttons.
3. A notes section which sends messages to the Bot in order to log them in-sync with the video.

#### Requirements
1. NodeJS and NPM
2. An open network port that can be used for serving the web application.
3. [forever.js](https://github.com/foreverjs/forever) (a system to keep node apps running in the background)
4. A known MQTT broker

#### Instructions
1. Clone this repo using git
2. Navigate to `CONTROL` directory using your Terminal
3. Run `npm install`
4. Run `npm install forever -g` to install forever.js
5. Run `forever start_control.json &`
6. To stop the process, run `forever stopall`

### ForeverJS and Log Files
I have provided a `start_bot.json` and `start_control.json` to setup logging with `forever.js`. This create log files from the timestampped output.

The paths for the log file locations are saved using *absolute* paths. You will need to change the JSON files to match your absolute path directory.

Also, the log files do not seem to be overwritten or appended. Ater each session, I recommend that you copy the log file over from the `logs` directory, save the data with your other data, and then clean the `logs` directory so it is ready for the next run.

### Starting Local video recording using QuickTime for MacOS
There is a `start_video.command` file which can be turned into a desktop icon on MacOS. This will create a new directory in a folder on the desktop called `WoZ-Way-Sessions/` and will save a text file with the start time of the video. The command will then call `start_video.py` which will call AppleScript to start a video recording. Make sure that the right camera and mic is set in QuickTime (the quad input).
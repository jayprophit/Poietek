# Poietek Web Surfaces

## Website

Normal public website opened in a browser.

Responsibilities:
- product information
- documentation
- downloads
- supported hardware
- pricing later
- community/public discovery later
- sign-in/account portal

It must never initialize the realtime audio engine simply because someone visits
the marketing homepage.

## Web App

Browser-based Poietek Studio.

Responsibilities:
- local-first projects
- WebAudio
- WebMIDI where supported
- IndexedDB/OPFS
- optional hosted sync
- installable PWA

## Installed Apps

Windows/macOS/Linux/iOS/iPadOS/Android.

The user launches Poietek from the operating system like any other application.
The installed application owns:
- native shell
- local database/files
- deeper device integrations
- native audio/MIDI adapters
- desktop plugin hosting where supported

The fact that the UI is shared React code is an implementation detail; the user
does not open a browser to use an installed app.

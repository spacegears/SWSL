# SWSL - Steam Workshop Subscription Lister
This is an updated version of Bryn "BrynM" Mosher's excellent [Steam Workshop Subscriptions Scraper](https://gist.github.com/BrynM/c1b49804e53d7c406143a9ae40ed65ad). He's the real MVP.

## What's new?
- Added UserScript metadata block, so it could be used with userscript managers such as Tampermonkey or Greasemonkey
- The script doesn't need to be run manually from the console anymore. A "Run SWSL" button is injected into the Workshop menu on the right, it can be started from there 
- The script was broken when less than 10 items were listed for a game, when `appid` was `0`, and when `p` wasn't defined. The script was updated to handle these "properly" (at least I hope so, I have no effin idea what I'm doing)
- Updated script to include date of the last update in the exported files
- HTML/CSS to match the official Steam Workshop colors and style
- HTML output was updated to include some metadata
- HTML output was updated to use a responsive grid instead of a table
- HTML output was updated to match the official Steam Workshop colors and style
- Fixed typos and other minor (mostly visual) adjustments

## Preview
![swsl-1](https://github.com/user-attachments/assets/754dec2e-00fa-49f9-9e9b-9b573b2aa24a)
![swsl-2](https://github.com/user-attachments/assets/34db5a30-615e-4ea4-9400-fbb9351795fb)
![swsl-3](https://github.com/user-attachments/assets/ef0cc1c4-b9d5-4e87-8fec-6e27689c9ff6)

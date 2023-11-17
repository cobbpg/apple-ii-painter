# Apple II HGR Painter

This is a simple paint application I made specifically to be able to create the art for the [Apple II port of Stunt Car Racer](https://cobbpg.github.io/articles/stunt-car-racer-apple2-port.html). It doesn't provide a full-fledged toolkit for drawing images from scratch. Instead, the main purpose of this tool is to touch up images that come from converters (e.g. [Buckshot](https://apple2.gs/buckshot/) or [\]\[-Pix](https://github.com/KrisKennaway/ii-pix)). You can also use straight memory dumps from $2000 or $4000 as input.

There's no build process, this is just a plain old-fashioned HTML page. Open `index.html` to get started. Start work by choosing *Import Binary* and load an 8192-byte HGR file. You can also drag and drop the file on the canvas. It's also possible to load a reference image and change the opacity of the canvas to reveal it gradually. When you're done, just press the *Export* button to save the image in ready to display binary form.

The only thing you can do is paint individual pixels in the selected colour and pattern with the left mouse button. Every tool has a keyboard shortcut, so you can just use your browser's zoom feature to magnify the details you're working on. Yes, I'm this lazy, but this solution worked perfectly for my needs.

## Keyboard Shortcuts

* Q/W/E/R - pick colour
* 1-9 - pick pattern
* M - toggle between monochrome and filled mode (where every displayed pixel is the sum of 4 consecutive monochrome pixels)
* Z - toggle opacity (subtract current value from 100%)
* Ctrl-Z - undo last drawing operation

## Acknowledgements

This project uses [FileSaver.js](https://github.com/eligrey/FileSaver.js) by Eli Grey.
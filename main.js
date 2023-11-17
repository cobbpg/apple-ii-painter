const image = document.querySelector('#image');
const imageBox = document.querySelector('#imageBox');
const opacitySlider = document.querySelector('#canvasOpacity');
const ctx = image.getContext("2d");
const colorButtons = document.querySelectorAll('.colorButton');
const patternButtons = document.querySelectorAll('.patternButton');

const palette = [
    'rgb(  0,   0,   0)',
    'rgb(227,  30,  96)',
    'rgb( 96,  78, 189)',
    'rgb(255,  68, 253)',
    'rgb(  0, 163,  96)',
    'rgb(156, 156, 156)',
    'rgb( 20, 207, 253)',
    'rgb(208, 195, 255)',
    'rgb( 96, 114,   3)',
    'rgb(255, 106,  60)',
    'rgb(156, 156, 156)',
    'rgb(255, 160, 208)',
    'rgb( 20, 245,  60)',
    'rgb(208, 221, 141)',
    'rgb(114, 255, 208)',
    'rgb(255, 255, 255)'
];

const monoPalette = [
    'rgb(  0,   0,   0)',
    'rgb(255, 60, 192)', // 0
    'rgb(192, 156, 255)', // 1
    'rgb(255, 136, 255)',
    'rgb(0, 255, 192)', // 2
    'rgb(255, 255, 255)',
    'rgb(40, 255, 255)',
    'rgb(255, 255, 255)',
    'rgb(192, 228, 6)', // 3
    'rgb(255, 212, 120)',
    'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
    'rgb(40, 255, 120)',
    'rgb(255, 255, 255)',
    'rgb(228, 255, 255)',
    'rgb(255, 255, 255)'
];

const rowAddresses = []
for (let i = 0; i < 192; i++) {
    rowAddresses.push(((((i & 7) << 2) + ((i >> 4) & 3)) << 8) + ((i >> 6) * 0x28 + ((i >> 3) << 7) & 0xff));
}

const colorPatterns = [0x552a, 0x2a55];
const andPatterns = [0x80808080, 0xe6b399cc, 0x99cce6b3, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0x99cce6b3, 0xe6b399cc];
const orPatterns =  [0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x194c6633, 0x6633194c, 0x7f7f7f7f, 0x194c6633, 0x6633194c];

const bits = new Uint8Array(40 * 192);
const undoHistory = [];
let currentColor = 0;
let currentPattern = 0;
let drawing = false;
let monochrome = false;

function offset(x, y) {
    return y * 40 + (x / 7) | 0;
}

function mask(x) {
    return 1 << (x % 7);
}

function plot(x, y) {
    if (x < 0 || y < 0 || x >= 280 || y >= 192) {
        return;
    }
    const ofs = offset(x, y);
    const m = mask(x);
    const cs = (ofs & 1) << 3;
    const ps = (((ofs & 3) << 3) + ((y & 1) << 4)) & 0x1f;
    const colorPattern = colorPatterns[currentColor & 1] >> cs;
    const andPattern = andPatterns[currentPattern] >> ps;
    const orPattern = orPatterns[currentPattern] >> ps;
    const oldValue = bits[ofs];
    bits[ofs] = (bits[ofs] & ~m) | ((colorPattern & andPattern | orPattern) & m);
    if (currentColor < 2) {
        bits[ofs] &= 0x7f;
    } else {
        bits[ofs] |= 0x80;
    }
    if (oldValue == bits[ofs]) {
        return false;
    }
    refresh(x, y);
    return true;
}

function refresh(x, y) {
    const ofs = offset(x, y);
    const bytes = [x < 7 ? 0 : bits[ofs - 1], bits[ofs], x >= 273 ? 0 : bits[ofs + 1]];
    const bs = [];
    const rem = ((x / 7 | 0) * 2 + 2) & 3;
    let lastBit = 0;
    for (let i = 0; i < 3; i++) {
        const delayed = bytes[i] > 0x7f;
        if (delayed) {
            bs.push(lastBit);
        }
        for (let j = 0; j < 6; j++) {
            const bit = (bytes[i] >> j) & 1;
            bs.push(bit, bit);
            lastBit = bit;
        }
        lastBit = (bytes[i] >> 6) & 1;
        bs.push(lastBit);
        if (!delayed) {
            bs.push(lastBit);
        }
    }
    for (let i = 10; i < 29; i++) {
        let cid = 0;
        for (let j = 0; j < 4; j++) {
            cid |= bs[i + j] << ((i + j + rem) & 3);
        }
        ctx.fillStyle = monochrome ? monoPalette[cid & (1 << ((i + rem) & 3))] : palette[cid];
        ctx.fillRect(((x / 7 | 0) * 14 - 14 + i) * 2, y * 4, 2, 4);
    } 
}

function refreshAll() {
    for (let y = 0; y < 192; y++) {
        for (let x = 0; x < 40; x++) {
            refresh(x * 7, y);
        }
    }    
}

function importArray(array) {
    for (let y = 0; y < 192; y++) {
        for (let x = 0; x < 40; x++) {
            bits[y * 40 + x] = array[rowAddresses[y] + x];
        }
    }
    refreshAll();
}

const selectColor = (index) => () => {
    colorButtons[currentColor].style.color = 'yellow';
    currentColor = index;
    colorButtons[currentColor].style.color = 'red';
    const color = colorButtons[index].style.backgroundColor;
    patternButtons[1].style.background = `repeating-conic-gradient(${color} 0% 25%, #000000 0% 50%) 0% 0% / 10px 10px`;
    patternButtons[2].style.background = `repeating-conic-gradient(#000000 0% 25%, ${color} 0% 50%) 0% 0% / 10px 10px`;
    patternButtons[3].style.background = color;
    patternButtons[4].style.background = `repeating-conic-gradient(${color} 0% 25%, #ffffff 0% 50%) 0% 0% / 10px 10px`;
    patternButtons[5].style.background = `repeating-conic-gradient(#ffffff 0% 25%, ${color} 0% 50%) 0% 0% / 10px 10px`;
}

const selectPattern = (index) => () => {
    patternButtons[currentPattern].style.color = 'yellow';
    currentPattern = index;
    patternButtons[currentPattern].style.color = 'red';
}

const colorKeys = [81, 87, 69, 82];
const patternKeys = [49, 50, 51, 52, 53, 54, 55, 56, 57];

function importBinary(e) {
    e.stopPropagation();
    e.preventDefault();
    const file = event.dataTransfer ? event.dataTransfer.files[0] : event.target.files[0];
    const reader = new FileReader();
    reader.onload = (le) => {
        importArray(new Uint8Array(le.target.result));
    };
    reader.readAsArrayBuffer(file);
}

function importImage(e) {
    e.stopPropagation();
    e.preventDefault();
    const file = event.dataTransfer ? event.dataTransfer.files[0] : event.target.files[0];
    const reader = new FileReader();
    reader.onload = (le) => {
        imageBox.style['background-image'] = `url('${le.target.result}')`;
        //imageBox.style.background = `url('${le.target.result}') center center / 1120px 768px no-repeat`;
    };
    reader.readAsDataURL(file);
}

function exportBinary(e) {
    const exportBits = new Uint8Array(8192);
    for (let y = 0; y < 192; y++) {
        for (let x = 0; x < 40; x++) {
            exportBits[rowAddresses[y] + x] = bits[y * 40 + x];
        }
    }
    var blob = new Blob([exportBits], {type: "application/octet-stream"});
    saveAs(blob, document.getElementById('exportBinaryName').value);
}

window.addEventListener('keydown', (e) => {
    const colorIndex = colorKeys.indexOf(e.keyCode);
    if (colorIndex >= 0) {
        selectColor(colorIndex)();
    }
    const patternIndex = patternKeys.indexOf(e.keyCode);
    if (patternIndex >= 0) {
        selectPattern(patternIndex)();
    }
    switch (e.keyCode) {
        case 77:
            document.getElementById('monochrome').checked = !monochrome;
            toggleMonochrome();
            break;
        case 90:
            if (e.ctrlKey) {
                if (undoHistory.length > 0) {
                    bits.set(undoHistory.pop());
                    refreshAll();
                }
            } else {
                opacitySlider.value = 100 - opacitySlider.value;
                setCanvasOpacity();
            }
            break;
    }
});

window.addEventListener('mouseup', (e) => {
    drawing = false;
    e.stopPropagation();
});

image.addEventListener('mousedown', (e) => {
    drawing = true;
    undoHistory.push(new Uint8Array(bits));
    const x = (e.x - (image.offsetLeft + image.clientLeft)) / 4 | 0;
    const y = (e.y - (image.offsetTop + image.clientTop)) / 4 | 0;
    if (!plot(x, y)) {
        undoHistory.pop();
    };
    e.stopPropagation();
});

image.addEventListener('mousemove', (e) => {
    if (drawing) {
        const x = (e.x - (image.offsetLeft + image.clientLeft)) / 4 | 0;
        const y = (e.y - (image.offsetTop + image.clientTop)) / 4 | 0;
        plot(x, y);
    }
    e.stopPropagation();
});

image.addEventListener('dragenter', (e) => {
    e.stopPropagation();
    e.preventDefault();
});

image.addEventListener('dragover', (e) => {
    e.stopPropagation();
    e.preventDefault();
});

image.addEventListener('drop', importBinary);

function setCanvasOpacity() {
    image.style.opacity = opacitySlider.value / 100;
}

function toggleMonochrome() {
    monochrome = document.getElementById('monochrome').checked;
    refreshAll();
}

document.getElementById('importBinary').addEventListener('change', importBinary);
document.getElementById('importImage').addEventListener('change', importImage);
document.getElementById('exportBinary').addEventListener('click', exportBinary);
opacitySlider.addEventListener('input', setCanvasOpacity);
document.getElementById('monochrome').addEventListener('click', toggleMonochrome);

colorButtons.forEach((button, index) => button.addEventListener('click', selectColor(index)));
patternButtons.forEach((button, index) => button.addEventListener('click', selectPattern(index)));

ctx.fillRect(0, 0, image.width, image.height);

selectColor(0)();
selectPattern(3)();
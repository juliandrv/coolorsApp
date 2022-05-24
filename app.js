//Global selections and variables
const colorDivs = document.querySelectorAll('.color');
const generateBtn = document.querySelector('.generate');
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll('.color h2');
const copyPopup = document.querySelector('.copy-container');
const adjustBtn = document.querySelectorAll('.adjust');
const lockBtn = document.querySelectorAll('.lock');
const closeAdjustments = document.querySelectorAll('.close-adjustment');
const sliderContainers = document.querySelectorAll('.sliders');
let initialColors;
//Local storage
const saveBtn = document.querySelector('.save');
const submitSave = document.querySelector('.submit-save');
const closeSave = document.querySelector('.close-save');
const saveContainer = document.querySelector('.save-container');
const saveInput = document.querySelector('.save-container input');
const libraryContainer = document.querySelector('.library-container');
const libraryBtn = document.querySelector('.library');
const closeLibraryBtn = document.querySelector('.close-library');

let savedPalettes = [];


// Event Listeners
sliders.forEach(slider => {
    slider.addEventListener('input', hslControls);
});

colorDivs.forEach((div, index) => {
    div.addEventListener('input', () => {
        updateTextUI(index);
    });
});

currentHexes.forEach(hex => {
    hex.addEventListener('click', () => {
        copyToClipboard(hex);
    });
});

copyPopup.addEventListener('transitionend', () => {
    const popupBox = copyPopup.children[0]
    copyPopup.classList.remove('active');
    popupBox.classList.remove('active');
});

adjustBtn.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        openAdjustmentPanel(index);
    })
});

closeAdjustments.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        closeAdjustmentPanel(index);
    })
});

lockBtn.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
        lockLayer(e, index)
    })
})

generateBtn.addEventListener('click', randomColors);

saveBtn.addEventListener('click', openSavePalletes);
closeSave.addEventListener('click', closeSavePalletes);
submitSave.addEventListener('click', savePallete);
libraryBtn.addEventListener('click', openLibrary);
closeLibraryBtn.addEventListener('click', closeLibrary);


//Functions
//Color generator
function generateHex() {
    /* const letters = "0123456789ABCDEF";
    let hash = "#"
    for (let i = 0; i < 6; i++) {
        hash += letters[Math.floor(Math.random() * 16)];
    }
    return hash; */
    return hexColor = chroma.random();
}

function randomColors() {
    //Initial colors
    initialColors = [];

    colorDivs.forEach((div, index) => {
        const hexText = div.children[0];
        const randomColor = generateHex();

        //Add color to initialColors
        if(div.classList.contains('locked')) {
            initialColors.push(hexText.innerText);
            return;
        } else {
            initialColors.push(chroma(randomColor).hex());
        }

        //Add background
        div.style.backgroundColor = randomColor;
        hexText.innerText = randomColor;

        //Check for contrast
        checkTextContrast(randomColor, hexText);

        //Initial Colorize Sliders
        const color = chroma(randomColor);
        const sliders = div.querySelectorAll('.sliders input');
        const hue = sliders[0];
        const brightness = sliders[1];
        const saturarion = sliders[2];

        colorizeSliders(color, hue, brightness, saturarion);
    });

    //Reset inputs
    resetInputs();

    //Check for buttons contrast
    adjustBtn.forEach((btn, index) => {
        checkTextContrast(initialColors[index], btn);
        checkTextContrast(initialColors[index], lockBtn[index]);
    });
}

function checkTextContrast(color, text) {
    const luminance = chroma(color).luminance();
    if (luminance > 0.5) {
        text.style.color = "black";
    } else {
        text.style.color = "white";

    }
}

function colorizeSliders(color, hue, brightness, saturarion) {
    //Scale saturation
    const noSat = color.set('hsl.s', 0);
    const fullSat = color.set('hsl.s', 1);
    const scaleSat = chroma.scale([noSat, color, fullSat]);

    //Scale brightness
    const midBright = color.set('hsl.l', 0.5);
    const scaleBright = chroma.scale(["black", midBright, "white"]);

    //Update input colors
    saturarion.style.backgroundImage = `linear-gradient(to right, ${scaleSat(0)}, ${scaleSat(1)})`;
    brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(0)}, ${scaleBright(0.5)}, ${scaleBright(1)})`;
    hue.style.backgroundImage = `linear-gradient(to right, rgb(204,75,75), rgb(204,204,75), rgb(75,204,75), rgb(75,204,204), rgb(75,75,204), rgb(204,75,204), rgb(204,75,75))`
}

function hslControls(e) {
    const index = e.target.getAttribute('data-bright') || e.target.getAttribute('data-hue') || e.target.getAttribute('data-sat');

    let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturarion = sliders[2];

    const gbColor = initialColors[index];

    let color = chroma(gbColor)
        .set('hsl.s', saturarion.value)
        .set('hsl.l', brightness.value)
        .set('hsl.h', hue.value);

    colorDivs[index].style.backgroundColor = color;

    //Colorize slider/inputs
    colorizeSliders(color, hue, brightness, saturarion);
}

function updateTextUI(index) {
    const activeDiv = colorDivs[index];
    const color = chroma(activeDiv.style.backgroundColor);
    const textHex = activeDiv.querySelector('h2');
    const icons = activeDiv.querySelectorAll('.controls button');
    textHex.innerText = color.hex();

    //Check contrast
    checkTextContrast(color, textHex)
    for (const icon of icons) {
        checkTextContrast(color, icon)
    }
}

function resetInputs() {
    const sliders = document.querySelectorAll('.sliders input');
    sliders.forEach(slider => {
        if(slider.name === 'hue') {
            const hueColor = initialColors[slider.getAttribute('data-hue')];
            const hueValue = chroma(hueColor).hsl()[0];
            slider.value = Math.floor(hueValue);
        }
        if(slider.name === 'brightness') {
            const brightColor = initialColors[slider.getAttribute('data-bright')];
            const brightValue = chroma(brightColor).hsl()[2];
            slider.value = Math.floor(brightValue * 100) /100;
        }
        if(slider.name === 'saturation') {
            const satColor = initialColors[slider.getAttribute('data-sat')];
            const satValue = chroma(satColor).hsl()[1];
            slider.value = Math.floor(satValue * 100) /100;
        }
    });
}

function copyToClipboard(hex) {
    const el = document.createElement('textarea');
    el.value = hex.innerText;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    //Popup animation
    const popupBox = copyPopup.children[0]
    copyPopup.classList.add('active');
    popupBox.classList.add('active');
}

function openAdjustmentPanel(index) {
    sliderContainers[index].classList.toggle('active');
};

function closeAdjustmentPanel(index) {
    sliderContainers[index].classList.remove('active');
};

function lockLayer(e, index) {
    const lockSVG = e.target.children[0];
    const activeBG = colorDivs[index];
    activeBG.classList.toggle('locked');

    if (lockSVG.classList.contains('fa-lock-open')) {
        e.target.innerHTML = '<i class="fa-solid fa-lock"></i>';
    } else {
        e.target.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
    }
}

//Save to palette and local storage
function openSavePalletes() {
    saveInput.focus();
    const popup = saveContainer.children[0];
    saveContainer.classList.add('active');
    popup.classList.add('active');
}

function closeSavePalletes() {
    const popup = saveContainer.children[0];
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
}

function savePallete() {
    const popup = saveContainer.children[0];
    saveContainer.classList.remove("active");
    popup.classList.remove("active");
    const name = saveInput.value;
    const colors = [];
    currentHexes.forEach((hex) => {
        colors.push(hex.innerText);
    });
    //Generate object
    let paletteNum;
    const paletteObjects = JSON.parse(localStorage.getItem('palettes'));
    if (paletteObjects) {
        paletteNum =  paletteObjects.length;
    } else {
        paletteNum = savedPalettes.length;
    }

    const paletteObj = {name, colors, num: paletteNum};
    savedPalettes.push(paletteObj);
    console.log(savedPalettes);
    //Save to local storage
    saveToLocal(paletteObj);
    saveInput.value = '';
    //Generate the palette for library
    const palette = document.createElement('div');
    palette.classList.add('custom-palette');
    const title = document.createElement('h4');
    title.innerText = paletteObj.name;
    const preview = document.createElement('div');
    preview.classList.add('small-preview');
    paletteObj.colors.forEach(smallColor => {
        const smallDiv = document.createElement('div');
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
    })
    const paletteBtn = document.createElement('button');
    paletteBtn.classList.add('pick-palette-btn');
    paletteBtn.classList.add(paletteObj.num);
    paletteBtn.innerText = 'Select';

    //Attach event to btn
    paletteBtn.addEventListener('click', e => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];
        initialColors = [];
        savedPalettes[paletteIndex].colors.forEach((color, index) => {
            initialColors.push(color);
            colorDivs[index].style.backgroundColor = color;
            const text = colorDivs[index].children[0];
            checkTextContrast(color, text)
            updateTextUI(index);
        });
        resetInputs();
    });

    //Append to library
    palette.appendChild(title);
    palette.appendChild(preview);
    palette.appendChild(paletteBtn);
    libraryContainer.children[0].appendChild(palette);
}

function saveToLocal(paletteObj) {
    let localPalettes;
    if (localStorage.getItem('palettes') === null) {
        localPalettes = [];
    } else {
        localPalettes = JSON.parse(localStorage.getItem('palettes'));
    }
    localPalettes.push(paletteObj);
    localStorage.setItem('palettes', JSON.stringify(localPalettes));
}

function openLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.add('active');
    popup.classList.add('active');
}

function closeLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.remove('active');
    popup.classList.remove('active');
}

function getLocal() {
    if (localStorage.getItem('palettes') === null) {
        localPalettes = [];
    } else {
        const paletteObjects = JSON.parse(localStorage.getItem('palettes'));
        savedPalettes = [...paletteObjects];
        paletteObjects.forEach(paletteObj => {
            //Generate the palette for library
            const palette = document.createElement('div');
            palette.classList.add('custom-palette');
            const title = document.createElement('h4');
            title.innerText = paletteObj.name;
            const preview = document.createElement('div');
            preview.classList.add('small-preview');
            paletteObj.colors.forEach(smallColor => {
                const smallDiv = document.createElement('div');
                smallDiv.style.backgroundColor = smallColor;
                preview.appendChild(smallDiv);
            })
            const paletteBtn = document.createElement('button');
            paletteBtn.classList.add('pick-palette-btn');
            paletteBtn.classList.add(paletteObj.num);
            paletteBtn.innerText = 'Select';

            //Attach event to btn
            paletteBtn.addEventListener('click', e => {
                closeLibrary();
                const paletteIndex = e.target.classList[1];
                initialColors = [];
                paletteObjects[paletteIndex].colors.forEach((color, index) => {
                    initialColors.push(color);
                    colorDivs[index].style.backgroundColor = color;
                    const text = colorDivs[index].children[0];
                    checkTextContrast(color, text)
                    updateTextUI(index);
                });
                resetInputs();
            });

            //Append to library
            palette.appendChild(title);
            palette.appendChild(preview);
            palette.appendChild(paletteBtn);
            libraryContainer.children[0].appendChild(palette);
        })
    }

}

randomColors();
getLocal();
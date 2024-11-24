const canvas = document.getElementById('canvas');

const ctx = canvas.getContext('2d');
const functionEditor = document.getElementById('function-editor');
const addButtonDiv = document.getElementById('add-button-div');
const addFunctionButton = document.getElementById('add-function');
const deleteInputButton = document.getElementsByClassName('delete-input-button')[0];
const inputDiv = document.getElementsByClassName('input-div')[0];
const functionInput = document.getElementsByClassName('function-input')[0];
const mathjaxPreview = inputDiv.querySelector('.mathjax-preview');
const importFunctionsInput = document.getElementById('import-functions-input');
const functionEditorHeader = document.getElementById('function-editor-header');
const parenthesis = 'keep';
const implicit = 'hide';

const importFunctions = () => {
    const file = importFunctionsInput.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (e) => {
        functions = JSON.parse(e.target.result);
        functionEditorHeader.innerHTML = '';
        for (let i = 0; i < functions.length; i++) {
            const inputDiv = addFunction();
            inputDiv.querySelector('.function-input').value = functions[i];
            updateFunction(inputDiv, functions[i]);
        }
    }
};

const exportFunctions = () => {
    const functions = Array.from(functionEditorHeader.children).map((inputDiv) => {
        return inputDiv.querySelector('.function-input').value;
    });
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(functions)));
    element.setAttribute('download', 'functions.json');
    element.style.display = 'none';
    element.click();
};

function functionByParts(f, g, x) {
    return (x <= 0) ? f(x) : g(x);
};

const functionByPartsTeX = (node, options) => {
    return String.raw`\begin{cases} ${node.args[0].toTex(options)}\left(${node.args[2].toTex(options)}\right) & \text{if } ${node.args[2].toTex(options)} \leq 0 \\ ${node.args[1].toTex(options)}\left(${node.args[2].toTex(options)}\right) & \text{if } ${node.args[2].toTex(options)} > 0 \end{cases}`;
};

const sumFromAtoB = (a, b, f) => {
    let sum = 0;
    for (let i = a; i <= b; i++) {
        sum += f(i);
    }
    return sum;
};

const sumFromAtoBTeX = (node, options) => {
    return String.raw`\sum_{k=${node.args[0].toTex(options)}}^{${node.args[1].toTex(options)}} ${node.args[2].toTex(options)}(k)`;
};

const productFromAtoB = (a, b, f) => {
    let product = 1;
    for (let i = a; i <= b; i++) {
        product *= f(i);
    }
    return product;
}

const productFromAtoBTeX = (node, options) => {
    return String.raw`\prod_{k=${node.args[0].toTex(options)}}^{${node.args[1].toTex(options)}} ${node.args[2].toTex(options)}(k)`;
};

const derivative = (f, variable, a) => {
    return math.derivative(parser.get(f), variable).evaluate({[variable]: a});
};

const derivativeTeX = (node, options) => {
    return String.raw`\frac{d${node.args[0].toTex(options)}}{d${node.args[1].toTex(options)}}\left(${node.args[2].toTex(options)}\right)`;
};

const customLaTeX = {
    'functionByParts': functionByPartsTeX,
    'sumFromAtoB': sumFromAtoBTeX,
    'productFromAtoB': productFromAtoBTeX,
    'derivative': derivativeTeX,
};

const parser = math.parser();
parser.set('functionByParts', functionByParts);
parser.set('sumFromAtoB', sumFromAtoB);
parser.set('productFromAtoB', productFromAtoB);
parser.set('derivative', derivative);
let needRestartTime = false;
let lastRestartTimeStamp = 0;

deleteInputButton.addEventListener('click', () => {
    functionEditorHeader.removeChild(inputDiv);
    if (functionEditorHeader.children.length === 0) {
        addFunction();
    }
});

const mj = function (tex) {
    return MathJax.tex2svg(tex, {em: 16, ex: 6, display: true});
};

const updateFunction = (inputDiv, value) => {
    needRestartTime = true;
    try {
        parser.evaluate(value);
    } catch (e) {
        console.log('Invalid function');
        return;
    }
    const node = math.parse(value);
    const mathjaxPreview = inputDiv.querySelector('.mathjax-preview');
    try {
        const latex = node ? node.toTex({parenthesis: parenthesis, implicit: implicit, handler: customLaTeX}) : '';
        MathJax.typesetClear();
        mathjaxPreview.innerHTML = '';
        mathjaxPreview.appendChild(mj(latex));
    } catch (err) {}
};

functionInput.addEventListener('input', () => {
    updateFunction(inputDiv, functionInput.value);
});

const toggleVisibility = () => {
    if (functionEditor.classList.contains('visible')) {
        functionEditor.classList.remove('visible');
    } else {
        functionEditor.classList.add('visible');
    }
};

const addFunction = () => {
    const functionInput = document.createElement('input');
    functionInput.type = 'text';
    functionInput.placeholder = 'Enter a function';
    functionInput.classList.add('function-input');
    functionInput.classList.add('roboto-regular');
    const deleteInputButton = document.createElement('button');
    const icon = document.createElement('i');
    icon.classList.add('fas');
    icon.classList.add('fa-trash');
    deleteInputButton.appendChild(icon);
    deleteInputButton.classList.add('delete-input-button');
    const inputDiv = document.createElement('div');
    inputDiv.classList.add('input-div');
    const input = document.createElement('div');
    input.classList.add('input');
    input.appendChild(functionInput);
    input.appendChild(deleteInputButton);
    inputDiv.appendChild(input);
    const mathjaxPreview = document.createElement('div');
    mathjaxPreview.classList.add('mathjax-preview');
    inputDiv.appendChild(mathjaxPreview);
    functionInput.addEventListener('input', () => {
        updateFunction(inputDiv, functionInput.value);
    });
    deleteInputButton.addEventListener('click', () => {
        functionEditorHeader.removeChild(inputDiv);
        if (functionEditorHeader.children.length === 0) {
            addFunction();
        }
    });
    functionEditorHeader.appendChild(inputDiv);
    return inputDiv;
};

const draw = (timeStamp) => {
    const rgbaFunc = parser.get('RGBA');
    if (!rgbaFunc) {
        requestAnimationFrame(draw);
        return;
    }
    if (needRestartTime) {
        lastRestartTimeStamp = timeStamp;
        needRestartTime = false;
    }
    const t = (timeStamp - lastRestartTimeStamp) / 1000;
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let rgba;
            try {
                rgba = rgbaFunc(x, y, t)._data;
            } catch (e) {
                console.log('Error evaluating function');
                requestAnimationFrame(draw);
                return;
            }
            if (!rgba || !Array.isArray(rgba) || rgba.length !== 4) {
                console.log('Invalid return value');
                requestAnimationFrame(draw);
                return;
            }
            imageData.data[(y * canvas.width + x) * 4] = rgba[0];
            imageData.data[(y * canvas.width + x) * 4 + 1] = rgba[1];
            imageData.data[(y * canvas.width + x) * 4 + 2] = rgba[2];
            imageData.data[(y * canvas.width + x) * 4 + 3] = rgba[3];
        }
    }
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(draw);
};

updateFunction(inputDiv, functionInput.value);
requestAnimationFrame(draw);

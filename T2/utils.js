function generateColor() {
    let colorPalette = [
        "rgb(0,255,100)",
        "rgb(255,0,255)",
        "rgb(255,255, 0)",
        "rgb(255,0,0)",
    ];
    return colorPalette[Math.floor(Math.random() * colorPalette.length)];
}

function getColor(num) {
    let colorPalette = new Map([
        [2, "rgb(96,96,96)"],
        [4, "rgb(4,173,72)"],
        [5, "rgb(166,4,166)"],
        [6, "rgb(255,183,0)"],
        [7, "rgb(255,0,0)"],
        [8, "rgb(0,112,255)"],
        [9, "rgb(255,106,0)"],
        [10, "rgb(0,255,225)"],
        [11, "rgb(255,255,255)"]
    ]);

    return colorPalette.get(num)
}



function getColumnsRows(matrix) {
    const numRows = matrix.length;

    if (numRows === 0) {
        return { row: 0, columns: 0 };
    }

    const numCols = matrix[0].length;

    return { row: numRows, columns: numCols };
}

function getColumns(matrix){
    return matrix[0].length;
}

function getRows(matrix){
    return matrix.length;
}

function getTotalTails(matrix) {
    let contador = 0;

    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] !== 0) {
                contador++;
            }
        }
    }

    return contador;
}

function lerArquivoJSON(caminho, nivel, callback) {
    fetch(caminho)
        .then(response => response.json())
        .then(data => {
            callback(data[nivel - 1].matrix);
        })
        .catch(error => {
            console.error('Ocorreu um erro:', error);
        });
}


function obterMatrizPeloNivel(nivelDesejado) {

    let jsonData = [];

    lerArquivoJSON('matrixLevel.json', (data) => {
        jsonData = data;
        console.log(j);
    });

    callback(jsonData);
}

export {generateColor, getColumnsRows, obterMatrizPeloNivel, lerArquivoJSON, getColumns, getRows, getColor, getTotalTails}
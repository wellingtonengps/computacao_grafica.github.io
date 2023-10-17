function generateColor() {
    let colorPalette = [
        "rgb(0,255,100)",
        "rgb(255,0,255)",
        "rgb(255,255, 0)",
        "rgb(255,0,0)",
    ];
    return colorPalette[Math.floor(Math.random() * colorPalette.length)];
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

// Exemplo de uso:



function obterMatrizPeloNivel(nivelDesejado) {

    let jsonData = [];

    lerArquivoJSON('matrixLevel.json', (data) => {
        jsonData = data;
        console.log(j);
    });

    callback(jsonData);
}

export {generateColor, getColumnsRows, obterMatrizPeloNivel, lerArquivoJSON, getColumns, getRows}
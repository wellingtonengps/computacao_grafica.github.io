function generateColor() {
    let colorPalette = [
        "rgb(0,255,100)",
        "rgb(255,0,255)",
        "rgb(255,255, 0)",
        "rgb(255,0,0)",
    ];
    return colorPalette[Math.floor(Math.random() * colorPalette.length)];
}

export {generateColor}

function getColumnsRows(matrix) {
    const numRows = matrix.length;

    if (numRows === 0) {
        return { row: 0, columns: 0 };
    }

    const numCols = matrix[0].length;

    return { row: numRows, columns: numCols };
}


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
        [4, "rgb(128, 208, 16)"],
        [5, "rgb(252, 116, 180)"],
        [6, "rgb(248, 150, 55)"],
        [7, "rgb(214, 39, 0)"],
        [8, "rgb(0, 112, 236)"],
        //[9, "rgb(255,106,0)"],
        //[10, "rgb(0,255,225)"],
        [11, "rgb(255,255,255)"]
    ]);

    return colorPalette.get(num)
}


function getColumns(matrix){
    return matrix[0].length;
}

function getRows(matrix){
    return matrix.length;
}

function getTotalTails(matrix) {
    let count = 0;

    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] !== 0) {
                count++;
            }
        }
    }

    return count;
}

function readLevel(path, level, callback) {
    fetch(path)
        .then(response => response.json())
        .then(data => {
            callback(data[level - 1].matrix);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


export {generateColor, readLevel, getColumns, getRows, getColor, getTotalTails}
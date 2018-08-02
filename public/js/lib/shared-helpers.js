function parseCoordToString(i, j) {
    return i.toString() + "-" + j;
}

function parseStringToPoint(name) {
    var strArray = name.split("-");
    var i = parseInt(strArray[0]);
    var j = parseInt(strArray[1]);
    return {
        i: i,
        j: j
    }
}

function parsePointToString(point) {
    var str = "";
    str += point.i;
    str += "-";
    str += point.j;
    return str;
}

/*
 *
 */
/* utility object contains methods */
var utils = {
    /* add a class to an element */
    addClass: function(classname, element) {
        var cn = element.className;
        //test for existence
        if (cn.indexOf(classname) != -1) {
            return;
        }
        //add a space if the element already has class
        if (cn != '') {
            classname = ' ' + classname;
        }
        element.className = cn + classname;
    },
    /* remove a class from an element */
    removeClass: function(classname, element) {
        var cn = element.className;
        var rxp = new RegExp("\\s?\\b" + classname + "\\b", "g");
        cn = cn.replace(rxp, '');
        element.className = cn;
    },
    /* does a element contain a specific class */
    hasClass: function(classname, element) {
        return new RegExp(' ' + classname + ' ').test(' ' + element.className + ' ');
    },
    /* random number inclusive of low and upper range */
    intRandom: function(low, up) {
        return Math.floor(Math.random() * (up - low) + low);
    },
    /* distance between two points */
    findDistance: function(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    },
    sleep: function(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    }
};
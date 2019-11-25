/*
 *
 */

var bigPulseState = {
    colors: ['#fd2700', '#64d700', 'fdfb00', '#8314fd', '#b8009c', '#fa60fd', '#fa0000', '#e64200', '#0093f0', '#fda0c0'],
    currentColor: '#0093f0',
    addCount: 0,
    lastAverage: 0,
    circles: [],
    initialized: false,
    init: function() {
        for (var z = 0; z < 10; z++) {
            bigPulseState.circles[z] = {
                c: '',
                r: 0,
                a: 0
            }
        }
        bigPulseState.currentColor = bigPulseState.colors[utils.intRandom(0, bigPulseState.colors.length)];
        bigPulseState.initialized = true;
    }
};

var connectedParticlesState = {
    canvasWidth: 0,
    canvasHeight: 0,
    fftSize: 512,
    particles: [],
    particleNum: 128,
    colors: ['#F35D4F', '#f36849', '#C0D988', '#6DDAF1', '#F1E85B', '706DF3'],

    initialized: false,
    divisor: function() {
        var rc = 4;
        if ((connectedParticlesState.canvasHeight < 550) || (connectedParticlesState.canvasWidth < 801)) {
            rc = 8;
        }
        if ((connectedParticlesState.canvasHeight < 351) || (connectedParticlesState.canvasWidth < 501)) {
            rc = 16;
        }
        if ((connectedParticlesState.canvasHeight < 251) || (connectedParticlesState.canvasWidth < 301)) {
            rc = 32;
        }

        return rc;
    },
    init: function(width, height) {

        // internal Object Particle.
        function Particle() {
            this.x = Math.round(Math.random() * connectedParticlesState.canvasWidth);
            this.y = Math.round(Math.random() * connectedParticlesState.canvasHeight);
            this.rad = Math.round(Math.random() * 10) + 15;
            this.rgba = connectedParticlesState.colors[utils.intRandom(0, connectedParticlesState.colors.length)];
            this.vx = Math.round(Math.random() * 3) - 1.5;
            this.vy = Math.round(Math.random() * 3) - 1.5;
        }

        connectedParticlesState.particles.length = 0;
        connectedParticlesState.canvasWidth = width || 1000;
        connectedParticlesState.canvasHeight = height || 350;
        var particleDivisor = connectedParticlesState.divisor();
        connectedParticlesState.particleNum = connectedParticlesState.fftSize / particleDivisor;
        for (var i = 0; i < connectedParticlesState.particleNum; i++) {
            connectedParticlesState.particles.push(new Particle());
        }
        //console.log('connectedParticlesState.init(): fftSize=['+connectedParticlesState.fftSize+'], divisor=['+particleDivisor+'] particles.length=['+connectedParticlesState.particles.length+']');

        connectedParticlesState.initialized = true;
    }

};

var peakedBarsState = {
    barSize: 64,
    bars: [],
    dots: [],
    width: 0,
    height: 0,
    /*color: //['157, 193, 243', '245, 232, 153', '226, 51, 110' ], */
    colors: ['0,47,229', '5,223,230', '11,231,70', '157, 193, 243', '245, 232, 153', '226, 51, 110', '206,233,20', '233,180,23', '234,102,26', '241,90,17', '248,51,9'],
    initialized: false,

    init: function(width, height) {
        peakedBarsState.width = width;
        peakedBarsState.height = height;
        peakedBarsState.bars.length = 0; // empty the array
        peakedBarsState.dots.length = 0; // empty the array
        var barWidth = Math.floor(width / peakedBarsState.barSize);
        for (var i = 0; i < peakedBarsState.barSize; i++) {
            peakedBarsState.dots[i] = 0;
            peakedBarsState.bars[i] = {
                x: (i * barWidth),
                w: barWidth,
                h: 0,
                color: peakedBarsState.colors[Math.floor(Math.random() * peakedBarsState.colors.length)]
            }
        }
        peakedBarsState.initialized = true;
    }
};

var radialBarsState = {
    arcSize: 18,
    arcs: [],
    dots: [],
    colors: ['5,223,230', '0,47,229', '234,102,26', '11,231,70', '248,51,9', '157, 193, 243', '245, 232, 153', '226, 51, 110', '206,233,20', '233,180,23', '241,90,17'],
    initialized: false,

    init: function(width, height) {
        var arcCount = 60;
        radialBarsState.width = width;
        radialBarsState.height = height;
        radialBarsState.arcs.length = 0; // empty the array
        radialBarsState.dots.length = 0; // empty the array
        for (var i = 0; i < arcCount; i++) {
            radialBarsState.dots[i] = 0;
            radialBarsState.arcs[i] = {
                startAngle: 0,
                endAngle: 0,
                h: 0,
                color: radialBarsState.colors[utils.intRandom(0, i * radialBarsState.colors.length) % radialBarsState.colors.length]
            }
        }

        radialBarsState.initialized = true;
    },
    randomizeColors: function() {
        var arc;
        for (var i = 0; i < radialBarsState.arcs.length; i++) {
            arc = radialBarsState.arcs[i];
            arc.color = radialBarsState.colors[utils.intRandom(0, i * radialBarsState.colors.length) % radialBarsState.colors.length];
        }
    }
};

var lifeLineState = {
    lastValue: [],
    separate: [],
    separateTimer: 0,
    shadowBlur: 0,
    average: 0,
    color: {},
    choice: 0,
    initialized: false,

    init: function() {
        for (var i = 0; i < 256; i++) {
            lifeLineState.lastValue[i] = 0;
        }
        lifeLineState.color = {
            r: 100,
            g: 100,
            b: 100,
            rS: utils.intRandom(1, 3),
            gS: utils.intRandom(1, 3),
            bS: utils.intRandom(1, 3),
            rD: 1,
            gD: 1,
            bD: 1
        };
        lifeLineState.initialized = true;
    },
    scaleFactor: function(height) {
        var rc = 80; //
        if (height > 360) {
            var baseThreshold = rc; // @ height 360
            var percentage = (height / baseThreshold) / 100;
            var ratio = parseInt(height * percentage);
            rc = (baseThreshold - ratio) + 10;
        }
        return rc;
    },

    changeColor: function() {
        lifeLineState.choice = utils.intRandom(0, 9);
        if (lifeLineState.choice < 3) {
            lifeLineState.color.r = lifeLineState.color.r + lifeLineState.color.rS * lifeLineState.color.rD;
            if (lifeLineState.color.r > 225) {
                lifeLineState.color.rD = -1;
            } else if (lifeLineState.color.r < 100) {
                lifeLineState.color.rD = 1;
            }
        } else if (lifeLineState.choice < 6) {
            lifeLineState.color.g = lifeLineState.color.g + lifeLineState.color.gS * lifeLineState.color.gD;
            if (lifeLineState.color.g > 225) {
                lifeLineState.color.gD = -1;
            } else if (lifeLineState.color.g < 100) {
                lifeLineState.color.gD = 1;
            }
        } else {
            lifeLineState.color.b = lifeLineState.color.b + lifeLineState.color.bS * lifeLineState.color.bD;
            if (lifeLineState.color.b > 225) {
                lifeLineState.color.bD = -1;
            } else if (lifeLineState.color.b < 100) {
                lifeLineState.color.bD = 1;
            }
        }
    }
};

var triangleState = {
    beginAngle: 0,
    stars: new Array(512),
    MAX_DEPTH: 32,
    initialized: false,


    init: function() {

        for (var i = 0; i < triangleState.stars.length; i++) {
            triangleState.stars[i] = {
                x: utils.intRandom(-25, 25),
                y: utils.intRandom(-25, 25),
                z: utils.intRandom(1, triangleState.MAX_DEPTH)
            }
        }
        triangleState.initialized = true;
    }

};

var sinWaveState = {
    sinAngle: [],
    line: [],
    len: 512 / 2 - 20, // smallest fft size
    color: 0,
    initialized: false,

    sinWaveColor: function(context, width, height) {
        if (!context) { return; }
        sinWaveState.color = context.createLinearGradient(0, 0, 0, height);
        sinWaveState.color.addColorStop(0.1, '#ff5614');
        sinWaveState.color.addColorStop(0.3, '#fffa47');
        sinWaveState.color.addColorStop(0.4, '#f93b04');
        sinWaveState.color.addColorStop(0.5, '#f93b04');
        sinWaveState.color.addColorStop(0.6, '#fffa47');
        sinWaveState.color.addColorStop(0.7, '#f93b04');
        sinWaveState.color.addColorStop(0.75, '#f01800');
        sinWaveState.color.addColorStop(0.8, '#fb7220');
        sinWaveState.color.addColorStop(0.9, '#f93b04');
        sinWaveState.color.addColorStop(1, '#f01800');
    },
    init: function(context, width, height) {
        var angleGap = Math.random() * 0.01 + 0.05,
            angle = 0;

        sinWaveState.sinAngle.length = 0;
        sinWaveState.sinAngle[0] = Math.sin(angle);
        for (var i = 1; i < sinWaveState.len; i++) {
            sinWaveState.sinAngle[i] = Math.sin(angle);
            if ((sinWaveState.sinAngle[i - 1] > 0 && sinWaveState.sinAngle[i] < 0) ||
                (sinWaveState.sinAngle[i - 1] < 0 && sinWaveState.sinAngle[i] > 0)) {
                angleGap = Math.random() * 0.01 + 0.05;
            }
            angle += angleGap;
        }
        sinWaveState.sinWaveColor(context, width, height);
        sinWaveState.initialized = true;
    }
};
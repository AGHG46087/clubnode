/*
 *
 */

var mp3player = {
    canvas1: document.getElementById('fft1'),
    canvas2: document.getElementById('fft2'),
    ctx1: null,
    ctx2: null,
    currTime: 0,
    animationFrame: null,
    audioCtx: null,
    analyser: null,
    source: null,
    fftSize: 2048,
    barGradient: null, // init(), drawPulse, drawLifeLine, drawSinWave, drawSymmetricCentered
    rgbGradient: null, // init(), drawSymmetricCentered,
    hotGradient: null, // init(), drawSymmetricCentered
    dotGradient: null, // init(), drawDots, drawRadialBars, drawSymmetricCentered
    pulseGradient: null, // init(), drawRadialBars, drawBigPulse
    canvasHeight: 0,
    canvasWidth: 0,
    audioPlaying: false,
    patterns: [],
    patternIndex: 3,
    patternInterval: 0,
    patternSquenceMillis: 10000,
    connection: null,
    PATTERN_CYCLE_ALL: true,
    PATTERN_START_INDEX: 0, // max is patterns.length -1
    musicList: null,
    currMusicListIdx: -1,

    /* pause: As the name says: pause the audio and animations */
    pause: function() {
        console.log("Song Paused...");
        audio.pause();
        mp3player.audioPlaying = false;
        window.cancelAnimationFrame(mp3player.animationFrame);

        clearInterval(mp3player.patternInterval);
    },
    /* start: kicks off the whole animations and audio */
    start: function() {
        console.log("Song start...");
        // Make sure we have a Analyser first
        if (mp3player.analyser == null) {
            console.log('%cmp3player.start(): There is no analyser setup - select a new song.', "color:yellow; background:red; font-size: 16px");
            return;
        }
        document.getElementById('loadMsg').innerHTML = '&nbsp;';

        audio.play();
        mp3player.audioPlaying = true;
        mp3player.animationFrameCallback();

        // Initial pattern index and setup the pattern changer behavior
        mp3player.patternIndex = mp3player.PATTERN_START_INDEX;
        mp3player.patternInterval = setInterval(function() {
            mp3player.patternIndex += (mp3player.PATTERN_CYCLE_ALL) ? 1 : 0;
            if (mp3player.patternIndex >= mp3player.patterns.length) {
                mp3player.patternIndex = mp3player.PATTERN_START_INDEX;
            }
            mp3player.toggleCanvasOrientation();
        }, mp3player.patternSquenceMillis);
    },
    /* loadMp3File: When a mp3 is being loaded this will load a audio file, setup event listeners, and connect analyser */
    loadMp3File: function(url) {
        console.log("Loading mp3 song: " + url);
        document.getElementById('loadMsg').innerHTML = 'loading ' + url + ' ...';

        if (window.audio && mp3player.audioPlaying) {
            mp3player.resetLifeUniverseAndEverything();
        }

        window.audio = new Audio();
        window.audio.id = 'audio-player';
        window.audio.controls = true;
        window.audio.loop = false;
        window.audio.autoplay = false;
        window.audio.type = 'audio/mpeg3';
        window.audio.auto
        window.audio.load();
        window.audio.setAttribute('src', url);

        var el = document.getElementById('visualizer');
        el.appendChild(audio);
        mp3player.setupAudioListeners();

        if (!mp3player.audioCtx) {
            mp3player.audioCtx = new AudioContext();
        }
        mp3player.analyser = mp3player.audioCtx.createAnalyser();
        // Setting of the FFT size must be power of 2,  set the appropriate value to mp3player.fftSize
        if ((512 <= mp3player.fftSize && mp3player.fftSize < 2048) && ((n & (n - 1)) == 0)) {
            mp3player.analyser.fftSize = mp3player.fftSize;
        }

        mp3player.source = mp3player.audioCtx.createMediaElementSource(audio);
        mp3player.source.connect(mp3player.analyser);
        mp3player.analyser.connect(mp3player.audioCtx.destination);

        mp3player.audioPlaying = false;

        mp3player.start();
    },
    /* resetLifeUniverseAndEverything: Everything is stopped for a reason, reset all variables to inital state */
    resetLifeUniverseAndEverything: function() {
        // Stop the Audio player and remove listeners
        console.log("Song Stopped and Removed...");
        window.audio.pause();
        window.audio.removeEventListener('timeupdate', this.timeUpdateHandler);
        window.audio.removeEventListener('ended', this.audioEndedHandler);
        window.audio.remove();

        mp3player.audioPlaying = false;
        mp3player.audioCtx = null;

        // Clear the Animation Frame and pattern switching interval
        window.cancelAnimationFrame(mp3player.animationFrame);
        clearInterval(mp3player.patternInterval);


        // Clear the Canvas elements
        mp3player.ctx1.clearRect(0, 0, mp3player.canvasWidth, mp3player.canvasHeight);
        mp3player.ctx2.clearRect(0, 0, mp3player.canvasWidth, mp3player.canvasHeight);

        mp3player.patternIndex = mp3player.PATTERN_START_INDEX;
        mp3player.toggleCanvasOrientation();

        // Remove the existing Audio element from the DOM if it still exits, audio.remove() should have removed it.
        var audioEl = document.getElementById('audio-player');
        if (audioEl) {
            var parent = audioEl.parentElement;
            if (parent) { parent.removeChild(audioEl); }
        }
        // window.audio = null;
        var currentTimeNode = document.getElementById('current-time');
        if (currentTimeNode) { currentTimeNode.innerHTML = '&nbsp;'; }
        utils.sleep(1000);

    },
    /* animationFrameCallback:  This is the function that is called 60fps pulls fft data, invokes methods to send data and draw */
    animationFrameCallback: function() {
        mp3player.animationFrame = window.requestAnimationFrame(mp3player.animationFrameCallback); // CALLBACK AGAIN

        var freqByteData = new Uint8Array(mp3player.analyser.frequencyBinCount);
        mp3player.analyser.getByteFrequencyData(freqByteData);

        // draw on the canvas, save state, clear rectangle, draw, restore state.
        mp3player.ctx1.globalCompositeOperation = 'source-over';
        mp3player.ctx1.save();
        mp3player.ctx1.clearRect(0, 0, mp3player.canvasWidth, mp3player.canvasHeight);
        mp3player.ctx2.clearRect(0, 0, mp3player.canvasWidth, mp3player.canvasHeight);
        mp3player.patterns[mp3player.patternIndex](freqByteData); // here is the drawing method
        mp3player.ctx1.restore();

    },

    /// LIST of Renderers
    /* 0. drawCrossBars: draws visualizer as two crossing images */
    drawCrossBars: function(data) {
        var spacer_width = 10;
        var bar_width = 5;
        var offset = 5;
        var numBars = Math.round(mp3player.canvasWidth / spacer_width);

        mp3player.ctx1.fillStyle = '#F6D565';
        mp3player.ctx1.lineCap = 'round';

        mp3player.ctx2.fillStyle = '#3A5E8C'; //mp3player.barGradient;
        mp3player.ctx2.lineCap = 'round';

        for (var i = 0; i < numBars; i++) {
            var value = data[i + offset];
            // Changed from Both Left to Right, to more symmetric. simply (numbars-i) in the ctx2.fillrect()
            mp3player.ctx1.fillRect(i * spacer_width, mp3player.canvasHeight, bar_width, -value);
            mp3player.ctx2.fillRect((numBars - i) * spacer_width, mp3player.canvasHeight, bar_width, -value);
        }

    },
    /* 1. drawSymmetricCentered: draws visualizer as starting from center and draw out to boundries */
    drawSymmetricCentered: function(data) {
        var gradients = [mp3player.barGradient, mp3player.rgbGradient, mp3player.hotGradient, mp3player.dotGradient];
        var color = gradients[parseInt(mp3player.currTime) % gradients.length];
        var centerX = mp3player.canvasWidth / 2;
        var offset = (mp3player.canvasHeight / 2) * 0.25;
        var value = 0;

        mp3player.ctx1.fillStyle = color;

        var datalen = parseInt(data.length / 2, 10);
        for (var i = 0; i < datalen; i++) {
            value = data[i] + offset;
            mp3player.ctx1.fillRect(centerX - (i * 5), mp3player.canvasHeight - value, 3, mp3player.canvasHeight);
            mp3player.ctx1.fillRect(centerX + (i * 5), mp3player.canvasHeight - value, 3, mp3player.canvasHeight);
        }

    },
    /* 2. drawDots: Draws the visualizer as dots */
    drawDots: function(data) {
        var radius = 4;
        var value = 0;
        var offset = (mp3player.canvasHeight / 2) * 0.25;

        for (var i = 0; i < data.length; i++) {
            value = data[i] + offset;
            mp3player.ctx1.beginPath();
            mp3player.ctx1.arc(i * 12, mp3player.canvasHeight - value, radius, 0, 2 * Math.PI, false);
            mp3player.ctx1.fillStyle = mp3player.dotGradient;
            mp3player.ctx1.fill();
            mp3player.ctx1.lineWidth = 1;
            mp3player.ctx1.strokeStyle = '#003300';
            mp3player.ctx1.stroke();
        }
    },
    /* 3. drawInvertedBars: draws visualizer as two sets inverted on each other  */
    drawInvertedBars: function(data) {
        var spacer_width = 10;
        var bar_width = 5;
        var indexOffset = 100;
        var offset = (mp3player.canvasHeight / 3) * 0.25;
        var numBars = Math.round(mp3player.canvasWidth / spacer_width);


        var value = 0;
        for (var i = 0; i < numBars; i++) {
            value = data[i + indexOffset] + offset;
            mp3player.ctx1.fillStyle = '#F6D565';
            mp3player.ctx1.lineCap = 'round';
            mp3player.ctx1.fillRect(i * spacer_width, mp3player.canvasHeight, bar_width, -value);
            mp3player.ctx1.fillStyle = '#3A5E8C';
            mp3player.ctx1.lineCap = 'round';
            mp3player.ctx1.fillRect(i * spacer_width, 0, bar_width, value);
        }
    },
    /* 4. drawRadialBars: Draws visualizer as bars radiating from the center of the canvas */
    drawRadialBars: function(data) {
        var centerX = parseInt(mp3player.canvasWidth / 2, 10);
        var centerY = parseInt(mp3player.canvasHeight / 2, 10);
        var radius = 10;
        var value = 0;
        var offset = (mp3player.canvasHeight / 2) * 0.25;

        mp3player.ctx1.beginPath();
        mp3player.ctx1.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        mp3player.ctx1.fillStyle = mp3player.pulseGradient;
        mp3player.ctx1.fill();

        var radians, innerX, outerX, innerY, outerY;
        for (var i = 0; i < data.length; i++) {
            value = data[i] + offset;
            radians = i * (2 * Math.PI / 180);
            innerX = centerX + radius * Math.cos(radians);
            innerY = centerY + radius * Math.sin(radians);
            outerX = centerX + value * Math.cos(radians);
            outerY = centerY + value * Math.sin(radians) - (value * 0.10);

            mp3player.ctx1.beginPath();
            mp3player.ctx1.moveTo(innerX, innerY);
            mp3player.ctx1.lineTo(outerX, outerY);
            mp3player.ctx1.strokeStyle = mp3player.dotGradient;
            mp3player.ctx1.lineWidth = (i % 5);
            mp3player.ctx1.stroke();

        }
    },
    /* 5. drawBigPulse: Draws the visualizer as a pulse that emits radials */
    drawBigPulse: function(data) {
        var stateVars = bigPulseState;
        var i, len, maxWidth;
        var circleEnd = 2 * Math.PI,
            speed = 20,
            average, total = 0,
            center = {
                x: Math.floor(mp3player.canvasWidth / 2),
                y: Math.floor(mp3player.canvasHeight / 2)
            };


        for (var t = 0, len_t = data.length; t < len_t; t += 10) {
            total += data[t];
        }
        average = total / len_t * 10;


        mp3player.ctx1.fillStyle = mp3player.pulseGradient;
        mp3player.ctx1.beginPath();
        mp3player.ctx1.arc(center.x, center.y, average, 0, circleEnd, true);
        mp3player.ctx1.closePath();
        mp3player.ctx1.fill();

        mp3player.ctx1.lineWidth = 4;
        for (i = 0, len = stateVars.circles.length, maxWidth = mp3player.canvasWidth / 1.5; i < len; i++) {
            var c = stateVars.circles[i];
            if (c.a == 0) {
                continue;
            }
            mp3player.ctx1.strokeStyle = c.c;
            mp3player.ctx1.beginPath();
            mp3player.ctx1.arc(center.x, center.y, c.r, 0, circleEnd, true);
            mp3player.ctx1.closePath();
            mp3player.ctx1.stroke();
            c.r += speed;
            if (c.r > maxWidth) {
                c.a = 0;
            }
        }
        if (average < stateVars.lastAvarage) {
            if (stateVars.addCount > 2) {
                for (i = 0, len = stateVars.circles.length; i < len; i++) {
                    if (stateVars.circles[i].a == 0) {
                        stateVars.circles[i].c = stateVars.currentColor;
                        stateVars.circles[i].r = average;
                        stateVars.circles[i].a = 1;
                        break;
                    }
                }
            } else if (stateVars.addCount > 0) {
                stateVars.currentColor = stateVars.colors[utils.intRandom(0, stateVars.colors.length)];
            }
            stateVars.addCount = 0;
        } else {
            stateVars.addCount++;
        }
        stateVars.lastAvarage = average;
    },
    /* 6. drawConnectedParticles: draws visualizer as a particles with connected limbs of related particles */
    drawConnectedParticles: function(data) {
        var stateVars = connectedParticlesState;
        var p, p2, i, j, len, factor, total, avg;
        len = data.length / 2; //256; //data.length / 2;
        mp3player.ctx1.globalCompositeOperation = 'lighter';
        mp3player.ctx1.linewidth = 0.5;

        for (i = 0, total = 0; i < len; i++) {
            total += data[i];
        }
        avg = total / len;
        var partLen = stateVars.particles.length;

        for (i = 0; i < partLen; i++) {
            p = stateVars.particles[i];
            factor = 1;
            for (j = 0; j < partLen; j++) {
                p2 = stateVars.particles[j];
                if (p.rgba == p2.rgba && utils.findDistance(p, p2) < avg) {
                    mp3player.ctx1.strokeStyle = p.rgba;
                    mp3player.ctx1.beginPath();
                    mp3player.ctx1.moveTo(p.x, p.y);
                    mp3player.ctx1.lineTo(p2.x, p2.y);
                    mp3player.ctx1.stroke();
                    factor += 0.6;
                }
            }

            mp3player.ctx1.fillStyle = p.rgba;
            mp3player.ctx1.strokeStyle = p.rgba;

            mp3player.ctx1.beginPath();
            mp3player.ctx1.arc(p.x, p.y, p.rad * factor, 0, Math.PI * 2, true);
            mp3player.ctx1.fill();
            mp3player.ctx1.closePath();

            mp3player.ctx1.beginPath();
            mp3player.ctx1.arc(p.x, p.y, (p.rad + 5) * factor, 0, Math.PI * 2, true);
            mp3player.ctx1.stroke();
            mp3player.ctx1.closePath();

            p.x += p.vx;
            p.y += p.vy;

            if (p.x > mp3player.canvasWidth + p.rad) p.x = 0;
            if (p.x < -p.rad) p.x = mp3player.canvasWidth;
            if (p.y > mp3player.canvasHeight + p.rad) p.y = 0;
            if (p.y < -p.rad) p.y = mp3player.canvasHeight;
        }
    },
    /* 7. drawPeakedBars: draws visualizer as a bars with peaked decaying points */
    drawPeakedBars: function(data) {
        var stateVars = peakedBarsState;
        var total = 0,
            b, iData, barHeight;
        var offset = (mp3player.canvasHeight > 400) ? (mp3player.canvasHeight / 2) * 0.25 : 0;


        for (var i = 0; i < stateVars.barSize; i++) {
            iData = i + 128;
            b = stateVars.bars[i];
            if (b.h == 0) {
                b.h = data[iData] + offset;
            } else {
                if (b.h < data[iData]) {
                    b.h += Math.floor((data[iData] - b.h) / 2);
                } else {
                    b.h -= Math.floor((b.h - data[iData]) / 1.2);
                }
            }
            b.h *= 1.7;
            barHeight = mp3player.canvasHeight / 3;
            mp3player.ctx1.fillStyle = 'rgba(' + b.color + ', 0.8)';
            mp3player.ctx1.fillRect(b.x, mp3player.canvasHeight - b.h, b.w, barHeight);

            stateVars.dots[i] = (stateVars.dots[i] < b.h) ? b.h : stateVars.dots[i] - 1;

            mp3player.ctx1.fillStyle = mp3player.ctx1.fillStyle.replace('0.8)', '0.5)');
            mp3player.ctx1.fillRect(b.x, mp3player.canvasHeight - stateVars.dots[i] - b.w, b.w, b.w);
            total += data[iData];
        }
    },
    /* 8. drawLifeLine: draws visualizer that appears like a EKG life line */
    drawLifeLine: function(data) {
        var gradients = [mp3player.barGradient, mp3player.rgbGradient, mp3player.hotGradient];
        var color = gradients[parseInt(mp3player.currTime) % gradients.length]; // mp3player.rgbGradient; //mp3player.hotGradient;

        var stateVars = lifeLineState;
        var width = mp3player.canvasWidth / 128,
            x = 0,
            y = 0,
            i, j,
            direction = 1,
            middle = mp3player.canvasHeight / 2,
            separateLength = 0,
            separateNum = 0,
            total = 0,
            lastAverage = stateVars.average;

        stateVars.changeColor();
        var r = stateVars.color.r,
            g = stateVars.color.g,
            b = stateVars.color.b;

        mp3player.ctx1.shadowColor = 'rgba(' + (r + 70) + ', ' + (g + 70) + ', ' + (b + 70) + ', 1)';
        mp3player.ctx1.shadowBlur = stateVars.shadowBlur;
        mp3player.ctx1.strokeStyle = color; //mp3player.barGradient;
        //mp3player.ctx1.strokeStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', 1)';
        mp3player.ctx1.lineWidth = 5;
        mp3player.ctx1.lineJoin = 'miter';
        mp3player.ctx1.miterLimit = 100;
        mp3player.ctx1.beginPath();
        mp3player.ctx1.moveTo(0, middle);
        if (stateVars.separateTimer == 0) {
            stateVars.separateTimer = Math.floor(Math.random() * 50) + 20;
            for (i = 0; i < 128; i++) {
                stateVars.separate[i] = 0;
            }
            separateNum = Math.floor(Math.random() * 15);
            for (i = 0; i < separateNum; i++) {
                separateLength = Math.floor(Math.random() * 15);
                var temp = Math.floor(Math.random() * 128);
                stateVars.separate[temp] = 1;
                for (j = 1; j < separateLength; j++) {
                    stateVars.separate[temp + j] = 1;
                }
            }
        } else {
            stateVars.separateTimer--;
        }
        var scaleFactor = stateVars.scaleFactor(mp3player.canvasHeight); // 80;

        for (i = 0; i < 128; i++) {
            y = data[i] - (100 - i) * 0.5; // NERD
            y = (y - scaleFactor) < 0 ? 0 : y - scaleFactor;
            if (y > middle) {
                y = middle;
            }
            if (stateVars.separate[i] == 1) {
                stateVars.lastValue[i] -= 20;
                if (stateVars.lastValue[i] < 0) {
                    stateVars.lastValue[i] = 0;
                }
                y = stateVars.lastValue[i];
            } else {
                if (y - stateVars.lastValue[i] > 20) {
                    stateVars.lastValue[i] += 20;
                    y = stateVars.lastValue[i];
                } else {
                    stateVars.lastValue[i] = y;
                }
            }
            y = y * direction + middle;

            mp3player.ctx1.lineTo(x, y);
            total += y;
            direction = -direction;
            x = x + width;
        }
        stateVars.average = total / 128;
        if (lastAverage > stateVars.average) {
            stateVars.shadowBlur--;
        } else {
            stateVars.shadowBlur++;
        }
        mp3player.ctx1.lineTo(mp3player.canvasWidth, middle);
        mp3player.ctx1.stroke();
    },
    /* 9. drawTriangles: draws visualizer as rotating triangles */
    drawTriangles: function(data) {
        var stateVars = triangleState;
        var angle = stateVars.beginAngle,
            cx = mp3player.canvasWidth / 2,
            cy = mp3player.canvasHeight / 2,
            total = 0,
            k, px, py, size, shade,
            speedFactor = (data.length >= 1024) ? 32 : 16,
            len = data.length / speedFactor,
            twoPI = 2 * Math.PI,
            angleGap = twoPI / 3,
            color = 'rgba(186, 135, 72, 0.5)';

        // draw star field
        for (var j = 0; j < stateVars.stars.length; j++) {
            stateVars.stars[j].z -= 0.01;
            if (stateVars.stars[j].z <= 0) {
                stateVars.stars[j].x = utils.intRandom(-25, 25);
                stateVars.stars[j].y = utils.intRandom(-25, 25);
                stateVars.stars[j].z = stateVars.MAX_DEPTH;
            }

            k = 128 / stateVars.stars[j].z;
            px = stateVars.stars[j].x * k + cx;
            py = stateVars.stars[j].y * k + cy;

            if (px >= 0 && px <= mp3player.canvasWidth && py >= 0 && py <= mp3player.canvasHeight) {
                size = (1 - stateVars.stars[j].z / 32.0) * 5;
                shade = parseInt((1 - stateVars.stars[j].z / 32.0) * 255);
                mp3player.ctx1.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
                mp3player.ctx1.fillRect(px, py, size, size);
            }
        }

        mp3player.ctx1.globalCompositeOperation = 'lighter';
        mp3player.ctx1.strokeStyle = color;
        mp3player.ctx1.lineWidth = 10;
        for (var i = 12; i < len; i += 2) {
            angle += 0.2;
            mp3player.ctx1.beginPath();
            mp3player.ctx1.moveTo(cx + data[i] * Math.sin(angle), cy + data[i] * Math.cos(angle));
            mp3player.ctx1.lineTo(cx + data[i] * Math.sin(angle + angleGap), cy + data[i] * Math.cos(angle + angleGap));
            mp3player.ctx1.lineTo(cx + data[i] * Math.sin(angle + angleGap * 2), cy + data[i] * Math.cos(angle + angleGap * 2));
            mp3player.ctx1.closePath();
            mp3player.ctx1.stroke();
            total += (data[i]);
        }
        stateVars.beginAngle = (stateVars.beginAngle + 0.00001 * total) % twoPI;
    },
    /* 10. drawSinWave:  draws visualizer as a sin wave */
    drawSinWave: function(data) {
        var stateVars = sinWaveState;
        var halfH = mp3player.canvasHeight / 2,
            x, gap, cx, cy, i;
        var offset = (mp3player.canvasHeight > 400) ? (mp3player.canvasHeight / 2) * 0.25 : 0;

        for (i = 0; i < stateVars.len; i++) {
            stateVars.line[i] = (data[i] + offset) * stateVars.sinAngle[i];
        }
        mp3player.ctx1.shadowColor = '#fffa47';
        mp3player.ctx1.shadowBlur = 15;
        mp3player.ctx1.color = mp3player.barGradient;
        mp3player.ctx1.strokeStyle = mp3player.barGradient;
        mp3player.ctx1.lineWidth = 2;

        mp3player.ctx1.beginPath();
        x = 0;
        gap = Math.ceil(mp3player.canvasWidth / stateVars.len);
        mp3player.ctx1.moveTo(x, halfH);
        for (i = 1; i < stateVars.len; i++) {
            cx = (x + x + gap) / 2;
            cy = halfH - (stateVars.line[i] + stateVars.line[i + 1]) / 2;
            mp3player.ctx1.quadraticCurveTo(x, halfH - stateVars.line[i], cx, cy);
            x += gap;
        }
        mp3player.ctx1.quadraticCurveTo(x, halfH - stateVars.line[i], x + gap, halfH - stateVars.line[i + 1]);
        mp3player.ctx1.stroke();
    },
    /* 11. drawRadialPeaks:  Draw circled clock graph, inspired by the Apple Watch */
    drawRadialPeaks: function(data) {
        var stateVars = radialBarsState;
        var colors = stateVars.colors,
            RANDOM_COLORS = true,
            recycleColors = (RANDOM_COLORS && (parseInt(mp3player.currTime) % colors.length === 0)),
            centerY = parseInt(mp3player.canvasHeight / 2, 10),
            centerX = parseInt(mp3player.canvasWidth / 2, 10),
            radius = Math.floor(Math.min(centerY, centerX) - 10),
            ROTATE_TO_TOP = false,
            degToRads = (Math.PI / 180),
            startDeg = (ROTATE_TO_TOP) ? 270 : 0, // this is the top of the circle
            startAngle = startDeg * degToRads, //1.50 * Math.PI //just a hair off the top
            endAngle = (2 * Math.PI), // this is 0 radians
            lineWidth = 15,
            done = false;


        /* If we have a true statement, then we will randomize the colors every so often */
        if (recycleColors) {
            stateVars.randomizeColors();
        }

        var arc, value, tempVal, peanut;
        /* Only draw enough circles as we have radius available.  Done will be true when radius is less than lineWidth. */
        for (var i = 0; !done && i < data.length; i++) {
            /* are doing our calculations in degrees and compute en dAngle to radians, if tempVal is greater than 360, then normalize it  */
            tempVal = startDeg + data[i];
            value = (tempVal > 360) ? (tempVal - 360) : tempVal;
            endAngle = value * degToRads;

            /* arc is pulled here for the color - it is used after the bar to compute the peanut */
            arc = stateVars.arcs[i];
            /* strokeStyle color is the index mod by the colors array length */
            mp3player.ctx1.strokeStyle = (RANDOM_COLORS) ? 'rgba(' + arc.color + ', 0.8)' : 'rgba(' + colors[i % colors.length] + ', 0.8)';
            mp3player.ctx1.lineCap = 'round';
            mp3player.ctx1.lineWidth = lineWidth;
            mp3player.ctx1.beginPath();
            mp3player.ctx1.arc(centerX, centerY, radius, startAngle, endAngle, false);
            mp3player.ctx1.stroke();

            /* now for the peanut arc - where is now and adjust decay of position */
            if (arc.h == 0) {
                arc.h = value;
            } else {
                if (arc.h < value) {
                    arc.h += Math.floor((value - arc.h) / 2);
                } else {
                    arc.h -= Math.floor((arc.h - value) / 1.2);
                }
            }
            /* add 10% to the position, if we are the range of 270 to 360, make it the position of the long bar + 10%  */
            arc.h *= 1.1;
            if (ROTATE_TO_TOP) {
                arc.h = (tempVal > 270 && tempVal <= 360) ? value * 0.10 : arc.h;
            }

            /* record the last position and resuse next time around the frame */
            stateVars.dots[i] = (stateVars.dots[i] < arc.h) ? arc.h : stateVars.dots[i] - 1;

            tempVal = stateVars.dots[i];

            /* What is the size of the peanut bar - radius affects the length, so adjust accordingly */
            peanut = (i <= 1) ? 3 : (stateVars.arcSize - (stateVars.arcSize - i));
            /* Compute the peanut start and end angles into radians */
            arc.startAngle = tempVal * degToRads;
            tempVal += peanut;
            arc.endAngle = tempVal * degToRads;

            /* Draw the peanut */
            mp3player.ctx1.beginPath();
            mp3player.ctx1.strokeStyle = mp3player.ctx1.strokeStyle.replace('0.8)', '0.5)');
            mp3player.ctx1.arc(centerX, centerY, radius, arc.startAngle, arc.endAngle, false);
            mp3player.ctx1.stroke();

            /* compute the amount of radius we have remaining, if it is too little we are done with visualization */
            radius -= lineWidth + 1;
            done = (radius < lineWidth);
        }
    },
    /* setupPatterns: places all the patterns into an array that will be cycled through at playtime  */
    setupPatterns: function() {
        mp3player.patterns.push(mp3player.drawCrossBars); // 0
        mp3player.patterns.push(mp3player.drawSymmetricCentered); // 1
        mp3player.patterns.push(mp3player.drawDots); // 2
        mp3player.patterns.push(mp3player.drawInvertedBars); // 3
        mp3player.patterns.push(mp3player.drawRadialBars); // 4
        mp3player.patterns.push(mp3player.drawBigPulse); // 5
        mp3player.patterns.push(mp3player.drawConnectedParticles); // 6
        mp3player.patterns.push(mp3player.drawPeakedBars); // 7
        mp3player.patterns.push(mp3player.drawLifeLine); // 8
        mp3player.patterns.push(mp3player.drawTriangles); // 9
        mp3player.patterns.push(mp3player.drawSinWave); // 10
        mp3player.patterns.push(mp3player.drawRadialPeaks); // 11
    },
    /* toggleCanvasOrientation: When the pattern changes, assure the proper CSS class are applied */
    toggleCanvasOrientation: function() {
        var gui = document.getElementById('mp3gui');
        var classPresent = utils.hasClass('flat', gui);
        if (mp3player.patternIndex === 0 && classPresent) {
            utils.removeClass('flat', gui);
        } else if (mp3player.patternIndex > 0 && !classPresent) {
            utils.addClass('flat', gui);
        }

    },
    /* windowResizeHandler: The Window has resize event - make adjustments */
    windowResizeHandler: function() {
        var tHeight = parseInt(window.innerHeight * 0.60) + '';
        var tWidth = parseInt(window.innerWidth) + '';

        var fftel = document.getElementById('fft1');
        fftel.setAttribute('height', tHeight);
        fftel.setAttribute('width', tWidth);
        fftel = document.getElementById('fft2');
        fftel.setAttribute('height', tHeight);
        fftel.setAttribute('width', tWidth);

        var style = (window.getComputedStyle) ? window.getComputedStyle(mp3player.canvas1) : mp3player.canvas1.currentStyle;
        mp3player.canvasHeight = parseInt(style.height, 10);
        mp3player.canvasWidth = parseInt(style.width, 10);

        try {
            peakedBarsState.init(mp3player.canvasWidth, mp3player.canvasHeight);
            connectedParticlesState.init(mp3player.canvasWidth, mp3player.canvasHeight);
            sinWaveState.init(mp3player.ctx1, mp3player.canvasWidth, mp3player.canvasHeight);
            // setup gradient colors
            mp3player.barGradient = mp3player.getBarGradient();
            mp3player.hotGradient = mp3player.getBarGradient2();
            mp3player.rgbGradient = mp3player.getBarGradient3();
            mp3player.dotGradient = mp3player.getDotGradient();
            mp3player.pulseGradient = mp3player.getCircleGradient();

        } catch (exc) {
            // Context of canvas may not yet be set
            console.log('Exception in resize of Window: Context of canvas may be null here: ' + exc);
        }

        console.log('mp3player.windowResizeHandler(): width=[' + mp3player.canvasWidth + '], height=[' + mp3player.canvasHeight + ']');

    },
    timeUpdateHandler: function() {
        var currentTimeNode = document.getElementById('current-time');
        var currTime = audio.currentTime;
        var seconds = ('0' + parseInt(currTime % 60));
        if (seconds.length > 2) { seconds = seconds.substring(1); }
        currentTimeNode.textContent = parseInt(currTime / 60) + ':' + seconds;
        mp3player.currTime = currTime;
    },
    songSelectHandler: function() {

        if (mp3player.audioPlaying) {
            mp3player.resetLifeUniverseAndEverything();
        }
        mp3player.mp3file = null;
        var selectedIdx = this.selectedIndex;
        console.log('MP3 Change: ' + selectedIdx + ': ' + this[selectedIdx].getAttribute('data-file'));
        if (selectedIdx > -1) {
            mp3player.currMusicListIdx = selectedIdx;
            //                mp3player.mp3file = window.location.origin + '/music?id=' + this[selectedIdx].getAttribute('data-file');
            mp3player.mp3file = `${window.location.origin}/music?id=${this[selectedIdx].getAttribute('data-file')}`;
            console.log('setupControlListeners.addEventListener(): mp3 file to be loaded: ' + mp3player.mp3file);
            mp3player.loadMp3File(mp3player.mp3file);
        }
    },
    audioEndedHandler: function() {
        console.log('Audio ended event, Change to next song...');
        if (++mp3player.currMusicListIdx > mp3player.musicList.length) { mp3player.currMusicListIdx = 1; }

        var selectEl = document.getElementById('mp3file');
        selectEl.selectedIndex = mp3player.currMusicListIdx;
        selectEl.dispatchEvent(new Event('change'));

        // mp3player.resetLifeUniverseAndEverything();
    },
    /* setupAudioListeners: listeners on the audio element */
    setupAudioListeners: function() {
        audio.addEventListener('timeupdate', this.timeUpdateHandler);
        audio.addEventListener('ended', this.audioEndedHandler);
    },
    /* setupControlListeners: listeners on the control elements */
    setupControlListeners: function() {
        document.getElementById('mp3file').addEventListener('change', this.songSelectHandler);

        document.getElementById('visual-graph').addEventListener('change', function() {
            var value = parseInt(this.value);
            mp3player.PATTERN_CYCLE_ALL = (value === -1);
            mp3player.PATTERN_START_INDEX = (mp3player.PATTERN_CYCLE_ALL) ? 0 : value;
            mp3player.patternIndex = mp3player.PATTERN_START_INDEX;
            mp3player.toggleCanvasOrientation();
            //console.log('setupControlListeners.addEventListener(): Visual-Graph drop down: Cycle All Patterns=['+mp3player.PATTERN_CYCLE_ALL+'], index=['+mp3player.PATTERN_START_INDEX+']=['+this[value+1].label+']. ');
        });
        document.getElementById('btnStartMp3').addEventListener('click', function() {
            console.log('start/pause button: playing is: ' + mp3player.audioPlaying);
            if (mp3player.audioPlaying === true) {
                mp3player.pause();
            } else {
                mp3player.start();
            }
        });
    },

    /* getDotGradient: gradient color */
    getDotGradient: function() {
        if (!mp3player.ctx1) { return; }
        var grad = mp3player.ctx1.createLinearGradient(0, 0, 0, mp3player.canvasHeight);
        grad.addColorStop(1, '#002FE5');
        grad.addColorStop(0.50, '#CEE914');
        grad.addColorStop(0.25, '#F16011');
        grad.addColorStop(0, '#FF0000');

        return grad;
    },
    /* getCircleGradient: gradient color */
    getCircleGradient: function() {
        if (!mp3player.ctx1) { return; }
        var ctx = mp3player.ctx1,
            centerX = mp3player.canvasWidth / 2,
            centerY = mp3player.canvasHeight / 2;

        var grad = ctx.createRadialGradient(centerX, centerY, 1, centerX, centerY, mp3player.canvasHeight / 3); // 100
        // Compute Gradient colors
        // http://www.perbang.dk/rgbgradient/

        grad.addColorStop(0.00, '#002FE5'); // BOTTOM
        grad.addColorStop(0.10, '#05DFE6');
        grad.addColorStop(0.20, '#0BE746');
        grad.addColorStop(0.30, '#CEE914');
        grad.addColorStop(0.40, '#E9B417');
        grad.addColorStop(0.50, '#EAB417');
        grad.addColorStop(0.60, '#EA661A');
        grad.addColorStop(0.70, '#F15A11');
        grad.addColorStop(0.80, '#F16011');
        grad.addColorStop(0.90, '#F83309');
        grad.addColorStop(1.00, '#FF0000'); // top

        return grad;
    },
    /* getBarGradient: gradient color */
    getBarGradient: function() {
        if (!mp3player.ctx1) { return; }
        var ctx = mp3player.ctx1;
        var grad = ctx.createLinearGradient(0, 0, 0, mp3player.canvasHeight);
        // Compute Gradient colors
        // http://www.perbang.dk/rgbgradient/

        /*
        grad.addColorStop(0.14, '#FF0000');
        grad.addColorStop(0.285714286, '#FF7F00');
        grad.addColorStop(0.428571429, '#FFFF00');
        grad.addColorStop(0.571428571, '#00FF00');
        grad.addColorStop(0.714285714, '#0000FF');
        grad.addColorStop(0.857142857, '#4B0082');
        grad.addColorStop(1.0, '#8F00FF');
        */
        grad.addColorStop(1.00, '#002FE5'); // BOTTOM
        grad.addColorStop(0.90, '#05DFE6');
        grad.addColorStop(0.80, '#0BE746');
        grad.addColorStop(0.70, '#CEE914');
        grad.addColorStop(0.60, '#E9B417');
        grad.addColorStop(0.50, '#EAB417');
        grad.addColorStop(0.40, '#EA661A');
        grad.addColorStop(0.30, '#F15A11');
        grad.addColorStop(0.20, '#F16011');
        grad.addColorStop(0.10, '#F83309');
        grad.addColorStop(0.00, '#FF0000'); // top

        return grad;
    },
    /* getBarGradient2: gradient color */
    getBarGradient2: function() {
        if (!mp3player.ctx1) { return; }
        var ctx = mp3player.ctx1;
        var grad = ctx.createLinearGradient(0, 0, 0, mp3player.canvasHeight);
        // Compute Gradient colors
        // http://www.perbang.dk/rgbgradient/

        grad.addColorStop(1.00, '#002fdd');
        grad.addColorStop(0.80, '#d20017');
        grad.addColorStop(0.70, '#ca6200');
        grad.addColorStop(0.60, '#b1c200');
        grad.addColorStop(0.30, '#74bf00');

        return grad;
    },
    /* getBarGradient3: gradient color */
    getBarGradient3: function() {
        if (!mp3player.ctx1) { return; }
        var ctx = mp3player.ctx1;
        var grad = ctx.createLinearGradient(0, 0, 0, mp3player.canvasHeight);
        // Compute Gradient colors
        // http://www.perbang.dk/rgbgradient/
        // Rainbow
        grad.addColorStop(0, "black");
        grad.addColorStop(0.3, "magenta");
        grad.addColorStop(0.5, "blue");
        grad.addColorStop(0.6, "green");
        grad.addColorStop(0.8, "yellow");
        grad.addColorStop(1, "red");

        return grad;
    },
    buildMusicOptionList: function(listArr) {
        var fileName;
        var friendlyName;
        var select = document.getElementById('mp3file');

        var opt = document.createElement("OPTION");
        opt.setAttribute('value', '-1');
        opt.setAttribute('data-file', 'NA_None');
        opt.innerHTML = 'none';
        select.appendChild(opt);

        for (var i = 0; i < listArr.length; i++) {
            fileName = listArr[i];
            friendlyName = fileName.substring(0, fileName.indexOf('.mp3')).replace('_', ' ');
            opt = document.createElement("OPTION");
            opt.setAttribute('value', i); // Do not put the value in string quotes - this is intended to be be number.
            opt.setAttribute('data-file', fileName);
            opt.innerHTML = friendlyName;
            select.appendChild(opt);

            console.log(opt.outerHTML);
        }
        mp3player.musicList = listArr;
    },

    initMusicList: function() {
        var localURL = window.location.origin + '/list';
        var xhrReq = new XMLHttpRequest();
        xhrReq.addEventListener('load', function() {
            console.log('Music List request: process response');
            jsonRes = JSON.parse(this.responseText);
            mp3player.buildMusicOptionList(jsonRes.items);
        });
        xhrReq.open('GET', localURL);
        xhrReq.send();

    },

    /* init:  main initializer for the mp3player */
    init: function() {
        // invoke the size changes at least once,  make sure all canvas are correct for start up
        mp3player.windowResizeHandler();
        // get the canvas contexts
        mp3player.ctx1 = mp3player.canvas1.getContext('2d');
        mp3player.ctx2 = mp3player.canvas2.getContext('2d');

        // Pull the style Height and width - canvas1 should suffice
        var style = (window.getComputedStyle) ? window.getComputedStyle(mp3player.canvas1) : mp3player.canvas1.currentStyle;
        mp3player.canvasHeight = parseInt(style.height, 10);
        mp3player.canvasWidth = parseInt(style.width, 10);
        console.log('mp3player.init(): width=[' + mp3player.canvasWidth + '], height=[' + mp3player.canvasHeight + ']');

        // setup gradient colors
        mp3player.barGradient = mp3player.getBarGradient();
        mp3player.hotGradient = mp3player.getBarGradient2();
        mp3player.rgbGradient = mp3player.getBarGradient3();
        mp3player.dotGradient = mp3player.getDotGradient();
        mp3player.pulseGradient = mp3player.getCircleGradient();

        // Declare the auio before the listeners,  we are adding an time update event listener to the audio.
        mp3player.setupControlListeners();
        mp3player.setupPatterns();

        // initialize all state state drawing objects
        bigPulseState.init();
        connectedParticlesState.init(mp3player.canvasWidth, mp3player.canvasHeight);
        peakedBarsState.init(mp3player.canvasWidth, mp3player.canvasHeight);
        lifeLineState.init();
        triangleState.init();
        sinWaveState.init(mp3player.ctx1, mp3player.canvasWidth, mp3player.canvasHeight);
        radialBarsState.init(mp3player.canvasWidth, mp3player.canvasHeight);

        console.log('%cmp3player.init(): complete', "color:cyan; background:blue; font-size: 12px");
    }

};
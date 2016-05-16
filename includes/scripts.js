var logoHeader;

function repositionPage() {
  var logo = document.getElementById('mainLogo');
  var logoBox = document.getElementById('logoBox');

  var marginTop = (logoBox.offsetHeight - logo.offsetHeight) / 4;

  document.getElementById('page').style.marginTop = marginTop + 'px';
}

function repositionPageWindowed() {
  var logo = document.getElementById('mainLogo');
  var logoBox = document.getElementById('logoBox');

  var boxedTop = (logoBox.offsetHeight - logo.offsetHeight) / 4;
  var windowedTop = (window.innerHeight - logo.offsetHeight) / 4;

  if (boxedTop < windowedTop) {
    document.getElementById('page').style.marginTop = boxedTop + 'px';
  } else {
    document.getElementById('page').style.marginTop = windowedTop + 'px';
  }
}

function frame(time) {
  if (logoHeader.lastTime != null) {
    var timeStep = Math.min(time - logoHeader.lastTime, 200) / 1000;
    logoHeader.drawFrame(timeStep);
  }
  logoHeader.lastTime = time;

  requestAnimationFrame(frame);
}

// CanvasDisplay

function CanvasDisplay(canvas, fillColor) {
  this.canvas = canvas;
  this.cx = this.canvas.getContext('2d');
  this.fillColor = fillColor;
  
  this.offscreen = document.createElement('canvas');
  this.offscreen.width = this.canvas.width * 2;
  this.offscreen.height = this.canvas.height * 2;
  this.offscreenCx = this.offscreen.getContext('2d');

  this.animationTime = 0;
  this.ticks = 0;
  this.lastTime = null;

  this.photos = [];
  this.currentPhoto = 0;

  this.orbitals = [];

  this.stars = [];
  var starCount = Math.floor(Math.random() * 225) + 50; // Between 225-274
  for (var i = 0; i < starCount; i++)
    this.stars.push(new Star());

  this.resize();
}

CanvasDisplay.prototype.addOrbitals = function() {
  var orbitals = this.orbitals;

  for (var idx in arguments) {
    orbitals.push(new Orbital(arguments[idx]));
  }
}

CanvasDisplay.prototype.addPhotos = function() {
  var photos = this.photos;

  for (var idx in arguments) {
    photos.push(new Photo(arguments[idx]));
  }
};

CanvasDisplay.prototype.clearDisplay = function() {
  this.offscreenCx.fillStyle = 'rgb(' + this.fillColor[0] + ', ' +
                                        this.fillColor[1] + ', ' +
                                        this.fillColor[2] + ')';
  this.offscreenCx.fillRect(0, 0, this.offscreen.width, this.offscreen.height);
};

CanvasDisplay.prototype.drawBottomFade = function() {
  var grd = this.offscreenCx.createLinearGradient(
    0, (1.5 * this.canvas.height) - 100, 0, 1.5 * this.canvas.height);

  grd.addColorStop(0, 'rgba(' + this.fillColor[0] + ', ' +
                                this.fillColor[1] + ', ' +
                                this.fillColor[2] + ', ' +
                                '0)');
  grd.addColorStop(1, 'rgba(' + this.fillColor[0] + ', ' +
                                this.fillColor[1] + ', ' +
                                this.fillColor[2] + ', ' +
                                '1)');

  this.offscreenCx.fillStyle = grd;
  this.offscreenCx.fillRect(0, 0, this.offscreen.width, this.offscreen.height);
}

CanvasDisplay.prototype.drawFrame = function(step) {
  this.animationTime += step;

  this.clearDisplay();
  if (this.photos.length > 0) {
    this.stepPhotos();
    this.drawPhotoElement();
    this.drawVignette();
    this.drawOrbitals();
    this.drawStars();
    this.drawBottomFade();
  }

  this.cx.drawImage(this.offscreen,
                    -this.canvas.width / 2, -this.canvas.height / 2,
                    this.offscreen.width, this.offscreen.height);
};

CanvasDisplay.prototype.drawOrbitals = function() {
  var center = {
    x: this.offscreen.width / 2,
    y: this.offscreen.height / 2
  };
  var width = this.canvas.width;

  for (var i = 0; i < this.orbitals.length; i++) {
    var orbital = this.orbitals[i];

    this.offscreenCx.globalAlpha = orbital.alpha;
    this.offscreenCx.save();
    this.offscreenCx.strokeStyle = orbital.color;
    this.offscreenCx.lineWidth = orbital.stroke;
    this.offscreenCx.setLineDash(orbital.dashes);
    this.offscreenCx.beginPath();
    this.offscreenCx.arc(
      center.x + ((width / 2) * orbital.offset.x), 
      center.y + ((width / 2) * orbital.offset.y), 
      (this.canvas.width / 2) * orbital.relativeRadius, 
      (this.ticks / 1000 / orbital.spin), 
      (this.ticks / 1000 / orbital.spin) + (Math.PI * 2));
    this.offscreenCx.stroke();
    this.offscreenCx.restore();
    this.offscreenCx.globalAlpha = 1.0;
  }
};

CanvasDisplay.prototype.drawPhotoElement = function() {
  var photo = this.photos[this.currentPhoto];

  if (photo.available()) {
    var scaledValues = photo.scaleToDisplay(this.hypotenuse());
    this.offscreenCx.save();
    this.offscreenCx.translate(this.canvas.width, this.canvas.height);
    this.offscreenCx.rotate(photo.life * .001 * Math.PI);
    if (photo.life >= 420) {
      this.offscreenCx.globalAlpha = (500 - photo.life) / 100;
    } else if (photo.life <= 80) {
      this.offscreenCx.globalAlpha = photo.life / 100;
    } else {
      this.offscreenCx.globalAlpha = 0.8;
    }
    this.offscreenCx.drawImage(photo.img, 
                      (-scaledValues.width / 2) + photo.offset[0],
                      (-scaledValues.height / 2) + photo.offset[1], 
                      scaledValues.width, scaledValues.height);
    this.offscreenCx.globalAlpha = 1;
    this.offscreenCx.restore();
  }
};

CanvasDisplay.prototype.drawStars = function() {
  this.offscreenCx.save();
  this.offscreenCx.translate(this.canvas.width, this.canvas.height);
  this.offscreenCx.rotate(this.ticks * .0001 * Math.PI);
  console.log(this.ticks * .0001 * Math.PI);
  for (var i = 0; i < this.stars.length; i++) {
    var star = this.stars[i];

    this.offscreenCx.globalAlpha = star.alpha;
    this.offscreenCx.fillStyle = star.color;
    this.offscreenCx.beginPath();
    this.offscreenCx.arc(
      (this.offscreen.width * star.x) - this.canvas.width, 
      (this.offscreen.height * star.y) - this.canvas.height,
      star.size, 0, Math.PI * 2);
    this.offscreenCx.fill();
    this.offscreenCx.globalAlpha = 1.0;
  }
  this.offscreenCx.restore();
}

CanvasDisplay.prototype.drawVignette = function() {
  var photo = this.photos[this.currentPhoto];

  if (photo.available()) {
    var scaledValues = photo.scaleToDisplay(this.hypotenuse());
    var center = {
      x: (this.offscreen.width / 2) + photo.offset[0],
      y: (this.offscreen.height / 2) + photo.offset[1]
    };
    if (scaledValues.width > scaledValues.height) {
      var radius = scaledValues.height / 2;
    } else {
      var radius = scaledValues.width / 2;
    }
    var grd = this.offscreenCx.createRadialGradient(
                center.x, center.y, 0,
                center.x, center.y, 0.8 * radius);

    grd.addColorStop(0, 'rgba(' + this.fillColor[0] + ', ' +
                                  this.fillColor[1] + ', ' +
                                  this.fillColor[2] + ', ' +
                                  '0)');
    grd.addColorStop(1, 'rgba(' + this.fillColor[0] + ', ' +
                                  this.fillColor[1] + ', ' +
                                  this.fillColor[2] + ', ' +
                                  '1)');

    this.offscreenCx.fillStyle = grd;
    this.offscreenCx.fillRect(0, 0, this.offscreen.width, this.offscreen.height);
  }
};

CanvasDisplay.prototype.hypotenuse = function() {
  var width = this.canvas.width;
  var height = this.canvas.height;

  return Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
};

CanvasDisplay.prototype.resize = function() {
  var frameWidth = this.canvas.parentNode.offsetWidth;
  this.canvas.parentNode.style.height = (0.75 * frameWidth) + 'px';
  var frameHeight = this.canvas.parentNode.offsetHeight;

  this.canvas.width = frameWidth;
  this.canvas.height = frameHeight;

  this.offscreen.width = frameWidth * 2;
  this.offscreen.height = frameHeight * 2;

  this.drawFrame(0);
};

CanvasDisplay.prototype.stepPhotos = function() {
  var photo = this.photos[this.currentPhoto];
  var lastTick = this.ticks;

  this.ticks = Math.floor(this.animationTime * 48);
  if (this.ticks > lastTick) {
    photo.offset[0] += photo.trajectory[0];
    photo.offset[1] += photo.trajectory[1];
    photo.life--;
  }

  if (photo.life <= 0) {
    this.currentPhoto++;
    if (this.currentPhoto >= this.photos.length) {
      this.currentPhoto = 0;
    }

    this.photos[this.currentPhoto].reset();
  }
};

// Photo

function Photo(path) {
  this.img = document.createElement('img');
  this.img.src = path;

  this.reset();
}

Photo.prototype.available = function() {
  return this.img.naturalWidth > 0;
};

Photo.prototype.reset = function() {
  this.trajectory = [ 
     Math.floor(Math.random() * 5) - 2, // -2, -1, 0, 1, 2
     Math.floor(Math.random() * 5) - 2  // -2, -1, 0, 1, 2
  ];
  this.offset = [0, 0];
  this.life = 500;
};

Photo.prototype.scaleToDisplay = function(hypotenuse) {
  var originalWidth = this.img.width;
  var originalHeight = this.img.height;

  var newHeight = hypotenuse;
  var ratio = newHeight / this.img.height;
  var newWidth = this.img.width * ratio;

  return {
    width: newWidth,
    height: newHeight
  }
};

// Orbitals

function Orbital(options) {
  var options = options || {};

  this.stroke = options.stroke || 1;
  this.offset = options.offsetRatio || { x: 0, y: 0 };
  this.alpha = options.alpha || 0.6;
  this.relativeRadius = options.relativeRadius || .85;
  this.dashes = options.dashes || [8,2];
  this.spin = options.spin || 2;
  this.color = options.color || '#fff';
}

// Stars

function Star() {
  this.x = Math.random();
  this.y = Math.random();
  this.size = Math.floor(Math.random() * 2) + 1; // 1 2 3
  this.alpha = Math.random();
  switch (Math.floor(Math.random() * 2)) {
    case 0:
      this.color = '#FFFFFF';
      break;
    case 1:
      this.color = '#FFFF66';
      break;
  }
}
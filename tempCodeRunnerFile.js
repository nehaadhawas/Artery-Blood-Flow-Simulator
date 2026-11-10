
const canvas = document.getElementById("arteryCanvas");
const ctx = canvas.getContext("2d");

const slider = document.getElementById("blockage");
const particles = [];

let blockage = 0;
let animationFrame = 0;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createParticles() {
  particles.length = 0;

  for (let i = 0; i < 35; i++) {
    particles.push({
      x: Math.random() * 1000,
      offset: (Math.random() - 0.5) * 1.2,
      radius: 5 + Math.random() * 3
    });
  }
}

function getRadius(x, width, height) {
  const center = width * 0.5;
  const spread = width * 0.13;

  const narrowing = Math.exp(
    -Math.pow((x - center) / spread, 2) / 2
  );

  const normalRadius = height * 0.32;
  const reduction = blockage / 100;

  return normalRadius * (1 - reduction * narrowing);
}

function drawArtery(width, height) {
  const centerY = height / 2;

  // Outer artery wall
  ctx.beginPath();

  for (let x = 0; x <= width; x += 5) {
    const y = centerY - getRadius(x, width, height) - 17;

    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  for (let x = width; x >= 0; x -= 5) {
    const y = centerY + getRadius(x, width, height) + 17;
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fillStyle = "#bd5264";
  ctx.fill();

  // Inner blood passage
  ctx.beginPath();

  for (let x = 0; x <= width; x += 5) {
    const y = centerY - getRadius(x, width, height);

    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  for (let x = width; x >= 0; x -= 5) {
    const y = centerY + getRadius(x, width, height);
    ctx.lineTo(x, y);
  }

  ctx.closePath();

  const gradient = ctx.createLinearGradient(
    0, centerY - height / 2,
    0, centerY + height / 2
  );

  gradient.addColorStop(0, "#ffe0d9");
  gradient.addColorStop(1, "#f3aaa3");

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = "#922d42";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Labels
  ctx.fillStyle = "#702b3a";
  ctx.font = "bold 13px Arial";
  ctx.fillText("ARTERY WALL", 12, 22);
}

function drawParticles(width, height, flow) {
  const centerY = height / 2;

  particles.forEach(particle => {
    const radius = getRadius(
      particle.x,
      width,
      height
    );

    const y = centerY + particle.offset * radius * 0.65;

    ctx.beginPath();

    ctx.ellipse(
      particle.x,
      y,
      particle.radius,
      particle.radius * 0.65,
      0,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = "#a91f3a";
    ctx.fill();

    ctx.strokeStyle = "#771629";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Illustrative particle movement
    const speed = 0.4 + flow / 100 * 2.2;

    particle.x += speed;

    if (particle.x > width + 10) {
      particle.x = -10;
    }
  });
}

function animate() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  ctx.clearRect(0, 0, width, height);

  const remainingDiameter = 1 - blockage / 100;

  // Simplified Poiseuille relationship
  const flow = Math.round(
    Math.pow(remainingDiameter, 4) * 100
  );

  drawArtery(width, height);
  drawParticles(width, height, flow);

  animationFrame = requestAnimationFrame(animate);
}

function updateSimulation() {
  blockage = Number(slider.value);

  const remainingDiameter = 1 - blockage / 100;

  const flow = Math.round(
    Math.pow(remainingDiameter, 4) * 100
  );

  const reduction = 100 - flow;

  document.getElementById("blockageValue").textContent =
    blockage + "%";

  document.getElementById("flowValue").textContent =
    flow + "%";

  document.getElementById("reductionValue").textContent =
    reduction + "%";

  document.getElementById("flowLabel").textContent =
    flow + " / 100";

  document.getElementById("flowBar").style.width =
    flow + "%";

  const status = document.getElementById("status");
  const title = document.getElementById("resultTitle");
  const text = document.getElementById("resultText");

  if (blockage === 0) {
    status.textContent = "Normal flow";
    title.textContent = "Normal artery";
    text.textContent =
      "The artery is open in this model. Relative blood flow is set to 100%.";
  } else if (blockage < 40) {
    status.textContent = "Mild narrowing";
    title.textContent = "Mild artery narrowing";
    text.textContent =
      "The artery diameter has decreased. The model estimates a reduction in relative blood flow.";
  } else if (blockage < 70) {
    status.textContent = "Moderate narrowing";
    title.textContent = "Moderate artery narrowing";
    text.textContent =
      "The smaller artery radius causes a larger estimated reduction in flow.";
  } else {
    status.textContent = "Severe narrowing";
    title.textContent = "Severe artery narrowing";
    text.textContent =
      "The artery passage is very narrow. The model estimates very low relative flow.";
  }
}

slider.addEventListener("input", updateSimulation);

document.querySelectorAll("[data-value]").forEach(button => {
  button.addEventListener("click", () => {
    slider.value = button.dataset.value;
    updateSimulation();
  });
});

document.getElementById("resetButton").addEventListener("click", () => {
  slider.value = 0;
  updateSimulation();
});

window.addEventListener("resize", resizeCanvas);

// OpenCV image processing
const imageUpload = document.getElementById("imageUpload");
const originalImage = document.getElementById("originalImage");
const edgeCanvas = document.getElementById("edgeCanvas");
const cvStatus = document.getElementById("cvStatus");

imageUpload.addEventListener("change", function(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    cvStatus.textContent = "Please select an image file.";
    return;
  }

  const imageURL = URL.createObjectURL(file);
  originalImage.src = imageURL;

  originalImage.onload = function() {
    if (!window.openCVReady || !window.cv) {
      cvStatus.textContent =
        "OpenCV is still loading. Please wait and upload the image again.";
      URL.revokeObjectURL(imageURL);
      return;
    }

    let source, gray, blurred, edges;

    try {
      source = cv.imread(originalImage);
      gray = new cv.Mat();
      blurred = new cv.Mat();
      edges = new cv.Mat();

      // 1. Convert image to grayscale
      cv.cvtColor(
        source,
        gray,
        cv.COLOR_RGBA2GRAY
      );

      // 2. Reduce image noise
      cv.GaussianBlur(
        gray,
        blurred,
        new cv.Size(5, 5),
        0
      );

      // 3. Detect edges using Canny
      cv.Canny(
        blurred,
        edges,
        50,
        150
      );

      cv.imshow(edgeCanvas, edges);

      cvStatus.textContent =
        "Success! Grayscale, Gaussian blur and Canny edge detection completed.";
    } catch (error) {
      cvStatus.textContent =
        "Image processing failed: " + error.message;
    } finally {
      if (source) source.delete();
      if (gray) gray.delete();
      if (blurred) blurred.delete();
      if (edges) edges.delete();
      URL.revokeObjectURL(imageURL);
    }
  };
});

document.addEventListener("opencv-ready", () => {
  cvStatus.textContent =
    "OpenCV.js loaded successfully. You can upload a vessel image.";
});

// Start the simulator
resizeCanvas();
createParticles();
updateSimulation();
animate();

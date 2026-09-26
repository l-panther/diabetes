
document.getElementById('currentYear').textContent = new Date().getFullYear();

const $ = (id) => document.getElementById(id);

/* ---------- Gauge construction ---------- */
const CX = 100, CY = 100, R = 78;
const toPoint = (angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY - R * Math.sin(rad) };
};
const arcPath = (a1, a2) => {
  const p1 = toPoint(a1), p2 = toPoint(a2);
  return `M ${p1.x} ${p1.y} A ${R} ${R} 0 0 1 ${p2.x} ${p2.y}`;
};

// BMI 15 -> 40 mapped across 180deg -> 0deg
const bmiToAngle = (bmi) => {
  const clamped = Math.max(15, Math.min(40, bmi));
  const f = (clamped - 15) / (40 - 15);
  return 180 - f * 180;
};

const bands = [
  { from: 15, to: 18.5, color: '#5A8FB8' },   // underweight
  { from: 18.5, to: 24.9, color: '#4E9B72' }, // normal
  { from: 24.9, to: 29.9, color: '#D98B2B' }, // overweight
  { from: 29.9, to: 40, color: '#C1443C' }    // obese
];

const bandsGroup = $('gaugeBands');
bands.forEach(b => {
  const a1 = bmiToAngle(b.from);
  const a2 = bmiToAngle(b.to);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', arcPath(a1, a2));
  path.setAttribute('stroke', b.color);
  path.setAttribute('stroke-width', '14');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'butt');
  bandsGroup.appendChild(path);
});

const needle = $('needle');
const setNeedle = (bmi) => {
  const angle = bmiToAngle(bmi);
  // Needle base line points straight up (12 o'clock). CSS rotate() is clockwise-positive,
  // so to aim it at gauge angle `angle` (180deg = left/bmi15, 0deg = right/bmi40),
  // the correct rotation is 90 - angle: -90deg at bmi15 (left), 0deg at the midpoint
  // (pointing straight up), +90deg at bmi40 (right).
  const rotation = 90 - angle;
  needle.style.transform = `rotate(${rotation}deg)`;
};
setNeedle(15); // rest position

/* ---------- BMI logic (validation preserved) ---------- */
const heightInput = $('height');
const weightInput = $('weight');
const bmiOutput = $('bmiOutput');
const statusDiv = $('status');
const adviceDiv = $('healthAdvice');
const calculateBtn = document.querySelector('.calculate-bmi');

const showFieldError = (fieldId, message) => {
  const input = $(fieldId);
  const error = $(`${fieldId}-error`);
  if (!input || !error) return;
  input.classList.add('input-error');
  error.textContent = message;
};
const clearFieldError = (fieldId) => {
  const input = $(fieldId);
  const error = $(`${fieldId}-error`);
  if (!input || !error) return;
  input.classList.remove('input-error');
  error.textContent = '';
};
const clearAllErrors = () => { clearFieldError('height'); clearFieldError('weight'); };

const reset = () => {
  bmiOutput.textContent = '0';
  statusDiv.textContent = '';
  adviceDiv.style.display = 'none';
  adviceDiv.textContent = '';
  setNeedle(15);
  clearAllErrors();
};

const calculate = () => {
  const height = parseFloat(heightInput.value);
  const weight = parseFloat(weightInput.value);
  clearAllErrors();
  let hasError = false;

  if (!heightInput.value.trim()) { showFieldError('height', 'Please enter your height.'); hasError = true; }
  if (!weightInput.value.trim()) { showFieldError('weight', 'Please enter your weight.'); hasError = true; }
  if (!isNaN(height) && (height < 100 || height > 250)) { showFieldError('height', 'Enter a value between 100 and 250.'); hasError = true; }
  if (!isNaN(weight) && (weight < 30 || weight > 300)) { showFieldError('weight', 'Enter a value between 30 and 300.'); hasError = true; }

  if (hasError) {
    bmiOutput.textContent = '0';
    statusDiv.textContent = '';
    adviceDiv.style.display = 'none';
    adviceDiv.textContent = '';
    setNeedle(15);
    return;
  }

  const bmi = weight / ((height / 100) ** 2);
  const bmiRounded = bmi.toFixed(1);
  bmiOutput.textContent = bmiRounded;
  setNeedle(bmi);

  let status = '', advice = '';
  if (bmi < 18.5) {
    status = 'underweight';
    advice = 'Consider a balanced diet and speaking to a healthcare professional if needed.';
  } else if (bmi < 24.9) {
    status = 'a normal weight';
    advice = 'Maintain your healthy lifestyle with regular activity and balanced meals.';
  } else if (bmi < 29.9) {
    status = 'overweight';
    advice = 'Regular exercise and balanced nutrition may help improve health.';
  } else {
    status = 'in the obese range';
    advice = 'Please consult a healthcare professional for personalised guidance.';
  }

  statusDiv.textContent = `Your BMI indicates you are ${status}.`;
  adviceDiv.style.display = 'block';
  adviceDiv.textContent = advice;
};

calculateBtn.addEventListener('click', calculate);
heightInput.addEventListener('input', reset);
weightInput.addEventListener('input', reset);

document.getElementById('riskModal').addEventListener('hidden.bs.modal', reset);

/* ---------- Sidenav links: close panel fully, then scroll ---------- */
const sidenavEl = document.getElementById('sidenav');
const sidenavInstance = bootstrap.Offcanvas.getOrCreateInstance(sidenavEl);

document.querySelectorAll('.sidenav-links a').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    const targetEl = document.querySelector(targetId);

    const scrollToTarget = () => {
      targetEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (sidenavEl.classList.contains('show')) {
      sidenavEl.addEventListener('hidden.bs.offcanvas', scrollToTarget, { once: true });
      sidenavInstance.hide();
    } else {
      scrollToTarget();
    }
  });
});

const maps = [
  "어센트",
  "바인드",
  "브리즈",
  "헤이븐",
  "아이스박스",
  "로터스",
  "펄",
  "프랙처",
  "스플릿",
  "선셋",
  "어비스",
  "코로드"
];

const colors = [
  "#ff4655",
  "#ff7a59",
  "#7c5cff",
  "#4f8cff",
  "#00b8d9",
  "#00c389",
  "#73d13d",
  "#f59f00",
  "#ff6bcb",
  "#9b5de5",
  "#577590",
  "#ef476f"
];

const wheel = document.getElementById("wheel");
const resultText = document.getElementById("resultText");
const spinBtn = document.getElementById("spinBtn");
const resetBtn = document.getElementById("resetBtn");
const historyList = document.getElementById("historyList");
const usedList = document.getElementById("usedList");
const excludeModeCheckbox = document.getElementById("excludeMode");
const modeStatusText = document.getElementById("modeStatusText");
const remainingText = document.getElementById("remainingText");

const size = 500;
const center = size / 2;
const radius = 230;
const sliceAngle = 360 / maps.length;

let currentRotation = 0;
let isSpinning = false;
let history = [];
let usedMaps = [];

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function createSlicePath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return `
    M ${cx} ${cy}
    L ${start.x} ${start.y}
    A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}
    Z
  `;
}

function getTextPosition(cx, cy, r, startAngle, endAngle) {
  const mid = (startAngle + endAngle) / 2;
  return polarToCartesian(cx, cy, r * 0.67, mid);
}

function renderWheel() {
  const outerRing = `
    <circle cx="${center}" cy="${center}" r="${radius + 14}" fill="rgba(255,255,255,0.06)" />
    <circle cx="${center}" cy="${center}" r="${radius + 5}" fill="#0f1320" stroke="rgba(255,255,255,0.15)" stroke-width="4" />
  `;

  const slices = maps.map((map, index) => {
    const startAngle = index * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const path = createSlicePath(center, center, radius, startAngle, endAngle);
    const pos = getTextPosition(center, center, radius, startAngle, endAngle);
    const midAngle = (startAngle + endAngle) / 2;

    return `
      <g>
        <path
          d="${path}"
          fill="${colors[index % colors.length]}"
          stroke="rgba(255,255,255,0.9)"
          stroke-width="2.5"
        />
        <text
          class="slice-text"
          x="${pos.x}"
          y="${pos.y}"
          transform="rotate(${midAngle}, ${pos.x}, ${pos.y})"
        >
          ${map}
        </text>
      </g>
    `;
  }).join("");

  const centerCircle = `
    <circle cx="${center}" cy="${center}" r="56" fill="rgba(255,255,255,0.12)" />
    <circle cx="${center}" cy="${center}" r="44" fill="#ffffff" />
    <circle cx="${center}" cy="${center}" r="14" fill="#ff4655" />
  `;

  wheel.innerHTML = outerRing + slices + centerCircle;
}

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = `<span class="empty-history">아직 기록이 없어.</span>`;
    return;
  }

  historyList.innerHTML = history
    .map(item => `<span class="history-chip">${item}</span>`)
    .join("");
}

function renderUsedMaps() {
  if (usedMaps.length === 0) {
    usedList.innerHTML = `<span class="empty-history">아직 나온 맵이 없어.</span>`;
    return;
  }

  usedList.innerHTML = usedMaps
    .map(item => `<span class="used-chip">${item}</span>`)
    .join("");
}

function updateModeUI() {
  const isExcludeMode = excludeModeCheckbox.checked;
  const remainingCount = maps.length - usedMaps.length;

  modeStatusText.textContent = isExcludeMode ? "현재: 제외 모드" : "현재: 기본 모드";
  remainingText.textContent = isExcludeMode
    ? `남은 맵: ${remainingCount}개`
    : `남은 맵: ${maps.length}개`;
}

function getAvailableMaps() {
  const isExcludeMode = excludeModeCheckbox.checked;

  if (!isExcludeMode) {
    return [...maps];
  }

  return maps.filter(map => !usedMaps.includes(map));
}

function spinWheel() {
  if (isSpinning) return;

  const availableMaps = getAvailableMaps();

  if (availableMaps.length === 0) {
    resultText.textContent = "모든 맵 완료!";
    return;
  }

  isSpinning = true;
  spinBtn.disabled = true;
  resetBtn.disabled = true;
  excludeModeCheckbox.disabled = true;
  resultText.textContent = "돌리는 중...";

  const pickedMap = availableMaps[Math.floor(Math.random() * availableMaps.length)];
  const winnerIndex = maps.indexOf(pickedMap);
  const extraSpins = 6;

  const targetAngle = 360 - (winnerIndex * sliceAngle + sliceAngle / 2);
  const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
  const delta = (targetAngle - normalizedCurrent + 360) % 360;

  currentRotation += extraSpins * 360 + delta;
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    resultText.textContent = pickedMap;

    history.unshift(pickedMap);
    history = history.slice(0, 5);

    if (!usedMaps.includes(pickedMap)) {
      usedMaps.push(pickedMap);
    }

    renderHistory();
    renderUsedMaps();
    updateModeUI();

    isSpinning = false;
    spinBtn.disabled = false;
    resetBtn.disabled = false;
    excludeModeCheckbox.disabled = false;

    if (excludeModeCheckbox.checked && usedMaps.length === maps.length) {
      resultText.textContent = `${pickedMap} (마지막 맵)`;
    }
  }, 4200);
}

function resetWheel() {
  if (isSpinning) return;

  currentRotation = 0;
  history = [];
  usedMaps = [];
  resultText.textContent = "?";

  renderHistory();
  renderUsedMaps();
  updateModeUI();

  wheel.style.transition = "transform 0.6s ease";
  wheel.style.transform = "rotate(0deg)";

  setTimeout(() => {
    wheel.style.transition = "transform 4.2s cubic-bezier(0.12, 0.8, 0.2, 1)";
  }, 650);
}

spinBtn.addEventListener("click", spinWheel);
resetBtn.addEventListener("click", resetWheel);
excludeModeCheckbox.addEventListener("change", updateModeUI);

wheel.style.transformOrigin = "50% 50%";

renderWheel();
renderHistory();
renderUsedMaps();
updateModeUI();
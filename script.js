const maps = [
  "Ascent",
  "Bind",
  "Breeze",
  "Haven",
  "Icebox",
  "Lotus",
  "Pearl",
  "Fracture",
  "Split",
  "Sunset",
  "Abyss",
  "Corrode"
];

// 맵 이름 → PNG 슬러그 (영문 소문자가 파일명과 동일)
function mapSlug(name) {
  return (name || "").toLowerCase();
}

const resultText = document.getElementById("resultText");
const drawBtn = document.getElementById("spinBtn");
const resetBtn = document.getElementById("resetBtn");
const historyList = document.getElementById("historyList");
const usedList = document.getElementById("usedList");
const excludeModeCheckbox = document.getElementById("excludeMode");
const modeStatusText = document.getElementById("modeStatusText");
const remainingText = document.getElementById("remainingText");
const cardDeckEl = document.getElementById("cardDeck");
const drawStageEl = document.getElementById("drawStage");

let isDrawing = false;
let history = [];
let usedMaps = [];
const excludedMaps = new Set();   // 수동으로 제외한 맵

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = `<span class="empty-history">아직 기록이 없습니다.</span>`;
    return;
  }

  historyList.innerHTML = history
    .map(item => `<span class="history-chip">${item}</span>`)
    .join("");
}

function renderUsedMaps() {
  if (usedMaps.length === 0) {
    usedList.innerHTML = `<span class="empty-history">아직 나온 맵이 없습니다.</span>`;
    return;
  }

  usedList.innerHTML = usedMaps
    .map(item => `<span class="used-chip">${item}</span>`)
    .join("");
}

function updateModeUI() {
  const isExcludeMode = excludeModeCheckbox.checked;

  modeStatusText.textContent = isExcludeMode ? "현재: 제외 모드" : "현재: 기본 모드";
  remainingText.textContent = `남은 맵: ${getAvailableMaps().length}개`;
}

function getAvailableMaps() {
  // 수동 제외 맵은 항상 빠짐
  let pool = maps.filter(map => !excludedMaps.has(map));

  // 제외 모드면 이미 나온 맵도 제외
  if (excludeModeCheckbox.checked) {
    pool = pool.filter(map => !usedMaps.includes(map));
  }

  return pool;
}

const SHUFFLE_MS = 850;   // 덱 셔플 시간
const DEAL_MS = 520;      // 카드 딜 후 뒤집기까지
const FLIP_MS = 680;      // 뒤집기 시간

function drawMap() {
  if (isDrawing) return;

  const availableMaps = getAvailableMaps();
  if (availableMaps.length === 0) {
    resultText.textContent = "모든 맵 완료!";
    return;
  }

  isDrawing = true;
  drawBtn.disabled = true;
  resetBtn.disabled = true;
  excludeModeCheckbox.disabled = true;
  resultText.textContent = "뽑는 중...";

  const pickedMap = availableMaps[Math.floor(Math.random() * availableMaps.length)];

  // 1) 덱 셔플
  cardDeckEl.classList.add("shuffling");

  setTimeout(() => {
    cardDeckEl.classList.remove("shuffling");

    // 2) 카드 한 장 딜 + 뒤집기
    const slug = mapSlug(pickedMap);
    const back = slug
      ? `<img class="draw-card-img" src="valorant_map_png/${slug}.png" alt="${pickedMap}"><span class="draw-card-name">${pickedMap}</span>`
      : `<span class="draw-card-name draw-card-name-only">${pickedMap}</span>`;

    drawStageEl.innerHTML = `
      <div class="draw-card" title="크게 보기">
        <div class="draw-card-inner">
          <div class="draw-card-face draw-card-front"><span>?</span></div>
          <div class="draw-card-face draw-card-back">${back}</div>
        </div>
      </div>
    `;

    const innerEl = drawStageEl.querySelector(".draw-card-inner");
    drawStageEl.querySelector(".draw-card")
      .addEventListener("click", () => showMapReveal(pickedMap));

    setTimeout(() => innerEl.classList.add("flipped"), DEAL_MS);

    // 3) 마무리 (기록/사용맵/모드 갱신)
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

      isDrawing = false;
      drawBtn.disabled = false;
      resetBtn.disabled = false;
      excludeModeCheckbox.disabled = false;

      if (excludeModeCheckbox.checked && usedMaps.length === maps.length) {
        resultText.textContent = `${pickedMap} (마지막 맵)`;
      }

      // 카드가 다 뒤집힌 직후 큰 리빌 팝업
      showMapReveal(pickedMap);
    }, DEAL_MS + FLIP_MS);
  }, SHUFFLE_MS);
}

// ===== 맵 결과 리빌 =====

const mapRevealEl     = document.getElementById("mapReveal");
const mapRevealImgEl  = document.getElementById("mapRevealImg");
const mapRevealNameEl = document.getElementById("mapRevealName");
const mapRevealCloseEl = document.getElementById("mapRevealClose");

function showMapReveal(mapName) {
  const slug = mapSlug(mapName);
  if (slug) {
    mapRevealImgEl.src = `valorant_map_png/${slug}.png`;
    mapRevealImgEl.alt = mapName;
    mapRevealImgEl.style.display = "";
  } else {
    mapRevealImgEl.removeAttribute("src");
    mapRevealImgEl.style.display = "none";
  }
  mapRevealNameEl.textContent = mapName;
  // 애니메이션 재시작을 위해 클래스 토글 리플로우
  mapRevealEl.classList.remove("open");
  void mapRevealEl.offsetWidth;
  mapRevealEl.classList.add("open");
  mapRevealEl.setAttribute("aria-hidden", "false");
}

function closeMapReveal() {
  mapRevealEl.classList.remove("open");
  mapRevealEl.setAttribute("aria-hidden", "true");
}

mapRevealCloseEl.addEventListener("click", closeMapReveal);
mapRevealEl.addEventListener("click", (e) => {
  if (e.target === mapRevealEl) closeMapReveal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mapRevealEl.classList.contains("open")) closeMapReveal();
});

const DRAW_HINT_HTML = `<div class="draw-hint">아래 <b>맵 뽑기</b>를 눌러<br>맵을 뽑아보세요</div>`;

function resetDraw() {
  if (isDrawing) return;

  history = [];
  usedMaps = [];
  resultText.textContent = "?";
  drawStageEl.innerHTML = DRAW_HINT_HTML;

  renderHistory();
  renderUsedMaps();
  updateModeUI();
}

drawBtn.addEventListener("click", drawMap);
resetBtn.addEventListener("click", resetDraw);
excludeModeCheckbox.addEventListener("change", updateModeUI);

// ===== 맵 제외 설정 모달 =====

const excludeMapsBtn   = document.getElementById("excludeMapsBtn");
const excludeModalEl   = document.getElementById("excludeModal");
const excludeModalCloseEl = document.getElementById("excludeModalClose");
const excludeGridEl    = document.getElementById("excludeMapGrid");
const excludeDoneBtn   = document.getElementById("excludeDoneBtn");
const excludeResetBtn  = document.getElementById("excludeResetBtn");

function renderExcludeGrid() {
  excludeGridEl.innerHTML = maps.map(m => {
    const ex = excludedMaps.has(m);
    return `
      <button class="exclude-map${ex ? " excluded" : ""}" data-map="${m}">
        <span class="exclude-map-thumb">
          <img src="valorant_map_png/${mapSlug(m)}.png" alt="">
        </span>
        <span class="exclude-map-state">${ex ? "제외됨" : "포함"}</span>
        <span class="exclude-map-name">${m}</span>
      </button>
    `;
  }).join("");

  excludeGridEl.querySelectorAll(".exclude-map").forEach(btn => {
    btn.addEventListener("click", () => {
      const m = btn.dataset.map;
      if (excludedMaps.has(m)) excludedMaps.delete(m);
      else excludedMaps.add(m);
      renderExcludeGrid();
    });
  });
}

function openExcludeModal() {
  renderExcludeGrid();
  excludeModalEl.classList.add("open");
  excludeModalEl.setAttribute("aria-hidden", "false");
}

function closeExcludeModal() {
  excludeModalEl.classList.remove("open");
  excludeModalEl.setAttribute("aria-hidden", "true");
  updateModeUI();   // 남은 맵 수 갱신
}

excludeMapsBtn.addEventListener("click", openExcludeModal);
excludeModalCloseEl.addEventListener("click", closeExcludeModal);
excludeDoneBtn.addEventListener("click", closeExcludeModal);
excludeResetBtn.addEventListener("click", () => {
  excludedMaps.clear();
  renderExcludeGrid();
});
excludeModalEl.addEventListener("click", (e) => {
  if (e.target === excludeModalEl) closeExcludeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && excludeModalEl.classList.contains("open")) closeExcludeModal();
});

renderHistory();
renderUsedMaps();
updateModeUI();

// ===== 팀짜기 =====

// Firestore roster 컬렉션에서 채워짐 (loadMembers)
let members = [];

// "다이아 1" / "초월자2" 같은 봇 표기를 "다이아1" 형태로 통일
function normalizeTier(tier) {
  return (tier || "").replace(/\s+/g, "");
}

// 티어 → 점수
const TIER_SCORE = {
  "언랭": 0,
  "아이언1": 1,  "아이언2": 2,  "아이언3": 3,
  "브론즈1": 4,  "브론즈2": 5,  "브론즈3": 6,
  "실버1": 7,    "실버2": 8,    "실버3": 9,
  "골드1": 10,   "골드2": 11,   "골드3": 12,
  "플래티넘1": 13, "플래티넘2": 14, "플래티넘3": 15,
  "다이아1": 16,  "다이아2": 17,  "다이아3": 18,   // +1씩
  "초월자1": 20,  "초월자2": 22,  "초월자3": 24,   // +2씩
  "불멸1": 26,    "불멸2": 28,    "불멸3": 30,    // +2씩
  "레디언트": 33   // +3 한 번
};

function tierScore(tier) {
  return TIER_SCORE[normalizeTier(tier)] ?? 0;
}

// Fisher-Yates 셔플 (배열을 직접 섞고 반환)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getTierClass(tier) {
  if (tier.startsWith("레디언트")) return "tier-radiant";
  if (tier.startsWith("불멸"))    return "tier-immortal";
  if (tier.startsWith("초월자"))  return "tier-ascendant";
  if (tier.startsWith("다이아"))  return "tier-diamond";
  if (tier.startsWith("플래티넘")) return "tier-platinum";
  if (tier.startsWith("골드"))    return "tier-gold";
  if (tier.startsWith("실버"))    return "tier-silver";
  if (tier.startsWith("브론즈"))  return "tier-bronze";
  if (tier.startsWith("아이언"))  return "tier-iron";
  return "tier-unranked";
}

function getPosClass(pos) {
  const map = {
    "타격대": "pos-duelist",
    "감시자": "pos-sentinel",
    "척후대": "pos-initiator",
    "전략가": "pos-controller",
    "플랙스": "pos-flex",
    "플렉스": "pos-flex"
  };
  return map[pos] || "pos-flex";
}

// 정규화 티어 → valorant_tier_png 파일 슬러그
const TIER_ICON = {
  "언랭": "unranked",
  "아이언1": "iron1", "아이언2": "iron2", "아이언3": "iron3",
  "브론즈1": "bronze1", "브론즈2": "bronze2", "브론즈3": "bronze3",
  "실버1": "silver1", "실버2": "silver2", "실버3": "silver3",
  "골드1": "gold1", "골드2": "gold2", "골드3": "gold3",
  "플래티넘1": "platinum1", "플래티넘2": "platinum2", "플래티넘3": "platinum3",
  "다이아1": "diamond1", "다이아2": "diamond2", "다이아3": "diamond3",
  "초월자1": "ascendant1", "초월자2": "ascendant2", "초월자3": "ascendant3",
  "불멸1": "immortal1", "불멸2": "immortal2", "불멸3": "immortal3",
  "레디언트": "radiant"
};

function tierIcon(tier) {
  const slug = TIER_ICON[normalizeTier(tier)];
  return slug ? `valorant_tier_png/${slug}.png` : "";
}

// 티어 아이콘 + 뱃지 묶음 HTML (표시는 공백 없는 형식으로 통일: "초월자2", "다이아2")
function tierBadgeHtml(tier) {
  const icon = tierIcon(tier);
  const img = icon ? `<img class="tier-icon" src="${icon}" alt="">` : "";
  return `${img}<span class="tier-badge ${getTierClass(tier)}">${normalizeTier(tier)}</span>`;
}

const MAX_SELECT = 10;            // 최대 선택 인원
const selectedIndices = new Set();
let activeFilter = "all";
let activeSearch = "";

const memberGridEl   = document.getElementById("memberGrid");
const memberSearchEl = document.getElementById("memberSearch");
const selectedCountEl = document.getElementById("selectedCount");
const balanceTeamBtn  = document.getElementById("balanceTeamBtn");
const randomTeamBtn   = document.getElementById("randomTeamBtn");
const manualTeamBtn   = document.getElementById("manualTeamBtn");
const manualSectionEl = document.getElementById("manualSection");
const manualMemberListEl = document.getElementById("manualMemberList");
const manualAChipsEl  = document.getElementById("manualAChips");
const manualBChipsEl  = document.getElementById("manualBChips");
const manualACountEl  = document.getElementById("manualACount");
const manualBCountEl  = document.getElementById("manualBCount");
const confirmManualBtn = document.getElementById("confirmManualBtn");
const savedBoardEl    = document.getElementById("savedBoard");
const teamResultEl    = document.getElementById("teamResult");
const teamAListEl    = document.getElementById("teamAList");
const teamBListEl    = document.getElementById("teamBList");
const teamAMetaEl    = document.getElementById("teamAMeta");
const teamBMetaEl    = document.getElementById("teamBMeta");
const copyResultBtn  = document.getElementById("copyResultBtn");
const saveResultBtn  = document.getElementById("saveResultBtn");

function getFilteredMembers() {
  return members.map((m, i) => ({ ...m, index: i })).filter(m => {
    const haystack = `${m.name} ${m.studentId || ""} ${m.riotId || ""}`.toLowerCase();
    const matchSearch = activeSearch === "" || haystack.includes(activeSearch.toLowerCase());
    let matchTier = true;
    if (activeFilter !== "all") {
      if (activeFilter === "실버이하") {
        matchTier = m.tier.startsWith("실버") || m.tier.startsWith("브론즈")
          || m.tier.startsWith("아이언") || m.tier === "언랭";
      } else if (activeFilter === "불멸") {
        matchTier = m.tier.startsWith("불멸") || m.tier.startsWith("레디언트");
      } else {
        matchTier = m.tier.startsWith(activeFilter);
      }
    }
    return matchSearch && matchTier;
  });
}

function renderMemberGrid() {
  const filtered = getFilteredMembers();

  if (filtered.length === 0) {
    memberGridEl.innerHTML = `<div class="no-results">검색 결과가 없어요.</div>`;
    return;
  }

  memberGridEl.innerHTML = filtered.map(m => {
    const isSelected = selectedIndices.has(m.index);
    const posBadges  = m.positions.map(p =>
      `<span class="pos-chip ${getPosClass(p)}">${p}</span>`
    ).join("");

    const namePrefix = m.studentId ? `${m.studentId} ` : "";

    return `
      <div class="member-card${isSelected ? " selected" : ""}" data-index="${m.index}">
        <div class="member-card-top">
          <div>
            <div class="member-name">${namePrefix}${m.name}</div>
            ${m.riotId ? `<div class="member-riot">${m.riotId}</div>` : ""}
          </div>
          <div class="check-indicator"></div>
        </div>
        <div class="member-badges">
          ${tierBadgeHtml(m.tier)}
          ${posBadges}
        </div>
      </div>
    `;
  }).join("");

  memberGridEl.querySelectorAll(".member-card").forEach(card => {
    card.addEventListener("click", () => {
      const idx = parseInt(card.dataset.index);
      // 전체를 다시 그리지 않고 누른 카드만 토글 → 그 카드의 체크 팝만 작동
      if (selectedIndices.has(idx)) {
        selectedIndices.delete(idx);
        card.classList.remove("selected");
      } else {
        if (selectedIndices.size >= MAX_SELECT) {
          flashSelectLimit();
          return;
        }
        selectedIndices.add(idx);
        card.classList.add("selected");
      }
      updateSelectedCount();
    });
  });
}

function updateSelectedCount() {
  const count = selectedIndices.size;
  selectedCountEl.textContent = `${count} / ${MAX_SELECT}명 선택됨`;
  selectedCountEl.classList.toggle("at-limit", count >= MAX_SELECT);
  const ok = count >= 2;
  balanceTeamBtn.disabled = !ok;
  randomTeamBtn.disabled  = !ok;
  manualTeamBtn.disabled  = !ok;
}

// 10명 초과 시 잠깐 경고 표시
function flashSelectLimit() {
  selectedCountEl.textContent = `최대 ${MAX_SELECT}명까지만!`;
  selectedCountEl.classList.add("limit-warn");
  clearTimeout(flashSelectLimit._t);
  flashSelectLimit._t = setTimeout(() => {
    selectedCountEl.classList.remove("limit-warn");
    updateSelectedCount();
  }, 1200);
}

function buildTeams(method) {
  const pool = [...selectedIndices].map(i => members[i]);

  if (method === "balance") {
    pool.sort((a, b) => tierScore(b.tier) - tierScore(a.tier));
  } else {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  const teamA = [], teamB = [];
  pool.forEach((member, i) => {
    // 스네이크 드래프트: A, B, B, A, A, B, B, A ...
    const round      = Math.floor(i / 2);
    const posInRound = i % 2;
    if (round % 2 === 0) {
      posInRound === 0 ? teamA.push(member) : teamB.push(member);
    } else {
      posInRound === 0 ? teamB.push(member) : teamA.push(member);
    }
  });

  return { teamA, teamB };
}

function teamScore(team) {
  return team.reduce((s, m) => s + tierScore(m.tier), 0);
}

// 팀 멤버 행들의 HTML (재사용: 결과 화면 + 모달)
function teamRowsHtml(team) {
  return team.map(m => {
    const namePrefix = m.studentId ? `${m.studentId} ` : "";
    const riot = m.riotId ? `<span class="team-member-riot">${m.riotId}</span>` : "";
    return `
    <div class="team-member-row">
      <div class="team-member-info">
        <span class="team-member-name">${namePrefix}${m.name}</span>
        ${riot}
      </div>
      <span class="team-member-tier">${tierBadgeHtml(m.tier)}</span>
    </div>
  `;
  }).join("");
}

// 팀 A/B 풀 상세 그리드 HTML (결과 화면과 동일한 모양)
function teamGridHtml(teamA, teamB) {
  const sA = teamScore(teamA), sB = teamScore(teamB);
  return `
    <div class="team-result-grid">
      <div class="team-card card">
        <div class="team-header">
          <span class="team-label team-a-color">팀 A</span>
          <span class="team-meta">${teamA.length}명 · 점수 ${sA}</span>
        </div>
        <div class="team-member-list">${teamRowsHtml(teamA)}</div>
      </div>
      <div class="team-card card">
        <div class="team-header">
          <span class="team-label team-b-color">팀 B</span>
          <span class="team-meta">${teamB.length}명 · 점수 ${sB}</span>
        </div>
        <div class="team-member-list">${teamRowsHtml(teamB)}</div>
      </div>
    </div>
  `;
}

function renderTeamList(container, team) {
  container.innerHTML = teamRowsHtml(team);
}

// 결과 복사용으로 마지막 팀 구성 보관
let lastTeams = { teamA: [], teamB: [] };

// 팀 내부를 티어 내림차순으로 정렬
function sortByTier(team) {
  return [...team].sort((a, b) => tierScore(b.tier) - tierScore(a.tier));
}

function displayTeams(teamA, teamB) {
  teamA = sortByTier(teamA);
  teamB = sortByTier(teamB);
  lastTeams = { teamA, teamB };
  const sA = teamScore(teamA), sB = teamScore(teamB);
  teamAMetaEl.textContent = `${teamA.length}명 · 점수 ${sA}`;
  teamBMetaEl.textContent = `${teamB.length}명 · 점수 ${sB}`;
  renderTeamList(teamAListEl, teamA);
  renderTeamList(teamBListEl, teamB);
  teamResultEl.classList.remove("hidden");
  teamResultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// 탭 전환
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

// 검색
memberSearchEl.addEventListener("input", () => {
  activeSearch = memberSearchEl.value.trim();
  renderMemberGrid();
});

// 티어 필터
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.tier;
    renderMemberGrid();
  });
});

// 전체 해제

document.getElementById("deselectAllBtn").addEventListener("click", () => {
  getFilteredMembers().forEach(m => selectedIndices.delete(m.index));
  renderMemberGrid();
  updateSelectedCount();
});

// 디버그: 전체 멤버 중 아무나 10명(부족하면 있는 만큼) 즉시 선택
document.getElementById("debugPick10Btn").addEventListener("click", () => {
  selectedIndices.clear();
  const pool = shuffle(members.map((_, i) => i)).slice(0, MAX_SELECT);
  pool.forEach(i => selectedIndices.add(i));
  renderMemberGrid();
  updateSelectedCount();
});

// ===== 밸런스 팀짜기: 점수차 최소인 구성 1개 (누를 때마다 새로) =====

function sumScore(ids) {
  return ids.reduce((s, i) => s + tierScore(members[i].tier), 0);
}

// A/B 순서·좌우 뒤집힘을 같은 구성으로 보는 키
function candidateKey(aIds, bIds) {
  const a = [...aIds].sort((x, y) => x - y).join(",");
  const b = [...bIds].sort((x, y) => x - y).join(",");
  return [a, b].sort().join("|");
}

// 무작위 분할을 많이 만들어, 점수차가 작은 "서로 다른" 구성들을 모음
function buildBalancedCandidates() {
  const ids = [...selectedIndices];
  const n = ids.length;
  const even = n % 2 === 0;
  const baseA = Math.floor(n / 2);
  const seen = new Map();

  for (let it = 0; it < 1200; it++) {
    const sh = shuffle([...ids]);
    // 홀수 인원이면 A/B 크기를 번갈아 (한 명 차이) → 더 다양하게
    const aSize = even ? baseA : (it % 2 === 0 ? baseA : baseA + 1);
    const aIds = sh.slice(0, aSize);
    const bIds = sh.slice(aSize);
    const diff = Math.abs(sumScore(aIds) - sumScore(bIds));
    const key = candidateKey(aIds, bIds);
    const prev = seen.get(key);
    if (!prev || diff < prev.diff) seen.set(key, { aIds, bIds, diff });
  }

  const all = [...seen.values()].sort((x, y) => x.diff - y.diff);
  if (!all.length) return [];

  // 최소 점수차 근처(밴드)만 남기되, 후보가 너무 적으면 밴드를 넓힘
  const minDiff = all[0].diff;
  let band = 6;
  let near = all.filter(c => c.diff <= minDiff + band);
  while (near.length < 6 && band < 40) {
    band += 6;
    near = all.filter(c => c.diff <= minDiff + band);
  }
  return shuffle(near);  // 누를 때마다 다른 근접 구성
}

// ===== 밸런스 후보 모달 (3가지 + 다시 짜기) =====

const balanceModalEl     = document.getElementById("balanceModal");
const balanceModalListEl = document.getElementById("balanceModalList");
const balanceModalCloseEl = document.getElementById("balanceModalClose");
const rerollBalanceBtn   = document.getElementById("rerollBalanceBtn");
const saveMinDiffBtn     = document.getElementById("saveMinDiffBtn");
const saveRandomBtn      = document.getElementById("saveRandomBtn");

let modalTrio = [];   // 현재 모달에 떠있는 3개 후보

// 저장된 구성 제외하고 근접 후보 3개 뽑기
function pickBalanceTrio() {
  const cands = buildBalancedCandidates();
  if (!cands.length) return [];
  const savedKeys = new Set(savedResults.map(r => r.key));
  const fresh = cands.filter(c =>
    !savedKeys.has(teamsKey(c.aIds.map(i => members[i]), c.bIds.map(i => members[i])))
  );
  return (fresh.length ? fresh : cands).slice(0, 3);
}

function renderModalTrio() {
  modalTrio = pickBalanceTrio();

  if (!modalTrio.length) {
    balanceModalListEl.innerHTML = `<div class="modal-empty">더 만들 수 있는 구성이 없어요.<br>저장 보드에서 몇 개 지우고 다시 시도해보세요.</div>`;
    syncFootButtons();
    return;
  }

  balanceModalListEl.innerHTML = modalTrio.map((c, idx) => {
    const teamA = sortByTier(c.aIds.map(i => members[i]));
    const teamB = sortByTier(c.bIds.map(i => members[i]));
    return `
      <div class="modal-option" style="animation-delay:${idx * 0.08}s" data-opt="${idx}">
        <div class="opt-head">
          <span class="opt-title">옵션 ${idx + 1}</span>
          <span class="opt-diff">점수차 ${c.diff}</span>
        </div>
        ${teamGridHtml(teamA, teamB)}
        <button class="primary-btn opt-save" data-opt="${idx}">이 구성 저장</button>
      </div>
    `;
  }).join("");

  balanceModalListEl.querySelectorAll(".opt-save").forEach(btn => {
    btn.addEventListener("click", () => {
      const c = modalTrio[parseInt(btn.dataset.opt)];
      if (!c) return;
      const teamA = sortByTier(c.aIds.map(i => members[i]));
      const teamB = sortByTier(c.bIds.map(i => members[i]));
      saveTeams(teamA, teamB);   // 중복/가득참은 버튼 상태로 표시
      updateModalSaveButtons();
    });
  });

  updateModalSaveButtons();
}

// 모달 저장 버튼들의 라벨/상태 갱신 (이 구성 저장 (n/5))
function updateModalSaveButtons() {
  const savedKeys = new Set(savedResults.map(r => r.key));
  const full = savedResults.length >= MAX_SAVED;

  balanceModalListEl.querySelectorAll(".opt-save").forEach(btn => {
    const c = modalTrio[parseInt(btn.dataset.opt)];
    if (!c) return;
    const key = teamsKey(c.aIds.map(i => members[i]), c.bIds.map(i => members[i]));

    if (savedKeys.has(key)) {
      btn.textContent = "✅ 저장됨";
      btn.disabled = true;
      btn.classList.add("opt-saved");
    } else if (full) {
      btn.textContent = `보드 가득참 (${savedResults.length}/${MAX_SAVED})`;
      btn.disabled = true;
      btn.classList.remove("opt-saved");
    } else {
      btn.textContent = `이 구성 저장 (${savedResults.length}/${MAX_SAVED})`;
      btn.disabled = false;
      btn.classList.remove("opt-saved");
    }
  });

  syncFootButtons();
}

// 모달 푸터의 "최저/랜덤 구성 저장" 버튼 활성/비활성 갱신
function syncFootButtons() {
  const noTrio = !modalTrio.length;
  const full = savedResults.length >= MAX_SAVED;
  [saveMinDiffBtn, saveRandomBtn].forEach(btn => {
    if (btn._flashT) return;   // 잠깐 피드백 표시 중이면 건드리지 않음
    btn.disabled = noTrio || full;
  });
}

// 모달 푸터 버튼에 잠깐 결과 메시지를 띄움
function flashFootBtn(btn, text) {
  clearTimeout(btn._flashT);
  if (btn._label === undefined) btn._label = btn.innerHTML;
  btn.innerHTML = text;
  btn.disabled = true;
  btn._flashT = setTimeout(() => {
    btn.innerHTML = btn._label;
    btn._label = undefined;
    btn._flashT = null;
    syncFootButtons();
  }, 1400);
}

// 후보 하나(c)를 보드에 저장하고 결과를 버튼에 피드백
function saveCandidate(c, btn) {
  const teamA = sortByTier(c.aIds.map(i => members[i]));
  const teamB = sortByTier(c.bIds.map(i => members[i]));
  const status = saveTeams(teamA, teamB);
  updateModalSaveButtons();
  if (status === "dup")       flashFootBtn(btn, "이미 저장된 구성!");
  else if (status === "full") flashFootBtn(btn, `최대 ${MAX_SAVED}개까지!`);
  else if (status === "ok")   flashFootBtn(btn, "✅ 저장됨!");
}

function openBalanceModal() {
  renderModalTrio();
  balanceModalEl.classList.add("open");
  balanceModalEl.setAttribute("aria-hidden", "false");
}

function closeBalanceModal() {
  balanceModalEl.classList.remove("open");
  balanceModalEl.setAttribute("aria-hidden", "true");
}

balanceTeamBtn.addEventListener("click", () => {
  manualSectionEl.classList.add("hidden");
  openBalanceModal();
});

rerollBalanceBtn.addEventListener("click", () => {
  rerollBalanceBtn.classList.add("rolling");
  renderModalTrio();
  setTimeout(() => rerollBalanceBtn.classList.remove("rolling"), 500);
});

// 위 3개 후보 중 점수차가 가장 작은 구성을 저장
saveMinDiffBtn.addEventListener("click", () => {
  if (!modalTrio.length) return;
  const best = modalTrio.reduce((a, b) => (b.diff < a.diff ? b : a));
  saveCandidate(best, saveMinDiffBtn);
});

// 위 3개 후보 중 하나를 무작위로 저장
saveRandomBtn.addEventListener("click", () => {
  if (!modalTrio.length) return;
  const pick = modalTrio[Math.floor(Math.random() * modalTrio.length)];
  saveCandidate(pick, saveRandomBtn);
});

balanceModalCloseEl.addEventListener("click", closeBalanceModal);
// 배경(딤) 클릭 시 닫기 — 박스 안쪽 클릭은 무시
balanceModalEl.addEventListener("click", (e) => {
  if (e.target === balanceModalEl) closeBalanceModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && balanceModalEl.classList.contains("open")) closeBalanceModal();
});

randomTeamBtn.addEventListener("click", () => {
  manualSectionEl.classList.add("hidden");
  const { teamA, teamB } = buildTeams("random");
  displayTeams(teamA, teamB);
});

// 직접 팀짜기
const manualAssign = {}; // index -> 'A' | 'B' | null

function openManualTeam() {
  // 선택된 멤버만 초기화 (기존 배정 유지)
  [...selectedIndices].forEach(i => {
    if (!(i in manualAssign)) manualAssign[i] = null;
  });
  Object.keys(manualAssign).forEach(k => {
    if (!selectedIndices.has(parseInt(k))) delete manualAssign[k];
  });

  teamResultEl.classList.add("hidden");
  manualSectionEl.classList.remove("hidden");
  renderManualSection();
  manualSectionEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderManualSection() {
  const aIdx = [...selectedIndices].filter(i => manualAssign[i] === "A");
  const bIdx = [...selectedIndices].filter(i => manualAssign[i] === "B");

  manualACountEl.textContent = `${aIdx.length}명`;
  manualBCountEl.textContent = `${bIdx.length}명`;

  manualAChipsEl.innerHTML = aIdx.length
    ? aIdx.map(i => `<span class="manual-chip">${members[i].name}</span>`).join("")
    : `<span class="manual-chip-empty">없음</span>`;

  manualBChipsEl.innerHTML = bIdx.length
    ? bIdx.map(i => `<span class="manual-chip">${members[i].name}</span>`).join("")
    : `<span class="manual-chip-empty">없음</span>`;

  manualMemberListEl.innerHTML = [...selectedIndices].map(i => {
    const m = members[i];
    const assigned = manualAssign[i];
    return `
      <div class="manual-row" data-index="${i}">
        <div class="manual-row-info">
          <span class="member-name">${m.studentId ? `${m.studentId} ` : ""}${m.name}</span>
          ${tierBadgeHtml(m.tier)}
        </div>
        <div class="manual-assign-btns">
          <button class="assign-btn${assigned === "A" ? " assign-active-a" : ""}" data-team="A">A팀</button>
          <button class="assign-btn${assigned === "B" ? " assign-active-b" : ""}" data-team="B">B팀</button>
        </div>
      </div>
    `;
  }).join("");

  manualMemberListEl.querySelectorAll(".assign-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx  = parseInt(btn.closest(".manual-row").dataset.index);
      const team = btn.dataset.team;
      manualAssign[idx] = manualAssign[idx] === team ? null : team;
      renderManualSection();
    });
  });

  confirmManualBtn.disabled = aIdx.length === 0 || bIdx.length === 0;
}

manualTeamBtn.addEventListener("click", openManualTeam);

confirmManualBtn.addEventListener("click", () => {
  const teamA = [...selectedIndices].filter(i => manualAssign[i] === "A").map(i => members[i]);
  const teamB = [...selectedIndices].filter(i => manualAssign[i] === "B").map(i => members[i]);
  manualSectionEl.classList.add("hidden");
  displayTeams(teamA, teamB);
});

// 결과 복사 (lastTeams 데이터 기반: 학번 이름 발로ID - 티어)
function memberLine(m) {
  const sid = m.studentId ? `${m.studentId} ` : "";
  const riot = m.riotId ? ` ${m.riotId}` : "";
  return `  ${sid}${m.name}${riot} - ${normalizeTier(m.tier)}`;
}

copyResultBtn.addEventListener("click", () => {
  const aRows = lastTeams.teamA.map(memberLine);
  const bRows = lastTeams.teamB.map(memberLine);

  const text = `팀 A (점수: ${teamAMetaEl.textContent})\n${aRows.join("\n")}\n\n팀 B (점수: ${teamBMetaEl.textContent})\n${bRows.join("\n")}`;

  navigator.clipboard.writeText(text).then(() => {
    copyResultBtn.textContent = "✅ 복사됨!";
    setTimeout(() => { copyResultBtn.textContent = "📋 결과 복사하기"; }, 2000);
  });
});

// ===== 저장 보드 (최대 5개) =====

const MAX_SAVED = 5;
let savedResults = [];   // { teamA, teamB, sA, sB, diff, key }

function flashSaveBtn(text) {
  const old = saveResultBtn.textContent;
  saveResultBtn.textContent = text;
  saveResultBtn.disabled = true;
  setTimeout(() => {
    saveResultBtn.textContent = old;
    saveResultBtn.disabled = false;
  }, 1400);
}

// 멤버 단위 고유키(학번|이름|발로ID) 기반, A/B 좌우 뒤집힘도 같은 구성으로 취급
function teamsKey(teamA, teamB) {
  const id = m => `${m.studentId}|${m.name}|${m.riotId}`;
  const a = teamA.map(id).sort().join(",");
  const b = teamB.map(id).sort().join(",");
  return [a, b].sort().join(" / ");
}

// 보드에 저장 (중복/가득참 검사). 반환: "ok" | "dup" | "full" | "empty"
function saveTeams(teamA, teamB) {
  if (!teamA.length && !teamB.length) return "empty";
  const key = teamsKey(teamA, teamB);
  if (savedResults.some(r => r.key === key)) return "dup";
  if (savedResults.length >= MAX_SAVED) return "full";
  const sA = teamScore(teamA), sB = teamScore(teamB);
  savedResults.push({ teamA, teamB, sA, sB, diff: Math.abs(sA - sB), key });
  renderSavedBoard();
  return "ok";
}

saveResultBtn.addEventListener("click", () => {
  const status = saveTeams(lastTeams.teamA, lastTeams.teamB);
  if (status === "dup")  flashSaveBtn("이미 저장된 구성!");
  else if (status === "full") flashSaveBtn(`최대 ${MAX_SAVED}개까지!`);
  else if (status === "ok")   flashSaveBtn("✅ 저장됨!");
});

function renderSavedBoard() {
  if (savedResults.length === 0) {
    savedBoardEl.classList.add("hidden");
    savedBoardEl.innerHTML = "";
    return;
  }
  savedBoardEl.classList.remove("hidden");

  const namesOf = team => team
    .map(m => `${m.studentId ? m.studentId + " " : ""}${m.name}`)
    .join(", ");

  savedBoardEl.innerHTML = `
    <div class="saved-board-head">
      <span class="saved-board-title">📋 저장된 구성</span>
      <span class="saved-board-count">${savedResults.length} / ${MAX_SAVED}</span>
    </div>
    ${savedResults.map((r, idx) => `
      <div class="saved-item card" data-idx="${idx}">
        <div class="saved-item-head">
          <span class="saved-item-title">#${idx + 1}</span>
          <span class="opt-diff">점수차 ${r.diff}</span>
        </div>
        <div class="opt-team"><span class="opt-tag team-a-color">A · ${r.teamA.length}명 · ${r.sA}점</span> ${namesOf(r.teamA)}</div>
        <div class="opt-team"><span class="opt-tag team-b-color">B · ${r.teamB.length}명 · ${r.sB}점</span> ${namesOf(r.teamB)}</div>
        <div class="saved-item-actions">
          <button class="sm-btn secondary-btn saved-load" data-idx="${idx}">불러오기</button>
          <button class="sm-btn secondary-btn saved-del" data-idx="${idx}">삭제</button>
        </div>
      </div>
    `).join("")}
  `;

  savedBoardEl.querySelectorAll(".saved-load").forEach(btn => {
    btn.addEventListener("click", () => {
      const r = savedResults[parseInt(btn.dataset.idx)];
      if (r) displayTeams(r.teamA, r.teamB);
    });
  });
  savedBoardEl.querySelectorAll(".saved-del").forEach(btn => {
    btn.addEventListener("click", () => {
      savedResults.splice(parseInt(btn.dataset.idx), 1);
      renderSavedBoard();
    });
  });
}

// ===== Firestore 연동 =====

const reloadMembersBtn = document.getElementById("reloadMembersBtn");

function showMemberMessage(msg) {
  memberGridEl.innerHTML = `<div class="no-results">${msg}</div>`;
}

// config.js의 firebaseConfig가 아직 플레이스홀더인지 검사
function isConfigReady() {
  return typeof firebaseConfig !== "undefined"
    && firebaseConfig.apiKey
    && !firebaseConfig.apiKey.startsWith("YOUR_")
    && firebaseConfig.appId
    && !firebaseConfig.appId.startsWith("YOUR_");
}

function initFirebase() {
  if (typeof firebase === "undefined") return false;
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return true;
}

// users 컬렉션 → 팀짜기용 members 배열
async function loadMembers() {
  if (!isConfigReady()) {
    showMemberMessage("⚙️ Firebase 설정이 필요해요. <code>config.js</code>의 apiKey·appId를 채워주세요.");
    return;
  }
  if (!initFirebase()) {
    showMemberMessage("Firebase SDK를 불러오지 못했어요. 인터넷 연결을 확인해주세요.");
    return;
  }

  showMemberMessage("멤버 불러오는 중...");
  if (reloadMembersBtn) reloadMembersBtn.disabled = true;

  try {
    const snap = await firebase.firestore().collection("users").get();
    const loaded = [];
    snap.forEach(doc => {
      const d = doc.data() || {};
      if (!d.name) return;
      loaded.push({
        name: d.name,
        studentId: d.student_id || "",
        riotId: d.riot_id || "",
        tier: d.tier || "언랭",
        positions: Array.isArray(d.role) ? d.role : (d.role ? [d.role] : [])
      });
    });
    loaded.sort((a, b) => tierScore(b.tier) - tierScore(a.tier));

    members = loaded;
    selectedIndices.clear();

    if (members.length === 0) {
      showMemberMessage("등록된 멤버가 없어요. 디스코드에서 <code>/기본설정</code>을 먼저 진행해주세요.");
    } else {
      renderMemberGrid();
    }
    updateSelectedCount();
  } catch (e) {
    console.error("[users] 불러오기 실패:", e);
    showMemberMessage("멤버를 불러오지 못했어요. Firestore 권한(users 읽기)과 설정을 확인해주세요.");
  } finally {
    if (reloadMembersBtn) reloadMembersBtn.disabled = false;
  }
}

if (reloadMembersBtn) {
  reloadMembersBtn.addEventListener("click", loadMembers);
}

// 초기 로드
updateSelectedCount();
loadMembers();
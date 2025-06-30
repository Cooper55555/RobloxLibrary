const petModal = document.getElementById('trade-pet-modal');
const petSearch = document.getElementById('trade-pet-search');
const petList = document.getElementById('trade-pet-list');
const confirmButton = document.getElementById('trade-confirm-selection');

const flyable = document.getElementById('trade-flyable');
const rideable = document.getElementById('trade-rideable');
const neon = document.getElementById('trade-neon');
const mega = document.getElementById('trade-mega');

const yourGrid = document.getElementById('your-grid');
const theirGrid = document.getElementById('their-grid');
const yourScoreEl = document.getElementById('your-score');
const theirScoreEl = document.getElementById('their-score');
const yourBar = document.getElementById('your-bar');
const theirBar = document.getElementById('their-bar');

const closeModalBtn = petModal.querySelector('.trade-modal-close');

let petsData = [];
let selectedCell = null;
let selectedPet = null;

const createPet = (name, baseValue, traitCombos) => ({
  name,
  displayName: name,
  image: `https://adoptmevalues.gg/_next/image?url=%2Fitems%2F${encodeURIComponent(name)}.webp&w=96&q=75`,
  baseValue,
  traitCombos
});

const fallbackPets = [
  createPet('Dog', 2, { 'F': 10, 'R': 10, 'FR': 20, 'N': 30, 'NR': 50, 'NF': 50, 'FRN': 60, 'M': 100 }),
  createPet('Cat', 2, { 'F': 10, 'R': 10, 'FR': 20, 'N': 30, 'NR': 50, 'NF': 50, 'FRN': 60, 'M': 100 }),
  createPet('Dragon', 59, { 'F': 15, 'R': 15, 'FR': 25, 'N': 100, 'NR': 150, 'NF': 150, 'FRN': 180, 'M': 300 }),
  createPet('Unicorn', 180, { 'F': 25, 'R': 25, 'FR': 40, 'N': 200, 'NR': 300, 'NF': 300, 'FRN': 350, 'M': 600 }),
];

function loadFallbackPets() {
  petsData = fallbackPets.map(pet => ({
    name: pet.name.toLowerCase(),
    displayName: pet.name,
    image: pet.image,
    baseValue: pet.baseValue,
    traitCombos: pet.traitCombos
  }));
  petsData.sort((a, b) => a.displayName.localeCompare(b.displayName));
  renderPetList('');
}

function renderPetList(filter) {
  petList.innerHTML = '';
  const filtered = petsData.filter(p => p.name.includes(filter.toLowerCase()));

  filtered.forEach(pet => {
    const li = document.createElement('li');
    li.classList.remove('selected');

    const img = document.createElement('img');
    img.src = pet.image;
    img.alt = pet.displayName;
    img.onerror = () => img.src = 'https://via.placeholder.com/50?text=No+Img';

    li.appendChild(img);
    li.appendChild(document.createTextNode(pet.displayName));

    li.onclick = () => {
      petList.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
      li.classList.add('selected');
      selectedPet = pet;
    };

    petList.appendChild(li);
  });

  if (filtered.length === 0) {
    const noRes = document.createElement('li');
    noRes.textContent = 'No pets found.';
    noRes.style.color = '#888';
    petList.appendChild(noRes);
  }
}

function openModal(cell) {
  selectedCell = cell;
  selectedPet = null;
  flyable.checked = rideable.checked = neon.checked = mega.checked = false;
  petSearch.value = '';
  renderPetList('');
  petModal.classList.add('show');
}

function closeModal() {
  petModal.classList.remove('show');
}

petSearch.addEventListener('input', () => renderPetList(petSearch.value));

// Enforce trait exclusivity
neon.addEventListener('change', () => {
  if (neon.checked) mega.checked = false;
});
mega.addEventListener('change', () => {
  if (mega.checked) neon.checked = false;
});

confirmButton.onclick = () => {
  if (!selectedPet) return alert('Please select a pet.');

  const traits = [];
  if (flyable.checked) traits.push('F');
  if (rideable.checked) traits.push('R');
  if (neon.checked) traits.push('N');
  if (mega.checked) traits.push('M');

  // Sort trait key alphabetically to ensure consistency (e.g., 'FRN', not 'NFR')
  const traitKey = traits.sort().join('');
  const comboValue = selectedPet.traitCombos[traitKey] ?? 0;

  selectedCell.innerHTML = '';

  const container = document.createElement('div');
  Object.assign(container.style, { position: 'relative', width: '100%' });
  container.dataset.baseValue = selectedPet.baseValue; // <-- set baseValue here
  container.dataset.traitValue = comboValue;
  container.dataset.traits = traitKey;

  const img = document.createElement('img');
  img.src = selectedPet.image;
  img.alt = selectedPet.displayName;
  Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'contain' });
  img.onerror = () => img.src = 'https://via.placeholder.com/80?text=No+Img';
  container.appendChild(img);

  if (traitKey) {
    const overlay = document.createElement('div');
    overlay.textContent = traitKey;
    Object.assign(overlay.style, {
      position: 'absolute',
      bottom: '2px',
      right: '4px',
      background: 'rgba(0,0,0,0.6)',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '14px',
      padding: '4px 4px',
      borderRadius: '4px',
      userSelect: 'none'
    });
    container.appendChild(overlay);
  }

  selectedCell.appendChild(container);
  selectedCell.style.color = '';
  closeModal();
  updateScores();
};

function parseTotalValue(cell) {
  const container = cell.querySelector('div');
  if (!container) return 0;

  const baseValue = Number(container.dataset.baseValue) || 0;
  const traitValue = Number(container.dataset.traitValue) || 0;

  return baseValue + traitValue;
}

let prefix = 'psu-'; // or '' for adoptme-section

function updateScores() {
  prefix = detectPrefix();

  const yourGrid = $id('your-grid');
  const theirGrid = $id('their-grid');
  const yourScoreEl = $id('your-score');
  const theirScoreEl = $id('their-score');
  const yourBar = $id('your-bar');
  const theirBar = $id('their-bar');

  console.log('prefix:', prefix);
  console.log('yourGrid children:', yourGrid.children.length);
  console.log('theirGrid children:', theirGrid.children.length);

  const yourTotal = Array.from(yourGrid.children).reduce((sum, c) => sum + parseTotalValue(c), 0);
  const theirTotal = Array.from(theirGrid.children).reduce((sum, c) => sum + parseTotalValue(c), 0);
  console.log('yourTotal:', yourTotal, 'theirTotal:', theirTotal);

  yourScoreEl.textContent = yourTotal;
  theirScoreEl.textContent = theirTotal;

  const total = yourTotal + theirTotal;

  if (total === 0) {
    yourBar.style.width = "0%";
    theirBar.style.width = "0%";
  } else {
    yourBar.style.width = `${(yourTotal / total) * 100}%`;
    theirBar.style.width = `${(theirTotal / total) * 100}%`;
  }

  const resultKey = yourTotal > theirTotal ? 'win' : yourTotal === theirTotal ? 'fair' : 'lose';

  const outcomeClass = prefix === 'psu-' ? '.psu-outcome' : '.adoptme-outcome';
  document.querySelectorAll(`${outcomeClass} .outcome-label`).forEach(el => el.classList.remove('active'));

  const resultEl = $id(resultKey);
  if (resultEl) {
    resultEl.classList.add('active');
  }
}

function $id(id) {
  return document.getElementById(prefix + id);
}

function switchSection(sectionId) {
  document.getElementById('petstarult-section').style.display = 'none';
  document.getElementById('adoptme-section').style.display = 'none';
  document.getElementById('petsim-section').style.display = 'none';

  document.getElementById(sectionId).style.display = 'block';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateScores();
    });
  });
}

function detectPrefix() {
  const psuVisible = window.getComputedStyle(document.getElementById('petstarult-section')).display !== 'none';
  const adoptMeVisible = window.getComputedStyle(document.getElementById('adoptme-section')).display !== 'none';

  if (psuVisible) return 'psu-';
  if (adoptMeVisible) return ''; // AdoptMe uses no prefix
  return '';
}

function initGrid(grid) {
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    Object.assign(cell.style, {
      cursor: 'pointer',
      fontSize: '28px',
      color: '#888',
      userSelect: 'none',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    });
    cell.textContent = '+';

    cell.onclick = () => {
      if (cell.textContent === '+') {
        openModal(cell);
      } else {
        cell.innerHTML = '+';
        cell.style.color = '#888';
        updateScores();
      }
    };

    grid.appendChild(cell);
  }
}

// Launch
loadFallbackPets();
initGrid(yourGrid);
initGrid(theirGrid);
updateScores();

function closeModalpsu() {
  petModalPsu.classList.remove("show");
}

const closeBtnpsu = document.querySelector('.modal-close-psu');
closeBtnpsu.onclick = () => closeModalpsu();

const closeBtn = document.querySelector('.modal-close');
closeBtn.onclick = () => closeModal();

const petContainer = document.getElementById('petContainer');
const searchBar = document.getElementById('searchBar');
const extraContainer = document.querySelector('.extra-container');
const petsimTitle = document.querySelector('#petsim-section > h1');
const settingsContainer = document.querySelector('#petsim-section .settings-container');

let allPets = [];
let rapData = [];

function normalize(str) {
  return (str ?? '').toString().trim().toLowerCase();
}

function extractAssetId(pet) {
  const possibleIds = [
    pet.configData?.thumbnail,
    pet.configData?.imageId,
    pet.configData?.id,
    pet.id,
  ];
  for (const idRaw of possibleIds) {
    if (!idRaw) continue;
    const idClean = idRaw.toString().trim().replace(/^rbxassetid:\/\/?/, '');
    if (/^\d+$/.test(idClean)) {
      return idClean;
    }
  }
  return null;
}

async function fetchData() {
  try {
    const [petsRes, rapRes] = await Promise.all([
      fetch('https://ps99.biggamesapi.io/api/collection/Pets'),
      fetch('https://ps99.biggamesapi.io/api/rap'),
    ]);

    const petsJson = await petsRes.json();
    const rapJson = await rapRes.json();

    rapData = rapJson.data;

    allPets = petsJson.data.map((pet) => {
      const name = pet.configName || pet.configData?.name || 'Unknown';
      const normName = normalize(name);
      const assetId = extractAssetId(pet);
      const imageUrl = assetId
        ? `https://ps99.biggamesapi.io/image/${assetId}`
        : 'https://via.placeholder.com/100';

      let rapId = null;
      if (pet.configData?.id) {
        rapId = normalize(pet.configData.id);
      } else if (pet.id) {
        rapId = normalize(pet.id.toString());
      }

      return { petId: pet.id, name, imageUrl, rawPet: pet, rapId };
    });

    showPetList();

  } catch (err) {
    console.error(err);
    petContainer.innerHTML = `<p>Error loading data: ${err.message}</p>`;
  }
}

function showLoading() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) loadingScreen.style.display = 'flex';
}

function hideLoading() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) loadingScreen.style.display = 'none';
}

async function fetchData() {

  try {
    const [petsRes, rapRes] = await Promise.all([
      fetch('https://ps99.biggamesapi.io/api/collection/Pets'),
      fetch('https://ps99.biggamesapi.io/api/rap'),
    ]);

    const petsJson = await petsRes.json();
    const rapJson = await rapRes.json();

    rapData = rapJson.data;

    allPets = petsJson.data.map((pet) => {
      const name = pet.configName || pet.configData?.name || 'Unknown';
      const normName = normalize(name);
      const assetId = extractAssetId(pet);
      const imageUrl = assetId
        ? `https://ps99.biggamesapi.io/image/${assetId}`
        : 'https://via.placeholder.com/100';

      let rapId = null;
      if (pet.configData?.id) {
        rapId = normalize(pet.configData.id);
      } else if (pet.id) {
        rapId = normalize(pet.id.toString());
      }

      return { petId: pet.id, name, imageUrl, rawPet: pet, rapId };
    });

    showPetList();

  } catch (err) {
    console.error(err);
    petContainer.innerHTML = `<p>Error loading data: ${err.message}</p>`;
  } finally {
    hideLoading(); // keep this to ensure the loading screen is hidden after data loads
  }
}

function toggleTCGSettingsModal() {
  const modal = document.getElementById("settings-modal-tcg");
  modal.classList.toggle("hidden");

  if (!modal.classList.contains("hidden")) {
    // Sync toggles or initialize modal state here
    syncToggleWithDarkMode();
  }
}

// Grab the dark mode toggle switch inside the modal
const darkModeToggleModal = document.getElementById("darkModeToggleModal");

// Initialize toggle based on saved preference
const savedDarkMode = localStorage.getItem("darkMode") === "enabled";
if (savedDarkMode) {
  document.body.classList.add("dark-mode");
  if (darkModeToggleModal) darkModeToggleModal.checked = true;
} else {
  if (darkModeToggleModal) darkModeToggleModal.checked = false;
}

// Listen for changes on the modal toggle and update dark mode accordingly
if (darkModeToggleModal) {
  darkModeToggleModal.addEventListener("change", () => {
    if (darkModeToggleModal.checked) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "enabled");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "disabled");
    }
  });
}

// Update modal toggle when opening modal to stay in sync
function syncToggleWithDarkMode() {
  if (darkModeToggleModal) {
    darkModeToggleModal.checked = document.body.classList.contains("dark-mode");
  }
}

const navButtons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('#petsim-section, #adoptme-section, #petstarult-section');

navButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    navButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const target = btn.getAttribute('data-section');
    sections.forEach((section) => {
      section.style.display = section.id === target ? 'block' : 'none';
    });

    extraContainer.style.display = 'block';

    showLoading(); // ⬅️ Show loading screen
    try {
      if (target === 'petsim-section') {
        searchBar.style.display = 'block';
        settingsContainer.style.display = 'block';
        petsimTitle.style.display = 'flex';
        await new Promise((resolve) => setTimeout(resolve, 100)); // small delay to trigger repaint
        showPetList(searchBar.value || '');
      } else {
        searchBar.style.display = 'none';
        settingsContainer.style.display = 'none';
      }
    } finally {
      hideLoading(); // ⬅️ Hide after pets loaded
    }
  });
});

searchBar.addEventListener('input', () => {
  showPetList(searchBar.value);
});

function showPetList(filter = '') {
  extraContainer.style.display = 'block';
  searchBar.style.display = 'block';
  settingsContainer.style.display = 'block';
  petsimTitle.style.display = 'flex';

  petContainer.innerHTML = '';

  const filteredPets = allPets.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  filteredPets.forEach((pet) => {
    const card = document.createElement('div');
    card.className = 'pet-card';

    const img = document.createElement('img');
    img.src = 'https://i.gifer.com/ZZ5H.gif'; // loading spinner
    img.alt = pet.name;

    const realImg = new Image();
    realImg.src = pet.imageUrl;
    realImg.onload = () => setTimeout(() => { img.src = pet.imageUrl; }, 300);
    realImg.onerror = () =>
      setTimeout(() => {
        img.src =
          'https://st4.depositphotos.com/14953852/22772/v/450/depositphotos_227725020-stock-illustration-image-available-icon-flat-vector.jpg';
      }, 300);

    const nameElem = document.createElement('h3');
    nameElem.textContent = pet.name;

    // Find RAP for normal pet (pt=0 or undefined, sh false)
    const baseId = normalize(pet.rapId || pet.name);
    const petEntries = rapData.filter(
      (entry) =>
        entry.category === 'Pet' &&
        entry.configData?.id &&
        normalize(entry.configData.id) === baseId
    );
    const normalEntry = petEntries.find((entry) => {
      const pt = entry.configData.pt;
      const sh = entry.configData.sh;
      return (pt === 0 || pt === undefined) && (!sh || sh === false);
    });

    const rap = normalEntry?.value ?? 'Unknown';

    const rapElem = document.createElement('p');
    rapElem.innerHTML = `<strong>RAP:</strong> ${
      typeof rap === 'number' ? rap.toLocaleString() : rap
    }`;

    [img, nameElem, rapElem].forEach((el) => card.appendChild(el));

    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      petsimTitle.style.display = 'none';
      settingsContainer.style.display = 'none';
      showPetDetails(pet);
    });

    petContainer.appendChild(card);
  });
}

// Sample pet data (add more as needed)
const petsDataPsu = [
  {
    name: "knightyellowchick", displayName: "Knight Yellow Chick",
    image: "./rare/knightyellowchick.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.04, "rainbow": 0.07,
    }
  },
  {
    name: "pirateaxolotl", displayName: "Pirate Axolotl",
    image: "./uncommon/pirateaxolotl.png",
    baseValue: 0.05,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.04, "rainbow": 0.07,
    }
  },
  {
    name: "firecat", displayName: "Fire Cat",
    image: "./common/firecat.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.05,
    }
  },
  {
    name: "rainypanda", displayName: "Rainy Panda",
    image: "./common/rainypanda.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.05,
    }
  },
  {
    name: "rainybee", displayName: "Rainy Bee",
    image: "./common/rainybee.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.05,
    }
  }
];

// DOM elements with psu suffix
const yourGridPsu = document.getElementById("psu-your-grid");
const theirGridPsu = document.getElementById("psu-their-grid");
const yourScoreElPsu = document.getElementById("psu-your-score");
const theirScoreElPsu = document.getElementById("psu-their-score");
const yourBarPsu = document.getElementById("psu-your-bar");
const theirBarPsu = document.getElementById("psu-their-bar");
const petModalPsu = document.getElementById("psu-trade-pet-modal");
const petListPsu = document.getElementById("psu-trade-pet-list");
const petSearchPsu = document.getElementById("psu-trade-pet-name");
const confirmButtonPsu = document.getElementById("psu-trade-confirm-selection");

// Trait radio buttons
const traitRadiosPsu = document.querySelectorAll('input[name="psu-trade-trait"]');

// Gold and Rainbow checkboxes
const goldCheckboxPsu = document.getElementById("psu-trait-gold");
const rainbowCheckboxPsu = document.getElementById("psu-trait-rainbow");

let selectedCellPsu = null;
let selectedPetPsu = null;

function renderPetListPsu(filter = "") {
  petListPsu.innerHTML = "";
  const filtered = petsDataPsu.filter(p => p.displayName.toLowerCase().includes(filter.toLowerCase()));

  filtered.forEach(pet => {
    const li = document.createElement("li");

    const img = document.createElement("img");
    img.src = pet.image;
    img.alt = pet.displayName;
    img.onerror = () => img.src = "https://via.placeholder.com/50?text=No+Img";

    li.appendChild(img);
    li.appendChild(document.createTextNode(pet.displayName));
li.onclick = () => {
  petListPsu.querySelectorAll("li").forEach(el => el.classList.remove("selected"));
  li.classList.add("selected");
  selectedPetPsu = pet;

  // Enable/disable gold checkbox
  goldCheckboxPsu.disabled = !pet.canHaveGold;
  if (!pet.canHaveGold) goldCheckboxPsu.checked = false;

  // Enable/disable rainbow checkbox
  rainbowCheckboxPsu.disabled = !pet.canHaveRainbow;
  if (!pet.canHaveRainbow) rainbowCheckboxPsu.checked = false;

  // Enable/disable serial trait radios (numbers) based on canHaveSerial
  traitRadiosPsu.forEach(radio => {
    if (!pet.canHaveSerial && !isNaN(Number(radio.value))) {
      radio.disabled = true;
      radio.checked = false;
    } else {
      radio.disabled = false;
    }
  });
};

    petListPsu.appendChild(li);
  });

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No pets found.";
    li.style.color = "#888";
    petListPsu.appendChild(li);
  }
}

function openPSUModalPsu(cell) {
  selectedCellPsu = cell;
  selectedPetPsu = null;
  traitRadiosPsu.forEach(r => {
    r.checked = false;
    r.disabled = false;   // reset disabled
  });
  goldCheckboxPsu.checked = false;
  rainbowCheckboxPsu.checked = false;
  goldCheckboxPsu.disabled = false;
  rainbowCheckboxPsu.disabled = false;
  petSearchPsu.value = "";
  renderPetListPsu();

  petModalPsu.classList.add("show");
}

function closePSUModalPsu() {
  petModalPsu.classList.remove("show");
}

petSearchPsu.addEventListener("input", () => renderPetListPsu(petSearchPsu.value));

// Prevent Gold and Rainbow both checked at the same time
goldCheckboxPsu.addEventListener("change", () => {
  if (goldCheckboxPsu.checked && rainbowCheckboxPsu.checked) {
    rainbowCheckboxPsu.checked = false;
  }
});
rainbowCheckboxPsu.addEventListener("change", () => {
  if (rainbowCheckboxPsu.checked && goldCheckboxPsu.checked) {
    goldCheckboxPsu.checked = false;
  }
});

// Only one trait can be selected at a time
traitRadiosPsu.forEach(radio => {
  radio.addEventListener("change", () => {
    traitRadiosPsu.forEach(r => {
      if (r !== radio) r.checked = false;
    });
  });
});

confirmButtonPsu.onclick = () => {
  if (!selectedPetPsu) {
    alert("Please select a pet.");
    return;
  }

  // Get selected trait radio
  const selectedTrait = [...traitRadiosPsu].find(r => r.checked);
  const traitKey = selectedTrait ? selectedTrait.value : "";

  // Compose keys for gold/rainbow depending on traitKey (e.g. gold-1, gold-200)
  let specialTraitKey = "";
  if (goldCheckboxPsu.checked) specialTraitKey = `gold`;
  else if (rainbowCheckboxPsu.checked) specialTraitKey = `rainbow`;

  const traitValue = selectedPetPsu.traitCombos[traitKey] || 0;
  const specialTraitValue = selectedPetPsu.traitCombos[specialTraitKey] || 0;

  selectedCellPsu.innerHTML = "";

  const container = document.createElement("div");
  container.style.position = "relative";
  container.dataset.baseValue = selectedPetPsu.baseValue;
  container.dataset.traitValue = traitValue + specialTraitValue;
  container.dataset.traits = [traitKey, specialTraitKey].filter(Boolean).join(",");

  const img = document.createElement("img");
  img.src = selectedPetPsu.image;
  img.alt = selectedPetPsu.displayName;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.onerror = () => img.src = "https://via.placeholder.com/80?text=No+Img";
  container.appendChild(img);

  // Add overlay for trait radio
  if (traitKey) {
    const overlay = document.createElement("div");
    overlay.textContent = `≤${traitKey}`;
    Object.assign(overlay.style, {
      position: "absolute",
      bottom: "8px",
      right: "4px",
      background: "rgba(0,0,0,0.6)",
      color: "white",
      fontWeight: "bold",
      fontSize: "14px",
      padding: "4px",
      borderRadius: "4px",
      userSelect: "none"
    });
    container.appendChild(overlay);
  }

  // Instead of an overlay div, just set background color of container
  if (specialTraitKey) {
    const displayName = specialTraitKey.split("-")[0]; // gold or rainbow
    container.style.backgroundColor = displayName === "gold" 
      ? "rgba(255,215,0,0.3)"   // translucent gold/yellow
      : "rgba(148,0,211,0.3)";  // translucent purple
  }

  selectedCellPsu.appendChild(container);
  selectedCellPsu.style.color = "";
  closePSUModalPsu();
  updateScoresPsu();
};

function parseTotalValuePsu(cell) {
  const container = cell.querySelector("div");
  if (!container) return 0;
  const base = Number(container.dataset.baseValue) || 0;
  const trait = Number(container.dataset.traitValue) || 0;
  return base + trait;
}

function updateScoresPsu() {
  const yourTotal = Array.from(yourGridPsu.children).reduce((sum, c) => sum + parseTotalValuePsu(c), 0);
  const theirTotal = Array.from(theirGridPsu.children).reduce((sum, c) => sum + parseTotalValuePsu(c), 0);

  yourScoreElPsu.textContent = yourTotal.toFixed(2);
  theirScoreElPsu.textContent = theirTotal.toFixed(2);

  const total = yourTotal + theirTotal;

  if (total === 0) {
    yourBarPsu.style.width = "0%";
    theirBarPsu.style.width = "0%";
  } else {
    yourBarPsu.style.width = `${((yourTotal / total) * 100).toFixed(2)}%`;
    theirBarPsu.style.width = `${((theirTotal / total) * 100).toFixed(2)}%`;
  }

  // Remove active only from PETSTARULT outcome labels
  document.querySelectorAll(".psu-outcome .outcome-label").forEach(el => el.classList.remove("active"));

  const result = yourTotal > theirTotal ? "win" : yourTotal === theirTotal ? "fair" : "lose";

  const resultEl = document.getElementById(`psu-${result}`);
  if (resultEl) resultEl.classList.add("active");
}

function initGridPsu(grid) {
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    Object.assign(cell.style, {
      cursor: "pointer",
      fontSize: "28px",
      color: "#888",
      userSelect: "none",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    });
    cell.textContent = "+";

    cell.onclick = () => {
      if (cell.textContent === "+") {
        openPSUModalPsu(cell);
      } else {
        cell.innerHTML = "+";
        cell.style.color = "#888";
        updateScoresPsu();
      }
    };

    grid.appendChild(cell);
  }
}

// Launch
initGridPsu(yourGridPsu);
initGridPsu(theirGridPsu);
updateScoresPsu();

function showPetDetails(pet) {
  extraContainer.style.display = 'none';
  searchBar.style.display = 'none';
  settingsContainer.style.display = 'none';
  petContainer.innerHTML = '';

  const container = document.createElement('div');
  container.style.maxWidth = '600px';
  container.style.margin = '40px auto';
  container.style.padding = '40px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.lineHeight = '1.4';

  const title = document.createElement('h1');
  title.textContent = pet.name || 'Unknown Pet';
  container.appendChild(title);

  const img = document.createElement('img');
  img.src = pet.imageUrl || 'https://via.placeholder.com/300?text=No+Image';
  img.alt = pet.name || 'Unknown Pet';
  img.style.width = '300px';
  img.style.display = 'block';
  img.style.marginBottom = '20px';
  container.appendChild(img);

  let rapHistoryEntries = [];
  if (pet.rapId) {
    rapHistoryEntries = rapData.filter(
      (item) =>
        item.category === 'Pet' &&
        item.configData?.id &&
        normalize(item.configData.id) === pet.rapId
    );
  }
  if (rapHistoryEntries.length === 0) {
    const petNormName = normalize(pet.name);
    rapHistoryEntries = rapData.filter(
      (item) =>
        item.category === 'Pet' &&
        item.configData?.id &&
        normalize(item.configData.id) === petNormName
    );
  }

  rapHistoryEntries.sort((a, b) => {
    if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
    if (a.configData?.pt !== undefined && b.configData?.pt !== undefined)
      return a.configData.pt - b.configData.pt;
    return 0;
  });

  if (
    rapHistoryEntries.length > 1 &&
    !rapHistoryEntries.some((e) => e.timestamp)
  ) {
    const now = Math.floor(Date.now() / 1000);
    const daySec = 86400;
    rapHistoryEntries = rapHistoryEntries.map((entry, i) => ({
      ...entry,
      timestamp: now - daySec * (rapHistoryEntries.length - 1 - i),
    }));
  }

  const normalHistoryEntry = rapHistoryEntries.find((e) => {
    const pt = e.configData.pt;
    const sh = e.configData.sh;
    return (pt === 0 || pt === undefined) && (!sh || sh === false);
  });
  const currentRAP =
    normalHistoryEntry?.value ??
    (rapHistoryEntries.length > 0
      ? rapHistoryEntries[rapHistoryEntries.length - 1].value
      : 'Unknown');

  const rapNow = document.createElement('p');
  rapNow.innerHTML = `<strong>Current RAP:</strong> ${
    typeof currentRAP === 'number' ? currentRAP.toLocaleString() : currentRAP
  }`;
  rapNow.style.fontSize = '18px';
  rapNow.style.marginBottom = '15px';
  container.appendChild(rapNow);

  if (rapHistoryEntries.length >= 2) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    canvas.style.border = '1px solid #ccc';
    container.appendChild(canvas);
    drawRAPHistoryGraph(canvas, rapHistoryEntries);
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    canvas.style.border = '1px solid #ccc';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Not Enough Data', canvas.width / 2, canvas.height / 2);
  }

const backBtn = document.createElement('button');
backBtn.textContent = '← Back to pets';
backBtn.style.marginTop = '30px';
backBtn.style.padding = '10px 15px';
backBtn.style.fontSize = '16px';
backBtn.style.cursor = 'pointer';
backBtn.addEventListener('click', async () => {
  showLoading(); // ⬅️ Show loading screen
  try {
    petsimTitle.style.display = 'flex';
    settingsContainer.style.display = 'block';
    await new Promise((resolve) => setTimeout(resolve, 50)); // small visual delay
    showPetList(searchBar.value);
    extraContainer.style.display = 'block';
    searchBar.style.display = 'block';
  } finally {
    hideLoading(); // ⬅️ Hide loading screen after rendering
  }
});
container.appendChild(backBtn);

  petContainer.appendChild(container);
}

function drawRAPHistoryGraph(canvas, rapHistoryEntries) {
  const ctx = canvas.getContext('2d');
  const padding = 50;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const times = rapHistoryEntries.map((e) => e.timestamp);
  const values = rapHistoryEntries.map((e) => e.value);

  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  // Axes
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Y axis
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, h - padding);
  // X axis
  ctx.lineTo(w - padding, h - padding);
  ctx.stroke();

  // Y labels & grid lines
  ctx.fillStyle = '#000';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = '12px Arial';

  const stepsY = 5;
  for (let i = 0; i <= stepsY; i++) {
    const y = padding + ((h - 2 * padding) / stepsY) * i;
    const val = Math.round(maxVal - ((maxVal - minVal) / stepsY) * i);
    ctx.fillText(val.toLocaleString(), padding - 10, y);
    ctx.strokeStyle = '#eee';
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(w - padding, y);
    ctx.stroke();
  }

  // X labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const stepsX = Math.min(5, rapHistoryEntries.length - 1);
  for (let i = 0; i <= stepsX; i++) {
    const x = padding + ((w - 2 * padding) / stepsX) * i;
    const idx = Math.round((rapHistoryEntries.length - 1) / stepsX) * i;
    const timestamp = rapHistoryEntries[Math.min(idx, rapHistoryEntries.length - 1)].timestamp;
    const date = new Date(timestamp * 1000);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    ctx.fillText(label, x, h - padding + 5);
  }

  // Plot line
  ctx.strokeStyle = '#007bff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  rapHistoryEntries.forEach((entry, i) => {
    const x = padding + ((w - 2 * padding) * (entry.timestamp - minTime)) / (maxTime - minTime);
    const y = padding + ((h - 2 * padding) * (maxVal - entry.value)) / (maxVal - minVal);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Plot points
  ctx.fillStyle = '#007bff';
  rapHistoryEntries.forEach((entry) => {
    const x = padding + ((w - 2 * padding) * (entry.timestamp - minTime)) / (maxTime - minTime);
    const y = padding + ((h - 2 * padding) * (maxVal - entry.value)) / (maxVal - minVal);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

fetchData();
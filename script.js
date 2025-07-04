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

let count = localStorage.getItem('visitorCount');
if (!count) {
    count = 0;
}

// Convert to number and increment
count = Number(count) + 1;

// Save the new count back to localStorage
localStorage.setItem('visitorCount', count);

// Show count on the page
document.getElementById('visitor-count').textContent = count;

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
  updateScores();

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
    name: "ticket", displayName: "Ticket",
    image: "./common/ticket.png",
    baseValue: 1,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "hugedarkdog", displayName: "Huge Dark Dog",
    image: "./the13th/hugedarkdog.png",
    baseValue: 2700,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: true,
    traitCombos: {
      "1": 15, "10": 7, "100": 4, "200": 2, "250": 1, "gold": 9800, "rainbow": 32300,
    }
  },
  {
    name: "hugedominusvespertillio", displayName: "Huge Dominus Vespertillio",
    image: "./limited/hugedominusvespertillio.png",
    baseValue: 120,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: true,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "hugemythicalkitsune", displayName: "Huge Mythical Kitsune",
    image: "./limited/hugemythicalkitsune.png",
    baseValue: 125,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: true,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "hugenovadragon", displayName: "Huge Nova Dragon",
    image: "./limited/hugenovadragon.png",
    baseValue: 110,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: true,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "huge1royaleye", displayName: "Huge #1 Royal Eye",
    image: "./exclusive/huge1royaleye.png",
    baseValue: 100000,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "huge10royaleye", displayName: "Huge #10 Royal Eye",
    image: "./exclusive/huge10royaleye.png",
    baseValue: 5250,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "huge25royaleye", displayName: "Huge #25 Royal Eye",
    image: "./exclusive/huge25royaleye.png",
    baseValue: 1800,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "hugepirateaxolotl", displayName: "Huge Pirate Axolotl",
    image: "./exclusive/hugepirateaxolotl.png",
    baseValue: 600,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: true,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 1700, "rainbow": 6400,
    }
  },
  {
    name: "hugecat", displayName: "Huge Cat",
    image: "./exclusive/hugecat.png",
    baseValue: 600,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: true,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 1600, "rainbow": 6400,
    }
  },
  {
    name: "hugedominusnoob", displayName: "Huge Dominus Noob",
    image: "./exclusive/hugedominusnoob.png",
    baseValue: 8500,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: true,
    traitCombos: {
      "1": 15, "10": 7, "100": 4, "200": 2, "250": 1, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "hugediamondbee", displayName: "Huge Diamond Bee",
    image: "./exclusive/hugediamondbee.png",
    baseValue: 280,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: true,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 1470, "rainbow": 5720,
    }
  },
  {
    name: "hugeskeleton", displayName: "Huge Skeleton",
    image: "./exclusive/hugeskeleton.png",
    baseValue: 300,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: true,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 1450, "rainbow": 5950,
    }
  },
  {
    name: "hugediamondcelestialdragon", displayName: "Huge Diamond Celestial Dragon",
    image: "./exclusive/hugediamondcelestialdragon.png",
    baseValue: 300,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: true,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 2200, "rainbow": 6700,
    }
  },
  {
    name: "hugeroyalcat", displayName: "Huge Royal Cat",
    image: "./exclusive/hugeroyalcat.png",
    baseValue: 250,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: true,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 1250, "rainbow": 4250,
    }
  },
  {
    name: "hugenightfallpanda", displayName: "Huge Nightfall Panda",
    image: "./exclusive/hugenightfallpanda.png",
    baseValue: 210,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: true,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "hugedragon", displayName: "Huge Dragon",
    image: "./exclusive/hugedragon.png",
    baseValue: 130,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: true,
    traitCombos: {
      "1": 10, "10": 5, "100": 3, "200": 2, "250": 1, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "royaldominus", displayName: "Royal Dominus",
    image: "./exclusive/royaldominus.png",
    baseValue: 5,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 45, "rainbow": 195,
    }
  },
  {
    name: "dominuscat", displayName: "Dominus Cat",
    image: "./exclusive/dominuscat.png",
    baseValue: 1.5,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 8.5, "rainbow": 148.5,
    }
  },
  {
    name: "dominusbunny", displayName: "Dominus Bunny",
    image: "./exclusive/dominusbunny.png",
    baseValue: 0.5,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 2.5, "rainbow": 34.5,
    }
  },
  {
    name: "themythicaldragon", displayName: "The Mythical Dragon",
    image: "./exclusive/themythicaldragon.png",
    baseValue: 0.2,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.8, "rainbow": 4.8,
    }
  },
  {
    name: "eggbee", displayName: "Egg Bee",
    image: "./exotic/eggbee.png",
    baseValue: 3,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 15, "rainbow": 75,
    }
  },
  {
    name: "boatingaxolotl", displayName: "Boating Axolotl",
    image: "./exotic/boatingaxolotl.png",
    baseValue: 1,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 5, "rainbow": 25,
    }
  },
  {
    name: "evilaxolotl", displayName: "Evil Axolotl",
    image: "./godly/evilaxolotl.png",
    baseValue: 0.1,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.1, "rainbow": 0.2,
    }
  },
  {
    name: "royaldeity", displayName: "Royal Deity",
    image: "./godly/royaldeity.png",
    baseValue: 0.09,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.09, "rainbow": 0.18,
    }
  },
  {
    name: "dominusbee", displayName: "Dominus Bee",
    image: "./mythic/dominusbee.png",
    baseValue: 0.11,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.11, "rainbow": 0.22,
    }
  },
  {
    name: "fluffycaptaincat", displayName: "Fluffy Captain Cat",
    image: "./mythic/fluffycaptaincat.png",
    baseValue: 0.1,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.1, "rainbow": 0.2,
    }
  },
  {
    name: "flamingkitsune", displayName: "Flaming Kitsune",
    image: "./mythic/flamingkitsune.png",
    baseValue: 0.09,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.09, "rainbow": 0.18,
    }
  },
  {
    name: "diamonddragon", displayName: "Diamond Dragon",
    image: "./legendary/diamonddragon.png",
    baseValue: 0.08,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.08, "rainbow": 0.16,
    }
  },
  {
    name: "stormydragon", displayName: "Stormy Dragon",
    image: "./legendary/stormydragon.png",
    baseValue: 0.06,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.06, "rainbow": 0.12,
    }
  },
  {
    name: "thelegendarydragon", displayName: "The Legendary Dragon",
    image: "./legendary/thelegendarydragon.png",
    baseValue: 0.05,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.05, "rainbow": 0.1,
    }
  },
  {
    name: "flowerbee", displayName: "Flower Bee",
    image: "./epic/flowerbee.png",
    baseValue: 0.08,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.08, "rainbow": 0.16,
    }
  },
  {
    name: "diamondkitsune", displayName: "Diamond Kitsune",
    image: "./rare/diamondkitsune.png",
    baseValue: 0.07,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.07, "rainbow": 0.14,
    }
  },
  {
    name: "pirateskeleton", displayName: "Pirate Skeleton",
    image: "./rare/pirateskeleton.png",
    baseValue: 0.06,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.06, "rainbow": 0.12,
    }
  },
  {
    name: "flamingdragon", displayName: "Flaming Dragon",
    image: "./rare/flamingdragon.png",
    baseValue: 0.05,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.05, "rainbow": 0.1,
    }
  },
  {
    name: "rainynoob", displayName: "Rainy Noob",
    image: "./rare/rainynoob.png",
    baseValue: 0.04,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.04, "rainbow": 0.08,
    }
  },
  {
    name: "knightyellowchick", displayName: "Knight Yellow Chick",
    image: "./rare/knightyellowchick.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "knightnoob", displayName: "Knight Noob",
    image: "./rare/knightnoob.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "celestialdragon", displayName: "Celestial Dragon",
    image: "./rare/celestialdragon.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "dominusvespertillio", displayName: "Dominus Vespertillio",
    image: "./rare/dominusvespertillio.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "mysticalfox", displayName: "Mystical Fox",
    image: "./rare/mysticalfox.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "ruinsdragon", displayName: "Ruins Dragon",
    image: "./rare/ruinsdragon.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "snowman", displayName: "Snowman",
    image: "./rare/snowman.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "yeti", displayName: "Yeti",
    image: "./rare/yeti.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "dominus", displayName: "Dominus",
    image: "./rare/dominus.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "sandfox", displayName: "Sand Fox",
    image: "./rare/sandfox.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "fox", displayName: "Fox",
    image: "./rare/fox.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "dragon", displayName: "Dragon",
    image: "./rare/dragon.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "diamondskeleton", displayName: "Diamond Skeleton",
    image: "./uncommon/diamondskeleton.png",
    baseValue: 0.05,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.05, "rainbow": 0.1,
    }
  },
  {
    name: "pirateaxolotl", displayName: "Pirate Axolotl",
    image: "./uncommon/pirateaxolotl.png",
    baseValue: 0.05,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.05, "rainbow": 0.1,
    }
  },
  {
    name: "royalfluffycat", displayName: "Royal Fluffy Cat",
    image: "./uncommon/royalfluffycat.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "royaldeer", displayName: "Royal Deer",
    image: "./uncommon/royaldeer.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "knightdragon", displayName: "Knight Dragon",
    image: "./uncommon/knightdragon.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "knightdog", displayName: "Knight Dog",
    image: "./uncommon/knightdog.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "nightfallpanda", displayName: "Nightfall Panda",
    image: "./uncommon/nightfallpanda.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "nightfallyellowchick", displayName: "Nightfall Yellow Chick",
    image: "./uncommon/nightfallyellowchick.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "rockdragon", displayName: "Rock Dragon",
    image: "./uncommon/rockdragon.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "stonegolem", displayName: "Stone Golem",
    image: "./uncommon/stonegolem.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "kitsune", displayName: "Kitsune",
    image: "./uncommon/kitsune.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "fluffycat", displayName: "Fluffy Cat",
    image: "./uncommon/fluffycat.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "panda", displayName: "Panda",
    image: "./uncommon/panda.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "ruinsdeer", displayName: "Ruins Deer",
    image: "./uncommon/ruinsdeer.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "ruinscat", displayName: "Ruins Cat",
    image: "./uncommon/ruinscat.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "polarbear", displayName: "Polar Bear",
    image: "./uncommon/polarbear.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "snowdragon", displayName: "Snow Dragon",
    image: "./uncommon/snowdragon.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "sandcat", displayName: "Sand Cat",
    image: "./uncommon/sandcat.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "blueaxolotl", displayName: "Blue Axolotl",
    image: "./uncommon/blueaxolotl.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "deer", displayName: "Deer",
    image: "./uncommon/deer.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "noob", displayName: "Noob",
    image: "./uncommon/noob.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "bunny", displayName: "Bunny",
    image: "./uncommon/bunny.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "firebee", displayName: "Fire Bee",
    image: "./common/firebee.png",
    baseValue: 0.05,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.05, "rainbow": 0.1,
    }
  },
  {
    name: "crimsonbee", displayName: "Crimson Bee",
    image: "./common/crimsonbee.png",
    baseValue: 0.05,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.05, "rainbow": 0.1,
    }
  },
  {
    name: "diamondgolem", displayName: "Diamond Golem",
    image: "./common/diamondgolem.png",
    baseValue: 0.04,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.04, "rainbow": 0.08,
    }
  },
  {
    name: "piratedalmatian", displayName: "Pirate Dalmatian",
    image: "./common/piratedalmatian.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "skeleton", displayName: "Skeleton",
    image: "./common/skeleton.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "firecat", displayName: "Fire Cat",
    image: "./common/firecat.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "rainypanda", displayName: "Rainy Panda",
    image: "./common/rainypanda.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "rainybee", displayName: "Rainy Bee",
    image: "./common/rainybee.png",
    baseValue: 0.03,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.03, "rainbow": 0.06,
    }
  },
  {
    name: "royalbunny", displayName: "Royal Bunny",
    image: "./common/royalbunny.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "knightcat", displayName: "Knight Cat",
    image: "./common/knightcat.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "nightfallbee", displayName: "Nightfall Bee",
    image: "./common/nightfallbee.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "rockaxolotl", displayName: "Rock Axolotl",
    image: "./common/rockaxolotl.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "pinkbee", displayName: "Pink Bee",
    image: "./common/pinkbee.png",
    baseValue: 0.02,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.02, "rainbow": 0.04,
    }
  },
  {
    name: "bee", displayName: "Bee",
    image: "./common/bee.png",
    baseValue: 0.01,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.01, "rainbow": 0.02,
    }
  },
  {
    name: "snowdog", displayName: "Snow Dog",
    image: "./common/snowdog.png",
    baseValue: 0.01,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.01, "rainbow": 0.02,
    }
  },
  {
    name: "pinkaxolotl", displayName: "Pink Axolotl",
    image: "./common/pinkaxolotl.png",
    baseValue: 0.01,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.01, "rainbow": 0.02,
    }
  },
  {
    name: "yellowchick", displayName: "Yellow Chick",
    image: "./common/yellowchick.png",
    baseValue: 0.01,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.01, "rainbow": 0.02,
    }
  },
  {
    name: "cat", displayName: "Cat",
    image: "./common/cat.png",
    baseValue: 0.01,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.01, "rainbow": 0.02,
    }
  },
  {
    name: "dog", displayName: "Dog",
    image: "./common/dog.png",
    baseValue: 0.01,
    canHaveGold: true, canHaveRainbow: true, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0.01, "rainbow": 0.02,
    }
  },
  {
    name: "dominusegg", displayName: "Dominus Egg",
    image: "./exclusive/dominusegg.png",
    baseValue: 100,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "ultimatesmoothie", displayName: "Ultimate Smoothie",
    image: "./exotic/ultimatesmoothie.png",
    baseValue: 10,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "heavenlysmoothie", displayName: "Heavenly Smoothie",
    image: "./legendary/heavenlysmoothie.png",
    baseValue: 3,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "starfruit", displayName: "Star Fruit",
    image: "./epic/starfruit.png",
    baseValue: 1,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "dragonfruit", displayName: "Dragon Fruit",
    image: "./epic/dragonfruit.png",
    baseValue: 1.5,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "gravityfruit", displayName: "Gravity Fruit",
    image: "./epic/gravityfruit.png",
    baseValue: 0.2,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "lucksmoothie", displayName: "Luck Smoothie",
    image: "./rare/lucksmoothie.png",
    baseValue: 0.3,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "diamondsmoothie", displayName: "Diamond Smoothie",
    image: "./rare/diamondsmoothie.png",
    baseValue: 0.2,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "starsmoothie", displayName: "Star Smoothie",
    image: "./rare/starsmoothie.png",
    baseValue: 0.2,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "xpsmoothie", displayName: "XP Smoothie",
    image: "./rare/xpsmoothie.png",
    baseValue: 0.001,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "honeycomb", displayName: "Honeycomb",
    image: "./common/honeycomb.png",
    baseValue: 0.003,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "coconut", displayName: "Coconut",
    image: "./common/coconut.png",
    baseValue: 0.002,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "avocado", displayName: "Avocado",
    image: "./common/avocado.png",
    baseValue: 0.002,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "volcaniccarrot", displayName: "Volcanic Carrot",
    image: "./common/volcaniccarrot.png",
    baseValue: 0.002,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "rainyapple", displayName: "Rainy Apple",
    image: "./common/rainyapple.png",
    baseValue: 0.002,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "royalapple", displayName: "Royal Apple",
    image: "./common/royalapple.png",
    baseValue: 0.003,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "crownfruit", displayName: "Crown Fruit",
    image: "./common/crownfruit.png",
    baseValue: 0.002,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "mysticalberry", displayName: "Mystical Berry",
    image: "./common/mysticalberry.png",
    baseValue: 0.0025,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "crystalgrape", displayName: "Crystal Grape",
    image: "./common/crystalgrape.png",
    baseValue: 0.0015,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "petalplum", displayName: "Petal Plum",
    image: "./common/petalplum.png",
    baseValue: 0.002,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "relicberry", displayName: "Relicberry",
    image: "./common/relicberry.png",
    baseValue: 0.001,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "snowpeach", displayName: "Snow Peach",
    image: "./common/snowpeach.png",
    baseValue: 0.002,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "dunemelon", displayName: "Dune Melon",
    image: "./common/dunemelon.png",
    baseValue: 0.001,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "acorn", displayName: "Acorn",
    image: "./common/acorn.png",
    baseValue: 0.001,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
  {
    name: "greenberry", displayName: "Green Berry",
    image: "./common/greenberry.png",
    baseValue: 0.001,
    canHaveGold: false, canHaveRainbow: false, canHaveSerial: false,
    traitCombos: {
      "1": 0, "10": 0, "100": 0, "200": 0, "250": 0, "gold": 0, "rainbow": 0,
    }
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("psu-pet-list-view-unique");
  const modal = document.getElementById("pet-list-modal");
  const openBtn = document.getElementById("open-pet-list-btn");
  const closeBtn = document.getElementById("close-pet-list-btn");
  const searchInput = document.getElementById("psu-pet-search");

  // Function to render pets filtered by search term
  function renderPetsInModal(filter = "") {
    container.innerHTML = "";
    const filteredPets = petsDataPsu.filter(pet =>
      pet.displayName.toLowerCase().includes(filter.toLowerCase())
    );

    if (filteredPets.length === 0) {
      container.innerHTML = `<p style="color:#888; text-align:center;">No pets found.</p>`;
      return;
    }

    filteredPets.forEach(pet => {
      const card = document.createElement("div");
      card.className = "psu-pet-card";

      const img = document.createElement("img");
      img.src = pet.image;
      img.alt = pet.displayName;
      img.onerror = () => img.src = "https://via.placeholder.com/80?text=No+Img";

      const info = document.createElement("div");
      info.className = "psu-pet-info";
      info.innerHTML = `
        <strong>${pet.displayName}</strong><br/>
        Base Value: ${pet.baseValue}<br/>
        Can Have Gold: ${pet.canHaveGold ? "Yes" : "No"}, Rainbow: ${pet.canHaveRainbow ? "Yes" : "No"}, Serial: ${pet.canHaveSerial ? "Yes" : "No"}
      `;

      const traitsList = document.createElement("ul");
      traitsList.className = "psu-pet-traits";
Object.entries(pet.traitCombos).forEach(([trait, comboValue]) => {
  const li = document.createElement("li");
  const displayTrait = !isNaN(Number(trait)) ? `≤${trait}` : trait;
  const val = pet.baseValue + (comboValue || 0);
  li.innerHTML = `<strong>${displayTrait}</strong>: ${val}`;
  traitsList.appendChild(li);
});

      info.appendChild(traitsList);
      card.appendChild(img);
      card.appendChild(info);
      container.appendChild(card);
    });
  }

  // Open modal handler
  openBtn.addEventListener("click", () => {
    renderPetsInModal();
    modal.style.display = "block";
    searchInput.value = "";
    searchInput.focus();
  });

  // Close modal handler
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close modal when clicking outside content
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Filter as user types
  searchInput.addEventListener("input", () => {
    renderPetsInModal(searchInput.value);
  });
});


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

const petQuantityInputPsu = document.getElementById("psu-trade-pet-quantity");

// Trait radio buttons
const traitRadiosPsu = document.querySelectorAll('input[name="psu-trade-trait"]');

// Gold and Rainbow checkboxes
const goldCheckboxPsu = document.getElementById("psu-trait-gold");
const rainbowCheckboxPsu = document.getElementById("psu-trait-rainbow");

let selectedCellPsu = null;
let selectedPetPsu = null;

function renderPetListPsu(filter = "") {
  petListPsu.innerHTML = "";

  const filtered = petsDataPsu.filter(pet => {
    const matchesName   = pet.displayName.toLowerCase()
                            .includes(filter.toLowerCase());
    const matchesRarity = psuCurrentRarity === "all"
                            || psuGetRarity(pet) === psuCurrentRarity;
    return matchesName && matchesRarity;
  });

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
  petQuantityInputPsu.value = 1; // reset quantity
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

  // Get quantity (minimum 1)
let quantity = parseInt(petQuantityInputPsu.value, 10);
if (isNaN(quantity) || quantity < 1) {
  alert("Please enter a valid quantity (1 or more).");
  return;
}
if (quantity > 1000000) {
  alert("Maximum quantity allowed is 1000000.");
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
  container.dataset.quantity = quantity;  // Store quantity

  const img = document.createElement("img");
  img.src = selectedPetPsu.image;
  img.alt = selectedPetPsu.displayName;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.onerror = () => img.src = "https://via.placeholder.com/80?text=No+Img";
  container.appendChild(img);

  // Quantity overlay
  const qtyOverlay = document.createElement("div");
  qtyOverlay.textContent = `x${quantity}`;
  Object.assign(qtyOverlay.style, {
  position: "absolute",
  top: "4px",
  left: "4px",
  background: "rgba(0,0,0,0.6)",
  color: "white",
  fontWeight: "bold",
  fontSize: "12px",                 // ✅ Smaller font, good for phones too
  padding: "2px 4px",
  borderRadius: "4px",
  userSelect: "none",
  minWidth: "70px",                 // Minimum for short text
  maxWidth: "80px",                 // Cap for long text
  width: "fit-content",
  height: "20px",                   // Compact height
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  lineHeight: "1",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box", 
  });
  container.appendChild(qtyOverlay);

  // Trait overlay
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
    fontSize: "12px",
    padding: "2px 4px",
    borderRadius: "4px",
    userSelect: "none",
    minWidth: "70px",
    maxWidth: "80px",
    width: "fit-content",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    lineHeight: "1",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    boxSizing: "border-box",
    });
    container.appendChild(overlay);
  }

  // Background color for special traits
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

function formatNumber(num) {
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    if (val < 10) return val.toFixed(2) + 'm';
    if (val < 100) return val.toFixed(1) + 'm';
    return Math.floor(val) + 'm';
  } else if (num >= 1000) {
    const val = num / 1000;
    if (val < 10) return val.toFixed(2) + 'k';
    if (val < 100) return val.toFixed(1) + 'k';
    return Math.floor(val) + 'k';
  } else {
    if (num < 10) return num.toFixed(2);
    if (num < 100) return num.toFixed(1);
    return Math.floor(num).toString();
  }
}

function parseTotalValuePsu(cell) {
  const container = cell.querySelector("div");
  if (!container) return 0;
  const base = Number(container.dataset.baseValue) || 0;
  const trait = Number(container.dataset.traitValue) || 0;
  const quantity = Number(container.dataset.quantity) || 1;
  return (base + trait) * quantity;
}

function updateScoresPsu() {
  const yourTotal = Array.from(yourGridPsu.children).reduce((sum, c) => sum + parseTotalValuePsu(c), 0);
  const theirTotal = Array.from(theirGridPsu.children).reduce((sum, c) => sum + parseTotalValuePsu(c), 0);

  yourScoreElPsu.textContent = formatNumber(yourTotal);
  theirScoreElPsu.textContent = formatNumber(theirTotal);

  const total = yourTotal + theirTotal;

  if (total === 0) {
    yourBarPsu.style.width = "0%";
    theirBarPsu.style.width = "0%";
  } else {
    yourBarPsu.style.width = `${((yourTotal / total) * 100).toFixed(2)}%`;
    theirBarPsu.style.width = `${((theirTotal / total) * 100).toFixed(2)}%`;
  }

  document.querySelectorAll(".psu-outcome .outcome-label").forEach(el => el.classList.remove("active"));

  const result = yourTotal > theirTotal ? "win" : yourTotal === theirTotal ? "fair" : "lose";

  const resultEl = document.getElementById(`psu-${result}`);
  if (resultEl) resultEl.classList.add("active");
}


function initGridPsu(grid) {
  grid.innerHTML = ""; // Clear any existing cells
  for (let i = 0; i < 27; i++) { // 3 width * 9 height = 27 cells
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

/* -------------------------  FILTER‑BUTTON SUPPORT  ------------------------ */

/** keeps track of which rarity tab is active */
let psuCurrentRarity = "all";

/** return “common”, “uncommon”, … by reading the folder name in ./<rarity>/… */
function psuGetRarity(pet) {
  // "./rare/knightyellowchick.png"  →  "rare"
  const m = pet.image.match(/\.\/([^/]+)\//);
  return m ? m[1] : "all";
}

/** add click‑handlers to every rarity button */
document.querySelectorAll(".psu-filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // 1. visual feedback
    document.querySelectorAll(".psu-filter-btn")
            .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // 2. update active filter & re‑render list
    psuCurrentRarity = btn.dataset.filter;          // "all" | "common" | …
    renderPetListPsu(petSearchPsu.value);           // reuse existing search box value
  });
});


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
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
const sections = document.querySelectorAll('#petsim-section, #adoptme-section');

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    navButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const target = btn.getAttribute('data-section');
    sections.forEach((section) => {
      section.style.display = section.id === target ? 'block' : 'none';
    });

    extraContainer.style.display = 'block';

    if (target === 'petsim-section') {
      searchBar.style.display = 'block';
      settingsContainer.style.display = 'block';
      showPetList(searchBar.value || '');
      petsimTitle.style.display = 'flex';
    } else {
      searchBar.style.display = 'none';
      settingsContainer.style.display = 'none';
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
  backBtn.addEventListener('click', () => {
    petsimTitle.style.display = 'flex';
    settingsContainer.style.display = 'block';
    showPetList(searchBar.value);
    extraContainer.style.display = 'block';
    searchBar.style.display = 'block';
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
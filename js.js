
    // --- Elements ---
    const aboutPage = document.getElementById('aboutPage');
    const loginPage = document.getElementById('loginPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const aboutToLoginBtn = document.getElementById('aboutToLogin');
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebarLinks = document.querySelectorAll('#sidebarNav .nav-link:not(.logout-link)');
    const sections = {
      currentWeather: document.getElementById('currentWeatherSection'),
      forecast: document.getElementById('forecastSection'),
      favourites: document.getElementById('favouritesSection'),
      reports: document.getElementById('reportsSection'),
      userGuide: document.getElementById('userGuideSection')
    };
    // Current Weather
    const currentWeatherForm = document.getElementById('currentWeatherForm');
    const currentLatInput = document.getElementById('currentLat');
    const currentLonInput = document.getElementById('currentLon');
    const currentWeatherContent = document.getElementById('currentWeatherContent');
    // Forecast
    const forecastForm = document.getElementById('forecastForm');
    const forecastLatInput = document.getElementById('forecastLat');
    const forecastLonInput = document.getElementById('forecastLon');
    const forecastContent = document.getElementById('forecastContent');
    // Favourites
    const favouritesList = document.getElementById('favouritesList');
    const addFavForm = document.getElementById('addFavForm');
    const favNameInput = document.getElementById('favName');
    const favLatInput = document.getElementById('favLat');
    const favLonInput = document.getElementById('favLon');
    // Reports
    const reportsContent = document.getElementById('reportsContent');
    // Contact
    const contactDevBtn = document.getElementById('contactDevBtn');
    const contactDevModal = new bootstrap.Modal(document.getElementById('contactDevModal'));
    const contactDevForm = document.getElementById('contactDevForm');
    const contactNameInput = document.getElementById('contactName');
    const contactMessageInput = document.getElementById('contactMessage');
    // --- State ---
    let db;
    // --- IndexedDB Setup ---
    const request = indexedDB.open('AnoldWeatherDB', 1);
    request.onerror = (event) => {
      showAlert('Database error: ' + event.target.errorCode, 'danger');
    };
    request.onsuccess = (event) => {
      db = event.target.result;
      preloadSampleFavourites();
      if (dashboardPage.classList.contains('d-none') === false) {
        loadFavourites();
        loadReports();
      }
    };
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains('favourites')) {
        db.createObjectStore('favourites', { keyPath: 'id', autoIncrement: true });
      }
    };
    function preloadSampleFavourites() {
      const transaction = db.transaction(['favourites'], 'readonly');
      const store = transaction.objectStore('favourites');
      store.count().onsuccess = (e) => {
        if (e.target.result === 0) {
          const transaction2 = db.transaction(['favourites'], 'readwrite');
          const store2 = transaction2.objectStore('favourites');
          store2.add({ name: 'Chitungwiza', lat: -17.9935, lon: 31.0487 });
          store2.add({ name: 'Harare', lat: -17.8292, lon: 31.0522 });
          transaction2.oncomplete = () => loadFavourites();
        }
      }
    }
    // --- Navigation ---
    aboutToLoginBtn.onclick = () => {
      aboutPage.classList.add('d-none');
      loginPage.classList.remove('d-none');
    };
    logoutBtn.onclick = () => {
      dashboardPage.classList.add('d-none');
      loginPage.classList.remove('d-none');
      clearDashboard();
    };
    sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const section = link.dataset.section;
        Object.keys(sections).forEach(key => {
          if (key === section) {
            sections[key].classList.add('active');
            sections[key].focus();
          } else {
            sections[key].classList.remove('active');
          }
        });
      });
    });
    // --- Login ---
    document.getElementById('loginForm').addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('username');
      const password = document.getElementById('password');
      if (!username.value.trim()) {
        username.classList.add('is-invalid');
        return;
      } else {
        username.classList.remove('is-invalid');
      }
      if (!password.value.trim()) {
        password.classList.add('is-invalid');
        return;
      } else {
        password.classList.remove('is-invalid');
      }
      if (username.value.trim() === 'admin' && password.value.trim() === 'admin') {
        loginPage.classList.add('d-none');
        dashboardPage.classList.remove('d-none');
        loadCurrentWeather();
        loadForecast();
        loadFavourites();
        loadReports();
      } else {
        showAlert('Incorrect username or password. Use <b>admin</b> / <b>admin</b>.', 'danger');
      }
    });
    // --- Alerts ---
    function showAlert(msg, type = 'info') {
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
      alertDiv.style.zIndex = 2000;
      alertDiv.style.maxWidth = '400px';
      alertDiv.innerHTML = `
        <i class="fas fa-info-circle me-2"></i>
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      document.body.appendChild(alertDiv);
      setTimeout(() => {
        alertDiv.classList.remove('show');
        alertDiv.classList.add('hide');
        setTimeout(() => alertDiv.remove(), 300);
      }, 6000);
    }
    window.onload = () => {
      showAlert('Welcome! Use <b>admin</b> / <b>admin</b> to login.<br>The weather dashboard is powered by <a href="https://open-meteo.com/" target="_blank" style="color:#0056b3;">Open-Meteo API</a>.', 'primary');
    };
    // --- Weather API ---
    function formatLatLon(lat, lon) {
      return `${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`;
    }
    async function loadCurrentWeather(lat = -17.9935, lon = 31.0487) {
      currentWeatherContent.innerHTML = `<div class="text-center text-primary"><i class="fas fa-spinner fa-spin"></i> Fetching data from Open-Meteo API, please wait...</div>`;
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (!data.current) throw new Error("API error");
        currentWeatherContent.innerHTML = `
          <div class="row align-items-center">
            <div class="col-3 text-center">
              <i class="fas fa-cloud-sun weather-icon" aria-hidden="true"></i>
            </div>
            <div class="col-9">
              <div><b>Lat, Lon:</b> ${formatLatLon(lat, lon)}</div>
              <div><b>Temperature:</b> ${data.current.temperature_2m}°C</div>
              <div><b>Wind:</b> ${data.current.wind_speed_10m} km/h</div>
              <div class="text-muted small">As of ${data.current.time.replace('T', ' ')}</div>
            </div>
          </div>
        `;
      } catch {
        currentWeatherContent.innerHTML = `<div class="alert alert-warning">Failed to fetch current weather from Open-Meteo API.<br>Below is sample data:</div>
          <div class="row align-items-center">
            <div class="col-3 text-center">
              <i class="fas fa-cloud-sun weather-icon" aria-hidden="true"></i>
            </div>
            <div class="col-9">
              <div><b>Lat, Lon:</b> ${formatLatLon(lat, lon)}</div>
              <div><b>Temperature:</b> 23°C</div>
              <div><b>Wind:</b> 10 km/h</div>
              <div class="text-muted small">Sample data</div>
            </div>
          </div>
        `;
      }
    }
    currentWeatherForm.addEventListener('submit', e => {
      e.preventDefault();
      const lat = currentLatInput.value || -17.9935;
      const lon = currentLonInput.value || 31.0487;
      loadCurrentWeather(lat, lon);
    });
    // --- Forecast ---
    async function loadForecast(lat = -17.9935, lon = 31.0487) {
      forecastContent.innerHTML = `<div class="text-center text-primary"><i class="fas fa-spinner fa-spin"></i> Fetching data from Open-Meteo API, please wait...</div>`;
      try {
        // Get today's date
        const today = new Date();
        const start = today.toISOString().slice(0, 10);
        // Open-Meteo supports up to 16 days, but we only show 5
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=${start}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (!data.daily || !data.daily.time) throw new Error("API error");
        // Slice first 5 days from start date
        const times = data.daily.time.slice(0, 5);
        const maxTemps = data.daily.temperature_2m_max.slice(0, 5);
        const minTemps = data.daily.temperature_2m_min.slice(0, 5);
        const precips = data.daily.precipitation_sum.slice(0, 5);
        let html = `<div class="row row-cols-1 row-cols-md-3 g-3">`;
        for (let i = 0; i < times.length; i++) {
          const dateStr = new Date(times[i]).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          html += `
            <div class="col">
              <div class="card shadow-sm h-100">
                <div class="card-body text-center d-flex flex-column justify-content-center">
                  <div class="fw-bold mb-2">${dateStr}</div>
                  <i class="fas fa-cloud-sun weather-icon mb-2"></i>
                  <div>High: <b>${maxTemps[i]}°C</b></div>
                  <div>Low: <b>${minTemps[i]}°C</b></div>
                  <div>Precip: <b>${precips[i]} mm</b></div>
                </div>
              </div>
            </div>
          `;
        }
        html += `</div>`;
        forecastContent.innerHTML = html;
      } catch {
        forecastContent.innerHTML = `<div class="alert alert-warning">Failed to fetch forecast from Open-Meteo API.<br>Below is sample data:</div>
        <div class="row row-cols-1 row-cols-md-3 g-3">
          <div class="col">
            <div class="card shadow-sm h-100">
              <div class="card-body text-center d-flex flex-column justify-content-center">
                <div class="fw-bold mb-2">Today</div>
                <i class="fas fa-cloud-sun weather-icon mb-2"></i>
                <div>High: <b>26°C</b></div>
                <div>Low: <b>15°C</b></div>
                <div>Precip: <b>0 mm</b></div>
              </div>
            </div>
          </div>
          <div class="col">
            <div class="card shadow-sm h-100">
              <div class="card-body text-center d-flex flex-column justify-content-center">
                <div class="fw-bold mb-2">Tomorrow</div>
                <i class="fas fa-cloud-sun weather-icon mb-2"></i>
                <div>High: <b>27°C</b></div>
                <div>Low: <b>16°C</b></div>
                <div>Precip: <b>1 mm</b></div>
              </div>
            </div>
          </div>
          <div class="col">
            <div class="card shadow-sm h-100">
              <div class="card-body text-center d-flex flex-column justify-content-center">
                <div class="fw-bold mb-2">Wed</div>
                <i class="fas fa-cloud-sun weather-icon mb-2"></i>
                <div>High: <b>24°C</b></div>
                <div>Low: <b>14°C</b></div>
                <div>Precip: <b>0 mm</b></div>
              </div>
            </div>
          </div>
          <div class="col">
            <div class="card shadow-sm h-100">
              <div class="card-body text-center d-flex flex-column justify-content-center">
                <div class="fw-bold mb-2">Thu</div>
                <i class="fas fa-cloud-sun weather-icon mb-2"></i>
                <div>High: <b>25°C</b></div>
                <div>Low: <b>15°C</b></div>
                <div>Precip: <b>0 mm</b></div>
              </div>
            </div>
          </div>
          <div class="col">
            <div class="card shadow-sm h-100">
              <div class="card-body text-center d-flex flex-column justify-content-center">
                <div class="fw-bold mb-2">Fri</div>
                <i class="fas fa-cloud-sun weather-icon mb-2"></i>
                <div>High: <b>26°C</b></div>
                <div>Low: <b>16°C</b></div>
                <div>Precip: <b>0 mm</b></div>
              </div>
            </div>
          </div>
        </div>
        `;
      }
    }
    forecastForm.addEventListener('submit', e => {
      e.preventDefault();
      const lat = forecastLatInput.value || -17.9935;
      const lon = forecastLonInput.value || 31.0487;
      loadForecast(lat, lon);
    });
    // --- Favourites CRUD ---
    function loadFavourites() {
      favouritesList.innerHTML = '';
      const transaction = db.transaction(['favourites'], 'readonly');
      const store = transaction.objectStore('favourites');
      store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.innerHTML = `
            <span>
              <i class="fas fa-map-marker-alt text-primary me-2"></i>
              <b>${cursor.value.name}</b>
              <span class="text-muted" style="font-size:0.95em;">(${formatLatLon(cursor.value.lat, cursor.value.lon)})</span>
            </span>
            <button class="btn btn-danger btn-sm" title="Delete" aria-label="Delete favourite location">
              <i class="fas fa-trash"></i>
            </button>
          `;
          li.querySelector('button').onclick = () => deleteFavourite(cursor.value.id);
          favouritesList.appendChild(li);
          cursor.continue();
        }
      }
    }
    function addFavourite(name, lat, lon) {
      if (!name || !lat || !lon) return;
      const transaction = db.transaction(['favourites'], 'readwrite');
      const store = transaction.objectStore('favourites');
      store.add({ name, lat: Number(lat), lon: Number(lon) });
      transaction.oncomplete = () => loadFavourites();
    }
    function deleteFavourite(id) {
      const transaction = db.transaction(['favourites'], 'readwrite');
      const store = transaction.objectStore('favourites');
      store.delete(id);
      transaction.oncomplete = () => loadFavourites();
    }
    addFavForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = favNameInput.value.trim();
      const lat = favLatInput.value;
      const lon = favLonInput.value;
      if (!name || !lat || !lon) {
        showAlert('Please enter name, latitude, and longitude.', 'warning');
        return;
      }
      addFavourite(name, lat, lon);
      favNameInput.value = '';
      favLatInput.value = '';
      favLonInput.value = '';
    });
    // --- Reports with Charts ---
    let lineChart, barChart, pieChart;
    function loadReports() {
      reportsContent.innerHTML = '<div class="text-muted">Loading reports...</div>';
      const transaction = db.transaction(['favourites'], 'readonly');
      const store = transaction.objectStore('favourites');
      const favs = [];
      store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
          favs.push(cursor.value);
          cursor.continue();
        } else {
          if (favs.length === 0) {
            reportsContent.innerHTML = '<div class="alert alert-info">No favourite locations to report.</div>';
            return;
          }
          generateReportsCharts(favs);
        }
      }
    }
    async function generateReportsCharts(favs) {
      reportsContent.innerHTML = `
        <div class="d-flex flex-wrap justify-content-center align-items-start gap-2">
          <div class="chart-card card shadow-sm p-2 mb-2">
            <h6 class="card-title text-primary mb-1" style="font-size:1rem;"><i class="fas fa-chart-line"></i> Temperature Trends</h6>
            <canvas id="lineChart" aria-label="Temperature trends line chart" role="img"></canvas>
          </div>
          <div class="chart-card card shadow-sm p-2 mb-2">
            <h6 class="card-title text-primary mb-1" style="font-size:1rem;"><i class="fas fa-chart-bar"></i> Precipitation Comparison</h6>
            <canvas id="barChart" aria-label="Precipitation comparison bar chart" role="img"></canvas>
          </div>
          <div class="chart-card card shadow-sm p-2 mb-2">
            <h6 class="card-title text-primary mb-1" style="font-size:1rem;"><i class="fas fa-chart-pie"></i> Location Distribution</h6>
            <canvas id="pieChart" aria-label="Favourite locations distribution pie chart" role="img"></canvas>
          </div>
        </div>
      `;
      // Fake weather for demo
      const labels = favs.map(f => f.name);
      const tempData = favs.map(() => Math.round(Math.random() * 15 + 15)); // 15-30°C random temps
      const precipData = favs.map(() => Math.round(Math.random() * 20)); // 0-20 mm random precipitation
      // Location distribution by hemisphere
      const hemiCounts = { "North": 0, "South": 0 };
      favs.forEach(f => {
        if (f.lat >= 0) hemiCounts["North"]++; else hemiCounts["South"]++;
      });
      const pieLabels = Object.keys(hemiCounts);
      const pieData = Object.values(hemiCounts);
      // Line Chart - Temperature Trends
      const ctxLine = document.getElementById('lineChart').getContext('2d');
      if (lineChart) lineChart.destroy();
      lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Avg Temp (°C)',
            data: tempData,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0,123,255,0.18)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5,
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
      // Bar Chart - Precipitation Comparison
      const ctxBar = document.getElementById('barChart').getContext('2d');
      if (barChart) barChart.destroy();
      barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Precipitation (mm)',
            data: precipData,
            backgroundColor: '#28a745',
            borderRadius: 5,
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
      // Pie Chart - Location Distribution by Hemisphere
      const ctxPie = document.getElementById('pieChart').getContext('2d');
      if (pieChart) pieChart.destroy();
      pieChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
          labels: pieLabels,
          datasets: [{
            label: 'Locations by Hemisphere',
            data: pieData,
            backgroundColor: ["#007bff", "#ffc107"],
            borderWidth: 1,
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'right' },
          }
        }
      });
    }
    // --- Contact Developer Button ---
    contactDevBtn.addEventListener('click', () => {
      contactDevModal.show();
    });
    contactDevForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = contactNameInput.value.trim();
      const msg = contactMessageInput.value.trim();
      if (!name) {
        contactNameInput.classList.add('is-invalid');
        return;
      } else {
        contactNameInput.classList.remove('is-invalid');
      }
      if (!msg) {
        contactMessageInput.classList.add('is-invalid');
        return;
      } else {
        contactMessageInput.classList.remove('is-invalid');
      }
      const phone = '263787702386';
      const text = encodeURIComponent(`Hello Anold Madzore, I am ${name}. Message: ${msg}`);
      const waUrl = `https://wa.me/${phone}?text=${text}`;
      window.open(waUrl, '_blank');
      contactDevModal.hide();
      contactDevForm.reset();
      showAlert('WhatsApp message window opened. Please send your message there.', 'success');
    });
    function clearDashboard() {
      currentWeatherContent.innerHTML = '';
      forecastContent.innerHTML = '';
      favouritesList.innerHTML = '';
      reportsContent.innerHTML = '';
      currentLatInput.value = '-17.9935';
      currentLonInput.value = '31.0487';
      forecastLatInput.value = '-17.9935';
      forecastLonInput.value = '31.0487';
    }
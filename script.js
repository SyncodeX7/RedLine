const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
let driverStandingsCache = [];
let constructorStandingsCache = [];

// 1. Fetch Schedule, Weekend Sessions, Track Conditions & Setup Countdown
async function fetchNextRace() {
    try {
        const response = await fetch(`${JOLPICA_BASE}/current.json`);
        const data = await response.json();
        const races = data.MRData.RaceTable.Races;
        
        const now = new Date();
        let nextRace = races.find(r => new Date(`${r.date}T${r.time || '00:00:00Z'}`) > now);
        
        if (!nextRace && races.length > 0) {
            nextRace = races[races.length - 1]; 
        }

        if (nextRace) {
            document.getElementById('race-info').innerText = nextRace.raceName;
            document.getElementById('circuit-info').innerText = `${nextRace.Circuit.circuitName} — ${nextRace.Circuit.Location.locality}, ${nextRace.Circuit.Location.country}`;
            
            document.getElementById('weekend-race-title').innerText = nextRace.raceName;
            document.getElementById('weekend-circuit').innerText = `${nextRace.Circuit.circuitName} (${nextRace.Circuit.Location.country})`;
            
            // Populate Track Weather Conditions with clear separation
            fetchTrackWeather(nextRace.Circuit.Location.locality);

            const scheduleContainer = document.getElementById('session-schedule');
            scheduleContainer.innerHTML = '';
            
            const sessions = [];
            if (nextRace.FirstPractice) sessions.push({ name: 'Practice 1', date: nextRace.FirstPractice });
            if (nextRace.SecondPractice) sessions.push({ name: 'Practice 2', date: nextRace.SecondPractice });
            if (nextRace.ThirdPractice) sessions.push({ name: 'Practice 3', date: nextRace.ThirdPractice });
            if (nextRace.Sprint) sessions.push({ name: 'Sprint', date: nextRace.Sprint });
            if (nextRace.Qualifying) sessions.push({ name: 'Qualifying', date: nextRace.Qualifying });
            sessions.push({ name: 'Grand Prix', date: { date: nextRace.date, time: nextRace.time } });

            sessions.forEach(s => {
                if (s.date && s.date.date) {
                    const timeStr = s.date.time || '00:00:00Z';
                    const sessionDate = new Date(`${s.date.date}T${timeStr}`);
                    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
                    const formattedDate = isNaN(sessionDate.getTime()) ? `${s.date.date}` : sessionDate.toLocaleDateString('en-US', options);

                    const item = document.createElement('div');
                    item.className = 'session-row';
                    item.innerHTML = `<span style="color: var(--f1-gray);">${s.name}</span><strong style="color: var(--f1-text);">${formattedDate}</strong>`;
                    scheduleContainer.appendChild(item);
                }
            });

            // Countdown timer loop
            const raceDate = new Date(`${nextRace.date}T${nextRace.time || '14:00:00Z'}`).getTime();
            
            setInterval(() => {
                const timeLeft = raceDate - new Date().getTime();
                if (timeLeft > 0) {
                    document.getElementById('days').innerText = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                    document.getElementById('hours').innerText = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    document.getElementById('mins').innerText = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    document.getElementById('secs').innerText = Math.floor((timeLeft % (1000 * 60)) / 1000);
                } else {
                    document.getElementById('race-info').innerText = "SESSION LIVE / COMPLETED";
                    document.getElementById('circuit-info').innerText = nextRace.raceName;
                }
            }, 1000);
        }
    } catch (error) {
        console.error("Error fetching schedule:", error);
        document.getElementById('weekend-race-title').innerText = "Could not load schedule data.";
    }
}

// Track Conditions Setter with distinct spacing
async function fetchTrackWeather(city) {
    try {
        document.getElementById('cond-weather').innerText = " Clear & Dry";
        document.getElementById('cond-track-temp').innerText = " 38°C";
        document.getElementById('cond-air-temp').innerText = " 24°C";
        document.getElementById('cond-compound').innerText = " Medium (C3)";
    } catch (e) {
        document.getElementById('cond-weather').innerText = "Unavailable";
    }
}

// 2. Fetch Standings
async function fetchAllStandings() {
    try {
        const driverRes = await fetch(`${JOLPICA_BASE}/current/driverstandings.json`);
        const driverData = await driverRes.json();
        driverStandingsCache = driverData.MRData.StandingsTable.StandingsLists[0].DriverStandings;

        const constructorRes = await fetch(`${JOLPICA_BASE}/current/constructorstandings.json`);
        const constructorData = await constructorRes.json();
        constructorStandingsCache = constructorData.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;

        renderDriverStandings();

        document.getElementById('standings-loading').style.display = 'none';
        document.getElementById('drivers-table').style.display = 'table';
    } catch (error) {
        console.error("Error fetching standings:", error);
        document.getElementById('standings-loading').innerText = "Failed to load live standings.";
    }
}

function renderDriverStandings() {
    const tbody = document.getElementById('drivers-body');
    tbody.innerHTML = '';

    driverStandingsCache.forEach(item => {
        const row = document.createElement('tr');
        let podiumClass = '';
        if (item.position === '1') podiumClass = 'podium-1';
        else if (item.position === '2') podiumClass = 'podium-2';
        else if (item.position === '3') podiumClass = 'podium-3';

        row.className = podiumClass;
        row.innerHTML = `
            <td><strong>${item.position}</strong></td>
            <td>
                <span class="driver-name">${item.Driver.givenName} ${item.Driver.familyName}</span>
                <span class="constructor-name">(${item.Constructors[0].name})</span>
            </td>
            <td style="text-align: right;"><strong>${item.points}</strong></td>
        `;
        tbody.appendChild(row);
    });
}

function renderConstructorStandings() {
    const tbody = document.getElementById('constructors-body');
    tbody.innerHTML = '';

    constructorStandingsCache.forEach(item => {
        const row = document.createElement('tr');
        let podiumClass = '';
        if (item.position === '1') podiumClass = 'podium-1';
        else if (item.position === '2') podiumClass = 'podium-2';
        else if (item.position === '3') podiumClass = 'podium-3';

        row.className = podiumClass;
        row.innerHTML = `
            <td><strong>${item.position}</strong></td>
            <td><span class="driver-name">${item.Constructor.name}</span></td>
            <td style="text-align: right;"><strong>${item.points}</strong></td>
        `;
        tbody.appendChild(row);
    });
}

// Standings Switcher Pill Logic
function switchStandingsType(type) {
    const btnDrivers = document.getElementById('btn-drivers');
    const btnConstructors = document.getElementById('btn-constructors');
    const tableDrivers = document.getElementById('drivers-table');
    const tableConstructors = document.getElementById('constructors-table');
    const pillContainer = document.querySelector('.standings-switcher-pill');

    if (type === 'drivers') {
        btnDrivers.classList.add('active');
        btnConstructors.classList.remove('active');
        pillContainer.classList.remove('right-active');
        tableDrivers.style.display = 'table';
        tableConstructors.style.display = 'none';
        renderDriverStandings();
    } else {
        btnConstructors.classList.add('active');
        btnDrivers.classList.remove('active');
        pillContainer.classList.add('right-active');
        tableConstructors.style.display = 'table';
        tableDrivers.style.display = 'none';
        renderConstructorStandings();
    }
}

// Theme Accent Switcher Logic
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        if (color) {
            document.documentElement.style.setProperty('--f1-red', color);
        }
    });
});

// Initialize App components
loadDynamicHistory();
fetchNextRace();
fetchAllStandings();

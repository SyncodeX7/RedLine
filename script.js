const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';

// 1. Fetch Schedule and Setup Countdown
async function fetchNextRace() {
    try {
        const response = await fetch(`${JOLPICA_BASE}/current.json`);
        const data = await response.json();
        const races = data.MRData.RaceTable.Races;
        
        const now = new Date();
        let nextRace = races.find(r => new Date(`${r.date}T${r.time || '00:00:00Z'}`) > now);
        
        // Fallback to the final race if the season has concluded
        if (!nextRace && races.length > 0) {
            nextRace = races[races.length - 1]; 
        }

        if (nextRace) {
            document.getElementById('race-info').innerText = nextRace.raceName;
            document.getElementById('circuit-info').innerText = `${nextRace.Circuit.circuitName} — ${nextRace.Circuit.Location.locality}, ${nextRace.Circuit.Location.country}`;
            
            const raceDate = new Date(`${nextRace.date}T${nextRace.time || '14:00:00Z'}`).getTime();
            
            // Run countdown loop
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
        document.getElementById('race-info').innerText = "Could not load schedule data.";
    }
}

// 2. Fetch Driver Standings from Jolpica
async function fetchStandings() {
    try {
        const response = await fetch(`${JOLPICA_BASE}/current/driverstandings.json`);
        const data = await response.json();
        const standings = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
        
        const tbody = document.getElementById('standings-body');
        tbody.innerHTML = '';

        standings.forEach(item => {
            const row = document.createElement('tr');
            
            // Add custom podium highlight classes for top 3
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

        document.getElementById('standings-loading').style.display = 'none';
        document.getElementById('standings-table').style.display = 'table';
    } catch (error) {
        console.error("Error fetching standings:", error);
        document.getElementById('standings-loading').innerText = "Failed to load live standings.";
    }
}

// Initialize App calls
fetchNextRace();
fetchStandings();

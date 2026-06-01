let playersData = [];
let currentView = 'leaderboard';

async function loadStats() {
    document.getElementById('last-updated-text').textContent = 'Fetching stats...';
    document.getElementById('leaderboard-body').innerHTML = '<tr><td colspan="8" class="loading">Loading stats...</td></tr>';
    document.getElementById('player-cards-grid').innerHTML = '';

    try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        if (data.error) {
            showError(data.error);
            return;
        }

        playersData = parseStats(data);
        renderOverviewCards();
        renderCurrentView();

        const now = new Date();
        document.getElementById('last-updated-text').textContent =
            `Last updated: ${now.toLocaleTimeString()}`;

    } catch (err) {
        showError('Failed to connect to server.');
    }
}

function parseStats(data) {
    const members = data.memberStats?.members || [];
    const players = [];

    for (const stats of members) {
        players.push({
            name: stats.proName || stats.name,
            gamesPlayed: parseInt(stats.gamesPlayed) || 0,
            goals: parseInt(stats.goals) || 0,
            assists: parseInt(stats.assists) || 0,
            motm: parseInt(stats.manOfTheMatch) || 0,
            avgRating: parseFloat(stats.ratingAve) || 0,
            gAndA: (parseInt(stats.goals) || 0) + (parseInt(stats.assists) || 0),
            winRate: parseInt(stats.winRate) || 0,
            shotSuccess: parseInt(stats.shotSuccessRate) || 0,
            passSuccess: parseInt(stats.passSuccessRate) || 0,
            proOverall: parseInt(stats.proOverall) || 0,
            position: stats.favoritePosition || 'unknown'
        });
    }

    return players;
}

function renderOverviewCards() {
    const total = playersData.length;
    const totalGoals = playersData.reduce((sum, p) => sum + p.goals, 0);
    const totalAssists = playersData.reduce((sum, p) => sum + p.assists, 0);
    const totalMotm = playersData.reduce((sum, p) => sum + p.motm, 0);
    const avgRating = playersData.length
        ? (playersData.reduce((sum, p) => sum + p.avgRating, 0) / playersData.length).toFixed(2)
        : '--';

    document.getElementById('total-members').textContent = total;
    document.getElementById('total-goals').textContent = totalGoals;
    document.getElementById('total-assists').textContent = totalAssists;
    document.getElementById('total-motm').textContent = totalMotm;
    document.getElementById('avg-rating').textContent = avgRating;
}

function getSortedPlayers() {
    const sortBy = document.getElementById('sort-by').value;
    return [...playersData].sort((a, b) => b[sortBy] - a[sortBy]);
}

function renderCurrentView() {
    if (currentView === 'leaderboard') {
        renderLeaderboard();
    } else {
        renderPlayerCards();
    }
}

function switchView(view) {
    currentView = view;

    const leaderboardView = document.getElementById('table-container') ||
        document.querySelector('.table-container');
    const cardsView = document.getElementById('cards-view');
    const btnLeaderboard = document.getElementById('btn-leaderboard');
    const btnCards = document.getElementById('btn-cards');

    if (view === 'leaderboard') {
        leaderboardView.style.display = 'block';
        cardsView.style.display = 'none';
        btnLeaderboard.classList.add('active');
        btnCards.classList.remove('active');
        renderLeaderboard();
    } else {
        leaderboardView.style.display = 'none';
        cardsView.style.display = 'block';
        btnLeaderboard.classList.remove('active');
        btnCards.classList.add('active');
        renderPlayerCards();
    }
}

function renderLeaderboard() {
    const sorted = getSortedPlayers();
    const tbody = document.getElementById('leaderboard-body');

    if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No player data found.</td></tr>';
        return;
    }

    tbody.innerHTML = sorted.map((player, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';
        const ratingClass = player.avgRating >= 8.0
            ? 'rating-green'
            : player.avgRating >= 7.0
            ? 'rating-amber'
            : 'rating-red';

        return `
            <tr>
                <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                <td class="player-name">${player.name}</td>
                <td>${player.gamesPlayed}</td>
                <td>${player.goals}</td>
                <td>${player.assists}</td>
                <td>${player.gAndA}</td>
                <td>${player.motm}</td>
                <td class="${ratingClass}">${player.avgRating.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}

function renderPlayerCards() {
    const sorted = getSortedPlayers();
    const grid = document.getElementById('player-cards-grid');

    if (sorted.length === 0) {
        grid.innerHTML = '<p class="loading">No player data found.</p>';
        return;
    }

    grid.innerHTML = sorted.map(player => {
        const ratingClass = player.avgRating >= 8.0
            ? 'rating-green'
            : player.avgRating >= 7.0
            ? 'rating-amber'
            : 'rating-red';

        return `
            <div class="player-card">
                <div class="player-card-header">
                    <div>
                        <div class="player-card-name">${player.name}</div>
                        <div class="player-card-position">${player.position}</div>
                    </div>
                    <div class="player-card-ovr">
                        <div class="player-card-ovr-value">${player.proOverall}</div>
                        <div class="player-card-ovr-label">OVR</div>
                    </div>
                </div>

                <div class="player-card-rating ${ratingClass}">${player.avgRating.toFixed(2)}</div>
<div style="text-align: center; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; margin-bottom: 12px;">Avg Rating</div>

                <div class="player-card-stats">
                    <div class="player-card-stat">
                        <div class="player-card-stat-value">${player.gamesPlayed}</div>
                        <div class="player-card-stat-label">Games</div>
                    </div>
                    <div class="player-card-stat">
                        <div class="player-card-stat-value">${player.goals}</div>
                        <div class="player-card-stat-label">Goals</div>
                    </div>
                    <div class="player-card-stat">
                        <div class="player-card-stat-value">${player.assists}</div>
                        <div class="player-card-stat-label">Assists</div>
                    </div>
                    <div class="player-card-stat">
                        <div class="player-card-stat-value">${player.motm}</div>
                        <div class="player-card-stat-label">MOTM</div>
                    </div>
                </div>

                <div class="player-card-percentages">
                    <div class="player-card-pct">
                        <div class="player-card-pct-value">${player.winRate}%</div>
                        <div class="player-card-pct-label">Win Rate</div>
                    </div>
                    <div class="player-card-pct">
                        <div class="player-card-pct-value">${player.passSuccess}%</div>
                        <div class="player-card-pct-label">Pass %</div>
                    </div>
                    <div class="player-card-pct">
                        <div class="player-card-pct-value">${player.shotSuccess}%</div>
                        <div class="player-card-pct-label">Shot %</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showError(message) {
    document.getElementById('leaderboard-body').innerHTML =
        `<tr><td colspan="8" class="error">⚠️ ${message}</td></tr>`;
    document.getElementById('last-updated-text').textContent = 'Failed to fetch stats';
}

// Load stats on page load
loadStats();

// Auto-refresh data when sort changes
document.getElementById('sort-by').addEventListener('change', renderCurrentView);
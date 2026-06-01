const REAL_NAMES = {
    'L. Bubes': 'Seaner',
    'Dark': 'Jake',
    'XL Lap Hog': 'Jamie',
    'Buckets': 'Dave',
    'J. Honerface': 'Kringledick',
    'TUG': 'Kyle'
};

let playersData = [];
let currentView = 'leaderboard';
let allMatches = [];
let filteredMatches = [];
let visibleMatchCount = 5;
let currentMatchFilter = 'all';

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
        populateCompareDropdowns();
        populateCompareDropdowns();
        allMatches = parseMatches(data);
        filteredMatches = allMatches;
        renderMatchLogs();

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

const compareView = document.getElementById('compare-view');
const btnCompare = document.getElementById('btn-compare');

leaderboardView.style.display = 'none';
cardsView.style.display = 'none';
compareView.style.display = 'none';
btnLeaderboard.classList.remove('active');
btnCards.classList.remove('active');
btnCompare.classList.remove('active');

if (view === 'leaderboard') {
    leaderboardView.style.display = 'block';
    btnLeaderboard.classList.add('active');
    renderLeaderboard();
} else if (view === 'cards') {
    cardsView.style.display = 'block';
    btnCards.classList.add('active');
    renderPlayerCards();
} else if (view === 'compare') {
    compareView.style.display = 'block';
    btnCompare.classList.add('active');
    populateCompareDropdowns();
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

function populateCompareDropdowns() {
    const select1 = document.getElementById('compare-player1');
    const select2 = document.getElementById('compare-player2');

    const options = playersData.map(p =>
        `<option value="${p.name}">${p.name}</option>`
    ).join('');

    select1.innerHTML = '<option value="">Select Player 1</option>' + options;
    select2.innerHTML = '<option value="">Select Player 2</option>' + options;
}

function renderComparison() {
    const p1Name = document.getElementById('compare-player1').value;
    const p2Name = document.getElementById('compare-player2').value;
    const result = document.getElementById('compare-result');

    if (!p1Name || !p2Name) {
        result.innerHTML = '';
        return;
    }

    if (p1Name === p2Name) {
        result.innerHTML = '<p class="loading">Select two different players!</p>';
        return;
    }

    const p1 = playersData.find(p => p.name === p1Name);
    const p2 = playersData.find(p => p.name === p2Name);

    const stats = [
        { label: 'Games Played', key: 'gamesPlayed' },
        { label: 'Goals', key: 'goals' },
        { label: 'Assists', key: 'assists' },
        { label: 'G+A', key: 'gAndA' },
        { label: 'MOTM', key: 'motm' },
        { label: 'Avg Rating', key: 'avgRating', decimal: true },
        { label: 'Win Rate %', key: 'winRate' },
        { label: 'Pass %', key: 'passSuccess' },
        { label: 'Shot %', key: 'shotSuccess' },
        { label: 'OVR', key: 'proOverall' }
    ];

    let p1Wins = 0;
    let p2Wins = 0;

    const rows = stats.map(stat => {
        const v1 = p1[stat.key];
        const v2 = p2[stat.key];
        const display1 = stat.decimal ? v1.toFixed(2) : v1;
        const display2 = stat.decimal ? v2.toFixed(2) : v2;

        let class1 = '';
        let class2 = '';

let check1 = '';
let check2 = '';

if (v1 > v2) {
    class1 = 'compare-winner';
    class2 = 'compare-loser';
    check1 = ' ✓';
    p1Wins++;
} else if (v2 > v1) {
    class2 = 'compare-winner';
    class1 = 'compare-loser';
    check2 = '✓ ';
    p2Wins++;
}

return `
    <tr>
        <td class="${class1}" style="position:relative;">
            ${display1}
            ${v1 > v2 ? '<span class="compare-check">✓</span>' : ''}
        </td>
        <td class="stat-label">${stat.label}</td>
        <td class="${class2}" style="position:relative;">
            ${v2 > v1 ? '<span class="compare-check-left">✓</span>' : ''}
            ${display2}
        </td>
    </tr>
`;
    }).join('');

    const loser = p1Wins >= p2Wins ? p2 : p1;
    const winner = p1Wins >= p2Wins ? p1 : p2;
    const loserRealName = REAL_NAMES[loser.name] || loser.name;
    const winnerRealName = REAL_NAMES[winner.name] || winner.name;

    result.innerHTML = `
        <table class="compare-table">
            <thead>
                <tr>
                    <th>${p1.name}</th>
                    <th class="stat-label">Stat</th>
                    <th>${p2.name}</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="compare-banter">
            <span>${loserRealName}</span> is definitively worse than <span>${winnerRealName}</span>
        </div>
    `;
}

function parseMatches(data) {
    const league = (data.matches?.league || []).map(m => ({ ...m, matchType: 'League' }));
    const playoff = (data.matches?.playoff || []).map(m => ({ ...m, matchType: 'Playoff' }));
    return [...league, ...playoff].sort((a, b) => b.timestamp - a.timestamp);
}

function filterMatches(filter) {
    currentMatchFilter = filter;
    visibleMatchCount = 5;

    document.getElementById('btn-all-matches').classList.remove('active');
    document.getElementById('btn-league-matches').classList.remove('active');
    document.getElementById('btn-playoff-matches').classList.remove('active');
    document.getElementById(`btn-${filter}-matches`).classList.add('active');

    if (filter === 'all') {
        filteredMatches = allMatches;
    } else {
        filteredMatches = allMatches.filter(m => m.matchType.toLowerCase() === filter);
    }

    renderMatchLogs();
}

function loadMoreMatches() {
    visibleMatchCount += 5;
    renderMatchLogs();
}

function toggleMatchDetails(matchId) {
    const details = document.getElementById(`details-${matchId}`);
    const icon = document.getElementById(`icon-${matchId}`);
    details.classList.toggle('open');
    icon.classList.toggle('open');
}

function renderMatchLogs() {
    const container = document.getElementById('match-logs-container');
    const loadMoreContainer = document.getElementById('load-more-container');
    const visible = filteredMatches.slice(0, visibleMatchCount);

    if (visible.length === 0) {
        container.innerHTML = '<p class="loading">No matches found.</p>';
        loadMoreContainer.style.display = 'none';
        return;
    }

    container.innerHTML = visible.map(match => {
        const clubData = match.clubs['110106'];
        if (!clubData) return '';

        const goalsFor = parseInt(clubData.goals) || 0;
        const goalsAgainst = parseInt(clubData.goalsAgainst) || 0;
        const result = clubData.result === '1' || clubData.wins === '1' ? 'win'
            : clubData.ties === '1' ? 'tie' : 'loss';
        const resultLabel = result === 'win' ? 'W' : result === 'tie' ? 'D' : 'L';

        const opponentId = Object.keys(match.clubs).find(id => id !== '110106');
        const opponentName = match.clubs[opponentId]?.details?.name || 'Unknown';

        const date = new Date(match.timestamp * 1000);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeAgo = match.timeAgo ? `${match.timeAgo.number} ${match.timeAgo.unit} ago` : dateStr;

        const players = match.players?.['110106'] || {};
        const playerRows = Object.values(players).map(p => {
            const passAttempts = parseInt(p.passattempts) || 0;
            const passesMade = parseInt(p.passesmade) || 0;
            const passSuccessRate = passAttempts > 0 ? Math.round((passesMade / passAttempts) * 100) : 0;
            const isMotm = p.mom === '1' || p.mom === 1;

            return `
                <tr>
                    <td class="${isMotm ? 'motm-highlight' : ''}">${p.playername}${isMotm ? ' ⭐' : ''}</td>
                    <td>${p.pos || '--'}</td>
                    <td>${p.goals || 0}</td>
                    <td>${p.assists || 0}</td>
                    <td class="${parseFloat(p.rating) >= 8.0 ? 'rating-green' : parseFloat(p.rating) >= 7.0 ? 'rating-amber' : 'rating-red'}">${parseFloat(p.rating || 0).toFixed(2)}</td>
                    <td>${p.shots || 0}</td>
                    <td>${passAttempts}</td>
                    <td>${passesMade}</td>
                    <td>${passSuccessRate}%</td>
                </tr>
            `;
        }).join('');

        return `
            <div class="match-row">
                <div class="match-summary" onclick="toggleMatchDetails('${match.matchId}')">
                    <div>
                        <span class="match-result-badge ${result}">${resultLabel}</span>
                        <div class="match-opponent" style="margin-top: 6px;">vs ${opponentName}</div>
                    </div>
                    <div class="match-score">
                        ${goalsFor} - ${goalsAgainst}
                        <span class="match-expand-icon" id="icon-${match.matchId}">▾</span>
                    </div>
                    <div class="match-meta">
                        <div class="match-type-badge">${match.matchType}</div>
                        <div>${timeAgo}</div>
                    </div>
                </div>
                <div class="match-details" id="details-${match.matchId}">
                    <table class="match-details-table">
                        <thead>
                            <tr>
                                <th>Player</th>
                                <th>Position</th>
                                <th>Goals</th>
                                <th>Assists</th>
                                <th>Rating</th>
                                <th>Shots</th>
                                <th>Pass Att</th>
                                <th>Pass Made</th>
                                <th>Pass %</th>
                            </tr>
                        </thead>
                        <tbody>${playerRows}</tbody>
                    </table>
                </div>
            </div>
        `;
    }).join('');

    loadMoreContainer.style.display = visibleMatchCount < filteredMatches.length ? 'block' : 'none';
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
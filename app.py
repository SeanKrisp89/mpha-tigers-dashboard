from flask import Flask, render_template, jsonify, request
import requests
import pymssql
import os

app = Flask(__name__)

CLUB_ID = "110106"
PLATFORM = "common-gen5"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://proclubstracker.com/"
}

def get_db_connection():
    password = os.environ.get('DB_PASSWORD')
    print(f"DB_PASSWORD present: {bool(password)}")
    if not password:
        return None
    try:
        conn = pymssql.connect(
            server='mpha-tigers-server.database.windows.net',
            user='mphaadmin',
            password=password,
            database='mpha-tigers-db'
        )
        print("DB connection successful!")
        return conn
    except Exception as e:
        print(f"DB connection failed: {e}")
        return None

def fetch_club_data():
    url = f"https://proclubstracker.com/api/clubs/{CLUB_ID}?platform={PLATFORM}"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    return response.json()

def save_snapshots(members):
    conn = get_db_connection()
    if not conn:
        print("No DB connection, skipping snapshot.")
        return

    cursor = conn.cursor()

    for stats in members:
        name = stats.get("proName") or stats.get("name")
        games_played = int(stats.get("gamesPlayed") or 0)
        goals = int(stats.get("goals") or 0)
        assists = int(stats.get("assists") or 0)
        motm = int(stats.get("manOfTheMatch") or 0)
        avg_rating = float(stats.get("ratingAve") or 0)
        win_rate = int(stats.get("winRate") or 0)
        pass_success = int(stats.get("passSuccessRate") or 0)
        shot_success = int(stats.get("shotSuccessRate") or 0)
        pro_overall = int(stats.get("proOverall") or 0)
        position = stats.get("favoritePosition") or "unknown"

        try:
            cursor.execute("""
                SELECT TOP 1 games_played, goals, assists, motm, avg_rating
                FROM player_snapshots
                WHERE player_name = %s
                ORDER BY snapshot_date DESC
            """, (name,))
        except Exception as e:
            print(f"Query failed for {name}: {e}")
            continue

        last = cursor.fetchone()

        if last is None or (
            last[0] != games_played or
            last[1] != goals or
            last[2] != assists or
            last[3] != motm or
            round(last[4], 2) != round(avg_rating, 2)
        ):
            cursor.execute("""
                INSERT INTO player_snapshots
                (player_name, games_played, goals, assists, motm, avg_rating,
                 win_rate, pass_success, shot_success, pro_overall, position)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (name, games_played, goals, assists, motm, avg_rating,
                 win_rate, pass_success, shot_success, pro_overall, position))
            print(f"Snapshot saved for {name}")
        else:
            print(f"No changes for {name}, skipping.")

    conn.commit()
    cursor.close()
    conn.close()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/stats")
def stats():
    try:
        data = fetch_club_data()
        members = data.get("memberStats", {}).get("members", [])
        save_snapshots(members)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/stats/historical")
def historical_stats():
    from_date = request.args.get('from')
    to_date = request.args.get('to')

    if not from_date or not to_date:
        return jsonify({"error": "Missing from or to date"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "No database connection"}), 500

    try:
        cursor = conn.cursor()

        cursor.execute("SELECT DISTINCT player_name FROM player_snapshots")
        players = [row[0] for row in cursor.fetchall()]

        results = []

        for player in players:
            cursor.execute("""
                SELECT TOP 1 games_played, goals, assists
                FROM player_snapshots
                WHERE player_name = %s AND CAST(snapshot_date AS DATE) < %s
                ORDER BY snapshot_date DESC
            """, (player, from_date))
            from_snap = cursor.fetchone()

            cursor.execute("""
                SELECT TOP 1 games_played, goals, assists
                FROM player_snapshots
                WHERE player_name = %s AND CAST(snapshot_date AS DATE) <= %s
                ORDER BY snapshot_date DESC
            """, (player, to_date))
            to_snap = cursor.fetchone()

            if not to_snap:
                continue

            from_games = from_snap[0] if from_snap else 0
            from_goals = from_snap[1] if from_snap else 0
            from_assists = from_snap[2] if from_snap else 0

            games = to_snap[0] - from_games
            goals = to_snap[1] - from_goals
            assists = to_snap[2] - from_assists

            if games <= 0 and goals <= 0 and assists <= 0:
                continue

            results.append({
                "name": player,
                "gamesPlayed": games,
                "goals": goals,
                "assists": assists,
                "gAndA": goals + assists,
                "goalsPerGame": round(goals / games, 2) if games > 0 else 0,
                "assistsPerGame": round(assists / games, 2) if games > 0 else 0,
            })

        cursor.close()
        conn.close()

        return jsonify({"players": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
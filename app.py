from flask import Flask, render_template, jsonify
import requests

app = Flask(__name__)

CLUB_ID = "110106"
PLATFORM = "common-gen5"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://proclubstracker.com/"
}

def fetch_club_data():
    url = f"https://proclubstracker.com/api/clubs/{CLUB_ID}?platform={PLATFORM}"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    return response.json()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/stats")
def stats():
    try:
        data = fetch_club_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
from flask import Flask, request, redirect, session, jsonify
from flask_cors import CORS
import requests
import os
import time
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Initialize Flask application
app = Flask(__name__)
CORS(app, supports_credentials=True)

# Set secret key for session management and retrieve Spotify credentials
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your_secret_key')
CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
REDIRECT_URI = 'https://monthlywrap.onrender.com/callback'

# Define required Spotify API scopes
SCOPE = 'user-read-recently-played user-top-read'


##########################
# OAuth Authentication   #
##########################

@app.route('/login')
def login():
    """
    Redirects the user to Spotify's authorization page 
    to authenticate and grant the required permissions.
    """
    auth_url = (
        'https://accounts.spotify.com/authorize'
        '?response_type=code'
        f'&client_id={CLIENT_ID}'
        f'&scope={SCOPE}'
        f'&redirect_uri={REDIRECT_URI}'
        '&state=123'  # In production, generate a secure random state.
    )
    return redirect(auth_url)

@app.route('/callback')
def callback():
    """
    Handles the OAuth callback from Spotify. Retrieves 
    an access token using the authorization code.
    """
    code = request.args.get('code')
    error = request.args.get('error')
    if error:
        return f"Error: {error}"
    
    token_url = 'https://accounts.spotify.com/api/token'
    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    response = requests.post(token_url, data=payload, headers=headers)
    token_info = response.json()
    
    print("Token response from Spotify:", token_info)  # Debugging information

    if 'error' in token_info:
        return f"Error fetching token: {token_info.get('error_description', token_info['error'])}"
    
    # Store token information with a timestamp
    token_info['created_at'] = int(time.time())
    session['token_info'] = token_info
    return redirect('http://localhost:3000')


@app.route('/user-info')
def user_info():
    """
    Retrieves the authenticated user's Spotify profile information, 
    including their display name.
    """
    access_token = get_token()
    if not access_token:
        return jsonify({'error': 'Not authenticated'}), 401

    url = 'https://api.spotify.com/v1/me'
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(url, headers=headers)
    user_data = response.json()

    # Extract the display name (fallback to 'User' if not available)
    display_name = user_data.get('display_name', 'User')
    return jsonify({'display_name': display_name})


def get_token():
    """
    Retrieves the current access token from the session.
    If the token is expired, it attempts to refresh it.
    """
    token_info = session.get('token_info', None)
    if not token_info:
        return None

    # Ensure the token contains expiration info
    if 'expires_in' not in token_info:
        print("Token info is missing 'expires_in':", token_info)
        return None
    
    now = int(time.time())
    
    # Check if the token is about to expire and refresh it if necessary
    if token_info['expires_in'] + token_info.get('created_at', now) - now < 60:
        refresh_url = 'https://accounts.spotify.com/api/token'
        payload = {
            'grant_type': 'refresh_token',
            'refresh_token': token_info['refresh_token'],
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
        }
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        response = requests.post(refresh_url, data=payload, headers=headers)
        new_token_info = response.json()

        if 'error' in new_token_info:
            print("Error refreshing token:", new_token_info)
            return None
        
        # Preserve the refresh token and update session storage
        new_token_info['refresh_token'] = token_info['refresh_token']
        new_token_info['created_at'] = int(time.time())
        session['token_info'] = new_token_info
        return new_token_info.get('access_token')
    
    return token_info.get('access_token')


##########################
# API Endpoint: Top Tracks #
##########################

@app.route('/top-tracks')
def top_tracks():
    """
    Fetches the user's top tracks from Spotify within the last 4 weeks.
    The number of tracks returned is based on the 'limit' query parameter.
    """
    access_token = get_token()
    if not access_token:
        return jsonify({'error': 'Not authenticated'}), 401

    # Retrieve the limit from query parameters, defaulting to 5 tracks
    limit = request.args.get('limit', default=5, type=int)
    
    # Enforce a maximum of 10 tracks
    if limit > 10:
        limit = 10

    # Fetch user's top tracks (short-term history from Spotify API)
    url = f'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit={limit}'
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(url, headers=headers)
    data = response.json()

    # Extract relevant track details
    top_tracks = []
    for item in data.get('items', []):
        top_tracks.append({
            'name': item.get('name'),
            'artists': [artist.get('name') for artist in item.get('artists', [])],
            'album_image': item.get('album', {}).get('images', [{}])[0].get('url')
        })

    return jsonify(top_tracks)


##########################
# Run the Application    #
##########################

if __name__ == '__main__':
    # Start the Flask application on localhost port 8080
    app.run(debug=True, host='localhost', port=8080)

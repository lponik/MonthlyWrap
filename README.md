# Monthly Spotify Top Tracks Dashboard

A full-stack web application that retrieves and displays a user's monthly top tracks from Spotify using Flask and React. Currently, this project is designed to work locally.

## Prerequisites

- Python 3.x
- Node.js and npm
- A Spotify Developer account (to obtain client credentials)

## Setup Instructions

1. **Backend Setup:**
   - Navigate to the backend directory:
     ```bash
     cd backend
     ```
   - Install required Python packages:
     ```bash
     pip install -r requirements.txt
     ```
   - Create a `.env` file with your Spotify credentials and Flask secret key:
     ```
     FLASK_SECRET_KEY=your_secret_key
     SPOTIFY_CLIENT_ID=your_spotify_client_id
     SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
     ```
   - Start the Flask application:
     ```bash
     python app.py
     ```

2. **Frontend Setup:**
   - In a new terminal, navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the React application:
     ```bash
     npm start
     ```

## Running the Project

- Open your browser and navigate to:  
  [http://localhost:8080/login](http://localhost:8080/login)
- Sign in with your Spotify account.
- Upon successful authentication, you'll be redirected to the frontend to view your monthly top tracks.

## Project Overview

This application demonstrates integration with the Spotify API using OAuth 2.0 for secure authentication. It features a Flask-based backend that manages API requests and token handling, alongside a React-based frontend for a responsive user interface and smooth transitions.

Feel free to explore, customize, and expand upon this project for your personal or academic use. Enjoy your Monthly Spotify Top Tracks Dashboard!

# Security Bot Project

A brief description of the Security Bot project, explaining its purpose and goals. (e.g., A system for monitoring and managing security robots via a web interface and API).

## Features

- List key features of the application.
- e.g., Real-time robot status monitoring.
- e.g., Robot mission control (start/stop).
- e.g., User authentication and authorization.
- e.g., Data visualization (if applicable).
- e.g., Simulation capabilities.

## Tech Stack

- **Backend:** Python, FastAPI
- **Frontend:** JavaScript, React, Material UI
- **Databases:**
  - MySQL (for primary application data)
  - MongoDB (for simulation data or logs)
- **Authentication:** JWT (JSON Web Tokens)
- **Environment Management:** Python Virtual Environment (`venv`), Node Package Manager (`npm` or `yarn`)

## Project Structure

```
security-bot/
├── .env                     # Backend environment variables
│   ├── DB_USERNAME
│   ├── DB_PASSWORD
│   ├── DB_HOST
│   ├── DB_PORT
│   ├── DB_NAME
│   ├── SECRET_KEY
│   ├── ACCESS_TOKEN_EXPIRE_MINUTES
│   ├── ALGORITHM
│   ├── MONGODB_USERNAME
│   ├── MONGODB_PASSWORD
│   ├── MONGODB_CLUSTER
│   ├── MONGODB_DATABASE
│   └── MONGODB_COLLECTION
│
├── frontend/
│   ├── .env                # Frontend environment variables
│   │   ├── MONGODB_URI
│   │   ├── MONGODB_DATABASE
│   │   ├── MONGODB_COLLECTION
│   │   ├── SERVER_PORT
│   │   ├── REACT_APP_API_URL
│   │   └── REACT_APP_VNC_URL
│   │
│   ├── node_modules/       # Node.js dependencies (gitignored)
│   ├── public/            # Static files
│   ├── src/              # React source code
│   ├── package.json      # Node.js dependencies manifest
│   └── server.js         # Node.js server for MongoDB
│
├── routes/               # FastAPI backend
│   ├── __init__.py
│   ├── main.py          # FastAPI entry point
│   ├── models/          # Database models
│   ├── routers/         # API routes
│   ├── schemas/         # Pydantic schemas
│   ├── crud/           # Database operations
│   └── utils/          # Helper functions
│
├── botvenv/            # Python virtual environment (gitignored)
├── requirements.txt    # Python dependencies
├── .gitignore         # Git ignore rules
└── README.md          # Project documentation
```

## Setup and Installation

### Prerequisites

- Python 3.8+
- Node.js 14+ and npm/yarn
- MySQL Server
- MongoDB (Atlas or local instance)
- Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd security-bot
```

### 2. Backend Setup (FastAPI)

```bash
# Create and activate a Python virtual environment
python3 -m venv botvenv
source botvenv/bin/activate  # On Windows use `botvenv\Scripts\activate`

# Install Python dependencies
pip install -r requirements.txt

# Configure Backend Environment Variables
# Copy/rename .env.example to .env (if you have an example file)
# Or create .env in the project root directory
cp .env.example .env # If applicable
# Edit .env and fill in your database credentials, secret key, etc.
# Example .env content:
# DB_USERNAME=your_mysql_user
# DB_PASSWORD=your_mysql_password
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_NAME=security-bot
# SECRET_KEY=your_strong_secret_key
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=30
# MONGODB_USERNAME=your_mongo_user # If backend uses MongoDB
# MONGODB_PASSWORD=your_mongo_password
# MONGODB_CLUSTER=your_mongo_cluster
# MONGODB_DATABASE=your_mongo_db
# MONGODB_COLLECTION=your_mongo_collection

# Create database tables (if using SQLAlchemy models)
# The application might do this on startup, or you might need a separate script.
# Check routes/main.py or database setup logic.

# Run the FastAPI development server
uvicorn routes.main:app --reload --port 8000
```

### 3. Frontend Setup (React)

```bash
# Navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install  # or yarn install

# Configure Frontend Environment Variables
# Copy/rename .env.example to .env (if you have an example file)
# Or create .env in the frontend directory
cp .env.example .env # If applicable
# Edit .env and fill in your API URL, VNC URL, MongoDB URI etc.
# Example .env content:
# REACT_APP_API_URL=http://localhost:8000
# REACT_APP_VNC_URL=http://localhost:6080 # If applicable
# MONGODB_URI=mongodb+srv://... # If server.js uses MongoDB
# SERVER_PORT=3001 # If running server.js

# Start the React development server
npm start  # or yarn start

# If using the frontend/server.js for specific tasks:
# node server.js # Run this in a separate terminal 
```

## Usage

1.  Ensure the backend server is running (usually on `http://localhost:8000`).
2.  Ensure the frontend development server is running (usually on `http://localhost:3000`).
3.  Open your web browser and navigate to `http://localhost:3000`.
4.  Log in or register to use the application features.

### API Documentation

The FastAPI backend provides automatic interactive API documentation. Once the backend server is running, you can access it at:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## Configuration

Environment variables are used for configuration.

- **Backend:** Managed via the `.env` file in the project root. See `routes/config.py` (or similar) for details on variables used.
- **Frontend:** Managed via the `.env` file in the `frontend` directory. Variables prefixed with `REACT_APP_` are accessible in the React code. The `server.js` file (if used) also reads variables from this file.


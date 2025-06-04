# CARLA Security Bot: Visualization & Data Pipeline

This project uses the CARLA simulator to visualize sensor data and collect vehicle telemetry, which is then stored in MongoDB for analysis.

---

## 📦 Components

### 1. `security_bot.py`
Main script that:
- Connects to CARLA and spawns a vehicle with sensors (RGB, Depth, Semantic Segmentation, LIDAR).
- Displays a 4-panel OpenCV dashboard:
  - RGB with HUD (speed, controls, etc.)
  - Semantic segmentation (night vision-style)
  - Depth map
  - LIDAR Bird’s Eye View (BEV)
- Streams visualization to a web page via Flask.
- Shows real-time 3D LIDAR with Open3D.
- Logs vehicle telemetry (position, velocity, controls, timestamps) into `stream.json`.
- Configurable via CLI arguments (host, sensors, duration, etc.).

### 2. `stream.json`
- Stores telemetry data collected by `security_bot.py`.
- JSON array of snapshots (each with location, speed, rotation, and control input).
- Overwritten on each new run.

### 3. `req.txt`
- Lists Python packages used by `security_bot.py`.
- Can be installed using:
  ```bash
  pip install -r req.txt
  ```
> _Note: May include unnecessary packages. Consider creating a cleaner `requirements.txt`._

### 4. MongoDB Import
Use `mongoimport` to load `stream.json` into MongoDB:
```bash
mongoimport --uri "mongodb+srv://mwaseandy1:<YOUR_DB_PASSWORD>@botcluster.rwq71d1.mongodb.net/" \
  --db carla_stream --collection security_bot_data --file stream.json --jsonArray --drop
```
> Replace `<YOUR_DB_PASSWORD>` with your actual password.

---

## ⚙️ Setup & Run Instructions

### 1. **Install Requirements**
- Python 3.7+
- CARLA (e.g., v0.9.15)
- MongoDB Atlas or local MongoDB
- `mongoimport` tool installed

### 2. **Create & Activate Virtual Environment**
```bash
cd /path/to/project
python3 -m venv .venv
source .venv/bin/activate  # For Windows: .\.venv\Scripts\activate
pip install -r req.txt
```

### 3. **Start CARLA Simulator**
```bash
./CarlaUE4.sh  # Or with -opengl / -vulkan / -RenderOffScreen options
```
Wait for the map to load. Keep terminal open.

### 4. **Run the Script**
```bash
python3 security_bot.py --host <CARLA_HOST_IP>
```
- If running on the same machine: `--host 127.0.0.1`
- Adjust other CLI options as needed

### 5. **Import to MongoDB**
After the script finishes: Create a free cluster, connect to it and import data into it. 
```bash
mongoimport --uri "mongodb+srv://<USER_NAME>:<YOUR_DB_PASSWORD>@botcluster.rwq71d1.mongodb.net/" \
  --db carla_stream --collection security_bot_data --file stream.json --jsonArray --drop
```

### 6. **Cleanup (Optional)**
```bash
deactivate  # Exit virtual environment
Ctrl+C      # To stop CARLA if running in terminal
```

---

## ✅ Summary

This pipeline:
1. Spawns a simulated vehicle with sensors in CARLA.
2. Visualizes data in real-time via OpenCV, Open3D, and Flask.
3. Logs telemetry to `stream.json`.
4. Imports data to MongoDB for further analysis.


#!/usr/bin/env python

"""
Security Bot - Advanced CARLA Visualization System

This script provides a comprehensive visualization interface for CARLA simulation,
combining multiple sensor inputs into an integrated security monitoring system.

Features:
- 4-panel display showing RGB, Night Vision, Depth, and LIDAR views
- Real-time 3D LIDAR visualization with Open3D
- Vehicle telemetry HUD overlay
- Support for both standard and semantic LIDAR
- Synchronized sensor data collection
- Configurable sensor parameters
- Spawning of additional NPC vehicles and static obstacles
- Car detection using semantic segmentation
- Saving of RGB frames to MongoDB upon car detection
"""

import os
import sys
import argparse
import time
from datetime import datetime, timedelta
import random
import numpy as np
from matplotlib import cm
import open3d as o3d
import cv2 # Import OpenCV
import queue # Import queue for sensor data
import traceback # For error reporting
from flask import Flask, Response
import threading
import json
import math

# --- MongoDB Integration ---
try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure
    from bson.binary import Binary
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False
    print("Warning: pymongo library not found. MongoDB integration will be disabled.")
    print("Install with: pip install pymongo")

# Add at the top of the file, after imports
# os.environ['DISPLAY'] = ':1'  # Use VNC display (Uncomment if running in a headless environment with VNC)

# --- Import CARLA Module ---
try:
    import carla
    print(f"Imported CARLA module: {carla.__file__}")
except ImportError:
    print("*"*80)
    print("Error: Failed to import the 'carla' module.")
    print("Please ensure the CARLA Python API is installed (e.g., 'pip install carla')")
    print("or that the path to the CARLA egg file/PythonAPI directory is")
    print("included in your PYTHONPATH environment variable.")
    print("*"*80)
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred during CARLA import: {e}")
    sys.exit(1)


# --- Constants and Colormaps ---
WINDOW_WIDTH = 1920
WINDOW_HEIGHT = 1080

VIRIDIS = np.array(cm.get_cmap('plasma').colors)
VID_RANGE = np.linspace(0.0, 1.0, VIRIDIS.shape[0])

LABEL_COLORS = np.array([
    (0, 0, 0),         # 0 Unlabeled
    (70, 70, 70),      # 1 Building
    (100, 40, 40),     # 2 Fence
    (55, 90, 80),      # 3 Other
    (220, 20, 60),     # 4 Pedestrian
    (153, 153, 153),   # 5 Pole
    (157, 234, 50),    # 6 RoadLine
    (128, 64, 128),    # 7 Road
    (244, 35, 232),    # 8 Sidewalk
    (107, 142, 35),    # 9 Vegetation
    (0, 0, 142),       # 10 Vehicle <--- This is the tag for vehicles
    (102, 102, 156),   # 11 Wall
    (220, 220, 0),     # 12 TrafficSign
    (70, 130, 180),    # 13 Sky
    (81, 0, 81),       # 14 Ground
    (150, 100, 100),   # 15 Bridge
    (230, 150, 140),   # 16 RailTrack
    (180, 165, 180),   # 17 GuardRail
    (250, 170, 30),    # 18 TrafficLight
    (110, 190, 160),   # 19 Static
    (170, 120, 50),    # 20 Dynamic
    (45, 60, 150),     # 21 Water
    (145, 170, 100)    # 22 Terrain
])
LABEL_COLORS_O3D = LABEL_COLORS / 255.0
LABEL_COLORS_CV = LABEL_COLORS[:, ::-1].astype(np.uint8)

CAR_TAG = 10 # Semantic tag for vehicles

# --- Helper Functions ---

def add_open3d_axis(vis):
    """Add a small 3D axis on Open3D Visualizer"""
    axis = o3d.geometry.LineSet()
    axis.points = o3d.utility.Vector3dVector(np.array([
        [0.0, 0.0, 0.0], [1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]))
    axis.lines = o3d.utility.Vector2iVector(np.array([[0, 1], [0, 2], [0, 3]]))
    axis.colors = o3d.utility.Vector3dVector(np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]))
    vis.add_geometry(axis)

def create_lidar_bev_image(lidar_data, width, height, pixels_per_meter=6,
                           hist_max_per_pixel=5, use_semantic=False, semantic_tags=None):
    """Creates a bird's eye view (BEV) visualization of LIDAR data."""
    img = np.zeros((height, width, 3), dtype=np.uint8)
    if lidar_data is None or len(lidar_data) == 0:
        return img

    points = lidar_data[:, :3]
    img_x = (width / 2 + points[:, 1] * pixels_per_meter).astype(np.int32)
    img_y = (height / 2 - points[:, 0] * pixels_per_meter).astype(np.int32)

    mask = (img_x >= 0) & (img_x < width) & (img_y >= 0) & (img_y < height)
    img_x = img_x[mask]
    img_y = img_y[mask]

    if use_semantic:
        if semantic_tags is None or len(points) != len(semantic_tags):
            print("Warning: Semantic data issue for BEV, using height coloring.", end='\r')
            use_semantic = False
            points_filtered = points[mask]
        else:
            tags = semantic_tags[mask].astype(np.int32)
            tags = np.clip(tags, 0, len(LABEL_COLORS_CV) - 1)
            img[img_y, img_x] = LABEL_COLORS_CV[tags]
            return img

    if not use_semantic:
        if 'points_filtered' not in locals():
            points_filtered = points[mask]
        if len(points_filtered) == 0:
            return img
        z_values = points_filtered[:, 2]
        min_z, max_z = -2.0, 5.0
        norm_z = np.clip((z_values - min_z) / (max_z - min_z + 1e-6), 0.0, 1.0)
        colors = (cm.jet(norm_z)[:, :3] * 255).astype(np.uint8)[:, ::-1]
        img[img_y, img_x] = colors
    return img

def generate_lidar_bp(arg, world, blueprint_library, delta):
    """Generates a CARLA blueprint based on the script parameters"""
    if arg.semantic:
        lidar_bp = world.get_blueprint_library().find('sensor.lidar.ray_cast_semantic')
        print("Selected Semantic LIDAR blueprint.")
    else:
        lidar_bp = blueprint_library.find('sensor.lidar.ray_cast')
        print("Selected Standard LIDAR blueprint.")
        if arg.no_noise:
            lidar_bp.set_attribute('dropoff_general_rate', '0.0')
            lidar_bp.set_attribute('dropoff_intensity_limit', '1.0')
            lidar_bp.set_attribute('dropoff_zero_intensity', '0.0')
            print("  - Noise disabled.")
        else:
            lidar_bp.set_attribute('noise_stddev', '0.1')
            lidar_bp.set_attribute('dropoff_general_rate', '0.45')
            lidar_bp.set_attribute('dropoff_intensity_limit', '0.8')
            lidar_bp.set_attribute('dropoff_zero_intensity', '0.4')
            print("  - Noise enabled.")

    lidar_bp.set_attribute('upper_fov', str(arg.upper_fov))
    lidar_bp.set_attribute('lower_fov', str(arg.lower_fov))
    lidar_bp.set_attribute('channels', str(arg.channels))
    lidar_bp.set_attribute('range', str(arg.range))
    if delta > 0.0:
        lidar_bp.set_attribute('rotation_frequency', str(1.0 / delta))
    else:
        lidar_bp.set_attribute('rotation_frequency', '20')

    lidar_bp.set_attribute('points_per_second', str(arg.points_per_second))
    print(f"  - Range={arg.range}, Channels={arg.channels}, Points/Sec={arg.points_per_second}")
    return lidar_bp

# --- Combined LIDAR Callbacks ---

def lidar_callback_combined(point_cloud, point_list_3d, queue_2d):
    """Processes LIDAR point cloud data for both 3D and 2D visualization."""
    try:
        data = np.copy(np.frombuffer(point_cloud.raw_data, dtype=np.dtype('f4')))
        data = np.reshape(data, (int(data.shape[0] / 4), 4))

        intensity = data[:, -1]
        intensity_col = 1.0 - np.log(intensity + 1e-6) / np.log(np.exp(-0.004 * 100) + 1e-6)
        intensity_col = np.clip(intensity_col, 0.0, 1.0)
        int_color = np.c_[
            np.interp(intensity_col, VID_RANGE, VIRIDIS[:, 0]),
            np.interp(intensity_col, VID_RANGE, VIRIDIS[:, 1]),
            np.interp(intensity_col, VID_RANGE, VIRIDIS[:, 2])]

        points_o3d = data[:, :-1].copy()
        points_o3d[:, 0] = -points_o3d[:, 0] # Open3D X-axis adjustment

        point_list_3d.points = o3d.utility.Vector3dVector(points_o3d)
        point_list_3d.colors = o3d.utility.Vector3dVector(int_color)
        queue_2d.put(data)
    except ValueError as e:
        print(f"Error processing lidar data: {e}", end='\r')
    except Exception as e:
        print(f"Unexpected error in lidar_callback: {e}", end='\r')
        traceback.print_exc()

def semantic_lidar_callback_combined(point_cloud, point_list_3d, queue_2d):
    """ Processes semantic LIDAR for 3D view and queues data for 2D view. """
    try:
        data_structured = np.frombuffer(point_cloud.raw_data, dtype=np.dtype([
            ('x', np.float32), ('y', np.float32), ('z', np.float32),
            ('CosAngle', np.float32), ('ObjIdx', np.uint32), ('ObjTag', np.uint32)]))

        points_o3d = np.array([data_structured['x'], -data_structured['y'], data_structured['z']]).T # Open3D Y-axis adjustment
        labels = np.array(data_structured['ObjTag']).astype(np.int32)
        labels_clipped = np.clip(labels, 0, len(LABEL_COLORS_O3D) - 1)
        int_color = LABEL_COLORS_O3D[labels_clipped]

        point_list_3d.points = o3d.utility.Vector3dVector(points_o3d)
        point_list_3d.colors = o3d.utility.Vector3dVector(int_color)

        points_bev = np.array([data_structured['x'], data_structured['y'], data_structured['z']]).T
        tags_bev = data_structured['ObjTag']
        queue_2d.put((points_bev, tags_bev))
    except ValueError as e:
        print(f"Error processing semantic lidar data: {e}", end='\r')
    except Exception as e:
        print(f"Unexpected error in semantic_lidar_callback: {e}", end='\r')
        traceback.print_exc()

# --- Camera Callbacks (using Queues) ---

def camera_callback(image, queue):
    """ Puts camera image BGRA data onto the queue. """
    try:
        array = np.frombuffer(image.raw_data, dtype=np.dtype("uint8"))
        array = np.reshape(array, (image.height, image.width, 4))
        queue.put(array)
    except Exception as e:
        print(f"Error in camera_callback: {e}", end='\r')

def dual_semantic_callback(image, visual_queue, raw_tags_queue):
    """
    Processes semantic segmentation image for visual panel and raw tags for detection.
    CARLA semantic segmentation image's R channel contains the tags.
    """
    try:
        # For visual panel (CityScapes Palette)
        image_copy_for_visual = carla.Image(image.width, image.height, image.fov, image.raw_data) # Create a copy
        image_copy_for_visual.convert(carla.ColorConverter.CityScapesPalette)
        array_visual = np.frombuffer(image_copy_for_visual.raw_data, dtype=np.dtype("uint8"))
        array_visual = np.reshape(array_visual, (image.height, image.width, 4))
        visual_queue.put(array_visual)

        # For raw tags (detection)
        raw_tags_array = np.frombuffer(image.raw_data, dtype=np.dtype("uint8"))
        raw_tags_array = np.reshape(raw_tags_array, (image.height, image.width, 4))
        # The tags are in the R channel (index 2 in BGRA from raw_data, but after reshape it's B G R A, so R is at index 2)
        # However, CARLA's documentation states the tag is in the R channel of the CityScapesPalette image.
        # Let's use the raw_data directly and assume the R channel is the tag.
        # After conversion to CityScapesPalette, the R channel stores the tag.
        # So, we can use the converted image's R channel.
        # To be safe, let's use the raw data and assume R channel is the tag.
        # The raw data is BGRA, so R is at index 2.
        # No, CARLA docs say: "The image codifies the object tag in the red channel."
        # So for raw data (BGRA), index 2 is R.
        # Let's re-verify with an image converted to CityScapesPalette
        # For image.convert(carla.ColorConverter.Raw) -> this is the default.
        # The documentation for carla.Image.save_to_disk with CityScapesPalette says "R channel contains the tag"
        # So, if we get raw data from semantic sensor, it's BGRA. R channel is index 2.
        # If we convert it to CityScapesPalette, then save, the R channel of *that saved image* has the tag.
        # The raw_data of the *converted* image will have R channel as the tag.
        # Let's use the raw data from the sensor and extract the R channel.
        # The raw data is BGRA. So R is at index 2.
        tags_only = raw_tags_array[:, :, 2].copy() # Extract R channel (which holds the tag)
        raw_tags_queue.put(tags_only)

    except Exception as e:
        print(f"Error in dual_semantic_callback: {e}", end='\r')
        traceback.print_exc()


def depth_callback(image, queue):
    """ Applies LogarithmicDepth and puts BGRA data onto the queue. """
    try:
        image.convert(carla.ColorConverter.LogarithmicDepth)
        array = np.frombuffer(image.raw_data, dtype=np.dtype("uint8"))
        array = np.reshape(array, (image.height, image.width, 4))
        queue.put(array)
    except Exception as e:
        print(f"Error in depth_callback: {e}", end='\r')

def add_hud_info(image, vehicle):
    """Adds comprehensive telemetry overlay to the RGB camera view."""
    hud_image = np.copy(image)
    v = vehicle.get_velocity()
    c = vehicle.get_control()
    transform = vehicle.get_transform()
    acceleration = vehicle.get_acceleration()
    angular_velocity = vehicle.get_angular_velocity()
    speed = 3.6 * np.sqrt(v.x**2 + v.y**2 + v.z**2)
    accel_mag = np.sqrt(acceleration.x**2 + acceleration.y**2 + acceleration.z**2)
    angular_speed = np.sqrt(angular_velocity.x**2 + angular_velocity.y**2 + angular_velocity.z**2)

    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.5
    thickness = 1
    padding = 10
    line_height = 20

    overlay = hud_image.copy()
    cv2.rectangle(overlay, (0, 0), (350, 200), (0, 0, 0), -1) # Adjusted width for more info
    cv2.addWeighted(overlay, 0.6, hud_image, 0.4, 0, hud_image)

    info_sections = {
        "Vehicle Status": [
            f"Speed: {speed:.1f} km/h",
            f"Acceleration: {accel_mag:.1f} m/s²",
            f"Angular Speed: {angular_speed:.1f} rad/s"
        ],
        "Position": [
            f"X: {transform.location.x:.1f} m",
            f"Y: {transform.location.y:.1f} m",
            f"Z: {transform.location.z:.1f} m"
        ],
        "Orientation": [
            f"Pitch: {transform.rotation.pitch:.1f}°",
            f"Yaw: {transform.rotation.yaw:.1f}°",
            f"Roll: {transform.rotation.roll:.1f}°"
        ],
        "Controls": [
            f"Throttle: {c.throttle:.2f}",
            f"Brake: {c.brake:.2f}",
            f"Steer: {c.steer:.2f}",
            f"Reverse: {'On' if c.reverse else 'Off'}"
        ],
        "System": [
            f"Time: {datetime.now().strftime('%H:%M:%S')}",
            f"{'Manual' if c.manual_gear_shift else 'Auto'} | Gear: {c.gear}"
        ]
    }

    y = padding
    for section, lines in info_sections.items():
        cv2.putText(hud_image, section, (padding, y + 15),
                    font, font_scale + 0.1, (255, 255, 0), thickness + 1)
        y += line_height + 5
        for line in lines:
            cv2.putText(hud_image, line, (padding + 10, y + 15),
                        font, font_scale, (255, 255, 255), thickness)
            y += line_height
        y += 5

    if speed > 50:
        cv2.putText(hud_image, "! HIGH SPEED !", (padding, y + 30),
                    font, font_scale + 0.2, (0, 0, 255), thickness + 1)
    if abs(c.steer) > 0.7:
        cv2.putText(hud_image, "! SHARP TURN !", (padding + 180, y + 30),
                    font, font_scale + 0.2, (0, 0, 255), thickness + 1)
    return hud_image

# --- MongoDB Helper Function ---
def save_frame_to_mongodb(mongo_collection, frame_bgr, timestamp, detected_object_type="vehicle"):
    """Saves the given BGR frame to MongoDB."""
    if not PYMONGO_AVAILABLE or mongo_collection is None:
        # print("MongoDB not available or collection not set. Frame not saved.")
        return False
    try:
        # Encode image to JPEG format
        _, buffer = cv2.imencode('.jpg', frame_bgr)
        image_binary = Binary(buffer.tobytes())

        document = {
            "timestamp": timestamp,
            "detection_time_utc": datetime.utcnow(),
            "object_type": detected_object_type,
            "image_format": "jpeg",
            "frame_data": image_binary,
            "source_script": "carla_security_bot_v2.py"
        }
        mongo_collection.insert_one(document)
        # print(f"Frame saved to MongoDB at {timestamp}")
        return True
    except ConnectionFailure:
        print("Error: Could not connect to MongoDB. Frame not saved.")
        return False
    except Exception as e:
        print(f"Error saving frame to MongoDB: {e}")
        traceback.print_exc()
        return False

# --- Flask Web Server ---
app = Flask(__name__)
latest_frame_web = None # Use a different variable for web stream to avoid conflict
frame_lock_web = threading.Lock()

def generate_frames_web():
    global latest_frame_web
    while True:
        with frame_lock_web:
            if latest_frame_web is not None:
                ret, buffer = cv2.imencode('.jpg', latest_frame_web)
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.05) # Stream at ~20 FPS

@app.route('/')
def index_web():
    return """
    <html><head><title>CARLA Security Bot</title>
    <style>
        body { background-color: #1a1a1a; color: white; font-family: Arial, sans-serif; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
        .container { max-width: 95%; max-height: 95vh; text-align: center; }
        img { max-width: 100%; max-height: calc(95vh - 60px); object-fit: contain; border: 2px solid #555; border-radius: 8px; }
        h1 { margin: 0; padding: 15px; background: #333; color: #00aaff; width: 100%; box-sizing: border-box; border-top-left-radius: 8px; border-top-right-radius: 8px;}
    </style>
    </head><body><div class="container">
    <h1>CARLA Security Bot Monitor</h1>
    <img src="/video_feed" />
    </div>
    <script> // Optional: JavaScript to reload image if it breaks
        const img = document.querySelector('img');
        img.onerror = () => { setTimeout(() => { img.src = "/video_feed?" + new Date().getTime(); }, 1000); };
    </script>
    </body></html>
    """

@app.route('/video_feed')
def video_feed_web():
    return Response(generate_frames_web(), mimetype='multipart/x-mixed-replace; boundary=frame')

# --- Main Function ---
def main(args):
    global latest_frame_web

    # --- MongoDB Setup ---
    mongo_client = None
    detected_cars_collection = None
    if args.save_to_mongodb and PYMONGO_AVAILABLE:
        try:
            print(f"Connecting to MongoDB at {args.mongodb_uri}...")
            mongo_client = MongoClient(args.mongodb_uri, serverSelectionTimeoutMS=5000)
            mongo_client.admin.command('ping') # Verify connection
            db = mongo_client.carla_stream # Database name
            detected_cars_collection = db.detected_cars # Collection name
            print(f"Connected to MongoDB. Saving detected car frames to 'carla_stream.detected_cars'.")
        except ConnectionFailure:
            print(f"Error: Failed to connect to MongoDB at {args.mongodb_uri}. Frame saving disabled.")
            mongo_client = None
            detected_cars_collection = None
            args.save_to_mongodb = False # Disable saving if connection fails
        except Exception as e:
            print(f"An unexpected error occurred during MongoDB setup: {e}")
            mongo_client = None
            detected_cars_collection = None
            args.save_to_mongodb = False


    # --- Flask Web Server Setup ---
    if args.web_port > 0:
        def start_flask():
            try:
                print(f"Starting web server at http://{args.web_host}:{args.web_port}")
                app.run(host=args.web_host, port=args.web_port, threaded=True)
            except Exception as e:
                print(f"Error starting Flask server: {e}")
        flask_thread = threading.Thread(target=start_flask)
        flask_thread.daemon = True
        flask_thread.start()
    else:
        print("Web server disabled (port set to 0 or less).")


    client_carla = None
    world = None
    original_settings = None
    vis_o3d = None
    cv2_window_created = False
    actor_list = [] # Unified list for all spawned actors

    latest_sensor_frames = {'rgb': None, 'night_visual': None, 'depth': None, 'semantic_raw': None}
    latest_lidar_bev_data = None

    panel_width = WINDOW_WIDTH // 2
    panel_height = WINDOW_HEIGHT // 2
    lidar_bev_img = np.zeros((panel_height, panel_width, 3), dtype=np.uint8)

    # Car detection variables
    last_car_detection_time = time.time() - args.detection_cooldown # Initialize to allow immediate first detection
    car_detected_in_frame = False # Visual indicator flag

    # Data collection (original telemetry)
    start_time_telemetry = time.time()
    collection_duration_telemetry = 120
    hud_data_stream = []
    data_collection_active_telemetry = True
    data_saved_telemetry = False

    try:
        print(f"Connecting to CARLA at {args.host}:{args.port}...")
        client_carla = carla.Client(args.host, args.port)
        client_carla.set_timeout(20.0) # Increased timeout
        world = client_carla.get_world()
        print("Connected to CARLA.")

        original_settings = world.get_settings()
        settings = world.get_settings()
        traffic_manager = client_carla.get_trafficmanager(8000)
        delta = 0.05 # 20 FPS
        settings.fixed_delta_seconds = delta
        settings.synchronous_mode = True
        settings.no_rendering_mode = args.no_rendering
        world.apply_settings(settings)
        traffic_manager.set_synchronous_mode(True)
        traffic_manager.set_global_distance_to_leading_vehicle(3.0) # Increased slightly
        print(f"Synchronous mode enabled with delta={delta:.3f}s.")

        blueprint_library = world.get_blueprint_library()
        spawn_points = world.get_map().get_spawn_points()
        if not spawn_points:
            raise RuntimeError("No spawn points found in the current map!")

        # --- Spawn Ego Vehicle ---
        ego_vehicle_bp = blueprint_library.find(args.filter)
        ego_vehicle_bp.set_attribute('role_name', 'hero') # Standard role name
        ego_transform = random.choice(spawn_points)
        ego_vehicle = world.try_spawn_actor(ego_vehicle_bp, ego_transform)
        if ego_vehicle is None:
            # Try a different spawn point if the first one fails (e.g. occupied)
            for sp in random.sample(spawn_points, min(len(spawn_points), 5)): # Try up to 5 other points
                ego_vehicle = world.try_spawn_actor(ego_vehicle_bp, sp)
                if ego_vehicle:
                    ego_transform = sp
                    break
            if ego_vehicle is None:
                 raise RuntimeError(f"Failed to spawn ego vehicle '{args.filter}' even after retries.")
        actor_list.append(ego_vehicle)
        print(f"Spawned Ego Vehicle: {ego_vehicle.type_id} (ID: {ego_vehicle.id}) at {ego_transform.location}")

        if not args.no_autopilot:
            ego_vehicle.set_autopilot(True, traffic_manager.get_port())
            traffic_manager.ignore_lights_percentage(ego_vehicle, 100)
            traffic_manager.ignore_signs_percentage(ego_vehicle, 100)
            # traffic_manager.ignore_vehicles_percentage(ego_vehicle, 0) # Let it interact with other vehicles
            traffic_manager.set_desired_speed(ego_vehicle, 30) # km/h
            print("Ego vehicle autopilot enabled.")
        else:
            print("Ego vehicle autopilot disabled by argument.")


        # --- Spawn Additional NPC Vehicles ---
        if args.num_vehicles > 0:
            print(f"Spawning {args.num_vehicles} NPC vehicles...")
            vehicle_blueprints = [bp for bp in blueprint_library.filter('vehicle.*')
                                  if bp.id not in ['vehicle.carlamotors.carlacola', # Too big
                                                   'vehicle.yamaha.yzf', 'vehicle.kawasaki.ninja', # Motorcycles can be problematic
                                                   'vehicle.bmw.isetta', 'vehicle.micro.microlino', # Too small/unstable
                                                   'vehicle.ford.ambulance', 'vehicle.firetruck'] # Avoid special vehicles for general traffic
                                  and 'cybertruck' not in bp.id] # Avoid if problematic

            if not vehicle_blueprints:
                print("Warning: No suitable vehicle blueprints found for NPCs.")
            else:
                for i in range(args.num_vehicles):
                    npc_bp = random.choice(vehicle_blueprints)
                    npc_transform = random.choice(spawn_points)
                    npc_vehicle = world.try_spawn_actor(npc_bp, npc_transform)
                    if npc_vehicle:
                        actor_list.append(npc_vehicle)
                        npc_vehicle.set_autopilot(True, traffic_manager.get_port())
                        traffic_manager.set_desired_speed(npc_vehicle, random.uniform(20, 40)) # Random speeds
                        traffic_manager.random_left_lanechange_percentage(npc_vehicle, 10)
                        traffic_manager.random_right_lanechange_percentage(npc_vehicle, 10)
                        print(f"  Spawned NPC: {npc_vehicle.type_id} (ID: {npc_vehicle.id})")
                    else:
                        print(f"  Failed to spawn NPC {i+1}/{args.num_vehicles} at {npc_transform.location}")
                    time.sleep(0.1) # Small delay to help with spawning


        # --- Spawn Static Obstacles ---
        if args.num_obstacles > 0:
            print(f"Spawning {args.num_obstacles} static obstacles...")
            # Common static props. Add more as needed.
            obstacle_bps_names = [
                'static.prop.streetbarrier', 'static.prop.trafficcone01', 'static.prop.trafficcone02',
                'static.prop.constructioncone', 'static.prop.warningaccident', 'static.prop.warningconstruction'
            ]
            obstacle_blueprints = [bp for name in obstacle_bps_names for bp in blueprint_library.filter(name)]

            if not obstacle_blueprints:
                print("Warning: No suitable obstacle blueprints found.")
            else:
                for i in range(args.num_obstacles):
                    obs_bp = random.choice(obstacle_blueprints)
                    # Try to spawn near roads, slightly offset from spawn points
                    spawn_point_candidate = random.choice(spawn_points)
                    offset = carla.Location(random.uniform(-2, 2), random.uniform(-2, 2), 0.5) # Random offset
                    obs_transform = carla.Transform(spawn_point_candidate.location + offset, spawn_point_candidate.rotation)

                    obstacle = world.try_spawn_actor(obs_bp, obs_transform)
                    if obstacle:
                        actor_list.append(obstacle)
                        print(f"  Spawned Obstacle: {obstacle.type_id} (ID: {obstacle.id})")
                    else:
                        print(f"  Failed to spawn obstacle {i+1}/{args.num_obstacles} at {obs_transform.location}")
                    time.sleep(0.1)


        # --- Sensor Queues ---
        sensor_queues = {
            'rgb': queue.Queue(maxsize=2), # Increased buffer slightly
            'night_visual': queue.Queue(maxsize=2),
            'semantic_raw': queue.Queue(maxsize=2), # For raw semantic tags
            'depth': queue.Queue(maxsize=2),
            'lidar_2d': queue.Queue(maxsize=2)
        }

        # --- Spawn Camera Sensors ---
        cam_transform = carla.Transform(carla.Location(x=1.2, y=0.0, z=1.6), carla.Rotation(pitch=-10.0)) # Adjusted for better view

        cam_bp_rgb = blueprint_library.find('sensor.camera.rgb')
        cam_bp_rgb.set_attribute("image_size_x", str(panel_width))
        cam_bp_rgb.set_attribute("image_size_y", str(panel_height))
        cam_rgb = world.spawn_actor(cam_bp_rgb, cam_transform, attach_to=ego_vehicle)
        cam_rgb.listen(lambda image: camera_callback(image, sensor_queues['rgb']))
        actor_list.append(cam_rgb)
        print(f"Spawned RGB Camera (ID: {cam_rgb.id}).")

        # Semantic Segmentation for Night Vision and Car Detection
        ss_bp = blueprint_library.find('sensor.camera.semantic_segmentation')
        ss_bp.set_attribute("image_size_x", str(panel_width))
        ss_bp.set_attribute("image_size_y", str(panel_height))
        cam_semantic = world.spawn_actor(ss_bp, cam_transform, attach_to=ego_vehicle)
        cam_semantic.listen(lambda image: dual_semantic_callback(image, sensor_queues['night_visual'], sensor_queues['semantic_raw']))
        actor_list.append(cam_semantic)
        print(f"Spawned Semantic Segmentation Camera (ID: {cam_semantic.id}).")

        depth_bp = blueprint_library.find('sensor.camera.depth')
        depth_bp.set_attribute("image_size_x", str(panel_width))
        depth_bp.set_attribute("image_size_y", str(panel_height))
        cam_depth = world.spawn_actor(depth_bp, cam_transform, attach_to=ego_vehicle)
        cam_depth.listen(lambda image: depth_callback(image, sensor_queues['depth']))
        actor_list.append(cam_depth)
        print(f"Spawned Depth Camera (ID: {cam_depth.id}).")

        # --- Spawn LIDAR Sensor ---
        lidar_bp = generate_lidar_bp(args, world, blueprint_library, delta)
        user_offset = carla.Location(args.x, args.y, args.z)
        lidar_transform = carla.Transform(carla.Location(x=-0.5, z=2.0) + user_offset, carla.Rotation(yaw=0)) # Slightly behind and higher
        lidar = world.spawn_actor(lidar_bp, lidar_transform, attach_to=ego_vehicle)
        actor_list.append(lidar)
        print(f"Spawned Lidar: {lidar.type_id} (ID: {lidar.id})")

        # --- Setup Open3D ---
        point_list_3d_o3d = o3d.geometry.PointCloud()
        if not args.no_rendering: # Only setup Open3D if rendering is enabled
            try:
                vis_o3d = o3d.visualization.Visualizer()
                window_created = vis_o3d.create_window(
                    window_name='CARLA 3D Lidar', width=960, height=540,
                    left=WINDOW_WIDTH, top=50)
                if not window_created: raise RuntimeError("Failed to create Open3D window")
                render_option = vis_o3d.get_render_option()
                if not render_option: raise RuntimeError("Failed to get render options")
                render_option.background_color = np.array([0.05, 0.05, 0.05])
                render_option.point_size = args.point_size
                render_option.show_coordinate_frame = True
                if args.show_axis: add_open3d_axis(vis_o3d)
                print("Open3D visualization initialized successfully.")
            except Exception as e:
                print(f"Error setting up Open3D visualization: {e}. Will continue without it.")
                if vis_o3d: vis_o3d.destroy_window() # Clean up if partially created
                vis_o3d = None # Ensure it's None if setup failed
        else:
            print("Open3D visualization skipped due to --no-rendering flag.")


        # --- Link Combined LIDAR Callback ---
        if args.semantic:
            lidar.listen(lambda data: semantic_lidar_callback_combined(data, point_list_3d_o3d, sensor_queues['lidar_2d']))
            print("Using Semantic LIDAR combined callback.")
        else:
            lidar.listen(lambda data: lidar_callback_combined(data, point_list_3d_o3d, sensor_queues['lidar_2d']))
            print("Using Standard LIDAR combined callback.")

        # --- Setup OpenCV Window ---
        if not args.no_rendering:
            cv2.namedWindow('Security Feed', cv2.WINDOW_NORMAL)
            cv2.resizeWindow('Security Feed', WINDOW_WIDTH, WINDOW_HEIGHT)
            cv2_window_created = True
            print("OpenCV window created. Starting main loop...")
        else:
            print("OpenCV window skipped due to --no-rendering flag.")


        # --- Main Loop ---
        frame_count = 0
        t_start_loop = time.time()
        o3d_geometry_added = False
        world.tick() # Initial tick

        while True:
            world.tick() # Tick simulation

            # --- Retrieve data from queues (non-blocking) ---
            for sensor_type_key in ['rgb', 'night_visual', 'semantic_raw', 'depth', 'lidar_2d']:
                try:
                    while sensor_queues[sensor_type_key].qsize() > 1: # Discard older frames
                        sensor_queues[sensor_type_key].get_nowait()
                    if sensor_type_key == 'lidar_2d':
                        latest_lidar_bev_data = sensor_queues[sensor_type_key].get_nowait()
                    else:
                        latest_sensor_frames[sensor_type_key] = sensor_queues[sensor_type_key].get_nowait()
                except queue.Empty:
                    pass # Keep previous frame/data if none available

            # --- Process and Prepare OpenCV Panels ---
            img_rgb_raw = latest_sensor_frames['rgb']
            img_rgb_display = np.zeros((panel_height, panel_width, 3), dtype=np.uint8)
            if img_rgb_raw is not None:
                img_rgb_display = img_rgb_raw[:, :, :3].copy() # Keep BGR
                if ego_vehicle: # Add HUD
                    img_rgb_display = add_hud_info(img_rgb_display, ego_vehicle)

            img_night_visual = latest_sensor_frames['night_visual'][:, :, :3] if latest_sensor_frames['night_visual'] is not None else np.zeros((panel_height, panel_width, 3), dtype=np.uint8)
            img_depth = latest_sensor_frames['depth'][:, :, :3] if latest_sensor_frames['depth'] is not None else np.zeros((panel_height, panel_width, 3), dtype=np.uint8)

            # --- Car Detection Logic ---
            car_detected_in_frame = False # Reset for current frame
            if latest_sensor_frames['semantic_raw'] is not None and args.save_to_mongodb:
                semantic_tags_frame = latest_sensor_frames['semantic_raw'] # This is a 2D array of tags

                # Ignore bottom part of the image to avoid detecting ego vehicle's hood if visible
                ignore_height_pixels = int(semantic_tags_frame.shape[0] * 0.20) # Ignore bottom 20%
                roi_semantic_tags = semantic_tags_frame[:-ignore_height_pixels, :]

                vehicle_pixels = np.sum(roi_semantic_tags == CAR_TAG)

                current_loop_time = time.time()
                if vehicle_pixels > args.detection_threshold and \
                   (current_loop_time - last_car_detection_time) > args.detection_cooldown:
                    print(f"\nVehicle detected! Pixels: {vehicle_pixels}. Saving frame to MongoDB...")
                    if img_rgb_raw is not None: # Ensure we have an RGB frame to save
                        # Save the raw RGB frame (before HUD)
                        if save_frame_to_mongodb(detected_cars_collection, img_rgb_raw[:,:,:3], datetime.now()):
                            print("Frame successfully saved.")
                            last_car_detection_time = current_loop_time
                            car_detected_in_frame = True # For visual indicator
                        else:
                            print("Failed to save frame.")
                    else:
                        print("No RGB frame available to save for detection.")
            
            if car_detected_in_frame and not args.no_rendering: # Add visual indicator if rendering
                 cv2.circle(img_rgb_display, (panel_width - 30, 30), 15, (0, 0, 255), -1) # Red circle top-right


            # Generate 2D LIDAR BEV image
            if latest_lidar_bev_data is not None:
                if args.semantic:
                    points, tags = latest_lidar_bev_data
                    lidar_bev_img = create_lidar_bev_image(points, panel_width, panel_height, use_semantic=True, semantic_tags=tags)
                else:
                    lidar_bev_img = create_lidar_bev_image(latest_lidar_bev_data, panel_width, panel_height, use_semantic=False)
                latest_lidar_bev_data = None # Consume

            if not args.no_rendering:
                # --- Update Open3D Visualization ---
                if vis_o3d:
                    if not o3d_geometry_added and not point_list_3d_o3d.is_empty():
                        try:
                            vis_o3d.add_geometry(point_list_3d_o3d)
                            o3d_geometry_added = True
                        except Exception as e: print(f"\nError adding Open3D geometry: {e}")
                    if o3d_geometry_added:
                        try: vis_o3d.update_geometry(point_list_3d_o3d)
                        except Exception as e: print(f"\nError updating Open3D geometry: {e}")
                    try:
                        vis_o3d.poll_events()
                        vis_o3d.update_renderer()
                    except Exception as e:
                        print(f"\nError updating Open3D window: {e}. Exiting.")
                        break

                # --- Combine OpenCV Panels ---
                try:
                    top_row = np.hstack((img_rgb_display, img_night_visual))
                    bottom_row = np.hstack((img_depth, lidar_bev_img))
                    combined_img = np.vstack((top_row, bottom_row))
                except ValueError as e:
                    print(f"\nError stacking images: {e}. Check dimensions.")
                    combined_img = np.zeros((WINDOW_HEIGHT, WINDOW_WIDTH, 3), dtype=np.uint8)

                font = cv2.FONT_HERSHEY_SIMPLEX; font_scale = 0.7; font_color = (220, 220, 220); font_thickness = 1
                cv2.putText(combined_img, 'RGB Camera', (10, 25), font, font_scale, font_color, font_thickness)
                cv2.putText(combined_img, 'Night Vision (Semantic)', (panel_width + 10, 25), font, font_scale, font_color, font_thickness)
                cv2.putText(combined_img, 'Depth Map', (10, panel_height + 25), font, font_scale, font_color, font_thickness)
                bev_label = 'LIDAR BEV (Semantic)' if args.semantic else 'LIDAR BEV (Height)'
                cv2.putText(combined_img, bev_label, (panel_width + 10, panel_height + 25), font, font_scale, font_color, font_thickness)

                cv2.imshow('Security Feed', combined_img)

                # Update frame for web stream
                if args.web_port > 0:
                    with frame_lock_web:
                        latest_frame_web = combined_img.copy()

            # --- HUD Data Collection (Telemetry) ---
            current_sim_time = world.get_snapshot().timestamp.elapsed_seconds
            elapsed_telemetry_time = time.time() - start_time_telemetry

            if data_collection_active_telemetry and elapsed_telemetry_time <= collection_duration_telemetry:
                if ego_vehicle:
                    try:
                        v_trans = ego_vehicle.get_transform(); v_loc = v_trans.location; v_rot = v_trans.rotation
                        v_vel = ego_vehicle.get_velocity(); v_ctrl = ego_vehicle.get_control()
                        v_speed_mps = math.sqrt(v_vel.x**2 + v_vel.y**2 + v_vel.z**2)
                        data_point = {
                            "script_timestamp": time.time(), "simulation_timestamp": current_sim_time,
                            "location": {"x": v_loc.x, "y": v_loc.y, "z": v_loc.z},
                            "rotation": {"pitch": v_rot.pitch, "yaw": v_rot.yaw, "roll": v_rot.roll},
                            "velocity": {"x": v_vel.x, "y": v_vel.y, "z": v_vel.z},
                            "speed_mps": v_speed_mps, "speed_kmh": v_speed_mps * 3.6,
                            "control": {"throttle": v_ctrl.throttle, "steer": v_ctrl.steer, "brake": v_ctrl.brake}
                        }
                        hud_data_stream.append(data_point)
                    except Exception as e: print(f"Error collecting telemetry: {e}")
            elif data_collection_active_telemetry and elapsed_telemetry_time > collection_duration_telemetry and not data_saved_telemetry:
                data_collection_active_telemetry = False
                print(f"\n--- Finished collecting telemetry data ({collection_duration_telemetry}s) ---")
                try:
                    with open("telemetry_stream.json", "w") as f: json.dump(hud_data_stream, f, indent=4)
                    print("--- Telemetry data saved to telemetry_stream.json ---")
                    data_saved_telemetry = True
                except Exception as e: print(f"Error saving telemetry: {e}")


            # --- Handle User Input (OpenCV window) ---
            if not args.no_rendering:
                key = cv2.waitKey(1) & 0xFF # Ensure it's 8-bit
                if key == ord('q'):
                    print("\n'q' pressed, exiting.")
                    break
                elif key == ord('s') and not args.no_autopilot and ego_vehicle:
                    current_speed = traffic_manager.get_desired_speed(ego_vehicle)
                    new_speed = 50.0 if current_speed < 40 else 30.0
                    traffic_manager.set_desired_speed(ego_vehicle, new_speed)
                    print(f"\nSet ego desired speed to {new_speed} km/h")
                elif key == ord('a') and ego_vehicle:
                    if args.no_autopilot: # If started with no_autopilot, 'a' enables it
                        ego_vehicle.set_autopilot(True, traffic_manager.get_port())
                        args.no_autopilot = False # So it can be toggled off next time
                        print("\nAutopilot enabled for ego vehicle.")
                    else: # If autopilot was on or enabled via 'a'
                        is_autopilot = ego_vehicle.is_autopilot_enabled()
                        ego_vehicle.set_autopilot(not is_autopilot)
                        print(f"\nAutopilot {'disabled' if is_autopilot else 'enabled'} for ego vehicle.")

            # --- FPS Calculation ---
            frame_count += 1
            loop_end_time = time.time()
            elapsed_loop_time = loop_end_time - t_start_loop
            if elapsed_loop_time > 0 and frame_count > 10:
                fps_avg = frame_count / elapsed_loop_time
                sys.stdout.write(f'\rFrame: {frame_count}, Avg FPS: {fps_avg:.1f} (Sim Time: {current_sim_time:.2f}s)    ')
                sys.stdout.flush()

            if args.no_rendering and frame_count % 200 == 0: # Print status periodically if no rendering
                 print(f'\rFrame: {frame_count}, Sim Time: {current_sim_time:.2f}s, NPCs: {args.num_vehicles}, Obstacles: {args.num_obstacles}    ', end="")


            # time.sleep(0.001) # Tiny sleep if loop is too fast, not strictly needed in sync mode

    except (KeyboardInterrupt, SystemExit):
        print("\nInterrupted by user (Ctrl+C). Cleaning up...")
    except RuntimeError as e:
        print(f"\nCARLA Runtime Error: {e}")
        print("This often means the CARLA server crashed or disconnected, or an actor could not be spawned.")
    except Exception as e:
        print(f"\nAn unexpected error occurred in the main loop: {e}")
        traceback.print_exc()

    finally:
        print("\n--- Starting Cleanup ---")
        if original_settings is not None and world is not None and world.get_settings().synchronous_mode:
            try:
                print("Applying original world settings...")
                world.apply_settings(original_settings)
                if 'traffic_manager' in locals() and traffic_manager:
                    traffic_manager.set_synchronous_mode(False)
            except Exception as e: print(f"Error restoring settings: {e}")

        if vis_o3d is not None:
            try:
                vis_o3d.destroy_window()
                print("Closed Open3D window.")
            except Exception as e: print(f"Error closing Open3D window: {e}")

        if cv2_window_created:
            try:
                cv2.destroyAllWindows()
                print("Closed OpenCV windows.")
            except Exception as e: print(f"Error closing OpenCV windows: {e}")

        if client_carla is not None and actor_list:
            print(f"Destroying {len(actor_list)} actors...")
            # Destroy sensors first
            sensors_to_destroy = [actor for actor in actor_list if isinstance(actor, carla.Sensor)]
            other_actors_to_destroy = [actor for actor in actor_list if not isinstance(actor, carla.Sensor)]

            for actor in sensors_to_destroy:
                if actor is not None and actor.is_alive:
                    try:
                        actor.stop()
                        actor.destroy()
                        # print(f"  Destroyed sensor: {actor.id} ({actor.type_id})")
                    except Exception as e: print(f"Error destroying sensor {actor.id}: {e}")
            # Then destroy other actors (vehicles, obstacles)
            client_carla.apply_batch_sync([carla.command.DestroyActor(actor) for actor in other_actors_to_destroy if actor.is_alive])
            print(f"Destroyed {len(actor_list)} actors.")


        if mongo_client is not None:
            try:
                mongo_client.close()
                print("Closed MongoDB connection.")
            except Exception as e: print(f"Error closing MongoDB connection: {e}")

        # Save telemetry data if not saved yet
        if data_collection_active_telemetry and not data_saved_telemetry and hud_data_stream:
            print(f"\n--- Saving collected telemetry data before exit ({len(hud_data_stream)} points) ---")
            try:
                with open("telemetry_stream.json", "w") as f: json.dump(hud_data_stream, f, indent=4)
                print("--- Telemetry data saved to telemetry_stream.json ---")
            except Exception as e: print(f"Error saving telemetry during cleanup: {e}")

        print("--- Cleanup Finished ---")


if __name__ == "__main__":
    argparser = argparse.ArgumentParser(description="CARLA Combined OpenCV/Open3D Visualization with Enhancements")
    # CARLA Connection
    argparser.add_argument('--host', metavar='H', default='127.0.0.1', help='IP of the host CARLA Simulator (default: 127.0.0.1)')
    argparser.add_argument('-p', '--port', metavar='P', default=2000, type=int, help='TCP port of CARLA Simulator (default: 2000)')
    # Simulation Settings
    argparser.add_argument('--no-rendering', action='store_true', help='Use no-rendering mode (disables OpenCV and Open3D windows)')
    argparser.add_argument('--no-autopilot', action='store_true', help='Disables autopilot for the ego vehicle')
    argparser.add_argument('--filter', metavar='PATTERN', default='vehicle.tesla.model3', help='Ego vehicle filter (default: "vehicle.tesla.model3")')
    # LIDAR
    argparser.add_argument('--semantic', action='store_true', help='Use semantic lidar')
    argparser.add_argument('--no-noise', action='store_true', help='Remove noise from standard lidar')
    argparser.add_argument('--upper-fov', default=15.0, type=float, help='Lidar upper FoV (deg)')
    argparser.add_argument('--lower-fov', default=-25.0, type=float, help='Lidar lower FoV (deg)')
    argparser.add_argument('--channels', default=64.0, type=float, help='Lidar channels')
    argparser.add_argument('--range', default=100.0, type=float, help='Lidar range (m)')
    argparser.add_argument('--points-per-second', default=1200000, type=int, help='Lidar points per second')
    # Sensor Offset (for LIDAR)
    argparser.add_argument('-x', default=0.0, type=float, help='Lidar X offset (m)')
    argparser.add_argument('-y', default=0.0, type=float, help='Lidar Y offset (m)')
    argparser.add_argument('-z', default=0.0, type=float, help='Lidar Z offset (m)')
    # Visualization
    argparser.add_argument('--show-axis', action='store_true', help='Show axis in Open3D window')
    argparser.add_argument('--point-size', default=1.0, type=float, help='Point size for Open3D visualization')
    # Web Server
    argparser.add_argument('--web-port', default=6080, type=int, help='Port for web visualization (0 or less to disable, default: 6080)')
    argparser.add_argument('--web-host', default='0.0.0.0', help='Host for web visualization (default: 0.0.0.0)')
    # New Features
    argparser.add_argument('--num-vehicles', default=5, type=int, help='Number of additional NPC vehicles to spawn (default: 5)')
    argparser.add_argument('--num-obstacles', default=3, type=int, help='Number of static obstacles to spawn (default: 3)')
    argparser.add_argument('--mongodb-uri', default="YOUR_MONGODB_ATLAS_CONNECTION_STRING", help='MongoDB Atlas connection string. Replace with your actual URI.')
    argparser.add_argument('--save-to-mongodb', action='store_true', help='Enable saving detected car frames to MongoDB.')
    argparser.add_argument('--detection-threshold', default=200, type=int, help='Min vehicle pixels in semantic view to trigger detection (default: 200)')
    argparser.add_argument('--detection-cooldown', default=5.0, type=float, help='Cooldown in seconds between saving detected car frames (default: 5.0s)')


    args = argparser.parse_args()

    if args.save_to_mongodb and (not PYMONGO_AVAILABLE or args.mongodb_uri == "YOUR_MONGODB_ATLAS_CONNECTION_STRING"):
        print("Warning: MongoDB saving is enabled but Pymongo is not available or URI is not set.")
        print("Please install pymongo (pip install pymongo) and provide a valid --mongodb-uri.")
        print("Disabling MongoDB saving for this run.")
        args.save_to_mongodb = False
    
    if args.no_rendering:
        print("--- No Rendering Mode Enabled ---")
        print("OpenCV and Open3D windows will not be shown.")
        if args.web_port <=0:
            print("Web server is also disabled. Running in headless data collection/simulation mode.")


    try:
        main(args)
    except Exception as e:
        print(f"\nUnhandled error during script execution: {e}")
        traceback.print_exc()
    finally:
        print("Script execution complete.")

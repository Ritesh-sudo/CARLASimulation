#!/usr/bin/env python3

"""
Security Bot - Advanced CARLA Visualization System

This script provides a comprehensive visualization interface for CARLA simulation,
combining RGB camera input with YOLO object detection and a Heads-Up Display.

Features:
- RGB Camera display with YOLO object detections (from ego vehicle's chase camera).
- Spawning of multiple NPC vehicles.
- Third-person chase camera view for the ego vehicle.
- Configurable high speed for the ego vehicle's autopilot.
- Logic to encourage movement if --no-autopilot is used and car is slow/stuck.
- Simplified HUD overlay showing vehicle speed.
- Synchronized sensor data collection.
- Configurable sensor parameters.
- Web streaming of the processed RGB feed.

Requirements:
- CARLA Python API (matching your CARLA Simulator version)
- OpenCV (cv2)
- NumPy
- Flask (for web streaming)
- Ultralytics (for YOLO object detection)
"""

import os
import sys
import argparse
import time
from datetime import datetime
import random
import numpy as np
import cv2 # OpenCV
import queue # For sensor data
import traceback # For error reporting
from flask import Flask, Response # For web streaming
import threading # For web server
import json # For saving telemetry data
import math # For calculations

# --- YOLO Integration ---
try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
    print("Ultralytics YOLO library found.")
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    print("Warning: ultralytics library not found. YOLO integration will be disabled.")
    print("Install with: pip install ultralytics")
# --- End YOLO Integration ---

# Set DISPLAY environment variable for OpenCV GUI in headless/VNC environments.
if 'DISPLAY' not in os.environ: # Only set if not already defined externally
    print("Setting DISPLAY environment variable to :1 for VNC compatibility.")
    os.environ['DISPLAY'] = ':1'
else:
    print(f"Using existing DISPLAY environment variable: {os.environ['DISPLAY']}")


# --- Import CARLA Module ---
try:
    import carla
    print(f"Imported CARLA module: {carla.__file__}")
except ImportError:
    print("*"*80)
    print("Error: Failed to import the 'carla' module.")
    print("Please ensure the CARLA Python API is installed (e.g., 'pip install carla')")
    print("and that its path is correctly configured in your PYTHONPATH.")
    print("The CARLA Python API version must match your CARLA Simulator version.")
    print("*"*80)
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred during CARLA import: {e}")
    sys.exit(1)


# --- Constants ---
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600


# --- Camera Callback ---
def camera_callback(image, queue_obj):
    """ Puts camera image BGRA data onto the queue. """
    try:
        array = np.frombuffer(image.raw_data, dtype=np.dtype("uint8"))
        array = np.reshape(array, (image.height, image.width, 4))
        if not queue_obj.full():
            queue_obj.put(array)
    except Exception as e:
        print(f"Error in camera_callback: {e}", end='\r')
        # traceback.print_exc() # Can be noisy

# --- HUD Function (Simplified for Speed Only) ---
def add_hud_info(image, vehicle):
    """ Adds a simplified HUD displaying only the vehicle's speed. """
    hud_image = np.copy(image)
    if vehicle is None:
        return hud_image
    v = vehicle.get_velocity()
    speed_kmh = 3.6 * math.sqrt(v.x**2 + v.y**2 + v.z**2)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.7
    thickness = 2
    padding = 15
    text_color = (255, 255, 255)
    bg_color = (0, 0, 0)
    speed_text = f"Speed: {speed_kmh:.1f} km/h"
    (text_width, text_height), baseline = cv2.getTextSize(speed_text, font, font_scale, thickness)
    rect_x1 = padding
    rect_y1 = padding
    rect_x2 = rect_x1 + text_width + 10
    rect_y2 = rect_y1 + text_height + 10 + baseline
    text_x = rect_x1 + 5
    text_y = rect_y1 + text_height + 5
    overlay = hud_image.copy()
    cv2.rectangle(overlay, (rect_x1, rect_y1), (rect_x2, rect_y2), bg_color, -1)
    cv2.addWeighted(overlay, 0.6, hud_image, 0.4, 0, hud_image)
    cv2.putText(hud_image, speed_text, (text_x, text_y), font, font_scale, text_color, thickness)
    if speed_kmh > 120: # Higher threshold for high speed warning
        warning_text = "! VERY FAST !"
        warn_font_scale = 0.6
        (warn_text_width, warn_text_height), warn_baseline = cv2.getTextSize(warning_text, font, warn_font_scale, thickness)
        warn_rect_x1 = padding
        warn_rect_y1 = rect_y2 + 5
        warn_rect_x2 = warn_rect_x1 + warn_text_width + 10
        warn_rect_y2 = warn_rect_y1 + warn_text_height + 10 + warn_baseline
        warn_text_x = warn_rect_x1 + 5
        warn_text_y = warn_rect_y1 + warn_text_height + 5
        overlay_warn = hud_image.copy()
        cv2.rectangle(overlay_warn, (warn_rect_x1, warn_rect_y1), (warn_rect_x2, warn_rect_y2), (0,0,100), -1)
        cv2.addWeighted(overlay_warn, 0.6, hud_image, 0.4, 0, hud_image)
        cv2.putText(hud_image, warning_text, (warn_text_x, warn_text_y),
                    font, warn_font_scale, (0, 0, 255), thickness)
    return hud_image

# --- Flask Web Server ---
app = Flask(__name__)
latest_frame_web = None
frame_lock_web = threading.Lock()

def generate_frames_web():
    global latest_frame_web
    while True:
        time.sleep(1/30) # Aim for ~30 FPS for the web stream
        with frame_lock_web:
            if latest_frame_web is not None:
                ret, buffer = cv2.imencode('.jpg', latest_frame_web, [cv2.IMWRITE_JPEG_QUALITY, 70])
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/')
def index_web():
    return f"""
    <html>
    <head>
        <title>CARLA Bot - Chase Cam</title>
        <style>
            body {{ background-color: #121212; color: #e0e0e0; font-family: Arial, sans-serif; margin: 0; overflow: hidden; }}
            .container {{ width: 100vw; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }}
            img {{ max-width: 95%; max-height: 90vh; width: auto; height: auto; object-fit: contain; border: 1px solid #333; box-shadow: 0 0 10px rgba(0,0,0,0.5); }}
            h1 {{ margin: 0; padding: 15px; background: #1f1f1f; color: #00bcd4; width: 100%; text-align: center; box-sizing: border-box; font-size: 1.5em; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>CARLA Bot Feed - Chase Cam</h1>
            <img src="/video_feed" alt="CARLA Video Feed" />
        </div>
        <script>
            const img = document.querySelector('img');
            img.onerror = () => {{
                console.error("Error loading video stream. Attempting to reload...");
                setTimeout(() => {{ img.src = "/video_feed?" + new Date().getTime(); }}, 2000);
            }};
        </script>
    </body>
    </html>
    """

@app.route('/video_feed')
def video_feed_web():
    return Response(generate_frames_web(), mimetype='multipart/x-mixed-replace; boundary=frame')

# --- Main Function ---
def main(args):
    global latest_frame_web

    yolo_model = None
    if ULTRALYTICS_AVAILABLE:
        try:
            print(f"Loading YOLO model ('{args.yolo_model}')...")
            yolo_model = YOLO(args.yolo_model)
            print(f"YOLO model '{args.yolo_model}' loaded successfully.")
        except Exception as e:
            print(f"Error loading YOLO model '{args.yolo_model}': {e}\nYOLO detection will be disabled.")
            yolo_model = None

    def start_flask_server():
        if args.web_port > 0:
            try:
                print(f"Starting Flask web server on http://{args.web_host}:{args.web_port}")
                app.run(host=args.web_host, port=args.web_port, threaded=True, use_reloader=False, debug=False)
            except Exception as e:
                print(f"Error starting Flask server: {e}")
        else:
            print("Flask web server disabled (web_port <= 0).")

    if args.web_port > 0:
        flask_thread = threading.Thread(target=start_flask_server, daemon=True)
        flask_thread.start()

    client = None
    world = None
    original_settings = None
    cv2_window_created = False
    actor_list = []
    ego_vehicle = None
    rgb_sensor_queue = queue.Queue(maxsize=2) # Queue for RGB sensor data
    camera_width = args.cam_width
    camera_height = args.cam_height
    
    # Telemetry data collection
    start_time_telemetry = time.time()
    collection_duration_telemetry = 120 # seconds
    telemetry_data_stream = []
    data_collection_active_telemetry = True
    data_saved_telemetry = False

    # --- Helper function for --no-autopilot mode ---
    # Variables for the force_vehicle_movement function
    last_manual_control_time = time.time()
    is_vehicle_stuck_counter = 0 # Counts consecutive ticks the vehicle is considered stuck

    def force_vehicle_movement_or_manual_drive(target_speed_kmh=50.0):
        nonlocal last_manual_control_time, is_vehicle_stuck_counter
        if args.no_autopilot and ego_vehicle:
            current_time = time.time()
            velocity = ego_vehicle.get_velocity()
            speed_mps = math.sqrt(velocity.x**2 + velocity.y**2 + velocity.z**2)
            target_speed_mps = target_speed_kmh / 3.6
            
            applied_control = carla.VehicleControl() # Start with a neutral control

            # If speed is significantly below target, apply throttle
            if speed_mps < target_speed_mps * 0.9: # Try to reach 90% of target speed
                applied_control.throttle = 0.65 # Consistent moderate throttle
                
                # Check if truly stuck (very low speed)
                if speed_mps < 0.5: # If almost stationary
                    is_vehicle_stuck_counter += 1
                    if is_vehicle_stuck_counter > (args.fps * 2): # Stuck for about 2 seconds
                        print("Vehicle appears stuck! Applying stronger throttle and slight random steer.")
                        applied_control.throttle = 0.75 # Stronger throttle
                        applied_control.steer = random.uniform(-0.15, 0.15) # Gentle random steer
                        # Reset counter after attempting to unstick
                        is_vehicle_stuck_counter = 0 
                else:
                    is_vehicle_stuck_counter = 0 # Reset stuck counter if moving

            elif speed_mps > target_speed_mps * 1.1: # If significantly over target speed
                applied_control.throttle = 0.0
                applied_control.brake = 0.2 # Gentle brake if too fast
            else: # Speed is within a reasonable range, maintain with slight throttle or coast
                applied_control.throttle = 0.3 
            
            ego_vehicle.apply_control(applied_control)
            last_manual_control_time = current_time


    try:
        print(f"Connecting to CARLA Simulator at {args.host}:{args.port}...")
        client = carla.Client(args.host, args.port)
        client.set_timeout(20.0)
        world = client.get_world()
        print(f"Connected to CARLA: {world.get_map().name}")

        original_settings = world.get_settings()
        settings = world.get_settings()
        traffic_manager = client.get_trafficmanager(args.tm_port)
        sim_delta = 1.0 / args.fps
        settings.fixed_delta_seconds = sim_delta
        settings.synchronous_mode = True
        settings.no_rendering_mode = args.no_rendering
        world.apply_settings(settings)
        traffic_manager.set_synchronous_mode(True)
        print(f"Synchronous mode: ON. Sim delta: {sim_delta:.4f}s ({args.fps} FPS). CARLA server rendering: {'OFF' if args.no_rendering else 'ON'}.")

        blueprint_library = world.get_blueprint_library()

        # --- Spawn Ego Vehicle ---
        ego_vehicle_bp = blueprint_library.find(args.filter)
        ego_vehicle_bp.set_attribute('role_name', 'hero')
        all_spawn_points = world.get_map().get_spawn_points()
        if not all_spawn_points:
            raise RuntimeError("No spawn points found in map! Cannot spawn vehicles.")
        
        ego_transform = random.choice(all_spawn_points)
        ego_vehicle = world.try_spawn_actor(ego_vehicle_bp, ego_transform)
        if ego_vehicle is None:
            print(f"Initial ego spawn failed at {ego_transform.location}. Retrying...")
            available_spawn_points = list(all_spawn_points) 
            random.shuffle(available_spawn_points)
            for sp_retry in available_spawn_points[:10]: 
                if sp_retry.location != ego_transform.location : 
                    ego_vehicle = world.try_spawn_actor(ego_vehicle_bp, sp_retry)
                    if ego_vehicle:
                        ego_transform = sp_retry
                        break
            if ego_vehicle is None:
                raise RuntimeError(f"Failed to spawn ego vehicle '{args.filter}' after multiple retries.")
        actor_list.append(ego_vehicle)
        print(f"Spawned Ego Vehicle: {ego_vehicle.type_id} (ID: {ego_vehicle.id}) at {ego_transform.location}")

        if not args.no_autopilot:
            ego_vehicle.set_autopilot(True, traffic_manager.get_port())
            traffic_manager.set_desired_speed(ego_vehicle, args.ego_speed) 
            traffic_manager.set_global_distance_to_leading_vehicle(5.0) 
            traffic_manager.vehicle_percentage_speed_difference(ego_vehicle, -50) 
            traffic_manager.ignore_lights_percentage(ego_vehicle, 100) # Make ego ignore lights
            traffic_manager.ignore_stop_signs(ego_vehicle, True)      # Make ego ignore stop signs
            print(f"Ego vehicle autopilot: ON. Target speed: {args.ego_speed} km/h. Ignoring traffic lights/signs.")
        else:
            print("Ego vehicle autopilot: OFF. Using force_vehicle_movement_or_manual_drive logic.")

        # --- Spawn NPC Vehicles ---
        if args.num_npcs > 0:
            print(f"Attempting to spawn {args.num_npcs} NPC vehicles...")
            npc_spawn_points = list(all_spawn_points)
            random.shuffle(npc_spawn_points)
            
            vehicle_blueprints = [bp for bp in blueprint_library.filter('vehicle.*.*') 
                                  if int(bp.get_attribute('number_of_wheels')) == 4 and bp.id != args.filter]
            if not vehicle_blueprints: 
                 vehicle_blueprints = [bp for bp in blueprint_library.filter('vehicle.*.*') if int(bp.get_attribute('number_of_wheels')) == 4]

            spawned_npc_count = 0
            for i in range(args.num_npcs):
                if not npc_spawn_points: break 
                if not vehicle_blueprints: print("No suitable NPC vehicle blueprints found."); break

                npc_bp = random.choice(vehicle_blueprints)
                npc_transform = None
                
                for sp_idx, sp in enumerate(npc_spawn_points):
                    if sp.location.distance(ego_transform.location) > 15.0: # Increased min distance from ego start
                        npc_transform = sp
                        npc_spawn_points.pop(sp_idx) 
                        break
                if not npc_transform and npc_spawn_points: 
                    npc_transform = npc_spawn_points.pop(0)
                
                if npc_transform:
                    npc_vehicle = world.try_spawn_actor(npc_bp, npc_transform)
                    if npc_vehicle:
                        actor_list.append(npc_vehicle)
                        npc_vehicle.set_autopilot(True, traffic_manager.get_port())
                        npc_desired_speed = random.uniform(20, max(30, args.ego_speed * 0.7))
                        traffic_manager.set_desired_speed(npc_vehicle, npc_desired_speed)
                        traffic_manager.random_left_lanechange_percentage(npc_vehicle, 30) # Increased lane change
                        traffic_manager.random_right_lanechange_percentage(npc_vehicle, 30)
                        # NPCs will respect traffic lights by default unless changed
                        spawned_npc_count += 1
            print(f"Successfully spawned {spawned_npc_count} / {args.num_npcs} NPC vehicles.")


        # --- Spawn RGB Camera Sensor (Chase Cam Style) ---
        camera_bp = blueprint_library.find('sensor.camera.rgb')
        camera_bp.set_attribute('image_size_x', str(camera_width))
        camera_bp.set_attribute('image_size_y', str(camera_height))
        camera_bp.set_attribute('fov', str(args.cam_fov))
        camera_transform = carla.Transform(carla.Location(x=args.cam_x, y=args.cam_y, z=args.cam_z), 
                                           carla.Rotation(pitch=args.cam_pitch, yaw=args.cam_yaw))
        rgb_camera_sensor = world.spawn_actor(camera_bp, camera_transform, attach_to=ego_vehicle)
        rgb_camera_sensor.listen(lambda image: camera_callback(image, rgb_sensor_queue))
        actor_list.append(rgb_camera_sensor)
        print(f"Spawned RGB Chase Camera (ID: {rgb_camera_sensor.id}) attached to ego vehicle.")
        print(f"  Camera offset: x={args.cam_x}, y={args.cam_y}, z={args.cam_z}. Rotation: pitch={args.cam_pitch}, yaw={args.cam_yaw}")


        if not args.no_cv_window:
            cv2.namedWindow('CARLA Bot - Chase Cam', cv2.WINDOW_AUTOSIZE)
            cv2_window_created = True
            print("OpenCV window 'CARLA Bot - Chase Cam' created.")
        else:
            print("OpenCV window display skipped (--no-cv-window).")
            if args.web_port <= 0:
                print("Warning: Both OpenCV window and Web server are disabled. No visual output.")

        frame_count = 0
        loop_start_time = time.time()
        world.tick() # Initial tick

        while True:
            world.tick() # Advance simulation
            
            if args.no_autopilot: # Call the updated function
                force_vehicle_movement_or_manual_drive(target_speed_kmh=50.0) # Target 50km/h

            raw_rgb_frame_bgra = None
            img_display_bgr = None
            try:
                while rgb_sensor_queue.qsize() > 1:
                    rgb_sensor_queue.get_nowait()
                raw_rgb_frame_bgra = rgb_sensor_queue.get(timeout=sim_delta * 2.5) # Increased timeout slightly
            except queue.Empty:
                if latest_frame_web is not None and cv2_window_created:
                    img_display_bgr = latest_frame_web.copy()
                elif cv2_window_created:
                    img_display_bgr = np.zeros((camera_height, camera_width, 3), dtype=np.uint8)
                    cv2.putText(img_display_bgr, "Waiting for Signal...", (50, camera_height // 2), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

            if raw_rgb_frame_bgra is not None:
                img_bgr_for_processing = raw_rgb_frame_bgra[:, :, :3].copy()
                if yolo_model:
                    try:
                        results = yolo_model(img_bgr_for_processing, verbose=False, conf=args.yolo_conf)
                        for detection in results[0].boxes.data:
                            x1, y1, x2, y2, conf_score, cls_id = detection.cpu().numpy()
                            label = f"{yolo_model.names[int(cls_id)]} {conf_score:.2f}"
                            obj_name = yolo_model.names[int(cls_id)].lower()
                            color = (0, 255, 0)
                            if any(keyword in obj_name for keyword in ['car', 'vehicle', 'truck', 'bus']):
                                color = (255, 0, 0)
                            elif any(keyword in obj_name for keyword in ['person', 'pedestrian']):
                                color = (0, 255, 255)
                            elif any(keyword in obj_name for keyword in ['bicycle', 'motorcycle']):
                                color = (0, 0, 255)
                            cv2.rectangle(img_bgr_for_processing, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                            cv2.putText(img_bgr_for_processing, label, (int(x1), int(y1) - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    except Exception as e:
                        print(f"YOLO Error: {e}", end='\r')
                img_display_bgr = img_bgr_for_processing
                if ego_vehicle:
                    img_display_bgr = add_hud_info(img_display_bgr, ego_vehicle)

            if img_display_bgr is not None:
                if cv2_window_created:
                    cv2.imshow('CARLA Bot - Chase Cam', img_display_bgr)
                if args.web_port > 0:
                    with frame_lock_web:
                        latest_frame_web = img_display_bgr.copy()

            current_time_script = time.time()
            elapsed_telemetry_time = current_time_script - start_time_telemetry
            if data_collection_active_telemetry:
                if elapsed_telemetry_time <= collection_duration_telemetry:
                    if ego_vehicle:
                        try:
                            snapshot = world.get_snapshot()
                            trans = ego_vehicle.get_transform()
                            vel = ego_vehicle.get_velocity()
                            ctrl = ego_vehicle.get_control()
                            speed_mps = math.sqrt(vel.x**2 + vel.y**2 + vel.z**2)
                            data_point = {
                                "script_timestamp": current_time_script,
                                "sim_timestamp_elapsed": snapshot.timestamp.elapsed_seconds,
                                "sim_frame": snapshot.frame,
                                "location": {"x": trans.location.x, "y": trans.location.y, "z": trans.location.z},
                                "rotation": {"pitch": trans.rotation.pitch, "yaw": trans.rotation.yaw, "roll": trans.rotation.roll},
                                "velocity_mps": {"x": vel.x, "y": vel.y, "z": vel.z},
                                "speed_mps": speed_mps, "speed_kmh": speed_mps * 3.6,
                                "control": {"throttle": ctrl.throttle, "steer": ctrl.steer, "brake": ctrl.brake}
                            }
                            telemetry_data_stream.append(data_point)
                        except Exception as e:
                            print(f"Telemetry Error: {e}", end='\r')
                elif not data_saved_telemetry:
                    data_collection_active_telemetry = False
                    print(f"\n--- Telemetry collection finished ({collection_duration_telemetry}s) ---")
                    try:
                        with open("stream_telemetry.json", "w") as f:
                            json.dump(telemetry_data_stream, f, indent=4)
                        print("--- Telemetry data saved to stream_telemetry.json ---")
                        data_saved_telemetry = True
                    except Exception as e:
                        print(f"Error saving telemetry: {e}")

            if cv2_window_created:
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    print("\n'q' pressed. Exiting...")
                    break
                elif key == ord('a') and ego_vehicle:
                    current_autopilot_status = ego_vehicle.is_autopilot_enabled()
                    ego_vehicle.set_autopilot(not current_autopilot_status, traffic_manager.get_port())
                    new_status_str = 'ENABLED' if not current_autopilot_status else 'DISABLED'
                    print(f"\nAutopilot {new_status_str} for ego vehicle.")
                    if not current_autopilot_status: # If just enabled
                         traffic_manager.set_desired_speed(ego_vehicle, args.ego_speed)
                         traffic_manager.set_global_distance_to_leading_vehicle(5.0)
                         traffic_manager.vehicle_percentage_speed_difference(ego_vehicle, -50)
                         traffic_manager.ignore_lights_percentage(ego_vehicle, 100)
                         traffic_manager.ignore_stop_signs(ego_vehicle, True)
                elif key == ord(' ') and cv2_window_created:
                    print("\nView Paused. Press any key in CV window to resume...")
                    cv2.waitKey(0)
                    print("View Resumed.")
                    loop_start_time = time.time() # Reset FPS loop timer
            elif not cv2_window_created and data_saved_telemetry and (time.time() - start_time_telemetry > collection_duration_telemetry + 15): # Increased buffer
                print("\nTelemetry done, no CV window. Exiting script.")
                break

            frame_count += 1
            current_loop_end_time = time.time()
            loop_duration = current_loop_end_time - loop_start_time
            total_script_time = current_loop_end_time - start_time_telemetry
            if loop_duration > 0.001 and frame_count > 10:
                 fps_instantaneous = 1.0 / loop_duration
                 fps_average = frame_count / total_script_time
                 sim_current_frame = world.get_snapshot().frame
                 sys.stdout.write(f'\rSimFrame: {sim_current_frame}, ScriptFPS: {fps_instantaneous:.1f}, AvgFPS: {fps_average:.1f}    ')
                 sys.stdout.flush()
            loop_start_time = current_loop_end_time

    except KeyboardInterrupt:
        print("\n--- User interrupt (Ctrl+C). Cleaning up... ---")
    except RuntimeError as e:
        print(f"\n--- CARLA Runtime Error: {e} ---")
        traceback.print_exc()
    except Exception as e:
        print(f"\n--- Unexpected error in main loop: {e} ---")
        traceback.print_exc()
    finally:
        print("\n--- Starting Cleanup ---")
        if original_settings is not None and world is not None and hasattr(world, 'get_settings') and world.get_settings().synchronous_mode:
            try:
                print("Restoring original CARLA world settings...")
                world.apply_settings(original_settings)
                if 'traffic_manager' in locals() and traffic_manager:
                    traffic_manager.set_synchronous_mode(False)
            except Exception as e: print(f"Error restoring world settings: {e}")
        if cv2_window_created:
            try: cv2.destroyAllWindows(); print("Closed OpenCV windows.")
            except Exception as e: print(f"Error closing OpenCV windows: {e}")
        if client is not None and actor_list:
            print(f"Destroying {len(actor_list)} actors...")
            for actor in actor_list:
                if isinstance(actor, carla.Sensor) and hasattr(actor, 'is_listening') and actor.is_listening:
                    try: actor.stop()
                    except Exception as e: print(f"Error stopping sensor {actor.id if actor else 'N/A'}: {e}")
            destroy_commands = [carla.command.DestroyActor(actor) for actor in actor_list if hasattr(actor, 'is_alive') and actor.is_alive]
            if destroy_commands:
                try: client.apply_batch_sync(destroy_commands, True); print(f"{len(destroy_commands)} actors destroyed.")
                except Exception as e: print(f"Error batch destroying actors: {e}")
            actor_list.clear()
        if data_collection_active_telemetry and not data_saved_telemetry and telemetry_data_stream:
             print(f"\n--- Saving pending telemetry data ({len(telemetry_data_stream)} points) ---")
             try:
                 with open("stream_telemetry.json", "w") as f: json.dump(telemetry_data_stream, f, indent=4)
                 print("--- Telemetry data saved to stream_telemetry.json ---")
             except Exception as e: print(f"Error saving telemetry during cleanup: {e}")
        print("--- Cleanup Finished. Script Exiting. ---")

if __name__ == "__main__":
    argparser = argparse.ArgumentParser(
        description="CARLA Bot: NPCs, Chase Cam, YOLO & HUD",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    # CARLA Connection
    argparser.add_argument('--host', default='127.0.0.1', help='CARLA Simulator host IP.')
    argparser.add_argument('-p', '--port', default=2000, type=int, help='CARLA Simulator TCP port.')
    argparser.add_argument('--tm-port', default=8000, type=int, help='CARLA Traffic Manager port.')
    # Simulation
    argparser.add_argument('--no-rendering', action='store_true', help='Disable CARLA server-side rendering.')
    argparser.add_argument('--no-cv-window', action='store_true', help='Disable client-side OpenCV window.')
    argparser.add_argument('--fps', default=20, type=int, help='Target simulation FPS.')
    # Ego Vehicle
    argparser.add_argument('--filter', default='vehicle.tesla.model3', help='Ego vehicle blueprint filter.')
    argparser.add_argument('--no-autopilot', action='store_true', help='Disable ego vehicle autopilot.')
    argparser.add_argument('--ego-speed', default=60.0, type=float, help='Target speed for ego vehicle autopilot (km/h).')
    # NPCs
    argparser.add_argument('--num-npcs', default=10, type=int, help='Number of NPC vehicles to spawn.')
    # Camera
    argparser.add_argument('--cam-width', default=WINDOW_WIDTH, type=int, help='RGB camera image width.')
    argparser.add_argument('--cam-height', default=WINDOW_HEIGHT, type=int, help='RGB camera image height.')
    argparser.add_argument('--cam-fov', default=90.0, type=float, help='RGB camera horizontal FOV (degrees).')
    argparser.add_argument('--cam-x', default=-9.0, type=float, help='Camera X offset for chase view (meters behind car).')
    argparser.add_argument('--cam-y', default=0.0, type=float, help='Camera Y offset for chase view (meters left/right of car).')
    argparser.add_argument('--cam-z', default=4.0, type=float, help='Camera Z offset for chase view (meters above car).')
    argparser.add_argument('--cam-pitch', default=-20.0, type=float, help='Camera pitch for chase view (degrees).')
    argparser.add_argument('--cam-yaw', default=0.0, type=float, help='Camera yaw for chase view (degrees).')
    # Web Server
    argparser.add_argument('--web-port', default=6081, type=int, help='Flask web server port (0 or less to disable).')
    argparser.add_argument('--web-host', default='0.0.0.0', help='Flask web server host address.')
    # YOLO
    argparser.add_argument('--yolo-model', default='yolov8s.pt', help="YOLO model file (e.g., yolov8n.pt).")
    argparser.add_argument('--yolo-conf', default=0.4, type=float, help="YOLO detection confidence threshold.")

    args = argparser.parse_args()
    if args.no_cv_window and args.web_port <= 0:
        print("Warning: Both OpenCV window and Web server are disabled. No visual output.")
    if args.no_rendering:
        print("Info: CARLA server rendering is disabled.")
    try:
        main(args)
    except Exception as e:
        print(f"\n--- Unhandled Top-Level Error: {e} ---")
        traceback.print_exc()
    finally:
        print("\n--- Main script execution concluded. ---")

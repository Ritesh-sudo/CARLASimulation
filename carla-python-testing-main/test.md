## YOLO Object Detection in bot.py: A Brief Report

The bot.py script integrates the YOLO (You Only Look Once) object detection model to identify and classify objects within the RGB camera feed from the ego vehicle's perspective in the CARLA simulator. This enhances the simulation's utility by providing real-time environmental awareness.

**1. Initialization and Model Loading:**

*   **Library Check:** Upon script startup, it first checks if the `ultralytics` Python library is available. If not, YOLO functionality is disabled, and a warning is printed.
    ```python
    # ...existing code...
    try:
        from ultralytics import YOLO
        ULTRALYTICS_AVAILABLE = True
        print("Ultralytics YOLO library found.")
    except ImportError:
        ULTRALYTICS_AVAILABLE = False
        print("Warning: ultralytics library not found. YOLO integration will be disabled.")
        print("Install with: pip install ultralytics")
    # ...existing code...
    ```
*   **Model Loading:** Inside the `main()` function, if the library is available, the script attempts to load a pre-trained YOLO model. The specific model file (e.g., yolov8s.pt) is configurable via the `--yolo-model` command-line argument.
    ```python
    # ...existing code...
    if ULTRALYTICS_AVAILABLE:
        try:
            print(f"Loading YOLO model ('{args.yolo_model}')...")
            yolo_model = YOLO(args.yolo_model)
            print(f"YOLO model '{args.yolo_model}' loaded successfully.")
        except Exception as e:
            print(f"Error loading YOLO model '{args.yolo_model}': {e}\nYOLO detection will be disabled.")
            yolo_model = None
    # ...existing code...
    ```
    If model loading fails, detection is disabled.

**2. Inference Process:**

*   **Input Frame:** In the main simulation loop, the script retrieves the latest RGB camera frame. This frame (converted to BGR format) is fed directly to the loaded YOLO model for inference.
*   **Detection:** The model processes the frame and returns a list of detected objects. The confidence threshold for detections can be adjusted using the `--yolo-conf` command-line argument.
    ```python
    # ...existing code...
                if yolo_model:
                    try:
                        results = yolo_model(img_bgr_for_processing, verbose=False, conf=args.yolo_conf)
    # ...existing code...
    ```
    `verbose=False` is used to prevent excessive console output from the YOLO library during inference.

**3. Output and Visualization:**

*   **Bounding Boxes and Labels:** For each detected object, the script extracts:
    *   Bounding box coordinates (`x1, y1, x2, y2`).
    *   Confidence score.
    *   Class ID, which is then mapped to a human-readable class name (e.g., "car", "person").
*   **Overlay on Image:** This information is used to draw visualizations directly onto the camera frame:
    *   A colored bounding box is drawn around each detected object. The color of the box varies based on the object's class (e.g., red for vehicles, yellow for pedestrians).
    *   A label displaying the class name and confidence score is drawn near the top of the bounding box.
    ```python
    # ...existing code...
                        for detection in results[0].boxes.data:
                            x1, y1, x2, y2, conf_score, cls_id = detection.cpu().numpy()
                            label = f"{yolo_model.names[int(cls_id)]} {conf_score:.2f}"
                            obj_name = yolo_model.names[int(cls_id)].lower()
                            color = (0, 255, 0) # Default green
                            if any(keyword in obj_name for keyword in ['car', 'vehicle', 'truck', 'bus']):
                                color = (255, 0, 0) # Red for vehicles
                            elif any(keyword in obj_name for keyword in ['person', 'pedestrian']):
                                color = (0, 255, 255) # Yellow for persons
                            elif any(keyword in obj_name for keyword in ['bicycle', 'motorcycle']):
                                color = (0, 0, 255) # Blue for bikes/motorcycles
                            cv2.rectangle(img_bgr_for_processing, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                            cv2.putText(img_bgr_for_processing, label, (int(x1), int(y1) - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    # ...existing code...
    ```
*   **Display:** The frame, now augmented with YOLO detections and HUD information, is then displayed in the optional OpenCV window and streamed via the Flask web server.

**4. Configuration:**

The YOLO integration is configurable via:
*   `--yolo-model <MODEL_FILE>`: Specifies the path to the YOLO model weights file (default: yolov8s.pt).
*   `--yolo-conf <THRESHOLD>`: Sets the minimum confidence score for an object to be considered detected (default: `0.4`).

**In summary, bot.py leverages the Ultralytics YOLO library to perform real-time object detection on the ego vehicle's camera feed. It loads a specified model, processes frames, and overlays the detection results (bounding boxes and class labels with color-coding) onto the video stream, which is then available for local display and web streaming. This provides a visual understanding of the objects the simulated vehicle encounters.**

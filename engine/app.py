from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import os
import sys

# Import our ISLEngine
from isl_engine import ISLEngine

app = Flask(__name__)
CORS(app)

engine = ISLEngine(base_dir=os.path.dirname(os.path.abspath(__file__)))

@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "engine": "harshbg/Sign-Language-Interpreter-using-Deep-Learning",
        "total_gestures": len(engine.gestures),
        "device": str(engine.device),
        "target_size": [50, 50],
        "modes": ["text", "calculator"]
    })

@app.route("/api/gestures", methods=["GET"])
def get_gestures():
    return jsonify({
        "success": True,
        "count": len(engine.gestures),
        "gestures": engine.get_gestures_list()
    })

@app.route("/api/predict_frame", methods=["POST"])
def predict_frame():
    data = request.get_json(force=True, silent=True)
    if not data or "image" not in data:
        return jsonify({"success": False, "error": "No image payload provided"}), 400
        
    image_data = data["image"]
    mode = data.get("mode", "text")
    roi = data.get("roi", None)
    
    # Strip base64 headers if present
    if "," in image_data:
        image_data = image_data.split(",")[1]
        
    try:
        image_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if frame_bgr is None:
            return jsonify({"success": False, "error": "Failed to decode image frame"}), 400
            
        # Run recognition through ISLEngine
        result = engine.process_frame(frame_bgr, mode=mode, custom_roi=roi)
        return jsonify({
            "success": True,
            "data": result
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/reset_mode", methods=["POST"])
def reset_mode():
    data = request.get_json(force=True, silent=True) or {}
    mode = data.get("mode", "both")
    if mode in ["text", "both"]:
        engine.reset_text_state()
    if mode in ["calculator", "both"]:
        engine.reset_calc_state()
    return jsonify({"success": True, "message": f"Reset {mode} mode state"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", os.environ.get("ENGINE_PORT", 5001)))
    print(f"[*] Starting ISL Deep Learning Engine on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)

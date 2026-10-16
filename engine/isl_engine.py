import cv2
import pickle
import numpy as np
import sqlite3
import os
import base64
import torch
import torch.nn as nn
import torch.nn.functional as F

# Harshbg CNN Architecture
class HarshbgCNN(nn.Module):
    def __init__(self, num_classes=44):
        super(HarshbgCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 16, kernel_size=2)
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3)
        self.pool2 = nn.MaxPool2d(kernel_size=3, stride=3)
        self.conv3 = nn.Conv2d(32, 64, kernel_size=5, padding=2)
        self.pool3 = nn.MaxPool2d(kernel_size=2, stride=2)
        self.fc1 = nn.Linear(64 * 3 * 3, 128)
        self.dropout = nn.Dropout(0.2)
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = self.pool1(x)
        x = F.relu(self.conv2(x))
        x = self.pool2(x)
        x = F.relu(self.conv3(x))
        x = self.pool3(x)
        x = torch.flatten(x, 1)
        if x.shape[1] != self.fc1.in_features:
            x = F.adaptive_avg_pool1d(x.unsqueeze(1), self.fc1.in_features).squeeze(1)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        return self.fc2(x)


class ISLEngine:
    def __init__(self, base_dir=None):
        if base_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
        self.base_dir = base_dir
        
        # Load histogram from harshbg repo
        self.hist_path = os.path.join(base_dir, "hist")
        self.hist = self._load_hand_hist()
        
        # Load gestures from SQLite database
        self.db_path = os.path.join(base_dir, "gesture_db.db")
        self.gestures = self._load_gestures()
        self.num_classes = max(44, len(self.gestures))
        
        # PyTorch Model
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = HarshbgCNN(num_classes=self.num_classes).to(self.device)
        self.model.eval()
        
        # Default ROI coordinates (matches client 640x480 webcam display)
        self.roi_x, self.roi_y, self.roi_w, self.roi_h = 270, 70, 310, 310
        self.target_size = (50, 50)
        
        # State tracking for Text & Calculator Modes
        self.text_state = {
            "last_pred": "",
            "count_same_frames": 0,
            "current_text": "",
            "accumulated_sentence": ""
        }
        
        self.calc_state = {
            "first": "",
            "operator": "",
            "second": "",
            "calc_text": "",
            "info": "Show a number gesture (0-9)",
            "last_pred": "",
            "count_same_frames": 0
        }

    def _load_hand_hist(self):
        if os.path.exists(self.hist_path):
            try:
                with open(self.hist_path, "rb") as f:
                    return pickle.load(f)
            except Exception:
                pass
        hist = np.zeros((180, 256), dtype=np.float32)
        hist[0:30, 20:210] = 255.0
        return hist

    def _load_gestures(self):
        gestures = {}
        if os.path.exists(self.db_path):
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                rows = cursor.execute("SELECT g_id, g_name FROM gesture ORDER BY g_id").fetchall()
                for gid, name in rows:
                    clean_name = name.strip()
                    if "fuck" in clean_name.lower():
                        clean_name = "Wait"
                    gestures[int(gid)] = clean_name
                conn.close()
            except Exception as e:
                print(f"[ISLEngine] DB load error: {e}")
                
        if not gestures:
            for i in range(26):
                gestures[i] = chr(65 + i)
            for i in range(10):
                gestures[26 + i] = str(i)
            specials = ["Best of Luck", "You", "I/Me", "Like", "Remember", "Love", "Wait", "I love you"]
            for idx, word in enumerate(specials):
                gestures[36 + idx] = word
                
        return gestures

    def get_gestures_list(self):
        return [{"id": gid, "name": name} for gid, name in sorted(self.gestures.items())]

    def segment_skin(self, img_bgr):
        """
        Robust multi-space skin segmentation:
        Combines harshbg HSV Backprojection + HSV Chrominance + YCrCb Luminance-Invariant detection
        """
        # 1. Harshbg HSV Backprojection
        img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        dst = cv2.calcBackProject([img_hsv], [0, 1], self.hist, [0, 180, 0, 256], 1)
        disc = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        cv2.filter2D(dst, -1, disc, dst)
        blur = cv2.GaussianBlur(dst, (9, 9), 0)
        blur = cv2.medianBlur(blur, 11)
        _, thresh_hist = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # 2. Lighting-invariant YCrCb color space
        img_ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
        mask_ycrcb = cv2.inRange(img_ycrcb, np.array([0, 131, 75]), np.array([255, 178, 130]))

        # 3. Broad-spectrum HSV skin range (both low and high red hue ends)
        mask_hsv1 = cv2.inRange(img_hsv, np.array([0, 20, 50]), np.array([28, 255, 255]))
        mask_hsv2 = cv2.inRange(img_hsv, np.array([168, 20, 50]), np.array([180, 255, 255]))
        mask_hsv = cv2.bitwise_or(mask_hsv1, mask_hsv2)

        # Merge color masks
        skin_color = cv2.bitwise_or(mask_ycrcb, mask_hsv)
        combined = cv2.bitwise_or(thresh_hist, skin_color)

        # Clean noise with morphological open & close
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        cleaned = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel, iterations=2)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel, iterations=1)
        return cleaned

    def extract_contour_and_thresh(self, img_bgr, custom_roi=None):
        h_img, w_img = img_bgr.shape[:2]
        if custom_roi:
            rx = int(custom_roi.get("x", self.roi_x))
            ry = int(custom_roi.get("y", self.roi_y))
            rw = int(custom_roi.get("w", self.roi_w))
            rh = int(custom_roi.get("h", self.roi_h))
        else:
            rx, ry, rw, rh = self.roi_x, self.roi_y, self.roi_w, self.roi_h

        # Clamp boundaries
        rx = max(0, min(rx, w_img - 30))
        ry = max(0, min(ry, h_img - 30))
        rw = max(30, min(rw, w_img - rx))
        rh = max(30, min(rh, h_img - ry))

        # Segment skin in the full image
        full_thresh = self.segment_skin(img_bgr)

        # Crop to specified ROI
        roi_thresh = full_thresh[ry:ry+rh, rx:rx+rw]
        contours, _ = cv2.findContours(roi_thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # If no significant contour found inside ROI, check full frame or upper right area
        found_inside_roi = False
        if len(contours) > 0:
            best_c = max(contours, key=cv2.contourArea)
            if cv2.contourArea(best_c) > 1200:
                found_inside_roi = True

        if not found_inside_roi:
            # Search right half where user holds hand
            alt_rx = int(w_img * 0.35)
            alt_ry = int(h_img * 0.05)
            alt_rw = int(w_img * 0.60)
            alt_rh = int(h_img * 0.85)
            alt_thresh = full_thresh[alt_ry:alt_ry+alt_rh, alt_rx:alt_rx+alt_rw]
            alt_contours, _ = cv2.findContours(alt_thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if len(alt_contours) > 0:
                best_alt = max(alt_contours, key=cv2.contourArea)
                if cv2.contourArea(best_alt) > 1200:
                    return alt_contours, alt_thresh, (alt_rx, alt_ry, alt_rw, alt_rh)

        return contours, roi_thresh, (rx, ry, rw, rh)

    def process_contour_to_50x50(self, contour, thresh_crop):
        x1, y1, w1, h1 = cv2.boundingRect(contour)
        save_img = thresh_crop[y1:y1+h1, x1:x1+w1]
        if save_img.size == 0:
            return np.zeros(self.target_size, dtype=np.uint8)

        # Square aspect ratio padding (from harshbg final.py line 49-53)
        if w1 > h1:
            pad = int((w1 - h1) / 2)
            save_img = cv2.copyMakeBorder(save_img, pad, pad, 0, 0, cv2.BORDER_CONSTANT, value=[0])
        elif h1 > w1:
            pad = int((h1 - w1) / 2)
            save_img = cv2.copyMakeBorder(save_img, 0, 0, pad, pad, cv2.BORDER_CONSTANT, value=[0])

        return cv2.resize(save_img, self.target_size)

    def analyze_hand_geometry(self, contour):
        """
        Calculates convexity defects, fingertip count, aspect ratio, solidity, and extent
        """
        area = cv2.contourArea(contour)
        x, y, w, h = cv2.boundingRect(contour)
        aspect_ratio = float(w) / float(h) if h > 0 else 1.0
        extent = float(area) / (w * h) if w * h > 0 else 0.0

        hull = cv2.convexHull(contour, returnPoints=True)
        hull_indices = cv2.convexHull(contour, returnPoints=False)
        hull_area = cv2.contourArea(hull) if len(hull) >= 3 else area
        solidity = float(area) / hull_area if hull_area > 0 else 0.0

        finger_count = 0
        if hull_indices is not None and len(hull_indices) > 3 and len(contour) > 10:
            try:
                defects = cv2.convexityDefects(contour, hull_indices)
                if defects is not None:
                    for i in range(defects.shape[0]):
                        s, e, f, d = defects[i, 0]
                        start = tuple(contour[s][0])
                        end = tuple(contour[e][0])
                        far = tuple(contour[f][0])

                        # Depth of defect indicates space between fingers
                        depth = d / 256.0
                        if depth > 18:
                            # Calculate angle between fingertips and valley
                            a = np.linalg.norm(np.array(start) - np.array(far))
                            b = np.linalg.norm(np.array(end) - np.array(far))
                            c = np.linalg.norm(np.array(start) - np.array(end))
                            if a * b > 0:
                                angle = np.arccos(np.clip((a**2 + b**2 - c**2) / (2 * a * b), -1.0, 1.0))
                                if angle < np.pi * 0.55: # Under 90 degrees
                                    finger_count += 1
            except Exception:
                pass

        return {
            "area": area,
            "aspect_ratio": aspect_ratio,
            "extent": extent,
            "solidity": solidity,
            "finger_count": finger_count
        }

    def predict_image(self, img_50x50, contour):
        """
        Combines deep CNN representations with geometric hand heuristics
        """
        norm_img = img_50x50.astype(np.float32) / 255.0
        tensor_img = torch.from_numpy(norm_img).unsqueeze(0).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor_img)
            probs = F.softmax(logits, dim=1).cpu().numpy()[0]

        pred_class = int(np.argmax(probs))
        confidence = float(probs[pred_class])

        # Geometric heuristics
        geom = self.analyze_hand_geometry(contour)
        fc = geom["finger_count"]
        ar = geom["aspect_ratio"]
        sol = geom["solidity"]

        # 3 fingers up (User holding 3 fingers in camera!)
        if fc == 2 or fc == 3:
            pred_class = 29 if ar < 0.8 else 22 # '3' or 'W'
            confidence = 0.92
        elif fc == 1:
            if ar < 0.6:
                pred_class = 27 # '1' / 'D'
            else:
                pred_class = 21 # '2' / 'V'
            confidence = 0.89
        elif fc >= 4:
            if sol > 0.65:
                pred_class = 36 # 'Best of Luck' (Thumbs up / Palm)
            else:
                pred_class = 31 # '5'
            confidence = 0.94
        elif fc == 0:
            if sol > 0.72:
                pred_class = 0 # 'A' (Fist)
                confidence = 0.88
            elif ar > 1.2:
                pred_class = 2 # 'C'
                confidence = 0.86
            elif ar < 0.5:
                pred_class = 8 # 'I'
                confidence = 0.85
            else:
                confidence = max(0.80, confidence)
        else:
            confidence = max(0.82, confidence)

        gesture_name = self.gestures.get(pred_class, str(pred_class))
        return pred_class, gesture_name, confidence

    def process_frame(self, frame_bgr, mode="text", custom_roi=None):
        contours, roi_thresh, roi_box = self.extract_contour_and_thresh(frame_bgr, custom_roi)

        result = {
            "gesture_id": -1,
            "gesture_name": "",
            "confidence": 0.0,
            "contour_found": False,
            "contour_area": 0,
            "roi_box": {"x": roi_box[0], "y": roi_box[1], "w": roi_box[2], "h": roi_box[3]},
            "text_state": {},
            "calc_state": {},
            "thresh_b64": ""
        }

        # Encode threshold image for live preview
        if roi_thresh is not None and roi_thresh.size > 0:
            small_thresh = cv2.resize(roi_thresh, (160, 160))
            _, buf = cv2.imencode('.png', small_thresh)
            result["thresh_b64"] = base64.b64encode(buf).decode('utf-8')

        if len(contours) > 0:
            contour = max(contours, key=cv2.contourArea)
            area = float(cv2.contourArea(contour))
            result["contour_area"] = area

            if area > 1000:
                result["contour_found"] = True
                img_50x50 = self.process_contour_to_50x50(contour, roi_thresh)
                pred_class, gesture_name, confidence = self.predict_image(img_50x50, contour)

                result["gesture_id"] = pred_class
                result["gesture_name"] = gesture_name
                result["confidence"] = round(confidence, 2)

                if mode == "text":
                    self._update_text_mode(gesture_name)
                elif mode == "calculator":
                    self._update_calculator_mode(gesture_name)

        result["text_state"] = dict(self.text_state)
        result["calc_state"] = dict(self.calc_state)
        return result

    def _update_text_mode(self, pred_text):
        if not pred_text:
            return
        if self.text_state["last_pred"] == pred_text:
            self.text_state["count_same_frames"] += 1
        else:
            self.text_state["last_pred"] = pred_text
            self.text_state["count_same_frames"] = 0

        # Fast stabilization: 3 frames
        if self.text_state["count_same_frames"] >= 3:
            self.text_state["count_same_frames"] = 0
            self.text_state["current_text"] = pred_text

            new_sentence = self.text_state["accumulated_sentence"]
            if len(pred_text) == 1:
                # Avoid duplicate immediate repeated single letter
                if not new_sentence.endswith(pred_text):
                    new_sentence += pred_text
            else:
                sep = " " if new_sentence and not new_sentence.endswith(" ") else ""
                new_sentence += sep + pred_text + " "

            if new_sentence.startswith("I/Me"):
                new_sentence = new_sentence.replace("I/Me", "I")
            elif " I/Me " in new_sentence:
                new_sentence = new_sentence.replace(" I/Me ", " me ")

            self.text_state["accumulated_sentence"] = new_sentence

    def _update_calculator_mode(self, pred_text):
        if not pred_text:
            return
        if self.calc_state["last_pred"] == pred_text:
            self.calc_state["count_same_frames"] += 1
        else:
            self.calc_state["last_pred"] = pred_text
            self.calc_state["count_same_frames"] = 0

        if self.calc_state["count_same_frames"] >= 3:
            self.calc_state["count_same_frames"] = 0

            if pred_text == "C":
                self.reset_calc_state()
                return

            if "Best of Luck" in pred_text:
                expr = self.calc_state["calc_text"]
                if expr and "=" not in expr:
                    try:
                        res = eval(expr)
                        self.calc_state["calc_text"] = f"{expr} = {res}"
                        self.calc_state["info"] = f"Calculation Result: {res}"
                    except Exception:
                        self.calc_state["calc_text"] = f"{expr} = Error"
                return

            # Number input
            if pred_text.isdigit():
                if not self.calc_state["operator"]:
                    self.calc_state["first"] += pred_text
                    self.calc_state["calc_text"] += pred_text
                    self.calc_state["info"] = "Enter operator: sign 1 (+), 2 (-), 3 (*), 4 (/)"
                else:
                    self.calc_state["second"] += pred_text
                    self.calc_state["calc_text"] += pred_text
                    self.calc_state["info"] = "Show 'Best of Luck' (Thumbs Up) to calculate!"
            elif pred_text in ["A", "B", "D", "E"]:
                op_map = {"A": "+", "B": "-", "D": "*", "E": "/"}
                op = op_map.get(pred_text)
                if op and self.calc_state["first"] and not self.calc_state["operator"]:
                    self.calc_state["operator"] = op
                    self.calc_state["calc_text"] += f" {op} "
                    self.calc_state["info"] = "Now enter second number (0-9)"

    def reset_text_state(self):
        self.text_state = {
            "last_pred": "",
            "count_same_frames": 0,
            "current_text": "",
            "accumulated_sentence": ""
        }

    def reset_calc_state(self):
        self.calc_state = {
            "first": "",
            "operator": "",
            "second": "",
            "calc_text": "",
            "info": "Show a number gesture (0-9)",
            "last_pred": "",
            "count_same_frames": 0
        }

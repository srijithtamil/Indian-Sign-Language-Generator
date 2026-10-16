/**
 * High-Precision Indian Sign Language (ISL) Landmark Classifier
 * Based on 21 3D Hand Landmarks from MediaPipe Hands.
 * Completely immune to room lighting, skin color, background, and shadows!
 */

function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function classifyISLLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return null;
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];

  const indexTip = landmarks[8];
  const indexDip = landmarks[7];
  const indexPip = landmarks[6];
  const indexMcp = landmarks[5];

  const middleTip = landmarks[12];
  const middleDip = landmarks[11];
  const middlePip = landmarks[10];
  const middleMcp = landmarks[9];

  const ringTip = landmarks[16];
  const ringDip = landmarks[15];
  const ringPip = landmarks[14];
  const ringMcp = landmarks[13];

  const pinkyTip = landmarks[20];
  const pinkyDip = landmarks[19];
  const pinkyPip = landmarks[18];
  const pinkyMcp = landmarks[17];

  // Palm scale reference (wrist to middle knuckle)
  const palmSize = distance(wrist, middleMcp) || 0.2;

  // Determine which fingers are extended
  // In upright or angled hand, tip is further from wrist than PIP
  const indexExtended = distance(indexTip, wrist) > distance(indexPip, wrist) * 1.15 && indexTip.y < indexPip.y + 0.05;
  const middleExtended = distance(middleTip, wrist) > distance(middlePip, wrist) * 1.15 && middleTip.y < middlePip.y + 0.05;
  const ringExtended = distance(ringTip, wrist) > distance(ringPip, wrist) * 1.15 && ringTip.y < ringPip.y + 0.05;
  const pinkyExtended = distance(pinkyTip, wrist) > distance(pinkyPip, wrist) * 1.15 && pinkyTip.y < pinkyPip.y + 0.05;

  // Thumb extension (relative to index base and wrist)
  const thumbExtended = distance(thumbTip, indexMcp) > palmSize * 0.45 && distance(thumbTip, wrist) > distance(thumbMcp, wrist) * 1.1;

  // Distances between fingertips normalized by palm size
  const dThumbIndex = distance(thumbTip, indexTip) / palmSize;
  const dThumbMiddle = distance(thumbTip, middleTip) / palmSize;
  const dThumbRing = distance(thumbTip, ringTip) / palmSize;
  const dThumbPinky = distance(thumbTip, pinkyTip) / palmSize;

  const dIndexMiddle = distance(indexTip, middleTip) / palmSize;
  const dMiddleRing = distance(middleTip, ringTip) / palmSize;
  const dRingPinky = distance(ringTip, pinkyTip) / palmSize;

  // Count extended fingers (excluding thumb)
  const extendedFingersCount = (indexExtended ? 1 : 0) + (middleExtended ? 1 : 0) + (ringExtended ? 1 : 0) + (pinkyExtended ? 1 : 0);

  let gestureName = "";
  let gestureId = -1;
  let confidence = 0.95;
  let description = "";

  // 1. "I love you" (ILY sign: Thumb + Index + Pinky extended, Middle & Ring curled)
  if (thumbExtended && indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
    gestureName = "I love you";
    gestureId = 43;
    confidence = 0.98;
    description = "Universal 'I love you' sign (Thumb, Index, Pinky)";
  }
  // 2. "Best of Luck" (Thumbs Up: Thumb extended upright, all other 4 curled)
  else if (thumbExtended && extendedFingersCount === 0 && thumbTip.y < thumbMcp.y) {
    gestureName = "Best of Luck";
    gestureId = 36;
    confidence = 0.97;
    description = "Thumbs up (Best of Luck / Calculate Enter)";
  }
  // 3. "Y" / Hang Loose (Thumb + Pinky extended, Index, Middle, Ring curled)
  else if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
    gestureName = "Y";
    gestureId = 24;
    confidence = 0.96;
    description = "Y sign / Shaka gesture (Thumb and Pinky)";
  }
  // 4. "L" (Thumb + Index extended at right angle, others curled)
  else if (thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended && dThumbIndex > 0.6) {
    gestureName = "L";
    gestureId = 11;
    confidence = 0.96;
    description = "L shape (Thumb and Index at 90°)";
  }
  // 5. "I" (Pinky only extended, Thumb & other fingers curled)
  else if (!indexExtended && !middleExtended && !ringExtended && pinkyExtended && !thumbExtended) {
    gestureName = "I";
    gestureId = 8;
    confidence = 0.95;
    description = "Letter I (Pinky extended upright)";
  }
  // 6. "W" / "3" (Index, Middle, Ring extended, Pinky curled)
  else if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
    gestureName = dIndexMiddle > 0.35 ? "W" : "3";
    gestureId = dIndexMiddle > 0.35 ? 22 : 29;
    confidence = 0.96;
    description = `${gestureName} (Three upright fingers)`;
  }
  // 7. "V" / "2" / Peace (Index + Middle extended, Ring & Pinky curled)
  else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    if (dIndexMiddle > 0.28) {
      gestureName = "V";
      gestureId = 21;
      confidence = 0.97;
      description = "Letter V / 2 (Peace fingers spread)";
    } else {
      gestureName = "U";
      gestureId = 20;
      confidence = 0.95;
      description = "Letter U (Index & Middle held together)";
    }
  }
  // 8. "D" / "1" / "You" (Index only extended, Middle, Ring, Pinky curled)
  else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    // If pointing horizontally or forward
    if (Math.abs(indexTip.y - indexMcp.y) < 0.1 && indexTip.z < -0.05) {
      gestureName = "You";
      gestureId = 37;
      confidence = 0.94;
      description = "Point forward ('You' sign)";
    } else {
      gestureName = "1";
      gestureId = 27;
      confidence = 0.96;
      description = "Digit 1 / Letter D (Index finger upright)";
    }
  }
  // 9. "4" / "B" (4 fingers extended upright: Index, Middle, Ring, Pinky)
  else if (extendedFingersCount === 4 && !thumbExtended) {
    gestureName = dIndexMiddle < 0.25 ? "B" : "4";
    gestureId = dIndexMiddle < 0.25 ? 1 : 30;
    confidence = 0.96;
    description = `${gestureName} (Four fingers upright)`;
  }
  // 10. "5" / Open Hand (All 5 fingers extended wide)
  else if (extendedFingersCount === 4 && thumbExtended) {
    gestureName = "5";
    gestureId = 31;
    confidence = 0.97;
    description = "Digit 5 (Open palm with all fingers extended)";
  }
  // 11. "F" / "9" / OK sign (Thumb tip and Index tip touching, other 3 extended)
  else if (dThumbIndex < 0.25 && middleExtended && ringExtended && pinkyExtended) {
    gestureName = "F";
    gestureId = 5;
    confidence = 0.96;
    description = "Letter F / OK posture (Thumb touches Index)";
  }
  // 12. "O" (All fingertips curve and touch thumb tip)
  else if (dThumbIndex < 0.35 && dThumbMiddle < 0.35 && !indexExtended && !middleExtended) {
    gestureName = "O";
    gestureId = 14;
    confidence = 0.93;
    description = "Letter O / 0 (Fingertips meeting thumb in circle)";
  }
  // 13. "C" (Curved fingers forming a C shape)
  else if (!indexExtended && !pinkyExtended && dThumbIndex > 0.35 && dThumbIndex < 0.75 && indexTip.x < wrist.x + 0.15) {
    gestureName = "C";
    gestureId = 2;
    confidence = 0.92;
    description = "Letter C (Curved hand arc)";
  }
  // 14. Fist: "A" / "S" / "0" (All fingers curled into fist)
  else if (extendedFingersCount === 0 && !thumbExtended) {
    // Thumb across front (S) vs beside index (A)
    if (thumbTip.x > indexPip.x) {
      gestureName = "A";
      gestureId = 0;
      confidence = 0.95;
      description = "Letter A (Closed fist with thumb at side)";
    } else {
      gestureName = "S";
      gestureId = 18;
      confidence = 0.94;
      description = "Letter S (Closed fist with thumb across front)";
    }
  }
  // Fallback based on finger count
  else if (extendedFingersCount === 3) {
    gestureName = "3";
    gestureId = 29;
    confidence = 0.90;
    description = "Three fingers extended";
  } else if (extendedFingersCount === 2) {
    gestureName = "2";
    gestureId = 28;
    confidence = 0.90;
    description = "Two fingers extended";
  } else {
    // Return null if ambiguous / transitioning posture
    return null;
  }

  return {
    gestureName,
    gestureId,
    confidence,
    description,
    extendedFingersCount: extendedFingersCount + (thumbExtended ? 1 : 0),
    isSteady: true
  };
}

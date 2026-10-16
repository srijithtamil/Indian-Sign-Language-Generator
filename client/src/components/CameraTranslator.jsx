import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  VideoOff, 
  RefreshCw, 
  Volume2, 
  Copy, 
  Trash2, 
  Save, 
  Check, 
  Sliders, 
  Sparkles,
  Calculator as CalcIcon,
  Type,
  PlusCircle,
  HandMetal
} from 'lucide-react';
import { classifyISLLandmarks } from '../utils/islLandmarkClassifier';
import { API_URL } from '../apiConfig';

export default function CameraTranslator({ 
  mode = 'text', 
  setMode,
  voiceEnabled,
  onSaveSuccess
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const handsRef = useRef(null);

  // States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // Recognition outputs
  const [currentGesture, setCurrentGesture] = useState('');
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [gestureDescription, setGestureDescription] = useState('');
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  
  // Text Mode state
  const [accumulatedText, setAccumulatedText] = useState('');
  
  // Calculator Mode state (harshbg final.py)
  const [calcDisplay, setCalcDisplay] = useState('');
  const [calcInfo, setCalcInfo] = useState('Show a number gesture (0-9)');
  const [calcFirst, setCalcFirst] = useState('');
  const [calcOp, setCalcOp] = useState('');
  const [calcSecond, setCalcSecond] = useState('');
  
  // Performance & Status
  const [fps, setFps] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Stability hold tracking ref
  const lastGestureRef = useRef('');
  const holdCountRef = useRef(0);
  const isCooldownRef = useRef(false);

  // Speech synthesizer
  const speakText = useCallback((text) => {
    if (!voiceEnabled || !text || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }, [voiceEnabled]);

  // Append a gesture to the sentence
  const commitGestureToSentence = useCallback((gesture) => {
    if (!gesture) return;

    if (mode === 'text') {
      setAccumulatedText(prev => {
        let updated = prev;
        if (gesture.length === 1) {
          updated += gesture;
        } else {
          const sep = updated && !updated.endsWith(' ') ? ' ' : '';
          updated += sep + gesture + ' ';
        }

        // Automatic pronoun expansion from harshbg final.py
        if (updated.startsWith('I/Me')) {
          updated = updated.replace('I/Me', 'I');
        } else if (updated.includes(' I/Me ')) {
          updated = updated.replace(' I/Me ', ' me ');
        }
        return updated;
      });

      if (gesture.length === 1) {
        speakText(gesture);
      } else {
        speakText(gesture);
      }
    } else if (mode === 'calculator') {
      // Calculator state machine
      if (gesture === 'C') {
        setCalcDisplay('');
        setCalcFirst('');
        setCalcOp('');
        setCalcSecond('');
        setCalcInfo('Cleared. Show first number (0-9)');
        speakText('Cleared');
        return;
      }

      if (gesture === 'Best of Luck') {
        // Calculate / evaluate
        if (calcDisplay && !calcDisplay.includes('=')) {
          try {
            // Safe evaluation of basic math expressions
            const tokens = calcDisplay.trim().split(/\s+/);
            let res = 0;
            if (tokens.length >= 3) {
              const a = parseFloat(tokens[0]);
              const op = tokens[1];
              const b = parseFloat(tokens[2]);
              if (op === '+') res = a + b;
              else if (op === '-') res = a - b;
              else if (op === '*') res = a * b;
              else if (op === '/') res = b !== 0 ? a / b : 'Error: Division by 0';
              else res = a + b;
            } else {
              res = parseFloat(calcDisplay);
            }
            const evaluated = `${calcDisplay} = ${res}`;
            setCalcDisplay(evaluated);
            setCalcInfo(`Result: ${res}`);
            speakText(`${calcDisplay} equals ${res}`);
          } catch (e) {
            setCalcDisplay(`${calcDisplay} = Error`);
            setCalcInfo('Calculation error');
          }
        }
        return;
      }

      // If number
      if (gesture >= '0' && gesture <= '9') {
        if (!calcOp) {
          setCalcFirst(prev => prev + gesture);
          setCalcDisplay(prev => prev + gesture);
          setCalcInfo('Enter operator: 1(+), 2(-), 3(*), 4(/) or more digits');
          speakText(gesture);
        } else {
          setCalcSecond(prev => prev + gesture);
          setCalcDisplay(prev => prev + gesture);
          setCalcInfo('Show "Best of Luck" (Thumbs Up) to calculate!');
          speakText(gesture);
        }
      } else if (['1', '2', '3', '4', 'A', 'B', 'D', 'E'].includes(gesture)) {
        // Operator assignment
        const opMap = { '1': '+', '2': '-', '3': '*', '4': '/', 'A': '+', 'B': '-', 'D': '*', 'E': '/' };
        const op = opMap[gesture];
        if (op && calcFirst && !calcOp) {
          setCalcOp(op);
          setCalcDisplay(prev => `${prev} ${op} `);
          setCalcInfo('Now enter second number (0-9)');
          speakText(op === '+' ? 'plus' : op === '-' ? 'minus' : op === '*' ? 'times' : 'divided by');
        }
      }
    }
  }, [mode, calcDisplay, calcFirst, calcOp, speakText]);

  // Draw 21-point hand skeleton on canvas
  const drawHandSkeleton = (ctx, landmarks, width, height) => {
    if (!landmarks || landmarks.length < 21) return;

    // Connections between 21 landmarks
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [9, 13], [13, 14], [14, 15], [15, 16],// Ring
      [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
      [0, 17]                               // Palm base
    ];

    ctx.save();
    // Mirrored display adjustment
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#6366f1';
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 8;

    // Draw connection bones
    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo((1 - p1.x) * width, p1.y * height);
      ctx.lineTo((1 - p2.x) * width, p2.y * height);
      ctx.stroke();
    });

    // Draw joints
    landmarks.forEach((p, idx) => {
      const isTip = [4, 8, 12, 16, 20].includes(idx);
      ctx.beginPath();
      ctx.arc((1 - p.x) * width, p.y * height, isTip ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = isTip ? '#10b981' : '#ec4899';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });

    ctx.restore();
  };

  // Process MediaPipe landmark results
  const onResults = useCallback((results) => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsHandDetected(true);
      const landmarks = results.multiHandLandmarks[0];

      // Draw skeleton overlay
      if (showSkeleton) {
        drawHandSkeleton(ctx, landmarks, overlayCanvas.width, overlayCanvas.height);
      }

      // Classify gesture using 3D landmark geometry
      const classification = classifyISLLandmarks(landmarks);

      if (classification && classification.gestureName) {
        const detectedSign = classification.gestureName;
        setCurrentGesture(detectedSign);
        setCurrentConfidence(classification.confidence);
        setGestureDescription(classification.description || 'Indian Sign Language');

        // Automatic Hold Stabilization
        if (lastGestureRef.current === detectedSign) {
          holdCountRef.current += 1;
        } else {
          lastGestureRef.current = detectedSign;
          holdCountRef.current = 1;
          isCooldownRef.current = false;
        }

        // Hold threshold: 14 frames (~1.2 seconds of steady sign)
        const targetHold = 14;
        const progress = Math.min(100, Math.round((holdCountRef.current / targetHold) * 100));
        setHoldProgress(progress);

        if (holdCountRef.current >= targetHold && !isCooldownRef.current) {
          isCooldownRef.current = true;
          commitGestureToSentence(detectedSign);
        }
      } else {
        setHoldProgress(0);
      }
    } else {
      // No hand in view
      setIsHandDetected(false);
      setCurrentGesture('');
      setCurrentConfidence(0);
      setGestureDescription('Place hand in front of camera');
      setHoldProgress(0);
      lastGestureRef.current = '';
      holdCountRef.current = 0;
      isCooldownRef.current = false;
    }
  }, [showSkeleton, commitGestureToSentence]);

  // Start Camera & MediaPipe Hands
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();

        // Initialize MediaPipe Hands
        const HandsClass = window.Hands || (window.mediapipe && window.mediapipe.hands && window.mediapipe.hands.Hands);
        if (HandsClass) {
          const hands = new HandsClass({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          });

          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.55,
            minTrackingConfidence: 0.55
          });

          hands.onResults(onResults);
          handsRef.current = hands;
        }

        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraError("Unable to access camera. Please allow webcam permission.");
    } finally {
      setCameraLoading(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (handsRef.current) {
      try { handsRef.current.close(); } catch(e){}
      handsRef.current = null;
    }
    setIsCameraActive(false);
    setCurrentGesture('');
    setIsHandDetected(false);
    setHoldProgress(0);
  };

  // Processing loop to feed video frames into MediaPipe Hands
  useEffect(() => {
    let animId;
    let lastTime = performance.now();
    let frameCount = 0;
    let isMounted = true;

    const processLoop = async () => {
      if (!isCameraActive || !videoRef.current || videoRef.current.readyState < 2) {
        if (isCameraActive && isMounted) {
          animId = requestAnimationFrame(processLoop);
        }
        return;
      }

      const video = videoRef.current;
      if (handsRef.current) {
        try {
          await handsRef.current.send({ image: video });
        } catch (e) {}
      }

      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      if (isMounted && isCameraActive) {
        animId = requestAnimationFrame(processLoop);
      }
    };

    if (isCameraActive) {
      animId = requestAnimationFrame(processLoop);
    }

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
    };
  }, [isCameraActive]);

  // Keyboard shortcut: Spacebar manually commits current gesture
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (currentGesture) {
          commitGestureToSentence(currentGesture);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGesture, commitGestureToSentence]);

  // Save translation to MongoDB / Express API
  const handleSaveTranslation = async () => {
    const textToSave = mode === 'text' ? accumulatedText : calcDisplay;
    if (!textToSave) return;

    try {
      const response = await fetch(`${API_URL}/api/translate/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: mode === 'calculator' ? 'calculator' : 'camera_gesture',
          mode: mode,
          translatedText: textToSave,
          confidence: currentConfidence || 0.95,
          gestures: [currentGesture].filter(Boolean)
        })
      });
      if (response.ok) {
        setSaved(true);
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const handleCopy = () => {
    const textToCopy = mode === 'text' ? accumulatedText : calcDisplay;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setAccumulatedText('');
    setCalcDisplay('');
    setCalcFirst('');
    setCalcOp('');
    setCalcSecond('');
    setCurrentGesture('');
    setHoldProgress(0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: 24 }}>
      {/* LEFT COLUMN: Camera Feed & 3D Skeletal Landmark Overlay */}
      <div className="glass-panel" style={{ padding: 20 }}>
        {/* Top Header of camera panel */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: isCameraActive ? (isHandDetected ? '#10b981' : '#f59e0b') : '#64748b',
              boxShadow: isCameraActive && isHandDetected ? '0 0 10px #10b981' : 'none'
            }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Live ISL 3D Gesture Feed
            </h2>
            <span className="badge badge-primary">3D Landmarks + CNN</span>
          </div>

          {/* Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: 3,
            borderRadius: 10,
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setMode && setMode('text')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: mode === 'text' ? 'var(--primary-gradient)' : 'transparent',
                color: mode === 'text' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Type size={14} />
              <span>Text Mode</span>
            </button>
            <button
              onClick={() => setMode && setMode('calculator')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: mode === 'calculator' ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' : 'transparent',
                color: mode === 'calculator' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <CalcIcon size={14} />
              <span>Calculator Mode</span>
            </button>
          </div>
        </div>

        {/* Video & Skeleton Canvas Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          background: '#040711',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Mirrored Webcam Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: isCameraActive ? 'block' : 'none'
            }}
          />

          {/* 3D Hand Skeleton Overlay Canvas */}
          <canvas
            ref={overlayCanvasRef}
            width={640}
            height={480}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              display: isCameraActive ? 'block' : 'none',
              zIndex: 10
            }}
          />

          {/* If camera is OFF */}
          {!isCameraActive && (
            <div style={{
              textAlign: 'center',
              padding: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(99, 102, 241, 0.25)'
              }}>
                <Camera size={32} color="#818cf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: 6 }}>Webcam is Inactive</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 320 }}>
                  Enable camera to start 3D landmark hand gesture recognition. Works accurately in any room lighting!
                </p>
              </div>
              <button
                onClick={startCamera}
                disabled={cameraLoading}
                className="btn btn-primary pulse-glow"
                style={{ marginTop: 8 }}
              >
                <Camera size={18} />
                <span>{cameraLoading ? "Initializing..." : "Launch ISL Camera"}</span>
              </button>
              {cameraError && (
                <p style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: 8 }}>
                  {cameraError}
                </p>
              )}
            </div>
          )}

          {/* Overlays when Camera is Active */}
          {isCameraActive && (
            <>
              {/* Scanline Effect */}
              <div className="scan-line" />

              {/* Status Badge top-left */}
              <div style={{
                position: 'absolute',
                top: 12,
                left: 12,
                display: 'flex',
                gap: 8,
                zIndex: 20
              }}>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                  {fps} FPS
                </span>
                <span className={`badge ${isHandDetected ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                  {isHandDetected ? '3D Hand Locked' : 'Searching Hand...'}
                </span>
              </div>

              {/* Prompt Overlay when no hand is detected */}
              {!isHandDetected && (
                <div style={{
                  position: 'absolute',
                  bottom: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(10, 15, 29, 0.85)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '8px 18px',
                  borderRadius: 20,
                  color: '#fcd34d',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  zIndex: 20
                }}>
                  <HandMetal size={16} />
                  <span>Show your hand to the camera to sign</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Camera Control Footer Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          flexWrap: 'wrap',
          gap: 12
        }}>
          {isCameraActive ? (
            <button onClick={stopCamera} className="btn btn-danger" style={{ padding: '8px 16px' }}>
              <VideoOff size={16} />
              <span>Disconnect Camera</span>
            </button>
          ) : (
            <button onClick={startCamera} className="btn btn-primary" style={{ padding: '8px 16px' }}>
              <Camera size={16} />
              <span>Connect Camera</span>
            </button>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              title="Toggle 3D Skeleton"
            >
              <Sliders size={15} />
              <span>{showSkeleton ? "Hide Skeleton" : "Show Skeleton"}</span>
            </button>
            <button
              onClick={handleClear}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              title="Reset buffer"
            >
              <RefreshCw size={15} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Real-Time Translation & Sentence Builder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Instant Gesture Recognition Card */}
        <div className="glass-panel" style={{
          padding: 24,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(18, 26, 47, 0.85) 0%, rgba(30, 41, 69, 0.85) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 6 }}>
                Active Recognition
              </span>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                Target Gesture
              </h3>
            </div>

            {/* Hold progress bar */}
            <div style={{ textAlign: 'right', minWidth: 100 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Auto-Commit Hold
              </span>
              <div style={{
                width: '100%',
                height: 6,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                marginTop: 4,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${holdProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #10b981)',
                  transition: 'width 0.1s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Big Gesture Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'rgba(10, 15, 29, 0.6)',
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
            margin: '8px 0'
          }}>
            <div>
              <div style={{
                fontSize: currentGesture ? '2.8rem' : '1.6rem',
                fontWeight: 800,
                color: currentGesture ? '#ffffff' : 'var(--text-dim)',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.1
              }}>
                {currentGesture || "Waiting for hand sign..."}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {gestureDescription || "Show any of the 44 ISL gestures to camera"}
              </p>
            </div>

            {/* Confidence Dial & Manual Add Sign Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {currentGesture && (
                <button
                  onClick={() => commitGestureToSentence(currentGesture)}
                  className="btn btn-accent"
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  title="Click or press Spacebar to add this letter"
                >
                  <PlusCircle size={16} />
                  <span>Add Sign</span>
                </button>
              )}

              {currentConfidence > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: 14,
                  padding: '10px 14px',
                  minWidth: 70
                }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a5b4fc' }}>
                    {Math.round(currentConfidence * 100)}%
                  </span>
                  <span style={{ fontSize: '0.6rem', color: '#818cf8', textTransform: 'uppercase' }}>
                    Match
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mode Specific Terminal */}
        {mode === 'text' ? (
          /* TEXT / SENTENCE BUILDER */
          <div className="glass-panel" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Type size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Translated Sentence Builder
                </h3>
              </div>
              <span className="badge badge-success">Controlled Input</span>
            </div>

            {/* Sentence Box */}
            <div style={{
              flex: 1,
              minHeight: 120,
              background: 'rgba(10, 15, 29, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              padding: 18,
              fontSize: '1.3rem',
              fontWeight: 500,
              color: accumulatedText ? 'var(--text-main)' : 'var(--text-dim)',
              lineHeight: 1.6,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              display: 'flex',
              alignItems: accumulatedText ? 'flex-start' : 'center',
              justifyContent: accumulatedText ? 'flex-start' : 'center'
            }}>
              {accumulatedText || "Hold a sign steady for ~1 second (or press 'Add Sign' / Spacebar) to form sentences here..."}
            </div>

            {/* Editing & Actions Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16,
              flexWrap: 'wrap',
              gap: 10
            }}>
              {/* Quick Text Modifiers */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setAccumulatedText(prev => prev + ' ')}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Space
                </button>
                <button
                  onClick={() => setAccumulatedText(prev => prev.slice(0, -1))}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Backspace
                </button>
                <button
                  onClick={handleClear}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  title="Clear all"
                >
                  <Trash2 size={14} />
                  <span>Clear</span>
                </button>
              </div>

              {/* Primary Output Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => speakText(accumulatedText)}
                  disabled={!accumulatedText}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px' }}
                  title="Read aloud via Speech Synthesis"
                >
                  <Volume2 size={16} />
                  <span>Speak</span>
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!accumulatedText}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px' }}
                >
                  {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  onClick={handleSaveTranslation}
                  disabled={!accumulatedText}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px' }}
                >
                  {saved ? <Check size={16} /> : <Save size={16} />}
                  <span>{saved ? "Saved" : "Save to DB"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ISL CALCULATOR TERMINAL */
          <div className="glass-panel" style={{
            padding: 24,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderColor: 'rgba(245, 158, 11, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalcIcon size={20} color="var(--accent-amber)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  ISL Gesture Calculator (harshbg Engine)
                </h3>
              </div>
              <span className="badge badge-warning">Math Mode</span>
            </div>

            {/* Blackboard display style */}
            <div style={{
              flex: 1,
              minHeight: 140,
              background: '#020617',
              borderRadius: 14,
              border: '1px solid rgba(245, 158, 11, 0.25)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)'
            }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-amber)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.05em'
                }}>
                  {calcInfo || "Ready for gesture input"}
                </span>
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: '#ffffff',
                  marginTop: 8,
                  wordBreak: 'break-all'
                }}>
                  {calcDisplay || "0"}
                </div>
              </div>

              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: 8
              }}>
                Operators: 1(+), 2(-), 3(*), 4(/) • Evaluate: "Best of Luck" (Thumbs Up) • Reset: "C"
              </div>
            </div>

            {/* Calculator Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16
            }}>
              <button
                onClick={handleClear}
                className="btn btn-secondary"
                style={{ padding: '8px 14px' }}
              >
                <Trash2 size={16} />
                <span>Clear Display</span>
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => speakText(calcDisplay)}
                  disabled={!calcDisplay}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px' }}
                >
                  <Volume2 size={16} />
                  <span>Read Result</span>
                </button>
                <button
                  onClick={handleSaveTranslation}
                  disabled={!calcDisplay}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  <Save size={16} />
                  <span>Save Calculation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

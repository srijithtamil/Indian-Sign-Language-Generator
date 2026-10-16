// Complete 44 Gestures mapping and metadata corresponding to harshbg's gesture_db.db
const gesturesList = [
  // Alphabets A - Z (0 to 25)
  { id: 0, name: 'A', category: 'alphabet', description: 'Closed fist with thumb resting vertically along index finger', tips: 'Keep fingers curled into palm with thumb facing upward.' },
  { id: 1, name: 'B', category: 'alphabet', description: 'Open flat palm with 4 fingers erect and thumb folded across palm', tips: 'Keep all four fingers upright and touching each other.' },
  { id: 2, name: 'C', category: 'alphabet', description: 'Curved fingers and thumb forming a C arc shape', tips: 'Resembles gripping a cylinder or cup.' },
  { id: 3, name: 'D', category: 'alphabet', description: 'Index finger pointing straight up, other three fingers touching thumb tip', tips: 'Forms an upright "D" circle loop.' },
  { id: 4, name: 'E', category: 'alphabet', description: 'All fingers bent with tips touching or close to thumb across bottom', tips: 'Fingers curled tightly like claws resting on thumb.' },
  { id: 5, name: 'F', category: 'alphabet', description: 'Index finger touching thumb in a circle, other 3 fingers held straight up', tips: 'Similar to the OK sign posture.' },
  { id: 6, name: 'G', category: 'alphabet', description: 'Index finger and thumb parallel pointing horizontally to the side', tips: 'Hand held sideways as if measuring small width.' },
  { id: 7, name: 'H', category: 'alphabet', description: 'Index and middle fingers held together horizontally', tips: 'Point index and middle finger sideways together.' },
  { id: 8, name: 'I', category: 'alphabet', description: 'Pinky finger extended upright, other fingers closed with thumb', tips: 'Only little finger pointing up.' },
  { id: 9, name: 'J', category: 'alphabet', description: 'Pinky finger traces a J curve in the air', tips: 'Start with I pose and carve a small hook curve.' },
  { id: 10, name: 'K', category: 'alphabet', description: 'Index finger straight up, middle finger angled forward, thumb between them', tips: 'Forms a V with thumb wedged between.' },
  { id: 11, name: 'L', category: 'alphabet', description: 'Index finger upright, thumb extended horizontally at 90 degrees', tips: 'Forms a sharp capital L shape.' },
  { id: 12, name: 'M', category: 'alphabet', description: 'Three fingers draped over the thumb folded inside', tips: 'Thumb tucked under index, middle, and ring fingers.' },
  { id: 13, name: 'N', category: 'alphabet', description: 'Two fingers draped over the thumb folded inside', tips: 'Thumb tucked under index and middle fingers only.' },
  { id: 14, name: 'O', category: 'alphabet', description: 'All fingertips touch thumb tip forming a closed circle O', tips: 'Forms a complete circle with all fingers.' },
  { id: 15, name: 'P', category: 'alphabet', description: 'K shape pointing downward', tips: 'Angle wrist so the K finger arrangement points down.' },
  { id: 16, name: 'Q', category: 'alphabet', description: 'G shape pointing downwards', tips: 'Thumb and index finger pointing towards the floor.' },
  { id: 17, name: 'R', category: 'alphabet', description: 'Index and middle fingers crossed over each other', tips: 'Crossing fingers for good luck.' },
  { id: 18, name: 'S', category: 'alphabet', description: 'Fist with thumb wrapped across front of clenched fingers', tips: 'Different from A: thumb goes across the front knuckles.' },
  { id: 19, name: 'T', category: 'alphabet', description: 'Thumb tucked between index and middle finger knuckles', tips: 'Thumb pops up between first two fingers.' },
  { id: 20, name: 'U', category: 'alphabet', description: 'Index and middle fingers held together straight up', tips: 'Two fingers upright and joined tightly.' },
  { id: 21, name: 'V', category: 'alphabet', description: 'Index and middle fingers spread apart upright in a V peace sign', tips: 'Classic peace or victory sign.' },
  { id: 22, name: 'W', category: 'alphabet', description: 'Index, middle, and ring fingers spread apart upright', tips: 'Three upright fingers forming W.' },
  { id: 23, name: 'X', category: 'alphabet', description: 'Index finger crooked into a small hook', tips: 'Point index finger up and bend top joint like a hook.' },
  { id: 24, name: 'Y', category: 'alphabet', description: 'Thumb and pinky extended out, middle three fingers closed', tips: 'Hang loose / shaka sign hand shape.' },
  { id: 25, name: 'Z', category: 'alphabet', description: 'Index finger traces the zigzag Z shape in the air', tips: 'Draw a Z stroke with the index finger.' },

  // Numbers 0 - 9 (26 to 35)
  { id: 26, name: '0', category: 'number', description: 'All fingers touching thumb in an oval O shape', tips: 'Calculator: bitwise OR operator (|) in calculator mode' },
  { id: 27, name: '1', category: 'number', description: 'Single index finger pointing upright', tips: 'Calculator: Addition operator (+) in operator mode' },
  { id: 28, name: '2', category: 'number', description: 'Index and middle finger held upright', tips: 'Calculator: Subtraction operator (-) in operator mode' },
  { id: 29, name: '3', category: 'number', description: 'Thumb, index, and middle finger extended', tips: 'Calculator: Multiplication operator (*) in operator mode' },
  { id: 30, name: '4', category: 'number', description: 'Four fingers upright with thumb tucked against palm', tips: 'Calculator: Division operator (/) in operator mode' },
  { id: 31, name: '5', category: 'number', description: 'All five fingers spread out wide', tips: 'Calculator: Modulo operator (%) in operator mode' },
  { id: 32, name: '6', category: 'number', description: 'Thumb touching pinky tip, other three fingers upright', tips: 'Calculator: Power operator (**) in operator mode' },
  { id: 33, name: '7', category: 'number', description: 'Thumb touching ring finger tip, others upright', tips: 'Calculator: Bitwise right shift (>>) in operator mode' },
  { id: 34, name: '8', category: 'number', description: 'Thumb touching middle finger tip, others upright', tips: 'Calculator: Bitwise left shift (<<) in operator mode' },
  { id: 35, name: '9', category: 'number', description: 'Thumb touching index finger tip, others upright', tips: 'Calculator: Bitwise AND operator (&) in operator mode' },

  // Phrases & Special Gestures (36 to 43)
  { id: 36, name: 'Best of Luck', category: 'phrase', description: 'Thumbs up gesture extended firmly towards camera', tips: 'Calculator mode: Acts as EQUAL / CALCULATE trigger.' },
  { id: 37, name: 'You', category: 'phrase', description: 'Index finger pointing forward towards conversational partner', tips: 'Used for second-person pronoun "You".' },
  { id: 38, name: 'I/Me', category: 'phrase', description: 'Index finger or flat hand pointing towards chest', tips: 'Automatically converts to "I" or "me" in sentences.' },
  { id: 39, name: 'Like', category: 'phrase', description: 'Thumb and middle finger pull outwards from chest in gentle pinch', tips: 'Expresses liking or preference.' },
  { id: 40, name: 'Remember', category: 'phrase', description: 'Thumb from forehead touches opposite upright thumb', tips: 'Signifies recollection or remembering.' },
  { id: 41, name: 'Love', category: 'phrase', description: 'Both arms crossed over chest or heart area', tips: 'Expresses affection and love.' },
  { id: 42, name: 'Wait', category: 'phrase', description: 'Open hand held forward palm out in halting posture', tips: 'Signifies wait, pause, or hold.' },
  { id: 43, name: 'I love you', category: 'phrase', description: 'Thumb, index, and pinky fingers extended simultaneously (ILY)', tips: 'Combines letters I, L, and Y into universal sign.' }
];

module.exports = gesturesList;

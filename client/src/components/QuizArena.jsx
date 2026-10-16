import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  Sparkles,
  Trophy,
  Target
} from 'lucide-react';
import { API_URL } from '../apiConfig';

export default function QuizArena() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch quiz questions
  const loadQuiz = async () => {
    setLoading(true);
    setIsFinished(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);

    try {
      const res = await fetch(`${API_URL}/api/quiz/questions?count=6`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (e) {
      console.error("Failed to load questions:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const loadStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/quiz/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadQuiz();
    loadStats();
  }, []);

  const handleSelectOption = (opt) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    if (opt === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Quiz completed!
      setIsFinished(true);
      const finalAccuracy = Math.round(((score + (selectedOption === questions[currentIndex].correctAnswer ? 0 : 0)) / questions.length) * 100);

      if (finalAccuracy >= 70) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }

      // Save to server
      try {
        await fetch(`${API_URL}/api/quiz/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizType: 'ISL Mastery Quiz',
            score: score,
            totalQuestions: questions.length,
            accuracy: finalAccuracy
          })
        });
        loadStats();
      } catch (e) {}
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      {/* Top Banner Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 24
      }}>
        <div className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trophy size={22} color="var(--primary)" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quizzes Completed</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats?.totalQuizzes || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Target size={22} color="var(--accent-emerald)" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Accuracy</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats?.avgAccuracy || 0}%</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={22} color="var(--accent-amber)" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Session</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{score} / {questions.length}</div>
          </div>
        </div>
      </div>

      {/* Main Quiz Box */}
      <div className="glass-panel" style={{ padding: 32, position: 'relative' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Loading quiz questions...
          </div>
        ) : isFinished ? (
          /* Finished Screen */
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
            }}>
              <Award size={40} color="#fff" />
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
              Quiz Finished!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 20 }}>
              You correctly identified <strong style={{ color: '#fff' }}>{score}</strong> out of <strong style={{ color: '#fff' }}>{questions.length}</strong> Indian Sign Language signs.
            </p>

            <div style={{
              display: 'inline-block',
              background: 'rgba(10, 15, 29, 0.8)',
              padding: '12px 28px',
              borderRadius: 14,
              border: '1px solid var(--border-subtle)',
              marginBottom: 28
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'block' }}>Score Accuracy</span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {Math.round((score / questions.length) * 100)}%
              </span>
            </div>

            <div>
              <button onClick={loadQuiz} className="btn btn-primary" style={{ padding: '12px 24px' }}>
                <RotateCcw size={18} />
                <span>Practice Again</span>
              </button>
            </div>
          </div>
        ) : currentQ ? (
          /* Question View */
          <div>
            {/* Progress Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span className="badge badge-primary">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Score: {score}
              </span>
            </div>

            {/* Prompt */}
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 12 }}>
              {currentQ.prompt}
            </h3>

            {/* Description clue */}
            <div style={{
              background: 'rgba(10, 15, 29, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24
            }}>
              <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Posture Clue:
              </span>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                "{currentQ.descriptionHint}"
              </p>
            </div>

            {/* Options Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 14,
              marginBottom: 24
            }}>
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === currentQ.correctAnswer;
                
                let btnBackground = 'rgba(255, 255, 255, 0.05)';
                let btnBorder = 'var(--border-subtle)';
                let icon = null;

                if (isAnswered) {
                  if (isCorrect) {
                    btnBackground = 'rgba(16, 185, 129, 0.2)';
                    btnBorder = 'rgba(16, 185, 129, 0.5)';
                    icon = <CheckCircle2 size={18} color="var(--accent-emerald)" />;
                  } else if (isSelected) {
                    btnBackground = 'rgba(244, 63, 94, 0.2)';
                    btnBorder = 'rgba(244, 63, 94, 0.5)';
                    icon = <XCircle size={18} color="var(--accent-rose)" />;
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(opt)}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: btnBackground,
                      border: `1px solid ${btnBorder}`,
                      color: '#ffffff',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      fontFamily: 'var(--font-heading)',
                      cursor: isAnswered ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'var(--transition)'
                    }}
                  >
                    <span>{opt}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Next / Submit Button */}
            {isAnswered && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleNextQuestion}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px' }}
                >
                  <span>{currentIndex < questions.length - 1 ? "Next Question" : "View Results"}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

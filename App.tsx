import React, { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  BookOpen,
  Lightbulb,
  Award,
  Trash2,
  AlertCircle,
  ChevronRight,
  Send,
  Zap,
  BookMarked,
  ArrowRight,
} from "lucide-react";

// Types
interface ExplanationData {
  title: string;
  oneLineSummary: string;
  explanation: string;
  realLifeAnalogy: string;
  seniorTips: string;
  keyTakeaways: string[];
}

interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizData {
  topicTitle: string;
  questions: MCQQuestion[];
}

interface SavedSession {
  id: string;
  timestamp: string;
  topic: string;
  explanation?: ExplanationData;
  quiz?: QuizData;
}

// Sample preset topics for Pakistani university students
const SAMPLE_PRESETS = [
  {
    label: "OS: Deadlock Conditions",
    text: "Deadlock in Operating Systems happens when two or more processes are blocked because each process is holding a resource and waiting for another resource held by some other process. The 4 Coffman conditions required for deadlock are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
  },
  {
    label: "Data Structures: QuickSort",
    text: "QuickSort is a Divide and Conquer sorting algorithm. It picks an element as a pivot and partitions the given array around the picked pivot. Best and Average time complexity is O(n log n), while Worst-case complexity is O(n²) when the array is already sorted or reverse sorted.",
  },
  {
    label: "Economics: Inflation vs Deflation",
    text: "Inflation is the general increase in prices and fall in the purchasing value of money over time. Deflation is a decrease in the general price level of goods and services. Central banks manage inflation using interest rates and monetary policy.",
  },
  {
    label: "DBMS: 3rd Normal Form (3NF)",
    text: "A database table is in 3rd Normal Form (3NF) if it is in 2NF and has no transitive dependencies. This means non-prime attributes must depend directly and ONLY on the primary key, avoiding redundant data storage.",
  },
];

export default function App() {
  // State
  const [inputText, setInputText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"explain" | "quiz">("explain");

  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);

  const [loadingExplain, setLoadingExplain] = useState<boolean>(false);
  const [loadingQuiz, setLoadingQuiz] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quiz state
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number }>({});
  const [submittedQuiz, setSubmittedQuiz] = useState<boolean>(false);

  // Copy & TTS state
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Saved history in localStorage
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const outputRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("study_buddy_sessions");
      if (stored) {
        setSavedSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  // Save sessions to localStorage
  const saveToLocalStorage = (sessions: SavedSession[]) => {
    setSavedSessions(sessions);
    try {
      localStorage.setItem("study_buddy_sessions", JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save session", e);
    }
  };

  // Auto scroll to output when results are generated
  const scrollToOutput = () => {
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Handle Explain Simply request
  const handleExplain = async () => {
    if (!inputText.trim()) {
      setErrorMsg("Arey bhai! Pehle koi topic, notes ya paragraph to paste karo! 📝");
      return;
    }

    setErrorMsg(null);
    setLoadingExplain(true);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: inputText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate explanation");
      }

      setExplanation(data);
      setActiveTab("explain");
      scrollToOutput();

      // Automatically offer to bookmark in history
      const newSession: SavedSession = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleDateString("en-PK", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        topic: inputText.slice(0, 60) + (inputText.length > 60 ? "..." : ""),
        explanation: data,
        quiz: quiz || undefined,
      };

      const updatedHistory = [newSession, ...savedSessions.slice(0, 9)];
      saveToLocalStorage(updatedHistory);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || "Koi masla ho gaya request mein. Please check internet connection and try again! ⚠️"
      );
    } finally {
      setLoadingExplain(false);
    }
  };

  // Handle Generate Quiz request
  const handleGenerateQuiz = async () => {
    if (!inputText.trim()) {
      setErrorMsg("Arey bhai! Pehle koi topic, notes ya paragraph to paste karo! 📝");
      return;
    }

    setErrorMsg(null);
    setLoadingQuiz(true);
    setUserAnswers({});
    setSubmittedQuiz(false);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: inputText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      setQuiz(data);
      setActiveTab("quiz");
      scrollToOutput();

      // Update session if available or create new
      const newSession: SavedSession = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleDateString("en-PK", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        topic: inputText.slice(0, 60) + (inputText.length > 60 ? "..." : ""),
        explanation: explanation || undefined,
        quiz: data,
      };

      const updatedHistory = [newSession, ...savedSessions.slice(0, 9)];
      saveToLocalStorage(updatedHistory);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || "Quiz generate karte waqt masla aaya. Please try again! ⚠️"
      );
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Option selection in Quiz
  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  // Calculate Quiz Score
  const calculateScore = () => {
    if (!quiz) return 0;
    let score = 0;
    quiz.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswerIndex) {
        score += 1;
      }
    });
    return score;
  };

  // Copy Explanation to Clipboard
  const handleCopy = () => {
    if (!explanation) return;
    const textToCopy = `📌 ${explanation.title}\n\n💡 Summary: ${explanation.oneLineSummary}\n\n📚 Senior's Explanation:\n${explanation.explanation}\n\n🇵🇰 Real-Life Analogy:\n${explanation.realLifeAnalogy}\n\n🎓 Senior Tip:\n${explanation.seniorTips}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Text-To-Speech (TTS)
  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (explanation) {
      const utteranceText = `${explanation.title}. Summary: ${explanation.oneLineSummary}. Explanation: ${explanation.explanation}. Real life analogy: ${explanation.realLifeAnalogy}`;
      const utterance = new SpeechSynthesisUtterance(utteranceText);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Load session from history
  const loadSession = (session: SavedSession) => {
    setInputText(session.topic);
    if (session.explanation) setExplanation(session.explanation);
    if (session.quiz) {
      setQuiz(session.quiz);
      setUserAnswers({});
      setSubmittedQuiz(false);
    }
    if (session.explanation) setActiveTab("explain");
    else if (session.quiz) setActiveTab("quiz");
    setShowHistory(false);
    scrollToOutput();
  };

  // Delete session from history
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedSessions.filter((s) => s.id !== id);
    saveToLocalStorage(filtered);
  };

  return (
    <div className="min-h-screen bg-[#FEF9F3] text-[#1D1D1F] font-sans pb-16">
      {/* Navigation */}
      <header className="sticky top-0 z-30 bg-[#FEF9F3]/90 backdrop-blur-md border-b border-[#EBE3D5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#FF6B35] rounded-lg rotate-12 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg leading-none">S</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold tracking-tight text-[#2D3142]">
                  StudyBuddy<span className="text-[#FF6B35]">.</span>
                </span>
                <span className="px-2.5 py-0.5 bg-[#2D3142] text-white rounded text-[10px] font-bold tracking-wider uppercase">
                  Senior Mode 🇵🇰
                </span>
              </div>
              <p className="text-xs text-[#7E7E7E] hidden sm:block">
                Simple English + Roman Urdu Explanations & Quick Practice MCQs
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {savedSessions.length > 0 && (
              <button
                id="view-saved-history-btn"
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-[#2D3142] hover:bg-[#FFF8F0] hover:text-[#FF6B35] transition-all border border-[#EBE3D5] shadow-xs cursor-pointer"
              >
                <BookMarked className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span>Saved ({savedSessions.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Saved Sessions Drawer */}
        {showHistory && (
          <div className="bg-white rounded-3xl border border-[#EBE3D5] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#EBE3D5] pb-3">
              <h3 className="text-sm font-bold text-[#2D3142] flex items-center space-x-2">
                <Bookmark className="w-4 h-4 text-[#FF6B35]" />
                <span>Recent Study Sessions</span>
              </h3>
              <button
                id="close-history-btn"
                onClick={() => setShowHistory(false)}
                className="text-xs font-semibold text-[#7E7E7E] hover:text-[#1D1D1F] cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {savedSessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => loadSession(s)}
                  className="p-3 rounded-2xl border border-[#EBE3D5] hover:border-[#FF6B35] bg-[#FEF9F3]/60 hover:bg-[#FFF8F0] cursor-pointer transition-all flex items-start justify-between group"
                >
                  <div className="space-y-1 pr-2">
                    <p className="text-xs font-bold text-[#2D3142] line-clamp-1">
                      {s.explanation?.title || s.quiz?.topicTitle || s.topic}
                    </p>
                    <span className="text-[10px] text-[#7E7E7E]">
                      {s.timestamp}
                    </span>
                  </div>
                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-[#7E7E7E] hover:text-red-500 transition-opacity p-1 cursor-pointer"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input & Header Intro Section */}
        <section className="bg-white rounded-3xl border border-[#EBE3D5] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#2D3142] leading-tight">
              Samajh <br />
              <span className="italic font-serif text-[#FF6B35]">Nahi Araha?</span>
            </h1>
            <p className="text-sm text-[#7E7E7E] leading-relaxed max-w-2xl">
              Paste your lecture notes, textbook paragraph, or complex topic below. Senior Buddy will explain it in simple language with Roman Urdu, or generate 5 practice MCQs for your exam!
            </p>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              id="topic-input"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Example: Paste your lecture notes or topic here... e.g. 'Operating Systems: Mutual exclusion, hold and wait, no preemption, and circular wait are the four conditions for deadlock...'"
              rows={5}
              className="w-full p-4 sm:p-5 rounded-2xl bg-white border border-[#EBE3D5] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all placeholder:text-[#7E7E7E]/60 text-sm leading-relaxed text-[#1D1D1F] shadow-xs"
            />
            {inputText.length > 0 && (
              <button
                id="clear-input-btn"
                onClick={() => setInputText("")}
                className="absolute top-3 right-3 text-xs text-[#7E7E7E] hover:text-[#FF6B35] font-semibold"
              >
                Clear
              </button>
            )}
            <div className="absolute bottom-3 right-3 text-[11px] text-[#7E7E7E]">
              {inputText.length} characters
            </div>
          </div>

          {/* Sample Preset Chips */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-[#7E7E7E] uppercase tracking-wider">
              Try sample university topics:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(preset.text);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="px-3 py-1.5 text-xs bg-[#FEF9F3] text-[#2D3142] border border-[#EBE3D5] rounded-xl hover:border-[#FF6B35] hover:text-[#FF6B35] hover:bg-[#FFF8F0] transition-all cursor-pointer font-medium"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <button
              id="explain-simply-btn"
              onClick={handleExplain}
              disabled={loadingExplain || loadingQuiz}
              className="w-full py-4 px-5 rounded-2xl font-bold text-sm bg-[#FF6B35] text-white shadow-md hover:bg-[#e85a24] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loadingExplain ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Senior Buddy thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Explain Simply</span>
                </>
              )}
            </button>

            <button
              id="generate-quiz-btn"
              onClick={handleGenerateQuiz}
              disabled={loadingExplain || loadingQuiz}
              className="w-full py-4 px-5 rounded-2xl font-bold text-sm bg-[#2D3142] text-white shadow-md hover:bg-[#1f222e] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center space-x-2 cursor-pointer border border-[#2D3142]"
            >
              {loadingQuiz ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Preparing 5 MCQs...</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4 text-[#FF6B35]" />
                  <span>Generate Quiz</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Loading Indicator */}
        {(loadingExplain || loadingQuiz) && (
          <div className="bg-[#FFF8F0] border border-[#FFE8D1] rounded-3xl p-8 text-center space-y-3 shadow-xs">
            <div className="inline-flex p-3.5 rounded-full bg-[#FF6B35] text-white animate-bounce shadow-md">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#2D3142]">
              {loadingExplain
                ? "Senior Buddy is reading your notes..."
                : "Drafting 5 exam-style MCQs..."}
            </h3>
            <p className="text-xs text-[#7E7E7E] max-w-md mx-auto leading-relaxed">
              {loadingExplain
                ? "Translating complex terms into simple English with Roman Urdu & real-life analogies..."
                : "Setting options, marking correct answers, and writing brief explanations..."}
            </p>
          </div>
        )}

        {/* Output Section */}
        <div ref={outputRef}>
          {(explanation || quiz) && (
            <div className="space-y-6">
              {/* Output Tab Switcher */}
              <div className="flex border-b border-[#EBE3D5] space-x-6">
                {explanation && (
                  <button
                    id="tab-explain"
                    onClick={() => setActiveTab("explain")}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                      activeTab === "explain"
                        ? "border-[#FF6B35] text-[#FF6B35]"
                        : "border-transparent text-[#7E7E7E] hover:text-[#1D1D1F]"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Senior Explanation</span>
                  </button>
                )}

                {quiz && (
                  <button
                    id="tab-quiz"
                    onClick={() => setActiveTab("quiz")}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                      activeTab === "quiz"
                        ? "border-[#FF6B35] text-[#FF6B35]"
                        : "border-transparent text-[#7E7E7E] hover:text-[#1D1D1F]"
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Practice Quiz ({quiz.questions.length} MCQs)</span>
                  </button>
                )}
              </div>

              {/* TAB 1: EXPLANATION CARD */}
              {activeTab === "explain" && explanation && (
                <div className="p-6 sm:p-8 rounded-3xl bg-[#FFF8F0] border border-[#FFE8D1] shadow-xs space-y-6">
                  {/* Card Header & Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFE8D1] pb-5">
                    <div>
                      <span className="px-2.5 py-1 bg-[#FF6B35] text-white text-[10px] font-bold rounded uppercase tracking-wider">
                        Senior's Summary
                      </span>
                      <h2 className="text-2xl font-bold text-[#2D3142] mt-2">
                        {explanation.title}
                      </h2>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        id="tts-toggle-btn"
                        onClick={toggleSpeech}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition-all cursor-pointer ${
                          isSpeaking
                            ? "bg-[#FF6B35] text-white border-[#FF6B35] animate-pulse"
                            : "bg-white text-[#2D3142] border-[#EBE3D5] hover:bg-[#FEF9F3]"
                        }`}
                        title="Listen to explanation"
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#FF6B35]" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      <button
                        id="copy-explanation-btn"
                        onClick={handleCopy}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#EBE3D5] bg-white text-[#2D3142] hover:bg-[#FEF9F3] transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Part (a): One-Line Summary */}
                  <div className="p-5 rounded-2xl bg-white border border-[#FFE8D1] space-y-1.5 shadow-2xs">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-[#FF6B35] uppercase tracking-wide">
                      <Lightbulb className="w-4 h-4" />
                      <span>One-Line Summary</span>
                    </div>
                    <p className="text-base font-bold text-[#1D1D1F] leading-snug">
                      "{explanation.oneLineSummary}"
                    </p>
                  </div>

                  {/* Part (b): Simple Language Explanation */}
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-bold text-[#2D3142] flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-[#FF6B35]" />
                      <span>Senior's Simple Explanation (Roman Urdu)</span>
                    </h3>
                    <div className="text-sm text-[#4A4A4A] leading-relaxed whitespace-pre-line bg-white/80 p-5 rounded-2xl border border-[#FFE8D1]">
                      {explanation.explanation}
                    </div>
                  </div>

                  {/* Part (c): Real-Life Analogy */}
                  <div className="bg-white/90 p-5 rounded-2xl italic border-l-4 border-[#FF6B35] space-y-1.5 shadow-2xs">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-[#FF6B35] not-italic uppercase tracking-wide">
                      <Zap className="w-4 h-4" />
                      <span>Real-Life Analogy</span>
                    </div>
                    <p className="text-sm text-[#2D3142] leading-relaxed font-serif">
                      "{explanation.realLifeAnalogy}"
                    </p>
                  </div>

                  {/* Part (d): Senior Exam Tips & Key Takeaways */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Senior Tips */}
                    <div className="p-5 rounded-2xl bg-[#E8F3F1] border border-[#D1E7E3] space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1F544A] uppercase tracking-wide">
                        <Award className="w-4 h-4 text-[#1F544A]" />
                        <span>Senior's Exam Tip 🎓</span>
                      </div>
                      <p className="text-xs text-[#2D3142] leading-relaxed font-medium">
                        {explanation.seniorTips}
                      </p>
                    </div>

                    {/* Key Takeaways */}
                    {explanation.keyTakeaways && explanation.keyTakeaways.length > 0 && (
                      <div className="p-5 rounded-2xl bg-white border border-[#FFE8D1] space-y-2">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#2D3142] uppercase tracking-wide">
                          <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />
                          <span>Quick Revision Points</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-[#4A4A4A]">
                          {explanation.keyTakeaways.map((point, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="text-[#FF6B35] font-bold">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Next Action Prompt */}
                  {!quiz && (
                    <div className="pt-2 text-center">
                      <button
                        id="generate-quiz-from-explanation-btn"
                        onClick={handleGenerateQuiz}
                        disabled={loadingQuiz}
                        className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold text-xs bg-[#2D3142] text-white hover:bg-[#1f222e] transition-all shadow-md cursor-pointer"
                      >
                        <span>Test Your Concept with 5 MCQs</span>
                        <ArrowRight className="w-4 h-4 text-[#FF6B35]" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INTERACTIVE QUIZ CARD */}
              {activeTab === "quiz" && quiz && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EBE3D5] shadow-xs space-y-6">
                  {/* Quiz Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE3D5] pb-5">
                    <div>
                      <span className="px-2.5 py-1 bg-[#2D3142] text-white text-[10px] font-bold rounded uppercase tracking-wider">
                        Test Your Knowledge
                      </span>
                      <h2 className="text-2xl font-bold text-[#2D3142] mt-2">
                        {quiz.topicTitle}
                      </h2>
                    </div>

                    {/* Score badge if submitted */}
                    {submittedQuiz && (
                      <div className="px-5 py-2.5 rounded-2xl bg-[#2D3142] text-white text-center shrink-0 shadow-xs">
                        <span className="text-[11px] text-[#7E7E7E] block uppercase tracking-wider font-semibold">
                          Your Score
                        </span>
                        <span className="text-xl font-bold text-[#FF6B35]">
                          {calculateScore()} / {quiz.questions.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* MCQ List */}
                  <div className="space-y-6">
                    {quiz.questions.map((q, qIndex) => {
                      const selectedOption = userAnswers[q.id];
                      const isCorrect = selectedOption === q.correctAnswerIndex;

                      return (
                        <div
                          key={q.id || qIndex}
                          className="p-5 rounded-2xl border border-[#EBE3D5] bg-[#FEF9F3]/50 space-y-4"
                        >
                          {/* Question Text */}
                          <div className="flex items-start space-x-2.5">
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#FF6B35] text-white font-bold text-xs shrink-0 mt-0.5">
                              {qIndex + 1}
                            </span>
                            <p className="text-sm font-bold text-[#2D3142] pt-1 leading-snug">
                              {q.question}
                            </p>
                          </div>

                          {/* Options */}
                          <div className="grid grid-cols-1 gap-2.5 pt-1">
                            {q.options.map((opt, optIdx) => {
                              const isThisSelected = selectedOption === optIdx;
                              const isThisCorrect = q.correctAnswerIndex === optIdx;

                              let btnClasses =
                                "w-full text-left p-3.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-between cursor-pointer ";

                              if (submittedQuiz) {
                                if (isThisCorrect) {
                                  btnClasses +=
                                    "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold";
                                } else if (isThisSelected && !isThisCorrect) {
                                  btnClasses +=
                                    "bg-red-50 border-red-300 text-red-900 font-bold";
                                } else {
                                  btnClasses +=
                                    "bg-white border-[#EBE3D5] text-[#7E7E7E] opacity-70";
                                }
                              } else {
                                if (isThisSelected) {
                                  btnClasses +=
                                    "bg-[#FFF8F0] border-[#FF6B35] text-[#1D1D1F] font-bold shadow-xs";
                                } else {
                                  btnClasses +=
                                    "bg-white border-[#EBE3D5] text-[#2D3142] hover:border-[#FF6B35] hover:bg-[#FFF8F0]/50";
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() =>
                                    !submittedQuiz &&
                                    handleSelectOption(q.id, optIdx)
                                  }
                                  disabled={submittedQuiz}
                                  className={btnClasses}
                                >
                                  <div className="flex items-center space-x-2.5">
                                    <span className="font-bold text-[#7E7E7E] uppercase w-4">
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <span>{opt}</span>
                                  </div>

                                  {submittedQuiz && (
                                    <span>
                                      {isThisCorrect && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      )}
                                      {isThisSelected && !isThisCorrect && (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                      )}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation Box after Submit */}
                          {submittedQuiz && (
                            <div
                              className={`p-3.5 rounded-xl text-xs border ${
                                isCorrect
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                  : "bg-[#FFF8F0] border-[#FFE8D1] text-[#2D3142]"
                              }`}
                            >
                              <span className="font-bold block mb-1 text-[#FF6B35]">
                                {isCorrect ? "✅ Sahi Jawab!" : "💡 Explanation:"}
                              </span>
                              <p className="leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Quiz Action Buttons */}
                  <div className="pt-2 border-t border-[#EBE3D5] flex flex-col sm:flex-row items-center justify-between gap-4">
                    {!submittedQuiz ? (
                      <button
                        id="submit-quiz-btn"
                        onClick={() => setSubmittedQuiz(true)}
                        disabled={
                          Object.keys(userAnswers).length < quiz.questions.length
                        }
                        className="w-full sm:w-auto px-7 py-3 rounded-2xl text-xs font-bold bg-[#FF6B35] text-white hover:bg-[#e85a24] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
                      >
                        Submit Answers ({Object.keys(userAnswers).length} /{" "}
                        {quiz.questions.length} Answered)
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between">
                        <p className="text-xs font-bold text-[#2D3142]">
                          {calculateScore() === 5
                            ? "Wah bhai! Full marks! Exam phor dogay! 🎉"
                            : calculateScore() >= 3
                            ? "Bohot achhay! Thori aur revision karke wapas test do! 💪"
                            : "Tension mat lo! 'Senior Explanation' tab parho aur dubara try karo! 🔄"}
                        </p>
                        <button
                          id="retake-quiz-btn"
                          onClick={() => {
                            setUserAnswers({});
                            setSubmittedQuiz(false);
                          }}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FEF9F3] border border-[#EBE3D5] text-[#2D3142] hover:bg-[#FFF8F0] hover:border-[#FF6B35] transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retake Quiz</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 mt-16 pt-6 border-t border-[#EBE3D5] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7E7E7E] font-medium gap-2">
        <div className="flex items-center space-x-4">
          <span>Status: <span className="text-emerald-600 font-bold">Ready to explain</span></span>
          <span>•</span>
          <span>Designed for Pakistan's Future Leaders 🇵🇰</span>
        </div>
        <div>
          © StudyBuddy • Powered by Gemini AI
        </div>
      </footer>
    </div>
  );
}

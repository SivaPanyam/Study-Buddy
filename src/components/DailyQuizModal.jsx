import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, X } from 'lucide-react';
import clsx from 'clsx';
import { generateJSON } from '../services/geminiService';
import { useGamificationContext } from '../context/GamificationContext';

const DailyQuizModal = ({ day, dayFocus, tasks, onComplete, onCancel }) => {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const { addXP } = useGamificationContext();

    useEffect(() => {
        console.log("🎯 DailyQuizModal mounted with data:", { day, dayFocus, tasks });
        generateDailyQuiz();
    }, [day, dayFocus, tasks]);

    const generateDailyQuiz = async () => {
        try {
            setLoading(true);
            const taskDescriptions = tasks
                .map(t => typeof t === 'string' ? t : t.description)
                .join(', ');

            const prompt = `
                Create a mandatory daily quiz based on this day's study topics.
                Focus: ${dayFocus}
                Tasks completed: ${taskDescriptions}
                
                Generate 5 multiple-choice questions that test understanding of the day's topics.
                Make questions practical and concept-based.
                
                Return STRICT JSON:
                {
                  "questions": [
                    {
                      "type": "mcq",
                      "question": "Question text?",
                      "options": ["Option A", "Option B", "Option C", "Option D"],
                      "correct_answer": "Option A",
                      "explanation": "Why this is correct"
                    }
                  ]
                }
                Ensure correct_answer matches one option exactly.
            `;

            const data = await generateJSON(prompt);

            if (!data || !data.questions || !Array.isArray(data.questions)) {
                throw new Error("Invalid quiz format");
            }

            setQuiz(data);
        } catch (err) {
            console.error("Quiz generation error:", err);
            console.log("📝 Using fallback quiz with focus:", dayFocus);
            // Fallback quiz if generation fails
            setQuiz({
                questions: [
                    {
                        type: "mcq",
                        question: `What was the main focus of today's study?`,
                        options: [dayFocus, "Unrelated topic", "Another topic", "General study"],
                        correct_answer: dayFocus,
                        explanation: "Today's focus was on this topic"
                    },
                    {
                        type: "mcq",
                        question: `How many tasks did you complete today?`,
                        options: [
                            `${tasks.length} tasks`,
                            `${Math.max(1, tasks.length - 1)} tasks`,
                            `${tasks.length + 1} tasks`,
                            "No tasks"
                        ],
                        correct_answer: `${tasks.length} tasks`,
                        explanation: `You completed all ${tasks.length} tasks for this day`
                    },
                    {
                        type: "mcq",
                        question: "Did today's study help you understand the topic better?",
                        options: ["Definitely yes", "Somewhat", "A little", "Not at all"],
                        correct_answer: "Definitely yes",
                        explanation: "Consistent study improves understanding"
                    }
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (option) => {
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            calculateScore();
        }
    };

    const calculateScore = async () => {
        let newScore = 0;
        quiz.questions.forEach((q, index) => {
            if (answers[index] === q.correct_answer) {
                newScore++;
            }
        });
        setScore(newScore);
        setShowResults(true);

        // Award XP based on performance
        const scorePercentage = (newScore / quiz.questions.length) * 100;
        let earnedXP = 0;
        let reason = '';

        if (scorePercentage === 100) {
            earnedXP = 150;
            reason = 'Daily Quiz - Perfect Score!';
        } else if (scorePercentage >= 80) {
            earnedXP = 100;
            reason = 'Daily Quiz - Excellent!';
        } else if (scorePercentage >= 60) {
            earnedXP = 75;
            reason = 'Daily Quiz - Good!';
        } else {
            earnedXP = 50;
            reason = 'Daily Quiz - Completed';
        }

        addXP(earnedXP, reason);

        // Close modal after 3 seconds
        setTimeout(() => {
            onComplete();
        }, 3000);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-card border border-gray-800 rounded-2xl p-8 max-w-lg w-full mx-4 text-center">
                    <Loader2 className="w-12 h-12 text-primary-start animate-spin mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Generating Daily Quiz</h2>
                    <p className="text-gray-400">Creating a quiz based on {day}'s topics...</p>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-primary-start/20 to-primary-end/20 border-b border-gray-800 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{day} - Daily Quiz</h2>
                        <p className="text-sm text-gray-400 mt-1">Topic: {dayFocus}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-white hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {!showResults ? (
                        <>
                            {/* Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                                    <span className="text-primary-start font-semibold">
                                        {Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-primary-start to-primary-end h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Question */}
                            <div className="mb-8">
                                <h3 className="text-white text-lg font-semibold mb-6">
                                    {quiz.questions[currentQuestionIndex].question}
                                </h3>

                                {/* Options */}
                                <div className="space-y-3">
                                    {quiz.questions[currentQuestionIndex].options.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(option)}
                                            className={clsx(
                                                "w-full p-4 rounded-xl border-2 transition-all text-left font-medium",
                                                answers[currentQuestionIndex] === option
                                                    ? "border-primary-start bg-primary-start/20 text-white"
                                                    : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-primary-start/50 hover:bg-gray-700/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={clsx(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                                    answers[currentQuestionIndex] === option
                                                        ? "border-primary-start bg-primary-start"
                                                        : "border-gray-600"
                                                )}>
                                                    {answers[currentQuestionIndex] === option && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                                {option}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Next Button */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-6 py-3 rounded-xl border border-gray-700 text-gray-300 font-medium hover:bg-gray-800 transition-colors"
                                >
                                    Skip Quiz
                                </button>
                                <button
                                    onClick={nextQuestion}
                                    disabled={answers[currentQuestionIndex] === undefined}
                                    className="flex-1 px-6 py-3 rounded-xl bg-primary-start text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                >
                                    {currentQuestionIndex === quiz.questions.length - 1 ? 'Submit' : 'Next'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Results */}
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-primary-start/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-primary-start" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h3>
                                <p className="text-5xl font-black bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent mb-4">
                                    {score}/{quiz.questions.length}
                                </p>
                                <p className="text-xl text-gray-400 mb-6">
                                    {(score / quiz.questions.length * 100).toFixed(0)}% Correct
                                </p>

                                <div className="bg-gray-800/50 rounded-xl p-4 mb-6 text-left space-y-3 border border-gray-700">
                                    {quiz.questions.map((q, idx) => (
                                        <div key={idx} className="flex gap-3 items-start text-sm">
                                            <div className={clsx(
                                                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                                answers[idx] === q.correct_answer
                                                    ? "bg-green-500/20 border border-green-500"
                                                    : "bg-red-500/20 border border-red-500"
                                            )}>
                                                {answers[idx] === q.correct_answer ? (
                                                    <span className="text-green-400 font-bold">✓</span>
                                                ) : (
                                                    <span className="text-red-400 font-bold">✗</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-300 font-medium">{q.question}</p>
                                                <p className="text-xs text-green-400 mt-1">Correct: {q.correct_answer}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={onComplete}
                                    className="w-full px-6 py-3 rounded-xl bg-primary-start text-white font-medium hover:opacity-90 transition-opacity"
                                >
                                    Done
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyQuizModal;

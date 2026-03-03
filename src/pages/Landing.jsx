import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Brain, BookOpen, Target, Zap, Award, ChevronRight, Github } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Brain className="w-8 h-8" />,
            title: "AI-Powered Learning",
            description: "Get personalized study plans and explanations powered by advanced AI technology."
        },
        {
            icon: <BookOpen className="w-8 h-8" />,
            title: "Smart Notes",
            description: "Take notes, simplify concepts, and get AI feedback on your understanding."
        },
        {
            icon: <Target className="w-8 h-8" />,
            title: "Goal Planning",
            description: "Create structured 4-week study plans for any subject with daily tasks."
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: "Daily Quizzes",
            description: "Test your knowledge with AI-generated quizzes tailored to your interests."
        },
        {
            icon: <Award className="w-8 h-8" />,
            title: "Gamification",
            description: "Earn XP, level up, unlock badges, and maintain study streaks."
        },
        {
            icon: <Sparkles className="w-8 h-8" />,
            title: "Flashcards",
            description: "Create AI-generated flashcards and master concepts through spaced repetition."
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-start/10">
            {/* Navigation */}
            <nav className="fixed top-0 w-full backdrop-blur-md bg-background/80 border-b border-gray-800 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary-start to-primary-end rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-start to-primary-end">
                            Study Buddy
                        </h1>
                    </div>
                    <button
                        onClick={() => navigate('/auth')}
                        className="bg-primary-start hover:bg-primary-end text-white px-6 py-2 rounded-lg font-bold transition-all"
                    >
                        Sign In
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-primary-start/10 rounded-full border border-primary-start/20">
                        <Sparkles className="w-4 h-4 text-primary-start" />
                        <span className="text-sm font-bold text-primary-start">The Future of Learning</span>
                    </div>

                    <h2 className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                        Elevate Your Learning with AI
                    </h2>

                    <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Study Buddy combines AI-powered insights, gamification, and structured learning to help you master any subject faster and smarter.
                    </p>

                    <div className="flex gap-4 justify-center mb-16 flex-wrap">
                        <button
                            onClick={() => navigate('/auth')}
                            className="bg-gradient-to-r from-primary-start to-primary-end text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary-start/50 transition-all flex items-center gap-2 group"
                        >
                            Get Started Free
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-bold text-lg border border-gray-700 transition-all"
                        >
                            Learn More
                        </button>
                    </div>

                    {/* Hero Image/Showcase */}
                    <div className="relative mt-20">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-start/20 to-primary-end/20 rounded-3xl blur-3xl"></div>
                        <div className="relative bg-gray-900/40 backdrop-blur border border-gray-800 rounded-3xl p-8 md:p-12">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-2xl p-6 border border-green-500/20">
                                    <div className="text-4xl font-bold text-green-400 mb-2">∞</div>
                                    <p className="text-green-300 font-bold">Learn Anything</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl p-6 border border-blue-500/20">
                                    <div className="text-4xl font-bold text-blue-400 mb-2">🎮</div>
                                    <p className="text-blue-300 font-bold">Stay Motivated</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl p-6 border border-purple-500/20">
                                    <div className="text-4xl font-bold text-purple-400 mb-2">🚀</div>
                                    <p className="text-purple-300 font-bold">Learn Faster</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h3 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Powerful Features
                        </h3>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            Everything you need to transform your learning experience
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="group bg-gradient-to-br from-gray-900 to-gray-800/50 rounded-2xl p-8 border border-gray-800 hover:border-primary-start/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary-start/10"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-primary-start to-primary-end rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <div className="text-white">{feature.icon}</div>
                                </div>
                                <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-start to-primary-end rounded-3xl blur-2xl opacity-20"></div>
                        <div className="relative bg-gradient-to-r from-primary-start/10 to-primary-end/10 rounded-3xl border border-primary-start/30 p-12 md:p-16 text-center backdrop-blur">
                            <h3 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                                Ready to Transform Your Learning?
                            </h3>
                            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                                Join thousands of students who are learning smarter, not harder with Study Buddy.
                            </p>
                            <button
                                onClick={() => navigate('/auth')}
                                className="bg-gradient-to-r from-primary-start to-primary-end text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary-start/50 transition-all inline-flex items-center gap-2 group"
                            >
                                Start Learning Now
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-gray-400 text-sm">
                    <div>
                        <p>© 2026 Study Buddy. All rights reserved.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="hover:text-primary-start transition-colors">Privacy</button>
                        <button className="hover:text-primary-start transition-colors">Terms</button>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-start transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;

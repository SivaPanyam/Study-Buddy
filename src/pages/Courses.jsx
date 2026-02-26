import React, { useState, useEffect } from 'react';
import { generateJSON } from '../services/geminiService';
import { BookOpen, ExternalLink, Loader2, Search, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Courses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [goal, setGoal] = useState('');

    useEffect(() => {
        const fetchGoal = async () => {
            let userPlans = [];
            if (user) {
                const { data } = await supabase.from('study_plans').select('*').limit(3);
                userPlans = data || [];
            } else {
                const saved = localStorage.getItem('studyGoalPlans');
                if (saved) userPlans = JSON.parse(saved);
            }

            if (userPlans.length > 0) {
                // Use the first plan as the primary focus for recommendations
                const primaryPlan = userPlans[0];
                if (primaryPlan && primaryPlan.title) {
                    setGoal(primaryPlan.title);
                    fetchRecommendations(primaryPlan.title);
                }
            }
        };

        fetchGoal();
    }, [user]);

    const fetchRecommendations = async (userGoal) => {
        // Check cache first
        const cacheKey = `course_recommendations_${userGoal.toLowerCase().replace(/\s+/g, '_')}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                // Cache for 24 hours
                if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                    console.log("Loading courses from cache...");
                    setCourses(parsed.data);
                    return;
                }
            } catch (e) {
                console.error("Cache parse error:", e);
            }
        }

        setLoading(true);
        setError(null);
        try {
            const prompt = `
                Recommend 6 high-quality online courses or learning resources for someone wanting to: "${userGoal}".
                Include a mix of free (YouTube, documentation) and paid (Udemy, Coursera, etc.) options.
                
                CRITICAL: For each resource, provide a direct, working URL.
                Examples:
                - For YouTube: https://www.youtube.com/results?search_query=topic
                - For Udemy: https://www.udemy.com/courses/search/?q=topic
                - For Coursera: https://www.coursera.org/search?query=topic
                - For documentation: https://docs.example.com
                
                Return STRICT JSON (no markdown, just JSON):
                {
                  "resources": [
                    {
                      "title": "Course Title",
                      "platform": "Udemy/YouTube/Coursera/etc",
                      "type": "Video/Article/Interactive/Documentation",
                      "description": "Short description of why this is good.",
                      "url": "https://example.com/course-link",
                      "isFree": true/false
                    }
                  ]
                }
                
                Make sure every URL starts with http:// or https://
            `;

            const data = await generateJSON(prompt);
            
            // Validate and clean URLs
            const coursesWithValidUrls = (data.resources || []).map(course => {
                let url = course.url || '';
                
                // Validate URL format
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    // Add default https:// if missing
                    url = 'https://' + url;
                }
                
                // If still invalid, generate fallback URL based on platform
                if (!url.includes('.') || url.length < 10) {
                    const platform = course.platform || 'google';
                    const query = encodeURIComponent(`${userGoal} ${course.title}`.slice(0, 100));
                    
                    if (platform.includes('YouTube')) {
                        url = `https://www.youtube.com/results?search_query=${query}`;
                    } else if (platform.includes('Udemy')) {
                        url = `https://www.udemy.com/courses/search/?q=${query}`;
                    } else if (platform.includes('Coursera')) {
                        url = `https://www.coursera.org/search?query=${query}`;
                    } else if (platform.includes('LinkedIn')) {
                        url = `https://www.linkedin.com/learning/search?keywords=${query}`;
                    } else {
                        url = `https://www.google.com/search?q=${query}`;
                    }
                }
                
                return {
                    ...course,
                    url: url
                };
            });
            
            setCourses(coursesWithValidUrls);

            // Save to cache
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: coursesWithValidUrls
            }));
        } catch (err) {
            console.error("Error loading recommendations:", err);
            setError("Failed to load recommendations. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!goal) {
        return (
            <div className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">No Goal Set</h2>
                <p className="text-gray-400 mb-8 max-w-md">
                    Set a learning goal in the Goal Planner to get personalized course recommendations.
                </p>
                <a href="/goals" className="bg-primary-start text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">
                    Go to Goal Planner
                </a>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-primary-start" />
                    Recommended Resources
                </h1>
                <p className="mt-2 text-gray-400">Curated learning materials for <strong>"{goal}"</strong></p>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-primary-start animate-spin mb-4" />
                    <p className="text-gray-400">Finding the best content for you...</p>
                </div>
            ) : error ? (
                <div className="text-center text-red-400 py-20">
                    <p>{error}</p>
                    <button onClick={() => fetchRecommendations(goal)} className="mt-4 text-white underline">Try Again</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course, idx) => (
                        <div key={idx} className="bg-card border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all hover:shadow-lg group flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${course.isFree ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                    {course.isFree ? 'FREE' : 'PAID'}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    {course.type}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-start transition-colors">
                                {course.title}
                            </h3>
                            <p className="text-sm text-primary-start mb-4 font-medium">{course.platform}</p>
                            <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-1">
                                {course.description}
                            </p>

                            {course.url && course.url.startsWith('http') ? (
                                <a 
                                    href={course.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        // Additional safety check
                                        if (!course.url.startsWith('http')) {
                                            e.preventDefault();
                                            alert('Invalid link. Please try again.');
                                        }
                                    }}
                                    className="w-full bg-primary-start hover:opacity-90 text-white py-3 rounded-xl font-medium transition-opacity flex items-center justify-center gap-2"
                                    title={`Open: ${course.url}`}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Visit Resource
                                </a>
                            ) : (
                                <a 
                                    href={`https://www.google.com/search?q=${encodeURIComponent(course.title)}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                    title="Search for this resource"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Search Course
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Courses;

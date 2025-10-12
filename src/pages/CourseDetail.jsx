import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    fetchCourseDetails,
    enrollCourse,
    fetchUserProfile,
    fetchCourseMaterials,
    fetchCourseChatMessages,
    sendCourseChatMessage,
    fetchEnrolledCourses,
    updateProfile,
    fetchVideoProgress,
    updateVideoProgress,
    fetchCourseQuizzes,
    submitQuizAttempt,
    generateCertificate,
    fetchQuizQuestions,
    downloadCertificate
} from '../api';
import {
    BookOpen, Users, Star, Play, User, LogOut, Edit,
    DollarSign, Clock, BarChart, FileText, Video, MessageSquare, Send, CheckCircle, List,
    X, Download, Bot, HelpCircle, Lightbulb, MessageCircle, Minimize2, Maximize2, Award
} from 'lucide-react';

const CourseDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrollmentMessage, setEnrollmentMessage] = useState('');
    const [courseMaterials, setCourseMaterials] = useState([]);
    const [loadingMaterials, setLoadingMaterials] = useState(true);
    const [materialsError, setMaterialsError] = useState('');

    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMessage, setNewChatMessage] = useState('');
    const chatMessagesEndRef = useRef(null);

    // Chatbot states
    const [showChatbot, setShowChatbot] = useState(false);
    const [chatbotMessages, setChatbotMessages] = useState([]);
    const [chatbotInput, setChatbotInput] = useState('');
    const [chatbotLoading, setChatbotLoading] = useState(false);
    const [chatbotMinimized, setChatbotMinimized] = useState(false);
    const chatbotMessagesEndRef = useRef(null);

    const [showingMaterialModal, setShowingMaterialModal] = useState(false);
    const [currentMaterialToView, setCurrentMaterialToView] = useState(null);
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

    // State for editing user details
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedEmail, setEditedEmail] = useState('');
    const [editedPhone, setEditedPhone] = useState('');
    const [editError, setEditError] = useState('');

    // Video player states
    const [currentVideo, setCurrentVideo] = useState(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const videoRef = useRef(null);
    const progressUpdateInterval = useRef(null);

    // Video progress state
    const [videoProgress, setVideoProgress] = useState({});

    // NEW: Quiz states
    const [quizzes, setQuizzes] = useState([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(true);
    const [quizzesError, setQuizzesError] = useState('');
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizStartedAt, setQuizStartedAt] = useState(null);
    const [quizTimeRemaining, setQuizTimeRemaining] = useState(null);
    const [quizSubmitMessage, setQuizSubmitMessage] = useState('');
    const [certificateEarned, setCertificateEarned] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [loadingQuizQuestions, setLoadingQuizQuestions] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [quizResults, setQuizResults] = useState(null);

    // Initialize chatbot with welcome message
    useEffect(() => {
        if (course && showChatbot && chatbotMessages.length === 0) {
            const welcomeMessage = {
                id: Date.now(),
                type: 'bot',
                content: `Hi! I'm your AI learning assistant for "${course.title}". I can help you with:
                
• Explaining difficult concepts
• Answering questions about course content
• Clarifying requirements or learning objectives
• Providing study tips and guidance
• Breaking down complex topics

What would you like to know about this course?`,
                timestamp: new Date().toISOString()
            };
            setChatbotMessages([welcomeMessage]);
        }
    }, [course, showChatbot, chatbotMessages.length]);

    // Auto-scroll chatbot to bottom
    useEffect(() => {
        if (chatbotMessagesEndRef.current) {
            chatbotMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatbotMessages]);

    // Simulated AI response function
    const generateChatbotResponse = useCallback((userMessage, courseContext) => {
        const message = userMessage.toLowerCase();
        
        // Course-specific responses
        if (message.includes('requirement') || message.includes('prerequisite')) {
            return courseContext.requirements 
                ? `Based on the course requirements:\n\n${courseContext.requirements}\n\nThese are the recommended prerequisites. If you're new to some of these concepts, I can help explain them or suggest preparatory resources.`
                : "This course doesn't list specific requirements, making it accessible to beginners. However, having basic computer skills and enthusiasm to learn will be helpful!";
        }
        
        if (message.includes('what will i learn') || message.includes('learning objectives')) {
            return courseContext.what_you_learn 
                ? `Here's what you'll master in this course:\n\n${courseContext.what_you_learn}\n\nWould you like me to explain any of these concepts in more detail?`
                : "This course will provide you with comprehensive knowledge in the subject area. For specific learning outcomes, I recommend checking the course materials once enrolled.";
        }
        
        if (message.includes('difficult') || message.includes('hard') || message.includes('challenging')) {
            return `Don't worry! This ${courseContext.difficulty || 'intermediate'} level course is designed to guide you step by step. Here are some tips:

• Start with the basics and build gradually
• Practice regularly with the provided materials
• Use the course chat to ask questions
• Take notes and review them frequently
• Don't hesitate to revisit previous lessons

Remember, every expert was once a beginner. What specific topic are you finding challenging?`;
        }
        
        if (message.includes('study tips') || message.includes('how to study')) {
            return `Here are proven study strategies for this course:

📚 **Before studying:**
• Set clear, achievable goals for each session
• Find a quiet, distraction-free environment
• Have all materials ready

🎯 **During study:**
• Use active learning techniques (take notes, ask questions)
• Practice the "Feynman Technique" - explain concepts in simple terms
• Take breaks every 25-30 minutes

🔄 **After study:**
• Review and summarize key points
• Apply what you learned through practice
• Connect new concepts to previous knowledge

Would you like specific advice for any particular topic?`;
        }
        
        if (message.includes('time') || message.includes('schedule') || message.includes('duration')) {
            const duration = courseContext.duration_hours || 'several';
            return `This course is designed to take approximately ${duration} hours to complete. Here's how to manage your time effectively:

⏰ **Suggested schedule:**
• Dedicate 1-2 hours per study session
• Aim for 3-4 sessions per week
• Allow extra time for practice and assignments

📅 **Time management tips:**
• Create a consistent study schedule
• Break larger topics into smaller chunks
• Set realistic daily/weekly goals
• Track your progress regularly

Remember, learning is a personal journey - adjust the pace to suit your needs!`;
        }
        
        if (message.includes('explain') || message.includes('what is') || message.includes('define')) {
            return `I'd be happy to explain concepts related to ${courseContext.title}! 

To give you the most helpful explanation, could you be more specific about which topic or concept you'd like me to clarify? For example:
• A specific term or definition
• A particular lesson or module
• A concept you're struggling with
• How different ideas connect together

The more specific you are, the better I can tailor my explanation to your needs.`;
        }
        
        if (message.includes('help') || message.includes('stuck') || message.includes('confused')) {
            return `I'm here to help! Learning can be challenging, but you're not alone. Here's how I can assist:

🤔 **If you're stuck on a concept:**
• Tell me which specific topic is confusing
• I'll break it down into simpler parts
• Provide examples and analogies

📚 **If you need study guidance:**
• I can suggest effective learning strategies
• Help create a study plan
• Recommend practice exercises

💡 **If you need motivation:**
• Remember why you started this course
• Focus on small, achievable goals
• Celebrate your progress along the way

What specific area would you like help with?`;
        }
        
        if (message.includes('thank') || message.includes('thanks')) {
            return "You're very welcome! I'm here whenever you need help with your learning journey. Keep up the great work! 🌟";
        }
        
        // Default response with course-specific context
        return `I understand you're asking about "${userMessage}". While I don't have a specific answer for that exact question, I can help you with:

🎓 **Course content:** Explanations of topics covered in "${courseContext.title}"
📖 **Study guidance:** Tips for mastering ${courseContext.category_name || 'this subject'}
❓ **Concept clarification:** Breaking down complex ideas into understandable parts
📅 **Learning strategies:** How to make the most of your study time

Could you rephrase your question or ask about a specific aspect of the course? I'm here to make your learning experience as smooth as possible!`;
    }, []);

    const handleChatbotSubmit = async (e) => {
        e.preventDefault();
        if (!chatbotInput.trim() || chatbotLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: chatbotInput,
            timestamp: new Date().toISOString()
        };

        setChatbotMessages(prev => [...prev, userMessage]);
        setChatbotInput('');
        setChatbotLoading(true);

        // Simulate AI processing delay
        setTimeout(() => {
            const botResponse = {
                id: Date.now() + 1,
                type: 'bot',
                content: generateChatbotResponse(chatbotInput, course),
                timestamp: new Date().toISOString()
            };

            setChatbotMessages(prev => [...prev, botResponse]);
            setChatbotLoading(false);
        }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
    };

    const toggleChatbot = () => {
        setShowChatbot(!showChatbot);
        setChatbotMinimized(false);
    };

    const minimizeChatbot = (e) => {
        e.stopPropagation();
        setChatbotMinimized(!chatbotMinimized);
    };

    // Quick suggestion buttons for the chatbot
    const quickSuggestions = [
        { text: "Explain requirements", icon: <HelpCircle className="h-4 w-4" /> },
        { text: "Study tips", icon: <Lightbulb className="h-4 w-4" /> },
        { text: "What will I learn?", icon: <BookOpen className="h-4 w-4" /> },
        { text: "Course difficulty", icon: <BarChart className="h-4 w-4" /> }
    ];

    const handleQuickSuggestion = (suggestion) => {
        setChatbotInput(suggestion);
    };

    const loadCourseMaterials = useCallback(async (courseId) => {
        setLoadingMaterials(true);
        setMaterialsError('');
        try {
            const materials = await fetchCourseMaterials(courseId);
            setCourseMaterials(materials || []);
        } catch (err) {
            console.error('Error fetching course materials:', err);
            setMaterialsError(err.response?.data?.message || 'Failed to load materials.');
            setCourseMaterials([]);
        } finally {
            setLoadingMaterials(false);
        }
    }, []);

    const fetchChatMessages = useCallback(async (courseId) => {
        if (!courseId) return;
        try {
            const messages = await fetchCourseChatMessages(courseId);
            setChatMessages(messages || []);
        } catch (err) {
            console.error('Error fetching chat messages:', err);
        }
    }, []);

    const loadProgress = async (courseId) => {
        try {
            const progress = await fetchVideoProgress(courseId);
            const progressMap = progress.reduce((acc, p) => {
                acc[p.video_id] = p;
                return acc;
            }, {});
            setVideoProgress(progressMap);
        } catch (err) {
            console.error('Error fetching video progress:', err);
        }
    };

    const handleViewMaterial = (material, index) => {
        if (!canAccessFullMaterials && !material.is_preview) {
            setEnrollmentMessage('Enroll to access this material.');
            return;
        }

        if (canAccessFullMaterials && material.type === 'video' && !isMaterialAccessible(index)) {
            setEnrollmentMessage('Please complete previous videos (at least 80%) to unlock this video.');
            return;
        }

        setCurrentMaterialToView(material);
        setShowingMaterialModal(true);
    };

    const isMaterialAccessible = (index) => {
        if (isInstructorOfThisCourse) return true;
        for (let i = 0; i < index; i++) {
            const prevMaterial = courseMaterials[i];
            if (prevMaterial.type === 'video') {
                const prevProgress = videoProgress[prevMaterial.id];
                if (!prevProgress || !prevProgress.completed) {
                    return false;
                }
            }
        }
        return true;
    };

    const handleCloseMaterialModal = async () => {
        if (currentMaterialToView?.type === 'video' && videoRef.current && currentMaterialToView) {
            const watched = Math.floor(videoRef.current.currentTime);
            try {
                const updated = await updateVideoProgress(currentMaterialToView.id, watched);
                setVideoProgress(prev => ({
                    ...prev,
                    [currentMaterialToView.id]: updated
                }));
            } catch (err) {
                console.error('Error saving final progress:', err);
            }
        }
        setShowingMaterialModal(false);
        setCurrentMaterialToView(null);
        if (course?.id) {
            await loadProgress(course.id);
        }
    };

    const handleOpenEnrollmentModal = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'student') {
            setEnrollmentMessage('Only students can enroll in courses.');
            return;
        }
        if (isEnrolled) {
            setEnrollmentMessage('You are already enrolled in this course.');
            return;
        }

        if (user) {
            setEditedName(user.name);
            setEditedEmail(user.email);
            setEditedPhone(user.phone || '');
        }

        setEditError('');
        setIsEditing(false);
        setShowEnrollmentModal(true);
    };

    const handleCloseEnrollmentModal = () => {
        setShowEnrollmentModal(false);
    };

    const handleEditToggle = () => {
        setIsEditing(prev => !prev);
        if (isEditing) {
            setEditError('');
        }
    };

    const handleSaveDetails = async () => {
        setEditError('');
        if (!editedName.trim() || !editedEmail.trim()) {
            setEditError('Name and email cannot be empty.');
            return;
        }
    
        try {
            const formData = new FormData();
            formData.append('name', editedName);
            formData.append('email', editedEmail);
            formData.append('phone', editedPhone);
    
            const response = await updateProfile(formData);
            
            let updatedUser = null;
            
            if (response && response.user) {
                updatedUser = response.user;
            } else if (response && response.data && response.data.user) {
                updatedUser = response.data.user;
            } else if (response && response.id) {
                updatedUser = response;
            } else if (response && response.data && response.data.id) {
                updatedUser = response.data;
            } else {
                updatedUser = {
                    ...user,
                    name: editedName,
                    email: editedEmail,
                    phone: editedPhone
                };
            }
            
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setIsEditing(false);
            
        } catch (err) {
            console.error('Error updating user profile:', err);
            if (err.response && err.response.data && err.response.data.message) {
                setEditError(err.response.data.message);
            } else if (err.response && err.response.data && err.response.data.error) {
                setEditError(err.response.data.error);
            } else if (err.message) {
                setEditError(err.message);
            } else {
                setEditError('Failed to update profile. Please try again.');
            }
        }
    };

    const confirmEnrollment = async () => {
        handleCloseEnrollmentModal();
        if (!course) {
            setEnrollmentMessage('Course data not loaded.');
            return;
        }

        setEnrollmentMessage('Enrolling...');
        try {
            await enrollCourse(course.id);
            setIsEnrolled(true);
            setEnrollmentMessage('Successfully enrolled in the course!');
            await loadCourseMaterials(course.id);
            await fetchChatMessages(course.id);
            await loadProgress(course.id);
        } catch (err) {
            console.error('Enrollment error:', err);
            const errorMessage = err.response?.data?.message || 'Failed to enroll in course.';
            setEnrollmentMessage(errorMessage);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError('');
            setEnrollmentMessage('');

            try {
                const courseData = await fetchCourseDetails(slug);
                setCourse(courseData);

                const userData = await fetchUserProfile();
                setUser(userData);

                if (userData && userData.role === 'student') {
                    const enrolledCourses = await fetchEnrolledCourses();
                    const alreadyEnrolled = enrolledCourses.some(
                        (enrolledCourse) => enrolledCourse.course_id === courseData.id
                    );
                    setIsEnrolled(alreadyEnrolled);
                    if (alreadyEnrolled) {
                        setEnrollmentMessage('You are already enrolled in this course.');
                    }
                }

                const isInstructorOfCourse = userData && userData.role === 'instructor' && courseData.instructor_id === userData.id;

                if (isInstructorOfCourse || (userData && isEnrolled)) {
                    await loadCourseMaterials(courseData.id);
                    await fetchChatMessages(courseData.id);
                    await loadProgress(courseData.id);
                    await loadQuizzes(courseData.id);
                }

            } catch (err) {
                console.error('Error loading course details or user profile:', err);
                setError(err.response?.data?.message || 'Failed to load course details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [slug, isEnrolled, loadCourseMaterials, fetchChatMessages]);

    useEffect(() => {
        let chatInterval;
        if (course?.id && ((user?.role === 'instructor' && course.instructor_id === user.id) || isEnrolled)) {
            chatInterval = setInterval(() => {
                fetchChatMessages(course.id);
            }, 5000);
        }

        return () => {
            if (chatInterval) clearInterval(chatInterval);
        };
    }, [course?.id, user, isEnrolled, fetchChatMessages, course?.instructor_id]);

    useEffect(() => {
        if (showingMaterialModal && currentMaterialToView?.type === 'video' && videoRef.current) {
            const handleTimeUpdate = async () => {
                if (!videoRef.current || !currentMaterialToView) return; // Guard against null/undefined
                const watched = Math.floor(videoRef.current.currentTime);
                try {
                    const updated = await updateVideoProgress(currentMaterialToView.id, watched);
                    setVideoProgress(prev => ({
                        ...prev,
                        [currentMaterialToView.id]: updated
                    }));
                } catch (err) {
                    console.error('Error updating video progress:', err);
                }
            };

            progressUpdateInterval.current = setInterval(handleTimeUpdate, 10000);

            return () => {
                clearInterval(progressUpdateInterval.current);
                if (videoRef.current && currentMaterialToView) {
                    handleTimeUpdate(); // Save final progress only if refs exist
                }
            };
        }
    }, [showingMaterialModal, currentMaterialToView]);

    const handleNewChatMessageChange = (e) => {
        setNewChatMessage(e.target.value);
    };

    const handleSendChatMessage = async (e) => {
        e.preventDefault();
        if (!newChatMessage.trim() || !course?.id || !user) {
            return;
        }

        try {
            const tempMessage = {
                id: Date.now(),
                user_id: user.id,
                user_name: user.name,
                user_role: user.role,
                message_content: newChatMessage,
                timestamp: new Date().toISOString(),
                is_optimistic: true
            };
            setChatMessages(prev => [...prev, tempMessage]);
            setNewChatMessage('');

            await sendCourseChatMessage(course.id, newChatMessage);
            await fetchChatMessages(course.id);
        } catch (err) {
            console.error('Error sending chat message:', err);
            setChatMessages(prev => prev.filter(msg => !msg.is_optimistic));
            setNewChatMessage(newChatMessage);
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'instructor': return 'bg-green-100 text-green-800';
            case 'parent': return 'bg-purple-100 text-purple-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    // Calculate overall progress
    const calculateOverallProgress = () => {
        const videoMaterials = courseMaterials.filter(m => m.type === 'video');
        if (videoMaterials.length === 0) return 0;
        const completed = videoMaterials.reduce((acc, m) => {
            const p = videoProgress[m.id];
            return acc + (p && p.completed ? 1 : 0);
        }, 0);
        return (completed / videoMaterials.length) * 100;
    };

    const overallProgress = calculateOverallProgress();

    // NEW: Load quizzes
    const loadQuizzes = async (courseId) => {
        setLoadingQuizzes(true);
        setQuizzesError('');
        try {
            const quizzesData = await fetchCourseQuizzes(courseId);
            setQuizzes(quizzesData || []);
        } catch (err) {
            setQuizzesError(err.message || 'Failed to load quizzes.');
            setQuizzes([]);
        } finally {
            setLoadingQuizzes(false);
        }
    };

    // NEW: Handle starting quiz
    const startQuiz = async (quiz) => {
        setLoadingQuizQuestions(true);
        try {
            const questions = await fetchQuizQuestions(quiz.id);
            setSelectedQuiz({ ...quiz, questions: questions || [] });
            setQuizAnswers({});
            setQuizStartedAt(new Date().toISOString());
            setQuizTimeRemaining(quiz.time_limit_minutes * 60);
            setShowQuizModal(true);
            setQuizSubmitMessage('');
            setShowResults(false);
            setQuizResults(null);
        } catch (err) {
            setQuizSubmitMessage('Failed to load quiz questions.');
        } finally {
            setLoadingQuizQuestions(false);
        }
    };

    // NEW: Quiz timer
    useEffect(() => {
        if (showQuizModal && selectedQuiz && quizTimeRemaining > 0 && !showResults) {
            const timer = setInterval(() => {
                setQuizTimeRemaining(prev => prev - 1);
            }, 1000);

            return () => clearInterval(timer);
        } else if (quizTimeRemaining <= 0 && showQuizModal && !showResults) {
            handleQuizSubmit();
        }
    }, [showQuizModal, selectedQuiz, quizTimeRemaining, showResults]);

    // NEW: Handle quiz answer change
    const handleQuizAnswerChange = (questionId, answer) => {
        setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    // NEW: Handle quiz submission
    const handleQuizSubmit = async () => {
        try {
            const results = await submitQuizAttempt(selectedQuiz.id, quizAnswers, quizStartedAt);
            setQuizResults(results);
            setShowResults(true);
            
            let message;
            let earnedCert = false;
            
            if (results && results.score_percentage !== undefined) {
                if (results.score_percentage >= 80) {
                    message = `Congratulations! You scored ${results.score_percentage}% and earned a certificate!`;
                    await generateCertificate(course.id);
                    earnedCert = true;
                } else {
                    message = `Your score: ${results.score_percentage}%. Score less than 80%. Try again!`;
                }
            } else {
                // Client-side fallback calculation
                let correct = 0;
                selectedQuiz.questions.forEach(q => {
                    if (quizAnswers[q.id] === q.correct_answer) correct++;
                });
                const score_percentage = (correct / selectedQuiz.questions.length) * 100;
                message = `Your score: ${score_percentage.toFixed(2)}%`;
                if (score_percentage >= 80) {
                    message += ' and earned a certificate!';
                    await generateCertificate(course.id);
                    earnedCert = true;
                } else {
                    message += '. Score less than 80%. Try again!';
                }
                results = { ...results, score_percentage };
            }
            
            setQuizSubmitMessage(message);
            setCertificateEarned(earnedCert);
            
        } catch (err) {
            // Client-side calculation on error
            let correct = 0;
            selectedQuiz.questions.forEach(q => {
                if (quizAnswers[q.id] === q.correct_answer) correct++;
            });
            const score_percentage = (correct / selectedQuiz.questions.length) * 100;
            let message = `Your score: ${score_percentage.toFixed(2)}% (calculated locally due to submission error)`;
            let earnedCert = false;
            if (score_percentage >= 80) {
                message += '. You qualify for a certificate! Please try submitting again.';
                earnedCert = true;
            } else {
                message += '. Score less than 80%. Try again!';
            }
            setQuizSubmitMessage(message);
            setCertificateEarned(earnedCert);
        } finally {
            setShowResults(true);
        }
    };

    // NEW: Parse options from explanation
    const parseOptions = (explanation) => {
        if (!explanation || !explanation.startsWith('Options: ')) return [];
        const optionsStr = explanation.substring(9);
        return optionsStr.split(/ [A-D]\. /).map((opt, index) => ({
            letter: String.fromCharCode(65 + index),
            text: opt.trim(),
        })).filter(opt => opt.text);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-gray-700">Loading course details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-8">
                <h2 className="text-2xl font-bold mb-4">Error Loading Course</h2>
                <p className="text-lg mb-6">{error}</p>
                <Link to="/" className="text-blue-600 hover:underline">Go back to Home</Link>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700 p-8">
                <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
                <p className="text-lg mb-6">The course you are looking for does not exist or is not published.</p>
                <Link to="/" className="text-blue-600 hover:underline">Go back to Home</Link>
            </div>
        );
    }

    const isInstructorOfThisCourse = user && user.role === 'instructor' && user.id === course.instructor_id;
    const canAccessFullMaterials = isInstructorOfThisCourse || isEnrolled;

    return (
        <div className="min-h-screen bg-gray-50 font-sans relative">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200">
                                <BookOpen className="h-8 w-8" />
                                <span className="ml-2 text-xl font-bold text-gray-900">EduPlatform</span>
                            </Link>
                        </div>

                        <div className="flex items-center space-x-4">
                            {user ? (
                                <div className="flex items-center space-x-2">
                                    <Link to="/dashboard" className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                                        <User className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">{user.name}</span>
                                        <span className={`text-xs ${getRoleColor(user.role)} px-2 py-1 rounded`}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                                    </Link>
                                    <button
                                        onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); navigate('/'); }}
                                        className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors duration-200"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span className="text-sm">Logout</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">Login</Link>
                                    <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-16 px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{course.title}</h1>
                        <p className="text-lg mb-6 opacity-90">{course.short_description}</p>
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="flex items-center">
                                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                                <span className="ml-1 text-xl font-semibold">
                                    {course.average_rating ? parseFloat(course.average_rating).toFixed(1) : 'N/A'}
                                </span>
                                <span className="ml-2 text-sm opacity-80">({course.review_count || 0} reviews)</span>
                            </div>
                            <span className="text-sm opacity-80">
                                <Users className="h-4 w-4 inline-block mr-1" /> {course.enrolled_students || 0} students
                            </span>
                        </div>
                        <div className="flex items-center space-x-6 text-sm mb-6">
                            <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {course.duration_hours} hours</span>
                            <span className="flex items-center"><BarChart className="h-4 w-4 mr-1" /> {course.difficulty}</span>
                            <span className="flex items-center"><FileText className="h-4 w-4 mr-1" /> {course.total_materials || 0} materials</span>
                            <span className="flex items-center"><Video className="h-4 w-4 mr-1" /> {course.total_videos || 0} videos</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-6">
                            {course.instructor_profile_image_url && (
                                <img src={course.instructor_profile_image_url} alt={course.instructor_name} className="w-10 h-10 rounded-full object-cover" />
                            )}
                            <span className="text-sm opacity-90">Created by <span className="font-semibold">{course.instructor_name}</span></span>
                        </div>

                        {user?.role === 'student' && !isEnrolled && (
                            <button
                                onClick={handleOpenEnrollmentModal}
                                className="bg-white text-blue-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-100 transition-colors shadow-lg flex items-center justify-center"
                            >
                                <DollarSign className="h-6 w-6 mr-2" />
                                Enroll Now for ${course.discount_price || course.price}
                            </button>
                        )}
                        {user?.role === 'student' && isEnrolled && (
                            <button
                                disabled
                                className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold text-lg cursor-not-allowed flex items-center justify-center"
                            >
                                <CheckCircle className="h-6 w-6 mr-2" /> Already Enrolled
                            </button>
                        )}
                        {user?.role === 'instructor' && isInstructorOfThisCourse && (
                            <Link
                                to="/dashboard"
                                className="bg-yellow-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-yellow-600 transition-colors shadow-lg flex items-center justify-center"
                            >
                                <Edit className="h-6 w-6 mr-2" /> Manage Course
                            </Link>
                        )}
                        {user?.role === 'student' && !user.id && (
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-white text-blue-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-100 transition-colors shadow-lg flex items-center justify-center"
                            >
                                <DollarSign className="h-6 w-6 mr-2" />
                                Login to Enroll
                            </button>
                        )}

                        {enrollmentMessage && (
                            <p className={`mt-4 text-center p-3 rounded-lg text-sm ${enrollmentMessage.includes('Successfully') || enrollmentMessage.includes('already enrolled') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {enrollmentMessage}
                            </p>
                        )}
                    </div>
                    <div>
                        {course.thumbnail_url && (
                            <img src={course.thumbnail_url} alt={course.title} className="w-full h-auto rounded-lg shadow-xl" />
                        )}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="max-w-7xl mx-auto py-16 px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Course Description</h2>
                        <p className="text-gray-700 leading-relaxed">{course.description}</p>
                    </div>

                    {course.what_you_learn && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">What You'll Learn</h2>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                {course.what_you_learn.split('\n').map((item, index) => (
                                    item.trim() && <li key={index}>{item.trim()}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {course.requirements && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Requirements</h2>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                {course.requirements.split('\n').map((item, index) => (
                                    item.trim() && <li key={index}>{item.trim()}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {course.target_audience && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Who is this course for?</h2>
                            <p className="text-gray-700 leading-relaxed">{course.target_audience}</p>
                        </div>
                    )}

                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Course Content</h2>
                        {isEnrolled && (
                            <div className="mb-4">
                                <p className="text-lg font-semibold">Overall Progress: {overallProgress.toFixed(0)}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${overallProgress}%` }}></div>
                                </div>
                            </div>
                        )}
                        {loadingMaterials ? (
                            <p className="text-gray-600">Loading materials...</p>
                        ) : materialsError ? (
                            <p className="text-red-600">{materialsError}</p>
                        ) : courseMaterials.length === 0 ? (
                            <p className="text-gray-600">No materials available for this course yet.</p>
                        ) : (
                            <ul className="space-y-4">
                                {courseMaterials.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((material, index) => (
                                    <li key={material.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm bg-white">
                                        <div className="flex items-center space-x-3 flex-grow">
                                            {material.type === 'video' && <Video className="h-6 w-6 text-blue-500" />}
                                            {material.type === 'document' && <FileText className="h-6 w-6 text-green-500" />}
                                            {(material.type === 'quiz' || material.type === 'other') && <List className="h-6 w-6 text-purple-500" />}
                                            <div className="flex-grow">
                                                <p className="font-semibold text-gray-800">{material.title}</p>
                                                <p className="text-sm text-gray-600">
                                                    {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
                                                    {material.duration_seconds > 0 && ` - ${Math.floor(material.duration_seconds / 60)}m ${material.duration_seconds % 60}s`}
                                                </p>
                                                {material.type === 'video' && canAccessFullMaterials && (
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                        <div 
                                                            className="bg-blue-600 h-1.5 rounded-full" 
                                                            style={{ width: `${videoProgress[material.id]?.progress_percentage || 0}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {canAccessFullMaterials || material.is_preview ? (
                                            (material.file_url || material.content) ? (
                                                <button
                                                    onClick={() => handleViewMaterial(material, index)}
                                                    disabled={canAccessFullMaterials && material.type === 'video' && !isMaterialAccessible(index)}
                                                    className={`px-4 py-2 rounded-lg text-sm flex items-center ${
                                                        canAccessFullMaterials && material.type === 'video' && !isMaterialAccessible(index)
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                    } transition-colors`}
                                                >
                                                    <Play className="h-4 w-4 mr-1" /> View Content
                                                </button>
                                            ) : (
                                                <span className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm">No Content</span>
                                            )
                                        ) : (
                                            <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm">
                                                {material.is_preview ? 'Preview Available' : 'Enroll to Access'}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!canAccessFullMaterials && (
                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                                <p className="font-semibold">Enroll to unlock all course materials and participate in discussions!</p>
                            </div>
                        )}
                    </div>

                    {/* NEW: Quizzes Section */}
                    {canAccessFullMaterials && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Course Quizzes</h2>
                            {overallProgress < 100 ? (
                                <p className="text-gray-600 p-4 bg-yellow-50 rounded-lg">Complete all course materials (100% progress) to unlock quizzes.</p>
                            ) : loadingQuizzes ? (
                                <p className="text-gray-600">Loading quizzes...</p>
                            ) : quizzesError ? (
                                <p className="text-red-600">{quizzesError}</p>
                            ) : quizzes.length === 0 ? (
                                <p className="text-gray-600">No quizzes available for this course yet.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {quizzes.map(quiz => (
                                        <li key={quiz.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm bg-white">
                                            <div className="flex-grow">
                                                <p className="font-semibold text-gray-800">{quiz.title}</p>
                                                <p className="text-sm text-gray-600">
                                                    Time Limit: {quiz.time_limit_minutes} min | Passing: {quiz.passing_percentage}% | Attempts Allowed: {quiz.max_attempts}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => startQuiz(quiz)}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center"
                                            >
                                                <Award className="h-4 w-4 mr-1" /> Take Quiz
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {certificateEarned && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center">
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    <p className="font-semibold">Certificate Earned! <button onClick={() => downloadCertificate(course.id, user.id)} className="text-blue-600 hover:underline ml-2">Download Now</button></p>
                                </div>
                            )}
                        </div>
                    )}

                    {canAccessFullMaterials && (
                        <div className="mt-8 border border-gray-200 p-6 rounded-lg bg-white">
                            <h4 className="text-2xl font-extrabold text-gray-900 mb-4 flex items-center">
                                <MessageSquare className="h-6 w-6 mr-2 text-blue-600" /> Course Chat
                            </h4>
                            <div className="h-80 bg-gray-100 p-4 rounded-md overflow-y-auto flex flex-col space-y-3 mb-4 border border-gray-200">
                                {chatMessages.length === 0 ? (
                                    <p className="text-gray-500 text-center mt-auto mb-auto">No messages yet. Start the conversation!</p>
                                ) : (
                                    chatMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${
                                                message.user_id === user.id ? 'justify-end' : 'justify-start'
                                            }`}
                                        >
                                            <div
                                                className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                                                    message.user_id === user.id
                                                        ? 'bg-blue-500 text-white rounded-br-none'
                                                        : 'bg-gray-300 text-gray-800 rounded-bl-none'
                                                }`}
                                            >
                                                <p className="font-semibold text-sm mb-1">
                                                    {message.user_id === user.id ? 'You' : message.user_name || 'Unknown User'}
                                                    <span className={`ml-2 text-xs px-1 py-0.5 rounded ${
                                                        message.user_role === 'instructor' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                                                    }`}>
                                                        {message.user_role}
                                                    </span>
                                                </p>
                                                <p className="text-sm">{message.message_content}</p>
                                                <p className="text-right text-xs mt-1 opacity-75">
                                                    {new Date(message.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={chatMessagesEndRef} />
                            </div>
                            <form onSubmit={handleSendChatMessage} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newChatMessage || ''}
                                    onChange={handleNewChatMessageChange}
                                    placeholder="Type your message..."
                                    className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-20">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Instructor</h3>
                        <div className="flex items-center space-x-4 mb-4">
                            {course.instructor_profile_image_url && (
                                <img src={course.instructor_profile_image_url} alt={course.instructor_name} className="w-16 h-16 rounded-full object-cover shadow-md" />
                            )}
                            <div>
                                <p className="text-xl font-semibold text-gray-800">{course.instructor_name}</p>
                                <p className="text-sm text-gray-600">Expert Educator</p>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-6">
                            {course.instructor_name} is a seasoned professional with years of experience in {course.category_name}. He is dedicated to sharing his knowledge.
                        </p>
                        <Link to={`/instructor/${course.instructor_id}`} className="text-blue-600 hover:underline text-sm font-medium">
                            View Instructor Profile
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16 mt-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <BookOpen className="h-8 w-8 text-blue-400" />
                                <span className="ml-2 text-xl font-bold">EduPlatform</span>
                            </div>
                            <p className="text-gray-400">
                                Empowering learners worldwide with quality education and innovative learning experiences.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                <li><Link to="/courses" className="text-gray-400 hover:text-white transition-colors duration-200">Courses</Link></li>
                                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors duration-200">About Us</Link></li>
                                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors duration-200">Contact</Link></li>
                                <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors duration-200">Blog</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
                            <ul className="space-y-2">
                                <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors duration-200">Terms of Service</Link></li>
                                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy Policy</Link></li>
                                <li><Link to="/cookies" className="text-gray-400 hover:text-white transition-colors duration-200">Cookie Policy</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
                            <ul className="space-y-2">
                                <li><a href="https://facebook.com" className="text-gray-400 hover:text-white transition-colors duration-200">Facebook</a></li>
                                <li><a href="https://twitter.com" className="text-gray-400 hover:text-white transition-colors duration-200">Twitter</a></li>
                                <li><a href="https://linkedin.com" className="text-gray-400 hover:text-white transition-colors duration-200">LinkedIn</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-500">
                        <p>&copy; 2025 EduPlatform. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* AI Chatbot Button */}
            <div className="fixed bottom-6 right-6 z-[60]">
                <button
                    onClick={toggleChatbot}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                    aria-label="Open AI Learning Assistant"
                >
                    <Bot className="h-6 w-6" />
                    <MessageCircle className="h-4 w-4" />
                </button>
            </div>

            {/* AI Chatbot Modal */}
            {showChatbot && (
                <div className="fixed bottom-20 right-6 z-[60] w-96 bg-white rounded-lg shadow-2xl border border-gray-200">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                        <div className="flex items-center space-x-2">
                            <Bot className="h-5 w-5" />
                            <span className="font-semibold">AI Learning Assistant</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={minimizeChatbot}
                                className="text-white/80 hover:text-white transition-colors p-1"
                                aria-label="Minimize chatbot"
                            >
                                {chatbotMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={toggleChatbot}
                                className="text-white/80 hover:text-white transition-colors p-1"
                                aria-label="Close chatbot"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {!chatbotMinimized && (
                        <>
                            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
                                {chatbotMessages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] p-3 rounded-lg shadow-sm ${
                                                message.type === 'user'
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                                            }`}
                                        >
                                            {message.type === 'bot' && (
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Bot className="h-4 w-4 text-blue-600" />
                                                    <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                                                </div>
                                            )}
                                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                            <div className={`text-right text-xs mt-2 ${
                                                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {chatbotLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white text-gray-800 p-3 rounded-lg rounded-bl-none border border-gray-200 shadow-sm">
                                            <div className="flex items-center space-x-2">
                                                <Bot className="h-4 w-4 text-blue-600" />
                                                <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                                            </div>
                                            <div className="flex items-center space-x-1 mt-2">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                </div>
                                                <span className="text-sm text-gray-600 ml-2">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatbotMessagesEndRef} />
                            </div>

                            {chatbotMessages.length <= 1 && !chatbotLoading && (
                                <div className="p-3 bg-gray-100 border-t">
                                    <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {quickSuggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleQuickSuggestion(suggestion.text)}
                                                className="flex items-center space-x-1 px-3 py-1 bg-white text-gray-700 text-xs rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors border border-gray-200"
                                            >
                                                {suggestion.icon}
                                                <span>{suggestion.text}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 border-t bg-white rounded-b-lg">
                                <form onSubmit={handleChatbotSubmit} className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={chatbotInput || ''}
                                        onChange={(e) => setChatbotInput(e.target.value)}
                                        placeholder="Ask me about this course..."
                                        className="flex-grow border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                        disabled={chatbotLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={chatbotLoading || !chatbotInput.trim()}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Material Viewer Modal */}
            {showingMaterialModal && currentMaterialToView && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900">{currentMaterialToView.title}</h3>
                            <div className="flex items-center space-x-2">
                                {currentMaterialToView.file_url && (
                                    <a
                                        href={currentMaterialToView.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                        aria-label="Download material"
                                    >
                                        <Download className="h-5 w-5" />
                                    </a>
                                )}
                                <button
                                    onClick={handleCloseMaterialModal}
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-grow">
                            {currentMaterialToView.type === 'video' && currentMaterialToView.file_url && (
                                <video ref={videoRef} controls className="w-full h-auto rounded-lg">
                                    <source src={currentMaterialToView.file_url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            {currentMaterialToView.type === 'document' && currentMaterialToView.file_url && (
                                <iframe
                                    src={currentMaterialToView.file_url}
                                    className="w-full min-h-[60vh] border border-gray-300 rounded-lg"
                                    title={currentMaterialToView.title}
                                ></iframe>
                            )}
                            {currentMaterialToView.type === 'text' && currentMaterialToView.content && (
                                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentMaterialToView.content }}></div>
                            )}
                            {(currentMaterialToView.type === 'other' || currentMaterialToView.type === 'quiz') && (
                                <div className="bg-gray-100 p-6 rounded-lg">
                                    <h4 className="text-xl font-semibold mb-2">Content Unavailable for Preview</h4>
                                    <p className="text-gray-700">This material type cannot be displayed directly. You can try downloading it using the button above or contact the instructor for more details.</p>
                                </div>
                            )}
                            {!currentMaterialToView.file_url && !currentMaterialToView.content && (
                                <div className="text-center p-8 text-gray-500">
                                    No content available to display.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Enrollment Confirmation Modal */}
            {showEnrollmentModal && user && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {isEditing ? 'Edit Your Details' : 'Confirm Enrollment'}
                            </h3>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleEditToggle}
                                    className="text-blue-600 hover:bg-blue-100 rounded-full p-2 transition-colors"
                                    aria-label={isEditing ? 'Cancel edit' : 'Edit details'}
                                >
                                    <Edit className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={handleCloseEnrollmentModal}
                                    className="text-gray-500 hover:bg-gray-100 rounded-full p-2 transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {isEditing ? (
                            <div>
                                <p className="text-lg text-gray-700 mb-4">
                                    Update your information and click "Save Changes".
                                </p>
                                <div className="space-y-4 mb-6">
                                    <label className="block">
                                        <span className="text-sm text-gray-500 font-medium">Full Name</span>
                                        <input
                                            type="text"
                                            value={editedName || ''}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-gray-500 font-medium">Email Address</span>
                                        <input
                                            type="email"
                                            value={editedEmail || ''}
                                            onChange={(e) => setEditedEmail(e.target.value)}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-gray-500 font-medium">Phone Number</span>
                                        <input
                                            type="tel"
                                            value={editedPhone || ''}
                                            onChange={(e) => setEditedPhone(e.target.value)}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </label>
                                </div>
                                {editError && <p className="text-sm text-red-600 mb-4">{editError}</p>}
                                <button
                                    onClick={handleSaveDetails}
                                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg text-gray-700 mb-4">
                                    Please verify your information before enrolling in **"{course?.title}"**.
                                </p>
                                <div className="space-y-3 mb-6">
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <p className="text-sm text-gray-500 font-medium">Full Name:</p>
                                        <p className="text-lg font-semibold text-gray-800">{user.name}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <p className="text-sm text-gray-500 font-medium">Email Address:</p>
                                        <p className="text-lg font-semibold text-gray-800">{user.email}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <p className="text-sm text-gray-500 font-medium">Phone Number:</p>
                                        <p className="text-lg font-semibold text-gray-800">
                                            {user.phone || 'Not provided'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mb-6">
                                    By clicking "Confirm and Enroll", you agree to the course terms and conditions.
                                </p>
                                <button
                                    onClick={confirmEnrollment}
                                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
                                >
                                    Confirm and Enroll
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* NEW: Quiz Modal */}
            {showQuizModal && selectedQuiz && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-2xl font-bold text-gray-900">{selectedQuiz.title}</h3>
                            <button
                                onClick={() => setShowQuizModal(false)}
                                className="text-gray-500 hover:bg-gray-100 rounded-full p-2 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        {loadingQuizQuestions ? (
                            <p className="text-center py-8">Loading questions...</p>
                        ) : (
                            <>
                                {!showResults ? (
                                    <>
                                        <p className="mb-4">Time Remaining: {Math.floor(quizTimeRemaining / 60)}:{quizTimeRemaining % 60 < 10 ? '0' : ''}{quizTimeRemaining % 60}</p>
                                        <p className="mb-4 text-sm text-gray-600">Total Questions: {selectedQuiz.questions.length} (Each 1 mark)</p>
                                        <div className="overflow-y-auto flex-grow">
                                            {(selectedQuiz.questions || []).map(question => {
                                                const options = parseOptions(question.explanation);
                                                return (
                                                    <div key={question.id} className="mb-6 border-b pb-4">
                                                        <p className="font-semibold text-lg mb-3">{question.question}</p>
                                                        <div className="space-y-3">
                                                            {options.map(opt => (
                                                                <label key={opt.letter} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                                                    <input 
                                                                        type="radio" 
                                                                        name={`q${question.id}`} 
                                                                        value={opt.letter} 
                                                                        onChange={() => handleQuizAnswerChange(question.id, opt.letter)}
                                                                        className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-gray-800">{opt.text}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-6 flex justify-end space-x-3">
                                            <button
                                                onClick={() => setShowQuizModal(false)}
                                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleQuizSubmit}
                                                disabled={Object.keys(quizAnswers).length < selectedQuiz.questions.length}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                Submit Quiz
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <h4 className="text-2xl font-bold mb-4">{quizSubmitMessage}</h4>
                                        {certificateEarned ? (
                                            <button
                                                onClick={() => downloadCertificate(course.id, user.id)}
                                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center mx-auto"
                                            >
                                                <Download className="h-5 w-5 mr-2" /> Download Certificate
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setShowQuizModal(false)}
                                                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                Try Again
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowQuizModal(false)}
                                            className="mt-4 text-blue-600 hover:underline"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseDetail;
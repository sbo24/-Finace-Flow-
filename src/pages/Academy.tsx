// ===========================================
// Página de Academia - Microcursos Financieros
// Educación financiera personalizada
// ===========================================

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    MICRO_COURSES,
    getUserCourseProgress,
    startCourse,
    completeLesson,
    getRecommendedCourses,
    type MicroCourse,
    type UserCourseProgress
} from '../data/courses';
import {
    BookOpen,
    CheckCircle,
    ChevronRight,
    Clock,
    Award,
    ArrowLeft,
    Play,
    Search
} from 'lucide-react';

export default function Academy() {
    const { currentUser } = useAuth();
    const [progress, setProgress] = useState<UserCourseProgress[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<MicroCourse | null>(null);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [showQuiz, setShowQuiz] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizResults, setQuizResults] = useState<boolean[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

    useEffect(() => {
        if (currentUser) {
            loadProgress();
        }
    }, [currentUser]);

    const loadProgress = () => {
        if (!currentUser) return;
        setProgress(getUserCourseProgress(currentUser.id));
    };

    const handleStartCourse = (course: MicroCourse) => {
        if (!currentUser) return;
        startCourse(currentUser.id, course.id);
        setSelectedCourse(course);
        setCurrentLessonIndex(0);
        setCurrentQuizIndex(0);
        setShowQuiz(false);
        setSelectedAnswer(null);
        setQuizSubmitted(false);
        setQuizResults([]);
        loadProgress();
    };

    const handleCompleteLesson = (results?: boolean[]) => {
        if (!currentUser || !selectedCourse) return;

        const lesson = selectedCourse.lessons[currentLessonIndex];
        completeLesson(currentUser.id, selectedCourse.id, lesson.id, results);
        loadProgress();

        // Siguiente lección o finalizar
        if (currentLessonIndex < selectedCourse.lessons.length - 1) {
            setCurrentLessonIndex(prev => prev + 1);
            setCurrentQuizIndex(0);
            setShowQuiz(false);
            setSelectedAnswer(null);
            setQuizSubmitted(false);
            setQuizResults([]);
        } else {
            // Curso completado
            setSelectedCourse(null);
        }
    };

    const handleQuizSubmit = () => {
        if (selectedAnswer === null || !selectedCourse) return;

        const lesson = selectedCourse.lessons[currentLessonIndex];
        const quizzes = lesson.quizzes || [];
        const currentQuiz = quizzes[currentQuizIndex];

        if (!currentQuiz) return;

        const isCorrect = selectedAnswer === currentQuiz.correctIndex;
        const newResults = [...quizResults, isCorrect];
        setQuizResults(newResults);
        setQuizSubmitted(true);

        // Transition logic
        setTimeout(() => {
            if (currentQuizIndex < quizzes.length - 1) {
                // Next quiz in same lesson
                setCurrentQuizIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setQuizSubmitted(false);
            } else {
                // All quizzes done for this lesson
                handleCompleteLesson(newResults);
            }
        }, 2000);
    };

    const getCourseProgress = (courseId: string): number => {
        const courseProgress = progress.find(p => p.courseId === courseId);
        const course = MICRO_COURSES.find(c => c.id === courseId);
        if (!courseProgress || !course) return 0;
        return Math.round((courseProgress.completedLessons.length / course.lessons.length) * 100);
    };

    const isCourseCompleted = (courseId: string): boolean => {
        return progress.some(p => p.courseId === courseId && p.completed);
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'var(--success)';
            case 'intermediate': return 'var(--warning)';
            case 'advanced': return 'var(--danger)';
            default: return 'var(--text-muted)';
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'Principiante';
            case 'intermediate': return 'Intermedio';
            case 'advanced': return 'Avanzado';
            default: return difficulty;
        }
    };

    const completedCount = progress.filter(p => p.completed).length;
    const recommendedCourses = currentUser ? getRecommendedCourses(currentUser.id) : [];

    const filteredCourses = useMemo(() => {
        return MICRO_COURSES.filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDifficulty = difficultyFilter === 'all' || course.difficulty === difficultyFilter;
            const progressPct = getCourseProgress(course.id);
            const completed = isCourseCompleted(course.id);
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'completed' && completed) ||
                (statusFilter === 'in_progress' && progressPct > 0 && !completed) ||
                (statusFilter === 'not_started' && progressPct === 0);
            return matchesSearch && matchesDifficulty && matchesStatus;
        });
    }, [searchTerm, difficultyFilter, statusFilter, progress]);

    // Vista de lección
    if (selectedCourse) {
        const lesson = selectedCourse.lessons[currentLessonIndex];
        // hasQuiz check updated to use quizzes array

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedCourse(null)}
                        className="btn btn-ghost btn-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">{selectedCourse.title}</h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Lección {currentLessonIndex + 1} de {selectedCourse.lessons.length}
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar h-2">
                    <div
                        className="progress-fill-success h-full transition-all"
                        style={{ width: `${((currentLessonIndex + 1) / selectedCourse.lessons.length) * 100}%` }}
                    ></div>
                </div>

                {/* Lesson content */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-1">{lesson.title}</h2>
                    {showQuiz && (
                        <p className="text-sm text-[var(--text-muted)] mb-4 italic">
                            Pregunta {currentQuizIndex + 1} de {lesson.quizzes?.length || 0}
                        </p>
                    )}

                    {!showQuiz ? (
                        <>
                            <div
                                className="prose prose-invert max-w-none lesson-content"
                                dangerouslySetInnerHTML={{
                                    __html: lesson.content
                                        .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
                                        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
                                        .replace(/^### (.+)$/gm, '<h3 class="text-md font-semibold mt-3 mb-1">$1</h3>')
                                        .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-[var(--primary)] pl-4 py-2 my-4 bg-[var(--bg-tertiary)] rounded-r">$1</blockquote>')
                                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\n\n/g, '</p><p class="my-3">')
                                        .replace(/\|(.+)\|/g, (match) => `<div class="overflow-x-auto my-4"><table class="w-full text-sm">${match}</table></div>`)
                                }}
                            />

                            <div className="flex justify-end mt-6">
                                {lesson.quizzes && lesson.quizzes.length > 0 ? (
                                    <button
                                        onClick={() => setShowQuiz(true)}
                                        className="btn btn-primary"
                                    >
                                        Comenzar {lesson.quizzes.length} {lesson.quizzes.length === 1 ? 'Pregunta' : 'Preguntas'}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleCompleteLesson()}
                                        className="btn btn-primary"
                                    >
                                        {currentLessonIndex < selectedCourse.lessons.length - 1 ? 'Siguiente Lección' : 'Completar Curso'}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </>
                    ) : lesson.quizzes && (
                        /* Quiz */
                        <div className="space-y-6">
                            <p className="text-lg font-medium">{lesson.quizzes[currentQuizIndex].question}</p>

                            <div className="space-y-3">
                                {lesson.quizzes[currentQuizIndex].options.map((option: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => !quizSubmitted && setSelectedAnswer(idx)}
                                        disabled={quizSubmitted}
                                        className={`w-full p-4 text-left rounded-xl border transition-all ${quizSubmitted
                                            ? idx === lesson.quizzes![currentQuizIndex].correctIndex
                                                ? 'border-[var(--success)] bg-[var(--success)]/10'
                                                : idx === selectedAnswer
                                                    ? 'border-[var(--danger)] bg-[var(--danger)]/10'
                                                    : 'border-[var(--border)] opacity-50'
                                            : selectedAnswer === idx
                                                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                                : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{option}</span>
                                            {quizSubmitted && idx === lesson.quizzes![currentQuizIndex].correctIndex && (
                                                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {quizSubmitted && (
                                <div className={`p-4 rounded-xl ${selectedAnswer === lesson.quizzes[currentQuizIndex].correctIndex
                                    ? 'bg-[var(--success)]/10 border border-[var(--success)]'
                                    : 'bg-[var(--danger)]/10 border border-[var(--danger)]'
                                    }`}>
                                    <p className="font-medium mb-1">
                                        {selectedAnswer === lesson.quizzes[currentQuizIndex].correctIndex ? '¡Correcto! 🎉' : 'Incorrecto 😅'}
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {lesson.quizzes[currentQuizIndex].explanation}
                                    </p>
                                </div>
                            )}

                            {!quizSubmitted && (
                                <button
                                    onClick={handleQuizSubmit}
                                    disabled={selectedAnswer === null}
                                    className="btn btn-primary w-full"
                                >
                                    Comprobar Respuesta
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Vista principal - Lista de cursos
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="w-7 h-7 text-[var(--primary)]" />
                    Academia Financiera
                </h1>
                <p className="text-[var(--text-secondary)]">
                    Aprende a dominar tus finanzas con microcursos de 3-6 minutos
                </p>
            </div>

            {/* Filters */}
            <div className="glass-card p-4">
                <div className="filters-row">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            className="input search-field search-input"
                            placeholder="Buscar cursos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="input" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value as 'all' | 'beginner' | 'intermediate' | 'advanced')}>
                        <option value="all">Todas las dificultades</option>
                        <option value="beginner">Principiante</option>
                        <option value="intermediate">Intermedio</option>
                        <option value="advanced">Avanzado</option>
                    </select>
                    <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'in_progress' | 'not_started')}>
                        <option value="all">Todos los estados</option>
                        <option value="completed">Completados</option>
                        <option value="in_progress">En progreso</option>
                        <option value="not_started">No iniciados</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-[var(--success)]">{completedCount}</p>
                    <p className="text-sm text-[var(--text-secondary)]">Cursos completados</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-[var(--primary)]">{MICRO_COURSES.length}</p>
                    <p className="text-sm text-[var(--text-secondary)]">Cursos disponibles</p>
                </div>
            </div>

            {/* Recommended */}
            {recommendedCourses.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-3">Recomendados para ti</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendedCourses
                            .filter(c => filteredCourses.some(fc => fc.id === c.id))
                            .map(course => (
                                <div
                                    key={course.id}
                                    className="glass-card p-5 hover:border-[var(--primary)] transition-all cursor-pointer group"
                                    onClick={() => handleStartCourse(course)}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="text-3xl">{course.icon}</span>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                                                {course.title}
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                {course.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                            <Clock className="w-4 h-4" />
                                            {course.duration}
                                        </div>
                                        <span
                                            className="text-xs font-medium px-2 py-1 rounded-full"
                                            style={{
                                                backgroundColor: `${getDifficultyColor(course.difficulty)}20`,
                                                color: getDifficultyColor(course.difficulty)
                                            }}
                                        >
                                            {getDifficultyLabel(course.difficulty)}
                                        </span>
                                    </div>
                                    {getCourseProgress(course.id) > 0 && (
                                        <div className="mt-3">
                                            <div className="progress-bar h-1">
                                                <div
                                                    className="progress-fill-success h-full"
                                                    style={{ width: `${getCourseProgress(course.id)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* All Courses */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Todos los cursos</h2>
                <div className="space-y-3">
                    {filteredCourses.map(course => {
                        const completed = isCourseCompleted(course.id);
                        const progressPct = getCourseProgress(course.id);

                        return (
                            <div
                                key={course.id}
                                className={`glass-card p-4 flex items-center gap-4 cursor-pointer transition-all hover:border-[var(--primary)] ${completed ? 'opacity-70' : ''
                                    }`}
                                onClick={() => handleStartCourse(course)}
                            >
                                <span className="text-2xl">{course.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium">{course.title}</h3>
                                        {completed && (
                                            <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                                        )}
                                    </div>
                                    <p className="text-sm text-[var(--text-muted)] truncate">
                                        {course.lessons.length} lecciones • {course.duration}
                                    </p>
                                    {progressPct > 0 && !completed && (
                                        <div className="mt-1 progress-bar h-1 w-24">
                                            <div
                                                className="progress-fill-warning h-full"
                                                style={{ width: `${progressPct}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                                <span
                                    className="text-xs font-medium px-2 py-1 rounded-full hidden sm:inline"
                                    style={{
                                        backgroundColor: `${getDifficultyColor(course.difficulty)}20`,
                                        color: getDifficultyColor(course.difficulty)
                                    }}
                                >
                                    {getDifficultyLabel(course.difficulty)}
                                </span>
                                {completed ? (
                                    <Award className="w-5 h-5 text-[var(--warning)]" />
                                ) : (
                                    <Play className="w-5 h-5 text-[var(--primary)]" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

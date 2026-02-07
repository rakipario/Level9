import { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, StopCircle, Upload, X, Languages, Check } from 'lucide-react';

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Common languages with their codes
const COMMON_LANGUAGES = [
    { code: '', label: 'Auto-detect' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'nl', label: 'Dutch' },
    { code: 'ru', label: 'Russian' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'ar', label: 'Arabic' },
    { code: 'hi', label: 'Hindi' },
    { code: 'tr', label: 'Turkish' },
    { code: 'pl', label: 'Polish' },
    { code: 'uk', label: 'Ukrainian' },
    { code: 'vi', label: 'Vietnamese' },
    { code: 'th', label: 'Thai' },
    { code: 'id', label: 'Indonesian' }
];

export default function VoiceRecorder({ onTranscription, onError, disabled }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [showLanguages, setShowLanguages] = useState(false);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorder.current && isRecording) {
                mediaRecorder.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Prefer webm for better compatibility with Whisper
            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/mp4';

            mediaRecorder.current = new MediaRecorder(stream, { mimeType });
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            mediaRecorder.current.onstop = () => {
                const blob = new Blob(audioChunks.current, { type: mimeType });
                setAudioBlob(blob);
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start(1000); // Collect data every second
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            onError?.('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const transcribeAudio = async () => {
        if (!audioBlob) return;

        setIsTranscribing(true);

        try {
            // First upload the audio file
            const formData = new FormData();
            const extension = audioBlob.type.includes('webm') ? 'webm' : 'mp4';
            formData.append('file', audioBlob, `recording.${extension}`);

            const token = localStorage.getItem('token');

            const uploadResponse = await fetch(`${API_URL}/upload/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload audio');
            }

            const uploadData = await uploadResponse.json();

            // Now transcribe
            const transcribeResponse = await fetch(`${API_URL}/upload/transcribe/${uploadData.file.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ language: selectedLanguage || undefined })
            });

            if (!transcribeResponse.ok) {
                const error = await transcribeResponse.json();
                throw new Error(error.error || 'Transcription failed');
            }

            const transcription = await transcribeResponse.json();
            onTranscription(transcription.result.text);

            // Reset state
            setAudioBlob(null);
            setRecordingTime(0);

        } catch (error: any) {
            console.error('Transcription error:', error);
            onError?.(error.message || 'Failed to transcribe audio');
        } finally {
            setIsTranscribing(false);
        }
    };

    const cancelRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative">
            {/* Main button */}
            {!isRecording && !audioBlob && (
                <button
                    onClick={startRecording}
                    disabled={disabled || isTranscribing}
                    className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    title="Start recording"
                >
                    <Mic className="w-5 h-5" />
                </button>
            )}

            {/* Recording state */}
            {isRecording && (
                <div className="flex items-center gap-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-600 dark:text-red-400 font-mono text-sm">
                            {formatTime(recordingTime)}
                        </span>
                    </div>
                    <button
                        onClick={stopRecording}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Stop recording"
                    >
                        <StopCircle className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Audio ready to transcribe */}
            {audioBlob && !isRecording && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    {/* Language selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLanguages(!showLanguages)}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Select language"
                        >
                            <Languages className="w-5 h-5" />
                        </button>

                        {showLanguages && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-48 max-h-60 overflow-y-auto z-50">
                                {COMMON_LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setSelectedLanguage(lang.code);
                                            setShowLanguages(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${selectedLanguage === lang.code
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {lang.label}
                                        {selectedLanguage === lang.code && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <span className="text-sm text-green-700 dark:text-green-300">
                        {formatTime(recordingTime)} recorded
                    </span>

                    <button
                        onClick={transcribeAudio}
                        disabled={isTranscribing}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                        title="Transcribe"
                    >
                        {isTranscribing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Upload className="w-5 h-5" />
                        )}
                    </button>

                    <button
                        onClick={cancelRecording}
                        disabled={isTranscribing}
                        className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Cancel"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Transcribing indicator */}
            {isTranscribing && (
                <div className="absolute -top-8 left-0 right-0 text-center">
                    <span className="text-sm text-gray-500 animate-pulse">
                        Transcribing with Whisper AI...
                    </span>
                </div>
            )}
        </div>
    );
}

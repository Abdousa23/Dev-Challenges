'use client';
import { useState, FormEvent, useRef, useEffect } from 'react';
import { CheckCircle, RefreshCw, AlertCircle, XCircle } from 'react-feather';

interface InteractionData {
    mouseMovements: { x: number; y: number; t: number }[];
    keystrokes: { key: string; t: number }[];
    timeStarted: number;
}

interface CaptchaProps {
    onVerify?: (isValid: boolean) => void;
    onRefresh?: () => void;
    apiUrl?: string;
}

export default function Captcha({
    onVerify,
    onRefresh,
    apiUrl = '/captcha'
}: CaptchaProps) {
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
    const [attempts, setAttempts] = useState(0);
    const [cooldown, setCooldown] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [captchaUrl, setCaptchaUrl] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Track focus
    const [inputFocused, setInputFocused] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const [interactionData, setInteractionData] = useState<InteractionData>({
        mouseMovements: [],
        keystrokes: [],
        timeStarted: Date.now(),
    });

    // Load captcha on mount
    useEffect(() => {
        loadCaptcha();
    }, []);

    const loadCaptcha = async () => {
        setStatus('loading');
        setInput('');
        setErrorMessage('');

        try {
            // Reset interaction data
            setInteractionData({
                mouseMovements: [],
                keystrokes: [],
                timeStarted: Date.now(),
            });

            // Fetch a new captcha
            const timestamp = new Date().getTime();
            const captchaImageUrl = `generate?t=${timestamp}`;
            console.log(`captchaImageUrl`)
            console.log(`${process.env.NEXT_PUBLIC_API_URL}captcha/${captchaImageUrl}`)
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}captcha/${captchaImageUrl}`, {
                method: 'GET',
                cache: 'no-store',
            });

            // if (!response.ok) {
            //     throw new Error('Failed to load captcha');
            // }
            console.log(response)

            const data = await response.json()

            // Create a blob URL for the image
            // const blob = await response.blob();
            // const imageUrl = URL.createObjectURL(blob);
            console.log(data)
            // const imageUrl = `data:image/png;base64,${Buffer.from(data.imageBuffer).toString("base64")}`;


            setCaptchaUrl(data.imageUrl);
            setSessionId(data.sessionId);
            setStatus('idle');

            // Focus the input
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);

        } catch (error) {
            console.error('Error loading captcha:', error);
            setErrorMessage('Could not load captcha. Please try again.');
            setStatus('error');
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (status !== 'idle') return;

        setInteractionData(prev => ({
            ...prev,
            mouseMovements: [
                ...prev.mouseMovements,
                {
                    x: e.clientX,
                    y: e.clientY,
                    t: Date.now()
                }
            ].slice(-50) // Keep only the last 50 movements to avoid memory issues
        }));
    };

    const handleKeyPress = (e: KeyboardEvent) => {
        if (status !== 'idle') return;

        setInteractionData(prev => ({
            ...prev,
            keystrokes: [
                ...prev.keystrokes,
                {
                    key: e.key,
                    t: Date.now()
                }
            ].slice(-20) // Keep only the last 20 keystrokes
        }));
    };

    const analyzeInteractionPatterns = (
        data: InteractionData,
        time: number
    ): boolean => {
        // Human verification criteria
        const MIN_TIME_MS = 1000; // 1.5 seconds minimum
        const MIN_MOUSE_MOVES = 3;
        const MAX_PERFECT_TIMING_MS = 10; // Less than 150ms between keystrokes is suspicious

        // Too fast to be human?
        if (time < MIN_TIME_MS) {
            console.log('Failed time check:', time);
            return false;
        }

        // Not enough mouse movement to be natural
        console.log(data.mouseMovements)
        if (data.mouseMovements.length < MIN_MOUSE_MOVES) {
            console.log('Failed mouse movement check:', data.mouseMovements.length);
            return false;
        }

        // Check for unnaturally consistent typing rhythm (bots often have perfect timing)
        if (data.keystrokes.length > 1) {
            const keyIntervals = data.keystrokes
                .map((k, i, arr) => i > 0 ? k.t - arr[i - 1].t : 0)
                .slice(1);

            // Perfect timing is suspicious
            const hasUniformTiming = keyIntervals.some(interval => interval < MAX_PERFECT_TIMING_MS);

            if (hasUniformTiming) {
                console.log('Failed key timing check');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (status === 'success' || cooldown || !input.trim()) return;

        setIsLoading(true);
        setStatus('loading');
        setErrorMessage('');

        try {
            // Calculate submission time
            const submissionTime = Date.now() - interactionData.timeStarted;

            // First check client-side patterns
            const isHumanBehavior = analyzeInteractionPatterns(interactionData, submissionTime);

            if (!isHumanBehavior) {
                // If behavior looks automated, add delay and then fail
                await new Promise(resolve => setTimeout(resolve, 1000));
                throw new Error('Suspicious behavior detected');
            }

            // Send to server
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}captcha/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, answer: input })
            });
            console.log(response)
            const data = await response.json();
            console.log(data)
            if (data.valid) {
                setStatus('success');
                onVerify?.(true);
            } else {
                throw new Error('Verification failed');
            }
        } catch (err: any) {
            console.log(err)
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setStatus('error');
            setErrorMessage(err.message === 'Suspicious behavior detected'
                ? 'Suspicious activity detected. Please try again.'
                : 'Verification failed. Please try again.');

            if (newAttempts >= 3) {
                setCooldown(true);
                setTimeout(() => {
                    setCooldown(false);
                    setAttempts(0);
                    loadCaptcha();
                    onRefresh?.();
                }, 30000);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        if (cooldown || status === 'loading') return;
        loadCaptcha();
        onRefresh?.();
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('keypress', handleKeyPress);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keypress', handleKeyPress);
        };
    }, [status]); // Re-apply listeners when status changes

    useEffect(() => {
        // Cleanup any blob URLs when component unmounts
        return () => {
            if (captchaUrl) {
                URL.revokeObjectURL(captchaUrl);
            }
        };
    }, [captchaUrl]);

    return (
        <div className={`captcha-container ${cooldown ? 'cooldown' : ''}`}>
            <div className="captcha-header">
                <h2>Verify You're Human</h2>
                <button
                    type="button"
                    onClick={handleRefresh}
                    className="refresh-button"
                    aria-label="Refresh CAPTCHA"
                    disabled={cooldown || status === 'loading'}
                >
                    <RefreshCw size={20} className={status === 'loading' ? 'spinning' : ''} />
                </button>
            </div>

            <div className="captcha-image-container">
                {status === 'loading' ? (
                    <div className="captcha-loading">
                        <span className="loading-spinner" />
                        <span>Loading captcha...</span>
                    </div>
                ) : captchaUrl ? (
                    <img
                        src={captchaUrl}
                        alt="CAPTCHA verification image"
                        className="captcha-image"
                        onError={(e) => {
                            console.error('Failed to load CAPTCHA image');
                            setErrorMessage('Image failed to load. Please refresh.');
                            e.currentTarget.style.display = 'none';
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                    />
                ) : (
                    <div className="captcha-error">
                        <XCircle size={32} />
                        <span>Could not load verification image</span>
                    </div>
                )}

                {status === 'success' && (
                    <div className="success-overlay">
                        <CheckCircle size={48} className="success-icon" />
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="captcha-form">
                <label htmlFor="captcha-input" className="captcha-label">
                    Enter the text shown in the image:
                </label>

                <div className={`input-container ${inputFocused ? 'focused' : ''}`}>
                    <input
                        id="captcha-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter characters"
                        ref={inputRef}
                        className="captcha-input"
                        disabled={isLoading || status === 'success' || cooldown || status === 'loading'}
                        aria-describedby="error-message attempts-counter"
                        autoComplete="off"
                        spellCheck="false"
                        maxLength={12}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                    />

                    {status === 'success' && (
                        <CheckCircle className="input-success-icon" size={20} />
                    )}
                </div>

                <div className="status-container">
                    {status === 'error' && (
                        <div className="error-message" role="alert">
                            <AlertCircle size={16} />
                            <span>
                                {cooldown
                                    ? 'Too many attempts. Please wait 30 seconds.'
                                    : errorMessage || 'Verification failed. Please try again.'}
                            </span>
                        </div>
                    )}

                    {cooldown && (
                        <div className="cooldown-timer">
                            <span>Next try available in 30 seconds</span>
                        </div>
                    )}

                    {attempts > 0 && status !== 'success' && !cooldown && (
                        <div className="attempts-counter">
                            Attempts: {attempts}/3
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className={`verify-button ${status === 'success' ? 'success' : ''}`}
                    disabled={isLoading || !input.trim() || status === 'success' || cooldown || status === 'loading'}
                >
                    {isLoading ? (
                        <span className="loading-spinner" />
                    ) : status === 'success' ? (
                        <>
                            <CheckCircle size={16} />
                            <span>Verified!</span>
                        </>
                    ) : (
                        'Verify'
                    )}
                </button>
            </form>
        </div>
    );
}
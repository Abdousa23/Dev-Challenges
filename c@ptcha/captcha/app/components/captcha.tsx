'use client';
import { useState, FormEvent, useRef, useEffect } from 'react';
import { CheckCircle, RefreshCw, AlertCircle } from 'react-feather';

interface CaptchaProps {
    sessionId: string;
    imageUrl: string;
    onVerify?: (isValid: boolean) => void;
    onRefresh?: () => void;
}

export default function Captcha({ sessionId, imageUrl, onVerify, onRefresh }: CaptchaProps) {
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [attempts, setAttempts] = useState(0);
    const [cooldown, setCooldown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [interactionData, setInteractionData] = useState<InteractionData>({
        mouseMovements: [],
        keystrokes: [],
        timeStarted: Date.now(),
    });

    const handleMouseMove = (e: MouseEvent) => {
        setInteractionData(prev => ({
            ...prev,
            mouseMovements: [...prev.mouseMovements, {
                x: e.clientX,
                y: e.clientY,
                t: Date.now()
            }]
        }));
    };

    const handleKeyPress = (e: KeyboardEvent) => {
        setInteractionData(prev => ({
            ...prev,
            keystrokes: [...prev.keystrokes, {
                key: e.key,
                t: Date.now()
            }]
        }));
    };

    const analyzeInteractionPatterns = (
        data: InteractionData,
        time: number
    ): boolean => {
        const MIN_TIME = 20;
        const MIN_MOUSE_MOVES = 10;
        const MAX_PERFECT_TIME = 10;
        if (time < MIN_TIME) return false;
        if (data.mouseMovements.length < MIN_MOUSE_MOVES) return false;

        const keyIntervals = data.keystrokes
            .map((k, i, arr) => i > 0 ? k.t - arr[i - 1].t : 0)
            .slice(1);

        console.log(keyIntervals.some(t => t < MAX_PERFECT_TIME))

        if (keyIntervals.some(t => t < MAX_PERFECT_TIME)) return false;

        return true;
    };


    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (status === 'success' || cooldown) return;

        setIsLoading(true);
        setStatus('idle');

        try {
            const isValid = await verifyCaptcha(sessionId, input);
            const submissionTime = Date.now() - interactionData.timeStarted;
            const isValidHuman = analyzeInteractionPatterns(interactionData, submissionTime);
            if (isValid && isValidHuman) {
                setStatus('success');
                onVerify?.(true);
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                setStatus('error');

                if (newAttempts >= 3) {
                    setCooldown(true);
                    setTimeout(() => {
                        setCooldown(false);
                        setAttempts(0);
                        onRefresh?.();
                    }, 30000);
                }
            }
        } catch (err) {
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };
    const handleRefresh = () => {
        if (cooldown) return;
        setInput('');
        setStatus('idle');
        setAttempts(0);
        onRefresh?.();
    };
    useEffect(() => {

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('keypress', handleKeyPress);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keypress', handleKeyPress);
        };
    })
    return (
        <div className={`captcha-container ${cooldown ? 'cooldown' : ''}`}>
            <div className="captcha-header">
                <h2>Verify You're Human</h2>
                <button
                    type="button"
                    onClick={handleRefresh}
                    className="refresh-button"
                    aria-label="Refresh CAPTCHA"
                    disabled={cooldown}
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="captcha-image-container">
                <img
                    src={imageUrl}
                    alt="CAPTCHA"
                    className="captcha-image"
                    onError={(e) => {
                        console.error('Failed to load CAPTCHA image');
                        e.currentTarget.style.display = 'none';
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                />
                {status === 'success' && (
                    <div className="success-overlay">
                        <CheckCircle size={48} className="success-icon" />
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="captcha-form">
                <label htmlFor="captcha-input" className="captcha-label">
                    Enter the text you see above:
                </label>

                <div className="input-container">
                    <input
                        id="captcha-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter CAPTCHA"
                        ref={inputRef}
                        className="captcha-input"
                        disabled={isLoading || status === 'success' || cooldown}
                        aria-describedby="error-message attempts-counter"
                        autoComplete="off"
                        spellCheck="false"
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
                                {attempts >= 3
                                    ? 'Too many attempts. Please wait 30 seconds.'
                                    : 'Verification failed. Please try again.'}
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
                    className="verify-button"
                    disabled={isLoading || !input.trim() || status === 'success' || cooldown}
                >
                    {isLoading ? (
                        <span className="loading-spinner" />
                    ) : status === 'success' ? (
                        'Verified!'
                    ) : (
                        'Verify'
                    )}
                </button>
            </form>
        </div>
    );
}

async function verifyCaptcha(sessionId: string, answer: string): Promise<boolean> {
    try {
        const res = await fetch('/api/verify-captcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, answer })
        });

        if (!res.ok) throw new Error('Verification failed');

        const data = await res.json();
        return data.valid;
    } catch (error) {
        throw new Error('Failed to verify CAPTCHA');
    }
}
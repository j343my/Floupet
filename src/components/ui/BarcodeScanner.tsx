"use client";

import { useEffect, useRef, useState } from "react";
import { BarcodeDetector, type BarcodeFormat } from "barcode-detector";

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (errorMessage: string) => void;
    debug?: boolean;
}

const FORMATS: BarcodeFormat[] = [
    "ean_13",
    "ean_8",
    "upc_a",
    "upc_e",
    "code_128",
    "code_39",
    "itf",
    "codabar",
    "qr_code",
];

export default function BarcodeScanner({ onScanSuccess, onScanFailure, debug = false }: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const detectorRef = useRef<BarcodeDetector | null>(null);
    const isRunningRef = useRef(false);
    const onScanSuccessRef = useRef(onScanSuccess);
    const onScanFailureRef = useRef(onScanFailure);

    const [isScanning, setIsScanning] = useState(false);
    const [hasCameras, setHasCameras] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<{ scanAttempts: number; cameraLabel: string }>({
        scanAttempts: 0,
        cameraLabel: "—",
    });

    // Keep callback refs up to date without restarting the loop
    useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);
    useEffect(() => { onScanFailureRef.current = onScanFailure; }, [onScanFailure]);

    useEffect(() => {
        navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
                const videoDevices = devices.filter((d) => d.kind === "videoinput");
                if (videoDevices.length > 0) {
                    setHasCameras(true);
                    if (debug) {
                        const labels = videoDevices.map((d) => d.label || `id:${d.deviceId.slice(0, 8)}`).join(", ");
                        setDebugInfo((prev) => ({ ...prev, cameraLabel: `[${labels}]` }));
                    }
                } else {
                    setHasCameras(false);
                    setError("Aucune caméra détéctée.");
                }
            })
            .catch(() => {
                setHasCameras(false);
                setError("Erreur d'accès à la caméra.");
            });

        return () => {
            stopScanning();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopScanning = () => {
        isRunningRef.current = false;
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
    };

    const scanLoop = async () => {
        if (!isRunningRef.current) return;

        const video = videoRef.current;
        const detector = detectorRef.current;

        if (video && detector && video.readyState >= video.HAVE_ENOUGH_DATA) {
            try {
                const barcodes = await detector.detect(video);
                if (barcodes.length > 0 && isRunningRef.current) {
                    const code = barcodes[0].rawValue;
                    stopScanning();
                    setScanResult(code);
                    if (navigator.vibrate) navigator.vibrate(100);
                    setTimeout(() => onScanSuccessRef.current(code), 600);
                    return;
                }
            } catch {
                if (debug) setDebugInfo((prev) => ({ ...prev, scanAttempts: prev.scanAttempts + 1 }));
                if (onScanFailureRef.current) onScanFailureRef.current("Erreur de détection");
            }
        }

        rafRef.current = requestAnimationFrame(scanLoop);
    };

    const startScanning = async () => {
        if (!hasCameras || isScanning) return;

        setError(null);
        setScanResult(null);
        setDebugInfo((prev) => ({ ...prev, scanAttempts: 0 }));

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            detectorRef.current = new BarcodeDetector({ formats: FORMATS });
            isRunningRef.current = true;
            setIsScanning(true);
            rafRef.current = requestAnimationFrame(scanLoop);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de démarrer le scanner");
            setIsScanning(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-full max-w-sm">
                <video
                    ref={videoRef}
                    muted
                    playsInline
                    className={`w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink object-cover shadow-[var(--shadow-md)] transition-all duration-300 ${
                        isScanning ? "opacity-100" : "h-0 opacity-0"
                    }`}
                />

                {isScanning && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between rounded-[var(--radius-lg)]">
                        <div className="mt-3 rounded-full bg-ink/60 px-4 py-1.5 backdrop-blur-sm">
                            <p className="text-center text-xs font-bold text-white">
                                Placez le code-barres dans le cadre
                            </p>
                        </div>

                        <div className="absolute inset-x-12 top-1/2 -translate-y-1/2">
                            <div className="h-0.5 animate-pulse rounded-full bg-coral shadow-[0_0_8px_var(--coral)]" />
                        </div>

                        <div className="mb-3 flex items-center gap-2 rounded-full bg-ink/60 px-3 py-1.5 backdrop-blur-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-coral" />
                            </span>
                            <span className="text-xs font-bold text-white">Scan en cours…</span>
                        </div>

                        {debug && (
                            <div className="pointer-events-none absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-left font-mono text-[10px] text-green-400">
                                <div>📷 BarcodeDetector API</div>
                                <div>🔄 tentatives: {debugInfo.scanAttempts}</div>
                                <div className="max-w-[160px] truncate">🎥 {debugInfo.cameraLabel}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {scanResult && !isScanning && (
                <div className="flex items-center gap-2 rounded-xl bg-teal-light px-4 py-2.5 text-teal-dark shadow-[var(--shadow-sm)] animate-in">
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-bold">Code détecté : {scanResult}</span>
                </div>
            )}

            {error && <p className="text-sm font-bold text-coral">{error}</p>}

            {!isScanning ? (
                <button
                    type="button"
                    onClick={startScanning}
                    disabled={hasCameras === false}
                    className="flex items-center gap-2 rounded-xl bg-coral px-6 py-3 font-bold text-white shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                >
                    <span className="text-xl">📷</span> Scanner un code-barres
                </button>
            ) : (
                <button
                    type="button"
                    onClick={stopScanning}
                    className="rounded-xl border-2 border-coral px-6 py-3 font-bold text-coral transition-colors hover:bg-coral-light active:scale-95"
                >
                    Annuler le scan
                </button>
            )}
        </div>
    );
}

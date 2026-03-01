"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (errorMessage: string) => void;
    debug?: boolean;
}

export default function BarcodeScanner({ onScanSuccess, onScanFailure, debug = false }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [hasCameras, setHasCameras] = useState<boolean | null>(null);
    const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
    const [error, setError] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<{
        scanAttempts: number;
        qrboxSize: { width: number; height: number } | null;
        cameraLabel: string;
    }>({ scanAttempts: 0, qrboxSize: null, cameraLabel: "—" });

    const clearScanner = () => {
        if (!scannerRef.current) return;

        try {
            scannerRef.current.clear();
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        Html5Qrcode.getCameras()
            .then((devices) => {
                if (devices && devices.length > 0) {
                    setCameras(devices);
                    setHasCameras(true);
                    if (debug) {
                        const labels = devices.map((d) => d.label || `id:${d.id}`).join(", ");
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
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
                clearScanner();
            }
        };
    }, [debug]);

    // Sélectionne la caméra arrière par ID pour éviter les problèmes de facingMode sur iOS
    const pickRearCamera = (): string | { facingMode: string } => {
        if (cameras.length === 0) return { facingMode: "environment" };
        const rear = cameras.find((c) => {
            const label = c.label.toLowerCase();
            return label.includes("arrière") || label.includes("back") || label.includes("rear") || label.includes("environment");
        }) ?? cameras.find((c) => {
            const label = c.label.toLowerCase();
            return !label.includes("avant") && !label.includes("front") && !label.includes("selfie") && !label.includes("facetime");
        }) ?? cameras[cameras.length - 1];
        return rear ? rear.id : { facingMode: "environment" };
    };

    const startScanning = async () => {
        if (!hasCameras || isScanning) return;

        setError(null);
        setScanResult(null);
        setDebugInfo((prev) => ({ ...prev, scanAttempts: 0 }));
        try {
            // useBarCodeDetectorIfSupported désactivé : l'API native BarcodeDetector
            // n'est pas supportée sur iOS Safari et cause l'échec silencieux du scan.
            scannerRef.current = new Html5Qrcode("reader", {
                verbose: false,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.ITF,
                    Html5QrcodeSupportedFormats.CODABAR,
                    Html5QrcodeSupportedFormats.QR_CODE,
                ],
            });

            const cameraIdOrConfig = pickRearCamera();

            await scannerRef.current.start(
                cameraIdOrConfig,
                {
                    fps: 10,
                    aspectRatio: 1.7777778,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const size = {
                            width: Math.floor(viewfinderWidth * 0.88),
                            height: Math.floor(viewfinderHeight * 0.40),
                        };
                        if (debug) setDebugInfo((prev) => ({ ...prev, qrboxSize: size }));
                        return size;
                    },
                },
                (decodedText) => {
                    if (scannerRef.current) {
                        scannerRef.current.stop().then(() => {
                            clearScanner();
                            setScanResult(decodedText);
                            setIsScanning(false);
                            if (navigator.vibrate) navigator.vibrate(100);
                            setTimeout(() => {
                                onScanSuccess(decodedText);
                            }, 600);
                        }).catch(console.error);
                    }
                },
                (errorMessage) => {
                    if (debug) {
                        setDebugInfo((prev) => ({ ...prev, scanAttempts: prev.scanAttempts + 1 }));
                    }
                    if (onScanFailure) onScanFailure(errorMessage);
                }
            );
            setIsScanning(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Impossible de démarrer le scanner");
            setIsScanning(false);
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                clearScanner();
                setIsScanning(false);
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-full max-w-sm">
                <div
                    id="reader"
                    className={`w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink shadow-[var(--shadow-md)] transition-all duration-300 ${
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
                                <div>📷 {typeof pickRearCamera() === "string" ? `id:${pickRearCamera()}` : "env (facingMode)"}</div>
                                <div>📐 {debugInfo.qrboxSize ? `${debugInfo.qrboxSize.width}×${debugInfo.qrboxSize.height}` : "—"}</div>
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
                    <span className="text-sm font-bold">Code d&eacute;tect&eacute; : {scanResult}</span>
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

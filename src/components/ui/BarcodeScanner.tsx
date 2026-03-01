"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (errorMessage: string) => void;
}

export default function BarcodeScanner({ onScanSuccess, onScanFailure }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [hasCameras, setHasCameras] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check for cameras on mount
        Html5Qrcode.getCameras()
            .then((devices) => {
                if (devices && devices.length > 0) {
                    setHasCameras(true);
                } else {
                    setHasCameras(false);
                    setError("Aucune caméra détéctée.");
                }
            })
            .catch((err) => {
                setHasCameras(false);
                setError("Erreur d'accès à la caméra.");
            });

        return () => {
            if (scannerRef.current && isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanning = async () => {
        if (!hasCameras) return;

        setError(null);
        try {
            scannerRef.current = new Html5Qrcode("reader");
            await scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                },
                (decodedText) => {
                    // Stop scanning once we have a result
                    if (scannerRef.current) {
                        scannerRef.current.stop().then(() => {
                            setIsScanning(false);
                            onScanSuccess(decodedText);
                        }).catch(console.error);
                    }
                },
                (errorMessage) => {
                    if (onScanFailure) onScanFailure(errorMessage);
                }
            );
            setIsScanning(true);
        } catch (err: any) {
            setError(err.message || "Impossible de démarrer le scanner");
            setIsScanning(false);
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div
                id="reader"
                className="w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)] bg-sand-light shadow-[var(--shadow-sm)]"
                style={{ display: isScanning ? 'block' : 'none' }}
            ></div>

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

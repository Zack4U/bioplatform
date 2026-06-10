"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Check, FileCode, FileText, FilePieChart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ManualModelUploadFormProps {
    isPending: boolean;
    onSubmit: (params: { weightsFile: File; configFile: File; metricsFile: File; notes: string }) => void;
}

export function ManualModelUploadForm({ isPending, onSubmit }: ManualModelUploadFormProps) {
    const [weightsFile, setWeightsFile] = useState<File | null>(null);
    const [configFile, setConfigFile] = useState<File | null>(null);
    const [metricsFile, setMetricsFile] = useState<File | null>(null);
    const [uploadNotes, setUploadNotes] = useState<string>("");

    const [isDragWeights, setIsDragWeights] = useState<boolean>(false);
    const [isDragConfig, setIsDragConfig] = useState<boolean>(false);
    const [isDragMetrics, setIsDragMetrics] = useState<boolean>(false);

    // Format file sizes helper
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleFileDrop = (e: React.DragEvent, type: "weights" | "config" | "metrics") => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        if (type === "weights") {
            setIsDragWeights(false);
            if (!file.name.endsWith(".pth") && !file.name.endsWith(".pt")) {
                toast.error("El archivo de pesos debe terminar en .pth o .pt");
                return;
            }
            setWeightsFile(file);
        } else if (type === "config") {
            setIsDragConfig(false);
            if (!file.name.endsWith(".json")) {
                toast.error("El archivo de configuración debe ser un JSON válido");
                return;
            }
            setConfigFile(file);
        } else if (type === "metrics") {
            setIsDragMetrics(false);
            if (!file.name.endsWith(".json")) {
                toast.error("El archivo de métricas de evaluación debe ser un JSON válido");
                return;
            }
            setMetricsFile(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "weights" | "config" | "metrics") => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === "weights") {
            if (!file.name.endsWith(".pth") && !file.name.endsWith(".pt")) {
                toast.error("El archivo de pesos debe terminar en .pth o .pt");
                return;
            }
            setWeightsFile(file);
        } else if (type === "config") {
            if (!file.name.endsWith(".json")) {
                toast.error("El archivo de configuración debe ser un JSON válido");
                return;
            }
            setConfigFile(file);
        } else if (type === "metrics") {
            if (!file.name.endsWith(".json")) {
                toast.error("El archivo de métricas de evaluación debe ser un JSON válido");
                return;
            }
            setMetricsFile(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!weightsFile || !configFile || !metricsFile) {
            toast.error("Por favor, proporciona los tres archivos obligatorios.");
            return;
        }

        onSubmit({
            weightsFile,
            configFile,
            metricsFile,
            notes: uploadNotes,
        });

        setWeightsFile(null);
        setConfigFile(null);
        setMetricsFile(null);
        setUploadNotes("");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    Subir Modelo e Integrar
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Envíe los resultados de su pipeline local directo al Registry Hub. Al terminar la subida, se guardará en DVC en S3 en background.
                </p>
            </div>

            {/* Three drag and drop boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Box 1: Weights */}
                <div className="flex flex-col space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block min-h-[16px]">
                        1. Pesos del Modelo (.pth, .pt)
                    </Label>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragWeights(true); }}
                        onDragLeave={() => setIsDragWeights(false)}
                        onDrop={(e) => handleFileDrop(e, "weights")}
                        className={`h-40 rounded-lg border border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-200 select-none ${
                            weightsFile
                                ? "border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 shadow-xs"
                                : isDragWeights
                                ? "border-primary bg-primary/10 scale-[0.98]"
                                : "border-muted-foreground/20 bg-muted/5 hover:border-muted-foreground/40 hover:bg-muted/10"
                        }`}
                        onClick={() => document.getElementById("weightsInput")?.click()}
                    >
                        <input
                            id="weightsInput"
                            type="file"
                            accept=".pth,.pt"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, "weights")}
                        />
                        {weightsFile ? (
                            <div className="space-y-2 w-full flex flex-col items-center justify-center">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-xs">
                                    <Check className="h-5 w-5" />
                                </div>
                                <div className="text-xs w-full text-center px-1">
                                    <p className="font-semibold text-emerald-500 truncate max-w-full" title={weightsFile.name}>
                                        {weightsFile.name}
                                    </p>
                                    <p className="text-muted-foreground font-mono mt-0.5 text-[10px]">{formatBytes(weightsFile.size)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 w-full flex flex-col items-center justify-center">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/75 border">
                                    <FileCode className="h-5 w-5" />
                                </div>
                                <div className="text-xs">
                                    <p className="text-muted-foreground font-medium">
                                        Arrastra o <span className="text-primary hover:underline">explora</span>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Archivo de pesos PyTorch</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Box 2: Configuration */}
                <div className="flex flex-col space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block min-h-[16px]">
                        2. Configuración (.json)
                    </Label>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragConfig(true); }}
                        onDragLeave={() => setIsDragConfig(false)}
                        onDrop={(e) => handleFileDrop(e, "config")}
                        className={`h-40 rounded-lg border border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-200 select-none ${
                            configFile
                                ? "border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 shadow-xs"
                                : isDragConfig
                                ? "border-primary bg-primary/10 scale-[0.98]"
                                : "border-muted-foreground/20 bg-muted/5 hover:border-muted-foreground/40 hover:bg-muted/10"
                        }`}
                        onClick={() => document.getElementById("configInput")?.click()}
                    >
                        <input
                            id="configInput"
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, "config")}
                        />
                        {configFile ? (
                            <div className="space-y-2 w-full flex flex-col items-center justify-center">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-xs">
                                    <Check className="h-5 w-5" />
                                </div>
                                <div className="text-xs w-full text-center px-1">
                                    <p className="font-semibold text-emerald-500 truncate max-w-full" title={configFile.name}>
                                        {configFile.name}
                                    </p>
                                    <p className="text-muted-foreground font-mono mt-0.5 text-[10px]">{formatBytes(configFile.size)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 w-full flex flex-col items-center justify-center">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/75 border">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="text-xs">
                                    <p className="text-muted-foreground font-medium">
                                        Arrastra o <span className="text-primary hover:underline">explora</span>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Parámetros (Batch size, LR, etc.)</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Box 3: Metrics */}
                <div className="flex flex-col space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block min-h-[16px]">
                        3. Métricas (.json)
                    </Label>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragMetrics(true); }}
                        onDragLeave={() => setIsDragMetrics(false)}
                        onDrop={(e) => handleFileDrop(e, "metrics")}
                        className={`h-40 rounded-lg border border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-200 select-none ${
                            metricsFile
                                ? "border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 shadow-xs"
                                : isDragMetrics
                                ? "border-primary bg-primary/10 scale-[0.98]"
                                : "border-muted-foreground/20 bg-muted/5 hover:border-muted-foreground/40 hover:bg-muted/10"
                        }`}
                        onClick={() => document.getElementById("metricsInput")?.click()}
                    >
                        <input
                            id="metricsInput"
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, "metrics")}
                        />
                        {metricsFile ? (
                            <div className="space-y-2 w-full flex flex-col items-center justify-center">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-xs">
                                    <Check className="h-5 w-5" />
                                </div>
                                <div className="text-xs w-full text-center px-1">
                                    <p className="font-semibold text-emerald-500 truncate max-w-full" title={metricsFile.name}>
                                        {metricsFile.name}
                                    </p>
                                    <p className="text-muted-foreground font-mono mt-0.5 text-[10px]">{formatBytes(metricsFile.size)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 w-full flex flex-col items-center justify-center">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/75 border">
                                    <FilePieChart className="h-5 w-5" />
                                </div>
                                <div className="text-xs">
                                    <p className="text-muted-foreground font-medium">
                                        Arrastra o <span className="text-primary hover:underline">explora</span>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Precisión, Pérdida y F1-Score</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Comments Textarea */}
            <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Notas de la Versión
                </Label>
                <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Describa el dataset utilizado, cambios de arquitectura en la cabeza del clasificador, época o alguna nota técnica..."
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="bg-background border-input focus:ring-ring"
                />
            </div>

            {/* Submit button and upload details */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                    {weightsFile && configFile && metricsFile ? (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <Check className="h-4 w-4" />
                            Archivos correctos listos para subir.
                        </span>
                    ) : (
                        <span>* Los tres archivos son de carácter obligatorio para el versionamiento.</span>
                    )}
                </div>
                <Button
                    type="submit"
                    disabled={!weightsFile || !configFile || !metricsFile || isPending}
                    className="w-full sm:w-auto"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Subiendo archivos a Registry Hub (DVC)...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            Subir Modelo e Integrar
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}

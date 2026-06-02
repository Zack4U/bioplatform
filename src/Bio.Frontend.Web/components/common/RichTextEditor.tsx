"use client";

/**
 * RichTextEditor — WYSIWYG contentEditable editor.
 *
 * Renders formatted output while editing (not raw HTML).
 * All logic lives in useRichTextEditor.ts; this file is UI only.
 *
 * Toolbar icons (Lucide): Bold, Italic, Underline, Strikethrough,
 * AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link, Image,
 * Undo, Redo.
 *
 * Keyboard shortcuts: Ctrl+B / Ctrl+I / Ctrl+U.
 * Shift+Enter → <br>. Enter → new block (browser default).
 * Ctrl+V with image in clipboard → uploads via onImageUpload and inserts <img>.
 *
 * WCAG 2.1 AA:
 *  - All toolbar buttons have aria-label and aria-pressed.
 *  - contentEditable has role="textbox" aria-multiline="true".
 *  - isUploading state is announced via aria-live.
 *  - Focus ring visible on all interactive elements.
 *
 * Usage:
 *   <RichTextEditor
 *     value={html}
 *     onChange={setHtml}
 *     placeholder="Escribe una descripción..."
 *     onImageUpload={uploadImageToServer}
 *   />
 */

import { useRichTextEditor } from "@/hooks/features/useRichTextEditor";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Loader2,
    Redo,
    Strikethrough,
    Underline,
    Undo,
} from "lucide-react";
import {
    useRef,
    useState,
    type ChangeEvent,
    type KeyboardEvent as ReactKeyboardEvent,
} from "react";

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface RichTextEditorProps {
    /** Controlled HTML string value. */
    value: string;
    /** Called with the updated HTML on every change. */
    onChange: (html: string) => void;
    /** Placeholder text shown when the editor is empty. */
    placeholder?: string;
    /** Extra Tailwind classes on the outermost wrapper. */
    className?: string;
    /** Disables all editing and toolbar interactions. */
    disabled?: boolean;
    /**
     * Called when the user pastes or picks an image.
     * Should upload the file and return its public URL.
     */
    onImageUpload?: (file: File) => Promise<string>;
    /**
     * CSS value for the editor's maximum height before it starts scrolling.
     * @default "400px"
     */
    maxHeight?: string;
    /**
     * CSS value or number (in px) for the editor's minimum height.
     * @default "120px"
     */
    minHeight?: string | number;
}

/* ─── Small internal types ───────────────────────────────────────────────── */

interface ToolbarButtonProps {
    label: string;
    isActive?: boolean;
    isDisabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

/* ─── ToolbarButton ──────────────────────────────────────────────────────── */

function ToolbarButton({
    label,
    isActive = false,
    isDisabled = false,
    onClick,
    children,
}: ToolbarButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={label}
                    aria-pressed={isActive}
                    disabled={isDisabled}
                    onClick={onClick}
                    className={cn(
                        "h-8 w-8 shrink-0",
                        isActive &&
                            "bg-accent text-accent-foreground",
                    )}
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                <span>{label}</span>
            </TooltipContent>
        </Tooltip>
    );
}

/* ─── ToolbarSeparator ───────────────────────────────────────────────────── */

function ToolbarSeparator() {
    return (
        <Separator orientation="vertical" className="mx-0.5 h-5 self-center" />
    );
}

/* ─── RichTextEditor ─────────────────────────────────────────────────────── */

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Escribe aquí...",
    className,
    disabled = false,
    onImageUpload,
    maxHeight = "400px",
    minHeight = "120px",
}: RichTextEditorProps) {
    /* ── Hook ──────────────────────────────────────────────────────────── */

    const {
        editorRef,
        isFocused,
        activeFormats,
        isUploading,
        handleKeyDown,
        handlePaste,
        handleInput,
        handleFocus,
        execFormat,
        insertLink,
        handleFileSelect,
    } = useRichTextEditor({ value, onChange, onImageUpload, disabled });

    /* ── Link popover state (UI only) ────────────────────────────────── */

    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const linkInputRef = useRef<HTMLInputElement>(null);

    const handleInsertLink = () => {
        insertLink(linkUrl);
        setLinkUrl("");
        setLinkOpen(false);
    };

    const handleLinkKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleInsertLink();
        }
        if (e.key === "Escape") {
            setLinkOpen(false);
        }
    };

    /* ── File input ref (UI only — logic in hook) ────────────────────── */

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        void handleFileSelect(e.target.files);
        // Reset so picking the same file again triggers the event.
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    /* ── Derived helpers ─────────────────────────────────────────────── */

    const isFormatActive = (cmd: string) => activeFormats.has(cmd);

    /* ── Render ──────────────────────────────────────────────────────── */

    return (
        <TooltipProvider>
            <div
                className={cn(
                    "rounded-md border border-input bg-background shadow-xs transition-[box-shadow,border-color]",
                    isFocused &&
                        "border-ring ring-ring/50 ring-[3px]",
                    disabled && "pointer-events-none opacity-50",
                    className,
                )}
            >
                {/* ── Toolbar ─────────────────────────────────────────── */}
                <div
                    role="toolbar"
                    aria-label="Barra de herramientas del editor"
                    aria-controls="rich-editor-content"
                    className="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5"
                >
                    {/* Text formatting */}
                    <ToolbarButton
                        label="Negrita (Ctrl+B)"
                        isActive={isFormatActive("bold")}
                        isDisabled={disabled}
                        onClick={() => execFormat("bold")}
                    >
                        <Bold className="h-4 w-4" aria-hidden="true" />
                    </ToolbarButton>

                    <ToolbarButton
                        label="Cursiva (Ctrl+I)"
                        isActive={isFormatActive("italic")}
                        isDisabled={disabled}
                        onClick={() => execFormat("italic")}
                    >
                        <Italic className="h-4 w-4" aria-hidden="true" />
                    </ToolbarButton>

                    <ToolbarButton
                        label="Subrayado (Ctrl+U)"
                        isActive={isFormatActive("underline")}
                        isDisabled={disabled}
                        onClick={() => execFormat("underline")}
                    >
                        <Underline className="h-4 w-4" aria-hidden="true" />
                    </ToolbarButton>

                    <ToolbarButton
                        label="Tachado"
                        isActive={isFormatActive("strikeThrough")}
                        isDisabled={disabled}
                        onClick={() => execFormat("strikeThrough")}
                    >
                        <Strikethrough
                            className="h-4 w-4"
                            aria-hidden="true"
                        />
                    </ToolbarButton>

                    <ToolbarSeparator />

                    {/* Alignment */}
                    <ToolbarButton
                        label="Alinear a la izquierda"
                        isActive={isFormatActive("justifyLeft")}
                        isDisabled={disabled}
                        onClick={() => execFormat("justifyLeft")}
                    >
                        <AlignLeft className="h-4 w-4" aria-hidden="true" />
                    </ToolbarButton>

                    <ToolbarButton
                        label="Centrar"
                        isActive={isFormatActive("justifyCenter")}
                        isDisabled={disabled}
                        onClick={() => execFormat("justifyCenter")}
                    >
                        <AlignCenter className="h-4 w-4" aria-hidden="true" />
                    </ToolbarButton>

                    <ToolbarButton
                        label="Alinear a la derecha"
                        isActive={isFormatActive("justifyRight")}
                        isDisabled={disabled}
                        onClick={() => execFormat("justifyRight")}
                    >
                        <AlignRight className="h-4 w-4" aria-hidden="true" />
                    </ToolbarButton>

                    <ToolbarSeparator />

                    {/* Lists */}
                    <ToolbarButton
                        label="Lista sin orden"
                        isActive={isFormatActive("insertUnorderedList")}
                        isDisabled={disabled}
                        onClick={() => execFormat("insertUnorderedList")}
                    >
                        <List className="h-4 w-4" aria-hidden="true" />
                    </ToolbarButton>

                    <ToolbarButton
                        label="Lista numerada"
                        isActive={isFormatActive("insertOrderedList")}
                        isDisabled={disabled}
                        onClick={() => execFormat("insertOrderedList")}
                    >
                        <ListOrdered className="h-4 w-4" aria-hidden="true" />
                    </ToolbarButton>

                    <ToolbarSeparator />

                    {/* Link — Shadcn Popover */}
                    <Popover
                        open={linkOpen}
                        onOpenChange={(open) => {
                            setLinkOpen(open);
                            if (open) {
                                setLinkUrl("");
                                // Focus the input after the popover opens.
                                setTimeout(
                                    () => linkInputRef.current?.focus(),
                                    50,
                                );
                            }
                        }}
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Insertar enlace"
                                        disabled={disabled}
                                        className="h-8 w-8 shrink-0"
                                    >
                                        <LinkIcon
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <span>Insertar enlace</span>
                            </TooltipContent>
                        </Tooltip>

                        <PopoverContent
                            className="w-72 p-3"
                            align="start"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                            <p className="mb-2 text-sm font-medium text-foreground">
                                Insertar enlace
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    ref={linkInputRef}
                                    type="url"
                                    placeholder="https://ejemplo.com"
                                    value={linkUrl}
                                    onChange={(e) =>
                                        setLinkUrl(e.target.value)
                                    }
                                    onKeyDown={handleLinkKeyDown}
                                    aria-label="URL del enlace"
                                    className="h-8 text-sm"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleInsertLink}
                                    disabled={!linkUrl.trim()}
                                    className="h-8 shrink-0"
                                >
                                    Insertar
                                </Button>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                Selecciona texto primero para convertirlo en enlace.
                            </p>
                        </PopoverContent>
                    </Popover>

                    {/* Image */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Insertar imagen"
                                disabled={disabled || isUploading || !onImageUpload}
                                onClick={handleImageButtonClick}
                                className="h-8 w-8 shrink-0"
                            >
                                {isUploading ? (
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <ImageIcon
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <span>
                                {!onImageUpload
                                    ? "Carga de imagen no configurada"
                                    : isUploading
                                      ? "Subiendo imagen..."
                                      : "Insertar imagen"}
                            </span>
                        </TooltipContent>
                    </Tooltip>

                    {/* Hidden file input — triggered by the image button */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        aria-hidden="true"
                        tabIndex={-1}
                        className="sr-only"
                        onChange={handleFileInputChange}
                    />

                    <ToolbarSeparator />

                    {/* Undo / Redo */}
                    <ToolbarButton
                        label="Deshacer (Ctrl+Z)"
                        isDisabled={disabled}
                        onClick={() => execFormat("undo")}
                    >
                        <Undo className="h-4 w-4" aria-hidden="true" />
                    </ToolbarButton>

                    <ToolbarButton
                        label="Rehacer (Ctrl+Y)"
                        isDisabled={disabled}
                        onClick={() => execFormat("redo")}
                    >
                        <Redo className="h-4 w-4" aria-hidden="true" />
                    </ToolbarButton>
                </div>

                {/* ── Upload status (aria-live region) ─────────────────── */}
                {isUploading && (
                    <div
                        role="status"
                        aria-live="polite"
                        aria-label="Subiendo imagen, por favor espera"
                        className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-xs text-muted-foreground"
                    >
                        <Loader2
                            className="h-3 w-3 animate-spin"
                            aria-hidden="true"
                        />
                        Subiendo imagen...
                    </div>
                )}

                {/* ── Editor area ──────────────────────────────────────── */}
                <div className="relative">
                    {/* Placeholder — visible only when editor is empty and not focused */}
                    {!value && !isFocused && (
                        <p
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-3 text-sm text-muted-foreground select-none"
                        >
                            {placeholder}
                        </p>
                    )}

                    <div
                        id="rich-editor-content"
                        ref={editorRef}
                        role="textbox"
                        aria-multiline="true"
                        aria-label="Editor de texto"
                        aria-disabled={disabled}
                        aria-readonly={disabled}
                        contentEditable={!disabled}
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onFocus={handleFocus}
                        style={{
                            maxHeight,
                            minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
                        }}
                        className={cn(
                            // Layout
                            "min-h-[120px] w-full overflow-y-auto px-3 py-3 text-sm text-foreground",
                            // Focus ring is on the outer wrapper, not here.
                            "outline-none",
                            // Images inside the editor should be responsive.
                            "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded",
                            // Links in editor
                            "[&_a]:text-primary [&_a]:underline",
                            // Lists
                            "[&_ul]:ml-5 [&_ul]:list-disc",
                            "[&_ol]:ml-5 [&_ol]:list-decimal",
                            // Blockquote
                            "[&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
                            // Code
                            "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs",
                            "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs",
                        )}
                    />
                </div>
            </div>
        </TooltipProvider>
    );
}

"use client";

/**
 * useRichTextEditor — all logic for the RichTextEditor component.
 *
 * Responsibilities:
 *  - Tracks focus state and active formatting marks.
 *  - Keyboard shortcuts (Ctrl+B/I/U) and Enter / Shift+Enter behaviour.
 *  - Clipboard image paste → calls onImageUpload → inserts <img> at cursor.
 *  - File-picker image selection (toolbar button).
 *  - execCommand wrappers: execFormat, insertLink, insertImage.
 *  - Syncs an externally-provided value into the editor when not focused.
 *  - Exposes isUploading state for the component to show a loading indicator.
 */

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type KeyboardEvent,
    type ClipboardEvent,
    type RefObject,
} from "react";

/* ─── Public contract ────────────────────────────────────────────────────── */

export interface UseRichTextEditorOptions {
    value: string;
    onChange: (html: string) => void;
    onImageUpload?: (file: File) => Promise<string>;
    disabled?: boolean;
}

export interface UseRichTextEditorReturn {
    /** Ref attached to the contentEditable div. */
    editorRef: RefObject<HTMLDivElement | null>;
    /** Whether the editor currently has focus. */
    isFocused: boolean;
    /**
     * Set of currently active format commands (e.g. "bold", "italic").
     * Updated on every selectionchange event so the toolbar can highlight
     * the active buttons.
     */
    activeFormats: Set<string>;
    /** Whether an image upload is in progress. */
    isUploading: boolean;
    /** Handle keydown events on the contentEditable div. */
    handleKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
    /** Handle paste events to intercept clipboard images. */
    handlePaste: (e: ClipboardEvent<HTMLDivElement>) => void;
    /** Handle input events to emit the current HTML. */
    handleInput: () => void;
    /** Handle focus events. */
    handleFocus: () => void;
    /** Handle blur events. */
    handleBlur: () => void;
    /** Execute a document.execCommand formatting command. */
    execFormat: (command: string, value?: string) => void;
    /** Insert an anchor element at the current cursor position. */
    insertLink: (url: string) => void;
    /** Insert an img element at the current cursor position. */
    insertImage: (url: string) => void;
    /**
     * Triggered when the user selects a file from the toolbar image picker.
     * Uploads via onImageUpload and inserts the returned URL.
     */
    handleFileSelect: (files: FileList | null) => Promise<void>;
    /**
     * Sync an external value into the editor.
     * Only executed when the editor is NOT focused to avoid fighting the user.
     */
    syncValue: (html: string) => void;
}

/* ─── Tracked format commands for toolbar highlighting ──────────────────── */

const FORMAT_COMMANDS = [
    "bold",
    "italic",
    "underline",
    "strikeThrough",
    "insertUnorderedList",
    "insertOrderedList",
    "justifyLeft",
    "justifyCenter",
    "justifyRight",
] as const;

/* ─── Hook ───────────────────────────────────────────────────────────────── */

export function useRichTextEditor({
    value,
    onChange,
    onImageUpload,
    disabled = false,
}: UseRichTextEditorOptions): UseRichTextEditorReturn {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const isFocusedRef = useRef(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

    /* ── Helpers ─────────────────────────────────────────────────────────── */

    /**
     * Read which format commands are currently active at the caret position
     * and update the activeFormats state.
     */
    const updateActiveFormats = useCallback(() => {
        const active = new Set<string>();
        for (const cmd of FORMAT_COMMANDS) {
            try {
                if (document.queryCommandState(cmd)) {
                    active.add(cmd);
                }
            } catch {
                // queryCommandState throws in some environments; ignore safely.
            }
        }
        setActiveFormats(active);
    }, []);

    /* ── selectionchange listener (mounted once) ─────────────────────────── */

    useEffect(() => {
        const handleSelectionChange = () => {
            if (isFocusedRef.current) {
                updateActiveFormats();
            }
        };

        document.addEventListener("selectionchange", handleSelectionChange);
        return () => {
            document.removeEventListener(
                "selectionchange",
                handleSelectionChange,
            );
        };
    }, [updateActiveFormats]);

    /* ── Sync external value → editor when not focused ───────────────────── */

    const syncValue = useCallback((html: string) => {
        const el = editorRef.current;
        if (!el || isFocusedRef.current) return;
        if (el.innerHTML !== html) {
            el.innerHTML = html;
        }
    }, []);

    useEffect(() => {
        syncValue(value);
    }, [value, syncValue]);

    /* ── Focus / blur ─────────────────────────────────────────────────────── */

    const handleFocus = useCallback(() => {
        isFocusedRef.current = true;
        setIsFocused(true);
        updateActiveFormats();
    }, [updateActiveFormats]);

    const handleBlur = useCallback(() => {
        isFocusedRef.current = false;
        setIsFocused(false);
        setActiveFormats(new Set());
    }, []);

    /* ── Emit current HTML to parent ─────────────────────────────────────── */

    const handleInput = useCallback(() => {
        const el = editorRef.current;
        if (!el) return;
        onChange(el.innerHTML);
    }, [onChange]);

    /* ── execCommand wrapper ─────────────────────────────────────────────── */

    const execFormat = useCallback(
        (command: string, value?: string) => {
            if (disabled) return;
            // Restore focus to editor so execCommand works correctly.
            editorRef.current?.focus();
            try {
                document.execCommand(command, false, value ?? undefined);
            } catch {
                // execCommand is deprecated but still widely supported; ignore errors.
            }
            handleInput();
            updateActiveFormats();
        },
        [disabled, handleInput, updateActiveFormats],
    );

    /* ── Insert link ─────────────────────────────────────────────────────── */

    const insertLink = useCallback(
        (url: string) => {
            if (!url.trim()) return;
            const sanitizedUrl = url.startsWith("http")
                ? url
                : `https://${url}`;
            execFormat("createLink", sanitizedUrl);
            // Make the link open in a new tab. After execCommand, find newly
            // created anchors without a target and add the attribute.
            const el = editorRef.current;
            if (!el) return;
            el.querySelectorAll<HTMLAnchorElement>("a:not([target])").forEach(
                (a) => {
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                },
            );
            handleInput();
        },
        [execFormat, handleInput],
    );

    /* ── Insert image at cursor ──────────────────────────────────────────── */

    const insertImage = useCallback(
        (url: string) => {
            if (!url.trim()) return;
            editorRef.current?.focus();
            const img = `<img src="${url}" alt="" style="max-width:100%;height:auto;display:block;" />`;
            try {
                document.execCommand("insertHTML", false, img);
            } catch {
                // Fallback for browsers where insertHTML is limited.
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) return;
                const range = sel.getRangeAt(0);
                range.collapse(false);
                const fragment = range.createContextualFragment(img);
                range.insertNode(fragment);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            handleInput();
        },
        [handleInput],
    );

    /* ── File picker (toolbar image button) ─────────────────────────────── */

    const handleFileSelect = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0 || !onImageUpload) return;
            const file = files[0];
            if (!file.type.startsWith("image/")) return;
            setIsUploading(true);
            try {
                const url = await onImageUpload(file);
                insertImage(url);
            } finally {
                setIsUploading(false);
            }
        },
        [onImageUpload, insertImage],
    );

    /* ── Keyboard shortcuts ──────────────────────────────────────────────── */

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            const isMac = navigator.platform.toUpperCase().includes("MAC");
            const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

            if (ctrlOrCmd) {
                switch (e.key.toLowerCase()) {
                    case "b":
                        e.preventDefault();
                        execFormat("bold");
                        return;
                    case "i":
                        e.preventDefault();
                        execFormat("italic");
                        return;
                    case "u":
                        e.preventDefault();
                        execFormat("underline");
                        return;
                    default:
                        break;
                }
            }

            // Enter key behaviour:
            // - Shift+Enter → insert a <br>
            // - Enter alone → browser default (inserts <p> or <div>); we keep
            //   that behaviour because it's the most natural for a rich editor.
            if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                try {
                    document.execCommand("insertLineBreak", false, undefined);
                } catch {
                    // Some browsers don't support insertLineBreak
                    document.execCommand("insertHTML", false, "<br>");
                }
                handleInput();
            }
        },
        [execFormat, handleInput],
    );

    /* ── Paste (intercept clipboard images) ─────────────────────────────── */

    const handlePaste = useCallback(
        (e: ClipboardEvent<HTMLDivElement>) => {
            if (!onImageUpload) return;

            const items = Array.from(e.clipboardData?.items ?? []);
            const imageItem = items.find((item) =>
                item.type.startsWith("image/"),
            );

            if (!imageItem) return;

            // We found an image → prevent the default paste and upload it.
            e.preventDefault();
            const file = imageItem.getAsFile();
            if (!file) return;

            setIsUploading(true);
            onImageUpload(file)
                .then((url) => {
                    insertImage(url);
                })
                .catch(() => {
                    // Silently fail; the caller can show a toast via their own
                    // error boundary or onImageUpload rejection handler.
                })
                .finally(() => {
                    setIsUploading(false);
                });
        },
        [onImageUpload, insertImage],
    );

    /* ── Return ──────────────────────────────────────────────────────────── */

    return {
        editorRef,
        isFocused,
        activeFormats,
        isUploading,
        handleKeyDown,
        handlePaste,
        handleInput,
        handleFocus,
        handleBlur,
        execFormat,
        insertLink,
        insertImage,
        handleFileSelect,
        syncValue,
    };
}

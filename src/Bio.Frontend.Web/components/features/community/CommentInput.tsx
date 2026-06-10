"use client";

/**
 * CommentInput — sticky comment input at the bottom of the comments panel.
 * UI-only.
 *
 * @module components/features/community/CommentInput
 */

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState, useRef } from "react";

interface CommentInputProps {
    onSubmit: (content: string) => void;
    isPending?: boolean;
    placeholder?: string;
}

export function CommentInput({
    onSubmit,
    isPending,
    placeholder = "Escribe un comentario...",
}: CommentInputProps) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    function handleSubmit() {
        const trimmed = value.trim();
        if (!trimmed || isPending) return;
        onSubmit(trimmed);
        setValue("");
        textareaRef.current?.focus();
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    return (
        <div className="flex items-end gap-2 border-t bg-background p-3">
            <Textarea
                ref={textareaRef}
                id="comment-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                className="resize-none min-h-[40px] max-h-[120px] flex-1 text-sm"
                aria-label="Escribe un comentario"
                disabled={isPending}
            />
            <Button
                id="comment-submit-btn"
                size="icon"
                onClick={handleSubmit}
                disabled={!value.trim() || isPending}
                aria-label="Enviar comentario"
                className="shrink-0"
            >
                <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
        </div>
    );
}

"use client";

/**
 * MessageInput — chat message input with send button.
 * UI-only.
 *
 * @module components/features/community/MessageInput
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useState } from "react";

interface MessageInputProps {
    onSend: (content: string) => void;
    isPending?: boolean;
    placeholder?: string;
}

export function MessageInput({ onSend, isPending, placeholder = "Escribe un mensaje..." }: MessageInputProps) {
    const [value, setValue] = useState("");

    function handleSend() {
        const trimmed = value.trim();
        if (!trimmed || isPending) return;
        onSend(trimmed);
        setValue("");
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="flex items-center gap-2 p-2 border-t">
            <Input
                id="message-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 text-sm h-8"
                disabled={isPending}
                aria-label="Escribe un mensaje"
            />
            <Button
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleSend}
                disabled={!value.trim() || isPending}
                aria-label="Enviar mensaje"
            >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
        </div>
    );
}

"use client";

/**
 * ChatInterface — A premium, responsive chat UI for the AI Advisor.
 * Features:
 * - Scrollable message history
 * - Loading states with "typing" indicator
 * - Suggested questions for empty state
 * - Clean, modern aesthetics with glassmorphism and green accents
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdvisor } from "@/hooks/features/advisor/useAdvisor";
import { cn } from "@/lib/utils";
import { 
    Bot, 
    Eraser, 
    Leaf, 
    Loader2, 
    MessageSquare, 
    Send, 
    Sparkles, 
    User 
} from "lucide-react";
import { useState, KeyboardEvent } from "react";

const SUGGESTED_QUESTIONS = [
    "¿Cómo puedo certificar mi producto de biocomercio?",
    "¿Qué especies de flora son comunes en Caldas?",
    "¿Cómo crear un plan de negocio sostenible?",
    "¿Qué es el Protocolo de Nagoya?"
];

export function ChatInterface() {
    const { messages, sendMessage, isLoading, clearChat, scrollRef } = useAdvisor();
    const [inputValue, setInputValue] = useState("");

    const handleSend = () => {
        if (!inputValue.trim() || isLoading) return;
        sendMessage(inputValue);
        setInputValue("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    return (
        <Card className="flex h-[75vh] flex-col overflow-hidden border-none bg-background/50 shadow-2xl backdrop-blur-sm ring-1 ring-border sm:h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                        <Bot className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Asesor BioCommerce</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="flex h-2 w-2 rounded-full bg-success" />
                            <span className="text-xs text-muted-foreground">En línea — RAG Potenciado</span>
                        </div>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearChat}
                    title="Limpiar conversación"
                    className="text-muted-foreground hover:text-destructive"
                >
                    <Eraser className="h-5 w-5" />
                </Button>
            </div>

            {/* Messages Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 py-8 space-y-6"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                            <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <div className="max-w-md space-y-2">
                            <h3 className="text-xl font-semibold">¡Hola! Soy tu Asesor de Biocomercio</h3>
                            <p className="text-sm text-muted-foreground">
                                Puedo ayudarte con información técnica sobre especies de Caldas, 
                                normativa legal, planes de negocio y estrategias de comercialización sostenible.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 w-full max-w-2xl sm:grid-cols-2">
                            {SUGGESTED_QUESTIONS.map((q) => (
                                <Button
                                    key={q}
                                    variant="outline"
                                    className="h-auto py-3 px-4 justify-start text-left text-sm font-normal whitespace-normal hover:border-primary/50 hover:bg-primary/5 transition-all"
                                    onClick={() => sendMessage(q)}
                                >
                                    <MessageSquare className="mr-2 h-4 w-4 shrink-0 text-primary/70" />
                                    <span>{q}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={cn(
                                "flex gap-4 max-w-[85%] animate-in fade-in duration-300",
                                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            <Avatar className={cn(
                                "h-9 w-9 shrink-0 ring-1",
                                msg.role === "user" ? "bg-muted ring-border" : "bg-primary/10 ring-primary/20"
                            )}>
                                <AvatarFallback>
                                    {msg.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5 text-primary" />}
                                </AvatarFallback>
                            </Avatar>
                            
                            <div className={cn(
                                "flex flex-col gap-1",
                                msg.role === "user" ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                                    msg.role === "user" 
                                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                                        : "bg-muted/50 border rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-muted-foreground px-1">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex gap-4 mr-auto animate-in fade-in">
                        <Avatar className="h-9 w-9 bg-primary/10 ring-1 ring-primary/20">
                            <AvatarFallback>
                                <Bot className="h-5 w-5 text-primary" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted/50 border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                            <div className="flex gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" />
                                <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 pt-2 bg-gradient-to-t from-background to-transparent">
                <div className="relative flex items-center gap-2 rounded-xl border bg-background px-4 py-2 shadow-lg focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                    <Input 
                        placeholder="Escribe tu consulta aquí..." 
                        className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-10"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <div className="flex items-center gap-1">
                        <Button 
                            size="icon" 
                            className="h-8 w-8 rounded-lg shrink-0" 
                            disabled={!inputValue.trim() || isLoading}
                            onClick={handleSend}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <p className="mt-2 text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                    <Leaf className="h-3 w-3 text-primary/50" />
                    Potenciado por IA generativa para el biocomercio sostenible en Caldas.
                </p>
            </div>
        </Card>
    );
}

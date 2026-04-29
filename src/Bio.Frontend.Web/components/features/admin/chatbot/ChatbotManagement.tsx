"use client";

/**
 * ChatbotManagement — chatbot sessions and RAG documents administration.
 */

import { StatCard } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockChatSessions, mockRagDocuments } from "@/lib/admin-mock";
import type { ChatSessionAdmin, RagDocumentAdmin } from "@/types";
import { Eye, FileText, MessageSquare, Users } from "lucide-react";
import { useEffect, useState } from "react";

const sessionColumns: ColumnDef<ChatSessionAdmin>[] = [
    { key: "userName", header: "Usuario", render: (s) => <span className="font-medium">{s.userName}</span> },
    { key: "contextTopic", header: "Tema", render: (s) => s.contextTopic ? <Badge variant="outline">{s.contextTopic}</Badge> : "-" },
    { key: "messageCount", header: "Mensajes", render: (s) => s.messageCount },
    { key: "startedAt", header: "Inicio", hideOnMobile: true, render: (s) => new Date(s.startedAt).toLocaleDateString("es-CO") },
    { key: "lastMessageAt", header: "Ultimo Msg", hideOnMobile: true, render: (s) => s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "-" },
];

export function ChatbotManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [sessions, setSessions] = useState<ChatSessionAdmin[]>([]);
    const [ragDocs, setRagDocs] = useState<RagDocumentAdmin[]>([]);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<ChatSessionAdmin | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => { const t = setTimeout(() => { setSessions(mockChatSessions()); setRagDocs(mockRagDocuments()); setIsLoading(false); }, 400); return () => clearTimeout(t); }, []);

    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
    const avgMessages = sessions.length > 0 ? Math.round(totalMessages / sessions.length) : 0;

    const filteredSessions = search
        ? sessions.filter((s) => s.userName.toLowerCase().includes(search.toLowerCase()) || (s.contextTopic?.toLowerCase().includes(search.toLowerCase()) ?? false))
        : sessions;

    const actions: RowAction<ChatSessionAdmin>[] = [
        { label: "Ver sesion", icon: <Eye className="h-4 w-4" />, onClick: (s) => { setSelected(s); setIsDetailOpen(true); } },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Chatbot RAG</h1>
                <p className="text-muted-foreground">Sesiones de chat y documentos RAG indexados</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Sesiones Totales" value={sessions.length} icon={<MessageSquare className="h-5 w-5" />} />
                <StatCard label="Mensajes Totales" value={totalMessages} icon={<MessageSquare className="h-5 w-5" />} />
                <StatCard label="Promedio Msg/Sesion" value={avgMessages} icon={<Users className="h-5 w-5" />} />
                <StatCard label="Documentos RAG" value={ragDocs.length} icon={<FileText className="h-5 w-5" />} />
            </div>

            <Tabs defaultValue="sessions">
                <TabsList><TabsTrigger value="sessions">Sesiones</TabsTrigger><TabsTrigger value="rag">Documentos RAG</TabsTrigger></TabsList>
                <TabsContent value="sessions" className="mt-4">
                    <AdminDataTable
                        data={filteredSessions} columns={sessionColumns} actions={actions} keyExtractor={(s) => s.id}
                        isLoading={isLoading} searchValue={search} onSearchChange={setSearch}
                        searchPlaceholder="Buscar por usuario o tema..." emptyTitle="No hay sesiones"
                    />
                </TabsContent>
                <TabsContent value="rag" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Documentos Indexados</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Titulo</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="hidden md:table-cell">Especie</TableHead>
                                        <TableHead>Chunks</TableHead>
                                        <TableHead className="hidden md:table-cell">Fecha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ragDocs.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">{doc.title}</TableCell>
                                            <TableCell><Badge variant="outline">{doc.sourceType ?? "-"}</Badge></TableCell>
                                            <TableCell className="hidden md:table-cell italic">{doc.speciesName ?? "-"}</TableCell>
                                            <TableCell>{doc.chunkCount}</TableCell>
                                            <TableCell className="hidden md:table-cell">{new Date(doc.createdAt).toLocaleDateString("es-CO")}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Sesion de Chat</DialogTitle><DialogDescription>Detalles de la sesion</DialogDescription></DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Usuario</p><p className="font-medium">{selected.userName}</p></div>
                                <div><p className="text-muted-foreground">Tema</p><Badge variant="outline">{selected.contextTopic ?? "General"}</Badge></div>
                                <div><p className="text-muted-foreground">Mensajes</p><p className="font-medium">{selected.messageCount}</p></div>
                                <div><p className="text-muted-foreground">Inicio</p><p className="font-medium">{new Date(selected.startedAt).toLocaleString("es-CO")}</p></div>
                            </div>
                            <div className="flex justify-end"><Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button></div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

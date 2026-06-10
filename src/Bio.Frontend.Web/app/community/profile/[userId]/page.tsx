'use client';

/**
 * PublicProfilePage — view another user's community profile.
 * Shows dynamic Connect/Pending/Connected state based on existing connection.
 *
 * @module app/community/profile/[userId]/page
 */

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getInitials } from '@/lib/formatters';
import { UserPlus, MessageCircle, ArrowLeft, Clock, UserCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useChatStore } from '@/store/chat-store';
import {
    useCreateThread,
    useSendConnectionRequest,
    useCancelRequest,
    useConnectionStatus,
} from '@/hooks/features/community';
import { useIsMd } from '@/hooks/useMediaQuery';

export default function PublicProfilePage() {
    const { userId } = useParams<{ userId: string }>();
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const openChat = useChatStore((s) => s.openChat);
    const createThread = useCreateThread();
    const sendRequest = useSendConnectionRequest();
    const cancelRequest = useCancelRequest();
    const isDesktop = useIsMd();

    // Check connection status with this user
    const { isSentPending, isAccepted, isReceivedPending, existing, isLoading: checkingStatus } =
        useConnectionStatus(user?.id, userId);

    const isOwnProfile = user?.id === userId;

    function handleSendMessage() {
        if (!isAuthenticated || !user) {
            router.push('/auth/login');
            return;
        }
        createThread.mutate(
            { threadType: 'Direct', participantIds: [userId] },
            {
                onSuccess: (thread) => {
                    // Backend doesn't return participant names, enrich before opening
                    if (isDesktop) {
                        openChat({
                            ...thread,
                            otherParticipantId: userId,
                            otherParticipantName: 'Usuario',
                            title: thread.title ?? 'Conversación',
                        });
                    } else {
                        router.push(`/community/messages/${thread.id}?name=Usuario`);
                    }
                },
            },
        );
    }

    function handleConnect() {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        sendRequest.mutate({
            addresseeId: userId,
            message: '¡Hola! Me gustaría conectar contigo.',
        });
    }

    function handleCancel() {
        if (existing?.id) {
            cancelRequest.mutate(existing.id);
        }
    }

    /** Renders the appropriate connection action button based on current status */
    function renderConnectButton() {
        if (checkingStatus) {
            return (
                <Button className="gap-2" disabled>
                    <Clock className="h-4 w-4 animate-pulse" />
                    Verificando...
                </Button>
            );
        }

        if (isAccepted) {
            return (
                <Button variant="outline" className="gap-2 text-green-600 border-green-300" disabled>
                    <UserCheck className="h-4 w-4" />
                    Conectado
                </Button>
            );
        }

        if (isSentPending) {
            return (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="gap-2 text-amber-600 border-amber-300"
                        disabled
                    >
                        <Clock className="h-4 w-4" />
                        Pendiente
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={handleCancel}
                        disabled={cancelRequest.isPending}
                        title="Cancelar solicitud"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            );
        }

        if (isReceivedPending) {
            return (
                <Button variant="outline" className="gap-2 text-primary border-primary" disabled>
                    <Clock className="h-4 w-4" />
                    Solicitud recibida
                </Button>
            );
        }

        // No connection — show Connect
        return (
            <Button
                className="gap-2"
                onClick={handleConnect}
                disabled={sendRequest.isPending}
            >
                <UserPlus className="h-4 w-4" />
                {sendRequest.isPending ? 'Enviando...' : 'Conectar'}
            </Button>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-4 p-4">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                Volver
            </Button>

            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                {isOwnProfile ? getInitials(user?.fullName ?? 'U') : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold">
                                {isOwnProfile ? (user?.fullName ?? 'Mi Perfil') : 'Perfil de Usuario'}
                            </h1>
                            <p className="text-sm text-muted-foreground">Miembro de la comunidad</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {!isOwnProfile && isAuthenticated && (
                        <div className="flex gap-2 flex-wrap">
                            {renderConnectButton()}
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={handleSendMessage}
                                disabled={createThread.isPending}
                            >
                                <MessageCircle className="h-4 w-4" />
                                Mensaje
                            </Button>
                        </div>
                    )}
                    {isOwnProfile && (
                        <Button asChild variant="outline">
                            <Link href="/profile">Ver mi perfil completo</Link>
                        </Button>
                    )}
                    {!isAuthenticated && (
                        <p className="text-sm text-muted-foreground">
                            <Link href="/auth/login" className="text-primary hover:underline">
                                Inicia sesión
                            </Link>{' '}
                            para conectar con este usuario.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

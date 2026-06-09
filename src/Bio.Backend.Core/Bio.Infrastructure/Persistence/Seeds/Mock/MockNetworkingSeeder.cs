using Microsoft.EntityFrameworkCore;
using Bio.Domain.Entities;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

public static partial class BioDbContextMockSeeder
{
    /// <summary>
    /// Seeds the networking graph: connections between the base users and among the 20 buyers
    /// (each buyer gets 1–3 connections across Accepted/Pending/Rejected/Blocked states), plus
    /// direct and group chat threads with coherent message history and read receipts.
    /// </summary>
    internal static void SeedMockNetworking(this ModelBuilder modelBuilder, MockSeedContext ctx)
    {
        var d = ctx.SeedDate;
        var connections = new List<object>();
        int connCounter = 1;

        void Conn(Guid requester, Guid addressee, string status, string message, int createdDaysAgo, int respondedDaysAgo)
        {
            connections.Add(new
            {
                Id = MockSeedContext.Det(1, connCounter++),
                RequesterId = requester,
                AddresseeId = addressee,
                Status = status,
                Message = message,
                CreatedAt = d.AddDays(-createdDaysAgo),
                RespondedAt = status == "Pending" ? (DateTime?)null : d.AddDays(-respondedDaysAgo),
            });
        }

        // ── Base-user connections ────────────────────────────────────────────
        Conn(MockSeedContext.CommunityBaseId, MockSeedContext.EntrepreneurId, "Accepted",
            "¡Hola! Me gustaría conectar para hablar sobre prácticas tradicionales de cultivo.", 20, 19);
        Conn(MockSeedContext.CommunityBaseId, MockSeedContext.ResearcherId, "Accepted",
            "Un saludo. Interesado en validar algunas especies de mi región.", 15, 14);
        Conn(MockSeedContext.EntrepreneurId, MockSeedContext.ResearcherId, "Accepted",
            "Hola, queremos certificar que nuestros productos provienen de fuentes biológicas validadas.", 8, 7);
        Conn(MockSeedContext.BuyerBaseId, MockSeedContext.EntrepreneurId, "Accepted",
            "¡Hola! Soy comprador interesado en tus productos ecológicos de corozo.", 5, 4);
        Conn(MockSeedContext.BuyerBaseId, MockSeedContext.CommunityBaseId, "Accepted",
            "Interesado en conocer más sobre la cosmética natural ancestral.", 4, 3);

        // ── Buyer ↔ buyer connections (1–3 per buyer, deduped pairs) ─────────
        var seenPairs = new HashSet<(int, int)>();
        var acceptedBuyerPairs = new List<(int A, int B)>();
        var statusCycle = new[] { "Accepted", "Accepted", "Pending", "Rejected", "Accepted", "Blocked" };
        int statusIdx = 0;

        for (int i = 0; i < 20; i++)
        {
            int desired = 1 + (i % 3); // 1..3
            for (int k = 0; k < desired; k++)
            {
                int j = (i + 1 + k * 7) % 20;
                if (j == i) continue;
                var pair = (Math.Min(i, j), Math.Max(i, j));
                if (!seenPairs.Add(pair)) continue;

                var status = statusCycle[statusIdx++ % statusCycle.Length];
                Conn(ctx.BuyerIds[i], ctx.BuyerIds[j], status,
                    "¡Hola! Me gustaría conectar para compartir experiencias sobre biocomercio sostenible.",
                    createdDaysAgo: 6 + (i % 10), respondedDaysAgo: 3 + (i % 8));

                if (status == "Accepted") acceptedBuyerPairs.Add((i, j));
            }
        }

        modelBuilder.Entity<UserConnection>().HasData(connections);

        // ── Chats: threads, participants, messages, reads ────────────────────
        var threads = new List<object>();
        var participants = new List<object>();
        var messages = new List<object>();
        var reads = new List<object>();
        int threadCounter = 1, msgCounter = 1;

        Guid AddThread(string? title, string threadType, List<Guid> userIds, int createdDaysAgo)
        {
            var threadId = MockSeedContext.Det(5, threadCounter++);
            threads.Add(new
            {
                Id = threadId,
                Title = threadType == "Group" ? title : null,
                ThreadType = threadType,
                CreatedAt = d.AddDays(-createdDaysAgo),
                UpdatedAt = (DateTime?)d.AddDays(-1),
            });
            foreach (var u in userIds)
                participants.Add(new
                {
                    ThreadId = threadId,
                    UserId = u,
                    JoinedAt = d.AddDays(-createdDaysAgo),
                    LeftAt = (DateTime?)null,
                    IsMuted = false,
                });
            return threadId;
        }

        void AddMessage(Guid threadId, Guid sender, string content, DateTime sentAt, List<Guid> members)
        {
            var msgId = MockSeedContext.Det(6, msgCounter++);
            messages.Add(new
            {
                Id = msgId,
                ThreadId = threadId,
                SenderUserId = sender,
                Content = content,
                IsDeleted = false,
                CreatedAt = sentAt,
            });
            foreach (var r in members)
            {
                if (r == sender) continue;
                reads.Add(new { MessageId = msgId, UserId = r, ReadAt = sentAt.AddMinutes(5) });
            }
        }

        // Thread 1 — Buyer(base) ↔ Entrepreneur (purchase coordination).
        var t1 = new List<Guid> { MockSeedContext.BuyerBaseId, MockSeedContext.EntrepreneurId };
        var t1Id = AddThread(null, "Direct", t1, 10);
        var t1d = d.AddDays(-10);
        AddMessage(t1Id, MockSeedContext.BuyerBaseId, "Hola. Estoy interesado en la miel de acacia. ¿Tienen disponibilidad?", t1d.AddHours(9), t1);
        AddMessage(t1Id, MockSeedContext.EntrepreneurId, "Hola, claro. Tenemos stock fresco cosechado esta semana. ¿Cuántos frascos necesitas?", t1d.AddHours(9).AddMinutes(15), t1);
        AddMessage(t1Id, MockSeedContext.BuyerBaseId, "Tres frascos de 500ml. ¿Cuánto tarda el envío a Manizales?", t1d.AddHours(10), t1);
        AddMessage(t1Id, MockSeedContext.EntrepreneurId, "Entre 1 y 2 días hábiles. Si compras hoy por la plataforma, despachamos mañana.", t1d.AddHours(10).AddMinutes(10), t1);
        AddMessage(t1Id, MockSeedContext.BuyerBaseId, "Listo, acabo de pagar por la app. ¡Quedo atento!", t1d.AddHours(11), t1);

        // Thread 2 — Community ↔ Researcher (taxonomy help).
        var t2 = new List<Guid> { MockSeedContext.CommunityBaseId, MockSeedContext.ResearcherId };
        var t2Id = AddThread(null, "Direct", t2, 12);
        var t2d = d.AddDays(-12);
        AddMessage(t2Id, MockSeedContext.CommunityBaseId, "Doctor, encontré una orquídea silvestre en la reserva. ¿Me ayuda a confirmar su taxonomía?", t2d.AddHours(14), t2);
        AddMessage(t2Id, MockSeedContext.ResearcherId, "Claro. Envíame las fotos o publícalas en el foro de conservación para que otros botánicos las vean.", t2d.AddHours(14).AddMinutes(30), t2);
        AddMessage(t2Id, MockSeedContext.CommunityBaseId, "Listo, las subí en un post. Creo que es del género Epidendrum.", t2d.AddHours(15), t2);
        AddMessage(t2Id, MockSeedContext.ResearcherId, "Perfecto. Reviso el post y hago la validación taxonómica formal.", t2d.AddHours(15).AddMinutes(12), t2);

        // Group thread — base users collaboration.
        var tg = new List<Guid> { MockSeedContext.CommunityBaseId, MockSeedContext.EntrepreneurId, MockSeedContext.ResearcherId, MockSeedContext.BuyerBaseId };
        var tgId = AddThread("Saberes Ancestrales y Bioeconomía", "Group", tg, 8);
        var tgd = d.AddDays(-8);
        AddMessage(tgId, MockSeedContext.CommunityBaseId, "Bienvenidos al grupo. Aquí coordinamos publicaciones y proyectos conjuntos.", tgd.AddHours(10), tg);
        AddMessage(tgId, MockSeedContext.EntrepreneurId, "Excelente. Propongo un post conjunto sobre el cultivo orgánico de sacha inchi.", tgd.AddHours(10).AddMinutes(12), tg);
        AddMessage(tgId, MockSeedContext.ResearcherId, "Desde la academia aportamos la validación de perfiles lipídicos del aceite.", tgd.AddHours(10).AddMinutes(25), tg);
        AddMessage(tgId, MockSeedContext.BuyerBaseId, "Me uno como comprador interesado. ¡Gran iniciativa!", tgd.AddHours(11), tg);

        // Buyer ↔ buyer direct chats for the first accepted pairs.
        var buyerChatLines = new[]
        {
            ("¡Hola! Vi que también compras productos de biocomercio. ¿Recomiendas alguna tienda?", "¡Hola! Sí, el aceite de corozo de Corozo del Magdalena es buenísimo.", "Gracias, lo voy a pedir.", "De nada, ya me contarás qué te pareció."),
            ("Hola, ¿probaste la miel de acacia?", "Sí, excelente. La pedí dos veces ya.", "¿El envío llegó rápido?", "En dos días a Pereira."),
            ("Vi tu reseña del jabón de corozo, ¿hidrata bien?", "Muchísimo, ideal para piel seca.", "Perfecto, lo compro entonces.", "¡Te va a encantar!"),
            ("¿Sabes si hacen el tour de colibríes los fines de semana?", "Sí, sábados y domingos. Yo lo hice y vale la pena.", "Genial, gracias por el dato.", "Lleva ropa abrigada, hace frío arriba."),
            ("Busco regalos artesanales, ¿ideas?", "Las artesanías en semilla de corozo son únicas.", "¡Me gustan! ¿Caras?", "No, muy buen precio y hechas a mano."),
            ("¿Compraste las semillas para restaurar páramo?", "Sí, germinaron muy bien.", "Qué bueno, yo apenas voy a empezar.", "Cualquier duda me escribes."),
        };

        int chats = Math.Min(6, acceptedBuyerPairs.Count);
        for (int t = 0; t < chats; t++)
        {
            var (ai, bi) = acceptedBuyerPairs[t];
            var members = new List<Guid> { ctx.BuyerIds[ai], ctx.BuyerIds[bi] };
            var tid = AddThread(null, "Direct", members, 9 - (t % 5));
            var baseTime = d.AddDays(-(9 - (t % 5))).AddHours(16);
            var lines = buyerChatLines[t % buyerChatLines.Length];
            AddMessage(tid, ctx.BuyerIds[ai], lines.Item1, baseTime, members);
            AddMessage(tid, ctx.BuyerIds[bi], lines.Item2, baseTime.AddMinutes(8), members);
            AddMessage(tid, ctx.BuyerIds[ai], lines.Item3, baseTime.AddMinutes(20), members);
            AddMessage(tid, ctx.BuyerIds[bi], lines.Item4, baseTime.AddMinutes(31), members);
        }

        modelBuilder.Entity<DirectThread>().HasData(threads);
        modelBuilder.Entity<DirectThreadParticipant>().HasData(participants);
        modelBuilder.Entity<DirectMessage>().HasData(messages);
        modelBuilder.Entity<DirectMessageRead>().HasData(reads);
    }
}

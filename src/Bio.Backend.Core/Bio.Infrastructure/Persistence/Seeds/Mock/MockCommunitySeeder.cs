using Microsoft.EntityFrameworkCore;
using Bio.Domain.Entities;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

public static partial class BioDbContextMockSeeder
{
    /// <summary>
    /// Seeds the community forum: 12 posts authored by the 5 community users (each authors at least
    /// two), written as sanitized HTML with embedded, verified images. Buyers and base users add
    /// comments and reactions; like/dislike counters are derived from the seeded reactions.
    /// </summary>
    internal static void SeedMockCommunity(this ModelBuilder modelBuilder, MockSeedContext ctx)
    {
        var c = ctx.CommunityIds; // [0]=base, [1..4]=new community users
        var d = ctx.SeedDate;

        // ── Posts ────────────────────────────────────────────────────────────
        var posts = new List<PostDef>
        {
            new(MockSeedContext.Det(2, 1), c[0], "Uso tradicional de la harina de coca en el Cauca", "Tradición",
                $"""
                <h3>Un alimento ancestral</h3>
                <p>La <strong>harina de hoja de coca</strong> ha sido usada por nuestras comunidades como alimento, medicina y elemento espiritual. Es rica en calcio, hierro y proteínas.</p>
                <figure><img src="{MockSeedContext.UHerbs}" alt="Hierbas y plantas tradicionales" /><figcaption>Plantas medicinales del territorio.</figcaption></figure>
                <p>Compartimos algunas recetas tradicionales:</p>
                <ul><li>Pan de coca con panela</li><li>Galletas energéticas con miel de angelita</li><li>Infusiones digestivas</li></ul>
                <p>¿Alguien más conserva estas recetas en su familia?</p>
                """, "Published", true, d.AddDays(-30)),

            new(MockSeedContext.Det(2, 2), c[0], "Sacha Inchi: la transición hacia lo orgánico", "Conservación",
                $"""
                <h3>Del cultivo ilícito al maní del inca</h3>
                <p>El <strong>Sacha Inchi</strong> es una fuente excepcional de Omega 3, 6 y 9. En nuestra vereda hicimos la transición a cultivos 100% orgánicos.</p>
                <figure><img src="{MockSeedContext.UForest2}" alt="Bosque andino" /></figure>
                <p>Los principales retos hoy son la comercialización justa y el acceso a abonos orgánicos.</p>
                """, "Published", false, d.AddDays(-26)),

            new(MockSeedContext.Det(2, 3), c[1], "Saberes del bosque: el aliso (Alnus acuminata)", "Investigación",
                $"""
                <h3>Un árbol que repara el suelo</h3>
                <p>El <strong>aliso andino</strong> fija nitrógeno y mejora suelos degradados. Lo integramos en sistemas agroforestales con café y frutales.</p>
                <figure><img src="{MockSeedContext.ImgAlnus}" alt="Alnus acuminata" /><figcaption>Aliso andino (Alnus acuminata).</figcaption></figure>
                <p>Estamos tramitando el permiso de acceso para investigar su potencial en restauración de microcuencas.</p>
                """, "Published", false, d.AddDays(-24)),

            new(MockSeedContext.Det(2, 4), c[1], "Restauración del páramo con especies nativas", "Conservación",
                $"""
                <h3>Sembrar agua</h3>
                <p>El páramo es una fábrica de agua. Con semillas nativas como el <strong>cadillo de páramo</strong> recuperamos coberturas degradadas.</p>
                <figure><img src="{MockSeedContext.UParamo}" alt="Paisaje de páramo" /></figure>
                <p>Cada hectárea restaurada protege nacimientos de agua para comunidades enteras.</p>
                """, "Published", false, d.AddDays(-22)),

            new(MockSeedContext.Det(2, 5), c[2], "Tejido en fibra de fique: arte milenario", "Tradición",
                $"""
                <h3>Manos que tejen memoria</h3>
                <p>Nuestras <strong>tejedoras</strong> transforman la fibra de fique en mochilas y canastos. Cada diseño cuenta una historia del sol, la tierra y el agua.</p>
                <figure><img src="{MockSeedContext.UMarket}" alt="Artesanías y mercado local" /></figure>
                <p>Apoyar el comercio justo permite que el conocimiento siga vivo entre generaciones.</p>
                """, "Published", false, d.AddDays(-20)),

            new(MockSeedContext.Det(2, 6), c[2], "Tintes naturales de la acacia", "Educación",
                $"""
                <h3>Color que nace del bosque</h3>
                <p>De la corteza de la <strong>Acacia decurrens</strong> obtenemos taninos para teñir fibras sin químicos sintéticos.</p>
                <figure><img src="{MockSeedContext.ImgAcacia}" alt="Acacia decurrens" /></figure>
                <p>En el próximo taller enseñaremos el proceso de mordentado natural. ¡Cupos limitados!</p>
                """, "Published", false, d.AddDays(-18)),

            new(MockSeedContext.Det(2, 7), c[3], "Café de sombra y biodiversidad de aves", "Investigación",
                $"""
                <h3>El café que protege fauna</h3>
                <p>El <strong>café de sombra</strong> conserva el dosel del bosque y atrae rapaces como el gavilán acollarado, controlador natural de plagas.</p>
                <figure><img src="{MockSeedContext.ImgHawk}" alt="Gavilán acollarado" /><figcaption>Accipiter striatus en zona cafetera.</figcaption></figure>
                <p>Producir con biodiversidad es producir con futuro.</p>
                """, "Published", true, d.AddDays(-16)),

            new(MockSeedContext.Det(2, 8), c[3], "El corozo: del fruto al aceite", "Emprendimiento",
                $"""
                <h3>Aprovechamiento integral</h3>
                <p>Del <strong>corozo</strong> usamos todo: pulpa para alimentos, aceite prensado en frío para cosmética y la semilla para artesanías.</p>
                <figure><img src="{MockSeedContext.ImgCorozo}" alt="Acrocomia aculeata (corozo)" /></figure>
                <p>Así reducimos residuos y generamos varias líneas de ingreso para la comunidad.</p>
                """, "Published", false, d.AddDays(-14)),

            new(MockSeedContext.Det(2, 9), c[4], "Avistamiento de colibríes en Caldas", "Educación",
                $"""
                <h3>Joyas voladoras</h3>
                <p>Caldas alberga decenas de especies de <strong>colibríes</strong>. El avistamiento responsable genera ingresos sin extraer del bosque.</p>
                <figure><img src="{MockSeedContext.ImgHummingbird}" alt="Colibrí andino" /><figcaption>Adelomyia melanogenys.</figcaption></figure>
                <p>Recuerden: nunca usar flash y mantener distancia de los bebederos naturales.</p>
                """, "Published", false, d.AddDays(-12)),

            new(MockSeedContext.Det(2, 10), c[4], "Guardianes del agua: conservación del páramo", "Conservación",
                $"""
                <h3>Compromiso comunitario</h3>
                <p>Como <strong>Guardianes del Páramo</strong> monitoreamos nacimientos de agua y hacemos control de quemas.</p>
                <figure><img src="{MockSeedContext.UMountain}" alt="Montañas y páramo" /></figure>
                <p>Invitamos a investigadores y autoridades a sumarse a la jornada de zonificación participativa.</p>
                """, "Published", true, d.AddDays(-10)),

            new(MockSeedContext.Det(2, 11), c[1], "Miel de angelitas y polinizadores", "Conservación",
                $"""
                <h3>Abejas sin aguijón</h3>
                <p>La <strong>miel de meliponas</strong> (abejas angelitas) tiene propiedades medicinales. Promovemos nidos técnicos en bosque nativo.</p>
                <figure><img src="{MockSeedContext.UHoney1}" alt="Miel artesanal" /></figure>
                <p>Borrador en revisión antes de publicar el protocolo completo de manejo.</p>
                """, "Draft", false, d.AddDays(-6)),

            new(MockSeedContext.Det(2, 12), c[3], "Mariposas como bioindicadores", "Investigación",
                $"""
                <h3>Termómetro del bosque</h3>
                <p>La presencia de ciertas <strong>mariposas</strong> indica la salud del ecosistema. Monitoreamos transectos cada mes.</p>
                <figure><img src="{MockSeedContext.ImgButterfly}" alt="Mariposa Achlyodes pallida" /></figure>
                <p>Post archivado: contenido integrado a la guía oficial de monitoreo.</p>
                """, "Archived", false, d.AddDays(-4)),
        };

        // ── Comments ──────────────────────────────────────────────────────────
        var comments = new List<CommentDef>
        {
            new(MockSeedContext.Det(3, 1), posts[0].Id, MockSeedContext.EntrepreneurId,
                "Yo uso la harina para galletas energéticas con miel de angelita. ¡Quedan deliciosas!", false, d.AddDays(-29)),
            new(MockSeedContext.Det(3, 2), posts[0].Id, MockSeedContext.ResearcherId,
                "Desde lo científico, la hoja tiene un contenido altísimo de calcio. Superalimento subutilizado.", false, d.AddDays(-29)),
            new(MockSeedContext.Det(3, 3), posts[0].Id, ctx.BuyerIds[2],
                "Comentario retirado por moderación.", true, d.AddDays(-28)),

            new(MockSeedContext.Det(3, 4), posts[2].Id, ctx.BuyerIds[5],
                "Muy interesante el aliso. ¿Venden plántulas para sistemas agroforestales?", false, d.AddDays(-23)),
            new(MockSeedContext.Det(3, 5), posts[2].Id, ctx.SellerIds[1],
                "Sí, tenemos plántulas disponibles en el marketplace. ¡Gracias por el interés!", false, d.AddDays(-23)),

            new(MockSeedContext.Det(3, 6), posts[4].Id, ctx.BuyerIds[8],
                "Las mochilas de fique son hermosas. ¿Hacen envíos a Bogotá?", false, d.AddDays(-19)),
            new(MockSeedContext.Det(3, 7), posts[6].Id, MockSeedContext.AuthorityId,
                "Excelente iniciativa de café de sombra. ¿Tienen registro de las especies observadas?", false, d.AddDays(-15)),
            new(MockSeedContext.Det(3, 8), posts[6].Id, MockSeedContext.ResearcherId,
                "Puedo ayudar con la validación taxonómica de las rapaces avistadas.", false, d.AddDays(-15)),
            new(MockSeedContext.Det(3, 9), posts[8].Id, ctx.BuyerIds[11],
                "Hice el tour de colibríes y fue espectacular. ¡Totalmente recomendado!", false, d.AddDays(-11)),
            new(MockSeedContext.Det(3, 10), posts[9].Id, MockSeedContext.AdminId,
                "Habilitamos la carga de mapas en formato GeoJSON para la jornada de zonificación.", false, d.AddDays(-9)),
        };

        // ── Reactions + count tracking ─────────────────────────────────────────
        var reactions = new List<object>();
        int reactCounter = 1;
        var postLikes = posts.ToDictionary(p => p.Id, _ => 0);
        var postDislikes = posts.ToDictionary(p => p.Id, _ => 0);
        var commentLikes = comments.ToDictionary(cm => cm.Id, _ => 0);
        var commentDislikes = comments.ToDictionary(cm => cm.Id, _ => 0);

        void React(Guid userId, Guid targetId, string targetType, string reactionType)
        {
            reactions.Add(new
            {
                Id = MockSeedContext.Det(4, reactCounter++),
                UserId = userId,
                TargetType = targetType,
                TargetId = targetId,
                ReactionType = reactionType,
                CreatedAt = d.AddDays(-3),
            });
            if (targetType == "Post")
            {
                if (reactionType == "Like") postLikes[targetId]++; else postDislikes[targetId]++;
            }
            else
            {
                if (reactionType == "Like") commentLikes[targetId]++; else commentDislikes[targetId]++;
            }
        }

        // Spread reactions across published posts: base users + a rotating set of buyers.
        var baseReactors = new[] { MockSeedContext.ResearcherId, MockSeedContext.EntrepreneurId, MockSeedContext.AuthorityId, MockSeedContext.AdminId };
        for (int pi = 0; pi < posts.Count; pi++)
        {
            if (posts[pi].Status != "Published") continue;
            // 3..6 likes from buyers
            int likes = 3 + (pi % 4);
            for (int k = 0; k < likes; k++)
                React(ctx.BuyerIds[(pi * 3 + k) % ctx.BuyerIds.Count], posts[pi].Id, "Post", "Like");
            // a base-user like
            React(baseReactors[pi % baseReactors.Length], posts[pi].Id, "Post", "Like");
            // occasional dislike from a different base user (avoids the buyer like-set and the unique index)
            if (pi % 4 == 1)
                React(baseReactors[(pi + 2) % baseReactors.Length], posts[pi].Id, "Post", "Dislike");
        }

        // Comment reactions.
        React(c[1], comments[0].Id, "Comment", "Like");
        React(ctx.BuyerIds[0], comments[0].Id, "Comment", "Like");
        React(c[1], comments[1].Id, "Comment", "Like");
        React(MockSeedContext.AuthorityId, comments[7].Id, "Comment", "Like");
        React(ctx.BuyerIds[3], comments[8].Id, "Comment", "Like");

        // ── Emit ────────────────────────────────────────────────────────────
        modelBuilder.Entity<CommunityPost>().HasData(posts.Select(p => new
        {
            p.Id,
            AuthorUserId = p.Author,
            p.Title,
            p.Content,
            p.Category,
            p.Status,
            p.IsPinned,
            LikesCount = postLikes[p.Id],
            DislikesCount = postDislikes[p.Id],
            p.CreatedAt,
            UpdatedAt = (DateTime?)null,
        }).ToList<object>());

        modelBuilder.Entity<CommunityPostComment>().HasData(comments.Select(cm => new
        {
            cm.Id,
            cm.PostId,
            AuthorUserId = cm.Author,
            cm.Content,
            cm.IsDeleted,
            LikesCount = commentLikes[cm.Id],
            DislikesCount = commentDislikes[cm.Id],
            cm.CreatedAt,
            UpdatedAt = (DateTime?)null,
        }).ToList<object>());

        modelBuilder.Entity<CommunityReaction>().HasData(reactions);
    }

    private sealed record PostDef(Guid Id, Guid Author, string Title, string Category, string Content, string Status, bool IsPinned, DateTime CreatedAt);
    private sealed record CommentDef(Guid Id, Guid PostId, Guid Author, string Content, bool IsDeleted, DateTime CreatedAt);
}

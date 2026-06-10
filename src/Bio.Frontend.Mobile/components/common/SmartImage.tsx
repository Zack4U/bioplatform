import { normalizeImageUrl } from "@/lib/image-url";
import {
    Image as ExpoImage,
    ImageBackground as ExpoImageBackground,
    type ImageBackgroundProps as ExpoImageBackgroundProps,
    type ImageProps as ExpoImageProps,
    type ImageSource,
} from "expo-image";
import React from "react";

function normalizeSource(source: ImageSource | string | null | undefined) {
    if (!source) return source;

    if (typeof source === "string") {
        return normalizeImageUrl(source) ?? undefined;
    }

    if (typeof source === "object" && "uri" in source) {
        const normalizedUri = normalizeImageUrl(source.uri);
        if (!normalizedUri) return undefined;
        return { ...source, uri: normalizedUri };
    }

    return source;
}

export interface SmartImageProps extends Omit<ExpoImageProps, "source"> {
    source?: ImageSource | string | null;
}

export function SmartImage({
    source,
    transition = 120,
    cachePolicy = "memory-disk",
    ...rest
}: SmartImageProps) {
    const resolvedSource = normalizeSource(source);

    return (
        <ExpoImage
            source={resolvedSource}
            transition={transition}
            cachePolicy={cachePolicy}
            {...rest}
        />
    );
}

export interface SmartImageBackgroundProps extends Omit<
    ExpoImageBackgroundProps,
    "source"
> {
    source?: ImageSource | string | null;
}

export function SmartImageBackground({
    source,
    transition = 120,
    cachePolicy = "memory-disk",
    ...rest
}: SmartImageBackgroundProps) {
    const resolvedSource = normalizeSource(source);

    return (
        <ExpoImageBackground
            source={resolvedSource}
            transition={transition}
            cachePolicy={cachePolicy}
            {...rest}
        />
    );
}

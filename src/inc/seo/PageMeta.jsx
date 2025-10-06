export default function PageMeta({ title, description = "H&Q Admin", noIndex = false }) {
    const full = title ? `${title} | H&Q Admin` : "H&Q Admin";
    return (
        <>
            <title>{full}</title>
            {description && <meta name="description" content={description} />}
            {/* OG básico */}
            <meta property="og:title" content={full} />
            {description && <meta property="og:description" content={description} />}
            {noIndex && <meta name="robots" content="noindex,nofollow" />}
        </>
    );
}

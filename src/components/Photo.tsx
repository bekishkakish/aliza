import { assetUrl } from "../lib/assets";

export default function Photo({
  name,
  alt,
  eager = false,
  className = "",
}: {
  name: string;
  alt: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={assetUrl(`media/${name}.webp`)}
      srcSet={`${assetUrl(`media/${name}-768.webp`)} 768w, ${assetUrl(`media/${name}.webp`)} 1672w`}
      sizes="(max-width: 768px) 100vw, 90vw"
      width={1672}
      height={941}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
    />
  );
}

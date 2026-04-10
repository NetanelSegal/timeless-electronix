import { AdvancedImage, lazyload, placeholder } from "@cloudinary/react";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { format, quality } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/format";
import { auto as autoQuality } from "@cloudinary/url-gen/qualifiers/quality";
import { cld, extractPublicId, isCloudinaryConfigured } from "../cloudinary/config";

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function CloudinaryImage({
  src,
  alt,
  width = 400,
  height,
  className,
}: CloudinaryImageProps) {
  const publicId = isCloudinaryConfigured ? extractPublicId(src) : null;

  if (!publicId) {
    return <img src={src} alt={alt} className={className} />;
  }

  const img = cld
    .image(publicId)
    .resize(fill().width(width).height(height ?? width))
    .delivery(format(auto()))
    .delivery(quality(autoQuality()));

  return (
    <AdvancedImage
      cldImg={img}
      alt={alt}
      width={width}
      height={height ?? width}
      plugins={[placeholder({ mode: "blur" }), lazyload()]}
      className={className}
    />
  );
}

import { Helmet } from "react-helmet-async";
import { absoluteUrl } from "../lib/siteUrl";
import { COMPANY } from "../lib/constants";

interface Props {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}

export default function PageSeo({ title, description, path, ogImage }: Props) {
  const canonical = absoluteUrl(path);
  const brand = COMPANY.name;
  const fullTitle = title.includes(brand) ? title : `${title} | ${brand}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical.startsWith("http") ? (
        <link rel="canonical" href={canonical} />
      ) : null}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {canonical.startsWith("http") ? (
        <meta property="og:url" content={canonical} />
      ) : null}
      <meta property="og:type" content="website" />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
    </Helmet>
  );
}

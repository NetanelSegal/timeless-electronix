import { Helmet } from "react-helmet-async";
import { absoluteUrl } from "../lib/siteUrl";
import { COMPANY } from "../lib/constants";

interface Props {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  /**
   * Keep the page out of the index. Used for states that carry no real
   * content (a missing product, a backend failure) so search engines drop
   * the URL instead of recording it as a soft 404.
   */
  noindex?: boolean;
}

export default function PageSeo({
  title,
  description,
  path,
  ogImage,
  noindex,
}: Props) {
  const canonical = absoluteUrl(path);
  const brand = COMPANY.name;
  const fullTitle = title.includes(brand) ? title : `${title} | ${brand}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex, follow" /> : null}
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

import { Helmet } from "react-helmet-async";

type Props = {
  title: string;
  description: string;
  image?: string;
};

export function SEO({ title, description, image }: Props) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image ? <meta property="og:image" content={image} /> : null}
      {image ? <meta name="twitter:image" content={image} /> : null}
    </Helmet>
  );
}

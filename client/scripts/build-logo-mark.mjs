import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.resolve(__dirname, "../public/timeless-logo-full.svg");
const outPath = path.resolve(__dirname, "../src/components/TimelessLogoFullMark.tsx");

let body = fs.readFileSync(svgPath, "utf8");
body = body
  .replace(/<\?xml[^>]*>/g, "")
  .replace(/<!DOCTYPE[^>]*>/g, "")
  .replace(/<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .replace(/xmlns:serif="[^"]*"/g, "")
  .replace(/serif:id="[^"]*"/g, "")
  .replace(/xml:space="preserve"/g, "")
  .replace(
    /style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"/g,
    "",
  )
  .replace(/style="fill:none;"/g, 'fill="none"')
  .replace(
    /style="fill:rgb\(11,51,0\);fill-rule:nonzero;"/g,
    'className="tl-logo-green" fillRule="nonzero"',
  )
  .replace(
    /style="fill:rgb\(10,10,10\);fill-rule:nonzero;"/g,
    'className="tl-logo-dark" fillRule="nonzero"',
  )
  .replace(/style="fill:rgb\(11,51,0\);"/g, 'className="tl-logo-green"')
  .replace(/style="fill-rule:nonzero;"/g, 'className="tl-logo-dark" fillRule="nonzero"')
  .replace(/clip-path="url\(#_clip1\)"/g, 'clipPath="CLIP_PATH_EXPR"')
  .replace(/id="_clip1"/g, "id={clipId}");

const component = `import { useId, type CSSProperties, type SVGProps } from "react";

export type TimelessLogoFullMarkProps = SVGProps<SVGSVGElement> & {
  /** Override brand green (default #0b3300). */
  green?: string;
  /** Override dark ink (default #0a0a0a). */
  dark?: string;
};

export function TimelessLogoFullMark({
  className = "",
  green,
  dark,
  style,
  ...rest
}: TimelessLogoFullMarkProps) {
  const clipId = useId().replace(/:/g, "");
  const cssVars = {
    ...(green ? { "--tl-logo-green": green } : null),
    ...(dark ? { "--tl-logo-dark": dark } : null),
    ...style,
  } as CSSProperties;

  return (
    <svg
      viewBox="0 0 201 65"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      className={\`tl-full-logo block h-auto w-auto max-w-full \${className}\`.trim()}
      style={cssVars}
      {...rest}
    >
${body.trim().replace(/clipPath="CLIP_PATH_EXPR"/g, "clipPath={`url(#${clipId})`}")}
    </svg>
  );
}
`;

fs.writeFileSync(outPath, component);
console.log("Wrote", outPath);

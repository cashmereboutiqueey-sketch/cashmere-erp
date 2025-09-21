import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="150"
      height="37.5"
      {...props}
    >
      <style>
        {`
          .logo-text {
            font-family: 'Alegreya', serif;
            font-size: 32px;
            font-weight: 800;
          }
          .logo-lite {
            font-family: 'Alegreya', serif;
            font-size: 16px;
            font-weight: 400;
          }
          .dark .fill-primary { fill: hsl(var(--primary)); }
          .dark .fill-foreground { fill: hsl(var(--foreground)); }
          .light .fill-primary { fill: hsl(var(--primary)); }
          .light .fill-foreground { fill: hsl(var(--foreground)); }
        `}
      </style>
      <text x="0" y="35" className="logo-text fill-primary">
        Cashmere
      </text>
      <text x="135" y="35" className="logo-lite fill-foreground">
        ERP Lite
      </text>
    </svg>
  );
}

import type { ReactElement } from "react";

/** Thrillophilia-style 25×25 monochrome destination landmark icons (fill #515151). */

type IconProps = { className?: string; active?: boolean };

const fill = (active?: boolean) => (active ? "var(--th-orange, #f88008)" : "#515151");

export function IconExplore({ active }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden>
      <circle cx="12.5" cy="12.5" r="9" stroke={fill(active)} strokeWidth="1.5" />
      <path d="M12.5 6.5v6l4 2" stroke={fill(active)} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconGoa({ active }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden>
      <path
        fill={fill(active)}
        d="M4 19.5c2.2-1.2 4.8-1.8 8.5-1.8s6.3.6 8.5 1.8H4zm9.2-3.2c.1-3.4 1.2-6.2 2.8-8.2.4-.5 1.2-.2 1.1.4-.3 2.1-1 4.4-1.6 6.4l2.1.6c.7-2.3 1.5-5 1.9-7.5.2-1.4-1.4-2.2-2.5-1.4-2.2 1.6-3.8 4.7-4.2 8.7l.4 1zM8.2 9.2c.8-1.6 2-2.8 3.1-3.5.5-.3 1.1.2.9.8-.5 1.5-1.4 3.2-2.2 4.7l-1.8-2z"
      />
      <path fill={fill(active)} d="M3.5 20.8h18v1.2H3.5z" />
    </svg>
  );
}

export function IconKerala({ active }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden>
      <path
        fill={fill(active)}
        d="M12.5 3.2c-1.4 2.2-3.8 4.1-3.8 7.2 0 2.1 1.7 3.8 3.8 3.8s3.8-1.7 3.8-3.8c0-3.1-2.4-5-3.8-7.2zm0 9.5c-1.3 0-2.3-1-2.3-2.3 0-1.8 1.3-3.3 2.3-4.8 1 1.5 2.3 3 2.3 4.8 0 1.3-1 2.3-2.3 2.3z"
      />
      <path fill={fill(active)} d="M5 20.2h15l-1.2-5.4H6.2L5 20.2zm2.4-6.8h10.2c.5-1.4.8-2.9.8-4.2H6.6c0 1.3.3 2.8.8 4.2z" />
      <path fill={fill(active)} d="M4 21.5h17v1.2H4z" />
    </svg>
  );
}

export function IconLadakh({ active }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden>
      <path fill={fill(active)} d="M2.5 20.5 8 10.2l3.2 4.6 3.5-7.3 7.8 13H2.5z" />
      <path fill={fill(active)} d="M11.2 8.5V4.8h2.6v3.7h-2.6zm.5-4.2h1.6V3.2h-1.6v1.1z" />
      <path fill={fill(active)} d="M2 21.5h21v1.2H2z" />
    </svg>
  );
}

export function IconKashmir({ active }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden>
      <path
        fill={fill(active)}
        d="M4.2 14.5c1.8-1.2 4-1.9 8.3-1.9s6.5.7 8.3 1.9l-1.1 1.3c-1.5-.9-3.6-1.4-7.2-1.4s-5.7.5-7.2 1.4l-1.1-1.3z"
      />
      <path fill={fill(active)} d="M6 17.2c1.4-.7 3.3-1.1 6.5-1.1s5.1.4 6.5 1.1l-.9 1.2c-1.2-.5-2.8-.8-5.6-.8s-4.4.3-5.6.8l-.9-1.2z" />
      <path fill={fill(active)} d="M8.5 9.2c0-2.2 1.8-3.8 4-3.8s4 1.6 4 3.8c0 1.4-.7 2.4-1.6 3.3h-4.8c-.9-.9-1.6-1.9-1.6-3.3zm2.2 2h3.6c.5-.6.8-1.2.8-2 0-1.2-.9-2.2-2.6-2.2S10 8 10 9.2c0 .8.3 1.4.7 2z" />
      <path fill={fill(active)} d="M3.5 20.8h18v1.2h-18z" />
    </svg>
  );
}

export function IconRajasthan({ active }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden>
      <path fill={fill(active)} d="M4.5 20.5V10.2l4-3.5 4 5.2 4-6.4 4 4.7v10.3H4.5z" />
      <path fill={fill(active)} d="M10.2 20.5v-5.2h4.6v5.2h-4.6zm1.2-1.3h2.2v-2.6h-2.2v2.6z" />
      <path fill={fill(active)} d="M11.8 5.2 12.5 3l.7 2.2H11.8z" />
      <path fill={fill(active)} d="M3 21.5h19v1.2H3z" />
    </svg>
  );
}

export function IconHimachal({ active }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden>
      <path fill={fill(active)} d="M2.8 20.8 9.2 8.5l3.5 5.2L16 6.8l6.2 14H2.8z" />
      <path fill={fill(active)} d="M12.5 4.2 13.4 6h-1.8l.9-1.8z" />
      <path fill={fill(active)} d="M2 21.8h21v1.1H2z" />
    </svg>
  );
}

export function IconAndaman({ active }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden>
      <circle cx="12.5" cy="11" r="4.2" fill={fill(active)} />
      <path
        fill={fill(active)}
        d="M3.5 17.2c2.1-1 4.5-1.5 9-1.5s6.9.5 9 1.5l-.8 1.3c-1.8-.8-3.9-1.2-8.2-1.2s-6.4.4-8.2 1.2l-.8-1.3z"
      />
      <path
        fill={fill(active)}
        d="M4.2 20c1.8-.7 3.9-1.1 8.3-1.1s6.5.4 8.3 1.1l-.7 1.2c-1.6-.5-3.5-.8-7.6-.8s-6 .3-7.6.8L4.2 20z"
      />
    </svg>
  );
}

export function IconSpiti({ active }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden>
      <path fill={fill(active)} d="M3 20.5 9.5 9.8l3 4.4 3.2-6.6L22 20.5H3z" />
      <rect x="11.2" y="12.2" width="2.6" height="5.5" rx="0.3" fill="#fff" opacity="0.9" />
      <path fill={fill(active)} d="M2 21.5h21v1.2H2z" />
    </svg>
  );
}

export function IconSikkim({ active }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden>
      <path fill={fill(active)} d="M4 20.2 10.2 9.5l2.8 4 3.5-7.2L21 20.2H4z" />
      <path fill={fill(active)} d="M8.5 7.2h1.2l.6 2.4H7.9l.6-2.4zm6.2-1.5h1.2l.6 2.4h-2.4l.6-2.4z" />
      <path fill={fill(active)} d="M3 21.2h19v1.2H3z" />
    </svg>
  );
}

export function IconUttarakhand({ active }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden>
      <path fill={fill(active)} d="M12.5 4.5 14 8.2h3.8l-3 2.3 1.1 3.8-3.9-2.4-3.9 2.4 1.1-3.8-3-2.3H11l1.5-3.7z" />
      <path fill={fill(active)} d="M5 20.5h15v1.3H5zM7.5 17.8h10v2.2h-10z" />
    </svg>
  );
}

export const destinationIcons: Record<string, (p: IconProps) => ReactElement> = {
  Explore: IconExplore,
  Goa: IconGoa,
  Kerala: IconKerala,
  Ladakh: IconLadakh,
  Kashmir: IconKashmir,
  Rajasthan: IconRajasthan,
  Himachal: IconHimachal,
  Andaman: IconAndaman,
  Spiti: IconSpiti,
  Sikkim: IconSikkim,
  Uttarakhand: IconUttarakhand,
};

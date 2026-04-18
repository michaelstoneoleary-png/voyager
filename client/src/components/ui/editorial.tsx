import * as React from "react"
import { cn } from "@/lib/utils"

// ─── Eyebrow ──────────────────────────────────────────────────────────────────
// Sans, 10.5px, 0.2em tracking, uppercase — above titles and section headings

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function Eyebrow({ className, ...props }: EyebrowProps) {
  return (
    <span
      className={cn(
        "block text-[10.5px] font-medium tracking-[0.2em] uppercase",
        "text-[color:var(--ink-muted)]",
        className
      )}
      {...props}
    />
  )
}

// ─── Kicker ───────────────────────────────────────────────────────────────────
// Mono, 10.5px, 0.22em — section labels like "DAY 03 · BELGRADE"

interface KickerProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function Kicker({ className, ...props }: KickerProps) {
  return (
    <span
      className={cn(
        "block text-[10.5px] tracking-[0.22em] uppercase",
        "[font-family:var(--mono)] text-[color:var(--ink-muted)]",
        className
      )}
      {...props}
    />
  )
}

// ─── DropCap ──────────────────────────────────────────────────────────────────
// Ornamental first-letter for intro paragraphs. Wrap a <p> with this.

interface DropCapProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function DropCap({ className, ...props }: DropCapProps) {
  return (
    <p
      className={cn("drop-cap leading-relaxed text-[15px]", className)}
      {...props}
    />
  )
}

// ─── Masthead ─────────────────────────────────────────────────────────────────
// Full-width page header: eyebrow/meta row, display serif title, optional dek, rule

interface MastheadProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: string
  meta?: string
  title: string
  titleItalic?: boolean
  dek?: string
}

export function Masthead({
  eyebrow,
  meta,
  title,
  titleItalic = false,
  dek,
  className,
  ...props
}: MastheadProps) {
  return (
    <header className={cn("mb-10", className)} {...props}>
      {(eyebrow || meta) && (
        <div className="flex items-center justify-between mb-3">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {meta && <Kicker>{meta}</Kicker>}
        </div>
      )}
      <h1
        className={cn(
          "[font-family:var(--serif)] text-[clamp(40px,5vw,72px)] font-medium tracking-[-0.03em] leading-[1.0]",
          "text-[color:var(--ink)] mb-0",
          titleItalic && "italic"
        )}
      >
        {title}
      </h1>
      {dek && (
        <p className="mt-3 [font-family:var(--serif)] text-[19px] italic tracking-[-0.01em] leading-[1.4] text-[color:var(--ink-soft)]">
          {dek}
        </p>
      )}
      <div className="mt-5 h-px w-full bg-[color:var(--rule)]" />
    </header>
  )
}

// ─── EditorialCard ────────────────────────────────────────────────────────────
// Image-first card: 3:4/4:5 image ratio, numbered eyebrow, serif title, dek

interface EditorialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  image: string
  imageAlt?: string
  number?: number
  category?: string
  title: string
  dek?: string
  country?: string
  ratio?: "3/4" | "4/5"
}

export function EditorialCard({
  image,
  imageAlt = "",
  number,
  category,
  title,
  dek,
  country,
  ratio = "3/4",
  className,
  ...props
}: EditorialCardProps) {
  return (
    <div className={cn("group flex flex-col gap-3 cursor-pointer", className)} {...props}>
      <div
        className={cn(
          "overflow-hidden rounded-[14px] w-full",
          ratio === "3/4" ? "aspect-[3/4]" : "aspect-[4/5]"
        )}
      >
        <img
          src={image}
          alt={imageAlt}
          className="h-full w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        {(number !== undefined || category) && (
          <Eyebrow>
            {number !== undefined ? `\u2116\u00a0${String(number).padStart(2, "0")}` : ""}
            {number !== undefined && category ? " \u00b7 " : ""}
            {category ?? ""}
          </Eyebrow>
        )}
        <h3 className="[font-family:var(--serif)] text-[22px] font-medium tracking-[-0.02em] leading-[1.1] text-[color:var(--ink)]">
          {title}
        </h3>
        {country && (
          <span className="[font-family:var(--serif)] text-[14px] italic text-[color:var(--ink-soft)]">
            {country}
          </span>
        )}
        {dek && (
          <p className="text-[15px] leading-[1.5] text-[color:var(--ink-soft)] line-clamp-2">
            {dek}
          </p>
        )}
      </div>
    </div>
  )
}

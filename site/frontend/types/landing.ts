export interface FeatureItem {
  title: string
  description: string
  tag: string
}

export interface MetricItem {
  value: string
  label: string
}

export interface StepItem {
  title: string
  description: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface FooterLink {
  label: string
  href: string
}

export interface LeadPayload {
  name: string
  company: string
  contact: string
  message: string
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  referrer?: string | null
  landing_path?: string | null
  website?: string | null
}

export interface CtaClickPayload {
  source: string
  target_url: string
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  referrer?: string | null
}

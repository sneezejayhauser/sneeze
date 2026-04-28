import { z } from "zod";

// Article validation schema
export const NewsArticleSchema = z.object({
  title: z.string().min(1).max(500),
  category: z.string().min(1).max(100),
  date: z.string(),
  excerpt: z.string().min(1).max(1000),
  tags: z.array(z.string()).default([]),
  author: z.string().min(1).max(200),
  read_time: z.string().min(1).max(50),
  body: z.string().min(10).max(50000),
  adminPassword: z.string().min(1),
  generation_source: z.enum(["human", "ai_draft"]).optional(),
  fact_check_status: z.enum(["pending_review", "verified"]).optional(),
});

export type NewsArticle = z.infer<typeof NewsArticleSchema>;

// Subscriber validation schema
export const NewsSubscriberSchema = z.object({
  email: z.string().email(),
});

export type NewsSubscriber = z.infer<typeof NewsSubscriberSchema>;

// Admin verify validation schema
export const AdminVerifySchema = z.object({
  adminPassword: z.string().min(1),
});

export type AdminVerify = z.infer<typeof AdminVerifySchema>;

// Article delete validation schema
export const DeleteArticleSchema = z.object({
  adminPassword: z.string().min(1),
});

export type DeleteArticle = z.infer<typeof DeleteArticleSchema>;

export const NewsletterIssueSchema = z.object({
  week_start: z.string(),
  week_end: z.string(),
  status: z.enum(["draft", "approved", "sent"]).default("draft"),
  subject: z.string().min(1),
  preheader: z.string().default(""),
  html: z.string().min(1),
  text: z.string().min(1),
});

export type NewsletterIssue = z.infer<typeof NewsletterIssueSchema>;

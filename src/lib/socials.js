import { Facebook, Instagram, Youtube, Twitter, Send, MessageCircle, Music2, Hash, Globe } from "lucide-react";

export const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { key: "telegram", label: "Telegram", Icon: Send },
  { key: "youtube", label: "YouTube", Icon: Youtube },
  { key: "tiktok", label: "TikTok", Icon: Music2 },
  { key: "twitter", label: "X / Twitter", Icon: Twitter },
  { key: "discord", label: "Discord", Icon: Hash },
  { key: "website", label: "Website / Lainnya", Icon: Globe },
];

export const socialIcon = (key) =>
  (SOCIAL_PLATFORMS.find((p) => p.key === key) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1]).Icon;

export type UserRole = 'attendee' | 'speaker' | 'exhibitor' | 'sponsor';

export type EventStatus = 'active' | 'draft' | 'archived';

export type AdminRole = 'Superadmin' | 'Event Admin' | 'Viewer';

export interface EventTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradient: string;
  fontFamily: string;
  bannerStyle: 'gradient' | 'minimal' | 'cyber' | 'aurora' | 'executive';
}

export interface TextPositioning {
  nameY: number;
  titleY: number;
  companyY: number;
  roleBadgeY: number;
  textColor: string;
  alignment: 'left' | 'center' | 'right';
  showQrCode: boolean;
  showVenue: boolean;
  showDate: boolean;
  
  // NEW TYPOGRAPHY FIELDS
  nameFontSize?: number;
  nameColor?: string;
  nameUseGradient?: boolean;
  subTextFontSize?: number;
  subTextColor?: string;
  subTextY?: number;
}

export interface EventTemplateConfig {
  attendeeHeadline: string;
  speakerHeadline: string;
  exhibitorHeadline: string;
  sponsorHeadline: string;
  overlayStyle: 'card' | 'banner-bottom' | 'pill-badge' | 'glass-card';
  textPositioning: TextPositioning;
}

export interface EventItem {
  id: string; 
  _id?: string;
  name: string;
  slug: string;
  tagline: string;
  dates: string; 
  startDate: string; // NEW: ISO DateTime for the countdown timer
  venue: string;
  website: string;
  status: 'active' | 'draft' | 'archived';
  attendeeCount: number;
  postersCount: number;
  sharesCount: number;
  emvValue: number;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    gradient: string;
    fontFamily: string;
    bannerStyle: 'gradient' | 'minimal' | 'cyber' | 'aurora' | 'executive' | 'custom';
  };
  templateConfig: any;
  sponsors: any[];
  customFrames?: { _id?: string; id?: string; label: string; url: string }[];
}

export interface AttendeeBadgeData {
  name: string;
  title: string;
  company: string;
  role: UserRole;
  avatarUrl: string;
  scale: number;
  panX: number;
  panY: number;
  rotation: number;
  // Role specific
  sessionTitle?: string;
  boothNumber?: string;
  sponsorTier?: string;
  customQuote?: string;
  themeStyle: 'gradient' | 'minimal' | 'cyber' | 'aurora' | 'executive';
  customFrameUrl?: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  stage: string;
  timestamp: string;
  photographer: string;
  attendeeTags: string[];
  faceTokens: string[]; // for face matching simulation
  matchScore?: number;
  isFavorite?: boolean;
}

export interface AttendeeBadgeData {
  leadId?: string; // Stored when the backend creates the lead
  name: string;
  email: string;  // Added
  mobile: string; // Added
  title: string;
  company: string;
  role: 'attendee' | 'speaker' | 'exhibitor' | 'sponsor';
  avatarUrl: string;
  scale: number;
  panX: number;
  panY: number;
  rotation: number;
  customQuote?: string;
  themeStyle?: 'gradient' | 'minimal' | 'cyber' | 'aurora' | 'executive' | 'custom';
  customFrameUrl?: string; // Maps to uploaded frame URL
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar: string;
  status: 'Active' | 'Invited';
  lastActive: string;
}

export interface IntegrationService {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: 'CRM' | 'Event Registration' | 'Automation';
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync?: string;
  recordsSynced?: number;
  apiKey?: string;
  webhookUrl?: string;
  syncFrequency?: 'Real-time' | 'Hourly' | 'Daily';
}

export interface DailyAnalyticsPoint {
  date: string;
  posters: number;
  shares: number;
  reach: number;
  emv: number;
}

export interface AttendeeLead {
  id: string;
  name: string;
  email: string;
  mobile?: string; // Added
  title: string;
  company: string;
  role: string;
  platformsShared: string[];
  platformShared: string;
  downloadsCount: number;
  sharesCount: number;
  createdAt: string;
  badgeThumbnail: string;
}

export interface EventMoment {
  _id: string;
  id?: string;
  imageUrl: string;
  title: string;
  location: string;
  timeString: string;
  credit: string;
  identifiedPeople: string[];
  createdAt: string;
}
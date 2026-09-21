import { EventItem, AttendeeBadgeData, GalleryPhoto, AttendeeLead, TeamMember, IntegrationService, DailyAnalyticsPoint } from '../types';

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    name: 'SaaSUnleash 2026 Global Summit',
    slug: 'saasunleash-2026',
    tagline: 'The premier conference for B2B founders, revenue leaders, and product innovators.',
    dates: 'October 14–16, 2026',
    venue: 'Moscone West Convention Center',
    location: 'San Francisco, CA',
    status: 'active',
    website: 'https://saasunleash.example.com',
    attendeeCount: 4850,
    postersCount: 3410,
    sharesCount: 8940,
    emvValue: 247850,
    theme: {
      primaryColor: '#0ea5e9',
      secondaryColor: '#10b981',
      accentColor: '#0284c7',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
      fontFamily: 'Plus Jakarta Sans',
      bannerStyle: 'gradient'
    },
    templateConfig: {
      attendeeHeadline: "I'M ATTENDING",
      speakerHeadline: 'FEATURED SPEAKER',
      exhibitorHeadline: 'VISIT OUR BOOTH',
      sponsorHeadline: 'PROUD SPONSOR',
      overlayStyle: 'card',
      textPositioning: {
        nameY: 820,
        titleY: 875,
        companyY: 920,
        roleBadgeY: 760,
        textColor: '#ffffff',
        alignment: 'center',
        showQrCode: true,
        showVenue: true,
        showDate: true
      }
    },
    sponsors: [
      { name: 'Stripe', tier: 'Platinum', logoText: 'STRIPE' },
      { name: 'Datadog', tier: 'Platinum', logoText: 'DATADOG' },
      { name: 'HubSpot', tier: 'Gold', logoText: 'HUBSPOT' },
      { name: 'Vercel', tier: 'Gold', logoText: 'VERCEL' },
      { name: 'Supabase', tier: 'Silver', logoText: 'SUPABASE' },
      { name: 'Linear', tier: 'Silver', logoText: 'LINEAR' }
    ]
  },
  {
    id: 'evt-2',
    name: 'DevPulse Conf 2026',
    slug: 'devpulse-2026',
    tagline: 'Deep technical tracks on distributed systems, AI infrastructure, and cloud native architectures.',
    dates: 'November 4–6, 2026',
    venue: 'Austin Convention Center',
    location: 'Austin, TX',
    status: 'active',
    website: 'https://devpulse.example.com',
    attendeeCount: 3200,
    postersCount: 2150,
    sharesCount: 5430,
    emvValue: 154200,
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#a855f7',
      accentColor: '#4f46e5',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      fontFamily: 'Plus Jakarta Sans',
      bannerStyle: 'cyber'
    },
    templateConfig: {
      attendeeHeadline: 'GOING TO DEVPULSE',
      speakerHeadline: 'CATCH MY TALK',
      exhibitorHeadline: 'EXPLORE OUR TECH',
      sponsorHeadline: 'TECH SPONSOR',
      overlayStyle: 'banner-bottom',
      textPositioning: {
        nameY: 830,
        titleY: 885,
        companyY: 930,
        roleBadgeY: 770,
        textColor: '#ffffff',
        alignment: 'center',
        showQrCode: true,
        showVenue: true,
        showDate: true
      }
    },
    sponsors: [
      { name: 'AWS', tier: 'Platinum', logoText: 'AWS' },
      { name: 'MongoDB', tier: 'Gold', logoText: 'MONGODB' },
      { name: 'Postman', tier: 'Gold', logoText: 'POSTMAN' }
    ]
  },
  {
    id: 'evt-3',
    name: 'AI Innovate World Expo',
    slug: 'ai-innovate-2026',
    tagline: 'Next-generation frontier AI models, autonomous agents, and enterprise deployments.',
    dates: 'December 2–4, 2026',
    venue: 'Javits Center',
    location: 'New York, NY',
    status: 'draft',
    website: 'https://aiinnovate.example.com',
    attendeeCount: 6500,
    postersCount: 840,
    sharesCount: 1980,
    emvValue: 56430,
    theme: {
      primaryColor: '#059669',
      secondaryColor: '#0d9488',
      accentColor: '#047857',
      gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
      fontFamily: 'Plus Jakarta Sans',
      bannerStyle: 'aurora'
    },
    templateConfig: {
      attendeeHeadline: 'ATTENDING AI INNOVATE',
      speakerHeadline: 'KEYNOTE SPEAKER',
      exhibitorHeadline: 'AGENT SHOWCASE BOOTH',
      sponsorHeadline: 'AI LEADERSHIP SPONSOR',
      overlayStyle: 'pill-badge',
      textPositioning: {
        nameY: 820,
        titleY: 875,
        companyY: 920,
        roleBadgeY: 760,
        textColor: '#ffffff',
        alignment: 'center',
        showQrCode: true,
        showVenue: true,
        showDate: true
      }
    },
    sponsors: [
      { name: 'NVIDIA', tier: 'Platinum', logoText: 'NVIDIA' },
      { name: 'Google Cloud', tier: 'Platinum', logoText: 'GOOGLE CLOUD' }
    ]
  }
];

export const SAMPLE_PORTRAITS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80'
];

export const DEFAULT_ATTENDEE_BADGE: AttendeeBadgeData = {
  name: 'Elena Rostova',
  title: 'VP of Product Growth',
  company: 'Synthetix AI',
  role: 'attendee',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  scale: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
  sessionTitle: 'Scaling B2B Self-Serve to $50M ARR: Playbooks & Pitfalls',
  boothNumber: 'Booth #412 (Innovation Pavilion)',
  sponsorTier: 'Platinum Partner',
  customQuote: 'Can’t wait to connect with founders and product leaders in SF!',
  themeStyle: 'gradient'
};

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'p-1',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
    title: 'Opening Keynote: State of Enterprise AI',
    stage: 'Main Grand Ballroom',
    timestamp: 'Day 1 • 09:45 AM',
    photographer: 'Marcus Chen Photography',
    attendeeTags: ['Elena Rostova', 'David Vance', 'Sarah Jenkins'],
    faceTokens: ['face-elena', 'face-david']
  },
  {
    id: 'p-2',
    url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80',
    title: 'Product Leadership Panel Discussion',
    stage: 'Stage B (Scale Stage)',
    timestamp: 'Day 1 • 11:30 AM',
    photographer: 'Aria Visuals',
    attendeeTags: ['Elena Rostova', 'Priya Patel'],
    faceTokens: ['face-elena', 'face-priya']
  },
  {
    id: 'p-3',
    url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80',
    title: 'VIP Executive Luncheon & Networking',
    stage: 'Rooftop Terrace',
    timestamp: 'Day 1 • 01:15 PM',
    photographer: 'Aria Visuals',
    attendeeTags: ['Elena Rostova', 'Michael Chang', 'Sofia Ramos'],
    faceTokens: ['face-elena', 'face-michael']
  },
  {
    id: 'p-4',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80',
    title: 'Audience Q&A on Plg Infrastructure',
    stage: 'Breakout Hall 4',
    timestamp: 'Day 2 • 10:20 AM',
    photographer: 'Marcus Chen Photography',
    attendeeTags: ['Liam O’Connor', 'Elena Rostova'],
    faceTokens: ['face-elena', 'face-liam']
  },
  {
    id: 'p-5',
    url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80',
    title: 'Expo Floor Hands-on Lab & Demos',
    stage: 'Expo Hall (Aisle 3)',
    timestamp: 'Day 2 • 02:40 PM',
    photographer: 'DevLens Media',
    attendeeTags: ['Rachel Green', 'Tom Hollander'],
    faceTokens: ['face-other-1']
  },
  {
    id: 'p-6',
    url: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=600&q=80',
    title: 'Founders Fireside Chat',
    stage: 'Main Grand Ballroom',
    timestamp: 'Day 2 • 04:15 PM',
    photographer: 'Aria Visuals',
    attendeeTags: ['Alex Rivera', 'Elena Rostova'],
    faceTokens: ['face-elena', 'face-alex']
  },
  {
    id: 'p-7',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80',
    title: 'SaaSUnleash Gala & After Hours Social',
    stage: 'The Mint SF',
    timestamp: 'Day 2 • 08:30 PM',
    photographer: 'Aria Visuals',
    attendeeTags: ['Elena Rostova', 'Kenji Sato', 'Emma Watson'],
    faceTokens: ['face-elena', 'face-kenji']
  },
  {
    id: 'p-8',
    url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80',
    title: 'Closing Plenary & SaaS Awards 2026',
    stage: 'Main Grand Ballroom',
    timestamp: 'Day 3 • 03:00 PM',
    photographer: 'Marcus Chen Photography',
    attendeeTags: ['Elena Rostova', 'Samantha Ray'],
    faceTokens: ['face-elena', 'face-samantha']
  }
];

export const ATTENDEE_LEADS: AttendeeLead[] = [
  {
    id: 'lead-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@synthetix.ai',
    title: 'VP of Product Growth',
    company: 'Synthetix AI',
    role: 'attendee',
    platformShared: 'LinkedIn',
    downloadsCount: 3,
    sharesCount: 4,
    createdAt: '2026-10-14 10:14 AM',
    badgeThumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'lead-2',
    name: 'Marcus Vance',
    email: 'marcus@cloudmetrics.io',
    title: 'Chief Technology Officer',
    company: 'CloudMetrics Inc.',
    role: 'speaker',
    platformShared: 'X',
    downloadsCount: 5,
    sharesCount: 8,
    createdAt: '2026-10-14 09:30 AM',
    badgeThumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'lead-3',
    name: 'Priya Patel',
    email: 'ppatel@databridge.dev',
    title: 'Head of Developer Relations',
    company: 'DataBridge',
    role: 'exhibitor',
    platformShared: 'LinkedIn',
    downloadsCount: 4,
    sharesCount: 6,
    createdAt: '2026-10-14 11:45 AM',
    badgeThumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'lead-4',
    name: 'Harrison Sterling',
    email: 'h.sterling@stripe.com',
    title: 'Enterprise Partnerships Lead',
    company: 'Stripe',
    role: 'sponsor',
    platformShared: 'LinkedIn',
    downloadsCount: 2,
    sharesCount: 3,
    createdAt: '2026-10-14 08:20 AM',
    badgeThumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'lead-5',
    name: 'Chloe Tremblay',
    email: 'chloe@growthorbit.co',
    title: 'Founder & CEO',
    company: 'GrowthOrbit',
    role: 'speaker',
    platformShared: 'X',
    downloadsCount: 6,
    sharesCount: 9,
    createdAt: '2026-10-14 02:10 PM',
    badgeThumbnail: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'lead-6',
    name: 'Kenji Takahashi',
    email: 'ktakahashi@hypernode.jp',
    title: 'Principal Architect',
    company: 'HyperNode Systems',
    role: 'attendee',
    platformShared: 'WhatsApp',
    downloadsCount: 1,
    sharesCount: 2,
    createdAt: '2026-10-15 09:12 AM',
    badgeThumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'lead-7',
    name: 'Amara Okafor',
    email: 'amara@frontierai.africa',
    title: 'Research Scientist',
    company: 'Frontier AI Lab',
    role: 'attendee',
    platformShared: 'Direct Download',
    downloadsCount: 2,
    sharesCount: 1,
    createdAt: '2026-10-15 01:25 PM',
    badgeThumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80'
  }
];

export const DAILY_ANALYTICS: DailyAnalyticsPoint[] = [
  { date: 'Oct 08', posters: 210, shares: 480, reach: 48000, emv: 13680 },
  { date: 'Oct 09', posters: 340, shares: 720, reach: 76000, emv: 21660 },
  { date: 'Oct 10', posters: 520, shares: 1150, reach: 122000, emv: 34770 },
  { date: 'Oct 11', posters: 680, shares: 1540, reach: 168000, emv: 47880 },
  { date: 'Oct 12', posters: 890, shares: 2100, reach: 242000, emv: 68970 },
  { date: 'Oct 13', posters: 1240, shares: 3200, reach: 350000, emv: 99750 },
  { date: 'Oct 14', posters: 1410, shares: 4250, reach: 490000, emv: 139650 }
];

export const PLATFORM_DISTRIBUTION = [
  { platform: 'LinkedIn', sharePercentage: 62, shares: 5542, reachEstimate: 580000, engagement: '4.8%' },
  { platform: 'X / Twitter', sharePercentage: 22, shares: 1966, reachEstimate: 210000, engagement: '3.2%' },
  { platform: 'WhatsApp', sharePercentage: 11, shares: 983, reachEstimate: 54000, engagement: '8.4%' },
  { platform: 'Instagram Stories', sharePercentage: 5, shares: 449, reachEstimate: 45000, engagement: '6.1%' }
];

export const ROLE_DISTRIBUTION = [
  { role: 'Attendees', count: 2410, percentage: 70.6, color: '#0ea5e9' },
  { role: 'Speakers', count: 180, percentage: 5.3, color: '#a855f7' },
  { role: 'Exhibitors', count: 620, percentage: 18.2, color: '#10b981' },
  { role: 'Sponsors', count: 200, percentage: 5.9, color: '#f59e0b' }
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Sarah Bansal (You)',
    email: 'saradbansal25@gmail.com',
    role: 'Superadmin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    status: 'Active',
    lastActive: 'Just now'
  },
  {
    id: 'tm-2',
    name: 'Julian Mercer',
    email: 'julian@eventcards.io',
    role: 'Event Admin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    status: 'Active',
    lastActive: '24 mins ago'
  },
  {
    id: 'tm-3',
    name: 'Clara Oswald',
    email: 'clara@eventcards.io',
    role: 'Event Admin',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    status: 'Active',
    lastActive: '3 hours ago'
  },
  {
    id: 'tm-4',
    name: 'Devin Thorne',
    email: 'devin@growthmedia.agency',
    role: 'Viewer',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80',
    status: 'Invited',
    lastActive: 'Pending accept'
  }
];

export const INTEGRATIONS_LIST: IntegrationService[] = [
  {
    id: 'hubspot',
    name: 'HubSpot Marketing Hub',
    description: 'Automatically create & update contacts when attendees generate advocacy badges. Tag with custom event properties.',
    logo: 'HubSpot',
    category: 'CRM',
    status: 'connected',
    lastSync: '10 mins ago',
    recordsSynced: 2840,
    apiKey: 'pat-na1-••••••••-••••-482a-a921-992384',
    syncFrequency: 'Real-time'
  },
  {
    id: 'salesforce',
    name: 'Salesforce Sales Cloud',
    description: 'Sync high-value speaker and attendee leads directly into campaigns, leads, and opportunity pipelines.',
    logo: 'Salesforce',
    category: 'CRM',
    status: 'connected',
    lastSync: '1 hour ago',
    recordsSynced: 1250,
    apiKey: '00D5e00000••••••••!AR8AQ',
    syncFrequency: 'Hourly'
  },
  {
    id: 'cvent',
    name: 'Cvent Event Management',
    description: 'Two-way integration with Cvent registrant database to pre-populate attendee badges with official badge types.',
    logo: 'Cvent',
    category: 'Event Registration',
    status: 'connected',
    lastSync: '35 mins ago',
    recordsSynced: 4850,
    apiKey: 'cv_live_sec_••••••••••••',
    syncFrequency: 'Real-time'
  },
  {
    id: 'luma',
    name: 'Luma Events',
    description: 'Pull guest lists from Luma calendars and send automated badge creation invitations via SMS & WhatsApp.',
    logo: 'Luma',
    category: 'Event Registration',
    status: 'disconnected',
    syncFrequency: 'Real-time'
  },
  {
    id: 'zapier',
    name: 'Zapier & Webhooks',
    description: 'Dispatch real-time webhooks on badge download, social share, and AI face match events to 5,000+ apps.',
    logo: 'Zapier',
    category: 'Automation',
    status: 'connected',
    lastSync: 'Real-time (Active listener)',
    recordsSynced: 8940,
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/9482104/b39d10',
    syncFrequency: 'Real-time'
  }
];

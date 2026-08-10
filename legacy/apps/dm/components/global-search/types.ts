export interface LiveClient {
  _id: string;
  name: string;
  businessName: string;
  status: string;
}

export interface LiveCampaign {
  _id: string;
  campaignName: string;
  platform: string;
  status: string;
  clientId?: { businessName?: string };
}

export interface LiveLead {
  _id: string;
  name: string;
  email?: string;
  status: string;
  clientId?: { businessName?: string };
}

export interface LiveTask {
  _id: string;
  title: string;
  status: string;
  priority: string;
}

export interface LiveReview {
  _id: string;
  shortLabel: string;
  status: string;
}

export interface LiveContent {
  _id: string;
  title: string;
  category: string;
  platform?: string;
}

export interface LiveResults {
  clients: LiveClient[];
  campaigns: LiveCampaign[];
  leads: LiveLead[];
  tasks: LiveTask[];
  reviews: LiveReview[];
  content: LiveContent[];
}

export interface SearchItem {
  name: string;
  href: string;
  group: string;
  icon: React.ElementType;
  keywords?: string;
  /** Hidden from search unless user is admin */
  adminOnly?: boolean;
}

export interface Group {
  name: string;
  icon: React.ElementType;
  description: string;
}


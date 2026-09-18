export interface Person {
  id: string;
  name: string;
  email: string | null;
  gradYear: number;
}

/** 0=Hate, 1=Don't know each other, 2=Classmates, 3=Friends, 4=Better friends, 5=Good friends */
export type ConnectionWeight = 0 | 1 | 2 | 3 | 4 | 5;

export interface Connection {
  a: string;
  b: string;
  weight: ConnectionWeight;
  label: string;
}

export interface CommunityMeta {
  index: number;
  size: number;
  colorHex: string;
}

export interface CommunitiesFile {
  generatedAt: string;
  modularity: number;
  communities: Record<string, number>;
  communityMeta: CommunityMeta[];
}

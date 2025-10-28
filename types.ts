
export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  book: string;
  chapter: number;
  // FIX: Added optional `verse` property to the JournalEntry type. This property is used in the JournalForm for user input and for creating the entry title, but was missing from the type definition, causing multiple errors.
  verse?: string;
  // FIX: Added optional `title` property to the JournalEntry type. A title is generated and added to the entry upon saving in JournalPage, but this property was missing from the type, causing a display error.
  title?: string;
  highlights: string;
  godMessage: string;
  completed: boolean;
  likes: number;
  liked: boolean;
  comments: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string; // ISO string for date
}

export interface PrayerItem {
  id:string;
  title:string;
  person:string;
  content:string;
  prayerDate:string; // YYYY-MM-DD
  answered:boolean;
  answeredDate?:string; // YYYY-MM-DD
  godsResponse?:string;
  likes:number;
  liked:boolean;
  comments:Comment[];
}

export interface BibleBook {
  name: string;
  chapters: number;
  testament: 'Old' | 'New';
}

export interface JesusSaidCard {
  id: string;
  date: string; // YYYY-MM-DD
  verse: string;
  message: string;
  prayer: string;
}

export interface JesusSaidData {
  verse: string;
  message: string;
  prayer: string;
}

export interface MessageNote {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  speaker: string;
  content: string;
  tags: string[];
}

export interface SmallGroupShare {
  id: string;
  date: string; // YYYY-MM-DD
  groupName: string;
  book: string;
  chapter: number;
  verse: string;
  topic: string;
  myShare: string;
}

export interface BiblePlanDay {
  day: number;
  scripture: string;
  title: string;
  introduction: string;
  scriptureText: string;
  prayer: string;
}

export interface BiblePlan {
  id: string;
  title: string;
  description: string;
  duration: number;
  days: BiblePlanDay[];
  themeColor: string;
  icon: string;
}

// FIX: Add SituationalPrayer type for use in DashboardPage (INeedYouPage).
export interface SituationalPrayer {
  id: string;
  date: string; // YYYY-MM-DD
  situation: string;
  prayer: string;
}

// FIX: Add QuickReadEntry type for use in QuickReadPage.
export interface QuickReadEntry {
  id: string;
  date: string; // YYYY-MM-DD
  userInput: string;
  analysis: string;
  application: string;
  prayer: string;
}
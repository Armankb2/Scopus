export interface FacultyItem {
  name: string;
  scopus_id: string;
  scholar_id: string;
}

export interface PublicationRow {
  sl_no: number | string;
  author?: string;
  coauthor?: string;
  "Journal Paper Title"?: string;
  JournalTitle?: string;
  JournalName?: string;
  Volume?: string;
  Issue?: string;
  Pages?: string;
  ArticleNumber?: string;
  DateOfPublication?: string;
  Year?: string | number;
  DOI?: string;
  Publisher?: string;
  SJR?: string;
  Quartile?: string;
  NumberOfCitations?: string | number;
  IsConference?: string;
  ConferenceDate?: string;
  ConferenceLocation?: string;
  URL?: string;
  h_index?: string;
  i10_index?: string;
  total_citations?: string;
  document_count?: string;
  ScopusVerified?: string;
  ORCID?: string;
  [key: string]: any;
}

export interface PortfolioMetrics {
  h_index: string;
  i10_index: string;
  total_citations: string;
  document_count: string;
  total_publications: number;
  verified_publications: number;
  conference_papers: number;
  journal_papers: number;
  q1_journals: number;
  q2_journals: number;
  q3_journals: number;
  q4_journals: number;
}

export interface CoauthorStat {
  name: string;
  count: number;
}

export interface FetchResponse {
  author: {
    name: string;
    scopus_id: string;
    scholar_id: string;
  };
  metrics: PortfolioMetrics;
  publications: PublicationRow[];
  csv_file: string;
  json_file: string;
  excel_file?: string;
  pdf_file?: string;
  generated_at: string;
  cached: boolean;
  top_coauthors?: CoauthorStat[];
}

export interface ProgressEvent {
  job_id: string;
  stage: string;
  progress: number;
  message: string;
  completed?: boolean;
  error?: string;
  timestamp?: number;
}

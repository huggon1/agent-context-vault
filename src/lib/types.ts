export interface Asset {
  id: string;
  title: string;
  description: string;
  tags: string[];
  scenarios: string[];
  install?: string;
  requires: string[];
  content: string;
  relativePath: string;
  resourcePaths: string[];
  sourceName: string;
  parseError?: string;
}

export interface ScanResult {
  assets: Asset[];
  missingExpectedDirectories: boolean;
  errors: ScanError[];
}

export interface ScanError {
  path: string;
  message: string;
}

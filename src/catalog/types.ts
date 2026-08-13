export type LanguageId = "csharp" | "typescript" | "javascript" | "php" | "python" | "java" | "go";
export type TechnologyId = "dotnet" | "abp" | "nestjs" | "spring" | "react-web" | "vue" | "codeigniter";
export type TechnologyKind = "framework" | "runtime" | "platform" | "library" | "database" | "tool" | "infrastructure" | "domain";
export type DetectionConfidence = "confirmed" | "probable" | "weak";
export type DetectorEcosystem = "npm" | "composer" | "nuget" | "maven" | "gradle";
export type GuideId = string;

export interface Provenance {
  source: string;
  license: string;
  adaptedAt: string;
}

export type DetectorPredicate =
  | { kind: "file"; glob: string }
  | { kind: "dependency"; ecosystem: DetectorEcosystem; name: string }
  | { kind: "content"; glob: string; contains: string };

export interface DetectorExpression {
  confidence: DetectionConfidence;
  allOf?: DetectorPredicate[] | undefined;
  anyOf?: DetectorPredicate[] | undefined;
  noneOf?: DetectorPredicate[] | undefined;
}

export interface LanguageDescriptor {
  id: LanguageId;
  label: string;
  detectors: DetectorExpression[];
  guideIds: GuideId[];
  provenance: Provenance;
}

export interface TechnologyDescriptor {
  id: TechnologyId;
  kind: TechnologyKind;
  label: string;
  detectors: DetectorExpression[];
  implies?: { languages?: LanguageId[] | undefined; technologies?: TechnologyId[] | undefined } | undefined;
  supersedes?: TechnologyId[] | undefined;
  guideIds: GuideId[];
  provenance: Provenance;
}

export interface GuideDescriptor {
  id: GuideId;
  title: string;
  description: string;
  category: "rule" | "guide" | "skill";
  appliesTo: {
    languages?: LanguageId[] | undefined;
    technologies?: TechnologyId[] | undefined;
    paths?: string[] | undefined;
    topics?: string[] | undefined;
  };
  activation: "always" | "path" | "task";
  priority: number;
  contentPath: string;
  extends?: GuideId[] | undefined;
  supersedes?: GuideId[] | undefined;
  provenance: Provenance;
}

export interface StackCatalog {
  languages: LanguageDescriptor[];
  technologies: TechnologyDescriptor[];
  guides: GuideDescriptor[];
}

export interface DetectionEvidence {
  kind: DetectorPredicate["kind"];
  path: string;
  detail: string;
}

export interface DetectionMatch {
  id: LanguageId | TechnologyId;
  facet: "language" | "technology";
  kind: "language" | TechnologyKind;
  confidence: DetectionConfidence;
  evidence: DetectionEvidence[];
  source: "catalog";
}

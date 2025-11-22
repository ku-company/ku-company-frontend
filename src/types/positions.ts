// Centralized position enum and helpers used across the app

export enum PositionEnum {
  SoftwareEngineer = "Software Engineer",
  BackendDeveloper = "Backend Developer",
  FrontendDeveloper = "Frontend Developer",
  FullstackDeveloper = "Fullstack Developer",
  MobileDeveloper = "Mobile Developer",
  IOSDeveloper = "iOS Developer",
  AndroidDeveloper = "Android Developer",
  DevOpsEngineer = "DevOps Engineer",
  SiteReliabilityEngineer = "Site Reliability Engineer",
  PlatformEngineer = "Platform Engineer",
  CloudEngineer = "Cloud Engineer",
  DataEngineer = "Data Engineer",
  DataScientist = "Data Scientist",
  MachineLearningEngineer = "Machine Learning Engineer",
  AIEngineer = "AI Engineer",
  QAEngineer = "QA Engineer",
  TestAutomationEngineer = "Test Automation Engineer",
  SecurityEngineer = "Security Engineer",
  EmbeddedSoftwareEngineer = "Embedded Software Engineer",
  FirmwareEngineer = "Firmware Engineer",
  SystemsEngineer = "Systems Engineer",
  BlockchainDeveloper = "Blockchain Developer",
  GameDeveloper = "Game Developer",
  UIEngineer = "UI Engineer",
  WebDeveloper = "Web Developer",
}

export type Position = (typeof PositionEnum)[keyof typeof PositionEnum];

export const POSITION_OPTIONS: { label: string; value: Position }[] = Object.values(PositionEnum).map(
  (v) => ({ label: v, value: v as Position })
);

export function normalizePosition(input?: string): string {
  return (input || "").replace(/_/g, " ").trim();
}


export interface ScopeOfWork {
  homeownerScope: {
    projectTitle: string;
    projectOverview: string;
    scopeItems: Array<{
      category: string;
      description: string;
      details: string[];
    }>;
    estimatedTimeline: string;
    nextSteps: string[];
  };
  contractorScope: {
    projectTitle: string;
    projectOverview: string;
    constructionPhases: Array<{
      phaseName: string;
      phaseDescription: string;
      lineItems: Array<{
        item: string;
        description: string;
        unit: string;
        estimatedQuantity?: string;
        notes?: string;
      }>;
      estimatedDuration: string;
      dependencies?: string[];
    }>;
    totalEstimatedTimeline: string;
    nextSteps: string[];
  };
  currentView?: 'homeowner' | 'contractor';
}


import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface ScopeItem {
  category: string;
  description: string;
  details: string[];
}

interface ConstructionPhase {
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
}

interface ScopeOfWork {
  projectTitle: string;
  projectOverview: string;
  scopeItems?: ScopeItem[];
  constructionPhases?: ConstructionPhase[];
  estimatedTimeline?: string;
  totalEstimatedTimeline?: string;
  nextSteps: string[];
}

interface ScopeOfWorkViewerProps {
  open: boolean;
  onClose: () => void;
  scopeOfWork: {
    homeownerScope?: ScopeOfWork;
    contractorScope?: ScopeOfWork;
    currentView?: 'homeowner' | 'contractor';
  } | null;
  sessionId?: string;
}

export const ScopeOfWorkViewer: React.FC<ScopeOfWorkViewerProps> = ({
  open,
  onClose,
  scopeOfWork,
  sessionId,
}) => {
  if (!scopeOfWork) return null;

  const isContractorScope = scopeOfWork.currentView === 'contractor';
  const currentScope = isContractorScope 
    ? scopeOfWork.contractorScope 
    : scopeOfWork.homeownerScope;

  if (!currentScope) return null;

  const formatScopeForExport = (): string => {
    let text = `${isContractorScope ? 'CONTRACTOR' : 'HOMEOWNER'} SCOPE OF WORK\n`;
    text += `Project: ${currentScope.projectTitle}\n\n`;
    text += `OVERVIEW\n${currentScope.projectOverview}\n\n`;
    
    if (isContractorScope && currentScope.constructionPhases) {
      text += `CONSTRUCTION PHASES\n`;
      currentScope.constructionPhases.forEach((phase, index) => {
        text += `${index + 1}. ${phase.phaseName}\n`;
        text += `   Description: ${phase.phaseDescription}\n`;
        text += `   Duration: ${phase.estimatedDuration}\n`;
        
        if (phase.dependencies && phase.dependencies.length > 0) {
          text += `   Dependencies: ${phase.dependencies.join(', ')}\n`;
        }
        
        text += `   Line Items:\n`;
        phase.lineItems.forEach((item, itemIndex) => {
          text += `     ${itemIndex + 1}. ${item.item}\n`;
          text += `        Description: ${item.description}\n`;
          text += `        Unit: ${item.unit}\n`;
          if (item.estimatedQuantity) {
            text += `        Estimated Quantity: ${item.estimatedQuantity}\n`;
          }
          if (item.notes) {
            text += `        Notes: ${item.notes}\n`;
          }
          text += `\n`;
        });
        text += `\n`;
      });
      
      text += `TOTAL ESTIMATED TIMELINE\n${currentScope.totalEstimatedTimeline}\n\n`;
    } else if (currentScope.scopeItems) {
      text += `PROJECT DETAILS\n`;
      currentScope.scopeItems.forEach((item, index) => {
        text += `${index + 1}. ${item.category}\n`;
        text += `   ${item.description}\n`;
        item.details.forEach((detail) => {
          text += `   • ${detail}\n`;
        });
        text += `\n`;
      });
      
      text += `ESTIMATED TIMELINE\n${currentScope.estimatedTimeline}\n\n`;
    }
    
    text += `NEXT STEPS\n`;
    currentScope.nextSteps.forEach((step, index) => {
      text += `${index + 1}. ${step}\n`;
    });
    
    return text;
  };

  const handleExport = () => {
    const scopeText = formatScopeForExport();
    const blob = new Blob([scopeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${isContractorScope ? 'contractor' : 'homeowner'}_scope_of_work_${sessionId || Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const scopeText = formatScopeForExport();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Scope of Work',
          text: scopeText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(scopeText);
      alert('Scope of work copied to clipboard!');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {isContractorScope ? 'Contractor Scope of Work' : 'Homeowner Scope of Work'}
          </Typography>
          <Box>
            <IconButton onClick={handleExport} size="small">
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={handleShare} size="small">
              <ShareIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Project Header */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                {currentScope.projectTitle}
              </Typography>
              <Chip
                icon={<ScheduleIcon />}
                label={isContractorScope ? currentScope.totalEstimatedTimeline : currentScope.estimatedTimeline}
                color="success"
                size="small"
              />
            </Box>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {currentScope.projectOverview}
            </Typography>
          </Paper>

          {/* Scope Items or Construction Phases */}
          {isContractorScope && currentScope.constructionPhases ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Construction Phases
              </Typography>
              {currentScope.constructionPhases.map((phase, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip label={index + 1} color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ flex: 1 }}>
                      {phase.phaseName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {phase.estimatedDuration}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    {phase.phaseDescription}
                  </Typography>
                  
                  {phase.dependencies && phase.dependencies.length > 0 && (
                    <Box sx={{ mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" fontWeight="bold" color="success.main">
                        Dependencies:
                      </Typography>
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {phase.dependencies.join(', ')}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Line Items:
                  </Typography>
                  {phase.lineItems.map((item, itemIndex) => (
                    <Box key={itemIndex} sx={{ mb: 1, pl: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {itemIndex + 1}. {item.item}
                        </Typography>
                        <Chip label={item.unit} size="small" sx={{ ml: 1 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        {item.description}
                      </Typography>
                      {item.estimatedQuantity && (
                        <Typography variant="caption" color="success.main" sx={{ ml: 4 }}>
                          Est. Quantity: {item.estimatedQuantity}
                        </Typography>
                      )}
                      {item.notes && (
                        <Typography variant="caption" color="warning.main" sx={{ ml: 4, fontStyle: 'italic' }}>
                          Notes: {item.notes}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Paper>
              ))}
            </Box>
          ) : currentScope.scopeItems ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                What We'll Do
              </Typography>
              {currentScope.scopeItems.map((item, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip label={index + 1} color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {item.category}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    {item.description}
                  </Typography>
                  <List dense>
                    {item.details.map((detail, detailIndex) => (
                      <ListItem key={detailIndex} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={detail}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ))}
            </Box>
          ) : null}

          {/* Next Steps */}
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              What Happens Next
            </Typography>
            <List>
              {currentScope.nextSteps.map((step, index) => (
                <ListItem key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                    <Chip
                      label={index + 1}
                      color="primary"
                      size="small"
                      sx={{ mr: 2 }}
                    />
                    <ListItemText primary={step} />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Footer */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              This scope of work is based on our consultation and may be adjusted as the project progresses.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};


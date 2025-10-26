import React from 'react';
import { Tooltip, TooltipProps } from '@mui/material';
import { useTooltips } from '../context/TooltipContext';

interface HelpTooltipProps extends Omit<TooltipProps, 'title'> {
  title: string;
  children: React.ReactElement;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ title, children, ...props }) => {
  const { tooltipsEnabled } = useTooltips();

  if (!tooltipsEnabled) {
    return children;
  }

  return (
    <Tooltip 
      title={title} 
      arrow 
      enterDelay={300}
      leaveDelay={200}
      {...props}
    >
      {children}
    </Tooltip>
  );
};

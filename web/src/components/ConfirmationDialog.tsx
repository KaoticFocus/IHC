import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface ConfirmationDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'error' | 'info';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  message,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning',
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color={severity} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined">
          {cancelText}
        </Button>
        <Button onClick={onConfirm} variant="contained" color={severity}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export function useConfirmation(): {
  confirm: (message: string, onConfirm: () => void, options?: Partial<ConfirmationDialogProps>) => void;
  ConfirmationDialog: React.FC;
} {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);
  const [options, setOptions] = useState<Partial<ConfirmationDialogProps>>({});

  const confirm = useCallback(
    (msg: string, callback: () => void, opts?: Partial<ConfirmationDialogProps>) => {
      setMessage(msg);
      setOnConfirm(() => callback);
      setOptions(opts || {});
      setIsOpen(true);
    },
    []
  );

  const handleConfirm = useCallback(() => {
    if (onConfirm) {
      onConfirm();
    }
    setIsOpen(false);
    setOnConfirm(null);
    setOptions({});
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setOnConfirm(null);
    setOptions({});
  }, []);

  const DialogComponent: React.FC = () => (
    <ConfirmationDialog
      open={isOpen}
      message={message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      {...options}
    />
  );

  return { confirm, ConfirmationDialog: DialogComponent };
}


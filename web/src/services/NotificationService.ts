import { enqueueSnackbar, OptionsObject } from 'notistack';

export class NotificationService {
  static success(message: string, options?: OptionsObject) {
    enqueueSnackbar(message, { variant: 'success', ...options });
  }

  static error(message: string, options?: OptionsObject) {
    enqueueSnackbar(message, { variant: 'error', autoHideDuration: 6000, ...options });
  }

  static warning(message: string, options?: OptionsObject) {
    enqueueSnackbar(message, { variant: 'warning', ...options });
  }

  static info(message: string, options?: OptionsObject) {
    enqueueSnackbar(message, { variant: 'info', ...options });
  }
}


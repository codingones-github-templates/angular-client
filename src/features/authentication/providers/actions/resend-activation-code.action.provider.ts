import { FactoryProvider } from '@angular/core';
import { Observable } from 'rxjs';

export type ResendActivationCodeAction = (username: string) => Observable<void>;

export const RESEND_ACTIVATION_CODE_ACTION: symbol = Symbol('authentication.resend-activation-code.action');

export const resendActivationCodeActionProvider = <TDependencies>(
  useFactory: (...providers: never[]) => ResendActivationCodeAction,
  deps: TDependencies[] = []
): FactoryProvider => ({
  provide: RESEND_ACTIVATION_CODE_ACTION,
  useFactory,
  deps
});

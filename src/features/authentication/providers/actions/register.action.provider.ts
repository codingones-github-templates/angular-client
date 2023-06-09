import { FactoryProvider } from '@angular/core';
import { Observable } from 'rxjs';

export type RegisterAction<T> = (username: string, password: string) => Observable<T>;

export const REGISTER_ACTION: symbol = Symbol('authentication.register.action');

export const registerActionProvider = <TDependencies, TResult>(
  useFactory: (...providers: never[]) => RegisterAction<TResult>,
  deps: TDependencies[] = []
): FactoryProvider => ({
  provide: REGISTER_ACTION,
  useFactory,
  deps
});

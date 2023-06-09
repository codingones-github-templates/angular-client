import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, from, map, mergeWith, Observable, Subject, switchMap, tap } from 'rxjs';
import { START_LOADING, STOP_LOADING, toInternationalFormat, whileLoading } from '../../presentation';
import {
  ACTIVATE_ACTION,
  ActivateAction,
  REDIRECT_ROUTES_PERSISTENCE,
  RedirectRoutesKeys,
  RESEND_ACTIVATION_CODE_ACTION,
  ResendActivationCodeAction
} from '../../providers';
import { ACTIVATE_FORM, setActivateErrorToForm } from './activate.form';
import { activationCodeErrorMessageFrom, formatActivateError } from './activate.presenter';

type ActivateFields = {
  code: FormControl<string>;
  username: FormControl<string>;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activate.page.html'
})
export class ActivatePage {
  private readonly _isActivating$: Subject<boolean> = new Subject<boolean>();

  private readonly _isSendingActivationCode$: Subject<boolean> = new Subject<boolean>();

  private readonly _resendActivationCodeErrorMessage$: Subject<string> = new Subject<string>();
  public readonly resendActivationCodeErrorMessage$: Observable<string> =
    this._resendActivationCodeErrorMessage$.asObservable();

  public activateForm: FormGroup<ActivateFields> = ACTIVATE_FORM;

  public username: ActivateFields['username'] = this.activateForm.controls.username;

  public code: ActivateFields['code'] = this.activateForm.controls.code;

  public readonly defaultUsername: string | null = this._route.snapshot.queryParamMap.get('username');

  public readonly defaultCode: string | null = this._route.snapshot.queryParamMap.get('code');

  private handleActivateActionError(error: Error, caught: Observable<object>): Observable<object> {
    setActivateErrorToForm(formatActivateError(error));
    this._isActivating$.next(STOP_LOADING);
    return caught;
  }

  private resendActivationCodeActionError(error: Error, caught: Observable<void>): Observable<void> {
    this._resendActivationCodeErrorMessage$.next(activationCodeErrorMessageFrom(error));
    this._isSendingActivationCode$.next(STOP_LOADING);
    return caught;
  }

  private readonly _activate$: Observable<boolean> = this._isActivating$.pipe(
    switchMap(
      whileLoading((): Observable<object> => this._activateAction$(toInternationalFormat(this.username.value), this.code.value))
    ),
    catchError(this.handleActivateActionError.bind(this)),
    tap((): Observable<boolean> => from(this._router.navigate([this._toRoutes.get('activate')]))),
    tap((): void => ACTIVATE_FORM.reset()),
    map((): boolean => STOP_LOADING)
  );

  private readonly _resendActivationCode$: Observable<boolean> = this._isSendingActivationCode$.pipe(
    switchMap(
      whileLoading((): Observable<void> => this._resendActivationCodeAction$(toInternationalFormat(this.username.value)))
    ),
    catchError(this.resendActivationCodeActionError.bind(this)),
    map((): boolean => STOP_LOADING)
  );

  public readonly isActivating$: Observable<boolean> = this._isActivating$.pipe(mergeWith(this._activate$));

  public readonly isSendingActivationCode$: Observable<boolean> = this._isSendingActivationCode$.pipe(
    mergeWith(this._resendActivationCode$)
  );

  public constructor(
    @Inject(ACTIVATE_ACTION) private readonly _activateAction$: ActivateAction,
    @Inject(RESEND_ACTIVATION_CODE_ACTION) private readonly _resendActivationCodeAction$: ResendActivationCodeAction,
    @Inject(REDIRECT_ROUTES_PERSISTENCE) private readonly _toRoutes: Map<RedirectRoutesKeys, string>,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router
  ) {
    this.defaultUsername != null && this.username.setValue(this.defaultUsername);
    this.defaultCode != null && this.code.setValue(this.defaultCode);
  }

  public onActivate = (): void => {
    ACTIVATE_FORM.markAllAsTouched();
    ACTIVATE_FORM.valid && this._isActivating$.next(START_LOADING);
  };

  public onResendActivationCode(): void {
    this._isSendingActivationCode$.next(START_LOADING);
    this._resendActivationCodeErrorMessage$.next('');
  }
}

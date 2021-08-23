import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, NgForm, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { delay, take } from 'rxjs/operators';
import { Member } from 'src/app/_models/member';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { MembersService } from 'src/app/_services/members.service';

@Component({
  selector: 'app-member-edit',
  templateUrl: './member-edit.component.html',
  styleUrls: ['./member-edit.component.css']
})
export class MemberEditComponent implements OnInit {
  @ViewChild('editForm') editForm: NgForm;
  member: Member;
  user: User;
  updatePasswordForm: FormGroup;
  validationErrors: string[] = [];
  loading: boolean = false;

  @HostListener('window:beforeunload', ['$event']) unloadNotification($event: any) {
    if (this.editForm.dirty) {
      $event.returnValue = true;
    }
  }

  constructor(private accountService: AccountService, private memberService: MembersService, private toastr: ToastrService, private fb: FormBuilder, private router: Router) { 
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user);
  }

  ngOnInit(): void {
    this.loadMember();
  }

  loadMember() {
    this.memberService.getMember(this.user.username).subscribe(member => {
      this.member = member;
      this.initializePasswordForm();
    })
  }

  updateMember() {
    this.memberService.updateMember(this.member).subscribe(()=>{
      this.toastr.success('Profile Updated Successfully');
      this.editForm.reset(this.member);
    })
  }

  initializePasswordForm() {
    this.updatePasswordForm = this.fb.group({
      userId: [this.member.id],
      currentPassword: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8), 
        Validators.maxLength(24), 
        this.patternValidator(/\d/, {hasNumber: true}), 
        this.patternValidator(/[!@#$%^&*(),.?:]/, {hasSymbol: true}), 
        this.patternValidator(/[A-Z]/, {hasUpperCase: true}), 
        this.patternValidator(/[a-z]/, {hasLowerCase: true})]],
      confirmPassword: ['', [Validators.required, this.matchValues('password')]]
    });
    this.updatePasswordForm.controls.password.valueChanges.subscribe(() => {
      this.updatePasswordForm.controls.confirmPassword.updateValueAndValidity();
    })
  }

  matchValues(matchTo: string): ValidatorFn {
    return (control: AbstractControl) => {
      return control?.value === control?.parent?.controls[matchTo].value ? null : {isMatching: true}
    }
  }

  patternValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} => {
      if (!control.value) {
        return null;
      }
      const valid = regex.test(control.value);
      return valid ? null : error;
    }
  }

  updatePassword() {
    this.accountService.updatePassword(this.updatePasswordForm.value).subscribe(response => {
      this.toastr.success('Password Updated Successfully. Redirecting...');
      this.updatePasswordForm.reset();
      this.accountService.logout();
      this.router.navigateByUrl('/');
    }, error => {
      this.validationErrors = error;
    })
  }

}
 
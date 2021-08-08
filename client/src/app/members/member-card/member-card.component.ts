import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Member } from 'src/app/_models/member';
import { MembersService } from 'src/app/_services/members.service';

@Component({
  selector: 'app-member-card',
  templateUrl: './member-card.component.html',
  styleUrls: ['./member-card.component.css']
})
export class MemberCardComponent implements OnInit {
  @Input() member: Member;

  constructor(private memberService: MembersService, private toastr: ToastrService) { }

  ngOnInit(): void {
  }

  toggleLike(member: Member) {
    if (this.member.liked === 0) {
      this.memberService.addLike(member.username).subscribe(response => {
        this.toastr.success('You have liked ' + member.knownAs);
        this.member.liked = 1;
      });
    } else {
      this.memberService.deleteLike(member.username).subscribe(response => {
        this.toastr.warning('You have unliked ' + member.knownAs);
        this.member.liked = 0;
      });
    }
  }

}

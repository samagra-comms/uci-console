import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Helper} from '../../utils/helper';
import {GlobalService} from '../../services/global.service';

@Component({
    selector: 'lib-conversation-success',
    templateUrl: './conversation-success.component.html',
    styleUrls: ['./conversation-success.component.css']
})
export class ConversationSuccessComponent implements OnInit {
    url = '';
    botId = '';

    constructor(private router: Router,
                private activatedRoute: ActivatedRoute,
                private globalService: GlobalService) {
    }

    ngOnInit(): void {
        this.url = Helper.makBotUrl(this.activatedRoute.snapshot.queryParams.text || '', this.globalService.getBotPhoneNumber());
        this.botId = this.activatedRoute.snapshot.queryParams.botId || '';
    }

    onCopy(id) {
        Helper.copyData(id);
    }

    onClose() {
        this.router.navigate(['/uci-admin']);
    }

}

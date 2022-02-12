import {Component, OnInit} from '@angular/core';
import {UciService} from '../../services/uci.service';
import {Router} from '@angular/router';
import {GlobalService} from '../../services/global.service';
import {Helper} from '../../utils/helper';

@Component({
    selector: 'lib-conversation-list',
    templateUrl: './conversation-list.component.html',
    styleUrls: ['./conversation-list.component.css']
})
export class ConversationListComponent implements OnInit {
    chatBots = [];
    pager: any = {
        totalItems: 0,
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
        startPage: 0,
        endPage: 0,
        startIndex: 0,
        endIndex: 0,
        pages: []
    };
    pageNumber = 1;
    column = '';
    sortDirection = '';
    reverse = false;
    queryParams: any;
    search;
    user;
    constructor(
        private uciService: UciService,
        private router: Router,
        private globalService: GlobalService,
    ) {
    }

    ngOnInit() {
        this.user = this.globalService.getUser();
        if (!this.user) {
            this.router.navigate(['uci-admin']);
            return;
        }
        this.getAllChatBots();
    }

    getAllChatBots() {
        const param: any = {
            page: this.pager.currentPage,
            perPage: this.pager.pageSize
        };

        if (this.search) {
            param.name = this.search;
            this.uciService.searchConversation(param).subscribe(
                data => this.parseConversations(data)
            );
        } else {
            this.uciService.fetchConversation(param).subscribe(
                data => this.parseConversations(data)
            );
        }

    }

    parseConversations(data) {
        this.chatBots = [];
        data.data.forEach(bot => {
            const obj = {...bot, segmentText: '', userCount: 0, status: bot.status || 'Draft'};
            obj.status = bot.status === 'enabled' ? 'Live' : bot.status === 'disabled' ? 'Disabled' : 'Draft';
            const segmentNames = [];
            bot.userSegments.forEach(userSegment => {
                segmentNames.push(userSegment.name);
                obj.userCount += (userSegment.count || 0);
            });
            obj.segmentText = segmentNames.join(', ');

            obj.url = Helper.makBotUrl(bot.startingMessage || '', this.globalService.getBotPhoneNumber());
            obj.botId = bot.id || '';

            this.chatBots.push(obj);
        });
        this.pager.totalItems = data.total;
        this.pager.totalPages = Math.ceil(data.total / this.pager.pageSize);
        this.pager.pages = [];
        let i = 1;
        while (i <= Math.ceil(data.total / this.pager.pageSize)) {
            this.pager.pages.push(i);
            i++;
        }
    }

    sortColumns(column) {
        this.column = column;
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.reverse = !this.reverse;
    }

    navigateToPage(page: number): undefined | void {
        if (page < 1 || page > this.pager.totalPages) {
            return;
        }
        this.pageNumber = page;
        this.pager.currentPage = page;
        this.getAllChatBots();
    }

    getSearch() {
        this.getAllChatBots();
    }

    onAddNew() {
        this.router.navigateByUrl('uci-admin/add');
    }

    onEdit(conversation) {
        this.router.navigateByUrl(`uci-admin/${conversation.id}/edit`);
    }

    onStatusChange(conversation, index) {
        if (conversation.status === 'Live') {
            this.uciService.pauseConversation(conversation.id).subscribe(
                data => {
                    this.chatBots[index].status = 'Disabled';
                }
            );
        } else {
            this.uciService.startConversation(conversation.id).subscribe(
                data => {
                    this.chatBots[index].status = 'Live';
                }
            );
        }
    }

    onDelete(conversation, index) {
        this.uciService.deleteConversation(conversation.id).subscribe(
            data => {
                this.chatBots.splice(index, 1);
            }
        );
    }

    onCopy(id) {
        Helper.copyData(id);
    }
}

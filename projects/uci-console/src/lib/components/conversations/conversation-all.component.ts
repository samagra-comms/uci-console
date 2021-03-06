import { UciService } from '../../services/uci.service';
import { Component, OnInit } from '@angular/core';
import { TelemetryUtilsService } from '../../telemetry-utils.service';
import { NSDiscussData } from '../../models/discuss.model';
import { Router } from '@angular/router';
import * as CONSTANTS from '../../common/constants.json';
/* tslint:disable */
import * as _ from 'lodash'
import { ConfigService } from '../../services/config.service';
/* tslint:enable */

@Component({
  selector: 'lib-converastion-all',
  templateUrl: './conversation-all.component.html',
  styleUrls: ['./conversation-all.component.scss']
})
export class ConversationAllComponent implements OnInit {

  data; // this is for user
  discussionList; // this is for posts
  currentFilter = 'timestamp';
  department!: string | null;
  location!: string | null;
  profilePhoto!: string;
  userInitial = '';
  showLoader = false;
  constructor(
    private UciService: UciService,
    private configService: ConfigService,
    public router: Router,
    private telemetryUtils: TelemetryUtilsService) { }

  /** To fetch user details */
  fetchUserProfile(userName) {
    this.showLoader = true;
    // this.UciService.fetchUserProfile(userName).subscribe(response => {
    //   this.showLoader = false;
    //   console.log(response);
    //   this.data = response;
    //   if (_.get(this.data, 'posts')) {
    //     this.discussionList = _.get(this.data, 'posts').filter(p => (p.isMainPost === true));
    //   }
    //   // if (this.configSvc.userProfile) {
    //   //   localStorage.setItem(this.configSvc.userProfile.userId, this.profilePhoto);
    //   // }
    // }, error => {
    //   this.showLoader = false;
    //   // TODO: Toaster
    //   console.log('error fetching user details');
    // });
  }

  ngOnInit() {
    this.telemetryUtils.setContext([]);
    this.telemetryUtils.logImpression(NSDiscussData.IPageName.MY_DISCUSSION);
    // if (this.UciService.userName) {
    //   this.fetchUserProfile(this.UciService.userName);
    // }
  }

  filter(key: string | 'timestamp' | 'best' | 'saved' | 'watched' | 'upvoted' | 'downvoted') {
    if (key) {
      this.currentFilter = key;
      switch (key) {
        case 'timestamp':
          // this.discussionList = _.uniqBy(_.filter(this.data.posts, p => _.get(p, 'isMainPost') === true), 'tid');
          this.discussionList = this.data.posts.filter(p => (p.isMainPost === true));
          break;
        case 'best':
          // this.discussionList = _.uniqBy(this.data.bestPosts, 'tid');
          this.discussionList = this.data.bestPosts;
          break;
        // case 'saved':
        //   this.UciService.fetchSaved().subscribe(response => {
        //     if (response) {
        //       // this.discussionList = _.uniqBy(response['posts'], 'tid');
        //       this.discussionList = response['posts'];
        //     } else {
        //       this.discussionList = [];
        //     }
        //   },
        //     // tslint:disable-next-line
        //     () => {
        //       this.discussionList = [];
        //     });
        //   break;
        // case 'watched':
        //   this.discussionList = [];
        //   break;
        // case 'upvoted':
        //   this.UciService.fetchUpvoted().subscribe(response => {
        //     if (response) {
        //       // this.discussionList = _.uniqBy(response['posts'], 'tid');
        //       this.discussionList = response['posts'];
        //     } else {
        //       this.discussionList = [];
        //     }
        //   },
        //     // tslint:disable-next-line
        //     () => {
        //       this.discussionList = [];
        //     });

        //   break;
        // case 'downvoted':
        //   this.UciService.fetchDownvoted().subscribe(response => {
        //     if (response) {
        //       // this.discussionList = _.uniqBy(response['posts'], 'tid');
        //       this.discussionList = response['posts'];
        //     } else {
        //       this.discussionList = [];
        //     }
        //   },
        //     // tslint:disable-next-line
        //     () => {
        //       this.discussionList = [];
        //     });
        //   break;
        // default:
        //   // this.discussionList = _.uniqBy(this.data.latestPosts, 'tid');
        //   this.discussionList = this.data.latestPosts;
        //   break;
      }
    }
  }

  navigateToDiscussionDetails(discussionData) {
    console.log('discussionData', discussionData);
    this.router.navigate([`${this.configService.getRouterSlug()}${CONSTANTS.ROUTES.TOPIC}${_.get(discussionData, 'topic.slug')}`]);
  }

  logTelemetry(event) {
    this.telemetryUtils.logInteract(event, NSDiscussData.IPageName.MY_DISCUSSION);
  }

}

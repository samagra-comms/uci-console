import {UciData} from '../../models/uci.model';
import {TelemetryUtilsService} from '../../telemetry-utils.service';
import {UciService} from '../../services/uci.service';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import * as CONSTANTS from '../../common/constants.json';
/* tslint:disable */
import * as _ from 'lodash';
import {ConfigService} from '../../services/config.service';
import {IdiscussionConfig, IMenuOptions} from '../../models/uci-config.model';

/* tslint:enable */

@Component({
    selector: 'lib-side-panel',
    templateUrl: './side-panel.component.html',
    styleUrls: ['./side-panel.component.scss']
})
export class SidePanelComponent implements OnInit, OnDestroy {

    paramsSubscription: Subscription;

    userName: string;

    defaultPage = 'categories';

    data: IdiscussionConfig;
    hideSidePanel: boolean;
    menu: Array<IMenuOptions> = [];
    selectedTab: string;
    showSideMenu: Boolean = true;

    constructor(
        public router: Router,
        public uciService: UciService,
        public activatedRoute: ActivatedRoute,
        private telemetryUtils: TelemetryUtilsService,
        private configService: ConfigService
    ) {
    }

    ngOnInit() {
        // TODO: loader or spinner
        this.telemetryUtils.setContext([]);
        this.hideSidePanel = document.body.classList.contains('widget');
        this.telemetryUtils.logImpression(UciData.IPageName.HOME);
        this.data = this.configService.getConfig();
        const menuArr = _.get(this.data, 'menuOptions') && _.get(this.data, 'menuOptions').length > 0 ? this.data.menuOptions : CONSTANTS.MENUOPTIONS;
        for (let i = 0; i < menuArr.length; i++) {
            if (menuArr[i].enable) {
                this.menu.push(menuArr[i]);
            }
        }

    }

    isActive(selectedItem) {
        if (this.router.url.indexOf(`/${selectedItem}`) > -1 || this.selectedTab === selectedItem) {
            if (!this.selectedTab) {
                this.selectedTab = selectedItem;
            }
            return true;
        } else if (selectedItem === 'categories' && !this.selectedTab) {
            return true;
        }
        return false;
    }

    navigate(pageName: string, event?) {
        this.selectedTab = pageName;
        this.telemetryUtils.setContext([]);
        if (event) {
            this.telemetryUtils.logInteract(event, UciData.IPageName.HOME);
        }
        this.router.navigate([`uci-admin`]);
        this.closeNav();
    }

    ngOnDestroy() {
        if (this.paramsSubscription) {
            this.paramsSubscription.unsubscribe();
        }
    }

    showMenuButton() {
        this.showSideMenu = !this.showSideMenu;
    }

    closeNav() {
        this.showSideMenu = !this.showSideMenu;
    }

}

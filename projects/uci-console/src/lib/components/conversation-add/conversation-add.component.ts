import {ActivatedRoute, Router} from '@angular/router';
import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {GlobalService} from '../../services/global.service';
import {UciService} from '../../services/uci.service';
import moment from 'moment/moment';
import {debounceTime} from 'rxjs/operators';
import {ToasterService} from '../../services/toaster.service';

@Component({
    selector: 'lib-conversation-add',
    templateUrl: './conversation-add.component.html',
    styleUrls: ['./conversation-add.component.css']
})
export class ConversationAddComponent implements OnInit {
    @ViewChild('verifyAllModal') verifyAllModal;
    currentViewState = 'ADD_CONVERSATION';
    stepIndex = 1;
    botLogics = [];
    userSegments = [];
    column = '';
    sortDirection = '';
    reverse = false;
    collectionListModal = false;
    isLoaderShow = false;
    isModalLoaderShow = false;
    logicFormRequest = {};
    isCheckedTermCondition = false;
    conversationForm: FormGroup;
    logicForm: FormGroup;
    termsAndConditionModal = false;
    verifyAllItemsModal = false;
    conversationId;
    selectedLogicIndex;
    startMinDate = new Date(moment().subtract(1, 'd').format('YYYY-MM-DD'));
    endMinDate;
    Appropriateness = [
        {
            text: 'No Hate speech, Abuse, Violence, Profanity',
            checks: false
        },
        {
            text: 'No Sexual content, Nudity or Vulgarity',
            checks: false
        },
        {
            text: 'No Discrimination or Defamation',
            checks: false
        },
        {
            text: 'Is suitable for children',
            checks: false
        }
    ];
    contentDetails = [
        {
            text: 'Appropriate Title, Description',
            checks: false
        },
        {
            text: 'Correct Board, Grade, Subject, Medium',
            checks: false
        },
        {
            text: 'Appropriate tags such as Resource Type, Concepts',
            checks: false
        },
        {
            text: 'Relevant keywords',
            checks: false
        }
    ];
    usability = [
        {
            text: 'Content plays correctly',
            checks: false
        },
        {
            text: 'Can see the content clearly on Desktop and App',
            checks: false
        },
        {
            text: 'Audio (if any) is clear and easy to understand',
            checks: false
        },
        {
            text: 'No spelling mistakes in the text',
            checks: false
        },
        {
            text: 'Language is simple to understand',
            checks: false
        }
    ];
    allChecked: boolean;
    isSubmit: boolean;
    odkFileAlreadyExist: boolean = false;
    isStartingMessageExist = false;
    isStartingMessageAvailable = false;
    fileErrorStatus;
    user;

    constructor(
        private uciService: UciService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private fb: FormBuilder,
        private globalService: GlobalService,
        private toasterService: ToasterService
    ) {
        this.endMinDate = new Date(moment().add(1, 'days').format('YYYY-MM-DD'));
    }

    ngOnInit() {
        this.user = this.globalService.getUser();
        if (!this.user) {
            this.router.navigate(['uci-admin']);
            return;
        }
        this.conversationForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            purpose: ['', Validators.required],
            startingMessage: ['', Validators.required],
            startDate: [null, Validators.required],
            endDate: [null],
            status: ['Draft']
        });

        this.logicForm = this.fb.group({
            id: [null],
            name: ['', Validators.required],
            description: [''],
            formId: ['', Validators.required]
        });

        // Edit case
        this.conversationId = this.activatedRoute.snapshot.paramMap.get('id');
        if (this.conversationId) {
            this.getBotDetails();
        }

        // start date and end date value change
        this.conversationForm.get('startDate').valueChanges.subscribe(val => {
            if ((this.conversationForm.value.endDate && moment(this.conversationForm.value.endDate).isBefore(moment(val))) || !val) {
                this.conversationForm.get('endDate').patchValue(null);
            }
            const tempDate = moment(val).format('YYYY-MM-DD');
            this.endMinDate = new Date(tempDate);
        });

        this.conversationForm.get('startingMessage').valueChanges
            .pipe(debounceTime(1000))
            .subscribe(
                value => {
                    this.onStarringMessageChange();
                }
            );
    }

    userSegment() {
        this.currentViewState = 'SELECT_SEGMENT';
    }

    onUserSegmentCancel() {
        this.currentViewState = 'ADD_CONVERSATION';
    }

    onUserSegmentAddClick() {
        this.currentViewState = 'ADD_SEGMENT';
    }

    onUserSegmentAdd(segments) {
        this.userSegments = segments;
        this.currentViewState = 'ADD_CONVERSATION';
    }

    onUserSegmentCreate(segment) {
        this.userSegments.push(segment);
        this.currentViewState = 'ADD_CONVERSATION';
    }

    onUserSegmentDelete(index) {
        this.userSegments.splice(index, 1);
    }

    nextStep() {
        if (this.stepIndex === 1 && this.conversationForm.valid) {
            this.stepIndex = 2;
        }
    }

    backToStepOne() {
        if (this.stepIndex === 2) {
            this.stepIndex = 1;
        }
    }

    onAddCancel() {
        this.router.navigate(['uci-admin']);
    }

    updateAllChecked() {
        let allChecked = true;
        for (const val of this.Appropriateness) {
            if (!val.checks) {
                allChecked = false;
                break;
            }
        }
        if (allChecked) {
            for (const val of this.contentDetails) {
                if (!val.checks) {
                    allChecked = false;
                    break;
                }
            }
        }
        if (allChecked) {
            for (const val of this.usability) {
                if (!val.checks) {
                    allChecked = false;
                    break;
                }
            }
        }
        this.allChecked = allChecked;
    }

    onSubmit(isTriggerBot = false) {
        const reqObj = {
            ...this.conversationForm.value,
            users: [],
            logic: []
        };
        this.userSegments.forEach(userSegment => {
            reqObj.users.push(userSegment.id);
        });
        this.botLogics.forEach(logic => {
            reqObj.logic.push(logic.id);
        });
        if (reqObj.startDate) {
            reqObj.startDate = moment(reqObj.startDate).format('YYYY-MM-DD');
        }
        if (reqObj.endDate) {
            reqObj.endDate = moment(reqObj.endDate).format('YYYY-MM-DD');
        }

        this.isLoaderShow = true;

        if (this.conversationId) {
            this.uciService.botUpdate(this.conversationId, {data: reqObj}).subscribe(
                data => {
                    this.closeVerifyModal();
                    this.isLoaderShow = false;
                    this.router.navigate(['uci-admin/success'], {queryParams: {text: reqObj.startingMessage, botId: this.conversationId}});
                }, error => {
                    this.isLoaderShow = false;
                    this.verifyAllItemsModal = true;
                    this.allChecked = false;
                    if (error.result && error.result.error) {
                        this.toasterService.error(error.result.error);
                    }
                }
            );
        } else {
            this.uciService.botCreate({data: reqObj}).subscribe(
                (data: any) => {
                    if (isTriggerBot) {
                        this.startConversation(data.data);
                    } else {
                        this.closeVerifyModal();
                        this.isLoaderShow = false;
                        this.router.navigate(['uci-admin/success'], {queryParams: {text: reqObj.startingMessage, botId: data.data.id}});
                    }

                }, error => {
                    this.isLoaderShow = false;
                    this.verifyAllItemsModal = true;
                    this.allChecked = false;
                    if (error.result && error.result.error) {
                        this.toasterService.error(error.result.error);
                    }
                }
            );
        }
    }

    startConversation(bot) {
        this.uciService.startConversation(bot.id).subscribe(
            data => {
                this.isLoaderShow = false;
                this.closeVerifyModal();
                this.router.navigate(['uci-admin/success'], {
                    queryParams: {
                        text: this.conversationForm.value.startingMessage,
                        botId: bot.id
                    }
                });
            }, error => {
                this.verifyAllItemsModal = true;
                this.allChecked = false;
                this.isLoaderShow = false;
                if (error.result && error.result.error) {
                    this.toasterService.error(error.result.error);
                }
            }
        );
    }

    closeVerifyModal() {
        if (this.verifyAllModal) {
            this.verifyAllModal.deny('denied');
        }
        this.verifyAllItemsModal = false;
    }

    openModel() {
        this.logicFormRequest = {};
        this.collectionListModal = true;
        this.logicForm.reset();
        this.fileErrorStatus = null;
        this.isStartingMessageExist = false;
    }

    openTermAndConditionModel() {
        this.termsAndConditionModal = true;
    }

    openItemsVerifyModal(isSubmitBtn: boolean) {
        this.verifyAllItemsModal = true;
        this.allChecked = false;
        this.isSubmit = isSubmitBtn;
    }

    onLogicAdd() {
        const reqData = {
            ...this.logicForm.value,
            transformers: [
                {
                    id: 'bbf56981-b8c9-40e9-8067-468c2c753659',
                    meta: {
                        form: 'https://hosted.my.form.here.com',
                        formID: this.logicForm.value.formId
                    }
                }
            ],
            adapter: '44a9df72-3d7a-4ece-94c5-98cf26307324'
        };

        this.isModalLoaderShow = true;
        if (this.logicForm.get('id').value) {
            this.uciService.updateLogic(this.logicForm.get('id').value, {data: reqData}).subscribe(
                (data: any) => {
                    this.isModalLoaderShow = false;
                    const existingLogic = reqData;
                    delete existingLogic.id;
                    this.botLogics[this.selectedLogicIndex] = Object.assign(this.botLogics[this.selectedLogicIndex], existingLogic);
                }, error => {
                    this.isModalLoaderShow = false;
                }
            );
        } else {
            this.uciService.createLogic({data: reqData}).subscribe(
                (data: any) => {
                    this.isModalLoaderShow = false;
                    const existingLogic = reqData;
                    delete existingLogic.id;
                    this.botLogics.push({
                        id: data.data.id,
                        ...existingLogic,
                    });
                }, error => {
                    this.isModalLoaderShow = false;
                }
            );
        }

    }

    getEditLogicData(item, index) {
        if (item.id) {
            this.selectedLogicIndex = index;
            this.logicForm.patchValue(
                {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    formId: item.transformers[0].meta.formID
                }
            );
        }
    }

    onFileUpload(event) {
        if (!event.target.files.length) {
            return;
        }
        const file = event.target.files[0];
        const obj = {
            form: file
        };
        this.logicForm.patchValue({formId: ''});
        this.isModalLoaderShow = true;
        this.uciService.uploadFile(obj).subscribe((fileInfo: any) => {
                if (fileInfo.data) {
                    this.logicForm.patchValue({formId: fileInfo.data});
                }
                this.isModalLoaderShow = false;
                this.odkFileAlreadyExist = false;
            }, error => {
                this.isModalLoaderShow = false;
                this.odkFileAlreadyExist = true;
                this.fileErrorStatus = error.status;
                if (error.result && error.result.error) {
                    this.toasterService.error(error.result.error);
                }
            }
        );
    }

    onDelete(logic, index) {
        this.uciService.deleteLogic(logic.id).subscribe(
            file => {
                this.botLogics.splice(index, 1);
            }
        );
    }

    getBotDetails() {
        this.uciService.getBotDetails(this.conversationId).subscribe((val: any) => {
            if (val.data) {
                this.conversationForm.patchValue({
                    name: val.data.name,
                    description: val.data.description,
                    purpose: val.data.purpose,
                    startingMessage: val.data.startingMessage,
                    status: val.data.status,
                    startDate: val.data.startDate ? new Date(moment(val.data.startDate).format('YYYY-MM-DD')) : null,
                    endDate: val.data.endDate ? new Date(moment(val.data.endDate).format('YYYY-MM-DD')) : null
                });
                if (val.data.startDate) {
                    const minDate = moment().isBefore(moment(val.data.startDate)) ?  moment().subtract(1, 'd') : moment(val.data.startDate);
                    this.startMinDate = new Date(moment(minDate).format('YYYY-MM-DD'));
                }
                if (val.data.userSegments) {
                    this.userSegments = val.data.userSegments;
                }
                if (val.data.logic) {
                    this.botLogics = val.data.logic;
                }
            }
        });
    }

    allCheck(isAllCheck: boolean = false) {
        this.Appropriateness.forEach(val => {
            val.checks = isAllCheck;
        });
        this.contentDetails.forEach(val => {
            val.checks = isAllCheck;
        });
        this.usability.forEach(val => {
            val.checks = isAllCheck;
        });
        this.allChecked = true;
    }

    onStarringMessageChange() {
        this.uciService.getCheckStartingMessage({startingMessage: this.conversationForm.value.startingMessage}).subscribe(val => {
            if (val && val.data && val.data.id) {
                this.isStartingMessageExist = (this.conversationId !== val.data.id);
            }
        }, error => {
            this.isStartingMessageExist = false;
        });

    }

    manualDownload() {
        window.open(this.globalService.getBlobUrl().replace('/player', '') + 'UCI%20_%20ODK%20Instruction%20Manual.pdf', '_blank');
    }

    sampleODKDownload() {
        window.open(this.globalService.getBlobUrl().replace('/player', '') + 'Sample_ODK.xlsx', '_blank');
    }
}

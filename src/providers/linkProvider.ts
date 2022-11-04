'use strict';

import {
    DocumentLinkProvider as vsDocumentLinkProvider,
    TextDocument,
    ProviderResult,
    DocumentLink,
    workspace,
    Position,
    Range
} from "vscode";
import * as util from '../util';

export default class LinkProvider implements vsDocumentLinkProvider {
    public provideDocumentLinks(doc: TextDocument): ProviderResult<DocumentLink[]> {
        let documentLinks = [];
        let config = workspace.getConfiguration('comiru_goto');

        let linesCount = doc.lineCount <= config.maxLinesCount ? doc.lineCount : config.maxLinesCount;
        let index = 0;
        while (index < linesCount) {
            const line = doc.lineAt(index);
            const lineText = line.text;

            const viewResult = lineText.match(util.VIEW_REG);
            if (viewResult !== null) {
                for (let item of viewResult) {
                    const prefixStr = 'app->render(';
                    const pathText = item.substring(prefixStr.length).replace(/\"|\'/g, ''); // 去除单双引号和前缀
                    let file = util.getFilePath(pathText, doc, 'view');

                    if (file !== null) {
                        let start = new Position(line.lineNumber, lineText.indexOf(item) + prefixStr.length);
                        let end = start.translate(0, pathText.length);
                        let documentLink = new DocumentLink(new Range(start, end), file);
                        documentLinks.push(documentLink);
                    };
                }
            }

            const htmlResult = lineText.match(util.HTML_REG);
            if (htmlResult !== null) {
                for (let item of htmlResult) {
                    let strExt = '';
                    let type = '';
                    if (item.includes('.html')) {
                        strExt = '.html';
                        type = 'view'; 
                    } else if (item.includes('.css')) {
                        strExt = '.css';
                        type = 'css';
                    } else if (item.includes('.js')) {
                        strExt = '.js';
                        type = 'js';
                    }
                    if (strExt !== '' && type !== '') {
                        const findIndex = item.indexOf(strExt);
                        const quotesType = item[findIndex + strExt.length]; // 引号类型
                        let pathText = item.substring(0, findIndex + strExt.length);
                        pathText = pathText.substring(pathText.lastIndexOf(quotesType) + 1);
                        if (pathText.startsWith('/')) {
                            pathText = pathText.substring(1);
                        }
                        let file = util.getFilePath(pathText, doc, type);
                        if (file !== null) {
                            let start = new Position(line.lineNumber, lineText.indexOf(pathText));
                            let end = start.translate(0, pathText.length);
                            let documentLink = new DocumentLink(new Range(start, end), file);
                            // if words has link，new link is invalid, so i use hover instead
                            // example vscode in html file built-in link will make this extension invalid
                            //  <script src="{{ asset('/js/test.js') }}"></script>
                            //  <link rel="stylesheet" href="{{ asset('/css/test.css') }}">
                            documentLinks.push(documentLink);
                        };
                    }
                }
            }

            const modelResult = lineText.match(util.MODEL_KEY_REG);
            if (modelResult !== null) {
                // 不符合规则的手动指定
                const modelMap: any = {
                    'posts': 'Post.php',
                    'tags': 'Tag.php',
                    'replies': 'Reply.php',
                    'bbs_teacher_post_votes': 'BBSTeacherPostVotes.php',
                    'bbs_teacher_reply_favors': 'BBSTeacherReplyFavors.php',
                    'g_reports': 'GroupReports.php',
                    'g_report_students': 'GroupReportStudents.php',
                    'g_report_textbooks': 'GroupReportTextbooks.php',
                    'g_report_attachments': 'GroupReportAttachments.php',
                    'g_report_comments': 'GroupReportComments.php',
                    'grouped_school_comas': 'OnlineSchoolPlan.php',
                    'online_plan_applications': 'OnlinePlanApplication.php',
                    'trial_enterprise_orders': 'TrialEnterpriseOrder.php',
                    'enterprises': 'Enterprise.php',
                    'company_school_accounting_configs': 'CompanySchoolAccountingConfig.php',
                };
                for (let item of modelResult) {
                    const prefixStr = "app['m.";
                    const pathText = item.substring(prefixStr.length).replace(/\"|\'/g, ''); // 去除单双引号和前缀

                    let filename = '';
                    if (modelMap[pathText]) {
                        filename = modelMap[pathText];
                    } else {
                        filename = pathText.split('_')
                            .map(item => item.slice(0, 1).toUpperCase() + item.slice(1))
                            .join('') + '.php'; // 蛇形改为驼峰格式
                    }
                   
                    let file = util.getFilePath(filename, doc, 'model');

                    if (file !== null) {
                        let start = new Position(line.lineNumber, lineText.indexOf(item) + prefixStr.length - 2);
                        let end = start.translate(0, pathText.length + 2);
                        let documentLink = new DocumentLink(new Range(start, end), file);
                        documentLinks.push(documentLink);
                    };
                }
            }

            const modelOrmResult = lineText.match(util.MODEL_ORM_KEY_REG);
            if (modelOrmResult !== null) {
                // 手动指定
                const modelMap: any = {
                    'teachers': 'ORM/Teacher.php',
                    'teacher_students': 'ORM/TeacherStudent.php',
                    'users': 'ORM/User.php',
                    'user_auths': 'ORM/UserAuth.php',
                    'user_types': 'ORM/UserType.php',
                    'student_groups': 'ORM/StudentGroup.php',
                    'student_veritrans': 'ORM/StudentVeritrans.php',
                    'teacher_applies': 'ORM/TeacherApply.php',
                    'seats': 'ORM/Seat.php',
                    'seat_students': 'ORM/SeatStudent.php',
                    'add_coma_details': 'ORM/AddComaDetail.php',
                };
                for (let item of modelOrmResult) {
                    const prefixStr = "app['orm.";
                    const pathText = item.substring(prefixStr.length).replace(/\"|\'/g, ''); // 去除单双引号和前缀

                    let filename = '';
                    if (modelMap[pathText]) {
                        filename = modelMap[pathText];
                    } else {
                        continue;
                    }
                   
                    let file = util.getFilePath(filename, doc, 'model');

                    if (file !== null) {
                        let start = new Position(line.lineNumber, lineText.indexOf(item) + prefixStr.length - 4);
                        let end = start.translate(0, pathText.length + 4);
                        let documentLink = new DocumentLink(new Range(start, end), file);
                        documentLinks.push(documentLink);
                    };
                }
            }
            index++;
        }

        return documentLinks;
    }
}